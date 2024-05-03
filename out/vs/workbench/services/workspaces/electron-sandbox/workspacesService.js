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
define(["require", "exports", "vs/platform/workspaces/common/workspaces", "vs/platform/ipc/common/mainProcessService", "vs/platform/instantiation/common/extensions", "vs/base/parts/ipc/common/ipc", "vs/platform/native/common/native"], function (require, exports, workspaces_1, mainProcessService_1, extensions_1, ipc_1, native_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWorkspacesService = void 0;
    // @ts-ignore: interface is implemented via proxy
    let NativeWorkspacesService = class NativeWorkspacesService {
        constructor(mainProcessService, nativeHostService) {
            return ipc_1.ProxyChannel.toService(mainProcessService.getChannel('workspaces'), { context: nativeHostService.windowId });
        }
    };
    exports.NativeWorkspacesService = NativeWorkspacesService;
    exports.NativeWorkspacesService = NativeWorkspacesService = __decorate([
        __param(0, mainProcessService_1.IMainProcessService),
        __param(1, native_1.INativeHostService)
    ], NativeWorkspacesService);
    (0, extensions_1.registerSingleton)(workspaces_1.IWorkspacesService, NativeWorkspacesService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlc1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy93b3Jrc3BhY2VzL2VsZWN0cm9uLXNhbmRib3gvd29ya3NwYWNlc1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBUWhHLGlEQUFpRDtJQUMxQyxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1QjtRQUluQyxZQUNzQixrQkFBdUMsRUFDeEMsaUJBQXFDO1lBRXpELE9BQU8sa0JBQVksQ0FBQyxTQUFTLENBQXFCLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3pJLENBQUM7S0FDRCxDQUFBO0lBVlksMERBQXVCO3NDQUF2Qix1QkFBdUI7UUFLakMsV0FBQSx3Q0FBbUIsQ0FBQTtRQUNuQixXQUFBLDJCQUFrQixDQUFBO09BTlIsdUJBQXVCLENBVW5DO0lBRUQsSUFBQSw4QkFBaUIsRUFBQywrQkFBa0IsRUFBRSx1QkFBdUIsb0NBQTRCLENBQUMifQ==