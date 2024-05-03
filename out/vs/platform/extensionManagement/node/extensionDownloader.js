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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/semver/semver", "vs/base/common/types", "vs/base/common/uuid", "vs/base/node/pfs", "vs/base/node/zip", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionManagement/node/extensionSignatureVerificationService", "vs/platform/files/common/files", "vs/platform/log/common/log"], function (require, exports, async_1, errors_1, lifecycle_1, network_1, resources_1, semver, types_1, uuid_1, pfs_1, zip_1, configuration_1, environment_1, extensionManagement_1, extensionManagementUtil_1, extensionSignatureVerificationService_1, files_1, log_1) {
    "use strict";
    var ExtensionsDownloader_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsDownloader = void 0;
    let ExtensionsDownloader = class ExtensionsDownloader extends lifecycle_1.Disposable {
        static { ExtensionsDownloader_1 = this; }
        static { this.SignatureArchiveExtension = '.sigzip'; }
        constructor(environmentService, fileService, extensionGalleryService, configurationService, extensionSignatureVerificationService, logService) {
            super();
            this.fileService = fileService;
            this.extensionGalleryService = extensionGalleryService;
            this.configurationService = configurationService;
            this.extensionSignatureVerificationService = extensionSignatureVerificationService;
            this.logService = logService;
            this.extensionsDownloadDir = environmentService.extensionsDownloadLocation;
            this.cache = 20; // Cache 20 downloaded VSIX files
            this.cleanUpPromise = this.cleanUp();
        }
        async download(extension, operation, verifySignature) {
            await this.cleanUpPromise;
            const location = (0, resources_1.joinPath)(this.extensionsDownloadDir, this.getName(extension));
            try {
                await this.downloadFile(extension, location, location => this.extensionGalleryService.download(extension, location, operation));
            }
            catch (error) {
                throw new extensionManagement_1.ExtensionManagementError(error.message, extensionManagement_1.ExtensionManagementErrorCode.Download);
            }
            let verificationStatus = false;
            if (verifySignature && this.shouldVerifySignature(extension)) {
                const signatureArchiveLocation = await this.downloadSignatureArchive(extension);
                try {
                    verificationStatus = await this.extensionSignatureVerificationService.verify(location.fsPath, signatureArchiveLocation.fsPath, this.logService.getLevel() === log_1.LogLevel.Trace);
                }
                catch (error) {
                    const sigError = error;
                    verificationStatus = sigError.code;
                    if (sigError.output) {
                        this.logService.trace(`Extension signature verification details for ${extension.identifier.id} ${extension.version}:\n${sigError.output}`);
                    }
                    if (verificationStatus === extensionManagement_1.ExtensionSignaturetErrorCode.PackageIsInvalidZip || verificationStatus === extensionManagement_1.ExtensionSignaturetErrorCode.SignatureArchiveIsInvalidZip) {
                        try {
                            // Delete the downloaded vsix before throwing the error
                            await this.delete(location);
                        }
                        catch (error) {
                            this.logService.error(error);
                        }
                        throw new extensionManagement_1.ExtensionManagementError(zip_1.CorruptZipMessage, extensionManagement_1.ExtensionManagementErrorCode.CorruptZip);
                    }
                }
                finally {
                    try {
                        // Delete signature archive always
                        await this.delete(signatureArchiveLocation);
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                }
            }
            if (verificationStatus === true) {
                this.logService.info(`Extension signature is verified: ${extension.identifier.id}`);
            }
            else if (verificationStatus === false) {
                this.logService.info(`Extension signature verification is not done: ${extension.identifier.id}`);
            }
            else {
                this.logService.warn(`Extension signature verification failed with error '${verificationStatus}': ${extension.identifier.id}`);
            }
            return { location, verificationStatus };
        }
        shouldVerifySignature(extension) {
            if (!extension.isSigned) {
                this.logService.info(`Extension is not signed: ${extension.identifier.id}`);
                return false;
            }
            const value = this.configurationService.getValue('extensions.verifySignature');
            return (0, types_1.isBoolean)(value) ? value : true;
        }
        async downloadSignatureArchive(extension) {
            await this.cleanUpPromise;
            const location = (0, resources_1.joinPath)(this.extensionsDownloadDir, `${this.getName(extension)}${ExtensionsDownloader_1.SignatureArchiveExtension}`);
            try {
                await this.downloadFile(extension, location, location => this.extensionGalleryService.downloadSignatureArchive(extension, location));
            }
            catch (error) {
                throw new extensionManagement_1.ExtensionManagementError(error.message, extensionManagement_1.ExtensionManagementErrorCode.DownloadSignature);
            }
            return location;
        }
        async downloadFile(extension, location, downloadFn) {
            // Do not download if exists
            if (await this.fileService.exists(location)) {
                return;
            }
            // Download directly if locaiton is not file scheme
            if (location.scheme !== network_1.Schemas.file) {
                await downloadFn(location);
                return;
            }
            // Download to temporary location first only if file does not exist
            const tempLocation = (0, resources_1.joinPath)(this.extensionsDownloadDir, `.${(0, uuid_1.generateUuid)()}`);
            if (!await this.fileService.exists(tempLocation)) {
                await downloadFn(tempLocation);
            }
            try {
                // Rename temp location to original
                await pfs_1.Promises.rename(tempLocation.fsPath, location.fsPath, 2 * 60 * 1000 /* Retry for 2 minutes */);
            }
            catch (error) {
                try {
                    await this.fileService.del(tempLocation);
                }
                catch (e) { /* ignore */ }
                if (error.code === 'ENOTEMPTY') {
                    this.logService.info(`Rename failed because the file was downloaded by another source. So ignoring renaming.`, extension.identifier.id, location.path);
                }
                else {
                    this.logService.info(`Rename failed because of ${(0, errors_1.getErrorMessage)(error)}. Deleted the file from downloaded location`, tempLocation.path);
                    throw error;
                }
            }
        }
        async delete(location) {
            await this.cleanUpPromise;
            await this.fileService.del(location);
        }
        async cleanUp() {
            try {
                if (!(await this.fileService.exists(this.extensionsDownloadDir))) {
                    this.logService.trace('Extension VSIX downloads cache dir does not exist');
                    return;
                }
                const folderStat = await this.fileService.resolve(this.extensionsDownloadDir, { resolveMetadata: true });
                if (folderStat.children) {
                    const toDelete = [];
                    const vsixs = [];
                    const signatureArchives = [];
                    for (const stat of folderStat.children) {
                        if (stat.name.endsWith(ExtensionsDownloader_1.SignatureArchiveExtension)) {
                            signatureArchives.push(stat.resource);
                        }
                        else {
                            const extension = extensionManagementUtil_1.ExtensionKey.parse(stat.name);
                            if (extension) {
                                vsixs.push([extension, stat]);
                            }
                        }
                    }
                    const byExtension = (0, extensionManagementUtil_1.groupByExtension)(vsixs, ([extension]) => extension);
                    const distinct = [];
                    for (const p of byExtension) {
                        p.sort((a, b) => semver.rcompare(a[0].version, b[0].version));
                        toDelete.push(...p.slice(1).map(e => e[1].resource)); // Delete outdated extensions
                        distinct.push(p[0][1]);
                    }
                    distinct.sort((a, b) => a.mtime - b.mtime); // sort by modified time
                    toDelete.push(...distinct.slice(0, Math.max(0, distinct.length - this.cache)).map(s => s.resource)); // Retain minimum cacheSize and delete the rest
                    toDelete.push(...signatureArchives); // Delete all signature archives
                    await async_1.Promises.settled(toDelete.map(resource => {
                        this.logService.trace('Deleting from cache', resource.path);
                        return this.fileService.del(resource);
                    }));
                }
            }
            catch (e) {
                this.logService.error(e);
            }
        }
        getName(extension) {
            return this.cache ? extensionManagementUtil_1.ExtensionKey.create(extension).toString().toLowerCase() : (0, uuid_1.generateUuid)();
        }
    };
    exports.ExtensionsDownloader = ExtensionsDownloader;
    exports.ExtensionsDownloader = ExtensionsDownloader = ExtensionsDownloader_1 = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, extensionSignatureVerificationService_1.IExtensionSignatureVerificationService),
        __param(5, log_1.ILogService)
    ], ExtensionsDownloader);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRG93bmxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZXh0ZW5zaW9uTWFuYWdlbWVudC9ub2RlL2V4dGVuc2lvbkRvd25sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXNCekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSxzQkFBVTs7aUJBRTNCLDhCQUF5QixHQUFHLFNBQVMsQUFBWixDQUFhO1FBTTlELFlBQzRCLGtCQUE2QyxFQUN6QyxXQUF5QixFQUNiLHVCQUFpRCxFQUNwRCxvQkFBMkMsRUFDMUIscUNBQTZFLEVBQ3hHLFVBQXVCO1lBRXJELEtBQUssRUFBRSxDQUFDO1lBTnVCLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2IsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUNwRCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzFCLDBDQUFxQyxHQUFyQyxxQ0FBcUMsQ0FBd0M7WUFDeEcsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUdyRCxJQUFJLENBQUMscUJBQXFCLEdBQUcsa0JBQWtCLENBQUMsMEJBQTBCLENBQUM7WUFDM0UsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxpQ0FBaUM7WUFDbEQsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdEMsQ0FBQztRQUVELEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBNEIsRUFBRSxTQUEyQixFQUFFLGVBQXdCO1lBQ2pHLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQztZQUUxQixNQUFNLFFBQVEsR0FBRyxJQUFBLG9CQUFRLEVBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMs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