/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Protocol = void 0;
    /**
     * The Electron `Protocol` leverages Electron style IPC communication (`ipcRenderer`, `ipcMain`)
     * for the implementation of the `IMessagePassingProtocol`. That style of API requires a channel
     * name for sending data.
     */
    class Protocol {
        constructor(sender, onMessage) {
            this.sender = sender;
            this.onMessage = onMessage;
        }
        send(message) {
            try {
                this.sender.send('vscode:message', message.buffer);
            }
            catch (e) {
                // systems are going down
            }
        }
        disconnect() {
            this.sender.send('vscode:disconnect', null);
        }
    }
    exports.Protocol = Protocol;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLmVsZWN0cm9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3BhcnRzL2lwYy9jb21tb24vaXBjLmVsZWN0cm9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRzs7OztPQUlHO0lBQ0gsTUFBYSxRQUFRO1FBRXBCLFlBQW9CLE1BQWMsRUFBVyxTQUEwQjtZQUFuRCxXQUFNLEdBQU4sTUFBTSxDQUFRO1lBQVcsY0FBUyxHQUFULFNBQVMsQ0FBaUI7UUFBSSxDQUFDO1FBRTVFLElBQUksQ0FBQyxPQUFpQjtZQUNyQixJQUFJLENBQUM7Z0JBQ0osSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BELENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLHlCQUF5QjtZQUMxQixDQUFDO1FBQ0YsQ0FBQztRQUVELFVBQVU7WUFDVCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM3QyxDQUFDO0tBQ0Q7SUFmRCw0QkFlQyJ9