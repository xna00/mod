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
define(["require", "exports", "vs/base/parts/ipc/common/ipc", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/ipc/common/mainProcessService"], function (require, exports, ipc_1, descriptors_1, extensions_1, instantiation_1, mainProcessService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ISharedProcessService = void 0;
    exports.registerMainProcessRemoteService = registerMainProcessRemoteService;
    exports.registerSharedProcessRemoteService = registerSharedProcessRemoteService;
    class RemoteServiceStub {
        constructor(channelName, options, remote, instantiationService) {
            const channel = remote.getChannel(channelName);
            if (isRemoteServiceWithChannelClientOptions(options)) {
                return instantiationService.createInstance(new descriptors_1.SyncDescriptor(options.channelClientCtor, [channel]));
            }
            return ipc_1.ProxyChannel.toService(channel, options?.proxyOptions);
        }
    }
    function isRemoteServiceWithChannelClientOptions(obj) {
        const candidate = obj;
        return !!candidate?.channelClientCtor;
    }
    //#region Main Process
    let MainProcessRemoteServiceStub = class MainProcessRemoteServiceStub extends RemoteServiceStub {
        constructor(channelName, options, ipcService, instantiationService) {
            super(channelName, options, ipcService, instantiationService);
        }
    };
    MainProcessRemoteServiceStub = __decorate([
        __param(2, mainProcessService_1.IMainProcessService),
        __param(3, instantiation_1.IInstantiationService)
    ], MainProcessRemoteServiceStub);
    function registerMainProcessRemoteService(id, channelName, options) {
        (0, extensions_1.registerSingleton)(id, new descriptors_1.SyncDescriptor(MainProcessRemoteServiceStub, [channelName, options], true));
    }
    //#endregion
    //#region Shared Process
    exports.ISharedProcessService = (0, instantiation_1.createDecorator)('sharedProcessService');
    let SharedProcessRemoteServiceStub = class SharedProcessRemoteServiceStub extends RemoteServiceStub {
        constructor(channelName, options, ipcService, instantiationService) {
            super(channelName, options, ipcService, instantiationService);
        }
    };
    SharedProcessRemoteServiceStub = __decorate([
        __param(2, exports.ISharedProcessService),
        __param(3, instantiation_1.IInstantiationService)
    ], SharedProcessRemoteServiceStub);
    function registerSharedProcessRemoteService(id, channelName, options) {
        (0, extensions_1.registerSingleton)(id, new descriptors_1.SyncDescriptor(SharedProcessRemoteServiceStub, [channelName, options], true));
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2lwYy9lbGVjdHJvbi1zYW5kYm94L3NlcnZpY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1EaEcsNEVBRUM7SUFnQ0QsZ0ZBRUM7SUEzRUQsTUFBZSxpQkFBaUI7UUFDL0IsWUFDQyxXQUFtQixFQUNuQixPQUErRixFQUMvRixNQUFjLEVBQ2Qsb0JBQTJDO1lBRTNDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFL0MsSUFBSSx1Q0FBdUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUN0RCxPQUFPLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxJQUFJLDRCQUFjLENBQUMsT0FBTyxDQUFDLGlCQUFpQixFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RHLENBQUM7WUFFRCxPQUFPLGtCQUFZLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDL0QsQ0FBQztLQUNEO0lBVUQsU0FBUyx1Q0FBdUMsQ0FBSSxHQUFZO1FBQy9ELE1BQU0sU0FBUyxHQUFHLEdBQTRELENBQUM7UUFFL0UsT0FBTyxDQUFDLENBQUMsU0FBUyxFQUFFLGlCQUFpQixDQUFDO0lBQ3ZDLENBQUM7SUFFRCxzQkFBc0I7SUFFdEIsSUFBTSw0QkFBNEIsR0FBbEMsTUFBTSw0QkFBK0MsU0FBUSxpQkFBb0I7UUFDaEYsWUFBWSxXQUFtQixFQUFFLE9BQStGLEVBQXVCLFVBQStCLEVBQXlCLG9CQUEyQztZQUN6UCxLQUFLLENBQUMsV0FBVyxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUMvRCxDQUFDO0tBQ0QsQ0FBQTtJQUpLLDRCQUE0QjtRQUNrRyxXQUFBLHdDQUFtQixDQUFBO1FBQW1DLFdBQUEscUNBQXFCLENBQUE7T0FEek0sNEJBQTRCLENBSWpDO0lBRUQsU0FBZ0IsZ0NBQWdDLENBQUksRUFBd0IsRUFBRSxXQUFtQixFQUFFLE9BQW9GO1FBQ3RMLElBQUEsOEJBQWlCLEVBQUMsRUFBRSxFQUFFLElBQUksNEJBQWMsQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3ZHLENBQUM7SUFFRCxZQUFZO0lBRVosd0JBQXdCO0lBRVgsUUFBQSxxQkFBcUIsR0FBRyxJQUFBLCtCQUFlLEVBQXdCLHNCQUFzQixDQUFDLENBQUM7SUFvQnBHLElBQU0sOEJBQThCLEdBQXBDLE1BQU0sOEJBQWlELFNBQVEsaUJBQW9CO1FBQ2xGLFlBQVksV0FBbUIsRUFBRSxPQUErRixFQUF5QixVQUFpQyxFQUF5QixvQkFBMkM7WUFDN1AsS0FBSyxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDL0QsQ0FBQztLQUNELENBQUE7SUFKSyw4QkFBOEI7UUFDZ0csV0FBQSw2QkFBcUIsQ0FBQTtRQUFxQyxXQUFBLHFDQUFxQixDQUFBO09BRDdNLDhCQUE4QixDQUluQztJQUVELFNBQWdCLGtDQUFrQyxDQUFJLEVBQXdCLEVBQUUsV0FBbUIsRUFBRSxPQUFvRjtRQUN4TCxJQUFBLDhCQUFpQixFQUFDLEVBQUUsRUFBRSxJQUFJLDRCQUFjLENBQUMsOEJBQThCLEVBQUUsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN6RyxDQUFDOztBQUVELFlBQVkifQ==