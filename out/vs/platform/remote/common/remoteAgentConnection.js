/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/performance", "vs/base/common/stopwatch", "vs/base/common/uuid", "vs/base/parts/ipc/common/ipc.net", "vs/platform/remote/common/remoteAuthorityResolver"], function (require, exports, async_1, buffer_1, cancellation_1, errors_1, event_1, lifecycle_1, network_1, performance, stopwatch_1, uuid_1, ipc_net_1, remoteAuthorityResolver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostPersistentConnection = exports.ManagementPersistentConnection = exports.PersistentConnection = exports.ReconnectionPermanentFailureEvent = exports.ConnectionGainEvent = exports.ReconnectionRunningEvent = exports.ReconnectionWaitEvent = exports.ConnectionLostEvent = exports.PersistentConnectionEventType = exports.ConnectionType = void 0;
    exports.connectRemoteAgentManagement = connectRemoteAgentManagement;
    exports.connectRemoteAgentExtensionHost = connectRemoteAgentExtensionHost;
    exports.connectRemoteAgentTunnel = connectRemoteAgentTunnel;
    const RECONNECT_TIMEOUT = 30 * 1000 /* 30s */;
    var ConnectionType;
    (function (ConnectionType) {
        ConnectionType[ConnectionType["Management"] = 1] = "Management";
        ConnectionType[ConnectionType["ExtensionHost"] = 2] = "ExtensionHost";
        ConnectionType[ConnectionType["Tunnel"] = 3] = "Tunnel";
    })(ConnectionType || (exports.ConnectionType = ConnectionType = {}));
    function connectionTypeToString(connectionType) {
        switch (connectionType) {
            case 1 /* ConnectionType.Management */:
                return 'Management';
            case 2 /* ConnectionType.ExtensionHost */:
                return 'ExtensionHost';
            case 3 /* ConnectionType.Tunnel */:
                return 'Tunnel';
        }
    }
    function createTimeoutCancellation(millis) {
        const source = new cancellation_1.CancellationTokenSource();
        setTimeout(() => source.cancel(), millis);
        return source.token;
    }
    function combineTimeoutCancellation(a, b) {
        if (a.isCancellationRequested || b.isCancellationRequested) {
            return cancellation_1.CancellationToken.Cancelled;
        }
        const source = new cancellation_1.CancellationTokenSource();
        a.onCancellationRequested(() => source.cancel());
        b.onCancellationRequested(() => source.cancel());
        return source.token;
    }
    class PromiseWithTimeout {
        get didTimeout() {
            return (this._state === 'timedout');
        }
        constructor(timeoutCancellationToken) {
            this._state = 'pending';
            this._disposables = new lifecycle_1.DisposableStore();
            ({ promise: this.promise, resolve: this._resolvePromise, reject: this._rejectPromise } = (0, async_1.promiseWithResolvers)());
            if (timeoutCancellationToken.isCancellationRequested) {
                this._timeout();
            }
            else {
                this._disposables.add(timeoutCancellationToken.onCancellationRequested(() => this._timeout()));
            }
        }
        registerDisposable(disposable) {
            if (this._state === 'pending') {
                this._disposables.add(disposable);
            }
            else {
                disposable.dispose();
            }
        }
        _timeout() {
            if (this._state !== 'pending') {
                return;
            }
            this._disposables.dispose();
            this._state = 'timedout';
            this._rejectPromise(this._createTimeoutError());
        }
        _createTimeoutError() {
            const err = new Error('Time limit reached');
            err.code = 'ETIMEDOUT';
            err.syscall = 'connect';
            return err;
        }
        resolve(value) {
            if (this._state !== 'pending') {
                return;
            }
            this._disposables.dispose();
            this._state = 'resolved';
            this._resolvePromise(value);
        }
        reject(err) {
            if (this._state !== 'pending') {
                return;
            }
            this._disposables.dispose();
            this._state = 'rejected';
            this._rejectPromise(err);
        }
    }
    function readOneControlMessage(protocol, timeoutCancellationToken) {
        const result = new PromiseWithTimeout(timeoutCancellationToken);
        result.registerDisposable(protocol.onControlMessage(raw => {
            const msg = JSON.parse(raw.toString());
            const error = getErrorFromMessage(msg);
            if (error) {
                result.reject(error);
            }
            else {
                result.resolve(msg);
            }
        }));
        return result.promise;
    }
    function createSocket(logService, remoteSocketFactoryService, connectTo, path, query, debugConnectionType, debugLabel, timeoutCancellationToken) {
        const result = new PromiseWithTimeout(timeoutCancellationToken);
        const sw = stopwatch_1.StopWatch.create(false);
        logService.info(`Creating a socket (${debugLabel})...`);
        performance.mark(`code/willCreateSocket/${debugConnectionType}`);
        remoteSocketFactoryService.connect(connectTo, path, query, debugLabel).then((socket) => {
            if (result.didTimeout) {
                performance.mark(`code/didCreateSocketError/${debugConnectionType}`);
                logService.info(`Creating a socket (${debugLabel}) finished after ${sw.elapsed()} ms, but this is too late and has timed out already.`);
                socket?.dispose();
            }
            else {
                performance.mark(`code/didCreateSocketOK/${debugConnectionType}`);
                logService.info(`Creating a socket (${debugLabel}) was successful after ${sw.elapsed()} ms.`);
                result.resolve(socket);
            }
        }, (err) => {
            performance.mark(`code/didCreateSocketError/${debugConnectionType}`);
            logService.info(`Creating a socket (${debugLabel}) returned an error after ${sw.elapsed()} ms.`);
            logService.error(err);
            result.reject(err);
        });
        return result.promise;
    }
    function raceWithTimeoutCancellation(promise, timeoutCancellationToken) {
        const result = new PromiseWithTimeout(timeoutCancellationToken);
        promise.then((res) => {
            if (!result.didTimeout) {
                result.resolve(res);
            }
        }, (err) => {
            if (!result.didTimeout) {
                result.reject(err);
            }
        });
        return result.promise;
    }
    async function connectToRemoteExtensionHostAgent(options, connectionType, args, timeoutCancellationToken) {
        const logPrefix = connectLogPrefix(options, connectionType);
        options.logService.trace(`${logPrefix} 1/6. invoking socketFactory.connect().`);
        let socket;
        try {
            socket = await createSocket(options.logService, options.remoteSocketFactoryService, options.connectTo, network_1.RemoteAuthorities.getServerRootPath(), `reconnectionToken=${options.reconnectionToken}&reconnection=${options.reconnectionProtocol ? 'true' : 'false'}`, connectionTypeToString(connectionType), `renderer-${connectionTypeToString(connectionType)}-${options.reconnectionToken}`, timeoutCancellationToken);
        }
        catch (error) {
            options.logService.error(`${logPrefix} socketFactory.connect() failed or timed out. Error:`);
            options.logService.error(error);
            throw error;
        }
        options.logService.trace(`${logPrefix} 2/6. socketFactory.connect() was successful.`);
        let protocol;
        let ownsProtocol;
        if (options.reconnectionProtocol) {
            options.reconnectionProtocol.beginAcceptReconnection(socket, null);
            protocol = options.reconnectionProtocol;
            ownsProtocol = false;
        }
        else {
            protocol = new ipc_net_1.PersistentProtocol({ socket });
            ownsProtocol = true;
        }
        options.logService.trace(`${logPrefix} 3/6. sending AuthRequest control message.`);
        const message = await raceWithTimeoutCancellation(options.signService.createNewMessage((0, uuid_1.generateUuid)()), timeoutCancellationToken);
        const authRequest = {
            type: 'auth',
            auth: options.connectionToken || '00000000000000000000',
            data: message.data
        };
        protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(authRequest)));
        try {
            const msg = await readOneControlMessage(protocol, combineTimeoutCancellation(timeoutCancellationToken, createTimeoutCancellation(10000)));
            if (msg.type !== 'sign' || typeof msg.data !== 'string') {
                const error = new Error('Unexpected handshake message');
                error.code = 'VSCODE_CONNECTION_ERROR';
                throw error;
            }
            options.logService.trace(`${logPrefix} 4/6. received SignRequest control message.`);
            const isValid = await raceWithTimeoutCancellation(options.signService.validate(message, msg.signedData), timeoutCancellationToken);
            if (!isValid) {
                const error = new Error('Refused to connect to unsupported server');
                error.code = 'VSCODE_CONNECTION_ERROR';
                throw error;
            }
            const signed = await raceWithTimeoutCancellation(options.signService.sign(msg.data), timeoutCancellationToken);
            const connTypeRequest = {
                type: 'connectionType',
                commit: options.commit,
                signedData: signed,
                desiredConnectionType: connectionType
            };
            if (args) {
                connTypeRequest.args = args;
            }
            options.logService.trace(`${logPrefix} 5/6. sending ConnectionTypeRequest control message.`);
            protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(connTypeRequest)));
            return { protocol, ownsProtocol };
        }
        catch (error) {
            if (error && error.code === 'ETIMEDOUT') {
                options.logService.error(`${logPrefix} the handshake timed out. Error:`);
                options.logService.error(error);
            }
            if (error && error.code === 'VSCODE_CONNECTION_ERROR') {
                options.logService.error(`${logPrefix} received error control message when negotiating connection. Error:`);
                options.logService.error(error);
            }
            if (ownsProtocol) {
                safeDisposeProtocolAndSocket(protocol);
            }
            throw error;
        }
    }
    async function connectToRemoteExtensionHostAgentAndReadOneMessage(options, connectionType, args, timeoutCancellationToken) {
        const startTime = Date.now();
        const logPrefix = connectLogPrefix(options, connectionType);
        const { protocol, ownsProtocol } = await connectToRemoteExtensionHostAgent(options, connectionType, args, timeoutCancellationToken);
        const result = new PromiseWithTimeout(timeoutCancellationToken);
        result.registerDisposable(protocol.onControlMessage(raw => {
            const msg = JSON.parse(raw.toString());
            const error = getErrorFromMessage(msg);
            if (error) {
                options.logService.error(`${logPrefix} received error control message when negotiating connection. Error:`);
                options.logService.error(error);
                if (ownsProtocol) {
                    safeDisposeProtocolAndSocket(protocol);
                }
                result.reject(error);
            }
            else {
                options.reconnectionProtocol?.endAcceptReconnection();
                options.logService.trace(`${logPrefix} 6/6. handshake finished, connection is up and running after ${logElapsed(startTime)}!`);
                result.resolve({ protocol, firstMessage: msg });
            }
        }));
        return result.promise;
    }
    async function doConnectRemoteAgentManagement(options, timeoutCancellationToken) {
        const { protocol } = await connectToRemoteExtensionHostAgentAndReadOneMessage(options, 1 /* ConnectionType.Management */, undefined, timeoutCancellationToken);
        return { protocol };
    }
    async function doConnectRemoteAgentExtensionHost(options, startArguments, timeoutCancellationToken) {
        const { protocol, firstMessage } = await connectToRemoteExtensionHostAgentAndReadOneMessage(options, 2 /* ConnectionType.ExtensionHost */, startArguments, timeoutCancellationToken);
        const debugPort = firstMessage && firstMessage.debugPort;
        return { protocol, debugPort };
    }
    async function doConnectRemoteAgentTunnel(options, startParams, timeoutCancellationToken) {
        const startTime = Date.now();
        const logPrefix = connectLogPrefix(options, 3 /* ConnectionType.Tunnel */);
        const { protocol } = await connectToRemoteExtensionHostAgent(options, 3 /* ConnectionType.Tunnel */, startParams, timeoutCancellationToken);
        options.logService.trace(`${logPrefix} 6/6. handshake finished, connection is up and running after ${logElapsed(startTime)}!`);
        return protocol;
    }
    async function resolveConnectionOptions(options, reconnectionToken, reconnectionProtocol) {
        const { connectTo, connectionToken } = await options.addressProvider.getAddress();
        return {
            commit: options.commit,
            quality: options.quality,
            connectTo,
            connectionToken: connectionToken,
            reconnectionToken: reconnectionToken,
            reconnectionProtocol: reconnectionProtocol,
            remoteSocketFactoryService: options.remoteSocketFactoryService,
            signService: options.signService,
            logService: options.logService
        };
    }
    async function connectRemoteAgentManagement(options, remoteAuthority, clientId) {
        return createInitialConnection(options, async (simpleOptions) => {
            const { protocol } = await doConnectRemoteAgentManagement(simpleOptions, cancellation_1.CancellationToken.None);
            return new ManagementPersistentConnection(options, remoteAuthority, clientId, simpleOptions.reconnectionToken, protocol);
        });
    }
    async function connectRemoteAgentExtensionHost(options, startArguments) {
        return createInitialConnection(options, async (simpleOptions) => {
            const { protocol, debugPort } = await doConnectRemoteAgentExtensionHost(simpleOptions, startArguments, cancellation_1.CancellationToken.None);
            return new ExtensionHostPersistentConnection(options, startArguments, simpleOptions.reconnectionToken, protocol, debugPort);
        });
    }
    /**
     * Will attempt to connect 5 times. If it fails 5 consecutive times, it will give up.
     */
    async function createInitialConnection(options, connectionFactory) {
        const MAX_ATTEMPTS = 5;
        for (let attempt = 1;; attempt++) {
            try {
                const reconnectionToken = (0, uuid_1.generateUuid)();
                const simpleOptions = await resolveConnectionOptions(options, reconnectionToken, null);
                const result = await connectionFactory(simpleOptions);
                return result;
            }
            catch (err) {
                if (attempt < MAX_ATTEMPTS) {
                    options.logService.error(`[remote-connection][attempt ${attempt}] An error occurred in initial connection! Will retry... Error:`);
                    options.logService.error(err);
                }
                else {
                    options.logService.error(`[remote-connection][attempt ${attempt}]  An error occurred in initial connection! It will be treated as a permanent error. Error:`);
                    options.logService.error(err);
                    PersistentConnection.triggerPermanentFailure(0, 0, remoteAuthorityResolver_1.RemoteAuthorityResolverError.isHandled(err));
                    throw err;
                }
            }
        }
    }
    async function connectRemoteAgentTunnel(options, tunnelRemoteHost, tunnelRemotePort) {
        const simpleOptions = await resolveConnectionOptions(options, (0, uuid_1.generateUuid)(), null);
        const protocol = await doConnectRemoteAgentTunnel(simpleOptions, { host: tunnelRemoteHost, port: tunnelRemotePort }, cancellation_1.CancellationToken.None);
        return protocol;
    }
    function sleep(seconds) {
        return (0, async_1.createCancelablePromise)(token => {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(resolve, seconds * 1000);
                token.onCancellationRequested(() => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
        });
    }
    var PersistentConnectionEventType;
    (function (PersistentConnectionEventType) {
        PersistentConnectionEventType[PersistentConnectionEventType["ConnectionLost"] = 0] = "ConnectionLost";
        PersistentConnectionEventType[PersistentConnectionEventType["ReconnectionWait"] = 1] = "ReconnectionWait";
        PersistentConnectionEventType[PersistentConnectionEventType["ReconnectionRunning"] = 2] = "ReconnectionRunning";
        PersistentConnectionEventType[PersistentConnectionEventType["ReconnectionPermanentFailure"] = 3] = "ReconnectionPermanentFailure";
        PersistentConnectionEventType[PersistentConnectionEventType["ConnectionGain"] = 4] = "ConnectionGain";
    })(PersistentConnectionEventType || (exports.PersistentConnectionEventType = PersistentConnectionEventType = {}));
    class ConnectionLostEvent {
        constructor(reconnectionToken, millisSinceLastIncomingData) {
            this.reconnectionToken = reconnectionToken;
            this.millisSinceLastIncomingData = millisSinceLastIncomingData;
            this.type = 0 /* PersistentConnectionEventType.ConnectionLost */;
        }
    }
    exports.ConnectionLostEvent = ConnectionLostEvent;
    class ReconnectionWaitEvent {
        constructor(reconnectionToken, millisSinceLastIncomingData, durationSeconds, cancellableTimer) {
            this.reconnectionToken = reconnectionToken;
            this.millisSinceLastIncomingData = millisSinceLastIncomingData;
            this.durationSeconds = durationSeconds;
            this.cancellableTimer = cancellableTimer;
            this.type = 1 /* PersistentConnectionEventType.ReconnectionWait */;
        }
        skipWait() {
            this.cancellableTimer.cancel();
        }
    }
    exports.ReconnectionWaitEvent = ReconnectionWaitEvent;
    class ReconnectionRunningEvent {
        constructor(reconnectionToken, millisSinceLastIncomingData, attempt) {
            this.reconnectionToken = reconnectionToken;
            this.millisSinceLastIncomingData = millisSinceLastIncomingData;
            this.attempt = attempt;
            this.type = 2 /* PersistentConnectionEventType.ReconnectionRunning */;
        }
    }
    exports.ReconnectionRunningEvent = ReconnectionRunningEvent;
    class ConnectionGainEvent {
        constructor(reconnectionToken, millisSinceLastIncomingData, attempt) {
            this.reconnectionToken = reconnectionToken;
            this.millisSinceLastIncomingData = millisSinceLastIncomingData;
            this.attempt = attempt;
            this.type = 4 /* PersistentConnectionEventType.ConnectionGain */;
        }
    }
    exports.ConnectionGainEvent = ConnectionGainEvent;
    class ReconnectionPermanentFailureEvent {
        constructor(reconnectionToken, millisSinceLastIncomingData, attempt, handled) {
            this.reconnectionToken = reconnectionToken;
            this.millisSinceLastIncomingData = millisSinceLastIncomingData;
            this.attempt = attempt;
            this.handled = handled;
            this.type = 3 /* PersistentConnectionEventType.ReconnectionPermanentFailure */;
        }
    }
    exports.ReconnectionPermanentFailureEvent = ReconnectionPermanentFailureEvent;
    class PersistentConnection extends lifecycle_1.Disposable {
        static triggerPermanentFailure(millisSinceLastIncomingData, attempt, handled) {
            this._permanentFailure = true;
            this._permanentFailureMillisSinceLastIncomingData = millisSinceLastIncomingData;
            this._permanentFailureAttempt = attempt;
            this._permanentFailureHandled = handled;
            this._instances.forEach(instance => instance._gotoPermanentFailure(this._permanentFailureMillisSinceLastIncomingData, this._permanentFailureAttempt, this._permanentFailureHandled));
        }
        static debugTriggerReconnection() {
            this._instances.forEach(instance => instance._beginReconnecting());
        }
        static debugPauseSocketWriting() {
            this._instances.forEach(instance => instance._pauseSocketWriting());
        }
        static { this._permanentFailure = false; }
        static { this._permanentFailureMillisSinceLastIncomingData = 0; }
        static { this._permanentFailureAttempt = 0; }
        static { this._permanentFailureHandled = false; }
        static { this._instances = []; }
        get _isPermanentFailure() {
            return this._permanentFailure || PersistentConnection._permanentFailure;
        }
        constructor(_connectionType, _options, reconnectionToken, protocol, _reconnectionFailureIsFatal) {
            super();
            this._connectionType = _connectionType;
            this._options = _options;
            this.reconnectionToken = reconnectionToken;
            this.protocol = protocol;
            this._reconnectionFailureIsFatal = _reconnectionFailureIsFatal;
            this._onDidStateChange = this._register(new event_1.Emitter());
            this.onDidStateChange = this._onDidStateChange.event;
            this._permanentFailure = false;
            this._isReconnecting = false;
            this._isDisposed = false;
            this._onDidStateChange.fire(new ConnectionGainEvent(this.reconnectionToken, 0, 0));
            this._register(protocol.onSocketClose((e) => {
                const logPrefix = commonLogPrefix(this._connectionType, this.reconnectionToken, true);
                if (!e) {
                    this._options.logService.info(`${logPrefix} received socket close event.`);
                }
                else if (e.type === 0 /* SocketCloseEventType.NodeSocketCloseEvent */) {
                    this._options.logService.info(`${logPrefix} received socket close event (hadError: ${e.hadError}).`);
                    if (e.error) {
                        this._options.logService.error(e.error);
                    }
                }
                else {
                    this._options.logService.info(`${logPrefix} received socket close event (wasClean: ${e.wasClean}, code: ${e.code}, reason: ${e.reason}).`);
                    if (e.event) {
                        this._options.logService.error(e.event);
                    }
                }
                this._beginReconnecting();
            }));
            this._register(protocol.onSocketTimeout((e) => {
                const logPrefix = commonLogPrefix(this._connectionType, this.reconnectionToken, true);
                this._options.logService.info(`${logPrefix} received socket timeout event (unacknowledgedMsgCount: ${e.unacknowledgedMsgCount}, timeSinceOldestUnacknowledgedMsg: ${e.timeSinceOldestUnacknowledgedMsg}, timeSinceLastReceivedSomeData: ${e.timeSinceLastReceivedSomeData}).`);
                this._beginReconnecting();
            }));
            PersistentConnection._instances.push(this);
            this._register((0, lifecycle_1.toDisposable)(() => {
                const myIndex = PersistentConnection._instances.indexOf(this);
                if (myIndex >= 0) {
                    PersistentConnection._instances.splice(myIndex, 1);
                }
            }));
            if (this._isPermanentFailure) {
                this._gotoPermanentFailure(PersistentConnection._permanentFailureMillisSinceLastIncomingData, PersistentConnection._permanentFailureAttempt, PersistentConnection._permanentFailureHandled);
            }
        }
        dispose() {
            super.dispose();
            this._isDisposed = true;
        }
        async _beginReconnecting() {
            // Only have one reconnection loop active at a time.
            if (this._isReconnecting) {
                return;
            }
            try {
                this._isReconnecting = true;
                await this._runReconnectingLoop();
            }
            finally {
                this._isReconnecting = false;
            }
        }
        async _runReconnectingLoop() {
            if (this._isPermanentFailure || this._isDisposed) {
                // no more attempts!
                return;
            }
            const logPrefix = commonLogPrefix(this._connectionType, this.reconnectionToken, true);
            this._options.logService.info(`${logPrefix} starting reconnecting loop. You can get more information with the trace log level.`);
            this._onDidStateChange.fire(new ConnectionLostEvent(this.reconnectionToken, this.protocol.getMillisSinceLastIncomingData()));
            const TIMES = [0, 5, 5, 10, 10, 10, 10, 10, 30];
            let attempt = -1;
            do {
                attempt++;
                const waitTime = (attempt < TIMES.length ? TIMES[attempt] : TIMES[TIMES.length - 1]);
                try {
                    if (waitTime > 0) {
                        const sleepPromise = sleep(waitTime);
                        this._onDidStateChange.fire(new ReconnectionWaitEvent(this.reconnectionToken, this.protocol.getMillisSinceLastIncomingData(), waitTime, sleepPromise));
                        this._options.logService.info(`${logPrefix} waiting for ${waitTime} seconds before reconnecting...`);
                        try {
                            await sleepPromise;
                        }
                        catch { } // User canceled timer
                    }
                    if (this._isPermanentFailure) {
                        this._options.logService.error(`${logPrefix} permanent failure occurred while running the reconnecting loop.`);
                        break;
                    }
                    // connection was lost, let's try to re-establish it
                    this._onDidStateChange.fire(new ReconnectionRunningEvent(this.reconnectionToken, this.protocol.getMillisSinceLastIncomingData(), attempt + 1));
                    this._options.logService.info(`${logPrefix} resolving connection...`);
                    const simpleOptions = await resolveConnectionOptions(this._options, this.reconnectionToken, this.protocol);
                    this._options.logService.info(`${logPrefix} connecting to ${simpleOptions.connectTo}...`);
                    await this._reconnect(simpleOptions, createTimeoutCancellation(RECONNECT_TIMEOUT));
                    this._options.logService.info(`${logPrefix} reconnected!`);
                    this._onDidStateChange.fire(new ConnectionGainEvent(this.reconnectionToken, this.protocol.getMillisSinceLastIncomingData(), attempt + 1));
                    break;
                }
                catch (err) {
                    if (err.code === 'VSCODE_CONNECTION_ERROR') {
                        this._options.logService.error(`${logPrefix} A permanent error occurred in the reconnecting loop! Will give up now! Error:`);
                        this._options.logService.error(err);
                        this._onReconnectionPermanentFailure(this.protocol.getMillisSinceLastIncomingData(), attempt + 1, false);
                        break;
                    }
                    if (attempt > 360) {
                        // ReconnectionGraceTime is 3hrs, with 30s between attempts that yields a maximum of 360 attempts
                        this._options.logService.error(`${logPrefix} An error occurred while reconnecting, but it will be treated as a permanent error because the reconnection grace time has expired! Will give up now! Error:`);
                        this._options.logService.error(err);
                        this._onReconnectionPermanentFailure(this.protocol.getMillisSinceLastIncomingData(), attempt + 1, false);
                        break;
                    }
                    if (remoteAuthorityResolver_1.RemoteAuthorityResolverError.isTemporarilyNotAvailable(err)) {
                        this._options.logService.info(`${logPrefix} A temporarily not available error occurred while trying to reconnect, will try again...`);
                        this._options.logService.trace(err);
                        // try again!
                        continue;
                    }
                    if ((err.code === 'ETIMEDOUT' || err.code === 'ENETUNREACH' || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') && err.syscall === 'connect') {
                        this._options.logService.info(`${logPrefix} A network error occurred while trying to reconnect, will try again...`);
                        this._options.logService.trace(err);
                        // try again!
                        continue;
                    }
                    if ((0, errors_1.isCancellationError)(err)) {
                        this._options.logService.info(`${logPrefix} A promise cancelation error occurred while trying to reconnect, will try again...`);
                        this._options.logService.trace(err);
                        // try again!
                        continue;
                    }
                    if (err instanceof remoteAuthorityResolver_1.RemoteAuthorityResolverError) {
                        this._options.logService.error(`${logPrefix} A RemoteAuthorityResolverError occurred while trying to reconnect. Will give up now! Error:`);
                        this._options.logService.error(err);
                        this._onReconnectionPermanentFailure(this.protocol.getMillisSinceLastIncomingData(), attempt + 1, remoteAuthorityResolver_1.RemoteAuthorityResolverError.isHandled(err));
                        break;
                    }
                    this._options.logService.error(`${logPrefix} An unknown error occurred while trying to reconnect, since this is an unknown case, it will be treated as a permanent error! Will give up now! Error:`);
                    this._options.logService.error(err);
                    this._onReconnectionPermanentFailure(this.protocol.getMillisSinceLastIncomingData(), attempt + 1, false);
                    break;
                }
            } while (!this._isPermanentFailure && !this._isDisposed);
        }
        _onReconnectionPermanentFailure(millisSinceLastIncomingData, attempt, handled) {
            if (this._reconnectionFailureIsFatal) {
                PersistentConnection.triggerPermanentFailure(millisSinceLastIncomingData, attempt, handled);
            }
            else {
                this._gotoPermanentFailure(millisSinceLastIncomingData, attempt, handled);
            }
        }
        _gotoPermanentFailure(millisSinceLastIncomingData, attempt, handled) {
            this._onDidStateChange.fire(new ReconnectionPermanentFailureEvent(this.reconnectionToken, millisSinceLastIncomingData, attempt, handled));
            safeDisposeProtocolAndSocket(this.protocol);
        }
        _pauseSocketWriting() {
            this.protocol.pauseSocketWriting();
        }
    }
    exports.PersistentConnection = PersistentConnection;
    class ManagementPersistentConnection extends PersistentConnection {
        constructor(options, remoteAuthority, clientId, reconnectionToken, protocol) {
            super(1 /* ConnectionType.Management */, options, reconnectionToken, protocol, /*reconnectionFailureIsFatal*/ true);
            this.client = this._register(new ipc_net_1.Client(protocol, {
                remoteAuthority: remoteAuthority,
                clientId: clientId
            }, options.ipcLogger));
        }
        async _reconnect(options, timeoutCancellationToken) {
            await doConnectRemoteAgentManagement(options, timeoutCancellationToken);
        }
    }
    exports.ManagementPersistentConnection = ManagementPersistentConnection;
    class ExtensionHostPersistentConnection extends PersistentConnection {
        constructor(options, startArguments, reconnectionToken, protocol, debugPort) {
            super(2 /* ConnectionType.ExtensionHost */, options, reconnectionToken, protocol, /*reconnectionFailureIsFatal*/ false);
            this._startArguments = startArguments;
            this.debugPort = debugPort;
        }
        async _reconnect(options, timeoutCancellationToken) {
            await doConnectRemoteAgentExtensionHost(options, this._startArguments, timeoutCancellationToken);
        }
    }
    exports.ExtensionHostPersistentConnection = ExtensionHostPersistentConnection;
    function safeDisposeProtocolAndSocket(protocol) {
        try {
            protocol.acceptDisconnect();
            const socket = protocol.getSocket();
            protocol.dispose();
            socket.dispose();
        }
        catch (err) {
            (0, errors_1.onUnexpectedError)(err);
        }
    }
    function getErrorFromMessage(msg) {
        if (msg && msg.type === 'error') {
            const error = new Error(`Connection error: ${msg.reason}`);
            error.code = 'VSCODE_CONNECTION_ERROR';
            return error;
        }
        return null;
    }
    function stringRightPad(str, len) {
        while (str.length < len) {
            str += ' ';
        }
        return str;
    }
    function _commonLogPrefix(connectionType, reconnectionToken) {
        return `[remote-connection][${stringRightPad(connectionTypeToString(connectionType), 13)}][${reconnectionToken.substr(0, 5)}…]`;
    }
    function commonLogPrefix(connectionType, reconnectionToken, isReconnect) {
        return `${_commonLogPrefix(connectionType, reconnectionToken)}[${isReconnect ? 'reconnect' : 'initial'}]`;
    }
    function connectLogPrefix(options, connectionType) {
        return `${commonLogPrefix(connectionType, options.reconnectionToken, !!options.reconnectionProtocol)}[${options.connectTo}]`;
    }
    function logElapsed(startTime) {
        return `${Date.now() - startTime} ms`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQWdlbnRDb25uZWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9yZW1vdGUvY29tbW9uL3JlbW90ZUFnZW50Q29ubmVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEwWmhHLG9FQVFDO0lBRUQsMEVBUUM7SUE0QkQsNERBSUM7SUF4YkQsTUFBTSxpQkFBaUIsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUU5QyxJQUFrQixjQUlqQjtJQUpELFdBQWtCLGNBQWM7UUFDL0IsK0RBQWMsQ0FBQTtRQUNkLHFFQUFpQixDQUFBO1FBQ2pCLHVEQUFVLENBQUE7SUFDWCxDQUFDLEVBSmlCLGNBQWMsOEJBQWQsY0FBYyxRQUkvQjtJQUVELFNBQVMsc0JBQXNCLENBQUMsY0FBOEI7UUFDN0QsUUFBUSxjQUFjLEVBQUUsQ0FBQztZQUN4QjtnQkFDQyxPQUFPLFlBQVksQ0FBQztZQUNyQjtnQkFDQyxPQUFPLGVBQWUsQ0FBQztZQUN4QjtnQkFDQyxPQUFPLFFBQVEsQ0FBQztRQUNsQixDQUFDO0lBQ0YsQ0FBQztJQThDRCxTQUFTLHlCQUF5QixDQUFDLE1BQWM7UUFDaEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxzQ0FBdUIsRUFBRSxDQUFDO1FBQzdDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUMsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxTQUFTLDBCQUEwQixDQUFDLENBQW9CLEVBQUUsQ0FBb0I7UUFDN0UsSUFBSSxDQUFDLENBQUMsdUJBQXVCLElBQUksQ0FBQyxDQUFDLHVCQUF1QixFQUFFLENBQUM7WUFDNUQsT0FBTyxnQ0FBaUIsQ0FBQyxT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