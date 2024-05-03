/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc"], function (require, exports, buffer_1, event_1, lifecycle_1, ipc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PersistentProtocol = exports.BufferedEmitter = exports.Client = exports.Protocol = exports.ProtocolConstants = exports.ChunkStream = exports.SocketCloseEventType = exports.SocketDiagnostics = exports.SocketDiagnosticsEventType = void 0;
    var SocketDiagnosticsEventType;
    (function (SocketDiagnosticsEventType) {
        SocketDiagnosticsEventType["Created"] = "created";
        SocketDiagnosticsEventType["Read"] = "read";
        SocketDiagnosticsEventType["Write"] = "write";
        SocketDiagnosticsEventType["Open"] = "open";
        SocketDiagnosticsEventType["Error"] = "error";
        SocketDiagnosticsEventType["Close"] = "close";
        SocketDiagnosticsEventType["BrowserWebSocketBlobReceived"] = "browserWebSocketBlobReceived";
        SocketDiagnosticsEventType["NodeEndReceived"] = "nodeEndReceived";
        SocketDiagnosticsEventType["NodeEndSent"] = "nodeEndSent";
        SocketDiagnosticsEventType["NodeDrainBegin"] = "nodeDrainBegin";
        SocketDiagnosticsEventType["NodeDrainEnd"] = "nodeDrainEnd";
        SocketDiagnosticsEventType["zlibInflateError"] = "zlibInflateError";
        SocketDiagnosticsEventType["zlibInflateData"] = "zlibInflateData";
        SocketDiagnosticsEventType["zlibInflateInitialWrite"] = "zlibInflateInitialWrite";
        SocketDiagnosticsEventType["zlibInflateInitialFlushFired"] = "zlibInflateInitialFlushFired";
        SocketDiagnosticsEventType["zlibInflateWrite"] = "zlibInflateWrite";
        SocketDiagnosticsEventType["zlibInflateFlushFired"] = "zlibInflateFlushFired";
        SocketDiagnosticsEventType["zlibDeflateError"] = "zlibDeflateError";
        SocketDiagnosticsEventType["zlibDeflateData"] = "zlibDeflateData";
        SocketDiagnosticsEventType["zlibDeflateWrite"] = "zlibDeflateWrite";
        SocketDiagnosticsEventType["zlibDeflateFlushFired"] = "zlibDeflateFlushFired";
        SocketDiagnosticsEventType["WebSocketNodeSocketWrite"] = "webSocketNodeSocketWrite";
        SocketDiagnosticsEventType["WebSocketNodeSocketPeekedHeader"] = "webSocketNodeSocketPeekedHeader";
        SocketDiagnosticsEventType["WebSocketNodeSocketReadHeader"] = "webSocketNodeSocketReadHeader";
        SocketDiagnosticsEventType["WebSocketNodeSocketReadData"] = "webSocketNodeSocketReadData";
        SocketDiagnosticsEventType["WebSocketNodeSocketUnmaskedData"] = "webSocketNodeSocketUnmaskedData";
        SocketDiagnosticsEventType["WebSocketNodeSocketDrainBegin"] = "webSocketNodeSocketDrainBegin";
        SocketDiagnosticsEventType["WebSocketNodeSocketDrainEnd"] = "webSocketNodeSocketDrainEnd";
        SocketDiagnosticsEventType["ProtocolHeaderRead"] = "protocolHeaderRead";
        SocketDiagnosticsEventType["ProtocolMessageRead"] = "protocolMessageRead";
        SocketDiagnosticsEventType["ProtocolHeaderWrite"] = "protocolHeaderWrite";
        SocketDiagnosticsEventType["ProtocolMessageWrite"] = "protocolMessageWrite";
        SocketDiagnosticsEventType["ProtocolWrite"] = "protocolWrite";
    })(SocketDiagnosticsEventType || (exports.SocketDiagnosticsEventType = SocketDiagnosticsEventType = {}));
    var SocketDiagnostics;
    (function (SocketDiagnostics) {
        SocketDiagnostics.enableDiagnostics = false;
        SocketDiagnostics.records = [];
        const socketIds = new WeakMap();
        let lastUsedSocketId = 0;
        function getSocketId(nativeObject, label) {
            if (!socketIds.has(nativeObject)) {
                const id = String(++lastUsedSocketId);
                socketIds.set(nativeObject, id);
            }
            return socketIds.get(nativeObject);
        }
        function traceSocketEvent(nativeObject, socketDebugLabel, type, data) {
            if (!SocketDiagnostics.enableDiagnostics) {
                return;
            }
            const id = getSocketId(nativeObject, socketDebugLabel);
            if (data instanceof buffer_1.VSBuffer || data instanceof Uint8Array || data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
                const copiedData = buffer_1.VSBuffer.alloc(data.byteLength);
                copiedData.set(data);
                SocketDiagnostics.records.push({ timestamp: Date.now(), id, label: socketDebugLabel, type, buff: copiedData });
            }
            else {
                // data is a custom object
                SocketDiagnostics.records.push({ timestamp: Date.now(), id, label: socketDebugLabel, type, data: data });
            }
        }
        SocketDiagnostics.traceSocketEvent = traceSocketEvent;
    })(SocketDiagnostics || (exports.SocketDiagnostics = SocketDiagnostics = {}));
    var SocketCloseEventType;
    (function (SocketCloseEventType) {
        SocketCloseEventType[SocketCloseEventType["NodeSocketCloseEvent"] = 0] = "NodeSocketCloseEvent";
        SocketCloseEventType[SocketCloseEventType["WebSocketCloseEvent"] = 1] = "WebSocketCloseEvent";
    })(SocketCloseEventType || (exports.SocketCloseEventType = SocketCloseEventType = {}));
    let emptyBuffer = null;
    function getEmptyBuffer() {
        if (!emptyBuffer) {
            emptyBuffer = buffer_1.VSBuffer.alloc(0);
        }
        return emptyBuffer;
    }
    class ChunkStream {
        get byteLength() {
            return this._totalLength;
        }
        constructor() {
            this._chunks = [];
            this._totalLength = 0;
        }
        acceptChunk(buff) {
            this._chunks.push(buff);
            this._totalLength += buff.byteLength;
        }
        read(byteCount) {
            return this._read(byteCount, true);
        }
        peek(byteCount) {
            return this._read(byteCount, false);
        }
        _read(byteCount, advance) {
            if (byteCount === 0) {
                return getEmptyBuffer();
            }
            if (byteCount > this._totalLength) {
                throw new Error(`Cannot read so many bytes!`);
            }
            if (this._chunks[0].byteLength === byteCount) {
                // super fast path, precisely first chunk must be returned
                const result = this._chunks[0];
                if (advance) {
                    this._chunks.shift();
                    this._totalLength -= byteCount;
                }
                return result;
            }
            if (this._chunks[0].byteLength > byteCount) {
                // fast path, the reading is entirely within the first chunk
                const result = this._chunks[0].slice(0, byteCount);
                if (advance) {
                    this._chunks[0] = this._chunks[0].slice(byteCount);
                    this._totalLength -= byteCount;
                }
                return result;
            }
            const result = buffer_1.VSBuffer.alloc(byteCount);
            let resultOffset = 0;
            let chunkIndex = 0;
            while (byteCount > 0) {
                const chunk = this._chunks[chunkIndex];
                if (chunk.byteLength > byteCount) {
                    // this chunk will survive
                    const chunkPart = chunk.slice(0, byteCount);
                    result.set(chunkPart, resultOffset);
                    resultOffset += byteCount;
                    if (advance) {
                        this._chunks[chunkIndex] = chunk.slice(byteCount);
                        this._totalLength -= byteCount;
                    }
                    byteCount -= byteCount;
                }
                else {
                    // this chunk will be entirely read
                    result.set(chunk, resultOffset);
                    resultOffset += chunk.byteLength;
                    if (advance) {
                        this._chunks.shift();
                        this._totalLength -= chunk.byteLength;
                    }
                    else {
                        chunkIndex++;
                    }
                    byteCount -= chunk.byteLength;
                }
            }
            return result;
        }
    }
    exports.ChunkStream = ChunkStream;
    var ProtocolMessageType;
    (function (ProtocolMessageType) {
        ProtocolMessageType[ProtocolMessageType["None"] = 0] = "None";
        ProtocolMessageType[ProtocolMessageType["Regular"] = 1] = "Regular";
        ProtocolMessageType[ProtocolMessageType["Control"] = 2] = "Control";
        ProtocolMessageType[ProtocolMessageType["Ack"] = 3] = "Ack";
        ProtocolMessageType[ProtocolMessageType["Disconnect"] = 5] = "Disconnect";
        ProtocolMessageType[ProtocolMessageType["ReplayRequest"] = 6] = "ReplayRequest";
        ProtocolMessageType[ProtocolMessageType["Pause"] = 7] = "Pause";
        ProtocolMessageType[ProtocolMessageType["Resume"] = 8] = "Resume";
        ProtocolMessageType[ProtocolMessageType["KeepAlive"] = 9] = "KeepAlive";
    })(ProtocolMessageType || (ProtocolMessageType = {}));
    function protocolMessageTypeToString(messageType) {
        switch (messageType) {
            case 0 /* ProtocolMessageType.None */: return 'None';
            case 1 /* ProtocolMessageType.Regular */: return 'Regular';
            case 2 /* ProtocolMessageType.Control */: return 'Control';
            case 3 /* ProtocolMessageType.Ack */: return 'Ack';
            case 5 /* ProtocolMessageType.Disconnect */: return 'Disconnect';
            case 6 /* ProtocolMessageType.ReplayRequest */: return 'ReplayRequest';
            case 7 /* ProtocolMessageType.Pause */: return 'PauseWriting';
            case 8 /* ProtocolMessageType.Resume */: return 'ResumeWriting';
            case 9 /* ProtocolMessageType.KeepAlive */: return 'KeepAlive';
        }
    }
    var ProtocolConstants;
    (function (ProtocolConstants) {
        ProtocolConstants[ProtocolConstants["HeaderLength"] = 13] = "HeaderLength";
        /**
         * Send an Acknowledge message at most 2 seconds later...
         */
        ProtocolConstants[ProtocolConstants["AcknowledgeTime"] = 2000] = "AcknowledgeTime";
        /**
         * If there is a sent message that has been unacknowledged for 20 seconds,
         * and we didn't see any incoming server data in the past 20 seconds,
         * then consider the connection has timed out.
         */
        ProtocolConstants[ProtocolConstants["TimeoutTime"] = 20000] = "TimeoutTime";
        /**
         * If there is no reconnection within this time-frame, consider the connection permanently closed...
         */
        ProtocolConstants[ProtocolConstants["ReconnectionGraceTime"] = 10800000] = "ReconnectionGraceTime";
        /**
         * Maximal grace time between the first and the last reconnection...
         */
        ProtocolConstants[ProtocolConstants["ReconnectionShortGraceTime"] = 300000] = "ReconnectionShortGraceTime";
        /**
         * Send a message every 5 seconds to avoid that the connection is closed by the OS.
         */
        ProtocolConstants[ProtocolConstants["KeepAliveSendTime"] = 5000] = "KeepAliveSendTime";
    })(ProtocolConstants || (exports.ProtocolConstants = ProtocolConstants = {}));
    class ProtocolMessage {
        constructor(type, id, ack, data) {
            this.type = type;
            this.id = id;
            this.ack = ack;
            this.data = data;
            this.writtenTime = 0;
        }
        get size() {
            return this.data.byteLength;
        }
    }
    class ProtocolReader extends lifecycle_1.Disposable {
        constructor(socket) {
            super();
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._state = {
                readHead: true,
                readLen: 13 /* ProtocolConstants.HeaderLength */,
                messageType: 0 /* ProtocolMessageType.None */,
                id: 0,
                ack: 0
            };
            this._socket = socket;
            this._isDisposed = false;
            this._incomingData = new ChunkStream();
            this._register(this._socket.onData(data => this.acceptChunk(data)));
            this.lastReadTime = Date.now();
        }
        acceptChunk(data) {
            if (!data || data.byteLength === 0) {
                return;
            }
            this.lastReadTime = Date.now();
            this._incomingData.acceptChunk(data);
            while (this._incomingData.byteLength >= this._state.readLen) {
                const buff = this._incomingData.read(this._state.readLen);
                if (this._state.readHead) {
                    // buff is the header
                    // save new state => next time will read the body
                    this._state.readHead = false;
                    this._state.readLen = buff.readUInt32BE(9);
                    this._state.messageType = buff.readUInt8(0);
                    this._state.id = buff.readUInt32BE(1);
                    this._state.ack = buff.readUInt32BE(5);
                    this._socket.traceSocketEvent("protocolHeaderRead" /* SocketDiagnosticsEventType.ProtocolHeaderRead */, { messageType: protocolMessageTypeToString(this._state.messageType), id: this._state.id, ack: this._state.ack, messageSize: this._state.readLen });
                }
                else {
                    // buff is the body
                    const messageType = this._state.messageType;
                    const id = this._state.id;
                    const ack = this._state.ack;
                    // save new state => next time will read the header
                    this._state.readHead = true;
                    this._state.readLen = 13 /* ProtocolConstants.HeaderLength */;
                    this._state.messageType = 0 /* ProtocolMessageType.None */;
                    this._state.id = 0;
                    this._state.ack = 0;
                    this._socket.traceSocketEvent("protocolMessageRead" /* SocketDiagnosticsEventType.ProtocolMessageRead */, buff);
                    this._onMessage.fire(new ProtocolMessage(messageType, id, ack, buff));
                    if (this._isDisposed) {
                        // check if an event listener lead to our disposal
                        break;
                    }
                }
            }
        }
        readEntireBuffer() {
            return this._incomingData.read(this._incomingData.byteLength);
        }
        dispose() {
            this._isDisposed = true;
            super.dispose();
        }
    }
    class ProtocolWriter {
        constructor(socket) {
            this._writeNowTimeout = null;
            this._isDisposed = false;
            this._isPaused = false;
            this._socket = socket;
            this._data = [];
            this._totalLength = 0;
            this.lastWriteTime = 0;
        }
        dispose() {
            try {
                this.flush();
            }
            catch (err) {
                // ignore error, since the socket could be already closed
            }
            this._isDisposed = true;
        }
        drain() {
            this.flush();
            return this._socket.drain();
        }
        flush() {
            // flush
            this._writeNow();
        }
        pause() {
            this._isPaused = true;
        }
        resume() {
            this._isPaused = false;
            this._scheduleWriting();
        }
        write(msg) {
            if (this._isDisposed) {
                // ignore: there could be left-over promises which complete and then
                // decide to write a response, etc...
                return;
            }
            msg.writtenTime = Date.now();
            this.lastWriteTime = Date.now();
            const header = buffer_1.VSBuffer.alloc(13 /* ProtocolConstants.HeaderLength */);
            header.writeUInt8(msg.type, 0);
            header.writeUInt32BE(msg.id, 1);
            header.writeUInt32BE(msg.ack, 5);
            header.writeUInt32BE(msg.data.byteLength, 9);
            this._socket.traceSocketEvent("protocolHeaderWrite" /* SocketDiagnosticsEventType.ProtocolHeaderWrite */, { messageType: protocolMessageTypeToString(msg.type), id: msg.id, ack: msg.ack, messageSize: msg.data.byteLength });
            this._socket.traceSocketEvent("protocolMessageWrite" /* SocketDiagnosticsEventType.ProtocolMessageWrite */, msg.data);
            this._writeSoon(header, msg.data);
        }
        _bufferAdd(head, body) {
            const wasEmpty = this._totalLength === 0;
            this._data.push(head, body);
            this._totalLength += head.byteLength + body.byteLength;
            return wasEmpty;
        }
        _bufferTake() {
            const ret = buffer_1.VSBuffer.concat(this._data, this._totalLength);
            this._data.length = 0;
            this._totalLength = 0;
            return ret;
        }
        _writeSoon(header, data) {
            if (this._bufferAdd(header, data)) {
                this._scheduleWriting();
            }
        }
        _scheduleWriting() {
            if (this._writeNowTimeout) {
                return;
            }
            this._writeNowTimeout = setTimeout(() => {
                this._writeNowTimeout = null;
                this._writeNow();
            });
        }
        _writeNow() {
            if (this._totalLength === 0) {
                return;
            }
            if (this._isPaused) {
                return;
            }
            const data = this._bufferTake();
            this._socket.traceSocketEvent("protocolWrite" /* SocketDiagnosticsEventType.ProtocolWrite */, { byteLength: data.byteLength });
            this._socket.write(data);
        }
    }
    /**
     * A message has the following format:
     * ```
     *     /-------------------------------|------\
     *     |             HEADER            |      |
     *     |-------------------------------| DATA |
     *     | TYPE | ID | ACK | DATA_LENGTH |      |
     *     \-------------------------------|------/
     * ```
     * The header is 9 bytes and consists of:
     *  - TYPE is 1 byte (ProtocolMessageType) - the message type
     *  - ID is 4 bytes (u32be) - the message id (can be 0 to indicate to be ignored)
     *  - ACK is 4 bytes (u32be) - the acknowledged message id (can be 0 to indicate to be ignored)
     *  - DATA_LENGTH is 4 bytes (u32be) - the length in bytes of DATA
     *
     * Only Regular messages are counted, other messages are not counted, nor acknowledged.
     */
    class Protocol extends lifecycle_1.Disposable {
        constructor(socket) {
            super();
            this._onMessage = new event_1.Emitter();
            this.onMessage = this._onMessage.event;
            this._onDidDispose = new event_1.Emitter();
            this.onDidDispose = this._onDidDispose.event;
            this._socket = socket;
            this._socketWriter = this._register(new ProtocolWriter(this._socket));
            this._socketReader = this._register(new ProtocolReader(this._socket));
            this._register(this._socketReader.onMessage((msg) => {
                if (msg.type === 1 /* ProtocolMessageType.Regular */) {
                    this._onMessage.fire(msg.data);
                }
            }));
            this._register(this._socket.onClose(() => this._onDidDispose.fire()));
        }
        drain() {
            return this._socketWriter.drain();
        }
        getSocket() {
            return this._socket;
        }
        sendDisconnect() {
            // Nothing to do...
        }
        send(buffer) {
            this._socketWriter.write(new ProtocolMessage(1 /* ProtocolMessageType.Regular */, 0, 0, buffer));
        }
    }
    exports.Protocol = Protocol;
    class Client extends ipc_1.IPCClient {
        static fromSocket(socket, id) {
            return new Client(new Protocol(socket), id);
        }
        get onDidDispose() { return this.protocol.onDidDispose; }
        constructor(protocol, id, ipcLogger = null) {
            super(protocol, id, ipcLogger);
            this.protocol = protocol;
        }
        dispose() {
            super.dispose();
            const socket = this.protocol.getSocket();
            this.protocol.sendDisconnect();
            this.protocol.dispose();
            socket.end();
        }
    }
    exports.Client = Client;
    /**
     * Will ensure no messages are lost if there are no event listeners.
     */
    class BufferedEmitter {
        constructor() {
            this._hasListeners = false;
            this._isDeliveringMessages = false;
            this._bufferedMessages = [];
            this._emitter = new event_1.Emitter({
                onWillAddFirstListener: () => {
                    this._hasListeners = true;
                    // it is important to deliver these messages after this call, but before
                    // other messages have a chance to be received (to guarantee in order delivery)
                    // that's why we're using here queueMicrotask and not other types of timeouts
                    queueMicrotask(() => this._deliverMessages());
                },
                onDidRemoveLastListener: () => {
                    this._hasListeners = false;
                }
            });
            this.event = this._emitter.event;
        }
        _deliverMessages() {
            if (this._isDeliveringMessages) {
                return;
            }
            this._isDeliveringMessages = true;
            while (this._hasListeners && this._bufferedMessages.length > 0) {
                this._emitter.fire(this._bufferedMessages.shift());
            }
            this._isDeliveringMessages = false;
        }
        fire(event) {
            if (this._hasListeners) {
                if (this._bufferedMessages.length > 0) {
                    this._bufferedMessages.push(event);
                }
                else {
                    this._emitter.fire(event);
                }
            }
            else {
                this._bufferedMessages.push(event);
            }
        }
        flushBuffer() {
            this._bufferedMessages = [];
        }
    }
    exports.BufferedEmitter = BufferedEmitter;
    class QueueElement {
        constructor(data) {
            this.data = data;
            this.next = null;
        }
    }
    class Queue {
        constructor() {
            this._first = null;
            this._last = null;
        }
        length() {
            let result = 0;
            let current = this._first;
            while (current) {
                current = current.next;
                result++;
            }
            return result;
        }
        peek() {
            if (!this._first) {
                return null;
            }
            return this._first.data;
        }
        toArray() {
            const result = [];
            let resultLen = 0;
            let it = this._first;
            while (it) {
                result[resultLen++] = it.data;
                it = it.next;
            }
            return result;
        }
        pop() {
            if (!this._first) {
                return;
            }
            if (this._first === this._last) {
                this._first = null;
                this._last = null;
                return;
            }
            this._first = this._first.next;
        }
        push(item) {
            const element = new QueueElement(item);
            if (!this._first) {
                this._first = element;
                this._last = element;
                return;
            }
            this._last.next = element;
            this._last = element;
        }
    }
    class LoadEstimator {
        static { this._HISTORY_LENGTH = 10; }
        static { this._INSTANCE = null; }
        static getInstance() {
            if (!LoadEstimator._INSTANCE) {
                LoadEstimator._INSTANCE = new LoadEstimator();
            }
            return LoadEstimator._INSTANCE;
        }
        constructor() {
            this.lastRuns = [];
            const now = Date.now();
            for (let i = 0; i < LoadEstimator._HISTORY_LENGTH; i++) {
                this.lastRuns[i] = now - 1000 * i;
            }
            setInterval(() => {
                for (let i = LoadEstimator._HISTORY_LENGTH; i >= 1; i--) {
                    this.lastRuns[i] = this.lastRuns[i - 1];
                }
                this.lastRuns[0] = Date.now();
            }, 1000);
        }
        /**
         * returns an estimative number, from 0 (low load) to 1 (high load)
         */
        load() {
            const now = Date.now();
            const historyLimit = (1 + LoadEstimator._HISTORY_LENGTH) * 1000;
            let score = 0;
            for (let i = 0; i < LoadEstimator._HISTORY_LENGTH; i++) {
                if (now - this.lastRuns[i] <= historyLimit) {
                    score++;
                }
            }
            return 1 - score / LoadEstimator._HISTORY_LENGTH;
        }
        hasHighLoad() {
            return this.load() >= 0.5;
        }
    }
    /**
     * Same as Protocol, but will actually track messages and acks.
     * Moreover, it will ensure no messages are lost if there are no event listeners.
     */
    class PersistentProtocol {
        get unacknowledgedCount() {
            return this._outgoingMsgId - this._outgoingAckId;
        }
        constructor(opts) {
            this._onControlMessage = new BufferedEmitter();
            this.onControlMessage = this._onControlMessage.event;
            this._onMessage = new BufferedEmitter();
            this.onMessage = this._onMessage.event;
            this._onDidDispose = new BufferedEmitter();
            this.onDidDispose = this._onDidDispose.event;
            this._onSocketClose = new BufferedEmitter();
            this.onSocketClose = this._onSocketClose.event;
            this._onSocketTimeout = new BufferedEmitter();
            this.onSocketTimeout = this._onSocketTimeout.event;
            this._loadEstimator = opts.loadEstimator ?? LoadEstimator.getInstance();
            this._shouldSendKeepAlive = opts.sendKeepAlive ?? true;
            this._isReconnecting = false;
            this._outgoingUnackMsg = new Queue();
            this._outgoingMsgId = 0;
            this._outgoingAckId = 0;
            this._outgoingAckTimeout = null;
            this._incomingMsgId = 0;
            this._incomingAckId = 0;
            this._incomingMsgLastTime = 0;
            this._incomingAckTimeout = null;
            this._lastReplayRequestTime = 0;
            this._lastSocketTimeoutTime = Date.now();
            this._socketDisposables = new lifecycle_1.DisposableStore();
            this._socket = opts.socket;
            this._socketWriter = this._socketDisposables.add(new ProtocolWriter(this._socket));
            this._socketReader = this._socketDisposables.add(new ProtocolReader(this._socket));
            this._socketDisposables.add(this._socketReader.onMessage(msg => this._receiveMessage(msg)));
            this._socketDisposables.add(this._socket.onClose(e => this._onSocketClose.fire(e)));
            if (opts.initialChunk) {
                this._socketReader.acceptChunk(opts.initialChunk);
            }
            if (this._shouldSendKeepAlive) {
                this._keepAliveInterval = setInterval(() => {
                    this._sendKeepAlive();
                }, 5000 /* ProtocolConstants.KeepAliveSendTime */);
            }
            else {
                this._keepAliveInterval = null;
            }
        }
        dispose() {
            if (this._outgoingAckTimeout) {
                clearTimeout(this._outgoingAckTimeout);
                this._outgoingAckTimeout = null;
            }
            if (this._incomingAckTimeout) {
                clearTimeout(this._incomingAckTimeout);
                this._incomingAckTimeout = null;
            }
            if (this._keepAliveInterval) {
                clearInterval(this._keepAliveInterval);
                this._keepAliveInterval = null;
            }
            this._socketDisposables.dispose();
        }
        drain() {
            return this._socketWriter.drain();
        }
        sendDisconnect() {
            const msg = new ProtocolMessage(5 /* ProtocolMessageType.Disconnect */, 0, 0, getEmptyBuffer());
            this._socketWriter.write(msg);
            this._socketWriter.flush();
        }
        sendPause() {
            const msg = new ProtocolMessage(7 /* ProtocolMessageType.Pause */, 0, 0, getEmptyBuffer());
            this._socketWriter.write(msg);
        }
        sendResume() {
            const msg = new ProtocolMessage(8 /* ProtocolMessageType.Resume */, 0, 0, getEmptyBuffer());
            this._socketWriter.write(msg);
        }
        pauseSocketWriting() {
            this._socketWriter.pause();
        }
        getSocket() {
            return this._socket;
        }
        getMillisSinceLastIncomingData() {
            return Date.now() - this._socketReader.lastReadTime;
        }
        beginAcceptReconnection(socket, initialDataChunk) {
            this._isReconnecting = true;
            this._socketDisposables.dispose();
            this._socketDisposables = new lifecycle_1.DisposableStore();
            this._onControlMessage.flushBuffer();
            this._onSocketClose.flushBuffer();
            this._onSocketTimeout.flushBuffer();
            this._socket.dispose();
            this._lastReplayRequestTime = 0;
            this._lastSocketTimeoutTime = Date.now();
            this._socket = socket;
            this._socketWriter = this._socketDisposables.add(new ProtocolWriter(this._socket));
            this._socketReader = this._socketDisposables.add(new ProtocolReader(this._socket));
            this._socketDisposables.add(this._socketReader.onMessage(msg => this._receiveMessage(msg)));
            this._socketDisposables.add(this._socket.onClose(e => this._onSocketClose.fire(e)));
            this._socketReader.acceptChunk(initialDataChunk);
        }
        endAcceptReconnection() {
            this._isReconnecting = false;
            // After a reconnection, let the other party know (again) which messages have been received.
            // (perhaps the other party didn't receive a previous ACK)
            this._incomingAckId = this._incomingMsgId;
            const msg = new ProtocolMessage(3 /* ProtocolMessageType.Ack */, 0, this._incomingAckId, getEmptyBuffer());
            this._socketWriter.write(msg);
            // Send again all unacknowledged messages
            const toSend = this._outgoingUnackMsg.toArray();
            for (let i = 0, len = toSend.length; i < len; i++) {
                this._socketWriter.write(toSend[i]);
            }
            this._recvAckCheck();
        }
        acceptDisconnect() {
            this._onDidDispose.fire();
        }
        _receiveMessage(msg) {
            if (msg.ack > this._outgoingAckId) {
                this._outgoingAckId = msg.ack;
                do {
                    const first = this._outgoingUnackMsg.peek();
                    if (first && first.id <= msg.ack) {
                        // this message has been confirmed, remove it
                        this._outgoingUnackMsg.pop();
                    }
                    else {
                        break;
                    }
                } while (true);
            }
            switch (msg.type) {
                case 0 /* ProtocolMessageType.None */: {
                    // N/A
                    break;
                }
                case 1 /* ProtocolMessageType.Regular */: {
                    if (msg.id > this._incomingMsgId) {
                        if (msg.id !== this._incomingMsgId + 1) {
                            // in case we missed some messages we ask the other party to resend them
                            const now = Date.now();
                            if (now - this._lastReplayRequestTime > 10000) {
                                // send a replay request at most once every 10s
                                this._lastReplayRequestTime = now;
                                this._socketWriter.write(new ProtocolMessage(6 /* ProtocolMessageType.ReplayRequest */, 0, 0, getEmptyBuffer()));
                            }
                        }
                        else {
                            this._incomingMsgId = msg.id;
                            this._incomingMsgLastTime = Date.now();
                            this._sendAckCheck();
                            this._onMessage.fire(msg.data);
                        }
                    }
                    break;
                }
                case 2 /* ProtocolMessageType.Control */: {
                    this._onControlMessage.fire(msg.data);
                    break;
                }
                case 3 /* ProtocolMessageType.Ack */: {
                    // nothing to do, .ack is handled above already
                    break;
                }
                case 5 /* ProtocolMessageType.Disconnect */: {
                    this._onDidDispose.fire();
                    break;
                }
                case 6 /* ProtocolMessageType.ReplayRequest */: {
                    // Send again all unacknowledged messages
                    const toSend = this._outgoingUnackMsg.toArray();
                    for (let i = 0, len = toSend.length; i < len; i++) {
                        this._socketWriter.write(toSend[i]);
                    }
                    this._recvAckCheck();
                    break;
                }
                case 7 /* ProtocolMessageType.Pause */: {
                    this._socketWriter.pause();
                    break;
                }
                case 8 /* ProtocolMessageType.Resume */: {
                    this._socketWriter.resume();
                    break;
                }
                case 9 /* ProtocolMessageType.KeepAlive */: {
                    // nothing to do
                    break;
                }
            }
        }
        readEntireBuffer() {
            return this._socketReader.readEntireBuffer();
        }
        flush() {
            this._socketWriter.flush();
        }
        send(buffer) {
            const myId = ++this._outgoingMsgId;
            this._incomingAckId = this._incomingMsgId;
            const msg = new ProtocolMessage(1 /* ProtocolMessageType.Regular */, myId, this._incomingAckId, buffer);
            this._outgoingUnackMsg.push(msg);
            if (!this._isReconnecting) {
                this._socketWriter.write(msg);
                this._recvAckCheck();
            }
        }
        /**
         * Send a message which will not be part of the regular acknowledge flow.
         * Use this for early control messages which are repeated in case of reconnection.
         */
        sendControl(buffer) {
            const msg = new ProtocolMessage(2 /* ProtocolMessageType.Control */, 0, 0, buffer);
            this._socketWriter.write(msg);
        }
        _sendAckCheck() {
            if (this._incomingMsgId <= this._incomingAckId) {
                // nothink to acknowledge
                return;
            }
            if (this._incomingAckTimeout) {
                // there will be a check in the near future
                return;
            }
            const timeSinceLastIncomingMsg = Date.now() - this._incomingMsgLastTime;
            if (timeSinceLastIncomingMsg >= 2000 /* ProtocolConstants.AcknowledgeTime */) {
                // sufficient time has passed since this message has been received,
                // and no message from our side needed to be sent in the meantime,
                // so we will send a message containing only an ack.
                this._sendAck();
                return;
            }
            this._incomingAckTimeout = setTimeout(() => {
                this._incomingAckTimeout = null;
                this._sendAckCheck();
            }, 2000 /* ProtocolConstants.AcknowledgeTime */ - timeSinceLastIncomingMsg + 5);
        }
        _recvAckCheck() {
            if (this._outgoingMsgId <= this._outgoingAckId) {
                // everything has been acknowledged
                return;
            }
            if (this._outgoingAckTimeout) {
                // there will be a check in the near future
                return;
            }
            if (this._isReconnecting) {
                // do not cause a timeout during reconnection,
                // because messages will not be actually written until `endAcceptReconnection`
                return;
            }
            const oldestUnacknowledgedMsg = this._outgoingUnackMsg.peek();
            const timeSinceOldestUnacknowledgedMsg = Date.now() - oldestUnacknowledgedMsg.writtenTime;
            const timeSinceLastReceivedSomeData = Date.now() - this._socketReader.lastReadTime;
            const timeSinceLastTimeout = Date.now() - this._lastSocketTimeoutTime;
            if (timeSinceOldestUnacknowledgedMsg >= 20000 /* ProtocolConstants.TimeoutTime */
                && timeSinceLastReceivedSomeData >= 20000 /* ProtocolConstants.TimeoutTime */
                && timeSinceLastTimeout >= 20000 /* ProtocolConstants.TimeoutTime */) {
                // It's been a long time since our sent message was acknowledged
                // and a long time since we received some data
                // But this might be caused by the event loop being busy and failing to read messages
                if (!this._loadEstimator.hasHighLoad()) {
                    // Trash the socket
                    this._lastSocketTimeoutTime = Date.now();
                    this._onSocketTimeout.fire({
                        unacknowledgedMsgCount: this._outgoingUnackMsg.length(),
                        timeSinceOldestUnacknowledgedMsg,
                        timeSinceLastReceivedSomeData
                    });
                    return;
                }
            }
            const minimumTimeUntilTimeout = Math.max(20000 /* ProtocolConstants.TimeoutTime */ - timeSinceOldestUnacknowledgedMsg, 20000 /* ProtocolConstants.TimeoutTime */ - timeSinceLastReceivedSomeData, 20000 /* ProtocolConstants.TimeoutTime */ - timeSinceLastTimeout, 500);
            this._outgoingAckTimeout = setTimeout(() => {
                this._outgoingAckTimeout = null;
                this._recvAckCheck();
            }, minimumTimeUntilTimeout);
        }
        _sendAck() {
            if (this._incomingMsgId <= this._incomingAckId) {
                // nothink to acknowledge
                return;
            }
            this._incomingAckId = this._incomingMsgId;
            const msg = new ProtocolMessage(3 /* ProtocolMessageType.Ack */, 0, this._incomingAckId, getEmptyBuffer());
            this._socketWriter.write(msg);
        }
        _sendKeepAlive() {
            this._incomingAckId = this._incomingMsgId;
            const msg = new ProtocolMessage(9 /* ProtocolMessageType.KeepAlive */, 0, this._incomingAckId, getEmptyBuffer());
            this._socketWriter.write(msg);
        }
    }
    exports.PersistentProtocol = PersistentProtocol;
});
// (() => {
// 	if (!SocketDiagnostics.enableDiagnostics) {
// 		return;
// 	}
// 	if (typeof require.__$__nodeRequire !== 'function') {
// 		console.log(`Can only log socket diagnostics on native platforms.`);
// 		return;
// 	}
// 	const type = (
// 		process.argv.includes('--type=renderer')
// 			? 'renderer'
// 			: (process.argv.includes('--type=extensionHost')
// 				? 'extensionHost'
// 				: (process.argv.some(item => item.includes('server-main'))
// 					? 'server'
// 					: 'unknown'
// 				)
// 			)
// 	);
// 	setTimeout(() => {
// 		SocketDiagnostics.records.forEach(r => {
// 			if (r.buff) {
// 				r.data = Buffer.from(r.buff.buffer).toString('base64');
// 				r.buff = undefined;
// 			}
// 		});
// 		const fs = <typeof import('fs')>require.__$__nodeRequire('fs');
// 		const path = <typeof import('path')>require.__$__nodeRequire('path');
// 		const logPath = path.join(process.cwd(),`${type}-${process.pid}`);
// 		console.log(`dumping socket diagnostics at ${logPath}`);
// 		fs.writeFileSync(logPath, JSON.stringify(SocketDiagnostics.records));
// 	}, 20000);
// })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLm5ldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9wYXJ0cy9pcGMvY29tbW9uL2lwYy5uZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLElBQWtCLDBCQXVDakI7SUF2Q0QsV0FBa0IsMEJBQTBCO1FBQzNDLGlEQUFtQixDQUFBO1FBQ25CLDJDQUFhLENBQUE7UUFDYiw2Q0FBZSxDQUFBO1FBQ2YsMkNBQWEsQ0FBQTtRQUNiLDZDQUFlLENBQUE7UUFDZiw2Q0FBZSxDQUFBO1FBRWYsMkZBQTZELENBQUE7UUFFN0QsaUVBQW1DLENBQUE7UUFDbkMseURBQTJCLENBQUE7UUFDM0IsK0RBQWlDLENBQUE7UUFDakMsMkRBQTZCLENBQUE7UUFFN0IsbUVBQXFDLENBQUE7UUFDckMsaUVBQW1DLENBQUE7UUFDbkMsaUZBQW1ELENBQUE7UUFDbkQsMkZBQTZELENBQUE7UUFDN0QsbUVBQXFDLENBQUE7UUFDckMsNkVBQStDLENBQUE7UUFDL0MsbUVBQXFDLENBQUE7UUFDckMsaUVBQW1DLENBQUE7UUFDbkMsbUVBQXFDLENBQUE7UUFDckMsNkVBQStDLENBQUE7UUFFL0MsbUZBQXFELENBQUE7UUFDckQsaUdBQW1FLENBQUE7UUFDbkUsNkZBQStELENBQUE7UUFDL0QseUZBQTJELENBQUE7UUFDM0QsaUdBQW1FLENBQUE7UUFDbkUsNkZBQStELENBQUE7UUFDL0QseUZBQTJELENBQUE7UUFFM0QsdUVBQXlDLENBQUE7UUFDekMseUVBQTJDLENBQUE7UUFDM0MseUVBQTJDLENBQUE7UUFDM0MsMkVBQTZDLENBQUE7UUFDN0MsNkRBQStCLENBQUE7SUFDaEMsQ0FBQyxFQXZDaUIsMEJBQTBCLDBDQUExQiwwQkFBMEIsUUF1QzNDO0lBRUQsSUFBaUIsaUJBQWlCLENBd0NqQztJQXhDRCxXQUFp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