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
define(["require", "exports", "vs/nls", "vs/base/common/semver/semver", "vs/base/common/event", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/paging", "vs/platform/telemetry/common/telemetry", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/workbench/services/host/browser/host", "vs/base/common/uri", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/editor/common/editorService", "vs/platform/url/common/url", "vs/workbench/contrib/extensions/common/extensionsInput", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/platform/notification/common/notification", "vs/base/common/resources", "vs/base/common/cancellation", "vs/platform/storage/common/storage", "vs/platform/files/common/files", "vs/platform/extensions/common/extensions", "vs/editor/common/languages/language", "vs/platform/product/common/productService", "vs/base/common/network", "vs/platform/userDataSync/common/ignoredExtensions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/contextkey/common/contextkey", "vs/base/common/types", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/services/extensions/common/extensions", "vs/base/common/platform", "vs/platform/languagePacks/common/languagePacks", "vs/workbench/services/localization/common/locale", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/browser/window", "vs/platform/dialogs/common/dialogs", "vs/platform/update/common/update", "vs/platform/extensions/common/extensionValidator", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, nls, semver, event_1, arrays_1, async_1, errors_1, lifecycle_1, paging_1, telemetry_1, extensionManagement_1, extensionManagement_2, extensionManagementUtil_1, instantiation_1, configuration_1, host_1, uri_1, extensions_1, editorService_1, url_1, extensionsInput_1, log_1, progress_1, notification_1, resources, cancellation_1, storage_1, files_1, extensions_2, language_1, productService_1, network_1, ignoredExtensions_1, userDataSync_1, contextkey_1, types_1, extensionManifestPropertiesService_1, extensions_3, platform_1, languagePacks_1, locale_1, telemetryUtils_1, lifecycle_2, userDataProfile_1, window_1, dialogs_1, update_1, extensionValidator_1, uriIdentity_1) {
    "use strict";
    var Extensions_1, ExtensionsWorkbenchService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsWorkbenchService = exports.Extension = void 0;
    let Extension = class Extension {
        constructor(stateProvider, runtimeStateProvider, server, local, gallery, resourceExtensionInfo, galleryService, telemetryService, logService, fileService, productService) {
            this.stateProvider = stateProvider;
            this.runtimeStateProvider = runtimeStateProvider;
            this.server = server;
            this.local = local;
            this.gallery = gallery;
            this.resourceExtensionInfo = resourceExtensionInfo;
            this.galleryService = galleryService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.fileService = fileService;
            this.productService = productService;
            this.enablementState = 8 /* EnablementState.EnabledGlobally */;
            this.isMalicious = false;
            this.resourceExtension = resourceExtensionInfo?.resourceExtension;
        }
        get type() {
            return this.local ? this.local.type : 1 /* ExtensionType.User */;
        }
        get isBuiltin() {
            return this.local ? this.local.isBuiltin : false;
        }
        get isWorkspaceScoped() {
            if (this.local) {
                return this.local.isWorkspaceScoped;
            }
            if (this.resourceExtensionInfo) {
                return this.resourceExtensionInfo.isWorkspaceScoped;
            }
            return false;
        }
        get name() {
            if (this.gallery) {
                return this.gallery.name;
            }
            return this.getManifestFromLocalOrResource()?.name ?? '';
        }
        get displayName() {
            if (this.gallery) {
                return this.gallery.displayName || this.gallery.name;
            }
            return this.getManifestFromLocalOrResource()?.displayName ?? this.name;
        }
        get identifier() {
            if (this.gallery) {
                return this.gallery.identifier;
            }
            if (this.resourceExtension) {
                return this.resourceExtension.identifier;
            }
            return this.local.identifier;
        }
        get uuid() {
            return this.gallery ? this.gallery.identifier.uuid : this.local?.identifier.uuid;
        }
        get publisher() {
            if (this.gallery) {
                return this.gallery.publisher;
            }
            return this.getManifestFromLocalOrResource()?.publisher ?? '';
        }
        get publisherDisplayName() {
            if (this.gallery) {
                return this.gallery.publisherDisplayName || this.gallery.publisher;
            }
            if (this.local?.publisherDisplayName) {
                return this.local.publisherDisplayName;
            }
            return this.publisher;
        }
        get publisherUrl() {
            if (!this.productService.extensionsGallery || !this.gallery) {
                return undefined;
            }
            return resources.joinPath(uri_1.URI.parse(this.productService.extensionsGallery.publisherUrl), this.publisher);
        }
        get publisherDomain() {
            return this.gallery?.publisherDomain;
        }
        get publisherSponsorLink() {
            return this.gallery?.publisherSponsorLink ? uri_1.URI.parse(this.gallery.publisherSponsorLink) : undefined;
        }
        get version() {
            return this.local ? this.local.manifest.version : this.latestVersion;
        }
        get pinned() {
            return !!this.local?.pinned;
        }
        get latestVersion() {
            return this.gallery ? this.gallery.version : this.getManifestFromLocalOrResource()?.version ?? '';
        }
        get description() {
            return this.gallery ? this.gallery.description : this.getManifestFromLocalOrResource()?.description ?? '';
        }
        get url() {
            if (!this.productService.extensionsGallery || !this.gallery) {
                return undefined;
            }
            return `${this.productService.extensionsGallery.itemUrl}?itemName=${this.publisher}.${this.name}`;
        }
        get iconUrl() {
            return this.galleryIconUrl || this.resourceExtensionIconUrl || this.localIconUrl || this.defaultIconUrl;
        }
        get iconUrlFallback() {
            return this.galleryIconUrlFallback || this.resourceExtensionIconUrl || this.localIconUrl || this.defaultIconUrl;
        }
        get localIconUrl() {
            if (this.local && this.local.manifest.icon) {
                return network_1.FileAccess.uriToBrowserUri(resources.joinPath(this.local.location, this.local.manifest.icon)).toString(true);
            }
            return null;
        }
        get resourceExtensionIconUrl() {
            if (this.resourceExtension?.manifest.icon) {
                return network_1.FileAccess.uriToBrowserUri(resources.joinPath(this.resourceExtension.location, this.resourceExtension.manifest.icon)).toString(true);
            }
            return null;
        }
        get galleryIconUrl() {
            return this.gallery?.assets.icon ? this.gallery.assets.icon.uri : null;
        }
        get galleryIconUrlFallback() {
            return this.gallery?.assets.icon ? this.gallery.assets.icon.fallbackUri : null;
        }
        get defaultIconUrl() {
            if (this.type === 0 /* ExtensionType.System */ && this.local) {
                if (this.local.manifest && this.local.manifest.contributes) {
                    if (Array.isArray(this.local.manifest.contributes.themes) && this.local.manifest.contributes.themes.length) {
                        return network_1.FileAccess.asBrowserUri('vs/workbench/contrib/extensions/browser/media/theme-icon.png').toString(true);
                    }
                    if (Array.isArray(this.local.manifest.contributes.grammars) && this.local.manifest.contributes.grammars.length) {
                        return network_1.FileAccess.asBrowserUri('vs/workbench/contrib/extensions/browser/media/language-icon.svg').toString(true);
                    }
                }
            }
            return extensionManagement_2.DefaultIconPath;
        }
        get repository() {
            return this.gallery && this.gallery.assets.repository ? this.gallery.assets.repository.uri : undefined;
        }
        get licenseUrl() {
            return this.gallery && this.gallery.assets.license ? this.gallery.assets.license.uri : undefined;
        }
        get supportUrl() {
            return this.gallery && this.gallery.supportLink ? this.gallery.supportLink : undefined;
        }
        get state() {
            return this.stateProvider(this);
        }
        get installCount() {
            return this.gallery ? this.gallery.installCount : undefined;
        }
        get rating() {
            return this.gallery ? this.gallery.rating : undefined;
        }
        get ratingCount() {
            return this.gallery ? this.gallery.ratingCount : undefined;
        }
        get outdated() {
            try {
                if (!this.gallery || !this.local) {
                    return false;
                }
                // Do not allow updating system extensions in stable
                if (this.type === 0 /* ExtensionType.System */ && this.productService.quality === 'stable') {
                    return false;
                }
                if (!this.local.preRelease && this.gallery.properties.isPreReleaseVersion) {
                    return false;
                }
                if (semver.gt(this.latestVersion, this.version)) {
                    return true;
                }
                if (this.outdatedTargetPlatform) {
                    return true;
                }
            }
            catch (error) {
                /* Ignore */
            }
            return false;
        }
        get outdatedTargetPlatform() {
            return !!this.local && !!this.gallery
                && !["undefined" /* TargetPlatform.UNDEFINED */, "web" /* TargetPlatform.WEB */].includes(this.local.targetPlatform)
                && this.gallery.properties.targetPlatform !== "web" /* TargetPlatform.WEB */
                && this.local.targetPlatform !== this.gallery.properties.targetPlatform
                && semver.eq(this.latestVersion, this.version);
        }
        get runtimeState() {
            return this.runtimeStateProvider(this);
        }
        get telemetryData() {
            const { local, gallery } = this;
            if (gallery) {
                return (0, extensionManagementUtil_1.getGalleryExtensionTelemetryData)(gallery);
            }
            else if (local) {
                return (0, extensionManagementUtil_1.getLocalExtensionTelemetryData)(local);
            }
            else {
                return {};
            }
        }
        get preview() {
            return this.local?.manifest.preview ?? this.gallery?.preview ?? false;
        }
        get preRelease() {
            return !!this.local?.preRelease;
        }
        get isPreReleaseVersion() {
            if (this.local) {
                return this.local.isPreReleaseVersion;
            }
            return !!this.gallery?.properties.isPreReleaseVersion;
        }
        get hasPreReleaseVersion() {
            return !!this.gallery?.hasPreReleaseVersion || !!this.local?.hasPreReleaseVersion;
        }
        get hasReleaseVersion() {
            return !!this.resourceExtension || !!this.gallery?.hasReleaseVersion;
        }
        getLocal() {
            return this.local && !this.outdated ? this.local : undefined;
        }
        async getManifest(token) {
            const local = this.getLocal();
            if (local) {
                return local.manifest;
            }
            if (this.gallery) {
                if (this.gallery.assets.manifest) {
                    return this.galleryService.getManifest(this.gallery, token);
                }
                this.logService.error(nls.localize('Manifest is not found', "Manifest is not found"), this.identifier.id);
                return null;
            }
            if (this.resourceExtension) {
                return this.resourceExtension.manifest;
            }
            return null;
        }
        hasReadme() {
            if (this.local && this.local.readmeUrl) {
                return true;
            }
            if (this.gallery && this.gallery.assets.readme) {
                return true;
            }
            if (this.resourceExtension?.readmeUri) {
                return true;
            }
            return this.type === 0 /* ExtensionType.System */;
        }
        async getReadme(token) {
            const local = this.getLocal();
            if (local?.readmeUrl) {
                const content = await this.fileService.readFile(local.readmeUrl);
                return content.value.toString();
            }
            if (this.gallery) {
                if (this.gallery.assets.readme) {
                    return this.galleryService.getReadme(this.gallery, token);
                }
                this.telemetryService.publicLog('extensions:NotFoundReadMe', this.telemetryData);
            }
            if (this.type === 0 /* ExtensionType.System */) {
                return Promise.resolve(`# ${this.displayName || this.name}
**Notice:** This extension is bundled with Visual Studio Code. It can be disabled but not uninstalled.
## Features
${this.description}
`);
            }
            if (this.resourceExtension?.readmeUri) {
                const content = await this.fileService.readFile(this.resourceExtension?.readmeUri);
                return content.value.toString();
            }
            return Promise.reject(new Error('not available'));
        }
        hasChangelog() {
            if (this.local && this.local.changelogUrl) {
                return true;
            }
            if (this.gallery && this.gallery.assets.changelog) {
                return true;
            }
            return this.type === 0 /* ExtensionType.System */;
        }
        async getChangelog(token) {
            const local = this.getLocal();
            if (local?.changelogUrl) {
                const content = await this.fileService.readFile(local.changelogUrl);
                return content.value.toString();
            }
            if (this.gallery?.assets.changelog) {
                return this.galleryService.getChangelog(this.gallery, token);
            }
            if (this.type === 0 /* ExtensionType.System */) {
                return Promise.resolve('Please check the [VS Code Release Notes](command:update.showCurrentReleaseNotes) for changes to the built-in extensions.');
            }
            return Promise.reject(new Error('not available'));
        }
        get categories() {
            const { local, gallery, resourceExtension } = this;
            if (local && local.manifest.categories && !this.outdated) {
                return local.manifest.categories;
            }
            if (gallery) {
                return gallery.categories;
            }
            if (resourceExtension) {
                return resourceExtension.manifest.categories ?? [];
            }
            return [];
        }
        get tags() {
            const { gallery } = this;
            if (gallery) {
                return gallery.tags.filter(tag => !tag.startsWith('_'));
            }
            return [];
        }
        get dependencies() {
            const { local, gallery, resourceExtension } = this;
            if (local && local.manifest.extensionDependencies && !this.outdated) {
                return local.manifest.extensionDependencies;
            }
            if (gallery) {
                return gallery.properties.dependencies || [];
            }
            if (resourceExtension) {
                return resourceExtension.manifest.extensionDependencies || [];
            }
            return [];
        }
        get extensionPack() {
            const { local, gallery, resourceExtension } = this;
            if (local && local.manifest.extensionPack && !this.outdated) {
                return local.manifest.extensionPack;
            }
            if (gallery) {
                return gallery.properties.extensionPack || [];
            }
            if (resourceExtension) {
                return resourceExtension.manifest.extensionPack || [];
            }
            return [];
        }
        getManifestFromLocalOrResource() {
            if (this.local) {
                return this.local.manifest;
            }
            if (this.resourceExtension) {
                return this.resourceExtension.manifest;
            }
            return null;
        }
    };
    exports.Extension = Extension;
    exports.Extension = Extension = __decorate([
        __param(6, extensionManagement_1.IExtensionGalleryService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, log_1.ILogService),
        __param(9, files_1.IFileService),
        __param(10, productService_1.IProductService)
    ], Extension);
    const EXTENSIONS_AUTO_UPDATE_KEY = 'extensions.autoUpdate';
    let Extensions = Extensions_1 = class Extensions extends lifecycle_1.Disposable {
        static updateExtensionFromControlManifest(extension, extensionsControlManifest) {
            extension.isMalicious = extensionsControlManifest.malicious.some(identifier => (0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, identifier));
            extension.deprecationInfo = extensionsControlManifest.deprecated ? extensionsControlManifest.deprecated[extension.identifier.id.toLowerCase()] : undefined;
        }
        get onChange() { return this._onChange.event; }
        get onReset() { return this._onReset.event; }
        constructor(server, stateProvider, runtimeStateProvider, isWorkspaceServer, galleryService, extensionEnablementService, workbenchExtensionManagementService, telemetryService, instantiationService) {
            super();
            this.server = server;
            this.stateProvider = stateProvider;
            this.runtimeStateProvider = runtimeStateProvider;
            this.isWorkspaceServer = isWorkspaceServer;
            this.galleryService = galleryService;
            this.extensionEnablementService = extensionEnablementService;
            this.workbenchExtensionManagementService = workbenchExtensionManagementService;
            this.telemetryService = telemetryService;
            this.instantiationService = instantiationService;
            this._onChange = this._register(new event_1.Emitter());
            this._onReset = this._register(new event_1.Emitter());
            this.installing = [];
            this.uninstalling = [];
            this.installed = [];
            this._register(server.extensionManagementService.onInstallExtension(e => this.onInstallExtension(e)));
            this._register(server.extensionManagementService.onDidInstallExtensions(e => this.onDidInstallExtensions(e)));
            this._register(server.extensionManagementService.onUninstallExtension(e => this.onUninstallExtension(e.identifier)));
            this._register(server.extensionManagementService.onDidUninstallExtension(e => this.onDidUninstallExtension(e)));
            this._register(server.extensionManagementService.onDidUpdateExtensionMetadata(e => this.onDidUpdateExtensionMetadata(e)));
            this._register(server.extensionManagementService.onDidChangeProfile(() => this.reset()));
            this._register(extensionEnablementService.onEnablementChanged(e => this.onEnablementChanged(e)));
            this._register(event_1.Event.any(this.onChange, this.onReset)(() => this._local = undefined));
            if (this.isWorkspaceServer) {
                this._register(this.workbenchExtensionManagementService.onInstallExtension(e => {
                    if (e.workspaceScoped) {
                        this.onInstallExtension(e);
                    }
                }));
                this._register(this.workbenchExtensionManagementService.onDidInstallExtensions(e => {
                    const result = e.filter(e => e.workspaceScoped);
                    if (result.length) {
                        this.onDidInstallExtensions(result);
                    }
                }));
                this._register(this.workbenchExtensionManagementService.onUninstallExtension(e => {
                    if (e.workspaceScoped) {
                        this.onUninstallExtension(e.identifier);
                    }
                }));
                this._register(this.workbenchExtensionManagementService.onDidUninstallExtension(e => {
                    if (e.workspaceScoped) {
                        this.onDidUninstallExtension(e);
                    }
                }));
            }
        }
        get local() {
            if (!this._local) {
                this._local = [];
                for (const extension of this.installed) {
                    this._local.push(extension);
                }
                for (const extension of this.installing) {
                    if (!this.installed.some(installed => (0, extensionManagementUtil_1.areSameExtensions)(installed.identifier, extension.identifier))) {
                        this._local.push(extension);
                    }
                }
            }
            return this._local;
        }
        async queryInstalled(productVersion) {
            await this.fetchInstalledExtensions(productVersion);
            this._onChange.fire(undefined);
            return this.local;
        }
        async syncInstalledExtensionsWithGallery(galleryExtensions, productVersion) {
            const extensions = await this.mapInstalledExtensionWithCompatibleGalleryExtension(galleryExtensions, productVersion);
            for (const [extension, gallery] of extensions) {
                // update metadata of the extension if it does not exist
                if (extension.local && !extension.local.identifier.uuid) {
                    extension.local = await this.updateMetadata(extension.local, gallery);
                }
                if (!extension.gallery || extension.gallery.version !== gallery.version || extension.gallery.properties.targetPlatform !== gallery.properties.targetPlatform) {
                    extension.gallery = gallery;
                    this._onChange.fire({ extension });
                }
            }
        }
        async mapInstalledExtensionWithCompatibleGalleryExtension(galleryExtensions, productVersion) {
            const mappedExtensions = this.mapInstalledExtensionWithGalleryExtension(galleryExtensions);
            const targetPlatform = await this.server.extensionManagementService.getTargetPlatform();
            const compatibleGalleryExtensions = [];
            const compatibleGalleryExtensionsToFetch = [];
            await Promise.allSettled(mappedExtensions.map(async ([extension, gallery]) => {
                if (extension.local) {
                    if (await this.galleryService.isExtensionCompatible(gallery, extension.local.preRelease, targetPlatform, productVersion)) {
                        compatibleGalleryExtensions.push(gallery);
                    }
                    else {
                        compatibleGalleryExtensionsToFetch.push({ ...extension.local.identifier, preRelease: extension.local.preRelease });
                    }
                }
            }));
            if (compatibleGalleryExtensionsToFetch.length) {
                const result = await this.galleryService.getExtensions(compatibleGalleryExtensionsToFetch, { targetPlatform, compatible: true, queryAllVersions: true, productVersion }, cancellation_1.CancellationToken.None);
                compatibleGalleryExtensions.push(...result);
            }
            return this.mapInstalledExtensionWithGalleryExtension(compatibleGalleryExtensions);
        }
        mapInstalledExtensionWithGalleryExtension(galleryExtensions) {
            const mappedExtensions = [];
            const byUUID = new Map(), byID = new Map();
            for (const gallery of galleryExtensions) {
                byUUID.set(gallery.identifier.uuid, gallery);
                byID.set(gallery.identifier.id.toLowerCase(), gallery);
            }
            for (const installed of this.installed) {
                if (installed.uuid) {
                    const gallery = byUUID.get(installed.uuid);
                    if (gallery) {
                        mappedExtensions.push([installed, gallery]);
                        continue;
                    }
                }
                if (installed.local?.source !== 'resource') {
                    const gallery = byID.get(installed.identifier.id.toLowerCase());
                    if (gallery) {
                        mappedExtensions.push([installed, gallery]);
                    }
                }
            }
            return mappedExtensions;
        }
        async updateMetadata(localExtension, gallery) {
            let isPreReleaseVersion = false;
            if (localExtension.manifest.version !== gallery.version) {
                this.telemetryService.publicLog2('galleryService:updateMetadata');
                const galleryWithLocalVersion = (await this.galleryService.getExtensions([{ ...localExtension.identifier, version: localExtension.manifest.version }], cancellation_1.CancellationToken.None))[0];
                isPreReleaseVersion = !!galleryWithLocalVersion?.properties?.isPreReleaseVersion;
            }
            return this.server.extensionManagementService.updateMetadata(localExtension, { id: gallery.identifier.uuid, publisherDisplayName: gallery.publisherDisplayName, publisherId: gallery.publisherId, isPreReleaseVersion });
        }
        canInstall(galleryExtension) {
            return this.server.extensionManagementService.canInstall(galleryExtension);
        }
        onInstallExtension(event) {
            const { source } = event;
            if (source && !uri_1.URI.isUri(source)) {
                const extension = this.installed.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, source.identifier))
                    ?? this.instantiationService.createInstance(Extension, this.stateProvider, this.runtimeStateProvider, this.server, undefined, source, undefined);
                this.installing.push(extension);
                this._onChange.fire({ extension });
            }
        }
        async fetchInstalledExtensions(productVersion) {
            const extensionsControlManifest = await this.server.extensionManagementService.getExtensionsControlManifest();
            const all = await this.server.extensionManagementService.getInstalled(undefined, undefined, productVersion);
            if (this.isWorkspaceServer) {
                all.push(...await this.workbenchExtensionManagementService.getInstalledWorkspaceExtensions(true));
            }
            // dedup user and system extensions by giving priority to user extensions.
            const installed = (0, extensionManagementUtil_1.groupByExtension)(all, r => r.identifier).reduce((result, extensions) => {
                const extension = extensions.length === 1 ? extensions[0]
                    : extensions.find(e => e.type === 1 /* ExtensionType.User */) || extensions.find(e => e.type === 0 /* ExtensionType.System */);
                result.push(extension);
                return result;
            }, []);
            const byId = (0, arrays_1.index)(this.installed, e => e.local ? e.local.identifier.id : e.identifier.id);
            this.installed = installed.map(local => {
                const extension = byId[local.identifier.id] || this.instantiationService.createInstance(Extension, this.stateProvider, this.runtimeStateProvider, this.server, local, undefined, undefined);
                extension.local = local;
                extension.enablementState = this.extensionEnablementService.getEnablementState(local);
                Extensions_1.updateExtensionFromControlManifest(extension, extensionsControlManifest);
                return extension;
            });
        }
        async reset() {
            this.installed = [];
            this.installing = [];
            this.uninstalling = [];
            await this.fetchInstalledExtensions();
            this._onReset.fire();
        }
        async onDidInstallExtensions(results) {
            for (const event of results) {
                const { local, source } = event;
                const gallery = source && !uri_1.URI.isUri(source) ? source : undefined;
                const location = source && uri_1.URI.isUri(source) ? source : undefined;
                const installingExtension = gallery ? this.installing.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, gallery.identifier))[0] : null;
                this.installing = installingExtension ? this.installing.filter(e => e !== installingExtension) : this.installing;
                let extension = installingExtension ? installingExtension
                    : (location || local) ? this.instantiationService.createInstance(Extension, this.stateProvider, this.runtimeStateProvider, this.server, local, undefined, undefined)
                        : undefined;
                if (extension) {
                    if (local) {
                        const installed = this.installed.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier))[0];
                        if (installed) {
                            extension = installed;
                        }
                        else {
                            this.installed.push(extension);
                        }
                        extension.local = local;
                        if (!extension.gallery) {
                            extension.gallery = gallery;
                        }
                        Extensions_1.updateExtensionFromControlManifest(extension, await this.server.extensionManagementService.getExtensionsControlManifest());
                        extension.enablementState = this.extensionEnablementService.getEnablementState(local);
                    }
                }
                this._onChange.fire(!local || !extension ? undefined : { extension, operation: event.operation });
                if (extension && extension.local && !extension.gallery && extension.local.source !== 'resource') {
                    await this.syncInstalledExtensionWithGallery(extension);
                }
            }
        }
        async onDidUpdateExtensionMetadata(local) {
            const extension = this.installed.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, local.identifier));
            if (extension?.local) {
                const hasChanged = extension.local.pinned !== local.pinned
                    || extension.local.preRelease !== local.preRelease;
                extension.local = local;
                if (hasChanged) {
                    this._onChange.fire({ extension });
                }
            }
        }
        async syncInstalledExtensionWithGallery(extension) {
            if (!this.galleryService.isEnabled()) {
                return;
            }
            this.telemetryService.publicLog2('galleryService:matchInstalledExtension');
            const [compatible] = await this.galleryService.getExtensions([{ ...extension.identifier, preRelease: extension.local?.preRelease }], { compatible: true, targetPlatform: await this.server.extensionManagementService.getTargetPlatform() }, cancellation_1.CancellationToken.None);
            if (compatible) {
                extension.gallery = compatible;
                this._onChange.fire({ extension });
            }
        }
        onUninstallExtension(identifier) {
            const extension = this.installed.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier))[0];
            if (extension) {
                const uninstalling = this.uninstalling.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier))[0] || extension;
                this.uninstalling = [uninstalling, ...this.uninstalling.filter(e => !(0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier))];
                this._onChange.fire(uninstalling ? { extension: uninstalling } : undefined);
            }
        }
        onDidUninstallExtension({ identifier, error }) {
            const uninstalled = this.uninstalling.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier)) || this.installed.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier));
            this.uninstalling = this.uninstalling.filter(e => !(0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier));
            if (!error) {
                this.installed = this.installed.filter(e => !(0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier));
            }
            if (uninstalled) {
                this._onChange.fire({ extension: uninstalled });
            }
        }
        onEnablementChanged(platformExtensions) {
            const extensions = this.local.filter(e => platformExtensions.some(p => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, p.identifier)));
            for (const extension of extensions) {
                if (extension.local) {
                    const enablementState = this.extensionEnablementService.getEnablementState(extension.local);
                    if (enablementState !== extension.enablementState) {
                        extension.enablementState = enablementState;
                        this._onChange.fire({ extension: extension });
                    }
                }
            }
        }
        getExtensionState(extension) {
            if (extension.gallery && this.installing.some(e => !!e.gallery && (0, extensionManagementUtil_1.areSameExtensions)(e.gallery.identifier, extension.gallery.identifier))) {
                return 0 /* ExtensionState.Installing */;
            }
            if (this.uninstalling.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier))) {
                return 2 /* ExtensionState.Uninstalling */;
            }
            const local = this.installed.filter(e => e === extension || (e.gallery && extension.gallery && (0, extensionManagementUtil_1.areSameExtensions)(e.gallery.identifier, extension.gallery.identifier)))[0];
            return local ? 1 /* ExtensionState.Installed */ : 3 /* ExtensionState.Uninstalled */;
        }
    };
    Extensions = Extensions_1 = __decorate([
        __param(4, extensionManagement_1.IExtensionGalleryService),
        __param(5, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(6, extensionManagement_2.IWorkbenchExtensionManagementService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, instantiation_1.IInstantiationService)
    ], Extensions);
    let ExtensionsWorkbenchService = class ExtensionsWorkbenchService extends lifecycle_1.Disposable {
        static { ExtensionsWorkbenchService_1 = this; }
        static { this.UpdatesCheckInterval = 1000 * 60 * 60 * 12; } // 12 hours
        get onChange() { return this._onChange.event; }
        get onReset() { return this._onReset.event; }
        constructor(instantiationService, editorService, extensionManagementService, galleryService, configurationService, telemetryService, notificationService, urlService, extensionEnablementService, hostService, progressService, extensionManagementServerService, languageService, extensionsSyncManagementService, userDataAutoSyncService, productService, contextKeyService, extensionManifestPropertiesService, logService, extensionService, localeService, lifecycleService, fileService, userDataProfileService, storageService, dialogService, userDataSyncEnablementService, updateService, uriIdentityService) {
            super();
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.extensionManagementService = extensionManagementService;
            this.galleryService = galleryService;
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.extensionEnablementService = extensionEnablementService;
            this.hostService = hostService;
            this.progressService = progressService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.languageService = languageService;
            this.extensionsSyncManagementService = extensionsSyncManagementService;
            this.userDataAutoSyncService = userDataAutoSyncService;
            this.productService = productService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.logService = logService;
            this.extensionService = extensionService;
            this.localeService = localeService;
            this.lifecycleService = lifecycleService;
            this.fileService = fileService;
            this.userDataProfileService = userDataProfileService;
            this.storageService = storageService;
            this.dialogService = dialogService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.updateService = updateService;
            this.uriIdentityService = uriIdentityService;
            this.localExtensions = null;
            this.remoteExtensions = null;
            this.webExtensions = null;
            this.extensionsServers = [];
            this._onChange = new event_1.Emitter();
            this._onReset = new event_1.Emitter();
            this.preferPreReleases = this.productService.quality !== 'stable';
            this.installing = [];
            this.tasksInProgress = [];
            const preferPreReleasesValue = configurationService.getValue('_extensions.preferPreReleases');
            if (!(0, types_1.isUndefined)(preferPreReleasesValue)) {
                this.preferPreReleases = !!preferPreReleasesValue;
            }
            this.hasOutdatedExtensionsContextKey = extensions_1.HasOutdatedExtensionsContext.bindTo(contextKeyService);
            if (extensionManagementServerService.localExtensionManagementServer) {
                this.localExtensions = this._register(instantiationService.createInstance(Extensions, extensionManagementServerService.localExtensionManagementServer, ext => this.getExtensionState(ext), ext => this.getRuntimeState(ext), !extensionManagementServerService.remoteExtensionManagementServer));
                this._register(this.localExtensions.onChange(e => this.onDidChangeExtensions(e?.extension)));
                this._register(this.localExtensions.onReset(e => this.reset()));
                this.extensionsServers.push(this.localExtensions);
            }
            if (extensionManagementServerService.remoteExtensionManagementServer) {
                this.remoteExtensions = this._register(instantiationService.createInstance(Extensions, extensionManagementServerService.remoteExtensionManagementServer, ext => this.getExtensionState(ext), ext => this.getRuntimeState(ext), true));
                this._register(this.remoteExtensions.onChange(e => this.onDidChangeExtensions(e?.extension)));
                this._register(this.remoteExtensions.onReset(e => this.reset()));
                this.extensionsServers.push(this.remoteExtensions);
            }
            if (extensionManagementServerService.webExtensionManagementServer) {
                this.webExtensions = this._register(instantiationService.createInstance(Extensions, extensionManagementServerService.webExtensionManagementServer, ext => this.getExtensionState(ext), ext => this.getRuntimeState(ext), !(extensionManagementServerService.remoteExtensionManagementServer || extensionManagementServerService.localExtensionManagementServer)));
                this._register(this.webExtensions.onChange(e => this.onDidChangeExtensions(e?.extension)));
                this._register(this.webExtensions.onReset(e => this.reset()));
                this.extensionsServers.push(this.webExtensions);
            }
            this.updatesCheckDelayer = new async_1.ThrottledDelayer(ExtensionsWorkbenchService_1.UpdatesCheckInterval);
            this.autoUpdateDelayer = new async_1.ThrottledDelayer(1000);
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.updatesCheckDelayer.cancel();
                this.autoUpdateDelayer.cancel();
            }));
            urlService.registerHandler(this);
            this.whenInitialized = this.initialize();
        }
        async initialize() {
            // initialize local extensions
            await Promise.all([this.queryLocal(), this.extensionService.whenInstalledExtensionsRegistered()]);
            if (this._store.isDisposed) {
                return;
            }
            this.onDidChangeRunningExtensions(this.extensionService.extensions, []);
            this._register(this.extensionService.onDidChangeExtensions(({ added, removed }) => this.onDidChangeRunningExtensions(added, removed)));
            await this.lifecycleService.when(4 /* LifecyclePhase.Eventually */);
            if (this._store.isDisposed) {
                return;
            }
            this.initializeAutoUpdate();
            this.reportInstalledExtensionsTelemetry();
            this._register(event_1.Event.debounce(this.onChange, () => undefined, 100)(() => this.reportProgressFromOtherSources()));
            this._register(this.storageService.onDidChangeValue(-1 /* StorageScope.APPLICATION */, EXTENSIONS_AUTO_UPDATE_KEY, this._store)(e => this.onDidSelectedExtensionToAutoUpdateValueChange(false)));
        }
        initializeAutoUpdate() {
            // Register listeners for auto updates
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(extensions_1.AutoUpdateConfigurationKey)) {
                    this.onDidAutoUpdateConfigurationChange();
                }
                if (e.affectsConfiguration(extensions_1.AutoCheckUpdatesConfigurationKey)) {
                    if (this.isAutoCheckUpdatesEnabled()) {
                        this.checkForUpdates();
                    }
                }
            }));
            this._register(this.extensionEnablementService.onEnablementChanged(platformExtensions => {
                if (this.getAutoUpdateValue() === 'onlyEnabledExtensions' && platformExtensions.some(e => this.extensionEnablementService.isEnabled(e))) {
                    this.checkForUpdates();
                }
            }));
            this._register(event_1.Event.debounce(this.onChange, () => undefined, 100)(() => this.hasOutdatedExtensionsContextKey.set(this.outdated.length > 0)));
            this._register(this.updateService.onStateChange(e => {
                if (!this.isAutoUpdateEnabled()) {
                    return;
                }
                if ((e.type === "checking for updates" /* StateType.CheckingForUpdates */ && e.explicit) || e.type === "available for download" /* StateType.AvailableForDownload */ || e.type === "downloaded" /* StateType.Downloaded */) {
                    this.eventuallyCheckForUpdates(true);
                }
            }));
            // Update AutoUpdate Contexts
            this.hasOutdatedExtensionsContextKey.set(this.outdated.length > 0);
            // Check for updates
            this.eventuallyCheckForUpdates(true);
            if (platform_1.isWeb) {
                this.syncPinnedBuiltinExtensions();
                // Always auto update builtin extensions in web
                if (!this.isAutoUpdateEnabled()) {
                    this.autoUpdateBuiltinExtensions();
                }
            }
        }
        reportInstalledExtensionsTelemetry() {
            const extensionIds = this.installed.filter(extension => !extension.isBuiltin &&
                (extension.enablementState === 9 /* EnablementState.EnabledWorkspace */ ||
                    extension.enablementState === 8 /* EnablementState.EnabledGlobally */))
                .map(extension => extensions_2.ExtensionIdentifier.toKey(extension.identifier.id));
            this.telemetryService.publicLog2('installedExtensions', { extensionIds: new telemetryUtils_1.TelemetryTrustedValue(extensionIds.join(';')), count: extensionIds.length });
        }
        async onDidChangeRunningExtensions(added, removed) {
            const changedExtensions = [];
            const extsNotInstalled = [];
            for (const desc of added) {
                const extension = this.installed.find(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: desc.identifier.value, uuid: desc.uuid }, e.identifier));
                if (extension) {
                    changedExtensions.push(extension);
                }
                else {
                    extsNotInstalled.push({ id: desc.identifier.value, uuid: desc.uuid });
                }
            }
            if (extsNotInstalled.length) {
                const extensions = await this.getExtensions(extsNotInstalled, cancellation_1.CancellationToken.None);
                for (const extension of extensions) {
                    changedExtensions.push(extension);
                }
            }
            for (const changedExtension of changedExtensions) {
                this._onChange.fire(changedExtension);
            }
        }
        reset() {
            for (const task of this.tasksInProgress) {
                task.cancel();
            }
            this.tasksInProgress = [];
            this.installing = [];
            this.onDidChangeExtensions();
            this._onReset.fire();
        }
        onDidChangeExtensions(extension) {
            this._installed = undefined;
            this._local = undefined;
            this._onChange.fire(extension);
        }
        get local() {
            if (!this._local) {
                if (this.extensionsServers.length === 1) {
                    this._local = this.installed;
                }
                else {
                    this._local = [];
                    const byId = (0, extensionManagementUtil_1.groupByExtension)(this.installed, r => r.identifier);
                    for (const extensions of byId) {
                        this._local.push(this.getPrimaryExtension(extensions));
                    }
                }
            }
            return this._local;
        }
        get installed() {
            if (!this._installed) {
                this._installed = [];
                for (const extensions of this.extensionsServers) {
                    for (const extension of extensions.local) {
                        this._installed.push(extension);
                    }
                }
            }
            return this._installed;
        }
        get outdated() {
            return this.installed.filter(e => e.outdated && e.local && e.state === 1 /* ExtensionState.Installed */);
        }
        async queryLocal(server) {
            if (server) {
                if (this.localExtensions && this.extensionManagementServerService.localExtensionManagementServer === server) {
                    return this.localExtensions.queryInstalled(this.getProductVersion());
                }
                if (this.remoteExtensions && this.extensionManagementServerService.remoteExtensionManagementServer === server) {
                    return this.remoteExtensions.queryInstalled(this.getProductVersion());
                }
                if (this.webExtensions && this.extensionManagementServerService.webExtensionManagementServer === server) {
                    return this.webExtensions.queryInstalled(this.getProductVersion());
                }
            }
            if (this.localExtensions) {
                try {
                    await this.localExtensions.queryInstalled(this.getProductVersion());
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
            if (this.remoteExtensions) {
                try {
                    await this.remoteExtensions.queryInstalled(this.getProductVersion());
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
            if (this.webExtensions) {
                try {
                    await this.webExtensions.queryInstalled(this.getProductVersion());
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
            return this.local;
        }
        async queryGallery(arg1, arg2) {
            if (!this.galleryService.isEnabled()) {
                return (0, paging_1.singlePagePager)([]);
            }
            const options = cancellation_1.CancellationToken.isCancellationToken(arg1) ? {} : arg1;
            const token = cancellation_1.CancellationToken.isCancellationToken(arg1) ? arg1 : arg2;
            options.text = options.text ? this.resolveQueryText(options.text) : options.text;
            options.includePreRelease = (0, types_1.isUndefined)(options.includePreRelease) ? this.preferPreReleases : options.includePreRelease;
            const extensionsControlManifest = await this.extensionManagementService.getExtensionsControlManifest();
            const pager = await this.galleryService.query(options, token);
            this.syncInstalledExtensionsWithGallery(pager.firstPage);
            return {
                firstPage: pager.firstPage.map(gallery => this.fromGallery(gallery, extensionsControlManifest)),
                total: pager.total,
                pageSize: pager.pageSize,
                getPage: async (pageIndex, token) => {
                    const page = await pager.getPage(pageIndex, token);
                    this.syncInstalledExtensionsWithGallery(page);
                    return page.map(gallery => this.fromGallery(gallery, extensionsControlManifest));
                }
            };
        }
        async getExtensions(extensionInfos, arg1, arg2) {
            if (!this.galleryService.isEnabled()) {
                return [];
            }
            extensionInfos.forEach(e => e.preRelease = e.preRelease ?? this.preferPreReleases);
            const extensionsControlManifest = await this.extensionManagementService.getExtensionsControlManifest();
            const galleryExtensions = await this.galleryService.getExtensions(extensionInfos, arg1, arg2);
            this.syncInstalledExtensionsWithGallery(galleryExtensions);
            return galleryExtensions.map(gallery => this.fromGallery(gallery, extensionsControlManifest));
        }
        async getResourceExtensions(locations, isWorkspaceScoped) {
            const resourceExtensions = await this.extensionManagementService.getExtensions(locations);
            return resourceExtensions.map(resourceExtension => this.getInstalledExtensionMatchingLocation(resourceExtension.location)
                ?? this.instantiationService.createInstance(Extension, ext => this.getExtensionState(ext), ext => this.getRuntimeState(ext), undefined, undefined, undefined, { resourceExtension, isWorkspaceScoped }));
        }
        resolveQueryText(text) {
            text = text.replace(/@web/g, `tag:"${extensionManagement_1.WEB_EXTENSION_TAG}"`);
            const extensionRegex = /\bext:([^\s]+)\b/g;
            if (extensionRegex.test(text)) {
                text = text.replace(extensionRegex, (m, ext) => {
                    // Get curated keywords
                    const lookup = this.productService.extensionKeywords || {};
                    const keywords = lookup[ext] || [];
                    // Get mode name
                    const languageId = this.languageService.guessLanguageIdByFilepathOrFirstLine(uri_1.URI.file(`.${ext}`));
                    const languageName = languageId && this.languageService.getLanguageName(languageId);
                    const languageTag = languageName ? ` tag:"${languageName}"` : '';
                    // Construct a rich query
                    return `tag:"__ext_${ext}" tag:"__ext_.${ext}" ${keywords.map(tag => `tag:"${tag}"`).join(' ')}${languageTag} tag:"${ext}"`;
                });
            }
            return text.substr(0, 350);
        }
        fromGallery(gallery, extensionsControlManifest) {
            let extension = this.getInstalledExtensionMatchingGallery(gallery);
            if (!extension) {
                extension = this.instantiationService.createInstance(Extension, ext => this.getExtensionState(ext), ext => this.getRuntimeState(ext), undefined, undefined, gallery, undefined);
                Extensions.updateExtensionFromControlManifest(extension, extensionsControlManifest);
            }
            return extension;
        }
        getInstalledExtensionMatchingGallery(gallery) {
            for (const installed of this.local) {
                if (installed.identifier.uuid) { // Installed from Gallery
                    if (installed.identifier.uuid === gallery.identifier.uuid) {
                        return installed;
                    }
                }
                else if (installed.local?.source !== 'resource') {
                    if ((0, extensionManagementUtil_1.areSameExtensions)(installed.identifier, gallery.identifier)) { // Installed from other sources
                        return installed;
                    }
                }
            }
            return null;
        }
        getInstalledExtensionMatchingLocation(location) {
            return this.local.find(e => e.local && this.uriIdentityService.extUri.isEqualOrParent(location, e.local?.location)) ?? null;
        }
        async open(extension, options) {
            if (typeof extension === 'string') {
                const id = extension;
                extension = this.installed.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id })) ?? (await this.getExtensions([{ id: extension }], cancellation_1.CancellationToken.None))[0];
            }
            if (!extension) {
                throw new Error(`Extension not found. ${extension}`);
            }
            await this.editorService.openEditor(this.instantiationService.createInstance(extensionsInput_1.ExtensionsInput, extension), options, options?.sideByside ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
        }
        getExtensionStatus(extension) {
            const extensionsStatus = this.extensionService.getExtensionsStatus();
            for (const id of Object.keys(extensionsStatus)) {
                if ((0, extensionManagementUtil_1.areSameExtensions)({ id }, extension.identifier)) {
                    return extensionsStatus[id];
                }
            }
            return undefined;
        }
        async updateRunningExtensions() {
            const toAdd = [];
            const toRemove = [];
            const extensionsToCheck = [...this.local];
            const notExistingRunningExtensions = this.extensionService.extensions.filter(e => !this.local.some(local => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, local.identifier)));
            if (notExistingRunningExtensions.length) {
                const extensions = await this.getExtensions(notExistingRunningExtensions.map(e => ({ id: e.identifier.value })), cancellation_1.CancellationToken.None);
                extensionsToCheck.push(...extensions);
            }
            for (const extension of extensionsToCheck) {
                const runtimeState = extension.runtimeState;
                if (!runtimeState || runtimeState.action !== "restartExtensions" /* ExtensionRuntimeActionType.RestartExtensions */) {
                    continue;
                }
                if (extension.state === 3 /* ExtensionState.Uninstalled */) {
                    toRemove.push(extension.identifier.id);
                    continue;
                }
                if (!extension.local) {
                    continue;
                }
                const isEnabled = this.extensionEnablementService.isEnabled(extension.local);
                if (isEnabled) {
                    const runningExtension = this.extensionService.extensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, extension.identifier));
                    if (runningExtension) {
                        toRemove.push(runningExtension.identifier.value);
                    }
                    toAdd.push(extension.local);
                }
                else {
                    toRemove.push(extension.identifier.id);
                }
            }
            if (toAdd.length || toRemove.length) {
                if (await this.extensionService.stopExtensionHosts(nls.localize('restart', "Enable or Disable extensions"))) {
                    await this.extensionService.startExtensionHosts({ toAdd, toRemove });
                }
            }
        }
        getRuntimeState(extension) {
            const isUninstalled = extension.state === 3 /* ExtensionState.Uninstalled */;
            const runningExtension = this.extensionService.extensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, extension.identifier));
            const reloadAction = this.extensionManagementServerService.remoteExtensionManagementServer ? "reloadWindow" /* ExtensionRuntimeActionType.ReloadWindow */ : "restartExtensions" /* ExtensionRuntimeActionType.RestartExtensions */;
            const reloadActionLabel = reloadAction === "reloadWindow" /* ExtensionRuntimeActionType.ReloadWindow */ ? nls.localize('reload', "reload window") : nls.localize('restart extensions', "restart extensions");
            if (isUninstalled) {
                const canRemoveRunningExtension = runningExtension && this.extensionService.canRemoveExtension(runningExtension);
                const isSameExtensionRunning = runningExtension && (!extension.server || extension.server === this.extensionManagementServerService.getExtensionManagementServer((0, extensions_3.toExtension)(runningExtension)));
                if (!canRemoveRunningExtension && isSameExtensionRunning && !runningExtension.isUnderDevelopment) {
                    return { action: reloadAction, reason: nls.localize('postUninstallTooltip', "Please {0} to complete the uninstallation of this extension.", reloadActionLabel) };
                }
                return undefined;
            }
            if (extension.local) {
                const isSameExtensionRunning = runningExtension && extension.server === this.extensionManagementServerService.getExtensionManagementServer((0, extensions_3.toExtension)(runningExtension));
                const isEnabled = this.extensionEnablementService.isEnabled(extension.local);
                // Extension is running
                if (runningExtension) {
                    if (isEnabled) {
                        // No Reload is required if extension can run without reload
                        if (this.extensionService.canAddExtension((0, extensions_3.toExtensionDescription)(extension.local))) {
                            return undefined;
                        }
                        const runningExtensionServer = this.extensionManagementServerService.getExtensionManagementServer((0, extensions_3.toExtension)(runningExtension));
                        if (isSameExtensionRunning) {
                            // Different version or target platform of same extension is running. Requires reload to run the current version
                            if (!runningExtension.isUnderDevelopment && (extension.version !== runningExtension.version || extension.local.targetPlatform !== runningExtension.targetPlatform)) {
                                const productCurrentVersion = this.getProductCurrentVersion();
                                const productUpdateVersion = this.getProductUpdateVersion();
                                if (productUpdateVersion
                                    && !(0, extensionValidator_1.isEngineValid)(extension.local.manifest.engines.vscode, productCurrentVersion.version, productCurrentVersion.date)
                                    && (0, extensionValidator_1.isEngineValid)(extension.local.manifest.engines.vscode, productUpdateVersion.version, productUpdateVersion.date)) {
                                    const state = this.updateService.state;
                                    if (state.type === "available for download" /* StateType.AvailableForDownload */) {
                                        return { action: "downloadUpdate" /* ExtensionRuntimeActionType.DownloadUpdate */, reason: nls.localize('postUpdateDownloadTooltip', "Please update {0} to enable the updated extension.", this.productService.nameLong) };
                                    }
                                    if (state.type === "downloaded" /* StateType.Downloaded */) {
                                        return { action: "applyUpdate" /* ExtensionRuntimeActionType.ApplyUpdate */, reason: nls.localize('postUpdateUpdateTooltip', "Please update {0} to enable the updated extension.", this.productService.nameLong) };
                                    }
                                    if (state.type === "ready" /* StateType.Ready */) {
                                        return { action: "quitAndInstall" /* ExtensionRuntimeActionType.QuitAndInstall */, reason: nls.localize('postUpdateRestartTooltip', "Please restart {0} to enable the updated extension.", this.productService.nameLong) };
                                    }
                                    return undefined;
                                }
                                return { action: reloadAction, reason: nls.localize('postUpdateTooltip', "Please {0} to enable the updated extension.", reloadActionLabel) };
                            }
                            if (this.extensionsServers.length > 1) {
                                const extensionInOtherServer = this.installed.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier) && e.server !== extension.server)[0];
                                if (extensionInOtherServer) {
                                    // This extension prefers to run on UI/Local side but is running in remote
                                    if (runningExtensionServer === this.extensionManagementServerService.remoteExtensionManagementServer && this.extensionManifestPropertiesService.prefersExecuteOnUI(extension.local.manifest) && extensionInOtherServer.server === this.extensionManagementServerService.localExtensionManagementServer) {
                                        return { action: reloadAction, reason: nls.localize('enable locally', "Please {0} to enable this extension locally.", reloadActionLabel) };
                                    }
                                    // This extension prefers to run on Workspace/Remote side but is running in local
                                    if (runningExtensionServer === this.extensionManagementServerService.localExtensionManagementServer && this.extensionManifestPropertiesService.prefersExecuteOnWorkspace(extension.local.manifest) && extensionInOtherServer.server === this.extensionManagementServerService.remoteExtensionManagementServer) {
                                        return { action: reloadAction, reason: nls.localize('enable remote', "Please {0} to enable this extension in {1}.", reloadActionLabel, this.extensionManagementServerService.remoteExtensionManagementServer?.label) };
                                    }
                                }
                            }
                        }
                        else {
                            if (extension.server === this.extensionManagementServerService.localExtensionManagementServer && runningExtensionServer === this.extensionManagementServerService.remoteExtensionManagementServer) {
                                // This extension prefers to run on UI/Local side but is running in remote
                                if (this.extensionManifestPropertiesService.prefersExecuteOnUI(extension.local.manifest)) {
                                    return { action: reloadAction, reason: nls.localize('postEnableTooltip', "Please {0} to enable this extension.", reloadActionLabel) };
                                }
                            }
                            if (extension.server === this.extensionManagementServerService.remoteExtensionManagementServer && runningExtensionServer === this.extensionManagementServerService.localExtensionManagementServer) {
                                // This extension prefers to run on Workspace/Remote side but is running in local
                                if (this.extensionManifestPropertiesService.prefersExecuteOnWorkspace(extension.local.manifest)) {
                                    return { action: reloadAction, reason: nls.localize('postEnableTooltip', "Please {0} to enable this extension.", reloadActionLabel) };
                                }
                            }
                        }
                        return undefined;
                    }
                    else {
                        if (isSameExtensionRunning) {
                            return { action: reloadAction, reason: nls.localize('postDisableTooltip', "Please {0} to disable this extension.", reloadActionLabel) };
                        }
                    }
                    return undefined;
                }
                // Extension is not running
                else {
                    if (isEnabled && !this.extensionService.canAddExtension((0, extensions_3.toExtensionDescription)(extension.local))) {
                        return { action: reloadAction, reason: nls.localize('postEnableTooltip', "Please {0} to enable this extension.", reloadActionLabel) };
                    }
                    const otherServer = extension.server ? extension.server === this.extensionManagementServerService.localExtensionManagementServer ? this.extensionManagementServerService.remoteExtensionManagementServer : this.extensionManagementServerService.localExtensionManagementServer : null;
                    if (otherServer && extension.enablementState === 1 /* EnablementState.DisabledByExtensionKind */) {
                        const extensionInOtherServer = this.local.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier) && e.server === otherServer)[0];
                        // Same extension in other server exists and
                        if (extensionInOtherServer && extensionInOtherServer.local && this.extensionEnablementService.isEnabled(extensionInOtherServer.local)) {
                            return { action: reloadAction, reason: nls.localize('postEnableTooltip', "Please {0} to enable this extension.", reloadActionLabel) };
                        }
                    }
                }
            }
            return undefined;
        }
        getPrimaryExtension(extensions) {
            if (extensions.length === 1) {
                return extensions[0];
            }
            const enabledExtensions = extensions.filter(e => e.local && this.extensionEnablementService.isEnabled(e.local));
            if (enabledExtensions.length === 1) {
                return enabledExtensions[0];
            }
            const extensionsToChoose = enabledExtensions.length ? enabledExtensions : extensions;
            const manifest = extensionsToChoose.find(e => e.local && e.local.manifest)?.local?.manifest;
            // Manifest is not found which should not happen.
            // In which case return the first extension.
            if (!manifest) {
                return extensionsToChoose[0];
            }
            const extensionKinds = this.extensionManifestPropertiesService.getExtensionKind(manifest);
            let extension = extensionsToChoose.find(extension => {
                for (const extensionKind of extensionKinds) {
                    switch (extensionKind) {
                        case 'ui':
                            /* UI extension is chosen only if it is installed locally */
                            if (extension.server === this.extensionManagementServerService.localExtensionManagementServer) {
                                return true;
                            }
                            return false;
                        case 'workspace':
                            /* Choose remote workspace extension if exists */
                            if (extension.server === this.extensionManagementServerService.remoteExtensionManagementServer) {
                                return true;
                            }
                            return false;
                        case 'web':
                            /* Choose web extension if exists */
                            if (extension.server === this.extensionManagementServerService.webExtensionManagementServer) {
                                return true;
                            }
                            return false;
                    }
                }
                return false;
            });
            if (!extension && this.extensionManagementServerService.localExtensionManagementServer) {
                extension = extensionsToChoose.find(extension => {
                    for (const extensionKind of extensionKinds) {
                        switch (extensionKind) {
                            case 'workspace':
                                /* Choose local workspace extension if exists */
                                if (extension.server === this.extensionManagementServerService.localExtensionManagementServer) {
                                    return true;
                                }
                                return false;
                            case 'web':
                                /* Choose local web extension if exists */
                                if (extension.server === this.extensionManagementServerService.localExtensionManagementServer) {
                                    return true;
                                }
                                return false;
                        }
                    }
                    return false;
                });
            }
            if (!extension && this.extensionManagementServerService.webExtensionManagementServer) {
                extension = extensionsToChoose.find(extension => {
                    for (const extensionKind of extensionKinds) {
                        switch (extensionKind) {
                            case 'web':
                                /* Choose web extension if exists */
                                if (extension.server === this.extensionManagementServerService.webExtensionManagementServer) {
                                    return true;
                                }
                                return false;
                        }
                    }
                    return false;
                });
            }
            if (!extension && this.extensionManagementServerService.remoteExtensionManagementServer) {
                extension = extensionsToChoose.find(extension => {
                    for (const extensionKind of extensionKinds) {
                        switch (extensionKind) {
                            case 'web':
                                /* Choose remote web extension if exists */
                                if (extension.server === this.extensionManagementServerService.remoteExtensionManagementServer) {
                                    return true;
                                }
                                return false;
                        }
                    }
                    return false;
                });
            }
            return extension || extensions[0];
        }
        getExtensionState(extension) {
            if (this.installing.some(i => (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, extension.identifier) && (!extension.server || i.server === extension.server))) {
                return 0 /* ExtensionState.Installing */;
            }
            if (this.remoteExtensions) {
                const state = this.remoteExtensions.getExtensionState(extension);
                if (state !== 3 /* ExtensionState.Uninstalled */) {
                    return state;
                }
            }
            if (this.webExtensions) {
                const state = this.webExtensions.getExtensionState(extension);
                if (state !== 3 /* ExtensionState.Uninstalled */) {
                    return state;
                }
            }
            if (this.localExtensions) {
                return this.localExtensions.getExtensionState(extension);
            }
            return 3 /* ExtensionState.Uninstalled */;
        }
        async onDidAutoUpdateConfigurationChange() {
            await this.updateExtensionsPinnedState();
            if (this.isAutoUpdateEnabled()) {
                this.checkForUpdates();
            }
            else {
                this.setSelectedExtensionsToAutoUpdate([]);
            }
        }
        async checkForUpdates(onlyBuiltin) {
            if (!this.galleryService.isEnabled()) {
                return;
            }
            const extensions = [];
            if (this.localExtensions) {
                extensions.push(this.localExtensions);
            }
            if (this.remoteExtensions) {
                extensions.push(this.remoteExtensions);
            }
            if (this.webExtensions) {
                extensions.push(this.webExtensions);
            }
            if (!extensions.length) {
                return;
            }
            const infos = [];
            for (const installed of this.local) {
                if (onlyBuiltin && !installed.isBuiltin) {
                    // Skip if check updates only for builtin extensions and current extension is not builtin.
                    continue;
                }
                if (installed.isBuiltin && !installed.local?.pinned && (installed.type === 0 /* ExtensionType.System */ || !installed.local?.identifier.uuid)) {
                    // Skip checking updates for a builtin extension if it is a system extension or if it does not has Marketplace identifier
                    continue;
                }
                if (installed.local?.source === 'resource') {
                    continue;
                }
                infos.push({ ...installed.identifier, preRelease: !!installed.local?.preRelease });
            }
            if (infos.length) {
                const targetPlatform = await extensions[0].server.extensionManagementService.getTargetPlatform();
                this.telemetryService.publicLog2('galleryService:checkingForUpdates', {
                    count: infos.length,
                });
                const galleryExtensions = await this.galleryService.getExtensions(infos, { targetPlatform, compatible: true, productVersion: this.getProductVersion() }, cancellation_1.CancellationToken.None);
                if (galleryExtensions.length) {
                    await this.syncInstalledExtensionsWithGallery(galleryExtensions);
                }
            }
        }
        async updateAll() {
            const toUpdate = [];
            this.outdated.forEach((extension) => {
                if (extension.gallery) {
                    toUpdate.push({
                        extension: extension.gallery,
                        options: {
                            operation: 3 /* InstallOperation.Update */,
                            installPreReleaseVersion: extension.local?.isPreReleaseVersion,
                            profileLocation: this.userDataProfileService.currentProfile.extensionsResource,
                        }
                    });
                }
            });
            return this.extensionManagementService.installGalleryExtensions(toUpdate);
        }
        async syncInstalledExtensionsWithGallery(gallery) {
            const extensions = [];
            if (this.localExtensions) {
                extensions.push(this.localExtensions);
            }
            if (this.remoteExtensions) {
                extensions.push(this.remoteExtensions);
            }
            if (this.webExtensions) {
                extensions.push(this.webExtensions);
            }
            if (!extensions.length) {
                return;
            }
            await Promise.allSettled(extensions.map(extensions => extensions.syncInstalledExtensionsWithGallery(gallery, this.getProductVersion())));
            if (this.isAutoUpdateEnabled()) {
                this.eventuallyAutoUpdateExtensions();
            }
        }
        getAutoUpdateValue() {
            const autoUpdate = this.configurationService.getValue(extensions_1.AutoUpdateConfigurationKey);
            return (0, types_1.isBoolean)(autoUpdate) || autoUpdate === 'onlyEnabledExtensions' || autoUpdate === 'onlySelectedExtensions' ? autoUpdate : true;
        }
        isAutoUpdateEnabled() {
            return this.getAutoUpdateValue() !== false;
        }
        isAutoCheckUpdatesEnabled() {
            return this.configurationService.getValue(extensions_1.AutoCheckUpdatesConfigurationKey);
        }
        eventuallyCheckForUpdates(immediate = false) {
            this.updatesCheckDelayer.cancel();
            this.updatesCheckDelayer.trigger(async () => {
                if (this.isAutoUpdateEnabled() || this.isAutoCheckUpdatesEnabled()) {
                    await this.checkForUpdates();
                }
                this.eventuallyCheckForUpdates();
            }, immediate ? 0 : this.getUpdatesCheckInterval()).then(undefined, err => null);
        }
        getUpdatesCheckInterval() {
            if (this.productService.quality === 'insider' && this.getProductUpdateVersion()) {
                return 1000 * 60 * 60 * 1; // 1 hour
            }
            return ExtensionsWorkbenchService_1.UpdatesCheckInterval;
        }
        eventuallyAutoUpdateExtensions() {
            this.autoUpdateDelayer.trigger(() => this.autoUpdateExtensions())
                .then(undefined, err => null);
        }
        async autoUpdateBuiltinExtensions() {
            await this.checkForUpdates(true);
            const toUpdate = this.outdated.filter(e => e.isBuiltin);
            await async_1.Promises.settled(toUpdate.map(e => this.install(e, e.local?.preRelease ? { installPreReleaseVersion: true } : undefined)));
        }
        async syncPinnedBuiltinExtensions() {
            const infos = [];
            for (const installed of this.local) {
                if (installed.isBuiltin && installed.local?.pinned && installed.local?.identifier.uuid) {
                    infos.push({ ...installed.identifier, version: installed.version });
                }
            }
            if (infos.length) {
                const galleryExtensions = await this.galleryService.getExtensions(infos, cancellation_1.CancellationToken.None);
                if (galleryExtensions.length) {
                    await this.syncInstalledExtensionsWithGallery(galleryExtensions);
                }
            }
        }
        async autoUpdateExtensions() {
            if (!this.isAutoUpdateEnabled()) {
                return;
            }
            const toUpdate = this.outdated.filter(e => !e.local?.pinned && this.shouldAutoUpdateExtension(e));
            if (!toUpdate.length) {
                return;
            }
            const productVersion = this.getProductVersion();
            await async_1.Promises.settled(toUpdate.map(e => this.install(e, e.local?.preRelease ? { installPreReleaseVersion: true, productVersion } : { productVersion })));
        }
        getProductVersion() {
            return this.getProductUpdateVersion() ?? this.getProductCurrentVersion();
        }
        getProductCurrentVersion() {
            return { version: this.productService.version, date: this.productService.date };
        }
        getProductUpdateVersion() {
            switch (this.updateService.state.type) {
                case "available for download" /* StateType.AvailableForDownload */:
                case "downloaded" /* StateType.Downloaded */:
                case "updating" /* StateType.Updating */:
                case "ready" /* StateType.Ready */: {
                    const version = this.updateService.state.update.productVersion;
                    if (version && semver.valid(version)) {
                        return { version, date: this.updateService.state.update.timestamp ? new Date(this.updateService.state.update.timestamp).toISOString() : undefined };
                    }
                }
            }
            return undefined;
        }
        async updateExtensionsPinnedState() {
            await Promise.all(this.installed.map(async (e) => {
                if (e.isBuiltin) {
                    return;
                }
                const shouldBePinned = !this.shouldAutoUpdateExtension(e);
                if (e.local && e.local.pinned !== shouldBePinned) {
                    await this.extensionManagementService.updateMetadata(e.local, { pinned: shouldBePinned });
                }
            }));
        }
        shouldAutoUpdateExtension(extension) {
            const autoUpdate = this.getAutoUpdateValue();
            if ((0, types_1.isBoolean)(autoUpdate)) {
                return autoUpdate;
            }
            if (autoUpdate === 'onlyEnabledExtensions') {
                return this.extensionEnablementService.isEnabledEnablementState(extension.enablementState);
            }
            const extensionsToAutoUpdate = this.getSelectedExtensionsToAutoUpdate();
            const extensionId = extension.identifier.id.toLowerCase();
            return extensionsToAutoUpdate.includes(extensionId) ||
                (!extensionsToAutoUpdate.includes(`-${extensionId}`) && this.isAutoUpdateEnabledForPublisher(extension.publisher));
        }
        isAutoUpdateEnabledFor(extensionOrPublisher) {
            if ((0, types_1.isString)(extensionOrPublisher)) {
                if (extensionManagement_1.EXTENSION_IDENTIFIER_REGEX.test(extensionOrPublisher)) {
                    throw new Error('Expected publisher string, found extension identifier');
                }
                const autoUpdate = this.getAutoUpdateValue();
                if ((0, types_1.isBoolean)(autoUpdate)) {
                    return autoUpdate;
                }
                if (autoUpdate === 'onlyEnabledExtensions') {
                    return false;
                }
                return this.isAutoUpdateEnabledForPublisher(extensionOrPublisher);
            }
            return !extensionOrPublisher.local?.pinned && this.shouldAutoUpdateExtension(extensionOrPublisher);
        }
        isAutoUpdateEnabledForPublisher(publisher) {
            const publishersToAutoUpdate = this.getPublishersToAutoUpdate();
            return publishersToAutoUpdate.includes(publisher.toLowerCase());
        }
        async updateAutoUpdateEnablementFor(extensionOrPublisher, enable) {
            const autoUpdateValue = this.getAutoUpdateValue();
            if (autoUpdateValue === true || autoUpdateValue === 'onlyEnabledExtensions') {
                if ((0, types_1.isString)(extensionOrPublisher)) {
                    throw new Error('Expected extension, found publisher string');
                }
                if (!extensionOrPublisher.local) {
                    throw new Error('Only installed extensions can be pinned');
                }
                await this.extensionManagementService.updateMetadata(extensionOrPublisher.local, { pinned: !enable });
                if (enable) {
                    this.eventuallyAutoUpdateExtensions();
                }
                return;
            }
            if (autoUpdateValue === false && enable) {
                await this.configurationService.updateValue(extensions_1.AutoUpdateConfigurationKey, 'onlySelectedExtensions');
            }
            let update = false;
            const autoUpdateExtensions = this.getSelectedExtensionsToAutoUpdate();
            if ((0, types_1.isString)(extensionOrPublisher)) {
                if (extensionManagement_1.EXTENSION_IDENTIFIER_REGEX.test(extensionOrPublisher)) {
                    throw new Error('Expected publisher string, found extension identifier');
                }
                extensionOrPublisher = extensionOrPublisher.toLowerCase();
                if (this.isAutoUpdateEnabledFor(extensionOrPublisher) !== enable) {
                    update = true;
                    if (enable) {
                        autoUpdateExtensions.push(extensionOrPublisher);
                    }
                    else {
                        if (autoUpdateExtensions.includes(extensionOrPublisher)) {
                            autoUpdateExtensions.splice(autoUpdateExtensions.indexOf(extensionOrPublisher), 1);
                        }
                    }
                }
            }
            else {
                const extensionId = extensionOrPublisher.identifier.id.toLowerCase();
                const enableAutoUpdatesForPublisher = this.isAutoUpdateEnabledFor(extensionOrPublisher.publisher.toLowerCase());
                const enableAutoUpdatesForExtension = autoUpdateExtensions.includes(extensionId);
                const disableAutoUpdatesForExtension = autoUpdateExtensions.includes(`-${extensionId}`);
                if (enable) {
                    if (disableAutoUpdatesForExtension) {
                        autoUpdateExtensions.splice(autoUpdateExtensions.indexOf(`-${extensionId}`), 1);
                        update = true;
                    }
                    if (enableAutoUpdatesForPublisher) {
                        if (enableAutoUpdatesForExtension) {
                            autoUpdateExtensions.splice(autoUpdateExtensions.indexOf(extensionId), 1);
                            update = true;
                        }
                    }
                    else {
                        if (!enableAutoUpdatesForExtension) {
                            autoUpdateExtensions.push(extensionId);
                            update = true;
                        }
                    }
                }
                // Disable Auto Updates
                else {
                    if (enableAutoUpdatesForExtension) {
                        autoUpdateExtensions.splice(autoUpdateExtensions.indexOf(extensionId), 1);
                        update = true;
                    }
                    if (enableAutoUpdatesForPublisher) {
                        if (!disableAutoUpdatesForExtension) {
                            autoUpdateExtensions.push(`-${extensionId}`);
                            update = true;
                        }
                    }
                    else {
                        if (disableAutoUpdatesForExtension) {
                            autoUpdateExtensions.splice(autoUpdateExtensions.indexOf(`-${extensionId}`), 1);
                            update = true;
                        }
                    }
                }
            }
            if (update) {
                this.setSelectedExtensionsToAutoUpdate(autoUpdateExtensions);
                await this.onDidSelectedExtensionToAutoUpdateValueChange(true);
                if (autoUpdateValue === 'onlySelectedExtensions' && autoUpdateExtensions.length === 0) {
                    await this.configurationService.updateValue(extensions_1.AutoUpdateConfigurationKey, false);
                }
            }
        }
        async onDidSelectedExtensionToAutoUpdateValueChange(forceUpdate) {
            if (forceUpdate || this.selectedExtensionsToAutoUpdateValue !== this.getSelectedExtensionsToAutoUpdateValue() /* This checks if current window changed the value or not */) {
                await this.updateExtensionsPinnedState();
                this.eventuallyAutoUpdateExtensions();
            }
        }
        async canInstall(extension) {
            if (!(extension instanceof Extension)) {
                return false;
            }
            if (extension.isMalicious) {
                return false;
            }
            if (extension.deprecationInfo?.disallowInstall) {
                return false;
            }
            if (extension.gallery) {
                if (this.localExtensions && await this.localExtensions.canInstall(extension.gallery)) {
                    return true;
                }
                if (this.remoteExtensions && await this.remoteExtensions.canInstall(extension.gallery)) {
                    return true;
                }
                if (this.webExtensions && await this.webExtensions.canInstall(extension.gallery)) {
                    return true;
                }
                return false;
            }
            if (extension.resourceExtension) {
                return true;
            }
            return false;
        }
        async install(arg, installOptions = {}, progressLocation) {
            let installable;
            let extension;
            if (arg instanceof uri_1.URI) {
                installable = arg;
            }
            else {
                let installableInfo;
                let gallery;
                if ((0, types_1.isString)(arg)) {
                    extension = this.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id: arg }));
                    if (!extension?.isBuiltin) {
                        installableInfo = { id: arg, version: installOptions.version, preRelease: installOptions.installPreReleaseVersion ?? this.preferPreReleases };
                    }
                }
                else if (arg.gallery) {
                    extension = arg;
                    gallery = arg.gallery;
                    if (installOptions.version && installOptions.version !== gallery?.version) {
                        installableInfo = { id: extension.identifier.id, version: installOptions.version };
                    }
                }
                else if (arg.resourceExtension) {
                    extension = arg;
                    installable = arg.resourceExtension;
                }
                if (installableInfo) {
                    const targetPlatform = extension?.server ? await extension.server.extensionManagementService.getTargetPlatform() : undefined;
                    gallery = (0, arrays_1.firstOrDefault)(await this.galleryService.getExtensions([installableInfo], { targetPlatform }, cancellation_1.CancellationToken.None));
                }
                if (!extension && gallery) {
                    extension = this.instantiationService.createInstance(Extension, ext => this.getExtensionState(ext), ext => this.getRuntimeState(ext), undefined, undefined, gallery, undefined);
                    Extensions.updateExtensionFromControlManifest(extension, await this.extensionManagementService.getExtensionsControlManifest());
                }
                if (extension?.isMalicious) {
                    throw new Error(nls.localize('malicious', "This extension is reported to be problematic."));
                }
                // Do not install if requested to enable and extension is already installed
                if (!(installOptions.enable && extension?.local)) {
                    if (!installable) {
                        if (!gallery) {
                            const id = (0, types_1.isString)(arg) ? arg : arg.identifier.id;
                            if (installOptions.version) {
                                throw new Error(nls.localize('not found version', "Unable to install extension '{0}' because the requested version '{1}' is not found.", id, installOptions.version));
                            }
                            else {
                                throw new Error(nls.localize('not found', "Unable to install extension '{0}' because it is not found.", id));
                            }
                        }
                        installable = gallery;
                    }
                    if (installOptions.version) {
                        installOptions.installGivenVersion = true;
                    }
                    if (extension?.isWorkspaceScoped) {
                        installOptions.isWorkspaceScoped = true;
                    }
                }
            }
            if (installable) {
                if (installOptions.justification) {
                    const syncCheck = (0, types_1.isUndefined)(installOptions.isMachineScoped) && this.userDataSyncEnablementService.isEnabled() && this.userDataSyncEnablementService.isResourceEnabled("extensions" /* SyncResource.Extensions */);
                    const buttons = [];
                    buttons.push({
                        label: (0, types_1.isString)(installOptions.justification) || !installOptions.justification.action
                            ? nls.localize({ key: 'installButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Install Extension")
                            : nls.localize({ key: 'installButtonLabelWithAction', comment: ['&& denotes a mnemonic'] }, "&&Install Extension and {0}", installOptions.justification.action), run: () => true
                    });
                    if (!extension) {
                        buttons.push({ label: nls.localize('open', "Open Extension"), run: () => { this.open(extension); return false; } });
                    }
                    const result = await this.dialogService.prompt({
                        title: nls.localize('installExtensionTitle', "Install Extension"),
                        message: extension ? nls.localize('installExtensionMessage', "Would you like to install '{0}' extension from '{1}'?", extension.displayName, extension.publisherDisplayName) : nls.localize('installVSIXMessage', "Would you like to install the extension?"),
                        detail: (0, types_1.isString)(installOptions.justification) ? installOptions.justification : installOptions.justification.reason,
                        cancelButton: true,
                        buttons,
                        checkbox: syncCheck ? {
                            label: nls.localize('sync extension', "Sync this extension"),
                            checked: true,
                        } : undefined,
                    });
                    if (!result.result) {
                        throw new errors_1.CancellationError();
                    }
                    if (syncCheck) {
                        installOptions.isMachineScoped = !result.checkboxChecked;
                    }
                }
                if (installable instanceof uri_1.URI) {
                    extension = await this.doInstall(undefined, () => this.installFromVSIX(installable, installOptions), progressLocation);
                }
                else if (extension) {
                    if (extension.resourceExtension) {
                        extension = await this.doInstall(extension, () => this.extensionManagementService.installResourceExtension(installable, installOptions), progressLocation);
                    }
                    else {
                        extension = await this.doInstall(extension, () => this.installFromGallery(extension, installable, installOptions), progressLocation);
                    }
                }
            }
            if (!extension) {
                throw new Error(nls.localize('unknown', "Unable to install extension"));
            }
            if (installOptions.version) {
                await this.updateAutoUpdateEnablementFor(extension, false);
            }
            if (installOptions.enable) {
                if (extension.enablementState === 7 /* EnablementState.DisabledWorkspace */ || extension.enablementState === 6 /* EnablementState.DisabledGlobally */) {
                    if (installOptions.justification) {
                        const result = await this.dialogService.confirm({
                            title: nls.localize('enableExtensionTitle', "Enable Extension"),
                            message: nls.localize('enableExtensionMessage', "Would you like to enable '{0}' extension?", extension.displayName),
                            detail: (0, types_1.isString)(installOptions.justification) ? installOptions.justification : installOptions.justification.reason,
                            primaryButton: (0, types_1.isString)(installOptions.justification) ? nls.localize({ key: 'enableButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Enable Extension") : nls.localize({ key: 'enableButtonLabelWithAction', comment: ['&& denotes a mnemonic'] }, "&&Enable Extension and {0}", installOptions.justification.action),
                        });
                        if (!result.confirmed) {
                            throw new errors_1.CancellationError();
                        }
                    }
                    await this.setEnablement(extension, extension.enablementState === 7 /* EnablementState.DisabledWorkspace */ ? 9 /* EnablementState.EnabledWorkspace */ : 8 /* EnablementState.EnabledGlobally */);
                }
                await this.waitUntilExtensionIsEnabled(extension);
            }
            return extension;
        }
        async installInServer(extension, server) {
            await this.doInstall(extension, async () => {
                const local = extension.local;
                if (!local) {
                    throw new Error('Extension not found');
                }
                if (!extension.gallery) {
                    extension = (await this.getExtensions([{ ...extension.identifier, preRelease: local.preRelease }], cancellation_1.CancellationToken.None))[0] ?? extension;
                }
                if (extension.gallery) {
                    return server.extensionManagementService.installFromGallery(extension.gallery, { installPreReleaseVersion: local.preRelease });
                }
                const targetPlatform = await server.extensionManagementService.getTargetPlatform();
                if (!(0, extensionManagement_1.isTargetPlatformCompatible)(local.targetPlatform, [local.targetPlatform], targetPlatform)) {
                    throw new Error(nls.localize('incompatible', "Can't install '{0}' extension because it is not compatible.", extension.identifier.id));
                }
                const vsix = await this.extensionManagementService.zip(local);
                try {
                    return await server.extensionManagementService.install(vsix);
                }
                finally {
                    try {
                        await this.fileService.del(vsix);
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                }
            });
        }
        canSetLanguage(extension) {
            if (!platform_1.isWeb) {
                return false;
            }
            if (!extension.gallery) {
                return false;
            }
            const locale = (0, languagePacks_1.getLocale)(extension.gallery);
            if (!locale) {
                return false;
            }
            return true;
        }
        async setLanguage(extension) {
            if (!this.canSetLanguage(extension)) {
                throw new Error('Can not set language');
            }
            const locale = (0, languagePacks_1.getLocale)(extension.gallery);
            if (locale === platform_1.language) {
                return;
            }
            const localizedLanguageName = extension.gallery?.properties?.localizedLanguages?.[0];
            return this.localeService.setLocale({ id: locale, galleryExtension: extension.gallery, extensionId: extension.identifier.id, label: localizedLanguageName ?? extension.displayName });
        }
        setEnablement(extensions, enablementState) {
            extensions = Array.isArray(extensions) ? extensions : [extensions];
            return this.promptAndSetEnablement(extensions, enablementState);
        }
        uninstall(extension) {
            const ext = extension.local ? extension : this.local.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier))[0];
            const toUninstall = ext && ext.local ? ext.local : null;
            if (!toUninstall) {
                return Promise.reject(new Error('Missing local'));
            }
            return this.withProgress({
                location: 5 /* ProgressLocation.Extensions */,
                title: nls.localize('uninstallingExtension', 'Uninstalling extension....'),
                source: `${toUninstall.identifier.id}`
            }, () => this.extensionManagementService.uninstall(toUninstall).then(() => undefined));
        }
        reinstall(extension) {
            return this.doInstall(extension, () => {
                const ext = extension.local ? extension : this.local.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier))[0];
                const toReinstall = ext && ext.local ? ext.local : null;
                if (!toReinstall) {
                    throw new Error('Missing local');
                }
                return this.extensionManagementService.reinstallFromGallery(toReinstall);
            });
        }
        isExtensionIgnoredToSync(extension) {
            return extension.local ? !this.isInstalledExtensionSynced(extension.local)
                : this.extensionsSyncManagementService.hasToNeverSyncExtension(extension.identifier.id);
        }
        async togglePreRelease(extension) {
            if (!extension.local) {
                return;
            }
            if (extension.preRelease !== extension.isPreReleaseVersion) {
                await this.extensionManagementService.updateMetadata(extension.local, { preRelease: !extension.preRelease });
                return;
            }
            await this.install(extension, { installPreReleaseVersion: !extension.preRelease, preRelease: !extension.preRelease });
        }
        async toggleExtensionIgnoredToSync(extension) {
            const isIgnored = this.isExtensionIgnoredToSync(extension);
            if (extension.local && isIgnored) {
                extension.local = await this.updateSynchronizingInstalledExtension(extension.local, true);
                this._onChange.fire(extension);
            }
            else {
                this.extensionsSyncManagementService.updateIgnoredExtensions(extension.identifier.id, !isIgnored);
            }
            await this.userDataAutoSyncService.triggerSync(['IgnoredExtensionsUpdated'], false, false);
        }
        async toggleApplyExtensionToAllProfiles(extension) {
            if (!extension.local || (0, extensions_2.isApplicationScopedExtension)(extension.local.manifest) || extension.isBuiltin) {
                return;
            }
            await this.extensionManagementService.toggleAppliationScope(extension.local, this.userDataProfileService.currentProfile.extensionsResource);
        }
        isInstalledExtensionSynced(extension) {
            if (extension.isMachineScoped) {
                return false;
            }
            if (this.extensionsSyncManagementService.hasToAlwaysSyncExtension(extension.identifier.id)) {
                return true;
            }
            return !this.extensionsSyncManagementService.hasToNeverSyncExtension(extension.identifier.id);
        }
        async updateSynchronizingInstalledExtension(extension, sync) {
            const isMachineScoped = !sync;
            if (extension.isMachineScoped !== isMachineScoped) {
                extension = await this.extensionManagementService.updateMetadata(extension, { isMachineScoped });
            }
            if (sync) {
                this.extensionsSyncManagementService.updateIgnoredExtensions(extension.identifier.id, false);
            }
            return extension;
        }
        doInstall(extension, installTask, progressLocation) {
            const title = extension ? nls.localize('installing named extension', "Installing '{0}' extension....", extension.displayName) : nls.localize('installing extension', 'Installing extension....');
            return this.withProgress({
                location: progressLocation ?? 5 /* ProgressLocation.Extensions */,
                title
            }, async () => {
                try {
                    if (extension) {
                        this.installing.push(extension);
                        this._onChange.fire(extension);
                    }
                    const local = await installTask();
                    return await this.waitAndGetInstalledExtension(local.identifier);
                }
                finally {
                    if (extension) {
                        this.installing = this.installing.filter(e => e !== extension);
                        // Trigger the change without passing the extension because it is replaced by a new instance.
                        this._onChange.fire(undefined);
                    }
                }
            });
        }
        async installFromVSIX(vsix, installOptions) {
            const manifest = await this.extensionManagementService.getManifest(vsix);
            const existingExtension = this.local.find(local => (0, extensionManagementUtil_1.areSameExtensions)(local.identifier, { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name) }));
            if (existingExtension) {
                installOptions = installOptions || {};
                if (existingExtension.latestVersion === manifest.version) {
                    installOptions.pinned = existingExtension.local?.pinned || !this.shouldAutoUpdateExtension(existingExtension);
                }
                else {
                    installOptions.installGivenVersion = true;
                }
            }
            return this.extensionManagementService.installVSIX(vsix, manifest, installOptions);
        }
        installFromGallery(extension, gallery, installOptions) {
            installOptions = installOptions ?? {};
            installOptions.pinned = extension.local?.pinned || !this.shouldAutoUpdateExtension(extension);
            if (extension.local) {
                installOptions.productVersion = this.getProductVersion();
                return this.extensionManagementService.updateFromGallery(gallery, extension.local, installOptions);
            }
            else {
                return this.extensionManagementService.installFromGallery(gallery, installOptions);
            }
        }
        async waitAndGetInstalledExtension(identifier) {
            let installedExtension = this.local.find(local => (0, extensionManagementUtil_1.areSameExtensions)(local.identifier, identifier));
            if (!installedExtension) {
                await event_1.Event.toPromise(event_1.Event.filter(this.onChange, e => !!e && this.local.some(local => (0, extensionManagementUtil_1.areSameExtensions)(local.identifier, identifier))));
            }
            installedExtension = this.local.find(local => (0, extensionManagementUtil_1.areSameExtensions)(local.identifier, identifier));
            if (!installedExtension) {
                // This should not happen
                throw new Error('Extension should have been installed');
            }
            return installedExtension;
        }
        async waitUntilExtensionIsEnabled(extension) {
            if (this.extensionService.extensions.find(e => extensions_2.ExtensionIdentifier.equals(e.identifier, extension.identifier.id))) {
                return;
            }
            if (!extension.local || !this.extensionService.canAddExtension((0, extensions_3.toExtensionDescription)(extension.local))) {
                return;
            }
            await new Promise((c, e) => {
                const disposable = this.extensionService.onDidChangeExtensions(() => {
                    try {
                        if (this.extensionService.extensions.find(e => extensions_2.ExtensionIdentifier.equals(e.identifier, extension.identifier.id))) {
                            disposable.dispose();
                            c();
                        }
                    }
                    catch (error) {
                        e(error);
                    }
                });
            });
        }
        promptAndSetEnablement(extensions, enablementState) {
            const enable = enablementState === 8 /* EnablementState.EnabledGlobally */ || enablementState === 9 /* EnablementState.EnabledWorkspace */;
            if (enable) {
                const allDependenciesAndPackedExtensions = this.getExtensionsRecursively(extensions, this.local, enablementState, { dependencies: true, pack: true });
                return this.checkAndSetEnablement(extensions, allDependenciesAndPackedExtensions, enablementState);
            }
            else {
                const packedExtensions = this.getExtensionsRecursively(extensions, this.local, enablementState, { dependencies: false, pack: true });
                if (packedExtensions.length) {
                    return this.checkAndSetEnablement(extensions, packedExtensions, enablementState);
                }
                return this.checkAndSetEnablement(extensions, [], enablementState);
            }
        }
        checkAndSetEnablement(extensions, otherExtensions, enablementState) {
            const allExtensions = [...extensions, ...otherExtensions];
            const enable = enablementState === 8 /* EnablementState.EnabledGlobally */ || enablementState === 9 /* EnablementState.EnabledWorkspace */;
            if (!enable) {
                for (const extension of extensions) {
                    const dependents = this.getDependentsAfterDisablement(extension, allExtensions, this.local);
                    if (dependents.length) {
                        return new Promise((resolve, reject) => {
                            this.notificationService.prompt(notification_1.Severity.Error, this.getDependentsErrorMessage(extension, allExtensions, dependents), [
                                {
                                    label: nls.localize('disable all', 'Disable All'),
                                    run: async () => {
                                        try {
                                            await this.checkAndSetEnablement(dependents, [extension], enablementState);
                                            resolve();
                                        }
                                        catch (error) {
                                            reject(error);
                                        }
                                    }
                                }
                            ], {
                                onCancel: () => reject(new errors_1.CancellationError())
                            });
                        });
                    }
                }
            }
            return this.doSetEnablement(allExtensions, enablementState);
        }
        getExtensionsRecursively(extensions, installed, enablementState, options, checked = []) {
            const toCheck = extensions.filter(e => checked.indexOf(e) === -1);
            if (toCheck.length) {
                for (const extension of toCheck) {
                    checked.push(extension);
                }
                const extensionsToEanbleOrDisable = installed.filter(i => {
                    if (checked.indexOf(i) !== -1) {
                        return false;
                    }
                    const enable = enablementState === 8 /* EnablementState.EnabledGlobally */ || enablementState === 9 /* EnablementState.EnabledWorkspace */;
                    const isExtensionEnabled = i.enablementState === 8 /* EnablementState.EnabledGlobally */ || i.enablementState === 9 /* EnablementState.EnabledWorkspace */;
                    if (enable === isExtensionEnabled) {
                        return false;
                    }
                    return (enable || !i.isBuiltin) // Include all Extensions for enablement and only non builtin extensions for disablement
                        && (options.dependencies || options.pack)
                        && extensions.some(extension => (options.dependencies && extension.dependencies.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, i.identifier)))
                            || (options.pack && extension.extensionPack.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, i.identifier))));
                });
                if (extensionsToEanbleOrDisable.length) {
                    extensionsToEanbleOrDisable.push(...this.getExtensionsRecursively(extensionsToEanbleOrDisable, installed, enablementState, options, checked));
                }
                return extensionsToEanbleOrDisable;
            }
            return [];
        }
        getDependentsAfterDisablement(extension, extensionsToDisable, installed) {
            return installed.filter(i => {
                if (i.dependencies.length === 0) {
                    return false;
                }
                if (i === extension) {
                    return false;
                }
                if (!this.extensionEnablementService.isEnabledEnablementState(i.enablementState)) {
                    return false;
                }
                if (extensionsToDisable.indexOf(i) !== -1) {
                    return false;
                }
                return i.dependencies.some(dep => [extension, ...extensionsToDisable].some(d => (0, extensionManagementUtil_1.areSameExtensions)(d.identifier, { id: dep })));
            });
        }
        getDependentsErrorMessage(extension, allDisabledExtensions, dependents) {
            for (const e of [extension, ...allDisabledExtensions]) {
                const dependentsOfTheExtension = dependents.filter(d => d.dependencies.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, e.identifier)));
                if (dependentsOfTheExtension.length) {
                    return this.getErrorMessageForDisablingAnExtensionWithDependents(e, dependentsOfTheExtension);
                }
            }
            return '';
        }
        getErrorMessageForDisablingAnExtensionWithDependents(extension, dependents) {
            if (dependents.length === 1) {
                return nls.localize('singleDependentError', "Cannot disable '{0}' extension alone. '{1}' extension depends on this. Do you want to disable all these extensions?", extension.displayName, dependents[0].displayName);
            }
            if (dependents.length === 2) {
                return nls.localize('twoDependentsError', "Cannot disable '{0}' extension alone. '{1}' and '{2}' extensions depend on this. Do you want to disable all these extensions?", extension.displayName, dependents[0].displayName, dependents[1].displayName);
            }
            return nls.localize('multipleDependentsError', "Cannot disable '{0}' extension alone. '{1}', '{2}' and other extensions depend on this. Do you want to disable all these extensions?", extension.displayName, dependents[0].displayName, dependents[1].displayName);
        }
        async doSetEnablement(extensions, enablementState) {
            const changed = await this.extensionEnablementService.setEnablement(extensions.map(e => e.local), enablementState);
            for (let i = 0; i < changed.length; i++) {
                if (changed[i]) {
                    /* __GDPR__
                    "extension:enable" : {
                        "owner": "sandy081",
                        "${include}": [
                            "${GalleryExtensionTelemetryData}"
                        ]
                    }
                    */
                    /* __GDPR__
                    "extension:disable" : {
                        "owner": "sandy081",
                        "${include}": [
                            "${GalleryExtensionTelemetryData}"
                        ]
                    }
                    */
                    this.telemetryService.publicLog(enablementState === 8 /* EnablementState.EnabledGlobally */ || enablementState === 9 /* EnablementState.EnabledWorkspace */ ? 'extension:enable' : 'extension:disable', extensions[i].telemetryData);
                }
            }
            return changed;
        }
        reportProgressFromOtherSources() {
            if (this.installed.some(e => e.state === 0 /* ExtensionState.Installing */ || e.state === 2 /* ExtensionState.Uninstalling */)) {
                if (!this._activityCallBack) {
                    this.withProgress({ location: 5 /* ProgressLocation.Extensions */ }, () => new Promise(resolve => this._activityCallBack = resolve));
                }
            }
            else {
                this._activityCallBack?.();
                this._activityCallBack = undefined;
            }
        }
        withProgress(options, task) {
            return this.progressService.withProgress(options, async () => {
                const cancelableTask = (0, async_1.createCancelablePromise)(() => task());
                this.tasksInProgress.push(cancelableTask);
                try {
                    return await cancelableTask;
                }
                finally {
                    const index = this.tasksInProgress.indexOf(cancelableTask);
                    if (index !== -1) {
                        this.tasksInProgress.splice(index, 1);
                    }
                }
            });
        }
        onError(err) {
            if ((0, errors_1.isCancellationError)(err)) {
                return;
            }
            const message = err && err.message || '';
            if (/getaddrinfo ENOTFOUND|getaddrinfo ENOENT|connect EACCES|connect ECONNREFUSED/.test(message)) {
                return;
            }
            this.notificationService.error(err);
        }
        handleURL(uri, options) {
            if (!/^extension/.test(uri.path)) {
                return Promise.resolve(false);
            }
            this.onOpenExtensionUrl(uri);
            return Promise.resolve(true);
        }
        onOpenExtensionUrl(uri) {
            const match = /^extension\/([^/]+)$/.exec(uri.path);
            if (!match) {
                return;
            }
            const extensionId = match[1];
            this.queryLocal().then(async (local) => {
                let extension = local.find(local => (0, extensionManagementUtil_1.areSameExtensions)(local.identifier, { id: extensionId }));
                if (!extension) {
                    [extension] = await this.getExtensions([{ id: extensionId }], { source: 'uri' }, cancellation_1.CancellationToken.None);
                }
                if (extension) {
                    await this.hostService.focus(window_1.mainWindow);
                    await this.open(extension);
                }
            }).then(undefined, error => this.onError(error));
        }
        getPublishersToAutoUpdate() {
            return this.getSelectedExtensionsToAutoUpdate().filter(id => !extensionManagement_1.EXTENSION_IDENTIFIER_REGEX.test(id));
        }
        getSelectedExtensionsToAutoUpdate() {
            try {
                const parsedValue = JSON.parse(this.selectedExtensionsToAutoUpdateValue);
                if (Array.isArray(parsedValue)) {
                    return parsedValue;
                }
            }
            catch (e) { /* Ignore */ }
            return [];
        }
        setSelectedExtensionsToAutoUpdate(selectedExtensionsToAutoUpdate) {
            this.selectedExtensionsToAutoUpdateValue = JSON.stringify(selectedExtensionsToAutoUpdate);
        }
        get selectedExtensionsToAutoUpdateValue() {
            if (!this._selectedExtensionsToAutoUpdateValue) {
                this._selectedExtensionsToAutoUpdateValue = this.getSelectedExtensionsToAutoUpdateValue();
            }
            return this._selectedExtensionsToAutoUpdateValue;
        }
        set selectedExtensionsToAutoUpdateValue(placeholderViewContainesValue) {
            if (this.selectedExtensionsToAutoUpdateValue !== placeholderViewContainesValue) {
                this._selectedExtensionsToAutoUpdateValue = placeholderViewContainesValue;
                this.setSelectedExtensionsToAutoUpdateValue(placeholderViewContainesValue);
            }
        }
        getSelectedExtensionsToAutoUpdateValue() {
            return this.storageService.get(EXTENSIONS_AUTO_UPDATE_KEY, -1 /* StorageScope.APPLICATION */, '[]');
        }
        setSelectedExtensionsToAutoUpdateValue(value) {
            this.storageService.store(EXTENSIONS_AUTO_UPDATE_KEY, value, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
        }
    };
    exports.ExtensionsWorkbenchService = ExtensionsWorkbenchService;
    exports.ExtensionsWorkbenchService = ExtensionsWorkbenchService = ExtensionsWorkbenchService_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, editorService_1.IEditorService),
        __param(2, extensionManagement_2.IWorkbenchExtensionManagementService),
        __param(3, extensionManagement_1.IExtensionGalleryService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, notification_1.INotificationService),
        __param(7, url_1.IURLService),
        __param(8, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(9, host_1.IHostService),
        __param(10, progress_1.IProgressService),
        __param(11, extensionManagement_2.IExtensionManagementServerService),
        __param(12, language_1.ILanguageService),
        __param(13, ignoredExtensions_1.IIgnoredExtensionsManagementService),
        __param(14, userDataSync_1.IUserDataAutoSyncService),
        __param(15, productService_1.IProductService),
        __param(16, contextkey_1.IContextKeyService),
        __param(17, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(18, log_1.ILogService),
        __param(19, extensions_3.IExtensionService),
        __param(20, locale_1.ILocaleService),
        __param(21, lifecycle_2.ILifecycleService),
        __param(22, files_1.IFileService),
        __param(23, userDataProfile_1.IUserDataProfileService),
        __param(24, storage_1.IStorageService),
        __param(25, dialogs_1.IDialogService),
        __param(26, userDataSync_1.IUserDataSyncEnablementService),
        __param(27, update_1.IUpdateService),
        __param(28, uriIdentity_1.IUriIdentityService)
    ], ExtensionsWorkbenchService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1dvcmtiZW5jaFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvYnJvd3Nlci9leHRlbnNpb25zV29ya2JlbmNoU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBdUV6RixJQUFNLFNBQVMsR0FBZixNQUFNLFNBQVM7UUFLckIsWUFDUyxhQUFzRCxFQUN0RCxvQkFBZ0YsRUFDeEUsTUFBOEMsRUFDdkQsS0FBa0MsRUFDbEMsT0FBc0MsRUFDNUIscUJBQXdHLEVBQy9GLGNBQXlELEVBQ2hFLGdCQUFvRCxFQUMxRCxVQUF3QyxFQUN2QyxXQUEwQyxFQUN2QyxjQUFnRDtZQVZ6RCxrQkFBYSxHQUFiLGFBQWEsQ0FBeUM7WUFDdEQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUE0RDtZQUN4RSxXQUFNLEdBQU4sTUFBTSxDQUF3QztZQUN2RCxVQUFLLEdBQUwsS0FBSyxDQUE2QjtZQUNsQyxZQUFPLEdBQVAsT0FBTyxDQUErQjtZQUM1QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQW1GO1lBQzlFLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQUMvQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3pDLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDdEIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDdEIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBZDNELG9CQUFlLDJDQUFvRDtZQXlMbkUsZ0JBQVcsR0FBWSxLQUFLLENBQUM7WUF6S25DLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxxQkFBcUIsRUFBRSxpQkFBaUIsQ0FBQztRQUNuRSxDQUFDO1FBRUQsSUFBSSxJQUFJO1lBQ1AsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFD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