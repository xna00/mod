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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/telemetry/browser/1dsAppender", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryLogAppender", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/telemetry/browser/workbenchCommonProperties"], function (require, exports, lifecycle_1, configuration_1, extensions_1, log_1, productService_1, storage_1, _1dsAppender_1, telemetry_1, telemetryLogAppender_1, telemetryService_1, telemetryUtils_1, environmentService_1, remoteAgentService_1, workbenchCommonProperties_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryService = void 0;
    let TelemetryService = class TelemetryService extends lifecycle_1.Disposable {
        get sessionId() { return this.impl.sessionId; }
        get machineId() { return this.impl.machineId; }
        get sqmId() { return this.impl.sqmId; }
        get firstSessionDate() { return this.impl.firstSessionDate; }
        get msftInternal() { return this.impl.msftInternal; }
        constructor(environmentService, logService, loggerService, configurationService, storageService, productService, remoteAgentService) {
            super();
            this.impl = telemetryUtils_1.NullTelemetryService;
            this.sendErrorTelemetry = true;
            this.impl = this.initializeService(environmentService, logService, loggerService, configurationService, storageService, productService, remoteAgentService);
            // When the level changes it could change from off to on and we want to make sure telemetry is properly intialized
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(telemetry_1.TELEMETRY_SETTING_ID)) {
                    this.impl = this.initializeService(environmentService, logService, loggerService, configurationService, storageService, productService, remoteAgentService);
                }
            }));
        }
        /**
         * Initializes the telemetry service to be a full fledged service.
         * This is only done once and only when telemetry is enabled as this will also ping the endpoint to
         * ensure its not adblocked and we can send telemetry
         */
        initializeService(environmentService, logService, loggerService, configurationService, storageService, productService, remoteAgentService) {
            const telemetrySupported = (0, telemetryUtils_1.supportsTelemetry)(productService, environmentService) && productService.aiConfig?.ariaKey;
            if (telemetrySupported && (0, telemetryUtils_1.getTelemetryLevel)(configurationService) !== 0 /* TelemetryLevel.NONE */ && this.impl === telemetryUtils_1.NullTelemetryService) {
                // If remote server is present send telemetry through that, else use the client side appender
                const appenders = [];
                const isInternal = (0, telemetryUtils_1.isInternalTelemetry)(productService, configurationService);
                if (!(0, telemetryUtils_1.isLoggingOnly)(productService, environmentService)) {
                    if (remoteAgentService.getConnection() !== null) {
                        const remoteTelemetryProvider = {
                            log: remoteAgentService.logTelemetry.bind(remoteAgentService),
                            flush: remoteAgentService.flushTelemetry.bind(remoteAgentService)
                        };
                        appenders.push(remoteTelemetryProvider);
                    }
                    else {
                        appenders.push(new _1dsAppender_1.OneDataSystemWebAppender(isInternal, 'monacoworkbench', null, productService.aiConfig?.ariaKey));
                    }
                }
                appenders.push(new telemetryLogAppender_1.TelemetryLogAppender(logService, loggerService, environmentService, productService));
                const config = {
                    appenders,
                    commonProperties: (0, workbenchCommonProperties_1.resolveWorkbenchCommonProperties)(storageService, productService.commit, productService.version, isInternal, environmentService.remoteAuthority, productService.embedderIdentifier, productService.removeTelemetryMachineId, environmentService.options && environmentService.options.resolveCommonTelemetryProperties),
                    sendErrorTelemetry: this.sendErrorTelemetry,
                };
                return this._register(new telemetryService_1.TelemetryService(config, configurationService, productService));
            }
            return this.impl;
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
            this.impl.publicLog(errorEventName, data);
        }
        publicLogError2(eventName, data) {
            this.publicLogError(eventName, data);
        }
    };
    exports.TelemetryService = TelemetryService;
    exports.TelemetryService = TelemetryService = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, log_1.ILogService),
        __param(2, log_1.ILoggerService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, storage_1.IStorageService),
        __param(5, productService_1.IProductService),
        __param(6, remoteAgentService_1.IRemoteAgentService)
    ], TelemetryService);
    (0, extensions_1.registerSingleton)(telemetry_1.ITelemetryService, TelemetryService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RlbGVtZXRyeS9icm93c2VyL3RlbGVtZXRyeVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0J6RixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLHNCQUFVO1FBTy9DLElBQUksU0FBUyxLQUFhLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELElBQUksU0FBUyxLQUFhLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELElBQUksS0FBSyxLQUFhLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQy9DLElBQUksZ0JBQWdCLEtBQWEsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUNyRSxJQUFJLFlBQVksS0FBMEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFFMUUsWUFDc0Msa0JBQXVELEVBQy9FLFVBQXVCLEVBQ3BCLGFBQTZCLEVBQ3RCLG9CQUEyQyxFQUNqRCxjQUErQixFQUMvQixjQUErQixFQUMzQixrQkFBdUM7WUFFNUQsS0FBSyxFQUFFLENBQUM7WUFsQkQsU0FBSSxHQUFzQixxQ0FBb0IsQ0FBQztZQUN2Qyx1QkFBa0IsR0FBRyxJQUFJLENBQUM7WUFtQnpDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsb0JBQW9CLEVBQUUsY0FBYyxFQUFFLGNBQWMs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