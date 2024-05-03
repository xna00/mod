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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/objects", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/json", "vs/base/common/jsonErrorMessages", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/semver/semver", "vs/base/common/severity", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensions/common/extensions", "vs/platform/extensions/common/extensionValidator", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/base/common/event", "vs/base/common/marshalling", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/extensionManagement/common/extensionNls"], function (require, exports, arrays_1, async_1, objects, buffer_1, errors_1, json_1, jsonErrorMessages_1, lifecycle_1, network_1, path, platform, resources_1, semver, severity_1, types_1, uri_1, nls_1, environment_1, extensionManagementUtil_1, extensions_1, extensionValidator_1, files_1, instantiation_1, log_1, productService_1, event_1, marshalling_1, extensionsProfileScannerService_1, userDataProfile_1, uriIdentity_1, extensionNls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeExtensionsScannerService = exports.ExtensionScannerInput = exports.AbstractExtensionsScannerService = exports.IExtensionsScannerService = exports.Translations = void 0;
    exports.toExtensionDescription = toExtensionDescription;
    var Translations;
    (function (Translations) {
        function equals(a, b) {
            if (a === b) {
                return true;
            }
            const aKeys = Object.keys(a);
            const bKeys = new Set();
            for (const key of Object.keys(b)) {
                bKeys.add(key);
            }
            if (aKeys.length !== bKeys.size) {
                return false;
            }
            for (const key of aKeys) {
                if (a[key] !== b[key]) {
                    return false;
                }
                bKeys.delete(key);
            }
            return bKeys.size === 0;
        }
        Translations.equals = equals;
    })(Translations || (exports.Translations = Translations = {}));
    exports.IExtensionsScannerService = (0, instantiation_1.createDecorator)('IExtensionsScannerService');
    let AbstractExtensionsScannerService = class AbstractExtensionsScannerService extends lifecycle_1.Disposable {
        constructor(systemExtensionsLocation, userExtensionsLocation, extensionsControlLocation, currentProfile, userDataProfilesService, extensionsProfileScannerService, fileService, logService, environmentService, productService, uriIdentityService, instantiationService) {
            super();
            this.systemExtensionsLocation = systemExtensionsLocation;
            this.userExtensionsLocation = userExtensionsLocation;
            this.extensionsControlLocation = extensionsControlLocation;
            this.currentProfile = currentProfile;
            this.userDataProfilesService = userDataProfilesService;
            this.extensionsProfileScannerService = extensionsProfileScannerService;
            this.fileService = fileService;
            this.logService = logService;
            this.environmentService = environmentService;
            this.productService = productService;
            this.uriIdentityService = uriIdentityService;
            this.instantiationService = instantiationService;
            this._onDidChangeCache = this._register(new event_1.Emitter());
            this.onDidChangeCache = this._onDidChangeCache.event;
            this.obsoleteFile = (0, resources_1.joinPath)(this.userExtensionsLocation, '.obsolete');
            this.systemExtensionsCachedScanner = this._register(this.instantiationService.createInstance(CachedExtensionsScanner, this.currentProfile, this.obsoleteFile));
            this.userExtensionsCachedScanner = this._register(this.instantiationService.createInstance(CachedExtensionsScanner, this.currentProfile, this.obsoleteFile));
            this.extensionsScanner = this._register(this.instantiationService.createInstance(ExtensionsScanner, this.obsoleteFile));
            this.initializeDefaultProfileExtensionsPromise = undefined;
            this._register(this.systemExtensionsCachedScanner.onDidChangeCache(() => this._onDidChangeCache.fire(0 /* ExtensionType.System */)));
            this._register(this.userExtensionsCachedScanner.onDidChangeCache(() => this._onDidChangeCache.fire(1 /* ExtensionType.User */)));
        }
        getTargetPlatform() {
            if (!this._targetPlatformPromise) {
                this._targetPlatformPromise = (0, extensionManagementUtil_1.computeTargetPlatform)(this.fileService, this.logService);
            }
            return this._targetPlatformPromise;
        }
        async scanAllExtensions(systemScanOptions, userScanOptions, includeExtensionsUnderDev) {
            const [system, user] = await Promise.all([
                this.scanSystemExtensions(systemScanOptions),
                this.scanUserExtensions(userScanOptions),
            ]);
            const development = includeExtensionsUnderDev ? await this.scanExtensionsUnderDevelopment(systemScanOptions, [...system, ...user]) : [];
            return this.dedupExtensions(system, user, development, await this.getTargetPlatform(), true);
        }
        async scanSystemExtensions(scanOptions) {
            const promises = [];
            promises.push(this.scanDefaultSystemExtensions(!!scanOptions.useCache, scanOptions.language));
            promises.push(this.scanDevSystemExtensions(scanOptions.language, !!scanOptions.checkControlFile));
            const [defaultSystemExtensions, devSystemExtensions] = await Promise.all(promises);
            return this.applyScanOptions([...defaultSystemExtensions, ...devSystemExtensions], 0 /* ExtensionType.System */, scanOptions, false);
        }
        async scanUserExtensions(scanOptions) {
            const location = scanOptions.profileLocation ?? this.userExtensionsLocation;
            this.logService.trace('Started scanning user extensions', location);
            const profileScanOptions = this.uriIdentityService.extUri.isEqual(scanOptions.profileLocation, this.userDataProfilesService.defaultProfile.extensionsResource) ? { bailOutWhenFileNotFound: true } : undefined;
            const extensionsScannerInput = await this.createExtensionScannerInput(location, !!scanOptions.profileLocation, 1 /* ExtensionType.User */, !scanOptions.includeUninstalled, scanOptions.language, true, profileScanOptions, scanOptions.productVersion ?? this.getProductVersion());
            const extensionsScanner = scanOptions.useCache && !extensionsScannerInput.devMode && extensionsScannerInput.excludeObsolete ? this.userExtensionsCachedScanner : this.extensionsScanner;
            let extensions;
            try {
                extensions = await extensionsScanner.scanExtensions(extensionsScannerInput);
            }
            catch (error) {
                if (error instanceof extensionsProfileScannerService_1.ExtensionsProfileScanningError && error.code === "ERROR_PROFILE_NOT_FOUND" /* ExtensionsProfileScanningErrorCode.ERROR_PROFILE_NOT_FOUND */) {
                    await this.doInitializeDefaultProfileExtensions();
                    extensions = await extensionsScanner.scanExtensions(extensionsScannerInput);
                }
                else {
                    throw error;
                }
            }
            extensions = await this.applyScanOptions(extensions, 1 /* ExtensionType.User */, scanOptions, true);
            this.logService.trace('Scanned user extensions:', extensions.length);
            return extensions;
        }
        async scanExtensionsUnderDevelopment(scanOptions, existingExtensions) {
            if (this.environmentService.isExtensionDevelopment && this.environmentService.extensionDevelopmentLocationURI) {
                const extensions = (await Promise.all(this.environmentService.extensionDevelopmentLocationURI.filter(extLoc => extLoc.scheme === network_1.Schemas.file)
                    .map(async (extensionDevelopmentLocationURI) => {
                    const input = await this.createExtensionScannerInput(extensionDevelopmentLocationURI, false, 1 /* ExtensionType.User */, true, scanOptions.language, false /* do not validate */, undefined, scanOptions.productVersion ?? this.getProductVersion());
                    const extensions = await this.extensionsScanner.scanOneOrMultipleExtensions(input);
                    return extensions.map(extension => {
                        // Override the extension type from the existing extensions
                        extension.type = existingExtensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier))?.type ?? extension.type;
                        // Validate the extension
                        return this.extensionsScanner.validate(extension, input);
                    });
                })))
                    .flat();
                return this.applyScanOptions(extensions, 'development', scanOptions, true);
            }
            return [];
        }
        async scanExistingExtension(extensionLocation, extensionType, scanOptions) {
            const extensionsScannerInput = await this.createExtensionScannerInput(extensionLocation, false, extensionType, true, scanOptions.language, true, undefined, scanOptions.productVersion ?? this.getProductVersion());
            const extension = await this.extensionsScanner.scanExtension(extensionsScannerInput);
            if (!extension) {
                return null;
            }
            if (!scanOptions.includeInvalid && !extension.isValid) {
                return null;
            }
            return extension;
        }
        async scanOneOrMultipleExtensions(extensionLocation, extensionType, scanOptions) {
            const extensionsScannerInput = await this.createExtensionScannerInput(extensionLocation, false, extensionType, true, scanOptions.language, true, undefined, scanOptions.productVersion ?? this.getProductVersion());
            const extensions = await this.extensionsScanner.scanOneOrMultipleExtensions(extensionsScannerInput);
            return this.applyScanOptions(extensions, extensionType, scanOptions, true);
        }
        async scanMultipleExtensions(extensionLocations, extensionType, scanOptions) {
            const extensions = [];
            await Promise.all(extensionLocations.map(async (extensionLocation) => {
                const scannedExtensions = await this.scanOneOrMultipleExtensions(extensionLocation, extensionType, scanOptions);
                extensions.push(...scannedExtensions);
            }));
            return this.applyScanOptions(extensions, extensionType, scanOptions, true);
        }
        async scanMetadata(extensionLocation) {
            const manifestLocation = (0, resources_1.joinPath)(extensionLocation, 'package.json');
            const content = (await this.fileService.readFile(manifestLocation)).value.toString();
            const manifest = JSON.parse(content);
            return manifest.__metadata;
        }
        async updateMetadata(extensionLocation, metaData) {
            const manifestLocation = (0, resources_1.joinPath)(extensionLocation, 'package.json');
            const content = (await this.fileService.readFile(manifestLocation)).value.toString();
            const manifest = JSON.parse(content);
            // unset if false
            if (metaData.isMachineScoped === false) {
                delete metaData.isMachineScoped;
            }
            if (metaData.isBuiltin === false) {
                delete metaData.isBuiltin;
            }
            manifest.__metadata = { ...manifest.__metadata, ...metaData };
            await this.fileService.writeFile((0, resources_1.joinPath)(extensionLocation, 'package.json'), buffer_1.VSBuffer.fromString(JSON.stringify(manifest, null, '\t')));
        }
        async initializeDefaultProfileExtensions() {
            try {
                await this.extensionsProfileScannerService.scanProfileExtensions(this.userDataProfilesService.defaultProfile.extensionsResource, { bailOutWhenFileNotFound: true });
            }
            catch (error) {
                if (error instanceof extensionsProfileScannerService_1.ExtensionsProfileScanningError && error.code === "ERROR_PROFILE_NOT_FOUND" /* ExtensionsProfileScanningErrorCode.ERROR_PROFILE_NOT_FOUND */) {
                    await this.doInitializeDefaultProfileExtensions();
                }
                else {
                    throw error;
                }
            }
        }
        async doInitializeDefaultProfileExtensions() {
            if (!this.initializeDefaultProfileExtensionsPromise) {
                this.initializeDefaultProfileExtensionsPromise = (async () => {
                    try {
                        this.logService.info('Started initializing default profile extensions in extensions installation folder.', this.userExtensionsLocation.toString());
                        const userExtensions = await this.scanUserExtensions({ includeInvalid: true });
                        if (userExtensions.length) {
                            await this.extensionsProfileScannerService.addExtensionsToProfile(userExtensions.map(e => [e, e.metadata]), this.userDataProfilesService.defaultProfile.extensionsResource);
                        }
                        else {
                            try {
                                await this.fileService.createFile(this.userDataProfilesService.defaultProfile.extensionsResource, buffer_1.VSBuffer.fromString(JSON.stringify([])));
                            }
                            catch (error) {
                                if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                                    this.logService.warn('Failed to create default profile extensions manifest in extensions installation folder.', this.userExtensionsLocation.toString(), (0, errors_1.getErrorMessage)(error));
                                }
                            }
                        }
                        this.logService.info('Completed initializing default profile extensions in extensions installation folder.', this.userExtensionsLocation.toString());
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                    finally {
                        this.initializeDefaultProfileExtensionsPromise = undefined;
                    }
                })();
            }
            return this.initializeDefaultProfileExtensionsPromise;
        }
        async applyScanOptions(extensions, type, scanOptions, pickLatest) {
            if (!scanOptions.includeAllVersions) {
                extensions = this.dedupExtensions(type === 0 /* ExtensionType.System */ ? extensions : undefined, type === 1 /* ExtensionType.User */ ? extensions : undefined, type === 'development' ? extensions : undefined, await this.getTargetPlatform(), pickLatest);
            }
            if (!scanOptions.includeInvalid) {
                extensions = extensions.filter(extension => extension.isValid);
            }
            return extensions.sort((a, b) => {
                const aLastSegment = path.basename(a.location.fsPath);
                const bLastSegment = path.basename(b.location.fsPath);
                if (aLastSegment < bLastSegment) {
                    return -1;
                }
                if (aLastSegment > bLastSegment) {
                    return 1;
                }
                return 0;
            });
        }
        dedupExtensions(system, user, development, targetPlatform, pickLatest) {
            const pick = (existing, extension, isDevelopment) => {
                if (existing.isValid && !extension.isValid) {
                    return false;
                }
                if (existing.isValid === extension.isValid) {
                    if (pickLatest && semver.gt(existing.manifest.version, extension.manifest.version)) {
                        this.logService.debug(`Skipping extension ${extension.location.path} with lower version ${extension.manifest.version} in favour of ${existing.location.path} with version ${existing.manifest.version}`);
                        return false;
                    }
                    if (semver.eq(existing.manifest.version, extension.manifest.version)) {
                        if (existing.type === 0 /* ExtensionType.System */) {
                            this.logService.debug(`Skipping extension ${extension.location.path} in favour of system extension ${existing.location.path} with same version`);
                            return false;
                        }
                        if (existing.targetPlatform === targetPlatform) {
                            this.logService.debug(`Skipping extension ${extension.location.path} from different target platform ${extension.targetPlatform}`);
                            return false;
                        }
                    }
                }
                if (isDevelopment) {
                    this.logService.warn(`Overwriting user extension ${existing.location.path} with ${extension.location.path}.`);
                }
                else {
                    this.logService.debug(`Overwriting user extension ${existing.location.path} with ${extension.location.path}.`);
                }
                return true;
            };
            const result = new extensions_1.ExtensionIdentifierMap();
            system?.forEach((extension) => {
                const existing = result.get(extension.identifier.id);
                if (!existing || pick(existing, extension, false)) {
                    result.set(extension.identifier.id, extension);
                }
            });
            user?.forEach((extension) => {
                const existing = result.get(extension.identifier.id);
                if (!existing && system && extension.type === 0 /* ExtensionType.System */) {
                    this.logService.debug(`Skipping obsolete system extension ${extension.location.path}.`);
                    return;
                }
                if (!existing || pick(existing, extension, false)) {
                    result.set(extension.identifier.id, extension);
                }
            });
            development?.forEach(extension => {
                const existing = result.get(extension.identifier.id);
                if (!existing || pick(existing, extension, true)) {
                    result.set(extension.identifier.id, extension);
                }
                result.set(extension.identifier.id, extension);
            });
            return [...result.values()];
        }
        async scanDefaultSystemExtensions(useCache, language) {
            this.logService.trace('Started scanning system extensions');
            const extensionsScannerInput = await this.createExtensionScannerInput(this.systemExtensionsLocation, false, 0 /* ExtensionType.System */, true, language, true, undefined, this.getProductVersion());
            const extensionsScanner = useCache && !extensionsScannerInput.devMode ? this.systemExtensionsCachedScanner : this.extensionsScanner;
            const result = await extensionsScanner.scanExtensions(extensionsScannerInput);
            this.logService.trace('Scanned system extensions:', result.length);
            return result;
        }
        async scanDevSystemExtensions(language, checkControlFile) {
            const devSystemExtensionsList = this.environmentService.isBuilt ? [] : this.productService.builtInExtensions;
            if (!devSystemExtensionsList?.length) {
                return [];
            }
            this.logService.trace('Started scanning dev system extensions');
            const builtinExtensionControl = checkControlFile ? await this.getBuiltInExtensionControl() : {};
            const devSystemExtensionsLocations = [];
            const devSystemExtensionsLocation = uri_1.URI.file(path.normalize(path.join(network_1.FileAccess.asFileUri('').fsPath, '..', '.build', 'builtInExtensions')));
            for (const extension of devSystemExtensionsList) {
                const controlState = builtinExtensionControl[extension.name] || 'marketplace';
                switch (controlState) {
                    case 'disabled':
                        break;
                    case 'marketplace':
                        devSystemExtensionsLocations.push((0, resources_1.joinPath)(devSystemExtensionsLocation, extension.name));
                        break;
                    default:
                        devSystemExtensionsLocations.push(uri_1.URI.file(controlState));
                        break;
                }
            }
            const result = await Promise.all(devSystemExtensionsLocations.map(async (location) => this.extensionsScanner.scanExtension((await this.createExtensionScannerInput(location, false, 0 /* ExtensionType.System */, true, language, true, undefined, this.getProductVersion())))));
            this.logService.trace('Scanned dev system extensions:', result.length);
            return (0, arrays_1.coalesce)(result);
        }
        async getBuiltInExtensionControl() {
            try {
                const content = await this.fileService.readFile(this.extensionsControlLocation);
                return JSON.parse(content.value.toString());
            }
            catch (error) {
                return {};
            }
        }
        async createExtensionScannerInput(location, profile, type, excludeObsolete, language, validate, profileScanOptions, productVersion) {
            const translations = await this.getTranslations(language ?? platform.language);
            const mtime = await this.getMtime(location);
            const applicationExtensionsLocation = profile && !this.uriIdentityService.extUri.isEqual(location, this.userDataProfilesService.defaultProfile.extensionsResource) ? this.userDataProfilesService.defaultProfile.extensionsResource : undefined;
            const applicationExtensionsLocationMtime = applicationExtensionsLocation ? await this.getMtime(applicationExtensionsLocation) : undefined;
            return new ExtensionScannerInput(location, mtime, applicationExtensionsLocation, applicationExtensionsLocationMtime, profile, profileScanOptions, type, excludeObsolete, validate, productVersion.version, productVersion.date, this.productService.commit, !this.environmentService.isBuilt, language, translations);
        }
        async getMtime(location) {
            try {
                const stat = await this.fileService.stat(location);
                if (typeof stat.mtime === 'number') {
                    return stat.mtime;
                }
            }
            catch (err) {
                // That's ok...
            }
            return undefined;
        }
        getProductVersion() {
            return {
                version: this.productService.version,
                date: this.productService.date,
            };
        }
    };
    exports.AbstractExtensionsScannerService = AbstractExtensionsScannerService;
    exports.AbstractExtensionsScannerService = AbstractExtensionsScannerService = __decorate([
        __param(4, userDataProfile_1.IUserDataProfilesService),
        __param(5, extensionsProfileScannerService_1.IExtensionsProfileScannerService),
        __param(6, files_1.IFileService),
        __param(7, log_1.ILogService),
        __param(8, environment_1.IEnvironmentService),
        __param(9, productService_1.IProductService),
        __param(10, uriIdentity_1.IUriIdentityService),
        __param(11, instantiation_1.IInstantiationService)
    ], AbstractExtensionsScannerService);
    class ExtensionScannerInput {
        constructor(location, mtime, applicationExtensionslocation, applicationExtensionslocationMtime, profile, profileScanOptions, type, excludeObsolete, validate, productVersion, productDate, productCommit, devMode, language, translations) {
            this.location = location;
            this.mtime = mtime;
            this.applicationExtensionslocation = applicationExtensionslocation;
            this.applicationExtensionslocationMtime = applicationExtensionslocationMtime;
            this.profile = profile;
            this.profileScanOptions = profileScanOptions;
            this.type = type;
            this.excludeObsolete = excludeObsolete;
            this.validate = validate;
            this.productVersion = productVersion;
            this.productDate = productDate;
            this.productCommit = productCommit;
            this.devMode = devMode;
            this.language = language;
            this.translations = translations;
            // Keep empty!! (JSON.parse)
        }
        static createNlsConfiguration(input) {
            return {
                language: input.language,
                pseudo: input.language === 'pseudo',
                devMode: input.devMode,
                translations: input.translations
            };
        }
        static equals(a, b) {
            return ((0, resources_1.isEqual)(a.location, b.location)
                && a.mtime === b.mtime
                && (0, resources_1.isEqual)(a.applicationExtensionslocation, b.applicationExtensionslocation)
                && a.applicationExtensionslocationMtime === b.applicationExtensionslocationMtime
                && a.profile === b.profile
                && objects.equals(a.profileScanOptions, b.profileScanOptions)
                && a.type === b.type
                && a.excludeObsolete === b.excludeObsolete
                && a.validate === b.validate
                && a.productVersion === b.productVersion
                && a.productDate === b.productDate
                && a.productCommit === b.productCommit
                && a.devMode === b.devMode
                && a.language === b.language
                && Translations.equals(a.translations, b.translations));
        }
    }
    exports.ExtensionScannerInput = ExtensionScannerInput;
    let ExtensionsScanner = class ExtensionsScanner extends lifecycle_1.Disposable {
        constructor(obsoleteFile, extensionsProfileScannerService, uriIdentityService, fileService, logService) {
            super();
            this.obsoleteFile = obsoleteFile;
            this.extensionsProfileScannerService = extensionsProfileScannerService;
            this.uriIdentityService = uriIdentityService;
            this.fileService = fileService;
            this.logService = logService;
        }
        async scanExtensions(input) {
            const extensions = input.profile ? await this.scanExtensionsFromProfile(input) : await this.scanExtensionsFromLocation(input);
            let obsolete = {};
            if (input.excludeObsolete && input.type === 1 /* ExtensionType.User */) {
                try {
                    const raw = (await this.fileService.readFile(this.obsoleteFile)).value.toString();
                    obsolete = JSON.parse(raw);
                }
                catch (error) { /* ignore */ }
            }
            return (0, types_1.isEmptyObject)(obsolete) ? extensions : extensions.filter(e => !obsolete[extensionManagementUtil_1.ExtensionKey.create(e).toString()]);
        }
        async scanExtensionsFromLocation(input) {
            const stat = await this.fileService.resolve(input.location);
            if (!stat.children?.length) {
                return [];
            }
            const extensions = await Promise.all(stat.children.map(async (c) => {
                if (!c.isDirectory) {
                    return null;
                }
                // Do not consider user extension folder starting with `.`
                if (input.type === 1 /* ExtensionType.User */ && (0, resources_1.basename)(c.resource).indexOf('.') === 0) {
                    return null;
                }
                const extensionScannerInput = new ExtensionScannerInput(c.resource, input.mtime, input.applicationExtensionslocation, input.applicationExtensionslocationMtime, input.profile, input.profileScanOptions, input.type, input.excludeObsolete, input.validate, input.productVersion, input.productDate, input.productCommit, input.devMode, input.language, input.translations);
                return this.scanExtension(extensionScannerInput);
            }));
            return (0, arrays_1.coalesce)(extensions)
                // Sort: Make sure extensions are in the same order always. Helps cache invalidation even if the order changes.
                .sort((a, b) => a.location.path < b.location.path ? -1 : 1);
        }
        async scanExtensionsFromProfile(input) {
            let profileExtensions = await this.scanExtensionsFromProfileResource(input.location, () => true, input);
            if (input.applicationExtensionslocation && !this.uriIdentityService.extUri.isEqual(input.location, input.applicationExtensionslocation)) {
                profileExtensions = profileExtensions.filter(e => !e.metadata?.isApplicationScoped);
                const applicationExtensions = await this.scanExtensionsFromProfileResource(input.applicationExtensionslocation, (e) => !!e.metadata?.isBuiltin || !!e.metadata?.isApplicationScoped, input);
                profileExtensions.push(...applicationExtensions);
            }
            return profileExtensions;
        }
        async scanExtensionsFromProfileResource(profileResource, filter, input) {
            const scannedProfileExtensions = await this.extensionsProfileScannerService.scanProfileExtensions(profileResource, input.profileScanOptions);
            if (!scannedProfileExtensions.length) {
                return [];
            }
            const extensions = await Promise.all(scannedProfileExtensions.map(async (extensionInfo) => {
                if (filter(extensionInfo)) {
                    const extensionScannerInput = new ExtensionScannerInput(extensionInfo.location, input.mtime, input.applicationExtensionslocation, input.applicationExtensionslocationMtime, input.profile, input.profileScanOptions, input.type, input.excludeObsolete, input.validate, input.productVersion, input.productDate, input.productCommit, input.devMode, input.language, input.translations);
                    return this.scanExtension(extensionScannerInput, extensionInfo.metadata);
                }
                return null;
            }));
            return (0, arrays_1.coalesce)(extensions);
        }
        async scanOneOrMultipleExtensions(input) {
            try {
                if (await this.fileService.exists((0, resources_1.joinPath)(input.location, 'package.json'))) {
                    const extension = await this.scanExtension(input);
                    return extension ? [extension] : [];
                }
                else {
                    return await this.scanExtensions(input);
                }
            }
            catch (error) {
                this.logService.error(`Error scanning extensions at ${input.location.path}:`, (0, errors_1.getErrorMessage)(error));
                return [];
            }
        }
        async scanExtension(input, metadata) {
            try {
                let manifest = await this.scanExtensionManifest(input.location);
                if (manifest) {
                    // allow publisher to be undefined to make the initial extension authoring experience smoother
                    if (!manifest.publisher) {
                        manifest.publisher = extensions_1.UNDEFINED_PUBLISHER;
                    }
                    metadata = metadata ?? manifest.__metadata;
                    delete manifest.__metadata;
                    const id = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
                    const identifier = metadata?.id ? { id, uuid: metadata.id } : { id };
                    const type = metadata?.isSystem ? 0 /* ExtensionType.System */ : input.type;
                    const isBuiltin = type === 0 /* ExtensionType.System */ || !!metadata?.isBuiltin;
                    manifest = await this.translateManifest(input.location, manifest, ExtensionScannerInput.createNlsConfiguration(input));
                    const extension = {
                        type,
                        identifier,
                        manifest,
                        location: input.location,
                        isBuiltin,
                        targetPlatform: metadata?.targetPlatform ?? "undefined" /* TargetPlatform.UNDEFINED */,
                        metadata,
                        isValid: true,
                        validations: []
                    };
                    return input.validate ? this.validate(extension, input) : extension;
                }
            }
            catch (e) {
                if (input.type !== 0 /* ExtensionType.System */) {
                    this.logService.error(e);
                }
            }
            return null;
        }
        validate(extension, input) {
            let isValid = true;
            const validations = (0, extensionValidator_1.validateExtensionManifest)(input.productVersion, input.productDate, input.location, extension.manifest, extension.isBuiltin);
            for (const [severity, message] of validations) {
                if (severity === severity_1.default.Error) {
                    isValid = false;
                    this.logService.error(this.formatMessage(input.location, message));
                }
            }
            extension.isValid = isValid;
            extension.validations = validations;
            return extension;
        }
        async scanExtensionManifest(extensionLocation) {
            const manifestLocation = (0, resources_1.joinPath)(extensionLocation, 'package.json');
            let content;
            try {
                content = (await this.fileService.readFile(manifestLocation)).value.toString();
            }
            catch (error) {
                if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.error(this.formatMessage(extensionLocation, (0, nls_1.localize)('fileReadFail', "Cannot read file {0}: {1}.", manifestLocation.path, error.message)));
                }
                return null;
            }
            let manifest;
            try {
                manifest = JSON.parse(content);
            }
            catch (err) {
                // invalid JSON, let's get good errors
                const errors = [];
                (0, json_1.parse)(content, errors);
                for (const e of errors) {
                    this.logService.error(this.formatMessage(extensionLocation, (0, nls_1.localize)('jsonParseFail', "Failed to parse {0}: [{1}, {2}] {3}.", manifestLocation.path, e.offset, e.length, (0, jsonErrorMessages_1.getParseErrorMessage)(e.error))));
                }
                return null;
            }
            if ((0, json_1.getNodeType)(manifest) !== 'object') {
                this.logService.error(this.formatMessage(extensionLocation, (0, nls_1.localize)('jsonParseInvalidType', "Invalid manifest file {0}: Not an JSON object.", manifestLocation.path)));
                return null;
            }
            return manifest;
        }
        async translateManifest(extensionLocation, extensionManifest, nlsConfiguration) {
            const localizedMessages = await this.getLocalizedMessages(extensionLocation, extensionManifest, nlsConfiguration);
            if (localizedMessages) {
                try {
                    const errors = [];
                    // resolveOriginalMessageBundle returns null if localizedMessages.default === undefined;
                    const defaults = await this.resolveOriginalMessageBundle(localizedMessages.default, errors);
                    if (errors.length > 0) {
                        errors.forEach((error) => {
                            this.logService.error(this.formatMessage(extensionLocation, (0, nls_1.localize)('jsonsParseReportErrors', "Failed to parse {0}: {1}.", localizedMessages.default?.path, (0, jsonErrorMessages_1.getParseErrorMessage)(error.error))));
                        });
                        return extensionManifest;
                    }
                    else if ((0, json_1.getNodeType)(localizedMessages) !== 'object') {
                        this.logService.error(this.formatMessage(extensionLocation, (0, nls_1.localize)('jsonInvalidFormat', "Invalid format {0}: JSON object expected.", localizedMessages.default?.path)));
                        return extensionManifest;
                    }
                    const localized = localizedMessages.values || Object.create(null);
                    return (0, extensionNls_1.localizeManifest)(this.logService, extensionManifest, localized, defaults);
                }
                catch (error) {
                    /*Ignore Error*/
                }
            }
            return extensionManifest;
        }
        async getLocalizedMessages(extensionLocation, extensionManifest, nlsConfiguration) {
            const defaultPackageNLS = (0, resources_1.joinPath)(extensionLocation, 'package.nls.json');
            const reportErrors = (localized, errors) => {
                errors.forEach((error) => {
                    this.logService.error(this.formatMessage(extensionLocation, (0, nls_1.localize)('jsonsParseReportErrors', "Failed to parse {0}: {1}.", localized?.path, (0, jsonErrorMessages_1.getParseErrorMessage)(error.error))));
                });
            };
            const reportInvalidFormat = (localized) => {
                this.logService.error(this.formatMessage(extensionLocation, (0, nls_1.localize)('jsonInvalidFormat', "Invalid format {0}: JSON object expected.", localized?.path)));
            };
            const translationId = `${extensionManifest.publisher}.${extensionManifest.name}`;
            const translationPath = nlsConfiguration.translations[translationId];
            if (translationPath) {
                try {
                    const translationResource = uri_1.URI.file(translationPath);
                    const content = (await this.fileService.readFile(translationResource)).value.toString();
                    const errors = [];
                    const translationBundle = (0, json_1.parse)(content, errors);
                    if (errors.length > 0) {
                        reportErrors(translationResource, errors);
                        return { values: undefined, default: defaultPackageNLS };
                    }
                    else if ((0, json_1.getNodeType)(translationBundle) !== 'object') {
                        reportInvalidFormat(translationResource);
                        return { values: undefined, default: defaultPackageNLS };
                    }
                    else {
                        const values = translationBundle.contents ? translationBundle.contents.package : undefined;
                        return { values: values, default: defaultPackageNLS };
                    }
                }
                catch (error) {
                    return { values: undefined, default: defaultPackageNLS };
                }
            }
            else {
                const exists = await this.fileService.exists(defaultPackageNLS);
                if (!exists) {
                    return undefined;
                }
                let messageBundle;
                try {
                    messageBundle = await this.findMessageBundles(extensionLocation, nlsConfiguration);
                }
                catch (error) {
                    return undefined;
                }
                if (!messageBundle.localized) {
                    return { values: undefined, default: messageBundle.original };
                }
                try {
                    const messageBundleContent = (await this.fileService.readFile(messageBundle.localized)).value.toString();
                    const errors = [];
                    const messages = (0, json_1.parse)(messageBundleContent, errors);
                    if (errors.length > 0) {
                        reportErrors(messageBundle.localized, errors);
                        return { values: undefined, default: messageBundle.original };
                    }
                    else if ((0, json_1.getNodeType)(messages) !== 'object') {
                        reportInvalidFormat(messageBundle.localized);
                        return { values: undefined, default: messageBundle.original };
                    }
                    return { values: messages, default: messageBundle.original };
                }
                catch (error) {
                    return { values: undefined, default: messageBundle.original };
                }
            }
        }
        /**
         * Parses original message bundle, returns null if the original message bundle is null.
         */
        async resolveOriginalMessageBundle(originalMessageBundle, errors) {
            if (originalMessageBundle) {
                try {
                    const originalBundleContent = (await this.fileService.readFile(originalMessageBundle)).value.toString();
                    return (0, json_1.parse)(originalBundleContent, errors);
                }
                catch (error) {
                    /* Ignore Error */
                }
            }
            return;
        }
        /**
         * Finds localized message bundle and the original (unlocalized) one.
         * If the localized file is not present, returns null for the original and marks original as localized.
         */
        findMessageBundles(extensionLocation, nlsConfiguration) {
            return new Promise((c, e) => {
                const loop = (locale) => {
                    const toCheck = (0, resources_1.joinPath)(extensionLocation, `package.nls.${locale}.json`);
                    this.fileService.exists(toCheck).then(exists => {
                        if (exists) {
                            c({ localized: toCheck, original: (0, resources_1.joinPath)(extensionLocation, 'package.nls.json') });
                        }
                        const index = locale.lastIndexOf('-');
                        if (index === -1) {
                            c({ localized: (0, resources_1.joinPath)(extensionLocation, 'package.nls.json'), original: null });
                        }
                        else {
                            locale = locale.substring(0, index);
                            loop(locale);
                        }
                    });
                };
                if (nlsConfiguration.devMode || nlsConfiguration.pseudo || !nlsConfiguration.language) {
                    return c({ localized: (0, resources_1.joinPath)(extensionLocation, 'package.nls.json'), original: null });
                }
                loop(nlsConfiguration.language);
            });
        }
        formatMessage(extensionLocation, message) {
            return `[${extensionLocation.path}]: ${message}`;
        }
    };
    ExtensionsScanner = __decorate([
        __param(1, extensionsProfileScannerService_1.IExtensionsProfileScannerService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, files_1.IFileService),
        __param(4, log_1.ILogService)
    ], ExtensionsScanner);
    let CachedExtensionsScanner = class CachedExtensionsScanner extends ExtensionsScanner {
        constructor(currentProfile, obsoleteFile, userDataProfilesService, extensionsProfileScannerService, uriIdentityService, fileService, logService) {
            super(obsoleteFile, extensionsProfileScannerService, uriIdentityService, fileService, logService);
            this.currentProfile = currentProfile;
            this.userDataProfilesService = userDataProfilesService;
            this.cacheValidatorThrottler = this._register(new async_1.ThrottledDelayer(3000));
            this._onDidChangeCache = this._register(new event_1.Emitter());
            this.onDidChangeCache = this._onDidChangeCache.event;
        }
        async scanExtensions(input) {
            const cacheFile = this.getCacheFile(input);
            const cacheContents = await this.readExtensionCache(cacheFile);
            this.input = input;
            if (cacheContents && cacheContents.input && ExtensionScannerInput.equals(cacheContents.input, this.input)) {
                this.logService.debug('Using cached extensions scan result', input.location.toString());
                this.cacheValidatorThrottler.trigger(() => this.validateCache());
                return cacheContents.result.map((extension) => {
                    // revive URI object
                    extension.location = uri_1.URI.revive(extension.location);
                    return extension;
                });
            }
            const result = await super.scanExtensions(input);
            await this.writeExtensionCache(cacheFile, { input, result });
            return result;
        }
        async readExtensionCache(cacheFile) {
            try {
                const cacheRawContents = await this.fileService.readFile(cacheFile);
                const extensionCacheData = JSON.parse(cacheRawContents.value.toString());
                return { result: extensionCacheData.result, input: (0, marshalling_1.revive)(extensionCacheData.input) };
            }
            catch (error) {
                this.logService.debug('Error while reading the extension cache file:', cacheFile.path, (0, errors_1.getErrorMessage)(error));
            }
            return null;
        }
        async writeExtensionCache(cacheFile, cacheContents) {
            try {
                await this.fileService.writeFile(cacheFile, buffer_1.VSBuffer.fromString(JSON.stringify(cacheContents)));
            }
            catch (error) {
                this.logService.debug('Error while writing the extension cache file:', cacheFile.path, (0, errors_1.getErrorMessage)(error));
            }
        }
        async validateCache() {
            if (!this.input) {
                // Input has been unset by the time we get here, so skip validation
                return;
            }
            const cacheFile = this.getCacheFile(this.input);
            const cacheContents = await this.readExtensionCache(cacheFile);
            if (!cacheContents) {
                // Cache has been deleted by someone else, which is perfectly fine...
                return;
            }
            const actual = cacheContents.result;
            const expected = JSON.parse(JSON.stringify(await super.scanExtensions(this.input)));
            if (objects.equals(expected, actual)) {
                // Cache is valid and running with it is perfectly fine...
                return;
            }
            try {
                this.logService.info('Invalidating Cache', actual, expected);
                // Cache is invalid, delete it
                await this.fileService.del(cacheFile);
                this._onDidChangeCache.fire();
            }
            catch (error) {
                this.logService.error(error);
            }
        }
        getCacheFile(input) {
            const profile = this.getProfile(input);
            return this.uriIdentityService.extUri.joinPath(profile.cacheHome, input.type === 0 /* ExtensionType.System */ ? extensions_1.BUILTIN_MANIFEST_CACHE_FILE : extensions_1.USER_MANIFEST_CACHE_FILE);
        }
        getProfile(input) {
            if (input.type === 0 /* ExtensionType.System */) {
                return this.userDataProfilesService.defaultProfile;
            }
            if (!input.profile) {
                return this.userDataProfilesService.defaultProfile;
            }
            if (this.uriIdentityService.extUri.isEqual(input.location, this.currentProfile.extensionsResource)) {
                return this.currentProfile;
            }
            return this.userDataProfilesService.profiles.find(p => this.uriIdentityService.extUri.isEqual(input.location, p.extensionsResource)) ?? this.currentProfile;
        }
    };
    CachedExtensionsScanner = __decorate([
        __param(2, userDataProfile_1.IUserDataProfilesService),
        __param(3, extensionsProfileScannerService_1.IExtensionsProfileScannerService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, files_1.IFileService),
        __param(6, log_1.ILogService)
    ], CachedExtensionsScanner);
    function toExtensionDescription(extension, isUnderDevelopment) {
        const id = (0, extensionManagementUtil_1.getExtensionId)(extension.manifest.publisher, extension.manifest.name);
        return {
            id,
            identifier: new extensions_1.ExtensionIdentifier(id),
            isBuiltin: extension.type === 0 /* ExtensionType.System */,
            isUserBuiltin: extension.type === 1 /* ExtensionType.User */ && extension.isBuiltin,
            isUnderDevelopment,
            extensionLocation: extension.location,
            uuid: extension.identifier.uuid,
            targetPlatform: extension.targetPlatform,
            ...extension.manifest,
        };
    }
    class NativeExtensionsScannerService extends AbstractExtensionsScannerService {
        constructor(systemExtensionsLocation, userExtensionsLocation, userHome, currentProfile, userDataProfilesService, extensionsProfileScannerService, fileService, logService, environmentService, productService, uriIdentityService, instantiationService) {
            super(systemExtensionsLocation, userExtensionsLocation, (0, resources_1.joinPath)(userHome, '.vscode-oss-dev', 'extensions', 'control.json'), currentProfile, userDataProfilesService, extensionsProfileScannerService, fileService, logService, environmentService, productService, uriIdentityService, instantiationService);
            this.translationsPromise = (async () => {
                if (platform.translationsConfigFile) {
                    try {
                        const content = await this.fileService.readFile(uri_1.URI.file(platform.translationsConfigFile));
                        return JSON.parse(content.value.toString());
                    }
                    catch (err) { /* Ignore Error */ }
                }
                return Object.create(null);
            })();
        }
        getTranslations(language) {
            return this.translationsPromise;
        }
    }
    exports.NativeExtensionsScannerService = NativeExtensionsScannerService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1NjYW5uZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlbnNpb25NYW5hZ2VtZW50L2NvbW1vbi9leHRlbnNpb25zU2Nhbm5lclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBdThCaEcsd0RBYUM7SUE1NUJELElBQWlCLFlBQVksQ0FzQjVCO0lBdEJELFdBQWlCLFlBQVk7UUFDNUIsU0FBZ0IsTUFBTSxDQUFDLENBQWUsRUFBRSxDQUFlO1lBQ3RELElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNiLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0IsTUFBTSxLQUFLLEdBQWdCLElBQUksR0FBRyxFQUFVLENBQUM7WUFDN0MsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2xDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDaEIsQ0FBQztZQUNELElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2pDLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELEtBQUssTUFBTSxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUN2QixPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO2dCQUNELEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbkIsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUM7UUFDekIsQ0FBQztRQXBCZSxtQkFBTSxTQW9CckIsQ0FBQTtJQUNGLENBQUMsRUF0QmdCLFlBQVksNEJBQVosWUFBWSxRQXNCNUI7SUFnQ1ksUUFBQSx5QkFBeUIsR0FBRyxJQUFBLCtCQUFlLEVBQTRCLDJCQUEyQixDQUFDLENBQUM7SUF1QjFHLElBQWUsZ0NBQWdDLEdBQS9DLE1BQWUsZ0NBQWlDLFNBQVEsc0JBQVU7UUFjeEUsWUFDVSx3QkFBNkIsRUFDN0Isc0JBQTJCLEVBQ25CLHlCQUE4QixFQUM5QixjQUFnQyxFQUN2Qix1QkFBa0UsRUFDMUQsK0JBQW9GLEVBQ3hHLFdBQTRDLEVBQzdDLFVBQTBDLEVBQ2xDLGtCQUF3RCxFQUM1RCxjQUFnRCxFQUM1QyxrQkFBd0QsRUFDdEQsb0JBQTREO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBYkMsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUFLO1lBQzdCLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBSztZQUNuQiw4QkFBeUIsR0FBekIseUJBQXlCLENBQUs7WUFDOUIsbUJBQWMsR0FBZCxjQUFjLENBQWtCO1lBQ04sNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUN2QyxvQ0FBK0IsR0FBL0IsK0JBQStCLENBQWtDO1lBQ3JGLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQzFCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDakIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUMzQyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDM0IsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUNyQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBcEJuRSxzQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFpQixDQUFDLENBQUM7WUFDekUscUJBQWdCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQUV4QyxpQkFBWSxHQUFHLElBQUEsb0JBQVEsRUFBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDbEUsa0NBQTZCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDMUosZ0NBQTJCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDeEosc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBdUo1SCw4Q0FBeUMsR0FBOEIsU0FBUyxDQUFDO1lBckl4RixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSw4QkFBc0IsQ0FBQyxDQUFDLENBQUM7WUFDN0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksNEJBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQzFILENBQUM7UUFHRCxpQkFBaUI7WUFDaEIsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO2dCQUNsQyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBQSwrQ0FBcUIsRUFBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN4RixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUM7UUFDcEMsQ0FBQztRQUVELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBOEIsRUFBRSxlQUE0QixFQUFFLHlCQUFrQztZQUN2SCxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGlCQUFpQixDQUFDO2dCQUM1QyxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDO2FBQ3hDLENBQUMsQ0FBQztZQUNILE1BQU0sV0FBVyxHQUFHLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ3hJLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxNQUFNLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzlGLENBQUM7UUFFRCxLQUFLLENBQUMsb0JBQW9CLENBQUMsV0FBd0I7WUFDbEQsTUFBTSxRQUFRLEdBQTBDLEVBQUUsQ0FBQztZQUMzRCxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM5RixRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQ2xHLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxtQkFBbUIsQ0FBQyxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNuRixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsdUJBQXVCLEVBQUUsR0FBRyxtQkFBbUIsQ0FBQyxnQ0FBd0IsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzlILENBQUM7UUFFRCxLQUFLLENBQUMsa0JBQWtCLENBQUMsV0FBd0I7WUFDaEQsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMsc0JBQXNCLENBQUM7WUFDNUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsa0NBQWtDLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDcEUsTUFBTSxrQkFBa0IsR0FBOEMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUMxUCxNQUFNLHNCQUFzQixHQUFHLE1BQU0sSUFBSSxDQUFDLDJCQUEyQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLGVBQWUsOEJBQXNCLENBQUMsV0FBVyxDQUFDLGtCQUFrQixFQUFFLFdBQVcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLFdBQVcsQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQztZQUM1USxNQUFNLGlCQUFpQixHQUFHLFdBQVcsQ0FBQyxRQUFRLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLElBQUksc0JBQXNCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztZQUN4TCxJQUFJLFVBQXNDLENBQUM7WUFDM0MsSUFBSSxDQUFDO2dCQUNKLFVBQVUsR0FBRyxNQUFNLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQzdFLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFJLEtBQUssWUFBWSxnRUFBOEIsSUFBSSxLQUFLLENBQUMsSUFBSSwrRkFBK0QsRUFBRSxDQUFDO29CQUNsSSxNQUFNLElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxDQUFDO29CQUNsRCxVQUFVLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsc0JBQXNCLENBQUMsQ0FBQztnQkFDN0UsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sS0FBSyxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO1lBQ0QsVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsOEJBQXNCLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1RixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckUsT0FBTyxVQUFVLENBQUM7UUFDbkIsQ0FBQztRQUVELEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxXQUF3QixFQUFFLGtCQUF1QztZQUNyRyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxzQkFBc0IsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsK0JBQStCLEVBQUUsQ0FBQztnQkFDL0csTUFBTSxVQUFVLEdBQUcsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLCtCQUErQixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLENBQUM7cUJBQzVJLEdBQUcsQ0FBQyxLQUFLLEVBQUMsK0JBQStCLEVBQUMsRUFBRTtvQkFDNUMsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsMkJBQTJCLENBQUMsK0JBQStCLEVBQUUsS0FBSyw4QkFBc0IsSUFBSSxFQUFFLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLHFCQUFxQixFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsY0FBYyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUM7b0JBQzdPLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLDJCQUEyQixDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNuRixPQUFPLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7d0JBQ2pDLDJEQUEyRDt3QkFDM0QsU0FBUyxDQUFDLElBQUksR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLDJDQUFpQixFQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUM7d0JBQzdILHlCQUF5Qjt3QkFDekIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDMUQsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDSCxJQUFJLEVBQUUsQ0FBQztnQkFDVCxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1RSxDQUFDO1lBQ0QsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRUQsS0FBSyxDQUFDLHFCQUFxQixDQUFDLGlCQUFzQixFQUFFLGFBQTRCLEVBQUUsV0FBd0I7WUFDekcsTUFBTSxzQkFBc0IsR0FBRyxNQUFNLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQ3BOLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ3JGLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3ZELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxLQUFLLENBQUMsMkJBQTJCLENBQUMsaUJBQXNCLEVBQUUsYUFBNEIsRUFBRSxXQUF3QjtZQUMvRyxNQUFNLHNCQUFzQixHQUFHLE1BQU0sSUFBSSxDQUFDLDJCQUEyQixDQUFDLGlCQUFpQixFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsY0FBYyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUM7WUFDcE4sTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsMkJBQTJCLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUNwRyxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM1RSxDQUFDO1FBRUQsS0FBSyxDQUFDLHNCQUFzQixDQUFDLGtCQUF5QixFQUFFLGFBQTRCLEVBQUUsV0FBd0I7WUFDN0csTUFBTSxVQUFVLEdBQStCLEVBQUUsQ0FBQztZQUNsRCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyxpQkFBaUIsRUFBQyxFQUFFO2dCQUNsRSxNQUFNLGlCQUFpQixHQUFHLE1BQU0sSUFBSSxDQUFDLDJCQUEyQixDQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDaEgsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLGlCQUFpQixDQUFDLENBQUM7WUFDdkMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzVFLENBQUM7UUFFRCxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFzQjtZQUN4QyxNQUFNLGdCQUFnQixHQUFHLElBQUEsb0JBQVEsRUFBQyxpQkFBaUIsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNyRSxNQUFNLE9BQU8sR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyRixNQUFNLFFBQVEsR0FBOEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNoRSxPQUFPLFFBQVEsQ0FBQyxVQUFVLENBQUM7UUFDNUIsQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjLENBQUMsaUJBQXNCLEVBQUUsUUFBMkI7WUFDdkUsTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLG9CQUFRLEVBQUMsaUJBQWlCLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDckUsTUFBTSxPQUFPLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDckYsTUFBTSxRQUFRLEdBQThCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFaEUsaUJBQWlCO1lBQ2pCLElBQUksUUFBUSxDQUFDLGVBQWUsS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDeEMsT0FBTyxRQUFRLENBQUMsZUFBZSxDQUFDO1lBQ2pDLENBQUM7WUFDRCxJQUFJLFFBQVEsQ0FBQyxTQUFTLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ2xDLE9BQU8sUUFBUSxDQUFDLFNBQVMsQ0FBQztZQUMzQixDQUFDO1lBQ0QsUUFBUSxDQUFDLFVBQVUsR0FBRyxFQUFFLEdBQUcsUUFBUSxDQUFDLFVBQVUsRUFBRSxHQUFHLFFBQVEsRUFBRSxDQUFDO1lBRTlELE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBQSxvQkFBUSxFQUFDLGlCQUFpQixFQUFFLGNBQWMsQ0FBQyxFQUFFLGlCQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUksQ0FBQztRQUVELEtBQUssQ0FBQyxrQ0FBa0M7WUFDdkMsSUFBSSxDQUFDO2dCQUNKLE1BQU0sSUFBSSxDQUFDLCtCQUErQixDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLEVBQUUsRUFBRSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3JLLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFJLEtBQUssWUFBWSxnRUFBOEIsSUFBSSxLQUFLLENBQUMsSUFBSSwrRkFBK0QsRUFBRSxDQUFDO29CQUNsSSxNQUFNLElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxDQUFDO2dCQUNuRCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsTUFBTSxLQUFLLENBQUM7Z0JBQ2IsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBR08sS0FBSyxDQUFDLG9DQUFvQztZQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLHlDQUF5QyxFQUFFLENBQUM7Z0JBQ3JELElBQUksQ0FBQyx5Q0FBeUMsR0FBRyxDQUFDLEtBQUssSUFBSSxFQUFFO29CQUM1RCxJQUFJLENBQUM7d0JBQ0osSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsb0ZBQW9GLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7d0JBQ25KLE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7d0JBQy9FLElBQUksY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDOzRCQUMzQixNQUFNLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO3dCQUM3SyxDQUFDOzZCQUFNLENBQUM7NEJBQ1AsSUFBSSxDQUFDO2dDQUNKLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDNUksQ0FBQzs0QkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dDQUNoQixJQUFJLElBQUEsNkJBQXFCLEVBQUMsS0FBSyxDQUFDLCtDQUF1QyxFQUFFLENBQUM7b0NBQ3pFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLHlGQUF5RixFQUFFLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFBLHdCQUFlLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQ0FDakwsQ0FBQzs0QkFDRixDQUFDO3dCQUNGLENBQUM7d0JBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsc0ZBQXNGLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQ3RKLENBQUM7b0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQzt3QkFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzlCLENBQUM7NEJBQVMsQ0FBQzt3QkFDVixJQUFJLENBQUMseUNBQXlDLEdBQUcsU0FBUyxDQUFDO29CQUM1RCxDQUFDO2dCQUNGLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDTixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMseUNBQXlDLENBQUM7UUFDdkQsQ0FBQztRQUVPLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFzQyxFQUFFLElBQW1DLEVBQUUsV0FBd0IsRUFBRSxVQUFtQjtZQUN4SixJQUFJLENBQUMsV0FBVyxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3JDLFVBQVUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksaUNBQXlCLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLElBQUksK0JBQXVCLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLElBQUksS0FBSyxhQUFhLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDOU8sQ0FBQztZQUNELElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ2pDLFVBQVUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hFLENBQUM7WUFDRCxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQy9CLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN0RCxJQUFJLFlBQVksR0FBRyxZQUFZLEVBQUUsQ0FBQztvQkFDakMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDO2dCQUNELElBQUksWUFBWSxHQUFHLFlBQVksRUFBRSxDQUFDO29CQUNqQyxPQUFPLENBQUMsQ0FBQztnQkFDVixDQUFDO2dCQUNELE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sZUFBZSxDQUFDLE1BQXVDLEVBQUUsSUFBcUMsRUFBRSxXQUE0QyxFQUFFLGNBQThCLEVBQUUsVUFBbUI7WUFDeE0sTUFBTSxJQUFJLEdBQUcsQ0FBQyxRQUEyQixFQUFFLFNBQTRCLEVBQUUsYUFBc0IsRUFBVyxFQUFFO2dCQUMzRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzVDLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7Z0JBQ0QsSUFBSSxRQUFRLENBQUMsT0FBTyxLQUFLLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDNUMsSUFBSSxVQUFVLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7d0JBQ3BGLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHNCQUFzQixTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksdUJBQXVCLFNBQVMsQ0FBQyxRQUFRLENBQUMsT0FBTyxpQkFBaUIsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLGlCQUFpQixRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7d0JBQ3pNLE9BQU8sS0FBSyxDQUFDO29CQUNkLENBQUM7b0JBQ0QsSUFBSSxNQUFNLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQzt3QkFDdEUsSUFBSSxRQUFRLENBQUMsSUFBSSxpQ0FBeUIsRUFBRSxDQUFDOzRCQUM1QyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLGtDQUFrQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksb0JBQW9CLENBQUMsQ0FBQzs0QkFDakosT0FBTyxLQUFLLENBQUM7d0JBQ2QsQ0FBQzt3QkFDRCxJQUFJLFFBQVEsQ0FBQyxjQUFjLEtBQUssY0FBYyxFQUFFLENBQUM7NEJBQ2hELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHNCQUFzQixTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksbUNBQW1DLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDOzRCQUNsSSxPQUFPLEtBQUssQ0FBQzt3QkFDZCxDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxJQUFJLGFBQWEsRUFBRSxDQUFDO29CQUNuQixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyw4QkFBOEIsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLFNBQVMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO2dCQUMvRyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsOEJBQThCLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxTQUFTLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztnQkFDaEgsQ0FBQztnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUMsQ0FBQztZQUNGLE1BQU0sTUFBTSxHQUFHLElBQUksbUNBQXNCLEVBQXFCLENBQUM7WUFDL0QsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFO2dCQUM3QixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3JELElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDbkQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDaEQsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFO2dCQUMzQixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3JELElBQUksQ0FBQyxRQUFRLElBQUksTUFBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLGlDQUF5QixFQUFFLENBQUM7b0JBQ3BFLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHNDQUFzQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7b0JBQ3hGLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ25ELE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ2hELENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUNILFdBQVcsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQ2hDLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDckQsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUNsRCxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNoRCxDQUFDO2dCQUNELE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDaEQsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUM3QixDQUFDO1FBRU8sS0FBSyxDQUFDLDJCQUEyQixDQUFDLFFBQWlCLEVBQUUsUUFBNEI7WUFDeEYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsb0NBQW9DLENBQUMsQ0FBQztZQUM1RCxNQUFNLHNCQUFzQixHQUFHLE1BQU0sSUFBSSxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLGdDQUF3QixJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQztZQUM3TCxNQUFNLGlCQUFpQixHQUFHLFFBQVEsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUM7WUFDcEksTUFBTSxNQUFNLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUM5RSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbkUsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRU8sS0FBSyxDQUFDLHVCQUF1QixDQUFDLFFBQTRCLEVBQUUsZ0JBQXlCO1lBQzVGLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDO1lBQzdHLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxNQUFNLEVBQUUsQ0FBQztnQkFDdEMsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQztZQUNoRSxNQUFNLHVCQUF1QixHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDaEcsTUFBTSw0QkFBNEIsR0FBVSxFQUFFLENBQUM7WUFDL0MsTUFBTSwyQkFBMkIsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5SSxLQUFLLE1BQU0sU0FBUyxJQUFJLHVCQUF1QixFQUFFLENBQUM7Z0JBQ2pELE1BQU0sWUFBWSxHQUFHLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxhQUFhLENBQUM7Z0JBQzlFLFFBQVEsWUFBWSxFQUFFLENBQUM7b0JBQ3RCLEtBQUssVUFBVTt3QkFDZCxNQUFNO29CQUNQLEtBQUssYUFBYTt3QkFDakIsNEJBQTRCLENBQUMsSUFBSSxDQUFDLElBQUEsb0JBQVEsRUFBQywyQkFBMkIsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDekYsTUFBTTtvQkFDUDt3QkFDQyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO3dCQUMxRCxNQUFNO2dCQUNSLENBQUM7WUFDRixDQUFDO1lBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUMsUUFBUSxFQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsMkJBQTJCLENBQUMsUUFBUSxFQUFFLEtBQUssZ0NBQXdCLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdlEsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZFLE9BQU8sSUFBQSxpQkFBUSxFQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFFTyxLQUFLLENBQUMsMEJBQTBCO1lBQ3ZDLElBQUksQ0FBQztnQkFDSixNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO2dCQUNoRixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzdDLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLDJCQUEyQixDQUFDLFFBQWEsRUFBRSxPQUFnQixFQUFFLElBQW1CLEVBQUUsZUFBd0IsRUFBRSxRQUE0QixFQUFFLFFBQWlCLEVBQUUsa0JBQTZELEVBQUUsY0FBK0I7WUFDeFEsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDL0UsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sNkJBQTZCLEdBQUcsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ2hQLE1BQU0sa0NBQWtDLEdBQUcsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFDMUksT0FBTyxJQUFJLHFCQUFxQixDQUMvQixRQUFRLEVBQ1IsS0FBSyxFQUNMLDZCQUE2QixFQUM3QixrQ0FBa0MsRUFDbEMsT0FBTyxFQUNQLGtCQUFrQixFQUNsQixJQUFJLEVBQ0osZUFBZSxFQUNmLFFBQVEsRUFDUixjQUFjLENBQUMsT0FBTyxFQUN0QixjQUFjLENBQUMsSUFBSSxFQUNuQixJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFDMUIsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUNoQyxRQUFRLEVBQ1IsWUFBWSxDQUNaLENBQUM7UUFDSCxDQUFDO1FBRU8sS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFhO1lBQ25DLElBQUksQ0FBQztnQkFDSixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNuRCxJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDcEMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUNuQixDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2QsZUFBZTtZQUNoQixDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixPQUFPO2dCQUNOLE9BQU8sRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU87Z0JBQ3BDLElBQUksRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUk7YUFDOUIsQ0FBQztRQUNILENBQUM7S0FFRCxDQUFBO0lBcFdxQiw0RUFBZ0M7K0NBQWhDLGdDQUFnQztRQW1CbkQsV0FBQSwwQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLGtFQUFnQyxDQUFBO1FBQ2hDLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSxnQ0FBZSxDQUFBO1FBQ2YsWUFBQSxpQ0FBbUIsQ0FBQTtRQUNuQixZQUFBLHFDQUFxQixDQUFBO09BMUJGLGdDQUFnQyxDQW9XckQ7SUFFRCxNQUFhLHFCQUFxQjtRQUVqQyxZQUNpQixRQUFhLEVBQ2IsS0FBeUIsRUFDekIsNkJBQThDLEVBQzlDLGtDQUFzRCxFQUN0RCxPQUFnQixFQUNoQixrQkFBNkQsRUFDN0QsSUFBbUIsRUFDbkIsZUFBd0IsRUFDeEIsUUFBaUIsRUFDakIsY0FBc0IsRUFDdEIsV0FBK0IsRUFDL0IsYUFBaUMsRUFDakMsT0FBZ0IsRUFDaEIsUUFBNEIsRUFDNUIsWUFBMEI7WUFkMUIsYUFBUSxHQUFSLFFBQVEsQ0FBSztZQUNiLFVBQUssR0FBTCxLQUFLLENBQW9CO1lBQ3pCLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBaUI7WUFDOUMsdUNBQWtDLEdBQWxDLGtDQUFrQyxDQUFvQjtZQUN0RCxZQUFPLEdBQVAsT0FBTyxDQUFTO1lBQ2hCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBMkM7WUFDN0QsU0FBSSxHQUFKLElBQUksQ0FBZTtZQUNuQixvQkFBZSxHQUFmLGVBQWUsQ0FBUztZQUN4QixhQUFRLEdBQVIsUUFBUSxDQUFTO1lBQ2pCLG1CQUFjLEdBQWQsY0FBYyxDQUFRO1lBQ3RCLGdCQUFXLEdBQVgsV0FBVyxDQUFvQjtZQUMvQixrQkFBYSxHQUFiLGFBQWEsQ0FBb0I7WUFDakMsWUFBTyxHQUFQLE9BQU8sQ0FBUztZQUNoQixhQUFRLEdBQVIsUUFBUSxDQUFvQjtZQUM1QixpQkFBWSxHQUFaLFlBQVksQ0FBYztZQUUxQyw0QkFBNEI7UUFDN0IsQ0FBQztRQUVNLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxLQUE0QjtZQUNoRSxPQUFPO2dCQUNOLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUTtnQkFDeEIsTUFBTSxFQUFFLEtBQUssQ0FBQyxRQUFRLEtBQUssUUFBUTtnQkFDbkMsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO2dCQUN0QixZQUFZLEVBQUUsS0FBSyxDQUFDLFlBQVk7YUFDaEMsQ0FBQztRQUNILENBQUM7UUFFTSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQXdCLEVBQUUsQ0FBd0I7WUFDdEUsT0FBTyxDQUNOLElBQUEsbUJBQU8sRUFBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUM7bUJBQzVCLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLEtBQUs7bUJBQ25CLElBQUEsbUJBQU8sRUFBQyxDQUFDLENBQUMsNkJBQTZCLEVBQUUsQ0FBQyxDQUFDLDZCQUE2QixDQUFDO21CQUN6RSxDQUFDLENBQUMsa0NBQWtDLEtBQUssQ0FBQyxDQUFDLGtDQUFrQzttQkFDN0UsQ0FBQyxDQUFDLE9BQU8sS0FBSyxDQUFDLENBQUMsT0FBTzttQkFDdkIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixDQUFDO21CQUMxRCxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJO21CQUNqQixDQUFDLENBQUMsZUFBZSxLQUFLLENBQUMsQ0FBQyxlQUFlO21CQUN2QyxDQUFDLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQyxRQUFRO21CQUN6QixDQUFDLENBQUMsY0FBYyxLQUFLLENBQUMsQ0FBQyxjQUFjO21CQUNyQyxDQUFDLENBQUMsV0FBVyxLQUFLLENBQUMsQ0FBQyxXQUFXO21CQUMvQixDQUFDLENBQUMsYUFBYSxLQUFLLENBQUMsQ0FBQyxhQUFhO21CQUNuQyxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsQ0FBQyxPQUFPO21CQUN2QixDQUFDLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQyxRQUFRO21CQUN6QixZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUN0RCxDQUFDO1FBQ0gsQ0FBQztLQUNEO0lBbERELHNEQWtEQztJQVNELElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEsc0JBQVU7UUFFekMsWUFDa0IsWUFBaUIsRUFDbUIsK0JBQWlFLEVBQzlFLGtCQUF1QyxFQUM5QyxXQUF5QixFQUMxQixVQUF1QjtZQUV2RCxLQUFLLEVBQUUsQ0FBQztZQU5TLGlCQUFZLEdBQVosWUFBWSxDQUFLO1lBQ21CLG9DQUErQixHQUEvQiwrQkFBK0IsQ0FBa0M7WUFDOUUsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUM5QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUMxQixlQUFVLEdBQVYsVUFBVSxDQUFhO1FBR3hELENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQTRCO1lBQ2hELE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5SCxJQUFJLFFBQVEsR0FBK0IsRUFBRSxDQUFDO1lBQzlDLElBQUksS0FBSyxDQUFDLGVBQWUsSUFBSSxLQUFLLENBQUMsSUFBSSwrQkFBdUIsRUFBRSxDQUFDO2dCQUNoRSxJQUFJLENBQUM7b0JBQ0osTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDbEYsUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzVCLENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2pDLENBQUM7WUFDRCxPQUFPLElBQUEscUJBQWEsRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsc0NBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3BILENBQUM7UUFFTyxLQUFLLENBQUMsMEJBQTBCLENBQUMsS0FBNEI7WUFDcEUsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDNUQsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUM7Z0JBQzVCLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUNELE1BQU0sVUFBVSxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FDbkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFDLENBQUMsRUFBQyxFQUFFO2dCQUMzQixJQUFJLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNwQixPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO2dCQUNELDBEQUEwRDtnQkFDMUQsSUFBSSxLQUFLLENBQUMsSUFBSSwrQkFBdUIsSUFBSSxJQUFBLG9CQUFRLEVBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDbEYsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztnQkFDRCxNQUFNLHFCQUFxQixHQUFHLElBQUkscUJBQXFCLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxLQUFLLENBQUMsa0NBQWtDLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDN1csT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDbEQsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLE9BQU8sSUFBQSxpQkFBUSxFQUFDLFVBQVUsQ0FBQztnQkFDMUIsK0dBQStHO2lCQUM5RyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFTyxLQUFLLENBQUMseUJBQXlCLENBQUMsS0FBNEI7WUFDbkUsSUFBSSxpQkFBaUIsR0FBRyxNQUFNLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN4RyxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLDZCQUE2QixDQUFDLEVBQUUsQ0FBQztnQkFDekksaUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLG1CQUFtQixDQUFDLENBQUM7Z0JBQ3BGLE1BQU0scUJBQXFCLEdBQUcsTUFBTSxJQUFJLENBQUMsaUNBQWlDLENBQUMsS0FBSyxDQUFDLDZCQUE2QixFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxTQUFTLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzVMLGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLHFCQUFxQixDQUFDLENBQUM7WUFDbEQsQ0FBQztZQUNELE9BQU8saUJBQWlCLENBQUM7UUFDMUIsQ0FBQztRQUVPLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxlQUFvQixFQUFFLE1BQTRELEVBQUUsS0FBNEI7WUFDL0osTUFBTSx3QkFBd0IsR0FBRyxNQUFNLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxxQkFBcUIsQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDN0ksSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN0QyxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFDRCxNQUFNLFVBQVUsR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQ25DLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUMsYUFBYSxFQUFDLEVBQUU7Z0JBQ2xELElBQUksTUFBTSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7b0JBQzNCLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxxQkFBcUIsQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxrQ0FBa0MsRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUN6WCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMscUJBQXFCLEVBQUUsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMxRSxDQUFDO2dCQUNELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLE9BQU8sSUFBQSxpQkFBUSxFQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFFRCxLQUFLLENBQUMsMkJBQTJCLENBQUMsS0FBNEI7WUFDN0QsSUFBSSxDQUFDO2dCQUNKLElBQUksTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFBLG9CQUFRLEVBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQzdFLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDbEQsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDckMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN6QyxDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxFQUFFLElBQUEsd0JBQWUsRUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUN0RyxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUE0QixFQUFFLFFBQW1CO1lBQ3BFLElBQUksQ0FBQztnQkFDSixJQUFJLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2hFLElBQUksUUFBUSxFQUFFLENBQUM7b0JBQ2QsOEZBQThGO29CQUM5RixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO3dCQUN6QixRQUFRLENBQUMsU0FBUyxHQUFHLGdDQUFtQixDQUFDO29CQUMxQyxDQUFDO29CQUNELFFBQVEsR0FBRyxRQUFRLElBQUksUUFBUSxDQUFDLFVBQVUsQ0FBQztvQkFDM0MsT0FBTyxRQUFRLENBQUMsVUFBVSxDQUFDO29CQUMzQixNQUFNLEVBQUUsR0FBRyxJQUFBLCtDQUFxQixFQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNwRSxNQUFNLFVBQVUsR0FBRyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO29CQUNyRSxNQUFNLElBQUksR0FBRyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsOEJBQXNCLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO29CQUNwRSxNQUFNLFNBQVMsR0FBRyxJQUFJLGlDQUF5QixJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDO29CQUN6RSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUscUJBQXFCLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDdkgsTUFBTSxTQUFTLEdBQUc7d0JBQ2pCLElBQUk7d0JBQ0osVUFBVTt3QkFDVixRQUFRO3dCQUNSLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUTt3QkFDeEIsU0FBUzt3QkFDVCxjQUFjLEVBQUUsUUFBUSxFQUFFLGNBQWMsOENBQTRCO3dCQUNwRSxRQUFRO3dCQUNSLE9BQU8sRUFBRSxJQUFJO3dCQUNiLFdBQVcsRUFBRSxFQUFFO3FCQUNmLENBQUM7b0JBQ0YsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUNyRSxDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1osSUFBSSxLQUFLLENBQUMsSUFBSSxpQ0FBeUIsRUFBRSxDQUFDO29CQUN6QyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUIsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxRQUFRLENBQUMsU0FBbUMsRUFBRSxLQUE0QjtZQUN6RSxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDbkIsTUFBTSxXQUFXLEdBQUcsSUFBQSw4Q0FBeUIsRUFBQyxLQUFLLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNoSixLQUFLLE1BQU0sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQy9DLElBQUksUUFBUSxLQUFLLGtCQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ2pDLE9BQU8sR0FBRyxLQUFLLENBQUM7b0JBQ2hCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNwRSxDQUFDO1lBQ0YsQ0FBQztZQUNELFNBQVMsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1lBQzVCLFNBQVMsQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1lBQ3BDLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxLQUFLLENBQUMscUJBQXFCLENBQUMsaUJBQXNCO1lBQ2pELE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSxvQkFBUSxFQUFDLGlCQUFpQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3JFLElBQUksT0FBTyxDQUFDO1lBQ1osSUFBSSxDQUFDO2dCQUNKLE9BQU8sR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNoRixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxJQUFBLDZCQUFxQixFQUFDLEtBQUssQ0FBQywrQ0FBdUMsRUFBRSxDQUFDO29CQUN6RSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGlCQUFpQixFQUFFLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSw0QkFBNEIsRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUosQ0FBQztnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxJQUFJLFFBQW1DLENBQUM7WUFDeEMsSUFBSSxDQUFDO2dCQUNKLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hDLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNkLHNDQUFzQztnQkFDdEMsTUFBTSxNQUFNLEdBQWlCLEVBQUUsQ0FBQztnQkFDaEMsSUFBQSxZQUFLLEVBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUN2QixLQUFLLE1BQU0sQ0FBQyxJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUN4QixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGlCQUFpQixFQUFFLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSxzQ0FBc0MsRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUEsd0NBQW9CLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMzTSxDQUFDO2dCQUNELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELElBQUksSUFBQSxrQkFBVyxFQUFDLFFBQVEsQ0FBQyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGlCQUFpQixFQUFFLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLGdEQUFnRCxFQUFFLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEssT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztRQUVPLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBc0IsRUFBRSxpQkFBcUMsRUFBRSxnQkFBa0M7WUFDaEksTUFBTSxpQkFBaUIsR0FBRyxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2xILElBQUksaUJBQWlCLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDO29CQUNKLE1BQU0sTUFBTSxHQUFpQixFQUFFLENBQUM7b0JBQ2hDLHdGQUF3RjtvQkFDeEYsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsNEJBQTRCLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUM1RixJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ3ZCLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTs0QkFDeEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSwyQkFBMkIsRUFBRSxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUEsd0NBQW9CLEVBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNuTSxDQUFDLENBQUMsQ0FBQzt3QkFDSCxPQUFPLGlCQUFpQixDQUFDO29CQUMxQixDQUFDO3lCQUFNLElBQUksSUFBQSxrQkFBVyxFQUFDLGlCQUFpQixDQUFDLEtBQUssUUFBUSxFQUFFLENBQUM7d0JBQ3hELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsaUJBQWlCLEVBQUUsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsMkNBQTJDLEVBQUUsaUJBQWlCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDMUssT0FBTyxpQkFBaUIsQ0FBQztvQkFDMUIsQ0FBQztvQkFDRCxNQUFNLFNBQVMsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDbEUsT0FBTyxJQUFBLCtCQUFnQixFQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNsRixDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7b0JBQ2hCLGdCQUFnQjtnQkFDakIsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLGlCQUFpQixDQUFDO1FBQzFCLENBQUM7UUFFTyxLQUFLLENBQUMsb0JBQW9CLENBQUMsaUJBQXNCLEVBQUUsaUJBQXFDLEVBQUUsZ0JBQWtDO1lBQ25JLE1BQU0saUJBQWlCLEdBQUcsSUFBQSxvQkFBUSxFQUFDLGlCQUFpQixFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFDMUUsTUFBTSxZQUFZLEdBQUcsQ0FBQyxTQUFxQixFQUFFLE1BQW9CLEVBQVEsRUFBRTtnQkFDMUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO29CQUN4QixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGlCQUFpQixFQUFFLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLDJCQUEyQixFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBQSx3Q0FBb0IsRUFBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25MLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDO1lBQ0YsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLFNBQXFCLEVBQVEsRUFBRTtnQkFDM0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSwyQ0FBMkMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNKLENBQUMsQ0FBQztZQUVGLE1BQU0sYUFBYSxHQUFHLEdBQUcsaUJBQWlCLENBQUMsU0FBUyxJQUFJLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2pGLE1BQU0sZUFBZSxHQUFHLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUVyRSxJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUM7b0JBQ0osTUFBTSxtQkFBbUIsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUN0RCxNQUFNLE9BQU8sR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDeEYsTUFBTSxNQUFNLEdBQWlCLEVBQUUsQ0FBQztvQkFDaEMsTUFBTSxpQkFBaUIsR0FBc0IsSUFBQSxZQUFLLEVBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUNwRSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ3ZCLFlBQVksQ0FBQyxtQkFBbUIsRUFBRSxNQUFNLENBQUMsQ0FBQzt3QkFDMUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLENBQUM7b0JBQzFELENBQUM7eUJBQU0sSUFBSSxJQUFBLGtCQUFXLEVBQUMsaUJBQWlCLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQzt3QkFDeEQsbUJBQW1CLENBQUMsbUJBQW1CLENBQUMsQ0FBQzt3QkFDekMsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLENBQUM7b0JBQzFELENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxNQUFNLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQzt3QkFDM0YsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLENBQUM7b0JBQ3ZELENBQUM7Z0JBQ0YsQ0FBQztnQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO29CQUNoQixPQUFPLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQztnQkFDMUQsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQ2hFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDYixPQUFPLFNBQVMsQ0FBQztnQkFDbEIsQ0FBQztnQkFDRCxJQUFJLGFBQWEsQ0FBQztnQkFDbEIsSUFBSSxDQUFDO29CQUNKLGFBQWEsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxpQkFBaUIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUNwRixDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7b0JBQ2hCLE9BQU8sU0FBUyxDQUFDO2dCQUNsQixDQUFDO2dCQUNELElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQzlCLE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxhQUFhLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQy9ELENBQUM7Z0JBQ0QsSUFBSSxDQUFDO29CQUNKLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDekcsTUFBTSxNQUFNLEdBQWlCLEVBQUUsQ0FBQztvQkFDaEMsTUFBTSxRQUFRLEdBQWUsSUFBQSxZQUFLLEVBQUMsb0JBQW9CLEVBQUUsTUFBTSxDQUFDLENBQUM7b0JBQ2pFLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQzt3QkFDdkIsWUFBWSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7d0JBQzlDLE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxhQUFhLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQy9ELENBQUM7eUJBQU0sSUFBSSxJQUFBLGtCQUFXLEVBQUMsUUFBUSxDQUFDLEtBQUssUUFBUSxFQUFFLENBQUM7d0JBQy9DLG1CQUFtQixDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQzt3QkFDN0MsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLGFBQWEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDL0QsQ0FBQztvQkFDRCxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUM5RCxDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7b0JBQ2hCLE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxhQUFhLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQy9ELENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVEOztXQUVHO1FBQ0ssS0FBSyxDQUFDLDRCQUE0QixDQUFDLHFCQUFpQyxFQUFFLE1BQW9CO1lBQ2pHLElBQUkscUJBQXFCLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDO29CQUNKLE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3hHLE9BQU8sSUFBQSxZQUFLLEVBQUMscUJBQXFCLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzdDLENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztvQkFDaEIsa0JBQWtCO2dCQUNuQixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU87UUFDUixDQUFDO1FBRUQ7OztXQUdHO1FBQ0ssa0JBQWtCLENBQUMsaUJBQXNCLEVBQUUsZ0JBQWtDO1lBQ3BGLE9BQU8sSUFBSSxPQUFPLENBQTJDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNyRSxNQUFNLElBQUksR0FBRyxDQUFDLE1BQWMsRUFBUSxFQUFFO29CQUNyQyxNQUFNLE9BQU8sR0FBRyxJQUFBLG9CQUFRLEVBQUMsaUJBQWlCLEVBQUUsZUFBZSxNQUFNLE9BQU8sQ0FBQyxDQUFDO29CQUMxRSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7d0JBQzlDLElBQUksTUFBTSxFQUFFLENBQUM7NEJBQ1osQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBQSxvQkFBUSxFQUFDLGlCQUFpQixFQUFFLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUN0RixDQUFDO3dCQUNELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ3RDLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQ2xCLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFBLG9CQUFRLEVBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQzt3QkFDbkYsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLE1BQU0sR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQzs0QkFDcEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUNkLENBQUM7b0JBQ0YsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osQ0FBQyxDQUFDO2dCQUNGLElBQUksZ0JBQWdCLENBQUMsT0FBTyxJQUFJLGdCQUFnQixDQUFDLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUN2RixPQUFPLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFBLG9CQUFRLEVBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDMUYsQ0FBQztnQkFDRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sYUFBYSxDQUFDLGlCQUFzQixFQUFFLE9BQWU7WUFDNUQsT0FBTyxJQUFJLGlCQUFpQixDQUFDLElBQUksTUFBTSxPQUFPLEVBQUUsQ0FBQztRQUNsRCxDQUFDO0tBRUQsQ0FBQTtJQS9TSyxpQkFBaUI7UUFJcEIsV0FBQSxrRUFBZ0MsQ0FBQTtRQUNoQyxXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsaUJBQVcsQ0FBQTtPQVBSLGlCQUFpQixDQStTdEI7SUFPRCxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLGlCQUFpQjtRQVF0RCxZQUNrQixjQUFnQyxFQUNqRCxZQUFpQixFQUNTLHVCQUFrRSxFQUMxRCwrQkFBaUUsRUFDOUUsa0JBQXVDLEVBQzlDLFdBQXlCLEVBQzFCLFVBQXVCO1lBRXBDLEtBQUssQ0FBQyxZQUFZLEVBQUUsK0JBQStCLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBUmpGLG1CQUFjLEdBQWQsY0FBYyxDQUFrQjtZQUVOLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFSNUUsNEJBQXVCLEdBQTJCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRTdGLHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2hFLHFCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7UUFZekQsQ0FBQztRQUVRLEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBNEI7WUFDekQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQyxNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMvRCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLGFBQWEsSUFBSSxhQUFhLENBQUMsS0FBSyxJQUFJLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMzRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQ3hGLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7Z0JBQ2pFLE9BQU8sYUFBYSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBRTtvQkFDN0Msb0JBQW9CO29CQUNwQixTQUFTLENBQUMsUUFBUSxHQUFHLFNBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUNwRCxPQUFPLFNBQVMsQ0FBQztnQkFDbEIsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1lBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2pELE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQzdELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVPLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxTQUFjO1lBQzlDLElBQUksQ0FBQztnQkFDSixNQUFNLGdCQUFnQixHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sa0JBQWtCLEdBQXdCLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQzlGLE9BQU8sRUFBRSxNQUFNLEVBQUUsa0JBQWtCLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFBLG9CQUFNLEVBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN2RixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsK0NBQStDLEVBQUUsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFBLHdCQUFlLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNoSCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRU8sS0FBSyxDQUFDLG1CQUFtQixDQUFDLFNBQWMsRUFBRSxhQUFrQztZQUNuRixJQUFJLENBQUM7Z0JBQ0osTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakcsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLCtDQUErQyxFQUFFLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBQSx3QkFBZSxFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDaEgsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsYUFBYTtZQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNqQixtRUFBbUU7Z0JBQ25FLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEQsTUFBTSxhQUFhLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDL0QsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNwQixxRUFBcUU7Z0JBQ3JFLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQztZQUNwQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEYsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUN0QywwREFBMEQ7Z0JBQzFELE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDO2dCQUNKLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDN0QsOEJBQThCO2dCQUM5QixNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN0QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDL0IsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzlCLENBQUM7UUFDRixDQUFDO1FBRU8sWUFBWSxDQUFDLEtBQTRCO1lBQ2hELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkMsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxJQUFJLGlDQUF5QixDQUFDLENBQUMsQ0FBQyx3Q0FBMkIsQ0FBQyxDQUFDLENBQUMscUNBQXdCLENBQUMsQ0FBQztRQUNqSyxDQUFDO1FBRU8sVUFBVSxDQUFDLEtBQTRCO1lBQzlDLElBQUksS0FBSyxDQUFDLElBQUksaUNBQXlCLEVBQUUsQ0FBQztnQkFDekMsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsY0FBYyxDQUFDO1lBQ3BELENBQUM7WUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwQixPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxjQUFjLENBQUM7WUFDcEQsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQztnQkFDcEcsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO1lBQzVCLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUM7UUFDN0osQ0FBQztLQUVELENBQUE7SUF6R0ssdUJBQXVCO1FBVzFCLFdBQUEsMENBQXdCLENBQUE7UUFDeEIsV0FBQSxrRUFBZ0MsQ0FBQTtRQUNoQyxXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsaUJBQVcsQ0FBQTtPQWZSLHVCQUF1QixDQXlHNUI7SUFFRCxTQUFnQixzQkFBc0IsQ0FBQyxTQUE0QixFQUFFLGtCQUEyQjtRQUMvRixNQUFNLEVBQUUsR0FBRyxJQUFBLHdDQUFjLEVBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqRixPQUFPO1lBQ04sRUFBRTtZQUNGLFVBQVUsRUFBRSxJQUFJLGdDQUFtQixDQUFDLEVBQUUsQ0FBQztZQUN2QyxTQUFTLEVBQUUsU0FBUyxDQUFDLElBQUksaUNBQXlCO1lBQ2xELGFBQWEsRUFBRSxTQUFTLENBQUMsSUFBSSwrQkFBdUIsSUFBSSxTQUFTLENBQUMsU0FBUztZQUMzRSxrQkFBa0I7WUFDbEIsaUJBQWlCLEVBQUUsU0FBUyxDQUFDLFFBQVE7WUFDckMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSTtZQUMvQixjQUFjLEVBQUUsU0FBUyxDQUFDLGNBQWM7WUFDeEMsR0FBRyxTQUFTLENBQUMsUUFBUTtTQUNyQixDQUFDO0lBQ0gsQ0FBQztJQUVELE1BQWEsOEJBQStCLFNBQVEsZ0NBQWdDO1FBSW5GLFlBQ0Msd0JBQTZCLEVBQzdCLHNCQUEyQixFQUMzQixRQUFhLEVBQ2IsY0FBZ0MsRUFDaEMsdUJBQWlELEVBQ2pELCtCQUFpRSxFQUNqRSxXQUF5QixFQUN6QixVQUF1QixFQUN2QixrQkFBdUMsRUFDdkMsY0FBK0IsRUFDL0Isa0JBQXVDLEVBQ3ZDLG9CQUEyQztZQUUzQyxLQUFLLENBQ0osd0JBQXdCLEVBQ3hCLHNCQUFzQixFQUN0QixJQUFBLG9CQUFRLEVBQUMsUUFBUSxFQUFFLGlCQUFpQixFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsRUFDbkUsY0FBYyxFQUNkLHVCQUF1QixFQUFFLCtCQUErQixFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFDbEssSUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ3RDLElBQUksUUFBUSxDQUFDLHNCQUFzQixFQUFFLENBQUM7b0JBQ3JDLElBQUksQ0FBQzt3QkFDSixNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQzt3QkFDM0YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFDN0MsQ0FBQztvQkFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQztnQkFDckMsQ0FBQztnQkFDRCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNOLENBQUM7UUFFUyxlQUFlLENBQUMsUUFBZ0I7WUFDekMsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUM7UUFDakMsQ0FBQztLQUVEO0lBdkNELHdFQXVDQyJ9