/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/window", "vs/base/common/event", "vs/base/common/uuid", "vs/base/parts/sandbox/electron-sandbox/globals"], function (require, exports, window_1, event_1, uuid_1, globals_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.acquirePort = acquirePort;
    async function acquirePort(requestChannel, responseChannel, nonce = (0, uuid_1.generateUuid)()) {
        // Get ready to acquire the message port from the
        // provided `responseChannel` via preload helper.
        globals_1.ipcMessagePort.acquire(responseChannel, nonce);
        // If a `requestChannel` is provided, we are in charge
        // to trigger acquisition of the message port from main
        if (typeof requestChannel === 'string') {
            globals_1.ipcRenderer.send(requestChannel, nonce);
        }
        // Wait until the main side has returned the `MessagePort`
        // We need to filter by the `nonce` to ensure we listen
        // to the right response.
        const onMessageChannelResult = event_1.Event.fromDOMEventEmitter(window_1.mainWindow, 'message', (e) => ({ nonce: e.data, port: e.ports[0], source: e.source }));
        const { port } = await event_1.Event.toPromise(event_1.Event.once(event_1.Event.filter(onMessageChannelResult, e => e.nonce === nonce && e.source === window_1.mainWindow)));
        return port;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLm1wLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3BhcnRzL2lwYy9lbGVjdHJvbi1zYW5kYm94L2lwYy5tcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyxrQ0FtQkM7SUFuQk0sS0FBSyxVQUFVLFdBQVcsQ0FBQyxjQUFrQyxFQUFFLGVBQXVCLEVBQUUsS0FBSyxHQUFHLElBQUEsbUJBQVksR0FBRTtRQUVwSCxpREFBaUQ7UUFDakQsaURBQWlEO1FBQ2pELHdCQUFjLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUUvQyxzREFBc0Q7UUFDdEQsdURBQXVEO1FBQ3ZELElBQUksT0FBTyxjQUFjLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDeEMscUJBQVcsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFRCwwREFBMEQ7UUFDMUQsdURBQXVEO1FBQ3ZELHlCQUF5QjtRQUN6QixNQUFNLHNCQUFzQixHQUFHLGFBQUssQ0FBQyxtQkFBbUIsQ0FBd0IsbUJBQVUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFlLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNyTCxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxhQUFLLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxJQUFJLENBQUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssS0FBSyxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssbUJBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU1SSxPQUFPLElBQUksQ0FBQztJQUNiLENBQUMifQ==