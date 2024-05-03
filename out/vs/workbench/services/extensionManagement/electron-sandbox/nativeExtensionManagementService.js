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
define(["require", "exports", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/common/resources", "vs/base/common/network", "vs/platform/log/common/log", "vs/platform/download/common/download", "vs/platform/files/common/files", "vs/base/common/uuid", "vs/workbench/services/extensionManagement/common/extensionManagementChannelClient", "vs/platform/extensions/common/extensions", "vs/workbench/services/environment/electron-sandbox/environmentService"], function (require, exports, uriIdentity_1, userDataProfile_1, resources_1, network_1, log_1, download_1, files_1, uuid_1, extensionManagementChannelClient_1, extensions_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeExtensionManagementService = void 0;
    let NativeExtensionManagementService = class NativeExtensionManagementService extends extensionManagementChannelClient_1.ProfileAwareExtensionManagementChannelClient {
        constructor(channel, userDataProfileService, uriIdentityService, fileService, downloadService, nativeEnvironmentService, logService) {
            super(channel, userDataProfileService, uriIdentityService);
            this.fileService = fileService;
            this.downloadService = downloadService;
            this.nativeEnvironmentService = nativeEnvironmentService;
            this.logService = logService;
        }
        filterEvent({ profileLocation, applicationScoped }) {
            return applicationScoped || this.uriIdentityService.extUri.isEqual(this.userDataProfileService.currentProfile.extensionsResource, profileLocation);
        }
        async install(vsix, options) {
            const { location, cleanup } = await this.downloadVsix(vsix);
            try {
                return await super.install(location, options);
            }
            finally {
                await cleanup();
            }
        }
        async downloadVsix(vsix) {
            if (vsix.scheme === network_1.Schemas.file) {
                return { location: vsix, async cleanup() { } };
            }
            this.logService.trace('Downloading extension from', vsix.toString());
            const location = (0, resources_1.joinPath)(this.nativeEnvironmentService.extensionsDownloadLocation, (0, uuid_1.generateUuid)());
            await this.downloadService.download(vsix, location);
            this.logService.info('Downloaded extension to', location.toString());
            const cleanup = async () => {
                try {
                    await this.fileService.del(location);
                }
                catch (error) {
                    this.logService.error(error);
                }
            };
            return { location, cleanup };
        }
        async switchExtensionsProfile(previousProfileLocation, currentProfileLocation, preserveExtensions) {
            if (this.nativeEnvironmentService.remoteAuthority) {
                const previousInstalledExtensions = await this.getInstalled(1 /* ExtensionType.User */, previousProfileLocation);
                const resolverExtension = previousInstalledExtensions.find(e => (0, extensions_1.isResolverExtension)(e.manifest, this.nativeEnvironmentService.remoteAuthority));
                if (resolverExtension) {
                    if (!preserveExtensions) {
                        preserveExtensions = [];
                    }
                    preserveExtensions.push(new extensions_1.ExtensionIdentifier(resolverExtension.identifier.id));
                }
            }
            return super.switchExtensionsProfile(previousProfileLocation, currentProfileLocation, preserveExtensions);
        }
    };
    exports.NativeExtensionManagementService = NativeExtensionManagementService;
    exports.NativeExtensionManagementService = NativeExtensionManagementService = __decorate([
        __param(1, userDataProfile_1.IUserDataProfileService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, files_1.IFileService),
        __param(4, download_1.IDownloadService),
        __param(5, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(6, log_1.ILogService)
    ], NativeExtensionManagementService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlRXh0ZW5zaW9uTWFuYWdlbWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25NYW5hZ2VtZW50L2VsZWN0cm9uLXNhbmRib3gvbmF0aXZlRXh0ZW5zaW9uTWFuYWdlbWVudFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0J6RixJQUFNLGdDQUFnQyxHQUF0QyxNQUFNLGdDQUFpQyxTQUFRLCtFQUE0QztRQUVqRyxZQUNDLE9BQWlCLEVBQ1Esc0JBQStDLEVBQ25ELGtCQUF1QyxFQUM3QixXQUF5QixFQUNyQixlQUFpQyxFQUNmLHdCQUE0RCxFQUNuRixVQUF1QjtZQUVyRCxLQUFLLENBQUMsT0FBTyxFQUFFLHNCQUFzQixFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFMNUIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDckIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ2YsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUFvQztZQUNuRixlQUFVLEdBQVYsVUFBVSxDQUFhO1FBR3RELENBQUM7UUFFUyxXQUFXLENBQUMsRUFBRSxlQUFlLEVBQUUsaUJBQWlCLEVBQTRFO1lBQ3JJLE9BQU8saUJBQWlCLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUNwSixDQUFDO1FBRVEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFTLEVBQUUsT0FBd0I7WUFDekQsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFD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