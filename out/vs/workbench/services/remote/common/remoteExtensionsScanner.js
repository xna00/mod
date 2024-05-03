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
define(["require", "exports", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/remote/common/remoteExtensionsScanner", "vs/base/common/platform", "vs/base/common/uri", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/workbench/services/userDataProfile/common/remoteUserDataProfiles", "vs/workbench/services/environment/common/environmentService", "vs/platform/log/common/log", "vs/platform/instantiation/common/extensions", "vs/workbench/services/localization/common/locale"], function (require, exports, remoteAgentService_1, remoteExtensionsScanner_1, platform, uri_1, userDataProfile_1, remoteUserDataProfiles_1, environmentService_1, log_1, extensions_1, locale_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let RemoteExtensionsScannerService = class RemoteExtensionsScannerService {
        constructor(remoteAgentService, environmentService, userDataProfileService, remoteUserDataProfilesService, logService, activeLanguagePackService) {
            this.remoteAgentService = remoteAgentService;
            this.environmentService = environmentService;
            this.userDataProfileService = userDataProfileService;
            this.remoteUserDataProfilesService = remoteUserDataProfilesService;
            this.logService = logService;
            this.activeLanguagePackService = activeLanguagePackService;
        }
        whenExtensionsReady() {
            return this.withChannel(channel => channel.call('whenExtensionsReady'), undefined);
        }
        async scanExtensions() {
            try {
                const languagePack = await this.activeLanguagePackService.getExtensionIdProvidingCurrentLocale();
                return await this.withChannel(async (channel) => {
                    const profileLocation = this.userDataProfileService.currentProfile.isDefault ? undefined : (await this.remoteUserDataProfilesService.getRemoteProfile(this.userDataProfileService.currentProfile)).extensionsResource;
                    const scannedExtensions = await channel.call('scanExtensions', [platform.language, profileLocation, this.environmentService.extensionDevelopmentLocationURI, languagePack]);
                    scannedExtensions.forEach((extension) => {
                        extension.extensionLocation = uri_1.URI.revive(extension.extensionLocation);
                    });
                    return scannedExtensions;
                }, []);
            }
            catch (error) {
                this.logService.error(error);
                return [];
            }
        }
        async scanSingleExtension(extensionLocation, isBuiltin) {
            try {
                return await this.withChannel(async (channel) => {
                    const extension = await channel.call('scanSingleExtension', [extensionLocation, isBuiltin, platform.language]);
                    if (extension !== null) {
                        extension.extensionLocation = uri_1.URI.revive(extension.extensionLocation);
                        // ImplicitActivationEvents.updateManifest(extension);
                    }
                    return extension;
                }, null);
            }
            catch (error) {
                this.logService.error(error);
                return null;
            }
        }
        withChannel(callback, fallback) {
            const connection = this.remoteAgentService.getConnection();
            if (!connection) {
                return Promise.resolve(fallback);
            }
            return connection.withChannel(remoteExtensionsScanner_1.RemoteExtensionsScannerChannelName, (channel) => callback(channel));
        }
    };
    RemoteExtensionsScannerService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, userDataProfile_1.IUserDataProfileService),
        __param(3, remoteUserDataProfiles_1.IRemoteUserDataProfilesService),
        __param(4, log_1.ILogService),
        __param(5, locale_1.IActiveLanguagePackService)
    ], RemoteExtensionsScannerService);
    (0, extensions_1.registerSingleton)(remoteExtensionsScanner_1.IRemoteExtensionsScannerService, RemoteExtensionsScannerService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRXh0ZW5zaW9uc1NjYW5uZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9yZW1vdGUvY29tbW9uL3JlbW90ZUV4dGVuc2lvbnNTY2FubmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBZWhHLElBQU0sOEJBQThCLEdBQXBDLE1BQU0sOEJBQThCO1FBSW5DLFlBQ3VDLGtCQUF1QyxFQUM5QixrQkFBZ0QsRUFDckQsc0JBQStDLEVBQ3hDLDZCQUE2RCxFQUNoRixVQUF1QixFQUNSLHlCQUFxRDtZQUw1RCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzlCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBOEI7WUFDckQsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQUN4QyxrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQWdDO1lBQ2hGLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDUiw4QkFBeUIsR0FBekIseUJBQXlCLENBQTRCO1FBQy9GLENBQUM7UUFFTCxtQkFBbUI7WUFDbEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUN0QixPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsRUFDOUMsU0FBUyxDQUNULENBQUM7UUFDSCxDQUFDO1FBRUQsS0FBSyxDQUFDLGNBQWM7WUFDbkIsSUFBSSxDQUFDO2dCQUNKLE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBSSxDQUFDLHlCQUF5QixDQUFDLG9DQUFvQyxFQUFFLENBQUM7Z0JBQ2pHLE9BQU8sTUFBTSxJQUFJLENBQUMsV0FBVyxDQUM1QixLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7b0JBQ2pCLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxjQUFj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