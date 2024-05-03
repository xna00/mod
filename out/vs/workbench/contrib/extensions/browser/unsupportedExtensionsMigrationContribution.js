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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionStorage", "vs/platform/extensionManagement/common/unsupportedExtensionsMigration", "vs/platform/log/common/log", "vs/workbench/services/extensionManagement/common/extensionManagement"], function (require, exports, extensionManagement_1, extensionStorage_1, unsupportedExtensionsMigration_1, log_1, extensionManagement_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnsupportedExtensionsMigrationContrib = void 0;
    let UnsupportedExtensionsMigrationContrib = class UnsupportedExtensionsMigrationContrib {
        constructor(extensionManagementServerService, extensionGalleryService, extensionStorageService, extensionEnablementService, logService) {
            // Unsupported extensions are not migrated for local extension management server, because it is done in shared process
            if (extensionManagementServerService.remoteExtensionManagementServer) {
                (0, unsupportedExtensionsMigration_1.migrateUnsupportedExtensions)(extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService, extensionGalleryService, extensionStorageService, extensionEnablementService, logService);
            }
            if (extensionManagementServerService.webExtensionManagementServer) {
                (0, unsupportedExtensionsMigration_1.migrateUnsupportedExtensions)(extensionManagementServerService.webExtensionManagementServer.extensionManagementService, extensionGalleryService, extensionStorageService, extensionEnablementService, logService);
            }
        }
    };
    exports.UnsupportedExtensionsMigrationContrib = UnsupportedExtensionsMigrationContrib;
    exports.UnsupportedExtensionsMigrationContrib = UnsupportedExtensionsMigrationContrib = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, extensionStorage_1.IExtensionStorageService),
        __param(3, extensionManagement_1.IGlobalExtensionEnablementService),
        __param(4, log_1.ILogService)
    ], UnsupportedExtensionsMigrationContrib);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5zdXBwb3J0ZWRFeHRlbnNpb25zTWlncmF0aW9uQ29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvdW5zdXBwb3J0ZWRFeHRlbnNpb25zTWlncmF0aW9uQ29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVN6RixJQUFNLHFDQUFxQyxHQUEzQyxNQUFNLHFDQUFxQztRQUVqRCxZQUNvQyxnQ0FBbUUsRUFDNUUsdUJBQWlELEVBQ2pELHVCQUFpRCxFQUN4QywwQkFBNkQsRUFDbkYsVUFBdUI7WUFFcEMsc0hBQXNIO1lBQ3RILElBQUksZ0NBQWdDLENBQUMsK0JBQStCLEVBQUUsQ0FBQztnQkFDdEUsSUFBQSw2REFBNEIsRUFBQyxnQ0FBZ0MsQ0FBQywrQkFBK0IsQ0FBQywwQkFBMEIsRUFBRSx1QkFBdUIsRUFBRSx1QkFBdUIsRUFBRSwwQkFBMEIsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNyTixDQUFDO1lBQ0QsSUFBSSxnQ0FBZ0MsQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO2dCQUNuRSxJQUFBLDZEQUE0QixFQUFDLGdDQUFnQyxDQUFDLDRCQUE0QixDQUFDLDBCQUEwQixFQUFFLHVCQUF1QixFQUFFLHVCQUF1QixFQUFFLDBCQUEwQixFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2xOLENBQUM7UUFDRixDQUFDO0tBRUQsQ0FBQTtJQWxCWSxzRkFBcUM7b0RBQXJDLHFDQUFxQztRQUcvQyxXQUFBLHVEQUFpQyxDQUFBO1FBQ2pDLFdBQUEsOENBQXdCLENBQUE7UUFDeEIsV0FBQSwyQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLHVEQUFpQyxDQUFBO1FBQ2pDLFdBQUEsaUJBQVcsQ0FBQTtPQVBELHFDQUFxQyxDQWtCakQifQ==