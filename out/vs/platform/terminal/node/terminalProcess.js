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
define(["require", "exports", "child_process", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/base/node/pfs", "vs/nls", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/terminal/node/childProcessMonitor", "vs/platform/terminal/node/terminalEnvironment", "vs/platform/terminal/node/windowsShellHelper", "node-pty", "vs/platform/terminal/common/terminalProcess"], function (require, exports, child_process_1, async_1, event_1, lifecycle_1, path, platform_1, uri_1, pfs_1, nls_1, log_1, productService_1, childProcessMonitor_1, terminalEnvironment_1, windowsShellHelper_1, node_pty_1, terminalProcess_1) {
    "use strict";
    var TerminalProcess_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalProcess = void 0;
    var ShutdownConstants;
    (function (ShutdownConstants) {
        /**
         * The amount of ms that must pass between data events after exit is queued before the actual
         * kill call is triggered. This data flush mechanism works around an [issue in node-pty][1]
         * where not all data is flushed which causes problems for task problem matchers. Additionally
         * on Windows under conpty, killing a process while data is being output will cause the [conhost
         * flush to hang the pty host][2] because [conhost should be hosted on another thread][3].
         *
         * [1]: https://github.com/Tyriar/node-pty/issues/72
         * [2]: https://github.com/microsoft/vscode/issues/71966
         * [3]: https://github.com/microsoft/node-pty/pull/415
         */
        ShutdownConstants[ShutdownConstants["DataFlushTimeout"] = 250] = "DataFlushTimeout";
        /**
         * The maximum ms to allow after dispose is called because forcefully killing the process.
         */
        ShutdownConstants[ShutdownConstants["MaximumShutdownTime"] = 5000] = "MaximumShutdownTime";
    })(ShutdownConstants || (ShutdownConstants = {}));
    var Constants;
    (function (Constants) {
        /**
         * The minimum duration between kill and spawn calls on Windows/conpty as a mitigation for a
         * hang issue. See:
         * - https://github.com/microsoft/vscode/issues/71966
         * - https://github.com/microsoft/vscode/issues/117956
         * - https://github.com/microsoft/vscode/issues/121336
         */
        Constants[Constants["KillSpawnThrottleInterval"] = 250] = "KillSpawnThrottleInterval";
        /**
         * The amount of time to wait when a call is throttles beyond the exact amount, this is used to
         * try prevent early timeouts causing a kill/spawn call to happen at double the regular
         * interval.
         */
        Constants[Constants["KillSpawnSpacingDuration"] = 50] = "KillSpawnSpacingDuration";
        /**
         * How long to wait between chunk writes.
         */
        Constants[Constants["WriteInterval"] = 5] = "WriteInterval";
    })(Constants || (Constants = {}));
    const posixShellTypeMap = new Map([
        ['bash', "bash" /* PosixShellType.Bash */],
        ['csh', "csh" /* PosixShellType.Csh */],
        ['fish', "fish" /* PosixShellType.Fish */],
        ['ksh', "ksh" /* PosixShellType.Ksh */],
        ['sh', "sh" /* PosixShellType.Sh */],
        ['pwsh', "pwsh" /* PosixShellType.PowerShell */],
        ['python', "python" /* PosixShellType.Python */],
        ['zsh', "zsh" /* PosixShellType.Zsh */]
    ]);
    let TerminalProcess = class TerminalProcess extends lifecycle_1.Disposable {
        static { TerminalProcess_1 = this; }
        static { this._lastKillOrStart = 0; }
        get exitMessage() { return this._exitMessage; }
        get currentTitle() { return this._windowsShellHelper?.shellTitle || this._currentTitle; }
        get shellType() { return platform_1.isWindows ? this._windowsShellHelper?.shellType : posixShellTypeMap.get(this._currentTitle); }
        get hasChildProcesses() { return this._childProcessMonitor?.hasChildProcesses || false; }
        constructor(shellLaunchConfig, cwd, cols, rows, env, 
        /**
         * environment used for `findExecutable`
         */
        _executableEnv, _options, _logService, _productService) {
            super();
            this.shellLaunchConfig = shellLaunchConfig;
            this._executableEnv = _executableEnv;
            this._options = _options;
            this._logService = _logService;
            this._productService = _productService;
            this.id = 0;
            this.shouldPersist = false;
            this._properties = {
                cwd: '',
                initialCwd: '',
                fixedDimensions: { cols: undefined, rows: undefined },
                title: '',
                shellType: undefined,
                hasChildProcesses: true,
                resolvedShellLaunchConfig: {},
                overrideDimensions: undefined,
                failedShellIntegrationActivation: false,
                usedShellIntegrationInjection: undefined
            };
            this._currentTitle = '';
            this._titleInterval = null;
            this._writeQueue = [];
            this._isPtyPaused = false;
            this._unacknowledgedCharCount = 0;
            this._onProcessData = this._register(new event_1.Emitter());
            this.onProcessData = this._onProcessData.event;
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._onProcessReady.event;
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._onProcessExit = this._register(new event_1.Emitter());
            this.onProcessExit = this._onProcessExit.event;
            let name;
            if (platform_1.isWindows) {
                name = path.basename(this.shellLaunchConfig.executable || '');
            }
            else {
                // Using 'xterm-256color' here helps ensure that the majority of Linux distributions will use a
                // color prompt as defined in the default ~/.bashrc file.
                name = 'xterm-256color';
            }
            this._initialCwd = cwd;
            this._properties["initialCwd" /* ProcessPropertyType.InitialCwd */] = this._initialCwd;
            this._properties["cwd" /* ProcessPropertyType.Cwd */] = this._initialCwd;
            const useConpty = this._options.windowsEnableConpty && process.platform === 'win32' && (0, terminalEnvironment_1.getWindowsBuildNumber)() >= 18309;
            this._ptyOptions = {
                name,
                cwd,
                // TODO: When node-pty is updated this cast can be removed
                env: env,
                cols,
                rows,
                useConpty,
                // This option will force conpty to not redraw the whole viewport on launch
                conptyInheritCursor: useConpty && !!shellLaunchConfig.initialText
            };
            // Delay resizes to avoid conpty not respecting very early resize calls
            if (platform_1.isWindows) {
                if (useConpty && cols === 0 && rows === 0 && this.shellLaunchConfig.executable?.endsWith('Git\\bin\\bash.exe')) {
                    this._delayedResizer = new DelayedResizer();
                    this._register(this._delayedResizer.onTrigger(dimensions => {
                        this._delayedResizer?.dispose();
                        this._delayedResizer = undefined;
                        if (dimensions.cols && dimensions.rows) {
                            this.resize(dimensions.cols, dimensions.rows);
                        }
                    }));
                }
                // WindowsShellHelper is used to fetch the process title and shell type
                this.onProcessReady(e => {
                    this._windowsShellHelper = this._register(new windowsShellHelper_1.WindowsShellHelper(e.pid));
                    this._register(this._windowsShellHelper.onShellTypeChanged(e => this._onDidChangeProperty.fire({ type: "shellType" /* ProcessPropertyType.ShellType */, value: e })));
                    this._register(this._windowsShellHelper.onShellNameChanged(e => this._onDidChangeProperty.fire({ type: "title" /* ProcessPropertyType.Title */, value: e })));
                });
            }
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (this._titleInterval) {
                    clearInterval(this._titleInterval);
                    this._titleInterval = null;
                }
            }));
        }
        async start() {
            const results = await Promise.all([this._validateCwd(), this._validateExecutable()]);
            const firstError = results.find(r => r !== undefined);
            if (firstError) {
                return firstError;
            }
            let injection;
            if (this._options.shellIntegration.enabled) {
                injection = (0, terminalEnvironment_1.getShellIntegrationInjection)(this.shellLaunchConfig, this._options, this._ptyOptions.env, this._logService, this._productService);
                if (injection) {
                    this._onDidChangeProperty.fire({ type: "usedShellIntegrationInjection" /* ProcessPropertyType.UsedShellIntegrationInjection */, value: true });
                    if (injection.envMixin) {
                        for (const [key, value] of Object.entries(injection.envMixin)) {
                            this._ptyOptions.env ||= {};
                            this._ptyOptions.env[key] = value;
                        }
                    }
                    if (injection.filesToCopy) {
                        for (const f of injection.filesToCopy) {
                            await pfs_1.Promises.mkdir(path.dirname(f.dest), { recursive: true });
                            try {
                                await pfs_1.Promises.copyFile(f.source, f.dest);
                            }
                            catch {
                                // Swallow error, this should only happen when multiple users are on the same
                                // machine. Since the shell integration scripts rarely change, plus the other user
                                // should be using the same version of the server in this case, assume the script is
                                // fine if copy fails and swallow the error.
                            }
                        }
                    }
                }
                else {
                    this._onDidChangeProperty.fire({ type: "failedShellIntegrationActivation" /* ProcessPropertyType.FailedShellIntegrationActivation */, value: true });
                }
            }
            try {
                await this.setupPtyProcess(this.shellLaunchConfig, this._ptyOptions, injection);
                if (injection?.newArgs) {
                    return { injectedArgs: injection.newArgs };
                }
                return undefined;
            }
            catch (err) {
                this._logService.trace('node-pty.node-pty.IPty#spawn native exception', err);
                return { message: `A native exception occurred during launch (${err.message})` };
            }
        }
        async _validateCwd() {
            try {
                const result = await pfs_1.Promises.stat(this._initialCwd);
                if (!result.isDirectory()) {
                    return { message: (0, nls_1.localize)('launchFail.cwdNotDirectory', "Starting directory (cwd) \"{0}\" is not a directory", this._initialCwd.toString()) };
                }
            }
            catch (err) {
                if (err?.code === 'ENOENT') {
                    return { message: (0, nls_1.localize)('launchFail.cwdDoesNotExist', "Starting directory (cwd) \"{0}\" does not exist", this._initialCwd.toString()) };
                }
            }
            this._onDidChangeProperty.fire({ type: "initialCwd" /* ProcessPropertyType.InitialCwd */, value: this._initialCwd });
            return undefined;
        }
        async _validateExecutable() {
            const slc = this.shellLaunchConfig;
            if (!slc.executable) {
                throw new Error('IShellLaunchConfig.executable not set');
            }
            const cwd = slc.cwd instanceof uri_1.URI ? slc.cwd.path : slc.cwd;
            const envPaths = (slc.env && slc.env.PATH) ? slc.env.PATH.split(path.delimiter) : undefined;
            const executable = await (0, terminalEnvironment_1.findExecutable)(slc.executable, cwd, envPaths, this._executableEnv);
            if (!executable) {
                return { message: (0, nls_1.localize)('launchFail.executableDoesNotExist', "Path to shell executable \"{0}\" does not exist", slc.executable) };
            }
            try {
                const result = await pfs_1.Promises.stat(executable);
                if (!result.isFile() && !result.isSymbolicLink()) {
                    return { message: (0, nls_1.localize)('launchFail.executableIsNotFileOrSymlink', "Path to shell executable \"{0}\" is not a file or a symlink", slc.executable) };
                }
                // Set the executable explicitly here so that node-pty doesn't need to search the
                // $PATH too.
                slc.executable = executable;
            }
            catch (err) {
                if (err?.code === 'EACCES') {
                    // Swallow
                }
                else {
                    throw err;
                }
            }
            return undefined;
        }
        async setupPtyProcess(shellLaunchConfig, options, shellIntegrationInjection) {
            const args = shellIntegrationInjection?.newArgs || shellLaunchConfig.args || [];
            await this._throttleKillSpawn();
            this._logService.trace('node-pty.IPty#spawn', shellLaunchConfig.executable, args, options);
            const ptyProcess = (0, node_pty_1.spawn)(shellLaunchConfig.executable, args, options);
            this._ptyProcess = ptyProcess;
            this._childProcessMonitor = this._register(new childProcessMonitor_1.ChildProcessMonitor(ptyProcess.pid, this._logService));
            this._childProcessMonitor.onDidChangeHasChildProcesses(value => this._onDidChangeProperty.fire({ type: "hasChildProcesses" /* ProcessPropertyType.HasChildProcesses */, value }));
            this._processStartupComplete = new Promise(c => {
                this.onProcessReady(() => c());
            });
            ptyProcess.onData(data => {
                // Handle flow control
                this._unacknowledgedCharCount += data.length;
                if (!this._isPtyPaused && this._unacknowledgedCharCount > 100000 /* FlowControlConstants.HighWatermarkChars */) {
                    this._logService.trace(`Flow control: Pause (${this._unacknowledgedCharCount} > ${100000 /* FlowControlConstants.HighWatermarkChars */})`);
                    this._isPtyPaused = true;
                    ptyProcess.pause();
                }
                // Refire the data event
                this._logService.trace('node-pty.IPty#onData', data);
                this._onProcessData.fire(data);
                if (this._closeTimeout) {
                    this._queueProcessExit();
                }
                this._windowsShellHelper?.checkShell();
                this._childProcessMonitor?.handleOutput();
            });
            ptyProcess.onExit(e => {
                this._exitCode = e.exitCode;
                this._queueProcessExit();
            });
            this._sendProcessId(ptyProcess.pid);
            this._setupTitlePolling(ptyProcess);
        }
        _setupTitlePolling(ptyProcess) {
            // Send initial timeout async to give event listeners a chance to init
            setTimeout(() => this._sendProcessTitle(ptyProcess));
            // Setup polling for non-Windows, for Windows `process` doesn't change
            if (!platform_1.isWindows) {
                this._titleInterval = setInterval(() => {
                    if (this._currentTitle !== ptyProcess.process) {
                        this._sendProcessTitle(ptyProcess);
                    }
                }, 200);
            }
        }
        // Allow any trailing data events to be sent before the exit event is sent.
        // See https://github.com/Tyriar/node-pty/issues/72
        _queueProcessExit() {
            if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                this._logService.trace('TerminalProcess#_queueProcessExit', new Error().stack?.replace(/^Error/, ''));
            }
            if (this._closeTimeout) {
                clearTimeout(this._closeTimeout);
            }
            this._closeTimeout = setTimeout(() => {
                this._closeTimeout = undefined;
                this._kill();
            }, 250 /* ShutdownConstants.DataFlushTimeout */);
        }
        async _kill() {
            // Wait to kill to process until the start up code has run. This prevents us from firing a process exit before a
            // process start.
            await this._processStartupComplete;
            if (this._store.isDisposed) {
                return;
            }
            // Attempt to kill the pty, it may have already been killed at this
            // point but we want to make sure
            try {
                if (this._ptyProcess) {
                    await this._throttleKillSpawn();
                    this._logService.trace('node-pty.IPty#kill');
                    this._ptyProcess.kill();
                }
            }
            catch (ex) {
                // Swallow, the pty has already been killed
            }
            this._onProcessExit.fire(this._exitCode || 0);
            this.dispose();
        }
        async _throttleKillSpawn() {
            // Only throttle on Windows/conpty
            if (!platform_1.isWindows || !('useConpty' in this._ptyOptions) || !this._ptyOptions.useConpty) {
                return;
            }
            // Use a loop to ensure multiple calls in a single interval space out
            while (Date.now() - TerminalProcess_1._lastKillOrStart < 250 /* Constants.KillSpawnThrottleInterval */) {
                this._logService.trace('Throttling kill/spawn call');
                await (0, async_1.timeout)(250 /* Constants.KillSpawnThrottleInterval */ - (Date.now() - TerminalProcess_1._lastKillOrStart) + 50 /* Constants.KillSpawnSpacingDuration */);
            }
            TerminalProcess_1._lastKillOrStart = Date.now();
        }
        _sendProcessId(pid) {
            this._onProcessReady.fire({
                pid,
                cwd: this._initialCwd,
                windowsPty: this.getWindowsPty()
            });
        }
        _sendProcessTitle(ptyProcess) {
            if (this._store.isDisposed) {
                return;
            }
            this._currentTitle = ptyProcess.process;
            this._onDidChangeProperty.fire({ type: "title" /* ProcessPropertyType.Title */, value: this._currentTitle });
            // If fig is installed it may change the title of the process
            const sanitizedTitle = this.currentTitle.replace(/ \(figterm\)$/g, '');
            if (sanitizedTitle.toLowerCase().startsWith('python')) {
                this._onDidChangeProperty.fire({ type: "shellType" /* ProcessPropertyType.ShellType */, value: "python" /* PosixShellType.Python */ });
            }
            else {
                this._onDidChangeProperty.fire({ type: "shellType" /* ProcessPropertyType.ShellType */, value: posixShellTypeMap.get(sanitizedTitle) });
            }
        }
        shutdown(immediate) {
            if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                this._logService.trace('TerminalProcess#shutdown', new Error().stack?.replace(/^Error/, ''));
            }
            // don't force immediate disposal of the terminal processes on Windows as an additional
            // mitigation for https://github.com/microsoft/vscode/issues/71966 which causes the pty host
            // to become unresponsive, disconnecting all terminals across all windows.
            if (immediate && !platform_1.isWindows) {
                this._kill();
            }
            else {
                if (!this._closeTimeout && !this._store.isDisposed) {
                    this._queueProcessExit();
                    // Allow a maximum amount of time for the process to exit, otherwise force kill it
                    setTimeout(() => {
                        if (this._closeTimeout && !this._store.isDisposed) {
                            this._closeTimeout = undefined;
                            this._kill();
                        }
                    }, 5000 /* ShutdownConstants.MaximumShutdownTime */);
                }
            }
        }
        input(data, isBinary = false) {
            if (this._store.isDisposed || !this._ptyProcess) {
                return;
            }
            this._writeQueue.push(...(0, terminalProcess_1.chunkInput)(data).map(e => {
                return { isBinary, data: e };
            }));
            this._startWrite();
        }
        async processBinary(data) {
            this.input(data, true);
        }
        async refreshProperty(type) {
            switch (type) {
                case "cwd" /* ProcessPropertyType.Cwd */: {
                    const newCwd = await this.getCwd();
                    if (newCwd !== this._properties.cwd) {
                        this._properties.cwd = newCwd;
                        this._onDidChangeProperty.fire({ type: "cwd" /* ProcessPropertyType.Cwd */, value: this._properties.cwd });
                    }
                    return newCwd;
                }
                case "initialCwd" /* ProcessPropertyType.InitialCwd */: {
                    const initialCwd = await this.getInitialCwd();
                    if (initialCwd !== this._properties.initialCwd) {
                        this._properties.initialCwd = initialCwd;
                        this._onDidChangeProperty.fire({ type: "initialCwd" /* ProcessPropertyType.InitialCwd */, value: this._properties.initialCwd });
                    }
                    return initialCwd;
                }
                case "title" /* ProcessPropertyType.Title */:
                    return this.currentTitle;
                default:
                    return this.shellType;
            }
        }
        async updateProperty(type, value) {
            if (type === "fixedDimensions" /* ProcessPropertyType.FixedDimensions */) {
                this._properties.fixedDimensions = value;
            }
        }
        _startWrite() {
            // Don't write if it's already queued of is there is nothing to write
            if (this._writeTimeout !== undefined || this._writeQueue.length === 0) {
                return;
            }
            this._doWrite();
            // Don't queue more writes if the queue is empty
            if (this._writeQueue.length === 0) {
                this._writeTimeout = undefined;
                return;
            }
            // Queue the next write
            this._writeTimeout = setTimeout(() => {
                this._writeTimeout = undefined;
                this._startWrite();
            }, 5 /* Constants.WriteInterval */);
        }
        _doWrite() {
            const object = this._writeQueue.shift();
            this._logService.trace('node-pty.IPty#write', object.data);
            if (object.isBinary) {
                this._ptyProcess.write(Buffer.from(object.data, 'binary'));
            }
            else {
                this._ptyProcess.write(object.data);
            }
            this._childProcessMonitor?.handleInput();
        }
        resize(cols, rows) {
            if (this._store.isDisposed) {
                return;
            }
            if (typeof cols !== 'number' || typeof rows !== 'number' || isNaN(cols) || isNaN(rows)) {
                return;
            }
            // Ensure that cols and rows are always >= 1, this prevents a native
            // exception in winpty.
            if (this._ptyProcess) {
                cols = Math.max(cols, 1);
                rows = Math.max(rows, 1);
                // Delay resize if needed
                if (this._delayedResizer) {
                    this._delayedResizer.cols = cols;
                    this._delayedResizer.rows = rows;
                    return;
                }
                this._logService.trace('node-pty.IPty#resize', cols, rows);
                try {
                    this._ptyProcess.resize(cols, rows);
                }
                catch (e) {
                    // Swallow error if the pty has already exited
                    this._logService.trace('node-pty.IPty#resize exception ' + e.message);
                    if (this._exitCode !== undefined &&
                        e.message !== 'ioctl(2) failed, EBADF' &&
                        e.message !== 'Cannot resize a pty that has already exited') {
                        throw e;
                    }
                }
            }
        }
        clearBuffer() {
            this._ptyProcess?.clear();
        }
        acknowledgeDataEvent(charCount) {
            // Prevent lower than 0 to heal from errors
            this._unacknowledgedCharCount = Math.max(this._unacknowledgedCharCount - charCount, 0);
            this._logService.trace(`Flow control: Ack ${charCount} chars (unacknowledged: ${this._unacknowledgedCharCount})`);
            if (this._isPtyPaused && this._unacknowledgedCharCount < 5000 /* FlowControlConstants.LowWatermarkChars */) {
                this._logService.trace(`Flow control: Resume (${this._unacknowledgedCharCount} < ${5000 /* FlowControlConstants.LowWatermarkChars */})`);
                this._ptyProcess?.resume();
                this._isPtyPaused = false;
            }
        }
        clearUnacknowledgedChars() {
            this._unacknowledgedCharCount = 0;
            this._logService.trace(`Flow control: Cleared all unacknowledged chars, forcing resume`);
            if (this._isPtyPaused) {
                this._ptyProcess?.resume();
                this._isPtyPaused = false;
            }
        }
        async setUnicodeVersion(version) {
            // No-op
        }
        getInitialCwd() {
            return Promise.resolve(this._initialCwd);
        }
        async getCwd() {
            if (platform_1.isMacintosh) {
                // From Big Sur (darwin v20) there is a spawn blocking thread issue on Electron,
                // this is fixed in VS Code's internal Electron.
                // https://github.com/Microsoft/vscode/issues/105446
                return new Promise(resolve => {
                    if (!this._ptyProcess) {
                        resolve(this._initialCwd);
                        return;
                    }
                    this._logService.trace('node-pty.IPty#pid');
                    (0, child_process_1.exec)('lsof -OPln -p ' + this._ptyProcess.pid + ' | grep cwd', { env: { ...process.env, LANG: 'en_US.UTF-8' } }, (error, stdout, stderr) => {
                        if (!error && stdout !== '') {
                            resolve(stdout.substring(stdout.indexOf('/'), stdout.length - 1));
                        }
                        else {
                            this._logService.error('lsof did not run successfully, it may not be on the $PATH?', error, stdout, stderr);
                            resolve(this._initialCwd);
                        }
                    });
                });
            }
            if (platform_1.isLinux) {
                if (!this._ptyProcess) {
                    return this._initialCwd;
                }
                this._logService.trace('node-pty.IPty#pid');
                try {
                    return await pfs_1.Promises.readlink(`/proc/${this._ptyProcess.pid}/cwd`);
                }
                catch (error) {
                    return this._initialCwd;
                }
            }
            return this._initialCwd;
        }
        getWindowsPty() {
            return platform_1.isWindows ? {
                backend: 'useConpty' in this._ptyOptions && this._ptyOptions.useConpty ? 'conpty' : 'winpty',
                buildNumber: (0, terminalEnvironment_1.getWindowsBuildNumber)()
            } : undefined;
        }
    };
    exports.TerminalProcess = TerminalProcess;
    exports.TerminalProcess = TerminalProcess = TerminalProcess_1 = __decorate([
        __param(7, log_1.ILogService),
        __param(8, productService_1.IProductService)
    ], TerminalProcess);
    /**
     * Tracks the latest resize event to be trigger at a later point.
     */
    class DelayedResizer extends lifecycle_1.Disposable {
        get onTrigger() { return this._onTrigger.event; }
        constructor() {
            super();
            this._onTrigger = this._register(new event_1.Emitter());
            this._timeout = setTimeout(() => {
                this._onTrigger.fire({ rows: this.rows, cols: this.cols });
            }, 1000);
            this._register((0, lifecycle_1.toDisposable)(() => clearTimeout(this._timeout)));
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9jZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9ub2RlL3Rlcm1pbmFsUHJvY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBb0JoRyxJQUFXLGlCQWlCVjtJQWpCRCxXQUFXLGlCQUFpQjtRQUMzQjs7Ozs7Ozs7OztXQVVHO1FBQ0gsbUZBQXNCLENBQUE7UUFDdEI7O1dBRUc7UUFDSCwwRkFBMEIsQ0FBQTtJQUMzQixDQUFDLEVBakJVLGlCQUFpQixLQUFqQixpQkFBaUIsUUFpQjNCO0lBRUQsSUFBVyxTQW1CVjtJQW5CRCxXQUFXLFNBQVM7UUFDbkI7Ozs7OztXQU1HO1FBQ0gscUZBQStCLENBQUE7UUFDL0I7Ozs7V0FJRztRQUNILGtGQUE2QixDQUFBO1FBQzdCOztXQUVHO1FBQ0gsMkRBQWlCLENBQUE7SUFDbEIsQ0FBQyxFQW5CVSxTQUFTLEtBQVQsU0FBUyxRQW1CbkI7SUFPRCxNQUFNLGlCQUFpQixHQUFHLElBQUksR0FBRyxDQUF5QjtRQUN6RCxDQUFDLE1BQU0sbUNBQXNCO1FBQzdCLENBQUMsS0FBSyxpQ0FBcUI7UUFDM0IsQ0FBQyxNQUFNLG1DQUFzQjtRQUM3QixDQUFDLEtBQUssaUNBQXFCO1FBQzNCLENBQUMsSUFBSSwrQkFBb0I7UUFDekIsQ0FBQyxNQUFNLHlDQUE0QjtRQUNuQyxDQUFDLFFBQVEsdUNBQXdCO1FBQ2pDLENBQUMsS0FBSyxpQ0FBcUI7S0FDM0IsQ0FBQyxDQUFDO0lBRUksSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxzQkFBVTs7aUJBZ0IvQixxQkFBZ0IsR0FBRyxDQUFDLEFBQUosQ0FBSztRQWtCcEMsSUFBSSxXQUFXLEtBQXlCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxD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