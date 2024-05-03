/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "fs", "vs/base/common/uri", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/extpath", "vs/base/common/event", "vs/base/common/labels", "vs/base/common/network", "vs/base/common/path", "vs/base/common/performance", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/strings", "vs/base/node/pfs", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc.net", "vs/code/electron-main/app", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationService", "vs/platform/diagnostics/node/diagnosticsService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/environment/node/argvHelper", "vs/platform/environment/node/wait", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/bufferLog", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/protocol/electron-main/protocol", "vs/platform/protocol/electron-main/protocolMainService", "vs/platform/tunnel/common/tunnel", "vs/platform/tunnel/node/tunnelService", "vs/platform/request/common/request", "vs/platform/request/electron-main/requestMainService", "vs/platform/sign/common/sign", "vs/platform/sign/node/signService", "vs/platform/state/node/state", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/theme/electron-main/themeMainService", "vs/platform/userDataProfile/electron-main/userDataProfile", "vs/platform/policy/common/policy", "vs/platform/policy/node/nativePolicyService", "vs/platform/policy/common/filePolicyService", "vs/base/common/lifecycle", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/log/electron-main/loggerService", "vs/platform/log/common/logService", "vs/platform/dialogs/common/dialogs", "vs/platform/state/node/stateService", "vs/platform/userData/common/fileUserDataProvider", "vs/base/node/unc", "vs/platform/update/common/update.config.contribution"], function (require, exports, electron_1, fs_1, uri_1, arrays_1, async_1, errorMessage_1, errors_1, extpath_1, event_1, labels_1, network_1, path_1, performance_1, platform_1, process_1, strings_1, pfs_1, ipc_1, ipc_net_1, app_1, nls_1, configuration_1, configurationService_1, diagnosticsService_1, environmentMainService_1, argvHelper_1, wait_1, files_1, fileService_1, diskFileSystemProvider_1, descriptors_1, instantiationService_1, serviceCollection_1, lifecycleMainService_1, bufferLog_1, log_1, product_1, productService_1, protocol_1, protocolMainService_1, tunnel_1, tunnelService_1, request_1, requestMainService_1, sign_1, signService_1, state_1, telemetryUtils_1, themeMainService_1, userDataProfile_1, policy_1, nativePolicyService_1, filePolicyService_1, lifecycle_1, uriIdentity_1, uriIdentityService_1, loggerService_1, logService_1, dialogs_1, stateService_1, fileUserDataProvider_1, unc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The main VS Code entry point.
     *
     * Note: This class can exist more than once for example when VS Code is already
     * running and a second instance is started from the command line. It will always
     * try to communicate with an existing instance to prevent that 2 VS Code instances
     * are running at the same time.
     */
    class CodeMain {
        main() {
            try {
                this.startup();
            }
            catch (error) {
                console.error(error.message);
                electron_1.app.exit(1);
            }
        }
        async startup() {
            // Set the error handler early enough so that we are not getting the
            // default electron error dialog popping up
            (0, errors_1.setUnexpectedErrorHandler)(err => console.error(err));
            // Create services
            const [instantiationService, instanceEnvironment, environmentMainService, configurationService, stateMainService, bufferLogService, productService, userDataProfilesMainService] = this.createServices();
            try {
                // Init services
                try {
                    await this.initServices(environmentMainService, userDataProfilesMainService, configurationService, stateMainService, productService);
                }
                catch (error) {
                    // Show a dialog for errors that can be resolved by the user
                    this.handleStartupDataDirError(environmentMainService, productService, error);
                    throw error;
                }
                // Startup
                await instantiationService.invokeFunction(async (accessor) => {
                    const logService = accessor.get(log_1.ILogService);
                    const lifecycleMainService = accessor.get(lifecycleMainService_1.ILifecycleMainService);
                    const fileService = accessor.get(files_1.IFileService);
                    const loggerService = accessor.get(log_1.ILoggerService);
                    // Create the main IPC server by trying to be the server
                    // If this throws an error it means we are not the first
                    // instance of VS Code running and so we would quit.
                    const mainProcessNodeIpcServer = await this.claimInstance(logService, environmentMainService, lifecycleMainService, instantiationService, productService, true);
                    // Write a lockfile to indicate an instance is running
                    // (https://github.com/microsoft/vscode/issues/127861#issuecomment-877417451)
                    pfs_1.Promises.writeFile(environmentMainService.mainLockfile, String(process.pid)).catch(err => {
                        logService.warn(`app#startup(): Error writing main lockfile: ${err.stack}`);
                    });
                    // Delay creation of spdlog for perf reasons (https://github.com/microsoft/vscode/issues/72906)
                    bufferLogService.logger = loggerService.createLogger('main', { name: (0, nls_1.localize)('mainLog', "Main") });
                    // Lifecycle
                    event_1.Event.once(lifecycleMainService.onWillShutdown)(evt => {
                        fileService.dispose();
                        configurationService.dispose();
                        evt.join('instanceLockfile', pfs_1.Promises.unlink(environmentMainService.mainLockfile).catch(() => { }));
                    });
                    return instantiationService.createInstance(app_1.CodeApplication, mainProcessNodeIpcServer, instanceEnvironment).startup();
                });
            }
            catch (error) {
                instantiationService.invokeFunction(this.quit, error);
            }
        }
        createServices() {
            const services = new serviceCollection_1.ServiceCollection();
            const disposables = new lifecycle_1.DisposableStore();
            process.once('exit', () => disposables.dispose());
            // Product
            const productService = { _serviceBrand: undefined, ...product_1.default };
            services.set(productService_1.IProductService, productService);
            // Environment
            const environmentMainService = new environmentMainService_1.EnvironmentMainService(this.resolveArgs(), productService);
            const instanceEnvironment = this.patchEnvironment(environmentMainService); // Patch `process.env` with the instance's environment
            services.set(environmentMainService_1.IEnvironmentMainService, environmentMainService);
            // Logger
            const loggerService = new loggerService_1.LoggerMainService((0, log_1.getLogLevel)(environmentMainService), environmentMainService.logsHome);
            services.set(loggerService_1.ILoggerMainService, loggerService);
            // Log: We need to buffer the spdlog logs until we are sure
            // we are the only instance running, otherwise we'll have concurrent
            // log file access on Windows (https://github.com/microsoft/vscode/issues/41218)
            const bufferLogger = new bufferLog_1.BufferLogger(loggerService.getLogLevel());
            const logService = disposables.add(new logService_1.LogService(bufferLogger, [new log_1.ConsoleMainLogger(loggerService.getLogLevel())]));
            services.set(log_1.ILogService, logService);
            // Files
            const fileService = new fileService_1.FileService(logService);
            services.set(files_1.IFileService, fileService);
            const diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(logService);
            fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
            // URI Identity
            const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
            services.set(uriIdentity_1.IUriIdentityService, uriIdentityService);
            // State
            const stateService = new stateService_1.StateService(1 /* SaveStrategy.DELAYED */, environmentMainService, logService, fileService);
            services.set(state_1.IStateReadService, stateService);
            services.set(state_1.IStateService, stateService);
            // User Data Profiles
            const userDataProfilesMainService = new userDataProfile_1.UserDataProfilesMainService(stateService, uriIdentityService, environmentMainService, fileService, logService);
            services.set(userDataProfile_1.IUserDataProfilesMainService, userDataProfilesMainService);
            // Use FileUserDataProvider for user data to
            // enable atomic read / write operations.
            fileService.registerProvider(network_1.Schemas.vscodeUserData, new fileUserDataProvider_1.FileUserDataProvider(network_1.Schemas.file, diskFileSystemProvider, network_1.Schemas.vscodeUserData, userDataProfilesMainService, uriIdentityService, logService));
            // Policy
            const policyService = platform_1.isWindows && productService.win32RegValueName ? disposables.add(new nativePolicyService_1.NativePolicyService(logService, productService.win32RegValueName))
                : environmentMainService.policyFile ? disposables.add(new filePolicyService_1.FilePolicyService(environmentMainService.policyFile, fileService, logService))
                    : new policy_1.NullPolicyService();
            services.set(policy_1.IPolicyService, policyService);
            // Configuration
            const configurationService = new configurationService_1.ConfigurationService(userDataProfilesMainService.defaultProfile.settingsResource, fileService, policyService, logService);
            services.set(configuration_1.IConfigurationService, configurationService);
            // Lifecycle
            services.set(lifecycleMainService_1.ILifecycleMainService, new descriptors_1.SyncDescriptor(lifecycleMainService_1.LifecycleMainService, undefined, false));
            // Request
            services.set(request_1.IRequestService, new descriptors_1.SyncDescriptor(requestMainService_1.RequestMainService, undefined, true));
            // Themes
            services.set(themeMainService_1.IThemeMainService, new descriptors_1.SyncDescriptor(themeMainService_1.ThemeMainService));
            // Signing
            services.set(sign_1.ISignService, new descriptors_1.SyncDescriptor(signService_1.SignService, undefined, false /* proxied to other processes */));
            // Tunnel
            services.set(tunnel_1.ITunnelService, new descriptors_1.SyncDescriptor(tunnelService_1.TunnelService));
            // Protocol (instantiated early and not using sync descriptor for security reasons)
            services.set(protocol_1.IProtocolMainService, new protocolMainService_1.ProtocolMainService(environmentMainService, userDataProfilesMainService, logService));
            return [new instantiationService_1.InstantiationService(services, true), instanceEnvironment, environmentMainService, configurationService, stateService, bufferLogger, productService, userDataProfilesMainService];
        }
        patchEnvironment(environmentMainService) {
            const instanceEnvironment = {
                VSCODE_IPC_HOOK: environmentMainService.mainIPCHandle
            };
            ['VSCODE_NLS_CONFIG', 'VSCODE_PORTABLE'].forEach(key => {
                const value = process.env[key];
                if (typeof value === 'string') {
                    instanceEnvironment[key] = value;
                }
            });
            Object.assign(process.env, instanceEnvironment);
            return instanceEnvironment;
        }
        async initServices(environmentMainService, userDataProfilesMainService, configurationService, stateService, productService) {
            await async_1.Promises.settled([
                // Environment service (paths)
                Promise.all([
                    this.allowWindowsUNCPath(environmentMainService.extensionsPath), // enable extension paths on UNC drives...
                    environmentMainService.codeCachePath, // ...other user-data-derived paths should already be enlisted from `main.js`
                    environmentMainService.logsHome.with({ scheme: network_1.Schemas.file }).fsPath,
                    userDataProfilesMainService.defaultProfile.globalStorageHome.with({ scheme: network_1.Schemas.file }).fsPath,
                    environmentMainService.workspaceStorageHome.with({ scheme: network_1.Schemas.file }).fsPath,
                    environmentMainService.localHistoryHome.with({ scheme: network_1.Schemas.file }).fsPath,
                    environmentMainService.backupHome
                ].map(path => path ? pfs_1.Promises.mkdir(path, { recursive: true }) : undefined)),
                // State service
                stateService.init(),
                // Configuration service
                configurationService.initialize()
            ]);
            // Initialize user data profiles after initializing the state
            userDataProfilesMainService.init();
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
        async claimInstance(logService, environmentMainService, lifecycleMainService, instantiationService, productService, retry) {
            // Try to setup a server for running. If that succeeds it means
            // we are the first instance to startup. Otherwise it is likely
            // that another instance is already running.
            let mainProcessNodeIpcServer;
            try {
                (0, performance_1.mark)('code/willStartMainServer');
                mainProcessNodeIpcServer = await (0, ipc_net_1.serve)(environmentMainService.mainIPCHandle);
                (0, performance_1.mark)('code/didStartMainServer');
                event_1.Event.once(lifecycleMainService.onWillShutdown)(() => mainProcessNodeIpcServer.dispose());
            }
            catch (error) {
                // Handle unexpected errors (the only expected error is EADDRINUSE that
                // indicates another instance of VS Code is running)
                if (error.code !== 'EADDRINUSE') {
                    // Show a dialog for errors that can be resolved by the user
                    this.handleStartupDataDirError(environmentMainService, productService, error);
                    // Any other runtime error is just printed to the console
                    throw error;
                }
                // there's a running instance, let's connect to it
                let client;
                try {
                    client = await (0, ipc_net_1.connect)(environmentMainService.mainIPCHandle, 'main');
                }
                catch (error) {
                    // Handle unexpected connection errors by showing a dialog to the user
                    if (!retry || platform_1.isWindows || error.code !== 'ECONNREFUSED') {
                        if (error.code === 'EPERM') {
                            this.showStartupWarningDialog((0, nls_1.localize)('secondInstanceAdmin', "Another instance of {0} is already running as administrator.", productService.nameShort), (0, nls_1.localize)('secondInstanceAdminDetail', "Please close the other instance and try again."), productService);
                        }
                        throw error;
                    }
                    // it happens on Linux and OS X that the pipe is left behind
                    // let's delete it, since we can't connect to it and then
                    // retry the whole thing
                    try {
                        (0, fs_1.unlinkSync)(environmentMainService.mainIPCHandle);
                    }
                    catch (error) {
                        logService.warn('Could not delete obsolete instance handle', error);
                        throw error;
                    }
                    return this.claimInstance(logService, environmentMainService, lifecycleMainService, instantiationService, productService, false);
                }
                // Tests from CLI require to be the only instance currently
                if (environmentMainService.extensionTestsLocationURI && !environmentMainService.debugExtensionHost.break) {
                    const msg = `Running extension tests from the command line is currently only supported if no other instance of ${productService.nameShort} is running.`;
                    logService.error(msg);
                    client.dispose();
                    throw new Error(msg);
                }
                // Show a warning dialog after some timeout if it takes long to talk to the other instance
                // Skip this if we are running with --wait where it is expected that we wait for a while.
                // Also skip when gathering diagnostics (--status) which can take a longer time.
                let startupWarningDialogHandle = undefined;
                if (!environmentMainService.args.wait && !environmentMainService.args.status) {
                    startupWarningDialogHandle = setTimeout(() => {
                        this.showStartupWarningDialog((0, nls_1.localize)('secondInstanceNoResponse', "Another instance of {0} is running but not responding", productService.nameShort), (0, nls_1.localize)('secondInstanceNoResponseDetail', "Please close all other instances and try again."), productService);
                    }, 10000);
                }
                const otherInstanceLaunchMainService = ipc_1.ProxyChannel.toService(client.getChannel('launch'), { disableMarshalling: true });
                const otherInstanceDiagnosticsMainService = ipc_1.ProxyChannel.toService(client.getChannel('diagnostics'), { disableMarshalling: true });
                // Process Info
                if (environmentMainService.args.status) {
                    return instantiationService.invokeFunction(async () => {
                        const diagnosticsService = new diagnosticsService_1.DiagnosticsService(telemetryUtils_1.NullTelemetryService, productService);
                        const mainDiagnostics = await otherInstanceDiagnosticsMainService.getMainDiagnostics();
                        const remoteDiagnostics = await otherInstanceDiagnosticsMainService.getRemoteDiagnostics({ includeProcesses: true, includeWorkspaceMetadata: true });
                        const diagnostics = await diagnosticsService.getDiagnostics(mainDiagnostics, remoteDiagnostics);
                        console.log(diagnostics);
                        throw new errors_1.ExpectedError();
                    });
                }
                // Windows: allow to set foreground
                if (platform_1.isWindows) {
                    await this.windowsAllowSetForegroundWindow(otherInstanceLaunchMainService, logService);
                }
                // Send environment over...
                logService.trace('Sending env to running instance...');
                await otherInstanceLaunchMainService.start(environmentMainService.args, process.env);
                // Cleanup
                client.dispose();
                // Now that we started, make sure the warning dialog is prevented
                if (startupWarningDialogHandle) {
                    clearTimeout(startupWarningDialogHandle);
                }
                throw new errors_1.ExpectedError('Sent env to running instance. Terminating...');
            }
            // Print --status usage info
            if (environmentMainService.args.status) {
                console.log((0, nls_1.localize)('statusWarning', "Warning: The --status argument can only be used if {0} is already running. Please run it again after {0} has started.", productService.nameShort));
                throw new errors_1.ExpectedError('Terminating...');
            }
            // Set the VSCODE_PID variable here when we are sure we are the first
            // instance to startup. Otherwise we would wrongly overwrite the PID
            process.env['VSCODE_PID'] = String(process.pid);
            return mainProcessNodeIpcServer;
        }
        handleStartupDataDirError(environmentMainService, productService, error) {
            if (error.code === 'EACCES' || error.code === 'EPERM') {
                const directories = (0, arrays_1.coalesce)([environmentMainService.userDataPath, environmentMainService.extensionsPath, ipc_net_1.XDG_RUNTIME_DIR]).map(folder => (0, labels_1.getPathLabel)(uri_1.URI.file(folder), { os: platform_1.OS, tildify: environmentMainService }));
                this.showStartupWarningDialog((0, nls_1.localize)('startupDataDirError', "Unable to write program user data."), (0, nls_1.localize)('startupUserDataAndExtensionsDirErrorDetail', "{0}\n\nPlease make sure the following directories are writeable:\n\n{1}", (0, errorMessage_1.toErrorMessage)(error), directories.join('\n')), productService);
            }
        }
        showStartupWarningDialog(message, detail, productService) {
            // use sync variant here because we likely exit after this method
            // due to startup issues and otherwise the dialog seems to disappear
            // https://github.com/microsoft/vscode/issues/104493
            electron_1.dialog.showMessageBoxSync((0, dialogs_1.massageMessageBoxOptions)({
                type: 'warning',
                buttons: [(0, nls_1.localize)({ key: 'close', comment: ['&& denotes a mnemonic'] }, "&&Close")],
                message,
                detail
            }, productService).options);
        }
        async windowsAllowSetForegroundWindow(launchMainService, logService) {
            if (platform_1.isWindows) {
                const processId = await launchMainService.getMainProcessId();
                logService.trace('Sending some foreground love to the running instance:', processId);
                try {
                    (await new Promise((resolve_1, reject_1) => { require(['windows-foreground-love'], resolve_1, reject_1); })).allowSetForegroundWindow(processId);
                }
                catch (error) {
                    logService.error(error);
                }
            }
        }
        quit(accessor, reason) {
            const logService = accessor.get(log_1.ILogService);
            const lifecycleMainService = accessor.get(lifecycleMainService_1.ILifecycleMainService);
            let exitCode = 0;
            if (reason) {
                if (reason.isExpected) {
                    if (reason.message) {
                        logService.trace(reason.message);
                    }
                }
                else {
                    exitCode = 1; // signal error to the outside
                    if (reason.stack) {
                        logService.error(reason.stack);
                    }
                    else {
                        logService.error(`Startup error: ${reason.toString()}`);
                    }
                }
            }
            lifecycleMainService.kill(exitCode);
        }
        //#region Command line arguments utilities
        resolveArgs() {
            // Parse arguments
            const args = this.validatePaths((0, argvHelper_1.parseMainProcessArgv)(process.argv));
            // If we are started with --wait create a random temporary file
            // and pass it over to the starting instance. We can use this file
            // to wait for it to be deleted to monitor that the edited file
            // is closed and then exit the waiting process.
            //
            // Note: we are not doing this if the wait marker has been already
            // added as argument. This can happen if VS Code was started from CLI.
            if (args.wait && !args.waitMarkerFilePath) {
                const waitMarkerFilePath = (0, wait_1.createWaitMarkerFileSync)(args.verbose);
                if (waitMarkerFilePath) {
                    (0, argvHelper_1.addArg)(process.argv, '--waitMarkerFilePath', waitMarkerFilePath);
                    args.waitMarkerFilePath = waitMarkerFilePath;
                }
            }
            return args;
        }
        validatePaths(args) {
            // Track URLs if they're going to be used
            if (args['open-url']) {
                args._urls = args._;
                args._ = [];
            }
            // Normalize paths and watch out for goto line mode
            if (!args['remote']) {
                const paths = this.doValidatePaths(args._, args.goto);
                args._ = paths;
            }
            return args;
        }
        doValidatePaths(args, gotoLineMode) {
            const currentWorkingDir = (0, process_1.cwd)();
            const result = args.map(arg => {
                let pathCandidate = String(arg);
                let parsedPath = undefined;
                if (gotoLineMode) {
                    parsedPath = (0, extpath_1.parseLineAndColumnAware)(pathCandidate);
                    pathCandidate = parsedPath.path;
                }
                if (pathCandidate) {
                    pathCandidate = this.preparePath(currentWorkingDir, pathCandidate);
                }
                const sanitizedFilePath = (0, extpath_1.sanitizeFilePath)(pathCandidate, currentWorkingDir);
                const filePathBasename = (0, path_1.basename)(sanitizedFilePath);
                if (filePathBasename /* can be empty if code is opened on root */ && !(0, extpath_1.isValidBasename)(filePathBasename)) {
                    return null; // do not allow invalid file names
                }
                if (gotoLineMode && parsedPath) {
                    parsedPath.path = sanitizedFilePath;
                    return this.toPath(parsedPath);
                }
                return sanitizedFilePath;
            });
            const caseInsensitive = platform_1.isWindows || platform_1.isMacintosh;
            const distinctPaths = (0, arrays_1.distinct)(result, path => path && caseInsensitive ? path.toLowerCase() : (path || ''));
            return (0, arrays_1.coalesce)(distinctPaths);
        }
        preparePath(cwd, path) {
            // Trim trailing quotes
            if (platform_1.isWindows) {
                path = (0, strings_1.rtrim)(path, '"'); // https://github.com/microsoft/vscode/issues/1498
            }
            // Trim whitespaces
            path = (0, strings_1.trim)((0, strings_1.trim)(path, ' '), '\t');
            if (platform_1.isWindows) {
                // Resolve the path against cwd if it is relative
                path = (0, path_1.resolve)(cwd, path);
                // Trim trailing '.' chars on Windows to prevent invalid file names
                path = (0, strings_1.rtrim)(path, '.');
            }
            return path;
        }
        toPath(pathWithLineAndCol) {
            const segments = [pathWithLineAndCol.path];
            if (typeof pathWithLineAndCol.line === 'number') {
                segments.push(String(pathWithLineAndCol.line));
            }
            if (typeof pathWithLineAndCol.column === 'number') {
                segments.push(String(pathWithLineAndCol.column));
            }
            return segments.join(':');
        }
    }
    // Main Startup
    const code = new CodeMain();
    code.main();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvY29kZS9lbGVjdHJvbi1tYWluL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF3RWhHOzs7Ozs7O09BT0c7SUFDSCxNQUFNLFFBQVE7UUFFYixJQUFJO1lBQ0gsSUFBSSxDQUFDO2dCQUNKLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzdCLGNBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDYixDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyxPQUFPO1lBRXBCLG9FQUFvRTtZQUNwRSwyQ0FBMkM7WUFDM0MsSUFBQSxrQ0FBeUIsRUFBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVyRCxrQkFBa0I7WUFDbEIsTUFBTSxDQUFDLG9CQUFvQixFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLG9CQUFvQixFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSwyQkFBMkIsQ0FBQyxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUV6TSxJQUFJLENBQUM7Z0JBRUosZ0JBQWdCO2dCQUNoQixJQUFJLENBQUM7b0JBQ0osTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLHNCQUFzQixFQUFFLDJCQUEyQixFQUFFLG9CQUFvQixFQUFFLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUN0SSxDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7b0JBRWhCLDREQUE0RDtv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