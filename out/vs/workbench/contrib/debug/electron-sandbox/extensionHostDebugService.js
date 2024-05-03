/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/debug/common/extensionHostDebug", "vs/platform/ipc/electron-sandbox/services", "vs/platform/debug/common/extensionHostDebugIpc"], function (require, exports, extensionHostDebug_1, services_1, extensionHostDebugIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, services_1.registerMainProcessRemoteService)(extensionHostDebug_1.IExtensionHostDebugService, extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel.ChannelName, { channelClientCtor: extensionHostDebugIpc_1.ExtensionHostDebugChannelClient });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdERlYnVnU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvZWxlY3Ryb24tc2FuZGJveC9leHRlbnNpb25Ib3N0RGVidWdTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLElBQUEsMkNBQWdDLEVBQUMsK0NBQTBCLEVBQUUsMERBQWtDLENBQUMsV0FBVyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsdURBQStCLEVBQUUsQ0FBQyxDQUFDIn0=