/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uriIpc", "vs/workbench/services/extensions/common/lazyPromise", "vs/workbench/services/extensions/common/proxyIdentifier"], function (require, exports, async_1, buffer_1, cancellation_1, errors, event_1, lifecycle_1, uriIpc_1, lazyPromise_1, proxyIdentifier_1) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RPCProtocol = exports.ResponsiveState = exports.RequestInitiator = void 0;
    exports.stringifyJsonWithBufferRefs = stringifyJsonWithBufferRefs;
    exports.parseJsonAndRestoreBufferRefs = parseJsonAndRestoreBufferRefs;
    function safeStringify(obj, replacer) {
        try {
            return JSON.stringify(obj, replacer);
        }
        catch (err) {
            return 'null';
        }
    }
    const refSymbolName = '$$ref$$';
    const undefinedRef = { [refSymbolName]: -1 };
    class StringifiedJsonWithBufferRefs {
        constructor(jsonString, referencedBuffers) {
            this.jsonString = jsonString;
            this.referencedBuffers = referencedBuffers;
        }
    }
    function stringifyJsonWithBufferRefs(obj, replacer = null, useSafeStringify = false) {
        const foundBuffers = [];
        const serialized = (useSafeStringify ? safeStringify : JSON.stringify)(obj, (key, value) => {
            if (typeof value === 'undefined') {
                return undefinedRef; // JSON.stringify normally converts 'undefined' to 'null'
            }
            else if (typeof value === 'object') {
                if (value instanceof buffer_1.VSBuffer) {
                    const bufferIndex = foundBuffers.push(value) - 1;
                    return { [refSymbolName]: bufferIndex };
                }
                if (replacer) {
                    return replacer(key, value);
                }
            }
            return value;
        });
        return {
            jsonString: serialized,
            referencedBuffers: foundBuffers
        };
    }
    function parseJsonAndRestoreBufferRefs(jsonString, buffers, uriTransformer) {
        return JSON.parse(jsonString, (_key, value) => {
            if (value) {
                const ref = value[refSymbolName];
                if (typeof ref === 'number') {
                    return buffers[ref];
                }
                if (uriTransformer && value.$mid === 1 /* MarshalledId.Uri */) {
                    return uriTransformer.transformIncoming(value);
                }
            }
            return value;
        });
    }
    function stringify(obj, replacer) {
        return JSON.stringify(obj, replacer);
    }
    function createURIReplacer(transformer) {
        if (!transformer) {
            return null;
        }
        return (key, value) => {
            if (value && value.$mid === 1 /* MarshalledId.Uri */) {
                return transformer.transformOutgoing(value);
            }
            return value;
        };
    }
    var RequestInitiator;
    (function (RequestInitiator) {
        RequestInitiator[RequestInitiator["LocalSide"] = 0] = "LocalSide";
        RequestInitiator[RequestInitiator["OtherSide"] = 1] = "OtherSide";
    })(RequestInitiator || (exports.RequestInitiator = RequestInitiator = {}));
    var ResponsiveState;
    (function (ResponsiveState) {
        ResponsiveState[ResponsiveState["Responsive"] = 0] = "Responsive";
        ResponsiveState[ResponsiveState["Unresponsive"] = 1] = "Unresponsive";
    })(ResponsiveState || (exports.ResponsiveState = ResponsiveState = {}));
    const noop = () => { };
    const _RPCProtocolSymbol = Symbol.for('rpcProtocol');
    const _RPCProxySymbol = Symbol.for('rpcProxy');
    class RPCProtocol extends lifecycle_1.Disposable {
        static { _a = _RPCProtocolSymbol; }
        static { this.UNRESPONSIVE_TIME = 3 * 1000; } // 3s
        constructor(protocol, logger = null, transformer = null) {
            super();
            this[_a] = true;
            this._onDidChangeResponsiveState = this._register(new event_1.Emitter());
            this.onDidChangeResponsiveState = this._onDidChangeResponsiveState.event;
            this._protocol = protocol;
            this._logger = logger;
            this._uriTransformer = transformer;
            this._uriReplacer = createURIReplacer(this._uriTransformer);
            this._isDisposed = false;
            this._locals = [];
            this._proxies = [];
            for (let i = 0, len = proxyIdentifier_1.ProxyIdentifier.count; i < len; i++) {
                this._locals[i] = null;
                this._proxies[i] = null;
            }
            this._lastMessageId = 0;
            this._cancelInvokedHandlers = Object.create(null);
            this._pendingRPCReplies = {};
            this._responsiveState = 0 /* ResponsiveState.Responsive */;
            this._unacknowledgedCount = 0;
            this._unresponsiveTime = 0;
            this._asyncCheckUresponsive = this._register(new async_1.RunOnceScheduler(() => this._checkUnresponsive(), 1000));
            this._protocol.onMessage((msg) => this._receiveOneMessage(msg));
        }
        dispose() {
            this._isDisposed = true;
            // Release all outstanding promises with a canceled error
            Object.keys(this._pendingRPCReplies).forEach((msgId) => {
                const pending = this._pendingRPCReplies[msgId];
                delete this._pendingRPCReplies[msgId];
                pending.resolveErr(errors.canceled());
            });
            super.dispose();
        }
        drain() {
            if (typeof this._protocol.drain === 'function') {
                return this._protocol.drain();
            }
            return Promise.resolve();
        }
        _onWillSendRequest(req) {
            if (this._unacknowledgedCount === 0) {
                // Since this is the first request we are sending in a while,
                // mark this moment as the start for the countdown to unresponsive time
                this._unresponsiveTime = Date.now() + RPCProtocol.UNRESPONSIVE_TIME;
            }
            this._unacknowledgedCount++;
            if (!this._asyncCheckUresponsive.isScheduled()) {
                this._asyncCheckUresponsive.schedule();
            }
        }
        _onDidReceiveAcknowledge(req) {
            // The next possible unresponsive time is now + delta.
            this._unresponsiveTime = Date.now() + RPCProtocol.UNRESPONSIVE_TIME;
            this._unacknowledgedCount--;
            if (this._unacknowledgedCount === 0) {
                // No more need to check for unresponsive
                this._asyncCheckUresponsive.cancel();
            }
            // The ext host is responsive!
            this._setResponsiveState(0 /* ResponsiveState.Responsive */);
        }
        _checkUnresponsive() {
            if (this._unacknowledgedCount === 0) {
                // Not waiting for anything => cannot say if it is responsive or not
                return;
            }
            if (Date.now() > this._unresponsiveTime) {
                // Unresponsive!!
                this._setResponsiveState(1 /* ResponsiveState.Unresponsive */);
            }
            else {
                // Not (yet) unresponsive, be sure to check again soon
                this._asyncCheckUresponsive.schedule();
            }
        }
        _setResponsiveState(newResponsiveState) {
            if (this._responsiveState === newResponsiveState) {
                // no change
                return;
            }
            this._responsiveState = newResponsiveState;
            this._onDidChangeResponsiveState.fire(this._responsiveState);
        }
        get responsiveState() {
            return this._responsiveState;
        }
        transformIncomingURIs(obj) {
            if (!this._uriTransformer) {
                return obj;
            }
            return (0, uriIpc_1.transformIncomingURIs)(obj, this._uriTransformer);
        }
        getProxy(identifier) {
            const { nid: rpcId, sid } = identifier;
            if (!this._proxies[rpcId]) {
                this._proxies[rpcId] = this._createProxy(rpcId, sid);
            }
            return this._proxies[rpcId];
        }
        _createProxy(rpcId, debugName) {
            const handler = {
                get: (target, name) => {
                    if (typeof name === 'string' && !target[name] && name.charCodeAt(0) === 36 /* CharCode.DollarSign */) {
                        target[name] = (...myArgs) => {
                            return this._remoteCall(rpcId, name, myArgs);
                        };
                    }
                    if (name === _RPCProxySymbol) {
                        return debugName;
                    }
                    return target[name];
                }
            };
            return new Proxy(Object.create(null), handler);
        }
        set(identifier, value) {
            this._locals[identifier.nid] = value;
            return value;
        }
        assertRegistered(identifiers) {
            for (let i = 0, len = identifiers.length; i < len; i++) {
                const identifier = identifiers[i];
                if (!this._locals[identifier.nid]) {
                    throw new Error(`Missing proxy instance ${identifier.sid}`);
                }
            }
        }
        _receiveOneMessage(rawmsg) {
            if (this._isDisposed) {
                return;
            }
            const msgLength = rawmsg.byteLength;
            const buff = MessageBuffer.read(rawmsg, 0);
            const messageType = buff.readUInt8();
            const req = buff.readUInt32();
            switch (messageType) {
                case 1 /* MessageType.RequestJSONArgs */:
                case 2 /* MessageType.RequestJSONArgsWithCancellation */: {
                    let { rpcId, method, args } = MessageIO.deserializeRequestJSONArgs(buff);
                    if (this._uriTransformer) {
                        args = (0, uriIpc_1.transformIncomingURIs)(args, this._uriTransformer);
                    }
                    this._receiveRequest(msgLength, req, rpcId, method, args, (messageType === 2 /* MessageType.RequestJSONArgsWithCancellation */));
                    break;
                }
                case 3 /* MessageType.RequestMixedArgs */:
                case 4 /* MessageType.RequestMixedArgsWithCancellation */: {
                    let { rpcId, method, args } = MessageIO.deserializeRequestMixedArgs(buff);
                    if (this._uriTransformer) {
                        args = (0, uriIpc_1.transformIncomingURIs)(args, this._uriTransformer);
                    }
                    this._receiveRequest(msgLength, req, rpcId, method, args, (messageType === 4 /* MessageType.RequestMixedArgsWithCancellation */));
                    break;
                }
                case 5 /* MessageType.Acknowledged */: {
                    this._logger?.logIncoming(msgLength, req, 0 /* RequestInitiator.LocalSide */, `ack`);
                    this._onDidReceiveAcknowledge(req);
                    break;
                }
                case 6 /* MessageType.Cancel */: {
                    this._receiveCancel(msgLength, req);
                    break;
                }
                case 7 /* MessageType.ReplyOKEmpty */: {
                    this._receiveReply(msgLength, req, undefined);
                    break;
                }
                case 9 /* MessageType.ReplyOKJSON */: {
                    let value = MessageIO.deserializeReplyOKJSON(buff);
                    if (this._uriTransformer) {
                        value = (0, uriIpc_1.transformIncomingURIs)(value, this._uriTransformer);
                    }
                    this._receiveReply(msgLength, req, value);
                    break;
                }
                case 10 /* MessageType.ReplyOKJSONWithBuffers */: {
                    const value = MessageIO.deserializeReplyOKJSONWithBuffers(buff, this._uriTransformer);
                    this._receiveReply(msgLength, req, value);
                    break;
                }
                case 8 /* MessageType.ReplyOKVSBuffer */: {
                    const value = MessageIO.deserializeReplyOKVSBuffer(buff);
                    this._receiveReply(msgLength, req, value);
                    break;
                }
                case 11 /* MessageType.ReplyErrError */: {
                    let err = MessageIO.deserializeReplyErrError(buff);
                    if (this._uriTransformer) {
                        err = (0, uriIpc_1.transformIncomingURIs)(err, this._uriTransformer);
                    }
                    this._receiveReplyErr(msgLength, req, err);
                    break;
                }
                case 12 /* MessageType.ReplyErrEmpty */: {
                    this._receiveReplyErr(msgLength, req, undefined);
                    break;
                }
                default:
                    console.error(`received unexpected message`);
                    console.error(rawmsg);
            }
        }
        _receiveRequest(msgLength, req, rpcId, method, args, usesCancellationToken) {
            this._logger?.logIncoming(msgLength, req, 1 /* RequestInitiator.OtherSide */, `receiveRequest ${(0, proxyIdentifier_1.getStringIdentifierForProxy)(rpcId)}.${method}(`, args);
            const callId = String(req);
            let promise;
            let cancel;
            if (usesCancellationToken) {
                const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
                args.push(cancellationTokenSource.token);
                promise = this._invokeHandler(rpcId, method, args);
                cancel = () => cancellationTokenSource.cancel();
            }
            else {
                // cannot be cancelled
                promise = this._invokeHandler(rpcId, method, args);
                cancel = noop;
            }
            this._cancelInvokedHandlers[callId] = cancel;
            // Acknowledge the request
            const msg = MessageIO.serializeAcknowledged(req);
            this._logger?.logOutgoing(msg.byteLength, req, 1 /* RequestInitiator.OtherSide */, `ack`);
            this._protocol.send(msg);
            promise.then((r) => {
                delete this._cancelInvokedHandlers[callId];
                const msg = MessageIO.serializeReplyOK(req, r, this._uriReplacer);
                this._logger?.logOutgoing(msg.byteLength, req, 1 /* RequestInitiator.OtherSide */, `reply:`, r);
                this._protocol.send(msg);
            }, (err) => {
                delete this._cancelInvokedHandlers[callId];
                const msg = MessageIO.serializeReplyErr(req, err);
                this._logger?.logOutgoing(msg.byteLength, req, 1 /* RequestInitiator.OtherSide */, `replyErr:`, err);
                this._protocol.send(msg);
            });
        }
        _receiveCancel(msgLength, req) {
            this._logger?.logIncoming(msgLength, req, 1 /* RequestInitiator.OtherSide */, `receiveCancel`);
            const callId = String(req);
            this._cancelInvokedHandlers[callId]?.();
        }
        _receiveReply(msgLength, req, value) {
            this._logger?.logIncoming(msgLength, req, 0 /* RequestInitiator.LocalSide */, `receiveReply:`, value);
            const callId = String(req);
            if (!this._pendingRPCReplies.hasOwnProperty(callId)) {
                return;
            }
            const pendingReply = this._pendingRPCReplies[callId];
            delete this._pendingRPCReplies[callId];
            pendingReply.resolveOk(value);
        }
        _receiveReplyErr(msgLength, req, value) {
            this._logger?.logIncoming(msgLength, req, 0 /* RequestInitiator.LocalSide */, `receiveReplyErr:`, value);
            const callId = String(req);
            if (!this._pendingRPCReplies.hasOwnProperty(callId)) {
                return;
            }
            const pendingReply = this._pendingRPCReplies[callId];
            delete this._pendingRPCReplies[callId];
            let err = undefined;
            if (value) {
                if (value.$isError) {
                    err = new Error();
                    err.name = value.name;
                    err.message = value.message;
                    err.stack = value.stack;
                }
                else {
                    err = value;
                }
            }
            pendingReply.resolveErr(err);
        }
        _invokeHandler(rpcId, methodName, args) {
            try {
                return Promise.resolve(this._doInvokeHandler(rpcId, methodName, args));
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
        _doInvokeHandler(rpcId, methodName, args) {
            const actor = this._locals[rpcId];
            if (!actor) {
                throw new Error('Unknown actor ' + (0, proxyIdentifier_1.getStringIdentifierForProxy)(rpcId));
            }
            const method = actor[methodName];
            if (typeof method !== 'function') {
                throw new Error('Unknown method ' + methodName + ' on actor ' + (0, proxyIdentifier_1.getStringIdentifierForProxy)(rpcId));
            }
            return method.apply(actor, args);
        }
        _remoteCall(rpcId, methodName, args) {
            if (this._isDisposed) {
                return new lazyPromise_1.CanceledLazyPromise();
            }
            let cancellationToken = null;
            if (args.length > 0 && cancellation_1.CancellationToken.isCancellationToken(args[args.length - 1])) {
                cancellationToken = args.pop();
            }
            if (cancellationToken && cancellationToken.isCancellationRequested) {
                // No need to do anything...
                return Promise.reject(errors.canceled());
            }
            const serializedRequestArguments = MessageIO.serializeRequestArguments(args, this._uriReplacer);
            const req = ++this._lastMessageId;
            const callId = String(req);
            const result = new lazyPromise_1.LazyPromise();
            const disposable = new lifecycle_1.DisposableStore();
            if (cancellationToken) {
                disposable.add(cancellationToken.onCancellationRequested(() => {
                    const msg = MessageIO.serializeCancel(req);
                    this._logger?.logOutgoing(msg.byteLength, req, 0 /* RequestInitiator.LocalSide */, `cancel`);
                    this._protocol.send(MessageIO.serializeCancel(req));
                }));
            }
            this._pendingRPCReplies[callId] = new PendingRPCReply(result, disposable);
            this._onWillSendRequest(req);
            const msg = MessageIO.serializeRequest(req, rpcId, methodName, serializedRequestArguments, !!cancellationToken);
            this._logger?.logOutgoing(msg.byteLength, req, 0 /* RequestInitiator.LocalSide */, `request: ${(0, proxyIdentifier_1.getStringIdentifierForProxy)(rpcId)}.${methodName}(`, args);
            this._protocol.send(msg);
            return result;
        }
    }
    exports.RPCProtocol = RPCProtocol;
    class PendingRPCReply {
        constructor(_promise, _disposable) {
            this._promise = _promise;
            this._disposable = _disposable;
        }
        resolveOk(value) {
            this._promise.resolveOk(value);
            this._disposable.dispose();
        }
        resolveErr(err) {
            this._promise.resolveErr(err);
            this._disposable.dispose();
        }
    }
    class MessageBuffer {
        static alloc(type, req, messageSize) {
            const result = new MessageBuffer(buffer_1.VSBuffer.alloc(messageSize + 1 /* type */ + 4 /* req */), 0);
            result.writeUInt8(type);
            result.writeUInt32(req);
            return result;
        }
        static read(buff, offset) {
            return new MessageBuffer(buff, offset);
        }
        get buffer() {
            return this._buff;
        }
        constructor(buff, offset) {
            this._buff = buff;
            this._offset = offset;
        }
        static sizeUInt8() {
            return 1;
        }
        static { this.sizeUInt32 = 4; }
        writeUInt8(n) {
            this._buff.writeUInt8(n, this._offset);
            this._offset += 1;
        }
        readUInt8() {
            const n = this._buff.readUInt8(this._offset);
            this._offset += 1;
            return n;
        }
        writeUInt32(n) {
            this._buff.writeUInt32BE(n, this._offset);
            this._offset += 4;
        }
        readUInt32() {
            const n = this._buff.readUInt32BE(this._offset);
            this._offset += 4;
            return n;
        }
        static sizeShortString(str) {
            return 1 /* string length */ + str.byteLength /* actual string */;
        }
        writeShortString(str) {
            this._buff.writeUInt8(str.byteLength, this._offset);
            this._offset += 1;
            this._buff.set(str, this._offset);
            this._offset += str.byteLength;
        }
        readShortString() {
            const strByteLength = this._buff.readUInt8(this._offset);
            this._offset += 1;
            const strBuff = this._buff.slice(this._offset, this._offset + strByteLength);
            const str = strBuff.toString();
            this._offset += strByteLength;
            return str;
        }
        static sizeLongString(str) {
            return 4 /* string length */ + str.byteLength /* actual string */;
        }
        writeLongString(str) {
            this._buff.writeUInt32BE(str.byteLength, this._offset);
            this._offset += 4;
            this._buff.set(str, this._offset);
            this._offset += str.byteLength;
        }
        readLongString() {
            const strByteLength = this._buff.readUInt32BE(this._offset);
            this._offset += 4;
            const strBuff = this._buff.slice(this._offset, this._offset + strByteLength);
            const str = strBuff.toString();
            this._offset += strByteLength;
            return str;
        }
        writeBuffer(buff) {
            this._buff.writeUInt32BE(buff.byteLength, this._offset);
            this._offset += 4;
            this._buff.set(buff, this._offset);
            this._offset += buff.byteLength;
        }
        static sizeVSBuffer(buff) {
            return 4 /* buffer length */ + buff.byteLength /* actual buffer */;
        }
        writeVSBuffer(buff) {
            this._buff.writeUInt32BE(buff.byteLength, this._offset);
            this._offset += 4;
            this._buff.set(buff, this._offset);
            this._offset += buff.byteLength;
        }
        readVSBuffer() {
            const buffLength = this._buff.readUInt32BE(this._offset);
            this._offset += 4;
            const buff = this._buff.slice(this._offset, this._offset + buffLength);
            this._offset += buffLength;
            return buff;
        }
        static sizeMixedArray(arr) {
            let size = 0;
            size += 1; // arr length
            for (let i = 0, len = arr.length; i < len; i++) {
                const el = arr[i];
                size += 1; // arg type
                switch (el.type) {
                    case 1 /* ArgType.String */:
                        size += this.sizeLongString(el.value);
                        break;
                    case 2 /* ArgType.VSBuffer */:
                        size += this.sizeVSBuffer(el.value);
                        break;
                    case 3 /* ArgType.SerializedObjectWithBuffers */:
                        size += this.sizeUInt32; // buffer count
                        size += this.sizeLongString(el.value);
                        for (let i = 0; i < el.buffers.length; ++i) {
                            size += this.sizeVSBuffer(el.buffers[i]);
                        }
                        break;
                    case 4 /* ArgType.Undefined */:
                        // empty...
                        break;
                }
            }
            return size;
        }
        writeMixedArray(arr) {
            this._buff.writeUInt8(arr.length, this._offset);
            this._offset += 1;
            for (let i = 0, len = arr.length; i < len; i++) {
                const el = arr[i];
                switch (el.type) {
                    case 1 /* ArgType.String */:
                        this.writeUInt8(1 /* ArgType.String */);
                        this.writeLongString(el.value);
                        break;
                    case 2 /* ArgType.VSBuffer */:
                        this.writeUInt8(2 /* ArgType.VSBuffer */);
                        this.writeVSBuffer(el.value);
                        break;
                    case 3 /* ArgType.SerializedObjectWithBuffers */:
                        this.writeUInt8(3 /* ArgType.SerializedObjectWithBuffers */);
                        this.writeUInt32(el.buffers.length);
                        this.writeLongString(el.value);
                        for (let i = 0; i < el.buffers.length; ++i) {
                            this.writeBuffer(el.buffers[i]);
                        }
                        break;
                    case 4 /* ArgType.Undefined */:
                        this.writeUInt8(4 /* ArgType.Undefined */);
                        break;
                }
            }
        }
        readMixedArray() {
            const arrLen = this._buff.readUInt8(this._offset);
            this._offset += 1;
            const arr = new Array(arrLen);
            for (let i = 0; i < arrLen; i++) {
                const argType = this.readUInt8();
                switch (argType) {
                    case 1 /* ArgType.String */:
                        arr[i] = this.readLongString();
                        break;
                    case 2 /* ArgType.VSBuffer */:
                        arr[i] = this.readVSBuffer();
                        break;
                    case 3 /* ArgType.SerializedObjectWithBuffers */: {
                        const bufferCount = this.readUInt32();
                        const jsonString = this.readLongString();
                        const buffers = [];
                        for (let i = 0; i < bufferCount; ++i) {
                            buffers.push(this.readVSBuffer());
                        }
                        arr[i] = new proxyIdentifier_1.SerializableObjectWithBuffers(parseJsonAndRestoreBufferRefs(jsonString, buffers, null));
                        break;
                    }
                    case 4 /* ArgType.Undefined */:
                        arr[i] = undefined;
                        break;
                }
            }
            return arr;
        }
    }
    var SerializedRequestArgumentType;
    (function (SerializedRequestArgumentType) {
        SerializedRequestArgumentType[SerializedRequestArgumentType["Simple"] = 0] = "Simple";
        SerializedRequestArgumentType[SerializedRequestArgumentType["Mixed"] = 1] = "Mixed";
    })(SerializedRequestArgumentType || (SerializedRequestArgumentType = {}));
    class MessageIO {
        static _useMixedArgSerialization(arr) {
            for (let i = 0, len = arr.length; i < len; i++) {
                if (arr[i] instanceof buffer_1.VSBuffer) {
                    return true;
                }
                if (arr[i] instanceof proxyIdentifier_1.SerializableObjectWithBuffers) {
                    return true;
                }
                if (typeof arr[i] === 'undefined') {
                    return true;
                }
            }
            return false;
        }
        static serializeRequestArguments(args, replacer) {
            if (this._useMixedArgSerialization(args)) {
                const massagedArgs = [];
                for (let i = 0, len = args.length; i < len; i++) {
                    const arg = args[i];
                    if (arg instanceof buffer_1.VSBuffer) {
                        massagedArgs[i] = { type: 2 /* ArgType.VSBuffer */, value: arg };
                    }
                    else if (typeof arg === 'undefined') {
                        massagedArgs[i] = { type: 4 /* ArgType.Undefined */ };
                    }
                    else if (arg instanceof proxyIdentifier_1.SerializableObjectWithBuffers) {
                        const { jsonString, referencedBuffers } = stringifyJsonWithBufferRefs(arg.value, replacer);
                        massagedArgs[i] = { type: 3 /* ArgType.SerializedObjectWithBuffers */, value: buffer_1.VSBuffer.fromString(jsonString), buffers: referencedBuffers };
                    }
                    else {
                        massagedArgs[i] = { type: 1 /* ArgType.String */, value: buffer_1.VSBuffer.fromString(stringify(arg, replacer)) };
                    }
                }
                return {
                    type: 1 /* SerializedRequestArgumentType.Mixed */,
                    args: massagedArgs,
                };
            }
            return {
                type: 0 /* SerializedRequestArgumentType.Simple */,
                args: stringify(args, replacer)
            };
        }
        static serializeRequest(req, rpcId, method, serializedArgs, usesCancellationToken) {
            switch (serializedArgs.type) {
                case 0 /* SerializedRequestArgumentType.Simple */:
                    return this._requestJSONArgs(req, rpcId, method, serializedArgs.args, usesCancellationToken);
                case 1 /* SerializedRequestArgumentType.Mixed */:
                    return this._requestMixedArgs(req, rpcId, method, serializedArgs.args, usesCancellationToken);
            }
        }
        static _requestJSONArgs(req, rpcId, method, args, usesCancellationToken) {
            const methodBuff = buffer_1.VSBuffer.fromString(method);
            const argsBuff = buffer_1.VSBuffer.fromString(args);
            let len = 0;
            len += MessageBuffer.sizeUInt8();
            len += MessageBuffer.sizeShortString(methodBuff);
            len += MessageBuffer.sizeLongString(argsBuff);
            const result = MessageBuffer.alloc(usesCancellationToken ? 2 /* MessageType.RequestJSONArgsWithCancellation */ : 1 /* MessageType.RequestJSONArgs */, req, len);
            result.writeUInt8(rpcId);
            result.writeShortString(methodBuff);
            result.writeLongString(argsBuff);
            return result.buffer;
        }
        static deserializeRequestJSONArgs(buff) {
            const rpcId = buff.readUInt8();
            const method = buff.readShortString();
            const args = buff.readLongString();
            return {
                rpcId: rpcId,
                method: method,
                args: JSON.parse(args)
            };
        }
        static _requestMixedArgs(req, rpcId, method, args, usesCancellationToken) {
            const methodBuff = buffer_1.VSBuffer.fromString(method);
            let len = 0;
            len += MessageBuffer.sizeUInt8();
            len += MessageBuffer.sizeShortString(methodBuff);
            len += MessageBuffer.sizeMixedArray(args);
            const result = MessageBuffer.alloc(usesCancellationToken ? 4 /* MessageType.RequestMixedArgsWithCancellation */ : 3 /* MessageType.RequestMixedArgs */, req, len);
            result.writeUInt8(rpcId);
            result.writeShortString(methodBuff);
            result.writeMixedArray(args);
            return result.buffer;
        }
        static deserializeRequestMixedArgs(buff) {
            const rpcId = buff.readUInt8();
            const method = buff.readShortString();
            const rawargs = buff.readMixedArray();
            const args = new Array(rawargs.length);
            for (let i = 0, len = rawargs.length; i < len; i++) {
                const rawarg = rawargs[i];
                if (typeof rawarg === 'string') {
                    args[i] = JSON.parse(rawarg);
                }
                else {
                    args[i] = rawarg;
                }
            }
            return {
                rpcId: rpcId,
                method: method,
                args: args
            };
        }
        static serializeAcknowledged(req) {
            return MessageBuffer.alloc(5 /* MessageType.Acknowledged */, req, 0).buffer;
        }
        static serializeCancel(req) {
            return MessageBuffer.alloc(6 /* MessageType.Cancel */, req, 0).buffer;
        }
        static serializeReplyOK(req, res, replacer) {
            if (typeof res === 'undefined') {
                return this._serializeReplyOKEmpty(req);
            }
            else if (res instanceof buffer_1.VSBuffer) {
                return this._serializeReplyOKVSBuffer(req, res);
            }
            else if (res instanceof proxyIdentifier_1.SerializableObjectWithBuffers) {
                const { jsonString, referencedBuffers } = stringifyJsonWithBufferRefs(res.value, replacer, true);
                return this._serializeReplyOKJSONWithBuffers(req, jsonString, referencedBuffers);
            }
            else {
                return this._serializeReplyOKJSON(req, safeStringify(res, replacer));
            }
        }
        static _serializeReplyOKEmpty(req) {
            return MessageBuffer.alloc(7 /* MessageType.ReplyOKEmpty */, req, 0).buffer;
        }
        static _serializeReplyOKVSBuffer(req, res) {
            let len = 0;
            len += MessageBuffer.sizeVSBuffer(res);
            const result = MessageBuffer.alloc(8 /* MessageType.ReplyOKVSBuffer */, req, len);
            result.writeVSBuffer(res);
            return result.buffer;
        }
        static deserializeReplyOKVSBuffer(buff) {
            return buff.readVSBuffer();
        }
        static _serializeReplyOKJSON(req, res) {
            const resBuff = buffer_1.VSBuffer.fromString(res);
            let len = 0;
            len += MessageBuffer.sizeLongString(resBuff);
            const result = MessageBuffer.alloc(9 /* MessageType.ReplyOKJSON */, req, len);
            result.writeLongString(resBuff);
            return result.buffer;
        }
        static _serializeReplyOKJSONWithBuffers(req, res, buffers) {
            const resBuff = buffer_1.VSBuffer.fromString(res);
            let len = 0;
            len += MessageBuffer.sizeUInt32; // buffer count
            len += MessageBuffer.sizeLongString(resBuff);
            for (const buffer of buffers) {
                len += MessageBuffer.sizeVSBuffer(buffer);
            }
            const result = MessageBuffer.alloc(10 /* MessageType.ReplyOKJSONWithBuffers */, req, len);
            result.writeUInt32(buffers.length);
            result.writeLongString(resBuff);
            for (const buffer of buffers) {
                result.writeBuffer(buffer);
            }
            return result.buffer;
        }
        static deserializeReplyOKJSON(buff) {
            const res = buff.readLongString();
            return JSON.parse(res);
        }
        static deserializeReplyOKJSONWithBuffers(buff, uriTransformer) {
            const bufferCount = buff.readUInt32();
            const res = buff.readLongString();
            const buffers = [];
            for (let i = 0; i < bufferCount; ++i) {
                buffers.push(buff.readVSBuffer());
            }
            return new proxyIdentifier_1.SerializableObjectWithBuffers(parseJsonAndRestoreBufferRefs(res, buffers, uriTransformer));
        }
        static serializeReplyErr(req, err) {
            const errStr = (err ? safeStringify(errors.transformErrorForSerialization(err), null) : undefined);
            if (typeof errStr !== 'string') {
                return this._serializeReplyErrEmpty(req);
            }
            const errBuff = buffer_1.VSBuffer.fromString(errStr);
            let len = 0;
            len += MessageBuffer.sizeLongString(errBuff);
            const result = MessageBuffer.alloc(11 /* MessageType.ReplyErrError */, req, len);
            result.writeLongString(errBuff);
            return result.buffer;
        }
        static deserializeReplyErrError(buff) {
            const err = buff.readLongString();
            return JSON.parse(err);
        }
        static _serializeReplyErrEmpty(req) {
            return MessageBuffer.alloc(12 /* MessageType.ReplyErrEmpty */, req, 0).buffer;
        }
    }
    var MessageType;
    (function (MessageType) {
        MessageType[MessageType["RequestJSONArgs"] = 1] = "RequestJSONArgs";
        MessageType[MessageType["RequestJSONArgsWithCancellation"] = 2] = "RequestJSONArgsWithCancellation";
        MessageType[MessageType["RequestMixedArgs"] = 3] = "RequestMixedArgs";
        MessageType[MessageType["RequestMixedArgsWithCancellation"] = 4] = "RequestMixedArgsWithCancellation";
        MessageType[MessageType["Acknowledged"] = 5] = "Acknowledged";
        MessageType[MessageType["Cancel"] = 6] = "Cancel";
        MessageType[MessageType["ReplyOKEmpty"] = 7] = "ReplyOKEmpty";
        MessageType[MessageType["ReplyOKVSBuffer"] = 8] = "ReplyOKVSBuffer";
        MessageType[MessageType["ReplyOKJSON"] = 9] = "ReplyOKJSON";
        MessageType[MessageType["ReplyOKJSONWithBuffers"] = 10] = "ReplyOKJSONWithBuffers";
        MessageType[MessageType["ReplyErrError"] = 11] = "ReplyErrError";
        MessageType[MessageType["ReplyErrEmpty"] = 12] = "ReplyErrEmpty";
    })(MessageType || (MessageType = {}));
    var ArgType;
    (function (ArgType) {
        ArgType[ArgType["String"] = 1] = "String";
        ArgType[ArgType["VSBuffer"] = 2] = "VSBuffer";
        ArgType[ArgType["SerializedObjectWithBuffers"] = 3] = "SerializedObjectWithBuffers";
        ArgType[ArgType["Undefined"] = 4] = "Undefined";
    })(ArgType || (ArgType = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnBjUHJvdG9jb2wuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2NvbW1vbi9ycGNQcm90b2NvbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7O0lBc0NoRyxrRUFvQkM7SUFFRCxzRUFjQztJQXRERCxTQUFTLGFBQWEsQ0FBQyxHQUFRLEVBQUUsUUFBc0M7UUFDdEUsSUFBSSxDQUFDO1lBQ0osT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBb0MsUUFBUSxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDZCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7SUFDRixDQUFDO0lBRUQsTUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDO0lBQ2hDLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBVyxDQUFDO0lBRXRELE1BQU0sNkJBQTZCO1FBQ2xDLFlBQ2lCLFVBQWtCLEVBQ2xCLGlCQUFzQztZQUR0QyxlQUFVLEdBQVYsVUFBVSxDQUFRO1lBQ2xCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBcUI7UUFDbkQsQ0FBQztLQUNMO0lBRUQsU0FBZ0IsMkJBQTJCLENBQUksR0FBTSxFQUFFLFdBQXlDLElBQUksRUFBRSxnQkFBZ0IsR0FBRyxLQUFLO1FBQzdILE1BQU0sWUFBWSxHQUFlLEVBQUUsQ0FBQztRQUNwQyxNQUFNLFVBQVUsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDMUYsSUFBSSxPQUFPLEtBQUss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