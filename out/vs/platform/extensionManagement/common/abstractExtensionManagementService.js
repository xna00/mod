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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, arrays_1, async_1, cancellation_1, errors_1, event_1, lifecycle_1, platform_1, types_1, uri_1, nls, extensionManagement_1, extensionManagementUtil_1, extensions_1, log_1, productService_1, telemetry_1, uriIdentity_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractExtensionTask = exports.AbstractExtensionManagementService = void 0;
    exports.joinErrors = joinErrors;
    exports.toExtensionManagementError = toExtensionManagementError;
    let AbstractExtensionManagementService = class AbstractExtensionManagementService extends lifecycle_1.Disposable {
        get onInstallExtension() { return this._onInstallExtension.event; }
        get onDidInstallExtensions() { return this._onDidInstallExtensions.event; }
        get onUninstallExtension() { return this._onUninstallExtension.event; }
        get onDidUninstallExtension() { return this._onDidUninstallExtension.event; }
        get onDidUpdateExtensionMetadata() { return this._onDidUpdateExtensionMetadata.event; }
        constructor(galleryService, telemetryService, uriIdentityService, logService, productService, userDataProfilesService) {
            super();
            this.galleryService = galleryService;
            this.telemetryService = telemetryService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this.productService = productService;
            this.userDataProfilesService = userDataProfilesService;
            this.lastReportTimestamp = 0;
            this.installingExtensions = new Map();
            this.uninstallingExtensions = new Map();
            this._onInstallExtension = this._register(new event_1.Emitter());
            this._onDidInstallExtensions = this._register(new event_1.Emitter());
            this._onUninstallExtension = this._register(new event_1.Emitter());
            this._onDidUninstallExtension = this._register(new event_1.Emitter());
            this._onDidUpdateExtensionMetadata = this._register(new event_1.Emitter());
            this.participants = [];
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.installingExtensions.forEach(({ task }) => task.cancel());
                this.uninstallingExtensions.forEach(promise => promise.cancel());
                this.installingExtensions.clear();
                this.uninstallingExtensions.clear();
            }));
        }
        async canInstall(extension) {
            const currentTargetPlatform = await this.getTargetPlatform();
            return extension.allTargetPlatforms.some(targetPlatform => (0, extensionManagement_1.isTargetPlatformCompatible)(targetPlatform, extension.allTargetPlatforms, currentTargetPlatform));
        }
        async installFromGallery(extension, options = {}) {
            try {
                const results = await this.installGalleryExtensions([{ extension, options }]);
                const result = results.find(({ identifier }) => (0, extensionManagementUtil_1.areSameExtensions)(identifier, extension.identifier));
                if (result?.local) {
                    return result?.local;
                }
                if (result?.error) {
                    throw result.error;
                }
                throw new extensionManagement_1.ExtensionManagementError(`Unknown error while installing extension ${extension.identifier.id}`, extensionManagement_1.ExtensionManagementErrorCode.Unknown);
            }
            catch (error) {
                throw toExtensionManagementError(error);
            }
        }
        async installGalleryExtensions(extensions) {
            if (!this.galleryService.isEnabled()) {
                throw new extensionManagement_1.ExtensionManagementError(nls.localize('MarketPlaceDisabled', "Marketplace is not enabled"), extensionManagement_1.ExtensionManagementErrorCode.NotAllowed);
            }
            const results = [];
            const installableExtensions = [];
            await Promise.allSettled(extensions.map(async ({ extension, options }) => {
                try {
                    const compatible = await this.checkAndGetCompatibleVersion(extension, !!options?.installGivenVersion, !!options?.installPreReleaseVersion, options.productVersion ?? { version: this.productService.version, date: this.productService.date });
                    installableExtensions.push({ ...compatible, options });
                }
                catch (error) {
                    results.push({ identifier: extension.identifier, operation: 2 /* InstallOperation.Install */, source: extension, error });
                }
            }));
            if (installableExtensions.length) {
                results.push(...await this.installExtensions(installableExtensions));
            }
            for (const result of results) {
                if (result.error) {
                    this.logService.error(`Failed to install extension.`, result.identifier.id);
                    this.logService.error(result.error);
                    if (result.source && !uri_1.URI.isUri(result.source)) {
                        reportTelemetry(this.telemetryService, 'extensionGallery:install', { extensionData: (0, extensionManagementUtil_1.getGalleryExtensionTelemetryData)(result.source), error: result.error });
                    }
                }
            }
            return results;
        }
        async uninstall(extension, options = {}) {
            this.logService.trace('ExtensionManagementService#uninstall', extension.identifier.id);
            return this.uninstallExtension(extension, options);
        }
        async toggleAppliationScope(extension, fromProfileLocation) {
            if ((0, extensions_1.isApplicationScopedExtension)(extension.manifest) || extension.isBuiltin) {
                return extension;
            }
            if (extension.isApplicationScoped) {
                let local = await this.updateMetadata(extension, { isApplicationScoped: false }, this.userDataProfilesService.defaultProfile.extensionsResource);
                if (!this.uriIdentityService.extUri.isEqual(fromProfileLocation, this.userDataProfilesService.defaultProfile.extensionsResource)) {
                    local = await this.copyExtension(extension, this.userDataProfilesService.defaultProfile.extensionsResource, fromProfileLocation);
                }
                for (const profile of this.userDataProfilesService.profiles) {
                    const existing = (await this.getInstalled(1 /* ExtensionType.User */, profile.extensionsResource))
                        .find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier));
                    if (existing) {
                        this._onDidUpdateExtensionMetadata.fire(existing);
                    }
                    else {
                        this._onDidUninstallExtension.fire({ identifier: extension.identifier, profileLocation: profile.extensionsResource });
                    }
                }
                return local;
            }
            else {
                const local = this.uriIdentityService.extUri.isEqual(fromProfileLocation, this.userDataProfilesService.defaultProfile.extensionsResource)
                    ? await this.updateMetadata(extension, { isApplicationScoped: true }, this.userDataProfilesService.defaultProfile.extensionsResource)
                    : await this.copyExtension(extension, fromProfileLocation, this.userDataProfilesService.defaultProfile.extensionsResource, { isApplicationScoped: true });
                this._onDidInstallExtensions.fire([{ identifier: local.identifier, operation: 2 /* InstallOperation.Install */, local, profileLocation: this.userDataProfilesService.defaultProfile.extensionsResource, applicationScoped: true }]);
                return local;
            }
        }
        getExtensionsControlManifest() {
            const now = new Date().getTime();
            if (!this.extensionsControlManifest || now - this.lastReportTimestamp > 1000 * 60 * 5) { // 5 minute cache freshness
                this.extensionsControlManifest = this.updateControlCache();
                this.lastReportTimestamp = now;
            }
            return this.extensionsControlManifest;
        }
        registerParticipant(participant) {
            this.participants.push(participant);
        }
        async installExtensions(extensions) {
            const results = [];
            const installingExtensionsMap = new Map();
            const alreadyRequestedInstallations = [];
            const successResults = [];
            const getInstallExtensionTaskKey = (extension, profileLocation) => `${extensionManagementUtil_1.ExtensionKey.create(extension).toString()}-${profileLocation.toString()}`;
            const createInstallExtensionTask = (manifest, extension, options) => {
                const installExtensionTask = this.createInstallExtensionTask(manifest, extension, options);
                const key = uri_1.URI.isUri(extension) ? extension.path : `${extension.identifier.id.toLowerCase()}-${options.profileLocation.toString()}`;
                installingExtensionsMap.set(key, { task: installExtensionTask, manifest });
                this._onInstallExtension.fire({ identifier: installExtensionTask.identifier, source: extension, profileLocation: options.profileLocation });
                this.logService.info('Installing extension:', installExtensionTask.identifier.id);
                // only cache gallery extensions tasks
                if (!uri_1.URI.isUri(extension)) {
                    this.installingExtensions.set(getInstallExtensionTaskKey(extension, options.profileLocation), { task: installExtensionTask, waitingTasks: [] });
                }
            };
            try {
                // Start installing extensions
                for (const { manifest, extension, options } of extensions) {
                    const isApplicationScoped = options.isApplicationScoped || options.isBuiltin || (0, extensions_1.isApplicationScopedExtension)(manifest);
                    const installExtensionTaskOptions = {
                        ...options,
                        installOnlyNewlyAddedFromExtensionPack: options.installOnlyNewlyAddedFromExtensionPack ?? !uri_1.URI.isUri(extension) /* always true for gallery extensions */,
                        isApplicationScoped,
                        profileLocation: isApplicationScoped ? this.userDataProfilesService.defaultProfile.extensionsResource : options.profileLocation ?? this.getCurrentExtensionsManifestLocation(),
                        productVersion: options.productVersion ?? { version: this.productService.version, date: this.productService.date }
                    };
                    const existingInstallExtensionTask = !uri_1.URI.isUri(extension) ? this.installingExtensions.get(getInstallExtensionTaskKey(extension, installExtensionTaskOptions.profileLocation)) : undefined;
                    if (existingInstallExtensionTask) {
                        this.logService.info('Extension is already requested to install', existingInstallExtensionTask.task.identifier.id);
                        alreadyRequestedInstallations.push(existingInstallExtensionTask.task.waitUntilTaskIsFinished());
                    }
                    else {
                        createInstallExtensionTask(manifest, extension, installExtensionTaskOptions);
                    }
                }
                // collect and start installing all dependencies and pack extensions
                await Promise.all([...installingExtensionsMap.values()].map(async ({ task, manifest }) => {
                    if (task.options.donotIncludePackAndDependencies) {
                        this.logService.info('Installing the extension without checking dependencies and pack', task.identifier.id);
                    }
                    else {
                        try {
                            const allDepsAndPackExtensionsToInstall = await this.getAllDepsAndPackExtensions(task.identifier, manifest, !!task.options.installOnlyNewlyAddedFromExtensionPack, !!task.options.installPreReleaseVersion, task.options.profileLocation, task.options.productVersion);
                            const installed = await this.getInstalled(undefined, task.options.profileLocation, task.options.productVersion);
                            const options = { ...task.options, donotIncludePackAndDependencies: true, context: { ...task.options.context, [extensionManagement_1.EXTENSION_INSTALL_DEP_PACK_CONTEXT]: true } };
                            for (const { gallery, manifest } of (0, arrays_1.distinct)(allDepsAndPackExtensionsToInstall, ({ gallery }) => gallery.identifier.id)) {
                                if (installingExtensionsMap.has(`${gallery.identifier.id.toLowerCase()}-${options.profileLocation.toString()}`)) {
                                    continue;
                                }
                                const existingInstallingExtension = this.installingExtensions.get(getInstallExtensionTaskKey(gallery, options.profileLocation));
                                if (existingInstallingExtension) {
                                    if (this.canWaitForTask(task, existingInstallingExtension.task)) {
                                        const identifier = existingInstallingExtension.task.identifier;
                                        this.logService.info('Waiting for already requested installing extension', identifier.id, task.identifier.id);
                                        existingInstallingExtension.waitingTasks.push(task);
                                        // add promise that waits until the extension is completely installed, ie., onDidInstallExtensions event is triggered for this extension
                                        alreadyRequestedInstallations.push(event_1.Event.toPromise(event_1.Event.filter(this.onDidInstallExtensions, results => results.some(result => (0, extensionManagementUtil_1.areSameExtensions)(result.identifier, identifier)))).then(results => {
                                            this.logService.info('Finished waiting for already requested installing extension', identifier.id, task.identifier.id);
                                            const result = results.find(result => (0, extensionManagementUtil_1.areSameExtensions)(result.identifier, identifier));
                                            if (!result?.local) {
                                                // Extension failed to install
                                                throw new Error(`Extension ${identifier.id} is not installed`);
                                            }
                                        }));
                                    }
                                }
                                else if (!installed.some(({ identifier }) => (0, extensionManagementUtil_1.areSameExtensions)(identifier, gallery.identifier))) {
                                    createInstallExtensionTask(manifest, gallery, options);
                                }
                            }
                        }
                        catch (error) {
                            // Installing through VSIX
                            if (uri_1.URI.isUri(task.source)) {
                                // Ignore installing dependencies and packs
                                if ((0, arrays_1.isNonEmptyArray)(manifest.extensionDependencies)) {
                                    this.logService.warn(`Cannot install dependencies of extension:`, task.identifier.id, error.message);
                                }
                                if ((0, arrays_1.isNonEmptyArray)(manifest.extensionPack)) {
                                    this.logService.warn(`Cannot install packed extensions of extension:`, task.identifier.id, error.message);
                                }
                            }
                            else {
                                this.logService.error('Error while preparing to install dependencies and extension packs of the extension:', task.identifier.id);
                                throw error;
                            }
                        }
                    }
                }));
                // Install extensions in parallel and wait until all extensions are installed / failed
                await this.joinAllSettled([...installingExtensionsMap.values()].map(async ({ task }) => {
                    const startTime = new Date().getTime();
                    try {
                        const local = await task.run();
                        await this.joinAllSettled(this.participants.map(participant => participant.postInstall(local, task.source, task.options, cancellation_1.CancellationToken.None)));
                        if (!uri_1.URI.isUri(task.source)) {
                            const isUpdate = task.operation === 3 /* InstallOperation.Update */;
                            const durationSinceUpdate = isUpdate ? undefined : (new Date().getTime() - task.source.lastUpdated) / 1000;
                            reportTelemetry(this.telemetryService, isUpdate ? 'extensionGallery:update' : 'extensionGallery:install', {
                                extensionData: (0, extensionManagementUtil_1.getGalleryExtensionTelemetryData)(task.source),
                                verificationStatus: task.verificationStatus,
                                duration: new Date().getTime() - startTime,
                                durationSinceUpdate
                            });
                            // In web, report extension install statistics explicitly. In Desktop, statistics are automatically updated while downloading the VSIX.
                            if (platform_1.isWeb && task.operation !== 3 /* InstallOperation.Update */) {
                                try {
                                    await this.galleryService.reportStatistic(local.manifest.publisher, local.manifest.name, local.manifest.version, "install" /* StatisticType.Install */);
                                }
                                catch (error) { /* ignore */ }
                            }
                        }
                        successResults.push({ local, identifier: task.identifier, operation: task.operation, source: task.source, context: task.options.context, profileLocation: task.profileLocation, applicationScoped: local.isApplicationScoped });
                    }
                    catch (error) {
                        this.logService.error('Error while installing the extension', task.identifier.id, (0, errors_1.getErrorMessage)(error));
                        throw error;
                    }
                }));
                if (alreadyRequestedInstallations.length) {
                    await this.joinAllSettled(alreadyRequestedInstallations);
                }
                for (const result of successResults) {
                    this.logService.info(`Extension installed successfully:`, result.identifier.id);
                    results.push(result);
                }
                return results;
            }
            catch (error) {
                // rollback installed extensions
                if (successResults.length) {
                    this.logService.info('Rollback: Uninstalling installed extensions', (0, errors_1.getErrorMessage)(error));
                    await Promise.allSettled(successResults.map(async ({ local, profileLocation }) => {
                        try {
                            await this.createUninstallExtensionTask(local, { versionOnly: true, profileLocation }).run();
                            this.logService.info('Rollback: Uninstalled extension', local.identifier.id);
                        }
                        catch (error) {
                            this.logService.warn('Rollback: Error while uninstalling extension', local.identifier.id, (0, errors_1.getErrorMessage)(error));
                        }
                    }));
                }
                // cancel all tasks and collect error results
                for (const { task } of installingExtensionsMap.values()) {
                    task.cancel();
                    results.push({ identifier: task.identifier, operation: 2 /* InstallOperation.Install */, source: task.source, context: task.options.context, profileLocation: task.profileLocation, error });
                }
                throw error;
            }
            finally {
                // Finally, remove all the tasks from the cache
                for (const { task } of installingExtensionsMap.values()) {
                    if (task.source && !uri_1.URI.isUri(task.source)) {
                        this.installingExtensions.delete(getInstallExtensionTaskKey(task.source, task.profileLocation));
                    }
                }
                if (results.length) {
                    this._onDidInstallExtensions.fire(results);
                }
            }
        }
        canWaitForTask(taskToWait, taskToWaitFor) {
            for (const [, { task, waitingTasks }] of this.installingExtensions.entries()) {
                if (task === taskToWait) {
                    // Cannot be waited, If taskToWaitFor is waiting for taskToWait
                    if (waitingTasks.includes(taskToWaitFor)) {
                        return false;
                    }
                    // Cannot be waited, If taskToWaitFor is waiting for tasks waiting for taskToWait
                    if (waitingTasks.some(waitingTask => this.canWaitForTask(waitingTask, taskToWaitFor))) {
                        return false;
                    }
                }
                // Cannot be waited, if the taskToWait cannot be waited for the task created the taskToWaitFor
                // Because, the task waits for the tasks it created
                if (task === taskToWaitFor && waitingTasks[0] && !this.canWaitForTask(taskToWait, waitingTasks[0])) {
                    return false;
                }
            }
            return true;
        }
        async joinAllSettled(promises) {
            const results = [];
            const errors = [];
            const promiseResults = await Promise.allSettled(promises);
            for (const r of promiseResults) {
                if (r.status === 'fulfilled') {
                    results.push(r.value);
                }
                else {
                    errors.push(r.reason);
                }
            }
            // If there are errors, throw the error.
            if (errors.length) {
                throw joinErrors(errors);
            }
            return results;
        }
        async getAllDepsAndPackExtensions(extensionIdentifier, manifest, getOnlyNewlyAddedFromExtensionPack, installPreRelease, profile, productVersion) {
            if (!this.galleryService.isEnabled()) {
                return [];
            }
            const installed = await this.getInstalled(undefined, profile, productVersion);
            const knownIdentifiers = [];
            const allDependenciesAndPacks = [];
            const collectDependenciesAndPackExtensionsToInstall = async (extensionIdentifier, manifest) => {
                knownIdentifiers.push(extensionIdentifier);
                const dependecies = manifest.extensionDependencies || [];
                const dependenciesAndPackExtensions = [...dependecies];
                if (manifest.extensionPack) {
                    const existing = getOnlyNewlyAddedFromExtensionPack ? installed.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extensionIdentifier)) : undefined;
                    for (const extension of manifest.extensionPack) {
                        // add only those extensions which are new in currently installed extension
                        if (!(existing && existing.manifest.extensionPack && existing.manifest.extensionPack.some(old => (0, extensionManagementUtil_1.areSameExtensions)({ id: old }, { id: extension })))) {
                            if (dependenciesAndPackExtensions.every(e => !(0, extensionManagementUtil_1.areSameExtensions)({ id: e }, { id: extension }))) {
                                dependenciesAndPackExtensions.push(extension);
                            }
                        }
                    }
                }
                if (dependenciesAndPackExtensions.length) {
                    // filter out known extensions
                    const ids = dependenciesAndPackExtensions.filter(id => knownIdentifiers.every(galleryIdentifier => !(0, extensionManagementUtil_1.areSameExtensions)(galleryIdentifier, { id })));
                    if (ids.length) {
                        const galleryExtensions = await this.galleryService.getExtensions(ids.map(id => ({ id, preRelease: installPreRelease })), cancellation_1.CancellationToken.None);
                        for (const galleryExtension of galleryExtensions) {
                            if (knownIdentifiers.find(identifier => (0, extensionManagementUtil_1.areSameExtensions)(identifier, galleryExtension.identifier))) {
                                continue;
                            }
                            const isDependency = dependecies.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, galleryExtension.identifier));
                            let compatible;
                            try {
                                compatible = await this.checkAndGetCompatibleVersion(galleryExtension, false, installPreRelease, productVersion);
                            }
                            catch (error) {
                                if (!isDependency) {
                                    this.logService.info('Skipping the packed extension as it cannot be installed', galleryExtension.identifier.id, (0, errors_1.getErrorMessage)(error));
                                    continue;
                                }
                                else {
                                    throw error;
                                }
                            }
                            allDependenciesAndPacks.push({ gallery: compatible.extension, manifest: compatible.manifest });
                            await collectDependenciesAndPackExtensionsToInstall(compatible.extension.identifier, compatible.manifest);
                        }
                    }
                }
            };
            await collectDependenciesAndPackExtensionsToInstall(extensionIdentifier, manifest);
            return allDependenciesAndPacks;
        }
        async checkAndGetCompatibleVersion(extension, sameVersion, installPreRelease, productVersion) {
            let compatibleExtension;
            const extensionsControlManifest = await this.getExtensionsControlManifest();
            if (extensionsControlManifest.malicious.some(identifier => (0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, identifier))) {
                throw new extensionManagement_1.ExtensionManagementError(nls.localize('malicious extension', "Can't install '{0}' extension since it was reported to be problematic.", extension.identifier.id), extensionManagement_1.ExtensionManagementErrorCode.Malicious);
            }
            const deprecationInfo = extensionsControlManifest.deprecated[extension.identifier.id.toLowerCase()];
            if (deprecationInfo?.extension?.autoMigrate) {
                this.logService.info(`The '${extension.identifier.id}' extension is deprecated, fetching the compatible '${deprecationInfo.extension.id}' extension instead.`);
                compatibleExtension = (await this.galleryService.getExtensions([{ id: deprecationInfo.extension.id, preRelease: deprecationInfo.extension.preRelease }], { targetPlatform: await this.getTargetPlatform(), compatible: true, productVersion }, cancellation_1.CancellationToken.None))[0];
                if (!compatibleExtension) {
                    throw new extensionManagement_1.ExtensionManagementError(nls.localize('notFoundDeprecatedReplacementExtension', "Can't install '{0}' extension since it was deprecated and the replacement extension '{1}' can't be found.", extension.identifier.id, deprecationInfo.extension.id), extensionManagement_1.ExtensionManagementErrorCode.Deprecated);
                }
            }
            else {
                if (!await this.canInstall(extension)) {
                    const targetPlatform = await this.getTargetPlatform();
                    throw new extensionManagement_1.ExtensionManagementError(nls.localize('incompatible platform', "The '{0}' extension is not available in {1} for {2}.", extension.identifier.id, this.productService.nameLong, (0, extensionManagement_1.TargetPlatformToString)(targetPlatform)), extensionManagement_1.ExtensionManagementErrorCode.IncompatibleTargetPlatform);
                }
                compatibleExtension = await this.getCompatibleVersion(extension, sameVersion, installPreRelease, productVersion);
                if (!compatibleExtension) {
                    /** If no compatible release version is found, check if the extension has a release version or not and throw relevant error */
                    if (!installPreRelease && extension.properties.isPreReleaseVersion && (await this.galleryService.getExtensions([extension.identifier], cancellation_1.CancellationToken.None))[0]) {
                        throw new extensionManagement_1.ExtensionManagementError(nls.localize('notFoundReleaseExtension', "Can't install release version of '{0}' extension because it has no release version.", extension.displayName ?? extension.identifier.id), extensionManagement_1.ExtensionManagementErrorCode.ReleaseVersionNotFound);
                    }
                    throw new extensionManagement_1.ExtensionManagementError(nls.localize('notFoundCompatibleDependency', "Can't install '{0}' extension because it is not compatible with the current version of {1} (version {2}).", extension.identifier.id, this.productService.nameLong, this.productService.version), extensionManagement_1.ExtensionManagementErrorCode.Incompatible);
                }
            }
            this.logService.info('Getting Manifest...', compatibleExtension.identifier.id);
            const manifest = await this.galleryService.getManifest(compatibleExtension, cancellation_1.CancellationToken.None);
            if (manifest === null) {
                throw new extensionManagement_1.ExtensionManagementError(`Missing manifest for extension ${compatibleExtension.identifier.id}`, extensionManagement_1.ExtensionManagementErrorCode.Invalid);
            }
            if (manifest.version !== compatibleExtension.version) {
                throw new extensionManagement_1.ExtensionManagementError(`Cannot install '${compatibleExtension.identifier.id}' extension because of version mismatch in Marketplace`, extensionManagement_1.ExtensionManagementErrorCode.Invalid);
            }
            return { extension: compatibleExtension, manifest };
        }
        async getCompatibleVersion(extension, sameVersion, includePreRelease, productVersion) {
            const targetPlatform = await this.getTargetPlatform();
            let compatibleExtension = null;
            if (!sameVersion && extension.hasPreReleaseVersion && extension.properties.isPreReleaseVersion !== includePreRelease) {
                compatibleExtension = (await this.galleryService.getExtensions([{ ...extension.identifier, preRelease: includePreRelease }], { targetPlatform, compatible: true, productVersion }, cancellation_1.CancellationToken.None))[0] || null;
            }
            if (!compatibleExtension && await this.galleryService.isExtensionCompatible(extension, includePreRelease, targetPlatform, productVersion)) {
                compatibleExtension = extension;
            }
            if (!compatibleExtension) {
                if (sameVersion) {
                    compatibleExtension = (await this.galleryService.getExtensions([{ ...extension.identifier, version: extension.version }], { targetPlatform, compatible: true, productVersion }, cancellation_1.CancellationToken.None))[0] || null;
                }
                else {
                    compatibleExtension = await this.galleryService.getCompatibleExtension(extension, includePreRelease, targetPlatform, productVersion);
                }
            }
            return compatibleExtension;
        }
        async uninstallExtension(extension, options) {
            const uninstallOptions = {
                ...options,
                profileLocation: extension.isApplicationScoped ? this.userDataProfilesService.defaultProfile.extensionsResource : options.profileLocation ?? this.getCurrentExtensionsManifestLocation()
            };
            const getUninstallExtensionTaskKey = (identifier) => `${identifier.id.toLowerCase()}${uninstallOptions.versionOnly ? `-${extension.manifest.version}` : ''}${uninstallOptions.profileLocation ? `@${uninstallOptions.profileLocation.toString()}` : ''}`;
            const uninstallExtensionTask = this.uninstallingExtensions.get(getUninstallExtensionTaskKey(extension.identifier));
            if (uninstallExtensionTask) {
                this.logService.info('Extensions is already requested to uninstall', extension.identifier.id);
                return uninstallExtensionTask.waitUntilTaskIsFinished();
            }
            const createUninstallExtensionTask = (extension) => {
                const uninstallExtensionTask = this.createUninstallExtensionTask(extension, uninstallOptions);
                this.uninstallingExtensions.set(getUninstallExtensionTaskKey(uninstallExtensionTask.extension.identifier), uninstallExtensionTask);
                if (uninstallOptions.profileLocation) {
                    this.logService.info('Uninstalling extension from the profile:', `${extension.identifier.id}@${extension.manifest.version}`, uninstallOptions.profileLocation.toString());
                }
                else {
                    this.logService.info('Uninstalling extension:', `${extension.identifier.id}@${extension.manifest.version}`);
                }
                this._onUninstallExtension.fire({ identifier: extension.identifier, profileLocation: uninstallOptions.profileLocation, applicationScoped: extension.isApplicationScoped });
                return uninstallExtensionTask;
            };
            const postUninstallExtension = (extension, error) => {
                if (error) {
                    if (uninstallOptions.profileLocation) {
                        this.logService.error('Failed to uninstall extension from the profile:', `${extension.identifier.id}@${extension.manifest.version}`, uninstallOptions.profileLocation.toString(), error.message);
                    }
                    else {
                        this.logService.error('Failed to uninstall extension:', `${extension.identifier.id}@${extension.manifest.version}`, error.message);
                    }
                }
                else {
                    if (uninstallOptions.profileLocation) {
                        this.logService.info('Successfully uninstalled extension from the profile', `${extension.identifier.id}@${extension.manifest.version}`, uninstallOptions.profileLocation.toString());
                    }
                    else {
                        this.logService.info('Successfully uninstalled extension:', `${extension.identifier.id}@${extension.manifest.version}`);
                    }
                }
                reportTelemetry(this.telemetryService, 'extensionGallery:uninstall', { extensionData: (0, extensionManagementUtil_1.getLocalExtensionTelemetryData)(extension), error });
                this._onDidUninstallExtension.fire({ identifier: extension.identifier, error: error?.code, profileLocation: uninstallOptions.profileLocation, applicationScoped: extension.isApplicationScoped });
            };
            const allTasks = [];
            const processedTasks = [];
            try {
                allTasks.push(createUninstallExtensionTask(extension));
                const installed = await this.getInstalled(1 /* ExtensionType.User */, uninstallOptions.profileLocation);
                if (uninstallOptions.donotIncludePack) {
                    this.logService.info('Uninstalling the extension without including packed extension', `${extension.identifier.id}@${extension.manifest.version}`);
                }
                else {
                    const packedExtensions = this.getAllPackExtensionsToUninstall(extension, installed);
                    for (const packedExtension of packedExtensions) {
                        if (this.uninstallingExtensions.has(getUninstallExtensionTaskKey(packedExtension.identifier))) {
                            this.logService.info('Extensions is already requested to uninstall', packedExtension.identifier.id);
                        }
                        else {
                            allTasks.push(createUninstallExtensionTask(packedExtension));
                        }
                    }
                }
                if (uninstallOptions.donotCheckDependents) {
                    this.logService.info('Uninstalling the extension without checking dependents', `${extension.identifier.id}@${extension.manifest.version}`);
                }
                else {
                    this.checkForDependents(allTasks.map(task => task.extension), installed, extension);
                }
                // Uninstall extensions in parallel and wait until all extensions are uninstalled / failed
                await this.joinAllSettled(allTasks.map(async (task) => {
                    try {
                        await task.run();
                        await this.joinAllSettled(this.participants.map(participant => participant.postUninstall(task.extension, uninstallOptions, cancellation_1.CancellationToken.None)));
                        // only report if extension has a mapped gallery extension. UUID identifies the gallery extension.
                        if (task.extension.identifier.uuid) {
                            try {
                                await this.galleryService.reportStatistic(task.extension.manifest.publisher, task.extension.manifest.name, task.extension.manifest.version, "uninstall" /* StatisticType.Uninstall */);
                            }
                            catch (error) { /* ignore */ }
                        }
                        postUninstallExtension(task.extension);
                    }
                    catch (e) {
                        const error = e instanceof extensionManagement_1.ExtensionManagementError ? e : new extensionManagement_1.ExtensionManagementError((0, errors_1.getErrorMessage)(e), extensionManagement_1.ExtensionManagementErrorCode.Internal);
                        postUninstallExtension(task.extension, error);
                        throw error;
                    }
                    finally {
                        processedTasks.push(task);
                    }
                }));
            }
            catch (e) {
                const error = e instanceof extensionManagement_1.ExtensionManagementError ? e : new extensionManagement_1.ExtensionManagementError((0, errors_1.getErrorMessage)(e), extensionManagement_1.ExtensionManagementErrorCode.Internal);
                for (const task of allTasks) {
                    // cancel the tasks
                    try {
                        task.cancel();
                    }
                    catch (error) { /* ignore */ }
                    if (!processedTasks.includes(task)) {
                        postUninstallExtension(task.extension, error);
                    }
                }
                throw error;
            }
            finally {
                // Remove tasks from cache
                for (const task of allTasks) {
                    if (!this.uninstallingExtensions.delete(getUninstallExtensionTaskKey(task.extension.identifier))) {
                        this.logService.warn('Uninstallation task is not found in the cache', task.extension.identifier.id);
                    }
                }
            }
        }
        checkForDependents(extensionsToUninstall, installed, extensionToUninstall) {
            for (const extension of extensionsToUninstall) {
                const dependents = this.getDependents(extension, installed);
                if (dependents.length) {
                    const remainingDependents = dependents.filter(dependent => !extensionsToUninstall.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, dependent.identifier)));
                    if (remainingDependents.length) {
                        throw new Error(this.getDependentsErrorMessage(extension, remainingDependents, extensionToUninstall));
                    }
                }
            }
        }
        getDependentsErrorMessage(dependingExtension, dependents, extensionToUninstall) {
            if (extensionToUninstall === dependingExtension) {
                if (dependents.length === 1) {
                    return nls.localize('singleDependentError', "Cannot uninstall '{0}' extension. '{1}' extension depends on this.", extensionToUninstall.manifest.displayName || extensionToUninstall.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name);
                }
                if (dependents.length === 2) {
                    return nls.localize('twoDependentsError', "Cannot uninstall '{0}' extension. '{1}' and '{2}' extensions depend on this.", extensionToUninstall.manifest.displayName || extensionToUninstall.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
                }
                return nls.localize('multipleDependentsError', "Cannot uninstall '{0}' extension. '{1}', '{2}' and other extension depend on this.", extensionToUninstall.manifest.displayName || extensionToUninstall.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
            }
            if (dependents.length === 1) {
                return nls.localize('singleIndirectDependentError', "Cannot uninstall '{0}' extension . It includes uninstalling '{1}' extension and '{2}' extension depends on this.", extensionToUninstall.manifest.displayName || extensionToUninstall.manifest.name, dependingExtension.manifest.displayName
                    || dependingExtension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name);
            }
            if (dependents.length === 2) {
                return nls.localize('twoIndirectDependentsError', "Cannot uninstall '{0}' extension. It includes uninstalling '{1}' extension and '{2}' and '{3}' extensions depend on this.", extensionToUninstall.manifest.displayName || extensionToUninstall.manifest.name, dependingExtension.manifest.displayName
                    || dependingExtension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
            }
            return nls.localize('multipleIndirectDependentsError', "Cannot uninstall '{0}' extension. It includes uninstalling '{1}' extension and '{2}', '{3}' and other extensions depend on this.", extensionToUninstall.manifest.displayName || extensionToUninstall.manifest.name, dependingExtension.manifest.displayName
                || dependingExtension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
        }
        getAllPackExtensionsToUninstall(extension, installed, checked = []) {
            if (checked.indexOf(extension) !== -1) {
                return [];
            }
            checked.push(extension);
            const extensionsPack = extension.manifest.extensionPack ? extension.manifest.extensionPack : [];
            if (extensionsPack.length) {
                const packedExtensions = installed.filter(i => !i.isBuiltin && extensionsPack.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, i.identifier)));
                const packOfPackedExtensions = [];
                for (const packedExtension of packedExtensions) {
                    packOfPackedExtensions.push(...this.getAllPackExtensionsToUninstall(packedExtension, installed, checked));
                }
                return [...packedExtensions, ...packOfPackedExtensions];
            }
            return [];
        }
        getDependents(extension, installed) {
            return installed.filter(e => e.manifest.extensionDependencies && e.manifest.extensionDependencies.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, extension.identifier)));
        }
        async updateControlCache() {
            try {
                this.logService.trace('ExtensionManagementService.updateControlCache');
                return await this.galleryService.getExtensionsControlManifest();
            }
            catch (err) {
                this.logService.trace('ExtensionManagementService.refreshControlCache - failed to get extension control manifest', (0, errors_1.getErrorMessage)(err));
                return { malicious: [], deprecated: {}, search: [] };
            }
        }
    };
    exports.AbstractExtensionManagementService = AbstractExtensionManagementService;
    exports.AbstractExtensionManagementService = AbstractExtensionManagementService = __decorate([
        __param(0, extensionManagement_1.IExtensionGalleryService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, log_1.ILogService),
        __param(4, productService_1.IProductService),
        __param(5, userDataProfile_1.IUserDataProfilesService)
    ], AbstractExtensionManagementService);
    function joinErrors(errorOrErrors) {
        const errors = Array.isArray(errorOrErrors) ? errorOrErrors : [errorOrErrors];
        if (errors.length === 1) {
            return errors[0] instanceof Error ? errors[0] : new Error(errors[0]);
        }
        return errors.reduce((previousValue, currentValue) => {
            return new Error(`${previousValue.message}${previousValue.message ? ',' : ''}${currentValue instanceof Error ? currentValue.message : currentValue}`);
        }, new Error(''));
    }
    function toExtensionManagementError(error) {
        if (error instanceof extensionManagement_1.ExtensionManagementError) {
            return error;
        }
        if (error instanceof extensionManagement_1.ExtensionGalleryError) {
            const e = new extensionManagement_1.ExtensionManagementError(error.message, extensionManagement_1.ExtensionManagementErrorCode.Gallery);
            e.stack = error.stack;
            return e;
        }
        const e = new extensionManagement_1.ExtensionManagementError(error.message, extensionManagement_1.ExtensionManagementErrorCode.Internal);
        e.stack = error.stack;
        return e;
    }
    function reportTelemetry(telemetryService, eventName, { extensionData, verificationStatus, duration, error, durationSinceUpdate }) {
        let errorcode;
        let errorcodeDetail;
        if ((0, types_1.isDefined)(verificationStatus)) {
            if (verificationStatus === true) {
                verificationStatus = 'Verified';
            }
            else if (verificationStatus === false) {
                verificationStatus = 'Unverified';
            }
            else {
                errorcode = extensionManagement_1.ExtensionManagementErrorCode.Signature;
                errorcodeDetail = verificationStatus;
                verificationStatus = 'Unverified';
            }
        }
        if (error) {
            if (error instanceof extensionManagement_1.ExtensionManagementError || error instanceof extensionManagement_1.ExtensionGalleryError) {
                errorcode = error.code;
                if (error.code === extensionManagement_1.ExtensionManagementErrorCode.Signature) {
                    errorcodeDetail = error.message;
                }
            }
            else {
                errorcode = extensionManagement_1.ExtensionManagementErrorCode.Internal;
            }
        }
        /* __GDPR__
            "extensionGallery:install" : {
                "owner": "sandy081",
                "success": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                "durationSinceUpdate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "errorcode": { "classification": "CallstackOrException", "purpose": "PerformanceAndHealth" },
                "errorcodeDetail": { "classification": "CallstackOrException", "purpose": "PerformanceAndHealth" },
                "recommendationReason": { "retiredFromVersion": "1.23.0", "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "verificationStatus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                "${include}": [
                    "${GalleryExtensionTelemetryData}"
                ]
            }
        */
        /* __GDPR__
            "extensionGallery:uninstall" : {
                "owner": "sandy081",
                "success": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                "errorcode": { "classification": "CallstackOrException", "purpose": "PerformanceAndHealth" },
                "${include}": [
                    "${GalleryExtensionTelemetryData}"
                ]
            }
        */
        /* __GDPR__
            "extensionGallery:update" : {
                "owner": "sandy081",
                "success": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                "errorcode": { "classification": "CallstackOrException", "purpose": "PerformanceAndHealth" },
                "errorcodeDetail": { "classification": "CallstackOrException", "purpose": "PerformanceAndHealth" },
                "verificationStatus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                "${include}": [
                    "${GalleryExtensionTelemetryData}"
                ]
            }
        */
        telemetryService.publicLog(eventName, { ...extensionData, verificationStatus, success: !error, duration, errorcode, errorcodeDetail, durationSinceUpdate });
    }
    class AbstractExtensionTask {
        constructor() {
            this.barrier = new async_1.Barrier();
        }
        async waitUntilTaskIsFinished() {
            await this.barrier.wait();
            return this.cancellablePromise;
        }
        async run() {
            if (!this.cancellablePromise) {
                this.cancellablePromise = (0, async_1.createCancelablePromise)(token => this.doRun(token));
            }
            this.barrier.open();
            return this.cancellablePromise;
        }
        cancel() {
            if (!this.cancellablePromise) {
                this.cancellablePromise = (0, async_1.createCancelablePromise)(token => {
                    return new Promise((c, e) => {
                        const disposable = token.onCancellationRequested(() => {
                            disposable.dispose();
                            e(new errors_1.CancellationError());
                        });
                    });
                });
                this.barrier.open();
            }
            this.cancellablePromise.cancel();
        }
    }
    exports.AbstractExtensionTask = AbstractExtensionTask;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RFeHRlbnNpb25NYW5hZ2VtZW50U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZXh0ZW5zaW9uTWFuYWdlbWVudC9jb21tb24vYWJzdHJhY3RFeHRlbnNpb25NYW5hZ2VtZW50U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE4dEJoRyxnQ0FRQztJQUVELGdFQVlDO0lBbHNCTSxJQUFlLGtDQUFrQyxHQUFqRCxNQUFlLGtDQUFtQyxTQUFRLHNCQUFVO1FBVTFFLElBQUksa0JBQWtCLEtBQUssT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUduRSxJQUFJLHNCQUFzQixLQUFLLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFHM0UsSUFBSSxvQkFBb0IsS0FBSyxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBR3ZFLElBQUksdUJBQXVCLEtBQUssT0FBTyxJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUc3RSxJQUFJLDRCQUE0QixLQUFLLE9BQU8sSUFBSSxDQUFDLDZCQUE2QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFJdkYsWUFDMkIsY0FBMkQsRUFDbEUsZ0JBQXNELEVBQ3BELGtCQUEwRCxFQUNsRSxVQUEwQyxFQUN0QyxjQUFrRCxFQUN6Qyx1QkFBb0U7WUFFOUYsS0FBSyxFQUFFLENBQUM7WUFQcUMsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQy9DLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDakMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUMvQyxlQUFV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