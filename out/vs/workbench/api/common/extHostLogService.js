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
define(["require", "exports", "vs/nls", "vs/platform/log/common/log", "vs/platform/log/common/logService", "vs/workbench/api/common/extHostInitDataService"], function (require, exports, nls_1, log_1, logService_1, extHostInitDataService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLogService = void 0;
    let ExtHostLogService = class ExtHostLogService extends logService_1.LogService {
        constructor(isWorker, loggerService, initData) {
            const id = initData.remote.isRemote ? 'remoteexthost' : isWorker ? 'workerexthost' : 'exthost';
            const name = initData.remote.isRemote ? (0, nls_1.localize)('remote', "Extension Host (Remote)") : isWorker ? (0, nls_1.localize)('worker', "Extension Host (Worker)") : (0, nls_1.localize)('local', "Extension Host");
            super(loggerService.createLogger(id, { name }));
        }
    };
    exports.ExtHostLogService = ExtHostLogService;
    exports.ExtHostLogService = ExtHostLogService = __decorate([
        __param(1, log_1.ILoggerService),
        __param(2, extHostInitDataService_1.IExtHostInitDataService)
    ], ExtHostLogService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdExvZ1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RMb2dTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQU96RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLHVCQUFVO1FBSWhELFlBQ0MsUUFBaUIsRUFDRCxhQUE2QixFQUNwQixRQUFpQztZQUUxRCxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQy9GLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxRQUFRLEVBQUUseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxRQUFRLEVBQUUseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDdkwsS0FBSyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pELENBQUM7S0FFRCxDQUFBO0lBZFksOENBQWlCO2dDQUFqQixpQkFBaUI7UUFNM0IsV0FBQSxvQkFBYyxDQUFBO1FBQ2QsV0FBQSxnREFBdUIsQ0FBQTtPQVBiLGlCQUFpQixDQWM3QiJ9