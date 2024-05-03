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
define(["require", "exports", "vs/base/common/network", "vs/base/parts/ipc/node/ipc.cp", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryIpc", "vs/platform/telemetry/common/telemetryLogAppender", "vs/platform/telemetry/common/telemetryService"], function (require, exports, network_1, ipc_cp_1, configuration_1, environment_1, log_1, productService_1, telemetry_1, telemetryIpc_1, telemetryLogAppender_1, telemetryService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomEndpointTelemetryService = void 0;
    let CustomEndpointTelemetryService = class CustomEndpointTelemetryService {
        constructor(configurationService, telemetryService, logService, loggerService, environmentService, productService) {
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.loggerService = loggerService;
            this.environmentService = environmentService;
            this.productService = productService;
            this.customTelemetryServices = new Map();
        }
        getCustomTelemetryService(endpoint) {
            if (!this.customTelemetryServices.has(endpoint.id)) {
                const telemetryInfo = Object.create(null);
                telemetryInfo['common.vscodemachineid'] = this.telemetryService.machineId;
                telemetryInfo['common.vscodesessionid'] = this.telemetryService.sessionId;
                const args = [endpoint.id, JSON.stringify(telemetryInfo), endpoint.aiKey];
                const client = new ipc_cp_1.Client(network_1.FileAccess.asFileUri('bootstrap-fork').fsPath, {
                    serverName: 'Debug Telemetry',
                    timeout: 1000 * 60 * 5,
                    args,
                    env: {
                        ELECTRON_RUN_AS_NODE: 1,
                        VSCODE_PIPE_LOGGING: 'true',
                        VSCODE_AMD_ENTRYPOINT: 'vs/workbench/contrib/debug/node/telemetryApp'
                    }
                });
                const channel = client.getChannel('telemetryAppender');
                const appenders = [
                    new telemetryIpc_1.TelemetryAppenderClient(channel),
                    new telemetryLogAppender_1.TelemetryLogAppender(this.logService, this.loggerService, this.environmentService, this.productService, `[${endpoint.id}] `),
                ];
                this.customTelemetryServices.set(endpoint.id, new telemetryService_1.TelemetryService({
                    appenders,
                    sendErrorTelemetry: endpoint.sendErrorTelemetry
                }, this.configurationService, this.productService));
            }
            return this.customTelemetryServices.get(endpoint.id);
        }
        publicLog(telemetryEndpoint, eventName, data) {
            const customTelemetryService = this.getCustomTelemetryService(telemetryEndpoint);
            customTelemetryService.publicLog(eventName, data);
        }
        publicLogError(telemetryEndpoint, errorEventName, data) {
            const customTelemetryService = this.getCustomTelemetryService(telemetryEndpoint);
            customTelemetryService.publicLogError(errorEventName, data);
        }
    };
    exports.CustomEndpointTelemetryService = CustomEndpointTelemetryService;
    exports.CustomEndpointTelemetryService = CustomEndpointTelemetryService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, log_1.ILogService),
        __param(3, log_1.ILoggerService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, productService_1.IProductService)
    ], CustomEndpointTelemetryService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tRW5kcG9pbnRUZWxlbWV0cnlTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZWxlbWV0cnkvbm9kZS9jdXN0b21FbmRwb2ludFRlbGVtZXRyeVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0sOEJBQThCLEdBQXBDLE1BQU0sOEJBQThCO1FBSzFDLFlBQ3dCLG9CQUE0RCxFQUNoRSxnQkFBb0QsRUFDMUQsVUFBd0MsRUFDckMsYUFBOEMsRUFDekMsa0JBQXdELEVBQzVELGNBQWdEO1lBTHpCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDL0MscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUN6QyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3BCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN4Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzNDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQVIxRCw0QkFBdUIsR0FBRyxJQUFJLEdBQUcsRUFBNkIsQ0FBQztRQVNuRSxDQUFDO1FBRUcseUJBQXlCLENBQUMsUUFBNEI7WUFDN0QsSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BELE1BQU0sYUFBYSxHQUE4QixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNyRSxhQUFhLENBQUMsd0JBQXdCLENBQUMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDO2dCQUMxRSxhQUFhLENBQUMsd0JBQXdCLENBQUMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDO2dCQUMxRSxNQUFNLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzFFLE1BQU0sTUFBTSxHQUFHLElBQUksZUFBZSxDQUNqQyxvQkFBVSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLE1BQU0sRUFDN0M7b0JBQ0MsVUFBVSxFQUFFLGlCQUFpQjtvQkFDN0IsT0FBTyxFQUFFLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDdEIsSUFBSTtvQkFDSixHQUFHLEVBQUU7d0JBQ0osb0JBQW9CLEVBQUUsQ0FBQzt3QkFDdkIsbUJBQW1CLEVBQUUsTUFBTTt3QkFDM0IscUJBQXFCLEVBQUUsOENBQThDO3FCQUNyRTtpQkFDRCxDQUNELENBQUM7Z0JBRUYsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUN2RCxNQUFNLFNBQVMsR0FBRztvQkFDakIsSUFBSSxzQ0FBdUIsQ0FBQyxPQUFPLENBQUM7b0JBQ3BDLElBQUksMkNBQW9CLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksUUFBUSxDQUFDLEVBQUUsSUFBSSxDQUFDO2lCQUNoSSxDQUFDO2dCQUVGLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxJQUFJLG1DQUFnQixDQUFDO29CQUNsRSxTQUFTO29CQUNULGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxrQkFBa0I7aUJBQy9DLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBQ3JELENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBRSxDQUFDO1FBQ3ZELENBQUM7UUFFRCxTQUFTLENBQUMsaUJBQXFDLEVBQUUsU0FBaUIsRUFBRSxJQUFxQjtZQUN4RixNQUFNLHNCQUFzQixHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ2pGLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVELGNBQWMsQ0FBQyxpQkFBcUMsRUFBRSxjQUFzQixFQUFFLElBQXFCO1lBQ2xHLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDakYsc0JBQXNCLENBQUMsY0FBYyxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM3RCxDQUFDO0tBQ0QsQ0FBQTtJQTFEWSx3RUFBOEI7NkNBQTlCLDhCQUE4QjtRQU14QyxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSxvQkFBYyxDQUFBO1FBQ2QsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLGdDQUFlLENBQUE7T0FYTCw4QkFBOEIsQ0EwRDFDIn0=