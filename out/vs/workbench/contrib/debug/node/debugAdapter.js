/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "net", "vs/base/common/objects", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/strings", "vs/base/node/pfs", "vs/nls", "../common/abstractDebugAdapter"], function (require, exports, cp, net, objects, path, platform, strings, pfs_1, nls, abstractDebugAdapter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExecutableDebugAdapter = exports.NamedPipeDebugAdapter = exports.SocketDebugAdapter = exports.NetworkDebugAdapter = exports.StreamDebugAdapter = void 0;
    /**
     * An implementation that communicates via two streams with the debug adapter.
     */
    class StreamDebugAdapter extends abstractDebugAdapter_1.AbstractDebugAdapter {
        static { this.TWO_CRLF = '\r\n\r\n'; }
        static { this.HEADER_LINESEPARATOR = /\r?\n/; } // allow for non-RFC 2822 conforming line separators
        static { this.HEADER_FIELDSEPARATOR = /: */; }
        constructor() {
            super();
            this.rawData = Buffer.allocUnsafe(0);
            this.contentLength = -1;
        }
        connect(readable, writable) {
            this.outputStream = writable;
            this.rawData = Buffer.allocUnsafe(0);
            this.contentLength = -1;
            readable.on('data', (data) => this.handleData(data));
        }
        sendMessage(message) {
            if (this.outputStream) {
                const json = JSON.stringify(message);
                this.outputStream.write(`Content-Length: ${Buffer.byteLength(json, 'utf8')}${StreamDebugAdapter.TWO_CRLF}${json}`, 'utf8');
            }
        }
        handleData(data) {
            this.rawData = Buffer.concat([this.rawData, data]);
            while (true) {
                if (this.contentLength >= 0) {
                    if (this.rawData.length >= this.contentLength) {
                        const message = this.rawData.toString('utf8', 0, this.contentLength);
                        this.rawData = this.rawData.slice(this.contentLength);
                        this.contentLength = -1;
                        if (message.length > 0) {
                            try {
                                this.acceptMessage(JSON.parse(message));
                            }
                            catch (e) {
                                this._onError.fire(new Error((e.message || e) + '\n' + message));
                            }
                        }
                        continue; // there may be more complete messages to process
                    }
                }
                else {
                    const idx = this.rawData.indexOf(StreamDebugAdapter.TWO_CRLF);
                    if (idx !== -1) {
                        const header = this.rawData.toString('utf8', 0, idx);
                        const lines = header.split(StreamDebugAdapter.HEADER_LINESEPARATOR);
                        for (const h of lines) {
                            const kvPair = h.split(StreamDebugAdapter.HEADER_FIELDSEPARATOR);
                            if (kvPair[0] === 'Content-Length') {
                                this.contentLength = Number(kvPair[1]);
                            }
                        }
                        this.rawData = this.rawData.slice(idx + StreamDebugAdapter.TWO_CRLF.length);
                        continue;
                    }
                }
                break;
            }
        }
    }
    exports.StreamDebugAdapter = StreamDebugAdapter;
    class NetworkDebugAdapter extends StreamDebugAdapter {
        startSession() {
            return new Promise((resolve, reject) => {
                let connected = false;
                this.socket = this.createConnection(() => {
                    this.connect(this.socket, this.socket);
                    resolve();
                    connected = true;
                });
                this.socket.on('close', () => {
                    if (connected) {
                        this._onError.fire(new Error('connection closed'));
                    }
                    else {
                        reject(new Error('connection closed'));
                    }
                });
                this.socket.on('error', error => {
                    if (connected) {
                        this._onError.fire(error);
                    }
                    else {
                        reject(error);
                    }
                });
            });
        }
        async stopSession() {
            await this.cancelPendingRequests();
            if (this.socket) {
                this.socket.end();
                this.socket = undefined;
            }
        }
    }
    exports.NetworkDebugAdapter = NetworkDebugAdapter;
    /**
     * An implementation that connects to a debug adapter via a socket.
    */
    class SocketDebugAdapter extends NetworkDebugAdapter {
        constructor(adapterServer) {
            super();
            this.adapterServer = adapterServer;
        }
        createConnection(connectionListener) {
            return net.createConnection(this.adapterServer.port, this.adapterServer.host || '127.0.0.1', connectionListener);
        }
    }
    exports.SocketDebugAdapter = SocketDebugAdapter;
    /**
     * An implementation that connects to a debug adapter via a NamedPipe (on Windows)/UNIX Domain Socket (on non-Windows).
     */
    class NamedPipeDebugAdapter extends NetworkDebugAdapter {
        constructor(adapterServer) {
            super();
            this.adapterServer = adapterServer;
        }
        createConnection(connectionListener) {
            return net.createConnection(this.adapterServer.path, connectionListener);
        }
    }
    exports.NamedPipeDebugAdapter = NamedPipeDebugAdapter;
    /**
     * An implementation that launches the debug adapter as a separate process and communicates via stdin/stdout.
    */
    class ExecutableDebugAdapter extends StreamDebugAdapter {
        constructor(adapterExecutable, debugType) {
            super();
            this.adapterExecutable = adapterExecutable;
            this.debugType = debugType;
        }
        async startSession() {
            const command = this.adapterExecutable.command;
            const args = this.adapterExecutable.args;
            const options = this.adapterExecutable.options || {};
            try {
                // verify executables asynchronously
                if (command) {
                    if (path.isAbsolute(command)) {
                        const commandExists = await pfs_1.Promises.exists(command);
                        if (!commandExists) {
                            throw new Error(nls.localize('debugAdapterBinNotFound', "Debug adapter executable '{0}' does not exist.", command));
                        }
                    }
                    else {
                        // relative path
                        if (command.indexOf('/') < 0 && command.indexOf('\\') < 0) {
                            // no separators: command looks like a runtime name like 'node' or 'mono'
                            // TODO: check that the runtime is available on PATH
                        }
                    }
                }
                else {
                    throw new Error(nls.localize({ key: 'debugAdapterCannotDetermineExecutable', comment: ['Adapter executable file not found'] }, "Cannot determine executable for debug adapter '{0}'.", this.debugType));
                }
                let env = process.env;
                if (options.env && Object.keys(options.env).length > 0) {
                    env = objects.mixin(objects.deepClone(process.env), options.env);
                }
                if (command === 'node') {
                    if (Array.isArray(args) && args.length > 0) {
                        const isElectron = !!process.env['ELECTRON_RUN_AS_NODE'] || !!process.versions['electron'];
                        const forkOptions = {
                            env: env,
                            execArgv: isElectron ? ['-e', 'delete process.env.ELECTRON_RUN_AS_NODE;require(process.argv[1])'] : [],
                            silent: true
                        };
                        if (options.cwd) {
                            forkOptions.cwd = options.cwd;
                        }
                        const child = cp.fork(args[0], args.slice(1), forkOptions);
                        if (!child.pid) {
                            throw new Error(nls.localize('unableToLaunchDebugAdapter', "Unable to launch debug adapter from '{0}'.", args[0]));
                        }
                        this.serverProcess = child;
                    }
                    else {
                        throw new Error(nls.localize('unableToLaunchDebugAdapterNoArgs', "Unable to launch debug adapter."));
                    }
                }
                else {
                    const spawnOptions = {
                        env: env
                    };
                    if (options.cwd) {
                        spawnOptions.cwd = options.cwd;
                    }
                    this.serverProcess = cp.spawn(command, args, spawnOptions);
                }
                this.serverProcess.on('error', err => {
                    this._onError.fire(err);
                });
                this.serverProcess.on('exit', (code, signal) => {
                    this._onExit.fire(code);
                });
                this.serverProcess.stdout.on('close', () => {
                    this._onError.fire(new Error('read error'));
                });
                this.serverProcess.stdout.on('error', error => {
                    this._onError.fire(error);
                });
                this.serverProcess.stdin.on('error', error => {
                    this._onError.fire(error);
                });
                this.serverProcess.stderr.resume();
                // finally connect to the DA
                this.connect(this.serverProcess.stdout, this.serverProcess.stdin);
            }
            catch (err) {
                this._onError.fire(err);
            }
        }
        async stopSession() {
            if (!this.serverProcess) {
                return Promise.resolve(undefined);
            }
            // when killing a process in windows its child
            // processes are *not* killed but become root
            // processes. Therefore we use TASKKILL.EXE
            await this.cancelPendingRequests();
            if (platform.isWindows) {
                return new Promise((c, e) => {
                    const killer = cp.exec(`taskkill /F /T /PID ${this.serverProcess.pid}`, function (err, stdout, stderr) {
                        if (err) {
                            return e(err);
                        }
                    });
                    killer.on('exit', c);
                    killer.on('error', e);
                });
            }
            else {
                this.serverProcess.kill('SIGTERM');
                return Promise.resolve(undefined);
            }
        }
        static extract(platformContribution, extensionFolderPath) {
            if (!platformContribution) {
                return undefined;
            }
            const result = Object.create(null);
            if (platformContribution.runtime) {
                if (platformContribution.runtime.indexOf('./') === 0) { // TODO
                    result.runtime = path.join(extensionFolderPath, platformContribution.runtime);
                }
                else {
                    result.runtime = platformContribution.runtime;
                }
            }
            if (platformContribution.runtimeArgs) {
                result.runtimeArgs = platformContribution.runtimeArgs;
            }
            if (platformContribution.program) {
                if (!path.isAbsolute(platformContribution.program)) {
                    result.program = path.join(extensionFolderPath, platformContribution.program);
                }
                else {
                    result.program = platformContribution.program;
                }
            }
            if (platformContribution.args) {
                result.args = platformContribution.args;
            }
            const contribution = platformContribution;
            if (contribution.win) {
                result.win = ExecutableDebugAdapter.extract(contribution.win, extensionFolderPath);
            }
            if (contribution.winx86) {
                result.winx86 = ExecutableDebugAdapter.extract(contribution.winx86, extensionFolderPath);
            }
            if (contribution.windows) {
                result.windows = ExecutableDebugAdapter.extract(contribution.windows, extensionFolderPath);
            }
            if (contribution.osx) {
                result.osx = ExecutableDebugAdapter.extract(contribution.osx, extensionFolderPath);
            }
            if (contribution.linux) {
                result.linux = ExecutableDebugAdapter.extract(contribution.linux, extensionFolderPath);
            }
            return result;
        }
        static platformAdapterExecutable(extensionDescriptions, debugType) {
            let result = Object.create(null);
            debugType = debugType.toLowerCase();
            // merge all contributions into one
            for (const ed of extensionDescriptions) {
                if (ed.contributes) {
                    const debuggers = ed.contributes['debuggers'];
                    if (debuggers && debuggers.length > 0) {
                        debuggers.filter(dbg => typeof dbg.type === 'string' && strings.equalsIgnoreCase(dbg.type, debugType)).forEach(dbg => {
                            // extract relevant attributes and make them absolute where needed
                            const extractedDbg = ExecutableDebugAdapter.extract(dbg, ed.extensionLocation.fsPath);
                            // merge
                            result = objects.mixin(result, extractedDbg, ed.isBuiltin);
                        });
                    }
                }
            }
            // select the right platform
            let platformInfo;
            if (platform.isWindows && !process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432')) {
                platformInfo = result.winx86 || result.win || result.windows;
            }
            else if (platform.isWindows) {
                platformInfo = result.win || result.windows;
            }
            else if (platform.isMacintosh) {
                platformInfo = result.osx;
            }
            else if (platform.isLinux) {
                platformInfo = result.linux;
            }
            platformInfo = platformInfo || result;
            // these are the relevant attributes
            const program = platformInfo.program || result.program;
            const args = platformInfo.args || result.args;
            const runtime = platformInfo.runtime || result.runtime;
            const runtimeArgs = platformInfo.runtimeArgs || result.runtimeArgs;
            if (runtime) {
                return {
                    type: 'executable',
                    command: runtime,
                    args: (runtimeArgs || []).concat(typeof program === 'string' ? [program] : []).concat(args || [])
                };
            }
            else if (program) {
                return {
                    type: 'executable',
                    command: program,
                    args: args || []
                };
            }
            // nothing found
            return undefined;
        }
    }
    exports.ExecutableDebugAdapter = ExecutableDebugAdapter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdBZGFwdGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9ub2RlL2RlYnVnQWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEc7O09BRUc7SUFDSCxNQUFzQixrQkFBbUIsU0FBUSwyQ0FBb0I7aUJBRTVDLGFBQVEsR0FBRyxVQUFVLEFBQWIsQ0FBYztpQkFDdEIseUJBQW9CLEdBQUcsT0FBTyxBQUFWLENBQVcsR0FBQyxvREFBb0Q7aUJBQ3BGLDBCQUFxQixHQUFHLEtBQUssQUFBUixDQUFTO1FBTXREO1lBQ0MsS0FBSyxFQUFFLENBQUM7WUFKRCxZQUFPLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQyxrQkFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBSTNCLENBQUM7UUFFUyxPQUFPLENBQUMsUUFBeUIsRUFBRSxRQUF5QjtZQUVyRSxJQUFJLENBQUMsWUFBWSxHQUFHLFFBQVEsQ0FBQztZQUM3QixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUV4QixRQUFRLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFRCxXQUFXLENBQUMsT0FBc0M7WUFFakQsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxZ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