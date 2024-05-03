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
define(["require", "exports", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile", "vs/server/node/remoteLanguagePacks"], function (require, exports, resources_1, uri_1, environment_1, extensionsProfileScannerService_1, extensionsScannerService_1, files_1, instantiation_1, log_1, productService_1, uriIdentity_1, userDataProfile_1, remoteLanguagePacks_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsScannerService = void 0;
    let ExtensionsScannerService = class ExtensionsScannerService extends extensionsScannerService_1.AbstractExtensionsScannerService {
        constructor(userDataProfilesService, extensionsProfileScannerService, fileService, logService, nativeEnvironmentService, productService, uriIdentityService, instantiationService) {
            super(uri_1.URI.file(nativeEnvironmentService.builtinExtensionsPath), uri_1.URI.file(nativeEnvironmentService.extensionsPath), (0, resources_1.joinPath)(nativeEnvironmentService.userHome, '.vscode-oss-dev', 'extensions', 'control.json'), userDataProfilesService.defaultProfile, userDataProfilesService, extensionsProfileScannerService, fileService, logService, nativeEnvironmentService, productService, uriIdentityService, instantiationService);
            this.nativeEnvironmentService = nativeEnvironmentService;
        }
        async getTranslations(language) {
            const config = await (0, remoteLanguagePacks_1.getNLSConfiguration)(language, this.nativeEnvironmentService.userDataPath);
            if (remoteLanguagePacks_1.InternalNLSConfiguration.is(config)) {
                try {
                    const content = await this.fileService.readFile(uri_1.URI.file(config._translationsConfigFile));
                    return JSON.parse(content.value.toString());
                }
                catch (err) { /* Ignore error */ }
            }
            return Object.create(null);
        }
    };
    exports.ExtensionsScannerService = ExtensionsScannerService;
    exports.ExtensionsScannerService = ExtensionsScannerService = __decorate([
        __param(0, userDataProfile_1.IUserDataProfilesService),
        __param(1, extensionsProfileScannerService_1.IExtensionsProfileScannerService),
        __param(2, files_1.IFileService),
        __param(3, log_1.ILogService),
        __param(4, environment_1.INativeEnvironmentService),
        __param(5, productService_1.IProductService),
        __param(6, uriIdentity_1.IUriIdentityService),
        __param(7, instantiation_1.IInstantiationService)
    ], ExtensionsScannerService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1NjYW5uZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9zZXJ2ZXIvbm9kZS9leHRlbnNpb25zU2Nhbm5lclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZXpGLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsMkRBQWdDO1FBRTdFLFlBQzJCLHVCQUFpRCxFQUN6QywrQkFBaUUsRUFDckYsV0FBeUIsRUFDMUIsVUFBdUIsRUFDUSx3QkFBbUQsRUFDOUUsY0FBK0IsRUFDM0Isa0JBQXVDLEVBQ3JDLG9CQUEyQztZQUVsRSxLQUFLLENBQ0osU0FBRyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxxQkFBcUIsQ0FBQyxFQUN4RCxTQUFHLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGNBQWMsQ0FBQyxFQUNqRCxJQUFBLG9CQUFRLEVBQUMsd0JBQXdCLENBQUMsUUFBUSxFQUFFLGlCQUFpQixFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsRUFDNUYsdUJBQXVCLENBQUMsY0FBYyxFQUN0Qyx1QkFBdUIsRUFBRSwrQkFBK0IsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLHdCQUF3QixFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBVjVILDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMkI7UUFXaEcsQ0FBQztRQUVTLEtBQUssQ0FBQyxlQUFlLENBQUMsUUFBZ0I7WUFDL0MsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHlDQUFtQixFQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDL0YsSUFBSSw4Q0FBd0IsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDekMsSUFBSSxDQUFDO29CQUNKLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDO29CQUMxRixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUM3QyxDQUFDO2dCQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsQ0FBQztLQUVELENBQUE7SUEvQlksNERBQXdCO3VDQUF4Qix3QkFBd0I7UUFHbEMsV0FBQSwwQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLGtFQUFnQyxDQUFBO1FBQ2hDLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEsdUNBQXlCLENBQUE7UUFDekIsV0FBQSxnQ0FBZSxDQUFBO1FBQ2YsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLHFDQUFxQixDQUFBO09BVlgsd0JBQXdCLENBK0JwQyJ9