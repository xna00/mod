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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/files/common/files", "vs/base/common/network", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/configuration/common/configuration", "vs/platform/extensionResourceLoader/common/extensionResourceLoader"], function (require, exports, extensions_1, files_1, network_1, productService_1, storage_1, environment_1, log_1, configuration_1, extensionResourceLoader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExtensionResourceLoaderService = class ExtensionResourceLoaderService extends extensionResourceLoader_1.AbstractExtensionResourceLoaderService {
        constructor(fileService, storageService, productService, environmentService, configurationService, _logService) {
            super(fileService, storageService, productService, environmentService, configurationService);
            this._logService = _logService;
        }
        async readExtensionResource(uri) {
            uri = network_1.FileAccess.uriToBrowserUri(uri);
            if (uri.scheme !== network_1.Schemas.http && uri.scheme !== network_1.Schemas.https && uri.scheme !== network_1.Schemas.data) {
                const result = await this._fileService.readFile(uri);
                return result.value.toString();
            }
            const requestInit = {};
            if (this.isExtensionGalleryResource(uri)) {
                requestInit.headers = await this.getExtensionGalleryRequestHeaders();
                requestInit.mode = 'cors'; /* set mode to cors so that above headers are always passed */
            }
            const response = await fetch(uri.toString(true), requestInit);
            if (response.status !== 200) {
                this._logService.info(`Request to '${uri.toString(true)}' failed with status code ${response.status}`);
                throw new Error(response.statusText);
            }
            return response.text();
        }
    };
    ExtensionResourceLoaderService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, storage_1.IStorageService),
        __param(2, productService_1.IProductService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, log_1.ILogService)
    ], ExtensionResourceLoaderService);
    (0, extensions_1.registerSingleton)(extensionResourceLoader_1.IExtensionResourceLoaderService, ExtensionResourceLoaderService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUmVzb3VyY2VMb2FkZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlbnNpb25SZXNvdXJjZUxvYWRlci9icm93c2VyL2V4dGVuc2lvblJlc291cmNlTG9hZGVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQWFoRyxJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUErQixTQUFRLGdFQUFzQztRQUlsRixZQUNlLFdBQXlCLEVBQ3RCLGNBQStCLEVBQy9CLGNBQStCLEVBQzNCLGtCQUF1QyxFQUNyQyxvQkFBMkMsRUFDcEMsV0FBd0I7WUFFdEQsS0FBSyxDQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFGL0QsZ0JBQVcsR0FBWCxXQUFXLENBQWE7UUFHdkQsQ0FBQztRQUVELEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxHQUFRO1lBQ25DLEdBQUcsR0FBRyxvQkFBVSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUV0QyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2hHLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3JELE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNoQyxDQUFDO1lBRUQsTUFBTSxXQUFXLEdBQWdCLEVBQUUsQ0FBQztZQUNwQyxJQUFJLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUMxQyxXQUFXLENBQUMsT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLGlDQUFpQyxFQUFFLENBQUM7Z0JBQ3JFLFdBQVcsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUMsOERBQThEO1lBQzFGLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzlELElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQ3ZHLE1BQU0sSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN4QixDQUFDO0tBQ0QsQ0FBQTtJQXBDSyw4QkFBOEI7UUFLakMsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSx5QkFBZSxDQUFBO1FBQ2YsV0FBQSxnQ0FBZSxDQUFBO1FBQ2YsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsaUJBQVcsQ0FBQTtPQVZSLDhCQUE4QixDQW9DbkM7SUFFRCxJQUFBLDhCQUFpQixFQUFDLHlEQUErQixFQUFFLDhCQUE4QixvQ0FBNEIsQ0FBQyJ9