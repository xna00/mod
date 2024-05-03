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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionStorage", "vs/platform/extensionManagement/common/unsupportedExtensionsMigration", "vs/platform/extensionManagement/node/extensionManagementService", "vs/platform/log/common/log", "vs/platform/storage/common/storage"], function (require, exports, lifecycle_1, extensionManagement_1, extensionStorage_1, unsupportedExtensionsMigration_1, extensionManagementService_1, log_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsContributions = void 0;
    let ExtensionsContributions = class ExtensionsContributions extends lifecycle_1.Disposable {
        constructor(extensionManagementService, extensionGalleryService, extensionStorageService, extensionEnablementService, storageService, logService) {
            super();
            extensionManagementService.cleanUp();
            (0, unsupportedExtensionsMigration_1.migrateUnsupportedExtensions)(extensionManagementService, extensionGalleryService, extensionStorageService, extensionEnablementService, logService);
            extensionStorage_1.ExtensionStorageService.removeOutdatedExtensionVersions(extensionManagementService, storageService);
        }
    };
    exports.ExtensionsContributions = ExtensionsContributions;
    exports.ExtensionsContributions = ExtensionsContributions = __decorate([
        __param(0, extensionManagementService_1.INativeServerExtensionManagementService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, extensionStorage_1.IExtensionStorageService),
        __param(3, extensionManagement_1.IGlobalExtensionEnablementService),
        __param(4, storage_1.IStorageService),
        __param(5, log_1.ILogService)
    ], ExtensionsContributions);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvY29kZS9ub2RlL3NoYXJlZFByb2Nlc3MvY29udHJpYi9leHRlbnNpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVV6RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHNCQUFVO1FBQ3RELFlBQzBDLDBCQUFtRSxFQUNsRix1QkFBaUQsRUFDakQsdUJBQWlELEVBQ3hDLDBCQUE2RCxFQUMvRSxjQUErQixFQUNuQyxVQUF1QjtZQUVwQyxLQUFLLEVBQUUsQ0FBQztZQUVSLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3JDLElBQUEsNkRBQTRCLEVBQUMsMEJBQTBCLEVBQUUsdUJBQXVCLEVBQUUsdUJBQXVCLEVBQUUsMEJBQTBCLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDbkosMENBQXVCLENBQUMsK0JBQStCLENBQUMsMEJBQTBCLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDckcsQ0FBQztLQUVELENBQUE7SUFoQlksMERBQXVCO3NDQUF2Qix1QkFBdUI7UUFFakMsV0FBQSxvRUFBdUMsQ0FBQTtRQUN2QyxXQUFBLDhDQUF3QixDQUFBO1FBQ3hCLFdBQUEsMkNBQXdCLENBQUE7UUFDeEIsV0FBQSx1REFBaUMsQ0FBQTtRQUNqQyxXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLGlCQUFXLENBQUE7T0FQRCx1QkFBdUIsQ0FnQm5DIn0=