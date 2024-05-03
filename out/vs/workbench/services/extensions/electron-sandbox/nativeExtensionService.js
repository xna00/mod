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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/cancellation", "vs/base/common/network", "vs/base/common/performance", "vs/base/common/platform", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/native/common/native", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/common/remoteExtensionsScanner", "vs/platform/remote/common/remoteHosts", "vs/platform/request/common/request", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/browser/webWorkerExtensionHost", "vs/workbench/services/extensions/common/abstractExtensionService", "vs/workbench/services/extensions/common/extensionDevOptions", "vs/workbench/services/extensions/common/extensionHostKind", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/services/extensions/common/extensionRunningLocationTracker", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsProposedApi", "vs/workbench/services/extensions/common/remoteExtensionHost", "vs/workbench/services/extensions/electron-sandbox/cachedExtensionScanner", "vs/workbench/services/extensions/electron-sandbox/localProcessExtensionHost", "vs/workbench/services/host/browser/host", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/remote/common/remoteExplorerService"], function (require, exports, dom_1, window_1, cancellation_1, network_1, performance, platform_1, nls, actionCommonCategories_1, actions_1, commands_1, configuration_1, dialogs_1, extensionManagement_1, files_1, extensions_1, instantiation_1, log_1, native_1, notification_1, opener_1, productService_1, remoteAuthorityResolver_1, remoteExtensionsScanner_1, remoteHosts_1, request_1, telemetry_1, workspace_1, workspaceTrust_1, environmentService_1, extensionManagement_2, webWorkerExtensionHost_1, abstractExtensionService_1, extensionDevOptions_1, extensionHostKind_1, extensionManifestPropertiesService_1, extensionRunningLocationTracker_1, extensions_2, extensionsProposedApi_1, remoteExtensionHost_1, cachedExtensionScanner_1, localProcessExtensionHost_1, host_1, lifecycle_1, remoteAgentService_1, remoteExplorerService_1) {
    "use strict";
    var NativeExtensionHostKindPicker_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeExtensionHostKindPicker = exports.NativeExtensionService = void 0;
    let NativeExtensionService = class NativeExtensionService extends abstractExtensionService_1.AbstractExtensionService {
        constructor(instantiationService, notificationService, environmentService, telemetryService, extensionEnablementService, fileService, productService, extensionManagementService, contextService, configurationService, extensionManifestPropertiesService, logService, remoteAgentService, remoteExtensionsScannerService, lifecycleService, remoteAuthorityResolverService, _nativeHostService, _hostService, _remoteExplorerService, _extensionGalleryService, _workspaceTrustManagementService, dialogService) {
            const extensionsProposedApi = instantiationService.createInstance(extensionsProposedApi_1.ExtensionsProposedApi);
            const extensionScanner = instantiationService.createInstance(cachedExtensionScanner_1.CachedExtensionScanner);
            const extensionHostFactory = new NativeExtensionHostFactory(extensionsProposedApi, extensionScanner, () => this._getExtensionRegistrySnapshotWhenReady(), instantiationService, environmentService, extensionEnablementService, configurationService, remoteAgentService, remoteAuthorityResolverService, logService);
            super(extensionsProposedApi, extensionHostFactory, new NativeExtensionHostKindPicker(environmentService, configurationService, logService), instantiationService, notificationService, environmentService, telemetryService, extensionEnablementService, fileService, productService, extensionManagementService, contextService, configurationService, extensionManifestPropertiesService, logService, remoteAgentService, remoteExtensionsScannerService, lifecycleService, remoteAuthorityResolverService, dialogService);
            this._nativeHostService = _nativeHostService;
            this._hostService = _hostService;
            this._remoteExplorerService = _remoteExplorerService;
            this._extensionGalleryService = _extensionGalleryService;
            this._workspaceTrustManagementService = _workspaceTrustManagementService;
            this._localCrashTracker = new abstractExtensionService_1.ExtensionHostCrashTracker();
            this._extensionScanner = extensionScanner;
            // delay extension host creation and extension scanning
            // until the workbench is running. we cannot defer the
            // extension host more (LifecyclePhase.Restored) because
            // some editors require the extension host to restore
            // and this would result in a deadlock
            // see https://github.com/microsoft/vscode/issues/41322
            lifecycleService.when(2 /* LifecyclePhase.Ready */).then(() => {
                // reschedule to ensure this runs after restoring viewlets, panels, and editors
                (0, dom_1.runWhenWindowIdle)(window_1.mainWindow, () => {
                    this._initialize();
                }, 50 /*max delay*/);
            });
        }
        _scanSingleExtension(extension) {
            if (extension.location.scheme === network_1.Schemas.vscodeRemote) {
                return this._remoteExtensionsScannerService.scanSingleExtension(extension.location, extension.type === 0 /* ExtensionType.System */);
            }
            return this._extensionScanner.scanSingleExtension(extension.location.fsPath, extension.type === 0 /* ExtensionType.System */);
        }
        async _scanAllLocalExtensions() {
            return this._extensionScanner.scannedExtensions;
        }
        _onExtensionHostCrashed(extensionHost, code, signal) {
            const activatedExtensions = [];
            const extensionsStatus = this.getExtensionsStatus();
            for (const key of Object.keys(extensionsStatus)) {
                const extensionStatus = extensionsStatus[key];
                if (extensionStatus.activationStarted && extensionHost.containsExtension(extensionStatus.id)) {
                    activatedExtensions.push(extensionStatus.id);
                }
            }
            super._onExtensionHostCrashed(extensionHost, code, signal);
            if (extensionHost.kind === 1 /* ExtensionHostKind.LocalProcess */) {
                if (code === 55 /* ExtensionHostExitCode.VersionMismatch */) {
                    this._notificationService.prompt(notification_1.Severity.Error, nls.localize('extensionService.versionMismatchCrash', "Extension host cannot start: version mismatch."), [{
                            label: nls.localize('relaunch', "Relaunch VS Code"),
                            run: () => {
                                this._instantiationService.invokeFunction((accessor) => {
                                    const hostService = accessor.get(host_1.IHostService);
                                    hostService.restart();
                                });
                            }
                        }]);
                    return;
                }
                this._logExtensionHostCrash(extensionHost);
                this._sendExtensionHostCrashTelemetry(code, signal, activatedExtensions);
                this._localCrashTracker.registerCrash();
                if (this._localCrashTracker.shouldAutomaticallyRestart()) {
                    this._logService.info(`Automatically restarting the extension host.`);
                    this._notificationService.status(nls.localize('extensionService.autoRestart', "The extension host terminated unexpectedly. Restarting..."), { hideAfter: 5000 });
                    this.startExtensionHosts();
                }
                else {
                    const choices = [];
                    if (this._environmentService.isBuilt) {
                        choices.push({
                            label: nls.localize('startBisect', "Start Extension Bisect"),
                            run: () => {
                                this._instantiationService.invokeFunction(accessor => {
                                    const commandService = accessor.get(commands_1.ICommandService);
                                    commandService.executeCommand('extension.bisect.start');
                                });
                            }
                        });
                    }
                    else {
                        choices.push({
                            label: nls.localize('devTools', "Open Developer Tools"),
                            run: () => this._nativeHostService.openDevTools()
                        });
                    }
                    choices.push({
                        label: nls.localize('restart', "Restart Extension Host"),
                        run: () => this.startExtensionHosts()
                    });
                    if (this._environmentService.isBuilt) {
                        choices.push({
                            label: nls.localize('learnMore', "Learn More"),
                            run: () => {
                                this._instantiationService.invokeFunction(accessor => {
                                    const openerService = accessor.get(opener_1.IOpenerService);
                                    openerService.open('https://aka.ms/vscode-extension-bisect');
                                });
                            }
                        });
                    }
                    this._notificationService.prompt(notification_1.Severity.Error, nls.localize('extensionService.crash', "Extension host terminated unexpectedly 3 times within the last 5 minutes."), choices);
                }
            }
        }
        _sendExtensionHostCrashTelemetry(code, signal, activatedExtensions) {
            this._telemetryService.publicLog2('extensionHostCrash', {
                code,
                signal,
                extensionIds: activatedExtensions.map(e => e.value)
            });
            for (const extensionId of activatedExtensions) {
                this._telemetryService.publicLog2('extensionHostCrashExtension', {
                    code,
                    signal,
                    extensionId: extensionId.value
                });
            }
        }
        // --- impl
        async _resolveAuthority(remoteAuthority) {
            const authorityPlusIndex = remoteAuthority.indexOf('+');
            if (authorityPlusIndex === -1) {
                // This authority does not need to be resolved, simply parse the port number
                const { host, port } = (0, remoteHosts_1.parseAuthorityWithPort)(remoteAuthority);
                return {
                    authority: {
                        authority: remoteAuthority,
                        connectTo: {
                            type: 0 /* RemoteConnectionType.WebSocket */,
                            host,
                            port
                        },
                        connectionToken: undefined
                    }
                };
            }
            return this._resolveAuthorityOnExtensionHosts(1 /* ExtensionHostKind.LocalProcess */, remoteAuthority);
        }
        async _getCanonicalURI(remoteAuthority, uri) {
            const authorityPlusIndex = remoteAuthority.indexOf('+');
            if (authorityPlusIndex === -1) {
                // This authority does not use a resolver
                return uri;
            }
            const localProcessExtensionHosts = this._getExtensionHostManagers(1 /* ExtensionHostKind.LocalProcess */);
            if (localProcessExtensionHosts.length === 0) {
                // no local process extension hosts
                throw new Error(`Cannot resolve canonical URI`);
            }
            const results = await Promise.all(localProcessExtensionHosts.map(extHost => extHost.getCanonicalURI(remoteAuthority, uri)));
            for (const result of results) {
                if (result) {
                    return result;
                }
            }
            // we can only reach this if there was no resolver extension that can return the cannonical uri
            throw new Error(`Cannot get canonical URI because no extension is installed to resolve ${(0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(remoteAuthority)}`);
        }
        async _resolveExtensions() {
            this._extensionScanner.startScanningExtensions();
            const remoteAuthority = this._environmentService.remoteAuthority;
            let remoteEnv = null;
            let remoteExtensions = [];
            if (remoteAuthority) {
                this._remoteAuthorityResolverService._setCanonicalURIProvider(async (uri) => {
                    if (uri.scheme !== network_1.Schemas.vscodeRemote || uri.authority !== remoteAuthority) {
                        // The current remote authority resolver cannot give the canonical URI for this URI
                        return uri;
                    }
                    performance.mark(`code/willGetCanonicalURI/${(0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(remoteAuthority)}`);
                    if (platform_1.isCI) {
                        this._logService.info(`Invoking getCanonicalURI for authority ${(0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(remoteAuthority)}...`);
                    }
                    try {
                        return this._getCanonicalURI(remoteAuthority, uri);
                    }
                    finally {
                        performance.mark(`code/didGetCanonicalURI/${(0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(remoteAuthority)}`);
                        if (platform_1.isCI) {
                            this._logService.info(`getCanonicalURI returned for authority ${(0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(remoteAuthority)}.`);
                        }
                    }
                });
                if (platform_1.isCI) {
                    this._logService.info(`Starting to wait on IWorkspaceTrustManagementService.workspaceResolved...`);
                }
                // Now that the canonical URI provider has been registered, we need to wait for the trust state to be
                // calculated. The trust state will be used while resolving the authority, however the resolver can
                // override the trust state through the resolver result.
                await this._workspaceTrustManagementService.workspaceResolved;
                if (platform_1.isCI) {
                    this._logService.info(`Finished waiting on IWorkspaceTrustManagementService.workspaceResolved.`);
                }
                let resolverResult;
                try {
                    resolverResult = await this._resolveAuthorityInitial(remoteAuthority);
                }
                catch (err) {
                    if (remoteAuthorityResolver_1.RemoteAuthorityResolverError.isNoResolverFound(err)) {
                        err.isHandled = await this._handleNoResolverFound(remoteAuthority);
                    }
                    else {
                        if (remoteAuthorityResolver_1.RemoteAuthorityResolverError.isHandled(err)) {
                            console.log(`Error handled: Not showing a notification for the error`);
                        }
                    }
                    this._remoteAuthorityResolverService._setResolvedAuthorityError(remoteAuthority, err);
                    // Proceed with the local extension host
                    return this._startLocalExtensionHost();
                }
                // set the resolved authority
                this._remoteAuthorityResolverService._setResolvedAuthority(resolverResult.authority, resolverResult.options);
                this._remoteExplorerService.setTunnelInformation(resolverResult.tunnelInformation);
                // monitor for breakage
                const connection = this._remoteAgentService.getConnection();
                if (connection) {
                    connection.onDidStateChange(async (e) => {
                        if (e.type === 0 /* PersistentConnectionEventType.ConnectionLost */) {
                            this._remoteAuthorityResolverService._clearResolvedAuthority(remoteAuthority);
                        }
                    });
                    connection.onReconnecting(() => this._resolveAuthorityAgain());
                }
                // fetch the remote environment
                [remoteEnv, remoteExtensions] = await Promise.all([
                    this._remoteAgentService.getEnvironment(),
                    this._remoteExtensionsScannerService.scanExtensions()
                ]);
                if (!remoteEnv) {
                    this._notificationService.notify({ severity: notification_1.Severity.Error, message: nls.localize('getEnvironmentFailure', "Could not fetch remote environment") });
                    // Proceed with the local extension host
                    return this._startLocalExtensionHost();
                }
                (0, request_1.updateProxyConfigurationsScope)(remoteEnv.useHostProxy ? 1 /* ConfigurationScope.APPLICATION */ : 2 /* ConfigurationScope.MACHINE */);
            }
            else {
                this._remoteAuthorityResolverService._setCanonicalURIProvider(async (uri) => uri);
            }
            return this._startLocalExtensionHost(remoteExtensions);
        }
        async _startLocalExtensionHost(remoteExtensions = []) {
            // Ensure that the workspace trust state has been fully initialized so
            // that the extension host can start with the correct set of extensions.
            await this._workspaceTrustManagementService.workspaceTrustInitialized;
            return new abstractExtensionService_1.ResolvedExtensions(await this._scanAllLocalExtensions(), remoteExtensions, /*hasLocalProcess*/ true, /*allowRemoteExtensionsInLocalWebWorker*/ false);
        }
        _onExtensionHostExit(code) {
            // Dispose everything associated with the extension host
            this._doStopExtensionHosts();
            // Dispose the management connection to avoid reconnecting after the extension host exits
            const connection = this._remoteAgentService.getConnection();
            connection?.dispose();
            if ((0, extensionDevOptions_1.parseExtensionDevOptions)(this._environmentService).isExtensionDevTestFromCli) {
                // When CLI testing make sure to exit with proper exit code
                if (platform_1.isCI) {
                    this._logService.info(`Asking native host service to exit with code ${code}.`);
                }
                this._nativeHostService.exit(code);
            }
            else {
                // Expected development extension termination: When the extension host goes down we also shutdown the window
                this._nativeHostService.closeWindow();
            }
        }
        async _handleNoResolverFound(remoteAuthority) {
            const remoteName = (0, remoteHosts_1.getRemoteName)(remoteAuthority);
            const recommendation = this._productService.remoteExtensionTips?.[remoteName];
            if (!recommendation) {
                return false;
            }
            const sendTelemetry = (userReaction) => {
                /* __GDPR__
                "remoteExtensionRecommendations:popup" : {
                    "owner": "sandy081",
                    "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "extensionId": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
                }
                */
                this._telemetryService.publicLog('remoteExtensionRecommendations:popup', { userReaction, extensionId: resolverExtensionId });
            };
            const resolverExtensionId = recommendation.extensionId;
            const allExtensions = await this._scanAllLocalExtensions();
            const extension = allExtensions.filter(e => e.identifier.value === resolverExtensionId)[0];
            if (extension) {
                if (!(0, abstractExtensionService_1.extensionIsEnabled)(this._logService, this._extensionEnablementService, extension, false)) {
                    const message = nls.localize('enableResolver', "Extension '{0}' is required to open the remote window.\nOK to enable?", recommendation.friendlyName);
                    this._notificationService.prompt(notification_1.Severity.Info, message, [{
                            label: nls.localize('enable', 'Enable and Reload'),
                            run: async () => {
                                sendTelemetry('enable');
                                await this._extensionEnablementService.setEnablement([(0, extensions_2.toExtension)(extension)], 8 /* EnablementState.EnabledGlobally */);
                                await this._hostService.reload();
                            }
                        }], {
                        sticky: true,
                        priority: notification_1.NotificationPriority.URGENT
                    });
                }
            }
            else {
                // Install the Extension and reload the window to handle.
                const message = nls.localize('installResolver', "Extension '{0}' is required to open the remote window.\nDo you want to install the extension?", recommendation.friendlyName);
                this._notificationService.prompt(notification_1.Severity.Info, message, [{
                        label: nls.localize('install', 'Install and Reload'),
                        run: async () => {
                            sendTelemetry('install');
                            const [galleryExtension] = await this._extensionGalleryService.getExtensions([{ id: resolverExtensionId }], cancellation_1.CancellationToken.None);
                            if (galleryExtension) {
                                await this._extensionManagementService.installFromGallery(galleryExtension);
                                await this._hostService.reload();
                            }
                            else {
                                this._notificationService.error(nls.localize('resolverExtensionNotFound', "`{0}` not found on marketplace"));
                            }
                        }
                    }], {
                    sticky: true,
                    priority: notification_1.NotificationPriority.URGENT,
                    onCancel: () => sendTelemetry('cancel')
                });
            }
            return true;
        }
    };
    exports.NativeExtensionService = NativeExtensionService;
    exports.NativeExtensionService = NativeExtensionService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notification_1.INotificationService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(5, files_1.IFileService),
        __param(6, productService_1.IProductService),
        __param(7, extensionManagement_2.IWorkbenchExtensionManagementService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(11, log_1.ILogService),
        __param(12, remoteAgentService_1.IRemoteAgentService),
        __param(13, remoteExtensionsScanner_1.IRemoteExtensionsScannerService),
        __param(14, lifecycle_1.ILifecycleService),
        __param(15, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(16, native_1.INativeHostService),
        __param(17, host_1.IHostService),
        __param(18, remoteExplorerService_1.IRemoteExplorerService),
        __param(19, extensionManagement_1.IExtensionGalleryService),
        __param(20, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(21, dialogs_1.IDialogService)
    ], NativeExtensionService);
    let NativeExtensionHostFactory = class NativeExtensionHostFactory {
        constructor(_extensionsProposedApi, _extensionScanner, _getExtensionRegistrySnapshotWhenReady, _instantiationService, environmentService, _extensionEnablementService, configurationService, _remoteAgentService, _remoteAuthorityResolverService, _logService) {
            this._extensionsProposedApi = _extensionsProposedApi;
            this._extensionScanner = _extensionScanner;
            this._getExtensionRegistrySnapshotWhenReady = _getExtensionRegistrySnapshotWhenReady;
            this._instantiationService = _instantiationService;
            this._extensionEnablementService = _extensionEnablementService;
            this._remoteAgentService = _remoteAgentService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._logService = _logService;
            this._webWorkerExtHostEnablement = determineLocalWebWorkerExtHostEnablement(environmentService, configurationService);
        }
        createExtensionHost(runningLocations, runningLocation, isInitialStart) {
            switch (runningLocation.kind) {
                case 1 /* ExtensionHostKind.LocalProcess */: {
                    const startup = (isInitialStart
                        ? 2 /* ExtensionHostStartup.EagerManualStart */
                        : 1 /* ExtensionHostStartup.EagerAutoStart */);
                    return this._instantiationService.createInstance(localProcessExtensionHost_1.NativeLocalProcessExtensionHost, runningLocation, startup, this._createLocalProcessExtensionHostDataProvider(runningLocations, isInitialStart, runningLocation));
                }
                case 2 /* ExtensionHostKind.LocalWebWorker */: {
                    if (this._webWorkerExtHostEnablement !== 0 /* LocalWebWorkerExtHostEnablement.Disabled */) {
                        const startup = (isInitialStart
                            ? (this._webWorkerExtHostEnablement === 2 /* LocalWebWorkerExtHostEnablement.Lazy */ ? 3 /* ExtensionHostStartup.Lazy */ : 2 /* ExtensionHostStartup.EagerManualStart */)
                            : 1 /* ExtensionHostStartup.EagerAutoStart */);
                        return this._instantiationService.createInstance(webWorkerExtensionHost_1.WebWorkerExtensionHost, runningLocation, startup, this._createWebWorkerExtensionHostDataProvider(runningLocations, runningLocation));
                    }
                    return null;
                }
                case 3 /* ExtensionHostKind.Remote */: {
                    const remoteAgentConnection = this._remoteAgentService.getConnection();
                    if (remoteAgentConnection) {
                        return this._instantiationService.createInstance(remoteExtensionHost_1.RemoteExtensionHost, runningLocation, this._createRemoteExtensionHostDataProvider(runningLocations, remoteAgentConnection.remoteAuthority));
                    }
                    return null;
                }
            }
        }
        _createLocalProcessExtensionHostDataProvider(runningLocations, isInitialStart, desiredRunningLocation) {
            return {
                getInitData: async () => {
                    if (isInitialStart) {
                        // Here we load even extensions that would be disabled by workspace trust
                        const scannedExtensions = await this._extensionScanner.scannedExtensions;
                        if (platform_1.isCI) {
                            this._logService.info(`NativeExtensionHostFactory._createLocalProcessExtensionHostDataProvider.scannedExtensions: ${scannedExtensions.map(ext => ext.identifier.value).join(',')}`);
                        }
                        const localExtensions = (0, abstractExtensionService_1.checkEnabledAndProposedAPI)(this._logService, this._extensionEnablementService, this._extensionsProposedApi, scannedExtensions, /* ignore workspace trust */ true);
                        if (platform_1.isCI) {
                            this._logService.info(`NativeExtensionHostFactory._createLocalProcessExtensionHostDataProvider.localExtensions: ${localExtensions.map(ext => ext.identifier.value).join(',')}`);
                        }
                        const runningLocation = runningLocations.computeRunningLocation(localExtensions, [], false);
                        const myExtensions = (0, extensionRunningLocationTracker_1.filterExtensionDescriptions)(localExtensions, runningLocation, extRunningLocation => desiredRunningLocation.equals(extRunningLocation));
                        const extensions = new extensions_2.ExtensionHostExtensions(0, localExtensions, myExtensions.map(extension => extension.identifier));
                        if (platform_1.isCI) {
                            this._logService.info(`NativeExtensionHostFactory._createLocalProcessExtensionHostDataProvider.myExtensions: ${myExtensions.map(ext => ext.identifier.value).join(',')}`);
                        }
                        return { extensions };
                    }
                    else {
                        // restart case
                        const snapshot = await this._getExtensionRegistrySnapshotWhenReady();
                        const myExtensions = runningLocations.filterByRunningLocation(snapshot.extensions, desiredRunningLocation);
                        const extensions = new extensions_2.ExtensionHostExtensions(snapshot.versionId, snapshot.extensions, myExtensions.map(extension => extension.identifier));
                        return { extensions };
                    }
                }
            };
        }
        _createWebWorkerExtensionHostDataProvider(runningLocations, desiredRunningLocation) {
            return {
                getInitData: async () => {
                    const snapshot = await this._getExtensionRegistrySnapshotWhenReady();
                    const myExtensions = runningLocations.filterByRunningLocation(snapshot.extensions, desiredRunningLocation);
                    const extensions = new extensions_2.ExtensionHostExtensions(snapshot.versionId, snapshot.extensions, myExtensions.map(extension => extension.identifier));
                    return { extensions };
                }
            };
        }
        _createRemoteExtensionHostDataProvider(runningLocations, remoteAuthority) {
            return {
                remoteAuthority: remoteAuthority,
                getInitData: async () => {
                    const snapshot = await this._getExtensionRegistrySnapshotWhenReady();
                    const remoteEnv = await this._remoteAgentService.getEnvironment();
                    if (!remoteEnv) {
                        throw new Error('Cannot provide init data for remote extension host!');
                    }
                    const myExtensions = runningLocations.filterByExtensionHostKind(snapshot.extensions, 3 /* ExtensionHostKind.Remote */);
                    const extensions = new extensions_2.ExtensionHostExtensions(snapshot.versionId, snapshot.extensions, myExtensions.map(extension => extension.identifier));
                    return {
                        connectionData: this._remoteAuthorityResolverService.getConnectionData(remoteAuthority),
                        pid: remoteEnv.pid,
                        appRoot: remoteEnv.appRoot,
                        extensionHostLogsPath: remoteEnv.extensionHostLogsPath,
                        globalStorageHome: remoteEnv.globalStorageHome,
                        workspaceStorageHome: remoteEnv.workspaceStorageHome,
                        extensions,
                    };
                }
            };
        }
    };
    NativeExtensionHostFactory = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, remoteAgentService_1.IRemoteAgentService),
        __param(8, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(9, log_1.ILogService)
    ], NativeExtensionHostFactory);
    function determineLocalWebWorkerExtHostEnablement(environmentService, configurationService) {
        if (environmentService.isExtensionDevelopment && environmentService.extensionDevelopmentKind?.some(k => k === 'web')) {
            return 1 /* LocalWebWorkerExtHostEnablement.Eager */;
        }
        else {
            const config = configurationService.getValue(extensions_2.webWorkerExtHostConfig);
            if (config === true) {
                return 1 /* LocalWebWorkerExtHostEnablement.Eager */;
            }
            else if (config === 'auto') {
                return 2 /* LocalWebWorkerExtHostEnablement.Lazy */;
            }
            else {
                return 0 /* LocalWebWorkerExtHostEnablement.Disabled */;
            }
        }
    }
    var LocalWebWorkerExtHostEnablement;
    (function (LocalWebWorkerExtHostEnablement) {
        LocalWebWorkerExtHostEnablement[LocalWebWorkerExtHostEnablement["Disabled"] = 0] = "Disabled";
        LocalWebWorkerExtHostEnablement[LocalWebWorkerExtHostEnablement["Eager"] = 1] = "Eager";
        LocalWebWorkerExtHostEnablement[LocalWebWorkerExtHostEnablement["Lazy"] = 2] = "Lazy";
    })(LocalWebWorkerExtHostEnablement || (LocalWebWorkerExtHostEnablement = {}));
    let NativeExtensionHostKindPicker = NativeExtensionHostKindPicker_1 = class NativeExtensionHostKindPicker {
        constructor(environmentService, configurationService, _logService) {
            this._logService = _logService;
            this._hasRemoteExtHost = Boolean(environmentService.remoteAuthority);
            const webWorkerExtHostEnablement = determineLocalWebWorkerExtHostEnablement(environmentService, configurationService);
            this._hasWebWorkerExtHost = (webWorkerExtHostEnablement !== 0 /* LocalWebWorkerExtHostEnablement.Disabled */);
        }
        pickExtensionHostKind(extensionId, extensionKinds, isInstalledLocally, isInstalledRemotely, preference) {
            const result = NativeExtensionHostKindPicker_1.pickExtensionHostKind(extensionKinds, isInstalledLocally, isInstalledRemotely, preference, this._hasRemoteExtHost, this._hasWebWorkerExtHost);
            this._logService.trace(`pickRunningLocation for ${extensionId.value}, extension kinds: [${extensionKinds.join(', ')}], isInstalledLocally: ${isInstalledLocally}, isInstalledRemotely: ${isInstalledRemotely}, preference: ${(0, extensionHostKind_1.extensionRunningPreferenceToString)(preference)} => ${(0, extensionHostKind_1.extensionHostKindToString)(result)}`);
            return result;
        }
        static pickExtensionHostKind(extensionKinds, isInstalledLocally, isInstalledRemotely, preference, hasRemoteExtHost, hasWebWorkerExtHost) {
            const result = [];
            for (const extensionKind of extensionKinds) {
                if (extensionKind === 'ui' && isInstalledLocally) {
                    // ui extensions run locally if possible
                    if (preference === 0 /* ExtensionRunningPreference.None */ || preference === 1 /* ExtensionRunningPreference.Local */) {
                        return 1 /* ExtensionHostKind.LocalProcess */;
                    }
                    else {
                        result.push(1 /* ExtensionHostKind.LocalProcess */);
                    }
                }
                if (extensionKind === 'workspace' && isInstalledRemotely) {
                    // workspace extensions run remotely if possible
                    if (preference === 0 /* ExtensionRunningPreference.None */ || preference === 2 /* ExtensionRunningPreference.Remote */) {
                        return 3 /* ExtensionHostKind.Remote */;
                    }
                    else {
                        result.push(3 /* ExtensionHostKind.Remote */);
                    }
                }
                if (extensionKind === 'workspace' && !hasRemoteExtHost) {
                    // workspace extensions also run locally if there is no remote
                    if (preference === 0 /* ExtensionRunningPreference.None */ || preference === 1 /* ExtensionRunningPreference.Local */) {
                        return 1 /* ExtensionHostKind.LocalProcess */;
                    }
                    else {
                        result.push(1 /* ExtensionHostKind.LocalProcess */);
                    }
                }
                if (extensionKind === 'web' && isInstalledLocally && hasWebWorkerExtHost) {
                    // web worker extensions run in the local web worker if possible
                    if (preference === 0 /* ExtensionRunningPreference.None */ || preference === 1 /* ExtensionRunningPreference.Local */) {
                        return 2 /* ExtensionHostKind.LocalWebWorker */;
                    }
                    else {
                        result.push(2 /* ExtensionHostKind.LocalWebWorker */);
                    }
                }
            }
            return (result.length > 0 ? result[0] : null);
        }
    };
    exports.NativeExtensionHostKindPicker = NativeExtensionHostKindPicker;
    exports.NativeExtensionHostKindPicker = NativeExtensionHostKindPicker = NativeExtensionHostKindPicker_1 = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, log_1.ILogService)
    ], NativeExtensionHostKindPicker);
    class RestartExtensionHostAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.restartExtensionHost',
                title: nls.localize2('restartExtensionHost', "Restart Extension Host"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const extensionService = accessor.get(extensions_2.IExtensionService);
            const stopped = await extensionService.stopExtensionHosts(nls.localize('restartExtensionHost.reason', "Restarting extension host on explicit request."));
            if (stopped) {
                extensionService.startExtensionHosts();
            }
        }
    }
    (0, actions_1.registerAction2)(RestartExtensionHostAction);
    (0, extensions_1.registerSingleton)(extensions_2.IExtensionService, NativeExtensionService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlRXh0ZW5zaW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvZWxlY3Ryb24tc2FuZGJveC9uYXRpdmVFeHRlbnNpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEwRHpGLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXVCLFNBQVEsbURBQXdCO1FBS25FLFlBQ3dCLG9CQUEyQyxFQUM1QyxtQkFBeUMsRUFDakMsa0JBQWdELEVBQzNELGdCQUFtQyxFQUNoQiwwQkFBZ0UsRUFDeEYsV0FBeUIsRUFDdEIsY0FBK0IsRUFDViwwQkFBZ0UsRUFDNUUsY0FBd0MsRUFDM0Msb0JBQTJDLEVBQzdCLGtDQUF1RSxFQUMvRixVQUF1QixFQUNmLGtCQUF1QyxFQUMzQiw4QkFBK0QsRUFDN0UsZ0JBQW1DLEVBQ3JCLDhCQUErRCxFQUM1RSxrQkFBdUQsRUFDN0QsWUFBMkMsRUFDakMsc0JBQStELEVBQzdELHdCQUFtRSxFQUMzRCxnQ0FBbUYsRUFDckcsYUFBNkI7WUFFN0MsTUFBTSxxQkFBcUIsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNkNBQXFCLENBQUMsQ0FBQztZQUN6RixNQUFNLGdCQUFnQixHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywrQ0FBc0IsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSwwQkFBMEIsQ0FDMUQscUJBQXFCLEVBQ3JCLGdCQUFnQixFQUNoQixHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0NBQXNDLEVBQUUsRUFDbkQsb0JBQW9CLEVBQ3BCLGtCQUFrQixFQUNsQiwwQkFBMEIsRUFDMUIsb0JBQW9CLEVBQ3BCLGtCQUFrQixFQUNsQiw4QkFBOEIs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