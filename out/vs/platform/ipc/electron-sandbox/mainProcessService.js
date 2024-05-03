/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/parts/ipc/electron-sandbox/ipc.electron"], function (require, exports, lifecycle_1, ipc_electron_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronIPCMainProcessService = void 0;
    /**
     * An implementation of `IMainProcessService` that leverages Electron's IPC.
     */
    class ElectronIPCMainProcessService extends lifecycle_1.Disposable {
        constructor(windowId) {
            super();
            this.mainProcessConnection = this._register(new ipc_electron_1.Client(`window:${windowId}`));
        }
        getChannel(channelName) {
            return this.mainProcessConnection.getChannel(channelName);
        }
        registerChannel(channelName, channel) {
            this.mainProcessConnection.registerChannel(channelName, channel);
        }
    }
    exports.ElectronIPCMainProcessService = ElectronIPCMainProcessService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblByb2Nlc3NTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9pcGMvZWxlY3Ryb24tc2FuZGJveC9tYWluUHJvY2Vzc1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHOztPQUVHO0lBQ0gsTUFBYSw2QkFBOEIsU0FBUSxzQkFBVTtRQU01RCxZQUNDLFFBQWdCO1lBRWhCLEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxxQkFBaUIsQ0FBQyxVQUFVLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMxRixDQUFDO1FBRUQsVUFBVSxDQUFDLFdBQW1CO1lBQzdCLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRUQsZUFBZSxDQUFDLFdBQW1CLEVBQUUsT0FBK0I7WUFDbkUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDbEUsQ0FBQztLQUNEO0lBckJELHNFQXFCQyJ9