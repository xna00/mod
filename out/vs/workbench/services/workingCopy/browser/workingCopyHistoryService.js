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
define(["require", "exports", "vs/platform/files/common/files", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/environment/common/environmentService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/configuration/common/configuration", "vs/workbench/services/workingCopy/common/workingCopyHistoryService", "vs/platform/instantiation/common/extensions", "vs/workbench/services/workingCopy/common/workingCopyHistory"], function (require, exports, files_1, remoteAgentService_1, environmentService_1, uriIdentity_1, label_1, log_1, configuration_1, workingCopyHistoryService_1, extensions_1, workingCopyHistory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserWorkingCopyHistoryService = void 0;
    let BrowserWorkingCopyHistoryService = class BrowserWorkingCopyHistoryService extends workingCopyHistoryService_1.WorkingCopyHistoryService {
        constructor(fileService, remoteAgentService, environmentService, uriIdentityService, labelService, logService, configurationService) {
            super(fileService, remoteAgentService, environmentService, uriIdentityService, labelService, logService, configurationService);
        }
        getModelOptions() {
            return { flushOnChange: true /* because browsers support no long running shutdown */ };
        }
    };
    exports.BrowserWorkingCopyHistoryService = BrowserWorkingCopyHistoryService;
    exports.BrowserWorkingCopyHistoryService = BrowserWorkingCopyHistoryService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, uriIdentity_1.IUriIdentityService),
        __param(4, label_1.ILabelService),
        __param(5, log_1.ILogService),
        __param(6, configuration_1.IConfigurationService)
    ], BrowserWorkingCopyHistoryService);
    // Register Service
    (0, extensions_1.registerSingleton)(workingCopyHistory_1.IWorkingCopyHistoryService, BrowserWorkingCopyHistoryService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlIaXN0b3J5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtpbmdDb3B5L2Jyb3dzZXIvd29ya2luZ0NvcHlIaXN0b3J5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBaUMsU0FBUSxxREFBeUI7UUFFOUUsWUFDZSxXQUF5QixFQUNsQixrQkFBdUMsRUFDOUIsa0JBQWdELEVBQ3pELGtCQUF1QyxFQUM3QyxZQUEyQixFQUM3QixVQUF1QixFQUNiLG9CQUEyQztZQUVsRSxLQUFLLENBQUMsV0FBVyxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUNoSSxDQUFDO1FBRVMsZUFBZTtZQUN4QixPQUFPLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyx1REFBdUQsRUFBRSxDQUFDO1FBQ3hGLENBQUM7S0FDRCxDQUFBO0lBakJZLDRFQUFnQzsrQ0FBaEMsZ0NBQWdDO1FBRzFDLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsd0NBQW1CLENBQUE7UUFDbkIsV0FBQSxpREFBNEIsQ0FBQTtRQUM1QixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEscUNBQXFCLENBQUE7T0FUWCxnQ0FBZ0MsQ0FpQjVDO0lBRUQsbUJBQW1CO0lBQ25CLElBQUEsOEJBQWlCLEVBQUMsK0NBQTBCLEVBQUUsZ0NBQWdDLG9DQUE0QixDQUFDIn0=