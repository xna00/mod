/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/common/ipc.electron", "vs/base/parts/sandbox/electron-sandbox/globals"], function (require, exports, buffer_1, event_1, ipc_1, ipc_electron_1, globals_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Client = void 0;
    /**
     * An implementation of `IPCClient` on top of Electron `ipcRenderer` IPC communication
     * provided from sandbox globals (via preload script).
     */
    class Client extends ipc_1.IPCClient {
        static createProtocol() {
            const onMessage = event_1.Event.fromNodeEventEmitter(globals_1.ipcRenderer, 'vscode:message', (_, message) => buffer_1.VSBuffer.wrap(message));
            globals_1.ipcRenderer.send('vscode:hello');
            return new ipc_electron_1.Protocol(globals_1.ipcRenderer, onMessage);
        }
        constructor(id) {
            const protocol = Client.createProtocol();
            super(protocol, id);
            this.protocol = protocol;
        }
        dispose() {
            this.protocol.disconnect();
            super.dispose();
        }
    }
    exports.Client = Client;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLmVsZWN0cm9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3BhcnRzL2lwYy9lbGVjdHJvbi1zYW5kYm94L2lwYy5lbGVjdHJvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEc7OztPQUdHO0lBQ0gsTUFBYSxNQUFPLFNBQVEsZUFBUztRQUk1QixNQUFNLENBQUMsY0FBYztZQUM1QixNQUFNLFNBQVMsR0FBRyxhQUFLLENBQUMsb0JBQW9CLENBQVcscUJBQVcsRUFBRSxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLGlCQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDOUgscUJBQVcsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFakMsT0FBTyxJQUFJLHVCQUFnQixDQUFDLHFCQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVELFlBQVksRUFBVTtZQUNyQixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDekMsS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVwQixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUMxQixDQUFDO1FBRVEsT0FBTztZQUNmLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDM0IsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7S0FDRDtJQXRCRCx3QkFzQkMifQ==