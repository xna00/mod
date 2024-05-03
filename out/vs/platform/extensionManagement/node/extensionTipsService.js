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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/platform/environment/common/environment", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/platform/native/common/native", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/extensionManagement/common/extensionTipsService"], function (require, exports, extensionManagement_1, files_1, productService_1, environment_1, extensionRecommendations_1, native_1, storage_1, telemetry_1, extensionTipsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionTipsService = void 0;
    let ExtensionTipsService = class ExtensionTipsService extends extensionTipsService_1.AbstractNativeExtensionTipsService {
        constructor(environmentService, telemetryService, extensionManagementService, storageService, nativeHostService, extensionRecommendationNotificationService, fileService, productService) {
            super(environmentService.userHome, nativeHostService, telemetryService, extensionManagementService, storageService, extensionRecommendationNotificationService, fileService, productService);
        }
    };
    exports.ExtensionTipsService = ExtensionTipsService;
    exports.ExtensionTipsService = ExtensionTipsService = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, storage_1.IStorageService),
        __param(4, native_1.INativeHostService),
        __param(5, extensionRecommendations_1.IExtensionRecommendationNotificationService),
        __param(6, files_1.IFileService),
        __param(7, productService_1.IProductService)
    ], ExtensionTipsService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uVGlwc1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvbm9kZS9leHRlbnNpb25UaXBzU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSx5REFBa0M7UUFFM0UsWUFDNEIsa0JBQTZDLEVBQ3JELGdCQUFtQyxFQUN6QiwwQkFBdUQsRUFDbkUsY0FBK0IsRUFDNUIsaUJBQXFDLEVBQ1osMENBQXVGLEVBQ3RILFdBQXlCLEVBQ3RCLGNBQStCO1lBRWhELEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsMEJBQTBCLEVBQUUsY0FBYyxFQUFFLDBDQUEwQyxFQUFFLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUM5TCxDQUFDO0tBQ0QsQ0FBQTtJQWRZLG9EQUFvQjttQ0FBcEIsb0JBQW9CO1FBRzlCLFdBQUEsdUNBQXlCLENBQUE7UUFDekIsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLGlEQUEyQixDQUFBO1FBQzNCLFdBQUEseUJBQWUsQ0FBQTtRQUNmLFdBQUEsMkJBQWtCLENBQUE7UUFDbEIsV0FBQSxzRUFBMkMsQ0FBQTtRQUMzQyxXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLGdDQUFlLENBQUE7T0FWTCxvQkFBb0IsQ0FjaEMifQ==