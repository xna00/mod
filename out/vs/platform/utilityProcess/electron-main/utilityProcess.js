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
define(["require", "exports", "electron", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/log/common/log", "string_decoder", "vs/base/common/async", "vs/base/common/network", "vs/platform/windows/electron-main/windows", "vs/base/common/severity", "vs/platform/telemetry/common/telemetry", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/base/common/processes", "vs/base/common/objects", "vs/base/common/platform", "vs/base/node/unc"], function (require, exports, electron_1, lifecycle_1, event_1, log_1, string_decoder_1, async_1, network_1, windows_1, severity_1, telemetry_1, lifecycleMainService_1, processes_1, objects_1, platform_1, unc_1) {
    "use strict";
    var UtilityProcess_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowUtilityProcess = exports.UtilityProcess = void 0;
    function isWindowUtilityProcessConfiguration(config) {
        const candidate = config;
        return typeof candidate.responseWindowId === 'number';
    }
    let UtilityProcess = class UtilityProcess extends lifecycle_1.Disposable {
        static { UtilityProcess_1 = this; }
        static { this.ID_COUNTER = 0; }
        static { this.all = new Map(); }
        static getAll() {
            return Array.from(UtilityProcess_1.all.values());
        }
        constructor(logService, telemetryService, lifecycleMainService) {
            super();
            this.logService = logService;
            this.telemetryService = telemetryService;
            this.lifecycleMainService = lifecycleMainService;
            this.id = String(++UtilityProcess_1.ID_COUNTER);
            this._onStdout = this._register(new event_1.Emitter());
            this.onStdout = this._onStdout.event;
            this._onStderr = this._register(new event_1.Emitter());
            this.onStderr = this._onStderr.event;
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._onSpawn = this._register(new event_1.Emitter());
            this.onSpawn = this._onSpawn.event;
            this._onExit = this._register(new event_1.Emitter());
            this.onExit = this._onExit.event;
            this._onCrash = this._register(new event_1.Emitter());
            this.onCrash = this._onCrash.event;
            this.process = undefined;
            this.processPid = undefined;
            this.configuration = undefined;
        }
        log(msg, severity) {
            let logMsg;
            if (this.configuration?.correlationId) {
                logMsg = `[UtilityProcess id: ${this.configuration?.correlationId}, type: ${this.configuration?.type}, pid: ${this.processPid ?? '<none>'}]: ${msg}`;
            }
            else {
                logMsg = `[UtilityProcess type: ${this.configuration?.type}, pid: ${this.processPid ?? '<none>'}]: ${msg}`;
            }
            switch (severity) {
                case severity_1.default.Error:
                    this.logService.error(logMsg);
                    break;
                case severity_1.default.Warning:
                    this.logService.warn(logMsg);
                    break;
                case severity_1.default.Info:
                    this.logService.trace(logMsg);
                    break;
            }
        }
        validateCanStart() {
            if (this.process) {
                this.log('Cannot start utility process because it is already running...', severity_1.default.Error);
                return false;
            }
            return true;
        }
        start(configuration) {
            const started = this.doStart(configuration);
            if (started && configuration.payload) {
                const posted = this.postMessage(configuration.payload);
                if (posted) {
                    this.log('payload sent via postMessage()', severity_1.default.Info);
                }
            }
            return started;
        }
        doStart(configuration) {
            if (!this.validateCanStart()) {
                return false;
            }
            this.configuration = configuration;
            const serviceName = `${this.configuration.type}-${this.id}`;
            const modulePath = network_1.FileAccess.asFileUri('bootstrap-fork.js').fsPath;
            const args = this.configuration.args ?? [];
            const execArgv = this.configuration.execArgv ?? [];
            const allowLoadingUnsignedLibraries = this.configuration.allowLoadingUnsignedLibraries;
            const forceAllocationsToV8Sandbox = this.configuration.forceAllocationsToV8Sandbox;
            const stdio = 'pipe';
            const env = this.createEnv(configuration);
            this.log('creating new...', severity_1.default.Info);
            // Fork utility process
            this.process = electron_1.utilityProcess.fork(modulePath, args, {
                serviceName,
                env,
                execArgv,
                allowLoadingUnsignedLibraries,
                forceAllocationsToV8Sandbox,
                stdio
            });
            // Register to events
            this.registerListeners(this.process, this.configuration, serviceName);
            return true;
        }
        createEnv(configuration) {
            const env = configuration.env ? { ...configuration.env } : { ...(0, objects_1.deepClone)(process.env) };
            // Apply supported environment variables from config
            env['VSCODE_AMD_ENTRYPOINT'] = configuration.entryPoint;
            if (typeof configuration.parentLifecycleBound === 'number') {
                env['VSCODE_PARENT_PID'] = String(configuration.parentLifecycleBound);
            }
            env['VSCODE_CRASH_REPORTER_PROCESS_TYPE'] = configuration.type;
            if (platform_1.isWindows) {
                if ((0, unc_1.isUNCAccessRestrictionsDisabled)()) {
                    env['NODE_DISABLE_UNC_ACCESS_CHECKS'] = '1';
                }
                else {
                    env['NODE_UNC_HOST_ALLOWLIST'] = (0, unc_1.getUNCHostAllowlist)().join('\\');
                }
            }
            // Remove any environment variables that are not allowed
            (0, processes_1.removeDangerousEnvVariables)(env);
            // Ensure all values are strings, otherwise the process will not start
            for (const key of Object.keys(env)) {
                env[key] = String(env[key]);
            }
            return env;
        }
        registerListeners(process, configuration, serviceName) {
            // Stdout
            if (process.stdout) {
                const stdoutDecoder = new string_decoder_1.StringDecoder('utf-8');
                this._register(event_1.Event.fromNodeEventEmitter(process.stdout, 'data')(chunk => this._onStdout.fire(typeof chunk === 'string' ? chunk : stdoutDecoder.write(chunk))));
            }
            // Stderr
            if (process.stderr) {
                const stderrDecoder = new string_decoder_1.StringDecoder('utf-8');
                this._register(event_1.Event.fromNodeEventEmitter(process.stderr, 'data')(chunk => this._onStderr.fire(typeof chunk === 'string' ? chunk : stderrDecoder.write(chunk))));
            }
            // Messages
            this._register(event_1.Event.fromNodeEventEmitter(process, 'message')(msg => this._onMessage.fire(msg)));
            // Spawn
            this._register(event_1.Event.fromNodeEventEmitter(process, 'spawn')(() => {
                this.processPid = process.pid;
                if (typeof process.pid === 'number') {
                    UtilityProcess_1.all.set(process.pid, { pid: process.pid, name: isWindowUtilityProcessConfiguration(configuration) ? `${configuration.type} [${configuration.responseWindowId}]` : configuration.type });
                }
                this.log('successfully created', severity_1.default.Info);
                this._onSpawn.fire(process.pid);
            }));
            // Exit
            this._register(event_1.Event.fromNodeEventEmitter(process, 'exit')(code => {
                this.log(`received exit event with code ${code}`, severity_1.default.Info);
                // Event
                this._onExit.fire({ pid: this.processPid, code, signal: 'unknown' });
                // Cleanup
                this.onDidExitOrCrashOrKill();
            }));
            // Child process gone
            this._register(event_1.Event.fromNodeEventEmitter(electron_1.app, 'child-process-gone', (event, details) => ({ event, details }))(({ details }) => {
                if (details.type === 'Utility' && details.name === serviceName) {
                    this.log(`crashed with code ${details.exitCode} and reason '${details.reason}'`, severity_1.default.Error);
                    this.telemetryService.publicLog2('utilityprocesscrash', {
                        type: configuration.type,
                        reason: details.reason,
                        code: details.exitCode
                    });
                    // Event
                    this._onCrash.fire({ pid: this.processPid, code: details.exitCode, reason: details.reason });
                    // Cleanup
                    this.onDidExitOrCrashOrKill();
                }
            }));
        }
        once(message, callback) {
            const disposable = this._register(this._onMessage.event(msg => {
                if (msg === message) {
                    disposable.dispose();
                    callback();
                }
            }));
        }
        postMessage(message, transfer) {
            if (!this.process) {
                return false; // already killed, crashed or never started
            }
            this.process.postMessage(message, transfer);
            return true;
        }
        connect(payload) {
            const { port1: outPort, port2: utilityProcessPort } = new electron_1.MessageChannelMain();
            this.postMessage(payload, [utilityProcessPort]);
            return outPort;
        }
        enableInspectPort() {
            if (!this.process || typeof this.processPid !== 'number') {
                return false;
            }
            this.log('enabling inspect port', severity_1.default.Info);
            // use (undocumented) _debugProcess feature of node if available
            const processExt = process;
            if (typeof processExt._debugProcess === 'function') {
                processExt._debugProcess(this.processPid);
                return true;
            }
            // not supported...
            return false;
        }
        kill() {
            if (!this.process) {
                return; // already killed, crashed or never started
            }
            this.log('attempting to kill the process...', severity_1.default.Info);
            const killed = this.process.kill();
            if (killed) {
                this.log('successfully killed the process', severity_1.default.Info);
                this.onDidExitOrCrashOrKill();
            }
            else {
                this.log('unable to kill the process', severity_1.default.Warning);
            }
        }
        onDidExitOrCrashOrKill() {
            if (typeof this.processPid === 'number') {
                UtilityProcess_1.all.delete(this.processPid);
            }
            this.process = undefined;
        }
        async waitForExit(maxWaitTimeMs) {
            if (!this.process) {
                return; // already killed, crashed or never started
            }
            this.log('waiting to exit...', severity_1.default.Info);
            await Promise.race([event_1.Event.toPromise(this.onExit), (0, async_1.timeout)(maxWaitTimeMs)]);
            if (this.process) {
                this.log(`did not exit within ${maxWaitTimeMs}ms, will kill it now...`, severity_1.default.Info);
                this.kill();
            }
        }
    };
    exports.UtilityProcess = UtilityProcess;
    exports.UtilityProcess = UtilityProcess = UtilityProcess_1 = __decorate([
        __param(0, log_1.ILogService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, lifecycleMainService_1.ILifecycleMainService)
    ], UtilityProcess);
    let WindowUtilityProcess = class WindowUtilityProcess extends UtilityProcess {
        constructor(logService, windowsMainService, telemetryService, lifecycleMainService) {
            super(logService, telemetryService, lifecycleMainService);
            this.windowsMainService = windowsMainService;
        }
        start(configuration) {
            const responseWindow = this.windowsMainService.getWindowById(configuration.responseWindowId);
            if (!responseWindow?.win || responseWindow.win.isDestroyed() || responseWindow.win.webContents.isDestroyed()) {
                this.log('Refusing to start utility process because requesting window cannot be found or is destroyed...', severity_1.default.Error);
                return true;
            }
            // Start utility process
            const started = super.doStart(configuration);
            if (!started) {
                return false;
            }
            // Register to window events
            this.registerWindowListeners(responseWindow.win, configuration);
            // Establish & exchange message ports
            const windowPort = this.connect(configuration.payload);
            responseWindow.win.webContents.postMessage(configuration.responseChannel, configuration.responseNonce, [windowPort]);
            return true;
        }
        registerWindowListeners(window, configuration) {
            // If the lifecycle of the utility process is bound to the window,
            // we kill the process if the window closes or changes
            if (configuration.windowLifecycleBound) {
                this._register(event_1.Event.filter(this.lifecycleMainService.onWillLoadWindow, e => e.window.win === window)(() => this.kill()));
                this._register(event_1.Event.fromNodeEventEmitter(window, 'closed')(() => this.kill()));
            }
        }
    };
    exports.WindowUtilityProcess = WindowUtilityProcess;
    exports.WindowUtilityProcess = WindowUtilityProcess = __decorate([
        __param(0, log_1.ILogService),
        __param(1, windows_1.IWindowsMainService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, lifecycleMainService_1.ILifecycleMainService)
    ], WindowUtilityProcess);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbGl0eVByb2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3V0aWxpdHlQcm9jZXNzL2VsZWN0cm9uLW1haW4vdXRpbGl0eVByb2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQThGaEcsU0FBUyxtQ0FBbUMsQ0FBQyxNQUFvQztRQUNoRixNQUFNLFNBQVMsR0FBRyxNQUE0QyxDQUFDO1FBRS9ELE9BQU8sT0FBTyxTQUFTLENBQUMsZ0JBQWdCLEtBQUssUUFBUSxDQUFDO0lBQ3ZELENBQUM7SUFxQ00sSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLHNCQUFVOztpQkFFOUIsZUFBVSxHQUFHLENBQUMsQUFBSixDQUFLO2lCQUVOLFFBQUcsR0FBRyxJQUFJLEdBQUcsRUFBK0IsQUFBekMsQ0FBMEM7UUFDckUsTUFBTSxDQUFDLE1BQU07WUFDWixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBMEJELFlBQ2MsVUFBd0MsRUFDbEMsZ0JBQW9ELEVBQ2hELG9CQUE4RDtZQUVyRixLQUFLLEVBQUUsQ0FBQztZQUpzQixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2pCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDN0IseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQTNCckUsT0FBRSxHQUFHLE1BQU0sQ0FBQyxFQUFFLGdCQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFekMsY0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO1lBQzFELGFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztZ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