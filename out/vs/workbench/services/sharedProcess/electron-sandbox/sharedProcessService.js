/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/parts/ipc/common/ipc.mp", "vs/base/parts/ipc/common/ipc", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/platform/sharedProcess/common/sharedProcess", "vs/base/common/performance", "vs/base/common/async", "vs/base/parts/ipc/electron-sandbox/ipc.mp"], function (require, exports, ipc_mp_1, ipc_1, log_1, lifecycle_1, sharedProcess_1, performance_1, async_1, ipc_mp_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedProcessService = void 0;
    let SharedProcessService = class SharedProcessService extends lifecycle_1.Disposable {
        constructor(windowId, logService) {
            super();
            this.windowId = windowId;
            this.logService = logService;
            this.restoredBarrier = new async_1.Barrier();
            this.withSharedProcessConnection = this.connect();
        }
        async connect() {
            this.logService.trace('Renderer->SharedProcess#connect');
            // Our performance tests show that a connection to the shared
            // process can have significant overhead to the startup time
            // of the window because the shared process could be created
            // as a result. As such, make sure we await the `Restored`
            // phase before making a connection attempt, but also add a
            // timeout to be safe against possible deadlocks.
            await Promise.race([this.restoredBarrier.wait(), (0, async_1.timeout)(2000)]);
            // Acquire a message port connected to the shared process
            (0, performance_1.mark)('code/willConnectSharedProcess');
            this.logService.trace('Renderer->SharedProcess#connect: before acquirePort');
            const port = await (0, ipc_mp_2.acquirePort)(sharedProcess_1.SharedProcessChannelConnection.request, sharedProcess_1.SharedProcessChannelConnection.response);
            (0, performance_1.mark)('code/didConnectSharedProcess');
            this.logService.trace('Renderer->SharedProcess#connect: connection established');
            return this._register(new ipc_mp_1.Client(port, `window:${this.windowId}`));
        }
        notifyRestored() {
            if (!this.restoredBarrier.isOpen()) {
                this.restoredBarrier.open();
            }
        }
        getChannel(channelName) {
            return (0, ipc_1.getDelayedChannel)(this.withSharedProcessConnection.then(connection => connection.getChannel(channelName)));
        }
        registerChannel(channelName, channel) {
            this.withSharedProcessConnection.then(connection => connection.registerChannel(channelName, channel));
        }
        async createRawConnection() {
            // Await initialization of the shared process
            await this.withSharedProcessConnection;
            // Create a new port to the shared process
            this.logService.trace('Renderer->SharedProcess#createRawConnection: before acquirePort');
            const port = await (0, ipc_mp_2.acquirePort)(sharedProcess_1.SharedProcessRawConnection.request, sharedProcess_1.SharedProcessRawConnection.response);
            this.logService.trace('Renderer->SharedProcess#createRawConnection: connection established');
            return port;
        }
    };
    exports.SharedProcessService = SharedProcessService;
    exports.SharedProcessService = SharedProcessService = __decorate([
        __param(1, log_1.ILogService)
    ], SharedProcessService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkUHJvY2Vzc1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zaGFyZWRQcm9jZXNzL2VsZWN0cm9uLXNhbmRib3gvc2hhcmVkUHJvY2Vzc1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBWXpGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7UUFRbkQsWUFDVSxRQUFnQixFQUNaLFVBQXdDO1lBRXJELEtBQUssRUFBRSxDQUFDO1lBSEMsYUFBUSxHQUFSLFFBQVEsQ0FBUTtZQUNLLGVBQVUsR0FBVixVQUFVLENBQWE7WUFKckMsb0JBQWUsR0FBRyxJQUFJLGVBQU8sRUFBRSxDQUFDO1lBUWhELElBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbkQsQ0FBQztRQUVPLEtBQUssQ0FBQyxPQUFPO1lBQ3BCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7WUFFekQsNkRBQTZEO1lBQzdELDREQUE0RDtZQUM1RCw0REFBNEQ7WUFDNUQsMERBQTBEO1lBQzFELDJEQUEyRDtZQUMzRCxpREFBaUQ7WUFFakQsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFakUseURBQXlEO1lBQ3pELElBQUEsa0JBQUksRUFBQywrQkFBK0IsQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHFEQUFxRCxDQUFDLENBQUM7WUFDN0UsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFBLG9CQUFXLEVBQUMsOENBQThCLENBQUMsT0FBTyxFQUFFLDhDQUE4QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2hILElBQUEsa0JBQUksRUFBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHlEQUF5RCxDQUFDLENBQUM7WUFFakYsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBaUIsQ0FBQyxJQUFJLEVBQUUsVUFBVSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQy9FLENBQUM7UUFFRCxjQUFjO1lBQ2IsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUM3QixDQUFDO1FBQ0YsQ0FBQztRQUVELFVBQVUsQ0FBQyxXQUFtQjtZQUM3QixPQUFPLElBQUEsdUJBQWlCLEVBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ILENBQUM7UUFFRCxlQUFlLENBQUMsV0FBbUIsRUFBRSxPQUErQjtZQUNuRSxJQUFJLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN2RyxDQUFDO1FBRUQsS0FBSyxDQUFDLG1CQUFtQjtZQUV4Qiw2Q0FBNkM7WUFDN0MsTUFBTSxJQUFJLENBQUMsMkJBQTJCLENBQUM7WUFFdkMsMENBQTBDO1lBQzFDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLGlFQUFpRSxDQUFDLENBQUM7WUFDekYsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFBLG9CQUFXLEVBQUMsMENBQTBCLENBQUMsT0FBTyxFQUFFLDBDQUEwQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHFFQUFxRSxDQUFDLENBQUM7WUFFN0YsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO0tBQ0QsQ0FBQTtJQWpFWSxvREFBb0I7bUNBQXBCLG9CQUFvQjtRQVU5QixXQUFBLGlCQUFXLENBQUE7T0FWRCxvQkFBb0IsQ0FpRWhDIn0=