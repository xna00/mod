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
define(["require", "exports", "electron", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/parts/ipc/electron-main/ipcMain", "vs/platform/auxiliaryWindow/electron-main/auxiliaryWindow", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/window/electron-main/window", "vs/platform/windows/electron-main/windows"], function (require, exports, electron_1, event_1, lifecycle_1, network_1, ipcMain_1, auxiliaryWindow_1, instantiation_1, log_1, window_1, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuxiliaryWindowsMainService = void 0;
    let AuxiliaryWindowsMainService = class AuxiliaryWindowsMainService extends lifecycle_1.Disposable {
        constructor(instantiationService, logService) {
            super();
            this.instantiationService = instantiationService;
            this.logService = logService;
            this._onDidMaximizeWindow = this._register(new event_1.Emitter());
            this.onDidMaximizeWindow = this._onDidMaximizeWindow.event;
            this._onDidUnmaximizeWindow = this._register(new event_1.Emitter());
            this.onDidUnmaximizeWindow = this._onDidUnmaximizeWindow.event;
            this._onDidChangeFullScreen = this._register(new event_1.Emitter());
            this.onDidChangeFullScreen = this._onDidChangeFullScreen.event;
            this._onDidTriggerSystemContextMenu = this._register(new event_1.Emitter());
            this.onDidTriggerSystemContextMenu = this._onDidTriggerSystemContextMenu.event;
            this.windows = new Map();
            this.registerListeners();
        }
        registerListeners() {
            // We have to ensure that an auxiliary window gets to know its
            // containing `BrowserWindow` so that it can apply listeners to it
            // Unfortunately we cannot rely on static `BrowserWindow` methods
            // because we might call the methods too early before the window
            // is created.
            electron_1.app.on('browser-window-created', (_event, browserWindow) => {
                const auxiliaryWindow = this.getWindowById(browserWindow.id);
                if (auxiliaryWindow) {
                    this.logService.trace('[aux window] app.on("browser-window-created"): Trying to claim auxiliary window');
                    auxiliaryWindow.tryClaimWindow();
                }
            });
            ipcMain_1.validatedIpcMain.handle('vscode:registerAuxiliaryWindow', async (event, mainWindowId) => {
                const auxiliaryWindow = this.getWindowById(event.sender.id);
                if (auxiliaryWindow) {
                    this.logService.trace('[aux window] vscode:registerAuxiliaryWindow: Registering auxiliary window to main window');
                    auxiliaryWindow.parentId = mainWindowId;
                }
                return event.sender.id;
            });
        }
        createWindow(details) {
            return this.instantiationService.invokeFunction(windows_1.defaultBrowserWindowOptions, this.validateWindowState(details), {
                webPreferences: {
                    preload: network_1.FileAccess.asFileUri('vs/base/parts/sandbox/electron-sandbox/preload-aux.js').fsPath
                }
            });
        }
        validateWindowState(details) {
            const windowState = {};
            const features = details.features.split(','); // for example: popup=yes,left=270,top=14.5,width=800,height=600
            for (const feature of features) {
                const [key, value] = feature.split('=');
                switch (key) {
                    case 'width':
                        windowState.width = parseInt(value, 10);
                        break;
                    case 'height':
                        windowState.height = parseInt(value, 10);
                        break;
                    case 'left':
                        windowState.x = parseInt(value, 10);
                        break;
                    case 'top':
                        windowState.y = parseInt(value, 10);
                        break;
                }
            }
            const state = windows_1.WindowStateValidator.validateWindowState(this.logService, windowState) ?? (0, window_1.defaultAuxWindowState)();
            this.logService.trace('[aux window] using window state', state);
            return state;
        }
        registerWindow(webContents) {
            const disposables = new lifecycle_1.DisposableStore();
            const auxiliaryWindow = this.instantiationService.createInstance(auxiliaryWindow_1.AuxiliaryWindow, webContents);
            this.windows.set(auxiliaryWindow.id, auxiliaryWindow);
            disposables.add((0, lifecycle_1.toDisposable)(() => this.windows.delete(auxiliaryWindow.id)));
            disposables.add(auxiliaryWindow.onDidMaximize(() => this._onDidMaximizeWindow.fire(auxiliaryWindow)));
            disposables.add(auxiliaryWindow.onDidUnmaximize(() => this._onDidUnmaximizeWindow.fire(auxiliaryWindow)));
            disposables.add(auxiliaryWindow.onDidEnterFullScreen(() => this._onDidChangeFullScreen.fire({ window: auxiliaryWindow, fullscreen: true })));
            disposables.add(auxiliaryWindow.onDidLeaveFullScreen(() => this._onDidChangeFullScreen.fire({ window: auxiliaryWindow, fullscreen: false })));
            disposables.add(auxiliaryWindow.onDidTriggerSystemContextMenu(({ x, y }) => this._onDidTriggerSystemContextMenu.fire({ window: auxiliaryWindow, x, y })));
            event_1.Event.once(auxiliaryWindow.onDidClose)(() => disposables.dispose());
        }
        getWindowById(windowId) {
            return this.windows.get(windowId);
        }
        getFocusedWindow() {
            const window = electron_1.BrowserWindow.getFocusedWindow();
            if (window) {
                return this.getWindowById(window.id);
            }
            return undefined;
        }
        getLastActiveWindow() {
            return (0, windows_1.getLastFocused)(Array.from(this.windows.values()));
        }
        getWindows() {
            return Array.from(this.windows.values());
        }
    };
    exports.AuxiliaryWindowsMainService = AuxiliaryWindowsMainService;
    exports.AuxiliaryWindowsMainService = AuxiliaryWindowsMainService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, log_1.ILogService)
    ], AuxiliaryWindowsMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV4aWxpYXJ5V2luZG93c01haW5TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9hdXhpbGlhcnlXaW5kb3cvZWxlY3Ryb24tbWFpbi9hdXhpbGlhcnlXaW5kb3dzTWFpblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY3pGLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsc0JBQVU7UUFrQjFELFlBQ3dCLG9CQUE0RCxFQUN0RSxVQUF3QztZQUVyRCxLQUFLLEVBQUUsQ0FBQztZQUhnQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3JELGVBQVUsR0FBVixVQUFVLENBQWE7WUFoQnJDLHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQW9CLENBQUMsQ0FBQztZQUMvRSx3QkFBbUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1lBRTlDLDJCQUFzQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQW9CLENBQUMsQ0FBQztZQUNqRiwwQkFBcUIsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDO1lBRWxELDJCQUFzQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXFELENBQUMsQ0FBQztZQUNsSCwwQkFBcUIsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDO1lBRWxELG1DQUE4QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXNELENBQUMsQ0FBQztZQUMzSCxrQ0FBNkIsR0FBRyxJQUFJLENBQUMsOEJBQThCLENBQUMsS0FBSyxDQUFDO1lBRWxFLFlBQU8sR0FBRyxJQUFJLEdBQUcsRUFBMkIsQ0FBQztZQVE3RCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8saUJBQWlCO1lBRXhCLDhEQUE4RDtZQUM5RCxrRUFBa0U7WUFDbEUsaUVBQWlFO1lBQ2pFLGdFQUFnRTtZQUNoRSxjQUFjO1lBRWQsY0FBRyxDQUFDLEVBQUUsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxhQUFhLEVBQUUsRUFBRTtnQkFDMUQsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzdELElBQUksZUFBZSxFQUFFLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLGlGQUFpRixDQUFDLENBQUM7b0JBRXpHLGVBQWUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDbEMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsMEJBQWdCLENBQUMsTUFBTSxDQUFDLGdDQUFnQyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBb0IsRUFBRSxFQUFFO2dCQUMvRixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzVELElBQUksZUFBZSxFQUFFLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLDBGQUEwRixDQUFDLENBQUM7b0JBRWxILGVBQWUsQ0FBQyxRQUFRLEdBQUcsWUFBWSxDQUFDO2dCQUN6QyxDQUFDO2dCQUVELE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDeEIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsWUFBWSxDQUFDLE9BQXVCO1lBQ25DLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxxQ0FBMkIsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQy9HLGNBQWMsRUFBRTtvQkFDZixPQUFPLEVBQUUsb0JBQVUsQ0FBQyxTQUFTLENBQUMsdURBQXVELENBQUMsQ0FBQyxNQUFNO2lCQUM3RjthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxtQkFBbUIsQ0FBQyxPQUF1QjtZQUNsRCxNQUFNLFdBQVcsR0FBaUIsRUFBRSxDQUFDO1lBRXJDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsZ0VBQWdFO1lBQzlHLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDeEMsUUFBUSxHQUFHLEVBQUUsQ0FBQztvQkFDYixLQUFLLE9BQU87d0JBQ1gsV0FBVyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUN4QyxNQUFNO29CQUNQLEtBQUssUUFBUTt3QkFDWixXQUFXLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQ3pDLE1BQU07b0JBQ1AsS0FBSyxNQUFNO3dCQUNWLFdBQVcsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQzt3QkFDcEMsTUFBTTtvQkFDUCxLQUFLLEtBQUs7d0JBQ1QsV0FBVyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUNwQyxNQUFNO2dCQUNSLENBQUM7WUFDRixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsOEJBQW9CLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsSUFBSSxJQUFBLDhCQUFxQixHQUFFLENBQUM7WUFFaEgsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFaEUsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsY0FBYyxDQUFDLFdBQXdCO1lBQ3RDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRTFDLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsaUNBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUUvRixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsRUFBRSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQ3RELFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFN0UsV0FBVyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RHLFdBQVcsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRyxXQUFXLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0ksV0FBVyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlJLFdBQVcsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLDZCQUE2QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUxSixhQUFLLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNyRSxDQUFDO1FBRUQsYUFBYSxDQUFDLFFBQWdCO1lBQzdCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVELGdCQUFnQjtZQUNmLE1BQU0sTUFBTSxHQUFHLHdCQUFhLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUNoRCxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdEMsQ0FBQztZQUVELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxtQkFBbUI7WUFDbEIsT0FBTyxJQUFBLHdCQUFjLEVBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQsVUFBVTtZQUNULE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDMUMsQ0FBQztLQUNELENBQUE7SUFsSVksa0VBQTJCOzBDQUEzQiwyQkFBMkI7UUFtQnJDLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxpQkFBVyxDQUFBO09BcEJELDJCQUEyQixDQWtJdkMifQ==