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
define(["require", "exports", "vs/base/common/uri", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, uri_1, environment_1, extensionsProfileScannerService_1, extensionsScannerService_1, files_1, extensions_1, instantiation_1, log_1, productService_1, uriIdentity_1, userDataProfile_1, userDataProfile_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsScannerService = void 0;
    let ExtensionsScannerService = class ExtensionsScannerService extends extensionsScannerService_1.NativeExtensionsScannerService {
        constructor(userDataProfileService, userDataProfilesService, extensionsProfileScannerService, fileService, logService, environmentService, productService, uriIdentityService, instantiationService) {
            super(uri_1.URI.file(environmentService.builtinExtensionsPath), uri_1.URI.file(environmentService.extensionsPath), environmentService.userHome, userDataProfileService.currentProfile, userDataProfilesService, extensionsProfileScannerService, fileService, logService, environmentService, productService, uriIdentityService, instantiationService);
        }
    };
    exports.ExtensionsScannerService = ExtensionsScannerService;
    exports.ExtensionsScannerService = ExtensionsScannerService = __decorate([
        __param(0, userDataProfile_2.IUserDataProfileService),
        __param(1, userDataProfile_1.IUserDataProfilesService),
        __param(2, extensionsProfileScannerService_1.IExtensionsProfileScannerService),
        __param(3, files_1.IFileService),
        __param(4, log_1.ILogService),
        __param(5, environment_1.INativeEnvironmentService),
        __param(6, productService_1.IProductService),
        __param(7, uriIdentity_1.IUriIdentityService),
        __param(8, instantiation_1.IInstantiationService)
    ], ExtensionsScannerService);
    (0, extensions_1.registerSingleton)(extensionsScannerService_1.IExtensionsScannerService, ExtensionsScannerService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1NjYW5uZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9ucy9lbGVjdHJvbi1zYW5kYm94L2V4dGVuc2lvbnNTY2FubmVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFlekYsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSx5REFBOEI7UUFFM0UsWUFDMEIsc0JBQStDLEVBQzlDLHVCQUFpRCxFQUN6QywrQkFBaUUsRUFDckYsV0FBeUIsRUFDMUIsVUFBdUIsRUFDVCxrQkFBNkMsRUFDdkQsY0FBK0IsRUFDM0Isa0JBQXVDLEVBQ3JDLG9CQUEyQztZQUVsRSxLQUFLLENBQ0osU0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxxQkFBcUIsQ0FBQyxFQUNsRCxTQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxFQUMzQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQzNCLHNCQUFzQixDQUFDLGNBQWMsRUFDckMsdUJBQXVCLEVBQUUsK0JBQStCLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUNuSyxDQUFDO0tBRUQsQ0FBQTtJQXJCWSw0REFBd0I7dUNBQXhCLHdCQUF3QjtRQUdsQyxXQUFBLHlDQUF1QixDQUFBO1FBQ3ZCLFdBQUEsMENBQXdCLENBQUE7UUFDeEIsV0FBQSxrRUFBZ0MsQ0FBQTtRQUNoQyxXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLHVDQUF5QixDQUFBO1FBQ3pCLFdBQUEsZ0NBQWUsQ0FBQTtRQUNmLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSxxQ0FBcUIsQ0FBQTtPQVhYLHdCQUF3QixDQXFCcEM7SUFFRCxJQUFBLDhCQUFpQixFQUFDLG9EQUF5QixFQUFFLHdCQUF3QixvQ0FBNEIsQ0FBQyJ9