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
define(["require", "exports", "vs/base/common/cancellation", "vs/platform/configuration/common/configuration", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/native/electron-main/nativeHostMainService", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/telemetry/common/telemetry", "vs/platform/update/common/update", "vs/platform/update/electron-main/abstractUpdateService"], function (require, exports, cancellation_1, configuration_1, environmentMainService_1, lifecycleMainService_1, log_1, nativeHostMainService_1, productService_1, request_1, telemetry_1, update_1, abstractUpdateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinuxUpdateService = void 0;
    let LinuxUpdateService = class LinuxUpdateService extends abstractUpdateService_1.AbstractUpdateService {
        constructor(lifecycleMainService, configurationService, telemetryService, environmentMainService, requestService, logService, nativeHostMainService, productService) {
            super(lifecycleMainService, configurationService, environmentMainService, requestService, logService, productService);
            this.telemetryService = telemetryService;
            this.nativeHostMainService = nativeHostMainService;
        }
        buildUpdateFeedUrl(quality) {
            return (0, abstractUpdateService_1.createUpdateURL)(`linux-${process.arch}`, quality, this.productService);
        }
        doCheckForUpdates(context) {
            if (!this.url) {
                return;
            }
            this.setState(update_1.State.CheckingForUpdates(context));
            this.requestService.request({ url: this.url }, cancellation_1.CancellationToken.None)
                .then(request_1.asJson)
                .then(update => {
                if (!update || !update.url || !update.version || !update.productVersion) {
                    this.telemetryService.publicLog2('update:notAvailable', { explicit: !!context });
                    this.setState(update_1.State.Idle(1 /* UpdateType.Archive */));
                }
                else {
                    this.setState(update_1.State.AvailableForDownload(update));
                }
            })
                .then(undefined, err => {
                this.logService.error(err);
                // only show message when explicitly checking for updates
                const message = !!context ? (err.message || err) : undefined;
                this.setState(update_1.State.Idle(1 /* UpdateType.Archive */, message));
            });
        }
        async doDownloadUpdate(state) {
            // Use the download URL if available as we don't currently detect the package type that was
            // installed and the website download page is more useful than the tarball generally.
            if (this.productService.downloadUrl && this.productService.downloadUrl.length > 0) {
                this.nativeHostMainService.openExternal(undefined, this.productService.downloadUrl);
            }
            else if (state.update.url) {
                this.nativeHostMainService.openExternal(undefined, state.update.url);
            }
            this.setState(update_1.State.Idle(1 /* UpdateType.Archive */));
        }
    };
    exports.LinuxUpdateService = LinuxUpdateService;
    exports.LinuxUpdateService = LinuxUpdateService = __decorate([
        __param(0, lifecycleMainService_1.ILifecycleMainService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, environmentMainService_1.IEnvironmentMainService),
        __param(4, request_1.IRequestService),
        __param(5, log_1.ILogService),
        __param(6, nativeHostMainService_1.INativeHostMainService),
        __param(7, productService_1.IProductService)
    ], LinuxUpdateService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlU2VydmljZS5saW51eC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXBkYXRlL2VsZWN0cm9uLW1haW4vdXBkYXRlU2VydmljZS5saW51eC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSw2Q0FBcUI7UUFFNUQsWUFDd0Isb0JBQTJDLEVBQzNDLG9CQUEyQyxFQUM5QixnQkFBbUMsRUFDOUMsc0JBQStDLEVBQ3ZELGNBQStCLEVBQ25DLFVBQXVCLEVBQ0sscUJBQTZDLEVBQ3JFLGNBQStCO1lBRWhELEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxzQkFBc0IsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBUGxGLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFJOUIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtRQUl2RixDQUFDO1FBRVMsa0JBQWtCLENBQUMsT0FBZTtZQUMzQyxPQUFPLElBQUEsdUNBQWUsRUFBQyxTQUFTLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQy9FLENBQUM7UUFFUyxpQkFBaUIsQ0FBQyxPQUFZO1lBQ3ZDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ2YsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQUssQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUM7aUJBQ3BFLElBQUksQ0FBaUIsZ0JBQU0sQ0FBQztpQkFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNkLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDekUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBMEQscUJBQXFCLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7b0JBRTFJLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBSyxDQUFDLElBQUksNEJBQW9CLENBQUMsQ0FBQztnQkFDL0MsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBSyxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELENBQUM7WUFDRixDQUFDLENBQUM7aUJBQ0QsSUFBSSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsRUFBRTtnQkFDdEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzNCLHlEQUF5RDtnQkFDekQsTUFBTSxPQUFPLEdBQXVCLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUNqRixJQUFJLENBQUMsUUFBUSxDQUFDLGNBQUssQ0FBQyxJQUFJLDZCQUFxQixPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3hELENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVrQixLQUFLLENBQUMsZ0JBQWdCLENBQUMsS0FBMkI7WUFDcEUsMkZBQTJGO1lBQzNGLHFGQUFxRjtZQUNyRixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDbkYsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNyRixDQUFDO2lCQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0RSxDQUFDO1lBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFLLENBQUMsSUFBSSw0QkFBb0IsQ0FBQyxDQUFDO1FBQy9DLENBQUM7S0FDRCxDQUFBO0lBdkRZLGdEQUFrQjtpQ0FBbEIsa0JBQWtCO1FBRzVCLFdBQUEsNENBQXFCLENBQUE7UUFDckIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsZ0RBQXVCLENBQUE7UUFDdkIsV0FBQSx5QkFBZSxDQUFBO1FBQ2YsV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSw4Q0FBc0IsQ0FBQTtRQUN0QixXQUFBLGdDQUFlLENBQUE7T0FWTCxrQkFBa0IsQ0F1RDlCIn0=