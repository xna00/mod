/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/strings"], function (require, exports, errors_1, event_1, lifecycle_1, objects_1, platform_1, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleWorkerServer = exports.SimpleWorkerClient = void 0;
    exports.logOnceWebWorkerWarning = logOnceWebWorkerWarning;
    exports.create = create;
    const INITIALIZE = '$initialize';
    let webWorkerWarningLogged = false;
    function logOnceWebWorkerWarning(err) {
        if (!platform_1.isWeb) {
            // running tests
            return;
        }
        if (!webWorkerWarningLogged) {
            webWorkerWarningLogged = true;
            console.warn('Could not create web worker(s). Falling back to loading web worker code in main thread, which might cause UI freezes. Please see https://github.com/microsoft/monaco-editor#faq');
        }
        console.warn(err.message);
    }
    var MessageType;
    (function (MessageType) {
        MessageType[MessageType["Request"] = 0] = "Request";
        MessageType[MessageType["Reply"] = 1] = "Reply";
        MessageType[MessageType["SubscribeEvent"] = 2] = "SubscribeEvent";
        MessageType[MessageType["Event"] = 3] = "Event";
        MessageType[MessageType["UnsubscribeEvent"] = 4] = "UnsubscribeEvent";
    })(MessageType || (MessageType = {}));
    class RequestMessage {
        constructor(vsWorker, req, method, args) {
            this.vsWorker = vsWorker;
            this.req = req;
            this.method = method;
            this.args = args;
            this.type = 0 /* MessageType.Request */;
        }
    }
    class ReplyMessage {
        constructor(vsWorker, seq, res, err) {
            this.vsWorker = vsWorker;
            this.seq = seq;
            this.res = res;
            this.err = err;
            this.type = 1 /* MessageType.Reply */;
        }
    }
    class SubscribeEventMessage {
        constructor(vsWorker, req, eventName, arg) {
            this.vsWorker = vsWorker;
            this.req = req;
            this.eventName = eventName;
            this.arg = arg;
            this.type = 2 /* MessageType.SubscribeEvent */;
        }
    }
    class EventMessage {
        constructor(vsWorker, req, event) {
            this.vsWorker = vsWorker;
            this.req = req;
            this.event = event;
            this.type = 3 /* MessageType.Event */;
        }
    }
    class UnsubscribeEventMessage {
        constructor(vsWorker, req) {
            this.vsWorker = vsWorker;
            this.req = req;
            this.type = 4 /* MessageType.UnsubscribeEvent */;
        }
    }
    class SimpleWorkerProtocol {
        constructor(handler) {
            this._workerId = -1;
            this._handler = handler;
            this._lastSentReq = 0;
            this._pendingReplies = Object.create(null);
            this._pendingEmitters = new Map();
            this._pendingEvents = new Map();
        }
        setWorkerId(workerId) {
            this._workerId = workerId;
        }
        sendMessage(method, args) {
            const req = String(++this._lastSentReq);
            return new Promise((resolve, reject) => {
                this._pendingReplies[req] = {
                    resolve: resolve,
                    reject: reject
                };
                this._send(new RequestMessage(this._workerId, req, method, args));
            });
        }
        listen(eventName, arg) {
            let req = null;
            const emitter = new event_1.Emitter({
                onWillAddFirstListener: () => {
                    req = String(++this._lastSentReq);
                    this._pendingEmitters.set(req, emitter);
                    this._send(new SubscribeEventMessage(this._workerId, req, eventName, arg));
                },
                onDidRemoveLastListener: () => {
                    this._pendingEmitters.delete(req);
                    this._send(new UnsubscribeEventMessage(this._workerId, req));
                    req = null;
                }
            });
            return emitter.event;
        }
        handleMessage(message) {
            if (!message || !message.vsWorker) {
                return;
            }
            if (this._workerId !== -1 && message.vsWorker !== this._workerId) {
                return;
            }
            this._handleMessage(message);
        }
        _handleMessage(msg) {
            switch (msg.type) {
                case 1 /* MessageType.Reply */:
                    return this._handleReplyMessage(msg);
                case 0 /* MessageType.Request */:
                    return this._handleRequestMessage(msg);
                case 2 /* MessageType.SubscribeEvent */:
                    return this._handleSubscribeEventMessage(msg);
                case 3 /* MessageType.Event */:
                    return this._handleEventMessage(msg);
                case 4 /* MessageType.UnsubscribeEvent */:
                    return this._handleUnsubscribeEventMessage(msg);
            }
        }
        _handleReplyMessage(replyMessage) {
            if (!this._pendingReplies[replyMessage.seq]) {
                console.warn('Got reply to unknown seq');
                return;
            }
            const reply = this._pendingReplies[replyMessage.seq];
            delete this._pendingReplies[replyMessage.seq];
            if (replyMessage.err) {
                let err = replyMessage.err;
                if (replyMessage.err.$isError) {
                    err = new Error();
                    err.name = replyMessage.err.name;
                    err.message = replyMessage.err.message;
                    err.stack = replyMessage.err.stack;
                }
                reply.reject(err);
                return;
            }
            reply.resolve(replyMessage.res);
        }
        _handleRequestMessage(requestMessage) {
            const req = requestMessage.req;
            const result = this._handler.handleMessage(requestMessage.method, requestMessage.args);
            result.then((r) => {
                this._send(new ReplyMessage(this._workerId, req, r, undefined));
            }, (e) => {
                if (e.detail instanceof Error) {
                    // Loading errors have a detail property that points to the actual error
                    e.detail = (0, errors_1.transformErrorForSerialization)(e.detail);
                }
                this._send(new ReplyMessage(this._workerId, req, undefined, (0, errors_1.transformErrorForSerialization)(e)));
            });
        }
        _handleSubscribeEventMessage(msg) {
            const req = msg.req;
            const disposable = this._handler.handleEvent(msg.eventName, msg.arg)((event) => {
                this._send(new EventMessage(this._workerId, req, event));
            });
            this._pendingEvents.set(req, disposable);
        }
        _handleEventMessage(msg) {
            if (!this._pendingEmitters.has(msg.req)) {
                console.warn('Got event for unknown req');
                return;
            }
            this._pendingEmitters.get(msg.req).fire(msg.event);
        }
        _handleUnsubscribeEventMessage(msg) {
            if (!this._pendingEvents.has(msg.req)) {
                console.warn('Got unsubscribe for unknown req');
                return;
            }
            this._pendingEvents.get(msg.req).dispose();
            this._pendingEvents.delete(msg.req);
        }
        _send(msg) {
            const transfer = [];
            if (msg.type === 0 /* MessageType.Request */) {
                for (let i = 0; i < msg.args.length; i++) {
                    if (msg.args[i] instanceof ArrayBuffer) {
                        transfer.push(msg.args[i]);
                    }
                }
            }
            else if (msg.type === 1 /* MessageType.Reply */) {
                if (msg.res instanceof ArrayBuffer) {
                    transfer.push(msg.res);
                }
            }
            this._handler.sendMessage(msg, transfer);
        }
    }
    /**
     * Main thread side
     */
    class SimpleWorkerClient extends lifecycle_1.Disposable {
        constructor(workerFactory, moduleId, host) {
            super();
            let lazyProxyReject = null;
            this._worker = this._register(workerFactory.create('vs/base/common/worker/simpleWorker', (msg) => {
                this._protocol.handleMessage(msg);
            }, (err) => {
                // in Firefox, web workers fail lazily :(
                // we will reject the proxy
                lazyProxyReject?.(err);
            }));
            this._protocol = new SimpleWorkerProtocol({
                sendMessage: (msg, transfer) => {
                    this._worker.postMessage(msg, transfer);
                },
                handleMessage: (method, args) => {
                    if (typeof host[method] !== 'function') {
                        return Promise.reject(new Error('Missing method ' + method + ' on main thread host.'));
                    }
                    try {
                        return Promise.resolve(host[method].apply(host, args));
                    }
                    catch (e) {
                        return Promise.reject(e);
                    }
                },
                handleEvent: (eventName, arg) => {
                    if (propertyIsDynamicEvent(eventName)) {
                        const event = host[eventName].call(host, arg);
                        if (typeof event !== 'function') {
                            throw new Error(`Missing dynamic event ${eventName} on main thread host.`);
                        }
                        return event;
                    }
                    if (propertyIsEvent(eventName)) {
                        const event = host[eventName];
                        if (typeof event !== 'function') {
                            throw new Error(`Missing event ${eventName} on main thread host.`);
                        }
                        return event;
                    }
                    throw new Error(`Malformed event name ${eventName}`);
                }
            });
            this._protocol.setWorkerId(this._worker.getId());
            // Gather loader configuration
            let loaderConfiguration = null;
            const globalRequire = globalThis.require;
            if (typeof globalRequire !== 'undefined' && typeof globalRequire.getConfig === 'function') {
                // Get the configuration from the Monaco AMD Loader
                loaderConfiguration = globalRequire.getConfig();
            }
            else if (typeof globalThis.requirejs !== 'undefined') {
                // Get the configuration from requirejs
                loaderConfiguration = globalThis.requirejs.s.contexts._.config;
            }
            const hostMethods = (0, objects_1.getAllMethodNames)(host);
            // Send initialize message
            this._onModuleLoaded = this._protocol.sendMessage(INITIALIZE, [
                this._worker.getId(),
                JSON.parse(JSON.stringify(loaderConfiguration)),
                moduleId,
                hostMethods,
            ]);
            // Create proxy to loaded code
            const proxyMethodRequest = (method, args) => {
                return this._request(method, args);
            };
            const proxyListen = (eventName, arg) => {
                return this._protocol.listen(eventName, arg);
            };
            this._lazyProxy = new Promise((resolve, reject) => {
                lazyProxyReject = reject;
                this._onModuleLoaded.then((availableMethods) => {
                    resolve(createProxyObject(availableMethods, proxyMethodRequest, proxyListen));
                }, (e) => {
                    reject(e);
                    this._onError('Worker failed to load ' + moduleId, e);
                });
            });
        }
        getProxyObject() {
            return this._lazyProxy;
        }
        _request(method, args) {
            return new Promise((resolve, reject) => {
                this._onModuleLoaded.then(() => {
                    this._protocol.sendMessage(method, args).then(resolve, reject);
                }, reject);
            });
        }
        _onError(message, error) {
            console.error(message);
            console.info(error);
        }
    }
    exports.SimpleWorkerClient = SimpleWorkerClient;
    function propertyIsEvent(name) {
        // Assume a property is an event if it has a form of "onSomething"
        return name[0] === 'o' && name[1] === 'n' && strings.isUpperAsciiLetter(name.charCodeAt(2));
    }
    function propertyIsDynamicEvent(name) {
        // Assume a property is a dynamic event (a method that returns an event) if it has a form of "onDynamicSomething"
        return /^onDynamic/.test(name) && strings.isUpperAsciiLetter(name.charCodeAt(9));
    }
    function createProxyObject(methodNames, invoke, proxyListen) {
        const createProxyMethod = (method) => {
            return function () {
                const args = Array.prototype.slice.call(arguments, 0);
                return invoke(method, args);
            };
        };
        const createProxyDynamicEvent = (eventName) => {
            return function (arg) {
                return proxyListen(eventName, arg);
            };
        };
        const result = {};
        for (const methodName of methodNames) {
            if (propertyIsDynamicEvent(methodName)) {
                result[methodName] = createProxyDynamicEvent(methodName);
                continue;
            }
            if (propertyIsEvent(methodName)) {
                result[methodName] = proxyListen(methodName, undefined);
                continue;
            }
            result[methodName] = createProxyMethod(methodName);
        }
        return result;
    }
    /**
     * Worker side
     */
    class SimpleWorkerServer {
        constructor(postMessage, requestHandlerFactory) {
            this._requestHandlerFactory = requestHandlerFactory;
            this._requestHandler = null;
            this._protocol = new SimpleWorkerProtocol({
                sendMessage: (msg, transfer) => {
                    postMessage(msg, transfer);
                },
                handleMessage: (method, args) => this._handleMessage(method, args),
                handleEvent: (eventName, arg) => this._handleEvent(eventName, arg)
            });
        }
        onmessage(msg) {
            this._protocol.handleMessage(msg);
        }
        _handleMessage(method, args) {
            if (method === INITIALIZE) {
                return this.initialize(args[0], args[1], args[2], args[3]);
            }
            if (!this._requestHandler || typeof this._requestHandler[method] !== 'function') {
                return Promise.reject(new Error('Missing requestHandler or method: ' + method));
            }
            try {
                return Promise.resolve(this._requestHandler[method].apply(this._requestHandler, args));
            }
            catch (e) {
                return Promise.reject(e);
            }
        }
        _handleEvent(eventName, arg) {
            if (!this._requestHandler) {
                throw new Error(`Missing requestHandler`);
            }
            if (propertyIsDynamicEvent(eventName)) {
                const event = this._requestHandler[eventName].call(this._requestHandler, arg);
                if (typeof event !== 'function') {
                    throw new Error(`Missing dynamic event ${eventName} on request handler.`);
                }
                return event;
            }
            if (propertyIsEvent(eventName)) {
                const event = this._requestHandler[eventName];
                if (typeof event !== 'function') {
                    throw new Error(`Missing event ${eventName} on request handler.`);
                }
                return event;
            }
            throw new Error(`Malformed event name ${eventName}`);
        }
        initialize(workerId, loaderConfig, moduleId, hostMethods) {
            this._protocol.setWorkerId(workerId);
            const proxyMethodRequest = (method, args) => {
                return this._protocol.sendMessage(method, args);
            };
            const proxyListen = (eventName, arg) => {
                return this._protocol.listen(eventName, arg);
            };
            const hostProxy = createProxyObject(hostMethods, proxyMethodRequest, proxyListen);
            if (this._requestHandlerFactory) {
                // static request handler
                this._requestHandler = this._requestHandlerFactory(hostProxy);
                return Promise.resolve((0, objects_1.getAllMethodNames)(this._requestHandler));
            }
            if (loaderConfig) {
                // Remove 'baseUrl', handling it is beyond scope for now
                if (typeof loaderConfig.baseUrl !== 'undefined') {
                    delete loaderConfig['baseUrl'];
                }
                if (typeof loaderConfig.paths !== 'undefined') {
                    if (typeof loaderConfig.paths.vs !== 'undefined') {
                        delete loaderConfig.paths['vs'];
                    }
                }
                if (typeof loaderConfig.trustedTypesPolicy !== 'undefined') {
                    // don't use, it has been destroyed during serialize
                    delete loaderConfig['trustedTypesPolicy'];
                }
                // Since this is in a web worker, enable catching errors
                loaderConfig.catchError = true;
                globalThis.require.config(loaderConfig);
            }
            return new Promise((resolve, reject) => {
                // Use the global require to be sure to get the global config
                // ESM-comment-begin
                const req = (globalThis.require || require);
                // ESM-comment-end
                // ESM-uncomment-begin
                // const req = globalThis.require;
                // ESM-uncomment-end
                req([moduleId], (module) => {
                    this._requestHandler = module.create(hostProxy);
                    if (!this._requestHandler) {
                        reject(new Error(`No RequestHandler!`));
                        return;
                    }
                    resolve((0, objects_1.getAllMethodNames)(this._requestHandler));
                }, reject);
            });
        }
    }
    exports.SimpleWorkerServer = SimpleWorkerServer;
    /**
     * Called on the worker side
     * @skipMangle
     */
    function create(postMessage) {
        return new SimpleWorkerServer(postMessage, null);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlV29ya2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi93b3JrZXIvc2ltcGxlV29ya2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXlCaEcsMERBVUM7SUE0Z0JELHdCQUVDO0lBeGlCRCxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUM7SUFlakMsSUFBSSxzQkFBc0IsR0FBRyxLQUFLLENBQUM7SUFDbkMsU0FBZ0IsdUJBQXVCLENBQUMsR0FBUTtRQUMvQyxJQUFJLENBQUMsZ0JBQUssRUFBRSxDQUFDO1lBQ1osZ0JBQWdCO1lBQ2hCLE9BQU87UUFDUixDQUFDO1FBQ0QsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7WUFDN0Isc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1lBQzlCLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUxBQWlMLENBQUMsQ0FBQztRQUNqTSxDQUFDO1FBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVELElBQVcsV0FNVjtJQU5ELFdBQVcsV0FBVztRQUNyQixtREFBTyxDQUFBO1FBQ1AsK0NBQUssQ0FBQTtRQUNMLGlFQUFjLENBQUE7UUFDZCwrQ0FBSyxDQUFBO1FBQ0wscUVBQWdCLENBQUE7SUFDakIsQ0FBQyxFQU5VLFdBQVcsS0FBWCxXQUFXLFFBTXJCO0lBQ0QsTUFBTSxjQUFjO1FBRW5CLFlBQ2lCLFFBQWdCLEVBQ2hCLEdBQVcsRUFDWCxNQUFjLEVBQ2QsSUFBVztZQUhYLGFBQVEsR0FBUixRQUFRLENBQVE7WUFDaEIsUUFBRyxHQUFILEdBQUcsQ0FBUTtZQUNYLFdBQU0sR0FBTixNQUFNLENBQVE7WUFDZCxTQUFJLEdBQUosSUFBSSxDQUFPO1lBTFosU0FBSSwrQkFBdUI7UUFNdkMs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