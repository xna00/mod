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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/processes", "vs/base/common/stopwatch", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/parts/ipc/common/ipc.net", "vs/base/parts/ipc/electron-sandbox/ipc.mp", "vs/nls", "vs/platform/debug/common/extensionHostDebug", "vs/platform/extensions/common/extensionHostStarter", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/native/common/native", "vs/platform/notification/common/notification", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/environment/electron-sandbox/shellEnvironmentService", "vs/workbench/services/extensions/common/extensionHostEnv", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/workbench/services/host/browser/host", "vs/workbench/services/lifecycle/common/lifecycle", "../common/extensionDevOptions"], function (require, exports, async_1, buffer_1, errors_1, event_1, lifecycle_1, objects, platform, processes_1, stopwatch_1, uri_1, uuid_1, ipc_net_1, ipc_mp_1, nls, extensionHostDebug_1, extensionHostStarter_1, label_1, log_1, native_1, notification_1, productService_1, telemetry_1, telemetryUtils_1, userDataProfile_1, workspace_1, environmentService_1, shellEnvironmentService_1, extensionHostEnv_1, extensionHostProtocol_1, host_1, lifecycle_2, extensionDevOptions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeLocalProcessExtensionHost = exports.ExtensionHostProcess = void 0;
    class ExtensionHostProcess {
        get onStdout() {
            return this._extensionHostStarter.onDynamicStdout(this._id);
        }
        get onStderr() {
            return this._extensionHostStarter.onDynamicStderr(this._id);
        }
        get onMessage() {
            return this._extensionHostStarter.onDynamicMessage(this._id);
        }
        get onExit() {
            return this._extensionHostStarter.onDynamicExit(this._id);
        }
        constructor(id, _extensionHostStarter) {
            this._extensionHostStarter = _extensionHostStarter;
            this._id = id;
        }
        start(opts) {
            return this._extensionHostStarter.start(this._id, opts);
        }
        enableInspectPort() {
            return this._extensionHostStarter.enableInspectPort(this._id);
        }
        kill() {
            return this._extensionHostStarter.kill(this._id);
        }
    }
    exports.ExtensionHostProcess = ExtensionHostProcess;
    let NativeLocalProcessExtensionHost = class NativeLocalProcessExtensionHost {
        constructor(runningLocation, startup, _initDataProvider, _contextService, _notificationService, _nativeHostService, _lifecycleService, _environmentService, _userDataProfilesService, _telemetryService, _logService, _loggerService, _labelService, _extensionHostDebugService, _hostService, _productService, _shellEnvironmentService, _extensionHostStarter) {
            this.runningLocation = runningLocation;
            this.startup = startup;
            this._initDataProvider = _initDataProvider;
            this._contextService = _contextService;
            this._notificationService = _notificationService;
            this._nativeHostService = _nativeHostService;
            this._lifecycleService = _lifecycleService;
            this._environmentService = _environmentService;
            this._userDataProfilesService = _userDataProfilesService;
            this._telemetryService = _telemetryService;
            this._logService = _logService;
            this._loggerService = _loggerService;
            this._labelService = _labelService;
            this._extensionHostDebugService = _extensionHostDebugService;
            this._hostService = _hostService;
            this._productService = _productService;
            this._shellEnvironmentService = _shellEnvironmentService;
            this._extensionHostStarter = _extensionHostStarter;
            this.pid = null;
            this.remoteAuthority = null;
            this.extensions = null;
            this._onExit = new event_1.Emitter();
            this.onExit = this._onExit.event;
            this._onDidSetInspectPort = new event_1.Emitter();
            this._toDispose = new lifecycle_1.DisposableStore();
            const devOpts = (0, extensionDevOptions_1.parseExtensionDevOptions)(this._environmentService);
            this._isExtensionDevHost = devOpts.isExtensionDevHost;
            this._isExtensionDevDebug = devOpts.isExtensionDevDebug;
            this._isExtensionDevDebugBrk = devOpts.isExtensionDevDebugBrk;
            this._isExtensionDevTestFromCli = devOpts.isExtensionDevTestFromCli;
            this._terminating = false;
            this._inspectPort = null;
            this._extensionHostProcess = null;
            this._messageProtocol = null;
            this._toDispose.add(this._onExit);
            this._toDispose.add(this._lifecycleService.onWillShutdown(e => this._onWillShutdown(e)));
            this._toDispose.add(this._extensionHostDebugService.onClose(event => {
                if (this._isExtensionDevHost && this._environmentService.debugExtensionHost.debugId === event.sessionId) {
                    this._nativeHostService.closeWindow();
                }
            }));
            this._toDispose.add(this._extensionHostDebugService.onReload(event => {
                if (this._isExtensionDevHost && this._environmentService.debugExtensionHost.debugId === event.sessionId) {
                    this._hostService.reload();
                }
            }));
        }
        dispose() {
            if (this._terminating) {
                return;
            }
            this._terminating = true;
            this._toDispose.dispose();
        }
        start() {
            if (this._terminating) {
                // .terminate() was called
                throw new errors_1.CancellationError();
            }
            if (!this._messageProtocol) {
                this._messageProtocol = this._start();
            }
            return this._messageProtocol;
        }
        async _start() {
            const [extensionHostCreationResult, portNumber, processEnv] = await Promise.all([
                this._extensionHostStarter.createExtensionHost(),
                this._tryFindDebugPort(),
                this._shellEnvironmentService.getShellEnv(),
            ]);
            this._extensionHostProcess = new ExtensionHostProcess(extensionHostCreationResult.id, this._extensionHostStarter);
            const env = objects.mixin(processEnv, {
                VSCODE_AMD_ENTRYPOINT: 'vs/workbench/api/node/extensionHostProcess',
                VSCODE_HANDLES_UNCAUGHT_ERRORS: true
            });
            if (this._environmentService.debugExtensionHost.env) {
                objects.mixin(env, this._environmentService.debugExtensionHost.env);
            }
            (0, processes_1.removeDangerousEnvVariables)(env);
            if (this._isExtensionDevHost) {
                // Unset `VSCODE_CODE_CACHE_PATH` when developing extensions because it might
                // be that dependencies, that otherwise would be cached, get modified.
                delete env['VSCODE_CODE_CACHE_PATH'];
            }
            const opts = {
                responseWindowId: this._nativeHostService.windowId,
                responseChannel: 'vscode:startExtensionHostMessagePortResult',
                responseNonce: (0, uuid_1.generateUuid)(),
                env,
                // We only detach the extension host on windows. Linux and Mac orphan by default
                // and detach under Linux and Mac create another process group.
                // We detach because we have noticed that when the renderer exits, its child processes
                // (i.e. extension host) are taken down in a brutal fashion by the OS
                detached: !!platform.isWindows,
                execArgv: undefined,
                silent: true
            };
            if (portNumber !== 0) {
                opts.execArgv = [
                    '--nolazy',
                    (this._isExtensionDevDebugBrk ? '--inspect-brk=' : '--inspect=') + portNumber
                ];
            }
            else {
                opts.execArgv = ['--inspect-port=0'];
            }
            if (this._environmentService.extensionTestsLocationURI) {
                opts.execArgv.unshift('--expose-gc');
            }
            if (this._environmentService.args['prof-v8-extensions']) {
                opts.execArgv.unshift('--prof');
            }
            // Refs https://github.com/microsoft/vscode/issues/189805
            opts.execArgv.unshift('--dns-result-order=ipv4first');
            const onStdout = this._handleProcessOutputStream(this._extensionHostProcess.onStdout);
            const onStderr = this._handleProcessOutputStream(this._extensionHostProcess.onStderr);
            const onOutput = event_1.Event.any(event_1.Event.map(onStdout.event, o => ({ data: `%c${o}`, format: [''] })), event_1.Event.map(onStderr.event, o => ({ data: `%c${o}`, format: ['color: red'] })));
            // Debounce all output, so we can render it in the Chrome console as a group
            const onDebouncedOutput = event_1.Event.debounce(onOutput, (r, o) => {
                return r
                    ? { data: r.data + o.data, format: [...r.format, ...o.format] }
                    : { data: o.data, format: o.format };
            }, 100);
            // Print out extension host output
            onDebouncedOutput(output => {
                const inspectorUrlMatch = output.data && output.data.match(/ws:\/\/([^\s]+:(\d+)\/[^\s]+)/);
                if (inspectorUrlMatch) {
                    if (!this._environmentService.isBuilt && !this._isExtensionDevTestFromCli) {
                        console.log(`%c[Extension Host] %cdebugger inspector at devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=${inspectorUrlMatch[1]}`, 'color: blue', 'color:');
                    }
                    if (!this._inspectPort) {
                        this._inspectPort = Number(inspectorUrlMatch[2]);
                        this._onDidSetInspectPort.fire();
                    }
                }
                else {
                    if (!this._isExtensionDevTestFromCli) {
                        console.group('Extension Host');
                        console.log(output.data, ...output.format);
                        console.groupEnd();
                    }
                }
            });
            // Lifecycle
            this._extensionHostProcess.onExit(({ code, signal }) => this._onExtHostProcessExit(code, signal));
            // Notify debugger that we are ready to attach to the process if we run a development extension
            if (portNumber) {
                if (this._isExtensionDevHost && portNumber && this._isExtensionDevDebug && this._environmentService.debugExtensionHost.debugId) {
                    this._extensionHostDebugService.attachSession(this._environmentService.debugExtensionHost.debugId, portNumber);
                }
                this._inspectPort = portNumber;
                this._onDidSetInspectPort.fire();
            }
            // Help in case we fail to start it
            let startupTimeoutHandle;
            if (!this._environmentService.isBuilt && !this._environmentService.remoteAuthority || this._isExtensionDevHost) {
                startupTimeoutHandle = setTimeout(() => {
                    this._logService.error(`[LocalProcessExtensionHost]: Extension host did not start in 10 seconds (debugBrk: ${this._isExtensionDevDebugBrk})`);
                    const msg = this._isExtensionDevDebugBrk
                        ? nls.localize('extensionHost.startupFailDebug', "Extension host did not start in 10 seconds, it might be stopped on the first line and needs a debugger to continue.")
                        : nls.localize('extensionHost.startupFail', "Extension host did not start in 10 seconds, that might be a problem.");
                    this._notificationService.prompt(notification_1.Severity.Warning, msg, [{
                            label: nls.localize('reloadWindow', "Reload Window"),
                            run: () => this._hostService.reload()
                        }], {
                        sticky: true,
                        priority: notification_1.NotificationPriority.URGENT
                    });
                }, 10000);
            }
            // Initialize extension host process with hand shakes
            const protocol = await this._establishProtocol(this._extensionHostProcess, opts);
            await this._performHandshake(protocol);
            clearTimeout(startupTimeoutHandle);
            return protocol;
        }
        /**
         * Find a free port if extension host debugging is enabled.
         */
        async _tryFindDebugPort() {
            if (typeof this._environmentService.debugExtensionHost.port !== 'number') {
                return 0;
            }
            const expected = this._environmentService.debugExtensionHost.port;
            const port = await this._nativeHostService.findFreePort(expected, 10 /* try 10 ports */, 5000 /* try up to 5 seconds */, 2048 /* skip 2048 ports between attempts */);
            if (!this._isExtensionDevTestFromCli) {
                if (!port) {
                    console.warn('%c[Extension Host] %cCould not find a free port for debugging', 'color: blue', 'color:');
                }
                else {
                    if (port !== expected) {
                        console.warn(`%c[Extension Host] %cProvided debugging port ${expected} is not free, using ${port} instead.`, 'color: blue', 'color:');
                    }
                    if (this._isExtensionDevDebugBrk) {
                        console.warn(`%c[Extension Host] %cSTOPPED on first line for debugging on port ${port}`, 'color: blue', 'color:');
                    }
                    else {
                        console.info(`%c[Extension Host] %cdebugger listening on port ${port}`, 'color: blue', 'color:');
                    }
                }
            }
            return port || 0;
        }
        _establishProtocol(extensionHostProcess, opts) {
            (0, extensionHostEnv_1.writeExtHostConnection)(new extensionHostEnv_1.MessagePortExtHostConnection(), opts.env);
            // Get ready to acquire the message port from the shared process worker
            const portPromise = (0, ipc_mp_1.acquirePort)(undefined /* we trigger the request via service call! */, opts.responseChannel, opts.responseNonce);
            return new Promise((resolve, reject) => {
                const handle = setTimeout(() => {
                    reject('The local extension host took longer than 60s to connect.');
                }, 60 * 1000);
                portPromise.then((port) => {
                    this._toDispose.add((0, lifecycle_1.toDisposable)(() => {
                        // Close the message port when the extension host is disposed
                        port.close();
                    }));
                    clearTimeout(handle);
                    const onMessage = new ipc_net_1.BufferedEmitter();
                    port.onmessage = ((e) => {
                        if (e.data) {
                            onMessage.fire(buffer_1.VSBuffer.wrap(e.data));
                        }
                    });
                    port.start();
                    resolve({
                        onMessage: onMessage.event,
                        send: message => port.postMessage(message.buffer),
                    });
                });
                // Now that the message port listener is installed, start the ext host process
                const sw = stopwatch_1.StopWatch.create(false);
                extensionHostProcess.start(opts).then(({ pid }) => {
                    if (pid) {
                        this.pid = pid;
                    }
                    this._logService.info(`Started local extension host with pid ${pid}.`);
                    const duration = sw.elapsed();
                    if (platform.isCI) {
                        this._logService.info(`IExtensionHostStarter.start() took ${duration} ms.`);
                    }
                }, (err) => {
                    // Starting the ext host process resulted in an error
                    reject(err);
                });
            });
        }
        _performHandshake(protocol) {
            // 1) wait for the incoming `ready` event and send the initialization data.
            // 2) wait for the incoming `initialized` event.
            return new Promise((resolve, reject) => {
                let timeoutHandle;
                const installTimeoutCheck = () => {
                    timeoutHandle = setTimeout(() => {
                        reject('The local extension host took longer than 60s to send its ready message.');
                    }, 60 * 1000);
                };
                const uninstallTimeoutCheck = () => {
                    clearTimeout(timeoutHandle);
                };
                // Wait 60s for the ready message
                installTimeoutCheck();
                const disposable = protocol.onMessage(msg => {
                    if ((0, extensionHostProtocol_1.isMessageOfType)(msg, 1 /* MessageType.Ready */)) {
                        // 1) Extension Host is ready to receive messages, initialize it
                        uninstallTimeoutCheck();
                        this._createExtHostInitData().then(data => {
                            // Wait 60s for the initialized message
                            installTimeoutCheck();
                            protocol.send(buffer_1.VSBuffer.fromString(JSON.stringify(data)));
                        });
                        return;
                    }
                    if ((0, extensionHostProtocol_1.isMessageOfType)(msg, 0 /* MessageType.Initialized */)) {
                        // 2) Extension Host is initialized
                        uninstallTimeoutCheck();
                        // stop listening for messages here
                        disposable.dispose();
                        // release this promise
                        resolve();
                        return;
                    }
                    console.error(`received unexpected message during handshake phase from the extension host: `, msg);
                });
            });
        }
        async _createExtHostInitData() {
            const initData = await this._initDataProvider.getInitData();
            this.extensions = initData.extensions;
            const workspace = this._contextService.getWorkspace();
            return {
                commit: this._productService.commit,
                version: this._productService.version,
                quality: this._productService.quality,
                parentPid: 0,
                environment: {
                    isExtensionDevelopmentDebug: this._isExtensionDevDebug,
                    appRoot: this._environmentService.appRoot ? uri_1.URI.file(this._environmentService.appRoot) : undefined,
                    appName: this._productService.nameLong,
                    appHost: this._productService.embedderIdentifier || 'desktop',
                    appUriScheme: this._productService.urlProtocol,
                    extensionTelemetryLogResource: this._environmentService.extHostTelemetryLogFile,
                    isExtensionTelemetryLoggingOnly: (0, telemetryUtils_1.isLoggingOnly)(this._productService, this._environmentService),
                    appLanguage: platform.language,
                    extensionDevelopmentLocationURI: this._environmentService.extensionDevelopmentLocationURI,
                    extensionTestsLocationURI: this._environmentService.extensionTestsLocationURI,
                    globalStorageHome: this._userDataProfilesService.defaultProfile.globalStorageHome,
                    workspaceStorageHome: this._environmentService.workspaceStorageHome,
                    extensionLogLevel: this._environmentService.extensionLogLevel
                },
                workspace: this._contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ ? undefined : {
                    configuration: workspace.configuration ?? undefined,
                    id: workspace.id,
                    name: this._labelService.getWorkspaceLabel(workspace),
                    isUntitled: workspace.configuration ? (0, workspace_1.isUntitledWorkspace)(workspace.configuration, this._environmentService) : false,
                    transient: workspace.transient
                },
                remote: {
                    authority: this._environmentService.remoteAuthority,
                    connectionData: null,
                    isRemote: false
                },
                consoleForward: {
                    includeStack: !this._isExtensionDevTestFromCli && (this._isExtensionDevHost || !this._environmentService.isBuilt || this._productService.quality !== 'stable' || this._environmentService.verbose),
                    logNative: !this._isExtensionDevTestFromCli && this._isExtensionDevHost
                },
                extensions: this.extensions.toSnapshot(),
                telemetryInfo: {
                    sessionId: this._telemetryService.sessionId,
                    machineId: this._telemetryService.machineId,
                    sqmId: this._telemetryService.sqmId,
                    firstSessionDate: this._telemetryService.firstSessionDate,
                    msftInternal: this._telemetryService.msftInternal
                },
                logLevel: this._logService.getLevel(),
                loggers: [...this._loggerService.getRegisteredLoggers()],
                logsLocation: this._environmentService.extHostLogsPath,
                autoStart: (this.startup === 1 /* ExtensionHostStartup.EagerAutoStart */),
                uiKind: extensionHostProtocol_1.UIKind.Desktop
            };
        }
        _onExtHostProcessExit(code, signal) {
            if (this._terminating) {
                // Expected termination path (we asked the process to terminate)
                return;
            }
            this._onExit.fire([code, signal]);
        }
        _handleProcessOutputStream(stream) {
            let last = '';
            let isOmitting = false;
            const event = new event_1.Emitter();
            stream((chunk) => {
                // not a fancy approach, but this is the same approach used by the split2
                // module which is well-optimized (https://github.com/mcollina/split2)
                last += chunk;
                const lines = last.split(/\r?\n/g);
                last = lines.pop();
                // protected against an extension spamming and leaking memory if no new line is written.
                if (last.length > 10_000) {
                    lines.push(last);
                    last = '';
                }
                for (const line of lines) {
                    if (isOmitting) {
                        if (line === "END_NATIVE_LOG" /* NativeLogMarkers.End */) {
                            isOmitting = false;
                        }
                    }
                    else if (line === "START_NATIVE_LOG" /* NativeLogMarkers.Start */) {
                        isOmitting = true;
                    }
                    else if (line.length) {
                        event.fire(line + '\n');
                    }
                }
            });
            return event;
        }
        async enableInspectPort() {
            if (typeof this._inspectPort === 'number') {
                return true;
            }
            if (!this._extensionHostProcess) {
                return false;
            }
            const result = await this._extensionHostProcess.enableInspectPort();
            if (!result) {
                return false;
            }
            await Promise.race([event_1.Event.toPromise(this._onDidSetInspectPort.event), (0, async_1.timeout)(1000)]);
            return typeof this._inspectPort === 'number';
        }
        getInspectPort() {
            return this._inspectPort ?? undefined;
        }
        _onWillShutdown(event) {
            // If the extension development host was started without debugger attached we need
            // to communicate this back to the main side to terminate the debug session
            if (this._isExtensionDevHost && !this._isExtensionDevTestFromCli && !this._isExtensionDevDebug && this._environmentService.debugExtensionHost.debugId) {
                this._extensionHostDebugService.terminateSession(this._environmentService.debugExtensionHost.debugId);
                event.join((0, async_1.timeout)(100 /* wait a bit for IPC to get delivered */), { id: 'join.extensionDevelopment', label: nls.localize('join.extensionDevelopment', "Terminating extension debug session") });
            }
        }
    };
    exports.NativeLocalProcessExtensionHost = NativeLocalProcessExtensionHost;
    exports.NativeLocalProcessExtensionHost = NativeLocalProcessExtensionHost = __decorate([
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, notification_1.INotificationService),
        __param(5, native_1.INativeHostService),
        __param(6, lifecycle_2.ILifecycleService),
        __param(7, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(8, userDataProfile_1.IUserDataProfilesService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, log_1.ILogService),
        __param(11, log_1.ILoggerService),
        __param(12, label_1.ILabelService),
        __param(13, extensionHostDebug_1.IExtensionHostDebugService),
        __param(14, host_1.IHostService),
        __param(15, productService_1.IProductService),
        __param(16, shellEnvironmentService_1.IShellEnvironmentService),
        __param(17, extensionHostStarter_1.IExtensionHostStarter)
    ], NativeLocalProcessExtensionHost);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxQcm9jZXNzRXh0ZW5zaW9uSG9zdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvZWxlY3Ryb24tc2FuZGJveC9sb2NhbFByb2Nlc3NFeHRlbnNpb25Ib3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQThDaEcsTUFBYSxvQkFBb0I7UUFJaEMsSUFBVyxRQUFRO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUVELElBQVcsUUFBUTtZQUNsQixPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFRCxJQUFXLFNBQVM7WUFDbkIsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFRCxJQUFXLE1BQU07WUFDaEIsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRUQsWUFDQyxFQUFVLEVBQ08scUJBQTRDO1lBQTVDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFFN0QsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDZixDQUFDO1FBRU0sS0FBSyxDQUFDLElBQWtDO1lBQzlDLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFFTSxpQkFBaUI7WUFDdkIsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFTSxJQUFJO1lBQ1YsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsRCxDQUFDO0tBQ0Q7SUF0Q0Qsb0RBc0NDO0lBRU0sSUFBTSwrQkFBK0IsR0FBckMsTUFBTSwrQkFBK0I7UUEwQjNDLFlBQ2lCLGVBQTRDLEVBQzVDLE9BQW9GLEVBQ25GLGlCQUF5RCxFQUNoRCxlQUEwRCxFQUM5RCxvQkFBMkQsRUFDN0Qsa0JBQXVELEVBQ3hELGlCQUFxRCxFQUNwQyxtQkFBd0UsRUFDbEYsd0JBQW1FLEVBQzFFLGlCQUFxRCxFQUMzRCxXQUF5QyxFQUN0QyxjQUErQyxFQUNoRCxhQUE2QyxFQUNoQywwQkFBdUUsRUFDckYsWUFBMkMsRUFDeEMsZUFBaUQsRUFDeEMsd0JBQW1FLEVBQ3RFLHFCQUE2RDtZQWpCcEUsb0JBQWUsR0FBZixlQUFlLENBQTZCO1lBQzVDLFlBQU8sR0FBUCxPQUFPLENBQTZFO1lBQ25GLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBd0M7WUFDL0Isb0JBQWUsR0FBZixlQUFlLENBQTBCO1lBQzdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7WUFDNUMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUN2QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ25CLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBb0M7WUFDakUsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUN6RCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQzFDLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ3JCLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUMvQixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUNmLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNEI7WUFDcEUsaUJBQVksR0FBWixZQUFZLENBQWM7WUFDdkIsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQ3ZCLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDckQsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQTFDOUUsUUFBRyxHQUFrQixJQUFJLENBQUM7WUFDakIsb0JBQWUsR0FBRyxJQUFJLENBQUM7WUFDaEMsZUFBVSxHQUFtQyxJQUFJLENBQUM7WUFFeEMsWUFBTyxHQUE4QixJQUFJLGVBQU8sRUFBb0IsQ0FBQztZQUN0RSxXQUFNLEdBQTRCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBRXBELHlCQUFvQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFFM0MsZUFBVSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBbUNuRCxNQUFNLE9BQU8sR0FBRyxJQUFBLDhDQUF3QixFQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ25FLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUM7WUFDdEQsSUFBSSxDQUFDLG9CQUFvQixHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQztZQUN4RCxJQUFJLENBQUMsdUJBQXVCLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDO1lBQzlELElBQUksQ0FBQywwQkFBMEIsR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUM7WUFFcEUsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7WUFFMUIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7WUFDekIsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQztZQUNsQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1lBRTdCLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDbkUsSUFBSSxJQUFJLENBQUMsbUJBQW1CLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLGtCQUFrQixDQUFDLE9BQU8sS0FBSyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ3pHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDdkMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNwRSxJQUFJLElBQUksQ0FBQyxtQkFBbUIsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsa0JBQWtCLENBQUMsT0FBTyxLQUFLLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDekcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDNUIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU0sT0FBTztZQUNiLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN2QixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1lBRXpCLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUVNLEtBQUs7WUFDWCxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDdkIsMEJBQTBCO2dCQUMxQixNQUFNLElBQUksMEJBQWlCLEVBQUUsQ0FBQztZQUMvQixDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3ZDLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztRQUM5QixDQUFDO1FBRU8sS0FBSyxDQUFDLE1BQU07WUFDbkIsTUFBTSxDQUFDLDJCQUEyQixFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7Z0JBQy9FLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBbUIsRUFBRTtnQkFDaEQsSUFBSSxDQUFDLGlCQUFpQixFQUFFO2dCQUN4QixJQUFJLENBQUMsd0JBQXdCLENBQUMsV0FBVyxFQUFFO2FBQzNDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLG9CQUFvQixDQUFDLDJCQUEyQixDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUVsSCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRTtnQkFDckMscUJBQXFCLEVBQUUsNENBQTRDO2dCQUNuRSw4QkFBOEIsRUFBRSxJQUFJO2FBQ3BDLENBQUMsQ0FBQztZQUVILElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNyRCxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDckUsQ0FBQztZQUVELElBQUEsdUNBQTJCLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFFakMsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDOUIsNkVBQTZFO2dCQUM3RSxzRUFBc0U7Z0JBQ3RFLE9BQU8sR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDdEMsQ0FBQztZQUVELE1BQU0sSUFBSSxHQUFpQztnQkFDMUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVE7Z0JBQ2xELGVBQWUsRUFBRSw0Q0FBNEM7Z0JBQzdELGFBQWEsRUFBRSxJQUFBLG1CQUFZLEdBQUU7Z0JBQzdCLEdBQUc7Z0JBQ0gsZ0ZBQWdGO2dCQUNoRiwrREFBK0Q7Z0JBQy9ELHNGQUFzRjtnQkFDdEYscUVBQXFFO2dCQUNyRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxTQUFTO2dCQUM5QixRQUFRLEVBQUUsU0FBaUM7Z0JBQzNDLE1BQU0sRUFBRSxJQUFJO2FBQ1osQ0FBQztZQUVGLElBQUksVUFBVSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUMsUUFBUSxHQUFHO29CQUNmLFVBQVU7b0JBQ1YsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsR0FBRyxVQUFVO2lCQUM3RSxDQUFDO1lBQ0gsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO2dCQUN4RCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQztnQkFDekQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakMsQ0FBQztZQUVELHlEQUF5RDtZQUN6RCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBSXRELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdEYsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN0RixNQUFNLFFBQVEsR0FBRyxhQUFLLENBQUMsR0FBRyxDQUN6QixhQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ2xFLGFBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDNUUsQ0FBQztZQUVGLDRFQUE0RTtZQUM1RSxNQUFNLGlCQUFpQixHQUFHLGFBQUssQ0FBQyxRQUFRLENBQVMsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNuRSxPQUFPLENBQUM7b0JBQ1AsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQy9ELENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDdkMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRVIsa0NBQWtDO1lBQ2xDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUMxQixNQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQztnQkFDNUYsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO29CQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO3dCQUMzRSxPQUFPLENBQUMsR0FBRyxDQUFDLHlIQUF5SCxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDdkwsQ0FBQztvQkFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO3dCQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNqRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2xDLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQzt3QkFDdEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO3dCQUNoQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBQzNDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDcEIsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxZQUFZO1lBRVosSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFFbEcsK0ZBQStGO1lBQy9GLElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2hCLElBQUksSUFBSSxDQUFDLG1CQUFtQixJQUFJLFVBQVUsSUFBSSxJQUFJLENBQUMsb0JBQW9CLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNoSSxJQUFJLENBQUMsMEJBQTBCLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hILENBQUM7Z0JBQ0QsSUFBSSxDQUFDLFlBQVksR0FBRyxVQUFVLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNsQyxDQUFDO1lBRUQsbUNBQW1DO1lBQ25DLElBQUksb0JBQXlCLENBQUM7WUFDOUIsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO2dCQUNoSCxvQkFBb0IsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO29CQUN0QyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxzRkFBc0YsSUFBSSxDQUFDLHVCQUF1QixHQUFHLENBQUMsQ0FBQztvQkFFOUksTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLHVCQUF1Qjt3QkFDdkMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0NBQWdDLEVBQUUscUhBQXFILENBQUM7d0JBQ3ZLLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLDJCQUEyQixFQUFFLHNFQUFzRSxDQUFDLENBQUM7b0JBRXJILElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsdUJBQVEsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUNyRCxDQUFDOzRCQUNBLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxlQUFlLENBQUM7NEJBQ3BELEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRTt5QkFDckMsQ0FBQyxFQUNGO3dCQUNDLE1BQU0sRUFBRSxJQUFJO3dCQUNaLFFBQVEsRUFBRSxtQ0FBb0IsQ0FBQyxNQUFNO3FCQUNyQyxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ1gsQ0FBQztZQUVELHFEQUFxRDtZQUNyRCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakYsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdkMsWUFBWSxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDbkMsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztRQUVEOztXQUVHO1FBQ0ssS0FBSyxDQUFDLGlCQUFpQjtZQUU5QixJQUFJLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLGtCQUFrQixDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDMUUsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQztZQUNsRSxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMseUJBQXlCLEVBQUUsSUFBSSxDQUFDLHNDQUFzQyxDQUFDLENBQUM7WUFFdEssSUFBSSxDQUFDLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ1gsT0FBTyxDQUFDLElBQUksQ0FBQywrREFBK0QsRUFBRSxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3hHLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQzt3QkFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxnREFBZ0QsUUFBUSx1QkFBdUIsSUFBSSxXQUFXLEVBQUUsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUN2SSxDQUFDO29CQUNELElBQUksSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7d0JBQ2xDLE9BQU8sQ0FBQyxJQUFJLENBQUMsb0VBQW9FLElBQUksRUFBRSxFQUFFLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDbkgsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE9BQU8sQ0FBQyxJQUFJLENBQUMsbURBQW1ELElBQUksRUFBRSxFQUFFLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDbEcsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sSUFBSSxJQUFJLENBQUMsQ0FBQztRQUNsQixDQUFDO1FBRU8sa0JBQWtCLENBQUMsb0JBQTBDLEVBQUUsSUFBa0M7WUFFeEcsSUFBQSx5Q0FBc0IsRUFBQyxJQUFJLCtDQUE0QixFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXJFLHVFQUF1RTtZQUN2RSxNQUFNLFdBQVcsR0FBRyxJQUFBLG9CQUFXLEVBQUMsU0FBUyxDQUFDLDhDQUE4QyxFQUFFLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRXBJLE9BQU8sSUFBSSxPQUFPLENBQTBCLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUUvRCxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO29CQUM5QixNQUFNLENBQUMsMkRBQTJELENBQUMsQ0FBQztnQkFDckUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFFZCxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7b0JBQ3pCLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7d0JBQ3JDLDZEQUE2RDt3QkFDN0QsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNkLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ0osWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUVyQixNQUFNLFNBQVMsR0FBRyxJQUFJLHlCQUFlLEVBQVksQ0FBQztvQkFDbEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7d0JBQ3ZCLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDOzRCQUNaLFNBQVMsQ0FBQyxJQUFJLENBQUMsaUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQ3ZDLENBQUM7b0JBQ0YsQ0FBQyxDQUFDLENBQUM7b0JBQ0gsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUViLE9BQU8sQ0FBQzt3QkFDUCxTQUFTLEVBQUUsU0FBUyxDQUFDLEtBQUs7d0JBQzFCLElBQUksRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztxQkFDakQsQ0FBQyxDQUFDO2dCQUNKLENBQUMsQ0FBQyxDQUFDO2dCQUVILDhFQUE4RTtnQkFDOUUsTUFBTSxFQUFFLEdBQUcscUJBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ25DLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUU7b0JBQ2pELElBQUksR0FBRyxFQUFFLENBQUM7d0JBQ1QsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7b0JBQ2hCLENBQUM7b0JBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMseUNBQXlDLEdBQUcsR0FBRyxDQUFDLENBQUM7b0JBQ3ZFLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDOUIsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ25CLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLHNDQUFzQyxRQUFRLE1BQU0sQ0FBQyxDQUFDO29CQUM3RSxDQUFDO2dCQUNGLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO29CQUNWLHFEQUFxRDtvQkFDckQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNiLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8saUJBQWlCLENBQUMsUUFBaUM7WUFDMUQsMkVBQTJFO1lBQzNFLGdEQUFnRDtZQUNoRCxPQUFPLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUU1QyxJQUFJLGFBQWtCLENBQUM7Z0JBQ3ZCLE1BQU0sbUJBQW1CLEdBQUcsR0FBRyxFQUFFO29CQUNoQyxhQUFhLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRTt3QkFDL0IsTUFBTSxDQUFDLDBFQUEwRSxDQUFDLENBQUM7b0JBQ3BGLENBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7Z0JBQ2YsQ0FBQyxDQUFDO2dCQUNGLE1BQU0scUJBQXFCLEdBQUcsR0FBRyxFQUFFO29CQUNsQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQzdCLENBQUMsQ0FBQztnQkFFRixpQ0FBaUM7Z0JBQ2pDLG1CQUFtQixFQUFFLENBQUM7Z0JBRXRCLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBRTNDLElBQUksSUFBQSx1Q0FBZSxFQUFDLEdBQUcsNEJBQW9CLEVBQUUsQ0FBQzt3QkFFN0MsZ0VBQWdFO3dCQUNoRSxxQkFBcUIsRUFBRSxDQUFDO3dCQUV4QixJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7NEJBRXpDLHVDQUF1Qzs0QkFDdkMsbUJBQW1CLEVBQUUsQ0FBQzs0QkFFdEIsUUFBUSxDQUFDLElBQUksQ0FBQyxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDMUQsQ0FBQyxDQUFDLENBQUM7d0JBQ0gsT0FBTztvQkFDUixDQUFDO29CQUVELElBQUksSUFBQSx1Q0FBZSxFQUFDLEdBQUcsa0NBQTBCLEVBQUUsQ0FBQzt3QkFFbkQsbUNBQW1DO3dCQUNuQyxxQkFBcUIsRUFBRSxDQUFDO3dCQUV4QixtQ0FBbUM7d0JBQ25DLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFFckIsdUJBQXVCO3dCQUN2QixPQUFPLEVBQUUsQ0FBQzt3QkFDVixPQUFPO29CQUNSLENBQUM7b0JBRUQsT0FBTyxDQUFDLEtBQUssQ0FBQyw4RUFBOEUsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDcEcsQ0FBQyxDQUFDLENBQUM7WUFFSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxLQUFLLENBQUMsc0JBQXNCO1lBQ25DLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzVELElBQUksQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQztZQUN0QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3RELE9BQU87Z0JBQ04sTUFBTSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTTtnQkFDbkMsT0FBTyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTztnQkFDckMsT0FBTyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTztnQkFDckMsU0FBUyxFQUFFLENBQUM7Z0JBQ1osV0FBVyxFQUFFO29CQUNaLDJCQUEyQixFQUFFLElBQUksQ0FBQyxvQkFBb0I7b0JBQ3RELE9BQU8sRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUztvQkFDbEcsT0FBTyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUTtvQkFDdEMsT0FBTyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsa0JBQWtCLElBQUksU0FBUztvQkFDN0QsWUFBWSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVztvQkFDOUMsNkJBQTZCLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLHVCQUF1QjtvQkFDL0UsK0JBQStCLEVBQUUsSUFBQSw4QkFBYSxFQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDO29CQUM5RixXQUFXLEVBQUUsUUFBUSxDQUFDLFFBQVE7b0JBQzlCLCtCQUErQixFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQywrQkFBK0I7b0JBQ3pGLHlCQUF5QixFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyx5QkFBeUI7b0JBQzdFLGlCQUFpQixFQUFFLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxjQUFjLENBQUMsaUJBQWlCO29CQUNqRixvQkFBb0IsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsb0JBQW9CO29CQUNuRSxpQkFBaUIsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsaUJBQWlCO2lCQUM3RDtnQkFDRCxTQUFTLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxpQkFBaUIsRUFBRSxpQ0FBeUIsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDMUYsYUFBYSxFQUFFLFNBQVMsQ0FBQyxhQUFhLElBQUksU0FBUztvQkFDbkQsRUFBRSxFQUFFLFNBQVMsQ0FBQyxFQUFFO29CQUNoQixJQUFJLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUM7b0JBQ3JELFVBQVUsRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFBLCtCQUFtQixFQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7b0JBQ3BILFNBQVMsRUFBRSxTQUFTLENBQUMsU0FBUztpQkFDOUI7Z0JBQ0QsTUFBTSxFQUFFO29CQUNQLFNBQVMsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsZUFBZTtvQkFDbkQsY0FBYyxFQUFFLElBQUk7b0JBQ3BCLFFBQVEsRUFBRSxLQUFLO2lCQUNmO2dCQUNELGNBQWMsRUFBRTtvQkFDZixZQUFZLEVBQUUsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxLQUFLLFFBQVEsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDO29CQUNsTSxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLElBQUksSUFBSSxDQUFDLG1CQUFtQjtpQkFDdkU7Z0JBQ0QsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFO2dCQUN4QyxhQUFhLEVBQUU7b0JBQ2QsU0FBUyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO29CQUMzQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFNBQVM7b0JBQzNDLEtBQUssRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSztvQkFDbkMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQjtvQkFDekQsWUFBWSxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZO2lCQUNqRDtnQkFDRCxRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUU7Z0JBQ3JDLE9BQU8sRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUN4RCxZQUFZLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGVBQWU7Z0JBQ3RELFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLGdEQUF3QyxDQUFDO2dCQUNqRSxNQUFNLEVBQUUsOEJBQU0sQ0FBQyxPQUFPO2FBQ3RCLENBQUM7UUFDSCxDQUFDO1FBRU8scUJBQXFCLENBQUMsSUFBWSxFQUFFLE1BQWM7WUFDekQsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3ZCLGdFQUFnRTtnQkFDaEUsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFTywwQkFBMEIsQ0FBQyxNQUFxQjtZQUN2RCxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7WUFDZCxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDdkIsTUFBTSxLQUFLLEdBQUcsSUFBSSxlQUFPLEVBQVUsQ0FBQztZQUNwQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDaEIseUVBQXlFO2dCQUN6RSxzRUFBc0U7Z0JBQ3RFLElBQUksSUFBSSxLQUFLLENBQUM7Z0JBQ2QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbkMsSUFBSSxHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUcsQ0FBQztnQkFFcEIsd0ZBQXdGO2dCQUN4RixJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxFQUFFLENBQUM7b0JBQzFCLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ2pCLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ1gsQ0FBQztnQkFFRCxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUMxQixJQUFJLFVBQVUsRUFBRSxDQUFDO3dCQUNoQixJQUFJLElBQUksZ0RBQXlCLEVBQUUsQ0FBQzs0QkFDbkMsVUFBVSxHQUFHLEtBQUssQ0FBQzt3QkFDcEIsQ0FBQztvQkFDRixDQUFDO3lCQUFNLElBQUksSUFBSSxvREFBMkIsRUFBRSxDQUFDO3dCQUM1QyxVQUFVLEdBQUcsSUFBSSxDQUFDO29CQUNuQixDQUFDO3lCQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUN4QixLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQztvQkFDekIsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTSxLQUFLLENBQUMsaUJBQWlCO1lBQzdCLElBQUksT0FBTyxJQUFJLENBQUMsWUFBWSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUMzQyxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQ2pDLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDcEUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNiLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLGFBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUEsZUFBTyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RixPQUFPLE9BQU8sSUFBSSxDQUFDLFlBQVksS0FBSyxRQUFRLENBQUM7UUFDOUMsQ0FBQztRQUVNLGNBQWM7WUFDcEIsT0FBTyxJQUFJLENBQUMsWUFBWSxJQUFJLFNBQVMsQ0FBQztRQUN2QyxDQUFDO1FBRU8sZUFBZSxDQUFDLEtBQXdCO1lBQy9DLGtGQUFrRjtZQUNsRiwyRUFBMkU7WUFDM0UsSUFBSSxJQUFJLENBQUMsbUJBQW1CLElBQUksQ0FBQyxJQUFJLENBQUMsMEJBQTBCLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN2SixJQUFJLENBQUMsMEJBQTBCLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN0RyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUEsZUFBTyxFQUFDLEdBQUcsQ0FBQyx5Q0FBeUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLDJCQUEyQixFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDJCQUEyQixFQUFFLHFDQUFxQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xNLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQWpmWSwwRUFBK0I7OENBQS9CLCtCQUErQjtRQThCekMsV0FBQSxvQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLG1DQUFvQixDQUFBO1FBQ3BCLFdBQUEsMkJBQWtCLENBQUE7UUFDbEIsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLHVEQUFrQyxDQUFBO1FBQ2xDLFdBQUEsMENBQXdCLENBQUE7UUFDeEIsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixZQUFBLGlCQUFXLENBQUE7UUFDWCxZQUFBLG9CQUFjLENBQUE7UUFDZCxZQUFBLHFCQUFhLENBQUE7UUFDYixZQUFBLCtDQUEwQixDQUFBO1FBQzFCLFlBQUEsbUJBQVksQ0FBQTtRQUNaLFlBQUEsZ0NBQWUsQ0FBQTtRQUNmLFlBQUEsa0RBQXdCLENBQUE7UUFDeEIsWUFBQSw0Q0FBcUIsQ0FBQTtPQTVDWCwrQkFBK0IsQ0FpZjNDIn0=