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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/ipc/electron-sandbox/services", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionTipsService", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/base/common/network"], function (require, exports, extensions_1, services_1, extensionManagement_1, extensionTipsService_1, files_1, productService_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NativeExtensionTipsService = class NativeExtensionTipsService extends extensionTipsService_1.ExtensionTipsService {
        constructor(fileService, productService, sharedProcessService) {
            super(fileService, productService);
            this.channel = sharedProcessService.getChannel('extensionTipsService');
        }
        getConfigBasedTips(folder) {
            if (folder.scheme === network_1.Schemas.file) {
                return this.channel.call('getConfigBasedTips', [folder]);
            }
            return super.getConfigBasedTips(folder);
        }
        getImportantExecutableBasedTips() {
            return this.channel.call('getImportantExecutableBasedTips');
        }
        getOtherExecutableBasedTips() {
            return this.channel.call('getOtherExecutableBasedTips');
        }
    };
    NativeExtensionTipsService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, productService_1.IProductService),
        __param(2, services_1.ISharedProcessService)
    ], NativeExtensionTipsService);
    (0, extensions_1.registerSingleton)(extensionManagement_1.IExtensionTipsService, NativeExtensionTipsService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uVGlwc1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25NYW5hZ2VtZW50L2VsZWN0cm9uLXNhbmRib3gvZXh0ZW5zaW9uVGlwc1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFZaEcsSUFBTSwwQkFBMEIsR0FBaEMsTUFBTSwwQkFBMkIsU0FBUSwyQ0FBb0I7UUFJNUQsWUFDZSxXQUF5QixFQUN0QixjQUErQixFQUN6QixvQkFBMkM7WUFFbEUsS0FBSyxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNuQyxJQUFJLENBQUMsT0FBTyxHQUFHLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7UUFFUSxrQkFBa0IsQ0FBQyxNQUFXO1lBQ3RDLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNwQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUE2QixvQkFBb0IsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDdEYsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFUSwrQkFBK0I7WUFDdkMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBaUMsaUNBQWlDLENBQUMsQ0FBQztRQUM3RixDQUFDO1FBRVEsMkJBQTJCO1lBQ25DLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQWlDLDZCQUE2QixDQUFDLENBQUM7UUFDekYsQ0FBQztLQUVELENBQUE7SUE1QkssMEJBQTBCO1FBSzdCLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsZ0NBQWUsQ0FBQTtRQUNmLFdBQUEsZ0NBQXFCLENBQUE7T0FQbEIsMEJBQTBCLENBNEIvQjtJQUVELElBQUEsOEJBQWlCLEVBQUMsMkNBQXFCLEVBQUUsMEJBQTBCLG9DQUE0QixDQUFDIn0=