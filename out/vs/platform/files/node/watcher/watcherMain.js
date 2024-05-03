/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc.cp", "vs/base/parts/ipc/node/ipc.mp", "vs/base/parts/sandbox/node/electronTypes", "vs/platform/files/node/watcher/watcher"], function (require, exports, lifecycle_1, ipc_1, ipc_cp_1, ipc_mp_1, electronTypes_1, watcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let server;
    if ((0, electronTypes_1.isUtilityProcess)(process)) {
        server = new ipc_mp_1.Server();
    }
    else {
        server = new ipc_cp_1.Server('watcher');
    }
    const service = new watcher_1.UniversalWatcher();
    server.registerChannel('watcher', ipc_1.ProxyChannel.fromService(service, new lifecycle_1.DisposableStore()));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlck1haW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL25vZGUvd2F0Y2hlci93YXRjaGVyTWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxJQUFJLE1BQXlELENBQUM7SUFDOUQsSUFBSSxJQUFBLGdDQUFnQixFQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDL0IsTUFBTSxHQUFHLElBQUksZUFBb0IsRUFBRSxDQUFDO0lBQ3JDLENBQUM7U0FBTSxDQUFDO1FBQ1AsTUFBTSxHQUFHLElBQUksZUFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSwwQkFBZ0IsRUFBRSxDQUFDO0lBQ3ZDLE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLGtCQUFZLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMifQ==