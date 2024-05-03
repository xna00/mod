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
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/workbench/api/common/extHostRpcService", "vs/base/common/buffer"], function (require, exports, extHost_protocol_1, instantiation_1, lifecycle_1, extHostRpcService_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostManagedSockets = exports.IExtHostManagedSockets = void 0;
    exports.IExtHostManagedSockets = (0, instantiation_1.createDecorator)('IExtHostManagedSockets');
    let ExtHostManagedSockets = class ExtHostManagedSockets {
        constructor(extHostRpc) {
            this._remoteSocketIdCounter = 0;
            this._factory = null;
            this._managedRemoteSockets = new Map();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadManagedSockets);
        }
        setFactory(socketFactoryId, makeConnection) {
            // Terminate all previous sockets
            for (const socket of this._managedRemoteSockets.values()) {
                // calling dispose() will lead to it removing itself from the map
                socket.dispose();
            }
            // Unregister previous factory
            if (this._factory) {
                this._proxy.$unregisterSocketFactory(this._factory.socketFactoryId);
            }
            this._factory = new ManagedSocketFactory(socketFactoryId, makeConnection);
            this._proxy.$registerSocketFactory(this._factory.socketFactoryId);
        }
        async $openRemoteSocket(socketFactoryId) {
            if (!this._factory || this._factory.socketFactoryId !== socketFactoryId) {
                throw new Error(`No socket factory with id ${socketFactoryId}`);
            }
            const id = (++this._remoteSocketIdCounter);
            const socket = await this._factory.makeConnection();
            const disposable = new lifecycle_1.DisposableStore();
            this._managedRemoteSockets.set(id, new ManagedSocket(id, socket, disposable));
            disposable.add((0, lifecycle_1.toDisposable)(() => this._managedRemoteSockets.delete(id)));
            disposable.add(socket.onDidEnd(() => {
                this._proxy.$onDidManagedSocketEnd(id);
                disposable.dispose();
            }));
            disposable.add(socket.onDidClose(e => {
                this._proxy.$onDidManagedSocketClose(id, e?.stack ?? e?.message);
                disposable.dispose();
            }));
            disposable.add(socket.onDidReceiveMessage(e => this._proxy.$onDidManagedSocketHaveData(id, buffer_1.VSBuffer.wrap(e))));
            return id;
        }
        $remoteSocketWrite(socketId, buffer) {
            this._managedRemoteSockets.get(socketId)?.actual.send(buffer.buffer);
        }
        $remoteSocketEnd(socketId) {
            const socket = this._managedRemoteSockets.get(socketId);
            if (socket) {
                socket.actual.end();
                socket.dispose();
            }
        }
        async $remoteSocketDrain(socketId) {
            await this._managedRemoteSockets.get(socketId)?.actual.drain?.();
        }
    };
    exports.ExtHostManagedSockets = ExtHostManagedSockets;
    exports.ExtHostManagedSockets = ExtHostManagedSockets = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostManagedSockets);
    class ManagedSocketFactory {
        constructor(socketFactoryId, makeConnection) {
            this.socketFactoryId = socketFactoryId;
            this.makeConnection = makeConnection;
        }
    }
    class ManagedSocket extends lifecycle_1.Disposable {
        constructor(socketId, actual, disposer) {
            super();
            this.socketId = socketId;
            this.actual = actual;
            this._register(disposer);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE1hbmFnZWRTb2NrZXRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0TWFuYWdlZFNvY2tldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY25GLFFBQUEsc0JBQXNCLEdBQUcsSUFBQSwrQkFBZSxFQUF5Qix3QkFBd0IsQ0FBQyxDQUFDO0lBRWpHLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXFCO1FBUWpDLFlBQ3FCLFVBQThCO1lBTDNDLDJCQUFzQixHQUFHLENBQUMsQ0FBQztZQUMzQixhQUFRLEdBQWdDLElBQUksQ0FBQztZQUNwQywwQkFBcUIsR0FBK0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUs5RSxJQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFFRCxVQUFVLENBQUMsZUFBdUIsRUFBRSxjQUE0RDtZQUMvRixpQ0FBaUM7WUFDakMsS0FBSyxNQUFNLE1BQU0sSUFBSSxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDMUQsaUVBQWlFO2dCQUNqRSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbEIsQ0FBQztZQUNELDhCQUE4QjtZQUM5QixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3JFLENBQUM7WUFFRCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksb0JBQW9CLENBQUMsZUFBZSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzFFLElB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