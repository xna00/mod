/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/platform/instantiation/common/descriptors", "vs/platform/configuration/common/configurationService", "vs/platform/configuration/common/configuration", "vs/platform/request/common/request", "vs/platform/request/node/requestService", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/telemetry/common/telemetry", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/extensionManagement/node/extensionManagementService", "vs/platform/extensionManagement/node/extensionSignatureVerificationService", "vs/platform/instantiation/common/instantiationService", "vs/platform/product/common/product", "vs/base/common/lifecycle", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/base/common/network", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/server/node/serverEnvironmentService", "vs/platform/extensionManagement/common/extensionManagementCLI", "vs/platform/languagePacks/common/languagePacks", "vs/platform/languagePacks/node/languagePacks", "vs/base/common/errors", "vs/base/common/uri", "vs/base/common/path", "vs/base/common/process", "vs/platform/download/common/downloadService", "vs/platform/download/common/download", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/environment/node/argv", "vs/base/common/platform", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/server/node/extensionsScannerService", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/policy/common/policy", "vs/platform/userDataProfile/node/userDataProfile", "vs/platform/extensionManagement/node/extensionsProfileScannerService", "vs/platform/log/common/logService", "vs/platform/log/node/loggerService", "vs/nls", "vs/base/node/unc"], function (require, exports, serviceCollection_1, log_1, descriptors_1, configurationService_1, configuration_1, request_1, requestService_1, telemetryUtils_1, telemetry_1, extensionManagement_1, extensionGalleryService_1, extensionManagementService_1, extensionSignatureVerificationService_1, instantiationService_1, product_1, lifecycle_1, fileService_1, diskFileSystemProvider_1, network_1, files_1, productService_1, serverEnvironmentService_1, extensionManagementCLI_1, languagePacks_1, languagePacks_2, errors_1, uri_1, path_1, process_1, downloadService_1, download_1, uriIdentity_1, uriIdentityService_1, argv_1, platform_1, extensionsScannerService_1, extensionsScannerService_2, userDataProfile_1, extensionsProfileScannerService_1, policy_1, userDataProfile_2, extensionsProfileScannerService_2, logService_1, loggerService_1, nls_1, unc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.run = run;
    class CliMain extends lifecycle_1.Disposable {
        constructor(args, remoteDataFolder) {
            super();
            this.args = args;
            this.remoteDataFolder = remoteDataFolder;
            this.registerListeners();
        }
        registerListeners() {
            // Dispose on exit
            process.once('exit', () => this.dispose());
        }
        async run() {
            const instantiationService = await this.initServices();
            await instantiationService.invokeFunction(async (accessor) => {
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const logService = accessor.get(log_1.ILogService);
                // On Windows, configure the UNC allow list based on settings
                if (platform_1.isWindows) {
                    if (configurationService.getValue('security.restrictUNCAccess') === false) {
                        (0, unc_1.disableUNCAccessRestrictions)();
                    }
                    else {
                        (0, unc_1.addUNCHostToAllowlist)(configurationService.getValue('security.allowedUNCHosts'));
                    }
                }
                try {
                    await this.doRun(instantiationService.createInstance(extensionManagementCLI_1.ExtensionManagementCLI, new log_1.ConsoleLogger(logService.getLevel(), false)));
                }
                catch (error) {
                    logService.error(error);
                    console.error((0, errors_1.getErrorMessage)(error));
                    throw error;
                }
            });
        }
        async initServices() {
            const services = new serviceCollection_1.ServiceCollection();
            const productService = { _serviceBrand: undefined, ...product_1.default };
            services.set(productService_1.IProductService, productService);
            const environmentService = new serverEnvironmentService_1.ServerEnvironmentService(this.args, productService);
            services.set(serverEnvironmentService_1.IServerEnvironmentService, environmentService);
            const loggerService = new loggerService_1.LoggerService((0, log_1.getLogLevel)(environmentService), environmentService.logsHome);
            services.set(log_1.ILoggerService, loggerService);
            const logService = new logService_1.LogService(this._register(loggerService.createLogger('remoteCLI', { name: (0, nls_1.localize)('remotecli', "Remote CLI") })));
            services.set(log_1.ILogService, logService);
            logService.trace(`Remote configuration data at ${this.remoteDataFolder}`);
            logService.trace('process arguments:', this.args);
            // Files
            const fileService = this._register(new fileService_1.FileService(logService));
            services.set(files_1.IFileService, fileService);
            fileService.registerProvider(network_1.Schemas.file, this._register(new diskFileSystemProvider_1.DiskFileSystemProvider(logService)));
            const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
            services.set(uriIdentity_1.IUriIdentityService, uriIdentityService);
            // User Data Profiles
            const userDataProfilesService = this._register(new userDataProfile_2.ServerUserDataProfilesService(uriIdentityService, environmentService, fileService, logService));
            services.set(userDataProfile_1.IUserDataProfilesService, userDataProfilesService);
            // Configuration
            const configurationService = this._register(new configurationService_1.ConfigurationService(userDataProfilesService.defaultProfile.settingsResource, fileService, new policy_1.NullPolicyService(), logService));
            services.set(configuration_1.IConfigurationService, configurationService);
            // Initialize
            await Promise.all([
                configurationService.initialize(),
                userDataProfilesService.init()
            ]);
            services.set(request_1.IRequestService, new descriptors_1.SyncDescriptor(requestService_1.RequestService));
            services.set(download_1.IDownloadService, new descriptors_1.SyncDescriptor(downloadService_1.DownloadService));
            services.set(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            services.set(extensionManagement_1.IExtensionGalleryService, new descriptors_1.SyncDescriptor(extensionGalleryService_1.ExtensionGalleryServiceWithNoStorageService));
            services.set(extensionsProfileScannerService_1.IExtensionsProfileScannerService, new descriptors_1.SyncDescriptor(extensionsProfileScannerService_2.ExtensionsProfileScannerService));
            services.set(extensionsScannerService_1.IExtensionsScannerService, new descriptors_1.SyncDescriptor(extensionsScannerService_2.ExtensionsScannerService));
            services.set(extensionSignatureVerificationService_1.IExtensionSignatureVerificationService, new descriptors_1.SyncDescriptor(extensionSignatureVerificationService_1.ExtensionSignatureVerificationService));
            services.set(extensionManagementService_1.INativeServerExtensionManagementService, new descriptors_1.SyncDescriptor(extensionManagementService_1.ExtensionManagementService));
            services.set(languagePacks_1.ILanguagePackService, new descriptors_1.SyncDescriptor(languagePacks_2.NativeLanguagePackService));
            return new instantiationService_1.InstantiationService(services);
        }
        async doRun(extensionManagementCLI) {
            // List Extensions
            if (this.args['list-extensions']) {
                return extensionManagementCLI.listExtensions(!!this.args['show-versions'], this.args['category']);
            }
            // Install Extension
            else if (this.args['install-extension'] || this.args['install-builtin-extension']) {
                const installOptions = { isMachineScoped: !!this.args['do-not-sync'], installPreReleaseVersion: !!this.args['pre-release'] };
                return extensionManagementCLI.installExtensions(this.asExtensionIdOrVSIX(this.args['install-extension'] || []), this.asExtensionIdOrVSIX(this.args['install-builtin-extension'] || []), installOptions, !!this.args['force']);
            }
            // Uninstall Extension
            else if (this.args['uninstall-extension']) {
                return extensionManagementCLI.uninstallExtensions(this.asExtensionIdOrVSIX(this.args['uninstall-extension']), !!this.args['force']);
            }
            // Update the installed extensions
            else if (this.args['update-extensions']) {
                return extensionManagementCLI.updateExtensions();
            }
            // Locate Extension
            else if (this.args['locate-extension']) {
                return extensionManagementCLI.locateExtension(this.args['locate-extension']);
            }
        }
        asExtensionIdOrVSIX(inputs) {
            return inputs.map(input => /\.vsix$/i.test(input) ? uri_1.URI.file((0, path_1.isAbsolute)(input) ? input : (0, path_1.join)((0, process_1.cwd)(), input)) : input);
        }
    }
    function eventuallyExit(code) {
        setTimeout(() => process.exit(code), 0);
    }
    async function run(args, REMOTE_DATA_FOLDER, optionDescriptions) {
        if (args.help) {
            const executable = product_1.default.serverApplicationName + (platform_1.isWindows ? '.cmd' : '');
            console.log((0, argv_1.buildHelpMessage)(product_1.default.nameLong, executable, product_1.default.version, optionDescriptions, { noInputFiles: true, noPipe: true }));
            return;
        }
        // Version Info
        if (args.version) {
            console.log((0, argv_1.buildVersionMessage)(product_1.default.version, product_1.default.commit));
            return;
        }
        const cliMain = new CliMain(args, REMOTE_DATA_FOLDER);
        try {
            await cliMain.run();
            eventuallyExit(0);
        }
        catch (err) {
            eventuallyExit(1);
        }
        finally {
            cliMain.dispose();
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRXh0ZW5zaW9uSG9zdEFnZW50Q2xpLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9zZXJ2ZXIvbm9kZS9yZW1vdGVFeHRlbnNpb25Ib3N0QWdlbnRDbGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrTGhHLGtCQXNCQztJQXRKRCxNQUFNLE9BQVEsU0FBUSxzQkFBVTtRQUUvQixZQUE2QixJQUFzQixFQUFtQixnQkFBd0I7WUFDN0YsS0FBSyxFQUFFLENBQUM7WUFEb0IsU0FBSSxHQUFKLElBQUksQ0FBa0I7WUFBbUIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFRO1lBRzdGLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsa0JBQWtCO1lBQ2xCLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRztZQUNSLE1BQU0sb0JBQW9CLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdkQsTUFBTSxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFDLFFBQVEsRUFBQyxFQUFFO2dCQUMxRCxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztnQkFDakUsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQkFBVyxDQUFDLENBQUM7Z0JBRTdDLDZEQUE2RDtnQkFDN0QsSUFBSSxvQkFBUyxFQUFFLENBQUM7b0JBQ2YsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsNEJBQTRCLENBQUMsS0FBSyxLQUFLLEVBQUUsQ0FBQzt3QkFDM0Us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