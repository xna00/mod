/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/platform/instantiation/common/extensions"], function (require, exports, instantiation_1, globals_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShellEnvironmentService = exports.IShellEnvironmentService = void 0;
    exports.IShellEnvironmentService = (0, instantiation_1.createDecorator)('shellEnvironmentService');
    class ShellEnvironmentService {
        getShellEnv() {
            return globals_1.process.shellEnv();
        }
    }
    exports.ShellEnvironmentService = ShellEnvironmentService;
    (0, extensions_1.registerSingleton)(exports.IShellEnvironmentService, ShellEnvironmentService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGxFbnZpcm9ubWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9lbnZpcm9ubWVudC9lbGVjdHJvbi1zYW5kYm94L3NoZWxsRW52aXJvbm1lbnRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9uRixRQUFBLHdCQUF3QixHQUFHLElBQUEsK0JBQWUsRUFBMkIseUJBQXlCLENBQUMsQ0FBQztJQVM3RyxNQUFhLHVCQUF1QjtRQUluQyxXQUFXO1lBQ1YsT0FBTyxpQkFBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzNCLENBQUM7S0FDRDtJQVBELDBEQU9DO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyxnQ0FBd0IsRUFBRSx1QkFBdUIsb0NBQTRCLENBQUMifQ==