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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "electron", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/state/node/state", "vs/platform/windows/electron-main/windows", "vs/platform/window/electron-main/window", "vs/platform/workspace/common/workspace"], function (require, exports, electron_1, lifecycle_1, platform_1, resources_1, uri_1, configuration_1, lifecycleMainService_1, log_1, state_1, windows_1, window_1, workspace_1) {
    "use strict";
    var WindowsStateHandler_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowsStateHandler = void 0;
    exports.restoreWindowsState = restoreWindowsState;
    exports.getWindowsStateStoreData = getWindowsStateStoreData;
    let WindowsStateHandler = class WindowsStateHandler extends lifecycle_1.Disposable {
        static { WindowsStateHandler_1 = this; }
        static { this.windowsStateStorageKey = 'windowsState'; }
        get state() { return this._state; }
        constructor(windowsMainService, stateService, lifecycleMainService, logService, configurationService) {
            super();
            this.windowsMainService = windowsMainService;
            this.stateService = stateService;
            this.lifecycleMainService = lifecycleMainService;
            this.logService = logService;
            this.configurationService = configurationService;
            this._state = restoreWindowsState(this.stateService.getItem(WindowsStateHandler_1.windowsStateStorageKey));
            this.lastClosedState = undefined;
            this.shuttingDown = false;
            this.registerListeners();
        }
        registerListeners() {
            // When a window looses focus, save all windows state. This allows to
            // prevent loss of window-state data when OS is restarted without properly
            // shutting down the application (https://github.com/microsoft/vscode/issues/87171)
            electron_1.app.on('browser-window-blur', () => {
                if (!this.shuttingDown) {
                    this.saveWindowsState();
                }
            });
            // Handle various lifecycle events around windows
            this.lifecycleMainService.onBeforeCloseWindow(window => this.onBeforeCloseWindow(window));
            this.lifecycleMainService.onBeforeShutdown(() => this.onBeforeShutdown());
            this.windowsMainService.onDidChangeWindowsCount(e => {
                if (e.newCount - e.oldCount > 0) {
                    // clear last closed window state when a new window opens. this helps on macOS where
                    // otherwise closing the last window, opening a new window and then quitting would
                    // use the state of the previously closed window when restarting.
                    this.lastClosedState = undefined;
                }
            });
            // try to save state before destroy because close will not fire
            this.windowsMainService.onDidDestroyWindow(window => this.onBeforeCloseWindow(window));
        }
        // Note that onBeforeShutdown() and onBeforeCloseWindow() are fired in different order depending on the OS:
        // - macOS: since the app will not quit when closing the last window, you will always first get
        //          the onBeforeShutdown() event followed by N onBeforeCloseWindow() events for each window
        // - other: on other OS, closing the last window will quit the app so the order depends on the
        //          user interaction: closing the last window will first trigger onBeforeCloseWindow()
        //          and then onBeforeShutdown(). Using the quit action however will first issue onBeforeShutdown()
        //          and then onBeforeCloseWindow().
        //
        // Here is the behavior on different OS depending on action taken (Electron 1.7.x):
        //
        // Legend
        // -  quit(N): quit application with N windows opened
        // - close(1): close one window via the window close button
        // - closeAll: close all windows via the taskbar command
        // - onBeforeShutdown(N): number of windows reported in this event handler
        // - onBeforeCloseWindow(N, M): number of windows reported and quitRequested boolean in this event handler
        //
        // macOS
        // 	-     quit(1): onBeforeShutdown(1), onBeforeCloseWindow(1, true)
        // 	-     quit(2): onBeforeShutdown(2), onBeforeCloseWindow(2, true), onBeforeCloseWindow(2, true)
        // 	-     quit(0): onBeforeShutdown(0)
        // 	-    close(1): onBeforeCloseWindow(1, false)
        //
        // Windows
        // 	-     quit(1): onBeforeShutdown(1), onBeforeCloseWindow(1, true)
        // 	-     quit(2): onBeforeShutdown(2), onBeforeCloseWindow(2, true), onBeforeCloseWindow(2, true)
        // 	-    close(1): onBeforeCloseWindow(2, false)[not last window]
        // 	-    close(1): onBeforeCloseWindow(1, false), onBeforeShutdown(0)[last window]
        // 	- closeAll(2): onBeforeCloseWindow(2, false), onBeforeCloseWindow(2, false), onBeforeShutdown(0)
        //
        // Linux
        // 	-     quit(1): onBeforeShutdown(1), onBeforeCloseWindow(1, true)
        // 	-     quit(2): onBeforeShutdown(2), onBeforeCloseWindow(2, true), onBeforeCloseWindow(2, true)
        // 	-    close(1): onBeforeCloseWindow(2, false)[not last window]
        // 	-    close(1): onBeforeCloseWindow(1, false), onBeforeShutdown(0)[last window]
        // 	- closeAll(2): onBeforeCloseWindow(2, false), onBeforeCloseWindow(2, false), onBeforeShutdown(0)
        //
        onBeforeShutdown() {
            this.shuttingDown = true;
            this.saveWindowsState();
        }
        saveWindowsState() {
            // TODO@electron workaround for Electron not being able to restore
            // multiple (native) fullscreen windows on the same display at once
            // on macOS.
            // https://github.com/electron/electron/issues/34367
            const displaysWithFullScreenWindow = new Set();
            const currentWindowsState = {
                openedWindows: [],
                lastPluginDevelopmentHostWindow: this._state.lastPluginDevelopmentHostWindow,
                lastActiveWindow: this.lastClosedState
            };
            // 1.) Find a last active window (pick any other first window otherwise)
            if (!currentWindowsState.lastActiveWindow) {
                let activeWindow = this.windowsMainService.getLastActiveWindow();
                if (!activeWindow || activeWindow.isExtensionDevelopmentHost) {
                    activeWindow = this.windowsMainService.getWindows().find(window => !window.isExtensionDevelopmentHost);
                }
                if (activeWindow) {
                    currentWindowsState.lastActiveWindow = this.toWindowState(activeWindow);
                    if (currentWindowsState.lastActiveWindow.uiState.mode === 3 /* WindowMode.Fullscreen */) {
                        displaysWithFullScreenWindow.add(currentWindowsState.lastActiveWindow.uiState.display); // always allow fullscreen for active window
                    }
                }
            }
            // 2.) Find extension host window
            const extensionHostWindow = this.windowsMainService.getWindows().find(window => window.isExtensionDevelopmentHost && !window.isExtensionTestHost);
            if (extensionHostWindow) {
                currentWindowsState.lastPluginDevelopmentHostWindow = this.toWindowState(extensionHostWindow);
                if (currentWindowsState.lastPluginDevelopmentHostWindow.uiState.mode === 3 /* WindowMode.Fullscreen */) {
                    if (displaysWithFullScreenWindow.has(currentWindowsState.lastPluginDevelopmentHostWindow.uiState.display)) {
                        if (platform_1.isMacintosh && !extensionHostWindow.win?.isSimpleFullScreen()) {
                            currentWindowsState.lastPluginDevelopmentHostWindow.uiState.mode = 1 /* WindowMode.Normal */;
                        }
                    }
                    else {
                        displaysWithFullScreenWindow.add(currentWindowsState.lastPluginDevelopmentHostWindow.uiState.display);
                    }
                }
            }
            // 3.) All windows (except extension host) for N >= 2 to support `restoreWindows: all` or for auto update
            //
            // Careful here: asking a window for its window state after it has been closed returns bogus values (width: 0, height: 0)
            // so if we ever want to persist the UI state of the last closed window (window count === 1), it has
            // to come from the stored lastClosedWindowState on Win/Linux at least
            if (this.windowsMainService.getWindowCount() > 1) {
                currentWindowsState.openedWindows = this.windowsMainService.getWindows().filter(window => !window.isExtensionDevelopmentHost).map(window => {
                    const windowState = this.toWindowState(window);
                    if (windowState.uiState.mode === 3 /* WindowMode.Fullscreen */) {
                        if (displaysWithFullScreenWindow.has(windowState.uiState.display)) {
                            if (platform_1.isMacintosh && windowState.windowId !== currentWindowsState.lastActiveWindow?.windowId && !window.win?.isSimpleFullScreen()) {
                                windowState.uiState.mode = 1 /* WindowMode.Normal */;
                            }
                        }
                        else {
                            displaysWithFullScreenWindow.add(windowState.uiState.display);
                        }
                    }
                    return windowState;
                });
            }
            // Persist
            const state = getWindowsStateStoreData(currentWindowsState);
            this.stateService.setItem(WindowsStateHandler_1.windowsStateStorageKey, state);
            if (this.shuttingDown) {
                this.logService.trace('[WindowsStateHandler] onBeforeShutdown', state);
            }
        }
        // See note on #onBeforeShutdown() for details how these events are flowing
        onBeforeCloseWindow(window) {
            if (this.lifecycleMainService.quitRequested) {
                return; // during quit, many windows close in parallel so let it be handled in the before-quit handler
            }
            // On Window close, update our stored UI state of this window
            const state = this.toWindowState(window);
            if (window.isExtensionDevelopmentHost && !window.isExtensionTestHost) {
                this._state.lastPluginDevelopmentHostWindow = state; // do not let test run window state overwrite our extension development state
            }
            // Any non extension host window with same workspace or folder
            else if (!window.isExtensionDevelopmentHost && window.openedWorkspace) {
                this._state.openedWindows.forEach(openedWindow => {
                    const sameWorkspace = (0, workspace_1.isWorkspaceIdentifier)(window.openedWorkspace) && openedWindow.workspace?.id === window.openedWorkspace.id;
                    const sameFolder = (0, workspace_1.isSingleFolderWorkspaceIdentifier)(window.openedWorkspace) && openedWindow.folderUri && resources_1.extUriBiasedIgnorePathCase.isEqual(openedWindow.folderUri, window.openedWorkspace.uri);
                    if (sameWorkspace || sameFolder) {
                        openedWindow.uiState = state.uiState;
                    }
                });
            }
            // On Windows and Linux closing the last window will trigger quit. Since we are storing all UI state
            // before quitting, we need to remember the UI state of this window to be able to persist it.
            // On macOS we keep the last closed window state ready in case the user wants to quit right after or
            // wants to open another window, in which case we use this state over the persisted one.
            if (this.windowsMainService.getWindowCount() === 1) {
                this.lastClosedState = state;
            }
        }
        toWindowState(window) {
            return {
                windowId: window.id,
                workspace: (0, workspace_1.isWorkspaceIdentifier)(window.openedWorkspace) ? window.openedWorkspace : undefined,
                folderUri: (0, workspace_1.isSingleFolderWorkspaceIdentifier)(window.openedWorkspace) ? window.openedWorkspace.uri : undefined,
                backupPath: window.backupPath,
                remoteAuthority: window.remoteAuthority,
                uiState: window.serializeWindowState()
            };
        }
        getNewWindowState(configuration) {
            const state = this.doGetNewWindowState(configuration);
            const windowConfig = this.configurationService.getValue('window');
            // Fullscreen state gets special treatment
            if (state.mode === 3 /* WindowMode.Fullscreen */) {
                // Window state is not from a previous session: only allow fullscreen if we inherit it or user wants fullscreen
                let allowFullscreen;
                if (state.hasDefaultState) {
                    allowFullscreen = !!(windowConfig?.newWindowDimensions && ['fullscreen', 'inherit', 'offset'].indexOf(windowConfig.newWindowDimensions) >= 0);
                }
                // Window state is from a previous session: only allow fullscreen when we got updated or user wants to restore
                else {
                    allowFullscreen = !!(this.lifecycleMainService.wasRestarted || windowConfig?.restoreFullscreen);
                }
                if (!allowFullscreen) {
                    state.mode = 1 /* WindowMode.Normal */;
                }
            }
            return state;
        }
        doGetNewWindowState(configuration) {
            const lastActive = this.windowsMainService.getLastActiveWindow();
            // Restore state unless we are running extension tests
            if (!configuration.extensionTestsPath) {
                // extension development host Window - load from stored settings if any
                if (!!configuration.extensionDevelopmentPath && this.state.lastPluginDevelopmentHostWindow) {
                    return this.state.lastPluginDevelopmentHostWindow.uiState;
                }
                // Known Workspace - load from stored settings
                const workspace = configuration.workspace;
                if ((0, workspace_1.isWorkspaceIdentifier)(workspace)) {
                    const stateForWorkspace = this.state.openedWindows.filter(openedWindow => openedWindow.workspace && openedWindow.workspace.id === workspace.id).map(openedWindow => openedWindow.uiState);
                    if (stateForWorkspace.length) {
                        return stateForWorkspace[0];
                    }
                }
                // Known Folder - load from stored settings
                if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspace)) {
                    const stateForFolder = this.state.openedWindows.filter(openedWindow => openedWindow.folderUri && resources_1.extUriBiasedIgnorePathCase.isEqual(openedWindow.folderUri, workspace.uri)).map(openedWindow => openedWindow.uiState);
                    if (stateForFolder.length) {
                        return stateForFolder[0];
                    }
                }
                // Empty windows with backups
                else if (configuration.backupPath) {
                    const stateForEmptyWindow = this.state.openedWindows.filter(openedWindow => openedWindow.backupPath === configuration.backupPath).map(openedWindow => openedWindow.uiState);
                    if (stateForEmptyWindow.length) {
                        return stateForEmptyWindow[0];
                    }
                }
                // First Window
                const lastActiveState = this.lastClosedState || this.state.lastActiveWindow;
                if (!lastActive && lastActiveState) {
                    return lastActiveState.uiState;
                }
            }
            //
            // In any other case, we do not have any stored settings for the window state, so we come up with something smart
            //
            // We want the new window to open on the same display that the last active one is in
            let displayToUse;
            const displays = electron_1.screen.getAllDisplays();
            // Single Display
            if (displays.length === 1) {
                displayToUse = displays[0];
            }
            // Multi Display
            else {
                // on mac there is 1 menu per window so we need to use the monitor where the cursor currently is
                if (platform_1.isMacintosh) {
                    const cursorPoint = electron_1.screen.getCursorScreenPoint();
                    displayToUse = electron_1.screen.getDisplayNearestPoint(cursorPoint);
                }
                // if we have a last active window, use that display for the new window
                if (!displayToUse && lastActive) {
                    displayToUse = electron_1.screen.getDisplayMatching(lastActive.getBounds());
                }
                // fallback to primary display or first display
                if (!displayToUse) {
                    displayToUse = electron_1.screen.getPrimaryDisplay() || displays[0];
                }
            }
            // Compute x/y based on display bounds
            // Note: important to use Math.round() because Electron does not seem to be too happy about
            // display coordinates that are not absolute numbers.
            let state = (0, window_1.defaultWindowState)();
            state.x = Math.round(displayToUse.bounds.x + (displayToUse.bounds.width / 2) - (state.width / 2));
            state.y = Math.round(displayToUse.bounds.y + (displayToUse.bounds.height / 2) - (state.height / 2));
            // Check for newWindowDimensions setting and adjust accordingly
            const windowConfig = this.configurationService.getValue('window');
            let ensureNoOverlap = true;
            if (windowConfig?.newWindowDimensions) {
                if (windowConfig.newWindowDimensions === 'maximized') {
                    state.mode = 0 /* WindowMode.Maximized */;
                    ensureNoOverlap = false;
                }
                else if (windowConfig.newWindowDimensions === 'fullscreen') {
                    state.mode = 3 /* WindowMode.Fullscreen */;
                    ensureNoOverlap = false;
                }
                else if ((windowConfig.newWindowDimensions === 'inherit' || windowConfig.newWindowDimensions === 'offset') && lastActive) {
                    const lastActiveState = lastActive.serializeWindowState();
                    if (lastActiveState.mode === 3 /* WindowMode.Fullscreen */) {
                        state.mode = 3 /* WindowMode.Fullscreen */; // only take mode (fixes https://github.com/microsoft/vscode/issues/19331)
                    }
                    else {
                        state = {
                            ...lastActiveState,
                            zoomLevel: undefined // do not inherit zoom level
                        };
                    }
                    ensureNoOverlap = state.mode !== 3 /* WindowMode.Fullscreen */ && windowConfig.newWindowDimensions === 'offset';
                }
            }
            if (ensureNoOverlap) {
                state = this.ensureNoOverlap(state);
            }
            state.hasDefaultState = true; // flag as default state
            return state;
        }
        ensureNoOverlap(state) {
            if (this.windowsMainService.getWindows().length === 0) {
                return state;
            }
            state.x = typeof state.x === 'number' ? state.x : 0;
            state.y = typeof state.y === 'number' ? state.y : 0;
            const existingWindowBounds = this.windowsMainService.getWindows().map(window => window.getBounds());
            while (existingWindowBounds.some(bounds => bounds.x === state.x || bounds.y === state.y)) {
                state.x += 30;
                state.y += 30;
            }
            return state;
        }
    };
    exports.WindowsStateHandler = WindowsStateHandler;
    exports.WindowsStateHandler = WindowsStateHandler = WindowsStateHandler_1 = __decorate([
        __param(0, windows_1.IWindowsMainService),
        __param(1, state_1.IStateService),
        __param(2, lifecycleMainService_1.ILifecycleMainService),
        __param(3, log_1.ILogService),
        __param(4, configuration_1.IConfigurationService)
    ], WindowsStateHandler);
    function restoreWindowsState(data) {
        const result = { openedWindows: [] };
        const windowsState = data || { openedWindows: [] };
        if (windowsState.lastActiveWindow) {
            result.lastActiveWindow = restoreWindowState(windowsState.lastActiveWindow);
        }
        if (windowsState.lastPluginDevelopmentHostWindow) {
            result.lastPluginDevelopmentHostWindow = restoreWindowState(windowsState.lastPluginDevelopmentHostWindow);
        }
        if (Array.isArray(windowsState.openedWindows)) {
            result.openedWindows = windowsState.openedWindows.map(windowState => restoreWindowState(windowState));
        }
        return result;
    }
    function restoreWindowState(windowState) {
        const result = { uiState: windowState.uiState };
        if (windowState.backupPath) {
            result.backupPath = windowState.backupPath;
        }
        if (windowState.remoteAuthority) {
            result.remoteAuthority = windowState.remoteAuthority;
        }
        if (windowState.folder) {
            result.folderUri = uri_1.URI.parse(windowState.folder);
        }
        if (windowState.workspaceIdentifier) {
            result.workspace = { id: windowState.workspaceIdentifier.id, configPath: uri_1.URI.parse(windowState.workspaceIdentifier.configURIPath) };
        }
        return result;
    }
    function getWindowsStateStoreData(windowsState) {
        return {
            lastActiveWindow: windowsState.lastActiveWindow && serializeWindowState(windowsState.lastActiveWindow),
            lastPluginDevelopmentHostWindow: windowsState.lastPluginDevelopmentHostWindow && serializeWindowState(windowsState.lastPluginDevelopmentHostWindow),
            openedWindows: windowsState.openedWindows.map(ws => serializeWindowState(ws))
        };
    }
    function serializeWindowState(windowState) {
        return {
            workspaceIdentifier: windowState.workspace && { id: windowState.workspace.id, configURIPath: windowState.workspace.configPath.toString() },
            folder: windowState.folderUri && windowState.folderUri.toString(),
            backupPath: windowState.backupPath,
            remoteAuthority: windowState.remoteAuthority,
            uiState: windowState.uiState
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93c1N0YXRlSGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vd2luZG93cy9lbGVjdHJvbi1tYWluL3dpbmRvd3NTdGF0ZUhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXlhaEcsa0RBaUJDO0lBdUJELDREQU1DO0lBdGFNLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7O2lCQUUxQiwyQkFBc0IsR0FBRyxjQUFjLEFBQWpCLENBQWtCO1FBRWhFLElBQUksS0FBSyxLQUFLLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFPbkMsWUFDc0Isa0JBQXdELEVBQzlELFlBQTRDLEVBQ3BDLG9CQUE0RCxFQUN0RSxVQUF3QyxFQUM5QixvQkFBNEQ7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFOOEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUM3QyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUNuQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3JELGVBQVUsR0FBVixVQUFVLENBQWE7WUFDYix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBWG5FLFdBQU0sR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBMEIscUJBQW1CLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDO1lBRXRJLG9CQUFlLEdBQTZCLFNBQVMsQ0FBQztZQUV0RCxpQkFBWSxHQUFHLEtBQUssQ0FBQztZQVc1QixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8saUJBQWlCO1lBRXhCLHFFQUFxRTtZQUNyRSwwRUFBMEU7WUFDMUUsbUZBQW1GO1lBQ25GLGNBQUcsQ0FB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