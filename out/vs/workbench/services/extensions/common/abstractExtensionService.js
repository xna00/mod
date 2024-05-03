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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/performance", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/stopwatch", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/extensionManagement/common/implicitActivationEvents", "vs/platform/extensions/common/extensions", "vs/platform/files/common/files", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/product/common/productService", "vs/platform/registry/common/platform", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/common/remoteExtensionsScanner", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensionDescriptionRegistry", "vs/workbench/services/extensions/common/extensionDevOptions", "vs/workbench/services/extensions/common/extensionHostManager", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/services/extensions/common/extensionRunningLocation", "vs/workbench/services/extensions/common/extensionRunningLocationTracker", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/extensions/common/lazyCreateExtensionHostManager", "vs/workbench/services/extensions/common/workspaceContains", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, async_1, errorMessage_1, event_1, htmlContent_1, lifecycle_1, network_1, perf, platform_1, resources_1, stopwatch_1, nls, configuration_1, dialogs_1, implicitActivationEvents_1, extensions_1, files_1, descriptors_1, instantiation_1, lifecycle_2, log_1, notification_1, productService_1, platform_2, remoteAuthorityResolver_1, remoteExtensionsScanner_1, telemetry_1, workspace_1, environmentService_1, extensionFeatures_1, extensionManagement_1, extensionDescriptionRegistry_1, extensionDevOptions_1, extensionHostManager_1, extensionManifestPropertiesService_1, extensionRunningLocation_1, extensionRunningLocationTracker_1, extensions_2, extensionsRegistry_1, lazyCreateExtensionHostManager_1, workspaceContains_1, lifecycle_3, remoteAgentService_1) {
    "use strict";
    var AbstractExtensionService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ImplicitActivationAwareReader = exports.ExtensionHostCrashTracker = exports.ExtensionStatus = exports.ResolvedExtensions = exports.AbstractExtensionService = void 0;
    exports.checkEnabledAndProposedAPI = checkEnabledAndProposedAPI;
    exports.filterEnabledExtensions = filterEnabledExtensions;
    exports.extensionIsEnabled = extensionIsEnabled;
    const hasOwnProperty = Object.hasOwnProperty;
    const NO_OP_VOID_PROMISE = Promise.resolve(undefined);
    let AbstractExtensionService = AbstractExtensionService_1 = class AbstractExtensionService extends lifecycle_1.Disposable {
        constructor(_extensionsProposedApi, _extensionHostFactory, _extensionHostKindPicker, _instantiationService, _notificationService, _environmentService, _telemetryService, _extensionEnablementService, _fileService, _productService, _extensionManagementService, _contextService, _configurationService, _extensionManifestPropertiesService, _logService, _remoteAgentService, _remoteExtensionsScannerService, _lifecycleService, _remoteAuthorityResolverService, _dialogService) {
            super();
            this._extensionsProposedApi = _extensionsProposedApi;
            this._extensionHostFactory = _extensionHostFactory;
            this._extensionHostKindPicker = _extensionHostKindPicker;
            this._instantiationService = _instantiationService;
            this._notificationService = _notificationService;
            this._environmentService = _environmentService;
            this._telemetryService = _telemetryService;
            this._extensionEnablementService = _extensionEnablementService;
            this._fileService = _fileService;
            this._productService = _productService;
            this._extensionManagementService = _extensionManagementService;
            this._contextService = _contextService;
            this._configurationService = _configurationService;
            this._extensionManifestPropertiesService = _extensionManifestPropertiesService;
            this._logService = _logService;
            this._remoteAgentService = _remoteAgentService;
            this._remoteExtensionsScannerService = _remoteExtensionsScannerService;
            this._lifecycleService = _lifecycleService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._dialogService = _dialogService;
            this._onDidRegisterExtensions = this._register(new event_1.Emitter());
            this.onDidRegisterExtensions = this._onDidRegisterExtensions.event;
            this._onDidChangeExtensionsStatus = this._register(new event_1.Emitter());
            this.onDidChangeExtensionsStatus = this._onDidChangeExtensionsStatus.event;
            this._onDidChangeExtensions = this._register(new event_1.Emitter({ leakWarningThreshold: 400 }));
            this.onDidChangeExtensions = this._onDidChangeExtensions.event;
            this._onWillActivateByEvent = this._register(new event_1.Emitter());
            this.onWillActivateByEvent = this._onWillActivateByEvent.event;
            this._onDidChangeResponsiveChange = this._register(new event_1.Emitter());
            this.onDidChangeResponsiveChange = this._onDidChangeResponsiveChange.event;
            this._onWillStop = this._register(new event_1.Emitter());
            this.onWillStop = this._onWillStop.event;
            this._activationEventReader = new ImplicitActivationAwareReader();
            this._registry = new extensionDescriptionRegistry_1.LockableExtensionDescriptionRegistry(this._activationEventReader);
            this._installedExtensionsReady = new async_1.Barrier();
            this._extensionStatus = new extensions_1.ExtensionIdentifierMap();
            this._allRequestedActivateEvents = new Set();
            this._remoteCrashTracker = new ExtensionHostCrashTracker();
            this._deltaExtensionsQueue = [];
            this._inHandleDeltaExtensions = false;
            this._extensionHostManagers = [];
            this._resolveAuthorityAttempt = 0;
            // help the file service to activate providers by activating extensions by file system event
            this._register(this._fileService.onWillActivateFileSystemProvider(e => {
                if (e.scheme !== network_1.Schemas.vscodeRemote) {
                    e.join(this.activateByEvent(`onFileSystem:${e.scheme}`));
                }
            }));
            this._runningLocations = new extensionRunningLocationTracker_1.ExtensionRunningLocationTracker(this._registry, this._extensionHostKindPicker, this._environmentService, this._configurationService, this._logService, this._extensionManifestPropertiesService);
            this._register(this._extensionEnablementService.onEnablementChanged((extensions) => {
                const toAdd = [];
                const toRemove = [];
                for (const extension of extensions) {
                    if (this._safeInvokeIsEnabled(extension)) {
                        // an extension has been enabled
                        toAdd.push(extension);
                    }
                    else {
                        // an extension has been disabled
                        toRemove.push(extension);
                    }
                }
                if (platform_1.isCI) {
                    this._logService.info(`AbstractExtensionService.onEnablementChanged fired for ${extensions.map(e => e.identifier.id).join(', ')}`);
                }
                this._handleDeltaExtensions(new DeltaExtensionsQueueItem(toAdd, toRemove));
            }));
            this._register(this._extensionManagementService.onDidChangeProfile(({ added, removed }) => {
                if (added.length || removed.length) {
                    if (platform_1.isCI) {
                        this._logService.info(`AbstractExtensionService.onDidChangeProfile fired`);
                    }
                    this._handleDeltaExtensions(new DeltaExtensionsQueueItem(added, removed));
                }
            }));
            this._register(this._extensionManagementService.onDidEnableExtensions(extensions => {
                if (extensions.length) {
                    if (platform_1.isCI) {
                        this._logService.info(`AbstractExtensionService.onDidEnableExtensions fired`);
                    }
                    this._handleDeltaExtensions(new DeltaExtensionsQueueItem(extensions, []));
                }
            }));
            this._register(this._extensionManagementService.onDidInstallExtensions((result) => {
                const extensions = [];
                for (const { local, operation } of result) {
                    if (local && local.isValid && operation !== 4 /* InstallOperation.Migrate */ && this._safeInvokeIsEnabled(local)) {
                        extensions.push(local);
                    }
                }
                if (extensions.length) {
                    if (platform_1.isCI) {
                        this._logService.info(`AbstractExtensionService.onDidInstallExtensions fired for ${extensions.map(e => e.identifier.id).join(', ')}`);
                    }
                    this._handleDeltaExtensions(new DeltaExtensionsQueueItem(extensions, []));
                }
            }));
            this._register(this._extensionManagementService.onDidUninstallExtension((event) => {
                if (!event.error) {
                    // an extension has been uninstalled
                    if (platform_1.isCI) {
                        this._logService.info(`AbstractExtensionService.onDidUninstallExtension fired for ${event.identifier.id}`);
                    }
                    this._handleDeltaExtensions(new DeltaExtensionsQueueItem([], [event.identifier.id]));
                }
            }));
            this._register(this._lifecycleService.onDidShutdown(() => {
                // We need to disconnect the management connection before killing the local extension host.
                // Otherwise, the local extension host might terminate the underlying tunnel before the
                // management connection has a chance to send its disconnection message.
                const connection = this._remoteAgentService.getConnection();
                connection?.dispose();
                this._doStopExtensionHosts();
            }));
        }
        _getExtensionHostManagers(kind) {
            return this._extensionHostManagers.filter(extHostManager => extHostManager.kind === kind);
        }
        _getExtensionHostManagerByRunningLocation(runningLocation) {
            for (const extensionHostManager of this._extensionHostManagers) {
                if (extensionHostManager.representsRunningLocation(runningLocation)) {
                    return extensionHostManager;
                }
            }
            return null;
        }
        //#region deltaExtensions
        async _handleDeltaExtensions(item) {
            this._deltaExtensionsQueue.push(item);
            if (this._inHandleDeltaExtensions) {
                // Let the current item finish, the new one will be picked up
                return;
            }
            let lock = null;
            try {
                this._inHandleDeltaExtensions = true;
                // wait for _initialize to finish before hanlding any delta extension events
                await this._installedExtensionsReady.wait();
                lock = await this._registry.acquireLock('handleDeltaExtensions');
                while (this._deltaExtensionsQueue.length > 0) {
                    const item = this._deltaExtensionsQueue.shift();
                    await this._deltaExtensions(lock, item.toAdd, item.toRemove);
                }
            }
            finally {
                this._inHandleDeltaExtensions = false;
                lock?.dispose();
            }
        }
        async _deltaExtensions(lock, _toAdd, _toRemove) {
            if (platform_1.isCI) {
                this._logService.info(`AbstractExtensionService._deltaExtensions: toAdd: [${_toAdd.map(e => e.identifier.id).join(',')}] toRemove: [${_toRemove.map(e => typeof e === 'string' ? e : e.identifier.id).join(',')}]`);
            }
            let toRemove = [];
            for (let i = 0, len = _toRemove.length; i < len; i++) {
                const extensionOrId = _toRemove[i];
                const extensionId = (typeof extensionOrId === 'string' ? extensionOrId : extensionOrId.identifier.id);
                const extension = (typeof extensionOrId === 'string' ? null : extensionOrId);
                const extensionDescription = this._registry.getExtensionDescription(extensionId);
                if (!extensionDescription) {
                    // ignore disabling/uninstalling an extension which is not running
                    continue;
                }
                if (extension && extensionDescription.extensionLocation.scheme !== extension.location.scheme) {
                    // this event is for a different extension than mine (maybe for the local extension, while I have the remote extension)
                    continue;
                }
                if (!this.canRemoveExtension(extensionDescription)) {
                    // uses non-dynamic extension point or is activated
                    continue;
                }
                toRemove.push(extensionDescription);
            }
            const toAdd = [];
            for (let i = 0, len = _toAdd.length; i < len; i++) {
                const extension = _toAdd[i];
                const extensionDescription = await this._scanSingleExtension(extension);
                if (!extensionDescription) {
                    // could not scan extension...
                    continue;
                }
                if (!this._canAddExtension(extensionDescription, toRemove)) {
                    continue;
                }
                toAdd.push(extensionDescription);
            }
            if (toAdd.length === 0 && toRemove.length === 0) {
                return;
            }
            // Update the local registry
            const result = this._registry.deltaExtensions(lock, toAdd, toRemove.map(e => e.identifier));
            this._onDidChangeExtensions.fire({ added: toAdd, removed: toRemove });
            toRemove = toRemove.concat(result.removedDueToLooping);
            if (result.removedDueToLooping.length > 0) {
                this._notificationService.notify({
                    severity: notification_1.Severity.Error,
                    message: nls.localize('looping', "The following extensions contain dependency loops and have been disabled: {0}", result.removedDueToLooping.map(e => `'${e.identifier.value}'`).join(', '))
                });
            }
            // enable or disable proposed API per extension
            this._extensionsProposedApi.updateEnabledApiProposals(toAdd);
            // Update extension points
            this._doHandleExtensionPoints([].concat(toAdd).concat(toRemove));
            // Update the extension host
            await this._updateExtensionsOnExtHosts(result.versionId, toAdd, toRemove.map(e => e.identifier));
            for (let i = 0; i < toAdd.length; i++) {
                this._activateAddedExtensionIfNeeded(toAdd[i]);
            }
        }
        async _updateExtensionsOnExtHosts(versionId, toAdd, toRemove) {
            const removedRunningLocation = this._runningLocations.deltaExtensions(toAdd, toRemove);
            const promises = this._extensionHostManagers.map(extHostManager => this._updateExtensionsOnExtHost(extHostManager, versionId, toAdd, toRemove, removedRunningLocation));
            await Promise.all(promises);
        }
        async _updateExtensionsOnExtHost(extensionHostManager, versionId, toAdd, toRemove, removedRunningLocation) {
            const myToAdd = this._runningLocations.filterByExtensionHostManager(toAdd, extensionHostManager);
            const myToRemove = (0, extensionRunningLocationTracker_1.filterExtensionIdentifiers)(toRemove, removedRunningLocation, extRunningLocation => extensionHostManager.representsRunningLocation(extRunningLocation));
            const addActivationEvents = implicitActivationEvents_1.ImplicitActivationEvents.createActivationEventsMap(toAdd);
            if (platform_1.isCI) {
                const printExtIds = (extensions) => extensions.map(e => e.identifier.value).join(',');
                const printIds = (extensions) => extensions.map(e => e.value).join(',');
                this._logService.info(`AbstractExtensionService: Calling deltaExtensions: toRemove: [${printIds(toRemove)}], toAdd: [${printExtIds(toAdd)}], myToRemove: [${printIds(myToRemove)}], myToAdd: [${printExtIds(myToAdd)}],`);
            }
            await extensionHostManager.deltaExtensions({ versionId, toRemove, toAdd, addActivationEvents, myToRemove, myToAdd: myToAdd.map(extension => extension.identifier) });
        }
        canAddExtension(extension) {
            return this._canAddExtension(extension, []);
        }
        _canAddExtension(extension, extensionsBeingRemoved) {
            // (Also check for renamed extensions)
            const existing = this._registry.getExtensionDescriptionByIdOrUUID(extension.identifier, extension.id);
            if (existing) {
                // This extension is already known (most likely at a different version)
                // so it cannot be added again unless it is removed first
                const isBeingRemoved = extensionsBeingRemoved.some((extensionDescription) => extensions_1.ExtensionIdentifier.equals(extension.identifier, extensionDescription.identifier));
                if (!isBeingRemoved) {
                    return false;
                }
            }
            const extensionKinds = this._runningLocations.readExtensionKinds(extension);
            const isRemote = extension.extensionLocation.scheme === network_1.Schemas.vscodeRemote;
            const extensionHostKind = this._extensionHostKindPicker.pickExtensionHostKind(extension.identifier, extensionKinds, !isRemote, isRemote, 0 /* ExtensionRunningPreference.None */);
            if (extensionHostKind === null) {
                return false;
            }
            return true;
        }
        canRemoveExtension(extension) {
            const extensionDescription = this._registry.getExtensionDescription(extension.identifier);
            if (!extensionDescription) {
                // Can't remove an extension that is unknown!
                return false;
            }
            if (this._extensionStatus.get(extensionDescription.identifier)?.activationStarted) {
                // Extension is running, cannot remove it safely
                return false;
            }
            return true;
        }
        async _activateAddedExtensionIfNeeded(extensionDescription) {
            let shouldActivate = false;
            let shouldActivateReason = null;
            let hasWorkspaceContains = false;
            const activationEvents = this._activationEventReader.readActivationEvents(extensionDescription);
            for (const activationEvent of activationEvents) {
                if (this._allRequestedActivateEvents.has(activationEvent)) {
                    // This activation event was fired before the extension was added
                    shouldActivate = true;
                    shouldActivateReason = activationEvent;
                    break;
                }
                if (activationEvent === '*') {
                    shouldActivate = true;
                    shouldActivateReason = activationEvent;
                    break;
                }
                if (/^workspaceContains/.test(activationEvent)) {
                    hasWorkspaceContains = true;
                }
                if (activationEvent === 'onStartupFinished') {
                    shouldActivate = true;
                    shouldActivateReason = activationEvent;
                    break;
                }
            }
            if (shouldActivate) {
                await Promise.all(this._extensionHostManagers.map(extHostManager => extHostManager.activate(extensionDescription.identifier, { startup: false, extensionId: extensionDescription.identifier, activationEvent: shouldActivateReason }))).then(() => { });
            }
            else if (hasWorkspaceContains) {
                const workspace = await this._contextService.getCompleteWorkspace();
                const forceUsingSearch = !!this._environmentService.remoteAuthority;
                const host = {
                    logService: this._logService,
                    folders: workspace.folders.map(folder => folder.uri),
                    forceUsingSearch: forceUsingSearch,
                    exists: (uri) => this._fileService.exists(uri),
                    checkExists: (folders, includes, token) => this._instantiationService.invokeFunction((accessor) => (0, workspaceContains_1.checkGlobFileExists)(accessor, folders, includes, token))
                };
                const result = await (0, workspaceContains_1.checkActivateWorkspaceContainsExtension)(host, extensionDescription);
                if (!result) {
                    return;
                }
                await Promise.all(this._extensionHostManagers.map(extHostManager => extHostManager.activate(extensionDescription.identifier, { startup: false, extensionId: extensionDescription.identifier, activationEvent: result.activationEvent }))).then(() => { });
            }
        }
        //#endregion
        async _initialize() {
            perf.mark('code/willLoadExtensions');
            this._startExtensionHostsIfNecessary(true, []);
            const lock = await this._registry.acquireLock('_initialize');
            try {
                const resolvedExtensions = await this._resolveExtensions();
                this._processExtensions(lock, resolvedExtensions);
                // Start extension hosts which are not automatically started
                const snapshot = this._registry.getSnapshot();
                for (const extHostManager of this._extensionHostManagers) {
                    if (extHostManager.startup !== 1 /* ExtensionHostStartup.EagerAutoStart */) {
                        const extensions = this._runningLocations.filterByExtensionHostManager(snapshot.extensions, extHostManager);
                        extHostManager.start(snapshot.versionId, snapshot.extensions, extensions.map(extension => extension.identifier));
                    }
                }
            }
            finally {
                lock.dispose();
            }
            this._releaseBarrier();
            perf.mark('code/didLoadExtensions');
            await this._handleExtensionTests();
        }
        _processExtensions(lock, resolvedExtensions) {
            const { allowRemoteExtensionsInLocalWebWorker, hasLocalProcess } = resolvedExtensions;
            const localExtensions = checkEnabledAndProposedAPI(this._logService, this._extensionEnablementService, this._extensionsProposedApi, resolvedExtensions.local, false);
            let remoteExtensions = checkEnabledAndProposedAPI(this._logService, this._extensionEnablementService, this._extensionsProposedApi, resolvedExtensions.remote, false);
            // `initializeRunningLocation` will look at the complete picture (e.g. an extension installed on both sides),
            // takes care of duplicates and picks a running location for each extension
            this._runningLocations.initializeRunningLocation(localExtensions, remoteExtensions);
            this._startExtensionHostsIfNecessary(true, []);
            // Some remote extensions could run locally in the web worker, so store them
            const remoteExtensionsThatNeedToRunLocally = (allowRemoteExtensionsInLocalWebWorker ? this._runningLocations.filterByExtensionHostKind(remoteExtensions, 2 /* ExtensionHostKind.LocalWebWorker */) : []);
            const localProcessExtensions = (hasLocalProcess ? this._runningLocations.filterByExtensionHostKind(localExtensions, 1 /* ExtensionHostKind.LocalProcess */) : []);
            const localWebWorkerExtensions = this._runningLocations.filterByExtensionHostKind(localExtensions, 2 /* ExtensionHostKind.LocalWebWorker */);
            remoteExtensions = this._runningLocations.filterByExtensionHostKind(remoteExtensions, 3 /* ExtensionHostKind.Remote */);
            // Add locally the remote extensions that need to run locally in the web worker
            for (const ext of remoteExtensionsThatNeedToRunLocally) {
                if (!includes(localWebWorkerExtensions, ext.identifier)) {
                    localWebWorkerExtensions.push(ext);
                }
            }
            const allExtensions = remoteExtensions.concat(localProcessExtensions).concat(localWebWorkerExtensions);
            const result = this._registry.deltaExtensions(lock, allExtensions, []);
            if (result.removedDueToLooping.length > 0) {
                this._notificationService.notify({
                    severity: notification_1.Severity.Error,
                    message: nls.localize('looping', "The following extensions contain dependency loops and have been disabled: {0}", result.removedDueToLooping.map(e => `'${e.identifier.value}'`).join(', '))
                });
            }
            this._doHandleExtensionPoints(this._registry.getAllExtensionDescriptions());
        }
        async _handleExtensionTests() {
            if (!this._environmentService.isExtensionDevelopment || !this._environmentService.extensionTestsLocationURI) {
                return;
            }
            const extensionHostManager = this.findTestExtensionHost(this._environmentService.extensionTestsLocationURI);
            if (!extensionHostManager) {
                const msg = nls.localize('extensionTestError', "No extension host found that can launch the test runner at {0}.", this._environmentService.extensionTestsLocationURI.toString());
                console.error(msg);
                this._notificationService.error(msg);
                return;
            }
            let exitCode;
            try {
                exitCode = await extensionHostManager.extensionTestsExecute();
                if (platform_1.isCI) {
                    this._logService.info(`Extension host test runner exit code: ${exitCode}`);
                }
            }
            catch (err) {
                if (platform_1.isCI) {
                    this._logService.error(`Extension host test runner error`, err);
                }
                console.error(err);
                exitCode = 1 /* ERROR */;
            }
            this._onExtensionHostExit(exitCode);
        }
        findTestExtensionHost(testLocation) {
            let runningLocation = null;
            for (const extension of this._registry.getAllExtensionDescriptions()) {
                if ((0, resources_1.isEqualOrParent)(testLocation, extension.extensionLocation)) {
                    runningLocation = this._runningLocations.getRunningLocation(extension.identifier);
                    break;
                }
            }
            if (runningLocation === null) {
                // not sure if we should support that, but it was possible to have an test outside an extension
                if (testLocation.scheme === network_1.Schemas.vscodeRemote) {
                    runningLocation = new extensionRunningLocation_1.RemoteRunningLocation();
                }
                else {
                    // When a debugger attaches to the extension host, it will surface all console.log messages from the extension host,
                    // but not necessarily from the window. So it would be best if any errors get printed to the console of the extension host.
                    // That is why here we use the local process extension host even for non-file URIs
                    runningLocation = new extensionRunningLocation_1.LocalProcessRunningLocation(0);
                }
            }
            if (runningLocation !== null) {
                return this._getExtensionHostManagerByRunningLocation(runningLocation);
            }
            return null;
        }
        _releaseBarrier() {
            this._installedExtensionsReady.open();
            this._onDidRegisterExtensions.fire(undefined);
            this._onDidChangeExtensionsStatus.fire(this._registry.getAllExtensionDescriptions().map(e => e.identifier));
        }
        //#region remote authority resolving
        async _resolveAuthorityInitial(remoteAuthority) {
            const MAX_ATTEMPTS = 5;
            for (let attempt = 1;; attempt++) {
                try {
                    return this._resolveAuthorityWithLogging(remoteAuthority);
                }
                catch (err) {
                    if (remoteAuthorityResolver_1.RemoteAuthorityResolverError.isNoResolverFound(err)) {
                        // There is no point in retrying if there is no resolver found
                        throw err;
                    }
                    if (remoteAuthorityResolver_1.RemoteAuthorityResolverError.isNotAvailable(err)) {
                        // The resolver is not available and asked us to not retry
                        throw err;
                    }
                    if (attempt >= MAX_ATTEMPTS) {
                        // Too many failed attempts, give up
                        throw err;
                    }
                }
            }
        }
        async _resolveAuthorityAgain() {
            const remoteAuthority = this._environmentService.remoteAuthority;
            if (!remoteAuthority) {
                return;
            }
            this._remoteAuthorityResolverService._clearResolvedAuthority(remoteAuthority);
            try {
                const result = await this._resolveAuthorityWithLogging(remoteAuthority);
                this._remoteAuthorityResolverService._setResolvedAuthority(result.authority, result.options);
            }
            catch (err) {
                this._remoteAuthorityResolverService._setResolvedAuthorityError(remoteAuthority, err);
            }
        }
        async _resolveAuthorityWithLogging(remoteAuthority) {
            const authorityPrefix = (0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(remoteAuthority);
            const sw = stopwatch_1.StopWatch.create(false);
            this._logService.info(`Invoking resolveAuthority(${authorityPrefix})...`);
            try {
                perf.mark(`code/willResolveAuthority/${authorityPrefix}`);
                const result = await this._resolveAuthority(remoteAuthority);
                perf.mark(`code/didResolveAuthorityOK/${authorityPrefix}`);
                this._logService.info(`resolveAuthority(${authorityPrefix}) returned '${result.authority.connectTo}' after ${sw.elapsed()} ms`);
                return result;
            }
            catch (err) {
                perf.mark(`code/didResolveAuthorityError/${authorityPrefix}`);
                this._logService.error(`resolveAuthority(${authorityPrefix}) returned an error after ${sw.elapsed()} ms`, err);
                throw err;
            }
        }
        async _resolveAuthorityOnExtensionHosts(kind, remoteAuthority) {
            const extensionHosts = this._getExtensionHostManagers(kind);
            if (extensionHosts.length === 0) {
                // no local process extension hosts
                throw new Error(`Cannot resolve authority`);
            }
            this._resolveAuthorityAttempt++;
            const results = await Promise.all(extensionHosts.map(extHost => extHost.resolveAuthority(remoteAuthority, this._resolveAuthorityAttempt)));
            let bestErrorResult = null;
            for (const result of results) {
                if (result.type === 'ok') {
                    return result.value;
                }
                if (!bestErrorResult) {
                    bestErrorResult = result;
                    continue;
                }
                const bestErrorIsUnknown = (bestErrorResult.error.code === remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.Unknown);
                const errorIsUnknown = (result.error.code === remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.Unknown);
                if (bestErrorIsUnknown && !errorIsUnknown) {
                    bestErrorResult = result;
                }
            }
            // we can only reach this if there is an error
            throw new remoteAuthorityResolver_1.RemoteAuthorityResolverError(bestErrorResult.error.message, bestErrorResult.error.code, bestErrorResult.error.detail);
        }
        //#endregion
        //#region Stopping / Starting / Restarting
        stopExtensionHosts(reason) {
            return this._doStopExtensionHostsWithVeto(reason);
        }
        _doStopExtensionHosts() {
            const previouslyActivatedExtensionIds = [];
            for (const extensionStatus of this._extensionStatus.values()) {
                if (extensionStatus.activationStarted) {
                    previouslyActivatedExtensionIds.push(extensionStatus.id);
                }
            }
            // See https://github.com/microsoft/vscode/issues/152204
            // Dispose extension hosts in reverse creation order because the local extension host
            // might be critical in sustaining a connection to the remote extension host
            for (let i = this._extensionHostManagers.length - 1; i >= 0; i--) {
                this._extensionHostManagers[i].dispose();
            }
            this._extensionHostManagers = [];
            for (const extensionStatus of this._extensionStatus.values()) {
                extensionStatus.clearRuntimeStatus();
            }
            if (previouslyActivatedExtensionIds.length > 0) {
                this._onDidChangeExtensionsStatus.fire(previouslyActivatedExtensionIds);
            }
        }
        async _doStopExtensionHostsWithVeto(reason) {
            const vetos = [];
            const vetoReasons = new Set();
            this._onWillStop.fire({
                reason,
                veto(value, reason) {
                    vetos.push(value);
                    if (typeof value === 'boolean') {
                        if (value === true) {
                            vetoReasons.add(reason);
                        }
                    }
                    else {
                        value.then(value => {
                            if (value) {
                                vetoReasons.add(reason);
                            }
                        }).catch(error => {
                            vetoReasons.add(nls.localize('extensionStopVetoError', "{0} (Error: {1})", reason, (0, errorMessage_1.toErrorMessage)(error)));
                        });
                    }
                }
            });
            const veto = await (0, lifecycle_2.handleVetos)(vetos, error => this._logService.error(error));
            if (!veto) {
                this._doStopExtensionHosts();
            }
            else {
                const vetoReasonsArray = Array.from(vetoReasons);
                this._logService.warn(`Extension host was not stopped because of veto (stop reason: ${reason}, veto reason: ${vetoReasonsArray.join(', ')})`);
                await this._dialogService.warn(nls.localize('extensionStopVetoMessage', "The following operation was blocked: {0}", reason), vetoReasonsArray.length === 1 ?
                    nls.localize('extensionStopVetoDetailsOne', "The reason for blocking the operation: {0}", vetoReasonsArray[0]) :
                    nls.localize('extensionStopVetoDetailsMany', "The reasons for blocking the operation:\n- {0}", vetoReasonsArray.join('\n -')));
            }
            return !veto;
        }
        _startExtensionHostsIfNecessary(isInitialStart, initialActivationEvents) {
            const locations = [];
            for (let affinity = 0; affinity <= this._runningLocations.maxLocalProcessAffinity; affinity++) {
                locations.push(new extensionRunningLocation_1.LocalProcessRunningLocation(affinity));
            }
            for (let affinity = 0; affinity <= this._runningLocations.maxLocalWebWorkerAffinity; affinity++) {
                locations.push(new extensionRunningLocation_1.LocalWebWorkerRunningLocation(affinity));
            }
            locations.push(new extensionRunningLocation_1.RemoteRunningLocation());
            for (const location of locations) {
                if (this._getExtensionHostManagerByRunningLocation(location)) {
                    // already running
                    continue;
                }
                const extHostManager = this._createExtensionHostManager(location, isInitialStart, initialActivationEvents);
                if (extHostManager) {
                    this._extensionHostManagers.push(extHostManager);
                }
            }
        }
        _createExtensionHostManager(runningLocation, isInitialStart, initialActivationEvents) {
            const extensionHost = this._extensionHostFactory.createExtensionHost(this._runningLocations, runningLocation, isInitialStart);
            if (!extensionHost) {
                return null;
            }
            const processManager = this._doCreateExtensionHostManager(extensionHost, initialActivationEvents);
            processManager.onDidExit(([code, signal]) => this._onExtensionHostCrashOrExit(processManager, code, signal));
            processManager.onDidChangeResponsiveState((responsiveState) => {
                this._logService.info(`Extension host (${processManager.friendyName}) is ${responsiveState === 0 /* ResponsiveState.Responsive */ ? 'responsive' : 'unresponsive'}.`);
                this._onDidChangeResponsiveChange.fire({
                    extensionHostKind: processManager.kind,
                    isResponsive: responsiveState === 0 /* ResponsiveState.Responsive */,
                    getInspectPort: (tryEnableInspector) => {
                        return processManager.getInspectPort(tryEnableInspector);
                    }
                });
            });
            return processManager;
        }
        _doCreateExtensionHostManager(extensionHost, initialActivationEvents) {
            const internalExtensionService = this._acquireInternalAPI(extensionHost);
            if (extensionHost.startup === 3 /* ExtensionHostStartup.Lazy */ && initialActivationEvents.length === 0) {
                return this._instantiationService.createInstance(lazyCreateExtensionHostManager_1.LazyCreateExtensionHostManager, extensionHost, internalExtensionService);
            }
            return this._instantiationService.createInstance(extensionHostManager_1.ExtensionHostManager, extensionHost, initialActivationEvents, internalExtensionService);
        }
        _onExtensionHostCrashOrExit(extensionHost, code, signal) {
            // Unexpected termination
            const isExtensionDevHost = (0, extensionDevOptions_1.parseExtensionDevOptions)(this._environmentService).isExtensionDevHost;
            if (!isExtensionDevHost) {
                this._onExtensionHostCrashed(extensionHost, code, signal);
                return;
            }
            this._onExtensionHostExit(code);
        }
        _onExtensionHostCrashed(extensionHost, code, signal) {
            console.error(`Extension host (${extensionHost.friendyName}) terminated unexpectedly. Code: ${code}, Signal: ${signal}`);
            if (extensionHost.kind === 1 /* ExtensionHostKind.LocalProcess */) {
                this._doStopExtensionHosts();
            }
            else if (extensionHost.kind === 3 /* ExtensionHostKind.Remote */) {
                if (signal) {
                    this._onRemoteExtensionHostCrashed(extensionHost, signal);
                }
                for (let i = 0; i < this._extensionHostManagers.length; i++) {
                    if (this._extensionHostManagers[i] === extensionHost) {
                        this._extensionHostManagers[i].dispose();
                        this._extensionHostManagers.splice(i, 1);
                        break;
                    }
                }
            }
        }
        _getExtensionHostExitInfoWithTimeout(reconnectionToken) {
            return new Promise((resolve, reject) => {
                const timeoutHandle = setTimeout(() => {
                    reject(new Error('getExtensionHostExitInfo timed out'));
                }, 2000);
                this._remoteAgentService.getExtensionHostExitInfo(reconnectionToken).then((r) => {
                    clearTimeout(timeoutHandle);
                    resolve(r);
                }, reject);
            });
        }
        async _onRemoteExtensionHostCrashed(extensionHost, reconnectionToken) {
            try {
                const info = await this._getExtensionHostExitInfoWithTimeout(reconnectionToken);
                if (info) {
                    this._logService.error(`Extension host (${extensionHost.friendyName}) terminated unexpectedly with code ${info.code}.`);
                }
                this._logExtensionHostCrash(extensionHost);
                this._remoteCrashTracker.registerCrash();
                if (this._remoteCrashTracker.shouldAutomaticallyRestart()) {
                    this._logService.info(`Automatically restarting the remote extension host.`);
                    this._notificationService.status(nls.localize('extensionService.autoRestart', "The remote extension host terminated unexpectedly. Restarting..."), { hideAfter: 5000 });
                    this._startExtensionHostsIfNecessary(false, Array.from(this._allRequestedActivateEvents.keys()));
                }
                else {
                    this._notificationService.prompt(notification_1.Severity.Error, nls.localize('extensionService.crash', "Remote Extension host terminated unexpectedly 3 times within the last 5 minutes."), [{
                            label: nls.localize('restart', "Restart Remote Extension Host"),
                            run: () => {
                                this._startExtensionHostsIfNecessary(false, Array.from(this._allRequestedActivateEvents.keys()));
                            }
                        }]);
                }
            }
            catch (err) {
                // maybe this wasn't an extension host crash and it was a permanent disconnection
            }
        }
        _logExtensionHostCrash(extensionHost) {
            const activatedExtensions = [];
            for (const extensionStatus of this._extensionStatus.values()) {
                if (extensionStatus.activationStarted && extensionHost.containsExtension(extensionStatus.id)) {
                    activatedExtensions.push(extensionStatus.id);
                }
            }
            if (activatedExtensions.length > 0) {
                this._logService.error(`Extension host (${extensionHost.friendyName}) terminated unexpectedly. The following extensions were running: ${activatedExtensions.map(id => id.value).join(', ')}`);
            }
            else {
                this._logService.error(`Extension host (${extensionHost.friendyName}) terminated unexpectedly. No extensions were activated.`);
            }
        }
        async startExtensionHosts(updates) {
            this._doStopExtensionHosts();
            if (updates) {
                await this._handleDeltaExtensions(new DeltaExtensionsQueueItem(updates.toAdd, updates.toRemove));
            }
            const lock = await this._registry.acquireLock('startExtensionHosts');
            try {
                this._startExtensionHostsIfNecessary(false, Array.from(this._allRequestedActivateEvents.keys()));
                const localProcessExtensionHosts = this._getExtensionHostManagers(1 /* ExtensionHostKind.LocalProcess */);
                await Promise.all(localProcessExtensionHosts.map(extHost => extHost.ready()));
            }
            finally {
                lock.dispose();
            }
        }
        //#endregion
        //#region IExtensionService
        activateByEvent(activationEvent, activationKind = 0 /* ActivationKind.Normal */) {
            if (this._installedExtensionsReady.isOpen()) {
                // Extensions have been scanned and interpreted
                // Record the fact that this activationEvent was requested (in case of a restart)
                this._allRequestedActivateEvents.add(activationEvent);
                if (!this._registry.containsActivationEvent(activationEvent)) {
                    // There is no extension that is interested in this activation event
                    return NO_OP_VOID_PROMISE;
                }
                return this._activateByEvent(activationEvent, activationKind);
            }
            else {
                // Extensions have not been scanned yet.
                // Record the fact that this activationEvent was requested (in case of a restart)
                this._allRequestedActivateEvents.add(activationEvent);
                if (activationKind === 1 /* ActivationKind.Immediate */) {
                    // Do not wait for the normal start-up of the extension host(s)
                    return this._activateByEvent(activationEvent, activationKind);
                }
                return this._installedExtensionsReady.wait().then(() => this._activateByEvent(activationEvent, activationKind));
            }
        }
        _activateByEvent(activationEvent, activationKind) {
            const result = Promise.all(this._extensionHostManagers.map(extHostManager => extHostManager.activateByEvent(activationEvent, activationKind))).then(() => { });
            this._onWillActivateByEvent.fire({
                event: activationEvent,
                activation: result
            });
            return result;
        }
        activateById(extensionId, reason) {
            return this._activateById(extensionId, reason);
        }
        activationEventIsDone(activationEvent) {
            if (!this._installedExtensionsReady.isOpen()) {
                return false;
            }
            if (!this._registry.containsActivationEvent(activationEvent)) {
                // There is no extension that is interested in this activation event
                return true;
            }
            return this._extensionHostManagers.every(manager => manager.activationEventIsDone(activationEvent));
        }
        whenInstalledExtensionsRegistered() {
            return this._installedExtensionsReady.wait();
        }
        get extensions() {
            return this._registry.getAllExtensionDescriptions();
        }
        _getExtensionRegistrySnapshotWhenReady() {
            return this._installedExtensionsReady.wait().then(() => this._registry.getSnapshot());
        }
        getExtension(id) {
            return this._installedExtensionsReady.wait().then(() => {
                return this._registry.getExtensionDescription(id);
            });
        }
        readExtensionPointContributions(extPoint) {
            return this._installedExtensionsReady.wait().then(() => {
                const availableExtensions = this._registry.getAllExtensionDescriptions();
                const result = [];
                for (const desc of availableExtensions) {
                    if (desc.contributes && hasOwnProperty.call(desc.contributes, extPoint.name)) {
                        result.push(new extensions_2.ExtensionPointContribution(desc, desc.contributes[extPoint.name]));
                    }
                }
                return result;
            });
        }
        getExtensionsStatus() {
            const result = Object.create(null);
            if (this._registry) {
                const extensions = this._registry.getAllExtensionDescriptions();
                for (const extension of extensions) {
                    const extensionStatus = this._extensionStatus.get(extension.identifier);
                    result[extension.identifier.value] = {
                        id: extension.identifier,
                        messages: extensionStatus?.messages ?? [],
                        activationStarted: extensionStatus?.activationStarted ?? false,
                        activationTimes: extensionStatus?.activationTimes ?? undefined,
                        runtimeErrors: extensionStatus?.runtimeErrors ?? [],
                        runningLocation: this._runningLocations.getRunningLocation(extension.identifier),
                    };
                }
            }
            return result;
        }
        async getInspectPorts(extensionHostKind, tryEnableInspector) {
            const result = await Promise.all(this._getExtensionHostManagers(extensionHostKind).map(extHost => extHost.getInspectPort(tryEnableInspector)));
            // remove 0s:
            return result.filter(element => Boolean(element));
        }
        async setRemoteEnvironment(env) {
            await this._extensionHostManagers
                .map(manager => manager.setRemoteEnvironment(env));
        }
        //#endregion
        // --- impl
        _safeInvokeIsEnabled(extension) {
            try {
                return this._extensionEnablementService.isEnabled(extension);
            }
            catch (err) {
                return false;
            }
        }
        _doHandleExtensionPoints(affectedExtensions) {
            const affectedExtensionPoints = Object.create(null);
            for (const extensionDescription of affectedExtensions) {
                if (extensionDescription.contributes) {
                    for (const extPointName in extensionDescription.contributes) {
                        if (hasOwnProperty.call(extensionDescription.contributes, extPointName)) {
                            affectedExtensionPoints[extPointName] = true;
                        }
                    }
                }
            }
            const messageHandler = (msg) => this._handleExtensionPointMessage(msg);
            const availableExtensions = this._registry.getAllExtensionDescriptions();
            const extensionPoints = extensionsRegistry_1.ExtensionsRegistry.getExtensionPoints();
            perf.mark('code/willHandleExtensionPoints');
            for (const extensionPoint of extensionPoints) {
                if (affectedExtensionPoints[extensionPoint.name]) {
                    perf.mark(`code/willHandleExtensionPoint/${extensionPoint.name}`);
                    AbstractExtensionService_1._handleExtensionPoint(extensionPoint, availableExtensions, messageHandler);
                    perf.mark(`code/didHandleExtensionPoint/${extensionPoint.name}`);
                }
            }
            perf.mark('code/didHandleExtensionPoints');
        }
        _getOrCreateExtensionStatus(extensionId) {
            if (!this._extensionStatus.has(extensionId)) {
                this._extensionStatus.set(extensionId, new ExtensionStatus(extensionId));
            }
            return this._extensionStatus.get(extensionId);
        }
        _handleExtensionPointMessage(msg) {
            const extensionStatus = this._getOrCreateExtensionStatus(msg.extensionId);
            extensionStatus.addMessage(msg);
            const extension = this._registry.getExtensionDescription(msg.extensionId);
            const strMsg = `[${msg.extensionId.value}]: ${msg.message}`;
            if (msg.type === notification_1.Severity.Error) {
                if (extension && extension.isUnderDevelopment) {
                    // This message is about the extension currently being developed
                    this._notificationService.notify({ severity: notification_1.Severity.Error, message: strMsg });
                }
                this._logService.error(strMsg);
            }
            else if (msg.type === notification_1.Severity.Warning) {
                if (extension && extension.isUnderDevelopment) {
                    // This message is about the extension currently being developed
                    this._notificationService.notify({ severity: notification_1.Severity.Warning, message: strMsg });
                }
                this._logService.warn(strMsg);
            }
            else {
                this._logService.info(strMsg);
            }
            if (msg.extensionId && this._environmentService.isBuilt && !this._environmentService.isExtensionDevelopment) {
                const { type, extensionId, extensionPointId, message } = msg;
                this._telemetryService.publicLog2('extensionsMessage', {
                    type, extensionId: extensionId.value, extensionPointId, message
                });
            }
        }
        static _handleExtensionPoint(extensionPoint, availableExtensions, messageHandler) {
            const users = [];
            for (const desc of availableExtensions) {
                if (desc.contributes && hasOwnProperty.call(desc.contributes, extensionPoint.name)) {
                    users.push({
                        description: desc,
                        value: desc.contributes[extensionPoint.name],
                        collector: new extensionsRegistry_1.ExtensionMessageCollector(messageHandler, desc, extensionPoint.name)
                    });
                }
            }
            extensionPoint.acceptUsers(users);
        }
        //#region Called by extension host
        _acquireInternalAPI(extensionHost) {
            return {
                _activateById: (extensionId, reason) => {
                    return this._activateById(extensionId, reason);
                },
                _onWillActivateExtension: (extensionId) => {
                    return this._onWillActivateExtension(extensionId, extensionHost.runningLocation);
                },
                _onDidActivateExtension: (extensionId, codeLoadingTime, activateCallTime, activateResolvedTime, activationReason) => {
                    return this._onDidActivateExtension(extensionId, codeLoadingTime, activateCallTime, activateResolvedTime, activationReason);
                },
                _onDidActivateExtensionError: (extensionId, error) => {
                    return this._onDidActivateExtensionError(extensionId, error);
                },
                _onExtensionRuntimeError: (extensionId, err) => {
                    return this._onExtensionRuntimeError(extensionId, err);
                }
            };
        }
        async _activateById(extensionId, reason) {
            const results = await Promise.all(this._extensionHostManagers.map(manager => manager.activate(extensionId, reason)));
            const activated = results.some(e => e);
            if (!activated) {
                throw new Error(`Unknown extension ${extensionId.value}`);
            }
        }
        _onWillActivateExtension(extensionId, runningLocation) {
            this._runningLocations.set(extensionId, runningLocation);
            const extensionStatus = this._getOrCreateExtensionStatus(extensionId);
            extensionStatus.onWillActivate();
        }
        _onDidActivateExtension(extensionId, codeLoadingTime, activateCallTime, activateResolvedTime, activationReason) {
            const extensionStatus = this._getOrCreateExtensionStatus(extensionId);
            extensionStatus.setActivationTimes(new extensions_2.ActivationTimes(codeLoadingTime, activateCallTime, activateResolvedTime, activationReason));
            this._onDidChangeExtensionsStatus.fire([extensionId]);
        }
        _onDidActivateExtensionError(extensionId, error) {
            this._telemetryService.publicLog2('extensionActivationError', {
                extensionId: extensionId.value,
                error: error.message
            });
        }
        _onExtensionRuntimeError(extensionId, err) {
            const extensionStatus = this._getOrCreateExtensionStatus(extensionId);
            extensionStatus.addRuntimeError(err);
            this._onDidChangeExtensionsStatus.fire([extensionId]);
        }
    };
    exports.AbstractExtensionService = AbstractExtensionService;
    exports.AbstractExtensionService = AbstractExtensionService = AbstractExtensionService_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, notification_1.INotificationService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(8, files_1.IFileService),
        __param(9, productService_1.IProductService),
        __param(10, extensionManagement_1.IWorkbenchExtensionManagementService),
        __param(11, workspace_1.IWorkspaceContextService),
        __param(12, configuration_1.IConfigurationService),
        __param(13, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(14, log_1.ILogService),
        __param(15, remoteAgentService_1.IRemoteAgentService),
        __param(16, remoteExtensionsScanner_1.IRemoteExtensionsScannerService),
        __param(17, lifecycle_3.ILifecycleService),
        __param(18, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(19, dialogs_1.IDialogService)
    ], AbstractExtensionService);
    class ResolvedExtensions {
        constructor(local, remote, hasLocalProcess, allowRemoteExtensionsInLocalWebWorker) {
            this.local = local;
            this.remote = remote;
            this.hasLocalProcess = hasLocalProcess;
            this.allowRemoteExtensionsInLocalWebWorker = allowRemoteExtensionsInLocalWebWorker;
        }
    }
    exports.ResolvedExtensions = ResolvedExtensions;
    class DeltaExtensionsQueueItem {
        constructor(toAdd, toRemove) {
            this.toAdd = toAdd;
            this.toRemove = toRemove;
        }
    }
    /**
     * @argument extensions The extensions to be checked.
     * @argument ignoreWorkspaceTrust Do not take workspace trust into account.
     */
    function checkEnabledAndProposedAPI(logService, extensionEnablementService, extensionsProposedApi, extensions, ignoreWorkspaceTrust) {
        // enable or disable proposed API per extension
        extensionsProposedApi.updateEnabledApiProposals(extensions);
        // keep only enabled extensions
        return filterEnabledExtensions(logService, extensionEnablementService, extensions, ignoreWorkspaceTrust);
    }
    /**
     * Return the subset of extensions that are enabled.
     * @argument ignoreWorkspaceTrust Do not take workspace trust into account.
     */
    function filterEnabledExtensions(logService, extensionEnablementService, extensions, ignoreWorkspaceTrust) {
        const enabledExtensions = [], extensionsToCheck = [], mappedExtensions = [];
        for (const extension of extensions) {
            if (extension.isUnderDevelopment) {
                // Never disable extensions under development
                enabledExtensions.push(extension);
            }
            else {
                extensionsToCheck.push(extension);
                mappedExtensions.push((0, extensions_2.toExtension)(extension));
            }
        }
        const enablementStates = extensionEnablementService.getEnablementStates(mappedExtensions, ignoreWorkspaceTrust ? { trusted: true } : undefined);
        for (let index = 0; index < enablementStates.length; index++) {
            if (extensionEnablementService.isEnabledEnablementState(enablementStates[index])) {
                enabledExtensions.push(extensionsToCheck[index]);
            }
            else {
                if (platform_1.isCI) {
                    logService.info(`filterEnabledExtensions: extension '${extensionsToCheck[index].identifier.value}' is disabled`);
                }
            }
        }
        return enabledExtensions;
    }
    /**
     * @argument extension The extension to be checked.
     * @argument ignoreWorkspaceTrust Do not take workspace trust into account.
     */
    function extensionIsEnabled(logService, extensionEnablementService, extension, ignoreWorkspaceTrust) {
        return filterEnabledExtensions(logService, extensionEnablementService, [extension], ignoreWorkspaceTrust).includes(extension);
    }
    function includes(extensions, identifier) {
        for (const extension of extensions) {
            if (extensions_1.ExtensionIdentifier.equals(extension.identifier, identifier)) {
                return true;
            }
        }
        return false;
    }
    class ExtensionStatus {
        get messages() {
            return this._messages;
        }
        get activationTimes() {
            return this._activationTimes;
        }
        get runtimeErrors() {
            return this._runtimeErrors;
        }
        get activationStarted() {
            return this._activationStarted;
        }
        constructor(id) {
            this.id = id;
            this._messages = [];
            this._activationTimes = null;
            this._runtimeErrors = [];
            this._activationStarted = false;
        }
        clearRuntimeStatus() {
            this._activationStarted = false;
            this._activationTimes = null;
            this._runtimeErrors = [];
        }
        addMessage(msg) {
            this._messages.push(msg);
        }
        setActivationTimes(activationTimes) {
            this._activationTimes = activationTimes;
        }
        addRuntimeError(err) {
            this._runtimeErrors.push(err);
        }
        onWillActivate() {
            this._activationStarted = true;
        }
    }
    exports.ExtensionStatus = ExtensionStatus;
    class ExtensionHostCrashTracker {
        constructor() {
            this._recentCrashes = [];
        }
        static { this._TIME_LIMIT = 5 * 60 * 1000; } // 5 minutes
        static { this._CRASH_LIMIT = 3; }
        _removeOldCrashes() {
            const limit = Date.now() - ExtensionHostCrashTracker._TIME_LIMIT;
            while (this._recentCrashes.length > 0 && this._recentCrashes[0].timestamp < limit) {
                this._recentCrashes.shift();
            }
        }
        registerCrash() {
            this._removeOldCrashes();
            this._recentCrashes.push({ timestamp: Date.now() });
        }
        shouldAutomaticallyRestart() {
            this._removeOldCrashes();
            return (this._recentCrashes.length < ExtensionHostCrashTracker._CRASH_LIMIT);
        }
    }
    exports.ExtensionHostCrashTracker = ExtensionHostCrashTracker;
    /**
     * This can run correctly only on the renderer process because that is the only place
     * where all extension points and all implicit activation events generators are known.
     */
    class ImplicitActivationAwareReader {
        readActivationEvents(extensionDescription) {
            return implicitActivationEvents_1.ImplicitActivationEvents.readActivationEvents(extensionDescription);
        }
    }
    exports.ImplicitActivationAwareReader = ImplicitActivationAwareReader;
    class ActivationFeatureMarkdowneRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'markdown';
        }
        shouldRender(manifest) {
            return !!manifest.activationEvents;
        }
        render(manifest) {
            const activationEvents = manifest.activationEvents || [];
            const data = new htmlContent_1.MarkdownString();
            if (activationEvents.length) {
                for (const activationEvent of activationEvents) {
                    data.appendMarkdown(`- \`${activationEvent}\`\n`);
                }
            }
            return {
                data,
                dispose: () => { }
            };
        }
    }
    platform_2.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'activationEvents',
        label: nls.localize('activation', "Activation Events"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(ActivationFeatureMarkdowneRenderer),
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RFeHRlbnNpb25TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9ucy9jb21tb24vYWJzdHJhY3RFeHRlbnNpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFnc0NoRyxnRUFNQztJQU1ELDBEQXdCQztJQU1ELGdEQUVDO0lBeHJDRCxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDO0lBQzdDLE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBTyxTQUFTLENBQUMsQ0FBQztJQUVyRCxJQUFlLHdCQUF3QixnQ0FBdkMsTUFBZSx3QkFBeUIsU0FBUSxzQkFBVTtRQXFDaEUsWUFDa0Isc0JBQTZDLEVBQzdDLHFCQUE0QyxFQUM1Qyx3QkFBa0QsRUFDNUMscUJBQStELEVBQ2hFLG9CQUE2RCxFQUNyRCxtQkFBb0UsRUFDL0UsaUJBQXVELEVBQ3BDLDJCQUFvRixFQUM1RyxZQUE2QyxFQUMxQyxlQUFtRCxFQUM5QiwyQkFBb0YsRUFDaEcsZUFBMEQsRUFDN0QscUJBQTZELEVBQy9DLG1DQUF5RixFQUNqSCxXQUEyQyxFQUNuQyxtQkFBMkQsRUFDL0MsK0JBQW1GLEVBQ2pHLGlCQUFxRCxFQUN2QywrQkFBbUYsRUFDcEcsY0FBK0M7WUFFL0QsS0FBSyxFQUFFLENBQUM7WUFyQlMsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF1QjtZQUM3QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzVDLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDekIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM3Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQ2xDLHdCQUFtQixHQUFu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