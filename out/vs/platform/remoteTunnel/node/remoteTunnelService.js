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
define(["require", "exports", "vs/platform/remoteTunnel/common/remoteTunnel", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/platform/environment/common/environment", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/base/common/path", "child_process", "vs/platform/product/common/productService", "vs/base/common/platform", "vs/base/common/async", "vs/platform/lifecycle/node/sharedProcessLifecycleService", "vs/platform/configuration/common/configuration", "vs/nls", "os", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/base/node/nodeStreams", "vs/base/common/resources"], function (require, exports, remoteTunnel_1, event_1, telemetry_1, environment_1, lifecycle_1, log_1, path_1, child_process_1, productService_1, platform_1, async_1, sharedProcessLifecycleService_1, configuration_1, nls_1, os_1, storage_1, types_1, nodeStreams_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteTunnelService = void 0;
    const restartTunnelOnConfigurationChanges = [
        remoteTunnel_1.CONFIGURATION_KEY_HOST_NAME,
        remoteTunnel_1.CONFIGURATION_KEY_PREVENT_SLEEP,
    ];
    // This is the session used run the tunnel access.
    // if set, the remote tunnel access is currently enabled.
    // if not set, the remote tunnel access is currently disabled.
    const TUNNEL_ACCESS_SESSION = 'remoteTunnelSession';
    // Boolean indicating whether the tunnel should be installed as a service.
    const TUNNEL_ACCESS_IS_SERVICE = 'remoteTunnelIsService';
    /**
     * This service runs on the shared service. It is running the `code-tunnel` command
     * to make the current machine available for remote access.
     */
    let RemoteTunnelService = class RemoteTunnelService extends lifecycle_1.Disposable {
        constructor(telemetryService, productService, environmentService, loggerService, sharedProcessLifecycleService, configurationService, storageService) {
            super();
            this.telemetryService = telemetryService;
            this.productService = productService;
            this.environmentService = environmentService;
            this.configurationService = configurationService;
            this.storageService = storageService;
            this._onDidTokenFailedEmitter = new event_1.Emitter();
            this.onDidTokenFailed = this._onDidTokenFailedEmitter.event;
            this._onDidChangeTunnelStatusEmitter = new event_1.Emitter();
            this.onDidChangeTunnelStatus = this._onDidChangeTunnelStatusEmitter.event;
            this._onDidChangeModeEmitter = new event_1.Emitter();
            this.onDidChangeMode = this._onDidChangeModeEmitter.event;
            /**
             * "Mode" in the terminal state we want to get to -- started, stopped, and
             * the attributes associated with each.
             *
             * At any given time, work may be ongoing to get `_tunnelStatus` into a
             * state that reflects the desired `mode`.
             */
            this._mode = remoteTunnel_1.INACTIVE_TUNNEL_MODE;
            this._initialized = false;
            this.defaultOnOutput = (a, isErr) => {
                if (isErr) {
                    this._logger.error(a);
                }
                else {
                    this._logger.info(a);
                }
            };
            this._logger = this._register(loggerService.createLogger((0, resources_1.joinPath)(environmentService.logsHome, `${remoteTunnel_1.LOG_ID}.log`), { id: remoteTunnel_1.LOG_ID, name: remoteTunnel_1.LOGGER_NAME }));
            this._startTunnelProcessDelayer = new async_1.Delayer(100);
            this._register(this._logger.onDidChangeLogLevel(l => this._logger.info('Log level changed to ' + (0, log_1.LogLevelToString)(l))));
            this._register(sharedProcessLifecycleService.onWillShutdown(() => {
                this._tunnelProcess?.cancel();
                this._tunnelProcess = undefined;
                this.dispose();
            }));
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (restartTunnelOnConfigurationChanges.some(c => e.affectsConfiguration(c))) {
                    this._startTunnelProcessDelayer.trigger(() => this.updateTunnelProcess());
                }
            }));
            this._mode = this._restoreMode();
            this._tunnelStatus = remoteTunnel_1.TunnelStates.uninitialized;
        }
        async getTunnelStatus() {
            return this._tunnelStatus;
        }
        setTunnelStatus(tunnelStatus) {
            this._tunnelStatus = tunnelStatus;
            this._onDidChangeTunnelStatusEmitter.fire(tunnelStatus);
        }
        setMode(mode) {
            if (isSameMode(this._mode, mode)) {
                return;
            }
            this._mode = mode;
            this._storeMode(mode);
            this._onDidChangeModeEmitter.fire(this._mode);
            if (mode.active) {
                this._logger.info(`Session updated: ${mode.session.accountLabel} (${mode.session.providerId}) (service=${mode.asService})`);
                if (mode.session.token) {
                    this._logger.info(`Session token updated: ${mode.session.accountLabel} (${mode.session.providerId})`);
                }
            }
            else {
                this._logger.info(`Session reset`);
            }
        }
        getMode() {
            return Promise.resolve(this._mode);
        }
        async initialize(mode) {
            if (this._initialized) {
                return this._tunnelStatus;
            }
            this._initialized = true;
            this.setMode(mode);
            try {
                await this._startTunnelProcessDelayer.trigger(() => this.updateTunnelProcess());
            }
            catch (e) {
                this._logger.error(e);
            }
            return this._tunnelStatus;
        }
        getTunnelCommandLocation() {
            if (!this._tunnelCommand) {
                let binParentLocation;
                if (platform_1.isMacintosh) {
                    // appRoot = /Applications/Visual Studio Code - Insiders.app/Contents/Resources/app
                    // bin = /Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin
                    binParentLocation = this.environmentService.appRoot;
                }
                else {
                    // appRoot = C:\Users\<name>\AppData\Local\Programs\Microsoft VS Code Insiders\resources\app
                    // bin = C:\Users\<name>\AppData\Local\Programs\Microsoft VS Code Insiders\bin
                    // appRoot = /usr/share/code-insiders/resources/app
                    // bin = /usr/share/code-insiders/bin
                    binParentLocation = (0, path_1.dirname)((0, path_1.dirname)(this.environmentService.appRoot));
                }
                this._tunnelCommand = (0, path_1.join)(binParentLocation, 'bin', `${this.productService.tunnelApplicationName}${platform_1.isWindows ? '.exe' : ''}`);
            }
            return this._tunnelCommand;
        }
        async startTunnel(mode) {
            if (isSameMode(this._mode, mode) && this._tunnelStatus.type !== 'disconnected') {
                return this._tunnelStatus;
            }
            this.setMode(mode);
            try {
                await this._startTunnelProcessDelayer.trigger(() => this.updateTunnelProcess());
            }
            catch (e) {
                this._logger.error(e);
            }
            return this._tunnelStatus;
        }
        async stopTunnel() {
            if (this._tunnelProcess) {
                this._tunnelProcess.cancel();
                this._tunnelProcess = undefined;
            }
            if (this._mode.active) {
                // Be careful to only uninstall the service if we're the ones who installed it:
                const needsServiceUninstall = this._mode.asService;
                this.setMode(remoteTunnel_1.INACTIVE_TUNNEL_MODE);
                try {
                    if (needsServiceUninstall) {
                        this.runCodeTunnelCommand('uninstallService', ['service', 'uninstall']);
                    }
                }
                catch (e) {
                    this._logger.error(e);
                }
            }
            try {
                await this.runCodeTunnelCommand('stop', ['kill']);
            }
            catch (e) {
                this._logger.error(e);
            }
            this.setTunnelStatus(remoteTunnel_1.TunnelStates.disconnected());
        }
        async updateTunnelProcess() {
            this.telemetryService.publicLog2('remoteTunnel.enablement', {
                enabled: this._mode.active,
                service: this._mode.active && this._mode.asService,
            });
            if (this._tunnelProcess) {
                this._tunnelProcess.cancel();
                this._tunnelProcess = undefined;
            }
            let output = '';
            let isServiceInstalled = false;
            const onOutput = (a, isErr) => {
                if (isErr) {
                    this._logger.error(a);
                }
                else {
                    output += a;
                }
                if (!this.environmentService.isBuilt && a.startsWith('   Compiling')) {
                    this.setTunnelStatus(remoteTunnel_1.TunnelStates.connecting((0, nls_1.localize)('remoteTunnelService.building', 'Building CLI from sources')));
                }
            };
            const statusProcess = this.runCodeTunnelCommand('status', ['status'], onOutput);
            this._tunnelProcess = statusProcess;
            try {
                await statusProcess;
                if (this._tunnelProcess !== statusProcess) {
                    return;
                }
                // split and find the line, since in dev builds additional noise is
                // added by cargo to the output.
                let status;
                try {
                    status = JSON.parse(output.trim().split('\n').find(l => l.startsWith('{')));
                }
                catch (e) {
                    this._logger.error(`Could not parse status output: ${JSON.stringify(output.trim())}`);
                    this.setTunnelStatus(remoteTunnel_1.TunnelStates.disconnected());
                    return;
                }
                isServiceInstalled = status.service_installed;
                this._logger.info(status.tunnel ? 'Other tunnel running, attaching...' : 'No other tunnel running');
                // If a tunnel is running but the mode isn't "active", we'll still attach
                // to the tunnel to show its state in the UI. If neither are true, disconnect
                if (!status.tunnel && !this._mode.active) {
                    this.setTunnelStatus(remoteTunnel_1.TunnelStates.disconnected());
                    return;
                }
            }
            catch (e) {
                this._logger.error(e);
                this.setTunnelStatus(remoteTunnel_1.TunnelStates.disconnected());
                return;
            }
            finally {
                if (this._tunnelProcess === statusProcess) {
                    this._tunnelProcess = undefined;
                }
            }
            const session = this._mode.active ? this._mode.session : undefined;
            if (session && session.token) {
                const token = session.token;
                this.setTunnelStatus(remoteTunnel_1.TunnelStates.connecting((0, nls_1.localize)({ key: 'remoteTunnelService.authorizing', comment: ['{0} is a user account name, {1} a provider name (e.g. Github)'] }, 'Connecting as {0} ({1})', session.accountLabel, session.providerId)));
                const onLoginOutput = (a, isErr) => {
                    a = a.replaceAll(token, '*'.repeat(4));
                    onOutput(a, isErr);
                };
                const loginProcess = this.runCodeTunnelCommand('login', ['user', 'login', '--provider', session.providerId, '--access-token', token, '--log', (0, log_1.LogLevelToString)(this._logger.getLevel())], onLoginOutput);
                this._tunnelProcess = loginProcess;
                try {
                    await loginProcess;
                    if (this._tunnelProcess !== loginProcess) {
                        return;
                    }
                }
                catch (e) {
                    this._logger.error(e);
                    this._tunnelProcess = undefined;
                    this._onDidTokenFailedEmitter.fire(session);
                    this.setTunnelStatus(remoteTunnel_1.TunnelStates.disconnected(session));
                    return;
                }
            }
            const hostName = this._getTunnelName();
            if (hostName) {
                this.setTunnelStatus(remoteTunnel_1.TunnelStates.connecting((0, nls_1.localize)({ key: 'remoteTunnelService.openTunnelWithName', comment: ['{0} is a tunnel name'] }, 'Opening tunnel {0}', hostName)));
            }
            else {
                this.setTunnelStatus(remoteTunnel_1.TunnelStates.connecting((0, nls_1.localize)('remoteTunnelService.openTunnel', 'Opening tunnel')));
            }
            const args = ['--accept-server-license-terms', '--log', (0, log_1.LogLevelToString)(this._logger.getLevel())];
            if (hostName) {
                args.push('--name', hostName);
            }
            else {
                args.push('--random-name');
            }
            let serviceInstallFailed = false;
            if (this._mode.active && this._mode.asService && !isServiceInstalled) {
                // I thought about calling `code tunnel kill` here, but having multiple
                // tunnel processes running is pretty much idempotent. If there's
                // another tunnel process running, the service process will
                // take over when it exits, no hard feelings.
                serviceInstallFailed = await this.installTunnelService(args) === false;
            }
            return this.serverOrAttachTunnel(session, args, serviceInstallFailed);
        }
        async installTunnelService(args) {
            let status;
            try {
                status = await this.runCodeTunnelCommand('serviceInstall', ['service', 'install', ...args]);
            }
            catch (e) {
                this._logger.error(e);
                status = 1;
            }
            if (status !== 0) {
                const msg = (0, nls_1.localize)('remoteTunnelService.serviceInstallFailed', 'Failed to install tunnel as a service, starting in session...');
                this._logger.warn(msg);
                this.setTunnelStatus(remoteTunnel_1.TunnelStates.connecting(msg));
                return false;
            }
            return true;
        }
        async serverOrAttachTunnel(session, args, serviceInstallFailed) {
            args.push('--parent-process-id', String(process.pid));
            if (this._preventSleep()) {
                args.push('--no-sleep');
            }
            let isAttached = false;
            const serveCommand = this.runCodeTunnelCommand('tunnel', args, (message, isErr) => {
                if (isErr) {
                    this._logger.error(message);
                }
                else {
                    this._logger.info(message);
                }
                if (message.includes('Connected to an existing tunnel process')) {
                    isAttached = true;
                }
                const m = message.match(/Open this link in your browser (https:\/\/([^\/\s]+)\/([^\/\s]+)\/([^\/\s]+))/);
                if (m) {
                    const info = { link: m[1], domain: m[2], tunnelName: m[4], isAttached };
                    this.setTunnelStatus(remoteTunnel_1.TunnelStates.connected(info, serviceInstallFailed));
                }
                else if (message.match(/error refreshing token/)) {
                    serveCommand.cancel();
                    this._onDidTokenFailedEmitter.fire(session);
                    this.setTunnelStatus(remoteTunnel_1.TunnelStates.disconnected(session));
                }
            });
            this._tunnelProcess = serveCommand;
            serveCommand.finally(() => {
                if (serveCommand === this._tunnelProcess) {
                    // process exited unexpectedly
                    this._logger.info(`tunnel process terminated`);
                    this._tunnelProcess = undefined;
                    this._mode = remoteTunnel_1.INACTIVE_TUNNEL_MODE;
                    this.setTunnelStatus(remoteTunnel_1.TunnelStates.disconnected());
                }
            });
        }
        runCodeTunnelCommand(logLabel, commandArgs, onOutput = this.defaultOnOutput) {
            return (0, async_1.createCancelablePromise)(token => {
                return new Promise((resolve, reject) => {
                    if (token.isCancellationRequested) {
                        resolve(-1);
                    }
                    let tunnelProcess;
                    const stdio = ['ignore', 'pipe', 'pipe'];
                    token.onCancellationRequested(() => {
                        if (tunnelProcess) {
                            this._logger.info(`${logLabel} terminating(${tunnelProcess.pid})`);
                            tunnelProcess.kill();
                        }
                    });
                    if (!this.environmentService.isBuilt) {
                        onOutput('Building tunnel CLI from sources and run\n', false);
                        onOutput(`${logLabel} Spawning: cargo run -- tunnel ${commandArgs.join(' ')}\n`, false);
                        tunnelProcess = (0, child_process_1.spawn)('cargo', ['run', '--', 'tunnel', ...commandArgs], { cwd: (0, path_1.join)(this.environmentService.appRoot, 'cli'), stdio });
                    }
                    else {
                        onOutput('Running tunnel CLI\n', false);
                        const tunnelCommand = this.getTunnelCommandLocation();
                        onOutput(`${logLabel} Spawning: ${tunnelCommand} tunnel ${commandArgs.join(' ')}\n`, false);
                        tunnelProcess = (0, child_process_1.spawn)(tunnelCommand, ['tunnel', ...commandArgs], { cwd: (0, os_1.homedir)(), stdio });
                    }
                    tunnelProcess.stdout.pipe(new nodeStreams_1.StreamSplitter('\n')).on('data', data => {
                        if (tunnelProcess) {
                            const message = data.toString();
                            onOutput(message, false);
                        }
                    });
                    tunnelProcess.stderr.pipe(new nodeStreams_1.StreamSplitter('\n')).on('data', data => {
                        if (tunnelProcess) {
                            const message = data.toString();
                            onOutput(message, true);
                        }
                    });
                    tunnelProcess.on('exit', e => {
                        if (tunnelProcess) {
                            onOutput(`${logLabel} exit(${tunnelProcess.pid}): + ${e} `, false);
                            tunnelProcess = undefined;
                            resolve(e || 0);
                        }
                    });
                    tunnelProcess.on('error', e => {
                        if (tunnelProcess) {
                            onOutput(`${logLabel} error(${tunnelProcess.pid}): + ${e} `, true);
                            tunnelProcess = undefined;
                            reject();
                        }
                    });
                });
            });
        }
        async getTunnelName() {
            return this._getTunnelName();
        }
        _preventSleep() {
            return !!this.configurationService.getValue(remoteTunnel_1.CONFIGURATION_KEY_PREVENT_SLEEP);
        }
        _getTunnelName() {
            let name = this.configurationService.getValue(remoteTunnel_1.CONFIGURATION_KEY_HOST_NAME) || (0, os_1.hostname)();
            name = name.replace(/^-+/g, '').replace(/[^\w-]/g, '').substring(0, 20);
            return name || undefined;
        }
        _restoreMode() {
            try {
                const tunnelAccessSession = this.storageService.get(TUNNEL_ACCESS_SESSION, -1 /* StorageScope.APPLICATION */);
                const asService = this.storageService.getBoolean(TUNNEL_ACCESS_IS_SERVICE, -1 /* StorageScope.APPLICATION */, false);
                if (tunnelAccessSession) {
                    const session = JSON.parse(tunnelAccessSession);
                    if (session && (0, types_1.isString)(session.accountLabel) && (0, types_1.isString)(session.sessionId) && (0, types_1.isString)(session.providerId)) {
                        return { active: true, session, asService };
                    }
                    this._logger.error('Problems restoring session from storage, invalid format', session);
                }
            }
            catch (e) {
                this._logger.error('Problems restoring session from storage', e);
            }
            return remoteTunnel_1.INACTIVE_TUNNEL_MODE;
        }
        _storeMode(mode) {
            if (mode.active) {
                const sessionWithoutToken = {
                    providerId: mode.session.providerId, sessionId: mode.session.sessionId, accountLabel: mode.session.accountLabel
                };
                this.storageService.store(TUNNEL_ACCESS_SESSION, JSON.stringify(sessionWithoutToken), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                this.storageService.store(TUNNEL_ACCESS_IS_SERVICE, mode.asService, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(TUNNEL_ACCESS_SESSION, -1 /* StorageScope.APPLICATION */);
                this.storageService.remove(TUNNEL_ACCESS_IS_SERVICE, -1 /* StorageScope.APPLICATION */);
            }
        }
    };
    exports.RemoteTunnelService = RemoteTunnelService;
    exports.RemoteTunnelService = RemoteTunnelService = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, productService_1.IProductService),
        __param(2, environment_1.INativeEnvironmentService),
        __param(3, log_1.ILoggerService),
        __param(4, sharedProcessLifecycleService_1.ISharedProcessLifecycleService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, storage_1.IStorageService)
    ], RemoteTunnelService);
    function isSameSession(a1, a2) {
        if (a1 && a2) {
            return a1.sessionId === a2.sessionId && a1.providerId === a2.providerId && a1.token === a2.token;
        }
        return a1 === a2;
    }
    const isSameMode = (a, b) => {
        if (a.active !== b.active) {
            return false;
        }
        else if (a.active && b.active) {
            return a.asService === b.asService && isSameSession(a.session, b.session);
        }
        else {
            return true;
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlVHVubmVsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcmVtb3RlVHVubmVsL25vZGUvcmVtb3RlVHVubmVsU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrQ2hHLE1BQU0sbUNBQW1DLEdBQXNCO1FBQzlELDBDQUEyQjtRQUMzQiw4Q0FBK0I7S0FDL0IsQ0FBQztJQUVGLGtEQUFrRDtJQUNsRCx5REFBeUQ7SUFDekQsOERBQThEO0lBQzlELE1BQU0scUJBQXFCLEdBQUcscUJBQXFCLENBQUM7SUFDcEQsMEVBQTBFO0lBQzFFLE1BQU0sd0JBQXdCLEdBQUcsdUJBQXVCLENBQUM7SUFFekQ7OztPQUdHO0lBQ0ksSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxzQkFBVTtRQWlDbEQsWUFDb0IsZ0JBQW9ELEVBQ3RELGNBQWdELEVBQ3RDLGtCQUE4RCxFQUN6RSxhQUE2QixFQUNiLDZCQUE2RCxFQUN0RSxvQkFBNEQsRUFDbEUsY0FBZ0Q7WUFFakUsS0FBSyxFQUFFLENBQUM7WUFSNEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNyQyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDckIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUEyQjtZQUdqRCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2pELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQXBDakQsNkJBQXdCLEdBQUcsSUFBSSxlQUFPLEVBQW9DLENBQUM7WUFDNUUscUJBQWdCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQztZQUV0RCxvQ0FBK0IsR0FBRyxJQUFJLGVBQU8sRUFBZ0IsQ0FBQztZQUMvRCw0QkFBdUIsR0FBRyxJQUFJLENBQUMsK0JBQStCLENBQUMsS0FBSyxDQUFDO1lBRXBFLDRCQUF1QixHQUFHLElBQUksZUFBTyxFQUFjLENBQUM7WUFDckQsb0JBQWUsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDO1lBSXJFOzs7Ozs7ZUFNRztZQUNLLFVBQUssR0FBZSxtQ0FBb0IsQ0FBQztZQVN6QyxpQkFBWSxHQUFHLEtBQUssQ0FBQztZQThFWixvQkFBZSxHQUFHLENBQUMsQ0FBUyxFQUFFLEtBQWMsRUFBRSxFQUFFO2dCQUNoRSxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUNYLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN2QixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RCLENBQUM7WUFDRixDQUFDLENBQUM7WUF4RUQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsSUFBQSxvQkFBUSxFQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxHQUFHLHFCQUFNLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLHFCQUFNLEVBQUUsSUFBSSxFQUFFLDBCQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckosSUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUksZUFBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRW5ELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLElBQUEsc0JBQWdCLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFeEgsSUFBSSxDQUFDLFNBQVMsQ0FBQyw2QkFBNkIsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFO2dCQUNoRSxJQUFJLENBQUMsY0FBYyxFQUFFLE1BQU0sRUFBRSxDQUFDO2dCQUM5QixJQUFJLENBQUMsY0FBYyxHQUFHLFNBQVMsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNoRSxJQUFJLG1DQUFtQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQzlFLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQztnQkFDM0UsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUMsYUFBYSxHQUFHLDJCQUFZLENBQUMsYUFBYSxDQUFDO1FBQ2pELENBQUM7UUFFTSxLQUFLLENBQUMsZUFBZTtZQUMzQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVPLGVBQWUsQ0FBQyxZQUEwQjtZQUNqRCxJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztZQUNsQyxJQUFJLENBQUMsK0JBQStCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFFTyxPQUFPLENBQUMsSUFBZ0I7WUFDL0IsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNsQyxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEIsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLG9CQUFvQixJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksS0FBSyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsY0FBYyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztnQkFDNUgsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUN4QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQywwQkFBMEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO2dCQUN2RyxDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3BDLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTztZQUNOLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBZ0I7WUFDaEMsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3ZCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztZQUMzQixDQUFDO1lBQ0QsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7WUFDekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuQixJQUFJLENBQUM7Z0JBQ0osTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUM7WUFDakYsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkIsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBVU8sd0JBQXdCO1lBQy9CLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQzFCLElBQUksaUJBQWlCLENBQUM7Z0JBQ3RCLElBQUksc0JBQVcsRUFBRSxDQUFDO29CQUNqQixtRkFBbUY7b0JBQ25GLG1GQUFtRjtvQkFDbkYsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQztnQkFDckQsQ0FBQztxQkFBTSxDQUFDO29CQUNQLDRGQUE0RjtvQkFDNUYsOEVBQThFO29CQUM5RSxtREFBbUQ7b0JBQ25ELHFDQUFxQztvQkFDckMsaUJBQWlCLEdBQUcsSUFBQSxjQUFPLEVBQUMsSUFBQSxjQUFPLEVBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZFLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFBLFdBQUksRUFBQyxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLHFCQUFxQixHQUFHLG9CQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNoSSxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO1FBQzVCLENBQUM7UUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLElBQXNCO1lBQ3ZDLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssY0FBYyxFQUFFLENBQUM7Z0JBQ2hGLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztZQUMzQixDQUFDO1lBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVuQixJQUFJLENBQUM7Z0JBQ0osTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUM7WUFDakYsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkIsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBR0QsS0FBSyxDQUFDLFVBQVU7WUFDZixJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxTQUFTLENBQUM7WUFDakMsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdkIsK0VBQStFO2dCQUMvRSxNQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDO2dCQUNuRCxJQUFJLENBQUMsT0FBTyxDQUFDLG1DQUFvQixDQUFDLENBQUM7Z0JBRW5DLElBQUksQ0FBQztvQkFDSixJQUFJLHFCQUFxQixFQUFFLENBQUM7d0JBQzNCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO29CQUN6RSxDQUFDO2dCQUNGLENBQUM7Z0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDWixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkIsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUM7Z0JBQ0osTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNuRCxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixDQUFDO1lBRUQsSUFBSSxDQUFDLGVBQWUsQ0FBQywyQkFBWSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVPLEtBQUssQ0FBQyxtQkFBbUI7WUFDaEMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBb0UseUJBQXlCLEVBQUU7Z0JBQzlILE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU07Z0JBQzFCLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVM7YUFDbEQsQ0FBQyxDQUFDO1lBRUgsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxjQUFjLEdBQUcsU0FBUyxDQUFDO1lBQ2pDLENBQUM7WUFFRCxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7WUFDaEIsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUM7WUFDL0IsTUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFTLEVBQUUsS0FBYyxFQUFFLEVBQUU7Z0JBQzlDLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ1gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLElBQUksQ0FBQyxDQUFDO2dCQUNiLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO29CQUN0RSxJQUFJLENBQUMsZUFBZSxDQUFDLDJCQUFZLENBQUMsVUFBVSxDQUFDLElBQUEsY0FBUSxFQUFDLDhCQUE4QixFQUFFLDJCQUEyQixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0SCxDQUFDO1lBQ0YsQ0FBQyxDQUFDO1lBRUYsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2hGLElBQUksQ0FBQyxjQUFjLEdBQUcsYUFBYSxDQUFDO1lBQ3BDLElBQUksQ0FBQztnQkFDSixNQUFNLGFBQWEsQ0FBQztnQkFDcEIsSUFBSSxJQUFJLENBQUMsY0FBYyxLQUFLLGFBQWEsRUFBRSxDQUFDO29CQUMzQyxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsbUVBQW1FO2dCQUNuRSxnQ0FBZ0M7Z0JBQ2hDLElBQUksTUFHSCxDQUFDO2dCQUVGLElBQUksQ0FBQztvQkFDSixNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDO2dCQUM5RSxDQUFDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ1osSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsa0NBQWtDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN0RixJQUFJLENBQUMsZUFBZSxDQUFDLDJCQUFZLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztvQkFDbEQsT0FBTztnQkFDUixDQUFDO2dCQUVELGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsb0NBQW9DLENBQUMsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLENBQUM7Z0JBRXBHLHlFQUF5RTtnQkFDekUsNkVBQTZFO2dCQUM3RSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQzFDLElBQUksQ0FBQyxlQUFlLENBQUMsMkJBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO29CQUNsRCxPQUFPO2dCQUNSLENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLGVBQWUsQ0FBQywyQkFBWSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7Z0JBQ2xELE9BQU87WUFDUixDQUFDO29CQUFTLENBQUM7Z0JBQ1YsSUFBSSxJQUFJLENBQUMsY0FBYyxLQUFLLGFBQWEsRUFBRSxDQUFDO29CQUMzQyxJQUFJLENBQUMsY0FBYyxHQUFHLFNBQVMsQ0FBQztnQkFDakMsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUNuRSxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzlCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxlQUFlLENBQUMsMkJBQVksQ0FBQyxVQUFVLENBQUMsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsaUNBQWlDLEVBQUUsT0FBTyxFQUFFLENBQUMsK0RBQStELENBQUMsRUFBRSxFQUFFLHlCQUF5QixFQUFFLE9BQU8sQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDclAsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFTLEVBQUUsS0FBYyxFQUFFLEVBQUU7b0JBQ25ELENBQUMsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3ZDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3BCLENBQUMsQ0FBQztnQkFDRixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxFQUFFLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsT0FBTyxDQUFDLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLElBQUEsc0JBQWdCLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ3pNLElBQUksQ0FBQyxjQUFjLEdBQUcsWUFBWSxDQUFDO2dCQUNuQyxJQUFJLENBQUM7b0JBQ0osTUFBTSxZQUFZLENBQUM7b0JBQ25CLElBQUksSUFBSSxDQUFDLGNBQWMsS0FBSyxZQUFZLEVBQUUsQ0FBQzt3QkFDMUMsT0FBTztvQkFDUixDQUFDO2dCQUNGLENBQUM7Z0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDWixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxTQUFTLENBQUM7b0JBQ2hDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzVDLElBQUksQ0FBQyxlQUFlLENBQUMsMkJBQVksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztvQkFDekQsT0FBTztnQkFDUixDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN2QyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxlQUFlLENBQUMsMkJBQVksQ0FBQyxVQUFVLENBQUMsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsd0NBQXdDLEVBQUUsT0FBTyxFQUFFLENBQUMsc0JBQXNCLENBQUMsRUFBRSxFQUFFLG9CQUFvQixFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvSyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGVBQWUsQ0FBQywyQkFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFBLGNBQVEsRUFBQyxnQ0FBZ0MsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3RyxDQUFDO1lBQ0QsTUFBTSxJQUFJLEdBQUcsQ0FBQywrQkFBK0IsRUFBRSxPQUFPLEVBQUUsSUFBQSxzQkFBZ0IsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQy9CLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQzVCLENBQUM7WUFFRCxJQUFJLG9CQUFvQixHQUFHLEtBQUssQ0FBQztZQUNqQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDdEUsdUVBQXVFO2dCQUN2RSxpRUFBaUU7Z0JBQ2pFLDJEQUEyRDtnQkFDM0QsNkNBQTZDO2dCQUM3QyxvQkFBb0IsR0FBRyxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLENBQUM7WUFDeEUsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUN2RSxDQUFDO1FBRU8sS0FBSyxDQUFDLG9CQUFvQixDQUFDLElBQXVCO1lBQ3pELElBQUksTUFBYyxDQUFDO1lBQ25CLElBQUksQ0FBQztnQkFDSixNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM3RixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEIsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNaLENBQUM7WUFFRCxJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDbEIsTUFBTSxHQUFHLEdBQUcsSUFBQSxjQUFRLEVBQUMsMENBQTBDLEVBQUUsK0RBQStELENBQUMsQ0FBQztnQkFDbEksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyxlQUFlLENBQUMsMkJBQVksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDbkQsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRU8sS0FBSyxDQUFDLG9CQUFvQixDQUFDLE9BQXlDLEVBQUUsSUFBYyxFQUFFLG9CQUE2QjtZQUMxSCxJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUV0RCxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3pCLENBQUM7WUFFRCxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDdkIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxPQUFlLEVBQUUsS0FBYyxFQUFFLEVBQUU7Z0JBQ2xHLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ1gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzdCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDNUIsQ0FBQztnQkFFRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMseUNBQXlDLENBQUMsRUFBRSxDQUFDO29CQUNqRSxVQUFVLEdBQUcsSUFBSSxDQUFDO2dCQUNuQixDQUFDO2dCQUVELE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsK0VBQStFLENBQUMsQ0FBQztnQkFDekcsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDUCxNQUFNLElBQUksR0FBbUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUUsQ0FBQztvQkFDeEYsSUFBSSxDQUFDLGVBQWUsQ0FBQywyQkFBWSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO2dCQUMxRSxDQUFDO3FCQUFNLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLENBQUM7b0JBQ3BELFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDdEIsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDNUMsSUFBSSxDQUFDLGVBQWUsQ0FBQywyQkFBWSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUMxRCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsY0FBYyxHQUFHLFlBQVksQ0FBQztZQUNuQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtnQkFDekIsSUFBSSxZQUFZLEtBQUssSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUMxQyw4QkFBOEI7b0JBQzlCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7b0JBQy9DLElBQUksQ0FBQyxjQUFjLEdBQUcsU0FBUyxDQUFDO29CQUNoQyxJQUFJLENBQUMsS0FBSyxHQUFHLG1DQUFvQixDQUFDO29CQUVsQyxJQUFJLENBQUMsZUFBZSxDQUFDLDJCQUFZLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztnQkFDbkQsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLG9CQUFvQixDQUFDLFFBQWdCLEVBQUUsV0FBcUIsRUFBRSxXQUF3RCxJQUFJLENBQUMsZUFBZTtZQUNqSixPQUFPLElBQUEsK0JBQXVCLEVBQVMsS0FBSyxDQUFDLEVBQUU7Z0JBQzlDLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7b0JBQ3RDLElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUM7d0JBQ25DLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNiLENBQUM7b0JBQ0QsSUFBSSxhQUF1QyxDQUFDO29CQUM1QyxNQUFNLEtBQUssR0FBaUIsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUV2RCxLQUFLLENBQUMsdUJBQXVCLENBQUMsR0FBRyxFQUFFO3dCQUNsQyxJQUFJLGFBQWEsRUFBRSxDQUFDOzRCQUNuQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsZ0JBQWdCLGFBQWEsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDOzRCQUNuRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ3RCLENBQUM7b0JBQ0YsQ0FBQyxDQUFDLENBQUM7b0JBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDdEMsUUFBUSxDQUFDLDRDQUE0QyxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUM5RCxRQUFRLENBQUMsR0FBRyxRQUFRLGtDQUFrQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQ3hGLGFBQWEsR0FBRyxJQUFBLHFCQUFLLEVBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsR0FBRyxXQUFXLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFBLFdBQUksRUFBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7b0JBQ3ZJLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxRQUFRLENBQUMsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQ3hDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO3dCQUN0RCxRQUFRLENBQUMsR0FBRyxRQUFRLGNBQWMsYUFBYSxXQUFXLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQzt3QkFDNUYsYUFBYSxHQUFHLElBQUEscUJBQUssRUFBQyxhQUFhLEVBQUUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxXQUFXLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFBLFlBQU8sR0FBRSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7b0JBQzdGLENBQUM7b0JBRUQsYUFBYSxDQUFDLE1BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSw0QkFBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRTt3QkFDdEUsSUFBSSxhQUFhLEVBQUUsQ0FBQzs0QkFDbkIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOzRCQUNoQyxRQUFRLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUMxQixDQUFDO29CQUNGLENBQUMsQ0FBQyxDQUFDO29CQUNILGFBQWEsQ0FBQyxNQUFPLENBQUMsSUFBSSxDQUFDLElBQUksNEJBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUU7d0JBQ3RFLElBQUksYUFBYSxFQUFFLENBQUM7NEJBQ25CLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs0QkFDaEMsUUFBUSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQzt3QkFDekIsQ0FBQztvQkFDRixDQUFDLENBQUMsQ0FBQztvQkFDSCxhQUFhLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRTt3QkFDNUIsSUFBSSxhQUFhLEVBQUUsQ0FBQzs0QkFDbkIsUUFBUSxDQUFDLEdBQUcsUUFBUSxTQUFTLGFBQWEsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7NEJBQ25FLGFBQWEsR0FBRyxTQUFTLENBQUM7NEJBQzFCLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQ2pCLENBQUM7b0JBQ0YsQ0FBQyxDQUFDLENBQUM7b0JBQ0gsYUFBYSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUU7d0JBQzdCLElBQUksYUFBYSxFQUFFLENBQUM7NEJBQ25CLFFBQVEsQ0FBQyxHQUFHLFFBQVEsVUFBVSxhQUFhLENBQUMsR0FBRyxRQUFRLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDOzRCQUNuRSxhQUFhLEdBQUcsU0FBUyxDQUFDOzRCQUMxQixNQUFNLEVBQUUsQ0FBQzt3QkFDVixDQUFDO29CQUNGLENBQUMsQ0FBQyxDQUFDO2dCQUNKLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU0sS0FBSyxDQUFDLGFBQWE7WUFDekIsT0FBTyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDOUIsQ0FBQztRQUVPLGFBQWE7WUFDcEIsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBVSw4Q0FBK0IsQ0FBQyxDQUFDO1FBQ3ZGLENBQUM7UUFFTyxjQUFjO1lBQ3JCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQVMsMENBQTJCLENBQUMsSUFBSSxJQUFBLGFBQVEsR0FBRSxDQUFDO1lBQ2pHLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDeEUsT0FBTyxJQUFJLElBQUksU0FBUyxDQUFDO1FBQzFCLENBQUM7UUFFTyxZQUFZO1lBQ25CLElBQUksQ0FBQztnQkFDSixNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLHFCQUFxQixvQ0FBMkIsQ0FBQztnQkFDckcsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsd0JBQXdCLHFDQUE0QixLQUFLLENBQUMsQ0FBQztnQkFDNUcsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO29CQUN6QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUF5QixDQUFDO29CQUN4RSxJQUFJLE9BQU8sSUFBSSxJQUFBLGdCQUFRLEVBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLElBQUEsZ0JBQVEsRUFBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksSUFBQSxnQkFBUSxFQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO3dCQUM5RyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLENBQUM7b0JBQzdDLENBQUM7b0JBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMseURBQXlELEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3hGLENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyx5Q0FBeUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRSxDQUFDO1lBQ0QsT0FBTyxtQ0FBb0IsQ0FBQztRQUM3QixDQUFDO1FBRU8sVUFBVSxDQUFDLElBQWdCO1lBQ2xDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNqQixNQUFNLG1CQUFtQixHQUFHO29CQUMzQixVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVk7aUJBQy9HLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxtRUFBa0QsQ0FBQztnQkFDdkksSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLFNBQVMsbUVBQWtELENBQUM7WUFDdEgsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLHFCQUFxQixvQ0FBMkIsQ0FBQztnQkFDNUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsd0JBQXdCLG9DQUEyQixDQUFDO1lBQ2hGLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQXhjWSxrREFBbUI7a0NBQW5CLG1CQUFtQjtRQWtDN0IsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLGdDQUFlLENBQUE7UUFDZixXQUFBLHVDQUF5QixDQUFBO1FBQ3pCLFdBQUEsb0JBQWMsQ0FBQTtRQUNkLFdBQUEsOERBQThCLENBQUE7UUFDOUIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHlCQUFlLENBQUE7T0F4Q0wsbUJBQW1CLENBd2MvQjtJQUVELFNBQVMsYUFBYSxDQUFDLEVBQW9DLEVBQUUsRUFBb0M7UUFDaEcsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUM7WUFDZCxPQUFPLEVBQUUsQ0FBQyxTQUFTLEtBQUssRUFBRSxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsVUFBVSxLQUFLLEVBQUUsQ0FBQyxVQUFVLElBQUksRUFBRSxDQUFDLEtBQUssS0FBSyxFQUFFLENBQUMsS0FBSyxDQUFDO1FBQ2xHLENBQUM7UUFDRCxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUM7SUFDbEIsQ0FBQztJQUVELE1BQU0sVUFBVSxHQUFHLENBQUMsQ0FBYSxFQUFFLENBQWEsRUFBRSxFQUFFO1FBQ25ELElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDM0IsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO2FBQU0sSUFBSSxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNqQyxPQUFPLENBQUMsQ0FBQyxTQUFTLEtBQUssQ0FBQyxDQUFDLFNBQVMsSUFBSSxhQUFhLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0UsQ0FBQzthQUFNLENBQUM7WUFDUCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7SUFDRixDQUFDLENBQUMifQ==