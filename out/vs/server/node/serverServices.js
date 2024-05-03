/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/node/id", "vs/base/node/pfs", "vs/base/parts/ipc/common/ipc", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationService", "vs/platform/debug/common/extensionHostDebugIpc", "vs/platform/download/common/download", "vs/platform/download/common/downloadIpc", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/node/extensionSignatureVerificationService", "vs/platform/extensionManagement/common/extensionManagementCLI", "vs/platform/extensionManagement/common/extensionManagementIpc", "vs/platform/extensionManagement/node/extensionManagementService", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/languagePacks/common/languagePacks", "vs/platform/languagePacks/node/languagePacks", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/request/common/requestIpc", "vs/platform/request/node/requestService", "vs/platform/telemetry/common/commonProperties", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/telemetry/node/errorTelemetry", "vs/platform/terminal/common/terminal", "vs/platform/terminal/node/ptyHostService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/server/node/remoteAgentEnvironmentImpl", "vs/server/node/remoteFileSystemProviderServer", "vs/platform/telemetry/common/remoteTelemetryChannel", "vs/platform/telemetry/common/serverTelemetryService", "vs/server/node/remoteTerminalChannel", "vs/workbench/api/node/uriTransformer", "vs/server/node/serverEnvironmentService", "vs/workbench/contrib/terminal/common/remote/remoteTerminalChannel", "vs/workbench/services/remote/common/remoteFileSystemProviderClient", "vs/server/node/extensionHostStatusService", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/server/node/extensionsScannerService", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/policy/common/policy", "vs/platform/telemetry/node/1dsAppender", "vs/platform/log/node/loggerService", "vs/platform/userDataProfile/node/userDataProfile", "vs/platform/extensionManagement/node/extensionsProfileScannerService", "vs/platform/log/common/logService", "vs/platform/log/common/logIpc", "vs/nls", "vs/server/node/remoteExtensionsScanner", "vs/platform/remote/common/remoteExtensionsScanner", "vs/platform/userDataProfile/common/userDataProfileIpc", "vs/platform/terminal/node/nodePtyHostStarter"], function (require, exports, os_1, event_1, lifecycle_1, network_1, path, id_1, pfs_1, ipc_1, configuration_1, configurationService_1, extensionHostDebugIpc_1, download_1, downloadIpc_1, environment_1, extensionGalleryService_1, extensionManagement_1, extensionSignatureVerificationService_1, extensionManagementCLI_1, extensionManagementIpc_1, extensionManagementService_1, files_1, fileService_1, diskFileSystemProvider_1, descriptors_1, instantiationService_1, serviceCollection_1, languagePacks_1, languagePacks_2, log_1, product_1, productService_1, request_1, requestIpc_1, requestService_1, commonProperties_1, telemetry_1, telemetryUtils_1, errorTelemetry_1, terminal_1, ptyHostService_1, uriIdentity_1, uriIdentityService_1, remoteAgentEnvironmentImpl_1, remoteFileSystemProviderServer_1, remoteTelemetryChannel_1, serverTelemetryService_1, remoteTerminalChannel_1, uriTransformer_1, serverEnvironmentService_1, remoteTerminalChannel_2, remoteFileSystemProviderClient_1, extensionHostStatusService_1, extensionsScannerService_1, extensionsScannerService_2, extensionsProfileScannerService_1, userDataProfile_1, policy_1, _1dsAppender_1, loggerService_1, userDataProfile_2, extensionsProfileScannerService_2, logService_1, logIpc_1, nls_1, remoteExtensionsScanner_1, remoteExtensionsScanner_2, userDataProfileIpc_1, nodePtyHostStarter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SocketServer = void 0;
    exports.setupServerServices = setupServerServices;
    const eventPrefix = 'monacoworkbench';
    async function setupServerServices(connectionToken, args, REMOTE_DATA_FOLDER, disposables) {
        const services = new serviceCollection_1.ServiceCollection();
        const socketServer = new SocketServer();
        const productService = { _serviceBrand: undefined, ...product_1.default };
        services.set(productService_1.IProductService, productService);
        const environmentService = new serverEnvironmentService_1.ServerEnvironmentService(args, productService);
        services.set(environment_1.IEnvironmentService, environmentService);
        services.set(environment_1.INativeEnvironmentService, environmentService);
        const loggerService = new loggerService_1.LoggerService((0, log_1.getLogLevel)(environmentService), environmentService.logsHome);
        services.set(log_1.ILoggerService, loggerService);
        socketServer.registerChannel('logger', new logIpc_1.LoggerChannel(loggerService, (ctx) => getUriTransformer(ctx.remoteAuthority)));
        const logger = loggerService.createLogger('remoteagent', { name: (0, nls_1.localize)('remoteExtensionLog', "Server") });
        const logService = new logService_1.LogService(logger, [new ServerLogger((0, log_1.getLogLevel)(environmentService))]);
        services.set(log_1.ILogService, logService);
        setTimeout(() => cleanupOlderLogs(environmentService.logsHome.with({ scheme: network_1.Schemas.file }).fsPath).then(null, err => logService.error(err)), 10000);
        logService.onDidChangeLogLevel(logLevel => (0, log_1.log)(logService, logLevel, `Log level changed to ${(0, log_1.LogLevelToString)(logService.getLevel())}`));
        logService.trace(`Remote configuration data at ${REMOTE_DATA_FOLDER}`);
        logService.trace('process arguments:', environmentService.args);
        if (Array.isArray(productService.serverGreeting)) {
            logService.info(`\n\n${productService.serverGreeting.join('\n')}\n\n`);
        }
        // ExtensionHost Debug broadcast service
        socketServer.registerChannel(extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel.ChannelName, new extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel());
        // TODO: @Sandy @Joao need dynamic context based router
        const router = new ipc_1.StaticRouter(ctx => ctx.clientId === 'renderer');
        // Files
        const fileService = disposables.add(new fileService_1.FileService(logService));
        services.set(files_1.IFileService, fileService);
        fileService.registerProvider(network_1.Schemas.file, disposables.add(new diskFileSystemProvider_1.DiskFileSystemProvider(logService)));
        // URI Identity
        const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
        services.set(uriIdentity_1.IUriIdentityService, uriIdentityService);
        // Configuration
        const configurationService = new configurationService_1.ConfigurationService(environmentService.machineSettingsResource, fileService, new policy_1.NullPolicyService(), logService);
        services.set(configuration_1.IConfigurationService, configurationService);
        // User Data Profiles
        const userDataProfilesService = new userDataProfile_2.ServerUserDataProfilesService(uriIdentityService, environmentService, fileService, logService);
        services.set(userDataProfile_1.IUserDataProfilesService, userDataProfilesService);
        socketServer.registerChannel('userDataProfiles', new userDataProfileIpc_1.RemoteUserDataProfilesServiceChannel(userDataProfilesService, (ctx) => getUriTransformer(ctx.remoteAuthority)));
        // Initialize
        const [, , machineId, sqmId] = await Promise.all([
            configurationService.initialize(),
            userDataProfilesService.init(),
            (0, id_1.getMachineId)(logService.error.bind(logService)),
            (0, id_1.getSqmMachineId)(logService.error.bind(logService))
        ]);
        const extensionHostStatusService = new extensionHostStatusService_1.ExtensionHostStatusService();
        services.set(extensionHostStatusService_1.IExtensionHostStatusService, extensionHostStatusService);
        // Request
        const requestService = new requestService_1.RequestService(configurationService, environmentService, logService, loggerService);
        services.set(request_1.IRequestService, requestService);
        let oneDsAppender = telemetryUtils_1.NullAppender;
        const isInternal = (0, telemetryUtils_1.isInternalTelemetry)(productService, configurationService);
        if ((0, telemetryUtils_1.supportsTelemetry)(productService, environmentService)) {
            if (!(0, telemetryUtils_1.isLoggingOnly)(productService, environmentService) && productService.aiConfig?.ariaKey) {
                oneDsAppender = new _1dsAppender_1.OneDataSystemAppender(requestService, isInternal, eventPrefix, null, productService.aiConfig.ariaKey);
                disposables.add((0, lifecycle_1.toDisposable)(() => oneDsAppender?.flush())); // Ensure the AI appender is disposed so that it flushes remaining data
            }
            const config = {
                appenders: [oneDsAppender],
                commonProperties: (0, commonProperties_1.resolveCommonProperties)((0, os_1.release)(), (0, os_1.hostname)(), process.arch, productService.commit, productService.version + '-remote', machineId, sqmId, isInternal, 'remoteAgent'),
                piiPaths: (0, telemetryUtils_1.getPiiPathsFromEnvironment)(environmentService)
            };
            const initialTelemetryLevelArg = environmentService.args['telemetry-level'];
            let injectedTelemetryLevel = 3 /* TelemetryLevel.USAGE */;
            // Convert the passed in CLI argument into a telemetry level for the telemetry service
            if (initialTelemetryLevelArg === 'all') {
                injectedTelemetryLevel = 3 /* TelemetryLevel.USAGE */;
            }
            else if (initialTelemetryLevelArg === 'error') {
                injectedTelemetryLevel = 2 /* TelemetryLevel.ERROR */;
            }
            else if (initialTelemetryLevelArg === 'crash') {
                injectedTelemetryLevel = 1 /* TelemetryLevel.CRASH */;
            }
            else if (initialTelemetryLevelArg !== undefined) {
                injectedTelemetryLevel = 0 /* TelemetryLevel.NONE */;
            }
            services.set(serverTelemetryService_1.IServerTelemetryService, new descriptors_1.SyncDescriptor(serverTelemetryService_1.ServerTelemetryService, [config, injectedTelemetryLevel]));
        }
        else {
            services.set(serverTelemetryService_1.IServerTelemetryService, serverTelemetryService_1.ServerNullTelemetryService);
        }
        services.set(extensionManagement_1.IExtensionGalleryService, new descriptors_1.SyncDescriptor(extensionGalleryService_1.ExtensionGalleryServiceWithNoStorageService));
        const downloadChannel = socketServer.getChannel('download', router);
        services.set(download_1.IDownloadService, new downloadIpc_1.DownloadServiceChannelClient(downloadChannel, () => getUriTransformer('renderer') /* TODO: @Sandy @Joao need dynamic context based router */));
        services.set(extensionsProfileScannerService_1.IExtensionsProfileScannerService, new descriptors_1.SyncDescriptor(extensionsProfileScannerService_2.ExtensionsProfileScannerService));
        services.set(extensionsScannerService_1.IExtensionsScannerService, new descriptors_1.SyncDescriptor(extensionsScannerService_2.ExtensionsScannerService));
        services.set(extensionSignatureVerificationService_1.IExtensionSignatureVerificationService, new descriptors_1.SyncDescriptor(extensionSignatureVerificationService_1.ExtensionSignatureVerificationService));
        services.set(extensionManagementService_1.INativeServerExtensionManagementService, new descriptors_1.SyncDescriptor(extensionManagementService_1.ExtensionManagementService));
        const instantiationService = new instantiationService_1.InstantiationService(services);
        services.set(languagePacks_1.ILanguagePackService, instantiationService.createInstance(languagePacks_2.NativeLanguagePackService));
        const ptyHostStarter = instantiationService.createInstance(nodePtyHostStarter_1.NodePtyHostStarter, {
            graceTime: 10800000 /* ProtocolConstants.ReconnectionGraceTime */,
            shortGraceTime: 300000 /* ProtocolConstants.ReconnectionShortGraceTime */,
            scrollback: configurationService.getValue("terminal.integrated.persistentSessionScrollback" /* TerminalSettingId.PersistentSessionScrollback */) ?? 100
        });
        const ptyHostService = instantiationService.createInstance(ptyHostService_1.PtyHostService, ptyHostStarter);
        services.set(terminal_1.IPtyService, ptyHostService);
        instantiationService.invokeFunction(accessor => {
            const extensionManagementService = accessor.get(extensionManagementService_1.INativeServerExtensionManagementService);
            const extensionsScannerService = accessor.get(extensionsScannerService_1.IExtensionsScannerService);
            const extensionGalleryService = accessor.get(extensionManagement_1.IExtensionGalleryService);
            const languagePackService = accessor.get(languagePacks_1.ILanguagePackService);
            const remoteExtensionEnvironmentChannel = new remoteAgentEnvironmentImpl_1.RemoteAgentEnvironmentChannel(connectionToken, environmentService, userDataProfilesService, extensionHostStatusService);
            socketServer.registerChannel('remoteextensionsenvironment', remoteExtensionEnvironmentChannel);
            const telemetryChannel = new remoteTelemetryChannel_1.ServerTelemetryChannel(accessor.get(serverTelemetryService_1.IServerTelemetryService), oneDsAppender);
            socketServer.registerChannel('telemetry', telemetryChannel);
            socketServer.registerChannel(remoteTerminalChannel_2.REMOTE_TERMINAL_CHANNEL_NAME, new remoteTerminalChannel_1.RemoteTerminalChannel(environmentService, logService, ptyHostService, productService, extensionManagementService, configurationService));
            const remoteExtensionsScanner = new remoteExtensionsScanner_1.RemoteExtensionsScannerService(instantiationService.createInstance(extensionManagementCLI_1.ExtensionManagementCLI, logService), environmentService, userDataProfilesService, extensionsScannerService, logService, extensionGalleryService, languagePackService);
            socketServer.registerChannel(remoteExtensionsScanner_2.RemoteExtensionsScannerChannelName, new remoteExtensionsScanner_1.RemoteExtensionsScannerChannel(remoteExtensionsScanner, (ctx) => getUriTransformer(ctx.remoteAuthority)));
            const remoteFileSystemChannel = new remoteFileSystemProviderServer_1.RemoteAgentFileSystemProviderChannel(logService, environmentService);
            socketServer.registerChannel(remoteFileSystemProviderClient_1.REMOTE_FILE_SYSTEM_CHANNEL_NAME, remoteFileSystemChannel);
            socketServer.registerChannel('request', new requestIpc_1.RequestChannel(accessor.get(request_1.IRequestService)));
            const channel = new extensionManagementIpc_1.ExtensionManagementChannel(extensionManagementService, (ctx) => getUriTransformer(ctx.remoteAuthority));
            socketServer.registerChannel('extensions', channel);
            // clean up extensions folder
            remoteExtensionsScanner.whenExtensionsReady().then(() => extensionManagementService.cleanUp());
            disposables.add(new errorTelemetry_1.default(accessor.get(telemetry_1.ITelemetryService)));
            return {
                telemetryService: accessor.get(telemetry_1.ITelemetryService)
            };
        });
        return { socketServer, instantiationService };
    }
    const _uriTransformerCache = Object.create(null);
    function getUriTransformer(remoteAuthority) {
        if (!_uriTransformerCache[remoteAuthority]) {
            _uriTransformerCache[remoteAuthority] = (0, uriTransformer_1.createURITransformer)(remoteAuthority);
        }
        return _uriTransformerCache[remoteAuthority];
    }
    class SocketServer extends ipc_1.IPCServer {
        constructor() {
            const emitter = new event_1.Emitter();
            super(emitter.event);
            this._onDidConnectEmitter = emitter;
        }
        acceptConnection(protocol, onDidClientDisconnect) {
            this._onDidConnectEmitter.fire({ protocol, onDidClientDisconnect });
        }
    }
    exports.SocketServer = SocketServer;
    class ServerLogger extends log_1.AbstractLogger {
        constructor(logLevel = log_1.DEFAULT_LOG_LEVEL) {
            super();
            this.setLevel(logLevel);
            this.useColors = Boolean(process.stdout.isTTY);
        }
        trace(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Trace)) {
                if (this.useColors) {
                    console.log(`\x1b[90m[${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.log(`[${now()}]`, message, ...args);
                }
            }
        }
        debug(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Debug)) {
                if (this.useColors) {
                    console.log(`\x1b[90m[${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.log(`[${now()}]`, message, ...args);
                }
            }
        }
        info(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Info)) {
                if (this.useColors) {
                    console.log(`\x1b[90m[${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.log(`[${now()}]`, message, ...args);
                }
            }
        }
        warn(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Warning)) {
                if (this.useColors) {
                    console.warn(`\x1b[93m[${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.warn(`[${now()}]`, message, ...args);
                }
            }
        }
        error(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Error)) {
                if (this.useColors) {
                    console.error(`\x1b[91m[${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.error(`[${now()}]`, message, ...args);
                }
            }
        }
        flush() {
            // noop
        }
    }
    function now() {
        const date = new Date();
        return `${twodigits(date.getHours())}:${twodigits(date.getMinutes())}:${twodigits(date.getSeconds())}`;
    }
    function twodigits(n) {
        if (n < 10) {
            return `0${n}`;
        }
        return String(n);
    }
    /**
     * Cleans up older logs, while keeping the 10 most recent ones.
     */
    async function cleanupOlderLogs(logsPath) {
        const currentLog = path.basename(logsPath);
        const logsRoot = path.dirname(logsPath);
        const children = await pfs_1.Promises.readdir(logsRoot);
        const allSessions = children.filter(name => /^\d{8}T\d{6}$/.test(name));
        const oldSessions = allSessions.sort().filter((d) => d !== currentLog);
        const toDelete = oldSessions.slice(0, Math.max(0, oldSessions.length - 9));
        await Promise.all(toDelete.map(name => pfs_1.Promises.rm(path.join(logsRoot, name))));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyU2VydmljZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3NlcnZlci9ub2RlL3NlcnZlclNlcnZpY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQStFaEcsa0RBMkpDO0lBN0pELE1BQU0sV0FBVyxHQUFHLGlCQUFpQixDQUFDO0lBRS9CLEtBQUssVUFBVSxtQkFBbUIsQ0FBQyxlQUFzQyxFQUFFLElBQXNCLEVBQUUsa0JBQTBCLEVBQUUsV0FBNEI7UUFDakssTUFBTSxRQUFRLEdBQUcsSUFBSSxxQ0FBaUIsRUFBRSxDQUFDO1FBQ3pDLE1BQU0sWUFBWSxHQUFHLElBQUksWUFBWSxFQUFnQyxDQUFDO1FBRXRFLE1BQU0sY0FBYyxHQUFvQixFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsR0FBRyxpQkFBTyxFQUFFLENBQUM7UUFDakYsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQ0FBZSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBRTlDLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxtREFBd0IsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDOUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQ0FBbUIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3RELFFBQVEsQ0FBQyxHQUFHLENBQUMsdUNBQXlCLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUU1RCxNQUFNLGFBQWEsR0FBRyxJQUFJLDZCQUFhLENBQUMsSUFBQSxpQkFBVyxFQUFDLGtCQUFrQixDQUFDLEVBQUUsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQkFBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQzVDLFlBQVksQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLElBQUksc0JBQWEsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxHQUFpQyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXhKLE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM3RyxNQUFNLFVBQVUsR0FBRyxJQUFJLHVCQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBQSxpQkFBVyxFQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0YsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQkFBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3RDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3RKLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUEsU0FBRyxFQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsd0JBQXdCLElBQUEsc0JBQWdCLEVBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFekksVUFBVSxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0Msa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZFLFVBQVUsQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEUsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO1lBQ2xELFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxjQUFjLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUVELHdDQUF3QztRQUN4QyxZQUFZLENBQUMsZUFBZSxDQUFDLDBEQUFrQyxDQUFDLFdBQVcsRUFBRSxJQUFJLDBEQUFrQyxFQUFFLENBQUMsQ0FBQztRQUV2SCx1REFBdUQ7UUFDdkQsTUFBTSxNQUFNLEdBQUcsSUFBSSxrQkFBWSxDQUErQixHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEtBQUssVUFBVSxDQUFDLENBQUM7UUFFbEcsUUFBUTtRQUNSLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx5QkFBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDakUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQkFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3hDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBTyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksK0NBQXNCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXBHLGVBQWU7UUFDZixNQUFNLGtCQUFrQixHQUFHLElBQUksdUNBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDL0QsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQ0FBbUIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBRXRELGdCQUFnQjtRQUNoQixNQUFNLG9CQUFvQixHQUFHLElBQUksMkNBQW9CLENBQUMsa0JBQWtCLENBQUMsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLElBQUksMEJBQWlCLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNwSixRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFFMUQscUJBQXFCO1FBQ3JCLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSwrQ0FBNkIsQ0FBQyxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDbkksUUFBUSxDQUFDLEdBQUcsQ0FBQywwQ0FBd0IsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1FBQ2hFLFlBQVksQ0FBQyxlQUFlLENBQUMsa0JBQWtCLEVBQUUsSUFBSSx5REFBb0MsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLEdBQWlDLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFbk0sYUFBYTtRQUNiLE1BQU0sQ0FBQyxFQUFFLEFBQUQsRUFBRyxTQUFTLEVBQUUsS0FBSyxDQUFDLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO1lBQ2hELG9CQUFvQixDQUFDLFVBQVUsRUFBRTtZQUNqQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUU7WUFDOUIsSUFBQSxpQkFBWSxFQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQy9DLElBQUEsb0JBQWUsRUFBQyxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUNsRCxDQUFDLENBQUM7UUFFSCxNQUFNLDBCQUEwQixHQUFHLElBQUksdURBQTBCLEVBQUUsQ0FBQztRQUNwRSxRQUFRLENBQUMsR0FBRyxDQUFDLHdEQUEyQixFQUFFLDBCQUEwQixDQUFDLENBQUM7UUFFdEUsVUFBVTtRQUNWLE1BQU0sY0FBYyxHQUFHLElBQUksK0JBQWMsQ0FBQyxvQkFBb0IsRUFBRSxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDL0csUUFBUSxDQUFDLEdBQUcsQ0FBQyx5QkFBZSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBRTlDLElBQUksYUFBYSxHQUF1Qiw2QkFBWSxDQUFDO1FBQ3JELE1BQU0sVUFBVSxHQUFHLElBQUEsb0NBQW1CLEVBQUMsY0FBYyxFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDN0UsSUFBSSxJQUFBLGtDQUFpQixFQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLENBQUM7WUFDM0QsSUFBSSxDQUFDLElBQUEsOEJBQWEsRUFBQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsSUFBSSxjQUFjLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDO2dCQUM1RixhQUFhLEdBQUcsSUFBSSxvQ0FBcUIsQ0FBQyxjQUFjLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsY0FBYyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDMUgsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLHVFQUF1RTtZQUNySSxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQTRCO2dCQUN2QyxTQUFTLEVBQUUsQ0FBQyxhQUFhLENBQUM7Z0JBQzFCLGdCQUFnQixFQUFFLElBQUEsMENBQXVCLEVBQUMsSUFBQSxZQUFPLEdBQUUsRUFBRSxJQUFBLGFBQVEsR0FBRSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsT0FBTyxHQUFHLFNBQVMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxhQUFhLENBQUM7Z0JBQ3RMLFFBQVEsRUFBRSxJQUFBLDJDQUEwQixFQUFDLGtCQUFrQixDQUFDO2FBQ3hELENBQUM7WUFDRixNQUFNLHdCQUF3QixHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQzVFLElBQUksc0JBQXNCLCtCQUF1QyxDQUFDO1lBQ2xFLHNGQUFzRjtZQUN0RixJQUFJLHdCQUF3QixLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUN4QyxzQkFBc0IsK0JBQXVCLENBQUM7WUFDL0MsQ0FBQztpQkFBTSxJQUFJLHdCQUF3QixLQUFLLE9BQU8sRUFBRSxDQUFDO2dCQUNqRCxzQkFBc0IsK0JBQXVCLENBQUM7WUFDL0MsQ0FBQztpQkFBTSxJQUFJLHdCQUF3QixLQUFLLE9BQU8sRUFBRSxDQUFDO2dCQUNqRCxzQkFBc0IsK0JBQXVCLENBQUM7WUFDL0MsQ0FBQztpQkFBTSxJQUFJLHdCQUF3QixLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNuRCxzQkFBc0IsOEJBQXNCLENBQUM7WUFDOUMsQ0FBQztZQUNELFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0RBQXVCLEVBQUUsSUFBSSw0QkFBYyxDQUFDLCtDQUFzQixFQUFFLENBQUMsTUFBTSxFQUFFLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JILENBQUM7YUFBTSxDQUFDO1lBQ1AsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnREFBdUIsRUFBRSxtREFBMEIsQ0FBQyxDQUFDO1FBQ25FLENBQUM7UUFFRCxRQUFRLENBQUMsR0FBRyxDQUFDLDhDQUF3QixFQUFFLElBQUksNEJBQWMsQ0FBQyxxRUFBMkMsQ0FBQyxDQUFDLENBQUM7UUFFeEcsTUFBTSxlQUFlLEdBQUcsWUFBWSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDcEUsUUFBUSxDQUFDLEdBQUcsQ0FBQywyQkFBZ0IsRUFBRSxJQUFJLDBDQUE0QixDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQywwREFBMEQsQ0FBQyxDQUFDLENBQUM7UUFFbEwsUUFBUSxDQUFDLEdBQUcsQ0FBQyxrRUFBZ0MsRUFBRSxJQUFJLDRCQUFjLENBQUMsaUVBQStCLENBQUMsQ0FBQyxDQUFDO1FBQ3BHLFFBQVEsQ0FBQyxHQUFHLENBQUMsb0RBQXlCLEVBQUUsSUFBSSw0QkFBYyxDQUFDLG1EQUF3QixDQUFDLENBQUMsQ0FBQztRQUN0RixRQUFRLENBQUMsR0FBRyxDQUFDLDhFQUFzQyxFQUFFLElBQUksNEJBQWMsQ0FBQyw2RUFBcUMsQ0FBQyxDQUFDLENBQUM7UUFDaEgsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvRUFBdUMsRUFBRSxJQUFJLDRCQUFjLENBQUMsdURBQTBCLENBQUMsQ0FBQyxDQUFDO1FBRXRHLE1BQU0sb0JBQW9CLEdBQTBCLElBQUksMkNBQW9CLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkYsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0IsRUFBRSxvQkFBb0IsQ0FBQyxjQUFjLENBQUMseUNBQXlCLENBQUMsQ0FBQyxDQUFDO1FBRW5HLE1BQU0sY0FBYyxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FDekQsdUNBQWtCLEVBQ2xCO1lBQ0MsU0FBUyx3REFBeUM7WUFDbEQsY0FBYywyREFBOEM7WUFDNUQsVUFBVSxFQUFFLG9CQUFvQixDQUFDLFFBQVEsdUdBQXVELElBQUksR0FBRztTQUN2RyxDQUNELENBQUM7UUFDRixNQUFNLGNBQWMsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsK0JBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUMzRixRQUFRLENBQUMsR0FBRyxDQUFDLHNCQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFFMUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzlDLE1BQU0sMEJBQTBCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvRUFBdUMsQ0FBQyxDQUFDO1lBQ3pGLE1BQU0sd0JBQXdCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvREFBeUIsQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sdUJBQXVCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4Q0FBd0IsQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sbUJBQW1CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0IsQ0FBQyxDQUFDO1lBQy9ELE1BQU0saUNBQWlDLEdBQUcsSUFBSSwwREFBNkIsQ0FBQyxlQUFlLEVBQUUsa0JBQWtCLEVBQUUsdUJBQXVCLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztZQUN0SyxZQUFZLENBQUMsZUFBZSxDQUFDLDZCQUE2QixFQUFFLGlDQUFpQyxDQUFDLENBQUM7WUFFL0YsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLCtDQUFzQixDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0RBQXVCLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUMxRyxZQUFZLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBRTVELFlBQVksQ0FBQyxlQUFlLENBQUMsb0RBQTRCLEVBQUUsSUFBSSw2Q0FBcUIsQ0FBQyxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSwwQkFBMEIsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFFeE0sTUFBTSx1QkFBdUIsR0FBRyxJQUFJLHdEQUE4QixDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywrQ0FBc0IsRUFBRSxVQUFVLENBQUMsRUFBRSxrQkFBa0IsRUFBRSx1QkFBdUIsRUFBRSx3QkFBd0IsRUFBRSxVQUFVLEVBQUUsdUJBQXVCLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUM3USxZQUFZLENBQUMsZUFBZSxDQUFDLDREQUFrQyxFQUFFLElBQUksd0RBQThCLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxHQUFpQyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTdNLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxxRUFBb0MsQ0FBQyxVQUFVLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUN6RyxZQUFZLENBQUMsZUFBZSxDQUFDLGdFQUErQixFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFFdkYsWUFBWSxDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsSUFBSSwyQkFBYyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUzRixNQUFNLE9BQU8sR0FBRyxJQUFJLG1EQUEwQixDQUFDLDBCQUEwQixFQUFFLENBQUMsR0FBaUMsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7WUFDMUosWUFBWSxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFcEQsNkJBQTZCO1lBQzdCLHVCQUF1QixDQUFDLG1CQUFtQixFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFFL0YsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHdCQUFjLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyw2QkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVyRSxPQUFPO2dCQUNOLGdCQUFnQixFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsNkJBQWlCLENBQUM7YUFDakQsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxFQUFFLFlBQVksRUFBRSxvQkFBb0IsRUFBRSxDQUFDO0lBQy9DLENBQUM7SUFFRCxNQUFNLG9CQUFvQixHQUFtRCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRWpHLFNBQVMsaUJBQWlCLENBQUMsZUFBdUI7UUFDakQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7WUFDNUMsb0JBQW9CLENBQUMsZUFBZSxDQUFDLEdBQUcsSUFBQSxxQ0FBb0IsRUFBQyxlQUFlLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBQ0QsT0FBTyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUM5QyxDQUFDO0lBRUQsTUFBYSxZQUFnQyxTQUFRLGVBQW1CO1FBSXZFO1lBQ0MsTUFBTSxPQUFPLEdBQUcsSUFBSSxlQUFPLEVBQXlCLENBQUM7WUFDckQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNyQixJQUFJLENBQUMsb0JBQW9CLEdBQUcsT0FBTyxDQUFDO1FBQ3JDLENBQUM7UUFFTSxnQkFBZ0IsQ0FBQyxRQUFpQyxFQUFFLHFCQUFrQztZQUM1RixJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLHFCQUFxQixFQUFFLENBQUMsQ0FBQztRQUNyRSxDQUFDO0tBQ0Q7SUFiRCxvQ0FhQztJQUVELE1BQU0sWUFBYSxTQUFRLG9CQUFjO1FBR3hDLFlBQVksV0FBcUIsdUJBQWlCO1lBQ2pELEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFRCxLQUFLLENBQUMsT0FBZSxFQUFFLEdBQUcsSUFBVztZQUNwQyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksR0FBRyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDNUQsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO2dCQUM3QyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBZSxFQUFFLEdBQUcsSUFBVztZQUNwQyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksR0FBRyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDNUQsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO2dCQUM3QyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLENBQUMsT0FBZSxFQUFFLEdBQUcsSUFBVztZQUNuQyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZDLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksR0FBRyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDNUQsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO2dCQUM3QyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLENBQUMsT0FBdUIsRUFBRSxHQUFHLElBQVc7WUFDM0MsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUMxQyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDcEIsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7Z0JBQzdELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDOUMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLE9BQWUsRUFBRSxHQUFHLElBQVc7WUFDcEMsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDcEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7Z0JBQzlELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDL0MsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSztZQUNKLE9BQU87UUFDUixDQUFDO0tBQ0Q7SUFFRCxTQUFTLEdBQUc7UUFDWCxNQUFNLElBQUksR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ3hCLE9BQU8sR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ3hHLENBQUM7SUFFRCxTQUFTLFNBQVMsQ0FBQyxDQUFTO1FBQzNCLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO1lBQ1osT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ2hCLENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLFVBQVUsZ0JBQWdCLENBQUMsUUFBZ0I7UUFDL0MsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMzQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hDLE1BQU0sUUFBUSxHQUFHLE1BQU0sY0FBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNsRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxVQUFVLENBQUMsQ0FBQztRQUN2RSxNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFM0UsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pGLENBQUMifQ==