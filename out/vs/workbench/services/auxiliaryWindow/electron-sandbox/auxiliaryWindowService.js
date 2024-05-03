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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService", "vs/platform/configuration/common/configuration", "vs/platform/native/common/native", "vs/platform/dialogs/common/dialogs", "vs/base/common/performance", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/host/browser/host", "vs/platform/window/electron-sandbox/window", "vs/base/browser/browser", "vs/base/browser/dom", "vs/workbench/services/environment/common/environmentService"], function (require, exports, nls_1, extensions_1, layoutService_1, auxiliaryWindowService_1, configuration_1, native_1, dialogs_1, performance_1, instantiation_1, telemetry_1, host_1, window_1, browser_1, dom_1, environmentService_1) {
    "use strict";
    var NativeAuxiliaryWindow_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeAuxiliaryWindowService = exports.NativeAuxiliaryWindow = void 0;
    let NativeAuxiliaryWindow = NativeAuxiliaryWindow_1 = class NativeAuxiliaryWindow extends auxiliaryWindowService_1.AuxiliaryWindow {
        constructor(window, container, stylesHaveLoaded, configurationService, nativeHostService, instantiationService, hostService, environmentService, dialogService) {
            super(window, container, stylesHaveLoaded, configurationService, hostService, environmentService);
            this.nativeHostService = nativeHostService;
            this.instantiationService = instantiationService;
            this.dialogService = dialogService;
            this.skipUnloadConfirmation = false;
        }
        async handleVetoBeforeClose(e, veto) {
            this.preventUnload(e);
            await this.dialogService.error(veto, (0, nls_1.localize)('backupErrorDetails', "Try saving or reverting the editors with unsaved changes first and then try again."));
        }
        async confirmBeforeClose(e) {
            if (this.skipUnloadConfirmation) {
                return;
            }
            this.preventUnload(e);
            const confirmed = await this.instantiationService.invokeFunction(accessor => NativeAuxiliaryWindow_1.confirmOnShutdown(accessor, 1 /* ShutdownReason.CLOSE */));
            if (confirmed) {
                this.skipUnloadConfirmation = true;
                this.nativeHostService.closeWindow({ targetWindowId: this.window.vscodeWindowId });
            }
        }
        preventUnload(e) {
            e.preventDefault();
            e.returnValue = true;
        }
    };
    exports.NativeAuxiliaryWindow = NativeAuxiliaryWindow;
    exports.NativeAuxiliaryWindow = NativeAuxiliaryWindow = NativeAuxiliaryWindow_1 = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, native_1.INativeHostService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, host_1.IHostService),
        __param(7, environmentService_1.IWorkbenchEnvironmentService),
        __param(8, dialogs_1.IDialogService)
    ], NativeAuxiliaryWindow);
    let NativeAuxiliaryWindowService = class NativeAuxiliaryWindowService extends auxiliaryWindowService_1.BrowserAuxiliaryWindowService {
        constructor(layoutService, configurationService, nativeHostService, dialogService, instantiationService, telemetryService, hostService, environmentService) {
            super(layoutService, dialogService, configurationService, telemetryService, hostService, environmentService);
            this.nativeHostService = nativeHostService;
            this.instantiationService = instantiationService;
        }
        async resolveWindowId(auxiliaryWindow) {
            (0, performance_1.mark)('code/auxiliaryWindow/willResolveWindowId');
            const windowId = await auxiliaryWindow.vscode.ipcRenderer.invoke('vscode:registerAuxiliaryWindow', this.nativeHostService.windowId);
            (0, performance_1.mark)('code/auxiliaryWindow/didResolveWindowId');
            return windowId;
        }
        createContainer(auxiliaryWindow, disposables, options) {
            // Zoom level (either explicitly provided or inherited from main window)
            let windowZoomLevel;
            if (typeof options?.zoomLevel === 'number') {
                windowZoomLevel = options.zoomLevel;
            }
            else {
                windowZoomLevel = (0, browser_1.getZoomLevel)((0, dom_1.getActiveWindow)());
            }
            (0, window_1.applyZoom)(windowZoomLevel, auxiliaryWindow);
            return super.createContainer(auxiliaryWindow, disposables);
        }
        createAuxiliaryWindow(targetWindow, container, stylesHaveLoaded) {
            return new NativeAuxiliaryWindow(targetWindow, container, stylesHaveLoaded, this.configurationService, this.nativeHostService, this.instantiationService, this.hostService, this.environmentService, this.dialogService);
        }
    };
    exports.NativeAuxiliaryWindowService = NativeAuxiliaryWindowService;
    exports.NativeAuxiliaryWindowService = NativeAuxiliaryWindowService = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, native_1.INativeHostService),
        __param(3, dialogs_1.IDialogService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, host_1.IHostService),
        __param(7, environmentService_1.IWorkbenchEnvironmentService)
    ], NativeAuxiliaryWindowService);
    (0, extensions_1.registerSingleton)(auxiliaryWindowService_1.IAuxiliaryWindowService, NativeAuxiliaryWindowService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV4aWxpYXJ5V2luZG93U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2F1eGlsaWFyeVdpbmRvdy9lbGVjdHJvbi1zYW5kYm94L2F1eGlsaWFyeVdpbmRvd1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTJCekYsSUFBTSxxQkFBcUIsNkJBQTNCLE1BQU0scUJBQXNCLFNBQVEsd0NBQWU7UUFJekQsWUFDQyxNQUFrQixFQUNsQixTQUFzQixFQUN0QixnQkFBeUIsRUFDRixvQkFBMkMsRUFDOUMsaUJBQXNELEVBQ25ELG9CQUE0RCxFQUNyRSxXQUF5QixFQUNULGtCQUFnRCxFQUM5RCxhQUE4QztZQUU5RCxLQUFLLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsRUFBRSxvQkFBb0IsRUFBRSxXQUFXLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQU43RCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ2xDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFHbEQsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBWHZELDJCQUFzQixHQUFHLEtBQUssQ0FBQztRQWN2QyxDQUFDO1FBRWtCLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFvQixFQUFFLElBQVk7WUFDaEYsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV0QixNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSxvRkFBb0YsQ0FBQyxDQUFDLENBQUM7UUFDNUosQ0FBQztRQUVrQixLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBb0I7WUFDL0QsSUFBSSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztnQkFDakMsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXRCLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLHVCQUFxQixDQUFDLGlCQUFpQixDQUFDLFFBQVEsK0JBQXVCLENBQUMsQ0FBQztZQUN0SixJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1lBQ3BGLENBQUM7UUFDRixDQUFDO1FBRWtCLGFBQWEsQ0FBQyxDQUFvQjtZQUNwRCxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbkIsQ0FBQyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDdEIsQ0FBQztLQUNELENBQUE7SUExQ1ksc0RBQXFCO29DQUFyQixxQkFBcUI7UUFRL0IsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDJCQUFrQixDQUFBO1FBQ2xCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxtQkFBWSxDQUFBO1FBQ1osV0FBQSxpREFBNEIsQ0FBQTtRQUM1QixXQUFBLHdCQUFjLENBQUE7T0FiSixxQkFBcUIsQ0EwQ2pDO0lBRU0sSUFBTSw0QkFBNEIsR0FBbEMsTUFBTSw0QkFBNkIsU0FBUSxzREFBNkI7UUFFOUUsWUFDMEIsYUFBc0MsRUFDeEMsb0JBQTJDLEVBQzdCLGlCQUFxQyxFQUMxRCxhQUE2QixFQUNMLG9CQUEyQyxFQUNoRSxnQkFBbUMsRUFDeEMsV0FBeUIsRUFDVCxrQkFBZ0Q7WUFFOUUsS0FBSyxDQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsb0JBQW9CLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFQeEUsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUVsQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1FBTXBGLENBQUM7UUFFa0IsS0FBSyxDQUFDLGVBQWUsQ0FBQyxlQUFpQztZQUN6RSxJQUFBLGtCQUFJLEVBQUMsMENBQTBDLENBQUMsQ0FBQztZQUNqRCxNQUFNLFFBQVEsR0FBRyxNQUFNLGVBQWUsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxnQ0FBZ0MsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEksSUFBQSxrQkFBSSxFQUFDLHlDQUF5QyxDQUFDLENBQUM7WUFFaEQsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztRQUVrQixlQUFlLENBQUMsZUFBaUMsRUFBRSxXQUE0QixFQUFFLE9BQXFDO1lBRXhJLHdFQUF3RTtZQUN4RSxJQUFJLGVBQXVCLENBQUM7WUFDNUIsSUFBSSxPQUFPLE9BQU8sRUFBRSxTQUFTLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzVDLGVBQWUsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDO1lBQ3JDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxlQUFlLEdBQUcsSUFBQSxzQkFBWSxFQUFDLElBQUEscUJBQWUsR0FBRSxDQUFDLENBQUM7WUFDbkQsQ0FBQztZQUVELElBQUEsa0JBQVMsRUFBQyxlQUFlLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFFNUMsT0FBTyxLQUFLLENBQUMsZUFBZSxDQUFDLGVBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBRWtCLHFCQUFxQixDQUFDLFlBQXdCLEVBQUUsU0FBc0IsRUFBRSxnQkFBeUI7WUFDbkgsT0FBTyxJQUFJLHFCQUFxQixDQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzFOLENBQUM7S0FDRCxDQUFBO0lBekNZLG9FQUE0QjsyQ0FBNUIsNEJBQTRCO1FBR3RDLFdBQUEsdUNBQXVCLENBQUE7UUFDdkIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDJCQUFrQixDQUFBO1FBQ2xCLFdBQUEsd0JBQWMsQ0FBQTtRQUNkLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLG1CQUFZLENBQUE7UUFDWixXQUFBLGlEQUE0QixDQUFBO09BVmxCLDRCQUE0QixDQXlDeEM7SUFFRCxJQUFBLDhCQUFpQixFQUFDLGdEQUF1QixFQUFFLDRCQUE0QixvQ0FBNEIsQ0FBQyJ9