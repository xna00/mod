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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/map", "vs/base/common/uri", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/types", "vs/base/common/errors", "vs/platform/telemetry/common/telemetry"], function (require, exports, async_1, buffer_1, lifecycle_1, event_1, map_1, uri_1, extensionManagement_1, extensionManagementUtil_1, files_1, instantiation_1, log_1, userDataProfile_1, uriIdentity_1, types_1, errors_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractExtensionsProfileScannerService = exports.IExtensionsProfileScannerService = exports.ExtensionsProfileScanningError = exports.ExtensionsProfileScanningErrorCode = void 0;
    var ExtensionsProfileScanningErrorCode;
    (function (ExtensionsProfileScanningErrorCode) {
        /**
         * Error when trying to scan extensions from a profile that does not exist.
         */
        ExtensionsProfileScanningErrorCode["ERROR_PROFILE_NOT_FOUND"] = "ERROR_PROFILE_NOT_FOUND";
        /**
         * Error when profile file is invalid.
         */
        ExtensionsProfileScanningErrorCode["ERROR_INVALID_CONTENT"] = "ERROR_INVALID_CONTENT";
    })(ExtensionsProfileScanningErrorCode || (exports.ExtensionsProfileScanningErrorCode = ExtensionsProfileScanningErrorCode = {}));
    class ExtensionsProfileScanningError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
        }
    }
    exports.ExtensionsProfileScanningError = ExtensionsProfileScanningError;
    exports.IExtensionsProfileScannerService = (0, instantiation_1.createDecorator)('IExtensionsProfileScannerService');
    let AbstractExtensionsProfileScannerService = class AbstractExtensionsProfileScannerService extends lifecycle_1.Disposable {
        constructor(extensionsLocation, fileService, userDataProfilesService, uriIdentityService, telemetryService, logService) {
            super();
            this.extensionsLocation = extensionsLocation;
            this.fileService = fileService;
            this.userDataProfilesService = userDataProfilesService;
            this.uriIdentityService = uriIdentityService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this._onAddExtensions = this._register(new event_1.Emitter());
            this.onAddExtensions = this._onAddExtensions.event;
            this._onDidAddExtensions = this._register(new event_1.Emitter());
            this.onDidAddExtensions = this._onDidAddExtensions.event;
            this._onRemoveExtensions = this._register(new event_1.Emitter());
            this.onRemoveExtensions = this._onRemoveExtensions.event;
            this._onDidRemoveExtensions = this._register(new event_1.Emitter());
            this.onDidRemoveExtensions = this._onDidRemoveExtensions.event;
            this.resourcesAccessQueueMap = new map_1.ResourceMap();
        }
        scanProfileExtensions(profileLocation, options) {
            return this.withProfileExtensions(profileLocation, undefined, options);
        }
        async addExtensionsToProfile(extensions, profileLocation, keepExistingVersions) {
            const extensionsToRemove = [];
            const extensionsToAdd = [];
            try {
                await this.withProfileExtensions(profileLocation, existingExtensions => {
                    const result = [];
                    if (keepExistingVersions) {
                        result.push(...existingExtensions);
                    }
                    else {
                        for (const existing of existingExtensions) {
                            if (extensions.some(([e]) => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, existing.identifier) && e.manifest.version !== existing.version)) {
                                // Remove the existing extension with different version
                                extensionsToRemove.push(existing);
                            }
                            else {
                                result.push(existing);
                            }
                        }
                    }
                    for (const [extension, metadata] of extensions) {
                        const index = result.findIndex(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier) && e.version === extension.manifest.version);
                        const extensionToAdd = { identifier: extension.identifier, version: extension.manifest.version, location: extension.location, metadata };
                        if (index === -1) {
                            extensionsToAdd.push(extensionToAdd);
                            result.push(extensionToAdd);
                        }
                        else {
                            result.splice(index, 1, extensionToAdd);
                        }
                    }
                    if (extensionsToAdd.length) {
                        this._onAddExtensions.fire({ extensions: extensionsToAdd, profileLocation });
                    }
                    if (extensionsToRemove.length) {
                        this._onRemoveExtensions.fire({ extensions: extensionsToRemove, profileLocation });
                    }
                    return result;
                });
                if (extensionsToAdd.length) {
                    this._onDidAddExtensions.fire({ extensions: extensionsToAdd, profileLocation });
                }
                if (extensionsToRemove.length) {
                    this._onDidRemoveExtensions.fire({ extensions: extensionsToRemove, profileLocation });
                }
                return extensionsToAdd;
            }
            catch (error) {
                if (extensionsToAdd.length) {
                    this._onDidAddExtensions.fire({ extensions: extensionsToAdd, error, profileLocation });
                }
                if (extensionsToRemove.length) {
                    this._onDidRemoveExtensions.fire({ extensions: extensionsToRemove, error, profileLocation });
                }
                throw error;
            }
        }
        async updateMetadata(extensions, profileLocation) {
            const updatedExtensions = [];
            await this.withProfileExtensions(profileLocation, profileExtensions => {
                const result = [];
                for (const profileExtension of profileExtensions) {
                    const extension = extensions.find(([e]) => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, profileExtension.identifier) && e.manifest.version === profileExtension.version);
                    if (extension) {
                        profileExtension.metadata = { ...profileExtension.metadata, ...extension[1] };
                        updatedExtensions.push(profileExtension);
                        result.push(profileExtension);
                    }
                    else {
                        result.push(profileExtension);
                    }
                }
                return result;
            });
            return updatedExtensions;
        }
        async removeExtensionFromProfile(extension, profileLocation) {
            const extensionsToRemove = [];
            try {
                await this.withProfileExtensions(profileLocation, profileExtensions => {
                    const result = [];
                    for (const e of profileExtensions) {
                        if ((0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier)) {
                            extensionsToRemove.push(e);
                        }
                        else {
                            result.push(e);
                        }
                    }
                    if (extensionsToRemove.length) {
                        this._onRemoveExtensions.fire({ extensions: extensionsToRemove, profileLocation });
                    }
                    return result;
                });
                if (extensionsToRemove.length) {
                    this._onDidRemoveExtensions.fire({ extensions: extensionsToRemove, profileLocation });
                }
            }
            catch (error) {
                if (extensionsToRemove.length) {
                    this._onDidRemoveExtensions.fire({ extensions: extensionsToRemove, error, profileLocation });
                }
                throw error;
            }
        }
        async withProfileExtensions(file, updateFn, options) {
            return this.getResourceAccessQueue(file).queue(async () => {
                let extensions = [];
                // Read
                let storedProfileExtensions;
                try {
                    const content = await this.fileService.readFile(file);
                    storedProfileExtensions = JSON.parse(content.value.toString().trim() || '[]');
                }
                catch (error) {
                    if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                        throw error;
                    }
                    // migrate from old location, remove this after couple of releases
                    if (this.uriIdentityService.extUri.isEqual(file, this.userDataProfilesService.defaultProfile.extensionsResource)) {
                        storedProfileExtensions = await this.migrateFromOldDefaultProfileExtensionsLocation();
                    }
                    if (!storedProfileExtensions && options?.bailOutWhenFileNotFound) {
                        throw new ExtensionsProfileScanningError((0, errors_1.getErrorMessage)(error), "ERROR_PROFILE_NOT_FOUND" /* ExtensionsProfileScanningErrorCode.ERROR_PROFILE_NOT_FOUND */);
                    }
                }
                if (storedProfileExtensions) {
                    if (!Array.isArray(storedProfileExtensions)) {
                        this.reportAndThrowInvalidConentError(file);
                    }
                    // TODO @sandy081: Remove this migration after couple of releases
                    let migrate = false;
                    for (const e of storedProfileExtensions) {
                        if (!isStoredProfileExtension(e)) {
                            this.reportAndThrowInvalidConentError(file);
                        }
                        let location;
                        if ((0, types_1.isString)(e.relativeLocation) && e.relativeLocation) {
                            // Extension in new format. No migration needed.
                            location = this.resolveExtensionLocation(e.relativeLocation);
                        }
                        else if ((0, types_1.isString)(e.location)) {
                            this.logService.warn(`Extensions profile: Ignoring extension with invalid location: ${e.location}`);
                            continue;
                        }
                        else {
                            location = uri_1.URI.revive(e.location);
                            const relativePath = this.toRelativePath(location);
                            if (relativePath) {
                                // Extension in old format. Migrate to new format.
                                migrate = true;
                                e.relativeLocation = relativePath;
                            }
                        }
                        if ((0, types_1.isUndefined)(e.metadata?.hasPreReleaseVersion) && e.metadata?.preRelease) {
                            migrate = true;
                            e.metadata.hasPreReleaseVersion = true;
                        }
                        extensions.push({
                            identifier: e.identifier,
                            location,
                            version: e.version,
                            metadata: e.metadata,
                        });
                    }
                    if (migrate) {
                        await this.fileService.writeFile(file, buffer_1.VSBuffer.fromString(JSON.stringify(storedProfileExtensions)));
                    }
                }
                // Update
                if (updateFn) {
                    extensions = updateFn(extensions);
                    const storedProfileExtensions = extensions.map(e => ({
                        identifier: e.identifier,
                        version: e.version,
                        // retain old format so that old clients can read it
                        location: e.location.toJSON(),
                        relativeLocation: this.toRelativePath(e.location),
                        metadata: e.metadata
                    }));
                    await this.fileService.writeFile(file, buffer_1.VSBuffer.fromString(JSON.stringify(storedProfileExtensions)));
                }
                return extensions;
            });
        }
        reportAndThrowInvalidConentError(file) {
            const error = new ExtensionsProfileScanningError(`Invalid extensions content in ${file.toString()}`, "ERROR_INVALID_CONTENT" /* ExtensionsProfileScanningErrorCode.ERROR_INVALID_CONTENT */);
            this.telemetryService.publicLogError2('extensionsProfileScanningError', { code: error.code });
            throw error;
        }
        toRelativePath(extensionLocation) {
            return this.uriIdentityService.extUri.isEqual(this.uriIdentityService.extUri.dirname(extensionLocation), this.extensionsLocation)
                ? this.uriIdentityService.extUri.basename(extensionLocation)
                : undefined;
        }
        resolveExtensionLocation(path) {
            return this.uriIdentityService.extUri.joinPath(this.extensionsLocation, path);
        }
        async migrateFromOldDefaultProfileExtensionsLocation() {
            if (!this._migrationPromise) {
                this._migrationPromise = (async () => {
                    const oldDefaultProfileExtensionsLocation = this.uriIdentityService.extUri.joinPath(this.userDataProfilesService.defaultProfile.location, 'extensions.json');
                    const oldDefaultProfileExtensionsInitLocation = this.uriIdentityService.extUri.joinPath(this.extensionsLocation, '.init-default-profile-extensions');
                    let content;
                    try {
                        content = (await this.fileService.readFile(oldDefaultProfileExtensionsLocation)).value.toString();
                    }
                    catch (error) {
                        if ((0, files_1.toFileOperationResult)(error) === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                            return undefined;
                        }
                        throw error;
                    }
                    this.logService.info('Migrating extensions from old default profile location', oldDefaultProfileExtensionsLocation.toString());
                    let storedProfileExtensions;
                    try {
                        const parsedData = JSON.parse(content);
                        if (Array.isArray(parsedData) && parsedData.every(candidate => isStoredProfileExtension(candidate))) {
                            storedProfileExtensions = parsedData;
                        }
                        else {
                            this.logService.warn('Skipping migrating from old default profile locaiton: Found invalid data', parsedData);
                        }
                    }
                    catch (error) {
                        /* Ignore */
                        this.logService.error(error);
                    }
                    if (storedProfileExtensions) {
                        try {
                            await this.fileService.createFile(this.userDataProfilesService.defaultProfile.extensionsResource, buffer_1.VSBuffer.fromString(JSON.stringify(storedProfileExtensions)), { overwrite: false });
                            this.logService.info('Migrated extensions from old default profile location to new location', oldDefaultProfileExtensionsLocation.toString(), this.userDataProfilesService.defaultProfile.extensionsResource.toString());
                        }
                        catch (error) {
                            if ((0, files_1.toFileOperationResult)(error) === 3 /* FileOperationResult.FILE_MODIFIED_SINCE */) {
                                this.logService.info('Migration from old default profile location to new location is done by another window', oldDefaultProfileExtensionsLocation.toString(), this.userDataProfilesService.defaultProfile.extensionsResource.toString());
                            }
                            else {
                                throw error;
                            }
                        }
                    }
                    try {
                        await this.fileService.del(oldDefaultProfileExtensionsLocation);
                    }
                    catch (error) {
                        if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                            this.logService.error(error);
                        }
                    }
                    try {
                        await this.fileService.del(oldDefaultProfileExtensionsInitLocation);
                    }
                    catch (error) {
                        if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                            this.logService.error(error);
                        }
                    }
                    return storedProfileExtensions;
                })();
            }
            return this._migrationPromise;
        }
        getResourceAccessQueue(file) {
            let resourceQueue = this.resourcesAccessQueueMap.get(file);
            if (!resourceQueue) {
                resourceQueue = new async_1.Queue();
                this.resourcesAccessQueueMap.set(file, resourceQueue);
            }
            return resourceQueue;
        }
    };
    exports.AbstractExtensionsProfileScannerService = AbstractExtensionsProfileScannerService;
    exports.AbstractExtensionsProfileScannerService = AbstractExtensionsProfileScannerService = __decorate([
        __param(1, files_1.IFileService),
        __param(2, userDataProfile_1.IUserDataProfilesService),
        __param(3, uriIdentity_1.IUriIdentityService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, log_1.ILogService)
    ], AbstractExtensionsProfileScannerService);
    function isStoredProfileExtension(candidate) {
        return (0, types_1.isObject)(candidate)
            && (0, extensionManagement_1.isIExtensionIdentifier)(candidate.identifier)
            && (isUriComponents(candidate.location) || ((0, types_1.isString)(candidate.location) && candidate.location))
            && ((0, types_1.isUndefined)(candidate.relativeLocation) || (0, types_1.isString)(candidate.relativeLocation))
            && candidate.version && (0, types_1.isString)(candidate.version);
    }
    function isUriComponents(thing) {
        if (!thing) {
            return false;
        }
        return (0, types_1.isString)(thing.path) &&
            (0, types_1.isString)(thing.scheme);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1Byb2ZpbGVTY2FubmVyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZXh0ZW5zaW9uTWFuYWdlbWVudC9jb21tb24vZXh0ZW5zaW9uc1Byb2ZpbGVTY2FubmVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE0QmhHLElBQWtCLGtDQVlqQjtJQVpELFdBQWtCLGtDQUFrQztRQUVuRDs7V0FFRztRQUNILHlGQUFtRCxDQUFBO1FBRW5EOztXQUVHO1FBQ0gscUZBQStDLENBQUE7SUFFaEQsQ0FBQyxFQVppQixrQ0FBa0Msa0RBQWxDLGtDQUFrQyxRQVluRDtJQUVELE1BQWEsOEJBQStCLFNBQVEsS0FBSztRQUN4RCxZQUFZLE9BQWUsRUFBUyxJQUF3QztZQUMzRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFEb0IsU0FBSSxHQUFKLElBQUksQ0FBb0M7UUFFNUUsQ0FBQztLQUNEO0lBSkQsd0VBSUM7SUEwQlksUUFBQSxnQ0FBZ0MsR0FBRyxJQUFBLCtCQUFlLEVBQW1DLGtDQUFrQyxDQUFDLENBQUM7SUFlL0gsSUFBZSx1Q0FBdUMsR0FBdEQsTUFBZSx1Q0FBd0MsU0FBUSxzQkFBVTtRQWlCL0UsWUFDa0Isa0JBQXVCLEVBQzFCLFdBQTBDLEVBQzlCLHVCQUFrRSxFQUN2RSxrQkFBd0QsRUFDMUQsZ0JBQW9ELEVBQzFELFVBQXdDO1lBRXJELEtBQUssRUFBRSxDQUFDO1lBUFMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFLO1lBQ1QsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDYiw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ3RELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDekMscUJBQWdCLEdBQWhCLGdCQUFnQixD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