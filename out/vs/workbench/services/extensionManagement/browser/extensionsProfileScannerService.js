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
define(["require", "exports", "vs/platform/log/common/log", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/telemetry/common/telemetry", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/workbench/services/environment/common/environmentService"], function (require, exports, log_1, userDataProfile_1, uriIdentity_1, telemetry_1, extensionsProfileScannerService_1, files_1, extensions_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsProfileScannerService = void 0;
    let ExtensionsProfileScannerService = class ExtensionsProfileScannerService extends extensionsProfileScannerService_1.AbstractExtensionsProfileScannerService {
        constructor(environmentService, fileService, userDataProfilesService, uriIdentityService, telemetryService, logService) {
            super(environmentService.userRoamingDataHome, fileService, userDataProfilesService, uriIdentityService, telemetryService, logService);
        }
    };
    exports.ExtensionsProfileScannerService = ExtensionsProfileScannerService;
    exports.ExtensionsProfileScannerService = ExtensionsProfileScannerService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, userDataProfile_1.IUserDataProfilesService),
        __param(3, uriIdentity_1.IUriIdentityService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, log_1.ILogService)
    ], ExtensionsProfileScannerService);
    (0, extensions_1.registerSingleton)(extensionsProfileScannerService_1.IExtensionsProfileScannerService, ExtensionsProfileScannerService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1Byb2ZpbGVTY2FubmVyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbk1hbmFnZW1lbnQvYnJvd3Nlci9leHRlbnNpb25zUHJvZmlsZVNjYW5uZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVd6RixJQUFNLCtCQUErQixHQUFyQyxNQUFNLCtCQUFnQyxTQUFRLHlFQUF1QztRQUMzRixZQUMrQixrQkFBZ0QsRUFDaEUsV0FBeUIsRUFDYix1QkFBaUQsRUFDdEQsa0JBQXVDLEVBQ3pDLGdCQUFtQyxFQUN6QyxVQUF1QjtZQUVwQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLHVCQUF1QixFQUFFLGtCQUFrQixFQUFFLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZJLENBQUM7S0FDRCxDQUFBO0lBWFksMEVBQStCOzhDQUEvQiwrQkFBK0I7UUFFekMsV0FBQSxpREFBNEIsQ0FBQTtRQUM1QixXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLDBDQUF3QixDQUFBO1FBQ3hCLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLGlCQUFXLENBQUE7T0FQRCwrQkFBK0IsQ0FXM0M7SUFFRCxJQUFBLDhCQUFpQixFQUFDLGtFQUFnQyxFQUFFLCtCQUErQixvQ0FBNEIsQ0FBQyJ9