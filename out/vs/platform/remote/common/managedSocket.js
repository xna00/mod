/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc.net"], function (require, exports, buffer_1, event_1, lifecycle_1, ipc_net_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ManagedSocket = exports.socketRawEndHeaderSequence = exports.makeRawSocketHeaders = void 0;
    exports.connectManagedSocket = connectManagedSocket;
    const makeRawSocketHeaders = (path, query, deubgLabel) => {
        // https://tools.ietf.org/html/rfc6455#section-4
        const buffer = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            buffer[i] = Math.round(Math.random() * 256);
        }
        const nonce = (0, buffer_1.encodeBase64)(buffer_1.VSBuffer.wrap(buffer));
        const headers = [
            `GET ws://localhost${path}?${query}&skipWebSocketFrames=true HTTP/1.1`,
            `Connection: Upgrade`,
            `Upgrade: websocket`,
            `Sec-WebSocket-Key: ${nonce}`
        ];
        return headers.join('\r\n') + '\r\n\r\n';
    };
    exports.makeRawSocketHeaders = makeRawSocketHeaders;
    exports.socketRawEndHeaderSequence = buffer_1.VSBuffer.fromString('\r\n\r\n');
    /** Should be called immediately after making a ManagedSocket to make it ready for data flow. */
    async function connectManagedSocket(socket, path, query, debugLabel, half) {
        socket.write(buffer_1.VSBuffer.fromString((0, exports.makeRawSocketHeaders)(path, query, debugLabel)));
        const d = new lifecycle_1.DisposableStore();
        try {
            return await new Promise((resolve, reject) => {
                let dataSoFar;
                d.add(socket.onData(d_1 => {
                    if (!dataSoFar) {
                        dataSoFar = d_1;
                    }
                    else {
                        dataSoFar = buffer_1.VSBuffer.concat([dataSoFar, d_1], dataSoFar.byteLength + d_1.byteLength);
                    }
                    const index = dataSoFar.indexOf(exports.socketRawEndHeaderSequence);
                    if (index === -1) {
                        return;
                    }
                    resolve(socket);
                    // pause data events until the socket consumer is hooked up. We may
                    // immediately emit remaining data, but if not there may still be
                    // microtasks queued which would fire data into the abyss.
                    socket.pauseData();
                    const rest = dataSoFar.slice(index + exports.socketRawEndHeaderSequence.byteLength);
                    if (rest.byteLength) {
                        half.onData.fire(rest);
                    }
                }));
                d.add(socket.onClose(err => reject(err ?? new Error('socket closed'))));
                d.add(socket.onEnd(() => reject(new Error('socket ended'))));
            });
        }
        catch (e) {
            socket.dispose();
            throw e;
        }
        finally {
            d.dispose();
        }
    }
    class ManagedSocket extends lifecycle_1.Disposable {
        constructor(debugLabel, half) {
            super();
            this.debugLabel = debugLabel;
            this.pausableDataEmitter = this._register(new event_1.PauseableEmitter());
            this.onData = (...args) => {
                if (this.pausableDataEmitter.isPaused) {
                    queueMicrotask(() => this.pausableDataEmitter.resume());
                }
                return this.pausableDataEmitter.event(...args);
            };
            this.didDisposeEmitter = this._register(new event_1.Emitter());
            this.onDidDispose = this.didDisposeEmitter.event;
            this.ended = false;
            this._register(half.onData);
            this._register(half.onData.event(data => this.pausableDataEmitter.fire(data)));
            this.onClose = this._register(half.onClose).event;
            this.onEnd = this._register(half.onEnd).event;
        }
        /** Pauses data events until a new listener comes in onData() */
        pauseData() {
            this.pausableDataEmitter.pause();
        }
        /** Flushes data to the socket. */
        drain() {
            return Promise.resolve();
        }
        /** Ends the remote socket. */
        end() {
            this.ended = true;
            this.closeRemote();
        }
        traceSocketEvent(type, data) {
            ipc_net_1.SocketDiagnostics.traceSocketEvent(this, this.debugLabel, type, data);
        }
        dispose() {
            if (!this.ended) {
                this.closeRemote();
            }
            this.didDisposeEmitter.fire();
            super.dispose();
        }
    }
    exports.ManagedSocket = ManagedSocket;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuYWdlZFNvY2tldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcmVtb3RlL2NvbW1vbi9tYW5hZ2VkU29ja2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtDaEcsb0RBNENDO0lBdkVNLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxJQUFZLEVBQUUsS0FBYSxFQUFFLFVBQWtCLEVBQUUsRUFBRTtRQUN2RixnREFBZ0Q7UUFDaEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBQSxxQkFBWSxFQUFDLGlCQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFFbEQsTUFBTSxPQUFPLEdBQUc7WUFDZixxQkFBcUIsSUFBSSxJQUFJLEtBQUssb0NBQW9DO1lBQ3RFLHFCQUFxQjtZQUNyQixvQkFBb0I7WUFDcEIsc0JBQXNCLEtBQUssRUFBRTtTQUM3QixDQUFDO1FBRUYsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLFVBQVUsQ0FBQztJQUMxQyxDQUFDLENBQUM7SUFoQlcsUUFBQSxvQkFBb0Isd0JBZ0IvQjtJQUVXLFFBQUEsMEJBQTBCLEdBQUcsaUJBQVEsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7SUFRMUUsZ0dBQWdHO0lBQ3pGLEtBQUss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