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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/jsonFormatter", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionEnablementService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionManagement/common/extensionStorage", "vs/platform/extensions/common/extensions", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/userDataSync/common/extensionsMerge", "vs/platform/userDataSync/common/ignoredExtensions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataProfile/common/userDataProfileStorageService"], function (require, exports, async_1, cancellation_1, errors_1, event_1, jsonFormatter_1, lifecycle_1, strings_1, configuration_1, environment_1, extensionEnablementService_1, extensionManagement_1, extensionManagementUtil_1, extensionStorage_1, extensions_1, files_1, instantiation_1, serviceCollection_1, log_1, storage_1, telemetry_1, uriIdentity_1, userDataProfile_1, abstractSynchronizer_1, extensionsMerge_1, ignoredExtensions_1, userDataSync_1, userDataProfileStorageService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractExtensionsInitializer = exports.LocalExtensionsProvider = exports.ExtensionsSynchroniser = void 0;
    exports.parseExtensions = parseExtensions;
    exports.stringify = stringify;
    async function parseAndMigrateExtensions(syncData, extensionManagementService) {
        const extensions = JSON.parse(syncData.content);
        if (syncData.version === 1
            || syncData.version === 2) {
            const builtinExtensions = (await extensionManagementService.getInstalled(0 /* ExtensionType.System */)).filter(e => e.isBuiltin);
            for (const extension of extensions) {
                // #region Migration from v1 (enabled -> disabled)
                if (syncData.version === 1) {
                    if (extension.enabled === false) {
                        extension.disabled = true;
                    }
                    delete extension.enabled;
                }
                // #endregion
                // #region Migration from v2 (set installed property on extension)
                if (syncData.version === 2) {
                    if (builtinExtensions.every(installed => !(0, extensionManagementUtil_1.areSameExtensions)(installed.identifier, extension.identifier))) {
                        extension.installed = true;
                    }
                }
                // #endregion
            }
        }
        return extensions;
    }
    function parseExtensions(syncData) {
        return JSON.parse(syncData.content);
    }
    function stringify(extensions, format) {
        extensions.sort((e1, e2) => {
            if (!e1.identifier.uuid && e2.identifier.uuid) {
                return -1;
            }
            if (e1.identifier.uuid && !e2.identifier.uuid) {
                return 1;
            }
            return (0, strings_1.compare)(e1.identifier.id, e2.identifier.id);
        });
        return format ? (0, jsonFormatter_1.toFormattedString)(extensions, {}) : JSON.stringify(extensions);
    }
    let ExtensionsSynchroniser = class ExtensionsSynchroniser extends abstractSynchronizer_1.AbstractSynchroniser {
        constructor(
        // profileLocation changes for default profile
        profile, collection, environmentService, fileService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, extensionManagementService, ignoredExtensionsManagementService, logService, configurationService, userDataSyncEnablementService, telemetryService, extensionStorageService, uriIdentityService, userDataProfileStorageService, instantiationService) {
            super({ syncResource: "extensions" /* SyncResource.Extensions */, profile }, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService);
            this.extensionManagementService = extensionManagementService;
            this.ignoredExtensionsManagementService = ignoredExtensionsManagementService;
            this.instantiationService = instantiationService;
            /*
                Version 3 - Introduce installed property to skip installing built in extensions
                protected readonly version: number = 3;
            */
            /* Version 4: Change settings from `sync.${setting}` to `settingsSync.{setting}` */
            /* Version 5: Introduce extension state */
            /* Version 6: Added isApplicationScoped property */
            this.version = 6;
            this.previewResource = this.extUri.joinPath(this.syncPreviewFolder, 'extensions.json');
            this.baseResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'base' });
            this.localResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' });
            this.remoteResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' });
            this.acceptedResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' });
            this.localExtensionsProvider = this.instantiationService.createInstance(LocalExtensionsProvider);
            this._register(event_1.Event.any(event_1.Event.filter(this.extensionManagementService.onDidInstallExtensions, (e => e.some(({ local }) => !!local))), event_1.Event.filter(this.extensionManagementService.onDidUninstallExtension, (e => !e.error)), event_1.Event.filter(userDataProfileStorageService.onDidChange, e => e.valueChanges.some(({ profile, changes }) => this.syncResource.profile.id === profile.id && changes.some(change => change.key === extensionManagement_1.DISABLED_EXTENSIONS_STORAGE_PATH))), extensionStorageService.onDidChangeExtensionStorageToSync)(() => this.triggerLocalChange()));
        }
        async generateSyncPreview(remoteUserData, lastSyncUserData) {
            const remoteExtensions = remoteUserData.syncData ? await parseAndMigrateExtensions(remoteUserData.syncData, this.extensionManagementService) : null;
            const skippedExtensions = lastSyncUserData?.skippedExtensions ?? [];
            const builtinExtensions = lastSyncUserData?.builtinExtensions ?? null;
            const lastSyncExtensions = lastSyncUserData?.syncData ? await parseAndMigrateExtensions(lastSyncUserData.syncData, this.extensionManagementService) : null;
            const { localExtensions, ignoredExtensions } = await this.localExtensionsProvider.getLocalExtensions(this.syncResource.profile);
            if (remoteExtensions) {
                this.logService.trace(`${this.syncResourceLogLabel}: Merging remote extensions with local extensions...`);
            }
            else {
                this.logService.trace(`${this.syncResourceLogLabel}: Remote extensions does not exist. Synchronizing extensions for the first time.`);
            }
            const { local, remote } = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, lastSyncExtensions, skippedExtensions, ignoredExtensions, builtinExtensions);
            const previewResult = {
                local, remote,
                content: this.getPreviewContent(localExtensions, local.added, local.updated, local.removed),
                localChange: local.added.length > 0 || local.removed.length > 0 || local.updated.length > 0 ? 2 /* Change.Modified */ : 0 /* Change.None */,
                remoteChange: remote !== null ? 2 /* Change.Modified */ : 0 /* Change.None */,
            };
            const localContent = this.stringify(localExtensions, false);
            return [{
                    skippedExtensions,
                    builtinExtensions,
                    baseResource: this.baseResource,
                    baseContent: lastSyncExtensions ? this.stringify(lastSyncExtensions, false) : localContent,
                    localResource: this.localResource,
                    localContent,
                    localExtensions,
                    remoteResource: this.remoteResource,
                    remoteExtensions,
                    remoteContent: remoteExtensions ? this.stringify(remoteExtensions, false) : null,
                    previewResource: this.previewResource,
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.acceptedResource,
                }];
        }
        async hasRemoteChanged(lastSyncUserData) {
            const lastSyncExtensions = lastSyncUserData.syncData ? await parseAndMigrateExtensions(lastSyncUserData.syncData, this.extensionManagementService) : null;
            const { localExtensions, ignoredExtensions } = await this.localExtensionsProvider.getLocalExtensions(this.syncResource.profile);
            const { remote } = (0, extensionsMerge_1.merge)(localExtensions, lastSyncExtensions, lastSyncExtensions, lastSyncUserData.skippedExtensions || [], ignoredExtensions, lastSyncUserData.builtinExtensions || []);
            return remote !== null;
        }
        getPreviewContent(localExtensions, added, updated, removed) {
            const preview = [...added, ...updated];
            const idsOrUUIDs = new Set();
            const addIdentifier = (identifier) => {
                idsOrUUIDs.add(identifier.id.toLowerCase());
                if (identifier.uuid) {
                    idsOrUUIDs.add(identifier.uuid);
                }
            };
            preview.forEach(({ identifier }) => addIdentifier(identifier));
            removed.forEach(addIdentifier);
            for (const localExtension of localExtensions) {
                if (idsOrUUIDs.has(localExtension.identifier.id.toLowerCase()) || (localExtension.identifier.uuid && idsOrUUIDs.has(localExtension.identifier.uuid))) {
                    // skip
                    continue;
                }
                preview.push(localExtension);
            }
            return this.stringify(preview, false);
        }
        async getMergeResult(resourcePreview, token) {
            return { ...resourcePreview.previewResult, hasConflicts: false };
        }
        async getAcceptResult(resourcePreview, resource, content, token) {
            /* Accept local resource */
            if (this.extUri.isEqual(resource, this.localResource)) {
                return this.acceptLocal(resourcePreview);
            }
            /* Accept remote resource */
            if (this.extUri.isEqual(resource, this.remoteResource)) {
                return this.acceptRemote(resourcePreview);
            }
            /* Accept preview resource */
            if (this.extUri.isEqual(resource, this.previewResource)) {
                return resourcePreview.previewResult;
            }
            throw new Error(`Invalid Resource: ${resource.toString()}`);
        }
        async acceptLocal(resourcePreview) {
            const installedExtensions = await this.extensionManagementService.getInstalled(undefined, this.syncResource.profile.extensionsResource);
            const ignoredExtensions = this.ignoredExtensionsManagementService.getIgnoredExtensions(installedExtensions);
            const mergeResult = (0, extensionsMerge_1.merge)(resourcePreview.localExtensions, null, null, resourcePreview.skippedExtensions, ignoredExtensions, resourcePreview.builtinExtensions);
            const { local, remote } = mergeResult;
            return {
                content: resourcePreview.localContent,
                local,
                remote,
                localChange: local.added.length > 0 || local.removed.length > 0 || local.updated.length > 0 ? 2 /* Change.Modified */ : 0 /* Change.None */,
                remoteChange: remote !== null ? 2 /* Change.Modified */ : 0 /* Change.None */,
            };
        }
        async acceptRemote(resourcePreview) {
            const installedExtensions = await this.extensionManagementService.getInstalled(undefined, this.syncResource.profile.extensionsResource);
            const ignoredExtensions = this.ignoredExtensionsManagementService.getIgnoredExtensions(installedExtensions);
            const remoteExtensions = resourcePreview.remoteContent ? JSON.parse(resourcePreview.remoteContent) : null;
            if (remoteExtensions !== null) {
                const mergeResult = (0, extensionsMerge_1.merge)(resourcePreview.localExtensions, remoteExtensions, resourcePreview.localExtensions, [], ignoredExtensions, resourcePreview.builtinExtensions);
                const { local, remote } = mergeResult;
                return {
                    content: resourcePreview.remoteContent,
                    local,
                    remote,
                    localChange: local.added.length > 0 || local.removed.length > 0 || local.updated.length > 0 ? 2 /* Change.Modified */ : 0 /* Change.None */,
                    remoteChange: remote !== null ? 2 /* Change.Modified */ : 0 /* Change.None */,
                };
            }
            else {
                return {
                    content: resourcePreview.remoteContent,
                    local: { added: [], removed: [], updated: [] },
                    remote: null,
                    localChange: 0 /* Change.None */,
                    remoteChange: 0 /* Change.None */,
                };
            }
        }
        async applyResult(remoteUserData, lastSyncUserData, resourcePreviews, force) {
            let { skippedExtensions, builtinExtensions, localExtensions } = resourcePreviews[0][0];
            const { local, remote, localChange, remoteChange } = resourcePreviews[0][1];
            if (localChange === 0 /* Change.None */ && remoteChange === 0 /* Change.None */) {
                this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing extensions.`);
            }
            if (localChange !== 0 /* Change.None */) {
                await this.backupLocal(JSON.stringify(localExtensions));
                skippedExtensions = await this.localExtensionsProvider.updateLocalExtensions(local.added, local.removed, local.updated, skippedExtensions, this.syncResource.profile);
            }
            if (remote) {
                // update remote
                this.logService.trace(`${this.syncResourceLogLabel}: Updating remote extensions...`);
                const content = JSON.stringify(remote.all);
                remoteUserData = await this.updateRemoteUserData(content, force ? null : remoteUserData.ref);
                this.logService.info(`${this.syncResourceLogLabel}: Updated remote extensions.${remote.added.length ? ` Added: ${JSON.stringify(remote.added.map(e => e.identifier.id))}.` : ''}${remote.updated.length ? ` Updated: ${JSON.stringify(remote.updated.map(e => e.identifier.id))}.` : ''}${remote.removed.length ? ` Removed: ${JSON.stringify(remote.removed.map(e => e.identifier.id))}.` : ''}`);
            }
            if (lastSyncUserData?.ref !== remoteUserData.ref) {
                // update last sync
                this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized extensions...`);
                builtinExtensions = this.computeBuiltinExtensions(localExtensions, builtinExtensions);
                await this.updateLastSyncUserData(remoteUserData, { skippedExtensions, builtinExtensions });
                this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized extensions.${skippedExtensions.length ? ` Skipped: ${JSON.stringify(skippedExtensions.map(e => e.identifier.id))}.` : ''}`);
            }
        }
        computeBuiltinExtensions(localExtensions, previousBuiltinExtensions) {
            const localExtensionsSet = new Set();
            const builtinExtensions = [];
            for (const localExtension of localExtensions) {
                localExtensionsSet.add(localExtension.identifier.id.toLowerCase());
                if (!localExtension.installed) {
                    builtinExtensions.push(localExtension.identifier);
                }
            }
            if (previousBuiltinExtensions) {
                for (const builtinExtension of previousBuiltinExtensions) {
                    // Add previous builtin extension if it does not exist in local extensions
                    if (!localExtensionsSet.has(builtinExtension.id.toLowerCase())) {
                        builtinExtensions.push(builtinExtension);
                    }
                }
            }
            return builtinExtensions;
        }
        async resolveContent(uri) {
            if (this.extUri.isEqual(this.remoteResource, uri)
                || this.extUri.isEqual(this.baseResource, uri)
                || this.extUri.isEqual(this.localResource, uri)
                || this.extUri.isEqual(this.acceptedResource, uri)) {
                const content = await this.resolvePreviewContent(uri);
                return content ? this.stringify(JSON.parse(content), true) : content;
            }
            return null;
        }
        stringify(extensions, format) {
            return stringify(extensions, format);
        }
        async hasLocalData() {
            try {
                const { localExtensions } = await this.localExtensionsProvider.getLocalExtensions(this.syncResource.profile);
                if (localExtensions.some(e => e.installed || e.disabled)) {
                    return true;
                }
            }
            catch (error) {
                /* ignore error */
            }
            return false;
        }
    };
    exports.ExtensionsSynchroniser = ExtensionsSynchroniser;
    exports.ExtensionsSynchroniser = ExtensionsSynchroniser = __decorate([
        __param(2, environment_1.IEnvironmentService),
        __param(3, files_1.IFileService),
        __param(4, storage_1.IStorageService),
        __param(5, userDataSync_1.IUserDataSyncStoreService),
        __param(6, userDataSync_1.IUserDataSyncLocalStoreService),
        __param(7, extensionManagement_1.IExtensionManagementService),
        __param(8, ignoredExtensions_1.IIgnoredExtensionsManagementService),
        __param(9, userDataSync_1.IUserDataSyncLogService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, userDataSync_1.IUserDataSyncEnablementService),
        __param(12, telemetry_1.ITelemetryService),
        __param(13, extensionStorage_1.IExtensionStorageService),
        __param(14, uriIdentity_1.IUriIdentityService),
        __param(15, userDataProfileStorageService_1.IUserDataProfileStorageService),
        __param(16, instantiation_1.IInstantiationService)
    ], ExtensionsSynchroniser);
    let LocalExtensionsProvider = class LocalExtensionsProvider {
        constructor(extensionManagementService, userDataProfileStorageService, extensionGalleryService, ignoredExtensionsManagementService, instantiationService, logService) {
            this.extensionManagementService = extensionManagementService;
            this.userDataProfileStorageService = userDataProfileStorageService;
            this.extensionGalleryService = extensionGalleryService;
            this.ignoredExtensionsManagementService = ignoredExtensionsManagementService;
            this.instantiationService = instantiationService;
            this.logService = logService;
        }
        async getLocalExtensions(profile) {
            const installedExtensions = await this.extensionManagementService.getInstalled(undefined, profile.extensionsResource);
            const ignoredExtensions = this.ignoredExtensionsManagementService.getIgnoredExtensions(installedExtensions);
            const localExtensions = await this.withProfileScopedServices(profile, async (extensionEnablementService, extensionStorageService) => {
                const disabledExtensions = extensionEnablementService.getDisabledExtensions();
                return installedExtensions
                    .map(extension => {
                    const { identifier, isBuiltin, manifest, preRelease, pinned, isApplicationScoped } = extension;
                    const syncExntesion = { identifier, preRelease, version: manifest.version, pinned: !!pinned };
                    if (isApplicationScoped && !(0, extensions_1.isApplicationScopedExtension)(manifest)) {
                        syncExntesion.isApplicationScoped = isApplicationScoped;
                    }
                    if (disabledExtensions.some(disabledExtension => (0, extensionManagementUtil_1.areSameExtensions)(disabledExtension, identifier))) {
                        syncExntesion.disabled = true;
                    }
                    if (!isBuiltin) {
                        syncExntesion.installed = true;
                    }
                    try {
                        const keys = extensionStorageService.getKeysForSync({ id: identifier.id, version: manifest.version });
                        if (keys) {
                            const extensionStorageState = extensionStorageService.getExtensionState(extension, true) || {};
                            syncExntesion.state = Object.keys(extensionStorageState).reduce((state, key) => {
                                if (keys.includes(key)) {
                                    state[key] = extensionStorageState[key];
                                }
                                return state;
                            }, {});
                        }
                    }
                    catch (error) {
                        this.logService.info(`${(0, abstractSynchronizer_1.getSyncResourceLogLabel)("extensions" /* SyncResource.Extensions */, profile)}: Error while parsing extension state`, (0, errors_1.getErrorMessage)(error));
                    }
                    return syncExntesion;
                });
            });
            return { localExtensions, ignoredExtensions };
        }
        async updateLocalExtensions(added, removed, updated, skippedExtensions, profile) {
            const syncResourceLogLabel = (0, abstractSynchronizer_1.getSyncResourceLogLabel)("extensions" /* SyncResource.Extensions */, profile);
            const extensionsToInstall = [];
            const syncExtensionsToInstall = new Map();
            const removeFromSkipped = [];
            const addToSkipped = [];
            const installedExtensions = await this.extensionManagementService.getInstalled(undefined, profile.extensionsResource);
            // 1. Sync extensions state first so that the storage is flushed and updated in all opened windows
            if (added.length || updated.length) {
                await this.withProfileScopedServices(profile, async (extensionEnablementService, extensionStorageService) => {
                    await async_1.Promises.settled([...added, ...updated].map(async (e) => {
                        const installedExtension = installedExtensions.find(installed => (0, extensionManagementUtil_1.areSameExtensions)(installed.identifier, e.identifier));
                        // Builtin Extension Sync: Enablement & State
                        if (installedExtension && installedExtension.isBuiltin) {
                            if (e.state && installedExtension.manifest.version === e.version) {
                                this.updateExtensionState(e.state, installedExtension, installedExtension.manifest.version, extensionStorageService);
                            }
                            const isDisabled = extensionEnablementService.getDisabledExtensions().some(disabledExtension => (0, extensionManagementUtil_1.areSameExtensions)(disabledExtension, e.identifier));
                            if (isDisabled !== !!e.disabled) {
                                if (e.disabled) {
                                    this.logService.trace(`${syncResourceLogLabel}: Disabling extension...`, e.identifier.id);
                                    await extensionEnablementService.disableExtension(e.identifier);
                                    this.logService.info(`${syncResourceLogLabel}: Disabled extension`, e.identifier.id);
                                }
                                else {
                                    this.logService.trace(`${syncResourceLogLabel}: Enabling extension...`, e.identifier.id);
                                    await extensionEnablementService.enableExtension(e.identifier);
                                    this.logService.info(`${syncResourceLogLabel}: Enabled extension`, e.identifier.id);
                                }
                            }
                            removeFromSkipped.push(e.identifier);
                            return;
                        }
                        // User Extension Sync: Install/Update, Enablement & State
                        const version = e.pinned ? e.version : undefined;
                        const extension = (await this.extensionGalleryService.getExtensions([{ ...e.identifier, version, preRelease: version ? undefined : e.preRelease }], cancellation_1.CancellationToken.None))[0];
                        /* Update extension state only if
                         *	extension is installed and version is same as synced version or
                         *	extension is not installed and installable
                         */
                        if (e.state &&
                            (installedExtension ? installedExtension.manifest.version === e.version /* Installed and remote has same version */
                                : !!extension /* Installable */)) {
                            this.updateExtensionState(e.state, installedExtension || extension, installedExtension?.manifest.version, extensionStorageService);
                        }
                        if (extension) {
                            try {
                                const isDisabled = extensionEnablementService.getDisabledExtensions().some(disabledExtension => (0, extensionManagementUtil_1.areSameExtensions)(disabledExtension, e.identifier));
                                if (isDisabled !== !!e.disabled) {
                                    if (e.disabled) {
                                        this.logService.trace(`${syncResourceLogLabel}: Disabling extension...`, e.identifier.id, extension.version);
                                        await extensionEnablementService.disableExtension(extension.identifier);
                                        this.logService.info(`${syncResourceLogLabel}: Disabled extension`, e.identifier.id, extension.version);
                                    }
                                    else {
                                        this.logService.trace(`${syncResourceLogLabel}: Enabling extension...`, e.identifier.id, extension.version);
                                        await extensionEnablementService.enableExtension(extension.identifier);
                                        this.logService.info(`${syncResourceLogLabel}: Enabled extension`, e.identifier.id, extension.version);
                                    }
                                }
                                if (!installedExtension // Install if the extension does not exist
                                    || installedExtension.preRelease !== e.preRelease // Install if the extension pre-release preference has changed
                                    || installedExtension.pinned !== e.pinned // Install if the extension pinned preference has changed
                                    || (version && installedExtension.manifest.version !== version) // Install if the extension version has changed
                                ) {
                                    if (await this.extensionManagementService.canInstall(extension)) {
                                        extensionsToInstall.push({
                                            extension, options: {
                                                isMachineScoped: false /* set isMachineScoped value to prevent install and sync dialog in web */,
                                                donotIncludePackAndDependencies: true,
                                                installGivenVersion: e.pinned && !!e.version,
                                                installPreReleaseVersion: e.preRelease,
                                                profileLocation: profile.extensionsResource,
                                                isApplicationScoped: e.isApplicationScoped,
                                                context: { [extensionManagement_1.EXTENSION_INSTALL_SKIP_WALKTHROUGH_CONTEXT]: true, [extensionManagement_1.EXTENSION_INSTALL_SYNC_CONTEXT]: true }
                                            }
                                        });
                                        syncExtensionsToInstall.set(extension.identifier.id.toLowerCase(), e);
                                    }
                                    else {
                                        this.logService.info(`${syncResourceLogLabel}: Skipped synchronizing extension because it cannot be installed.`, extension.displayName || extension.identifier.id);
                                        addToSkipped.push(e);
                                    }
                                }
                            }
                            catch (error) {
                                addToSkipped.push(e);
                                this.logService.error(error);
                                this.logService.info(`${syncResourceLogLabel}: Skipped synchronizing extension`, extension.displayName || extension.identifier.id);
                            }
                        }
                        else {
                            addToSkipped.push(e);
                            this.logService.info(`${syncResourceLogLabel}: Skipped synchronizing extension because the extension is not found.`, e.identifier.id);
                        }
                    }));
                });
            }
            // 2. Next uninstall the removed extensions
            if (removed.length) {
                const extensionsToRemove = installedExtensions.filter(({ identifier, isBuiltin }) => !isBuiltin && removed.some(r => (0, extensionManagementUtil_1.areSameExtensions)(identifier, r)));
                await async_1.Promises.settled(extensionsToRemove.map(async (extensionToRemove) => {
                    this.logService.trace(`${syncResourceLogLabel}: Uninstalling local extension...`, extensionToRemove.identifier.id);
                    await this.extensionManagementService.uninstall(extensionToRemove, { donotIncludePack: true, donotCheckDependents: true, profileLocation: profile.extensionsResource });
                    this.logService.info(`${syncResourceLogLabel}: Uninstalled local extension.`, extensionToRemove.identifier.id);
                    removeFromSkipped.push(extensionToRemove.identifier);
                }));
            }
            // 3. Install extensions at the end
            const results = await this.extensionManagementService.installGalleryExtensions(extensionsToInstall);
            for (const { identifier, local, error, source } of results) {
                const gallery = source;
                if (local) {
                    this.logService.info(`${syncResourceLogLabel}: Installed extension.`, identifier.id, gallery.version);
                    removeFromSkipped.push(identifier);
                }
                else {
                    const e = syncExtensionsToInstall.get(identifier.id.toLowerCase());
                    if (e) {
                        addToSkipped.push(e);
                        this.logService.info(`${syncResourceLogLabel}: Skipped synchronizing extension`, gallery.displayName || gallery.identifier.id);
                    }
                    if (error instanceof extensionManagement_1.ExtensionManagementError && [extensionManagement_1.ExtensionManagementErrorCode.Incompatible, extensionManagement_1.ExtensionManagementErrorCode.IncompatibleTargetPlatform].includes(error.code)) {
                        this.logService.info(`${syncResourceLogLabel}: Skipped synchronizing extension because the compatible extension is not found.`, gallery.displayName || gallery.identifier.id);
                    }
                    else if (error) {
                        this.logService.error(error);
                    }
                }
            }
            const newSkippedExtensions = [];
            for (const skippedExtension of skippedExtensions) {
                if (!removeFromSkipped.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e, skippedExtension.identifier))) {
                    newSkippedExtensions.push(skippedExtension);
                }
            }
            for (const skippedExtension of addToSkipped) {
                if (!newSkippedExtensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, skippedExtension.identifier))) {
                    newSkippedExtensions.push(skippedExtension);
                }
            }
            return newSkippedExtensions;
        }
        updateExtensionState(state, extension, version, extensionStorageService) {
            const extensionState = extensionStorageService.getExtensionState(extension, true) || {};
            const keys = version ? extensionStorageService.getKeysForSync({ id: extension.identifier.id, version }) : undefined;
            if (keys) {
                keys.forEach(key => { extensionState[key] = state[key]; });
            }
            else {
                Object.keys(state).forEach(key => extensionState[key] = state[key]);
            }
            extensionStorageService.setExtensionState(extension, extensionState, true);
        }
        async withProfileScopedServices(profile, fn) {
            return this.userDataProfileStorageService.withProfileScopedStorageService(profile, async (storageService) => {
                const disposables = new lifecycle_1.DisposableStore();
                const instantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([storage_1.IStorageService, storageService]));
                const extensionEnablementService = disposables.add(instantiationService.createInstance(extensionEnablementService_1.GlobalExtensionEnablementService));
                const extensionStorageService = disposables.add(instantiationService.createInstance(extensionStorage_1.ExtensionStorageService));
                try {
                    return await fn(extensionEnablementService, extensionStorageService);
                }
                finally {
                    disposables.dispose();
                }
            });
        }
    };
    exports.LocalExtensionsProvider = LocalExtensionsProvider;
    exports.LocalExtensionsProvider = LocalExtensionsProvider = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, userDataProfileStorageService_1.IUserDataProfileStorageService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, ignoredExtensions_1.IIgnoredExtensionsManagementService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, userDataSync_1.IUserDataSyncLogService)
    ], LocalExtensionsProvider);
    let AbstractExtensionsInitializer = class AbstractExtensionsInitializer extends abstractSynchronizer_1.AbstractInitializer {
        constructor(extensionManagementService, ignoredExtensionsManagementService, fileService, userDataProfilesService, environmentService, logService, storageService, uriIdentityService) {
            super("extensions" /* SyncResource.Extensions */, userDataProfilesService, environmentService, logService, fileService, storageService, uriIdentityService);
            this.extensionManagementService = extensionManagementService;
            this.ignoredExtensionsManagementService = ignoredExtensionsManagementService;
        }
        async parseExtensions(remoteUserData) {
            return remoteUserData.syncData ? await parseAndMigrateExtensions(remoteUserData.syncData, this.extensionManagementService) : null;
        }
        generatePreview(remoteExtensions, localExtensions) {
            const installedExtensions = [];
            const newExtensions = [];
            const disabledExtensions = [];
            for (const extension of remoteExtensions) {
                if (this.ignoredExtensionsManagementService.hasToNeverSyncExtension(extension.identifier.id)) {
                    // Skip extension ignored to sync
                    continue;
                }
                const installedExtension = localExtensions.find(i => (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, extension.identifier));
                if (installedExtension) {
                    installedExtensions.push(installedExtension);
                    if (extension.disabled) {
                        disabledExtensions.push(extension.identifier);
                    }
                }
                else if (extension.installed) {
                    newExtensions.push({ ...extension.identifier, preRelease: !!extension.preRelease });
                    if (extension.disabled) {
                        disabledExtensions.push(extension.identifier);
                    }
                }
            }
            return { installedExtensions, newExtensions, disabledExtensions, remoteExtensions };
        }
    };
    exports.AbstractExtensionsInitializer = AbstractExtensionsInitializer;
    exports.AbstractExtensionsInitializer = AbstractExtensionsInitializer = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, ignoredExtensions_1.IIgnoredExtensionsManagementService),
        __param(2, files_1.IFileService),
        __param(3, userDataProfile_1.IUserDataProfilesService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, log_1.ILogService),
        __param(6, storage_1.IStorageService),
        __param(7, uriIdentity_1.IUriIdentityService)
    ], AbstractExtensionsInitializer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1N5bmMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy9jb21tb24vZXh0ZW5zaW9uc1N5bmMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkVoRywwQ0FFQztJQUVELDhCQVdDO0lBM0NELEtBQUssVUFBVSx5QkFBeUIsQ0FBQyxRQUFtQixFQUFFLDBCQUF1RDtRQUNwSCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoRCxJQUFJLFFBQVEsQ0FBQyxPQUFPLEtBQUssQ0FBQztlQUN0QixRQUFRLENBQUMsT0FBTyxLQUFLLENBQUMsRUFDeEIsQ0FBQztZQUNGLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxNQUFNLDBCQUEwQixDQUFDLFlBQVksOEJBQXNCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDekgsS0FBSyxNQUFNLFNBQVMsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDcEMsa0RBQWtEO2dCQUNsRCxJQUFJLFFBQVEsQ0FBQyxPQUFPLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQzVCLElBQVUsU0FBVSxDQUFDLE9BQU8sS0FBSyxLQUFLLEVBQUUsQ0FBQzt3QkFDeEMsU0FBUyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7b0JBQzNCLENBQUM7b0JBQ0QsT0FBYSxTQUFVLENBQUMsT0FBTyxDQUFDO2dCQUNqQyxDQUFDO2dCQUNELGFBQWE7Z0JBRWIsa0VBQWtFO2dCQUNsRSxJQUFJLFFBQVEsQ0FBQyxPQUFPLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQzVCLElBQUksaUJBQWlCLENBQUMsS0FB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