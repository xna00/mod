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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/platform/log/common/log", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/platform/remote/common/remoteHosts", "vs/platform/telemetry/common/telemetryUtils", "vs/base/common/objects", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/nls"], function (require, exports, instantiation_1, event_1, log_1, extHostInitDataService_1, extensionHostProtocol_1, remoteHosts_1, telemetryUtils_1, objects_1, uri_1, lifecycle_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostTelemetry = exports.ExtHostTelemetryLogger = exports.ExtHostTelemetry = void 0;
    exports.isNewAppInstall = isNewAppInstall;
    let ExtHostTelemetry = class ExtHostTelemetry extends lifecycle_1.Disposable {
        constructor(initData, loggerService) {
            super();
            this.initData = initData;
            this.loggerService = loggerService;
            this._onDidChangeTelemetryEnabled = this._register(new event_1.Emitter());
            this.onDidChangeTelemetryEnabled = this._onDidChangeTelemetryEnabled.event;
            this._onDidChangeTelemetryConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeTelemetryConfiguration = this._onDidChangeTelemetryConfiguration.event;
            this._productConfig = { usage: true, error: true };
            this._level = 0 /* TelemetryLevel.NONE */;
            // This holds whether or not we're running with --disable-telemetry, etc. Usings supportsTelemtry() from the main thread
            this._telemetryIsSupported = false;
            this._inLoggingOnlyMode = false;
            this._telemetryLoggers = new Map();
            this.extHostTelemetryLogFile = uri_1.URI.revive(this.initData.environment.extensionTelemetryLogResource);
            this._inLoggingOnlyMode = this.initData.environment.isExtensionTelemetryLoggingOnly;
            this._outputLogger = loggerService.createLogger(this.extHostTelemetryLogFile, { id: telemetryUtils_1.extensionTelemetryLogChannelId, name: (0, nls_1.localize)('extensionTelemetryLog', "Extension Telemetry{0}", this._inLoggingOnlyMode ? ' (Not Sent)' : ''), hidden: true });
            this._register(this._outputLogger);
            this._register(loggerService.onDidChangeLogLevel(arg => {
                if ((0, log_1.isLogLevel)(arg)) {
                    this.updateLoggerVisibility();
                }
            }));
            this._outputLogger.info('Below are logs for extension telemetry events sent to the telemetry output channel API once the log level is set to trace.');
            this._outputLogger.info('===========================================================');
        }
        updateLoggerVisibility() {
            this.loggerService.setVisibility(this.extHostTelemetryLogFile, this._telemetryIsSupported && this.loggerService.getLogLevel() === log_1.LogLevel.Trace);
        }
        getTelemetryConfiguration() {
            return this._level === 3 /* TelemetryLevel.USAGE */;
        }
        getTelemetryDetails() {
            return {
                isCrashEnabled: this._level >= 1 /* TelemetryLevel.CRASH */,
                isErrorsEnabled: this._productConfig.error ? this._level >= 2 /* TelemetryLevel.ERROR */ : false,
                isUsageEnabled: this._productConfig.usage ? this._level >= 3 /* TelemetryLevel.USAGE */ : false
            };
        }
        instantiateLogger(extension, sender, options) {
            const telemetryDetails = this.getTelemetryDetails();
            const logger = new ExtHostTelemetryLogger(sender, options, extension, this._outputLogger, this._inLoggingOnlyMode, this.getBuiltInCommonProperties(extension), { isUsageEnabled: telemetryDetails.isUsageEnabled, isErrorsEnabled: telemetryDetails.isErrorsEnabled });
            const loggers = this._telemetryLoggers.get(extension.identifier.value) ?? [];
            this._telemetryLoggers.set(extension.identifier.value, [...loggers, logger]);
            return logger.apiTelemetryLogger;
        }
        $initializeTelemetryLevel(level, supportsTelemetry, productConfig) {
            this._level = level;
            this._telemetryIsSupported = supportsTelemetry;
            this._productConfig = productConfig ?? { usage: true, error: true };
            this.updateLoggerVisibility();
        }
        getBuiltInCommonProperties(extension) {
            const commonProperties = Object.create(null);
            // TODO @lramos15, does os info like node arch, platform version, etc exist here.
            // Or will first party extensions just mix this in
            commonProperties['common.extname'] = `${extension.publisher}.${extension.name}`;
            commonProperties['common.extversion'] = extension.version;
            commonProperties['common.vscodemachineid'] = this.initData.telemetryInfo.machineId;
            commonProperties['common.vscodesessionid'] = this.initData.telemetryInfo.sessionId;
            commonProperties['common.sqmid'] = this.initData.telemetryInfo.sqmId;
            commonProperties['common.vscodeversion'] = this.initData.version;
            commonProperties['common.isnewappinstall'] = isNewAppInstall(this.initData.telemetryInfo.firstSessionDate);
            commonProperties['common.product'] = this.initData.environment.appHost;
            switch (this.initData.uiKind) {
                case extensionHostProtocol_1.UIKind.Web:
                    commonProperties['common.uikind'] = 'web';
                    break;
                case extensionHostProtocol_1.UIKind.Desktop:
                    commonProperties['common.uikind'] = 'desktop';
                    break;
                default:
                    commonProperties['common.uikind'] = 'unknown';
            }
            commonProperties['common.remotename'] = (0, remoteHosts_1.getRemoteName)((0, telemetryUtils_1.cleanRemoteAuthority)(this.initData.remote.authority));
            return commonProperties;
        }
        $onDidChangeTelemetryLevel(level) {
            this._oldTelemetryEnablement = this.getTelemetryConfiguration();
            this._level = level;
            const telemetryDetails = this.getTelemetryDetails();
            // Remove all disposed loggers
            this._telemetryLoggers.forEach((loggers, key) => {
                const newLoggers = loggers.filter(l => !l.isDisposed);
                if (newLoggers.length === 0) {
                    this._telemetryLoggers.delete(key);
                }
                else {
                    this._telemetryLoggers.set(key, newLoggers);
                }
            });
            // Loop through all loggers and update their level
            this._telemetryLoggers.forEach(loggers => {
                for (const logger of loggers) {
                    logger.updateTelemetryEnablements(telemetryDetails.isUsageEnabled, telemetryDetails.isErrorsEnabled);
                }
            });
            if (this._oldTelemetryEnablement !== this.getTelemetryConfiguration()) {
                this._onDidChangeTelemetryEnabled.fire(this.getTelemetryConfiguration());
            }
            this._onDidChangeTelemetryConfiguration.fire(this.getTelemetryDetails());
            this.updateLoggerVisibility();
        }
        onExtensionError(extension, error) {
            const loggers = this._telemetryLoggers.get(extension.value);
            const nonDisposedLoggers = loggers?.filter(l => !l.isDisposed);
            if (!nonDisposedLoggers) {
                this._telemetryLoggers.delete(extension.value);
                return false;
            }
            let errorEmitted = false;
            for (const logger of nonDisposedLoggers) {
                if (logger.ignoreUnhandledExtHostErrors) {
                    continue;
                }
                logger.logError(error);
                errorEmitted = true;
            }
            return errorEmitted;
        }
    };
    exports.ExtHostTelemetry = ExtHostTelemetry;
    exports.ExtHostTelemetry = ExtHostTelemetry = __decorate([
        __param(0, extHostInitDataService_1.IExtHostInitDataService),
        __param(1, log_1.ILoggerService)
    ], ExtHostTelemetry);
    class ExtHostTelemetryLogger {
        static validateSender(sender) {
            if (typeof sender !== 'object') {
                throw new TypeError('TelemetrySender argument is invalid');
            }
            if (typeof sender.sendEventData !== 'function') {
                throw new TypeError('TelemetrySender.sendEventData must be a function');
            }
            if (typeof sender.sendErrorData !== 'function') {
                throw new TypeError('TelemetrySender.sendErrorData must be a function');
            }
            if (typeof sender.flush !== 'undefined' && typeof sender.flush !== 'function') {
                throw new TypeError('TelemetrySender.flush must be a function or undefined');
            }
        }
        constructor(sender, options, _extension, _logger, _inLoggingOnlyMode, _commonProperties, telemetryEnablements) {
            this._extension = _extension;
            this._logger = _logger;
            this._inLoggingOnlyMode = _inLoggingOnlyMode;
            this._commonProperties = _commonProperties;
            this._onDidChangeEnableStates = new event_1.Emitter();
            this.ignoreUnhandledExtHostErrors = options?.ignoreUnhandledErrors ?? false;
            this._ignoreBuiltinCommonProperties = options?.ignoreBuiltInCommonProperties ?? false;
            this._additionalCommonProperties = options?.additionalCommonProperties;
            this._sender = sender;
            this._telemetryEnablements = { isUsageEnabled: telemetryEnablements.isUsageEnabled, isErrorsEnabled: telemetryEnablements.isErrorsEnabled };
        }
        updateTelemetryEnablements(isUsageEnabled, isErrorsEnabled) {
            if (this._apiObject) {
                this._telemetryEnablements = { isUsageEnabled, isErrorsEnabled };
                this._onDidChangeEnableStates.fire(this._apiObject);
            }
        }
        mixInCommonPropsAndCleanData(data) {
            // Some telemetry modules prefer to break properties and measurmements up
            // We mix common properties into the properties tab.
            let updatedData = 'properties' in data ? (data.properties ?? {}) : data;
            // We don't clean measurements since they are just numbers
            updatedData = (0, telemetryUtils_1.cleanData)(updatedData, []);
            if (this._additionalCommonProperties) {
                updatedData = (0, objects_1.mixin)(updatedData, this._additionalCommonProperties);
            }
            if (!this._ignoreBuiltinCommonProperties) {
                updatedData = (0, objects_1.mixin)(updatedData, this._commonProperties);
            }
            if ('properties' in data) {
                data.properties = updatedData;
            }
            else {
                data = updatedData;
            }
            return data;
        }
        logEvent(eventName, data) {
            // No sender means likely disposed of, we should no-op
            if (!this._sender) {
                return;
            }
            // If it's a built-in extension (vscode publisher) we don't prefix the publisher and only the ext name
            if (this._extension.publisher === 'vscode') {
                eventName = this._extension.name + '/' + eventName;
            }
            else {
                eventName = this._extension.identifier.value + '/' + eventName;
            }
            data = this.mixInCommonPropsAndCleanData(data || {});
            if (!this._inLoggingOnlyMode) {
                this._sender?.sendEventData(eventName, data);
            }
            this._logger.trace(eventName, data);
        }
        logUsage(eventName, data) {
            if (!this._telemetryEnablements.isUsageEnabled) {
                return;
            }
            this.logEvent(eventName, data);
        }
        logError(eventNameOrException, data) {
            if (!this._telemetryEnablements.isErrorsEnabled || !this._sender) {
                return;
            }
            if (typeof eventNameOrException === 'string') {
                this.logEvent(eventNameOrException, data);
            }
            else {
                const errorData = {
                    name: eventNameOrException.name,
                    message: eventNameOrException.message,
                    stack: eventNameOrException.stack,
                    cause: eventNameOrException.cause
                };
                const cleanedErrorData = (0, telemetryUtils_1.cleanData)(errorData, []);
                // Reconstruct the error object with the cleaned data
                const cleanedError = new Error(cleanedErrorData.message, {
                    cause: cleanedErrorData.cause
                });
                cleanedError.stack = cleanedErrorData.stack;
                cleanedError.name = cleanedErrorData.name;
                data = this.mixInCommonPropsAndCleanData(data || {});
                if (!this._inLoggingOnlyMode) {
                    this._sender.sendErrorData(cleanedError, data);
                }
                this._logger.trace('exception', data);
            }
        }
        get apiTelemetryLogger() {
            if (!this._apiObject) {
                const that = this;
                const obj = {
                    logUsage: that.logUsage.bind(that),
                    get isUsageEnabled() {
                        return that._telemetryEnablements.isUsageEnabled;
                    },
                    get isErrorsEnabled() {
                        return that._telemetryEnablements.isErrorsEnabled;
                    },
                    logError: that.logError.bind(that),
                    dispose: that.dispose.bind(that),
                    onDidChangeEnableStates: that._onDidChangeEnableStates.event.bind(that)
                };
                this._apiObject = Object.freeze(obj);
            }
            return this._apiObject;
        }
        get isDisposed() {
            return !this._sender;
        }
        dispose() {
            if (this._sender?.flush) {
                let tempSender = this._sender;
                this._sender = undefined;
                Promise.resolve(tempSender.flush()).then(tempSender = undefined);
                this._apiObject = undefined;
            }
            else {
                this._sender = undefined;
            }
        }
    }
    exports.ExtHostTelemetryLogger = ExtHostTelemetryLogger;
    function isNewAppInstall(firstSessionDate) {
        const installAge = Date.now() - new Date(firstSessionDate).getTime();
        return isNaN(installAge) ? false : installAge < 1000 * 60 * 60 * 24; // install age is less than a day
    }
    exports.IExtHostTelemetry = (0, instantiation_1.createDecorator)('IExtHostTelemetry');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRlbGVtZXRyeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFRlbGVtZXRyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE2VWhHLDBDQUdDO0lBOVRNLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsc0JBQVU7UUFvQi9DLFlBQzBCLFFBQWtELEVBQzNELGFBQThDO1lBRTlELEtBQUssRUFBRSxDQUFDO1lBSGtDLGFBQVEsR0FBUixRQUFRLENBQXlCO1lBQzFDLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQWxCOUMsaUNBQTRCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVyxDQUFDLENBQUM7WUFDOUUsZ0NBQTJCLEdBQW1CLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxLQUFLLENBQUM7WUFFOUUsdUNBQWtDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBaUMsQ0FBQyxDQUFDO1lBQzFHLHNDQUFpQyxHQUF5QyxJQUFJLENBQUMsa0NBQWtDLENBQUMsS0FBSyxDQUFDO1lBRXpILG1CQUFjLEdBQXVDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFDbEYsV0FBTSwrQkFBdUM7WUFDckQsd0hBQXdIO1lBQ2hILDBCQUFxQixHQUFZLEtBQUssQ0FBQztZQUU5Qix1QkFBa0IsR0FBWSxLQUFLLENBQUM7WUFHcEMsc0JBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQW9DLENBQUM7WUFPaEYsSUFBSSxDQUFDLHVCQUF1QixHQUFHLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsNkJBQTZCLENB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