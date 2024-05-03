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
define(["require", "exports", "vs/base/common/uuid", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagementService", "vs/platform/instantiation/common/extensions", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/base/common/network", "vs/platform/configuration/common/configuration", "vs/platform/download/common/download", "vs/platform/product/common/productService", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/base/common/resources", "vs/platform/userDataSync/common/userDataSync", "vs/platform/dialogs/common/dialogs", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/instantiation/common/instantiation", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/telemetry/common/telemetry"], function (require, exports, uuid_1, extensionManagement_1, extensionManagementService_1, extensions_1, extensionManagement_2, network_1, configuration_1, download_1, productService_1, environmentService_1, resources_1, userDataSync_1, dialogs_1, workspaceTrust_1, extensionManifestPropertiesService_1, instantiation_1, files_1, log_1, userDataProfile_1, extensionsScannerService_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionManagementService = void 0;
    let ExtensionManagementService = class ExtensionManagementService extends extensionManagementService_1.ExtensionManagementService {
        constructor(environmentService, extensionManagementServerService, extensionGalleryService, userDataProfileService, configurationService, productService, downloadService, userDataSyncEnablementService, dialogService, workspaceTrustRequestService, extensionManifestPropertiesService, fileService, logService, instantiationService, extensionsScannerService, telemetryService) {
            super(extensionManagementServerService, extensionGalleryService, userDataProfileService, configurationService, productService, downloadService, userDataSyncEnablementService, dialogService, workspaceTrustRequestService, extensionManifestPropertiesService, fileService, logService, instantiationService, extensionsScannerService, telemetryService);
            this.environmentService = environmentService;
        }
        async installVSIXInServer(vsix, server, options) {
            if (vsix.scheme === network_1.Schemas.vscodeRemote && server === this.extensionManagementServerService.localExtensionManagementServer) {
                const downloadedLocation = (0, resources_1.joinPath)(this.environmentService.tmpDir, (0, uuid_1.generateUuid)());
                await this.downloadService.download(vsix, downloadedLocation);
                vsix = downloadedLocation;
            }
            return super.installVSIXInServer(vsix, server, options);
        }
    };
    exports.ExtensionManagementService = ExtensionManagementService;
    exports.ExtensionManagementService = ExtensionManagementService = __decorate([
        __param(0, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(1, extensionManagement_2.IExtensionManagementServerService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, userDataProfile_1.IUserDataProfileService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, productService_1.IProductService),
        __param(6, download_1.IDownloadService),
        __param(7, userDataSync_1.IUserDataSyncEnablementService),
        __param(8, dialogs_1.IDialogService),
        __param(9, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(10, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(11, files_1.IFileService),
        __param(12, log_1.ILogService),
        __param(13, instantiation_1.IInstantiationService),
        __param(14, extensionsScannerService_1.IExtensionsScannerService),
        __param(15, telemetry_1.ITelemetryService)
    ], ExtensionManagementService);
    (0, extensions_1.registerSingleton)(extensionManagement_2.IWorkbenchExtensionManagementService, ExtensionManagementService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuYWdlbWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25NYW5hZ2VtZW50L2VsZWN0cm9uLXNhbmRib3gvZXh0ZW5zaW9uTWFuYWdlbWVudFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeUJ6RixJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEyQixTQUFRLHVEQUE4QjtRQUU3RSxZQUNzRCxrQkFBc0QsRUFDeEUsZ0NBQW1FLEVBQzVFLHVCQUFpRCxFQUNsRCxzQkFBK0MsRUFDakQsb0JBQTJDLEVBQ2pELGNBQStCLEVBQzlCLGVBQWlDLEVBQ25CLDZCQUE2RCxFQUM3RSxhQUE2QixFQUNkLDRCQUEyRCxFQUNyRCxrQ0FBdUUsRUFDOUYsV0FBeUIsRUFDMUIsVUFBdUIsRUFDYixvQkFBMkMsRUFDdkMsd0JBQW1ELEVBQzNELGdCQUFtQztZQUV0RCxLQUFLLENBQ0osZ0NBQWdDLEVBQ2hDLHVCQUF1QixFQUN2QixzQkFBc0IsRUFDdEIsb0JBQW9CLEVBQ3BCLGNBQWMsRUFDZCxlQUFlLEVBQ2YsNkJBQTZCLEVBQzdCLGFBQWEsRUFDYiw0QkFBNEIsRUFDNUIsa0NBQWtDLEVBQ2xDLFdBQVcsRUFDWCxVQUFVLEVBQ1Ysb0JBQW9CLEVBQ3BCLHdCQUF3QixFQUN4QixnQkFBZ0IsQ0FDaEIsQ0FBQztZQWpDbUQsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQztRQWtDNUcsQ0FBQztRQUVrQixLQUFLLENBQUMsbUJBQW1CLENBQUMsSUFBUyxFQUFFLE1BQWtDLEVBQUUsT0FBbUM7WUFDOUgsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsWUFBWSxJQUFJLE1BQU0sS0FBSyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsOEJBQThCLEVBQUUsQ0FBQztnQkFDN0gsTUFBTSxrQkFBa0IsR0FBRyxJQUFBLG9CQUFRLEVBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxJQUFBLG1CQUFZLEdBQUUsQ0FBQyxDQUFDO2dCQUNwRixNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO2dCQUM5RCxJQUFJLEdBQUcsa0JBQWtCLENBQUM7WUFDM0IsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDekQsQ0FBQztLQUNELENBQUE7SUEvQ1ksZ0VBQTBCO3lDQUExQiwwQkFBMEI7UUFHcEMsV0FBQSx1REFBa0MsQ0FBQTtRQUNsQyxXQUFBLHVEQUFpQyxDQUFBO1FBQ2pDLFdBQUEsOENBQXdCLENBQUE7UUFDeEIsV0FBQSx5Q0FBdUIsQ0FBQTtRQUN2QixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsZ0NBQWUsQ0FBQTtRQUNmLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSw2Q0FBOEIsQ0FBQTtRQUM5QixXQUFBLHdCQUFjLENBQUE7UUFDZCxXQUFBLDhDQUE2QixDQUFBO1FBQzdCLFlBQUEsd0VBQW1DLENBQUE7UUFDbkMsWUFBQSxvQkFBWSxDQUFBO1FBQ1osWUFBQSxpQkFBVyxDQUFBO1FBQ1gsWUFBQSxxQ0FBcUIsQ0FBQTtRQUNyQixZQUFBLG9EQUF5QixDQUFBO1FBQ3pCLFlBQUEsNkJBQWlCLENBQUE7T0FsQlAsMEJBQTBCLENBK0N0QztJQUVELElBQUEsOEJBQWlCLEVBQUMsMERBQW9DLEVBQUUsMEJBQTBCLG9DQUE0QixDQUFDIn0=