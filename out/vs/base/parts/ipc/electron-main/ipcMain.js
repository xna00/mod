/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/base/common/errors", "vs/base/common/network"], function (require, exports, electron_1, errors_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validatedIpcMain = void 0;
    class ValidatedIpcMain {
        constructor() {
            // We need to keep a map of original listener to the wrapped variant in order
            // to properly implement `removeListener`. We use a `WeakMap` because we do
            // not want to prevent the `key` of the map to get garbage collected.
            this.mapListenerToWrapper = new WeakMap();
        }
        /**
         * Listens to `channel`, when a new message arrives `listener` would be called with
         * `listener(event, args...)`.
         */
        on(channel, listener) {
            // Remember the wrapped listener so that later we can
            // properly implement `removeListener`.
            const wrappedListener = (event, ...args) => {
                if (this.validateEvent(channel, event)) {
                    listener(event, ...args);
                }
            };
            this.mapListenerToWrapper.set(listener, wrappedListener);
            electron_1.ipcMain.on(channel, wrappedListener);
            return this;
        }
        /**
         * Adds a one time `listener` function for the event. This `listener` is invoked
         * only the next time a message is sent to `channel`, after which it is removed.
         */
        once(channel, listener) {
            electron_1.ipcMain.once(channel, (event, ...args) => {
                if (this.validateEvent(channel, event)) {
                    listener(event, ...args);
                }
            });
            return this;
        }
        /**
         * Adds a handler for an `invoke`able IPC. This handler will be called whenever a
         * renderer calls `ipcRenderer.invoke(channel, ...args)`.
         *
         * If `listener` returns a Promise, the eventual result of the promise will be
         * returned as a reply to the remote caller. Otherwise, the return value of the
         * listener will be used as the value of the reply.
         *
         * The `event` that is passed as the first argument to the handler is the same as
         * that passed to a regular event listener. It includes information about which
         * WebContents is the source of the invoke request.
         *
         * Errors thrown through `handle` in the main process are not transparent as they
         * are serialized and only the `message` property from the original error is
         * provided to the renderer process. Please refer to #24427 for details.
         */
        handle(channel, listener) {
            electron_1.ipcMain.handle(channel, (event, ...args) => {
                if (this.validateEvent(channel, event)) {
                    return listener(event, ...args);
                }
                return Promise.reject(`Invalid channel '${channel}' or sender for ipcMain.handle() usage.`);
            });
            return this;
        }
        /**
         * Removes any handler for `channel`, if present.
         */
        removeHandler(channel) {
            electron_1.ipcMain.removeHandler(channel);
            return this;
        }
        /**
         * Removes the specified `listener` from the listener array for the specified
         * `channel`.
         */
        removeListener(channel, listener) {
            const wrappedListener = this.mapListenerToWrapper.get(listener);
            if (wrappedListener) {
                electron_1.ipcMain.removeListener(channel, wrappedListener);
                this.mapListenerToWrapper.delete(listener);
            }
            return this;
        }
        validateEvent(channel, event) {
            if (!channel || !channel.startsWith('vscode:')) {
                (0, errors_1.onUnexpectedError)(`Refused to handle ipcMain event for channel '${channel}' because the channel is unknown.`);
                return false; // unexpected channel
            }
            const sender = event.senderFrame;
            const url = sender.url;
            // `url` can be `undefined` when running tests from playwright https://github.com/microsoft/vscode/issues/147301
            // and `url` can be `about:blank` when reloading the window
            // from performance tab of devtools https://github.com/electron/electron/issues/39427.
            // It is fine to skip the checks in these cases.
            if (!url || url === 'about:blank') {
                return true;
            }
            let host = 'unknown';
            try {
                host = new URL(url).host;
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(`Refused to handle ipcMain event for channel '${channel}' because of a malformed URL '${url}'.`);
                return false; // unexpected URL
            }
            if (host !== network_1.VSCODE_AUTHORITY) {
                (0, errors_1.onUnexpectedError)(`Refused to handle ipcMain event for channel '${channel}' because of a bad origin of '${host}'.`);
                return false; // unexpected sender
            }
            if (sender.parent !== null) {
                (0, errors_1.onUnexpectedError)(`Refused to handle ipcMain event for channel '${channel}' because sender of origin '${host}' is not a main frame.`);
                return false; // unexpected frame
            }
            return true;
        }
    }
    /**
     * A drop-in replacement of `ipcMain` that validates the sender of a message
     * according to https://github.com/electron/electron/blob/main/docs/tutorial/security.md
     *
     * @deprecated direct use of Electron IPC is not encouraged. We have utilities in place
     * to create services on top of IPC, see `ProxyChannel` for more information.
     */
    exports.validatedIpcMain = new ValidatedIpcMain();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjTWFpbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9wYXJ0cy9pcGMvZWxlY3Ryb24tbWFpbi9pcGNNYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFNLGdCQUFnQjtRQUF0QjtZQUVDLDZFQUE2RTtZQUM3RSwyRUFBMkU7WUFDM0UscUVBQXFFO1lBQ3BELHlCQUFvQixHQUFHLElBQUksT0FBTyxFQUFvQyxDQUFDO1FBNkh6RixDQUFDO1FBM0hBOzs7V0FHRztRQUNILEVBQUUsQ0FBQyxPQUFlLEVBQUUsUUFBeUI7WUFFNUMscURBQXFEO1lBQ3JELHVDQUF1QztZQUN2QyxNQUFNLGVBQWUsR0FBRyxDQUFDLEtBQW1CLEVBQUUsR0FBRyxJQUFXLEVBQUUsRUFBRTtnQkFDL0QsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUN4QyxRQUFRLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7Z0JBQzFCLENBQUM7WUFDRixDQUFDLENBQUM7WUFFRixJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUV6RCxrQkFBYSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFFM0MsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQ7OztXQUdHO1FBQ0gsSUFBSSxDQUFDLE9BQWUsRUFBRSxRQUF5QjtZQUM5QyxrQkFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFtQixFQUFFLEdBQUcsSUFBVyxFQUFFLEVBQUU7Z0JBQ25FLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FB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