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
define(["require", "exports", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/product/common/productService", "vs/platform/ipc/electron-sandbox/services", "vs/platform/telemetry/common/telemetryIpc", "vs/platform/storage/common/storage", "vs/workbench/services/telemetry/common/workbenchCommonProperties", "vs/platform/telemetry/common/telemetryService", "vs/platform/instantiation/common/extensions", "vs/base/parts/sandbox/electron-sandbox/globals"], function (require, exports, telemetry_1, telemetryUtils_1, configuration_1, lifecycle_1, environmentService_1, productService_1, services_1, telemetryIpc_1, storage_1, workbenchCommonProperties_1, telemetryService_1, extensions_1, globals_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryService = void 0;
    let TelemetryService = class TelemetryService extends lifecycle_1.Disposable {
        get sessionId() { return this.impl.sessionId; }
        get machineId() { return this.impl.machineId; }
        get sqmId() { return this.impl.sqmId; }
        get firstSessionDate() { return this.impl.firstSessionDate; }
        get msftInternal() { return this.impl.msftInternal; }
        constructor(environmentService, productService, sharedProcessService, storageService, configurationService) {
            super();
            if ((0, telemetryUtils_1.supportsTelemetry)(productService, environmentService)) {
                const isInternal = (0, telemetryUtils_1.isInternalTelemetry)(productService, configurationService);
                const channel = sharedProcessService.getChannel('telemetryAppender');
                const config = {
                    appenders: [new telemetryIpc_1.TelemetryAppenderClient(channel)],
                    commonProperties: (0, workbenchCommonProperties_1.resolveWorkbenchCommonProperties)(storageService, environmentService.os.release, environmentService.os.hostname, productService.commit, productService.version, environmentService.machineId, environmentService.sqmId, isInternal, globals_1.process, environmentService.remoteAuthority),
                    piiPaths: (0, telemetryUtils_1.getPiiPathsFromEnvironment)(environmentService),
                    sendErrorTelemetry: true
                };
                this.impl = this._register(new telemetryService_1.TelemetryService(config, configurationService, productService));
            }
            else {
                this.impl = telemetryUtils_1.NullTelemetryService;
            }
            this.sendErrorTelemetry = this.impl.sendErrorTelemetry;
        }
        setExperimentProperty(name, value) {
            return this.impl.setExperimentProperty(name, value);
        }
        get telemetryLevel() {
            return this.impl.telemetryLevel;
        }
        publicLog(eventName, data) {
            this.impl.publicLog(eventName, data);
        }
        publicLog2(eventName, data) {
            this.publicLog(eventName, data);
        }
        publicLogError(errorEventName, data) {
            this.impl.publicLogError(errorEventName, data);
        }
        publicLogError2(eventName, data) {
            this.publicLogError(eventName, data);
        }
    };
    exports.TelemetryService = TelemetryService;
    exports.TelemetryService = TelemetryService = __decorate([
        __param(0, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(1, productService_1.IProductService),
        __param(2, services_1.ISharedProcessService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService)
    ], TelemetryService);
    (0, extensions_1.registerSingleton)(telemetry_1.ITelemetryService, TelemetryService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RlbGVtZXRyeS9lbGVjdHJvbi1zYW5kYm94L3RlbGVtZXRyeVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJ6RixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLHNCQUFVO1FBTy9DLElBQUksU0FBUyxLQUFhLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELElBQUksU0FBUyxLQUFhLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELElBQUksS0FBSyxLQUFhLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQy9DLElBQUksZ0JBQWdCLEtBQWEsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUNyRSxJQUFJLFlBQVksS0FBMEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFFMUUsWUFDcUMsa0JBQXNELEVBQ3pFLGNBQStCLEVBQ3pCLG9CQUEyQyxFQUNqRCxjQUErQixFQUN6QixvQkFBMkM7WUFFbEUsS0FBSyxFQUFFLENBQUM7WUFFUixJQUFJLElBQUEsa0NBQWlCLEVBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDLEVBQUUsQ0FBQztnQkFDM0QsTUFBTSxVQUFVLEdBQUcsSUFBQSxvQ0FBbUIsRUFBQyxjQUFjLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztnQkFDN0UsTUFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUMsVUFBVSxDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBQ3JFLE1BQU0sTUFBTSxHQUE0QjtvQkFDdkMsU0FBUyxFQUFFLENBQUMsSUFBSSxzQ0FBdUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDakQsZ0JBQWdCLEVBQUUsSUFBQSw0REFBZ0MsRUFBQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLGNBQWMsQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLE9BQU8sRUFBRSxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsa0JBQWtCLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxpQkFBTyxFQUFFLGtCQUFrQixDQUFDLGVBQWUsQ0FBQztvQkFDalMsUUFBUSxFQUFFLElBQUEsMkNBQTBCLEVBQUMsa0JBQWtCLENBQUM7b0JBQ3hELGtCQUFrQixFQUFFLElBQUk7aUJBQ3hCLENBQUM7Z0JBRUYsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksbUNBQW9CLENBQUMsTUFBTSxFQUFFLG9CQUFvQixFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDcEcsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxJQUFJLEdBQUcscUNBQW9CLENBQUM7WUFDbEMsQ0FBQztZQUVELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDO1FBQ3hELENBQUM7UUFFRCxxQkFBcUIsQ0FBQyxJQUFZLEVBQUUsS0FBYTtZQUNoRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFFRCxJQUFJLGNBQWM7WUFDakIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUNqQyxDQUFDO1FBRUQsU0FBUyxDQUFDLFNBQWlCLEVBQUUsSUFBcUI7WUFDakQsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFRCxVQUFVLENBQXNGLFNBQWlCLEVBQUUsSUFBZ0M7WUFDbEosSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsSUFBc0IsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFRCxjQUFjLENBQUMsY0FBc0IsRUFBRSxJQUFxQjtZQUMzRCxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVELGVBQWUsQ0FBc0YsU0FBaUIsRUFBRSxJQUFnQztZQUN2SixJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxJQUFzQixDQUFDLENBQUM7UUFDeEQsQ0FBQztLQUNELENBQUE7SUEvRFksNENBQWdCOytCQUFoQixnQkFBZ0I7UUFjMUIsV0FBQSx1REFBa0MsQ0FBQTtRQUNsQyxXQUFBLGdDQUFlLENBQUE7UUFDZixXQUFBLGdDQUFxQixDQUFBO1FBQ3JCLFdBQUEseUJBQWUsQ0FBQTtRQUNmLFdBQUEscUNBQXFCLENBQUE7T0FsQlgsZ0JBQWdCLENBK0Q1QjtJQUVELElBQUEsOEJBQWlCLEVBQUMsNkJBQWlCLEVBQUUsZ0JBQWdCLG9DQUE0QixDQUFDIn0=