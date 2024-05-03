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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/performance", "vs/base/common/resources", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/ternarySearchTree", "vs/base/common/uri", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostConfiguration", "vs/workbench/api/common/extHostExtensionActivator", "vs/workbench/api/common/extHostStorage", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionDescriptionRegistry", "vs/base/common/errors", "vs/platform/extensions/common/extensions", "vs/base/common/buffer", "vs/workbench/api/common/extHostMemento", "vs/workbench/api/common/extHostTypes", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostStoragePaths", "vs/workbench/api/common/extHostRpcService", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/api/common/extHostTunnelService", "vs/workbench/api/common/extHostTerminalService", "vs/workbench/api/common/extHostLanguageModels", "vs/base/common/event", "vs/workbench/services/extensions/common/workspaceContains", "vs/workbench/api/common/extHostSecretState", "vs/workbench/api/common/extHostSecrets", "vs/base/common/network", "vs/workbench/api/common/extHostLocalizationService", "vs/base/common/stopwatch", "vs/base/common/platform", "vs/workbench/api/common/extHostManagedSockets"], function (require, exports, nls, path, performance, resources_1, async_1, lifecycle_1, ternarySearchTree_1, uri_1, log_1, extHost_protocol_1, extHostConfiguration_1, extHostExtensionActivator_1, extHostStorage_1, extHostWorkspace_1, extensions_1, extensionDescriptionRegistry_1, errors, extensions_2, buffer_1, extHostMemento_1, extHostTypes_1, remoteAuthorityResolver_1, instantiation_1, extHostInitDataService_1, extHostStoragePaths_1, extHostRpcService_1, serviceCollection_1, extHostTunnelService_1, extHostTerminalService_1, extHostLanguageModels_1, event_1, workspaceContains_1, extHostSecretState_1, extHostSecrets_1, network_1, extHostLocalizationService_1, stopwatch_1, platform_1, extHostManagedSockets_1) {
    "use strict";
    var AbstractExtHostExtensionService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionPaths = exports.Extension = exports.IExtHostExtensionService = exports.AbstractExtHostExtensionService = exports.IHostUtils = void 0;
    exports.IHostUtils = (0, instantiation_1.createDecorator)('IHostUtils');
    let AbstractExtHostExtensionService = AbstractExtHostExtensionService_1 = class AbstractExtHostExtensionService extends lifecycle_1.Disposable {
        constructor(instaService, hostUtils, extHostContext, extHostWorkspace, extHostConfiguration, logService, initData, storagePath, extHostTunnelService, extHostTerminalService, extHostLocalizationService, _extHostManagedSockets, _extHostLanguageModels) {
            super();
            this._extHostManagedSockets = _extHostManagedSockets;
            this._extHostLanguageModels = _extHostLanguageModels;
            this._onDidChangeRemoteConnectionData = this._register(new event_1.Emitter());
            this.onDidChangeRemoteConnectionData = this._onDidChangeRemoteConnectionData.event;
            this._realPathCache = new Map();
            this._isTerminating = false;
            this._hostUtils = hostUtils;
            this._extHostContext = extHostContext;
            this._initData = initData;
            this._extHostWorkspace = extHostWorkspace;
            this._extHostConfiguration = extHostConfiguration;
            this._logService = logService;
            this._extHostTunnelService = extHostTunnelService;
            this._extHostTerminalService = extHostTerminalService;
            this._extHostLocalizationService = extHostLocalizationService;
            this._mainThreadWorkspaceProxy = this._extHostContext.getProxy(extHost_protocol_1.MainContext.MainThreadWorkspace);
            this._mainThreadTelemetryProxy = this._extHostContext.getProxy(extHost_protocol_1.MainContext.MainThreadTelemetry);
            this._mainThreadExtensionsProxy = this._extHostContext.getProxy(extHost_protocol_1.MainContext.MainThreadExtensionService);
            this._almostReadyToRunExtensions = new async_1.Barrier();
            this._readyToStartExtensionHost = new async_1.Barrier();
            this._readyToRunExtensions = new async_1.Barrier();
            this._eagerExtensionsActivated = new async_1.Barrier();
            this._activationEventsReader = new SyncedActivationEventsReader(this._initData.extensions.activationEvents);
            this._globalRegistry = new extensionDescriptionRegistry_1.ExtensionDescriptionRegistry(this._activationEventsReader, this._initData.extensions.allExtensions);
            const myExtensionsSet = new extensions_2.ExtensionIdentifierSet(this._initData.extensions.myExtensions);
            this._myRegistry = new extensionDescriptionRegistry_1.ExtensionDescriptionRegistry(this._activationEventsReader, filterExtensions(this._globalRegistry, myExtensionsSet));
            if (platform_1.isCI) {
                this._logService.info(`Creating extension host with the following global extensions: ${printExtIds(this._globalRegistry)}`);
                this._logService.info(`Creating extension host with the following local extensions: ${printExtIds(this._myRegistry)}`);
            }
            this._storage = new extHostStorage_1.ExtHostStorage(this._extHostContext, this._logService);
            this._secretState = new extHostSecretState_1.ExtHostSecretState(this._extHostContext);
            this._storagePath = storagePath;
            this._instaService = instaService.createChild(new serviceCollection_1.ServiceCollection([extHostStorage_1.IExtHostStorage, this._storage], [extHostSecretState_1.IExtHostSecretState, this._secretState]));
            this._activator = this._register(new extHostExtensionActivator_1.ExtensionsActivator(this._myRegistry, this._globalRegistry, {
                onExtensionActivationError: (extensionId, error, missingExtensionDependency) => {
                    this._mainThreadExtensionsProxy.$onExtensionActivationError(extensionId, errors.transformErrorForSerialization(error), missingExtensionDependency);
                },
                actualActivateExtension: async (extensionId, reason) => {
                    if (extensionDescriptionRegistry_1.ExtensionDescriptionRegistry.isHostExtension(extensionId, this._myRegistry, this._globalRegistry)) {
                        await this._mainThreadExtensionsProxy.$activateExtension(extensionId, reason);
                        return new extHostExtensionActivator_1.HostExtension();
                    }
                    const extensionDescription = this._myRegistry.getExtensionDescription(extensionId);
                    return this._activateExtension(extensionDescription, reason);
                }
            }, this._logService));
            this._extensionPathIndex = null;
            this._resolvers = Object.create(null);
            this._started = false;
            this._remoteConnectionData = this._initData.remote.connectionData;
        }
        getRemoteConnectionData() {
            return this._remoteConnectionData;
        }
        async initialize() {
            try {
                await this._beforeAlmostReadyToRunExtensions();
                this._almostReadyToRunExtensions.open();
                await this._extHostWorkspace.waitForInitializeCall();
                performance.mark('code/extHost/ready');
                this._readyToStartExtensionHost.open();
                if (this._initData.autoStart) {
                    this._startExtensionHost();
                }
            }
            catch (err) {
                errors.onUnexpectedError(err);
            }
        }
        async _deactivateAll() {
            this._storagePath.onWillDeactivateAll();
            let allPromises = [];
            try {
                const allExtensions = this._myRegistry.getAllExtensionDescriptions();
                const allExtensionsIds = allExtensions.map(ext => ext.identifier);
                const activatedExtensions = allExtensionsIds.filter(id => this.isActivated(id));
                allPromises = activatedExtensions.map((extensionId) => {
                    return this._deactivate(extensionId);
                });
            }
            catch (err) {
                // TODO: write to log once we have one
            }
            await Promise.all(allPromises);
        }
        terminate(reason, code = 0) {
            if (this._isTerminating) {
                // we are already shutting down...
                return;
            }
            this._isTerminating = true;
            this._logService.info(`Extension host terminating: ${reason}`);
            this._logService.flush();
            this._extHostTerminalService.dispose();
            this._activator.dispose();
            errors.setUnexpectedErrorHandler((err) => {
                this._logService.error(err);
            });
            // Invalidate all proxies
            this._extHostContext.dispose();
            const extensionsDeactivated = this._deactivateAll();
            // Give extensions at most 5 seconds to wrap up any async deactivate, then exit
            Promise.race([(0, async_1.timeout)(5000), extensionsDeactivated]).finally(() => {
                if (this._hostUtils.pid) {
                    this._logService.info(`Extension host with pid ${this._hostUtils.pid} exiting with code ${code}`);
                }
                else {
                    this._logService.info(`Extension host exiting with code ${code}`);
                }
                this._logService.flush();
                this._logService.dispose();
                this._hostUtils.exit(code);
            });
        }
        isActivated(extensionId) {
            if (this._readyToRunExtensions.isOpen()) {
                return this._activator.isActivated(extensionId);
            }
            return false;
        }
        async getExtension(extensionId) {
            const ext = await this._mainThreadExtensionsProxy.$getExtension(extensionId);
            return ext && {
                ...ext,
                identifier: new extensions_2.ExtensionIdentifier(ext.identifier.value),
                extensionLocation: uri_1.URI.revive(ext.extensionLocation)
            };
        }
        _activateByEvent(activationEvent, startup) {
            return this._activator.activateByEvent(activationEvent, startup);
        }
        _activateById(extensionId, reason) {
            return this._activator.activateById(extensionId, reason);
        }
        activateByIdWithErrors(extensionId, reason) {
            return this._activateById(extensionId, reason).then(() => {
                const extension = this._activator.getActivatedExtension(extensionId);
                if (extension.activationFailed) {
                    // activation failed => bubble up the error as the promise result
                    return Promise.reject(extension.activationFailedError);
                }
                return undefined;
            });
        }
        getExtensionRegistry() {
            return this._readyToRunExtensions.wait().then(_ => this._myRegistry);
        }
        getExtensionExports(extensionId) {
            if (this._readyToRunExtensions.isOpen()) {
                return this._activator.getActivatedExtension(extensionId).exports;
            }
            else {
                try {
                    return this._activator.getActivatedExtension(extensionId).exports;
                }
                catch (err) {
                    return null;
                }
            }
        }
        /**
         * Applies realpath to file-uris and returns all others uris unmodified.
         * The real path is cached for the lifetime of the extension host.
         */
        async _realPathExtensionUri(uri) {
            if (uri.scheme === network_1.Schemas.file && this._hostUtils.fsRealpath) {
                const fsPath = uri.fsPath;
                if (!this._realPathCache.has(fsPath)) {
                    this._realPathCache.set(fsPath, this._hostUtils.fsRealpath(fsPath));
                }
                const realpathValue = await this._realPathCache.get(fsPath);
                return uri_1.URI.file(realpathValue);
            }
            return uri;
        }
        // create trie to enable fast 'filename -> extension id' look up
        async getExtensionPathIndex() {
            if (!this._extensionPathIndex) {
                this._extensionPathIndex = this._createExtensionPathIndex(this._myRegistry.getAllExtensionDescriptions()).then((searchTree) => {
                    return new ExtensionPaths(searchTree);
                });
            }
            return this._extensionPathIndex;
        }
        /**
         * create trie to enable fast 'filename -> extension id' look up
         */
        async _createExtensionPathIndex(extensions) {
            const tst = ternarySearchTree_1.TernarySearchTree.forUris(key => {
                // using the default/biased extUri-util because the IExtHostFileSystemInfo-service
                // isn't ready to be used yet, e.g the knowledge about `file` protocol and others
                // comes in while this code runs
                return resources_1.extUriBiasedIgnorePathCase.ignorePathCasing(key);
            });
            // const tst = TernarySearchTree.forUris<IExtensionDescription>(key => true);
            await Promise.all(extensions.map(async (ext) => {
                if (this._getEntryPoint(ext)) {
                    const uri = await this._realPathExtensionUri(ext.extensionLocation);
                    tst.set(uri, ext);
                }
            }));
            return tst;
        }
        _deactivate(extensionId) {
            let result = Promise.resolve(undefined);
            if (!this._readyToRunExtensions.isOpen()) {
                return result;
            }
            if (!this._activator.isActivated(extensionId)) {
                return result;
            }
            const extension = this._activator.getActivatedExtension(extensionId);
            if (!extension) {
                return result;
            }
            // call deactivate if available
            try {
                if (typeof extension.module.deactivate === 'function') {
                    result = Promise.resolve(extension.module.deactivate()).then(undefined, (err) => {
                        this._logService.error(err);
                        return Promise.resolve(undefined);
                    });
                }
            }
            catch (err) {
                this._logService.error(`An error occurred when deactivating the extension '${extensionId.value}':`);
                this._logService.error(err);
            }
            // clean up subscriptions
            try {
                (0, lifecycle_1.dispose)(extension.subscriptions);
            }
            catch (err) {
                this._logService.error(`An error occurred when deactivating the subscriptions for extension '${extensionId.value}':`);
                this._logService.error(err);
            }
            return result;
        }
        // --- impl
        async _activateExtension(extensionDescription, reason) {
            if (!this._initData.remote.isRemote) {
                // local extension host process
                await this._mainThreadExtensionsProxy.$onWillActivateExtension(extensionDescription.identifier);
            }
            else {
                // remote extension host process
                // do not wait for renderer confirmation
                this._mainThreadExtensionsProxy.$onWillActivateExtension(extensionDescription.identifier);
            }
            return this._doActivateExtension(extensionDescription, reason).then((activatedExtension) => {
                const activationTimes = activatedExtension.activationTimes;
                this._mainThreadExtensionsProxy.$onDidActivateExtension(extensionDescription.identifier, activationTimes.codeLoadingTime, activationTimes.activateCallTime, activationTimes.activateResolvedTime, reason);
                this._logExtensionActivationTimes(extensionDescription, reason, 'success', activationTimes);
                return activatedExtension;
            }, (err) => {
                this._logExtensionActivationTimes(extensionDescription, reason, 'failure');
                throw err;
            });
        }
        _logExtensionActivationTimes(extensionDescription, reason, outcome, activationTimes) {
            const event = getTelemetryActivationEvent(extensionDescription, reason);
            this._mainThreadTelemetryProxy.$publicLog2('extensionActivationTimes', {
                ...event,
                ...(activationTimes || {}),
                outcome
            });
        }
        _doActivateExtension(extensionDescription, reason) {
            const event = getTelemetryActivationEvent(extensionDescription, reason);
            this._mainThreadTelemetryProxy.$publicLog2('activatePlugin', event);
            const entryPoint = this._getEntryPoint(extensionDescription);
            if (!entryPoint) {
                // Treat the extension as being empty => NOT AN ERROR CASE
                return Promise.resolve(new extHostExtensionActivator_1.EmptyExtension(extHostExtensionActivator_1.ExtensionActivationTimes.NONE));
            }
            this._logService.info(`ExtensionService#_doActivateExtension ${extensionDescription.identifier.value}, startup: ${reason.startup}, activationEvent: '${reason.activationEvent}'${extensionDescription.identifier.value !== reason.extensionId.value ? `, root cause: ${reason.extensionId.value}` : ``}`);
            this._logService.flush();
            const activationTimesBuilder = new extHostExtensionActivator_1.ExtensionActivationTimesBuilder(reason.startup);
            return Promise.all([
                this._loadCommonJSModule(extensionDescription, (0, resources_1.joinPath)(extensionDescription.extensionLocation, entryPoint), activationTimesBuilder),
                this._loadExtensionContext(extensionDescription)
            ]).then(values => {
                performance.mark(`code/extHost/willActivateExtension/${extensionDescription.identifier.value}`);
                return AbstractExtHostExtensionService_1._callActivate(this._logService, extensionDescription.identifier, values[0], values[1], activationTimesBuilder);
            }).then((activatedExtension) => {
                performance.mark(`code/extHost/didActivateExtension/${extensionDescription.identifier.value}`);
                return activatedExtension;
            });
        }
        _loadExtensionContext(extensionDescription) {
            const lanuageModelAccessInformation = this._extHostLanguageModels.createLanguageModelAccessInformation(extensionDescription);
            const globalState = new extHostMemento_1.ExtensionGlobalMemento(extensionDescription, this._storage);
            const workspaceState = new extHostMemento_1.ExtensionMemento(extensionDescription.identifier.value, false, this._storage);
            const secrets = new extHostSecrets_1.ExtensionSecrets(extensionDescription, this._secretState);
            const extensionMode = extensionDescription.isUnderDevelopment
                ? (this._initData.environment.extensionTestsLocationURI ? extHostTypes_1.ExtensionMode.Test : extHostTypes_1.ExtensionMode.Development)
                : extHostTypes_1.ExtensionMode.Production;
            const extensionKind = this._initData.remote.isRemote ? extHostTypes_1.ExtensionKind.Workspace : extHostTypes_1.ExtensionKind.UI;
            this._logService.trace(`ExtensionService#loadExtensionContext ${extensionDescription.identifier.value}`);
            return Promise.all([
                globalState.whenReady,
                workspaceState.whenReady,
                this._storagePath.whenReady
            ]).then(() => {
                const that = this;
                let extension;
                let messagePassingProtocol;
                const messagePort = (0, extensions_1.isProposedApiEnabled)(extensionDescription, 'ipc')
                    ? this._initData.messagePorts?.get(extensions_2.ExtensionIdentifier.toKey(extensionDescription.identifier))
                    : undefined;
                return Object.freeze({
                    globalState,
                    workspaceState,
                    secrets,
                    subscriptions: [],
                    get languageModelAccessInformation() { return lanuageModelAccessInformation; },
                    get extensionUri() { return extensionDescription.extensionLocation; },
                    get extensionPath() { return extensionDescription.extensionLocation.fsPath; },
                    asAbsolutePath(relativePath) { return path.join(extensionDescription.extensionLocation.fsPath, relativePath); },
                    get storagePath() { return that._storagePath.workspaceValue(extensionDescription)?.fsPath; },
                    get globalStoragePath() { return that._storagePath.globalValue(extensionDescription).fsPath; },
                    get logPath() { return path.join(that._initData.logsLocation.fsPath, extensionDescription.identifier.value); },
                    get logUri() { return uri_1.URI.joinPath(that._initData.logsLocation, extensionDescription.identifier.value); },
                    get storageUri() { return that._storagePath.workspaceValue(extensionDescription); },
                    get globalStorageUri() { return that._storagePath.globalValue(extensionDescription); },
                    get extensionMode() { return extensionMode; },
                    get extension() {
                        if (extension === undefined) {
                            extension = new Extension(that, extensionDescription.identifier, extensionDescription, extensionKind, false);
                        }
                        return extension;
                    },
                    get extensionRuntime() {
                        (0, extensions_1.checkProposedApiEnabled)(extensionDescription, 'extensionRuntime');
                        return that.extensionRuntime;
                    },
                    get environmentVariableCollection() { return that._extHostTerminalService.getEnvironmentVariableCollection(extensionDescription); },
                    get messagePassingProtocol() {
                        if (!messagePassingProtocol) {
                            if (!messagePort) {
                                return undefined;
                            }
                            const onDidReceiveMessage = event_1.Event.buffer(event_1.Event.fromDOMEventEmitter(messagePort, 'message', e => e.data));
                            messagePort.start();
                            messagePassingProtocol = {
                                onDidReceiveMessage,
                                postMessage: messagePort.postMessage.bind(messagePort)
                            };
                        }
                        return messagePassingProtocol;
                    }
                });
            });
        }
        static _callActivate(logService, extensionId, extensionModule, context, activationTimesBuilder) {
            // Make sure the extension's surface is not undefined
            extensionModule = extensionModule || {
                activate: undefined,
                deactivate: undefined
            };
            return this._callActivateOptional(logService, extensionId, extensionModule, context, activationTimesBuilder).then((extensionExports) => {
                return new extHostExtensionActivator_1.ActivatedExtension(false, null, activationTimesBuilder.build(), extensionModule, extensionExports, context.subscriptions);
            });
        }
        static _callActivateOptional(logService, extensionId, extensionModule, context, activationTimesBuilder) {
            if (typeof extensionModule.activate === 'function') {
                try {
                    activationTimesBuilder.activateCallStart();
                    logService.trace(`ExtensionService#_callActivateOptional ${extensionId.value}`);
                    const scope = typeof global === 'object' ? global : self; // `global` is nodejs while `self` is for workers
                    const activateResult = extensionModule.activate.apply(scope, [context]);
                    activationTimesBuilder.activateCallStop();
                    activationTimesBuilder.activateResolveStart();
                    return Promise.resolve(activateResult).then((value) => {
                        activationTimesBuilder.activateResolveStop();
                        return value;
                    });
                }
                catch (err) {
                    return Promise.reject(err);
                }
            }
            else {
                // No activate found => the module is the extension's exports
                return Promise.resolve(extensionModule);
            }
        }
        // -- eager activation
        _activateOneStartupFinished(desc, activationEvent) {
            this._activateById(desc.identifier, {
                startup: false,
                extensionId: desc.identifier,
                activationEvent: activationEvent
            }).then(undefined, (err) => {
                this._logService.error(err);
            });
        }
        _activateAllStartupFinishedDeferred(extensions, start = 0) {
            const timeBudget = 50; // 50 milliseconds
            const startTime = Date.now();
            (0, platform_1.setTimeout0)(() => {
                for (let i = start; i < extensions.length; i += 1) {
                    const desc = extensions[i];
                    for (const activationEvent of (desc.activationEvents ?? [])) {
                        if (activationEvent === 'onStartupFinished') {
                            if (Date.now() - startTime > timeBudget) {
                                // time budget for current task has been exceeded
                                // set a new task to activate current and remaining extensions
                                this._activateAllStartupFinishedDeferred(extensions, i);
                                break;
                            }
                            else {
                                this._activateOneStartupFinished(desc, activationEvent);
                            }
                        }
                    }
                }
            });
        }
        _activateAllStartupFinished() {
            // startup is considered finished
            this._mainThreadExtensionsProxy.$setPerformanceMarks(performance.getMarks());
            this._extHostConfiguration.getConfigProvider().then((configProvider) => {
                const shouldDeferActivation = configProvider.getConfiguration('extensions.experimental').get('deferredStartupFinishedActivation');
                const allExtensionDescriptions = this._myRegistry.getAllExtensionDescriptions();
                if (shouldDeferActivation) {
                    this._activateAllStartupFinishedDeferred(allExtensionDescriptions);
                }
                else {
                    for (const desc of allExtensionDescriptions) {
                        if (desc.activationEvents) {
                            for (const activationEvent of desc.activationEvents) {
                                if (activationEvent === 'onStartupFinished') {
                                    this._activateOneStartupFinished(desc, activationEvent);
                                }
                            }
                        }
                    }
                }
            });
        }
        // Handle "eager" activation extensions
        _handleEagerExtensions() {
            const starActivation = this._activateByEvent('*', true).then(undefined, (err) => {
                this._logService.error(err);
            });
            this._register(this._extHostWorkspace.onDidChangeWorkspace((e) => this._handleWorkspaceContainsEagerExtensions(e.added)));
            const folders = this._extHostWorkspace.workspace ? this._extHostWorkspace.workspace.folders : [];
            const workspaceContainsActivation = this._handleWorkspaceContainsEagerExtensions(folders);
            const remoteResolverActivation = this._handleRemoteResolverEagerExtensions();
            const eagerExtensionsActivation = Promise.all([remoteResolverActivation, starActivation, workspaceContainsActivation]).then(() => { });
            Promise.race([eagerExtensionsActivation, (0, async_1.timeout)(10000)]).then(() => {
                this._activateAllStartupFinished();
            });
            return eagerExtensionsActivation;
        }
        _handleWorkspaceContainsEagerExtensions(folders) {
            if (folders.length === 0) {
                return Promise.resolve(undefined);
            }
            return Promise.all(this._myRegistry.getAllExtensionDescriptions().map((desc) => {
                return this._handleWorkspaceContainsEagerExtension(folders, desc);
            })).then(() => { });
        }
        async _handleWorkspaceContainsEagerExtension(folders, desc) {
            if (this.isActivated(desc.identifier)) {
                return;
            }
            const localWithRemote = !this._initData.remote.isRemote && !!this._initData.remote.authority;
            const host = {
                logService: this._logService,
                folders: folders.map(folder => folder.uri),
                forceUsingSearch: localWithRemote || !this._hostUtils.fsExists,
                exists: (uri) => this._hostUtils.fsExists(uri.fsPath),
                checkExists: (folders, includes, token) => this._mainThreadWorkspaceProxy.$checkExists(folders, includes, token)
            };
            const result = await (0, workspaceContains_1.checkActivateWorkspaceContainsExtension)(host, desc);
            if (!result) {
                return;
            }
            return (this._activateById(desc.identifier, { startup: true, extensionId: desc.identifier, activationEvent: result.activationEvent })
                .then(undefined, err => this._logService.error(err)));
        }
        async _handleRemoteResolverEagerExtensions() {
            if (this._initData.remote.authority) {
                return this._activateByEvent(`onResolveRemoteAuthority:${this._initData.remote.authority}`, false);
            }
        }
        async $extensionTestsExecute() {
            await this._eagerExtensionsActivated.wait();
            try {
                return await this._doHandleExtensionTests();
            }
            catch (error) {
                console.error(error); // ensure any error message makes it onto the console
                throw error;
            }
        }
        async _doHandleExtensionTests() {
            const { extensionDevelopmentLocationURI, extensionTestsLocationURI } = this._initData.environment;
            if (!extensionDevelopmentLocationURI || !extensionTestsLocationURI) {
                throw new Error(nls.localize('extensionTestError1', "Cannot load test runner."));
            }
            // Require the test runner via node require from the provided path
            const testRunner = await this._loadCommonJSModule(null, extensionTestsLocationURI, new extHostExtensionActivator_1.ExtensionActivationTimesBuilder(false));
            if (!testRunner || typeof testRunner.run !== 'function') {
                throw new Error(nls.localize('extensionTestError', "Path {0} does not point to a valid extension test runner.", extensionTestsLocationURI.toString()));
            }
            // Execute the runner if it follows the old `run` spec
            return new Promise((resolve, reject) => {
                const oldTestRunnerCallback = (error, failures) => {
                    if (error) {
                        if (platform_1.isCI) {
                            this._logService.error(`Test runner called back with error`, error);
                        }
                        reject(error);
                    }
                    else {
                        if (platform_1.isCI) {
                            if (failures) {
                                this._logService.info(`Test runner called back with ${failures} failures.`);
                            }
                            else {
                                this._logService.info(`Test runner called back with successful outcome.`);
                            }
                        }
                        resolve((typeof failures === 'number' && failures > 0) ? 1 /* ERROR */ : 0 /* OK */);
                    }
                };
                const extensionTestsPath = (0, resources_1.originalFSPath)(extensionTestsLocationURI); // for the old test runner API
                const runResult = testRunner.run(extensionTestsPath, oldTestRunnerCallback);
                // Using the new API `run(): Promise<void>`
                if (runResult && runResult.then) {
                    runResult
                        .then(() => {
                        if (platform_1.isCI) {
                            this._logService.info(`Test runner finished successfully.`);
                        }
                        resolve(0);
                    })
                        .catch((err) => {
                        if (platform_1.isCI) {
                            this._logService.error(`Test runner finished with error`, err);
                        }
                        reject(err instanceof Error && err.stack ? err.stack : String(err));
                    });
                }
            });
        }
        _startExtensionHost() {
            if (this._started) {
                throw new Error(`Extension host is already started!`);
            }
            this._started = true;
            return this._readyToStartExtensionHost.wait()
                .then(() => this._readyToRunExtensions.open())
                .then(() => {
                // wait for all activation events that came in during workbench startup, but at maximum 1s
                return Promise.race([this._activator.waitForActivatingExtensions(), (0, async_1.timeout)(1000)]);
            })
                .then(() => this._handleEagerExtensions())
                .then(() => {
                this._eagerExtensionsActivated.open();
                this._logService.info(`Eager extensions activated`);
            });
        }
        // -- called by extensions
        registerRemoteAuthorityResolver(authorityPrefix, resolver) {
            this._resolvers[authorityPrefix] = resolver;
            return (0, lifecycle_1.toDisposable)(() => {
                delete this._resolvers[authorityPrefix];
            });
        }
        async getRemoteExecServer(remoteAuthority) {
            const { resolver } = await this._activateAndGetResolver(remoteAuthority);
            return resolver?.resolveExecServer?.(remoteAuthority, { resolveAttempt: 0 });
        }
        // -- called by main thread
        async _activateAndGetResolver(remoteAuthority) {
            const authorityPlusIndex = remoteAuthority.indexOf('+');
            if (authorityPlusIndex === -1) {
                throw new extHostTypes_1.RemoteAuthorityResolverError(`Not an authority that can be resolved!`, remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.InvalidAuthority);
            }
            const authorityPrefix = remoteAuthority.substr(0, authorityPlusIndex);
            await this._almostReadyToRunExtensions.wait();
            await this._activateByEvent(`onResolveRemoteAuthority:${authorityPrefix}`, false);
            return { authorityPrefix, resolver: this._resolvers[authorityPrefix] };
        }
        async $resolveAuthority(remoteAuthorityChain, resolveAttempt) {
            const sw = stopwatch_1.StopWatch.create(false);
            const prefix = () => `[resolveAuthority(${(0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(remoteAuthorityChain)},${resolveAttempt})][${sw.elapsed()}ms] `;
            const logInfo = (msg) => this._logService.info(`${prefix()}${msg}`);
            const logWarning = (msg) => this._logService.warn(`${prefix()}${msg}`);
            const logError = (msg, err = undefined) => this._logService.error(`${prefix()}${msg}`, err);
            const normalizeError = (err) => {
                if (err instanceof extHostTypes_1.RemoteAuthorityResolverError) {
                    return {
                        type: 'error',
                        error: {
                            code: err._code,
                            message: err._message,
                            detail: err._detail
                        }
                    };
                }
                throw err;
            };
            const getResolver = async (remoteAuthority) => {
                logInfo(`activating resolver for ${remoteAuthority}...`);
                const { resolver, authorityPrefix } = await this._activateAndGetResolver(remoteAuthority);
                if (!resolver) {
                    logError(`no resolver for ${authorityPrefix}`);
                    throw new extHostTypes_1.RemoteAuthorityResolverError(`No remote extension installed to resolve ${authorityPrefix}.`, remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.NoResolverFound);
                }
                return { resolver, authorityPrefix, remoteAuthority };
            };
            const chain = remoteAuthorityChain.split(/@|%40/g).reverse();
            logInfo(`activating remote resolvers ${chain.join(' -> ')}`);
            let resolvers;
            try {
                resolvers = await Promise.all(chain.map(getResolver)).catch(async (e) => {
                    if (!(e instanceof extHostTypes_1.RemoteAuthorityResolverError) || e._code !== remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.InvalidAuthority) {
                        throw e;
                    }
                    logWarning(`resolving nested authorities failed: ${e.message}`);
                    return [await getResolver(remoteAuthorityChain)];
                });
            }
            catch (e) {
                return normalizeError(e);
            }
            const intervalLogger = new async_1.IntervalTimer();
            intervalLogger.cancelAndSet(() => logInfo('waiting...'), 1000);
            let result;
            let execServer;
            for (const [i, { authorityPrefix, resolver, remoteAuthority }] of resolvers.entries()) {
                try {
                    if (i === resolvers.length - 1) {
                        logInfo(`invoking final resolve()...`);
                        performance.mark(`code/extHost/willResolveAuthority/${authorityPrefix}`);
                        result = await resolver.resolve(remoteAuthority, { resolveAttempt, execServer });
                        performance.mark(`code/extHost/didResolveAuthorityOK/${authorityPrefix}`);
                        logInfo(`setting tunnel factory...`);
                        this._register(await this._extHostTunnelService.setTunnelFactory(resolver, extHostTypes_1.ManagedResolvedAuthority.isManagedResolvedAuthority(result) ? result : undefined));
                    }
                    else {
                        logInfo(`invoking resolveExecServer() for ${remoteAuthority}`);
                        performance.mark(`code/extHost/willResolveExecServer/${authorityPrefix}`);
                        execServer = await resolver.resolveExecServer?.(remoteAuthority, { resolveAttempt, execServer });
                        if (!execServer) {
                            throw new extHostTypes_1.RemoteAuthorityResolverError(`Exec server was not available for ${remoteAuthority}`, remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.NoResolverFound); // we did, in fact, break the chain :(
                        }
                        performance.mark(`code/extHost/didResolveExecServerOK/${authorityPrefix}`);
                    }
                }
                catch (e) {
                    performance.mark(`code/extHost/didResolveAuthorityError/${authorityPrefix}`);
                    logError(`returned an error`, e);
                    intervalLogger.dispose();
                    return normalizeError(e);
                }
            }
            intervalLogger.dispose();
            const tunnelInformation = {
                environmentTunnels: result.environmentTunnels,
                features: result.tunnelFeatures ? {
                    elevation: result.tunnelFeatures.elevation,
                    privacyOptions: result.tunnelFeatures.privacyOptions,
                    protocol: result.tunnelFeatures.protocol === undefined ? true : result.tunnelFeatures.protocol,
                } : undefined
            };
            // Split merged API result into separate authority/options
            const options = {
                extensionHostEnv: result.extensionHostEnv,
                isTrusted: result.isTrusted,
                authenticationSession: result.authenticationSessionForInitializingExtensions ? { id: result.authenticationSessionForInitializingExtensions.id, providerId: result.authenticationSessionForInitializingExtensions.providerId } : undefined
            };
            // extension are not required to return an instance of ResolvedAuthority or ManagedResolvedAuthority, so don't use `instanceof`
            logInfo(`returned ${extHostTypes_1.ManagedResolvedAuthority.isManagedResolvedAuthority(result) ? 'managed authority' : `${result.host}:${result.port}`}`);
            let authority;
            if (extHostTypes_1.ManagedResolvedAuthority.isManagedResolvedAuthority(result)) {
                // The socket factory is identified by the `resolveAttempt`, since that is a number which
                // always increments and is unique over all resolve() calls in a workbench session.
                const socketFactoryId = resolveAttempt;
                // There is only on managed socket factory at a time, so we can just overwrite the old one.
                this._extHostManagedSockets.setFactory(socketFactoryId, result.makeConnection);
                authority = {
                    authority: remoteAuthorityChain,
                    connectTo: new remoteAuthorityResolver_1.ManagedRemoteConnection(socketFactoryId),
                    connectionToken: result.connectionToken
                };
            }
            else {
                authority = {
                    authority: remoteAuthorityChain,
                    connectTo: new remoteAuthorityResolver_1.WebSocketRemoteConnection(result.host, result.port),
                    connectionToken: result.connectionToken
                };
            }
            return {
                type: 'ok',
                value: {
                    authority: authority,
                    options,
                    tunnelInformation,
                }
            };
        }
        async $getCanonicalURI(remoteAuthority, uriComponents) {
            this._logService.info(`$getCanonicalURI invoked for authority (${(0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(remoteAuthority)})`);
            const { resolver } = await this._activateAndGetResolver(remoteAuthority);
            if (!resolver) {
                // Return `null` if no resolver for `remoteAuthority` is found.
                return null;
            }
            const uri = uri_1.URI.revive(uriComponents);
            if (typeof resolver.getCanonicalURI === 'undefined') {
                // resolver cannot compute canonical URI
                return uri;
            }
            const result = await (0, async_1.asPromise)(() => resolver.getCanonicalURI(uri));
            if (!result) {
                return uri;
            }
            return result;
        }
        async $startExtensionHost(extensionsDelta) {
            extensionsDelta.toAdd.forEach((extension) => extension.extensionLocation = uri_1.URI.revive(extension.extensionLocation));
            const { globalRegistry, myExtensions } = applyExtensionsDelta(this._activationEventsReader, this._globalRegistry, this._myRegistry, extensionsDelta);
            const newSearchTree = await this._createExtensionPathIndex(myExtensions);
            const extensionsPaths = await this.getExtensionPathIndex();
            extensionsPaths.setSearchTree(newSearchTree);
            this._globalRegistry.set(globalRegistry.getAllExtensionDescriptions());
            this._myRegistry.set(myExtensions);
            if (platform_1.isCI) {
                this._logService.info(`$startExtensionHost: global extensions: ${printExtIds(this._globalRegistry)}`);
                this._logService.info(`$startExtensionHost: local extensions: ${printExtIds(this._myRegistry)}`);
            }
            return this._startExtensionHost();
        }
        $activateByEvent(activationEvent, activationKind) {
            if (activationKind === 1 /* ActivationKind.Immediate */) {
                return this._almostReadyToRunExtensions.wait()
                    .then(_ => this._activateByEvent(activationEvent, false));
            }
            return (this._readyToRunExtensions.wait()
                .then(_ => this._activateByEvent(activationEvent, false)));
        }
        async $activate(extensionId, reason) {
            await this._readyToRunExtensions.wait();
            if (!this._myRegistry.getExtensionDescription(extensionId)) {
                // unknown extension => ignore
                return false;
            }
            await this._activateById(extensionId, reason);
            return true;
        }
        async $deltaExtensions(extensionsDelta) {
            extensionsDelta.toAdd.forEach((extension) => extension.extensionLocation = uri_1.URI.revive(extension.extensionLocation));
            // First build up and update the trie and only afterwards apply the delta
            const { globalRegistry, myExtensions } = applyExtensionsDelta(this._activationEventsReader, this._globalRegistry, this._myRegistry, extensionsDelta);
            const newSearchTree = await this._createExtensionPathIndex(myExtensions);
            const extensionsPaths = await this.getExtensionPathIndex();
            extensionsPaths.setSearchTree(newSearchTree);
            this._globalRegistry.set(globalRegistry.getAllExtensionDescriptions());
            this._myRegistry.set(myExtensions);
            if (platform_1.isCI) {
                this._logService.info(`$deltaExtensions: global extensions: ${printExtIds(this._globalRegistry)}`);
                this._logService.info(`$deltaExtensions: local extensions: ${printExtIds(this._myRegistry)}`);
            }
            return Promise.resolve(undefined);
        }
        async $test_latency(n) {
            return n;
        }
        async $test_up(b) {
            return b.byteLength;
        }
        async $test_down(size) {
            const buff = buffer_1.VSBuffer.alloc(size);
            const value = Math.random() % 256;
            for (let i = 0; i < size; i++) {
                buff.writeUInt8(value, i);
            }
            return buff;
        }
        async $updateRemoteConnectionData(connectionData) {
            this._remoteConnectionData = connectionData;
            this._onDidChangeRemoteConnectionData.fire();
        }
    };
    exports.AbstractExtHostExtensionService = AbstractExtHostExtensionService;
    exports.AbstractExtHostExtensionService = AbstractExtHostExtensionService = AbstractExtHostExtensionService_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, exports.IHostUtils),
        __param(2, extHostRpcService_1.IExtHostRpcService),
        __param(3, extHostWorkspace_1.IExtHostWorkspace),
        __param(4, extHostConfiguration_1.IExtHostConfiguration),
        __param(5, log_1.ILogService),
        __param(6, extHostInitDataService_1.IExtHostInitDataService),
        __param(7, extHostStoragePaths_1.IExtensionStoragePaths),
        __param(8, extHostTunnelService_1.IExtHostTunnelService),
        __param(9, extHostTerminalService_1.IExtHostTerminalService),
        __param(10, extHostLocalizationService_1.IExtHostLocalizationService),
        __param(11, extHostManagedSockets_1.IExtHostManagedSockets),
        __param(12, extHostLanguageModels_1.IExtHostLanguageModels)
    ], AbstractExtHostExtensionService);
    function applyExtensionsDelta(activationEventsReader, oldGlobalRegistry, oldMyRegistry, extensionsDelta) {
        activationEventsReader.addActivationEvents(extensionsDelta.addActivationEvents);
        const globalRegistry = new extensionDescriptionRegistry_1.ExtensionDescriptionRegistry(activationEventsReader, oldGlobalRegistry.getAllExtensionDescriptions());
        globalRegistry.deltaExtensions(extensionsDelta.toAdd, extensionsDelta.toRemove);
        const myExtensionsSet = new extensions_2.ExtensionIdentifierSet(oldMyRegistry.getAllExtensionDescriptions().map(extension => extension.identifier));
        for (const extensionId of extensionsDelta.myToRemove) {
            myExtensionsSet.delete(extensionId);
        }
        for (const extensionId of extensionsDelta.myToAdd) {
            myExtensionsSet.add(extensionId);
        }
        const myExtensions = filterExtensions(globalRegistry, myExtensionsSet);
        return { globalRegistry, myExtensions };
    }
    function getTelemetryActivationEvent(extensionDescription, reason) {
        const event = {
            id: extensionDescription.identifier.value,
            name: extensionDescription.name,
            extensionVersion: extensionDescription.version,
            publisherDisplayName: extensionDescription.publisher,
            activationEvents: extensionDescription.activationEvents ? extensionDescription.activationEvents.join(',') : null,
            isBuiltin: extensionDescription.isBuiltin,
            reason: reason.activationEvent,
            reasonId: reason.extensionId.value,
        };
        return event;
    }
    function printExtIds(registry) {
        return registry.getAllExtensionDescriptions().map(ext => ext.identifier.value).join(',');
    }
    exports.IExtHostExtensionService = (0, instantiation_1.createDecorator)('IExtHostExtensionService');
    class Extension {
        #extensionService;
        #originExtensionId;
        #identifier;
        constructor(extensionService, originExtensionId, description, kind, isFromDifferentExtensionHost) {
            this.#extensionService = extensionService;
            this.#originExtensionId = originExtensionId;
            this.#identifier = description.identifier;
            this.id = description.identifier.value;
            this.extensionUri = description.extensionLocation;
            this.extensionPath = path.normalize((0, resources_1.originalFSPath)(description.extensionLocation));
            this.packageJSON = description;
            this.extensionKind = kind;
            this.isFromDifferentExtensionHost = isFromDifferentExtensionHost;
        }
        get isActive() {
            // TODO@alexdima support this
            return this.#extensionService.isActivated(this.#identifier);
        }
        get exports() {
            if (this.packageJSON.api === 'none' || this.isFromDifferentExtensionHost) {
                return undefined; // Strict nulloverride - Public api
            }
            return this.#extensionService.getExtensionExports(this.#identifier);
        }
        async activate() {
            if (this.isFromDifferentExtensionHost) {
                throw new Error('Cannot activate foreign extension'); // TODO@alexdima support this
            }
            await this.#extensionService.activateByIdWithErrors(this.#identifier, { startup: false, extensionId: this.#originExtensionId, activationEvent: 'api' });
            return this.exports;
        }
    }
    exports.Extension = Extension;
    function filterExtensions(globalRegistry, desiredExtensions) {
        return globalRegistry.getAllExtensionDescriptions().filter(extension => desiredExtensions.has(extension.identifier));
    }
    class ExtensionPaths {
        constructor(_searchTree) {
            this._searchTree = _searchTree;
        }
        setSearchTree(searchTree) {
            this._searchTree = searchTree;
        }
        findSubstr(key) {
            return this._searchTree.findSubstr(key);
        }
        forEach(callback) {
            return this._searchTree.forEach(callback);
        }
    }
    exports.ExtensionPaths = ExtensionPaths;
    /**
     * This mirrors the activation events as seen by the renderer. The renderer
     * is the only one which can have a reliable view of activation events because
     * implicit activation events are generated via extension points, and they
     * are registered only on the renderer side.
     */
    class SyncedActivationEventsReader {
        constructor(activationEvents) {
            this._map = new extensions_2.ExtensionIdentifierMap();
            this.addActivationEvents(activationEvents);
        }
        readActivationEvents(extensionDescription) {
            return this._map.get(extensionDescription.identifier) ?? [];
        }
        addActivationEvents(activationEvents) {
            for (const extensionId of Object.keys(activationEvents)) {
                this._map.set(extensionId, activationEvents[extensionId]);
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEV4dGVuc2lvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RFeHRlbnNpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEwRG5GLFFBQUEsVUFBVSxHQUFHLElBQUEsK0JBQWUsRUFBYSxZQUFZLENBQUMsQ0FBQztJQXFCN0QsSUFBZSwrQkFBK0IsdUNBQTlDLE1BQWUsK0JBQWdDLFNBQVEsc0JBQVU7UUE2Q3ZFLFlBQ3dCLFlBQW1DLEVBQzlDLFNBQXFCLEVBQ2IsY0FBa0MsRUFDbkMsZ0JBQW1DLEVBQy9CLG9CQUEyQyxFQUNyRCxVQUF1QixFQUNYLFFBQWlDLEVBQ2xDLFdBQW1DLEVBQ3BDLG9CQUEyQyxFQUN6QyxzQkFBK0MsRUFDM0MsMEJBQXVELEVBQzVELHNCQUErRCxFQUMvRCxzQkFBK0Q7WUFFdkYsS0FBSyxFQUFFLENBQUM7WUFIaUMsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF3QjtZQUM5QywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1lBcER2RSxxQ0FBZ0MsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUN4RSxvQ0FBK0IsR0FBRyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsS0FBSyxDQUFDO1lBOEJ0RixtQkFBYyxHQUFHLElBQUksR0FBRyxFQUEyQixDQUFDO1lBS3BELG1CQUFjLEdBQVksS0FBSyxDQUFDO1lBbUJ2QyxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixJQUFJLENBQUMsZUFBZSxHQUFHLGNBQWMsQ0FBQztZQUN0QyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUUxQixJQUFJLENBQUMsaUJB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