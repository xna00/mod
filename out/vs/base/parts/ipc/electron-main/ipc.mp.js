/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/ipc/electron-main/ipcMain", "vs/base/common/event", "vs/base/common/uuid", "vs/base/parts/ipc/common/ipc.mp"], function (require, exports, ipcMain_1, event_1, uuid_1, ipc_mp_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Client = void 0;
    exports.connect = connect;
    /**
     * An implementation of a `IPCClient` on top of Electron `MessagePortMain`.
     */
    class Client extends ipc_mp_1.Client {
        /**
         * @param clientId a way to uniquely identify this client among
         * other clients. this is important for routing because every
         * client can also be a server
         */
        constructor(port, clientId) {
            super({
                addEventListener: (type, listener) => port.addListener(type, listener),
                removeEventListener: (type, listener) => port.removeListener(type, listener),
                postMessage: message => port.postMessage(message),
                start: () => port.start(),
                close: () => port.close()
            }, clientId);
        }
    }
    exports.Client = Client;
    /**
     * This method opens a message channel connection
     * in the target window. The target window needs
     * to use the `Server` from `electron-sandbox/ipc.mp`.
     */
    async function connect(window) {
        // Assert healthy window to talk to
        if (window.isDestroyed() || window.webContents.isDestroyed()) {
            throw new Error('ipc.mp#connect: Cannot talk to window because it is closed or destroyed');
        }
        // Ask to create message channel inside the window
        // and send over a UUID to correlate the response
        const nonce = (0, uuid_1.generateUuid)();
        window.webContents.send('vscode:createMessageChannel', nonce);
        // Wait until the window has returned the `MessagePort`
        // We need to filter by the `nonce` to ensure we listen
        // to the right response.
        const onMessageChannelResult = event_1.Event.fromNodeEventEmitter(ipcMain_1.validatedIpcMain, 'vscode:createMessageChannelResult', (e, nonce) => ({ nonce, port: e.ports[0] }));
        const { port } = await event_1.Event.toPromise(event_1.Event.once(event_1.Event.filter(onMessageChannelResult, e => e.nonce === nonce)));
        return port;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLm1wLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3BhcnRzL2lwYy9lbGVjdHJvbi1tYWluL2lwYy5tcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtQ2hHLDBCQW1CQztJQTdDRDs7T0FFRztJQUNILE1BQWEsTUFBTyxTQUFRLGVBQWlCO1FBRTVDOzs7O1dBSUc7UUFDSCxZQUFZLElBQXFCLEVBQUUsUUFBZ0I7WUFDbEQsS0FBSyxDQUFDO2dCQUNMLGdCQUFnQixFQUFFLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDO2dCQUN0RSxtQkFBbUIsRUFBRSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQztnQkFDNUUsV0FBVyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUM7Z0JBQ2pELEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUN6QixLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTthQUN6QixFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ2QsQ0FBQztLQUNEO0lBaEJELHdCQWdCQztJQUVEOzs7O09BSUc7SUFDSSxLQUFLLFVBQVUsT0FBTyxDQUFDLE1BQXFCO1FBRWxELG1DQUFtQztRQUNuQyxJQUFJLE1BQU0sQ0FBQyxXQUFXLEVBQUUsSUFBSSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7WUFDOUQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5RUFBeUUsQ0FBQyxDQUFDO1FBQzVGLENBQUM7UUFFRCxrREFBa0Q7UUFDbEQsaURBQWlEO1FBQ2pELE1BQU0sS0FBSyxHQUFHLElBQUEsbUJBQVksR0FBRSxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRTlELHVEQUF1RDtRQUN2RCx1REFBdUQ7UUFDdkQseUJBQXlCO1FBQ3pCLE1BQU0sc0JBQXNCLEdBQUcsYUFBSyxDQUFDLG9CQUFvQixDQUEyQywwQkFBZ0IsRUFBRSxtQ0FBbUMsRUFBRSxDQUFDLENBQWUsRUFBRSxLQUFhLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDOU4sTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sYUFBSyxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLGFBQUssQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVqSCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUMifQ==