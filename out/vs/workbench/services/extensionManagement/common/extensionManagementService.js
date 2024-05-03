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
define(["require", "exports", "vs/base/common/event", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensions/common/extensions", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/base/common/cancellation", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/nls", "vs/platform/product/common/productService", "vs/base/common/network", "vs/platform/download/common/download", "vs/base/common/arrays", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/async", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/instantiation/common/instantiation", "vs/platform/commands/common/commands", "vs/base/common/types", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/base/common/errors", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/workspace/common/workspace", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/telemetry/common/telemetry", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry"], function (require, exports, event_1, extensionManagement_1, extensionManagement_2, extensions_1, uri_1, lifecycle_1, configuration_1, cancellation_1, extensionManagementUtil_1, nls_1, productService_1, network_1, download_1, arrays_1, dialogs_1, severity_1, userDataSync_1, async_1, workspaceTrust_1, extensionManifestPropertiesService_1, instantiation_1, commands_1, types_1, files_1, log_1, errors_1, userDataProfile_1, workspace_1, extensionsScannerService_1, storage_1, uriIdentity_1, telemetry_1, platform_1, configurationRegistry_1) {
    "use strict";
    var WorkspaceExtensionsManagementService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionManagementService = void 0;
    let ExtensionManagementService = class ExtensionManagementService extends lifecycle_1.Disposable {
        constructor(extensionManagementServerService, extensionGalleryService, userDataProfileService, configurationService, productService, downloadService, userDataSyncEnablementService, dialogService, workspaceTrustRequestService, extensionManifestPropertiesService, fileService, logService, instantiationService, extensionsScannerService, telemetryService) {
            super();
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionGalleryService = extensionGalleryService;
            this.userDataProfileService = userDataProfileService;
            this.configurationService = configurationService;
            this.productService = productService;
            this.downloadService = downloadService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.dialogService = dialogService;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.fileService = fileService;
            this.logService = logService;
            this.instantiationService = instantiationService;
            this.extensionsScannerService = extensionsScannerService;
            this.telemetryService = telemetryService;
            this._onInstallExtension = this._register(new event_1.Emitter());
            this._onDidInstallExtensions = this._register(new event_1.Emitter());
            this._onUninstallExtension = this._register(new event_1.Emitter());
            this._onDidUninstallExtension = this._register(new event_1.Emitter());
            this.servers = [];
            if (productService.quality !== 'stable') {
                platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
                    .registerConfiguration({
                    ...extensionManagement_2.extensionsConfigurationNodeBase,
                    properties: {
                        'extensions.experimental.supportWorkspaceExtensions': {
                            type: 'boolean',
                            description: (0, nls_1.localize)('extensions.experimental.supportWorkspaceExtensions', "Enables support for workspace specific local extensions."),
                            default: false,
                            scope: 1 /* ConfigurationScope.APPLICATION */
                        }
                    }
                });
            }
            if (this.productService.quality !== 'stable' && this.configurationService.getValue('extensions.experimental.supportWorkspaceExtensions') === true) {
                this.workspaceExtensionManagementService = this._register(this.instantiationService.createInstance(WorkspaceExtensionsManagementService));
                this.onDidEnableExtensions = this.workspaceExtensionManagementService.onDidChangeInvalidExtensions;
            }
            else {
                this.onDidEnableExtensions = event_1.Event.None;
            }
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                this.servers.push(this.extensionManagementServerService.localExtensionManagementServer);
            }
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                this.servers.push(this.extensionManagementServerService.remoteExtensionManagementServer);
            }
            if (this.extensionManagementServerService.webExtensionManagementServer) {
                this.servers.push(this.extensionManagementServerService.webExtensionManagementServer);
            }
            const onInstallExtensionEventMultiplexer = this._register(new event_1.EventMultiplexer());
            this._register(onInstallExtensionEventMultiplexer.add(this._onInstallExtension.event));
            this.onInstallExtension = onInstallExtensionEventMultiplexer.event;
            const onDidInstallExtensionsEventMultiplexer = this._register(new event_1.EventMultiplexer());
            this._register(onDidInstallExtensionsEventMultiplexer.add(this._onDidInstallExtensions.event));
            this.onDidInstallExtensions = onDidInstallExtensionsEventMultiplexer.event;
            const onUninstallExtensionEventMultiplexer = this._register(new event_1.EventMultiplexer());
            this._register(onUninstallExtensionEventMultiplexer.add(this._onUninstallExtension.event));
            this.onUninstallExtension = onUninstallExtensionEventMultiplexer.event;
            const onDidUninstallExtensionEventMultiplexer = this._register(new event_1.EventMultiplexer());
            this._register(onDidUninstallExtensionEventMultiplexer.add(this._onDidUninstallExtension.event));
            this.onDidUninstallExtension = onDidUninstallExtensionEventMultiplexer.event;
            const onDidUpdateExtensionMetadaEventMultiplexer = this._register(new event_1.EventMultiplexer());
            this.onDidUpdateExtensionMetadata = onDidUpdateExtensionMetadaEventMultiplexer.event;
            const onDidChangeProfileEventMultiplexer = this._register(new event_1.EventMultiplexer());
            this.onDidChangeProfile = onDidChangeProfileEventMultiplexer.event;
            for (const server of this.servers) {
                this._register(onInstallExtensionEventMultiplexer.add(event_1.Event.map(server.extensionManagementService.onInstallExtension, e => ({ ...e, server }))));
                this._register(onDidInstallExtensionsEventMultiplexer.add(server.extensionManagementService.onDidInstallExtensions));
                this._register(onUninstallExtensionEventMultiplexer.add(event_1.Event.map(server.extensionManagementService.onUninstallExtension, e => ({ ...e, server }))));
                this._register(onDidUninstallExtensionEventMultiplexer.add(event_1.Event.map(server.extensionManagementService.onDidUninstallExtension, e => ({ ...e, server }))));
                this._register(onDidUpdateExtensionMetadaEventMultiplexer.add(server.extensionManagementService.onDidUpdateExtensionMetadata));
                this._register(onDidChangeProfileEventMultiplexer.add(event_1.Event.map(server.extensionManagementService.onDidChangeProfile, e => ({ ...e, server }))));
            }
        }
        isWorkspaceExtensionsSupported() {
            return !!this.workspaceExtensionManagementService;
        }
        async getInstalled(type, profileLocation, productVersion) {
            const result = [];
            await Promise.all(this.servers.map(async (server) => {
                const installed = await server.extensionManagementService.getInstalled(type, profileLocation, productVersion);
                if (server === this.getWorkspaceExtensionsServer()) {
                    const workspaceExtensions = await this.getInstalledWorkspaceExtensions(true);
                    installed.push(...workspaceExtensions);
                }
                result.push(...installed);
            }));
            return result;
        }
        async uninstall(extension, options) {
            if (extension.isWorkspaceScoped) {
                return this.uninstallExtensionFromWorkspace(extension);
            }
            const server = this.getServer(extension);
            if (!server) {
                return Promise.reject(`Invalid location ${extension.location.toString()}`);
            }
            if (this.servers.length > 1) {
                if ((0, extensions_1.isLanguagePackExtension)(extension.manifest)) {
                    return this.uninstallEverywhere(extension, options);
                }
                return this.uninstallInServer(extension, server, options);
            }
            return server.extensionManagementService.uninstall(extension, options);
        }
        async uninstallEverywhere(extension, options) {
            const server = this.getServer(extension);
            if (!server) {
                return Promise.reject(`Invalid location ${extension.location.toString()}`);
            }
            const promise = server.extensionManagementService.uninstall(extension, options);
            const otherServers = this.servers.filter(s => s !== server);
            if (otherServers.length) {
                for (const otherServer of otherServers) {
                    const installed = await otherServer.extensionManagementService.getInstalled();
                    extension = installed.filter(i => !i.isBuiltin && (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, extension.identifier))[0];
                    if (extension) {
                        await otherServer.extensionManagementService.uninstall(extension, options);
                    }
                }
            }
            return promise;
        }
        async uninstallInServer(extension, server, options) {
            if (server === this.extensionManagementServerService.localExtensionManagementServer) {
                const installedExtensions = await this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getInstalled(1 /* ExtensionType.User */);
                const dependentNonUIExtensions = installedExtensions.filter(i => !this.extensionManifestPropertiesService.prefersExecuteOnUI(i.manifest)
                    && i.manifest.extensionDependencies && i.manifest.extensionDependencies.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, extension.identifier)));
                if (dependentNonUIExtensions.length) {
                    return Promise.reject(new Error(this.getDependentsErrorMessage(extension, dependentNonUIExtensions)));
                }
            }
            return server.extensionManagementService.uninstall(extension, options);
        }
        getDependentsErrorMessage(extension, dependents) {
            if (dependents.length === 1) {
                return (0, nls_1.localize)('singleDependentError', "Cannot uninstall extension '{0}'. Extension '{1}' depends on this.", extension.manifest.displayName || extension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name);
            }
            if (dependents.length === 2) {
                return (0, nls_1.localize)('twoDependentsError', "Cannot uninstall extension '{0}'. Extensions '{1}' and '{2}' depend on this.", extension.manifest.displayName || extension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
            }
            return (0, nls_1.localize)('multipleDependentsError', "Cannot uninstall extension '{0}'. Extensions '{1}', '{2}' and others depend on this.", extension.manifest.displayName || extension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
        }
        async reinstallFromGallery(extension) {
            const server = this.getServer(extension);
            if (server) {
                await this.checkForWorkspaceTrust(extension.manifest, false);
                return server.extensionManagementService.reinstallFromGallery(extension);
            }
            return Promise.reject(`Invalid location ${extension.location.toString()}`);
        }
        updateMetadata(extension, metadata, profileLocation) {
            const server = this.getServer(extension);
            if (server) {
                return server.extensionManagementService.updateMetadata(extension, metadata, profileLocation);
            }
            return Promise.reject(`Invalid location ${extension.location.toString()}`);
        }
        zip(extension) {
            const server = this.getServer(extension);
            if (server) {
                return server.extensionManagementService.zip(extension);
            }
            return Promise.reject(`Invalid location ${extension.location.toString()}`);
        }
        unzip(zipLocation) {
            return async_1.Promises.settled(this.servers
                // Filter out web server
                .filter(server => server !== this.extensionManagementServerService.webExtensionManagementServer)
                .map(({ extensionManagementService }) => extensionManagementService.unzip(zipLocation))).then(([extensionIdentifier]) => extensionIdentifier);
        }
        download(extension, operation, donotVerifySignature) {
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.download(extension, operation, donotVerifySignature);
            }
            throw new Error('Cannot download extension');
        }
        async install(vsix, options) {
            const manifest = await this.getManifest(vsix);
            return this.installVSIX(vsix, manifest, options);
        }
        async installVSIX(vsix, manifest, options) {
            const serversToInstall = this.getServersToInstall(manifest);
            if (serversToInstall?.length) {
                await this.checkForWorkspaceTrust(manifest, false);
                const [local] = await async_1.Promises.settled(serversToInstall.map(server => this.installVSIXInServer(vsix, server, options)));
                return local;
            }
            return Promise.reject('No Servers to Install');
        }
        getServersToInstall(manifest) {
            if (this.extensionManagementServerService.localExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) {
                if ((0, extensions_1.isLanguagePackExtension)(manifest)) {
                    // Install on both servers
                    return [this.extensionManagementServerService.localExtensionManagementServer, this.extensionManagementServerService.remoteExtensionManagementServer];
                }
                if (this.extensionManifestPropertiesService.prefersExecuteOnUI(manifest)) {
                    // Install only on local server
                    return [this.extensionManagementServerService.localExtensionManagementServer];
                }
                // Install only on remote server
                return [this.extensionManagementServerService.remoteExtensionManagementServer];
            }
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                return [this.extensionManagementServerService.localExtensionManagementServer];
            }
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                return [this.extensionManagementServerService.remoteExtensionManagementServer];
            }
            return undefined;
        }
        async installFromLocation(location) {
            if (location.scheme === network_1.Schemas.file) {
                if (this.extensionManagementServerService.localExtensionManagementServer) {
                    return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.installFromLocation(location, this.userDataProfileService.currentProfile.extensionsResource);
                }
                throw new Error('Local extension management server is not found');
            }
            if (location.scheme === network_1.Schemas.vscodeRemote) {
                if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                    return this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.installFromLocation(location, this.userDataProfileService.currentProfile.extensionsResource);
                }
                throw new Error('Remote extension management server is not found');
            }
            if (!this.extensionManagementServerService.webExtensionManagementServer) {
                throw new Error('Web extension management server is not found');
            }
            return this.extensionManagementServerService.webExtensionManagementServer.extensionManagementService.installFromLocation(location, this.userDataProfileService.currentProfile.extensionsResource);
        }
        installVSIXInServer(vsix, server, options) {
            return server.extensionManagementService.install(vsix, options);
        }
        getManifest(vsix) {
            if (vsix.scheme === network_1.Schemas.file && this.extensionManagementServerService.localExtensionManagementServer) {
                return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.getManifest(vsix);
            }
            if (vsix.scheme === network_1.Schemas.file && this.extensionManagementServerService.remoteExtensionManagementServer) {
                return this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getManifest(vsix);
            }
            if (vsix.scheme === network_1.Schemas.vscodeRemote && this.extensionManagementServerService.remoteExtensionManagementServer) {
                return this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getManifest(vsix);
            }
            return Promise.reject('No Servers');
        }
        async canInstall(gallery) {
            if (this.extensionManagementServerService.localExtensionManagementServer
                && await this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.canInstall(gallery)) {
                return true;
            }
            const manifest = await this.extensionGalleryService.getManifest(gallery, cancellation_1.CancellationToken.None);
            if (!manifest) {
                return false;
            }
            if (this.extensionManagementServerService.remoteExtensionManagementServer
                && await this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.canInstall(gallery)
                && this.extensionManifestPropertiesService.canExecuteOnWorkspace(manifest)) {
                return true;
            }
            if (this.extensionManagementServerService.webExtensionManagementServer
                && await this.extensionManagementServerService.webExtensionManagementServer.extensionManagementService.canInstall(gallery)
                && this.extensionManifestPropertiesService.canExecuteOnWeb(manifest)) {
                return true;
            }
            return false;
        }
        async updateFromGallery(gallery, extension, installOptions) {
            const server = this.getServer(extension);
            if (!server) {
                return Promise.reject(`Invalid location ${extension.location.toString()}`);
            }
            const servers = [];
            // Update Language pack on local and remote servers
            if ((0, extensions_1.isLanguagePackExtension)(extension.manifest)) {
                servers.push(...this.servers.filter(server => server !== this.extensionManagementServerService.webExtensionManagementServer));
            }
            else {
                servers.push(server);
            }
            return async_1.Promises.settled(servers.map(server => server.extensionManagementService.installFromGallery(gallery, installOptions))).then(([local]) => local);
        }
        async installGalleryExtensions(extensions) {
            const results = new Map();
            const extensionsByServer = new Map();
            await Promise.all(extensions.map(async ({ extension, options }) => {
                try {
                    const servers = await this.validateAndGetExtensionManagementServersToInstall(extension, options);
                    if (!options.isMachineScoped && this.isExtensionsSyncEnabled()) {
                        if (this.extensionManagementServerService.localExtensionManagementServer && !servers.includes(this.extensionManagementServerService.localExtensionManagementServer) && (await this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.canInstall(extension))) {
                            servers.push(this.extensionManagementServerService.localExtensionManagementServer);
                        }
                    }
                    for (const server of servers) {
                        let exensions = extensionsByServer.get(server);
                        if (!exensions) {
                            extensionsByServer.set(server, exensions = []);
                        }
                        exensions.push({ extension, options });
                    }
                }
                catch (error) {
                    results.set(extension.identifier.id.toLowerCase(), { identifier: extension.identifier, source: extension, error, operation: 2 /* InstallOperation.Install */ });
                }
            }));
            await Promise.all([...extensionsByServer.entries()].map(async ([server, extensions]) => {
                const serverResults = await server.extensionManagementService.installGalleryExtensions(extensions);
                for (const result of serverResults) {
                    results.set(result.identifier.id.toLowerCase(), result);
                }
            }));
            return [...results.values()];
        }
        async installFromGallery(gallery, installOptions) {
            const servers = await this.validateAndGetExtensionManagementServersToInstall(gallery, installOptions);
            if (!installOptions || (0, types_1.isUndefined)(installOptions.isMachineScoped)) {
                const isMachineScoped = await this.hasToFlagExtensionsMachineScoped([gallery]);
                installOptions = { ...(installOptions || {}), isMachineScoped };
            }
            if (!installOptions.isMachineScoped && this.isExtensionsSyncEnabled()) {
                if (this.extensionManagementServerService.localExtensionManagementServer && !servers.includes(this.extensionManagementServerService.localExtensionManagementServer) && (await this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.canInstall(gallery))) {
                    servers.push(this.extensionManagementServerService.localExtensionManagementServer);
                }
            }
            return async_1.Promises.settled(servers.map(server => server.extensionManagementService.installFromGallery(gallery, installOptions))).then(([local]) => local);
        }
        async getExtensions(locations) {
            if (!this.workspaceExtensionManagementService) {
                return [];
            }
            const scannedExtensions = await this.extensionsScannerService.scanMultipleExtensions(locations, 1 /* ExtensionType.User */, { includeInvalid: true });
            const result = [];
            await Promise.all(scannedExtensions.map(async (scannedExtension) => {
                const workspaceExtension = await this.workspaceExtensionManagementService?.toLocalWorkspaceExtension(scannedExtension);
                if (workspaceExtension) {
                    result.push({
                        identifier: workspaceExtension.identifier,
                        location: workspaceExtension.location,
                        manifest: workspaceExtension.manifest,
                        changelogUri: workspaceExtension.changelogUrl,
                        readmeUri: workspaceExtension.readmeUrl,
                    });
                }
            }));
            return result;
        }
        async getInstalledWorkspaceExtensions(includeInvalid) {
            return this.workspaceExtensionManagementService?.getInstalled(includeInvalid) ?? [];
        }
        async installResourceExtension(extension, installOptions) {
            if (!installOptions.isWorkspaceScoped) {
                return this.installFromLocation(extension.location);
            }
            if (!this.workspaceExtensionManagementService) {
                throw new Error('Workspace Extensions are not supported');
            }
            this.logService.info(`Installing the extension ${extension.identifier.id} from ${extension.location.toString()} in workspace`);
            const server = this.getWorkspaceExtensionsServer();
            this._onInstallExtension.fire({
                identifier: extension.identifier,
                source: extension.location,
                server,
                applicationScoped: false,
                profileLocation: this.userDataProfileService.currentProfile.extensionsResource,
                workspaceScoped: true
            });
            try {
                await this.checkForWorkspaceTrust(extension.manifest, true);
                const workspaceExtension = await this.workspaceExtensionManagementService.install(extension);
                this.logService.info(`Successfully installed the extension ${workspaceExtension.identifier.id} from ${extension.location.toString()} in the workspace`);
                this._onDidInstallExtensions.fire([{
                        identifier: workspaceExtension.identifier,
                        source: extension.location,
                        operation: 2 /* InstallOperation.Install */,
                        applicationScoped: false,
                        profileLocation: this.userDataProfileService.currentProfile.extensionsResource,
                        local: workspaceExtension,
                        workspaceScoped: true
                    }]);
                return workspaceExtension;
            }
            catch (error) {
                this.logService.error(`Failed to install the extension ${extension.identifier.id} from ${extension.location.toString()} in the workspace`, (0, errors_1.getErrorMessage)(error));
                this._onDidInstallExtensions.fire([{
                        identifier: extension.identifier,
                        source: extension.location,
                        operation: 2 /* InstallOperation.Install */,
                        applicationScoped: false,
                        profileLocation: this.userDataProfileService.currentProfile.extensionsResource,
                        error,
                        workspaceScoped: true
                    }]);
                throw error;
            }
        }
        async uninstallExtensionFromWorkspace(extension) {
            if (!extension.isWorkspaceScoped) {
                throw new Error('The extension is not a workspace extension');
            }
            if (!this.workspaceExtensionManagementService) {
                throw new Error('Workspace Extensions are not supported');
            }
            this.logService.info(`Uninstalling the workspace extension ${extension.identifier.id} from ${extension.location.toString()}`);
            const server = this.getWorkspaceExtensionsServer();
            this._onUninstallExtension.fire({
                identifier: extension.identifier,
                server,
                applicationScoped: false,
                workspaceScoped: true
            });
            try {
                await this.workspaceExtensionManagementService.uninstall(extension);
                this.logService.info(`Successfully uninstalled the workspace extension ${extension.identifier.id} from ${extension.location.toString()}`);
                this.telemetryService.publicLog2('workspaceextension:uninstall');
                this._onDidUninstallExtension.fire({
                    identifier: extension.identifier,
                    server,
                    applicationScoped: false,
                    workspaceScoped: true
                });
            }
            catch (error) {
                this.logService.error(`Failed to uninstall the workspace extension ${extension.identifier.id} from ${extension.location.toString()}`, (0, errors_1.getErrorMessage)(error));
                this._onDidUninstallExtension.fire({
                    identifier: extension.identifier,
                    server,
                    error,
                    applicationScoped: false,
                    workspaceScoped: true
                });
                throw error;
            }
        }
        async validateAndGetExtensionManagementServersToInstall(gallery, installOptions) {
            const manifest = await this.extensionGalleryService.getManifest(gallery, cancellation_1.CancellationToken.None);
            if (!manifest) {
                return Promise.reject((0, nls_1.localize)('Manifest is not found', "Installing Extension {0} failed: Manifest is not found.", gallery.displayName || gallery.name));
            }
            const servers = [];
            // Install Language pack on local and remote servers
            if ((0, extensions_1.isLanguagePackExtension)(manifest)) {
                servers.push(...this.servers.filter(server => server !== this.extensionManagementServerService.webExtensionManagementServer));
            }
            else {
                const server = this.getExtensionManagementServerToInstall(manifest);
                if (server) {
                    servers.push(server);
                }
            }
            if (!servers.length) {
                const error = new Error((0, nls_1.localize)('cannot be installed', "Cannot install the '{0}' extension because it is not available in this setup.", gallery.displayName || gallery.name));
                error.name = extensionManagement_1.ExtensionManagementErrorCode.Unsupported;
                throw error;
            }
            if (!installOptions?.context?.[extensionManagement_1.EXTENSION_INSTALL_SYNC_CONTEXT]) {
                await this.checkForWorkspaceTrust(manifest, false);
            }
            if (!installOptions?.donotIncludePackAndDependencies) {
                await this.checkInstallingExtensionOnWeb(gallery, manifest);
            }
            return servers;
        }
        getExtensionManagementServerToInstall(manifest) {
            // Only local server
            if (this.servers.length === 1 && this.extensionManagementServerService.localExtensionManagementServer) {
                return this.extensionManagementServerService.localExtensionManagementServer;
            }
            const extensionKind = this.extensionManifestPropertiesService.getExtensionKind(manifest);
            for (const kind of extensionKind) {
                if (kind === 'ui' && this.extensionManagementServerService.localExtensionManagementServer) {
                    return this.extensionManagementServerService.localExtensionManagementServer;
                }
                if (kind === 'workspace' && this.extensionManagementServerService.remoteExtensionManagementServer) {
                    return this.extensionManagementServerService.remoteExtensionManagementServer;
                }
                if (kind === 'web' && this.extensionManagementServerService.webExtensionManagementServer) {
                    return this.extensionManagementServerService.webExtensionManagementServer;
                }
            }
            // Local server can accept any extension. So return local server if not compatible server found.
            return this.extensionManagementServerService.localExtensionManagementServer;
        }
        isExtensionsSyncEnabled() {
            return this.userDataSyncEnablementService.isEnabled() && this.userDataSyncEnablementService.isResourceEnabled("extensions" /* SyncResource.Extensions */);
        }
        async hasToFlagExtensionsMachineScoped(extensions) {
            if (this.isExtensionsSyncEnabled()) {
                const { result } = await this.dialogService.prompt({
                    type: severity_1.default.Info,
                    message: extensions.length === 1 ? (0, nls_1.localize)('install extension', "Install Extension") : (0, nls_1.localize)('install extensions', "Install Extensions"),
                    detail: extensions.length === 1
                        ? (0, nls_1.localize)('install single extension', "Would you like to install and synchronize '{0}' extension across your devices?", extensions[0].displayName)
                        : (0, nls_1.localize)('install multiple extensions', "Would you like to install and synchronize extensions across your devices?"),
                    buttons: [
                        {
                            label: (0, nls_1.localize)({ key: 'install', comment: ['&& denotes a mnemonic'] }, "&&Install"),
                            run: () => false
                        },
                        {
                            label: (0, nls_1.localize)({ key: 'install and do no sync', comment: ['&& denotes a mnemonic'] }, "Install (Do &&not sync)"),
                            run: () => true
                        }
                    ],
                    cancelButton: {
                        run: () => {
                            throw new errors_1.CancellationError();
                        }
                    }
                });
                return result;
            }
            return false;
        }
        getExtensionsControlManifest() {
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.getExtensionsControlManifest();
            }
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                return this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getExtensionsControlManifest();
            }
            if (this.extensionManagementServerService.webExtensionManagementServer) {
                return this.extensionManagementServerService.webExtensionManagementServer.extensionManagementService.getExtensionsControlManifest();
            }
            return Promise.resolve({ malicious: [], deprecated: {}, search: [] });
        }
        getServer(extension) {
            if (extension.isWorkspaceScoped) {
                return this.getWorkspaceExtensionsServer();
            }
            return this.extensionManagementServerService.getExtensionManagementServer(extension);
        }
        getWorkspaceExtensionsServer() {
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                return this.extensionManagementServerService.remoteExtensionManagementServer;
            }
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                return this.extensionManagementServerService.localExtensionManagementServer;
            }
            if (this.extensionManagementServerService.webExtensionManagementServer) {
                return this.extensionManagementServerService.webExtensionManagementServer;
            }
            throw new Error('No extension server found');
        }
        async checkForWorkspaceTrust(manifest, requireTrust) {
            if (requireTrust || this.extensionManifestPropertiesService.getExtensionUntrustedWorkspaceSupportType(manifest) === false) {
                const buttons = [];
                buttons.push({ label: (0, nls_1.localize)('extensionInstallWorkspaceTrustButton', "Trust Workspace & Install"), type: 'ContinueWithTrust' });
                if (!requireTrust) {
                    buttons.push({ label: (0, nls_1.localize)('extensionInstallWorkspaceTrustContinueButton', "Install"), type: 'ContinueWithoutTrust' });
                }
                buttons.push({ label: (0, nls_1.localize)('extensionInstallWorkspaceTrustManageButton', "Learn More"), type: 'Manage' });
                const trustState = await this.workspaceTrustRequestService.requestWorkspaceTrust({
                    message: (0, nls_1.localize)('extensionInstallWorkspaceTrustMessage', "Enabling this extension requires a trusted workspace."),
                    buttons
                });
                if (trustState === undefined) {
                    throw new errors_1.CancellationError();
                }
            }
        }
        async checkInstallingExtensionOnWeb(extension, manifest) {
            if (this.servers.length !== 1 || this.servers[0] !== this.extensionManagementServerService.webExtensionManagementServer) {
                return;
            }
            const nonWebExtensions = [];
            if (manifest.extensionPack?.length) {
                const extensions = await this.extensionGalleryService.getExtensions(manifest.extensionPack.map(id => ({ id })), cancellation_1.CancellationToken.None);
                for (const extension of extensions) {
                    if (!(await this.servers[0].extensionManagementService.canInstall(extension))) {
                        nonWebExtensions.push(extension);
                    }
                }
                if (nonWebExtensions.length && nonWebExtensions.length === extensions.length) {
                    throw new extensionManagement_1.ExtensionManagementError('Not supported in Web', extensionManagement_1.ExtensionManagementErrorCode.Unsupported);
                }
            }
            const productName = (0, nls_1.localize)('VS Code for Web', "{0} for the Web", this.productService.nameLong);
            const virtualWorkspaceSupport = this.extensionManifestPropertiesService.getExtensionVirtualWorkspaceSupportType(manifest);
            const virtualWorkspaceSupportReason = (0, extensions_1.getWorkspaceSupportTypeMessage)(manifest.capabilities?.virtualWorkspaces);
            const hasLimitedSupport = virtualWorkspaceSupport === 'limited' || !!virtualWorkspaceSupportReason;
            if (!nonWebExtensions.length && !hasLimitedSupport) {
                return;
            }
            const limitedSupportMessage = (0, nls_1.localize)('limited support', "'{0}' has limited functionality in {1}.", extension.displayName || extension.identifier.id, productName);
            let message;
            let buttons = [];
            let detail;
            const installAnywayButton = {
                label: (0, nls_1.localize)({ key: 'install anyways', comment: ['&& denotes a mnemonic'] }, "&&Install Anyway"),
                run: () => { }
            };
            const showExtensionsButton = {
                label: (0, nls_1.localize)({ key: 'showExtensions', comment: ['&& denotes a mnemonic'] }, "&&Show Extensions"),
                run: () => this.instantiationService.invokeFunction(accessor => accessor.get(commands_1.ICommandService).executeCommand('extension.open', extension.identifier.id, 'extensionPack'))
            };
            if (nonWebExtensions.length && hasLimitedSupport) {
                message = limitedSupportMessage;
                detail = `${virtualWorkspaceSupportReason ? `${virtualWorkspaceSupportReason}\n` : ''}${(0, nls_1.localize)('non web extensions detail', "Contains extensions which are not supported.")}`;
                buttons = [
                    installAnywayButton,
                    showExtensionsButton
                ];
            }
            else if (hasLimitedSupport) {
                message = limitedSupportMessage;
                detail = virtualWorkspaceSupportReason || undefined;
                buttons = [installAnywayButton];
            }
            else {
                message = (0, nls_1.localize)('non web extensions', "'{0}' contains extensions which are not supported in {1}.", extension.displayName || extension.identifier.id, productName);
                buttons = [
                    installAnywayButton,
                    showExtensionsButton
                ];
            }
            await this.dialogService.prompt({
                type: severity_1.default.Info,
                message,
                detail,
                buttons,
                cancelButton: {
                    run: () => { throw new errors_1.CancellationError(); }
                }
            });
        }
        getTargetPlatform() {
            if (!this._targetPlatformPromise) {
                this._targetPlatformPromise = (0, extensionManagementUtil_1.computeTargetPlatform)(this.fileService, this.logService);
            }
            return this._targetPlatformPromise;
        }
        async cleanUp() {
            await Promise.allSettled(this.servers.map(server => server.extensionManagementService.cleanUp()));
        }
        toggleAppliationScope(extension, fromProfileLocation) {
            const server = this.getServer(extension);
            if (server) {
                return server.extensionManagementService.toggleAppliationScope(extension, fromProfileLocation);
            }
            throw new Error('Not Supported');
        }
        copyExtensions(from, to) {
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                throw new Error('Not Supported');
            }
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.copyExtensions(from, to);
            }
            if (this.extensionManagementServerService.webExtensionManagementServer) {
                return this.extensionManagementServerService.webExtensionManagementServer.extensionManagementService.copyExtensions(from, to);
            }
            return Promise.resolve();
        }
        registerParticipant() { throw new Error('Not Supported'); }
        installExtensionsFromProfile(extensions, fromProfileLocation, toProfileLocation) { throw new Error('Not Supported'); }
    };
    exports.ExtensionManagementService = ExtensionManagementService;
    exports.ExtensionManagementService = ExtensionManagementService = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, userDataProfile_1.IUserDataProfileService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, productService_1.IProductService),
        __param(5, download_1.IDownloadService),
        __param(6, userDataSync_1.IUserDataSyncEnablementService),
        __param(7, dialogs_1.IDialogService),
        __param(8, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(9, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(10, files_1.IFileService),
        __param(11, log_1.ILogService),
        __param(12, instantiation_1.IInstantiationService),
        __param(13, extensionsScannerService_1.IExtensionsScannerService),
        __param(14, telemetry_1.ITelemetryService)
    ], ExtensionManagementService);
    let WorkspaceExtensionsManagementService = class WorkspaceExtensionsManagementService extends lifecycle_1.Disposable {
        static { WorkspaceExtensionsManagementService_1 = this; }
        static { this.WORKSPACE_EXTENSIONS_KEY = 'workspaceExtensions.locations'; }
        constructor(fileService, logService, workspaceService, extensionsScannerService, storageService, uriIdentityService, telemetryService) {
            super();
            this.fileService = fileService;
            this.logService = logService;
            this.workspaceService = workspaceService;
            this.extensionsScannerService = extensionsScannerService;
            this.storageService = storageService;
            this.uriIdentityService = uriIdentityService;
            this.telemetryService = telemetryService;
            this._onDidChangeInvalidExtensions = this._register(new event_1.Emitter());
            this.onDidChangeInvalidExtensions = this._onDidChangeInvalidExtensions.event;
            this.extensions = [];
            this.invalidExtensionWatchers = this._register(new lifecycle_1.DisposableStore());
            this._register(event_1.Event.debounce(this.fileService.onDidFilesChange, (last, e) => {
                (last = last ?? []).push(e);
                return last;
            }, 1000)(events => {
                const changedInvalidExtensions = this.extensions.filter(extension => !extension.isValid && events.some(e => e.affects(extension.location)));
                if (changedInvalidExtensions.length) {
                    this.checkExtensionsValidity(changedInvalidExtensions);
                }
            }));
            this.initializePromise = this.initialize();
        }
        async initialize() {
            const existingLocations = this.getWorkspaceExtensionsLocations();
            if (!existingLocations.length) {
                return;
            }
            await Promise.allSettled(existingLocations.map(async (location) => {
                if (!this.workspaceService.isInsideWorkspace(location)) {
                    this.logService.info(`Removing the workspace extension ${location.toString()} as it is not inside the workspace`);
                    return;
                }
                if (!(await this.fileService.exists(location))) {
                    this.logService.info(`Removing the workspace extension ${location.toString()} as it does not exist`);
                    return;
                }
                try {
                    const extension = await this.scanWorkspaceExtension(location);
                    if (extension) {
                        this.extensions.push(extension);
                    }
                    else {
                        this.logService.info(`Skipping workspace extension ${location.toString()} as it does not exist`);
                    }
                }
                catch (error) {
                    this.logService.error('Skipping the workspace extension', location.toString(), error);
                }
            }));
            this.saveWorkspaceExtensions();
        }
        watchInvalidExtensions() {
            this.invalidExtensionWatchers.clear();
            for (const extension of this.extensions) {
                if (!extension.isValid) {
                    this.invalidExtensionWatchers.add(this.fileService.watch(extension.location));
                }
            }
        }
        async checkExtensionsValidity(extensions) {
            const validExtensions = [];
            await Promise.all(extensions.map(async (extension) => {
                const newExtension = await this.scanWorkspaceExtension(extension.location);
                if (newExtension?.isValid) {
                    validExtensions.push(newExtension);
                }
            }));
            let changed = false;
            for (const extension of validExtensions) {
                const index = this.extensions.findIndex(e => this.uriIdentityService.extUri.isEqual(e.location, extension.location));
                if (index !== -1) {
                    changed = true;
                    this.extensions.splice(index, 1, extension);
                }
            }
            if (changed) {
                this.saveWorkspaceExtensions();
                this._onDidChangeInvalidExtensions.fire(validExtensions);
            }
        }
        async getInstalled(includeInvalid) {
            await this.initializePromise;
            return this.extensions.filter(e => includeInvalid || e.isValid);
        }
        async install(extension) {
            await this.initializePromise;
            const workspaceExtension = await this.scanWorkspaceExtension(extension.location);
            if (!workspaceExtension) {
                throw new Error('Cannot install the extension as it does not exist.');
            }
            const existingExtensionIndex = this.extensions.findIndex(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier));
            if (existingExtensionIndex === -1) {
                this.extensions.push(workspaceExtension);
            }
            else {
                this.extensions.splice(existingExtensionIndex, 1, workspaceExtension);
            }
            this.saveWorkspaceExtensions();
            this.telemetryService.publicLog2('workspaceextension:install');
            return workspaceExtension;
        }
        async uninstall(extension) {
            await this.initializePromise;
            const existingExtensionIndex = this.extensions.findIndex(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier));
            if (existingExtensionIndex !== -1) {
                this.extensions.splice(existingExtensionIndex, 1);
                this.saveWorkspaceExtensions();
            }
            this.telemetryService.publicLog2('workspaceextension:uninstall');
        }
        getWorkspaceExtensionsLocations() {
            const locations = [];
            try {
                const parsed = JSON.parse(this.storageService.get(WorkspaceExtensionsManagementService_1.WORKSPACE_EXTENSIONS_KEY, 1 /* StorageScope.WORKSPACE */, '[]'));
                if (Array.isArray(locations)) {
                    for (const location of parsed) {
                        if ((0, types_1.isString)(location)) {
                            if (this.workspaceService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                                locations.push(this.workspaceService.getWorkspace().folders[0].toResource(location));
                            }
                            else {
                                this.logService.warn(`Invalid value for 'extensions' in workspace storage: ${location}`);
                            }
                        }
                        else {
                            locations.push(uri_1.URI.revive(location));
                        }
                    }
                }
                else {
                    this.logService.warn(`Invalid value for 'extensions' in workspace storage: ${locations}`);
                }
            }
            catch (error) {
                this.logService.warn(`Error parsing workspace extensions locations: ${(0, errors_1.getErrorMessage)(error)}`);
            }
            return locations;
        }
        saveWorkspaceExtensions() {
            const locations = this.extensions.map(extension => extension.location);
            if (this.workspaceService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                this.storageService.store(WorkspaceExtensionsManagementService_1.WORKSPACE_EXTENSIONS_KEY, JSON.stringify((0, arrays_1.coalesce)(locations
                    .map(location => this.uriIdentityService.extUri.relativePath(this.workspaceService.getWorkspace().folders[0].uri, location)))), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.store(WorkspaceExtensionsManagementService_1.WORKSPACE_EXTENSIONS_KEY, JSON.stringify(locations), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            this.watchInvalidExtensions();
        }
        async scanWorkspaceExtension(location) {
            const scannedExtension = await this.extensionsScannerService.scanExistingExtension(location, 1 /* ExtensionType.User */, { includeInvalid: true });
            return scannedExtension ? this.toLocalWorkspaceExtension(scannedExtension) : null;
        }
        async toLocalWorkspaceExtension(extension) {
            const stat = await this.fileService.resolve(extension.location);
            let readmeUrl;
            let changelogUrl;
            if (stat.children) {
                readmeUrl = stat.children.find(({ name }) => /^readme(\.txt|\.md|)$/i.test(name))?.resource;
                changelogUrl = stat.children.find(({ name }) => /^changelog(\.txt|\.md|)$/i.test(name))?.resource;
            }
            const validations = [...extension.validations];
            let isValid = extension.isValid;
            if (extension.manifest.main) {
                if (!(await this.fileService.exists(this.uriIdentityService.extUri.joinPath(extension.location, extension.manifest.main)))) {
                    isValid = false;
                    validations.push([severity_1.default.Error, (0, nls_1.localize)('main.notFound', "Cannot activate, becase {0} not found", extension.manifest.main)]);
                }
            }
            return {
                identifier: extension.identifier,
                type: extension.type,
                isBuiltin: extension.isBuiltin || !!extension.metadata?.isBuiltin,
                location: extension.location,
                manifest: extension.manifest,
                targetPlatform: extension.targetPlatform,
                validations,
                isValid,
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
                isWorkspaceScoped: true,
                source: 'resource'
            };
        }
    };
    WorkspaceExtensionsManagementService = WorkspaceExtensionsManagementService_1 = __decorate([
        __param(0, files_1.IFileService),
        __param(1, log_1.ILogService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, extensionsScannerService_1.IExtensionsScannerService),
        __param(4, storage_1.IStorageService),
        __param(5, uriIdentity_1.IUriIdentityService),
        __param(6, telemetry_1.ITelemetryService)
    ], WorkspaceExtensionsManagementService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuYWdlbWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25NYW5hZ2VtZW50L2NvbW1vbi9leHRlbnNpb25NYW5hZ2VtZW50U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBd0N6RixJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEyQixTQUFRLHNCQUFVO1FBeUJ6RCxZQUNvQyxnQ0FBc0YsRUFDL0YsdUJBQWtFLEVBQ25FLHNCQUFnRSxFQUNsRSxvQkFBOEQsRUFDcEUsY0FBa0QsRUFDakQsZUFBb0QsRUFDdEMsNkJBQThFLEVBQzlGLGFBQThDLEVBQy9CLDRCQUE0RSxFQUN0RSxrQ0FBd0YsRUFDL0csV0FBMEMsRUFDM0MsVUFBd0MsRUFDOUIsb0JBQTRELEVBQ3hELHdCQUFvRSxFQUM1RSxnQkFBb0Q7WUFFdkUsS0FBSyxFQUFFLENBQUM7WUFoQjhDLHFDQUFnQyxHQUFoQyxnQ0FBZ0MsQ0FBbUM7WUFDOUUsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUNsRCwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQy9DLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDakQsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQzlCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUNyQixrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQWdDO1lBQzdFLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUNkLGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBK0I7WUFDckQsdUNBQWtDLEdBQWxDLGtDQUFrQyxDQUFxQztZQUM5RixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUMxQixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2Is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