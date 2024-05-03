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
define(["require", "exports", "vs/platform/log/common/log", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/telemetry/common/telemetry", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/files/common/files", "vs/platform/environment/common/environment", "vs/base/common/uri", "vs/platform/instantiation/common/extensions"], function (require, exports, log_1, userDataProfile_1, uriIdentity_1, telemetry_1, extensionsProfileScannerService_1, files_1, environment_1, uri_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsProfileScannerService = void 0;
    let ExtensionsProfileScannerService = class ExtensionsProfileScannerService extends extensionsProfileScannerService_1.AbstractExtensionsProfileScannerService {
        constructor(environmentService, fileService, userDataProfilesService, uriIdentityService, telemetryService, logService) {
            super(uri_1.URI.file(environmentService.extensionsPath), fileService, userDataProfilesService, uriIdentityService, telemetryService, logService);
        }
    };
    exports.ExtensionsProfileScannerService = ExtensionsProfileScannerService;
    exports.ExtensionsProfileScannerService = ExtensionsProfileScannerService = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, userDataProfile_1.IUserDataProfilesService),
        __param(3, uriIdentity_1.IUriIdentityService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, log_1.ILogService)
    ], ExtensionsProfileScannerService);
    (0, extensions_1.registerSingleton)(extensionsProfileScannerService_1.IExtensionsProfileScannerService, ExtensionsProfileScannerService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1Byb2ZpbGVTY2FubmVyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZXh0ZW5zaW9uTWFuYWdlbWVudC9lbGVjdHJvbi1zYW5kYm94L2V4dGVuc2lvbnNQcm9maWxlU2Nhbm5lclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBWXpGLElBQU0sK0JBQStCLEdBQXJDLE1BQU0sK0JBQWdDLFNBQVEseUVBQXVDO1FBQzNGLFlBQzRCLGtCQUE2QyxFQUMxRCxXQUF5QixFQUNiLHVCQUFpRCxFQUN0RCxrQkFBdUMsRUFDekMsZ0JBQW1DLEVBQ3pDLFVBQXVCO1lBRXBDLEtBQUssQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxFQUFFLFdBQVcsRUFBRSx1QkFBdUIsRUFBRSxrQkFBa0IsRUFBRSxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUM1SSxDQUFDO0tBQ0QsQ0FBQTtJQVhZLDBFQUErQjs4Q0FBL0IsK0JBQStCO1FBRXpDLFdBQUEsdUNBQXlCLENBQUE7UUFDekIsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSwwQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSxpQkFBVyxDQUFBO09BUEQsK0JBQStCLENBVzNDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyxrRUFBZ0MsRUFBRSwrQkFBK0Isb0NBQTRCLENBQUMifQ==