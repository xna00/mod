/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/ipc/electron-main/ipcMain", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/common/ipc.electron"], function (require, exports, ipcMain_1, buffer_1, event_1, lifecycle_1, ipc_1, ipc_electron_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Server = void 0;
    function createScopedOnMessageEvent(senderId, eventName) {
        const onMessage = event_1.Event.fromNodeEventEmitter(ipcMain_1.validatedIpcMain, eventName, (event, message) => ({ event, message }));
        const onMessageFromSender = event_1.Event.filter(onMessage, ({ event }) => event.sender.id === senderId);
        return event_1.Event.map(onMessageFromSender, ({ message }) => message ? buffer_1.VSBuffer.wrap(message) : message);
    }
    /**
     * An implementation of `IPCServer` on top of Electron `ipcMain` API.
     */
    class Server extends ipc_1.IPCServer {
        static { this.Clients = new Map(); }
        static getOnDidClientConnect() {
            const onHello = event_1.Event.fromNodeEventEmitter(ipcMain_1.validatedIpcMain, 'vscode:hello', ({ sender }) => sender);
            return event_1.Event.map(onHello, webContents => {
                const id = webContents.id;
                const client = Server.Clients.get(id);
                client?.dispose();
                const onDidClientReconnect = new event_1.Emitter();
                Server.Clients.set(id, (0, lifecycle_1.toDisposable)(() => onDidClientReconnect.fire()));
                const onMessage = createScopedOnMessageEvent(id, 'vscode:message');
                const onDidClientDisconnect = event_1.Event.any(event_1.Event.signal(createScopedOnMessageEvent(id, 'vscode:disconnect')), onDidClientReconnect.event);
                const protocol = new ipc_electron_1.Protocol(webContents, onMessage);
                return { protocol, onDidClientDisconnect };
            });
        }
        constructor() {
            super(Server.getOnDidClientConnect());
        }
    }
    exports.Server = Server;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLmVsZWN0cm9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3BhcnRzL2lwYy9lbGVjdHJvbi1tYWluL2lwYy5lbGVjdHJvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsU0FBUywwQkFBMEIsQ0FBQyxRQUFnQixFQUFFLFNBQWlCO1FBQ3RFLE1BQU0sU0FBUyxHQUFHLGFBQUssQ0FBQyxvQkFBb0IsQ0FBWSwwQkFBZ0IsRUFBRSxTQUFTLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvSCxNQUFNLG1CQUFtQixHQUFHLGFBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssUUFBUSxDQUFDLENBQUM7UUFFakcsT0FBTyxhQUFLLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxpQkFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDcEcsQ0FBQztJQUVEOztPQUVHO0lBQ0gsTUFBYSxNQUFPLFNBQVEsZUFBUztpQkFFWixZQUFPLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7UUFFekQsTUFBTSxDQUFDLHFCQUFxQjtZQUNuQyxNQUFNLE9BQU8sR0FBRyxhQUFLLENBQUMsb0JBQW9CLENBQWMsMEJBQWdCLEVBQUUsY0FBYyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFbEgsT0FBTyxhQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsRUFBRTtnQkFDdkMsTUFBTSxFQUFFLEdBQUcsV0FBVyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRXRDLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQztnQkFFbEIsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO2dCQUNqRCxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFeEUsTUFBTSxTQUFTLEdBQUcsMEJBQTBCLENBQUMsRUFBRSxFQUFFLGdCQUFnQixDQUFvQixDQUFDO2dCQUN0RixNQUFNLHFCQUFxQixHQUFHLGFBQUssQ0FBQyxHQUFHLENBQUMsYUFBSyxDQUFDLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQyxFQUFFLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxFQUFFLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN2SSxNQUFNLFFBQVEsR0FBRyxJQUFJLHVCQUFnQixDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFFOUQsT0FBTyxFQUFFLFFBQVEsRUFBRSxxQkFBcUIsRUFBRSxDQUFDO1lBQzVDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVEO1lBQ0MsS0FBSyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUM7UUFDdkMsQ0FBQzs7SUExQkYsd0JBMkJDIn0=