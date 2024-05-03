/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/sandbox/node/electronTypes", "vs/base/common/buffer", "vs/base/parts/ipc/common/ipc", "vs/base/common/event", "vs/base/common/types", "vs/base/common/arrays"], function (require, exports, electronTypes_1, buffer_1, ipc_1, event_1, types_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Server = void 0;
    exports.once = once;
    /**
     * The MessagePort `Protocol` leverages MessagePortMain style IPC communication
     * for the implementation of the `IMessagePassingProtocol`.
     */
    class Protocol {
        constructor(port) {
            this.port = port;
            this.onMessage = event_1.Event.fromNodeEventEmitter(this.port, 'message', (e) => {
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
    /**
     * An implementation of a `IPCServer` on top of MessagePort style IPC communication.
     * The clients register themselves via Electron Utility Process IPC transfer.
     */
    class Server extends ipc_1.IPCServer {
        static getOnDidClientConnect(filter) {
            (0, types_1.assertType)((0, electronTypes_1.isUtilityProcess)(process), 'Electron Utility Process');
            const onCreateMessageChannel = new event_1.Emitter();
            process.parentPort.on('message', (e) => {
                if (filter?.handledClientConnection(e)) {
                    return;
                }
                const port = (0, arrays_1.firstOrDefault)(e.ports);
                if (port) {
                    onCreateMessageChannel.fire(port);
                }
            });
            return event_1.Event.map(onCreateMessageChannel.event, port => {
                const protocol = new Protocol(port);
                const result = {
                    protocol,
                    // Not part of the standard spec, but in Electron we get a `close` event
                    // when the other side closes. We can use this to detect disconnects
                    // (https://github.com/electron/electron/blob/11-x-y/docs/api/message-port-main.md#event-close)
                    onDidClientDisconnect: event_1.Event.fromNodeEventEmitter(port, 'close')
                };
                return result;
            });
        }
        constructor(filter) {
            super(Server.getOnDidClientConnect(filter));
        }
    }
    exports.Server = Server;
    function once(port, message, callback) {
        const listener = (e) => {
            if (e.data === message) {
                port.removeListener('message', listener);
                callback();
            }
        };
        port.on('message', listener);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLm1wLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3BhcnRzL2lwYy9ub2RlL2lwYy5tcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpR2hHLG9CQVNDO0lBakdEOzs7T0FHRztJQUNILE1BQU0sUUFBUTtRQVNiLFlBQW9CLElBQXFCO1lBQXJCLFNBQUksR0FBSixJQUFJLENBQWlCO1lBUGhDLGNBQVMsR0FBRyxhQUFLLENBQUMsb0JBQW9CLENBQVcsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFlLEVBQUUsRUFBRTtnQkFDbkcsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ1osT0FBTyxpQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzlCLENBQUM7Z0JBQ0QsT0FBTyxpQkFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQixDQUFDLENBQUMsQ0FBQztZQUlGLHNEQUFzRDtZQUN0RCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDZCxDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQWlCO1lBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRUQsVUFBVTtZQUNULElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDbkIsQ0FBQztLQUNEO0lBZUQ7OztPQUdHO0lBQ0gsTUFBYSxNQUFPLFNBQVEsZUFBUztRQUU1QixNQUFNLENBQUMscUJBQXFCLENBQUMsTUFBZ0M7WUFDcEUsSUFBQSxrQkFBVSxFQUFDLElBQUEsZ0NBQWdCLEVBQUMsT0FBTyxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztZQUVsRSxNQUFNLHNCQUFzQixHQUFHLElBQUksZUFBTyxFQUFtQixDQUFDO1lBRTlELE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQWUsRUFBRSxFQUFFO2dCQUNwRCxJQUFJLE1BQU0sRUFBRSx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUN4QyxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsTUFBTSxJQUFJLEdBQUcsSUFBQSx1QkFBYyxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDckMsSUFBSSxJQUFJLEVBQUUsQ0FBQztvQkFDVixzQkFBc0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ25DLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sYUFBSyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUU7Z0JBQ3JELE1BQU0sUUFBUSxHQUFHLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVwQyxNQUFNLE1BQU0sR0FBMEI7b0JBQ3JDLFFBQVE7b0JBQ1Isd0VBQXdFO29CQUN4RSxvRUFBb0U7b0JBQ3BFLCtGQUErRjtvQkFDL0YscUJBQXFCLEVBQUUsYUFBSyxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUM7aUJBQ2hFLENBQUM7Z0JBRUYsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxZQUFZLE1BQWdDO1lBQzNDLEtBQUssQ0FBQyxNQUFNLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUM3QyxDQUFDO0tBQ0Q7SUFwQ0Qsd0JBb0NDO0lBT0QsU0FBZ0IsSUFBSSxDQUFDLElBQThCLEVBQUUsT0FBZ0IsRUFBRSxRQUFvQjtRQUMxRixNQUFNLFFBQVEsR0FBRyxDQUFDLENBQWUsRUFBRSxFQUFFO1lBQ3BDLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxPQUFPLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3pDLFFBQVEsRUFBRSxDQUFDO1lBQ1osQ0FBQztRQUNGLENBQUMsQ0FBQztRQUVGLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzlCLENBQUMifQ==