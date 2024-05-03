/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeRemoteResourceRouter = exports.NODE_REMOTE_RESOURCE_CHANNEL_NAME = exports.NODE_REMOTE_RESOURCE_IPC_METHOD_NAME = void 0;
    exports.NODE_REMOTE_RESOURCE_IPC_METHOD_NAME = 'request';
    exports.NODE_REMOTE_RESOURCE_CHANNEL_NAME = 'remoteResourceHandler';
    class NodeRemoteResourceRouter {
        async routeCall(hub, command, arg) {
            if (command !== exports.NODE_REMOTE_RESOURCE_IPC_METHOD_NAME) {
                throw new Error(`Call not found: ${command}`);
            }
            const uri = arg[0];
            if (uri?.authority) {
                const connection = hub.connections.find(c => c.ctx === uri.authority);
                if (connection) {
                    return connection;
                }
            }
            throw new Error(`Caller not found`);
        }
        routeEvent(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
    }
    exports.NodeRemoteResourceRouter = NodeRemoteResourceRouter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlY3Ryb25SZW1vdGVSZXNvdXJjZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3JlbW90ZS9jb21tb24vZWxlY3Ryb25SZW1vdGVSZXNvdXJjZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS25GLFFBQUEsb0NBQW9DLEdBQUcsU0FBUyxDQUFDO0lBRWpELFFBQUEsaUNBQWlDLEdBQUcsdUJBQXVCLENBQUM7SUFJekUsTUFBYSx3QkFBd0I7UUFDcEMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUEyQixFQUFFLE9BQWUsRUFBRSxHQUFTO1lBQ3RFLElBQUksT0FBTyxLQUFLLDRDQUFvQyxFQUFFLENBQUM7Z0JBQ3RELE1BQU0sSUFBSSxLQUFLLENBQUMsbUJBQW1CLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDL0MsQ0FBQztZQUVELE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQWdDLENBQUM7WUFDbEQsSUFBSSxHQUFHLEVBQUUsU0FBUyxFQUFFLENBQUM7Z0JBQ3BCLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3RFLElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ2hCLE9BQU8sVUFBVSxDQUFDO2dCQUNuQixDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRUQsVUFBVSxDQUFDLENBQXlCLEVBQUUsS0FBYTtZQUNsRCxNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzlDLENBQUM7S0FDRDtJQXBCRCw0REFvQkMifQ==