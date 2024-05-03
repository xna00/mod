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
define(["require", "exports", "crypto", "fs", "net", "perf_hooks", "url", "vs/base/common/amd", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/extpath", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/performance", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/node/osReleaseInfo", "vs/base/node/ports", "vs/base/node/unc", "vs/base/parts/ipc/common/ipc.net", "vs/base/parts/ipc/node/ipc.net", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/server/node/extensionHostConnection", "vs/server/node/remoteExtensionManagement", "vs/server/node/serverConnectionToken", "vs/server/node/serverEnvironmentService", "vs/server/node/serverServices", "vs/server/node/webClientServer"], function (require, exports, crypto, fs, net, perf_hooks_1, url, amd_1, buffer_1, errors_1, extpath_1, lifecycle_1, network_1, path_1, perf, platform, strings_1, uri_1, uuid_1, osReleaseInfo_1, ports_1, unc_1, ipc_net_1, ipc_net_2, configuration_1, instantiation_1, log_1, productService_1, telemetry_1, extensionHostConnection_1, remoteExtensionManagement_1, serverConnectionToken_1, serverEnvironmentService_1, serverServices_1, webClientServer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createServer = createServer;
    const SHUTDOWN_TIMEOUT = 5 * 60 * 1000;
    let RemoteExtensionHostAgentServer = class RemoteExtensionHostAgentServer extends lifecycle_1.Disposable {
        constructor(_socketServer, _connectionToken, _vsdaMod, hasWebClient, serverBasePath, _environmentService, _productService, _logService, _instantiationService) {
            super();
            this._socketServer = _socketServer;
            this._connectionToken = _connectionToken;
            this._vsdaMod = _vsdaMod;
            this._environmentService = _environmentService;
            this._productService = _productService;
            this._logService = _logService;
            this._instantiationService = _instantiationService;
            this._webEndpointOriginChecker = WebEndpointOriginChecker.create(this._productService);
            this._serverRootPath = (0, network_1.getServerRootPath)(_productService, serverBasePath);
            this._extHostConnections = Object.create(null);
            this._managementConnections = Object.create(null);
            this._allReconnectionTokens = new Set();
            this._webClientServer = (hasWebClient
                ? this._instantiationService.createInstance(webClientServer_1.WebClientServer, this._connectionToken, serverBasePath ?? '/', this._serverRootPath)
                : null);
            this._logService.info(`Extension host agent started.`);
            this._waitThenShutdown(true);
        }
        async handleRequest(req, res) {
            // Only serve GET requests
            if (req.method !== 'GET') {
                return (0, webClientServer_1.serveError)(req, res, 405, `Unsupported method ${req.method}`);
            }
            if (!req.url) {
                return (0, webClientServer_1.serveError)(req, res, 400, `Bad request.`);
            }
            const parsedUrl = url.parse(req.url, true);
            let pathname = parsedUrl.pathname;
            if (!pathname) {
                return (0, webClientServer_1.serveError)(req, res, 400, `Bad request.`);
            }
            // for now accept all paths, with or without server root path
            if (pathname.startsWith(this._serverRootPath) && pathname.charCodeAt(this._serverRootPath.length) === 47 /* CharCode.Slash */) {
                pathname = pathname.substring(this._serverRootPath.length);
            }
            // Version
            if (pathname === '/version') {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                return void res.end(this._productService.commit || '');
            }
            // Delay shutdown
            if (pathname === '/delay-shutdown') {
                this._delayShutdown();
                res.writeHead(200);
                return void res.end('OK');
            }
            if (!(0, serverConnectionToken_1.requestHasValidConnectionToken)(this._connectionToken, req, parsedUrl)) {
                // invalid connection token
                return (0, webClientServer_1.serveError)(req, res, 403, `Forbidden.`);
            }
            if (pathname === '/vscode-remote-resource') {
                // Handle HTTP requests for resources rendered in the rich client (images, fonts, etc.)
                // These resources could be files shipped with extensions or even workspace files.
                const desiredPath = parsedUrl.query['path'];
                if (typeof desiredPath !== 'string') {
                    return (0, webClientServer_1.serveError)(req, res, 400, `Bad request.`);
                }
                let filePath;
                try {
                    filePath = uri_1.URI.from({ scheme: network_1.Schemas.file, path: desiredPath }).fsPath;
                }
                catch (err) {
                    return (0, webClientServer_1.serveError)(req, res, 400, `Bad request.`);
                }
                const responseHeaders = Object.create(null);
                if (this._environmentService.isBuilt) {
                    if ((0, extpath_1.isEqualOrParent)(filePath, this._environmentService.builtinExtensionsPath, !platform.isLinux)
                        || (0, extpath_1.isEqualOrParent)(filePath, this._environmentService.extensionsPath, !platform.isLinux)) {
                        responseHeaders['Cache-Control'] = 'public, max-age=31536000';
                    }
                }
                // Allow cross origin requests from the web worker extension host
                responseHeaders['Vary'] = 'Origin';
                const requestOrigin = req.headers['origin'];
                if (requestOrigin && this._webEndpointOriginChecker.matches(requestOrigin)) {
                    responseHeaders['Access-Control-Allow-Origin'] = requestOrigin;
                }
                return (0, webClientServer_1.serveFile)(filePath, 1 /* CacheControl.ETAG */, this._logService, req, res, responseHeaders);
            }
            // workbench web UI
            if (this._webClientServer) {
                this._webClientServer.handle(req, res, parsedUrl);
                return;
            }
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return void res.end('Not found');
        }
        handleUpgrade(req, socket) {
            let reconnectionToken = (0, uuid_1.generateUuid)();
            let isReconnection = false;
            let skipWebSocketFrames = false;
            if (req.url) {
                const query = url.parse(req.url, true).query;
                if (typeof query.reconnectionToken === 'string') {
                    reconnectionToken = query.reconnectionToken;
                }
                if (query.reconnection === 'true') {
                    isReconnection = true;
                }
                if (query.skipWebSocketFrames === 'true') {
                    skipWebSocketFrames = true;
                }
            }
            if (req.headers['upgrade'] === undefined || req.headers['upgrade'].toLowerCase() !== 'websocket') {
                socket.end('HTTP/1.1 400 Bad Request');
                return;
            }
            // https://tools.ietf.org/html/rfc6455#section-4
            const requestNonce = req.headers['sec-websocket-key'];
            const hash = crypto.createHash('sha1'); // CodeQL [SM04514] SHA1 must be used here to respect the WebSocket protocol specification
            hash.update(requestNonce + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11');
            const responseNonce = hash.digest('base64');
            const responseHeaders = [
                `HTTP/1.1 101 Switching Protocols`,
                `Upgrade: websocket`,
                `Connection: Upgrade`,
                `Sec-WebSocket-Accept: ${responseNonce}`
            ];
            // See https://tools.ietf.org/html/rfc7692#page-12
            let permessageDeflate = false;
            if (!skipWebSocketFrames && !this._environmentService.args['disable-websocket-compression'] && req.headers['sec-websocket-extensions']) {
                const websocketExtensionOptions = Array.isArray(req.headers['sec-websocket-extensions']) ? req.headers['sec-websocket-extensions'] : [req.headers['sec-websocket-extensions']];
                for (const websocketExtensionOption of websocketExtensionOptions) {
                    if (/\b((server_max_window_bits)|(server_no_context_takeover)|(client_no_context_takeover))\b/.test(websocketExtensionOption)) {
                        // sorry, the server does not support zlib parameter tweaks
                        continue;
                    }
                    if (/\b(permessage-deflate)\b/.test(websocketExtensionOption)) {
                        permessageDeflate = true;
                        responseHeaders.push(`Sec-WebSocket-Extensions: permessage-deflate`);
                        break;
                    }
                    if (/\b(x-webkit-deflate-frame)\b/.test(websocketExtensionOption)) {
                        permessageDeflate = true;
                        responseHeaders.push(`Sec-WebSocket-Extensions: x-webkit-deflate-frame`);
                        break;
                    }
                }
            }
            socket.write(responseHeaders.join('\r\n') + '\r\n\r\n');
            // Never timeout this socket due to inactivity!
            socket.setTimeout(0);
            // Disable Nagle's algorithm
            socket.setNoDelay(true);
            // Finally!
            if (skipWebSocketFrames) {
                this._handleWebSocketConnection(new ipc_net_2.NodeSocket(socket, `server-connection-${reconnectionToken}`), isReconnection, reconnectionToken);
            }
            else {
                this._handleWebSocketConnection(new ipc_net_2.WebSocketNodeSocket(new ipc_net_2.NodeSocket(socket, `server-connection-${reconnectionToken}`), permessageDeflate, null, true), isReconnection, reconnectionToken);
            }
        }
        handleServerError(err) {
            this._logService.error(`Error occurred in server`);
            this._logService.error(err);
        }
        // Eventually cleanup
        _getRemoteAddress(socket) {
            let _socket;
            if (socket instanceof ipc_net_2.NodeSocket) {
                _socket = socket.socket;
            }
            else {
                _socket = socket.socket.socket;
            }
            return _socket.remoteAddress || `<unknown>`;
        }
        async _rejectWebSocketConnection(logPrefix, protocol, reason) {
            const socket = protocol.getSocket();
            this._logService.error(`${logPrefix} ${reason}.`);
            const errMessage = {
                type: 'error',
                reason: reason
            };
            protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(errMessage)));
            protocol.dispose();
            await socket.drain();
            socket.dispose();
        }
        /**
         * NOTE: Avoid using await in this method!
         * The problem is that await introduces a process.nextTick due to the implicit Promise.then
         * This can lead to some bytes being received and interpreted and a control message being emitted before the next listener has a chance to be registered.
         */
        _handleWebSocketConnection(socket, isReconnection, reconnectionToken) {
            const remoteAddress = this._getRemoteAddress(socket);
            const logPrefix = `[${remoteAddress}][${reconnectionToken.substr(0, 8)}]`;
            const protocol = new ipc_net_1.PersistentProtocol({ socket });
            const validator = this._vsdaMod ? new this._vsdaMod.validator() : null;
            const signer = this._vsdaMod ? new this._vsdaMod.signer() : null;
            let State;
            (function (State) {
                State[State["WaitingForAuth"] = 0] = "WaitingForAuth";
                State[State["WaitingForConnectionType"] = 1] = "WaitingForConnectionType";
                State[State["Done"] = 2] = "Done";
                State[State["Error"] = 3] = "Error";
            })(State || (State = {}));
            let state = 0 /* State.WaitingForAuth */;
            const rejectWebSocketConnection = (msg) => {
                state = 3 /* State.Error */;
                listener.dispose();
                this._rejectWebSocketConnection(logPrefix, protocol, msg);
            };
            const listener = protocol.onControlMessage((raw) => {
                if (state === 0 /* State.WaitingForAuth */) {
                    let msg1;
                    try {
                        msg1 = JSON.parse(raw.toString());
                    }
                    catch (err) {
                        return rejectWebSocketConnection(`Malformed first message`);
                    }
                    if (msg1.type !== 'auth') {
                        return rejectWebSocketConnection(`Invalid first message`);
                    }
                    if (this._connectionToken.type === 2 /* ServerConnectionTokenType.Mandatory */ && !this._connectionToken.validate(msg1.auth)) {
                        return rejectWebSocketConnection(`Unauthorized client refused: auth mismatch`);
                    }
                    // Send `sign` request
                    let signedData = (0, uuid_1.generateUuid)();
                    if (signer) {
                        try {
                            signedData = signer.sign(msg1.data);
                        }
                        catch (e) {
                        }
                    }
                    let someText = (0, uuid_1.generateUuid)();
                    if (validator) {
                        try {
                            someText = validator.createNewMessage(someText);
                        }
                        catch (e) {
                        }
                    }
                    const signRequest = {
                        type: 'sign',
                        data: someText,
                        signedData: signedData
                    };
                    protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(signRequest)));
                    state = 1 /* State.WaitingForConnectionType */;
                }
                else if (state === 1 /* State.WaitingForConnectionType */) {
                    let msg2;
                    try {
                        msg2 = JSON.parse(raw.toString());
                    }
                    catch (err) {
                        return rejectWebSocketConnection(`Malformed second message`);
                    }
                    if (msg2.type !== 'connectionType') {
                        return rejectWebSocketConnection(`Invalid second message`);
                    }
                    if (typeof msg2.signedData !== 'string') {
                        return rejectWebSocketConnection(`Invalid second message field type`);
                    }
                    const rendererCommit = msg2.commit;
                    const myCommit = this._productService.commit;
                    if (rendererCommit && myCommit) {
                        // Running in the built version where commits are defined
                        if (rendererCommit !== myCommit) {
                            return rejectWebSocketConnection(`Client refused: version mismatch`);
                        }
                    }
                    let valid = false;
                    if (!validator) {
                        valid = true;
                    }
                    else if (this._connectionToken.validate(msg2.signedData)) {
                        // web client
                        valid = true;
                    }
                    else {
                        try {
                            valid = validator.validate(msg2.signedData) === 'ok';
                        }
                        catch (e) {
                        }
                    }
                    if (!valid) {
                        if (this._environmentService.isBuilt) {
                            return rejectWebSocketConnection(`Unauthorized client refused`);
                        }
                        else {
                            this._logService.error(`${logPrefix} Unauthorized client handshake failed but we proceed because of dev mode.`);
                        }
                    }
                    // We have received a new connection.
                    // This indicates that the server owner has connectivity.
                    // Therefore we will shorten the reconnection grace period for disconnected connections!
                    for (const key in this._managementConnections) {
                        const managementConnection = this._managementConnections[key];
                        managementConnection.shortenReconnectionGraceTimeIfNecessary();
                    }
                    for (const key in this._extHostConnections) {
                        const extHostConnection = this._extHostConnections[key];
                        extHostConnection.shortenReconnectionGraceTimeIfNecessary();
                    }
                    state = 2 /* State.Done */;
                    listener.dispose();
                    this._handleConnectionType(remoteAddress, logPrefix, protocol, socket, isReconnection, reconnectionToken, msg2);
                }
            });
        }
        async _handleConnectionType(remoteAddress, _logPrefix, protocol, socket, isReconnection, reconnectionToken, msg) {
            const logPrefix = (msg.desiredConnectionType === 1 /* ConnectionType.Management */
                ? `${_logPrefix}[ManagementConnection]`
                : msg.desiredConnectionType === 2 /* ConnectionType.ExtensionHost */
                    ? `${_logPrefix}[ExtensionHostConnection]`
                    : _logPrefix);
            if (msg.desiredConnectionType === 1 /* ConnectionType.Management */) {
                // This should become a management connection
                if (isReconnection) {
                    // This is a reconnection
                    if (!this._managementConnections[reconnectionToken]) {
                        if (!this._allReconnectionTokens.has(reconnectionToken)) {
                            // This is an unknown reconnection token
                            return this._rejectWebSocketConnection(logPrefix, protocol, `Unknown reconnection token (never seen)`);
                        }
                        else {
                            // This is a connection that was seen in the past, but is no longer valid
                            return this._rejectWebSocketConnection(logPrefix, protocol, `Unknown reconnection token (seen before)`);
                        }
                    }
                    protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify({ type: 'ok' })));
                    const dataChunk = protocol.readEntireBuffer();
                    protocol.dispose();
                    this._managementConnections[reconnectionToken].acceptReconnection(remoteAddress, socket, dataChunk);
                }
                else {
                    // This is a fresh connection
                    if (this._managementConnections[reconnectionToken]) {
                        // Cannot have two concurrent connections using the same reconnection token
                        return this._rejectWebSocketConnection(logPrefix, protocol, `Duplicate reconnection token`);
                    }
                    protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify({ type: 'ok' })));
                    const con = new remoteExtensionManagement_1.ManagementConnection(this._logService, reconnectionToken, remoteAddress, protocol);
                    this._socketServer.acceptConnection(con.protocol, con.onClose);
                    this._managementConnections[reconnectionToken] = con;
                    this._allReconnectionTokens.add(reconnectionToken);
                    con.onClose(() => {
                        delete this._managementConnections[reconnectionToken];
                    });
                }
            }
            else if (msg.desiredConnectionType === 2 /* ConnectionType.ExtensionHost */) {
                // This should become an extension host connection
                const startParams0 = msg.args || { language: 'en' };
                const startParams = await this._updateWithFreeDebugPort(startParams0);
                if (startParams.port) {
                    this._logService.trace(`${logPrefix} - startParams debug port ${startParams.port}`);
                }
                this._logService.trace(`${logPrefix} - startParams language: ${startParams.language}`);
                this._logService.trace(`${logPrefix} - startParams env: ${JSON.stringify(startParams.env)}`);
                if (isReconnection) {
                    // This is a reconnection
                    if (!this._extHostConnections[reconnectionToken]) {
                        if (!this._allReconnectionTokens.has(reconnectionToken)) {
                            // This is an unknown reconnection token
                            return this._rejectWebSocketConnection(logPrefix, protocol, `Unknown reconnection token (never seen)`);
                        }
                        else {
                            // This is a connection that was seen in the past, but is no longer valid
                            return this._rejectWebSocketConnection(logPrefix, protocol, `Unknown reconnection token (seen before)`);
                        }
                    }
                    protocol.sendPause();
                    protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(startParams.port ? { debugPort: startParams.port } : {})));
                    const dataChunk = protocol.readEntireBuffer();
                    protocol.dispose();
                    this._extHostConnections[reconnectionToken].acceptReconnection(remoteAddress, socket, dataChunk);
                }
                else {
                    // This is a fresh connection
                    if (this._extHostConnections[reconnectionToken]) {
                        // Cannot have two concurrent connections using the same reconnection token
                        return this._rejectWebSocketConnection(logPrefix, protocol, `Duplicate reconnection token`);
                    }
                    protocol.sendPause();
                    protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(startParams.port ? { debugPort: startParams.port } : {})));
                    const dataChunk = protocol.readEntireBuffer();
                    protocol.dispose();
                    const con = this._instantiationService.createInstance(extensionHostConnection_1.ExtensionHostConnection, reconnectionToken, remoteAddress, socket, dataChunk);
                    this._extHostConnections[reconnectionToken] = con;
                    this._allReconnectionTokens.add(reconnectionToken);
                    con.onClose(() => {
                        delete this._extHostConnections[reconnectionToken];
                        this._onDidCloseExtHostConnection();
                    });
                    con.start(startParams);
                }
            }
            else if (msg.desiredConnectionType === 3 /* ConnectionType.Tunnel */) {
                const tunnelStartParams = msg.args;
                this._createTunnel(protocol, tunnelStartParams);
            }
            else {
                return this._rejectWebSocketConnection(logPrefix, protocol, `Unknown initial data received`);
            }
        }
        async _createTunnel(protocol, tunnelStartParams) {
            const remoteSocket = protocol.getSocket().socket;
            const dataChunk = protocol.readEntireBuffer();
            protocol.dispose();
            remoteSocket.pause();
            const localSocket = await this._connectTunnelSocket(tunnelStartParams.host, tunnelStartParams.port);
            if (dataChunk.byteLength > 0) {
                localSocket.write(dataChunk.buffer);
            }
            localSocket.on('end', () => remoteSocket.end());
            localSocket.on('close', () => remoteSocket.end());
            localSocket.on('error', () => remoteSocket.destroy());
            remoteSocket.on('end', () => localSocket.end());
            remoteSocket.on('close', () => localSocket.end());
            remoteSocket.on('error', () => localSocket.destroy());
            localSocket.pipe(remoteSocket);
            remoteSocket.pipe(localSocket);
        }
        _connectTunnelSocket(host, port) {
            return new Promise((c, e) => {
                const socket = net.createConnection({
                    host: host,
                    port: port,
                    autoSelectFamily: true
                }, () => {
                    socket.removeListener('error', e);
                    socket.pause();
                    c(socket);
                });
                socket.once('error', e);
            });
        }
        _updateWithFreeDebugPort(startParams) {
            if (typeof startParams.port === 'number') {
                return (0, ports_1.findFreePort)(startParams.port, 10 /* try 10 ports */, 5000 /* try up to 5 seconds */).then(freePort => {
                    startParams.port = freePort;
                    return startParams;
                });
            }
            // No port clear debug configuration.
            startParams.debugId = undefined;
            startParams.port = undefined;
            startParams.break = undefined;
            return Promise.resolve(startParams);
        }
        async _onDidCloseExtHostConnection() {
            if (!this._environmentService.args['enable-remote-auto-shutdown']) {
                return;
            }
            this._cancelShutdown();
            const hasActiveExtHosts = !!Object.keys(this._extHostConnections).length;
            if (!hasActiveExtHosts) {
                console.log('Last EH closed, waiting before shutting down');
                this._logService.info('Last EH closed, waiting before shutting down');
                this._waitThenShutdown();
            }
        }
        _waitThenShutdown(initial = false) {
            if (!this._environmentService.args['enable-remote-auto-shutdown']) {
                return;
            }
            if (this._environmentService.args['remote-auto-shutdown-without-delay'] && !initial) {
                this._shutdown();
            }
            else {
                this.shutdownTimer = setTimeout(() => {
                    this.shutdownTimer = undefined;
                    this._shutdown();
                }, SHUTDOWN_TIMEOUT);
            }
        }
        _shutdown() {
            const hasActiveExtHosts = !!Object.keys(this._extHostConnections).length;
            if (hasActiveExtHosts) {
                console.log('New EH opened, aborting shutdown');
                this._logService.info('New EH opened, aborting shutdown');
                return;
            }
            else {
                console.log('Last EH closed, shutting down');
                this._logService.info('Last EH closed, shutting down');
                this.dispose();
                process.exit(0);
            }
        }
        /**
         * If the server is in a shutdown timeout, cancel it and start over
         */
        _delayShutdown() {
            if (this.shutdownTimer) {
                console.log('Got delay-shutdown request while in shutdown timeout, delaying');
                this._logService.info('Got delay-shutdown request while in shutdown timeout, delaying');
                this._cancelShutdown();
                this._waitThenShutdown();
            }
        }
        _cancelShutdown() {
            if (this.shutdownTimer) {
                console.log('Cancelling previous shutdown timeout');
                this._logService.info('Cancelling previous shutdown timeout');
                clearTimeout(this.shutdownTimer);
                this.shutdownTimer = undefined;
            }
        }
    };
    RemoteExtensionHostAgentServer = __decorate([
        __param(5, serverEnvironmentService_1.IServerEnvironmentService),
        __param(6, productService_1.IProductService),
        __param(7, log_1.ILogService),
        __param(8, instantiation_1.IInstantiationService)
    ], RemoteExtensionHostAgentServer);
    async function createServer(address, args, REMOTE_DATA_FOLDER) {
        const connectionToken = await (0, serverConnectionToken_1.determineServerConnectionToken)(args);
        if (connectionToken instanceof serverConnectionToken_1.ServerConnectionTokenParseError) {
            console.warn(connectionToken.message);
            process.exit(1);
        }
        // setting up error handlers, first with console.error, then, once available, using the log service
        function initUnexpectedErrorHandler(handler) {
            (0, errors_1.setUnexpectedErrorHandler)(err => {
                // See https://github.com/microsoft/vscode-remote-release/issues/6481
                // In some circumstances, console.error will throw an asynchronous error. This asynchronous error
                // will end up here, and then it will be logged again, thus creating an endless asynchronous loop.
                // Here we try to break the loop by ignoring EPIPE errors that include our own unexpected error handler in the stack.
                if ((0, errors_1.isSigPipeError)(err) && err.stack && /unexpectedErrorHandler/.test(err.stack)) {
                    return;
                }
                handler(err);
            });
        }
        const unloggedErrors = [];
        initUnexpectedErrorHandler((error) => {
            unloggedErrors.push(error);
            console.error(error);
        });
        let didLogAboutSIGPIPE = false;
        process.on('SIGPIPE', () => {
            // See https://github.com/microsoft/vscode-remote-release/issues/6543
            // We would normally install a SIGPIPE listener in bootstrap.js
            // But in certain situations, the console itself can be in a broken pipe state
            // so logging SIGPIPE to the console will cause an infinite async loop
            if (!didLogAboutSIGPIPE) {
                didLogAboutSIGPIPE = true;
                (0, errors_1.onUnexpectedError)(new Error(`Unexpected SIGPIPE`));
            }
        });
        const disposables = new lifecycle_1.DisposableStore();
        const { socketServer, instantiationService } = await (0, serverServices_1.setupServerServices)(connectionToken, args, REMOTE_DATA_FOLDER, disposables);
        // Set the unexpected error handler after the services have been initialized, to avoid having
        // the telemetry service overwrite our handler
        instantiationService.invokeFunction((accessor) => {
            const logService = accessor.get(log_1.ILogService);
            unloggedErrors.forEach(error => logService.error(error));
            unloggedErrors.length = 0;
            initUnexpectedErrorHandler((error) => logService.error(error));
        });
        // On Windows, configure the UNC allow list based on settings
        instantiationService.invokeFunction((accessor) => {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            if (platform.isWindows) {
                if (configurationService.getValue('security.restrictUNCAccess') === false) {
                    (0, unc_1.disableUNCAccessRestrictions)();
                }
                else {
                    (0, unc_1.addUNCHostToAllowlist)(configurationService.getValue('security.allowedUNCHosts'));
                }
            }
        });
        //
        // On Windows, exit early with warning message to users about potential security issue
        // if there is node_modules folder under home drive or Users folder.
        //
        instantiationService.invokeFunction((accessor) => {
            const logService = accessor.get(log_1.ILogService);
            if (platform.isWindows && process.env.HOMEDRIVE && process.env.HOMEPATH) {
                const homeDirModulesPath = (0, path_1.join)(process.env.HOMEDRIVE, 'node_modules');
                const userDir = (0, path_1.dirname)((0, path_1.join)(process.env.HOMEDRIVE, process.env.HOMEPATH));
                const userDirModulesPath = (0, path_1.join)(userDir, 'node_modules');
                if (fs.existsSync(homeDirModulesPath) || fs.existsSync(userDirModulesPath)) {
                    const message = `

*
* !!!! Server terminated due to presence of CVE-2020-1416 !!!!
*
* Please remove the following directories and re-try
* ${homeDirModulesPath}
* ${userDirModulesPath}
*
* For more information on the vulnerability https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-1416
*

`;
                    logService.warn(message);
                    console.warn(message);
                    process.exit(0);
                }
            }
        });
        const vsdaMod = instantiationService.invokeFunction((accessor) => {
            const logService = accessor.get(log_1.ILogService);
            const hasVSDA = fs.existsSync((0, path_1.join)(network_1.FileAccess.asFileUri('').fsPath, '../node_modules/vsda'));
            if (hasVSDA) {
                try {
                    return globalThis._VSCODE_NODE_MODULES['vsda'];
                }
                catch (err) {
                    logService.error(err);
                }
            }
            return null;
        });
        let serverBasePath = args['server-base-path'];
        if (serverBasePath && !serverBasePath.startsWith('/')) {
            serverBasePath = `/${serverBasePath}`;
        }
        const hasWebClient = fs.existsSync(network_1.FileAccess.asFileUri('vs/code/browser/workbench/workbench.html').fsPath);
        if (hasWebClient && address && typeof address !== 'string') {
            // ships the web ui!
            const queryPart = (connectionToken.type !== 0 /* ServerConnectionTokenType.None */ ? `?${network_1.connectionTokenQueryName}=${connectionToken.value}` : '');
            console.log(`Web UI available at http://localhost${address.port === 80 ? '' : `:${address.port}`}${serverBasePath ?? ''}${queryPart}`);
        }
        const remoteExtensionHostAgentServer = instantiationService.createInstance(RemoteExtensionHostAgentServer, socketServer, connectionToken, vsdaMod, hasWebClient, serverBasePath);
        perf.mark('code/server/ready');
        const currentTime = perf_hooks_1.performance.now();
        const vscodeServerStartTime = global.vscodeServerStartTime;
        const vscodeServerListenTime = global.vscodeServerListenTime;
        const vscodeServerCodeLoadedTime = global.vscodeServerCodeLoadedTime;
        instantiationService.invokeFunction(async (accessor) => {
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            telemetryService.publicLog2('serverStart', {
                startTime: vscodeServerStartTime,
                startedTime: vscodeServerListenTime,
                codeLoadedTime: vscodeServerCodeLoadedTime,
                readyTime: currentTime
            });
            if (platform.isLinux) {
                const logService = accessor.get(log_1.ILogService);
                const releaseInfo = await (0, osReleaseInfo_1.getOSReleaseInfo)(logService.error.bind(logService));
                if (releaseInfo) {
                    telemetryService.publicLog2('serverPlatformInfo', {
                        platformId: releaseInfo.id,
                        platformVersionId: releaseInfo.version_id,
                        platformIdLike: releaseInfo.id_like
                    });
                }
            }
        });
        if (args['print-startup-performance']) {
            const stats = amd_1.LoaderStats.get();
            let output = '';
            output += '\n\n### Load AMD-module\n';
            output += amd_1.LoaderStats.toMarkdownTable(['Module', 'Duration'], stats.amdLoad);
            output += '\n\n### Load commonjs-module\n';
            output += amd_1.LoaderStats.toMarkdownTable(['Module', 'Duration'], stats.nodeRequire);
            output += '\n\n### Invoke AMD-module factory\n';
            output += amd_1.LoaderStats.toMarkdownTable(['Module', 'Duration'], stats.amdInvoke);
            output += '\n\n### Invoke commonjs-module\n';
            output += amd_1.LoaderStats.toMarkdownTable(['Module', 'Duration'], stats.nodeEval);
            output += `Start-up time: ${vscodeServerListenTime - vscodeServerStartTime}\n`;
            output += `Code loading time: ${vscodeServerCodeLoadedTime - vscodeServerStartTime}\n`;
            output += `Initialized time: ${currentTime - vscodeServerStartTime}\n`;
            output += `\n`;
            console.log(output);
        }
        return remoteExtensionHostAgentServer;
    }
    class WebEndpointOriginChecker {
        static create(productService) {
            const webEndpointUrlTemplate = productService.webEndpointUrlTemplate;
            const commit = productService.commit;
            const quality = productService.quality;
            if (!webEndpointUrlTemplate || !commit || !quality) {
                return new WebEndpointOriginChecker(null);
            }
            const uuid = (0, uuid_1.generateUuid)();
            const exampleUrl = new URL(webEndpointUrlTemplate
                .replace('{{uuid}}', uuid)
                .replace('{{commit}}', commit)
                .replace('{{quality}}', quality));
            const exampleOrigin = exampleUrl.origin;
            const originRegExpSource = ((0, strings_1.escapeRegExpCharacters)(exampleOrigin)
                .replace(uuid, '[a-zA-Z0-9\\-]+'));
            try {
                const originRegExp = (0, strings_1.createRegExp)(`^${originRegExpSource}$`, true, { matchCase: false });
                return new WebEndpointOriginChecker(originRegExp);
            }
            catch (err) {
                return new WebEndpointOriginChecker(null);
            }
        }
        constructor(_originRegExp) {
            this._originRegExp = _originRegExp;
        }
        matches(origin) {
            if (!this._originRegExp) {
                return false;
            }
            return this._originRegExp.test(origin);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRXh0ZW5zaW9uSG9zdEFnZW50U2VydmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9zZXJ2ZXIvbm9kZS9yZW1vdGVFeHRlbnNpb25Ib3N0QWdlbnRTZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUF1cEJoRyxvQ0F1TUM7SUF0ekJELE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7SUFnQnZDLElBQU0sOEJBQThCLEdBQXBDLE1BQU0sOEJBQStCLFNBQVEsc0JBQVU7UUFZdEQsWUFDa0IsYUFBeUQsRUFDekQsZ0JBQXVDLEVBQ3ZDLFFBQTRCLEVBQzdDLFlBQXFCLEVBQ3JCLGNBQWtDLEVBQ1AsbUJBQStELEVBQ3pFLGVBQWlELEVBQ3JELFdBQXlDLEVBQy9CLHFCQUE2RDtZQUVwRixLQUFLLEVBQUUsQ0FBQztZQVZTLGtCQUFhLEdBQWIsYUFBYSxDQUE0QztZQUN6RCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQXVCO1lBQ3ZDLGFBQVEsR0FBUixRQUFRLENBQW9CO1lBR0Qsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUEyQjtZQUN4RCxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDcEMsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDZCwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBZnBFLDhCQUF5QixHQUFHLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7WUFtQmxHLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBQSwyQkFBaUIsRUFBQyxlQUFlLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDMUUsSUFBSSxDQUFDLG1CQUFtQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0Ms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