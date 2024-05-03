/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc.net", "vs/platform/remote/common/remoteAuthorityResolver", "vs/base/browser/window"], function (require, exports, dom, async_1, buffer_1, event_1, lifecycle_1, ipc_net_1, remoteAuthorityResolver_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserSocketFactory = void 0;
    class BrowserWebSocket extends lifecycle_1.Disposable {
        traceSocketEvent(type, data) {
            ipc_net_1.SocketDiagnostics.traceSocketEvent(this._socket, this._debugLabel, type, data);
        }
        constructor(url, debugLabel) {
            super();
            this._onData = new event_1.Emitter();
            this.onData = this._onData.event;
            this._onOpen = this._register(new event_1.Emitter());
            this.onOpen = this._onOpen.event;
            this._onClose = this._register(new event_1.Emitter());
            this.onClose = this._onClose.event;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this._debugLabel = debugLabel;
            this._socket = new WebSocket(url);
            this.traceSocketEvent("created" /* SocketDiagnosticsEventType.Created */, { type: 'BrowserWebSocket', url });
            this._fileReader = new FileReader();
            this._queue = [];
            this._isReading = false;
            this._isClosed = false;
            this._fileReader.onload = (event) => {
                this._isReading = false;
                const buff = event.target.result;
                this.traceSocketEvent("read" /* SocketDiagnosticsEventType.Read */, buff);
                this._onData.fire(buff);
                if (this._queue.length > 0) {
                    enqueue(this._queue.shift());
                }
            };
            const enqueue = (blob) => {
                if (this._isReading) {
                    this._queue.push(blob);
                    return;
                }
                this._isReading = true;
                this._fileReader.readAsArrayBuffer(blob);
            };
            this._socketMessageListener = (ev) => {
                const blob = ev.data;
                this.traceSocketEvent("browserWebSocketBlobReceived" /* SocketDiagnosticsEventType.BrowserWebSocketBlobReceived */, { type: blob.type, size: blob.size });
                enqueue(blob);
            };
            this._socket.addEventListener('message', this._socketMessageListener);
            this._register(dom.addDisposableListener(this._socket, 'open', (e) => {
                this.traceSocketEvent("open" /* SocketDiagnosticsEventType.Open */);
                this._onOpen.fire();
            }));
            // WebSockets emit error events that do not contain any real information
            // Our only chance of getting to the root cause of an error is to
            // listen to the close event which gives out some real information:
            // - https://www.w3.org/TR/websockets/#closeevent
            // - https://tools.ietf.org/html/rfc6455#section-11.7
            //
            // But the error event is emitted before the close event, so we therefore
            // delay the error event processing in the hope of receiving a close event
            // with more information
            let pendingErrorEvent = null;
            const sendPendingErrorNow = () => {
                const err = pendingErrorEvent;
                pendingErrorEvent = null;
                this._onError.fire(err);
            };
            const errorRunner = this._register(new async_1.RunOnceScheduler(sendPendingErrorNow, 0));
            const sendErrorSoon = (err) => {
                errorRunner.cancel();
                pendingErrorEvent = err;
                errorRunner.schedule();
            };
            const sendErrorNow = (err) => {
                errorRunner.cancel();
                pendingErrorEvent = err;
                sendPendingErrorNow();
            };
            this._register(dom.addDisposableListener(this._socket, 'close', (e) => {
                this.traceSocketEvent("close" /* SocketDiagnosticsEventType.Close */, { code: e.code, reason: e.reason, wasClean: e.wasClean });
                this._isClosed = true;
                if (pendingErrorEvent) {
                    if (!navigator.onLine) {
                        // The browser is offline => this is a temporary error which might resolve itself
                        sendErrorNow(new remoteAuthorityResolver_1.RemoteAuthorityResolverError('Browser is offline', remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.TemporarilyNotAvailable, e));
                    }
                    else {
                        // An error event is pending
                        // The browser appears to be online...
                        if (!e.wasClean) {
                            // Let's be optimistic and hope that perhaps the server could not be reached or something
                            sendErrorNow(new remoteAuthorityResolver_1.RemoteAuthorityResolverError(e.reason || `WebSocket close with status code ${e.code}`, remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.TemporarilyNotAvailable, e));
                        }
                        else {
                            // this was a clean close => send existing error
                            errorRunner.cancel();
                            sendPendingErrorNow();
                        }
                    }
                }
                this._onClose.fire({ code: e.code, reason: e.reason, wasClean: e.wasClean, event: e });
            }));
            this._register(dom.addDisposableListener(this._socket, 'error', (err) => {
                this.traceSocketEvent("error" /* SocketDiagnosticsEventType.Error */, { message: err?.message });
                sendErrorSoon(err);
            }));
        }
        send(data) {
            if (this._isClosed) {
                // Refuse to write data to closed WebSocket...
                return;
            }
            this.traceSocketEvent("write" /* SocketDiagnosticsEventType.Write */, data);
            this._socket.send(data);
        }
        close() {
            this._isClosed = true;
            this.traceSocketEvent("close" /* SocketDiagnosticsEventType.Close */);
            this._socket.close();
            this._socket.removeEventListener('message', this._socketMessageListener);
            this.dispose();
        }
    }
    const defaultWebSocketFactory = new class {
        create(url, debugLabel) {
            return new BrowserWebSocket(url, debugLabel);
        }
    };
    class BrowserSocket {
        traceSocketEvent(type, data) {
            if (typeof this.socket.traceSocketEvent === 'function') {
                this.socket.traceSocketEvent(type, data);
            }
            else {
                ipc_net_1.SocketDiagnostics.traceSocketEvent(this.socket, this.debugLabel, type, data);
            }
        }
        constructor(socket, debugLabel) {
            this.socket = socket;
            this.debugLabel = debugLabel;
        }
        dispose() {
            this.socket.close();
        }
        onData(listener) {
            return this.socket.onData((data) => listener(buffer_1.VSBuffer.wrap(new Uint8Array(data))));
        }
        onClose(listener) {
            const adapter = (e) => {
                if (typeof e === 'undefined') {
                    listener(e);
                }
                else {
                    listener({
                        type: 1 /* SocketCloseEventType.WebSocketCloseEvent */,
                        code: e.code,
                        reason: e.reason,
                        wasClean: e.wasClean,
                        event: e.event
                    });
                }
            };
            return this.socket.onClose(adapter);
        }
        onEnd(listener) {
            return lifecycle_1.Disposable.None;
        }
        write(buffer) {
            this.socket.send(buffer.buffer);
        }
        end() {
            this.socket.close();
        }
        drain() {
            return Promise.resolve();
        }
    }
    class BrowserSocketFactory {
        constructor(webSocketFactory) {
            this._webSocketFactory = webSocketFactory || defaultWebSocketFactory;
        }
        supports(connectTo) {
            return true;
        }
        connect({ host, port }, path, query, debugLabel) {
            return new Promise((resolve, reject) => {
                const webSocketSchema = (/^https:/.test(window_1.mainWindow.location.href) ? 'wss' : 'ws');
                const socket = this._webSocketFactory.create(`${webSocketSchema}://${(/:/.test(host) && !/\[/.test(host)) ? `[${host}]` : host}:${port}${path}?${query}&skipWebSocketFrames=false`, debugLabel);
                const errorListener = socket.onError(reject);
                socket.onOpen(() => {
                    errorListener.dispose();
                    resolve(new BrowserSocket(socket, debugLabel));
                });
            });
        }
    }
    exports.BrowserSocketFactory = BrowserSocketFactory;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlclNvY2tldEZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3JlbW90ZS9icm93c2VyL2Jyb3dzZXJTb2NrZXRGYWN0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQThDaEcsTUFBTSxnQkFBaUIsU0FBUSxzQkFBVTtRQXVCakMsZ0JBQWdCLENBQUMsSUFBZ0MsRUFBRSxJQUFrRTtZQUMzSCwyQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFFRCxZQUFZLEdBQVcsRUFBRSxVQUFrQjtZQUMxQyxLQUFLLEVBQUUsQ0FBQztZQTFCUSxZQUFPLEdBQUcsSUFBSSxlQUFPLEVBQWUsQ0FBQztZQUN0QyxXQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFFM0IsWUFBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQy9DLFdBQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztZQUUzQixhQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBd0IsQ0FBQyxDQUFDO1lBQ2hFLFlBQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztZQUU3QixhQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBTyxDQUFDLENBQUM7WUFDL0MsWUFBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1lBaUI3QyxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztZQUM5QixJQUFJLENBQUMs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