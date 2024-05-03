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
define(["require", "exports", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/api/common/extHost.protocol", "vs/platform/environment/common/environment", "vs/base/common/console", "vs/workbench/services/extensions/common/remoteConsoleUtil", "vs/workbench/services/extensions/common/extensionDevOptions", "vs/platform/log/common/log"], function (require, exports, extHostCustomers_1, extHost_protocol_1, environment_1, console_1, remoteConsoleUtil_1, extensionDevOptions_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadConsole = void 0;
    let MainThreadConsole = class MainThreadConsole {
        constructor(_extHostContext, _environmentService, _logService) {
            this._environmentService = _environmentService;
            this._logService = _logService;
            const devOpts = (0, extensionDevOptions_1.parseExtensionDevOptions)(this._environmentService);
            this._isExtensionDevTestFromCli = devOpts.isExtensionDevTestFromCli;
        }
        dispose() {
            //
        }
        $logExtensionHostMessage(entry) {
            if (this._isExtensionDevTestFromCli) {
                // If running tests from cli, log to the log service everything
                (0, remoteConsoleUtil_1.logRemoteEntry)(this._logService, entry);
            }
            else {
                // Log to the log service only errors and log everything to local console
                (0, remoteConsoleUtil_1.logRemoteEntryIfError)(this._logService, entry, 'Extension Host');
                (0, console_1.log)(entry, 'Extension Host');
            }
        }
    };
    exports.MainThreadConsole = MainThreadConsole;
    exports.MainThreadConsole = MainThreadConsole = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadConsole),
        __param(1, environment_1.IEnvironmentService),
        __param(2, log_1.ILogService)
    ], MainThreadConsole);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENvbnNvbGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkQ29uc29sZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXekYsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBaUI7UUFJN0IsWUFDQyxlQUFnQyxFQUNNLG1CQUF3QyxFQUNoRCxXQUF3QjtZQURoQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBQ2hELGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBRXRELE1BQU0sT0FBTyxHQUFHLElBQUEsOENBQXdCLEVBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLDBCQUEwQixHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQztRQUNyRSxDQUFDO1FBRUQsT0FBTztZQUNOLEVBQUU7UUFDSCxDQUFDO1FBRUQsd0JBQXdCLENBQUMsS0FBd0I7WUFDaEQsSUFBSSxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztnQkFDckMsK0RBQStEO2dCQUMvRCxJQUFBLGtDQUFjLEVBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AseUVBQXlFO2dCQUN6RSxJQUFBLHlDQUFxQixFQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBQ2pFLElBQUEsYUFBRyxFQUFDLEtBQUssRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzlCLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQTNCWSw4Q0FBaUI7Z0NBQWpCLGlCQUFpQjtRQUQ3QixJQUFBLHVDQUFvQixFQUFDLDhCQUFXLENBQUMsaUJBQWlCLENBQUM7UUFPakQsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLGlCQUFXLENBQUE7T0FQRCxpQkFBaUIsQ0EyQjdCIn0=