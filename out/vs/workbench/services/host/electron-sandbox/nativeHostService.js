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
define(["require", "exports", "vs/base/common/event", "vs/workbench/services/host/browser/host", "vs/platform/native/common/native", "vs/platform/instantiation/common/extensions", "vs/platform/label/common/label", "vs/workbench/services/environment/common/environmentService", "vs/platform/window/common/window", "vs/base/common/lifecycle", "vs/platform/native/common/nativeHostService", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/ipc/common/mainProcessService", "vs/base/browser/dom", "vs/base/common/decorators", "vs/base/browser/window"], function (require, exports, event_1, host_1, native_1, extensions_1, label_1, environmentService_1, window_1, lifecycle_1, nativeHostService_1, environmentService_2, mainProcessService_1, dom_1, decorators_1, window_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WorkbenchNativeHostService = class WorkbenchNativeHostService extends nativeHostService_1.NativeHostService {
        constructor(environmentService, mainProcessService) {
            super(environmentService.window.id, mainProcessService);
        }
    };
    WorkbenchNativeHostService = __decorate([
        __param(0, environmentService_2.INativeWorkbenchEnvironmentService),
        __param(1, mainProcessService_1.IMainProcessService)
    ], WorkbenchNativeHostService);
    let WorkbenchHostService = class WorkbenchHostService extends lifecycle_1.Disposable {
        constructor(nativeHostService, labelService, environmentService) {
            super();
            this.nativeHostService = nativeHostService;
            this.labelService = labelService;
            this.environmentService = environmentService;
            //#region Focus
            this.onDidChangeFocus = event_1.Event.latch(event_1.Event.any(event_1.Event.map(event_1.Event.filter(this.nativeHostService.onDidFocusMainOrAuxiliaryWindow, id => (0, dom_1.hasWindow)(id), this._store), () => this.hasFocus, this._store), event_1.Event.map(event_1.Event.filter(this.nativeHostService.onDidBlurMainOrAuxiliaryWindow, id => (0, dom_1.hasWindow)(id), this._store), () => this.hasFocus, this._store), event_1.Event.map(this.onDidChangeActiveWindow, () => this.hasFocus, this._store)), undefined, this._store);
            this.onDidChangeFullScreen = event_1.Event.filter(this.nativeHostService.onDidChangeWindowFullScreen, e => (0, dom_1.hasWindow)(e.windowId), this._store);
        }
        get hasFocus() {
            return (0, dom_1.getActiveDocument)().hasFocus();
        }
        async hadLastFocus() {
            const activeWindowId = await this.nativeHostService.getActiveWindowId();
            if (typeof activeWindowId === 'undefined') {
                return false;
            }
            return activeWindowId === this.nativeHostService.windowId;
        }
        //#endregion
        //#region Window
        get onDidChangeActiveWindow() {
            const emitter = this._register(new event_1.Emitter());
            // Emit via native focus tracking
            this._register(event_1.Event.filter(this.nativeHostService.onDidFocusMainOrAuxiliaryWindow, id => (0, dom_1.hasWindow)(id), this._store)(id => emitter.fire(id)));
            this._register((0, dom_1.onDidRegisterWindow)(({ window, disposables }) => {
                // Emit via interval: immediately when opening an auxiliary window,
                // it is possible that document focus has not yet changed, so we
                // poll for a while to ensure we catch the event.
                disposables.add((0, dom_1.disposableWindowInterval)(window, () => {
                    const hasFocus = window.document.hasFocus();
                    if (hasFocus) {
                        emitter.fire(window.vscodeWindowId);
                    }
                    return hasFocus;
                }, 100, 20));
            }));
            return event_1.Event.latch(emitter.event, undefined, this._store);
        }
        openWindow(arg1, arg2) {
            if (Array.isArray(arg1)) {
                return this.doOpenWindow(arg1, arg2);
            }
            return this.doOpenEmptyWindow(arg1);
        }
        doOpenWindow(toOpen, options) {
            const remoteAuthority = this.environmentService.remoteAuthority;
            if (!!remoteAuthority) {
                toOpen.forEach(openable => openable.label = openable.label || this.getRecentLabel(openable));
                if (options?.remoteAuthority === undefined) {
                    // set the remoteAuthority of the window the request came from.
                    // It will be used when the input is neither file nor vscode-remote.
                    options = options ? { ...options, remoteAuthority } : { remoteAuthority };
                }
            }
            return this.nativeHostService.openWindow(toOpen, options);
        }
        getRecentLabel(openable) {
            if ((0, window_1.isFolderToOpen)(openable)) {
                return this.labelService.getWorkspaceLabel(openable.folderUri, { verbose: 2 /* Verbosity.LONG */ });
            }
            if ((0, window_1.isWorkspaceToOpen)(openable)) {
                return this.labelService.getWorkspaceLabel({ id: '', configPath: openable.workspaceUri }, { verbose: 2 /* Verbosity.LONG */ });
            }
            return this.labelService.getUriLabel(openable.fileUri);
        }
        doOpenEmptyWindow(options) {
            const remoteAuthority = this.environmentService.remoteAuthority;
            if (!!remoteAuthority && options?.remoteAuthority === undefined) {
                // set the remoteAuthority of the window the request came from
                options = options ? { ...options, remoteAuthority } : { remoteAuthority };
            }
            return this.nativeHostService.openWindow(options);
        }
        toggleFullScreen(targetWindow) {
            return this.nativeHostService.toggleFullScreen({ targetWindowId: (0, window_2.isAuxiliaryWindow)(targetWindow) ? targetWindow.vscodeWindowId : undefined });
        }
        async moveTop(targetWindow) {
            if ((0, dom_1.getWindowsCount)() <= 1) {
                return; // does not apply when only one window is opened
            }
            return this.nativeHostService.moveWindowTop((0, window_2.isAuxiliaryWindow)(targetWindow) ? { targetWindowId: targetWindow.vscodeWindowId } : undefined);
        }
        getCursorScreenPoint() {
            return this.nativeHostService.getCursorScreenPoint();
        }
        //#endregion
        //#region Lifecycle
        focus(targetWindow, options) {
            return this.nativeHostService.focusWindow({
                force: options?.force,
                targetWindowId: (0, dom_1.getWindowId)(targetWindow)
            });
        }
        restart() {
            return this.nativeHostService.relaunch();
        }
        reload(options) {
            return this.nativeHostService.reload(options);
        }
        close() {
            return this.nativeHostService.closeWindow();
        }
        async withExpectedShutdown(expectedShutdownTask) {
            return await expectedShutdownTask();
        }
    };
    __decorate([
        decorators_1.memoize
    ], WorkbenchHostService.prototype, "onDidChangeActiveWindow", null);
    WorkbenchHostService = __decorate([
        __param(0, native_1.INativeHostService),
        __param(1, label_1.ILabelService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService)
    ], WorkbenchHostService);
    (0, extensions_1.registerSingleton)(host_1.IHostService, WorkbenchHostService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(native_1.INativeHostService, WorkbenchNativeHostService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlSG9zdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9ob3N0L2VsZWN0cm9uLXNhbmRib3gvbmF0aXZlSG9zdFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFpQmhHLElBQU0sMEJBQTBCLEdBQWhDLE1BQU0sMEJBQTJCLFNBQVEscUNBQWlCO1FBRXpELFlBQ3FDLGtCQUFzRCxFQUNyRSxrQkFBdUM7WUFFNUQsS0FBSyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUN6RCxDQUFDO0tBQ0QsQ0FBQTtJQVJLLDBCQUEwQjtRQUc3QixXQUFBLHVEQUFrQyxDQUFBO1FBQ2xDLFdBQUEsd0NBQW1CLENBQUE7T0FKaEIsMEJBQTBCLENBUS9CO0lBRUQsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSxzQkFBVTtRQUk1QyxZQUNxQixpQkFBc0QsRUFDM0QsWUFBNEMsRUFDN0Isa0JBQWlFO1lBRS9GLEtBQUssRUFBRSxDQUFDO1lBSjZCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDMUMsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDWix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQThCO1lBS2hHLGVBQWU7WUFFTixxQkFBZ0IsR0FBRyxhQUFLLENBQUMsS0FBSyxDQUN0QyxhQUFLLENBQUMsR0FBRyxDQUNSLGFBQUssQ0FBQyxHQUFHLENBQUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsK0JBQStCLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFBLGVBQVMsRUFBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFD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