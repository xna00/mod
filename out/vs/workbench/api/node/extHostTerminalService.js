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
define(["require", "exports", "vs/base/common/uuid", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTerminalService", "vs/workbench/api/common/extHostCommands"], function (require, exports, uuid_1, extHostRpcService_1, extHostTerminalService_1, extHostCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTerminalService = void 0;
    let ExtHostTerminalService = class ExtHostTerminalService extends extHostTerminalService_1.BaseExtHostTerminalService {
        constructor(extHostCommands, extHostRpc) {
            super(true, extHostCommands, extHostRpc);
        }
        createTerminal(name, shellPath, shellArgs) {
            return this.createTerminalFromOptions({ name, shellPath, shellArgs });
        }
        createTerminalFromOptions(options, internalOptions) {
            const terminal = new extHostTerminalService_1.ExtHostTerminal(this._proxy, (0, uuid_1.generateUuid)(), options, options.name);
            this._terminals.push(terminal);
            terminal.create(options, this._serializeParentTerminal(options, internalOptions));
            return terminal.value;
        }
    };
    exports.ExtHostTerminalService = ExtHostTerminalService;
    exports.ExtHostTerminalService = ExtHostTerminalService = __decorate([
        __param(0, extHostCommands_1.IExtHostCommands),
        __param(1, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostTerminalService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRlcm1pbmFsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9ub2RlL2V4dEhvc3RUZXJtaW5hbFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBUXpGLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXVCLFNBQVEsbURBQTBCO1FBRXJFLFlBQ21CLGVBQWlDLEVBQy9CLFVBQThCO1lBRWxELEtBQUssQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFFTSxjQUFjLENBQUMsSUFBYSxFQUFFLFNBQWtCLEVBQUUsU0FBNkI7WUFDckYsT0FBTyxJQUFJLENBQUMseUJBQXlCLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVNLHlCQUF5QixDQUFDLE9BQStCLEVBQUUsZUFBMEM7WUFDM0csTUFBTSxRQUFRLEdBQUcsSUFBSSx3Q0FBZSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBQSxtQkFBWSxHQUFFLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6RixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQixRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDO1FBQ3ZCLENBQUM7S0FDRCxDQUFBO0lBbkJZLHdEQUFzQjtxQ0FBdEIsc0JBQXNCO1FBR2hDLFdBQUEsa0NBQWdCLENBQUE7UUFDaEIsV0FBQSxzQ0FBa0IsQ0FBQTtPQUpSLHNCQUFzQixDQW1CbEMifQ==