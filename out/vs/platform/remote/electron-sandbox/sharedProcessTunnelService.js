/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/ipc/electron-sandbox/services", "vs/platform/remote/common/sharedProcessTunnelService"], function (require, exports, services_1, sharedProcessTunnelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, services_1.registerSharedProcessRemoteService)(sharedProcessTunnelService_1.ISharedProcessTunnelService, sharedProcessTunnelService_1.ipcSharedProcessTunnelChannelName);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkUHJvY2Vzc1R1bm5lbFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3JlbW90ZS9lbGVjdHJvbi1zYW5kYm94L3NoYXJlZFByb2Nlc3NUdW5uZWxTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBS2hHLElBQUEsNkNBQWtDLEVBQUMsd0RBQTJCLEVBQUUsOERBQWlDLENBQUMsQ0FBQyJ9