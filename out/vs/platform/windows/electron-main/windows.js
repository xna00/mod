/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/base/common/platform", "vs/platform/instantiation/common/instantiation", "vs/platform/window/electron-main/window", "vs/platform/window/common/window", "vs/platform/theme/electron-main/themeMainService", "vs/platform/product/common/productService", "vs/platform/configuration/common/configuration", "vs/platform/environment/electron-main/environmentMainService", "vs/base/common/path", "vs/base/common/color"], function (require, exports, electron_1, platform_1, instantiation_1, window_1, window_2, themeMainService_1, productService_1, configuration_1, environmentMainService_1, path_1, color_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowStateValidator = exports.OpenContext = exports.IWindowsMainService = void 0;
    exports.defaultBrowserWindowOptions = defaultBrowserWindowOptions;
    exports.getLastFocused = getLastFocused;
    exports.IWindowsMainService = (0, instantiation_1.createDecorator)('windowsMainService');
    var OpenContext;
    (function (OpenContext) {
        // opening when running from the command line
        OpenContext[OpenContext["CLI"] = 0] = "CLI";
        // macOS only: opening from the dock (also when opening files to a running instance from desktop)
        OpenContext[OpenContext["DOCK"] = 1] = "DOCK";
        // opening from the main application window
        OpenContext[OpenContext["MENU"] = 2] = "MENU";
        // opening from a file or folder dialog
        OpenContext[OpenContext["DIALOG"] = 3] = "DIALOG";
        // opening from the OS's UI
        OpenContext[OpenContext["DESKTOP"] = 4] = "DESKTOP";
        // opening through the API
        OpenContext[OpenContext["API"] = 5] = "API";
    })(OpenContext || (exports.OpenContext = OpenContext = {}));
    function defaultBrowserWindowOptions(accessor, windowState, overrides) {
        const themeMainService = accessor.get(themeMainService_1.IThemeMainService);
        const productService = accessor.get(productService_1.IProductService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const environmentMainService = accessor.get(environmentMainService_1.IEnvironmentMainService);
        const windowSettings = configurationService.getValue('window');
        const options = {
            backgroundColor: themeMainService.getBackgroundColor(),
            minWidth: window_2.WindowMinimumSize.WIDTH,
            minHeight: window_2.WindowMinimumSize.HEIGHT,
            title: productService.nameLong,
            ...overrides,
            x: windowState.x,
            y: windowState.y,
            width: windowState.width,
            height: windowState.height,
            webPreferences: {
                enableWebSQL: false,
                spellcheck: false,
                zoomFactor: (0, window_2.zoomLevelToZoomFactor)(windowState.zoomLevel ?? windowSettings?.zoomLevel),
                autoplayPolicy: 'user-gesture-required',
                // Enable experimental css highlight api https://chromestatus.com/feature/5436441440026624
                // Refs https://github.com/microsoft/vscode/issues/140098
                enableBlinkFeatures: 'HighlightAPI',
                ...overrides?.webPreferences,
                sandbox: true
            },
            experimentalDarkMode: true
        };
        if (platform_1.isLinux) {
            options.icon = (0, path_1.join)(environmentMainService.appRoot, 'resources/linux/code.png'); // always on Linux
        }
        else if (platform_1.isWindows && !environmentMainService.isBuilt) {
            options.icon = (0, path_1.join)(environmentMainService.appRoot, 'resources/win32/code_150x150.png'); // only when running out of sources on Windows
        }
        if (platform_1.isMacintosh) {
            options.acceptFirstMouse = true; // enabled by default
            if (windowSettings?.clickThroughInactive === false) {
                options.acceptFirstMouse = false;
            }
        }
        if (platform_1.isMacintosh && !(0, window_2.useNativeFullScreen)(configurationService)) {
            options.fullscreenable = false; // enables simple fullscreen mode
        }
        const useNativeTabs = platform_1.isMacintosh && windowSettings?.nativeTabs === true;
        if (useNativeTabs) {
            options.tabbingIdentifier = productService.nameShort; // this opts in to sierra tabs
        }
        const hideNativeTitleBar = !(0, window_2.hasNativeTitlebar)(configurationService);
        if (hideNativeTitleBar) {
            options.titleBarStyle = 'hidden';
            if (!platform_1.isMacintosh) {
                options.frame = false;
            }
            if ((0, window_2.useWindowControlsOverlay)(configurationService)) {
                // This logic will not perfectly guess the right colors
                // to use on initialization, but prefer to keep things
                // simple as it is temporary and not noticeable
                const titleBarColor = themeMainService.getWindowSplash()?.colorInfo.titleBarBackground ?? themeMainService.getBackgroundColor();
                const symbolColor = color_1.Color.fromHex(titleBarColor).isDarker() ? '#FFFFFF' : '#000000';
                options.titleBarOverlay = {
                    height: 29, // the smallest size of the title bar on windows accounting for the border on windows 11
                    color: titleBarColor,
                    symbolColor
                };
            }
        }
        return options;
    }
    function getLastFocused(windows) {
        let lastFocusedWindow = undefined;
        let maxLastFocusTime = Number.MIN_VALUE;
        for (const window of windows) {
            if (window.lastFocusTime > maxLastFocusTime) {
                maxLastFocusTime = window.lastFocusTime;
                lastFocusedWindow = window;
            }
        }
        return lastFocusedWindow;
    }
    var WindowStateValidator;
    (function (WindowStateValidator) {
        function validateWindowState(logService, state, displays = electron_1.screen.getAllDisplays()) {
            logService.trace(`window#validateWindowState: validating window state on ${displays.length} display(s)`, state);
            if (typeof state.x !== 'number' ||
                typeof state.y !== 'number' ||
                typeof state.width !== 'number' ||
                typeof state.height !== 'number') {
                logService.trace('window#validateWindowState: unexpected type of state values');
                return undefined;
            }
            if (state.width <= 0 || state.height <= 0) {
                logService.trace('window#validateWindowState: unexpected negative values');
                return undefined;
            }
            // Single Monitor: be strict about x/y positioning
            // macOS & Linux: these OS seem to be pretty good in ensuring that a window is never outside of it's bounds.
            // Windows: it is possible to have a window with a size that makes it fall out of the window. our strategy
            //          is to try as much as possible to keep the window in the monitor bounds. we are not as strict as
            //          macOS and Linux and allow the window to exceed the monitor bounds as long as the window is still
            //          some pixels (128) visible on the screen for the user to drag it back.
            if (displays.length === 1) {
                const displayWorkingArea = getWorkingArea(displays[0]);
                logService.trace('window#validateWindowState: single monitor working area', displayWorkingArea);
                if (displayWorkingArea) {
                    function ensureStateInDisplayWorkingArea() {
                        if (!state || typeof state.x !== 'number' || typeof state.y !== 'number' || !displayWorkingArea) {
                            return;
                        }
                        if (state.x < displayWorkingArea.x) {
                            // prevent window from falling out of the screen to the left
                            state.x = displayWorkingArea.x;
                        }
                        if (state.y < displayWorkingArea.y) {
                            // prevent window from falling out of the screen to the top
                            state.y = displayWorkingArea.y;
                        }
                    }
                    // ensure state is not outside display working area (top, left)
                    ensureStateInDisplayWorkingArea();
                    if (state.width > displayWorkingArea.width) {
                        // prevent window from exceeding display bounds width
                        state.width = displayWorkingArea.width;
                    }
                    if (state.height > displayWorkingArea.height) {
                        // prevent window from exceeding display bounds height
                        state.height = displayWorkingArea.height;
                    }
                    if (state.x > (displayWorkingArea.x + displayWorkingArea.width - 128)) {
                        // prevent window from falling out of the screen to the right with
                        // 128px margin by positioning the window to the far right edge of
                        // the screen
                        state.x = displayWorkingArea.x + displayWorkingArea.width - state.width;
                    }
                    if (state.y > (displayWorkingArea.y + displayWorkingArea.height - 128)) {
                        // prevent window from falling out of the screen to the bottom with
                        // 128px margin by positioning the window to the far bottom edge of
                        // the screen
                        state.y = displayWorkingArea.y + displayWorkingArea.height - state.height;
                    }
                    // again ensure state is not outside display working area
                    // (it may have changed from the previous validation step)
                    ensureStateInDisplayWorkingArea();
                }
                return state;
            }
            // Multi Montior (fullscreen): try to find the previously used display
            if (state.display && state.mode === 3 /* WindowMode.Fullscreen */) {
                const display = displays.find(d => d.id === state.display);
                if (display && typeof display.bounds?.x === 'number' && typeof display.bounds?.y === 'number') {
                    logService.trace('window#validateWindowState: restoring fullscreen to previous display');
                    const defaults = (0, window_1.defaultWindowState)(3 /* WindowMode.Fullscreen */); // make sure we have good values when the user restores the window
                    defaults.x = display.bounds.x; // carefull to use displays x/y position so that the window ends up on the correct monitor
                    defaults.y = display.bounds.y;
                    return defaults;
                }
            }
            // Multi Monitor (non-fullscreen): ensure window is within display bounds
            let display;
            let displayWorkingArea;
            try {
                display = electron_1.screen.getDisplayMatching({ x: state.x, y: state.y, width: state.width, height: state.height });
                displayWorkingArea = getWorkingArea(display);
                logService.trace('window#validateWindowState: multi-monitor working area', displayWorkingArea);
            }
            catch (error) {
                // Electron has weird conditions under which it throws errors
                // e.g. https://github.com/microsoft/vscode/issues/100334 when
                // large numbers are passed in
                logService.error('window#validateWindowState: error finding display for window state', error);
            }
            if (display && // we have a display matching the desired bounds
                displayWorkingArea && // we have valid working area bounds
                state.x + state.width > displayWorkingArea.x && // prevent window from falling out of the screen to the left
                state.y + state.height > displayWorkingArea.y && // prevent window from falling out of the screen to the top
                state.x < displayWorkingArea.x + displayWorkingArea.width && // prevent window from falling out of the screen to the right
                state.y < displayWorkingArea.y + displayWorkingArea.height // prevent window from falling out of the screen to the bottom
            ) {
                return state;
            }
            logService.trace('window#validateWindowState: state is outside of the multi-monitor working area');
            return undefined;
        }
        WindowStateValidator.validateWindowState = validateWindowState;
        function getWorkingArea(display) {
            // Prefer the working area of the display to account for taskbars on the
            // desktop being positioned somewhere (https://github.com/microsoft/vscode/issues/50830).
            //
            // Linux X11 sessions sometimes report wrong display bounds, so we validate
            // the reported sizes are positive.
            if (display.workArea.width > 0 && display.workArea.height > 0) {
                return display.workArea;
            }
            if (display.bounds.width > 0 && display.bounds.height > 0) {
                return display.bounds;
            }
            return undefined;
        }
    })(WindowStateValidator || (exports.WindowStateValidator = WindowStateValidator = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vd2luZG93cy9lbGVjdHJvbi1tYWluL3dpbmRvd3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0hoRyxrRUFnRkM7SUFJRCx3Q0FZQztJQS9MWSxRQUFBLG1CQUFtQixHQUFHLElBQUEsK0JBQWUsRUFBc0Isb0JBQW9CLENBQUMsQ0FBQztJQXlDOUYsSUFBa0IsV0FtQmpCO0lBbkJELFdBQWtCLFdBQVc7UUFFNUIsNkNBQTZDO1FBQzdDLDJDQUFHLENBQUE7UUFFSCxpR0FBaUc7UUFDakcsNkNBQUksQ0FBQTtRQUVKLDJDQUEyQztRQUMzQyw2Q0FBSSxDQUFBO1FBRUosdUNBQXVDO1FBQ3ZDLGlEQUFNLENBQUE7UUFFTiwyQkFBMkI7UUFDM0IsbURBQU8sQ0FBQTtRQUVQLDBCQUEwQjtRQUMxQiwyQ0FBRyxDQUFBO0lBQ0osQ0FBQyxFQW5CaUIsV0FBVywyQkFBWCxXQUFXLFFBbUI1QjtJQW1DRCxTQUFnQiwyQkFBMkIsQ0FBQyxRQUEwQixFQUFFLFdBQXlCLEVBQUUsU0FBMkM7UUFDN0ksTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLG9DQUFpQixDQUFDLENBQUM7UUFDekQsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQ0FBZSxDQUFDLENBQUM7UUFDckQsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7UUFDakUsTUFBTSxzQkFBc0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLGdEQUF1QixDQUFDLENBQUM7UUFFckUsTUFBTSxjQUFjLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUE4QixRQUFRLENBQUMsQ0FBQztRQUU1RixNQUFNLE9B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