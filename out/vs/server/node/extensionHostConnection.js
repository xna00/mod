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
define(["require", "exports", "child_process", "net", "vs/server/node/remoteLanguagePacks", "vs/base/common/network", "vs/base/common/path", "vs/base/common/buffer", "vs/base/common/event", "vs/base/parts/ipc/node/ipc.net", "vs/platform/shell/node/shellEnv", "vs/platform/log/common/log", "vs/server/node/serverEnvironmentService", "vs/base/common/platform", "vs/base/common/processes", "vs/server/node/extensionHostStatusService", "vs/base/common/lifecycle", "vs/workbench/services/extensions/common/extensionHostEnv", "vs/platform/configuration/common/configuration"], function (require, exports, cp, net, remoteLanguagePacks_1, network_1, path_1, buffer_1, event_1, ipc_net_1, shellEnv_1, log_1, serverEnvironmentService_1, platform_1, processes_1, extensionHostStatusService_1, lifecycle_1, extensionHostEnv_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostConnection = void 0;
    exports.buildUserEnvironment = buildUserEnvironment;
    async function buildUserEnvironment(startParamsEnv = {}, withUserShellEnvironment, language, environmentService, logService, configurationService) {
        const nlsConfig = await (0, remoteLanguagePacks_1.getNLSConfiguration)(language, environmentService.userDataPath);
        let userShellEnv = {};
        if (withUserShellEnvironment) {
            try {
                userShellEnv = await (0, shellEnv_1.getResolvedShellEnv)(configurationService, logService, environmentService.args, process.env);
            }
            catch (error) {
                logService.error('ExtensionHostConnection#buildUserEnvironment resolving shell environment failed', error);
            }
        }
        const processEnv = process.env;
        const env = {
            ...processEnv,
            ...userShellEnv,
            ...{
                VSCODE_AMD_ENTRYPOINT: 'vs/workbench/api/node/extensionHostProcess',
                VSCODE_HANDLES_UNCAUGHT_ERRORS: 'true',
                VSCODE_NLS_CONFIG: JSON.stringify(nlsConfig, undefined, 0)
            },
            ...startParamsEnv
        };
        const binFolder = environmentService.isBuilt ? (0, path_1.join)(environmentService.appRoot, 'bin') : (0, path_1.join)(environmentService.appRoot, 'resources', 'server', 'bin-dev');
        const remoteCliBinFolder = (0, path_1.join)(binFolder, 'remote-cli'); // contains the `code` command that can talk to the remote server
        let PATH = readCaseInsensitive(env, 'PATH');
        if (PATH) {
            PATH = remoteCliBinFolder + path_1.delimiter + PATH;
        }
        else {
            PATH = remoteCliBinFolder;
        }
        setCaseInsensitive(env, 'PATH', PATH);
        if (!environmentService.args['without-browser-env-var']) {
            env.BROWSER = (0, path_1.join)(binFolder, 'helpers', platform_1.isWindows ? 'browser.cmd' : 'browser.sh'); // a command that opens a browser on the local machine
        }
        removeNulls(env);
        return env;
    }
    class ConnectionData {
        constructor(socket, initialDataChunk) {
            this.socket = socket;
            this.initialDataChunk = initialDataChunk;
        }
        socketDrain() {
            return this.socket.drain();
        }
        toIExtHostSocketMessage() {
            let skipWebSocketFrames;
            let permessageDeflate;
            let inflateBytes;
            if (this.socket instanceof ipc_net_1.NodeSocket) {
                skipWebSocketFrames = true;
                permessageDeflate = false;
                inflateBytes = buffer_1.VSBuffer.alloc(0);
            }
            else {
                skipWebSocketFrames = false;
                permessageDeflate = this.socket.permessageDeflate;
                inflateBytes = this.socket.recordedInflateBytes;
            }
            return {
                type: 'VSCODE_EXTHOST_IPC_SOCKET',
                initialDataChunk: this.initialDataChunk.buffer.toString('base64'),
                skipWebSocketFrames: skipWebSocketFrames,
                permessageDeflate: permessageDeflate,
                inflateBytes: inflateBytes.buffer.toString('base64'),
            };
        }
    }
    let ExtensionHostConnection = class ExtensionHostConnection {
        constructor(_reconnectionToken, remoteAddress, socket, initialDataChunk, _environmentService, _logService, _extensionHostStatusService, _configurationService) {
            this._reconnectionToken = _reconnectionToken;
            this._environmentService = _environmentService;
            this._logService = _logService;
            this._extensionHostStatusService = _extensionHostStatusService;
            this._configurationService = _configurationService;
            this._onClose = new event_1.Emitter();
            this.onClose = this._onClose.event;
            this._canSendSocket = (!platform_1.isWindows || !this._environmentService.args['socket-path']);
            this._disposed = false;
            this._remoteAddress = remoteAddress;
            this._extensionHostProcess = null;
            this._connectionData = new ConnectionData(socket, initialDataChunk);
            this._log(`New connection established.`);
        }
        get _logPrefix() {
            return `[${this._remoteAddress}][${this._reconnectionToken.substr(0, 8)}][ExtensionHostConnection] `;
        }
        _log(_str) {
            this._logService.info(`${this._logPrefix}${_str}`);
        }
        _logError(_str) {
            this._logService.error(`${this._logPrefix}${_str}`);
        }
        async _pipeSockets(extHostSocket, connectionData) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(connectionData.socket);
            disposables.add((0, lifecycle_1.toDisposable)(() => {
                extHostSocket.destroy();
            }));
            const stopAndCleanup = () => {
                disposables.dispose();
            };
            disposables.add(connectionData.socket.onEnd(stopAndCleanup));
            disposables.add(connectionData.socket.onClose(stopAndCleanup));
            disposables.add(event_1.Event.fromNodeEventEmitter(extHostSocket, 'end')(stopAndCleanup));
            disposables.add(event_1.Event.fromNodeEventEmitter(extHostSocket, 'close')(stopAndCleanup));
            disposables.add(event_1.Event.fromNodeEventEmitter(extHostSocket, 'error')(stopAndCleanup));
            disposables.add(connectionData.socket.onData((e) => extHostSocket.write(e.buffer)));
            disposables.add(event_1.Event.fromNodeEventEmitter(extHostSocket, 'data')((e) => {
                connectionData.socket.write(buffer_1.VSBuffer.wrap(e));
            }));
            if (connectionData.initialDataChunk.byteLength > 0) {
                extHostSocket.write(connectionData.initialDataChunk.buffer);
            }
        }
        async _sendSocketToExtensionHost(extensionHostProcess, connectionData) {
            // Make sure all outstanding writes have been drained before sending the socket
            await connectionData.socketDrain();
            const msg = connectionData.toIExtHostSocketMessage();
            let socket;
            if (connectionData.socket instanceof ipc_net_1.NodeSocket) {
                socket = connectionData.socket.socket;
            }
            else {
                socket = connectionData.socket.socket.socket;
            }
            extensionHostProcess.send(msg, socket);
        }
        shortenReconnectionGraceTimeIfNecessary() {
            if (!this._extensionHostProcess) {
                return;
            }
            const msg = {
                type: 'VSCODE_EXTHOST_IPC_REDUCE_GRACE_TIME'
            };
            this._extensionHostProcess.send(msg);
        }
        acceptReconnection(remoteAddress, _socket, initialDataChunk) {
            this._remoteAddress = remoteAddress;
            this._log(`The client has reconnected.`);
            const connectionData = new ConnectionData(_socket, initialDataChunk);
            if (!this._extensionHostProcess) {
                // The extension host didn't even start up yet
                this._connectionData = connectionData;
                return;
            }
            this._sendSocketToExtensionHost(this._extensionHostProcess, connectionData);
        }
        _cleanResources() {
            if (this._disposed) {
                // already called
                return;
            }
            this._disposed = true;
            if (this._connectionData) {
                this._connectionData.socket.end();
                this._connectionData = null;
            }
            if (this._extensionHostProcess) {
                this._extensionHostProcess.kill();
                this._extensionHostProcess = null;
            }
            this._onClose.fire(undefined);
        }
        async start(startParams) {
            try {
                let execArgv = process.execArgv ? process.execArgv.filter(a => !/^--inspect(-brk)?=/.test(a)) : [];
                if (startParams.port && !process.pkg) {
                    execArgv = [`--inspect${startParams.break ? '-brk' : ''}=${startParams.port}`];
                }
                const env = await buildUserEnvironment(startParams.env, true, startParams.language, this._environmentService, this._logService, this._configurationService);
                (0, processes_1.removeDangerousEnvVariables)(env);
                let extHostNamedPipeServer;
                if (this._canSendSocket) {
                    (0, extensionHostEnv_1.writeExtHostConnection)(new extensionHostEnv_1.SocketExtHostConnection(), env);
                    extHostNamedPipeServer = null;
                }
                else {
                    const { namedPipeServer, pipeName } = await this._listenOnPipe();
                    (0, extensionHostEnv_1.writeExtHostConnection)(new extensionHostEnv_1.IPCExtHostConnection(pipeName), env);
                    extHostNamedPipeServer = namedPipeServer;
                }
                const opts = {
                    env,
                    execArgv,
                    silent: true
                };
                // Refs https://github.com/microsoft/vscode/issues/189805
                opts.execArgv.unshift('--dns-result-order=ipv4first');
                // Run Extension Host as fork of current process
                const args = ['--type=extensionHost', `--transformURIs`];
                const useHostProxy = this._environmentService.args['use-host-proxy'];
                args.push(`--useHostProxy=${useHostProxy ? 'true' : 'false'}`);
                this._extensionHostProcess = cp.fork(network_1.FileAccess.asFileUri('bootstrap-fork').fsPath, args, opts);
                const pid = this._extensionHostProcess.pid;
                this._log(`<${pid}> Launched Extension Host Process.`);
                // Catch all output coming from the extension host process
                this._extensionHostProcess.stdout.setEncoding('utf8');
                this._extensionHostProcess.stderr.setEncoding('utf8');
                const onStdout = event_1.Event.fromNodeEventEmitter(this._extensionHostProcess.stdout, 'data');
                const onStderr = event_1.Event.fromNodeEventEmitter(this._extensionHostProcess.stderr, 'data');
                onStdout((e) => this._log(`<${pid}> ${e}`));
                onStderr((e) => this._log(`<${pid}><stderr> ${e}`));
                // Lifecycle
                this._extensionHostProcess.on('error', (err) => {
                    this._logError(`<${pid}> Extension Host Process had an error`);
                    this._logService.error(err);
                    this._cleanResources();
                });
                this._extensionHostProcess.on('exit', (code, signal) => {
                    this._extensionHostStatusService.setExitInfo(this._reconnectionToken, { code, signal });
                    this._log(`<${pid}> Extension Host Process exited with code: ${code}, signal: ${signal}.`);
                    this._cleanResources();
                });
                if (extHostNamedPipeServer) {
                    extHostNamedPipeServer.on('connection', (socket) => {
                        extHostNamedPipeServer.close();
                        this._pipeSockets(socket, this._connectionData);
                    });
                }
                else {
                    const messageListener = (msg) => {
                        if (msg.type === 'VSCODE_EXTHOST_IPC_READY') {
                            this._extensionHostProcess.removeListener('message', messageListener);
                            this._sendSocketToExtensionHost(this._extensionHostProcess, this._connectionData);
                            this._connectionData = null;
                        }
                    };
                    this._extensionHostProcess.on('message', messageListener);
                }
            }
            catch (error) {
                console.error('ExtensionHostConnection errored');
                if (error) {
                    console.error(error);
                }
            }
        }
        _listenOnPipe() {
            return new Promise((resolve, reject) => {
                const pipeName = (0, ipc_net_1.createRandomIPCHandle)();
                const namedPipeServer = net.createServer();
                namedPipeServer.on('error', reject);
                namedPipeServer.listen(pipeName, () => {
                    namedPipeServer?.removeListener('error', reject);
                    resolve({ pipeName, namedPipeServer });
                });
            });
        }
    };
    exports.ExtensionHostConnection = ExtensionHostConnection;
    exports.ExtensionHostConnection = ExtensionHostConnection = __decorate([
        __param(4, serverEnvironmentService_1.IServerEnvironmentService),
        __param(5, log_1.ILogService),
        __param(6, extensionHostStatusService_1.IExtensionHostStatusService),
        __param(7, configuration_1.IConfigurationService)
    ], ExtensionHostConnection);
    function readCaseInsensitive(env, key) {
        const pathKeys = Object.keys(env).filter(k => k.toLowerCase() === key.toLowerCase());
        const pathKey = pathKeys.length > 0 ? pathKeys[0] : key;
        return env[pathKey];
    }
    function setCaseInsensitive(env, key, value) {
        const pathKeys = Object.keys(env).filter(k => k.toLowerCase() === key.toLowerCase());
        const pathKey = pathKeys.length > 0 ? pathKeys[0] : key;
        env[pathKey] = value;
    }
    function removeNulls(env) {
        // Don't delete while iterating the object itself
        for (const key of Object.keys(env)) {
            if (env[key] === null) {
                delete env[key];
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdENvbm5lY3Rpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3NlcnZlci9ub2RlL2V4dGVuc2lvbkhvc3RDb25uZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXNCaEcsb0RBMENDO0lBMUNNLEtBQUssVUFBVSxvQkFBb0IsQ0FBQyxpQkFBbUQsRUFBRSxFQUFFLHdCQUFpQyxFQUFFLFFBQWdCLEVBQUUsa0JBQTZDLEVBQUUsVUFBdUIsRUFBRSxvQkFBMkM7UUFDelEsTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFBLHlDQUFtQixFQUFDLFFBQVEsRUFBRSxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUV2RixJQUFJLFlBQVksR0FBdUIsRUFBRSxDQUFDO1FBQzFDLElBQUksd0JBQXdCLEVBQUUsQ0FBQztZQUM5QixJQUFJLENBQUM7Z0JBQ0osWUFBWSxHQUFHLE1BQU0sSUFBQSw4QkFBbUIsRUFBQyxvQkFBb0IsRUFBRSxVQUFVLEVBQUUsa0JBQWtCLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsSCxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsVUFBVSxDQUFDLEtBQUssQ0FBQyxpRkFBaUYsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1RyxDQUFDO1FBQ0YsQ0FBQztRQUVELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFFL0IsTUFBTSxHQUFHLEdBQXdCO1lBQ2hDLEdBQUcsVUFBVTtZQUNiLEdBQUcsWUFBWTtZQUNmLEdBQUc7Z0JBQ0YscUJBQXFCLEVBQUUsNENBQTRDO2dCQUNuRSw4QkFBOEIsRUFBRSxNQUFNO2dCQUN0QyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsU0FBUyxD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