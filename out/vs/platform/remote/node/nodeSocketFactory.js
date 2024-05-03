/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "net", "vs/base/parts/ipc/node/ipc.net", "vs/platform/remote/common/managedSocket"], function (require, exports, net, ipc_net_1, managedSocket_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.nodeSocketFactory = void 0;
    exports.nodeSocketFactory = new class {
        supports(connectTo) {
            return true;
        }
        connect({ host, port }, path, query, debugLabel) {
            return new Promise((resolve, reject) => {
                const socket = net.createConnection({ host: host, port: port }, () => {
                    socket.removeListener('error', reject);
                    socket.write((0, managedSocket_1.makeRawSocketHeaders)(path, query, debugLabel));
                    const onData = (data) => {
                        const strData = data.toString();
                        if (strData.indexOf('\r\n\r\n') >= 0) {
                            // headers received OK
                            socket.off('data', onData);
                            resolve(new ipc_net_1.NodeSocket(socket, debugLabel));
                        }
                    };
                    socket.on('data', onData);
                });
                // Disable Nagle's algorithm.
                socket.setNoDelay(true);
                socket.once('error', reject);
            });
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZVNvY2tldEZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3JlbW90ZS9ub2RlL25vZGVTb2NrZXRGYWN0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNuRixRQUFBLGlCQUFpQixHQUFHLElBQUk7UUFFcEMsUUFBUSxDQUFDLFNBQW9DO1lBQzVDLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE9BQU8sQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQTZCLEVBQUUsSUFBWSxFQUFFLEtBQWEsRUFBRSxVQUFrQjtZQUNqRyxPQUFPLElBQUksT0FBTyxDQUFVLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUMvQyxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxHQUFHLEVBQUU7b0JBQ3BFLE1BQU0sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUV2QyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUEsb0NBQW9CLEVBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO29CQUU1RCxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQVksRUFBRSxFQUFFO3dCQUMvQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7d0JBQ2hDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQzs0QkFDdEMsc0JBQXNCOzRCQUN0QixNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQzs0QkFDM0IsT0FBTyxDQUFDLElBQUksb0JBQVUsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQzt3QkFDN0MsQ0FBQztvQkFDRixDQUFDLENBQUM7b0JBQ0YsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzNCLENBQUMsQ0FBQyxDQUFDO2dCQUNILDZCQUE2QjtnQkFDN0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEIsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDOUIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0QsQ0FBQyJ9