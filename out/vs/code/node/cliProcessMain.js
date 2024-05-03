/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/uri", "vs/base/node/pfs", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationService", "vs/platform/download/common/download", "vs/platform/download/common/downloadService", "vs/platform/environment/common/environment", "vs/platform/environment/node/environmentService", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/node/extensionSignatureVerificationService", "vs/platform/extensionManagement/common/extensionManagementCLI", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/extensionManagement/node/extensionManagementService", "vs/platform/extensionManagement/node/extensionsScannerService", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/languagePacks/common/languagePacks", "vs/platform/languagePacks/node/languagePacks", "vs/platform/log/common/log", "vs/platform/policy/common/filePolicyService", "vs/platform/policy/common/policy", "vs/platform/policy/node/nativePolicyService", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/request/node/requestService", "vs/platform/state/node/stateService", "vs/platform/telemetry/common/commonProperties", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/telemetry/node/1dsAppender", "vs/platform/telemetry/node/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataProfile/node/userDataProfile", "vs/platform/telemetry/node/telemetryUtils", "vs/platform/extensionManagement/node/extensionsProfileScannerService", "vs/platform/log/common/logService", "vs/platform/log/node/loggerService", "vs/nls", "vs/platform/userData/common/fileUserDataProvider", "vs/base/node/unc"], function (require, exports, os_1, async_1, errorMessage_1, errors_1, lifecycle_1, network_1, path_1, platform_1, process_1, uri_1, pfs_1, configuration_1, configurationService_1, download_1, downloadService_1, environment_1, environmentService_1, extensionGalleryService_1, extensionManagement_1, extensionSignatureVerificationService_1, extensionManagementCLI_1, extensionsProfileScannerService_1, extensionsScannerService_1, extensionManagementService_1, extensionsScannerService_2, files_1, fileService_1, diskFileSystemProvider_1, descriptors_1, instantiationService_1, serviceCollection_1, languagePacks_1, languagePacks_2, log_1, filePolicyService_1, policy_1, nativePolicyService_1, product_1, productService_1, request_1, requestService_1, stateService_1, commonProperties_1, telemetry_1, telemetryService_1, telemetryUtils_1, _1dsAppender_1, telemetry_2, uriIdentity_1, uriIdentityService_1, userDataProfile_1, userDataProfile_2, telemetryUtils_2, extensionsProfileScannerService_2, logService_1, loggerService_1, nls_1, fileUserDataProvider_1, unc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.main = main;
    class CliMain extends lifecycle_1.Disposable {
        constructor(argv) {
            super();
            this.argv = argv;
            this.registerListeners();
        }
        registerListeners() {
            // Dispose on exit
            process.once('exit', () => this.dispose());
        }
        async run() {
            // Services
            const [instantiationService, appenders] = await this.initServices();
            return instantiationService.invokeFunction(async (accessor) => {
                const logService = accessor.get(log_1.ILogService);
                const fileService = accessor.get(files_1.IFileService);
                const environmentService = accessor.get(environment_1.INativeEnvironmentService);
                const userDataProfilesService = accessor.get(userDataProfile_1.IUserDataProfilesService);
                // Log info
                logService.info('CLI main', this.argv);
                // Error handler
                this.registerErrorHandler(logService);
                // Run based on argv
                await this.doRun(environmentService, fileService, userDataProfilesService, instantiationService);
                // Flush the remaining data in AI adapter (with 1s timeout)
                await Promise.all(appenders.map(a => {
                    (0, async_1.raceTimeout)(a.flush(), 1000);
                }));
                return;
            });
        }
        async initServices() {
            const services = new serviceCollection_1.ServiceCollection();
            // Product
            const productService = { _serviceBrand: undefined, ...product_1.default };
            services.set(productService_1.IProductService, productService);
            // Environment
            const environmentService = new environmentService_1.NativeEnvironmentService(this.argv, productService);
            services.set(environment_1.INativeEnvironmentService, environmentService);
            // Init folders
            await Promise.all([
                this.allowWindowsUNCPath(environmentService.appSettingsHome.with({ scheme: network_1.Schemas.file }).fsPath),
                this.allowWindowsUNCPath(environmentService.extensionsPath)
            ].map(path => path ? pfs_1.Promises.mkdir(path, { recursive: true }) : undefined));
            // Logger
            const loggerService = new loggerService_1.LoggerService((0, log_1.getLogLevel)(environmentService), environmentService.logsHome);
            services.set(log_1.ILoggerService, loggerService);
            // Log
            const logger = this._register(loggerService.createLogger('cli', { name: (0, nls_1.localize)('cli', "CLI") }));
            const otherLoggers = [];
            if (loggerService.getLogLevel() === log_1.LogLevel.Trace) {
                otherLoggers.push(new log_1.ConsoleLogger(loggerService.getLogLevel()));
            }
            const logService = this._register(new logService_1.LogService(logger, otherLoggers));
            services.set(log_1.ILogService, logService);
            // Files
            const fileService = this._register(new fileService_1.FileService(logService));
            services.set(files_1.IFileService, fileService);
            const diskFileSystemProvider = this._register(new diskFileSystemProvider_1.DiskFileSystemProvider(logService));
            fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
            // Uri Identity
            const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
            services.set(uriIdentity_1.IUriIdentityService, uriIdentityService);
            // User Data Profiles
            const stateService = new stateService_1.StateReadonlyService(1 /* SaveStrategy.DELAYED */, environmentService, logService, fileService);
            const userDataProfilesService = new userDataProfile_2.UserDataProfilesReadonlyService(stateService, uriIdentityService, environmentService, fileService, logService);
            services.set(userDataProfile_1.IUserDataProfilesService, userDataProfilesService);
            // Use FileUserDataProvider for user data to
            // enable atomic read / write operations.
            fileService.registerProvider(network_1.Schemas.vscodeUserData, new fileUserDataProvider_1.FileUserDataProvider(network_1.Schemas.file, diskFileSystemProvider, network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, logService));
            // Policy
            const policyService = platform_1.isWindows && productService.win32RegValueName ? this._register(new nativePolicyService_1.NativePolicyService(logService, productService.win32RegValueName))
                : environmentService.policyFile ? this._register(new filePolicyService_1.FilePolicyService(environmentService.policyFile, fileService, logService))
                    : new policy_1.NullPolicyService();
            services.set(policy_1.IPolicyService, policyService);
            // Configuration
            const configurationService = this._register(new configurationService_1.ConfigurationService(userDataProfilesService.defaultProfile.settingsResource, fileService, policyService, logService));
            services.set(configuration_1.IConfigurationService, configurationService);
            // Initialize
            await Promise.all([
                stateService.init(),
                configurationService.initialize()
            ]);
            // Get machine ID
            let machineId = undefined;
            try {
                machineId = await (0, telemetryUtils_2.resolveMachineId)(stateService, logService);
            }
            catch (error) {
                if (error.code !== 'ENOENT') {
                    logService.error(error);
                }
            }
            const sqmId = await (0, telemetryUtils_2.resolveSqmId)(stateService, logService);
            // Initialize user data profiles after initializing the state
            userDataProfilesService.init();
            // URI Identity
            services.set(uriIdentity_1.IUriIdentityService, new uriIdentityService_1.UriIdentityService(fileService));
            // Request
            const requestService = new requestService_1.RequestService(configurationService, environmentService, logService, loggerService);
            services.set(request_1.IRequestService, requestService);
            // Download Service
            services.set(download_1.IDownloadService, new descriptors_1.SyncDescriptor(downloadService_1.DownloadService, undefined, true));
            // Extensions
            services.set(extensionsProfileScannerService_1.IExtensionsProfileScannerService, new descriptors_1.SyncDescriptor(extensionsProfileScannerService_2.ExtensionsProfileScannerService, undefined, true));
            services.set(extensionsScannerService_1.IExtensionsScannerService, new descriptors_1.SyncDescriptor(extensionsScannerService_2.ExtensionsScannerService, undefined, true));
            services.set(extensionSignatureVerificationService_1.IExtensionSignatureVerificationService, new descriptors_1.SyncDescriptor(extensionSignatureVerificationService_1.ExtensionSignatureVerificationService, undefined, true));
            services.set(extensionManagementService_1.INativeServerExtensionManagementService, new descriptors_1.SyncDescriptor(extensionManagementService_1.ExtensionManagementService, undefined, true));
            services.set(extensionManagement_1.IExtensionGalleryService, new descriptors_1.SyncDescriptor(extensionGalleryService_1.ExtensionGalleryServiceWithNoStorageService, undefined, true));
            // Localizations
            services.set(languagePacks_1.ILanguagePackService, new descriptors_1.SyncDescriptor(languagePacks_2.NativeLanguagePackService, undefined, false));
            // Telemetry
            const appenders = [];
            const isInternal = (0, telemetryUtils_1.isInternalTelemetry)(productService, configurationService);
            if ((0, telemetryUtils_1.supportsTelemetry)(productService, environmentService)) {
                if (productService.aiConfig && productService.aiConfig.ariaKey) {
                    appenders.push(new _1dsAppender_1.OneDataSystemAppender(requestService, isInternal, 'monacoworkbench', null, productService.aiConfig.ariaKey));
                }
                const config = {
                    appenders,
                    sendErrorTelemetry: false,
                    commonProperties: (0, commonProperties_1.resolveCommonProperties)((0, os_1.release)(), (0, os_1.hostname)(), process.arch, productService.commit, productService.version, machineId, sqmId, isInternal),
                    piiPaths: (0, telemetryUtils_1.getPiiPathsFromEnvironment)(environmentService)
                };
                services.set(telemetry_1.ITelemetryService, new descriptors_1.SyncDescriptor(telemetryService_1.TelemetryService, [config], false));
            }
            else {
                services.set(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            }
            return [new instantiationService_1.InstantiationService(services), appenders];
        }
        allowWindowsUNCPath(path) {
            if (platform_1.isWindows) {
                const host = (0, unc_1.getUNCHost)(path);
                if (host) {
                    (0, unc_1.addUNCHostToAllowlist)(host);
                }
            }
            return path;
        }
        registerErrorHandler(logService) {
            // Install handler for unexpected errors
            (0, errors_1.setUnexpectedErrorHandler)(error => {
                const message = (0, errorMessage_1.toErrorMessage)(error, true);
                if (!message) {
                    return;
                }
                logService.error(`[uncaught exception in CLI]: ${message}`);
            });
            // Handle unhandled errors that can occur
            process.on('uncaughtException', err => {
                if (!(0, errors_1.isSigPipeError)(err)) {
                    (0, errors_1.onUnexpectedError)(err);
                }
            });
            process.on('unhandledRejection', (reason) => (0, errors_1.onUnexpectedError)(reason));
        }
        async doRun(environmentService, fileService, userDataProfilesService, instantiationService) {
            let profile = undefined;
            if (environmentService.args.profile) {
                profile = userDataProfilesService.profiles.find(p => p.name === environmentService.args.profile);
                if (!profile) {
                    throw new Error(`Profile '${environmentService.args.profile}' not found.`);
                }
            }
            const profileLocation = (profile ?? userDataProfilesService.defaultProfile).extensionsResource;
            // List Extensions
            if (this.argv['list-extensions']) {
                return instantiationService.createInstance(extensionManagementCLI_1.ExtensionManagementCLI, new log_1.ConsoleLogger(log_1.LogLevel.Info, false)).listExtensions(!!this.argv['show-versions'], this.argv['category'], profileLocation);
            }
            // Install Extension
            else if (this.argv['install-extension'] || this.argv['install-builtin-extension']) {
                const installOptions = { isMachineScoped: !!this.argv['do-not-sync'], installPreReleaseVersion: !!this.argv['pre-release'], profileLocation };
                return instantiationService.createInstance(extensionManagementCLI_1.ExtensionManagementCLI, new log_1.ConsoleLogger(log_1.LogLevel.Info, false)).installExtensions(this.asExtensionIdOrVSIX(this.argv['install-extension'] || []), this.asExtensionIdOrVSIX(this.argv['install-builtin-extension'] || []), installOptions, !!this.argv['force']);
            }
            // Uninstall Extension
            else if (this.argv['uninstall-extension']) {
                return instantiationService.createInstance(extensionManagementCLI_1.ExtensionManagementCLI, new log_1.ConsoleLogger(log_1.LogLevel.Info, false)).uninstallExtensions(this.asExtensionIdOrVSIX(this.argv['uninstall-extension']), !!this.argv['force'], profileLocation);
            }
            else if (this.argv['update-extensions']) {
                return instantiationService.createInstance(extensionManagementCLI_1.ExtensionManagementCLI, new log_1.ConsoleLogger(log_1.LogLevel.Info, false)).updateExtensions(profileLocation);
            }
            // Locate Extension
            else if (this.argv['locate-extension']) {
                return instantiationService.createInstance(extensionManagementCLI_1.ExtensionManagementCLI, new log_1.ConsoleLogger(log_1.LogLevel.Info, false)).locateExtension(this.argv['locate-extension']);
            }
            // Telemetry
            else if (this.argv['telemetry']) {
                console.log(await (0, telemetry_2.buildTelemetryMessage)(environmentService.appRoot, environmentService.extensionsPath));
            }
        }
        asExtensionIdOrVSIX(inputs) {
            return inputs.map(input => /\.vsix$/i.test(input) ? uri_1.URI.file((0, path_1.isAbsolute)(input) ? input : (0, path_1.join)((0, process_1.cwd)(), input)) : input);
        }
    }
    async function main(argv) {
        const cliMain = new CliMain(argv);
        try {
            await cliMain.run();
        }
        finally {
            cliMain.dispose();
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpUHJvY2Vzc01haW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2NvZGUvbm9kZS9jbGlQcm9jZXNzTWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXVUaEcsb0JBUUM7SUEvUEQsTUFBTSxPQUFRLFNBQVEsc0JBQVU7UUFFL0IsWUFDUyxJQUFzQjtZQUU5QixLQUFLLEVBQUUsQ0FBQztZQUZBLFNBQUksR0FBSixJQUFJLENBQWtCO1lBSTlCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFFeEIsa0JBQWtCO1lBQ2xCLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRztZQUVSLFdBQVc7WUFDWCxNQUFNLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFFcEUsT0FBTyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFDLFFBQVEsRUFBQyxFQUFFO2dCQUMzRCxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLGlCQUFXLENBQUMsQ0FBQztnQkFDN0MsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQkFBWSxDQUFDLENBQUM7Z0JBQy9DLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1Q0FBeUIsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLHVCQUF1QixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMENBQXdCLENBQUMsQ0FBQztnQkFFdkUsV0FBVztnQkFDWCxVQUFVLENBQUMsSUFBSSxDQUFDLFVB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