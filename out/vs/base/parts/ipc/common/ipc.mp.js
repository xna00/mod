/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/parts/ipc/common/ipc"], function (require, exports, buffer_1, event_1, ipc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Client = exports.Protocol = void 0;
    /**
     * The MessagePort `Protocol` leverages MessagePort style IPC communication
     * for the implementation of the `IMessagePassingProtocol`. That style of API
     * is a simple `onmessage` / `postMessage` pattern.
     */
    class Protocol {
        constructor(port) {
            this.port = port;
            this.onMessage = event_1.Event.fromDOMEventEmitter(this.port, 'message', (e) => {
                if (e.data) {
                    return buffer_1.VSBuffer.wrap(e.data);
                }
                return buffer_1.VSBuffer.alloc(0);
            });
            // we must call start() to ensure messages are flowing
            port.start();
        }
        send(message) {
            this.port.postMessage(message.buffer);
        }
        disconnect() {
            this.port.close();
        }
    }
    exports.Protocol = Protocol;
    /**
     * An implementation of a `IPCClient` on top of MessagePort style IPC communication.
     */
    class Client extends ipc_1.IPCClient {
        constructor(port, clientId) {
            const protocol = new Protocol(port);
            super(protocol, clientId);
            this.protocol = protocol;
        }
        dispose() {
            this.protocol.disconnect();
            super.dispose();
        }
    }
    exports.Client = Client;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLm1wLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3BhcnRzL2lwYy9jb21tb24vaXBjLm1wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlDaEc7Ozs7T0FJRztJQUNILE1BQWEsUUFBUTtRQVNwQixZQUFvQixJQUFpQjtZQUFqQixTQUFJLEdBQUosSUFBSSxDQUFhO1lBUDVCLGNBQVMsR0FBRyxhQUFLLENBQUMsbUJBQW1CLENBQVcsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFlLEVBQUUsRUFBRTtnQkFDbEcsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ1osT0FBTyxpQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzlCLENBQUM7Z0JBQ0QsT0FBTyxpQkFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQixDQUFDLENBQUMsQ0FBQztZQUlGLHNEQUFzRDtZQUN0RCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDZCxDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQWlCO1lBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRUQsVUFBVTtZQUNULElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDbkIsQ0FBQztLQUNEO0lBdEJELDRCQXNCQztJQUVEOztPQUVHO0lBQ0gsTUFBYSxNQUFPLFNBQVEsZUFBUztRQUlwQyxZQUFZLElBQWlCLEVBQUUsUUFBZ0I7WUFDOUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEMsS0FBSyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUUxQixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUMxQixDQUFDO1FBRVEsT0FBTztZQUNmLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUM7WUFFM0IsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7S0FDRDtJQWhCRCx3QkFnQkMifQ==