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
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/base/common/platform", "vs/platform/instantiation/common/extensions", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/async", "vs/base/common/buffer", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionNls", "vs/nls", "vs/base/common/semver/semver", "vs/base/common/types", "vs/base/common/errors", "vs/base/common/map", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/extensionResourceLoader/common/extensionResourceLoader", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/platform/contextkey/common/contextkeys", "vs/workbench/services/editor/common/editorService", "vs/base/common/path", "vs/platform/extensionManagement/common/extensionStorage", "vs/base/common/arrays", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/storage/common/storage", "vs/platform/product/common/productService", "vs/platform/extensions/common/extensionValidator", "vs/base/common/severity", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, extensions_1, environmentService_1, extensionManagement_1, platform_1, extensions_2, resources_1, uri_1, files_1, async_1, buffer_1, log_1, cancellation_1, extensionManagement_2, extensionManagementUtil_1, lifecycle_1, extensionNls_1, nls_1, semver, types_1, errors_1, map_1, extensionManifestPropertiesService_1, extensionResourceLoader_1, actions_1, actionCommonCategories_1, contextkeys_1, editorService_1, path_1, extensionStorage_1, arrays_1, lifecycle_2, storage_1, productService_1, extensionValidator_1, severity_1, userDataProfile_1, userDataProfile_2, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebExtensionsScannerService = void 0;
    function isGalleryExtensionInfo(obj) {
        const galleryExtensionInfo = obj;
        return typeof galleryExtensionInfo?.id === 'string'
            && (galleryExtensionInfo.preRelease === undefined || typeof galleryExtensionInfo.preRelease === 'boolean')
            && (galleryExtensionInfo.migrateStorageFrom === undefined || typeof galleryExtensionInfo.migrateStorageFrom === 'string');
    }
    function isUriComponents(thing) {
        if (!thing) {
            return false;
        }
        return (0, types_1.isString)(thing.path) &&
            (0, types_1.isString)(thing.scheme);
    }
    let WebExtensionsScannerService = class WebExtensionsScannerService extends lifecycle_1.Disposable {
        constructor(environmentService, builtinExtensionsScannerService, fileService, logService, galleryService, extensionManifestPropertiesService, extensionResourceLoaderService, extensionStorageService, storageService, productService, userDataProfilesService, uriIdentityService, lifecycleService) {
            super();
            this.environmentService = environmentService;
            this.builtinExtensionsScannerService = builtinExtensionsScannerService;
            this.fileService = fileService;
            this.logService = logService;
            this.galleryService = galleryService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.extensionResourceLoaderService = extensionResourceLoaderService;
            this.extensionStorageService = extensionStorageService;
            this.storageService = storageService;
            this.productService = productService;
            this.userDataProfilesService = userDataProfilesService;
            this.uriIdentityService = uriIdentityService;
            this.systemExtensionsCacheResource = undefined;
            this.customBuiltinExtensionsCacheResource = undefined;
            this.resourcesAccessQueueMap = new map_1.ResourceMap();
            if (platform_1.isWeb) {
                this.systemExtensionsCacheResource = (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'systemExtensionsCache.json');
                this.customBuiltinExtensionsCacheResource = (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'customBuiltinExtensionsCache.json');
                // Eventually update caches
                lifecycleService.when(4 /* LifecyclePhase.Eventually */).then(() => this.updateCaches());
            }
        }
        readCustomBuiltinExtensionsInfoFromEnv() {
            if (!this._customBuiltinExtensionsInfoPromise) {
                this._customBuiltinExtensionsInfoPromise = (async () => {
                    let extensions = [];
                    const extensionLocations = [];
                    const extensionGalleryResources = [];
                    const extensionsToMigrate = [];
                    const customBuiltinExtensionsInfo = this.environmentService.options && Array.isArray(this.environmentService.options.additionalBuiltinExtensions)
                        ? this.environmentService.options.additionalBuiltinExtensions.map(additionalBuiltinExtension => (0, types_1.isString)(additionalBuiltinExtension) ? { id: additionalBuiltinExtension } : additionalBuiltinExtension)
                        : [];
                    for (const e of customBuiltinExtensionsInfo) {
                        if (isGalleryExtensionInfo(e)) {
                            extensions.push({ id: e.id, preRelease: !!e.preRelease });
                            if (e.migrateStorageFrom) {
                                extensionsToMigrate.push([e.migrateStorageFrom, e.id]);
                            }
                        }
                        else if (isUriComponents(e)) {
                            const extensionLocation = uri_1.URI.revive(e);
                            if (this.extensionResourceLoaderService.isExtensionGalleryResource(extensionLocation)) {
                                extensionGalleryResources.push(extensionLocation);
                            }
                            else {
                                extensionLocations.push(extensionLocation);
                            }
                        }
                    }
                    if (extensions.length) {
                        extensions = await this.checkAdditionalBuiltinExtensions(extensions);
                    }
                    if (extensions.length) {
                        this.logService.info('Found additional builtin gallery extensions in env', extensions);
                    }
                    if (extensionLocations.length) {
                        this.logService.info('Found additional builtin location extensions in env', extensionLocations.map(e => e.toString()));
                    }
                    if (extensionGalleryResources.length) {
                        this.logService.info('Found additional builtin extension gallery resources in env', extensionGalleryResources.map(e => e.toString()));
                    }
                    return { extensions, extensionsToMigrate, extensionLocations, extensionGalleryResources };
                })();
            }
            return this._customBuiltinExtensionsInfoPromise;
        }
        async checkAdditionalBuiltinExtensions(extensions) {
            const extensionsControlManifest = await this.galleryService.getExtensionsControlManifest();
            const result = [];
            for (const extension of extensions) {
                if (extensionsControlManifest.malicious.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e, { id: extension.id }))) {
                    this.logService.info(`Checking additional builtin extensions: Ignoring '${extension.id}' because it is reported to be malicious.`);
                    continue;
                }
                const deprecationInfo = extensionsControlManifest.deprecated[extension.id.toLowerCase()];
                if (deprecationInfo?.extension?.autoMigrate) {
                    const preReleaseExtensionId = deprecationInfo.extension.id;
                    this.logService.info(`Checking additional builtin extensions: '${extension.id}' is deprecated, instead using '${preReleaseExtensionId}'`);
                    result.push({ id: preReleaseExtensionId, preRelease: !!extension.preRelease });
                }
                else {
                    result.push(extension);
                }
            }
            return result;
        }
        /**
         * All system extensions bundled with the product
         */
        async readSystemExtensions() {
            const systemExtensions = await this.builtinExtensionsScannerService.scanBuiltinExtensions();
            const cachedSystemExtensions = await Promise.all((await this.readSystemExtensionsCache()).map(e => this.toScannedExtension(e, true, 0 /* ExtensionType.System */)));
            const result = new Map();
            for (const extension of [...systemExtensions, ...cachedSystemExtensions]) {
                const existing = result.get(extension.identifier.id.toLowerCase());
                if (existing) {
                    // Incase there are duplicates always take the latest version
                    if (semver.gt(existing.manifest.version, extension.manifest.version)) {
                        continue;
                    }
                }
                result.set(extension.identifier.id.toLowerCase(), extension);
            }
            return [...result.values()];
        }
        /**
         * All extensions defined via `additionalBuiltinExtensions` API
         */
        async readCustomBuiltinExtensions(scanOptions) {
            const [customBuiltinExtensionsFromLocations, customBuiltinExtensionsFromGallery] = await Promise.all([
                this.getCustomBuiltinExtensionsFromLocations(scanOptions),
                this.getCustomBuiltinExtensionsFromGallery(scanOptions),
            ]);
            const customBuiltinExtensions = [...customBuiltinExtensionsFromLocations, ...customBuiltinExtensionsFromGallery];
            await this.migrateExtensionsStorage(customBuiltinExtensions);
            return customBuiltinExtensions;
        }
        async getCustomBuiltinExtensionsFromLocations(scanOptions) {
            const { extensionLocations } = await this.readCustomBuiltinExtensionsInfoFromEnv();
            if (!extensionLocations.length) {
                return [];
            }
            const result = [];
            await Promise.allSettled(extensionLocations.map(async (extensionLocation) => {
                try {
                    const webExtension = await this.toWebExtension(extensionLocation);
                    const extension = await this.toScannedExtension(webExtension, true);
                    if (extension.isValid || !scanOptions?.skipInvalidExtensions) {
                        result.push(extension);
                    }
                    else {
                        this.logService.info(`Skipping invalid additional builtin extension ${webExtension.identifier.id}`);
                    }
                }
                catch (error) {
                    this.logService.info(`Error while fetching the additional builtin extension ${extensionLocation.toString()}.`, (0, errors_1.getErrorMessage)(error));
                }
            }));
            return result;
        }
        async getCustomBuiltinExtensionsFromGallery(scanOptions) {
            if (!this.galleryService.isEnabled()) {
                this.logService.info('Ignoring fetching additional builtin extensions from gallery as it is disabled.');
                return [];
            }
            const result = [];
            const { extensions, extensionGalleryResources } = await this.readCustomBuiltinExtensionsInfoFromEnv();
            try {
                const cacheValue = JSON.stringify({
                    extensions: extensions.sort((a, b) => a.id.localeCompare(b.id)),
                    extensionGalleryResources: extensionGalleryResources.map(e => e.toString()).sort()
                });
                const useCache = this.storageService.get('additionalBuiltinExtensions', -1 /* StorageScope.APPLICATION */, '{}') === cacheValue;
                const webExtensions = await (useCache ? this.getCustomBuiltinExtensionsFromCache() : this.updateCustomBuiltinExtensionsCache());
                if (webExtensions.length) {
                    await Promise.all(webExtensions.map(async (webExtension) => {
                        try {
                            const extension = await this.toScannedExtension(webExtension, true);
                            if (extension.isValid || !scanOptions?.skipInvalidExtensions) {
                                result.push(extension);
                            }
                            else {
                                this.logService.info(`Skipping invalid additional builtin gallery extension ${webExtension.identifier.id}`);
                            }
                        }
                        catch (error) {
                            this.logService.info(`Ignoring additional builtin extension ${webExtension.identifier.id} because there is an error while converting it into scanned extension`, (0, errors_1.getErrorMessage)(error));
                        }
                    }));
                }
                this.storageService.store('additionalBuiltinExtensions', cacheValue, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            catch (error) {
                this.logService.info('Ignoring following additional builtin extensions as there is an error while fetching them from gallery', extensions.map(({ id }) => id), (0, errors_1.getErrorMessage)(error));
            }
            return result;
        }
        async getCustomBuiltinExtensionsFromCache() {
            const cachedCustomBuiltinExtensions = await this.readCustomBuiltinExtensionsCache();
            const webExtensionsMap = new Map();
            for (const webExtension of cachedCustomBuiltinExtensions) {
                const existing = webExtensionsMap.get(webExtension.identifier.id.toLowerCase());
                if (existing) {
                    // Incase there are duplicates always take the latest version
                    if (semver.gt(existing.version, webExtension.version)) {
                        continue;
                    }
                }
                /* Update preRelease flag in the cache - https://github.com/microsoft/vscode/issues/142831 */
                if (webExtension.metadata?.isPreReleaseVersion && !webExtension.metadata?.preRelease) {
                    webExtension.metadata.preRelease = true;
                }
                webExtensionsMap.set(webExtension.identifier.id.toLowerCase(), webExtension);
            }
            return [...webExtensionsMap.values()];
        }
        async migrateExtensionsStorage(customBuiltinExtensions) {
            if (!this._migrateExtensionsStoragePromise) {
                this._migrateExtensionsStoragePromise = (async () => {
                    const { extensionsToMigrate } = await this.readCustomBuiltinExtensionsInfoFromEnv();
                    if (!extensionsToMigrate.length) {
                        return;
                    }
                    const fromExtensions = await this.galleryService.getExtensions(extensionsToMigrate.map(([id]) => ({ id })), cancellation_1.CancellationToken.None);
                    try {
                        await Promise.allSettled(extensionsToMigrate.map(async ([from, to]) => {
                            const toExtension = customBuiltinExtensions.find(extension => (0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, { id: to }));
                            if (toExtension) {
                                const fromExtension = fromExtensions.find(extension => (0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, { id: from }));
                                const fromExtensionManifest = fromExtension ? await this.galleryService.getManifest(fromExtension, cancellation_1.CancellationToken.None) : null;
                                const fromExtensionId = fromExtensionManifest ? (0, extensionManagementUtil_1.getExtensionId)(fromExtensionManifest.publisher, fromExtensionManifest.name) : from;
                                const toExtensionId = (0, extensionManagementUtil_1.getExtensionId)(toExtension.manifest.publisher, toExtension.manifest.name);
                                this.extensionStorageService.addToMigrationList(fromExtensionId, toExtensionId);
                            }
                            else {
                                this.logService.info(`Skipped migrating extension storage from '${from}' to '${to}', because the '${to}' extension is not found.`);
                            }
                        }));
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                })();
            }
            return this._migrateExtensionsStoragePromise;
        }
        async updateCaches() {
            await this.updateSystemExtensionsCache();
            await this.updateCustomBuiltinExtensionsCache();
        }
        async updateSystemExtensionsCache() {
            const systemExtensions = await this.builtinExtensionsScannerService.scanBuiltinExtensions();
            const cachedSystemExtensions = (await this.readSystemExtensionsCache())
                .filter(cached => {
                const systemExtension = systemExtensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, cached.identifier));
                return systemExtension && semver.gt(cached.version, systemExtension.manifest.version);
            });
            await this.writeSystemExtensionsCache(() => cachedSystemExtensions);
        }
        async updateCustomBuiltinExtensionsCache() {
            if (!this._updateCustomBuiltinExtensionsCachePromise) {
                this._updateCustomBuiltinExtensionsCachePromise = (async () => {
                    this.logService.info('Updating additional builtin extensions cache');
                    const { extensions, extensionGalleryResources } = await this.readCustomBuiltinExtensionsInfoFromEnv();
                    const [galleryWebExtensions, extensionGalleryResourceWebExtensions] = await Promise.all([
                        this.resolveBuiltinGalleryExtensions(extensions),
                        this.resolveBuiltinExtensionGalleryResources(extensionGalleryResources)
                    ]);
                    const webExtensionsMap = new Map();
                    for (const webExtension of [...galleryWebExtensions, ...extensionGalleryResourceWebExtensions]) {
                        webExtensionsMap.set(webExtension.identifier.id.toLowerCase(), webExtension);
                    }
                    await this.resolveDependenciesAndPackedExtensions(extensionGalleryResourceWebExtensions, webExtensionsMap);
                    const webExtensions = [...webExtensionsMap.values()];
                    await this.writeCustomBuiltinExtensionsCache(() => webExtensions);
                    return webExtensions;
                })();
            }
            return this._updateCustomBuiltinExtensionsCachePromise;
        }
        async resolveBuiltinExtensionGalleryResources(extensionGalleryResources) {
            if (extensionGalleryResources.length === 0) {
                return [];
            }
            const result = new Map();
            const extensionInfos = [];
            await Promise.all(extensionGalleryResources.map(async (extensionGalleryResource) => {
                try {
                    const webExtension = await this.toWebExtensionFromExtensionGalleryResource(extensionGalleryResource);
                    result.set(webExtension.identifier.id.toLowerCase(), webExtension);
                    extensionInfos.push({ id: webExtension.identifier.id, version: webExtension.version });
                }
                catch (error) {
                    this.logService.info(`Ignoring additional builtin extension from gallery resource ${extensionGalleryResource.toString()} because there is an error while converting it into web extension`, (0, errors_1.getErrorMessage)(error));
                }
            }));
            const galleryExtensions = await this.galleryService.getExtensions(extensionInfos, cancellation_1.CancellationToken.None);
            for (const galleryExtension of galleryExtensions) {
                const webExtension = result.get(galleryExtension.identifier.id.toLowerCase());
                if (webExtension) {
                    result.set(galleryExtension.identifier.id.toLowerCase(), {
                        ...webExtension,
                        identifier: { id: webExtension.identifier.id, uuid: galleryExtension.identifier.uuid },
                        readmeUri: galleryExtension.assets.readme ? uri_1.URI.parse(galleryExtension.assets.readme.uri) : undefined,
                        changelogUri: galleryExtension.assets.changelog ? uri_1.URI.parse(galleryExtension.assets.changelog.uri) : undefined,
                        metadata: { isPreReleaseVersion: galleryExtension.properties.isPreReleaseVersion, preRelease: galleryExtension.properties.isPreReleaseVersion, isBuiltin: true, pinned: true }
                    });
                }
            }
            return [...result.values()];
        }
        async resolveBuiltinGalleryExtensions(extensions) {
            if (extensions.length === 0) {
                return [];
            }
            const webExtensions = [];
            const galleryExtensionsMap = await this.getExtensionsWithDependenciesAndPackedExtensions(extensions);
            const missingExtensions = extensions.filter(({ id }) => !galleryExtensionsMap.has(id.toLowerCase()));
            if (missingExtensions.length) {
                this.logService.info('Skipping the additional builtin extensions because their compatible versions are not found.', missingExtensions);
            }
            await Promise.all([...galleryExtensionsMap.values()].map(async (gallery) => {
                try {
                    const webExtension = await this.toWebExtensionFromGallery(gallery, { isPreReleaseVersion: gallery.properties.isPreReleaseVersion, preRelease: gallery.properties.isPreReleaseVersion, isBuiltin: true });
                    webExtensions.push(webExtension);
                }
                catch (error) {
                    this.logService.info(`Ignoring additional builtin extension ${gallery.identifier.id} because there is an error while converting it into web extension`, (0, errors_1.getErrorMessage)(error));
                }
            }));
            return webExtensions;
        }
        async resolveDependenciesAndPackedExtensions(webExtensions, result) {
            const extensionInfos = [];
            for (const webExtension of webExtensions) {
                for (const e of [...(webExtension.manifest?.extensionDependencies ?? []), ...(webExtension.manifest?.extensionPack ?? [])]) {
                    if (!result.has(e.toLowerCase())) {
                        extensionInfos.push({ id: e, version: webExtension.version });
                    }
                }
            }
            if (extensionInfos.length === 0) {
                return;
            }
            const galleryExtensions = await this.getExtensionsWithDependenciesAndPackedExtensions(extensionInfos, new Set([...result.keys()]));
            await Promise.all([...galleryExtensions.values()].map(async (gallery) => {
                try {
                    const webExtension = await this.toWebExtensionFromGallery(gallery, { isPreReleaseVersion: gallery.properties.isPreReleaseVersion, preRelease: gallery.properties.isPreReleaseVersion, isBuiltin: true });
                    result.set(webExtension.identifier.id.toLowerCase(), webExtension);
                }
                catch (error) {
                    this.logService.info(`Ignoring additional builtin extension ${gallery.identifier.id} because there is an error while converting it into web extension`, (0, errors_1.getErrorMessage)(error));
                }
            }));
        }
        async getExtensionsWithDependenciesAndPackedExtensions(toGet, seen = new Set(), result = new Map()) {
            if (toGet.length === 0) {
                return result;
            }
            const extensions = await this.galleryService.getExtensions(toGet, { compatible: true, targetPlatform: "web" /* TargetPlatform.WEB */ }, cancellation_1.CancellationToken.None);
            const packsAndDependencies = new Map();
            for (const extension of extensions) {
                result.set(extension.identifier.id.toLowerCase(), extension);
                for (const id of [...((0, arrays_1.isNonEmptyArray)(extension.properties.dependencies) ? extension.properties.dependencies : []), ...((0, arrays_1.isNonEmptyArray)(extension.properties.extensionPack) ? extension.properties.extensionPack : [])]) {
                    if (!result.has(id.toLowerCase()) && !packsAndDependencies.has(id.toLowerCase()) && !seen.has(id.toLowerCase())) {
                        const extensionInfo = toGet.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e, extension.identifier));
                        packsAndDependencies.set(id.toLowerCase(), { id, preRelease: extensionInfo?.preRelease });
                    }
                }
            }
            return this.getExtensionsWithDependenciesAndPackedExtensions([...packsAndDependencies.values()].filter(({ id }) => !result.has(id.toLowerCase())), seen, result);
        }
        async scanSystemExtensions() {
            return this.readSystemExtensions();
        }
        async scanUserExtensions(profileLocation, scanOptions) {
            const extensions = new Map();
            // Custom builtin extensions defined through `additionalBuiltinExtensions` API
            const customBuiltinExtensions = await this.readCustomBuiltinExtensions(scanOptions);
            for (const extension of customBuiltinExtensions) {
                extensions.set(extension.identifier.id.toLowerCase(), extension);
            }
            // User Installed extensions
            const installedExtensions = await this.scanInstalledExtensions(profileLocation, scanOptions);
            for (const extension of installedExtensions) {
                extensions.set(extension.identifier.id.toLowerCase(), extension);
            }
            return [...extensions.values()];
        }
        async scanExtensionsUnderDevelopment() {
            const devExtensions = this.environmentService.options?.developmentOptions?.extensions;
            const result = [];
            if (Array.isArray(devExtensions)) {
                await Promise.allSettled(devExtensions.map(async (devExtension) => {
                    try {
                        const location = uri_1.URI.revive(devExtension);
                        if (uri_1.URI.isUri(location)) {
                            const webExtension = await this.toWebExtension(location);
                            result.push(await this.toScannedExtension(webExtension, false));
                        }
                        else {
                            this.logService.info(`Skipping the extension under development ${devExtension} as it is not URI type.`);
                        }
                    }
                    catch (error) {
                        this.logService.info(`Error while fetching the extension under development ${devExtension.toString()}.`, (0, errors_1.getErrorMessage)(error));
                    }
                }));
            }
            return result;
        }
        async scanExistingExtension(extensionLocation, extensionType, profileLocation) {
            if (extensionType === 0 /* ExtensionType.System */) {
                const systemExtensions = await this.scanSystemExtensions();
                return systemExtensions.find(e => e.location.toString() === extensionLocation.toString()) || null;
            }
            const userExtensions = await this.scanUserExtensions(profileLocation);
            return userExtensions.find(e => e.location.toString() === extensionLocation.toString()) || null;
        }
        async scanExtensionManifest(extensionLocation) {
            try {
                return await this.getExtensionManifest(extensionLocation);
            }
            catch (error) {
                this.logService.warn(`Error while fetching manifest from ${extensionLocation.toString()}`, (0, errors_1.getErrorMessage)(error));
                return null;
            }
        }
        async addExtensionFromGallery(galleryExtension, metadata, profileLocation) {
            const webExtension = await this.toWebExtensionFromGallery(galleryExtension, metadata);
            return this.addWebExtension(webExtension, profileLocation);
        }
        async addExtension(location, metadata, profileLocation) {
            const webExtension = await this.toWebExtension(location, undefined, undefined, undefined, undefined, undefined, undefined, metadata);
            const extension = await this.toScannedExtension(webExtension, false);
            await this.addToInstalledExtensions([webExtension], profileLocation);
            return extension;
        }
        async removeExtension(extension, profileLocation) {
            await this.writeInstalledExtensions(profileLocation, installedExtensions => installedExtensions.filter(installedExtension => !(0, extensionManagementUtil_1.areSameExtensions)(installedExtension.identifier, extension.identifier)));
        }
        async updateMetadata(extension, metadata, profileLocation) {
            let updatedExtension = undefined;
            await this.writeInstalledExtensions(profileLocation, installedExtensions => {
                const result = [];
                for (const installedExtension of installedExtensions) {
                    if ((0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, installedExtension.identifier)) {
                        installedExtension.metadata = { ...installedExtension.metadata, ...metadata };
                        updatedExtension = installedExtension;
                        result.push(installedExtension);
                    }
                    else {
                        result.push(installedExtension);
                    }
                }
                return result;
            });
            if (!updatedExtension) {
                throw new Error('Extension not found');
            }
            return this.toScannedExtension(updatedExtension, extension.isBuiltin);
        }
        async copyExtensions(fromProfileLocation, toProfileLocation, filter) {
            const extensionsToCopy = [];
            const fromWebExtensions = await this.readInstalledExtensions(fromProfileLocation);
            await Promise.all(fromWebExtensions.map(async (webExtension) => {
                const scannedExtension = await this.toScannedExtension(webExtension, false);
                if (filter(scannedExtension)) {
                    extensionsToCopy.push(webExtension);
                }
            }));
            if (extensionsToCopy.length) {
                await this.addToInstalledExtensions(extensionsToCopy, toProfileLocation);
            }
        }
        async addWebExtension(webExtension, profileLocation) {
            const isSystem = !!(await this.scanSystemExtensions()).find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, webExtension.identifier));
            const isBuiltin = !!webExtension.metadata?.isBuiltin;
            const extension = await this.toScannedExtension(webExtension, isBuiltin);
            if (isSystem) {
                await this.writeSystemExtensionsCache(systemExtensions => {
                    // Remove the existing extension to avoid duplicates
                    systemExtensions = systemExtensions.filter(extension => !(0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, webExtension.identifier));
                    systemExtensions.push(webExtension);
                    return systemExtensions;
                });
                return extension;
            }
            // Update custom builtin extensions to custom builtin extensions cache
            if (isBuiltin) {
                await this.writeCustomBuiltinExtensionsCache(customBuiltinExtensions => {
                    // Remove the existing extension to avoid duplicates
                    customBuiltinExtensions = customBuiltinExtensions.filter(extension => !(0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, webExtension.identifier));
                    customBuiltinExtensions.push(webExtension);
                    return customBuiltinExtensions;
                });
                const installedExtensions = await this.readInstalledExtensions(profileLocation);
                // Also add to installed extensions if it is installed to update its version
                if (installedExtensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, webExtension.identifier))) {
                    await this.addToInstalledExtensions([webExtension], profileLocation);
                }
                return extension;
            }
            // Add to installed extensions
            await this.addToInstalledExtensions([webExtension], profileLocation);
            return extension;
        }
        async addToInstalledExtensions(webExtensions, profileLocation) {
            await this.writeInstalledExtensions(profileLocation, installedExtensions => {
                // Remove the existing extension to avoid duplicates
                installedExtensions = installedExtensions.filter(installedExtension => webExtensions.some(extension => !(0, extensionManagementUtil_1.areSameExtensions)(installedExtension.identifier, extension.identifier)));
                installedExtensions.push(...webExtensions);
                return installedExtensions;
            });
        }
        async scanInstalledExtensions(profileLocation, scanOptions) {
            let installedExtensions = await this.readInstalledExtensions(profileLocation);
            // If current profile is not a default profile, then add the application extensions to the list
            if (!this.uriIdentityService.extUri.isEqual(profileLocation, this.userDataProfilesService.defaultProfile.extensionsResource)) {
                // Remove application extensions from the non default profile
                installedExtensions = installedExtensions.filter(i => !i.metadata?.isApplicationScoped);
                // Add application extensions from the default profile to the list
                const defaultProfileExtensions = await this.readInstalledExtensions(this.userDataProfilesService.defaultProfile.extensionsResource);
                installedExtensions.push(...defaultProfileExtensions.filter(i => i.metadata?.isApplicationScoped));
            }
            installedExtensions.sort((a, b) => a.identifier.id < b.identifier.id ? -1 : a.identifier.id > b.identifier.id ? 1 : semver.rcompare(a.version, b.version));
            const result = new Map();
            for (const webExtension of installedExtensions) {
                const existing = result.get(webExtension.identifier.id.toLowerCase());
                if (existing && semver.gt(existing.manifest.version, webExtension.version)) {
                    continue;
                }
                const extension = await this.toScannedExtension(webExtension, false);
                if (extension.isValid || !scanOptions?.skipInvalidExtensions) {
                    result.set(extension.identifier.id.toLowerCase(), extension);
                }
                else {
                    this.logService.info(`Skipping invalid installed extension ${webExtension.identifier.id}`);
                }
            }
            return [...result.values()];
        }
        async toWebExtensionFromGallery(galleryExtension, metadata) {
            const extensionLocation = this.extensionResourceLoaderService.getExtensionGalleryResourceURL({
                publisher: galleryExtension.publisher,
                name: galleryExtension.name,
                version: galleryExtension.version,
                targetPlatform: galleryExtension.properties.targetPlatform === "web" /* TargetPlatform.WEB */ ? "web" /* TargetPlatform.WEB */ : undefined
            }, 'extension');
            if (!extensionLocation) {
                throw new Error('No extension gallery service configured.');
            }
            return this.toWebExtensionFromExtensionGalleryResource(extensionLocation, galleryExtension.identifier, galleryExtension.assets.readme ? uri_1.URI.parse(galleryExtension.assets.readme.uri) : undefined, galleryExtension.assets.changelog ? uri_1.URI.parse(galleryExtension.assets.changelog.uri) : undefined, metadata);
        }
        async toWebExtensionFromExtensionGalleryResource(extensionLocation, identifier, readmeUri, changelogUri, metadata) {
            const extensionResources = await this.listExtensionResources(extensionLocation);
            const packageNLSResources = this.getPackageNLSResourceMapFromResources(extensionResources);
            // The fallback, in English, will fill in any gaps missing in the localized file.
            const fallbackPackageNLSResource = extensionResources.find(e => (0, path_1.basename)(e) === 'package.nls.json');
            return this.toWebExtension(extensionLocation, identifier, undefined, packageNLSResources, fallbackPackageNLSResource ? uri_1.URI.parse(fallbackPackageNLSResource) : null, readmeUri, changelogUri, metadata);
        }
        getPackageNLSResourceMapFromResources(extensionResources) {
            const packageNLSResources = new Map();
            extensionResources.forEach(e => {
                // Grab all package.nls.{language}.json files
                const regexResult = /package\.nls\.([\w-]+)\.json/.exec((0, path_1.basename)(e));
                if (regexResult?.[1]) {
                    packageNLSResources.set(regexResult[1], uri_1.URI.parse(e));
                }
            });
            return packageNLSResources;
        }
        async toWebExtension(extensionLocation, identifier, manifest, packageNLSUris, fallbackPackageNLSUri, readmeUri, changelogUri, metadata) {
            if (!manifest) {
                try {
                    manifest = await this.getExtensionManifest(extensionLocation);
                }
                catch (error) {
                    throw new Error(`Error while fetching manifest from the location '${extensionLocation.toString()}'. ${(0, errors_1.getErrorMessage)(error)}`);
                }
            }
            if (!this.extensionManifestPropertiesService.canExecuteOnWeb(manifest)) {
                throw new Error((0, nls_1.localize)('not a web extension', "Cannot add '{0}' because this extension is not a web extension.", manifest.displayName || manifest.name));
            }
            if (fallbackPackageNLSUri === undefined) {
                try {
                    fallbackPackageNLSUri = (0, resources_1.joinPath)(extensionLocation, 'package.nls.json');
                    await this.extensionResourceLoaderService.readExtensionResource(fallbackPackageNLSUri);
                }
                catch (error) {
                    fallbackPackageNLSUri = undefined;
                }
            }
            const defaultManifestTranslations = fallbackPackageNLSUri ? uri_1.URI.isUri(fallbackPackageNLSUri) ? await this.getTranslations(fallbackPackageNLSUri) : fallbackPackageNLSUri : null;
            return {
                identifier: { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name), uuid: identifier?.uuid },
                version: manifest.version,
                location: extensionLocation,
                manifest,
                readmeUri,
                changelogUri,
                packageNLSUris,
                fallbackPackageNLSUri: uri_1.URI.isUri(fallbackPackageNLSUri) ? fallbackPackageNLSUri : undefined,
                defaultManifestTranslations,
                metadata,
            };
        }
        async toScannedExtension(webExtension, isBuiltin, type = 1 /* ExtensionType.User */) {
            const validations = [];
            let manifest = webExtension.manifest;
            if (!manifest) {
                try {
                    manifest = await this.getExtensionManifest(webExtension.location);
                }
                catch (error) {
                    validations.push([severity_1.default.Error, `Error while fetching manifest from the location '${webExtension.location}'. ${(0, errors_1.getErrorMessage)(error)}`]);
                }
            }
            if (!manifest) {
                const [publisher, name] = webExtension.identifier.id.split('.');
                manifest = {
                    name,
                    publisher,
                    version: webExtension.version,
                    engines: { vscode: '*' },
                };
            }
            const packageNLSUri = webExtension.packageNLSUris?.get(platform_1.Language.value().toLowerCase());
            const fallbackPackageNLS = webExtension.defaultManifestTranslations ?? webExtension.fallbackPackageNLSUri;
            if (packageNLSUri) {
                manifest = await this.translateManifest(manifest, packageNLSUri, fallbackPackageNLS);
            }
            else if (fallbackPackageNLS) {
                manifest = await this.translateManifest(manifest, fallbackPackageNLS);
            }
            const uuid = webExtension.metadata?.id;
            validations.push(...(0, extensionValidator_1.validateExtensionManifest)(this.productService.version, this.productService.date, webExtension.location, manifest, false));
            let isValid = true;
            for (const [severity, message] of validations) {
                if (severity === severity_1.default.Error) {
                    isValid = false;
                    this.logService.error(message);
                }
            }
            return {
                identifier: { id: webExtension.identifier.id, uuid: webExtension.identifier.uuid || uuid },
                location: webExtension.location,
                manifest,
                type,
                isBuiltin,
                readmeUrl: webExtension.readmeUri,
                changelogUrl: webExtension.changelogUri,
                metadata: webExtension.metadata,
                targetPlatform: "web" /* TargetPlatform.WEB */,
                validations,
                isValid
            };
        }
        async listExtensionResources(extensionLocation) {
            try {
                const result = await this.extensionResourceLoaderService.readExtensionResource(extensionLocation);
                return JSON.parse(result);
            }
            catch (error) {
                this.logService.warn('Error while fetching extension resources list', (0, errors_1.getErrorMessage)(error));
            }
            return [];
        }
        async translateManifest(manifest, nlsURL, fallbackNLS) {
            try {
                const translations = uri_1.URI.isUri(nlsURL) ? await this.getTranslations(nlsURL) : nlsURL;
                const fallbackTranslations = uri_1.URI.isUri(fallbackNLS) ? await this.getTranslations(fallbackNLS) : fallbackNLS;
                if (translations) {
                    manifest = (0, extensionNls_1.localizeManifest)(this.logService, manifest, translations, fallbackTranslations);
                }
            }
            catch (error) { /* ignore */ }
            return manifest;
        }
        async getExtensionManifest(location) {
            const url = (0, resources_1.joinPath)(location, 'package.json');
            const content = await this.extensionResourceLoaderService.readExtensionResource(url);
            return JSON.parse(content);
        }
        async getTranslations(nlsUrl) {
            try {
                const content = await this.extensionResourceLoaderService.readExtensionResource(nlsUrl);
                return JSON.parse(content);
            }
            catch (error) {
                this.logService.error(`Error while fetching translations of an extension`, nlsUrl.toString(), (0, errors_1.getErrorMessage)(error));
            }
            return undefined;
        }
        async readInstalledExtensions(profileLocation) {
            return this.withWebExtensions(profileLocation);
        }
        writeInstalledExtensions(profileLocation, updateFn) {
            return this.withWebExtensions(profileLocation, updateFn);
        }
        readCustomBuiltinExtensionsCache() {
            return this.withWebExtensions(this.customBuiltinExtensionsCacheResource);
        }
        writeCustomBuiltinExtensionsCache(updateFn) {
            return this.withWebExtensions(this.customBuiltinExtensionsCacheResource, updateFn);
        }
        readSystemExtensionsCache() {
            return this.withWebExtensions(this.systemExtensionsCacheResource);
        }
        writeSystemExtensionsCache(updateFn) {
            return this.withWebExtensions(this.systemExtensionsCacheResource, updateFn);
        }
        async withWebExtensions(file, updateFn) {
            if (!file) {
                return [];
            }
            return this.getResourceAccessQueue(file).queue(async () => {
                let webExtensions = [];
                // Read
                try {
                    const content = await this.fileService.readFile(file);
                    const storedWebExtensions = JSON.parse(content.value.toString());
                    for (const e of storedWebExtensions) {
                        if (!e.location || !e.identifier || !e.version) {
                            this.logService.info('Ignoring invalid extension while scanning', storedWebExtensions);
                            continue;
                        }
                        let packageNLSUris;
                        if (e.packageNLSUris) {
                            packageNLSUris = new Map();
                            Object.entries(e.packageNLSUris).forEach(([key, value]) => packageNLSUris.set(key, uri_1.URI.revive(value)));
                        }
                        webExtensions.push({
                            identifier: e.identifier,
                            version: e.version,
                            location: uri_1.URI.revive(e.location),
                            manifest: e.manifest,
                            readmeUri: uri_1.URI.revive(e.readmeUri),
                            changelogUri: uri_1.URI.revive(e.changelogUri),
                            packageNLSUris,
                            fallbackPackageNLSUri: uri_1.URI.revive(e.fallbackPackageNLSUri),
                            defaultManifestTranslations: e.defaultManifestTranslations,
                            packageNLSUri: uri_1.URI.revive(e.packageNLSUri),
                            metadata: e.metadata,
                        });
                    }
                    try {
                        webExtensions = await this.migrateWebExtensions(webExtensions, file);
                    }
                    catch (error) {
                        this.logService.error(`Error while migrating scanned extensions in ${file.toString()}`, (0, errors_1.getErrorMessage)(error));
                    }
                }
                catch (error) {
                    /* Ignore */
                    if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                        this.logService.error(error);
                    }
                }
                // Update
                if (updateFn) {
                    await this.storeWebExtensions(webExtensions = updateFn(webExtensions), file);
                }
                return webExtensions;
            });
        }
        async migrateWebExtensions(webExtensions, file) {
            let update = false;
            webExtensions = await Promise.all(webExtensions.map(async (webExtension) => {
                if (!webExtension.manifest) {
                    try {
                        webExtension.manifest = await this.getExtensionManifest(webExtension.location);
                        update = true;
                    }
                    catch (error) {
                        this.logService.error(`Error while updating manifest of an extension in ${file.toString()}`, webExtension.identifier.id, (0, errors_1.getErrorMessage)(error));
                    }
                }
                if ((0, types_1.isUndefined)(webExtension.defaultManifestTranslations)) {
                    if (webExtension.fallbackPackageNLSUri) {
                        try {
                            const content = await this.extensionResourceLoaderService.readExtensionResource(webExtension.fallbackPackageNLSUri);
                            webExtension.defaultManifestTranslations = JSON.parse(content);
                            update = true;
                        }
                        catch (error) {
                            this.logService.error(`Error while fetching default manifest translations of an extension`, webExtension.identifier.id, (0, errors_1.getErrorMessage)(error));
                        }
                    }
                    else {
                        update = true;
                        webExtension.defaultManifestTranslations = null;
                    }
                }
                const migratedLocation = (0, extensionResourceLoader_1.migratePlatformSpecificExtensionGalleryResourceURL)(webExtension.location, "web" /* TargetPlatform.WEB */);
                if (migratedLocation) {
                    update = true;
                    webExtension.location = migratedLocation;
                }
                if ((0, types_1.isUndefined)(webExtension.metadata?.hasPreReleaseVersion) && webExtension.metadata?.preRelease) {
                    update = true;
                    webExtension.metadata.hasPreReleaseVersion = true;
                }
                return webExtension;
            }));
            if (update) {
                await this.storeWebExtensions(webExtensions, file);
            }
            return webExtensions;
        }
        async storeWebExtensions(webExtensions, file) {
            function toStringDictionary(dictionary) {
                if (!dictionary) {
                    return undefined;
                }
                const result = Object.create(null);
                dictionary.forEach((value, key) => result[key] = value.toJSON());
                return result;
            }
            const storedWebExtensions = webExtensions.map(e => ({
                identifier: e.identifier,
                version: e.version,
                manifest: e.manifest,
                location: e.location.toJSON(),
                readmeUri: e.readmeUri?.toJSON(),
                changelogUri: e.changelogUri?.toJSON(),
                packageNLSUris: toStringDictionary(e.packageNLSUris),
                defaultManifestTranslations: e.defaultManifestTranslations,
                fallbackPackageNLSUri: e.fallbackPackageNLSUri?.toJSON(),
                metadata: e.metadata
            }));
            await this.fileService.writeFile(file, buffer_1.VSBuffer.fromString(JSON.stringify(storedWebExtensions)));
        }
        getResourceAccessQueue(file) {
            let resourceQueue = this.resourcesAccessQueueMap.get(file);
            if (!resourceQueue) {
                this.resourcesAccessQueueMap.set(file, resourceQueue = new async_1.Queue());
            }
            return resourceQueue;
        }
    };
    exports.WebExtensionsScannerService = WebExtensionsScannerService;
    exports.WebExtensionsScannerService = WebExtensionsScannerService = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, extensions_1.IBuiltinExtensionsScannerService),
        __param(2, files_1.IFileService),
        __param(3, log_1.ILogService),
        __param(4, extensionManagement_2.IExtensionGalleryService),
        __param(5, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(6, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(7, extensionStorage_1.IExtensionStorageService),
        __param(8, storage_1.IStorageService),
        __param(9, productService_1.IProductService),
        __param(10, userDataProfile_2.IUserDataProfilesService),
        __param(11, uriIdentity_1.IUriIdentityService),
        __param(12, lifecycle_2.ILifecycleService)
    ], WebExtensionsScannerService);
    if (platform_1.isWeb) {
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.extensions.action.openInstalledWebExtensionsResource',
                    title: (0, nls_1.localize2)('openInstalledWebExtensionsResource', 'Open Installed Web Extensions Resource'),
                    category: actionCommonCategories_1.Categories.Developer,
                    f1: true,
                    precondition: contextkeys_1.IsWebContext
                });
            }
            run(serviceAccessor) {
                const editorService = serviceAccessor.get(editorService_1.IEditorService);
                const userDataProfileService = serviceAccessor.get(userDataProfile_1.IUserDataProfileService);
                editorService.openEditor({ resource: userDataProfileService.currentProfile.extensionsResource });
            }
        });
    }
    (0, extensions_2.registerSingleton)(extensionManagement_1.IWebExtensionsScannerService, WebExtensionsScannerService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViRXh0ZW5zaW9uc1NjYW5uZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9uTWFuYWdlbWVudC9icm93c2VyL3dlYkV4dGVuc2lvbnNTY2FubmVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE4Q2hHLFNBQVMsc0JBQXNCLENBQUMsR0FBWTtRQUMzQyxNQUFNLG9CQUFvQixHQUFHLEdBQXVDLENBQUM7UUFDckUsT0FBTyxPQUFPLG9CQUFvQixFQUFFLEVBQUUsS0FBSyxRQUFRO2VBQy9DLENBQUMsb0JBQW9CLENBQUMsVUFBVSxLQUFLLFNBQVMsSUFBSSxPQUFPLG9CQUFvQixDQUFDLFVBQVUsS0FBSyxTQUFTLENBQUM7ZUFDdkcsQ0FBQyxvQkFBb0IsQ0FBQyxrQkFBa0IsS0FBSyxTQUFTLElBQUksT0FBTyxvQkFBb0IsQ0FBQyxrQkFBa0IsS0FBSyxRQUFRLENBQUMsQ0FBQztJQUM1SCxDQUFDO0lBRUQsU0FBUyxlQUFlLENBQUMsS0FBYztRQUN0QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDWixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFDRCxPQUFPLElBQUEsZ0JBQVEsRUFBTyxLQUFNLENBQUMsSUFBSSxDQUFDO1lBQ2pDLElBQUEsZ0JBQVEsRUFBTyxLQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQWdDTSxJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLHNCQUFVO1FBUTFELFlBQ3NDLGtCQUF3RSxFQUMzRSwrQkFBa0YsRUFDdEcsV0FBMEMsRUFDM0MsVUFBd0MsRUFDM0IsY0FBeUQsRUFDOUMsa0NBQXdGLEVBQzVGLDhCQUFnRixFQUN2Rix1QkFBa0Us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