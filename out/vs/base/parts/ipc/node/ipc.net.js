/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "crypto", "net", "os", "zlib", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uuid", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/common/ipc.net"], function (require, exports, crypto_1, net_1, os_1, zlib_1, buffer_1, errors_1, event_1, lifecycle_1, path_1, platform_1, uuid_1, ipc_1, ipc_net_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Server = exports.XDG_RUNTIME_DIR = exports.WebSocketNodeSocket = exports.NodeSocket = void 0;
    exports.createRandomIPCHandle = createRandomIPCHandle;
    exports.createStaticIPCHandle = createStaticIPCHandle;
    exports.serve = serve;
    exports.connect = connect;
    class NodeSocket {
        traceSocketEvent(type, data) {
            ipc_net_1.SocketDiagnostics.traceSocketEvent(this.socket, this.debugLabel, type, data);
        }
        constructor(socket, debugLabel = '') {
            this._canWrite = true;
            this.debugLabel = debugLabel;
            this.socket = socket;
            this.traceSocketEvent("created" /* SocketDiagnosticsEventType.Created */, { type: 'NodeSocket' });
            this._errorListener = (err) => {
                this.traceSocketEvent("error" /* SocketDiagnosticsEventType.Error */, { code: err?.code, message: err?.message });
                if (err) {
                    if (err.code === 'EPIPE') {
                        // An EPIPE exception at the wrong time can lead to a renderer process crash
                        // so ignore the error since the socket will fire the close event soon anyways:
                        // > https://nodejs.org/api/errors.html#errors_common_system_errors
                        // > EPIPE (Broken pipe): A write on a pipe, socket, or FIFO for which there is no
                        // > process to read the data. Commonly encountered at the net and http layers,
                        // > indicative that the remote side of the stream being written to has been closed.
                        return;
                    }
                    (0, errors_1.onUnexpectedError)(err);
                }
            };
            this.socket.on('error', this._errorListener);
            this._closeListener = (hadError) => {
                this.traceSocketEvent("close" /* SocketDiagnosticsEventType.Close */, { hadError });
                this._canWrite = false;
            };
            this.socket.on('close', this._closeListener);
            this._endListener = () => {
                this.traceSocketEvent("nodeEndReceived" /* SocketDiagnosticsEventType.NodeEndReceived */);
                this._canWrite = false;
            };
            this.socket.on('end', this._endListener);
        }
        dispose() {
            this.socket.off('error', this._errorListener);
            this.socket.off('close', this._closeListener);
            this.socket.off('end', this._endListener);
            this.socket.destroy();
        }
        onData(_listener) {
            const listener = (buff) => {
                this.traceSocketEvent("read" /* SocketDiagnosticsEventType.Read */, buff);
                _listener(buffer_1.VSBuffer.wrap(buff));
            };
            this.socket.on('data', listener);
            return {
                dispose: () => this.socket.off('data', listener)
            };
        }
        onClose(listener) {
            const adapter = (hadError) => {
                listener({
                    type: 0 /* SocketCloseEventType.NodeSocketCloseEvent */,
                    hadError: hadError,
                    error: undefined
                });
            };
            this.socket.on('close', adapter);
            return {
                dispose: () => this.socket.off('close', adapter)
            };
        }
        onEnd(listener) {
            const adapter = () => {
                listener();
            };
            this.socket.on('end', adapter);
            return {
                dispose: () => this.socket.off('end', adapter)
            };
        }
        write(buffer) {
            // return early if socket has been destroyed in the meantime
            if (this.socket.destroyed || !this._canWrite) {
                return;
            }
            // we ignore the returned value from `write` because we would have to cached the data
            // anyways and nodejs is already doing that for us:
            // > https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback
            // > However, the false return value is only advisory and the writable stream will unconditionally
            // > accept and buffer chunk even if it has not been allowed to drain.
            try {
                this.traceSocketEvent("write" /* SocketDiagnosticsEventType.Write */, buffer);
                this.socket.write(buffer.buffer, (err) => {
                    if (err) {
                        if (err.code === 'EPIPE') {
                            // An EPIPE exception at the wrong time can lead to a renderer process crash
                            // so ignore the error since the socket will fire the close event soon anyways:
                            // > https://nodejs.org/api/errors.html#errors_common_system_errors
                            // > EPIPE (Broken pipe): A write on a pipe, socket, or FIFO for which there is no
                            // > process to read the data. Commonly encountered at the net and http layers,
                            // > indicative that the remote side of the stream being written to has been closed.
                            return;
                        }
                        (0, errors_1.onUnexpectedError)(err);
                    }
                });
            }
            catch (err) {
                if (err.code === 'EPIPE') {
                    // An EPIPE exception at the wrong time can lead to a renderer process crash
                    // so ignore the error since the socket will fire the close event soon anyways:
                    // > https://nodejs.org/api/errors.html#errors_common_system_errors
                    // > EPIPE (Broken pipe): A write on a pipe, socket, or FIFO for which there is no
                    // > process to read the data. Commonly encountered at the net and http layers,
                    // > indicative that the remote side of the stream being written to has been closed.
                    return;
                }
                (0, errors_1.onUnexpectedError)(err);
            }
        }
        end() {
            this.traceSocketEvent("nodeEndSent" /* SocketDiagnosticsEventType.NodeEndSent */);
            this.socket.end();
        }
        drain() {
            this.traceSocketEvent("nodeDrainBegin" /* SocketDiagnosticsEventType.NodeDrainBegin */);
            return new Promise((resolve, reject) => {
                if (this.socket.bufferSize === 0) {
                    this.traceSocketEvent("nodeDrainEnd" /* SocketDiagnosticsEventType.NodeDrainEnd */);
                    resolve();
                    return;
                }
                const finished = () => {
                    this.socket.off('close', finished);
                    this.socket.off('end', finished);
                    this.socket.off('error', finished);
                    this.socket.off('timeout', finished);
                    this.socket.off('drain', finished);
                    this.traceSocketEvent("nodeDrainEnd" /* SocketDiagnosticsEventType.NodeDrainEnd */);
                    resolve();
                };
                this.socket.on('close', finished);
                this.socket.on('end', finished);
                this.socket.on('error', finished);
                this.socket.on('timeout', finished);
                this.socket.on('drain', finished);
            });
        }
    }
    exports.NodeSocket = NodeSocket;
    var Constants;
    (function (Constants) {
        Constants[Constants["MinHeaderByteSize"] = 2] = "MinHeaderByteSize";
        /**
         * If we need to write a large buffer, we will split it into 256KB chunks and
         * send each chunk as a websocket message. This is to prevent that the sending
         * side is stuck waiting for the entire buffer to be compressed before writing
         * to the underlying socket or that the receiving side is stuck waiting for the
         * entire message to be received before processing the bytes.
         */
        Constants[Constants["MaxWebSocketMessageLength"] = 262144] = "MaxWebSocketMessageLength"; // 256 KB
    })(Constants || (Constants = {}));
    var ReadState;
    (function (ReadState) {
        ReadState[ReadState["PeekHeader"] = 1] = "PeekHeader";
        ReadState[ReadState["ReadHeader"] = 2] = "ReadHeader";
        ReadState[ReadState["ReadBody"] = 3] = "ReadBody";
        ReadState[ReadState["Fin"] = 4] = "Fin";
    })(ReadState || (ReadState = {}));
    /**
     * See https://tools.ietf.org/html/rfc6455#section-5.2
     */
    class WebSocketNodeSocket extends lifecycle_1.Disposable {
        get permessageDeflate() {
            return this._flowManager.permessageDeflate;
        }
        get recordedInflateBytes() {
            return this._flowManager.recordedInflateBytes;
        }
        traceSocketEvent(type, data) {
            this.socket.traceSocketEvent(type, data);
        }
        /**
         * Create a socket which can communicate using WebSocket frames.
         *
         * **NOTE**: When using the permessage-deflate WebSocket extension, if parts of inflating was done
         *  in a different zlib instance, we need to pass all those bytes into zlib, otherwise the inflate
         *  might hit an inflated portion referencing a distance too far back.
         *
         * @param socket The underlying socket
         * @param permessageDeflate Use the permessage-deflate WebSocket extension
         * @param inflateBytes "Seed" zlib inflate with these bytes.
         * @param recordInflateBytes Record all bytes sent to inflate
         */
        constructor(socket, permessageDeflate, inflateBytes, recordInflateBytes) {
            super();
            this._onData = this._register(new event_1.Emitter());
            this._onClose = this._register(new event_1.Emitter());
            this._isEnded = false;
            this._state = {
                state: 1 /* ReadState.PeekHeader */,
                readLen: 2 /* Constants.MinHeaderByteSize */,
                fin: 0,
                compressed: false,
                firstFrameOfMessage: true,
                mask: 0,
                opcode: 0
            };
            this.socket = socket;
            this.traceSocketEvent("created" /* SocketDiagnosticsEventType.Created */, { type: 'WebSocketNodeSocket', permessageDeflate, inflateBytesLength: inflateBytes?.byteLength || 0, recordInflateBytes });
            this._flowManager = this._register(new WebSocketFlowManager(this, permessageDeflate, inflateBytes, recordInflateBytes, this._onData, (data, options) => this._write(data, options)));
            this._register(this._flowManager.onError((err) => {
                // zlib errors are fatal, since we have no idea how to recover
                console.error(err);
                (0, errors_1.onUnexpectedError)(err);
                this._onClose.fire({
                    type: 0 /* SocketCloseEventType.NodeSocketCloseEvent */,
                    hadError: true,
                    error: err
                });
            }));
            this._incomingData = new ipc_net_1.ChunkStream();
            this._register(this.socket.onData(data => this._acceptChunk(data)));
            this._register(this.socket.onClose(async (e) => {
                // Delay surfacing the close event until the async inflating is done
                // and all data has been emitted
                if (this._flowManager.isProcessingReadQueue()) {
                    await event_1.Event.toPromise(this._flowManager.onDidFinishProcessingReadQueue);
                }
                this._onClose.fire(e);
            }));
        }
        dispose() {
            if (this._flowManager.isProcessingWriteQueue()) {
                // Wait for any outstanding writes to finish before disposing
                this._register(this._flowManager.onDidFinishProcessingWriteQueue(() => {
                    this.dispose();
                }));
            }
            else {
                this.socket.dispose();
                super.dispose();
            }
        }
        onData(listener) {
            return this._onData.event(listener);
        }
        onClose(listener) {
            return this._onClose.event(listener);
        }
        onEnd(listener) {
            return this.socket.onEnd(listener);
        }
        write(buffer) {
            // If we write many logical messages (let's say 1000 messages of 100KB) during a single process tick, we do
            // this thing where we install a process.nextTick timer and group all of them together and we then issue a
            // single WebSocketNodeSocket.write with a 100MB buffer.
            //
            // The first problem is that the actual writing to the underlying node socket will only happen after all of
            // the 100MB have been deflated (due to waiting on zlib flush). The second problem is on the reading side,
            // where we will get a single WebSocketNodeSocket.onData event fired when all the 100MB have arrived,
            // delaying processing the 1000 received messages until all have arrived, instead of processing them as each
            // one arrives.
            //
            // We therefore split the buffer into chunks, and issue a write for each chunk.
            let start = 0;
            while (start < buffer.byteLength) {
                this._flowManager.writeMessage(buffer.slice(start, Math.min(start + 262144 /* Constants.MaxWebSocketMessageLength */, buffer.byteLength)), { compressed: true, opcode: 0x02 /* Binary frame */ });
                start += 262144 /* Constants.MaxWebSocketMessageLength */;
            }
        }
        _write(buffer, { compressed, opcode }) {
            if (this._isEnded) {
                // Avoid ERR_STREAM_WRITE_AFTER_END
                return;
            }
            this.traceSocketEvent("webSocketNodeSocketWrite" /* SocketDiagnosticsEventType.WebSocketNodeSocketWrite */, buffer);
            let headerLen = 2 /* Constants.MinHeaderByteSize */;
            if (buffer.byteLength < 126) {
                headerLen += 0;
            }
            else if (buffer.byteLength < 2 ** 16) {
                headerLen += 2;
            }
            else {
                headerLen += 8;
            }
            const header = buffer_1.VSBuffer.alloc(headerLen);
            // The RSV1 bit indicates a compressed frame
            const compressedFlag = compressed ? 0b01000000 : 0;
            const opcodeFlag = opcode & 0b00001111;
            header.writeUInt8(0b10000000 | compressedFlag | opcodeFlag, 0);
            if (buffer.byteLength < 126) {
                header.writeUInt8(buffer.byteLength, 1);
            }
            else if (buffer.byteLength < 2 ** 16) {
                header.writeUInt8(126, 1);
                let offset = 1;
                header.writeUInt8((buffer.byteLength >>> 8) & 0b11111111, ++offset);
                header.writeUInt8((buffer.byteLength >>> 0) & 0b11111111, ++offset);
            }
            else {
                header.writeUInt8(127, 1);
                let offset = 1;
                header.writeUInt8(0, ++offset);
                header.writeUInt8(0, ++offset);
                header.writeUInt8(0, ++offset);
                header.writeUInt8(0, ++offset);
                header.writeUInt8((buffer.byteLength >>> 24) & 0b11111111, ++offset);
                header.writeUInt8((buffer.byteLength >>> 16) & 0b11111111, ++offset);
                header.writeUInt8((buffer.byteLength >>> 8) & 0b11111111, ++offset);
                header.writeUInt8((buffer.byteLength >>> 0) & 0b11111111, ++offset);
            }
            this.socket.write(buffer_1.VSBuffer.concat([header, buffer]));
        }
        end() {
            this._isEnded = true;
            this.socket.end();
        }
        _acceptChunk(data) {
            if (data.byteLength === 0) {
                return;
            }
            this._incomingData.acceptChunk(data);
            while (this._incomingData.byteLength >= this._state.readLen) {
                if (this._state.state === 1 /* ReadState.PeekHeader */) {
                    // peek to see if we can read the entire header
                    const peekHeader = this._incomingData.peek(this._state.readLen);
                    const firstByte = peekHeader.readUInt8(0);
                    const finBit = (firstByte & 0b10000000) >>> 7;
                    const rsv1Bit = (firstByte & 0b01000000) >>> 6;
                    const opcode = (firstByte & 0b00001111);
                    const secondByte = peekHeader.readUInt8(1);
                    const hasMask = (secondByte & 0b10000000) >>> 7;
                    const len = (secondByte & 0b01111111);
                    this._state.state = 2 /* ReadState.ReadHeader */;
                    this._state.readLen = 2 /* Constants.MinHeaderByteSize */ + (hasMask ? 4 : 0) + (len === 126 ? 2 : 0) + (len === 127 ? 8 : 0);
                    this._state.fin = finBit;
                    if (this._state.firstFrameOfMessage) {
                        // if the frame is compressed, the RSV1 bit is set only for the first frame of the message
                        this._state.compressed = Boolean(rsv1Bit);
                    }
                    this._state.firstFrameOfMessage = Boolean(finBit);
                    this._state.mask = 0;
                    this._state.opcode = opcode;
                    this.traceSocketEvent("webSocketNodeSocketPeekedHeader" /* SocketDiagnosticsEventType.WebSocketNodeSocketPeekedHeader */, { headerSize: this._state.readLen, compressed: this._state.compressed, fin: this._state.fin, opcode: this._state.opcode });
                }
                else if (this._state.state === 2 /* ReadState.ReadHeader */) {
                    // read entire header
                    const header = this._incomingData.read(this._state.readLen);
                    const secondByte = header.readUInt8(1);
                    const hasMask = (secondByte & 0b10000000) >>> 7;
                    let len = (secondByte & 0b01111111);
                    let offset = 1;
                    if (len === 126) {
                        len = (header.readUInt8(++offset) * 2 ** 8
                            + header.readUInt8(++offset));
                    }
                    else if (len === 127) {
                        len = (header.readUInt8(++offset) * 0
                            + header.readUInt8(++offset) * 0
                            + header.readUInt8(++offset) * 0
                            + header.readUInt8(++offset) * 0
                            + header.readUInt8(++offset) * 2 ** 24
                            + header.readUInt8(++offset) * 2 ** 16
                            + header.readUInt8(++offset) * 2 ** 8
                            + header.readUInt8(++offset));
                    }
                    let mask = 0;
                    if (hasMask) {
                        mask = (header.readUInt8(++offset) * 2 ** 24
                            + header.readUInt8(++offset) * 2 ** 16
                            + header.readUInt8(++offset) * 2 ** 8
                            + header.readUInt8(++offset));
                    }
                    this._state.state = 3 /* ReadState.ReadBody */;
                    this._state.readLen = len;
                    this._state.mask = mask;
                    this.traceSocketEvent("webSocketNodeSocketPeekedHeader" /* SocketDiagnosticsEventType.WebSocketNodeSocketPeekedHeader */, { bodySize: this._state.readLen, compressed: this._state.compressed, fin: this._state.fin, mask: this._state.mask, opcode: this._state.opcode });
                }
                else if (this._state.state === 3 /* ReadState.ReadBody */) {
                    // read body
                    const body = this._incomingData.read(this._state.readLen);
                    this.traceSocketEvent("webSocketNodeSocketReadData" /* SocketDiagnosticsEventType.WebSocketNodeSocketReadData */, body);
                    unmask(body, this._state.mask);
                    this.traceSocketEvent("webSocketNodeSocketUnmaskedData" /* SocketDiagnosticsEventType.WebSocketNodeSocketUnmaskedData */, body);
                    this._state.state = 1 /* ReadState.PeekHeader */;
                    this._state.readLen = 2 /* Constants.MinHeaderByteSize */;
                    this._state.mask = 0;
                    if (this._state.opcode <= 0x02 /* Continuation frame or Text frame or binary frame */) {
                        this._flowManager.acceptFrame(body, this._state.compressed, !!this._state.fin);
                    }
                    else if (this._state.opcode === 0x09 /* Ping frame */) {
                        // Ping frames could be send by some browsers e.g. Firefox
                        this._flowManager.writeMessage(body, { compressed: false, opcode: 0x0A /* Pong frame */ });
                    }
                }
            }
        }
        async drain() {
            this.traceSocketEvent("webSocketNodeSocketDrainBegin" /* SocketDiagnosticsEventType.WebSocketNodeSocketDrainBegin */);
            if (this._flowManager.isProcessingWriteQueue()) {
                await event_1.Event.toPromise(this._flowManager.onDidFinishProcessingWriteQueue);
            }
            await this.socket.drain();
            this.traceSocketEvent("webSocketNodeSocketDrainEnd" /* SocketDiagnosticsEventType.WebSocketNodeSocketDrainEnd */);
        }
    }
    exports.WebSocketNodeSocket = WebSocketNodeSocket;
    class WebSocketFlowManager extends lifecycle_1.Disposable {
        get permessageDeflate() {
            return Boolean(this._zlibInflateStream && this._zlibDeflateStream);
        }
        get recordedInflateBytes() {
            if (this._zlibInflateStream) {
                return this._zlibInflateStream.recordedInflateBytes;
            }
            return buffer_1.VSBuffer.alloc(0);
        }
        constructor(_tracer, permessageDeflate, inflateBytes, recordInflateBytes, _onData, _writeFn) {
            super();
            this._tracer = _tracer;
            this._onData = _onData;
            this._writeFn = _writeFn;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this._writeQueue = [];
            this._readQueue = [];
            this._onDidFinishProcessingReadQueue = this._register(new event_1.Emitter());
            this.onDidFinishProcessingReadQueue = this._onDidFinishProcessingReadQueue.event;
            this._onDidFinishProcessingWriteQueue = this._register(new event_1.Emitter());
            this.onDidFinishProcessingWriteQueue = this._onDidFinishProcessingWriteQueue.event;
            this._isProcessingWriteQueue = false;
            this._isProcessingReadQueue = false;
            if (permessageDeflate) {
                // See https://tools.ietf.org/html/rfc7692#page-16
                // To simplify our logic, we don't negotiate the window size
                // and simply dedicate (2^15) / 32kb per web socket
                this._zlibInflateStream = this._register(new ZlibInflateStream(this._tracer, recordInflateBytes, inflateBytes, { windowBits: 15 }));
                this._zlibDeflateStream = this._register(new ZlibDeflateStream(this._tracer, { windowBits: 15 }));
                this._register(this._zlibInflateStream.onError((err) => this._onError.fire(err)));
                this._register(this._zlibDeflateStream.onError((err) => this._onError.fire(err)));
            }
            else {
                this._zlibInflateStream = null;
                this._zlibDeflateStream = null;
            }
        }
        writeMessage(data, options) {
            this._writeQueue.push({ data, options });
            this._processWriteQueue();
        }
        async _processWriteQueue() {
            if (this._isProcessingWriteQueue) {
                return;
            }
            this._isProcessingWriteQueue = true;
            while (this._writeQueue.length > 0) {
                const { data, options } = this._writeQueue.shift();
                if (this._zlibDeflateStream && options.compressed) {
                    const compressedData = await this._deflateMessage(this._zlibDeflateStream, data);
                    this._writeFn(compressedData, options);
                }
                else {
                    this._writeFn(data, { ...options, compressed: false });
                }
            }
            this._isProcessingWriteQueue = false;
            this._onDidFinishProcessingWriteQueue.fire();
        }
        isProcessingWriteQueue() {
            return (this._isProcessingWriteQueue);
        }
        /**
         * Subsequent calls should wait for the previous `_deflateBuffer` call to complete.
         */
        _deflateMessage(zlibDeflateStream, buffer) {
            return new Promise((resolve, reject) => {
                zlibDeflateStream.write(buffer);
                zlibDeflateStream.flush(data => resolve(data));
            });
        }
        acceptFrame(data, isCompressed, isLastFrameOfMessage) {
            this._readQueue.push({ data, isCompressed, isLastFrameOfMessage });
            this._processReadQueue();
        }
        async _processReadQueue() {
            if (this._isProcessingReadQueue) {
                return;
            }
            this._isProcessingReadQueue = true;
            while (this._readQueue.length > 0) {
                const frameInfo = this._readQueue.shift();
                if (this._zlibInflateStream && frameInfo.isCompressed) {
                    // See https://datatracker.ietf.org/doc/html/rfc7692#section-9.2
                    // Even if permessageDeflate is negotiated, it is possible
                    // that the other side might decide to send uncompressed messages
                    // So only decompress messages that have the RSV 1 bit set
                    const data = await this._inflateFrame(this._zlibInflateStream, frameInfo.data, frameInfo.isLastFrameOfMessage);
                    this._onData.fire(data);
                }
                else {
                    this._onData.fire(frameInfo.data);
                }
            }
            this._isProcessingReadQueue = false;
            this._onDidFinishProcessingReadQueue.fire();
        }
        isProcessingReadQueue() {
            return (this._isProcessingReadQueue);
        }
        /**
         * Subsequent calls should wait for the previous `transformRead` call to complete.
         */
        _inflateFrame(zlibInflateStream, buffer, isLastFrameOfMessage) {
            return new Promise((resolve, reject) => {
                // See https://tools.ietf.org/html/rfc7692#section-7.2.2
                zlibInflateStream.write(buffer);
                if (isLastFrameOfMessage) {
                    zlibInflateStream.write(buffer_1.VSBuffer.fromByteArray([0x00, 0x00, 0xff, 0xff]));
                }
                zlibInflateStream.flush(data => resolve(data));
            });
        }
    }
    class ZlibInflateStream extends lifecycle_1.Disposable {
        get recordedInflateBytes() {
            if (this._recordInflateBytes) {
                return buffer_1.VSBuffer.concat(this._recordedInflateBytes);
            }
            return buffer_1.VSBuffer.alloc(0);
        }
        constructor(_tracer, _recordInflateBytes, inflateBytes, options) {
            super();
            this._tracer = _tracer;
            this._recordInflateBytes = _recordInflateBytes;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this._recordedInflateBytes = [];
            this._pendingInflateData = [];
            this._zlibInflate = (0, zlib_1.createInflateRaw)(options);
            this._zlibInflate.on('error', (err) => {
                this._tracer.traceSocketEvent("zlibInflateError" /* SocketDiagnosticsEventType.zlibInflateError */, { message: err?.message, code: err?.code });
                this._onError.fire(err);
            });
            this._zlibInflate.on('data', (data) => {
                this._tracer.traceSocketEvent("zlibInflateData" /* SocketDiagnosticsEventType.zlibInflateData */, data);
                this._pendingInflateData.push(buffer_1.VSBuffer.wrap(data));
            });
            if (inflateBytes) {
                this._tracer.traceSocketEvent("zlibInflateInitialWrite" /* SocketDiagnosticsEventType.zlibInflateInitialWrite */, inflateBytes.buffer);
                this._zlibInflate.write(inflateBytes.buffer);
                this._zlibInflate.flush(() => {
                    this._tracer.traceSocketEvent("zlibInflateInitialFlushFired" /* SocketDiagnosticsEventType.zlibInflateInitialFlushFired */);
                    this._pendingInflateData.length = 0;
                });
            }
        }
        write(buffer) {
            if (this._recordInflateBytes) {
                this._recordedInflateBytes.push(buffer.clone());
            }
            this._tracer.traceSocketEvent("zlibInflateWrite" /* SocketDiagnosticsEventType.zlibInflateWrite */, buffer);
            this._zlibInflate.write(buffer.buffer);
        }
        flush(callback) {
            this._zlibInflate.flush(() => {
                this._tracer.traceSocketEvent("zlibInflateFlushFired" /* SocketDiagnosticsEventType.zlibInflateFlushFired */);
                const data = buffer_1.VSBuffer.concat(this._pendingInflateData);
                this._pendingInflateData.length = 0;
                callback(data);
            });
        }
    }
    class ZlibDeflateStream extends lifecycle_1.Disposable {
        constructor(_tracer, options) {
            super();
            this._tracer = _tracer;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this._pendingDeflateData = [];
            this._zlibDeflate = (0, zlib_1.createDeflateRaw)({
                windowBits: 15
            });
            this._zlibDeflate.on('error', (err) => {
                this._tracer.traceSocketEvent("zlibDeflateError" /* SocketDiagnosticsEventType.zlibDeflateError */, { message: err?.message, code: err?.code });
                this._onError.fire(err);
            });
            this._zlibDeflate.on('data', (data) => {
                this._tracer.traceSocketEvent("zlibDeflateData" /* SocketDiagnosticsEventType.zlibDeflateData */, data);
                this._pendingDeflateData.push(buffer_1.VSBuffer.wrap(data));
            });
        }
        write(buffer) {
            this._tracer.traceSocketEvent("zlibDeflateWrite" /* SocketDiagnosticsEventType.zlibDeflateWrite */, buffer.buffer);
            this._zlibDeflate.write(buffer.buffer);
        }
        flush(callback) {
            // See https://zlib.net/manual.html#Constants
            this._zlibDeflate.flush(/*Z_SYNC_FLUSH*/ 2, () => {
                this._tracer.traceSocketEvent("zlibDeflateFlushFired" /* SocketDiagnosticsEventType.zlibDeflateFlushFired */);
                let data = buffer_1.VSBuffer.concat(this._pendingDeflateData);
                this._pendingDeflateData.length = 0;
                // See https://tools.ietf.org/html/rfc7692#section-7.2.1
                data = data.slice(0, data.byteLength - 4);
                callback(data);
            });
        }
    }
    function unmask(buffer, mask) {
        if (mask === 0) {
            return;
        }
        const cnt = buffer.byteLength >>> 2;
        for (let i = 0; i < cnt; i++) {
            const v = buffer.readUInt32BE(i * 4);
            buffer.writeUInt32BE(v ^ mask, i * 4);
        }
        const offset = cnt * 4;
        const bytesLeft = buffer.byteLength - offset;
        const m3 = (mask >>> 24) & 0b11111111;
        const m2 = (mask >>> 16) & 0b11111111;
        const m1 = (mask >>> 8) & 0b11111111;
        if (bytesLeft >= 1) {
            buffer.writeUInt8(buffer.readUInt8(offset) ^ m3, offset);
        }
        if (bytesLeft >= 2) {
            buffer.writeUInt8(buffer.readUInt8(offset + 1) ^ m2, offset + 1);
        }
        if (bytesLeft >= 3) {
            buffer.writeUInt8(buffer.readUInt8(offset + 2) ^ m1, offset + 2);
        }
    }
    // Read this before there's any chance it is overwritten
    // Related to https://github.com/microsoft/vscode/issues/30624
    exports.XDG_RUNTIME_DIR = process.env['XDG_RUNTIME_DIR'];
    const safeIpcPathLengths = {
        [2 /* Platform.Linux */]: 107,
        [1 /* Platform.Mac */]: 103
    };
    function createRandomIPCHandle() {
        const randomSuffix = (0, uuid_1.generateUuid)();
        // Windows: use named pipe
        if (process.platform === 'win32') {
            return `\\\\.\\pipe\\vscode-ipc-${randomSuffix}-sock`;
        }
        // Mac & Unix: Use socket file
        // Unix: Prefer XDG_RUNTIME_DIR over user data path
        const basePath = process.platform !== 'darwin' && exports.XDG_RUNTIME_DIR ? exports.XDG_RUNTIME_DIR : (0, os_1.tmpdir)();
        const result = (0, path_1.join)(basePath, `vscode-ipc-${randomSuffix}.sock`);
        // Validate length
        validateIPCHandleLength(result);
        return result;
    }
    function createStaticIPCHandle(directoryPath, type, version) {
        const scope = (0, crypto_1.createHash)('sha256').update(directoryPath).digest('hex');
        const scopeForSocket = scope.substr(0, 8);
        // Windows: use named pipe
        if (process.platform === 'win32') {
            return `\\\\.\\pipe\\${scopeForSocket}-${version}-${type}-sock`;
        }
        // Mac & Unix: Use socket file
        // Unix: Prefer XDG_RUNTIME_DIR over user data path, unless portable
        // Trim the version and type values for the socket to prevent too large
        // file names causing issues: https://unix.stackexchange.com/q/367008
        const versionForSocket = version.substr(0, 4);
        const typeForSocket = type.substr(0, 6);
        let result;
        if (process.platform !== 'darwin' && exports.XDG_RUNTIME_DIR && !process.env['VSCODE_PORTABLE']) {
            result = (0, path_1.join)(exports.XDG_RUNTIME_DIR, `vscode-${scopeForSocket}-${versionForSocket}-${typeForSocket}.sock`);
        }
        else {
            result = (0, path_1.join)(directoryPath, `${versionForSocket}-${typeForSocket}.sock`);
        }
        // Validate length
        validateIPCHandleLength(result);
        return result;
    }
    function validateIPCHandleLength(handle) {
        const limit = safeIpcPathLengths[platform_1.platform];
        if (typeof limit === 'number' && handle.length >= limit) {
            // https://nodejs.org/api/net.html#net_identifying_paths_for_ipc_connections
            console.warn(`WARNING: IPC handle "${handle}" is longer than ${limit} chars, try a shorter --user-data-dir`);
        }
    }
    class Server extends ipc_1.IPCServer {
        static toClientConnectionEvent(server) {
            const onConnection = event_1.Event.fromNodeEventEmitter(server, 'connection');
            return event_1.Event.map(onConnection, socket => ({
                protocol: new ipc_net_1.Protocol(new NodeSocket(socket, 'ipc-server-connection')),
                onDidClientDisconnect: event_1.Event.once(event_1.Event.fromNodeEventEmitter(socket, 'close'))
            }));
        }
        constructor(server) {
            super(Server.toClientConnectionEvent(server));
            this.server = server;
        }
        dispose() {
            super.dispose();
            if (this.server) {
                this.server.close();
                this.server = null;
            }
        }
    }
    exports.Server = Server;
    function serve(hook) {
        return new Promise((c, e) => {
            const server = (0, net_1.createServer)();
            server.on('error', e);
            server.listen(hook, () => {
                server.removeListener('error', e);
                c(new Server(server));
            });
        });
    }
    function connect(hook, clientId) {
        return new Promise((c, e) => {
            const socket = (0, net_1.createConnection)(hook, () => {
                socket.removeListener('error', e);
                c(ipc_net_1.Client.fromSocket(new NodeSocket(socket, `ipc-client${clientId}`), clientId));
            });
            socket.once('error', e);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLm5ldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9wYXJ0cy9pcGMvbm9kZS9pcGMubmV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTR2QmhHLHNEQWlCQztJQUVELHNEQTRCQztJQXVDRCxzQkFVQztJQUtELDBCQVNDO0lBMTFCRCxNQUFhLFVBQVU7UUFTZixnQkFBZ0IsQ0FBQyxJQUFnQyxFQUFFLElBQWtFO1lBQzNILDJCQUFpQixDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUVELFlBQVksTUFBYyxFQUFFLGFBQXFCLEVBQUU7WUFOM0MsY0FBUyxHQUFHLElBQUksQ0FBQztZQU94QixJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztZQUM3QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNyQixJQUFJLENBQUMsZ0JBQWdCLHFEQUFxQyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ2xGLElBQUksQ0FBQyxjQUFjLEdBQUcsQ0FBQyxHQUFRLEVBQUUsRUFBRTtnQkFDbEMsSUFBSSxDQUFDLGdCQUFnQixpREFBbUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQ3BHLElBQUksR0FBRyxFQUFFLENBQUM7b0JBQ1QsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDO3dCQUMxQiw0RUFBNEU7d0JBQzVFLCtFQUErRTt3QkFDL0UsbUVBQW1FO3dCQUNuRSxrRkFBa0Y7d0JBQ2xGLCtFQUErRTt3QkFDL0Usb0ZB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TUFBTSxDQUFDLENBQUM7WUFDckUsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7Z0JBQ2YsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDL0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDL0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDL0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDL0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEtBQUssRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3JFLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxLQUFLLEVBQUUsQ0FBQyxHQUFHLFVBQVUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNyRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsS0FBSyxDQUFDLENBQUMsR0FBRyxVQUFVLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEtBQUssQ0FBQyxDQUFDLEdBQUcsVUFBVSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDckUsQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGlCQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRU0sR0FBRztZQUNULElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lB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