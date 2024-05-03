/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/base/common/arrays", "vs/base/common/event", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc.mp", "vs/code/node/sharedProcess/contrib/codeCacheCleaner", "vs/code/node/sharedProcess/contrib/languagePackCachedDataCleaner", "vs/code/node/sharedProcess/contrib/localizationsUpdater", "vs/code/node/sharedProcess/contrib/logsDataCleaner", "vs/code/node/sharedProcess/contrib/storageDataCleaner", "vs/platform/checksum/common/checksumService", "vs/platform/checksum/node/checksumService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationService", "vs/platform/diagnostics/common/diagnostics", "vs/platform/diagnostics/node/diagnosticsService", "vs/platform/download/common/download", "vs/platform/download/common/downloadService", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionEnablementService", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/node/extensionSignatureVerificationService", "vs/platform/extensionManagement/common/extensionManagementIpc", "vs/platform/extensionManagement/node/extensionManagementService", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/languagePacks/common/languagePacks", "vs/platform/languagePacks/node/languagePacks", "vs/platform/log/common/log", "vs/platform/log/common/logIpc", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/commonProperties", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryIpc", "vs/platform/telemetry/common/telemetryLogAppender", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/telemetry/node/customEndpointTelemetryService", "vs/platform/extensionManagement/common/extensionStorage", "vs/platform/userDataSync/common/ignoredExtensions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/userDataSync/common/userDataSyncLocalStoreService", "vs/platform/userDataSync/common/userDataSyncIpc", "vs/platform/userDataSync/common/userDataSyncLog", "vs/platform/userDataSync/common/userDataSyncMachines", "vs/platform/userDataSync/common/userDataSyncEnablementService", "vs/platform/userDataSync/common/userDataSyncService", "vs/platform/userDataSync/common/userDataSyncServiceIpc", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/platform/userDataProfile/common/userDataProfileStorageService", "vs/platform/userDataProfile/node/userDataProfileStorageService", "vs/platform/windows/node/windowTracker", "vs/platform/sign/common/sign", "vs/platform/sign/node/signService", "vs/platform/tunnel/common/tunnel", "vs/platform/tunnel/node/tunnelService", "vs/platform/remote/common/sharedProcessTunnelService", "vs/platform/tunnel/node/sharedProcessTunnelService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/base/common/platform", "vs/platform/userData/common/fileUserDataProvider", "vs/platform/files/common/diskFileSystemProviderClient", "vs/platform/profiling/node/profilingService", "vs/platform/profiling/common/profiling", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/extensionManagement/node/extensionsScannerService", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/policy/common/policyIpc", "vs/platform/policy/common/policy", "vs/platform/userDataProfile/common/userDataProfileIpc", "vs/platform/telemetry/node/1dsAppender", "vs/code/node/sharedProcess/contrib/userDataProfilesCleaner", "vs/platform/remoteTunnel/common/remoteTunnel", "vs/platform/userDataSync/common/userDataSyncResourceProvider", "vs/code/node/sharedProcess/contrib/extensions", "vs/nls", "vs/platform/log/common/logService", "vs/platform/lifecycle/node/sharedProcessLifecycleService", "vs/platform/remoteTunnel/node/remoteTunnelService", "vs/platform/extensionManagement/node/extensionsProfileScannerService", "vs/platform/request/common/requestIpc", "vs/platform/extensionRecommendations/common/extensionRecommendationsIpc", "vs/platform/native/common/native", "vs/platform/native/common/nativeHostService", "vs/platform/userDataSync/node/userDataAutoSyncService", "vs/platform/extensionManagement/node/extensionTipsService", "vs/platform/ipc/common/mainProcessService", "vs/platform/storage/common/storageService", "vs/platform/remote/common/remoteSocketFactoryService", "vs/platform/remote/node/nodeSocketFactory", "vs/platform/environment/node/environmentService", "vs/platform/sharedProcess/common/sharedProcess", "vs/base/node/osReleaseInfo", "vs/base/common/desktopEnvironmentInfo", "vs/base/node/osDisplayProtocolInfo"], function (require, exports, os_1, errorMessage_1, errors_1, lifecycle_1, network_1, uri_1, arrays_1, event_1, ipc_1, ipc_mp_1, codeCacheCleaner_1, languagePackCachedDataCleaner_1, localizationsUpdater_1, logsDataCleaner_1, storageDataCleaner_1, checksumService_1, checksumService_2, configuration_1, configurationService_1, diagnostics_1, diagnosticsService_1, download_1, downloadService_1, environment_1, extensionEnablementService_1, extensionGalleryService_1, extensionManagement_1, extensionSignatureVerificationService_1, extensionManagementIpc_1, extensionManagementService_1, extensionRecommendations_1, files_1, fileService_1, diskFileSystemProvider_1, descriptors_1, instantiation_1, instantiationService_1, serviceCollection_1, languagePacks_1, languagePacks_2, log_1, logIpc_1, product_1, productService_1, request_1, storage_1, commonProperties_1, telemetry_1, telemetryIpc_1, telemetryLogAppender_1, telemetryService_1, telemetryUtils_1, customEndpointTelemetryService_1, extensionStorage_1, ignoredExtensions_1, userDataSync_1, userDataSyncAccount_1, userDataSyncLocalStoreService_1, userDataSyncIpc_1, userDataSyncLog_1, userDataSyncMachines_1, userDataSyncEnablementService_1, userDataSyncService_1, userDataSyncServiceIpc_1, userDataSyncStoreService_1, userDataProfileStorageService_1, userDataProfileStorageService_2, windowTracker_1, sign_1, signService_1, tunnel_1, tunnelService_1, sharedProcessTunnelService_1, sharedProcessTunnelService_2, uriIdentity_1, uriIdentityService_1, platform_1, fileUserDataProvider_1, diskFileSystemProviderClient_1, profilingService_1, profiling_1, extensionsScannerService_1, extensionsScannerService_2, userDataProfile_1, extensionsProfileScannerService_1, policyIpc_1, policy_1, userDataProfileIpc_1, _1dsAppender_1, userDataProfilesCleaner_1, remoteTunnel_1, userDataSyncResourceProvider_1, extensions_1, nls_1, logService_1, sharedProcessLifecycleService_1, remoteTunnelService_1, extensionsProfileScannerService_2, requestIpc_1, extensionRecommendationsIpc_1, native_1, nativeHostService_1, userDataAutoSyncService_1, extensionTipsService_1, mainProcessService_1, storageService_1, remoteSocketFactoryService_1, nodeSocketFactory_1, environmentService_1, sharedProcess_1, osReleaseInfo_1, desktopEnvironmentInfo_1, osDisplayProtocolInfo_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.main = main;
    class SharedProcessMain extends lifecycle_1.Disposable {
        constructor(configuration) {
            super();
            this.configuration = configuration;
            this.server = this._register(new ipc_mp_1.Server(this));
            this.lifecycleService = undefined;
            this.onDidWindowConnectRaw = this._register(new event_1.Emitter());
            this.registerListeners();
        }
        registerListeners() {
            // Shared process lifecycle
            let didExit = false;
            const onExit = () => {
                if (!didExit) {
                    didExit = true;
                    this.lifecycleService?.fireOnWillShutdown();
                    this.dispose();
                }
            };
            process.once('exit', onExit);
            (0, ipc_mp_1.once)(process.parentPort, sharedProcess_1.SharedProcessLifecycle.exit, onExit);
        }
        async init() {
            // Services
            const instantiationService = await this.initServices();
            // Config
            (0, userDataSync_1.registerConfiguration)();
            instantiationService.invokeFunction(accessor => {
                const logService = accessor.get(log_1.ILogService);
                const telemetryService = accessor.get(telemetry_1.ITelemetryService);
                const userDataProfilesService = accessor.get(userDataProfile_1.IUserDataProfilesService);
                // Log info
                logService.trace('sharedProcess configuration', JSON.stringify(this.configuration));
                // Channels
                this.initChannels(accessor);
                // Error handler
                this.registerErrorHandler(logService);
                // Report Profiles Info
                this.reportProfilesInfo(telemetryService, userDataProfilesService);
                this._register(userDataProfilesService.onDidChangeProfiles(() => this.reportProfilesInfo(telemetryService, userDataProfilesService)));
                // Report Client OS/DE Info
                this.reportClientOSInfo(telemetryService, logService);
            });
            // Instantiate Contributions
            this._register((0, lifecycle_1.combinedDisposable)(instantiationService.createInstance(codeCacheCleaner_1.CodeCacheCleaner, this.configuration.codeCachePath), instantiationService.createInstance(languagePackCachedDataCleaner_1.LanguagePackCachedDataCleaner), instantiationService.createInstance(storageDataCleaner_1.UnusedWorkspaceStorageDataCleaner), instantiationService.createInstance(logsDataCleaner_1.LogsDataCleaner), instantiationService.createInstance(localizationsUpdater_1.LocalizationsUpdater), instantiationService.createInstance(extensions_1.ExtensionsContributions), instantiationService.createInstance(userDataProfilesCleaner_1.UserDataProfilesCleaner)));
        }
        async initServices() {
            const services = new serviceCollection_1.ServiceCollection();
            // Product
            const productService = { _serviceBrand: undefined, ...product_1.default };
            services.set(productService_1.IProductService, productService);
            // Main Process
            const mainRouter = new ipc_1.StaticRouter(ctx => ctx === 'main');
            const mainProcessService = new mainProcessService_1.MainProcessService(this.server, mainRouter);
            services.set(mainProcessService_1.IMainProcessService, mainProcessService);
            // Policies
            const policyService = this.configuration.policiesData ? new policyIpc_1.PolicyChannelClient(this.configuration.policiesData, mainProcessService.getChannel('policy')) : new policy_1.NullPolicyService();
            services.set(policy_1.IPolicyService, policyService);
            // Environment
            const environmentService = new environmentService_1.NativeEnvironmentService(this.configuration.args, productService);
            services.set(environment_1.INativeEnvironmentService, environmentService);
            // Logger
            const loggerService = new logIpc_1.LoggerChannelClient(undefined, this.configuration.logLevel, environmentService.logsHome, this.configuration.loggers.map(loggerResource => ({ ...loggerResource, resource: uri_1.URI.revive(loggerResource.resource) })), mainProcessService.getChannel('logger'));
            services.set(log_1.ILoggerService, loggerService);
            // Log
            const logger = this._register(loggerService.createLogger('sharedprocess', { name: (0, nls_1.localize)('sharedLog', "Shared") }));
            const consoleLogger = this._register(new log_1.ConsoleLogger(logger.getLevel()));
            const logService = this._register(new logService_1.LogService(logger, [consoleLogger]));
            services.set(log_1.ILogService, logService);
            // Lifecycle
            this.lifecycleService = this._register(new sharedProcessLifecycleService_1.SharedProcessLifecycleService(logService));
            services.set(sharedProcessLifecycleService_1.ISharedProcessLifecycleService, this.lifecycleService);
            // Files
            const fileService = this._register(new fileService_1.FileService(logService));
            services.set(files_1.IFileService, fileService);
            const diskFileSystemProvider = this._register(new diskFileSystemProvider_1.DiskFileSystemProvider(logService));
            fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
            // URI Identity
            const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
            services.set(uriIdentity_1.IUriIdentityService, uriIdentityService);
            // User Data Profiles
            const userDataProfilesService = this._register(new userDataProfileIpc_1.UserDataProfilesService(this.configuration.profiles.all, uri_1.URI.revive(this.configuration.profiles.home).with({ scheme: environmentService.userRoamingDataHome.scheme }), mainProcessService.getChannel('userDataProfiles')));
            services.set(userDataProfile_1.IUserDataProfilesService, userDataProfilesService);
            const userDataFileSystemProvider = this._register(new fileUserDataProvider_1.FileUserDataProvider(network_1.Schemas.file, 
            // Specifically for user data, use the disk file system provider
            // from the main process to enable atomic read/write operations.
            // Since user data can change very frequently across multiple
            // processes, we want a single process handling these operations.
            this._register(new diskFileSystemProviderClient_1.DiskFileSystemProviderClient(mainProcessService.getChannel(diskFileSystemProviderClient_1.LOCAL_FILE_SYSTEM_CHANNEL_NAME), { pathCaseSensitive: platform_1.isLinux })), network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, logService));
            fileService.registerProvider(network_1.Schemas.vscodeUserData, userDataFileSystemProvider);
            // Configuration
            const configurationService = this._register(new configurationService_1.ConfigurationService(userDataProfilesService.defaultProfile.settingsResource, fileService, policyService, logService));
            services.set(configuration_1.IConfigurationService, configurationService);
            // Storage (global access only)
            const storageService = new storageService_1.RemoteStorageService(undefined, { defaultProfile: userDataProfilesService.defaultProfile, currentProfile: userDataProfilesService.defaultProfile }, mainProcessService, environmentService);
            services.set(storage_1.IStorageService, storageService);
            this._register((0, lifecycle_1.toDisposable)(() => storageService.flush()));
            // Initialize config & storage in parallel
            await Promise.all([
                configurationService.initialize(),
                storageService.initialize()
            ]);
            // Request
            const requestService = new requestIpc_1.RequestChannelClient(mainProcessService.getChannel('request'));
            services.set(request_1.IRequestService, requestService);
            // Checksum
            services.set(checksumService_1.IChecksumService, new descriptors_1.SyncDescriptor(checksumService_2.ChecksumService, undefined, false /* proxied to other processes */));
            // V8 Inspect profiler
            services.set(profiling_1.IV8InspectProfilingService, new descriptors_1.SyncDescriptor(profilingService_1.InspectProfilingService, undefined, false /* proxied to other processes */));
            // Native Host
            const nativeHostService = new nativeHostService_1.NativeHostService(-1 /* we are not running in a browser window context */, mainProcessService);
            services.set(native_1.INativeHostService, nativeHostService);
            // Download
            services.set(download_1.IDownloadService, new descriptors_1.SyncDescriptor(downloadService_1.DownloadService, undefined, true));
            // Extension recommendations
            const activeWindowManager = this._register(new windowTracker_1.ActiveWindowManager(nativeHostService));
            const activeWindowRouter = new ipc_1.StaticRouter(ctx => activeWindowManager.getActiveClientId().then(id => ctx === id));
            services.set(extensionRecommendations_1.IExtensionRecommendationNotificationService, new extensionRecommendationsIpc_1.ExtensionRecommendationNotificationServiceChannelClient(this.server.getChannel('extensionRecommendationNotification', activeWindowRouter)));
            // Telemetry
            let telemetryService;
            const appenders = [];
            const internalTelemetry = (0, telemetryUtils_1.isInternalTelemetry)(productService, configurationService);
            if ((0, telemetryUtils_1.supportsTelemetry)(productService, environmentService)) {
                const logAppender = new telemetryLogAppender_1.TelemetryLogAppender(logService, loggerService, environmentService, productService);
                appenders.push(logAppender);
                if (!(0, telemetryUtils_1.isLoggingOnly)(productService, environmentService) && productService.aiConfig?.ariaKey) {
                    const collectorAppender = new _1dsAppender_1.OneDataSystemAppender(requestService, internalTelemetry, 'monacoworkbench', null, productService.aiConfig.ariaKey);
                    this._register((0, lifecycle_1.toDisposable)(() => collectorAppender.flush())); // Ensure the 1DS appender is disposed so that it flushes remaining data
                    appenders.push(collectorAppender);
                }
                telemetryService = new telemetryService_1.TelemetryService({
                    appenders,
                    commonProperties: (0, commonProperties_1.resolveCommonProperties)((0, os_1.release)(), (0, os_1.hostname)(), process.arch, productService.commit, productService.version, this.configuration.machineId, this.configuration.sqmId, internalTelemetry),
                    sendErrorTelemetry: true,
                    piiPaths: (0, telemetryUtils_1.getPiiPathsFromEnvironment)(environmentService),
                }, configurationService, productService);
            }
            else {
                telemetryService = telemetryUtils_1.NullTelemetryService;
                const nullAppender = telemetryUtils_1.NullAppender;
                appenders.push(nullAppender);
            }
            this.server.registerChannel('telemetryAppender', new telemetryIpc_1.TelemetryAppenderChannel(appenders));
            services.set(telemetry_1.ITelemetryService, telemetryService);
            // Custom Endpoint Telemetry
            const customEndpointTelemetryService = new customEndpointTelemetryService_1.CustomEndpointTelemetryService(configurationService, telemetryService, logService, loggerService, environmentService, productService);
            services.set(telemetry_1.ICustomEndpointTelemetryService, customEndpointTelemetryService);
            // Extension Management
            services.set(extensionsProfileScannerService_1.IExtensionsProfileScannerService, new descriptors_1.SyncDescriptor(extensionsProfileScannerService_2.ExtensionsProfileScannerService, undefined, true));
            services.set(extensionsScannerService_1.IExtensionsScannerService, new descriptors_1.SyncDescriptor(extensionsScannerService_2.ExtensionsScannerService, undefined, true));
            services.set(extensionSignatureVerificationService_1.IExtensionSignatureVerificationService, new descriptors_1.SyncDescriptor(extensionSignatureVerificationService_1.ExtensionSignatureVerificationService, undefined, true));
            services.set(extensionManagementService_1.INativeServerExtensionManagementService, new descriptors_1.SyncDescriptor(extensionManagementService_1.ExtensionManagementService, undefined, true));
            // Extension Gallery
            services.set(extensionManagement_1.IExtensionGalleryService, new descriptors_1.SyncDescriptor(extensionGalleryService_1.ExtensionGalleryService, undefined, true));
            // Extension Tips
            services.set(extensionManagement_1.IExtensionTipsService, new descriptors_1.SyncDescriptor(extensionTipsService_1.ExtensionTipsService, undefined, false /* Eagerly scans and computes exe based recommendations */));
            // Localizations
            services.set(languagePacks_1.ILanguagePackService, new descriptors_1.SyncDescriptor(languagePacks_2.NativeLanguagePackService, undefined, false /* proxied to other processes */));
            // Diagnostics
            services.set(diagnostics_1.IDiagnosticsService, new descriptors_1.SyncDescriptor(diagnosticsService_1.DiagnosticsService, undefined, false /* proxied to other processes */));
            // Settings Sync
            services.set(userDataSyncAccount_1.IUserDataSyncAccountService, new descriptors_1.SyncDescriptor(userDataSyncAccount_1.UserDataSyncAccountService, undefined, true));
            services.set(userDataSync_1.IUserDataSyncLogService, new descriptors_1.SyncDescriptor(userDataSyncLog_1.UserDataSyncLogService, undefined, true));
            services.set(userDataSync_1.IUserDataSyncUtilService, ipc_1.ProxyChannel.toService(this.server.getChannel('userDataSyncUtil', client => client.ctx !== 'main')));
            services.set(extensionManagement_1.IGlobalExtensionEnablementService, new descriptors_1.SyncDescriptor(extensionEnablementService_1.GlobalExtensionEnablementService, undefined, false /* Eagerly resets installed extensions */));
            services.set(ignoredExtensions_1.IIgnoredExtensionsManagementService, new descriptors_1.SyncDescriptor(ignoredExtensions_1.IgnoredExtensionsManagementService, undefined, true));
            services.set(extensionStorage_1.IExtensionStorageService, new descriptors_1.SyncDescriptor(extensionStorage_1.ExtensionStorageService));
            services.set(userDataSync_1.IUserDataSyncStoreManagementService, new descriptors_1.SyncDescriptor(userDataSyncStoreService_1.UserDataSyncStoreManagementService, undefined, true));
            services.set(userDataSync_1.IUserDataSyncStoreService, new descriptors_1.SyncDescriptor(userDataSyncStoreService_1.UserDataSyncStoreService, undefined, true));
            services.set(userDataSyncMachines_1.IUserDataSyncMachinesService, new descriptors_1.SyncDescriptor(userDataSyncMachines_1.UserDataSyncMachinesService, undefined, true));
            services.set(userDataSync_1.IUserDataSyncLocalStoreService, new descriptors_1.SyncDescriptor(userDataSyncLocalStoreService_1.UserDataSyncLocalStoreService, undefined, false /* Eagerly cleans up old backups */));
            services.set(userDataSync_1.IUserDataSyncEnablementService, new descriptors_1.SyncDescriptor(userDataSyncEnablementService_1.UserDataSyncEnablementService, undefined, true));
            services.set(userDataSync_1.IUserDataSyncService, new descriptors_1.SyncDescriptor(userDataSyncService_1.UserDataSyncService, undefined, false /* Initializes the Sync State */));
            services.set(userDataProfileStorageService_1.IUserDataProfileStorageService, new descriptors_1.SyncDescriptor(userDataProfileStorageService_2.NativeUserDataProfileStorageService, undefined, true));
            services.set(userDataSync_1.IUserDataSyncResourceProviderService, new descriptors_1.SyncDescriptor(userDataSyncResourceProvider_1.UserDataSyncResourceProviderService, undefined, true));
            // Signing
            services.set(sign_1.ISignService, new descriptors_1.SyncDescriptor(signService_1.SignService, undefined, false /* proxied to other processes */));
            // Tunnel
            const remoteSocketFactoryService = new remoteSocketFactoryService_1.RemoteSocketFactoryService();
            services.set(remoteSocketFactoryService_1.IRemoteSocketFactoryService, remoteSocketFactoryService);
            remoteSocketFactoryService.register(0 /* RemoteConnectionType.WebSocket */, nodeSocketFactory_1.nodeSocketFactory);
            services.set(tunnel_1.ISharedTunnelsService, new descriptors_1.SyncDescriptor(tunnelService_1.SharedTunnelsService));
            services.set(sharedProcessTunnelService_1.ISharedProcessTunnelService, new descriptors_1.SyncDescriptor(sharedProcessTunnelService_2.SharedProcessTunnelService));
            // Remote Tunnel
            services.set(remoteTunnel_1.IRemoteTunnelService, new descriptors_1.SyncDescriptor(remoteTunnelService_1.RemoteTunnelService));
            return new instantiationService_1.InstantiationService(services);
        }
        initChannels(accessor) {
            // const disposables = this._register(new DisposableStore());
            // Extensions Management
            const channel = new extensionManagementIpc_1.ExtensionManagementChannel(accessor.get(extensionManagement_1.IExtensionManagementService), () => null);
            this.server.registerChannel('extensions', channel);
            // Language Packs
            const languagePacksChannel = ipc_1.ProxyChannel.fromService(accessor.get(languagePacks_1.ILanguagePackService), this._store);
            this.server.registerChannel('languagePacks', languagePacksChannel);
            // Diagnostics
            const diagnosticsChannel = ipc_1.ProxyChannel.fromService(accessor.get(diagnostics_1.IDiagnosticsService), this._store);
            this.server.registerChannel('diagnostics', diagnosticsChannel);
            // Extension Tips
            const extensionTipsChannel = new extensionManagementIpc_1.ExtensionTipsChannel(accessor.get(extensionManagement_1.IExtensionTipsService));
            this.server.registerChannel('extensionTipsService', extensionTipsChannel);
            // Checksum
            const checksumChannel = ipc_1.ProxyChannel.fromService(accessor.get(checksumService_1.IChecksumService), this._store);
            this.server.registerChannel('checksum', checksumChannel);
            // Profiling
            const profilingChannel = ipc_1.ProxyChannel.fromService(accessor.get(profiling_1.IV8InspectProfilingService), this._store);
            this.server.registerChannel('v8InspectProfiling', profilingChannel);
            // Settings Sync
            const userDataSyncMachineChannel = ipc_1.ProxyChannel.fromService(accessor.get(userDataSyncMachines_1.IUserDataSyncMachinesService), this._store);
            this.server.registerChannel('userDataSyncMachines', userDataSyncMachineChannel);
            // Custom Endpoint Telemetry
            const customEndpointTelemetryChannel = ipc_1.ProxyChannel.fromService(accessor.get(telemetry_1.ICustomEndpointTelemetryService), this._store);
            this.server.registerChannel('customEndpointTelemetry', customEndpointTelemetryChannel);
            const userDataSyncAccountChannel = new userDataSyncIpc_1.UserDataSyncAccountServiceChannel(accessor.get(userDataSyncAccount_1.IUserDataSyncAccountService));
            this.server.registerChannel('userDataSyncAccount', userDataSyncAccountChannel);
            const userDataSyncStoreManagementChannel = new userDataSyncIpc_1.UserDataSyncStoreManagementServiceChannel(accessor.get(userDataSync_1.IUserDataSyncStoreManagementService));
            this.server.registerChannel('userDataSyncStoreManagement', userDataSyncStoreManagementChannel);
            const userDataSyncChannel = new userDataSyncServiceIpc_1.UserDataSyncServiceChannel(accessor.get(userDataSync_1.IUserDataSyncService), accessor.get(userDataProfile_1.IUserDataProfilesService), accessor.get(log_1.ILogService));
            this.server.registerChannel('userDataSync', userDataSyncChannel);
            const userDataAutoSync = this._register(accessor.get(instantiation_1.IInstantiationService).createInstance(userDataAutoSyncService_1.UserDataAutoSyncService));
            this.server.registerChannel('userDataAutoSync', ipc_1.ProxyChannel.fromService(userDataAutoSync, this._store));
            this.server.registerChannel('IUserDataSyncResourceProviderService', ipc_1.ProxyChannel.fromService(accessor.get(userDataSync_1.IUserDataSyncResourceProviderService), this._store));
            // Tunnel
            const sharedProcessTunnelChannel = ipc_1.ProxyChannel.fromService(accessor.get(sharedProcessTunnelService_1.ISharedProcessTunnelService), this._store);
            this.server.registerChannel(sharedProcessTunnelService_1.ipcSharedProcessTunnelChannelName, sharedProcessTunnelChannel);
            // Remote Tunnel
            const remoteTunnelChannel = ipc_1.ProxyChannel.fromService(accessor.get(remoteTunnel_1.IRemoteTunnelService), this._store);
            this.server.registerChannel('remoteTunnel', remoteTunnelChannel);
        }
        registerErrorHandler(logService) {
            // Listen on global error events
            process.on('uncaughtException', error => (0, errors_1.onUnexpectedError)(error));
            process.on('unhandledRejection', (reason) => (0, errors_1.onUnexpectedError)(reason));
            // Install handler for unexpected errors
            (0, errors_1.setUnexpectedErrorHandler)(error => {
                const message = (0, errorMessage_1.toErrorMessage)(error, true);
                if (!message) {
                    return;
                }
                logService.error(`[uncaught exception in sharedProcess]: ${message}`);
            });
        }
        reportProfilesInfo(telemetryService, userDataProfilesService) {
            telemetryService.publicLog2('profilesInfo', {
                count: userDataProfilesService.profiles.length
            });
        }
        async reportClientOSInfo(telemetryService, logService) {
            if (platform_1.isLinux) {
                const [releaseInfo, displayProtocol] = await Promise.all([
                    (0, osReleaseInfo_1.getOSReleaseInfo)(logService.error.bind(logService)),
                    (0, osDisplayProtocolInfo_1.getDisplayProtocol)(logService.error.bind(logService))
                ]);
                const desktopEnvironment = (0, desktopEnvironmentInfo_1.getDesktopEnvironment)();
                const codeSessionType = (0, osDisplayProtocolInfo_1.getCodeDisplayProtocol)(displayProtocol, this.configuration.args['ozone-platform']);
                if (releaseInfo) {
                    telemetryService.publicLog2('clientPlatformInfo', {
                        platformId: releaseInfo.id,
                        platformVersionId: releaseInfo.version_id,
                        platformIdLike: releaseInfo.id_like,
                        desktopEnvironment: desktopEnvironment,
                        displayProtocol: displayProtocol,
                        codeDisplayProtocol: codeSessionType
                    });
                }
            }
        }
        handledClientConnection(e) {
            // This filter on message port messages will look for
            // attempts of a window to connect raw to the shared
            // process to handle these connections separate from
            // our IPC based protocol.
            if (e.data !== sharedProcess_1.SharedProcessRawConnection.response) {
                return false;
            }
            const port = (0, arrays_1.firstOrDefault)(e.ports);
            if (port) {
                this.onDidWindowConnectRaw.fire(port);
                return true;
            }
            return false;
        }
    }
    async function main(configuration) {
        // create shared process and signal back to main that we are
        // ready to accept message ports as client connections
        try {
            const sharedProcess = new SharedProcessMain(configuration);
            process.parentPort.postMessage(sharedProcess_1.SharedProcessLifecycle.ipcReady);
            // await initialization and signal this back to electron-main
            await sharedProcess.init();
            process.parentPort.postMessage(sharedProcess_1.SharedProcessLifecycle.initDone);
        }
        catch (error) {
            process.parentPort.postMessage({ error: error.toString() });
        }
    }
    const handle = setTimeout(() => {
        process.parentPort.postMessage({ warning: '[SharedProcess] did not receive configuration within 30s...' });
    }, 30000);
    process.parentPort.once('message', (e) => {
        clearTimeout(handle);
        main(e.data);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkUHJvY2Vzc01haW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2NvZGUvbm9kZS9zaGFyZWRQcm9jZXNzL3NoYXJlZFByb2Nlc3NNYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBNGdCaEcsb0JBZ0JDO0lBcmFELE1BQU0saUJBQWtCLFNBQVEsc0JBQVU7UUFRekMsWUFBb0IsYUFBMEM7WUFDN0QsS0FBSyxFQUFFLENBQUM7WUFEVyxrQkFBYSxHQUFiLGFBQWEsQ0FBNkI7WUFON0MsV0FBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUErQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFNUUscUJBQWdCLEdBQThDLFNBQVMsQ0FBQztZQUUvRCwwQkFBcUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFtQixDQUFDLENBQUM7WUFLdkYsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQjtZQUV4QiwyQkFBMkI7WUFDM0IsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLE1BQU0sTUFBTSxHQUFHLEdBQUcsRUFBRTtnQkFDbkIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNkLE9BQU8sR0FBRyxJQUFJLENBQUM7b0JBRWYsSUFBSSxDQUFDLGdCQUFnQixFQUFFLGtCQUFrQixFQUFFLENBQUM7b0JBQzVDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDaEIsQ0FBQztZQUNGLENBQUMsQ0FBQztZQUNGLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzdCLElBQUEsYUFBSSxFQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsc0NBQXNCLENBQUMsSUFBSSxFQUFFLE1B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