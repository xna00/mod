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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/semver/semver", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/node/pfs", "vs/base/node/zip", "vs/nls", "vs/platform/download/common/download", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/abstractExtensionManagementService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/extensionManagement/node/extensionDownloader", "vs/platform/extensionManagement/node/extensionLifecycle", "vs/platform/extensionManagement/node/extensionManagementUtil", "vs/platform/extensionManagement/node/extensionsManifestCache", "vs/platform/extensionManagement/node/extensionsWatcher", "vs/platform/extensions/common/extensionValidator", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, async_1, buffer_1, cancellation_1, errorMessage_1, errors_1, event_1, hash_1, lifecycle_1, map_1, network_1, path, resources_1, semver, types_1, uri_1, uuid_1, pfs, zip_1, nls, download_1, environment_1, abstractExtensionManagementService_1, extensionManagement_1, extensionManagementUtil_1, extensionsProfileScannerService_1, extensionsScannerService_1, extensionDownloader_1, extensionLifecycle_1, extensionManagementUtil_2, extensionsManifestCache_1, extensionsWatcher_1, extensionValidator_1, files_1, instantiation_1, log_1, productService_1, telemetry_1, uriIdentity_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InstallGalleryExtensionTask = exports.ExtensionsScanner = exports.ExtensionManagementService = exports.INativeServerExtensionManagementService = void 0;
    exports.INativeServerExtensionManagementService = (0, instantiation_1.refineServiceDecorator)(extensionManagement_1.IExtensionManagementService);
    const DELETED_FOLDER_POSTFIX = '.vsctmp';
    let ExtensionManagementService = class ExtensionManagementService extends abstractExtensionManagementService_1.AbstractExtensionManagementService {
        constructor(galleryService, telemetryService, logService, environmentService, extensionsScannerService, extensionsProfileScannerService, downloadService, instantiationService, fileService, productService, uriIdentityService, userDataProfilesService) {
            super(galleryService, telemetryService, uriIdentityService, logService, productService, userDataProfilesService);
            this.extensionsScannerService = extensionsScannerService;
            this.extensionsProfileScannerService = extensionsProfileScannerService;
            this.downloadService = downloadService;
            this.fileService = fileService;
            this.installGalleryExtensionsTasks = new Map();
            this.knownDirectories = new map_1.ResourceSet();
            const extensionLifecycle = this._register(instantiationService.createInstance(extensionLifecycle_1.ExtensionsLifecycle));
            this.extensionsScanner = this._register(instantiationService.createInstance(ExtensionsScanner, extension => extensionLifecycle.postUninstall(extension)));
            this.manifestCache = this._register(new extensionsManifestCache_1.ExtensionsManifestCache(userDataProfilesService, fileService, uriIdentityService, this, this.logService));
            this.extensionsDownloader = this._register(instantiationService.createInstance(extensionDownloader_1.ExtensionsDownloader));
            const extensionsWatcher = this._register(new extensionsWatcher_1.ExtensionsWatcher(this, this.extensionsScannerService, userDataProfilesService, extensionsProfileScannerService, uriIdentityService, fileService, logService));
            this._register(extensionsWatcher.onDidChangeExtensionsByAnotherSource(e => this.onDidChangeExtensionsFromAnotherSource(e)));
            this.watchForExtensionsNotInstalledBySystem();
        }
        getTargetPlatform() {
            if (!this._targetPlatformPromise) {
                this._targetPlatformPromise = (0, extensionManagementUtil_1.computeTargetPlatform)(this.fileService, this.logService);
            }
            return this._targetPlatformPromise;
        }
        async zip(extension) {
            this.logService.trace('ExtensionManagementService#zip', extension.identifier.id);
            const files = await this.collectFiles(extension);
            const location = await (0, zip_1.zip)((0, resources_1.joinPath)(this.extensionsDownloader.extensionsDownloadDir, (0, uuid_1.generateUuid)()).fsPath, files);
            return uri_1.URI.file(location);
        }
        async unzip(zipLocation) {
            this.logService.trace('ExtensionManagementService#unzip', zipLocation.toString());
            const local = await this.install(zipLocation);
            return local.identifier;
        }
        async getManifest(vsix) {
            const { location, cleanup } = await this.downloadVsix(vsix);
            const zipPath = path.resolve(location.fsPath);
            try {
                return await (0, extensionManagementUtil_2.getManifest)(zipPath);
            }
            finally {
                await cleanup();
            }
        }
        getInstalled(type, profileLocation = this.userDataProfilesService.defaultProfile.extensionsResource, productVersion = { version: this.productService.version, date: this.productService.date }) {
            return this.extensionsScanner.scanExtensions(type ?? null, profileLocation, productVersion);
        }
        scanAllUserInstalledExtensions() {
            return this.extensionsScanner.scanAllUserExtensions(false);
        }
        scanInstalledExtensionAtLocation(location) {
            return this.extensionsScanner.scanUserExtensionAtLocation(location);
        }
        async install(vsix, options = {}) {
            this.logService.trace('ExtensionManagementService#install', vsix.toString());
            const { location, cleanup } = await this.downloadVsix(vsix);
            try {
                const manifest = await (0, extensionManagementUtil_2.getManifest)(path.resolve(location.fsPath));
                const extensionId = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
                if (manifest.engines && manifest.engines.vscode && !(0, extensionValidator_1.isEngineValid)(manifest.engines.vscode, this.productService.version, this.productService.date)) {
                    throw new Error(nls.localize('incompatible', "Unable to install extension '{0}' as it is not compatible with VS Code '{1}'.", extensionId, this.productService.version));
                }
                const results = await this.installExtensions([{ manifest, extension: location, options }]);
                const result = results.find(({ identifier }) => (0, extensionManagementUtil_1.areSameExtensions)(identifier, { id: extensionId }));
                if (result?.local) {
                    return result.local;
                }
                if (result?.error) {
                    throw result.error;
                }
                throw (0, abstractExtensionManagementService_1.toExtensionManagementError)(new Error(`Unknown error while installing extension ${extensionId}`));
            }
            finally {
                await cleanup();
            }
        }
        async installFromLocation(location, profileLocation) {
            this.logService.trace('ExtensionManagementService#installFromLocation', location.toString());
            const local = await this.extensionsScanner.scanUserExtensionAtLocation(location);
            if (!local || !local.manifest.name || !local.manifest.version) {
                throw new Error(`Cannot find a valid extension from the location ${location.toString()}`);
            }
            await this.addExtensionsToProfile([[local, { source: 'resource' }]], profileLocation);
            this.logService.info('Successfully installed extension', local.identifier.id, profileLocation.toString());
            return local;
        }
        async installExtensionsFromProfile(extensions, fromProfileLocation, toProfileLocation) {
            this.logService.trace('ExtensionManagementService#installExtensionsFromProfile', extensions, fromProfileLocation.toString(), toProfileLocation.toString());
            const extensionsToInstall = (await this.getInstalled(1 /* ExtensionType.User */, fromProfileLocation)).filter(e => extensions.some(id => (0, extensionManagementUtil_1.areSameExtensions)(id, e.identifier)));
            if (extensionsToInstall.length) {
                const metadata = await Promise.all(extensionsToInstall.map(e => this.extensionsScanner.scanMetadata(e, fromProfileLocation)));
                await this.addExtensionsToProfile(extensionsToInstall.map((e, index) => [e, metadata[index]]), toProfileLocation);
                this.logService.info('Successfully installed extensions', extensionsToInstall.map(e => e.identifier.id), toProfileLocation.toString());
            }
            return extensionsToInstall;
        }
        async updateMetadata(local, metadata, profileLocation = this.userDataProfilesService.defaultProfile.extensionsResource) {
            this.logService.trace('ExtensionManagementService#updateMetadata', local.identifier.id);
            if (metadata.isPreReleaseVersion) {
                metadata.preRelease = true;
                metadata.hasPreReleaseVersion = true;
            }
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
            local = await this.extensionsScanner.updateMetadata(local, metadata, profileLocation);
            this.manifestCache.invalidate(profileLocation);
            this._onDidUpdateExtensionMetadata.fire(local);
            return local;
        }
        async reinstallFromGallery(extension) {
            this.logService.trace('ExtensionManagementService#reinstallFromGallery', extension.identifier.id);
            if (!this.galleryService.isEnabled()) {
                throw new Error(nls.localize('MarketPlaceDisabled', "Marketplace is not enabled"));
            }
            const targetPlatform = await this.getTargetPlatform();
            const [galleryExtension] = await this.galleryService.getExtensions([{ ...extension.identifier, preRelease: extension.preRelease }], { targetPlatform, compatible: true }, cancellation_1.CancellationToken.None);
            if (!galleryExtension) {
                throw new Error(nls.localize('Not a Marketplace extension', "Only Marketplace Extensions can be reinstalled"));
            }
            await this.extensionsScanner.setUninstalled(extension);
            try {
                await this.extensionsScanner.removeUninstalledExtension(extension);
            }
            catch (e) {
                throw new Error(nls.localize('removeError', "Error while removing the extension: {0}. Please Quit and Start VS Code before trying again.", (0, errorMessage_1.toErrorMessage)(e)));
            }
            return this.installFromGallery(galleryExtension);
        }
        copyExtension(extension, fromProfileLocation, toProfileLocation, metadata) {
            return this.extensionsScanner.copyExtension(extension, fromProfileLocation, toProfileLocation, metadata);
        }
        copyExtensions(fromProfileLocation, toProfileLocation) {
            return this.extensionsScanner.copyExtensions(fromProfileLocation, toProfileLocation, { version: this.productService.version, date: this.productService.date });
        }
        markAsUninstalled(...extensions) {
            return this.extensionsScanner.setUninstalled(...extensions);
        }
        async cleanUp() {
            this.logService.trace('ExtensionManagementService#cleanUp');
            try {
                await this.extensionsScanner.cleanUp();
            }
            catch (error) {
                this.logService.error(error);
            }
        }
        async download(extension, operation, donotVerifySignature) {
            const { location } = await this.extensionsDownloader.download(extension, operation, !donotVerifySignature);
            return location;
        }
        async downloadVsix(vsix) {
            if (vsix.scheme === network_1.Schemas.file) {
                return { location: vsix, async cleanup() { } };
            }
            this.logService.trace('Downloading extension from', vsix.toString());
            const location = (0, resources_1.joinPath)(this.extensionsDownloader.extensionsDownloadDir, (0, uuid_1.generateUuid)());
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
        getCurrentExtensionsManifestLocation() {
            return this.userDataProfilesService.defaultProfile.extensionsResource;
        }
        createInstallExtensionTask(manifest, extension, options) {
            if (uri_1.URI.isUri(extension)) {
                return new InstallVSIXTask(manifest, extension, options, this.galleryService, this.extensionsScanner, this.uriIdentityService, this.userDataProfilesService, this.extensionsScannerService, this.extensionsProfileScannerService, this.logService);
            }
            const key = extensionManagementUtil_1.ExtensionKey.create(extension).toString();
            let installExtensionTask = this.installGalleryExtensionsTasks.get(key);
            if (!installExtensionTask) {
                this.installGalleryExtensionsTasks.set(key, installExtensionTask = new InstallGalleryExtensionTask(manifest, extension, options, this.extensionsDownloader, this.extensionsScanner, this.uriIdentityService, this.userDataProfilesService, this.extensionsScannerService, this.extensionsProfileScannerService, this.logService, this.telemetryService));
                installExtensionTask.waitUntilTaskIsFinished().finally(() => this.installGalleryExtensionsTasks.delete(key));
            }
            return installExtensionTask;
        }
        createUninstallExtensionTask(extension, options) {
            return new UninstallExtensionTask(extension, options.profileLocation, this.extensionsProfileScannerService);
        }
        async collectFiles(extension) {
            const collectFilesFromDirectory = async (dir) => {
                let entries = await pfs.Promises.readdir(dir);
                entries = entries.map(e => path.join(dir, e));
                const stats = await Promise.all(entries.map(e => pfs.Promises.stat(e)));
                let promise = Promise.resolve([]);
                stats.forEach((stat, index) => {
                    const entry = entries[index];
                    if (stat.isFile()) {
                        promise = promise.then(result => ([...result, entry]));
                    }
                    if (stat.isDirectory()) {
                        promise = promise
                            .then(result => collectFilesFromDirectory(entry)
                            .then(files => ([...result, ...files])));
                    }
                });
                return promise;
            };
            const files = await collectFilesFromDirectory(extension.location.fsPath);
            return files.map(f => ({ path: `extension/${path.relative(extension.location.fsPath, f)}`, localPath: f }));
        }
        async onDidChangeExtensionsFromAnotherSource({ added, removed }) {
            if (removed) {
                const removedExtensions = added && this.uriIdentityService.extUri.isEqual(removed.profileLocation, added.profileLocation)
                    ? removed.extensions.filter(e => added.extensions.every(identifier => !(0, extensionManagementUtil_1.areSameExtensions)(identifier, e)))
                    : removed.extensions;
                for (const identifier of removedExtensions) {
                    this.logService.info('Extensions removed from another source', identifier.id, removed.profileLocation.toString());
                    this._onDidUninstallExtension.fire({ identifier, profileLocation: removed.profileLocation });
                }
            }
            if (added) {
                const extensions = await this.getInstalled(1 /* ExtensionType.User */, added.profileLocation);
                const addedExtensions = extensions.filter(e => added.extensions.some(identifier => (0, extensionManagementUtil_1.areSameExtensions)(identifier, e.identifier)));
                this._onDidInstallExtensions.fire(addedExtensions.map(local => {
                    this.logService.info('Extensions added from another source', local.identifier.id, added.profileLocation.toString());
                    return { identifier: local.identifier, local, profileLocation: added.profileLocation, operation: 1 /* InstallOperation.None */ };
                }));
            }
        }
        async watchForExtensionsNotInstalledBySystem() {
            this._register(this.extensionsScanner.onExtract(resource => this.knownDirectories.add(resource)));
            const stat = await this.fileService.resolve(this.extensionsScannerService.userExtensionsLocation);
            for (const childStat of stat.children ?? []) {
                if (childStat.isDirectory) {
                    this.knownDirectories.add(childStat.resource);
                }
            }
            this._register(this.fileService.watch(this.extensionsScannerService.userExtensionsLocation));
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
        }
        async onDidFilesChange(e) {
            if (!e.affects(this.extensionsScannerService.userExtensionsLocation, 1 /* FileChangeType.ADDED */)) {
                return;
            }
            const added = [];
            for (const resource of e.rawAdded) {
                // Check if this is a known directory
                if (this.knownDirectories.has(resource)) {
                    continue;
                }
                // Is not immediate child of extensions resource
                if (!this.uriIdentityService.extUri.isEqual(this.uriIdentityService.extUri.dirname(resource), this.extensionsScannerService.userExtensionsLocation)) {
                    continue;
                }
                // .obsolete file changed
                if (this.uriIdentityService.extUri.isEqual(resource, this.uriIdentityService.extUri.joinPath(this.extensionsScannerService.userExtensionsLocation, '.obsolete'))) {
                    continue;
                }
                // Ignore changes to files starting with `.`
                if (this.uriIdentityService.extUri.basename(resource).startsWith('.')) {
                    continue;
                }
                // Check if this is a directory
                if (!(await this.fileService.stat(resource)).isDirectory) {
                    continue;
                }
                // Check if this is an extension added by another source
                // Extension added by another source will not have installed timestamp
                const extension = await this.extensionsScanner.scanUserExtensionAtLocation(resource);
                if (extension && extension.installedTimestamp === undefined) {
                    this.knownDirectories.add(resource);
                    added.push(extension);
                }
            }
            if (added.length) {
                await this.addExtensionsToProfile(added.map(e => [e, undefined]), this.userDataProfilesService.defaultProfile.extensionsResource);
                this.logService.info('Added extensions to default profile from external source', added.map(e => e.identifier.id));
            }
        }
        async addExtensionsToProfile(extensions, profileLocation) {
            const localExtensions = extensions.map(e => e[0]);
            await this.setInstalled(localExtensions);
            await this.extensionsProfileScannerService.addExtensionsToProfile(extensions, profileLocation);
            this._onDidInstallExtensions.fire(localExtensions.map(local => ({ local, identifier: local.identifier, operation: 1 /* InstallOperation.None */, profileLocation })));
        }
        async setInstalled(extensions) {
            const uninstalled = await this.extensionsScanner.getUninstalledExtensions();
            for (const extension of extensions) {
                const extensionKey = extensionManagementUtil_1.ExtensionKey.create(extension);
                if (!uninstalled[extensionKey.toString()]) {
                    continue;
                }
                this.logService.trace('Removing the extension from uninstalled list:', extensionKey.id);
                await this.extensionsScanner.setInstalled(extensionKey);
                this.logService.info('Removed the extension from uninstalled list:', extensionKey.id);
            }
        }
    };
    exports.ExtensionManagementService = ExtensionManagementService;
    exports.ExtensionManagementService = ExtensionManagementService = __decorate([
        __param(0, extensionManagement_1.IExtensionGalleryService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, log_1.ILogService),
        __param(3, environment_1.INativeEnvironmentService),
        __param(4, extensionsScannerService_1.IExtensionsScannerService),
        __param(5, extensionsProfileScannerService_1.IExtensionsProfileScannerService),
        __param(6, download_1.IDownloadService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, files_1.IFileService),
        __param(9, productService_1.IProductService),
        __param(10, uriIdentity_1.IUriIdentityService),
        __param(11, userDataProfile_1.IUserDataProfilesService)
    ], ExtensionManagementService);
    let ExtensionsScanner = class ExtensionsScanner extends lifecycle_1.Disposable {
        constructor(beforeRemovingExtension, fileService, extensionsScannerService, extensionsProfileScannerService, uriIdentityService, logService) {
            super();
            this.beforeRemovingExtension = beforeRemovingExtension;
            this.fileService = fileService;
            this.extensionsScannerService = extensionsScannerService;
            this.extensionsProfileScannerService = extensionsProfileScannerService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this._onExtract = this._register(new event_1.Emitter());
            this.onExtract = this._onExtract.event;
            this.uninstalledResource = (0, resources_1.joinPath)(this.extensionsScannerService.userExtensionsLocation, '.obsolete');
            this.uninstalledFileLimiter = new async_1.Queue();
        }
        async cleanUp() {
            await this.removeTemporarilyDeletedFolders();
            await this.removeUninstalledExtensions();
        }
        async scanExtensions(type, profileLocation, productVersion) {
            const userScanOptions = { includeInvalid: true, profileLocation, productVersion };
            let scannedExtensions = [];
            if (type === null || type === 0 /* ExtensionType.System */) {
                scannedExtensions.push(...await this.extensionsScannerService.scanAllExtensions({ includeInvalid: true }, userScanOptions, false));
            }
            else if (type === 1 /* ExtensionType.User */) {
                scannedExtensions.push(...await this.extensionsScannerService.scanUserExtensions(userScanOptions));
            }
            scannedExtensions = type !== null ? scannedExtensions.filter(r => r.type === type) : scannedExtensions;
            return Promise.all(scannedExtensions.map(extension => this.toLocalExtension(extension)));
        }
        async scanAllUserExtensions(excludeOutdated) {
            const scannedExtensions = await this.extensionsScannerService.scanUserExtensions({ includeAllVersions: !excludeOutdated, includeInvalid: true });
            return Promise.all(scannedExtensions.map(extension => this.toLocalExtension(extension)));
        }
        async scanUserExtensionAtLocation(location) {
            try {
                const scannedExtension = await this.extensionsScannerService.scanExistingExtension(location, 1 /* ExtensionType.User */, { includeInvalid: true });
                if (scannedExtension) {
                    return await this.toLocalExtension(scannedExtension);
                }
            }
            catch (error) {
                this.logService.error(error);
            }
            return null;
        }
        async extractUserExtension(extensionKey, zipPath, metadata, removeIfExists, token) {
            const folderName = extensionKey.toString();
            const tempLocation = uri_1.URI.file(path.join(this.extensionsScannerService.userExtensionsLocation.fsPath, `.${(0, uuid_1.generateUuid)()}`));
            const extensionLocation = uri_1.URI.file(path.join(this.extensionsScannerService.userExtensionsLocation.fsPath, folderName));
            let exists = await this.fileService.exists(extensionLocation);
            if (exists && removeIfExists) {
                try {
                    await this.deleteExtensionFromLocation(extensionKey.id, extensionLocation, 'removeExisting');
                }
                catch (error) {
                    throw new extensionManagement_1.ExtensionManagementError(nls.localize('errorDeleting', "Unable to delete the existing folder '{0}' while installing the extension '{1}'. Please delete the folder manually and try again", extensionLocation.fsPath, extensionKey.id), extensionManagement_1.ExtensionManagementErrorCode.Delete);
                }
                exists = false;
            }
            if (exists) {
                await this.extensionsScannerService.updateMetadata(extensionLocation, metadata);
            }
            else {
                try {
                    // Extract
                    try {
                        this.logService.trace(`Started extracting the extension from ${zipPath} to ${extensionLocation.fsPath}`);
                        await (0, zip_1.extract)(zipPath, tempLocation.fsPath, { sourcePath: 'extension', overwrite: true }, token);
                        this.logService.info(`Extracted extension to ${extensionLocation}:`, extensionKey.id);
                    }
                    catch (e) {
                        let errorCode = extensionManagement_1.ExtensionManagementErrorCode.Extract;
                        if (e instanceof zip_1.ExtractError) {
                            if (e.type === 'CorruptZip') {
                                errorCode = extensionManagement_1.ExtensionManagementErrorCode.CorruptZip;
                            }
                            else if (e.type === 'Incomplete') {
                                errorCode = extensionManagement_1.ExtensionManagementErrorCode.IncompleteZip;
                            }
                        }
                        throw new extensionManagement_1.ExtensionManagementError(e.message, errorCode);
                    }
                    await this.extensionsScannerService.updateMetadata(tempLocation, metadata);
                    // Rename
                    try {
                        this.logService.trace(`Started renaming the extension from ${tempLocation.fsPath} to ${extensionLocation.fsPath}`);
                        await this.rename(tempLocation.fsPath, extensionLocation.fsPath);
                        this.logService.info('Renamed to', extensionLocation.fsPath);
                    }
                    catch (error) {
                        if (error.code === 'ENOTEMPTY') {
                            this.logService.info(`Rename failed because extension was installed by another source. So ignoring renaming.`, extensionKey.id);
                        }
                        else {
                            this.logService.info(`Rename failed because of ${(0, errors_1.getErrorMessage)(error)}. Deleted from extracted location`, tempLocation);
                            throw error;
                        }
                    }
                    this._onExtract.fire(extensionLocation);
                }
                catch (error) {
                    try {
                        await this.fileService.del(tempLocation, { recursive: true });
                    }
                    catch (e) { /* ignore */ }
                    throw error;
                }
            }
            return this.scanLocalExtension(extensionLocation, 1 /* ExtensionType.User */);
        }
        async scanMetadata(local, profileLocation) {
            if (profileLocation) {
                const extension = await this.getScannedExtension(local, profileLocation);
                return extension?.metadata;
            }
            else {
                return this.extensionsScannerService.scanMetadata(local.location);
            }
        }
        async getScannedExtension(local, profileLocation) {
            const extensions = await this.extensionsProfileScannerService.scanProfileExtensions(profileLocation);
            return extensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, local.identifier));
        }
        async updateMetadata(local, metadata, profileLocation) {
            if (profileLocation) {
                await this.extensionsProfileScannerService.updateMetadata([[local, metadata]], profileLocation);
            }
            else {
                await this.extensionsScannerService.updateMetadata(local.location, metadata);
            }
            return this.scanLocalExtension(local.location, local.type, profileLocation);
        }
        getUninstalledExtensions() {
            return this.withUninstalledExtensions();
        }
        async setUninstalled(...extensions) {
            const extensionKeys = extensions.map(e => extensionManagementUtil_1.ExtensionKey.create(e));
            await this.withUninstalledExtensions(uninstalled => extensionKeys.forEach(extensionKey => {
                uninstalled[extensionKey.toString()] = true;
                this.logService.info('Marked extension as uninstalled', extensionKey.toString());
            }));
        }
        async setInstalled(extensionKey) {
            await this.withUninstalledExtensions(uninstalled => delete uninstalled[extensionKey.toString()]);
        }
        async removeExtension(extension, type) {
            if (this.uriIdentityService.extUri.isEqualOrParent(extension.location, this.extensionsScannerService.userExtensionsLocation)) {
                return this.deleteExtensionFromLocation(extension.identifier.id, extension.location, type);
            }
        }
        async removeUninstalledExtension(extension) {
            await this.removeExtension(extension, 'uninstalled');
            await this.withUninstalledExtensions(uninstalled => delete uninstalled[extensionManagementUtil_1.ExtensionKey.create(extension).toString()]);
        }
        async copyExtension(extension, fromProfileLocation, toProfileLocation, metadata) {
            const source = await this.getScannedExtension(extension, fromProfileLocation);
            const target = await this.getScannedExtension(extension, toProfileLocation);
            metadata = { ...source?.metadata, ...metadata };
            if (target) {
                if (this.uriIdentityService.extUri.isEqual(target.location, extension.location)) {
                    await this.extensionsProfileScannerService.updateMetadata([[extension, { ...target.metadata, ...metadata }]], toProfileLocation);
                }
                else {
                    const targetExtension = await this.scanLocalExtension(target.location, extension.type, toProfileLocation);
                    await this.extensionsProfileScannerService.removeExtensionFromProfile(targetExtension, toProfileLocation);
                    await this.extensionsProfileScannerService.addExtensionsToProfile([[extension, { ...target.metadata, ...metadata }]], toProfileLocation);
                }
            }
            else {
                await this.extensionsProfileScannerService.addExtensionsToProfile([[extension, metadata]], toProfileLocation);
            }
            return this.scanLocalExtension(extension.location, extension.type, toProfileLocation);
        }
        async copyExtensions(fromProfileLocation, toProfileLocation, productVersion) {
            const fromExtensions = await this.scanExtensions(1 /* ExtensionType.User */, fromProfileLocation, productVersion);
            const extensions = await Promise.all(fromExtensions
                .filter(e => !e.isApplicationScoped) /* remove application scoped extensions */
                .map(async (e) => ([e, await this.scanMetadata(e, fromProfileLocation)])));
            await this.extensionsProfileScannerService.addExtensionsToProfile(extensions, toProfileLocation);
        }
        async deleteExtensionFromLocation(id, location, type) {
            this.logService.trace(`Deleting ${type} extension from disk`, id, location.fsPath);
            const renamedLocation = this.uriIdentityService.extUri.joinPath(this.uriIdentityService.extUri.dirname(location), `${this.uriIdentityService.extUri.basename(location)}.${(0, hash_1.hash)((0, uuid_1.generateUuid)()).toString(16)}${DELETED_FOLDER_POSTFIX}`);
            await this.rename(location.fsPath, renamedLocation.fsPath);
            await this.fileService.del(renamedLocation, { recursive: true });
            this.logService.info(`Deleted ${type} extension from disk`, id, location.fsPath);
        }
        async withUninstalledExtensions(updateFn) {
            return this.uninstalledFileLimiter.queue(async () => {
                let raw;
                try {
                    const content = await this.fileService.readFile(this.uninstalledResource, 'utf8');
                    raw = content.value.toString();
                }
                catch (error) {
                    if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                        throw error;
                    }
                }
                let uninstalled = {};
                if (raw) {
                    try {
                        uninstalled = JSON.parse(raw);
                    }
                    catch (e) { /* ignore */ }
                }
                if (updateFn) {
                    updateFn(uninstalled);
                    if (Object.keys(uninstalled).length) {
                        await this.fileService.writeFile(this.uninstalledResource, buffer_1.VSBuffer.fromString(JSON.stringify(uninstalled)));
                    }
                    else {
                        await this.fileService.del(this.uninstalledResource);
                    }
                }
                return uninstalled;
            });
        }
        async rename(extractPath, renamePath) {
            try {
                await pfs.Promises.rename(extractPath, renamePath, 2 * 60 * 1000 /* Retry for 2 minutes */);
            }
            catch (error) {
                throw new extensionManagement_1.ExtensionManagementError(error.message || nls.localize('renameError', "Unknown error while renaming {0} to {1}", extractPath, renamePath), error.code || extensionManagement_1.ExtensionManagementErrorCode.Rename);
            }
        }
        async scanLocalExtension(location, type, profileLocation) {
            if (profileLocation) {
                const scannedExtensions = await this.extensionsScannerService.scanUserExtensions({ profileLocation });
                const scannedExtension = scannedExtensions.find(e => this.uriIdentityService.extUri.isEqual(e.location, location));
                if (scannedExtension) {
                    return this.toLocalExtension(scannedExtension);
                }
            }
            else {
                const scannedExtension = await this.extensionsScannerService.scanExistingExtension(location, type, { includeInvalid: true });
                if (scannedExtension) {
                    return this.toLocalExtension(scannedExtension);
                }
            }
            throw new Error(nls.localize('cannot read', "Cannot read the extension from {0}", location.path));
        }
        async toLocalExtension(extension) {
            const stat = await this.fileService.resolve(extension.location);
            let readmeUrl;
            let changelogUrl;
            if (stat.children) {
                readmeUrl = stat.children.find(({ name }) => /^readme(\.txt|\.md|)$/i.test(name))?.resource;
                changelogUrl = stat.children.find(({ name }) => /^changelog(\.txt|\.md|)$/i.test(name))?.resource;
            }
            return {
                identifier: extension.identifier,
                type: extension.type,
                isBuiltin: extension.isBuiltin || !!extension.metadata?.isBuiltin,
                location: extension.location,
                manifest: extension.manifest,
                targetPlatform: extension.targetPlatform,
                validations: extension.validations,
                isValid: extension.isValid,
                readmeUrl,
                changelogUrl,
                publisherDisplayName: extension.metadata?.publisherDisplayName || null,
                publisherId: extension.metadata?.publisherId || null,
                isApplicationScoped: !!extension.metadata?.isApplicationScoped,
                isMachineScoped: !!extension.metadata?.isMachineScoped,
                isPreReleaseVersion: !!extension.metadata?.isPreReleaseVersion,
                hasPreReleaseVersion: !!extension.metadata?.hasPreReleaseVersion,
                preRelease: !!extension.metadata?.preRelease,
                installedTimestamp: extension.metadata?.installedTimestamp,
                updated: !!extension.metadata?.updated,
                pinned: !!extension.metadata?.pinned,
                isWorkspaceScoped: false,
                source: extension.metadata?.source ?? (extension.identifier.uuid ? 'gallery' : 'vsix')
            };
        }
        async removeUninstalledExtensions() {
            const uninstalled = await this.getUninstalledExtensions();
            if (Object.keys(uninstalled).length === 0) {
                this.logService.debug(`No uninstalled extensions found.`);
                return;
            }
            this.logService.debug(`Removing uninstalled extensions:`, Object.keys(uninstalled));
            const extensions = await this.extensionsScannerService.scanUserExtensions({ includeAllVersions: true, includeUninstalled: true, includeInvalid: true }); // All user extensions
            const installed = new Set();
            for (const e of extensions) {
                if (!uninstalled[extensionManagementUtil_1.ExtensionKey.create(e).toString()]) {
                    installed.add(e.identifier.id.toLowerCase());
                }
            }
            try {
                // running post uninstall tasks for extensions that are not installed anymore
                const byExtension = (0, extensionManagementUtil_1.groupByExtension)(extensions, e => e.identifier);
                await async_1.Promises.settled(byExtension.map(async (e) => {
                    const latest = e.sort((a, b) => semver.rcompare(a.manifest.version, b.manifest.version))[0];
                    if (!installed.has(latest.identifier.id.toLowerCase())) {
                        await this.beforeRemovingExtension(await this.toLocalExtension(latest));
                    }
                }));
            }
            catch (error) {
                this.logService.error(error);
            }
            const toRemove = extensions.filter(e => e.metadata /* Installed by System */ && uninstalled[extensionManagementUtil_1.ExtensionKey.create(e).toString()]);
            await Promise.allSettled(toRemove.map(e => this.removeUninstalledExtension(e)));
        }
        async removeTemporarilyDeletedFolders() {
            this.logService.trace('ExtensionManagementService#removeTempDeleteFolders');
            let stat;
            try {
                stat = await this.fileService.resolve(this.extensionsScannerService.userExtensionsLocation);
            }
            catch (error) {
                if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.error(error);
                }
                return;
            }
            if (!stat?.children) {
                return;
            }
            try {
                await Promise.allSettled(stat.children.map(async (child) => {
                    if (!child.isDirectory || !child.name.endsWith(DELETED_FOLDER_POSTFIX)) {
                        return;
                    }
                    this.logService.trace('Deleting the temporarily deleted folder', child.resource.toString());
                    try {
                        await this.fileService.del(child.resource, { recursive: true });
                        this.logService.trace('Deleted the temporarily deleted folder', child.resource.toString());
                    }
                    catch (error) {
                        if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                            this.logService.error(error);
                        }
                    }
                }));
            }
            catch (error) { /* ignore */ }
        }
    };
    exports.ExtensionsScanner = ExtensionsScanner;
    exports.ExtensionsScanner = ExtensionsScanner = __decorate([
        __param(1, files_1.IFileService),
        __param(2, extensionsScannerService_1.IExtensionsScannerService),
        __param(3, extensionsProfileScannerService_1.IExtensionsProfileScannerService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, log_1.ILogService)
    ], ExtensionsScanner);
    class InstallExtensionTask extends abstractExtensionManagementService_1.AbstractExtensionTask {
        get profileLocation() { return this._profileLocation; }
        get verificationStatus() { return this._verificationStatus; }
        get operation() { return (0, types_1.isUndefined)(this.options.operation) ? this._operation : this.options.operation; }
        constructor(identifier, source, options, extensionsScanner, uriIdentityService, userDataProfilesService, extensionsScannerService, extensionsProfileScannerService, logService) {
            super();
            this.identifier = identifier;
            this.source = source;
            this.options = options;
            this.extensionsScanner = extensionsScanner;
            this.uriIdentityService = uriIdentityService;
            this.userDataProfilesService = userDataProfilesService;
            this.extensionsScannerService = extensionsScannerService;
            this.extensionsProfileScannerService = extensionsProfileScannerService;
            this.logService = logService;
            this._profileLocation = this.options.profileLocation;
            this._verificationStatus = false;
            this._operation = 2 /* InstallOperation.Install */;
        }
        async doRun(token) {
            const [local, metadata] = await this.install(token);
            this._profileLocation = local.isBuiltin || local.isApplicationScoped ? this.userDataProfilesService.defaultProfile.extensionsResource : this.options.profileLocation;
            if (this.uriIdentityService.extUri.isEqual(this.userDataProfilesService.defaultProfile.extensionsResource, this._profileLocation)) {
                await this.extensionsScannerService.initializeDefaultProfileExtensions();
            }
            await this.extensionsProfileScannerService.addExtensionsToProfile([[local, metadata]], this._profileLocation, !local.isValid);
            return local;
        }
        async extractExtension({ zipPath, key, metadata }, removeIfExists, token) {
            let local = await this.unsetIfUninstalled(key);
            if (local) {
                local = await this.extensionsScanner.updateMetadata(local, metadata);
            }
            else {
                this.logService.trace('Extracting extension...', key.id);
                local = await this.extensionsScanner.extractUserExtension(key, zipPath, metadata, removeIfExists, token);
                this.logService.info('Extracting extension completed.', key.id);
            }
            return local;
        }
        async unsetIfUninstalled(extensionKey) {
            const isUninstalled = await this.isUninstalled(extensionKey);
            if (!isUninstalled) {
                return undefined;
            }
            this.logService.trace('Removing the extension from uninstalled list:', extensionKey.id);
            // If the same version of extension is marked as uninstalled, remove it from there and return the local.
            await this.extensionsScanner.setInstalled(extensionKey);
            this.logService.info('Removed the extension from uninstalled list:', extensionKey.id);
            const userExtensions = await this.extensionsScanner.scanAllUserExtensions(true);
            return userExtensions.find(i => extensionManagementUtil_1.ExtensionKey.create(i).equals(extensionKey));
        }
        async isUninstalled(extensionId) {
            const uninstalled = await this.extensionsScanner.getUninstalledExtensions();
            return !!uninstalled[extensionId.toString()];
        }
    }
    class InstallGalleryExtensionTask extends InstallExtensionTask {
        constructor(manifest, gallery, options, extensionsDownloader, extensionsScanner, uriIdentityService, userDataProfilesService, extensionsScannerService, extensionsProfileScannerService, logService, telemetryService) {
            super(gallery.identifier, gallery, options, extensionsScanner, uriIdentityService, userDataProfilesService, extensionsScannerService, extensionsProfileScannerService, logService);
            this.gallery = gallery;
            this.extensionsDownloader = extensionsDownloader;
            this.telemetryService = telemetryService;
        }
        async install(token) {
            let installed;
            try {
                installed = await this.extensionsScanner.scanExtensions(null, this.options.profileLocation, this.options.productVersion);
            }
            catch (error) {
                throw new extensionManagement_1.ExtensionManagementError(error, extensionManagement_1.ExtensionManagementErrorCode.Scanning);
            }
            const existingExtension = installed.find(i => (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, this.gallery.identifier));
            if (existingExtension) {
                this._operation = 3 /* InstallOperation.Update */;
            }
            const metadata = {
                id: this.gallery.identifier.uuid,
                publisherId: this.gallery.publisherId,
                publisherDisplayName: this.gallery.publisherDisplayName,
                targetPlatform: this.gallery.properties.targetPlatform,
                isApplicationScoped: this.options.isApplicationScoped || existingExtension?.isApplicationScoped,
                isMachineScoped: this.options.isMachineScoped || existingExtension?.isMachineScoped,
                isBuiltin: this.options.isBuiltin || existingExtension?.isBuiltin,
                isSystem: existingExtension?.type === 0 /* ExtensionType.System */ ? true : undefined,
                updated: !!existingExtension,
                isPreReleaseVersion: this.gallery.properties.isPreReleaseVersion,
                hasPreReleaseVersion: existingExtension?.hasPreReleaseVersion || this.gallery.properties.isPreReleaseVersion,
                installedTimestamp: Date.now(),
                pinned: this.options.installGivenVersion ? true : (this.options.pinned ?? existingExtension?.pinned),
                preRelease: (0, types_1.isBoolean)(this.options.preRelease)
                    ? this.options.preRelease
                    : this.options.installPreReleaseVersion || this.gallery.properties.isPreReleaseVersion || existingExtension?.preRelease,
                source: 'gallery',
            };
            if (existingExtension?.manifest.version === this.gallery.version) {
                try {
                    const local = await this.extensionsScanner.updateMetadata(existingExtension, metadata);
                    return [local, metadata];
                }
                catch (error) {
                    throw new extensionManagement_1.ExtensionManagementError((0, errors_1.getErrorMessage)(error), extensionManagement_1.ExtensionManagementErrorCode.UpdateMetadata);
                }
            }
            try {
                return await this.downloadAndInstallExtension(metadata, token);
            }
            catch (error) {
                if (error instanceof extensionManagement_1.ExtensionManagementError && (error.code === extensionManagement_1.ExtensionManagementErrorCode.CorruptZip || error.code === extensionManagement_1.ExtensionManagementErrorCode.IncompleteZip)) {
                    this.logService.info(`Downloaded VSIX is invalid. Trying to download and install again...`, this.gallery.identifier.id);
                    try {
                        const result = await this.downloadAndInstallExtension(metadata, token);
                        this.telemetryService.publicLog2('extensiongallery:install:retry', {
                            extensionId: this.gallery.identifier.id,
                            succeeded: true
                        });
                        return result;
                    }
                    catch (error) {
                        this.telemetryService.publicLog2('extensiongallery:install:retry', {
                            extensionId: this.gallery.identifier.id,
                            succeeded: false
                        });
                        throw error;
                    }
                }
                else {
                    throw error;
                }
            }
        }
        async downloadAndInstallExtension(metadata, token) {
            const { location, verificationStatus } = await this.extensionsDownloader.download(this.gallery, this._operation, !this.options.donotVerifySignature);
            try {
                this._verificationStatus = verificationStatus;
                this.validateManifest(location.fsPath);
                const local = await this.extractExtension({ zipPath: location.fsPath, key: extensionManagementUtil_1.ExtensionKey.create(this.gallery), metadata }, false, token);
                return [local, metadata];
            }
            catch (error) {
                try {
                    await this.extensionsDownloader.delete(location);
                }
                catch (error) {
                    /* Ignore */
                    this.logService.warn(`Error while deleting the downloaded file`, location.toString(), (0, errors_1.getErrorMessage)(error));
                }
                throw error;
            }
        }
        async validateManifest(zipPath) {
            try {
                await (0, extensionManagementUtil_2.getManifest)(zipPath);
            }
            catch (error) {
                throw new extensionManagement_1.ExtensionManagementError((0, abstractExtensionManagementService_1.joinErrors)(error).message, extensionManagement_1.ExtensionManagementErrorCode.Invalid);
            }
        }
    }
    exports.InstallGalleryExtensionTask = InstallGalleryExtensionTask;
    class InstallVSIXTask extends InstallExtensionTask {
        constructor(manifest, location, options, galleryService, extensionsScanner, uriIdentityService, userDataProfilesService, extensionsScannerService, extensionsProfileScannerService, logService) {
            super({ id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name) }, location, options, extensionsScanner, uriIdentityService, userDataProfilesService, extensionsScannerService, extensionsProfileScannerService, logService);
            this.manifest = manifest;
            this.location = location;
            this.galleryService = galleryService;
        }
        async doRun(token) {
            const local = await super.doRun(token);
            this.updateMetadata(local, token);
            return local;
        }
        async install(token) {
            const extensionKey = new extensionManagementUtil_1.ExtensionKey(this.identifier, this.manifest.version);
            const installedExtensions = await this.extensionsScanner.scanExtensions(1 /* ExtensionType.User */, this.options.profileLocation, this.options.productVersion);
            const existing = installedExtensions.find(i => (0, extensionManagementUtil_1.areSameExtensions)(this.identifier, i.identifier));
            const metadata = {
                isApplicationScoped: this.options.isApplicationScoped || existing?.isApplicationScoped,
                isMachineScoped: this.options.isMachineScoped || existing?.isMachineScoped,
                isBuiltin: this.options.isBuiltin || existing?.isBuiltin,
                installedTimestamp: Date.now(),
                pinned: this.options.installGivenVersion ? true : (this.options.pinned ?? existing?.pinned),
                source: 'vsix',
            };
            if (existing) {
                this._operation = 3 /* InstallOperation.Update */;
                if (extensionKey.equals(new extensionManagementUtil_1.ExtensionKey(existing.identifier, existing.manifest.version))) {
                    try {
                        await this.extensionsScanner.removeExtension(existing, 'existing');
                    }
                    catch (e) {
                        throw new Error(nls.localize('restartCode', "Please restart VS Code before reinstalling {0}.", this.manifest.displayName || this.manifest.name));
                    }
                }
                else if (!this.options.profileLocation && semver.gt(existing.manifest.version, this.manifest.version)) {
                    await this.extensionsScanner.setUninstalled(existing);
                }
            }
            else {
                // Remove the extension with same version if it is already uninstalled.
                // Installing a VSIX extension shall replace the existing extension always.
                const existing = await this.unsetIfUninstalled(extensionKey);
                if (existing) {
                    try {
                        await this.extensionsScanner.removeExtension(existing, 'existing');
                    }
                    catch (e) {
                        throw new Error(nls.localize('restartCode', "Please restart VS Code before reinstalling {0}.", this.manifest.displayName || this.manifest.name));
                    }
                }
            }
            const local = await this.extractExtension({ zipPath: path.resolve(this.location.fsPath), key: extensionKey, metadata }, true, token);
            return [local, metadata];
        }
        async updateMetadata(extension, token) {
            try {
                let [galleryExtension] = await this.galleryService.getExtensions([{ id: extension.identifier.id, version: extension.manifest.version }], token);
                if (!galleryExtension) {
                    [galleryExtension] = await this.galleryService.getExtensions([{ id: extension.identifier.id }], token);
                }
                if (galleryExtension) {
                    const metadata = {
                        id: galleryExtension.identifier.uuid,
                        publisherDisplayName: galleryExtension.publisherDisplayName,
                        publisherId: galleryExtension.publisherId,
                        isPreReleaseVersion: galleryExtension.properties.isPreReleaseVersion,
                        hasPreReleaseVersion: extension.hasPreReleaseVersion || galleryExtension.properties.isPreReleaseVersion,
                        preRelease: galleryExtension.properties.isPreReleaseVersion || this.options.installPreReleaseVersion
                    };
                    await this.extensionsScanner.updateMetadata(extension, metadata, this.options.profileLocation);
                }
            }
            catch (error) {
                /* Ignore Error */
            }
        }
    }
    class UninstallExtensionTask extends abstractExtensionManagementService_1.AbstractExtensionTask {
        constructor(extension, profileLocation, extensionsProfileScannerService) {
            super();
            this.extension = extension;
            this.profileLocation = profileLocation;
            this.extensionsProfileScannerService = extensionsProfileScannerService;
        }
        async doRun(token) {
            await this.extensionsProfileScannerService.removeExtensionFromProfile(this.extension, this.profileLocation);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuYWdlbWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvbm9kZS9leHRlbnNpb25NYW5hZ2VtZW50U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzRG5GLFFBQUEsdUNBQXVDLEdBQUcsSUFBQSxzQ0FBc0IsRUFBdUUsaURBQTJCLENBQUMsQ0FBQztJQVFqTCxNQUFNLHNCQUFzQixHQUFHLFNBQVMsQ0FBQztJQUVsQyxJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEyQixTQUFRLHVFQUFrQztRQVFqRixZQUMyQixjQUF3QyxFQUMvQyxnQkFBbUMsRUFDekMsVUFBdUIsRUFDVCxrQkFBNkMsRUFDN0Msd0JBQW9FLEVBQzdELCtCQUFrRixFQUNsRyxlQUF5QyxFQUNwQyxvQkFBMkMsRUFDcEQsV0FBMEMsRUFDdkMsY0FBK0IsRUFDM0Isa0JBQXVDLEVBQ2xDLHVCQUFpRDtZQUUzRSxLQUFLLENBQUMsY0FBYyxFQUFFLGdCQUFnQixFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztZQVRyRSw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTJCO1lBQzVDLG9DQUErQixHQUEvQiwrQkFBK0IsQ0FBa0M7WUFDMUYsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBRTVCLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBWHhDLGtDQUE2QixHQUFHLElBQUksR0FBRyxFQUF1QyxDQUFDO1lBZ1IvRSxxQkFBZ0IsR0FBRyxJQUFJLGlCQUFXLEVBQUUsQ0FBQztZQS9QckQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FB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