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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/decorators", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/strings", "vs/base/common/types"], function (require, exports, arrays_1, async_1, buffer_1, cancellation_1, decorators_1, errors_1, event_1, lifecycle_1, marshalling_1, strings, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IPCLogger = exports.ProxyChannel = exports.StaticRouter = exports.IPCClient = exports.IPCServer = exports.ChannelClient = exports.RequestInitiator = exports.ChannelServer = exports.BufferWriter = exports.BufferReader = void 0;
    exports.serialize = serialize;
    exports.deserialize = deserialize;
    exports.getDelayedChannel = getDelayedChannel;
    exports.getNextTickChannel = getNextTickChannel;
    var RequestType;
    (function (RequestType) {
        RequestType[RequestType["Promise"] = 100] = "Promise";
        RequestType[RequestType["PromiseCancel"] = 101] = "PromiseCancel";
        RequestType[RequestType["EventListen"] = 102] = "EventListen";
        RequestType[RequestType["EventDispose"] = 103] = "EventDispose";
    })(RequestType || (RequestType = {}));
    function requestTypeToStr(type) {
        switch (type) {
            case 100 /* RequestType.Promise */:
                return 'req';
            case 101 /* RequestType.PromiseCancel */:
                return 'cancel';
            case 102 /* RequestType.EventListen */:
                return 'subscribe';
            case 103 /* RequestType.EventDispose */:
                return 'unsubscribe';
        }
    }
    var ResponseType;
    (function (ResponseType) {
        ResponseType[ResponseType["Initialize"] = 200] = "Initialize";
        ResponseType[ResponseType["PromiseSuccess"] = 201] = "PromiseSuccess";
        ResponseType[ResponseType["PromiseError"] = 202] = "PromiseError";
        ResponseType[ResponseType["PromiseErrorObj"] = 203] = "PromiseErrorObj";
        ResponseType[ResponseType["EventFire"] = 204] = "EventFire";
    })(ResponseType || (ResponseType = {}));
    function responseTypeToStr(type) {
        switch (type) {
            case 200 /* ResponseType.Initialize */:
                return `init`;
            case 201 /* ResponseType.PromiseSuccess */:
                return `reply:`;
            case 202 /* ResponseType.PromiseError */:
            case 203 /* ResponseType.PromiseErrorObj */:
                return `replyErr:`;
            case 204 /* ResponseType.EventFire */:
                return `event:`;
        }
    }
    var State;
    (function (State) {
        State[State["Uninitialized"] = 0] = "Uninitialized";
        State[State["Idle"] = 1] = "Idle";
    })(State || (State = {}));
    /**
     * @see https://en.wikipedia.org/wiki/Variable-length_quantity
     */
    function readIntVQL(reader) {
        let value = 0;
        for (let n = 0;; n += 7) {
            const next = reader.read(1);
            value |= (next.buffer[0] & 0b01111111) << n;
            if (!(next.buffer[0] & 0b10000000)) {
                return value;
            }
        }
    }
    const vqlZero = createOneByteBuffer(0);
    /**
     * @see https://en.wikipedia.org/wiki/Variable-length_quantity
     */
    function writeInt32VQL(writer, value) {
        if (value === 0) {
            writer.write(vqlZero);
            return;
        }
        let len = 0;
        for (let v2 = value; v2 !== 0; v2 = v2 >>> 7) {
            len++;
        }
        const scratch = buffer_1.VSBuffer.alloc(len);
        for (let i = 0; value !== 0; i++) {
            scratch.buffer[i] = value & 0b01111111;
            value = value >>> 7;
            if (value > 0) {
                scratch.buffer[i] |= 0b10000000;
            }
        }
        writer.write(scratch);
    }
    class BufferReader {
        constructor(buffer) {
            this.buffer = buffer;
            this.pos = 0;
        }
        read(bytes) {
            const result = this.buffer.slice(this.pos, this.pos + bytes);
            this.pos += result.byteLength;
            return result;
        }
    }
    exports.BufferReader = BufferReader;
    class BufferWriter {
        constructor() {
            this.buffers = [];
        }
        get buffer() {
            return buffer_1.VSBuffer.concat(this.buffers);
        }
        write(buffer) {
            this.buffers.push(buffer);
        }
    }
    exports.BufferWriter = BufferWriter;
    var DataType;
    (function (DataType) {
        DataType[DataType["Undefined"] = 0] = "Undefined";
        DataType[DataType["String"] = 1] = "String";
        DataType[DataType["Buffer"] = 2] = "Buffer";
        DataType[DataType["VSBuffer"] = 3] = "VSBuffer";
        DataType[DataType["Array"] = 4] = "Array";
        DataType[DataType["Object"] = 5] = "Object";
        DataType[DataType["Int"] = 6] = "Int";
    })(DataType || (DataType = {}));
    function createOneByteBuffer(value) {
        const result = buffer_1.VSBuffer.alloc(1);
        result.writeUInt8(value, 0);
        return result;
    }
    const BufferPresets = {
        Undefined: createOneByteBuffer(DataType.Undefined),
        String: createOneByteBuffer(DataType.String),
        Buffer: createOneByteBuffer(DataType.Buffer),
        VSBuffer: createOneByteBuffer(DataType.VSBuffer),
        Array: createOneByteBuffer(DataType.Array),
        Object: createOneByteBuffer(DataType.Object),
        Uint: createOneByteBuffer(DataType.Int),
    };
    const hasBuffer = (typeof Buffer !== 'undefined');
    function serialize(writer, data) {
        if (typeof data === 'undefined') {
            writer.write(BufferPresets.Undefined);
        }
        else if (typeof data === 'string') {
            const buffer = buffer_1.VSBuffer.fromString(data);
            writer.write(BufferPresets.String);
            writeInt32VQL(writer, buffer.byteLength);
            writer.write(buffer);
        }
        else if (hasBuffer && Buffer.isBuffer(data)) {
            const buffer = buffer_1.VSBuffer.wrap(data);
            writer.write(BufferPresets.Buffer);
            writeInt32VQL(writer, buffer.byteLength);
            writer.write(buffer);
        }
        else if (data instanceof buffer_1.VSBuffer) {
            writer.write(BufferPresets.VSBuffer);
            writeInt32VQL(writer, data.byteLength);
            writer.write(data);
        }
        else if (Array.isArray(data)) {
            writer.write(BufferPresets.Array);
            writeInt32VQL(writer, data.length);
            for (const el of data) {
                serialize(writer, el);
            }
        }
        else if (typeof data === 'number' && (data | 0) === data) {
            // write a vql if it's a number that we can do bitwise operations on
            writer.write(BufferPresets.Uint);
            writeInt32VQL(writer, data);
        }
        else {
            const buffer = buffer_1.VSBuffer.fromString(JSON.stringify(data));
            writer.write(BufferPresets.Object);
            writeInt32VQL(writer, buffer.byteLength);
            writer.write(buffer);
        }
    }
    function deserialize(reader) {
        const type = reader.read(1).readUInt8(0);
        switch (type) {
            case DataType.Undefined: return undefined;
            case DataType.String: return reader.read(readIntVQL(reader)).toString();
            case DataType.Buffer: return reader.read(readIntVQL(reader)).buffer;
            case DataType.VSBuffer: return reader.read(readIntVQL(reader));
            case DataType.Array: {
                const length = readIntVQL(reader);
                const result = [];
                for (let i = 0; i < length; i++) {
                    result.push(deserialize(reader));
                }
                return result;
            }
            case DataType.Object: return JSON.parse(reader.read(readIntVQL(reader)).toString());
            case DataType.Int: return readIntVQL(reader);
        }
    }
    class ChannelServer {
        constructor(protocol, ctx, logger = null, timeoutDelay = 1000) {
            this.protocol = protocol;
            this.ctx = ctx;
            this.logger = logger;
            this.timeoutDelay = timeoutDelay;
            this.channels = new Map();
            this.activeRequests = new Map();
            // Requests might come in for channels which are not yet registered.
            // They will timeout after `timeoutDelay`.
            this.pendingRequests = new Map();
            this.protocolListener = this.protocol.onMessage(msg => this.onRawMessage(msg));
            this.sendResponse({ type: 200 /* ResponseType.Initialize */ });
        }
        registerChannel(channelName, channel) {
            this.channels.set(channelName, channel);
            // https://github.com/microsoft/vscode/issues/72531
            setTimeout(() => this.flushPendingRequests(channelName), 0);
        }
        sendResponse(response) {
            switch (response.type) {
                case 200 /* ResponseType.Initialize */: {
                    const msgLength = this.send([response.type]);
                    this.logger?.logOutgoing(msgLength, 0, 1 /* RequestInitiator.OtherSide */, responseTypeToStr(response.type));
                    return;
                }
                case 201 /* ResponseType.PromiseSuccess */:
                case 202 /* ResponseType.PromiseError */:
                case 204 /* ResponseType.EventFire */:
                case 203 /* ResponseType.PromiseErrorObj */: {
                    const msgLength = this.send([response.type, response.id], response.data);
                    this.logger?.logOutgoing(msgLength, response.id, 1 /* RequestInitiator.OtherSide */, responseTypeToStr(response.type), response.data);
                    return;
                }
            }
        }
        send(header, body = undefined) {
            const writer = new BufferWriter();
            serialize(writer, header);
            serialize(writer, body);
            return this.sendBuffer(writer.buffer);
        }
        sendBuffer(message) {
            try {
                this.protocol.send(message);
                return message.byteLength;
            }
            catch (err) {
                // noop
                return 0;
            }
        }
        onRawMessage(message) {
            const reader = new BufferReader(message);
            const header = deserialize(reader);
            const body = deserialize(reader);
            const type = header[0];
            switch (type) {
                case 100 /* RequestType.Promise */:
                    this.logger?.logIncoming(message.byteLength, header[1], 1 /* RequestInitiator.OtherSide */, `${requestTypeToStr(type)}: ${header[2]}.${header[3]}`, body);
                    return this.onPromise({ type, id: header[1], channelName: header[2], name: header[3], arg: body });
                case 102 /* RequestType.EventListen */:
                    this.logger?.logIncoming(message.byteLength, header[1], 1 /* RequestInitiator.OtherSide */, `${requestTypeToStr(type)}: ${header[2]}.${header[3]}`, body);
                    return this.onEventListen({ type, id: header[1], channelName: header[2], name: header[3], arg: body });
                case 101 /* RequestType.PromiseCancel */:
                    this.logger?.logIncoming(message.byteLength, header[1], 1 /* RequestInitiator.OtherSide */, `${requestTypeToStr(type)}`);
                    return this.disposeActiveRequest({ type, id: header[1] });
                case 103 /* RequestType.EventDispose */:
                    this.logger?.logIncoming(message.byteLength, header[1], 1 /* RequestInitiator.OtherSide */, `${requestTypeToStr(type)}`);
                    return this.disposeActiveRequest({ type, id: header[1] });
            }
        }
        onPromise(request) {
            const channel = this.channels.get(request.channelName);
            if (!channel) {
                this.collectPendingRequest(request);
                return;
            }
            const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            let promise;
            try {
                promise = channel.call(this.ctx, request.name, request.arg, cancellationTokenSource.token);
            }
            catch (err) {
                promise = Promise.reject(err);
            }
            const id = request.id;
            promise.then(data => {
                this.sendResponse({ id, data, type: 201 /* ResponseType.PromiseSuccess */ });
            }, err => {
                if (err instanceof Error) {
                    this.sendResponse({
                        id, data: {
                            message: err.message,
                            name: err.name,
                            stack: err.stack ? (err.stack.split ? err.stack.split('\n') : err.stack) : undefined
                        }, type: 202 /* ResponseType.PromiseError */
                    });
                }
                else {
                    this.sendResponse({ id, data: err, type: 203 /* ResponseType.PromiseErrorObj */ });
                }
            }).finally(() => {
                disposable.dispose();
                this.activeRequests.delete(request.id);
            });
            const disposable = (0, lifecycle_1.toDisposable)(() => cancellationTokenSource.cancel());
            this.activeRequests.set(request.id, disposable);
        }
        onEventListen(request) {
            const channel = this.channels.get(request.channelName);
            if (!channel) {
                this.collectPendingRequest(request);
                return;
            }
            const id = request.id;
            const event = channel.listen(this.ctx, request.name, request.arg);
            const disposable = event(data => this.sendResponse({ id, data, type: 204 /* ResponseType.EventFire */ }));
            this.activeRequests.set(request.id, disposable);
        }
        disposeActiveRequest(request) {
            const disposable = this.activeRequests.get(request.id);
            if (disposable) {
                disposable.dispose();
                this.activeRequests.delete(request.id);
            }
        }
        collectPendingRequest(request) {
            let pendingRequests = this.pendingRequests.get(request.channelName);
            if (!pendingRequests) {
                pendingRequests = [];
                this.pendingRequests.set(request.channelName, pendingRequests);
            }
            const timer = setTimeout(() => {
                console.error(`Unknown channel: ${request.channelName}`);
                if (request.type === 100 /* RequestType.Promise */) {
                    this.sendResponse({
                        id: request.id,
                        data: { name: 'Unknown channel', message: `Channel name '${request.channelName}' timed out after ${this.timeoutDelay}ms`, stack: undefined },
                        type: 202 /* ResponseType.PromiseError */
                    });
                }
            }, this.timeoutDelay);
            pendingRequests.push({ request, timeoutTimer: timer });
        }
        flushPendingRequests(channelName) {
            const requests = this.pendingRequests.get(channelName);
            if (requests) {
                for (const request of requests) {
                    clearTimeout(request.timeoutTimer);
                    switch (request.request.type) {
                        case 100 /* RequestType.Promise */:
                            this.onPromise(request.request);
                            break;
                        case 102 /* RequestType.EventListen */:
                            this.onEventListen(request.request);
                            break;
                    }
                }
                this.pendingRequests.delete(channelName);
            }
        }
        dispose() {
            if (this.protocolListener) {
                this.protocolListener.dispose();
                this.protocolListener = null;
            }
            (0, lifecycle_1.dispose)(this.activeRequests.values());
            this.activeRequests.clear();
        }
    }
    exports.ChannelServer = ChannelServer;
    var RequestInitiator;
    (function (RequestInitiator) {
        RequestInitiator[RequestInitiator["LocalSide"] = 0] = "LocalSide";
        RequestInitiator[RequestInitiator["OtherSide"] = 1] = "OtherSide";
    })(RequestInitiator || (exports.RequestInitiator = RequestInitiator = {}));
    class ChannelClient {
        constructor(protocol, logger = null) {
            this.protocol = protocol;
            this.isDisposed = false;
            this.state = State.Uninitialized;
            this.activeRequests = new Set();
            this.handlers = new Map();
            this.lastRequestId = 0;
            this._onDidInitialize = new event_1.Emitter();
            this.onDidInitialize = this._onDidInitialize.event;
            this.protocolListener = this.protocol.onMessage(msg => this.onBuffer(msg));
            this.logger = logger;
        }
        getChannel(channelName) {
            const that = this;
            return {
                call(command, arg, cancellationToken) {
                    if (that.isDisposed) {
                        return Promise.reject(new errors_1.CancellationError());
                    }
                    return that.requestPromise(channelName, command, arg, cancellationToken);
                },
                listen(event, arg) {
                    if (that.isDisposed) {
                        return event_1.Event.None;
                    }
                    return that.requestEvent(channelName, event, arg);
                }
            };
        }
        requestPromise(channelName, name, arg, cancellationToken = cancellation_1.CancellationToken.None) {
            const id = this.lastRequestId++;
            const type = 100 /* RequestType.Promise */;
            const request = { id, type, channelName, name, arg };
            if (cancellationToken.isCancellationRequested) {
                return Promise.reject(new errors_1.CancellationError());
            }
            let disposable;
            const result = new Promise((c, e) => {
                if (cancellationToken.isCancellationRequested) {
                    return e(new errors_1.CancellationError());
                }
                const doRequest = () => {
                    const handler = response => {
                        switch (response.type) {
                            case 201 /* ResponseType.PromiseSuccess */:
                                this.handlers.delete(id);
                                c(response.data);
                                break;
                            case 202 /* ResponseType.PromiseError */: {
                                this.handlers.delete(id);
                                const error = new Error(response.data.message);
                                error.stack = Array.isArray(response.data.stack) ? response.data.stack.join('\n') : response.data.stack;
                                error.name = response.data.name;
                                e(error);
                                break;
                            }
                            case 203 /* ResponseType.PromiseErrorObj */:
                                this.handlers.delete(id);
                                e(response.data);
                                break;
                        }
                    };
                    this.handlers.set(id, handler);
                    this.sendRequest(request);
                };
                let uninitializedPromise = null;
                if (this.state === State.Idle) {
                    doRequest();
                }
                else {
                    uninitializedPromise = (0, async_1.createCancelablePromise)(_ => this.whenInitialized());
                    uninitializedPromise.then(() => {
                        uninitializedPromise = null;
                        doRequest();
                    });
                }
                const cancel = () => {
                    if (uninitializedPromise) {
                        uninitializedPromise.cancel();
                        uninitializedPromise = null;
                    }
                    else {
                        this.sendRequest({ id, type: 101 /* RequestType.PromiseCancel */ });
                    }
                    e(new errors_1.CancellationError());
                };
                const cancellationTokenListener = cancellationToken.onCancellationRequested(cancel);
                disposable = (0, lifecycle_1.combinedDisposable)((0, lifecycle_1.toDisposable)(cancel), cancellationTokenListener);
                this.activeRequests.add(disposable);
            });
            return result.finally(() => {
                disposable.dispose();
                this.activeRequests.delete(disposable);
            });
        }
        requestEvent(channelName, name, arg) {
            const id = this.lastRequestId++;
            const type = 102 /* RequestType.EventListen */;
            const request = { id, type, channelName, name, arg };
            let uninitializedPromise = null;
            const emitter = new event_1.Emitter({
                onWillAddFirstListener: () => {
                    uninitializedPromise = (0, async_1.createCancelablePromise)(_ => this.whenInitialized());
                    uninitializedPromise.then(() => {
                        uninitializedPromise = null;
                        this.activeRequests.add(emitter);
                        this.sendRequest(request);
                    });
                },
                onDidRemoveLastListener: () => {
                    if (uninitializedPromise) {
                        uninitializedPromise.cancel();
                        uninitializedPromise = null;
                    }
                    else {
                        this.activeRequests.delete(emitter);
                        this.sendRequest({ id, type: 103 /* RequestType.EventDispose */ });
                    }
                }
            });
            const handler = (res) => emitter.fire(res.data);
            this.handlers.set(id, handler);
            return emitter.event;
        }
        sendRequest(request) {
            switch (request.type) {
                case 100 /* RequestType.Promise */:
                case 102 /* RequestType.EventListen */: {
                    const msgLength = this.send([request.type, request.id, request.channelName, request.name], request.arg);
                    this.logger?.logOutgoing(msgLength, request.id, 0 /* RequestInitiator.LocalSide */, `${requestTypeToStr(request.type)}: ${request.channelName}.${request.name}`, request.arg);
                    return;
                }
                case 101 /* RequestType.PromiseCancel */:
                case 103 /* RequestType.EventDispose */: {
                    const msgLength = this.send([request.type, request.id]);
                    this.logger?.logOutgoing(msgLength, request.id, 0 /* RequestInitiator.LocalSide */, requestTypeToStr(request.type));
                    return;
                }
            }
        }
        send(header, body = undefined) {
            const writer = new BufferWriter();
            serialize(writer, header);
            serialize(writer, body);
            return this.sendBuffer(writer.buffer);
        }
        sendBuffer(message) {
            try {
                this.protocol.send(message);
                return message.byteLength;
            }
            catch (err) {
                // noop
                return 0;
            }
        }
        onBuffer(message) {
            const reader = new BufferReader(message);
            const header = deserialize(reader);
            const body = deserialize(reader);
            const type = header[0];
            switch (type) {
                case 200 /* ResponseType.Initialize */:
                    this.logger?.logIncoming(message.byteLength, 0, 0 /* RequestInitiator.LocalSide */, responseTypeToStr(type));
                    return this.onResponse({ type: header[0] });
                case 201 /* ResponseType.PromiseSuccess */:
                case 202 /* ResponseType.PromiseError */:
                case 204 /* ResponseType.EventFire */:
                case 203 /* ResponseType.PromiseErrorObj */:
                    this.logger?.logIncoming(message.byteLength, header[1], 0 /* RequestInitiator.LocalSide */, responseTypeToStr(type), body);
                    return this.onResponse({ type: header[0], id: header[1], data: body });
            }
        }
        onResponse(response) {
            if (response.type === 200 /* ResponseType.Initialize */) {
                this.state = State.Idle;
                this._onDidInitialize.fire();
                return;
            }
            const handler = this.handlers.get(response.id);
            handler?.(response);
        }
        get onDidInitializePromise() {
            return event_1.Event.toPromise(this.onDidInitialize);
        }
        whenInitialized() {
            if (this.state === State.Idle) {
                return Promise.resolve();
            }
            else {
                return this.onDidInitializePromise;
            }
        }
        dispose() {
            this.isDisposed = true;
            if (this.protocolListener) {
                this.protocolListener.dispose();
                this.protocolListener = null;
            }
            (0, lifecycle_1.dispose)(this.activeRequests.values());
            this.activeRequests.clear();
        }
    }
    exports.ChannelClient = ChannelClient;
    __decorate([
        decorators_1.memoize
    ], ChannelClient.prototype, "onDidInitializePromise", null);
    /**
     * An `IPCServer` is both a channel server and a routing channel
     * client.
     *
     * As the owner of a protocol, you should extend both this
     * and the `IPCClient` classes to get IPC implementations
     * for your protocol.
     */
    class IPCServer {
        get connections() {
            const result = [];
            this._connections.forEach(ctx => result.push(ctx));
            return result;
        }
        constructor(onDidClientConnect, ipcLogger, timeoutDelay) {
            this.channels = new Map();
            this._connections = new Set();
            this._onDidAddConnection = new event_1.Emitter();
            this.onDidAddConnection = this._onDidAddConnection.event;
            this._onDidRemoveConnection = new event_1.Emitter();
            this.onDidRemoveConnection = this._onDidRemoveConnection.event;
            this.disposables = new lifecycle_1.DisposableStore();
            this.disposables.add(onDidClientConnect(({ protocol, onDidClientDisconnect }) => {
                const onFirstMessage = event_1.Event.once(protocol.onMessage);
                this.disposables.add(onFirstMessage(msg => {
                    const reader = new BufferReader(msg);
                    const ctx = deserialize(reader);
                    const channelServer = new ChannelServer(protocol, ctx, ipcLogger, timeoutDelay);
                    const channelClient = new ChannelClient(protocol, ipcLogger);
                    this.channels.forEach((channel, name) => channelServer.registerChannel(name, channel));
                    const connection = { channelServer, channelClient, ctx };
                    this._connections.add(connection);
                    this._onDidAddConnection.fire(connection);
                    this.disposables.add(onDidClientDisconnect(() => {
                        channelServer.dispose();
                        channelClient.dispose();
                        this._connections.delete(connection);
                        this._onDidRemoveConnection.fire(connection);
                    }));
                }));
            }));
        }
        getChannel(channelName, routerOrClientFilter) {
            const that = this;
            return {
                call(command, arg, cancellationToken) {
                    let connectionPromise;
                    if ((0, types_1.isFunction)(routerOrClientFilter)) {
                        // when no router is provided, we go random client picking
                        const connection = (0, arrays_1.getRandomElement)(that.connections.filter(routerOrClientFilter));
                        connectionPromise = connection
                            // if we found a client, let's call on it
                            ? Promise.resolve(connection)
                            // else, let's wait for a client to come along
                            : event_1.Event.toPromise(event_1.Event.filter(that.onDidAddConnection, routerOrClientFilter));
                    }
                    else {
                        connectionPromise = routerOrClientFilter.routeCall(that, command, arg);
                    }
                    const channelPromise = connectionPromise
                        .then(connection => connection.channelClient.getChannel(channelName));
                    return getDelayedChannel(channelPromise)
                        .call(command, arg, cancellationToken);
                },
                listen(event, arg) {
                    if ((0, types_1.isFunction)(routerOrClientFilter)) {
                        return that.getMulticastEvent(channelName, routerOrClientFilter, event, arg);
                    }
                    const channelPromise = routerOrClientFilter.routeEvent(that, event, arg)
                        .then(connection => connection.channelClient.getChannel(channelName));
                    return getDelayedChannel(channelPromise)
                        .listen(event, arg);
                }
            };
        }
        getMulticastEvent(channelName, clientFilter, eventName, arg) {
            const that = this;
            let disposables;
            // Create an emitter which hooks up to all clients
            // as soon as first listener is added. It also
            // disconnects from all clients as soon as the last listener
            // is removed.
            const emitter = new event_1.Emitter({
                onWillAddFirstListener: () => {
                    disposables = new lifecycle_1.DisposableStore();
                    // The event multiplexer is useful since the active
                    // client list is dynamic. We need to hook up and disconnection
                    // to/from clients as they come and go.
                    const eventMultiplexer = new event_1.EventMultiplexer();
                    const map = new Map();
                    const onDidAddConnection = (connection) => {
                        const channel = connection.channelClient.getChannel(channelName);
                        const event = channel.listen(eventName, arg);
                        const disposable = eventMultiplexer.add(event);
                        map.set(connection, disposable);
                    };
                    const onDidRemoveConnection = (connection) => {
                        const disposable = map.get(connection);
                        if (!disposable) {
                            return;
                        }
                        disposable.dispose();
                        map.delete(connection);
                    };
                    that.connections.filter(clientFilter).forEach(onDidAddConnection);
                    event_1.Event.filter(that.onDidAddConnection, clientFilter)(onDidAddConnection, undefined, disposables);
                    that.onDidRemoveConnection(onDidRemoveConnection, undefined, disposables);
                    eventMultiplexer.event(emitter.fire, emitter, disposables);
                    disposables.add(eventMultiplexer);
                },
                onDidRemoveLastListener: () => {
                    disposables?.dispose();
                    disposables = undefined;
                }
            });
            return emitter.event;
        }
        registerChannel(channelName, channel) {
            this.channels.set(channelName, channel);
            for (const connection of this._connections) {
                connection.channelServer.registerChannel(channelName, channel);
            }
        }
        dispose() {
            this.disposables.dispose();
            for (const connection of this._connections) {
                connection.channelClient.dispose();
                connection.channelServer.dispose();
            }
            this._connections.clear();
            this.channels.clear();
            this._onDidAddConnection.dispose();
            this._onDidRemoveConnection.dispose();
        }
    }
    exports.IPCServer = IPCServer;
    /**
     * An `IPCClient` is both a channel client and a channel server.
     *
     * As the owner of a protocol, you should extend both this
     * and the `IPCServer` classes to get IPC implementations
     * for your protocol.
     */
    class IPCClient {
        constructor(protocol, ctx, ipcLogger = null) {
            const writer = new BufferWriter();
            serialize(writer, ctx);
            protocol.send(writer.buffer);
            this.channelClient = new ChannelClient(protocol, ipcLogger);
            this.channelServer = new ChannelServer(protocol, ctx, ipcLogger);
        }
        getChannel(channelName) {
            return this.channelClient.getChannel(channelName);
        }
        registerChannel(channelName, channel) {
            this.channelServer.registerChannel(channelName, channel);
        }
        dispose() {
            this.channelClient.dispose();
            this.channelServer.dispose();
        }
    }
    exports.IPCClient = IPCClient;
    function getDelayedChannel(promise) {
        return {
            call(command, arg, cancellationToken) {
                return promise.then(c => c.call(command, arg, cancellationToken));
            },
            listen(event, arg) {
                const relay = new event_1.Relay();
                promise.then(c => relay.input = c.listen(event, arg));
                return relay.event;
            }
        };
    }
    function getNextTickChannel(channel) {
        let didTick = false;
        return {
            call(command, arg, cancellationToken) {
                if (didTick) {
                    return channel.call(command, arg, cancellationToken);
                }
                return (0, async_1.timeout)(0)
                    .then(() => didTick = true)
                    .then(() => channel.call(command, arg, cancellationToken));
            },
            listen(event, arg) {
                if (didTick) {
                    return channel.listen(event, arg);
                }
                const relay = new event_1.Relay();
                (0, async_1.timeout)(0)
                    .then(() => didTick = true)
                    .then(() => relay.input = channel.listen(event, arg));
                return relay.event;
            }
        };
    }
    class StaticRouter {
        constructor(fn) {
            this.fn = fn;
        }
        routeCall(hub) {
            return this.route(hub);
        }
        routeEvent(hub) {
            return this.route(hub);
        }
        async route(hub) {
            for (const connection of hub.connections) {
                if (await Promise.resolve(this.fn(connection.ctx))) {
                    return Promise.resolve(connection);
                }
            }
            await event_1.Event.toPromise(hub.onDidAddConnection);
            return await this.route(hub);
        }
    }
    exports.StaticRouter = StaticRouter;
    /**
     * Use ProxyChannels to automatically wrapping and unwrapping
     * services to/from IPC channels, instead of manually wrapping
     * each service method and event.
     *
     * Restrictions:
     * - If marshalling is enabled, only `URI` and `RegExp` is converted
     *   automatically for you
     * - Events must follow the naming convention `onUpperCase`
     * - `CancellationToken` is currently not supported
     * - If a context is provided, you can use `AddFirstParameterToFunctions`
     *   utility to signal this in the receiving side type
     */
    var ProxyChannel;
    (function (ProxyChannel) {
        function fromService(service, disposables, options) {
            const handler = service;
            const disableMarshalling = options && options.disableMarshalling;
            // Buffer any event that should be supported by
            // iterating over all property keys and finding them
            // However, this will not work for services that
            // are lazy and use a Proxy within. For that we
            // still need to check later (see below).
            const mapEventNameToEvent = new Map();
            for (const key in handler) {
                if (propertyIsEvent(key)) {
                    mapEventNameToEvent.set(key, event_1.Event.buffer(handler[key], true, undefined, disposables));
                }
            }
            return new class {
                listen(_, event, arg) {
                    const eventImpl = mapEventNameToEvent.get(event);
                    if (eventImpl) {
                        return eventImpl;
                    }
                    const target = handler[event];
                    if (typeof target === 'function') {
                        if (propertyIsDynamicEvent(event)) {
                            return target.call(handler, arg);
                        }
                        if (propertyIsEvent(event)) {
                            mapEventNameToEvent.set(event, event_1.Event.buffer(handler[event], true, undefined, disposables));
                            return mapEventNameToEvent.get(event);
                        }
                    }
                    throw new errors_1.ErrorNoTelemetry(`Event not found: ${event}`);
                }
                call(_, command, args) {
                    const target = handler[command];
                    if (typeof target === 'function') {
                        // Revive unless marshalling disabled
                        if (!disableMarshalling && Array.isArray(args)) {
                            for (let i = 0; i < args.length; i++) {
                                args[i] = (0, marshalling_1.revive)(args[i]);
                            }
                        }
                        let res = target.apply(handler, args);
                        if (!(res instanceof Promise)) {
                            res = Promise.resolve(res);
                        }
                        return res;
                    }
                    throw new errors_1.ErrorNoTelemetry(`Method not found: ${command}`);
                }
            };
        }
        ProxyChannel.fromService = fromService;
        function toService(channel, options) {
            const disableMarshalling = options && options.disableMarshalling;
            return new Proxy({}, {
                get(_target, propKey) {
                    if (typeof propKey === 'string') {
                        // Check for predefined values
                        if (options?.properties?.has(propKey)) {
                            return options.properties.get(propKey);
                        }
                        // Dynamic Event
                        if (propertyIsDynamicEvent(propKey)) {
                            return function (arg) {
                                return channel.listen(propKey, arg);
                            };
                        }
                        // Event
                        if (propertyIsEvent(propKey)) {
                            return channel.listen(propKey);
                        }
                        // Function
                        return async function (...args) {
                            // Add context if any
                            let methodArgs;
                            if (options && !(0, types_1.isUndefinedOrNull)(options.context)) {
                                methodArgs = [options.context, ...args];
                            }
                            else {
                                methodArgs = args;
                            }
                            const result = await channel.call(propKey, methodArgs);
                            // Revive unless marshalling disabled
                            if (!disableMarshalling) {
                                return (0, marshalling_1.revive)(result);
                            }
                            return result;
                        };
                    }
                    throw new errors_1.ErrorNoTelemetry(`Property not found: ${String(propKey)}`);
                }
            });
        }
        ProxyChannel.toService = toService;
        function propertyIsEvent(name) {
            // Assume a property is an event if it has a form of "onSomething"
            return name[0] === 'o' && name[1] === 'n' && strings.isUpperAsciiLetter(name.charCodeAt(2));
        }
        function propertyIsDynamicEvent(name) {
            // Assume a property is a dynamic event (a method that returns an event) if it has a form of "onDynamicSomething"
            return /^onDynamic/.test(name) && strings.isUpperAsciiLetter(name.charCodeAt(9));
        }
    })(ProxyChannel || (exports.ProxyChannel = ProxyChannel = {}));
    const colorTables = [
        ['#2977B1', '#FC802D', '#34A13A', '#D3282F', '#9366BA'],
        ['#8B564C', '#E177C0', '#7F7F7F', '#BBBE3D', '#2EBECD']
    ];
    function prettyWithoutArrays(data) {
        if (Array.isArray(data)) {
            return data;
        }
        if (data && typeof data === 'object' && typeof data.toString === 'function') {
            const result = data.toString();
            if (result !== '[object Object]') {
                return result;
            }
        }
        return data;
    }
    function pretty(data) {
        if (Array.isArray(data)) {
            return data.map(prettyWithoutArrays);
        }
        return prettyWithoutArrays(data);
    }
    function logWithColors(direction, totalLength, msgLength, req, initiator, str, data) {
        data = pretty(data);
        const colorTable = colorTables[initiator];
        const color = colorTable[req % colorTable.length];
        let args = [`%c[${direction}]%c[${String(totalLength).padStart(7, ' ')}]%c[len: ${String(msgLength).padStart(5, ' ')}]%c${String(req).padStart(5, ' ')} - ${str}`, 'color: darkgreen', 'color: grey', 'color: grey', `color: ${color}`];
        if (/\($/.test(str)) {
            args = args.concat(data);
            args.push(')');
        }
        else {
            args.push(data);
        }
        console.log.apply(console, args);
    }
    class IPCLogger {
        constructor(_outgoingPrefix, _incomingPrefix) {
            this._outgoingPrefix = _outgoingPrefix;
            this._incomingPrefix = _incomingPrefix;
            this._totalIncoming = 0;
            this._totalOutgoing = 0;
        }
        logOutgoing(msgLength, requestId, initiator, str, data) {
            this._totalOutgoing += msgLength;
            logWithColors(this._outgoingPrefix, this._totalOutgoing, msgLength, requestId, initiator, str, data);
        }
        logIncoming(msgLength, requestId, initiator, str, data) {
            this._totalIncoming += msgLength;
            logWithColors(this._incomingPrefix, this._totalIncoming, msgLength, requestId, initiator, str, data);
        }
    }
    exports.IPCLogger = IPCLogger;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3BhcnRzL2lwYy9jb21tb24vaXBjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7OztJQXFRaEcsOEJBa0NDO0lBRUQsa0NBcUJDO0lBa3FCRCw4Q0FZQztJQUVELGdEQTJCQztJQXQrQkQsSUFBVyxXQUtWO0lBTEQsV0FBVyxXQUFXO1FBQ3JCLHFEQUFhLENBQUE7UUFDYixpRUFBbUIsQ0FBQTtRQUNuQiw2REFBaUIsQ0FBQTtRQUNqQiwrREFBa0IsQ0FBQTtJQUNuQixDQUFDLEVBTFUsV0FBVyxLQUFYLFdBQVcsUUFLckI7SUFFRCxTQUFTLGdCQUFnQixDQUFDLElBQWlCO1FBQzFDLFFBQVEsSUFBSSxFQUFFLENBQUM7WUFDZDtnQkFDQyxPQUFPLEtBQUssQ0FBQztZQUNkO2dCQUNDLE9BQU8sUUFBUSxDQUFDO1lBQ2pCO2dCQUNDLE9BQU8sV0FBVyxDQUFDO1lBQ3BCO2dCQUNDLE9BQU8sYUFBYSxDQUFDO1FBQ3ZCLENBQUM7SUFDRixDQUFDO0lBUUQsSUFBVyxZQU1WO0lBTkQsV0FBVyxZQUFZO1FBQ3RCLDZEQUFnQixDQUFBO1FBQ2hCLHFFQUFvQixDQUFBO1FBQ3BCLGlFQUFrQixDQUFBO1FBQ2xCLHVFQUFxQixDQUFBO1FBQ3JCLDJEQUFlLENBQUE7SUFDaEIsQ0FBQyxFQU5VLFlBQVksS0FBWixZQUFZLFFBTXRCO0lBRUQsU0FBUyxpQkFBaUIsQ0FBQyxJQUFrQjtRQUM1QyxRQUFRLElBQUksRUFBRSxDQUFDO1lBQ2Q7Z0JBQ0MsT0FBTyxNQUFNLENBQUM7WUFDZjtnQkFDQyxPQUFPLFFBQVEsQ0FBQztZQUNqQix5Q0FBK0I7WUFDL0I7Z0JBQ0MsT0FBTyxXQUFXLENBQUM7WUFDcEI7Z0JBQ0MsT0FBTyxRQUFRLENBQUM7UUFDbEIs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