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
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagement", "vs/base/common/uri", "vs/base/common/event", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/log/common/log", "vs/platform/extensionManagement/common/abstractExtensionManagementService", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/product/common/productService", "vs/base/common/types", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/common/arrays", "vs/base/common/strings", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/lifecycle"], function (require, exports, extensions_1, extensionManagement_1, uri_1, event_1, extensionManagementUtil_1, extensionManagement_2, log_1, abstractExtensionManagementService_1, telemetry_1, extensionManifestPropertiesService_1, productService_1, types_1, userDataProfile_1, arrays_1, strings_1, userDataProfile_2, uriIdentity_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebExtensionManagementService = void 0;
    let WebExtensionManagementService = class WebExtensionManagementService extends abstractExtensionManagementService_1.AbstractExtensionManagementService {
        get onProfileAwareInstallExtension() { return super.onInstallExtension; }
        get onInstallExtension() { return event_1.Event.filter(this.onProfileAwareInstallExtension, e => this.filterEvent(e), this.disposables); }
        get onProfileAwareDidInstallExtensions() { return super.onDidInstallExtensions; }
        get onDidInstallExtensions() {
            return event_1.Event.filter(event_1.Event.map(this.onProfileAwareDidInstallExtensions, results => results.filter(e => this.filterEvent(e)), this.disposables), results => results.length > 0, this.disposables);
        }
        get onProfileAwareUninstallExtension() { return super.onUninstallExtension; }
        get onUninstallExtension() { return event_1.Event.filter(this.onProfileAwareUninstallExtension, e => this.filterEvent(e), this.disposables); }
        get onProfileAwareDidUninstallExtension() { return super.onDidUninstallExtension; }
        get onDidUninstallExtension() { return event_1.Event.filter(this.onProfileAwareDidUninstallExtension, e => this.filterEvent(e), this.disposables); }
        constructor(extensionGalleryService, telemetryService, logService, webExtensionsScannerService, extensionManifestPropertiesService, userDataProfileService, productService, userDataProfilesService, uriIdentityService) {
            super(extensionGalleryService, telemetryService, uriIdentityService, logService, productService, userDataProfilesService);
            this.webExtensionsScannerService = webExtensionsScannerService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.userDataProfileService = userDataProfileService;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            this._onDidChangeProfile = this._register(new event_1.Emitter());
            this.onDidChangeProfile = this._onDidChangeProfile.event;
            this._register(userDataProfileService.onDidChangeCurrentProfile(e => {
                if (!this.uriIdentityService.extUri.isEqual(e.previous.extensionsResource, e.profile.extensionsResource)) {
                    e.join(this.whenProfileChanged(e));
                }
            }));
        }
        filterEvent({ profileLocation, applicationScoped }) {
            profileLocation = profileLocation ?? this.userDataProfileService.currentProfile.extensionsResource;
            return applicationScoped || this.uriIdentityService.extUri.isEqual(this.userDataProfileService.currentProfile.extensionsResource, profileLocation);
        }
        async getTargetPlatform() {
            return "web" /* TargetPlatform.WEB */;
        }
        async canInstall(gallery) {
            if (await super.canInstall(gallery)) {
                return true;
            }
            if (this.isConfiguredToExecuteOnWeb(gallery)) {
                return true;
            }
            return false;
        }
        async getInstalled(type, profileLocation) {
            const extensions = [];
            if (type === undefined || type === 0 /* ExtensionType.System */) {
                const systemExtensions = await this.webExtensionsScannerService.scanSystemExtensions();
                extensions.push(...systemExtensions);
            }
            if (type === undefined || type === 1 /* ExtensionType.User */) {
                const userExtensions = await this.webExtensionsScannerService.scanUserExtensions(profileLocation ?? this.userDataProfileService.currentProfile.extensionsResource);
                extensions.push(...userExtensions);
            }
            return extensions.map(e => toLocalExtension(e));
        }
        async install(location, options = {}) {
            this.logService.trace('ExtensionManagementService#install', location.toString());
            const manifest = await this.webExtensionsScannerService.scanExtensionManifest(location);
            if (!manifest || !manifest.name || !manifest.version) {
                throw new Error(`Cannot find a valid extension from the location ${location.toString()}`);
            }
            const result = await this.installExtensions([{ manifest, extension: location, options }]);
            if (result[0]?.local) {
                return result[0]?.local;
            }
            if (result[0]?.error) {
                throw result[0].error;
            }
            throw (0, abstractExtensionManagementService_1.toExtensionManagementError)(new Error(`Unknown error while installing extension ${(0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name)}`));
        }
        installFromLocation(location, profileLocation) {
            return this.install(location, { profileLocation });
        }
        async copyExtension(extension, fromProfileLocation, toProfileLocation, metadata) {
            const target = await this.webExtensionsScannerService.scanExistingExtension(extension.location, extension.type, toProfileLocation);
            const source = await this.webExtensionsScannerService.scanExistingExtension(extension.location, extension.type, fromProfileLocation);
            metadata = { ...source?.metadata, ...metadata };
            let scanned;
            if (target) {
                scanned = await this.webExtensionsScannerService.updateMetadata(extension, { ...target.metadata, ...metadata }, toProfileLocation);
            }
            else {
                scanned = await this.webExtensionsScannerService.addExtension(extension.location, metadata, toProfileLocation);
            }
            return toLocalExtension(scanned);
        }
        async installExtensionsFromProfile(extensions, fromProfileLocation, toProfileLocation) {
            const result = [];
            const extensionsToInstall = (await this.webExtensionsScannerService.scanUserExtensions(fromProfileLocation))
                .filter(e => extensions.some(id => (0, extensionManagementUtil_1.areSameExtensions)(id, e.identifier)));
            if (extensionsToInstall.length) {
                await Promise.allSettled(extensionsToInstall.map(async (e) => {
                    let local = await this.installFromLocation(e.location, toProfileLocation);
                    if (e.metadata) {
                        local = await this.updateMetadata(local, e.metadata, fromProfileLocation);
                    }
                    result.push(local);
                }));
            }
            return result;
        }
        async updateMetadata(local, metadata, profileLocation) {
            // unset if false
            if (metadata.isMachineScoped === false) {
                metadata.isMachineScoped = undefined;
            }
            if (metadata.isBuiltin === false) {
                metadata.isBuiltin = undefined;
            }
            if (metadata.pinned === false) {
                metadata.pinned = undefined;
            }
            const updatedExtension = await this.webExtensionsScannerService.updateMetadata(local, metadata, profileLocation ?? this.userDataProfileService.currentProfile.extensionsResource);
            const updatedLocalExtension = toLocalExtension(updatedExtension);
            this._onDidUpdateExtensionMetadata.fire(updatedLocalExtension);
            return updatedLocalExtension;
        }
        async copyExtensions(fromProfileLocation, toProfileLocation) {
            await this.webExtensionsScannerService.copyExtensions(fromProfileLocation, toProfileLocation, e => !e.metadata?.isApplicationScoped);
        }
        async getCompatibleVersion(extension, sameVersion, includePreRelease, productVersion) {
            const compatibleExtension = await super.getCompatibleVersion(extension, sameVersion, includePreRelease, productVersion);
            if (compatibleExtension) {
                return compatibleExtension;
            }
            if (this.isConfiguredToExecuteOnWeb(extension)) {
                return extension;
            }
            return null;
        }
        isConfiguredToExecuteOnWeb(gallery) {
            const configuredExtensionKind = this.extensionManifestPropertiesService.getUserConfiguredExtensionKind(gallery.identifier);
            return !!configuredExtensionKind && configuredExtensionKind.includes('web');
        }
        getCurrentExtensionsManifestLocation() {
            return this.userDataProfileService.currentProfile.extensionsResource;
        }
        createInstallExtensionTask(manifest, extension, options) {
            return new InstallExtensionTask(manifest, extension, options, this.webExtensionsScannerService, this.userDataProfilesService);
        }
        createUninstallExtensionTask(extension, options) {
            return new UninstallExtensionTask(extension, options, this.webExtensionsScannerService);
        }
        zip(extension) { throw new Error('unsupported'); }
        unzip(zipLocation) { throw new Error('unsupported'); }
        getManifest(vsix) { throw new Error('unsupported'); }
        download() { throw new Error('unsupported'); }
        reinstallFromGallery() { throw new Error('unsupported'); }
        async cleanUp() { }
        async whenProfileChanged(e) {
            const previousProfileLocation = e.previous.extensionsResource;
            const currentProfileLocation = e.profile.extensionsResource;
            if (!previousProfileLocation || !currentProfileLocation) {
                throw new Error('This should not happen');
            }
            const oldExtensions = await this.webExtensionsScannerService.scanUserExtensions(previousProfileLocation);
            const newExtensions = await this.webExtensionsScannerService.scanUserExtensions(currentProfileLocation);
            const { added, removed } = (0, arrays_1.delta)(oldExtensions, newExtensions, (a, b) => (0, strings_1.compare)(`${extensions_1.ExtensionIdentifier.toKey(a.identifier.id)}@${a.manifest.version}`, `${extensions_1.ExtensionIdentifier.toKey(b.identifier.id)}@${b.manifest.version}`));
            this._onDidChangeProfile.fire({ added: added.map(e => toLocalExtension(e)), removed: removed.map(e => toLocalExtension(e)) });
        }
    };
    exports.WebExtensionManagementService = WebExtensionManagementService;
    exports.WebExtensionManagementService = WebExtensionManagementService = __decorate([
        __param(0, extensionManagement_1.IExtensionGalleryService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, log_1.ILogService),
        __param(3, extensionManagement_2.IWebExtensionsScannerService),
        __param(4, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(5, userDataProfile_1.IUserDataProfileService),
        __param(6, productService_1.IProductService),
        __param(7, userDataProfile_2.IUserDataProfilesService),
        __param(8, uriIdentity_1.IUriIdentityService)
    ], WebExtensionManagementService);
    function toLocalExtension(extension) {
        const metadata = getMetadata(undefined, extension);
        return {
            ...extension,
            identifier: { id: extension.identifier.id, uuid: metadata.id ?? extension.identifier.uuid },
            isMachineScoped: !!metadata.isMachineScoped,
            isApplicationScoped: !!metadata.isApplicationScoped,
            publisherId: metadata.publisherId || null,
            publisherDisplayName: metadata.publisherDisplayName || null,
            installedTimestamp: metadata.installedTimestamp,
            isPreReleaseVersion: !!metadata.isPreReleaseVersion,
            hasPreReleaseVersion: !!metadata.hasPreReleaseVersion,
            preRelease: !!metadata.preRelease,
            targetPlatform: "web" /* TargetPlatform.WEB */,
            updated: !!metadata.updated,
            pinned: !!metadata?.pinned,
            isWorkspaceScoped: false,
            source: metadata?.source ?? (extension.identifier.uuid ? 'gallery' : 'resource')
        };
    }
    function getMetadata(options, existingExtension) {
        const metadata = { ...(existingExtension?.metadata || {}) };
        metadata.isMachineScoped = options?.isMachineScoped || metadata.isMachineScoped;
        return metadata;
    }
    class InstallExtensionTask extends abstractExtensionManagementService_1.AbstractExtensionTask {
        get profileLocation() { return this._profileLocation; }
        get operation() { return (0, types_1.isUndefined)(this.options.operation) ? this._operation : this.options.operation; }
        constructor(manifest, extension, options, webExtensionsScannerService, userDataProfilesService) {
            super();
            this.extension = extension;
            this.options = options;
            this.webExtensionsScannerService = webExtensionsScannerService;
            this.userDataProfilesService = userDataProfilesService;
            this._profileLocation = this.options.profileLocation;
            this._operation = 2 /* InstallOperation.Install */;
            this.identifier = uri_1.URI.isUri(extension) ? { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name) } : extension.identifier;
            this.source = extension;
        }
        async doRun(token) {
            const userExtensions = await this.webExtensionsScannerService.scanUserExtensions(this.options.profileLocation);
            const existingExtension = userExtensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, this.identifier));
            if (existingExtension) {
                this._operation = 3 /* InstallOperation.Update */;
            }
            const metadata = getMetadata(this.options, existingExtension);
            if (!uri_1.URI.isUri(this.extension)) {
                metadata.id = this.extension.identifier.uuid;
                metadata.publisherDisplayName = this.extension.publisherDisplayName;
                metadata.publisherId = this.extension.publisherId;
                metadata.installedTimestamp = Date.now();
                metadata.isPreReleaseVersion = this.extension.properties.isPreReleaseVersion;
                metadata.hasPreReleaseVersion = metadata.hasPreReleaseVersion || this.extension.properties.isPreReleaseVersion;
                metadata.isBuiltin = this.options.isBuiltin || existingExtension?.isBuiltin;
                metadata.isSystem = existingExtension?.type === 0 /* ExtensionType.System */ ? true : undefined;
                metadata.updated = !!existingExtension;
                metadata.isApplicationScoped = this.options.isApplicationScoped || metadata.isApplicationScoped;
                metadata.preRelease = (0, types_1.isBoolean)(this.options.preRelease)
                    ? this.options.preRelease
                    : this.options.installPreReleaseVersion || this.extension.properties.isPreReleaseVersion || metadata.preRelease;
                metadata.source = uri_1.URI.isUri(this.extension) ? 'resource' : 'gallery';
            }
            metadata.pinned = this.options.installGivenVersion ? true : (this.options.pinned ?? metadata.pinned);
            this._profileLocation = metadata.isApplicationScoped ? this.userDataProfilesService.defaultProfile.extensionsResource : this.options.profileLocation;
            const scannedExtension = uri_1.URI.isUri(this.extension) ? await this.webExtensionsScannerService.addExtension(this.extension, metadata, this.profileLocation)
                : await this.webExtensionsScannerService.addExtensionFromGallery(this.extension, metadata, this.profileLocation);
            return toLocalExtension(scannedExtension);
        }
    }
    class UninstallExtensionTask extends abstractExtensionManagementService_1.AbstractExtensionTask {
        constructor(extension, options, webExtensionsScannerService) {
            super();
            this.extension = extension;
            this.options = options;
            this.webExtensionsScannerService = webExtensionsScannerService;
        }
        doRun(token) {
            return this.webExtensionsScannerService.removeExtension(this.extension, this.options.profileLocation);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViRXh0ZW5zaW9uTWFuYWdlbWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25NYW5hZ2VtZW50L2NvbW1vbi93ZWJFeHRlbnNpb25NYW5hZ2VtZW50U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzQnpGLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQThCLFNBQVEsdUVBQWtDO1FBTXBGLElBQUksOEJBQThCLEtBQUssT0FBTyxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1FBQ3pFLElBQWEsa0JBQWtCLEtBQUssT0FBTyxhQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyw4QkFBOEIsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUUzSSxJQUFJLGtDQUFrQyxLQUFLLE9BQU8sS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztRQUNqRixJQUFhLHNCQUFzQjtZQUNsQyxPQUFPLGFBQUssQ0FBQyxNQUFNLENBQ2xCLGFBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGtDQUFrQyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQ3pILE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ25E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