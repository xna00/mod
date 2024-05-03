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
define(["require", "exports", "vs/workbench/services/extensions/common/extHostCustomers", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/base/common/uri", "vs/platform/commands/common/commands", "vs/platform/environment/common/environment"], function (require, exports, extHostCustomers_1, log_1, lifecycle_1, extHost_protocol_1, uri_1, commands_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadLoggerService = void 0;
    let MainThreadLoggerService = class MainThreadLoggerService {
        constructor(extHostContext, loggerService) {
            this.loggerService = loggerService;
            this.disposables = new lifecycle_1.DisposableStore();
            const proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostLogLevelServiceShape);
            this.disposables.add(loggerService.onDidChangeLogLevel(arg => {
                if ((0, log_1.isLogLevel)(arg)) {
                    proxy.$setLogLevel(arg);
                }
                else {
                    proxy.$setLogLevel(arg[1], arg[0]);
                }
            }));
        }
        $log(file, messages) {
            const logger = this.loggerService.getLogger(uri_1.URI.revive(file));
            if (!logger) {
                throw new Error('Create the logger before logging');
            }
            for (const [level, message] of messages) {
                (0, log_1.log)(logger, level, message);
            }
        }
        async $createLogger(file, options) {
            this.loggerService.createLogger(uri_1.URI.revive(file), options);
        }
        async $registerLogger(logResource) {
            this.loggerService.registerLogger({
                ...logResource,
                resource: uri_1.URI.revive(logResource.resource)
            });
        }
        async $deregisterLogger(resource) {
            this.loggerService.deregisterLogger(uri_1.URI.revive(resource));
        }
        async $setVisibility(resource, visible) {
            this.loggerService.setVisibility(uri_1.URI.revive(resource), visible);
        }
        $flush(file) {
            const logger = this.loggerService.getLogger(uri_1.URI.revive(file));
            if (!logger) {
                throw new Error('Create the logger before flushing');
            }
            logger.flush();
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    exports.MainThreadLoggerService = MainThreadLoggerService;
    exports.MainThreadLoggerService = MainThreadLoggerService = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadLogger),
        __param(1, log_1.ILoggerService)
    ], MainThreadLoggerService);
    // --- Internal commands to improve extension test runs
    commands_1.CommandsRegistry.registerCommand('_extensionTests.setLogLevel', function (accessor, level) {
        const loggerService = accessor.get(log_1.ILoggerService);
        const environmentService = accessor.get(environment_1.IEnvironmentService);
        if (environmentService.isExtensionDevelopment && !!environmentService.extensionTestsLocationURI) {
            const logLevel = (0, log_1.parseLogLevel)(level);
            if (logLevel !== undefined) {
                loggerService.setLogLevel(logLevel);
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand('_extensionTests.getLogLevel', function (accessor) {
        const logService = accessor.get(log_1.ILogService);
        return (0, log_1.LogLevelToString)(logService.getLevel());
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZExvZ1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkTG9nU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBdUI7UUFJbkMsWUFDQyxjQUErQixFQUNmLGFBQThDO1lBQTdCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUo5QyxnQkFBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBTXBELE1BQU0sS0FBSyxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1lBQ2xGLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDNUQsSUFBSSxJQUFBLGdCQUFVLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDckIsS0FBSyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDekIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLENBQUMsSUFBbUIsRUFBRSxRQUE4QjtZQUN2RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDOUQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dC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