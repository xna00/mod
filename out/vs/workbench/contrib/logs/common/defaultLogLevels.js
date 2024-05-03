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
define(["require", "exports", "vs/platform/log/common/log", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/environment/common/environmentService", "vs/platform/files/common/files", "vs/workbench/services/configuration/common/jsonEditing", "vs/base/common/types", "vs/platform/environment/common/environmentService", "vs/platform/instantiation/common/extensions", "vs/base/common/json", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, log_1, instantiation_1, environmentService_1, files_1, jsonEditing_1, types_1, environmentService_2, extensions_1, json_1, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IDefaultLogLevelsService = void 0;
    exports.IDefaultLogLevelsService = (0, instantiation_1.createDecorator)('IDefaultLogLevelsService');
    let DefaultLogLevelsService = class DefaultLogLevelsService extends lifecycle_1.Disposable {
        constructor(environmentService, fileService, jsonEditingService, logService, loggerService) {
            super();
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.jsonEditingService = jsonEditingService;
            this.logService = logService;
            this.loggerService = loggerService;
            this._onDidChangeDefaultLogLevels = this._register(new event_1.Emitter);
            this.onDidChangeDefaultLogLevels = this._onDidChangeDefaultLogLevels.event;
        }
        async getDefaultLogLevels() {
            const argvLogLevel = await this._parseLogLevelsFromArgv();
            return {
                default: argvLogLevel?.default ?? this._getDefaultLogLevelFromEnv(),
                extensions: argvLogLevel?.extensions ?? this._getExtensionsDefaultLogLevelsFromEnv()
            };
        }
        async getDefaultLogLevel(extensionId) {
            const argvLogLevel = await this._parseLogLevelsFromArgv() ?? {};
            if (extensionId) {
                extensionId = extensionId.toLowerCase();
                return this._getDefaultLogLevel(argvLogLevel, extensionId);
            }
            else {
                return this._getDefaultLogLevel(argvLogLevel);
            }
        }
        async setDefaultLogLevel(defaultLogLevel, extensionId) {
            const argvLogLevel = await this._parseLogLevelsFromArgv() ?? {};
            if (extensionId) {
                extensionId = extensionId.toLowerCase();
                const currentDefaultLogLevel = this._getDefaultLogLevel(argvLogLevel, extensionId);
                argvLogLevel.extensions = argvLogLevel.extensions ?? [];
                const extension = argvLogLevel.extensions.find(([extension]) => extension === extensionId);
                if (extension) {
                    extension[1] = defaultLogLevel;
                }
                else {
                    argvLogLevel.extensions.push([extensionId, defaultLogLevel]);
                }
                await this._writeLogLevelsToArgv(argvLogLevel);
                const extensionLoggers = [...this.loggerService.getRegisteredLoggers()].filter(logger => logger.extensionId && logger.extensionId.toLowerCase() === extensionId);
                for (const { resource } of extensionLoggers) {
                    if (this.loggerService.getLogLevel(resource) === currentDefaultLogLevel) {
                        this.loggerService.setLogLevel(resource, defaultLogLevel);
                    }
                }
            }
            else {
                const currentLogLevel = this._getDefaultLogLevel(argvLogLevel);
                argvLogLevel.default = defaultLogLevel;
                await this._writeLogLevelsToArgv(argvLogLevel);
                if (this.loggerService.getLogLevel() === currentLogLevel) {
                    this.loggerService.setLogLevel(defaultLogLevel);
                }
            }
            this._onDidChangeDefaultLogLevels.fire();
        }
        _getDefaultLogLevel(argvLogLevels, extension) {
            if (extension) {
                const extensionLogLevel = argvLogLevels.extensions?.find(([extensionId]) => extensionId === extension);
                if (extensionLogLevel) {
                    return extensionLogLevel[1];
                }
            }
            return argvLogLevels.default ?? (0, log_1.getLogLevel)(this.environmentService);
        }
        async _writeLogLevelsToArgv(logLevels) {
            const logLevelsValue = [];
            if (!(0, types_1.isUndefined)(logLevels.default)) {
                logLevelsValue.push((0, log_1.LogLevelToString)(logLevels.default));
            }
            for (const [extension, logLevel] of logLevels.extensions ?? []) {
                logLevelsValue.push(`${extension}=${(0, log_1.LogLevelToString)(logLevel)}`);
            }
            await this.jsonEditingService.write(this.environmentService.argvResource, [{ path: ['log-level'], value: logLevelsValue.length ? logLevelsValue : undefined }], true);
        }
        async _parseLogLevelsFromArgv() {
            const result = { extensions: [] };
            const logLevels = await this._readLogLevelsFromArgv();
            for (const extensionLogLevel of logLevels) {
                const matches = environmentService_2.EXTENSION_IDENTIFIER_WITH_LOG_REGEX.exec(extensionLogLevel);
                if (matches && matches[1] && matches[2]) {
                    const logLevel = (0, log_1.parseLogLevel)(matches[2]);
                    if (!(0, types_1.isUndefined)(logLevel)) {
                        result.extensions?.push([matches[1].toLowerCase(), logLevel]);
                    }
                }
                else {
                    const logLevel = (0, log_1.parseLogLevel)(extensionLogLevel);
                    if (!(0, types_1.isUndefined)(logLevel)) {
                        result.default = logLevel;
                    }
                }
            }
            return !(0, types_1.isUndefined)(result.default) || result.extensions?.length ? result : undefined;
        }
        async migrateLogLevels() {
            const logLevels = await this._readLogLevelsFromArgv();
            const regex = /^([^.]+\..+):(.+)$/;
            if (logLevels.some(extensionLogLevel => regex.test(extensionLogLevel))) {
                const argvLogLevel = await this._parseLogLevelsFromArgv();
                if (argvLogLevel) {
                    await this._writeLogLevelsToArgv(argvLogLevel);
                }
            }
        }
        async _readLogLevelsFromArgv() {
            try {
                const content = await this.fileService.readFile(this.environmentService.argvResource);
                const argv = (0, json_1.parse)(content.value.toString());
                return (0, types_1.isString)(argv['log-level']) ? [argv['log-level']] : Array.isArray(argv['log-level']) ? argv['log-level'] : [];
            }
            catch (error) {
                if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.error(error);
                }
            }
            return [];
        }
        _getDefaultLogLevelFromEnv() {
            return (0, log_1.getLogLevel)(this.environmentService);
        }
        _getExtensionsDefaultLogLevelsFromEnv() {
            const result = [];
            for (const [extension, logLevelValue] of this.environmentService.extensionLogLevel ?? []) {
                const logLevel = (0, log_1.parseLogLevel)(logLevelValue);
                if (!(0, types_1.isUndefined)(logLevel)) {
                    result.push([extension, logLevel]);
                }
            }
            return result;
        }
    };
    DefaultLogLevelsService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, jsonEditing_1.IJSONEditingService),
        __param(3, log_1.ILogService),
        __param(4, log_1.ILoggerService)
    ], DefaultLogLevelsService);
    (0, extensions_1.registerSingleton)(exports.IDefaultLogLevelsService, DefaultLogLevelsService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdExvZ0xldmVscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbG9ncy9jb21tb24vZGVmYXVsdExvZ0xldmVscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFxQm5GLFFBQUEsd0JBQXdCLEdBQUcsSUFBQSwrQkFBZSxFQUEyQiwwQkFBMEIsQ0FBQyxDQUFDO0lBb0I5RyxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHNCQUFVO1FBTy9DLFlBQytCLGtCQUFpRSxFQUNqRixXQUEwQyxFQUNuQyxrQkFBd0QsRUFDaEUsVUFBd0MsRUFDckMsYUFBOEM7WUFFOUQsS0FBSyxFQUFFLENBQUM7WUFOdUMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE4QjtZQUNoRSxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNsQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQy9DLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDcEIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBUnZELGlDQUE0QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFhLENBQUMsQ0FBQztZQUNoRSxnQ0FBMkIsR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMsS0FBSyxDQUFDO1FBVS9FLENBQUM7UUFFRCxLQUFLLENBQUMsbUJBQW1CO1lBQ3hCLE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7WUFDMUQsT0FBTztnQkFDTixPQUFPLEVBQUUsWUFBWSxFQUFFLE9BQU8sSUFBSSxJQUFJLENBQUMsMEJBQTBCLEVBQUU7Z0JBQ25FLFVBQVUsRUFBRSxZQUFZLEVBQUUsVUFBVSxJQUFJLElBQUksQ0FBQyxxQ0FBcUMsRUFBRTthQUNwRixD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