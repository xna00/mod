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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/log/common/log", "vs/base/common/errorMessage", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/nls", "vs/platform/product/common/productService", "vs/platform/configuration/common/configuration", "vs/base/common/async", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/files/common/files", "vs/workbench/services/extensionManagement/common/remoteExtensionManagementService", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/workbench/services/userDataProfile/common/remoteUserDataProfiles", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, extensionManagement_1, extensionManagementUtil_1, log_1, errorMessage_1, arrays_1, cancellation_1, nls_1, productService_1, configuration_1, async_1, extensionManifestPropertiesService_1, files_1, remoteExtensionManagementService_1, userDataProfile_1, userDataProfile_2, remoteUserDataProfiles_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeRemoteExtensionManagementService = void 0;
    let NativeRemoteExtensionManagementService = class NativeRemoteExtensionManagementService extends remoteExtensionManagementService_1.RemoteExtensionManagementService {
        constructor(channel, localExtensionManagementServer, userDataProfileService, userDataProfilesService, remoteUserDataProfilesService, uriIdentityService, logService, galleryService, configurationService, productService, fileService, extensionManifestPropertiesService) {
            super(channel, userDataProfileService, userDataProfilesService, remoteUserDataProfilesService, uriIdentityService);
            this.localExtensionManagementServer = localExtensionManagementServer;
            this.logService = logService;
            this.galleryService = galleryService;
            this.configurationService = configurationService;
            this.productService = productService;
            this.fileService = fileService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
        }
        async install(vsix, options) {
            const local = await super.install(vsix, options);
            await this.installUIDependenciesAndPackedExtensions(local);
            return local;
        }
        async installFromGallery(extension, installOptions) {
            const local = await this.doInstallFromGallery(extension, installOptions);
            await this.installUIDependenciesAndPackedExtensions(local);
            return local;
        }
        async doInstallFromGallery(extension, installOptions) {
            if (this.configurationService.getValue('remote.downloadExtensionsLocally')) {
                return this.downloadAndInstall(extension, installOptions || {});
            }
            try {
                return await super.installFromGallery(extension, installOptions);
            }
            catch (error) {
                switch (error.name) {
                    case extensionManagement_1.ExtensionManagementErrorCode.Download:
                    case extensionManagement_1.ExtensionManagementErrorCode.DownloadSignature:
                    case extensionManagement_1.ExtensionManagementErrorCode.Gallery:
                    case extensionManagement_1.ExtensionManagementErrorCode.Internal:
                    case extensionManagement_1.ExtensionManagementErrorCode.Unknown:
                        try {
                            this.logService.error(`Error while installing '${extension.identifier.id}' extension in the remote server.`, (0, errorMessage_1.toErrorMessage)(error));
                            return await this.downloadAndInstall(extension, installOptions || {});
                        }
                        catch (e) {
                            this.logService.error(e);
                            throw e;
                        }
                    default:
                        this.logService.debug('Remote Install Error Name', error.name);
                        throw error;
                }
            }
        }
        async downloadAndInstall(extension, installOptions) {
            this.logService.info(`Downloading the '${extension.identifier.id}' extension locally and install`);
            const compatible = await this.checkAndGetCompatible(extension, !!installOptions.installPreReleaseVersion);
            installOptions = { ...installOptions, donotIncludePackAndDependencies: true };
            const installed = await this.getInstalled(1 /* ExtensionType.User */, undefined, installOptions.productVersion);
            const workspaceExtensions = await this.getAllWorkspaceDependenciesAndPackedExtensions(compatible, cancellation_1.CancellationToken.None);
            if (workspaceExtensions.length) {
                this.logService.info(`Downloading the workspace dependencies and packed extensions of '${compatible.identifier.id}' locally and install`);
                for (const workspaceExtension of workspaceExtensions) {
                    await this.downloadCompatibleAndInstall(workspaceExtension, installed, installOptions);
                }
            }
            return await this.downloadCompatibleAndInstall(compatible, installed, installOptions);
        }
        async downloadCompatibleAndInstall(extension, installed, installOptions) {
            const compatible = await this.checkAndGetCompatible(extension, !!installOptions.installPreReleaseVersion);
            this.logService.trace('Downloading extension:', compatible.identifier.id);
            const location = await this.localExtensionManagementServer.extensionManagementService.download(compatible, installed.filter(i => (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, compatible.identifier))[0] ? 3 /* InstallOperation.Update */ : 2 /* InstallOperation.Install */, !!installOptions.donotVerifySignature);
            this.logService.info('Downloaded extension:', compatible.identifier.id, location.path);
            try {
                const local = await super.install(location, installOptions);
                this.logService.info(`Successfully installed '${compatible.identifier.id}' extension`);
                return local;
            }
            finally {
                try {
                    await this.fileService.del(location);
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
        }
        async checkAndGetCompatible(extension, includePreRelease) {
            const targetPlatform = await this.getTargetPlatform();
            let compatibleExtension = null;
            if (extension.hasPreReleaseVersion && extension.properties.isPreReleaseVersion !== includePreRelease) {
                compatibleExtension = (await this.galleryService.getExtensions([{ ...extension.identifier, preRelease: includePreRelease }], { targetPlatform, compatible: true }, cancellation_1.CancellationToken.None))[0] || null;
            }
            if (!compatibleExtension && await this.galleryService.isExtensionCompatible(extension, includePreRelease, targetPlatform)) {
                compatibleExtension = extension;
            }
            if (!compatibleExtension) {
                compatibleExtension = await this.galleryService.getCompatibleExtension(extension, includePreRelease, targetPlatform);
            }
            if (!compatibleExtension) {
                /** If no compatible release version is found, check if the extension has a release version or not and throw relevant error */
                if (!includePreRelease && extension.properties.isPreReleaseVersion && (await this.galleryService.getExtensions([extension.identifier], cancellation_1.CancellationToken.None))[0]) {
                    throw new extensionManagement_1.ExtensionManagementError((0, nls_1.localize)('notFoundReleaseExtension', "Can't install release version of '{0}' extension because it has no release version.", extension.identifier.id), extensionManagement_1.ExtensionManagementErrorCode.ReleaseVersionNotFound);
                }
                throw new extensionManagement_1.ExtensionManagementError((0, nls_1.localize)('notFoundCompatibleDependency', "Can't install '{0}' extension because it is not compatible with the current version of {1} (version {2}).", extension.identifier.id, this.productService.nameLong, this.productService.version), extensionManagement_1.ExtensionManagementErrorCode.Incompatible);
            }
            return compatibleExtension;
        }
        async installUIDependenciesAndPackedExtensions(local) {
            const uiExtensions = await this.getAllUIDependenciesAndPackedExtensions(local.manifest, cancellation_1.CancellationToken.None);
            const installed = await this.localExtensionManagementServer.extensionManagementService.getInstalled();
            const toInstall = uiExtensions.filter(e => installed.every(i => !(0, extensionManagementUtil_1.areSameExtensions)(i.identifier, e.identifier)));
            if (toInstall.length) {
                this.logService.info(`Installing UI dependencies and packed extensions of '${local.identifier.id}' locally`);
                await async_1.Promises.settled(toInstall.map(d => this.localExtensionManagementServer.extensionManagementService.installFromGallery(d)));
            }
        }
        async getAllUIDependenciesAndPackedExtensions(manifest, token) {
            const result = new Map();
            const extensions = [...(manifest.extensionPack || []), ...(manifest.extensionDependencies || [])];
            await this.getDependenciesAndPackedExtensionsRecursively(extensions, result, true, token);
            return [...result.values()];
        }
        async getAllWorkspaceDependenciesAndPackedExtensions(extension, token) {
            const result = new Map();
            result.set(extension.identifier.id.toLowerCase(), extension);
            const manifest = await this.galleryService.getManifest(extension, token);
            if (manifest) {
                const extensions = [...(manifest.extensionPack || []), ...(manifest.extensionDependencies || [])];
                await this.getDependenciesAndPackedExtensionsRecursively(extensions, result, false, token);
            }
            result.delete(extension.identifier.id);
            return [...result.values()];
        }
        async getDependenciesAndPackedExtensionsRecursively(toGet, result, uiExtension, token) {
            if (toGet.length === 0) {
                return Promise.resolve();
            }
            const extensions = await this.galleryService.getExtensions(toGet.map(id => ({ id })), token);
            const manifests = await Promise.all(extensions.map(e => this.galleryService.getManifest(e, token)));
            const extensionsManifests = [];
            for (let idx = 0; idx < extensions.length; idx++) {
                const extension = extensions[idx];
                const manifest = manifests[idx];
                if (manifest && this.extensionManifestPropertiesService.prefersExecuteOnUI(manifest) === uiExtension) {
                    result.set(extension.identifier.id.toLowerCase(), extension);
                    extensionsManifests.push(manifest);
                }
            }
            toGet = [];
            for (const extensionManifest of extensionsManifests) {
                if ((0, arrays_1.isNonEmptyArray)(extensionManifest.extensionDependencies)) {
                    for (const id of extensionManifest.extensionDependencies) {
                        if (!result.has(id.toLowerCase())) {
                            toGet.push(id);
                        }
                    }
                }
                if ((0, arrays_1.isNonEmptyArray)(extensionManifest.extensionPack)) {
                    for (const id of extensionManifest.extensionPack) {
                        if (!result.has(id.toLowerCase())) {
                            toGet.push(id);
                        }
                    }
                }
            }
            return this.getDependenciesAndPackedExtensionsRecursively(toGet, result, uiExtension, token);
        }
    };
    exports.NativeRemoteExtensionManagementService = NativeRemoteExtensionManagementService;
    exports.NativeRemoteExtensionManagementService = NativeRemoteExtensionManagementService = __decorate([
        __param(2, userDataProfile_2.IUserDataProfileService),
        __param(3, userDataProfile_1.IUserDataProfilesService),
        __param(4, remoteUserDataProfiles_1.IRemoteUserDataProfilesService),
        __param(5, uriIdentity_1.IUriIdentityService),
        __param(6, log_1.ILogService),
        __param(7, extensionManagement_1.IExtensionGalleryService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, productService_1.IProductService),
        __param(10, files_1.IFileService),
        __param(11, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], NativeRemoteExtensionManagementService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRXh0ZW5zaW9uTWFuYWdlbWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25NYW5hZ2VtZW50L2VsZWN0cm9uLXNhbmRib3gvcmVtb3RlRXh0ZW5zaW9uTWFuYWdlbWVudFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBd0J6RixJQUFNLHNDQUFzQyxHQUE1QyxNQUFNLHNDQUF1QyxTQUFRLG1FQUFnQztRQUUzRixZQUNDLE9BQWlCLEVBQ0EsOEJBQTBELEVBQ2xELHNCQUErQyxFQUM5Qyx1QkFBaUQsRUFDM0MsNkJBQTZELEVBQ3hFLGtCQUF1QyxFQUM5QixVQUF1QixFQUNWLGNBQXdDLEVBQzNDLG9CQUEyQyxFQUNqRCxjQUErQixFQUNsQyxXQUF5QixFQUNGLGtDQUF1RTtZQUU3SCxLQUFLLENBQUMsT0FBTyxFQUFFLHNCQUFzQixFQUFFLHVCQUF1QixFQUFFLDZCQUE2QixFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFabEcsbUNBQThCLEdBQTlCLDhCQUE4QixDQUE0QjtZQUs3QyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ1YsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQzNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDakQsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ2xDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ0YsdUNBQWtDLEdBQWxDLGtDQUFrQyxDQUFxQztRQUc5SCxDQUFDO1FBRVEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFTLEVBQUUsT0FBd0I7WUFDekQsTUFBTSxLQUFLLEdBQUcsTUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNq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