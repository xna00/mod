/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "net", "minimist", "vs/base/common/performance", "vs/base/common/errors", "vs/base/parts/ipc/common/ipc.net", "vs/base/parts/ipc/node/ipc.net", "vs/platform/product/common/product", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/workbench/api/common/extensionHostMain", "vs/base/common/buffer", "vs/base/node/pfs", "vs/base/node/extpath", "vs/base/common/async", "vs/editor/common/config/editorOptions", "vs/workbench/api/node/uriTransformer", "vs/workbench/services/extensions/common/extensionHostEnv", "vs/workbench/api/common/extHost.common.services", "vs/workbench/api/node/extHost.node.services"], function (require, exports, net, minimist, performance, errors_1, ipc_net_1, ipc_net_2, product_1, extensionHostProtocol_1, extensionHostMain_1, buffer_1, pfs_1, extpath_1, async_1, editorOptions_1, uriTransformer_1, extensionHostEnv_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // workaround for https://github.com/microsoft/vscode/issues/85490
    // remove --inspect-port=0 after start so that it doesn't trigger LSP debugging
    (function removeInspectPort() {
        for (let i = 0; i < process.execArgv.length; i++) {
            if (process.execArgv[i] === '--inspect-port=0') {
                process.execArgv.splice(i, 1);
                i--;
            }
        }
    })();
    const args = minimist(process.argv.slice(2), {
        boolean: [
            'transformURIs',
            'skipWorkspaceStorageLock'
        ],
        string: [
            'useHostProxy' // 'true' | 'false' | undefined
        ]
    });
    // With Electron 2.x and node.js 8.x the "natives" module
    // can cause a native crash (see https://github.com/nodejs/node/issues/19891 and
    // https://github.com/electron/electron/issues/10905). To prevent this from
    // happening we essentially blocklist this module from getting loaded in any
    // extension by patching the node require() function.
    (function () {
        const Module = globalThis._VSCODE_NODE_MODULES.module;
        const originalLoad = Module._load;
        Module._load = function (request) {
            if (request === 'natives') {
                throw new Error('Either the extension or an NPM dependency is using the [unsupported "natives" node module](https://go.microsoft.com/fwlink/?linkid=871887).');
            }
            return originalLoad.apply(this, arguments);
        };
    })();
    // custom process.exit logic...
    const nativeExit = process.exit.bind(process);
    const nativeOn = process.on.bind(process);
    function patchProcess(allowExit) {
        process.exit = function (code) {
            if (allowExit) {
                nativeExit(code);
            }
            else {
                const err = new Error('An extension called process.exit() and this was prevented.');
                console.warn(err.stack);
            }
        };
        // override Electron's process.crash() method
        process.crash = function () {
            const err = new Error('An extension called process.crash() and this was prevented.');
            console.warn(err.stack);
        };
        // Set ELECTRON_RUN_AS_NODE environment variable for extensions that use
        // child_process.spawn with process.execPath and expect to run as node process
        // on the desktop.
        // Refs https://github.com/microsoft/vscode/issues/151012#issuecomment-1156593228
        process.env['ELECTRON_RUN_AS_NODE'] = '1';
        process.on = function (event, listener) {
            if (event === 'uncaughtException') {
                listener = function () {
                    try {
                        return listener.call(undefined, arguments);
                    }
                    catch {
                        // DO NOT HANDLE NOR PRINT the error here because this can and will lead to
                        // more errors which will cause error handling to be reentrant and eventually
                        // overflowing the stack. Do not be sad, we do handle and annotate uncaught
                        // errors properly in 'extensionHostMain'
                    }
                };
            }
            nativeOn(event, listener);
        };
    }
    // This calls exit directly in case the initialization is not finished and we need to exit
    // Otherwise, if initialization completed we go to extensionHostMain.terminate()
    let onTerminate = function (reason) {
        nativeExit();
    };
    function _createExtHostProtocol() {
        const extHostConnection = (0, extensionHostEnv_1.readExtHostConnection)(process.env);
        if (extHostConnection.type === 3 /* ExtHostConnectionType.MessagePort */) {
            return new Promise((resolve, reject) => {
                const withPorts = (ports) => {
                    const port = ports[0];
                    const onMessage = new ipc_net_1.BufferedEmitter();
                    port.on('message', (e) => onMessage.fire(buffer_1.VSBuffer.wrap(e.data)));
                    port.on('close', () => {
                        onTerminate('renderer closed the MessagePort');
                    });
                    port.start();
                    resolve({
                        onMessage: onMessage.event,
                        send: message => port.postMessage(message.buffer)
                    });
                };
                process.parentPort.on('message', (e) => withPorts(e.ports));
            });
        }
        else if (extHostConnection.type === 2 /* ExtHostConnectionType.Socket */) {
            return new Promise((resolve, reject) => {
                let protocol = null;
                const timer = setTimeout(() => {
                    onTerminate('VSCODE_EXTHOST_IPC_SOCKET timeout');
                }, 60000);
                const reconnectionGraceTime = 10800000 /* ProtocolConstants.ReconnectionGraceTime */;
                const reconnectionShortGraceTime = 300000 /* ProtocolConstants.ReconnectionShortGraceTime */;
                const disconnectRunner1 = new async_1.ProcessTimeRunOnceScheduler(() => onTerminate('renderer disconnected for too long (1)'), reconnectionGraceTime);
                const disconnectRunner2 = new async_1.ProcessTimeRunOnceScheduler(() => onTerminate('renderer disconnected for too long (2)'), reconnectionShortGraceTime);
                process.on('message', (msg, handle) => {
                    if (msg && msg.type === 'VSCODE_EXTHOST_IPC_SOCKET') {
                        // Disable Nagle's algorithm. We also do this on the server process,
                        // but nodejs doesn't document if this option is transferred with the socket
                        handle.setNoDelay(true);
                        const initialDataChunk = buffer_1.VSBuffer.wrap(Buffer.from(msg.initialDataChunk, 'base64'));
                        let socket;
                        if (msg.skipWebSocketFrames) {
                            socket = new ipc_net_2.NodeSocket(handle, 'extHost-socket');
                        }
                        else {
                            const inflateBytes = buffer_1.VSBuffer.wrap(Buffer.from(msg.inflateBytes, 'base64'));
                            socket = new ipc_net_2.WebSocketNodeSocket(new ipc_net_2.NodeSocket(handle, 'extHost-socket'), msg.permessageDeflate, inflateBytes, false);
                        }
                        if (protocol) {
                            // reconnection case
                            disconnectRunner1.cancel();
                            disconnectRunner2.cancel();
                            protocol.beginAcceptReconnection(socket, initialDataChunk);
                            protocol.endAcceptReconnection();
                            protocol.sendResume();
                        }
                        else {
                            clearTimeout(timer);
                            protocol = new ipc_net_1.PersistentProtocol({ socket, initialChunk: initialDataChunk });
                            protocol.sendResume();
                            protocol.onDidDispose(() => onTerminate('renderer disconnected'));
                            resolve(protocol);
                            // Wait for rich client to reconnect
                            protocol.onSocketClose(() => {
                                // The socket has closed, let's give the renderer a certain amount of time to reconnect
                                disconnectRunner1.schedule();
                            });
                        }
                    }
                    if (msg && msg.type === 'VSCODE_EXTHOST_IPC_REDUCE_GRACE_TIME') {
                        if (disconnectRunner2.isScheduled()) {
                            // we are disconnected and already running the short reconnection timer
                            return;
                        }
                        if (disconnectRunner1.isScheduled()) {
                            // we are disconnected and running the long reconnection timer
                            disconnectRunner2.schedule();
                        }
                    }
                });
                // Now that we have managed to install a message listener, ask the other side to send us the socket
                const req = { type: 'VSCODE_EXTHOST_IPC_READY' };
                process.send?.(req);
            });
        }
        else {
            const pipeName = extHostConnection.pipeName;
            return new Promise((resolve, reject) => {
                const socket = net.createConnection(pipeName, () => {
                    socket.removeListener('error', reject);
                    const protocol = new ipc_net_1.PersistentProtocol({ socket: new ipc_net_2.NodeSocket(socket, 'extHost-renderer') });
                    protocol.sendResume();
                    resolve(protocol);
                });
                socket.once('error', reject);
                socket.on('close', () => {
                    onTerminate('renderer closed the socket');
                });
            });
        }
    }
    async function createExtHostProtocol() {
        const protocol = await _createExtHostProtocol();
        return new class {
            constructor() {
                this._onMessage = new ipc_net_1.BufferedEmitter();
                this.onMessage = this._onMessage.event;
                this._terminating = false;
                protocol.onMessage((msg) => {
                    if ((0, extensionHostProtocol_1.isMessageOfType)(msg, 2 /* MessageType.Terminate */)) {
                        this._terminating = true;
                        onTerminate('received terminate message from renderer');
                    }
                    else {
                        this._onMessage.fire(msg);
                    }
                });
            }
            send(msg) {
                if (!this._terminating) {
                    protocol.send(msg);
                }
            }
            async drain() {
                if (protocol.drain) {
                    return protocol.drain();
                }
            }
        };
    }
    function connectToRenderer(protocol) {
        return new Promise((c) => {
            // Listen init data message
            const first = protocol.onMessage(raw => {
                first.dispose();
                const initData = JSON.parse(raw.toString());
                const rendererCommit = initData.commit;
                const myCommit = product_1.default.commit;
                if (rendererCommit && myCommit) {
                    // Running in the built version where commits are defined
                    if (rendererCommit !== myCommit) {
                        nativeExit(55 /* ExtensionHostExitCode.VersionMismatch */);
                    }
                }
                if (initData.parentPid) {
                    // Kill oneself if one's parent dies. Much drama.
                    let epermErrors = 0;
                    setInterval(function () {
                        try {
                            process.kill(initData.parentPid, 0); // throws an exception if the main process doesn't exist anymore.
                            epermErrors = 0;
                        }
                        catch (e) {
                            if (e && e.code === 'EPERM') {
                                // Even if the parent process is still alive,
                                // some antivirus software can lead to an EPERM error to be thrown here.
                                // Let's terminate only if we get 3 consecutive EPERM errors.
                                epermErrors++;
                                if (epermErrors >= 3) {
                                    onTerminate(`parent process ${initData.parentPid} does not exist anymore (3 x EPERM): ${e.message} (code: ${e.code}) (errno: ${e.errno})`);
                                }
                            }
                            else {
                                onTerminate(`parent process ${initData.parentPid} does not exist anymore: ${e.message} (code: ${e.code}) (errno: ${e.errno})`);
                            }
                        }
                    }, 1000);
                    // In certain cases, the event loop can become busy and never yield
                    // e.g. while-true or process.nextTick endless loops
                    // So also use the native node module to do it from a separate thread
                    let watchdog;
                    try {
                        watchdog = globalThis._VSCODE_NODE_MODULES['native-watchdog'];
                        watchdog.start(initData.parentPid);
                    }
                    catch (err) {
                        // no problem...
                        (0, errors_1.onUnexpectedError)(err);
                    }
                }
                // Tell the outside that we are initialized
                protocol.send((0, extensionHostProtocol_1.createMessageOfType)(0 /* MessageType.Initialized */));
                c({ protocol, initData });
            });
            // Tell the outside that we are ready to receive messages
            protocol.send((0, extensionHostProtocol_1.createMessageOfType)(1 /* MessageType.Ready */));
        });
    }
    async function startExtensionHostProcess() {
        // Print a console message when rejection isn't handled within N seconds. For details:
        // see https://nodejs.org/api/process.html#process_event_unhandledrejection
        // and https://nodejs.org/api/process.html#process_event_rejectionhandled
        const unhandledPromises = [];
        process.on('unhandledRejection', (reason, promise) => {
            unhandledPromises.push(promise);
            setTimeout(() => {
                const idx = unhandledPromises.indexOf(promise);
                if (idx >= 0) {
                    promise.catch(e => {
                        unhandledPromises.splice(idx, 1);
                        if (!(0, errors_1.isCancellationError)(e)) {
                            console.warn(`rejected promise not handled within 1 second: ${e}`);
                            if (e && e.stack) {
                                console.warn(`stack trace: ${e.stack}`);
                            }
                            if (reason) {
                                (0, errors_1.onUnexpectedError)(reason);
                            }
                        }
                    });
                }
            }, 1000);
        });
        process.on('rejectionHandled', (promise) => {
            const idx = unhandledPromises.indexOf(promise);
            if (idx >= 0) {
                unhandledPromises.splice(idx, 1);
            }
        });
        // Print a console message when an exception isn't handled.
        process.on('uncaughtException', function (err) {
            if (!(0, errors_1.isSigPipeError)(err)) {
                (0, errors_1.onUnexpectedError)(err);
            }
        });
        performance.mark(`code/extHost/willConnectToRenderer`);
        const protocol = await createExtHostProtocol();
        performance.mark(`code/extHost/didConnectToRenderer`);
        const renderer = await connectToRenderer(protocol);
        performance.mark(`code/extHost/didWaitForInitData`);
        const { initData } = renderer;
        // setup things
        patchProcess(!!initData.environment.extensionTestsLocationURI); // to support other test frameworks like Jasmin that use process.exit (https://github.com/microsoft/vscode/issues/37708)
        initData.environment.useHostProxy = args.useHostProxy !== undefined ? args.useHostProxy !== 'false' : undefined;
        initData.environment.skipWorkspaceStorageLock = (0, editorOptions_1.boolean)(args.skipWorkspaceStorageLock, false);
        // host abstraction
        const hostUtils = new class NodeHost {
            constructor() {
                this.pid = process.pid;
            }
            exit(code) { nativeExit(code); }
            fsExists(path) { return pfs_1.Promises.exists(path); }
            fsRealpath(path) { return (0, extpath_1.realpath)(path); }
        };
        // Attempt to load uri transformer
        let uriTransformer = null;
        if (initData.remote.authority && args.transformURIs) {
            uriTransformer = (0, uriTransformer_1.createURITransformer)(initData.remote.authority);
        }
        const extensionHostMain = new extensionHostMain_1.ExtensionHostMain(renderer.protocol, initData, hostUtils, uriTransformer);
        // rewrite onTerminate-function to be a proper shutdown
        onTerminate = (reason) => extensionHostMain.terminate(reason);
    }
    startExtensionHostProcess().catch((err) => console.log(err));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdFByb2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvbm9kZS9leHRlbnNpb25Ib3N0UHJvY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtDaEcsa0VBQWtFO0lBQ2xFLCtFQUErRTtJQUMvRSxDQUFDLFNBQVMsaUJBQWlCO1FBQzFCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ2xELElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxrQkFBa0IsRUFBRSxDQUFDO2dCQUNoRCxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLENBQUMsRUFBRSxDQUFDO1lBQ0wsQ0FBQztRQUNGLENBQUM7SUFDRixDQUFDLENBQUMsRUFBRSxDQUFDO0lBRUwsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQzVDLE9BQU8sRUFBRTtZQUNSLGVBQWU7WUFDZiwwQkFBMEI7U0FDMUI7UUFDRCxNQUFNLEVBQUU7WUFDUCxjQUFjLENBQUMsK0JBQStCO1NBQzlDO0tBQ0QsQ0FBc0IsQ0FBQztJQUV4Qix5REFBeUQ7SUFDekQsZ0ZBQWdGO0lBQ2hGLDJFQUEyRTtJQUMzRSw0RUFBNEU7SUFDNUUscURBQXFEO0lBQ3JELENBQUM7UUFDQSxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsb0JBQW9CLENBQUMsTUFBYSxDQUFDO1FBQzdELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENB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