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
define(["require", "exports", "vs/base/browser/window", "vs/base/common/network", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/log/browser/log", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/product/common/productService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/common/remoteExtensionsScanner", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/browser/webWorkerExtensionHost", "vs/workbench/services/extensions/browser/webWorkerFileSystemProvider", "vs/workbench/services/extensions/common/abstractExtensionService", "vs/workbench/services/extensions/common/extensionHostKind", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/services/extensions/common/extensionRunningLocationTracker", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsProposedApi", "vs/workbench/services/extensions/common/extensionsUtil", "vs/workbench/services/extensions/common/remoteExtensionHost", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/remote/common/remoteExplorerService", "vs/workbench/services/userData/browser/userDataInit", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, window_1, network_1, configuration_1, dialogs_1, files_1, extensions_1, instantiation_1, log_1, log_2, notification_1, productService_1, remoteAuthorityResolver_1, remoteExtensionsScanner_1, telemetry_1, workspace_1, workspaceTrust_1, environmentService_1, extensionManagement_1, webWorkerExtensionHost_1, webWorkerFileSystemProvider_1, abstractExtensionService_1, extensionHostKind_1, extensionManifestPropertiesService_1, extensionRunningLocationTracker_1, extensions_2, extensionsProposedApi_1, extensionsUtil_1, remoteExtensionHost_1, lifecycle_1, remoteAgentService_1, remoteExplorerService_1, userDataInit_1, userDataProfile_1) {
    "use strict";
    var BrowserExtensionHostKindPicker_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserExtensionHostKindPicker = exports.ExtensionService = void 0;
    let ExtensionService = class ExtensionService extends abstractExtensionService_1.AbstractExtensionService {
        constructor(instantiationService, notificationService, _browserEnvironmentService, telemetryService, extensionEnablementService, fileService, productService, extensionManagementService, contextService, configurationService, extensionManifestPropertiesService, _webExtensionsScannerService, logService, remoteAgentService, remoteExtensionsScannerService, lifecycleService, remoteAuthorityResolverService, _userDataInitializationService, _userDataProfileService, _workspaceTrustManagementService, _remoteExplorerService, dialogService) {
            const extensionsProposedApi = instantiationService.createInstance(extensionsProposedApi_1.ExtensionsProposedApi);
            const extensionHostFactory = new BrowserExtensionHostFactory(extensionsProposedApi, () => this._scanWebExtensions(), () => this._getExtensionRegistrySnapshotWhenReady(), instantiationService, remoteAgentService, remoteAuthorityResolverService, extensionEnablementService, logService);
            super(extensionsProposedApi, extensionHostFactory, new BrowserExtensionHostKindPicker(logService), instantiationService, notificationService, _browserEnvironmentService, telemetryService, extensionEnablementService, fileService, productService, extensionManagementService, contextService, configurationService, extensionManifestPropertiesService, logService, remoteAgentService, remoteExtensionsScannerService, lifecycleService, remoteAuthorityResolverService, dialogService);
            this._browserEnvironmentService = _browserEnvironmentService;
            this._webExtensionsScannerService = _webExtensionsScannerService;
            this._userDataInitializationService = _userDataInitializationService;
            this._userDataProfileService = _userDataProfileService;
            this._workspaceTrustManagementService = _workspaceTrustManagementService;
            this._remoteExplorerService = _remoteExplorerService;
            // Initialize installed extensions first and do it only after workbench is ready
            lifecycleService.when(2 /* LifecyclePhase.Ready */).then(async () => {
                await this._userDataInitializationService.initializeInstalledExtensions(this._instantiationService);
                this._initialize();
            });
            this._initFetchFileSystem();
        }
        async _scanSingleExtension(extension) {
            if (extension.location.scheme === network_1.Schemas.vscodeRemote) {
                return this._remoteExtensionsScannerService.scanSingleExtension(extension.location, extension.type === 0 /* ExtensionType.System */);
            }
            const scannedExtension = await this._webExtensionsScannerService.scanExistingExtension(extension.location, extension.type, this._userDataProfileService.currentProfile.extensionsResource);
            if (scannedExtension) {
                return (0, extensions_2.toExtensionDescription)(scannedExtension);
            }
            return null;
        }
        _initFetchFileSystem() {
            const provider = new webWorkerFileSystemProvider_1.FetchFileSystemProvider();
            this._register(this._fileService.registerProvider(network_1.Schemas.http, provider));
            this._register(this._fileService.registerProvider(network_1.Schemas.https, provider));
        }
        async _scanWebExtensions() {
            const system = [], user = [], development = [];
            try {
                await Promise.all([
                    this._webExtensionsScannerService.scanSystemExtensions().then(extensions => system.push(...extensions.map(e => (0, extensions_2.toExtensionDescription)(e)))),
                    this._webExtensionsScannerService.scanUserExtensions(this._userDataProfileService.currentProfile.extensionsResource, { skipInvalidExtensions: true }).then(extensions => user.push(...extensions.map(e => (0, extensions_2.toExtensionDescription)(e)))),
                    this._webExtensionsScannerService.scanExtensionsUnderDevelopment().then(extensions => development.push(...extensions.map(e => (0, extensions_2.toExtensionDescription)(e, true))))
                ]);
            }
            catch (error) {
                this._logService.error(error);
            }
            return (0, extensionsUtil_1.dedupExtensions)(system, user, development, this._logService);
        }
        async _resolveExtensionsDefault() {
            const [localExtensions, remoteExtensions] = await Promise.all([
                this._scanWebExtensions(),
                this._remoteExtensionsScannerService.scanExtensions()
            ]);
            return new abstractExtensionService_1.ResolvedExtensions(localExtensions, remoteExtensions, /*hasLocalProcess*/ false, /*allowRemoteExtensionsInLocalWebWorker*/ true);
        }
        async _resolveExtensions() {
            if (!this._browserEnvironmentService.expectsResolverExtension) {
                return this._resolveExtensionsDefault();
            }
            const remoteAuthority = this._environmentService.remoteAuthority;
            // Now that the canonical URI provider has been registered, we need to wait for the trust state to be
            // calculated. The trust state will be used while resolving the authority, however the resolver can
            // override the trust state through the resolver result.
            await this._workspaceTrustManagementService.workspaceResolved;
            let resolverResult;
            try {
                resolverResult = await this._resolveAuthorityInitial(remoteAuthority);
            }
            catch (err) {
                if (remoteAuthorityResolver_1.RemoteAuthorityResolverError.isHandled(err)) {
                    console.log(`Error handled: Not showing a notification for the error`);
                }
                this._remoteAuthorityResolverService._setResolvedAuthorityError(remoteAuthority, err);
                // Proceed with the local extension host
                return this._resolveExtensionsDefault();
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
            return this._resolveExtensionsDefault();
        }
        async _onExtensionHostExit(code) {
            // Dispose everything associated with the extension host
            this._doStopExtensionHosts();
            // If we are running extension tests, forward logs and exit code
            const automatedWindow = window_1.mainWindow;
            if (typeof automatedWindow.codeAutomationExit === 'function') {
                automatedWindow.codeAutomationExit(code, await (0, log_1.getLogs)(this._fileService, this._environmentService));
            }
        }
        async _resolveAuthority(remoteAuthority) {
            return this._resolveAuthorityOnExtensionHosts(2 /* ExtensionHostKind.LocalWebWorker */, remoteAuthority);
        }
    };
    exports.ExtensionService = ExtensionService;
    exports.ExtensionService = ExtensionService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notification_1.INotificationService),
        __param(2, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(5, files_1.IFileService),
        __param(6, productService_1.IProductService),
        __param(7, extensionManagement_1.IWorkbenchExtensionManagementService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(11, extensionManagement_1.IWebExtensionsScannerService),
        __param(12, log_2.ILogService),
        __param(13, remoteAgentService_1.IRemoteAgentService),
        __param(14, remoteExtensionsScanner_1.IRemoteExtensionsScannerService),
        __param(15, lifecycle_1.ILifecycleService),
        __param(16, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(17, userDataInit_1.IUserDataInitializationService),
        __param(18, userDataProfile_1.IUserDataProfileService),
        __param(19, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(20, remoteExplorerService_1.IRemoteExplorerService),
        __param(21, dialogs_1.IDialogService)
    ], ExtensionService);
    let BrowserExtensionHostFactory = class BrowserExtensionHostFactory {
        constructor(_extensionsProposedApi, _scanWebExtensions, _getExtensionRegistrySnapshotWhenReady, _instantiationService, _remoteAgentService, _remoteAuthorityResolverService, _extensionEnablementService, _logService) {
            this._extensionsProposedApi = _extensionsProposedApi;
            this._scanWebExtensions = _scanWebExtensions;
            this._getExtensionRegistrySnapshotWhenReady = _getExtensionRegistrySnapshotWhenReady;
            this._instantiationService = _instantiationService;
            this._remoteAgentService = _remoteAgentService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._extensionEnablementService = _extensionEnablementService;
            this._logService = _logService;
        }
        createExtensionHost(runningLocations, runningLocation, isInitialStart) {
            switch (runningLocation.kind) {
                case 1 /* ExtensionHostKind.LocalProcess */: {
                    return null;
                }
                case 2 /* ExtensionHostKind.LocalWebWorker */: {
                    const startup = (isInitialStart
                        ? 2 /* ExtensionHostStartup.EagerManualStart */
                        : 1 /* ExtensionHostStartup.EagerAutoStart */);
                    return this._instantiationService.createInstance(webWorkerExtensionHost_1.WebWorkerExtensionHost, runningLocation, startup, this._createLocalExtensionHostDataProvider(runningLocations, runningLocation, isInitialStart));
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
        _createLocalExtensionHostDataProvider(runningLocations, desiredRunningLocation, isInitialStart) {
            return {
                getInitData: async () => {
                    if (isInitialStart) {
                        // Here we load even extensions that would be disabled by workspace trust
                        const localExtensions = (0, abstractExtensionService_1.checkEnabledAndProposedAPI)(this._logService, this._extensionEnablementService, this._extensionsProposedApi, await this._scanWebExtensions(), /* ignore workspace trust */ true);
                        const runningLocation = runningLocations.computeRunningLocation(localExtensions, [], false);
                        const myExtensions = (0, extensionRunningLocationTracker_1.filterExtensionDescriptions)(localExtensions, runningLocation, extRunningLocation => desiredRunningLocation.equals(extRunningLocation));
                        const extensions = new extensions_2.ExtensionHostExtensions(0, localExtensions, myExtensions.map(extension => extension.identifier));
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
    BrowserExtensionHostFactory = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, remoteAgentService_1.IRemoteAgentService),
        __param(5, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(6, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(7, log_2.ILogService)
    ], BrowserExtensionHostFactory);
    let BrowserExtensionHostKindPicker = BrowserExtensionHostKindPicker_1 = class BrowserExtensionHostKindPicker {
        constructor(_logService) {
            this._logService = _logService;
        }
        pickExtensionHostKind(extensionId, extensionKinds, isInstalledLocally, isInstalledRemotely, preference) {
            const result = BrowserExtensionHostKindPicker_1.pickRunningLocation(extensionKinds, isInstalledLocally, isInstalledRemotely, preference);
            this._logService.trace(`pickRunningLocation for ${extensionId.value}, extension kinds: [${extensionKinds.join(', ')}], isInstalledLocally: ${isInstalledLocally}, isInstalledRemotely: ${isInstalledRemotely}, preference: ${(0, extensionHostKind_1.extensionRunningPreferenceToString)(preference)} => ${(0, extensionHostKind_1.extensionHostKindToString)(result)}`);
            return result;
        }
        static pickRunningLocation(extensionKinds, isInstalledLocally, isInstalledRemotely, preference) {
            const result = [];
            let canRunRemotely = false;
            for (const extensionKind of extensionKinds) {
                if (extensionKind === 'ui' && isInstalledRemotely) {
                    // ui extensions run remotely if possible (but only as a last resort)
                    if (preference === 2 /* ExtensionRunningPreference.Remote */) {
                        return 3 /* ExtensionHostKind.Remote */;
                    }
                    else {
                        canRunRemotely = true;
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
                if (extensionKind === 'web' && (isInstalledLocally || isInstalledRemotely)) {
                    // web worker extensions run in the local web worker if possible
                    if (preference === 0 /* ExtensionRunningPreference.None */ || preference === 1 /* ExtensionRunningPreference.Local */) {
                        return 2 /* ExtensionHostKind.LocalWebWorker */;
                    }
                    else {
                        result.push(2 /* ExtensionHostKind.LocalWebWorker */);
                    }
                }
            }
            if (canRunRemotely) {
                result.push(3 /* ExtensionHostKind.Remote */);
            }
            return (result.length > 0 ? result[0] : null);
        }
    };
    exports.BrowserExtensionHostKindPicker = BrowserExtensionHostKindPicker;
    exports.BrowserExtensionHostKindPicker = BrowserExtensionHostKindPicker = BrowserExtensionHostKindPicker_1 = __decorate([
        __param(0, log_2.ILogService)
    ], BrowserExtensionHostKindPicker);
    (0, extensions_1.registerSingleton)(extensions_2.IExtensionService, ExtensionService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvYnJvd3Nlci9leHRlbnNpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF5Q3pGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsbURBQXdCO1FBRTdELFlBQ3dCLG9CQUEyQyxFQUM1QyxtQkFBeUMsRUFDVCwwQkFBK0QsRUFDbEcsZ0JBQW1DLEVBQ2hCLDBCQUFnRSxFQUN4RixXQUF5QixFQUN0QixjQUErQixFQUNWLDBCQUFnRSxFQUM1RSxjQUF3QyxFQUMzQyxvQkFBMkMsRUFDN0Isa0NBQXVFLEVBQzdELDRCQUEwRCxFQUM1RixVQUF1QixFQUNmLGtCQUF1QyxFQUMzQiw4QkFBK0QsRUFDN0UsZ0JBQW1DLEVBQ3JCLDhCQUErRCxFQUMvQyw4QkFBOEQsRUFDckUsdUJBQWdELEVBQ3ZDLGdDQUFrRSxFQUM1RSxzQkFBOEMsRUFDdkUsYUFBNkI7WUFFN0MsTUFBTSxxQkFBcUIsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNkNBQXFCLENBQUMsQ0FBQztZQUN6RixNQUFNLG9CQUFvQixHQUFHLElBQUksMkJBQTJCLENBQzNELHFCQUFxQixFQUNyQixHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsRUFDL0IsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHNDQUFzQyxFQUFFLEVBQ25ELG9CQUFvQixFQUNwQixrQkFBa0IsRUFDbEIsOEJBQThCLEVBQzlCLDBCQUEwQixFQUMxQixVQUFVLENBQ1YsQ0FBQztZQUNGLEtBQUssQ0FDSixxQkFBcUIsRUFDckIsb0JBQW9CLEVBQ3BCLElBQUksOEJBQThCLENBQUMs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