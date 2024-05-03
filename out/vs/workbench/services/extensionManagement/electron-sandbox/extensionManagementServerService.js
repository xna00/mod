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
define(["require", "exports", "vs/nls", "vs/base/common/network", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/ipc/electron-sandbox/services", "vs/platform/instantiation/common/extensions", "vs/workbench/services/extensionManagement/electron-sandbox/remoteExtensionManagementService", "vs/platform/label/common/label", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/workbench/services/extensionManagement/electron-sandbox/nativeExtensionManagementService", "vs/base/common/lifecycle", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, nls_1, network_1, extensionManagement_1, remoteAgentService_1, services_1, extensions_1, remoteExtensionManagementService_1, label_1, instantiation_1, userDataProfile_1, nativeExtensionManagementService_1, lifecycle_1, userDataProfile_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionManagementServerService = void 0;
    let ExtensionManagementServerService = class ExtensionManagementServerService extends lifecycle_1.Disposable {
        constructor(sharedProcessService, remoteAgentService, labelService, userDataProfilesService, userDataProfileService, instantiationService) {
            super();
            this.remoteExtensionManagementServer = null;
            this.webExtensionManagementServer = null;
            const localExtensionManagementService = this._register(instantiationService.createInstance(nativeExtensionManagementService_1.NativeExtensionManagementService, sharedProcessService.getChannel('extensions')));
            this.localExtensionManagementServer = { extensionManagementService: localExtensionManagementService, id: 'local', label: (0, nls_1.localize)('local', "Local") };
            const remoteAgentConnection = remoteAgentService.getConnection();
            if (remoteAgentConnection) {
                const extensionManagementService = instantiationService.createInstance(remoteExtensionManagementService_1.NativeRemoteExtensionManagementService, remoteAgentConnection.getChannel('extensions'), this.localExtensionManagementServer);
                this.remoteExtensionManagementServer = {
                    id: 'remote',
                    extensionManagementService,
                    get label() { return labelService.getHostLabel(network_1.Schemas.vscodeRemote, remoteAgentConnection.remoteAuthority) || (0, nls_1.localize)('remote', "Remote"); },
                };
            }
        }
        getExtensionManagementServer(extension) {
            if (extension.location.scheme === network_1.Schemas.file) {
                return this.localExtensionManagementServer;
            }
            if (this.remoteExtensionManagementServer && extension.location.scheme === network_1.Schemas.vscodeRemote) {
                return this.remoteExtensionManagementServer;
            }
            throw new Error(`Invalid Extension ${extension.location}`);
        }
        getExtensionInstallLocation(extension) {
            const server = this.getExtensionManagementServer(extension);
            return server === this.remoteExtensionManagementServer ? 2 /* ExtensionInstallLocation.Remote */ : 1 /* ExtensionInstallLocation.Local */;
        }
    };
    exports.ExtensionManagementServerService = ExtensionManagementServerService;
    exports.ExtensionManagementServerService = ExtensionManagementServerService = __decorate([
        __param(0, services_1.ISharedProcessService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, label_1.ILabelService),
        __param(3, userDataProfile_2.IUserDataProfilesService),
        __param(4, userDataProfile_1.IUserDataProfileService),
        __param(5, instantiation_1.IInstantiationService)
    ], ExtensionManagementServerService);
    (0, extensions_1.registerSingleton)(extensionManagement_1.IExtensionManagementServerService, ExtensionManagementServerService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuYWdlbWVudFNlcnZlclNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25NYW5hZ2VtZW50L2VsZWN0cm9uLXNhbmRib3gvZXh0ZW5zaW9uTWFuYWdlbWVudFNlcnZlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0J6RixJQUFNLGdDQUFnQyxHQUF0QyxNQUFNLGdDQUFpQyxTQUFRLHNCQUFVO1FBUS9ELFlBQ3dCLG9CQUEyQyxFQUM3QyxrQkFBdUMsRUFDN0MsWUFBMkIsRUFDaEIsdUJBQWlELEVBQ2xELHNCQUErQyxFQUNqRCxvQkFBMkM7WUFFbEUsS0FBSyxFQUFFLENBQUM7WUFYQSxvQ0FBK0IsR0FBc0MsSUFBSSxDQUFDO1lBQzFFLGlDQUE0QixHQUFzQyxJQUFJLENBQUM7WUFXL0UsTUFBTSwrQkFBK0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxtRUFBZ0MsRUFBRSxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdLLElBQUksQ0FBQyw4QkFBOEIsR0FBRyxFQUFFLDBCQUEwQixFQUFFLCtCQUErQixFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ3RKLE1BQU0scUJBQXFCLEdBQUcsa0JBQWtCLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDakUsSUFBSSxxQkFBcUIsRUFBRSxDQUFDO2dCQUMzQixNQUFNLDBCQUEwQixHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx5RUFBc0MsRUFBRSxxQkFBcUIsQ0FBQyxVQUFVLENBQVcsWUFBWSxDQUFDLEVBQUUsSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUM7Z0JBQzlNLElBQUksQ0FBQywrQkFBK0IsR0FBRztvQkFDdEMsRUFBRSxFQUFFLFFBQVE7b0JBQ1osMEJBQTBCO29CQUMxQixJQUFJLEtBQUssS0FBSyxPQUFPLFlBQVksQ0FBQyxZQUFZLENBQUMsaUJBQU8sQ0FBQyxZQUFZLEVBQUUscUJBQXFCLENBQUMsZUFBZSxDQUFDLElBQUksSUFBQSxjQUFRLEVBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDOUksQ0FBQztZQUNILENBQUM7UUFFRixDQUFDO1FBRUQsNEJBQTRCLENBQUMsU0FBcUI7WUFDakQsSUFBSSxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNoRCxPQUFPLElBQUksQ0FBQyw4QkFBOEIsQ0FBQztZQUM1QyxDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsK0JBQStCLElBQUksU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDaEcsT0FBTyxJQUFJLENBQUMsK0JBQStCLENBQUM7WUFDN0MsQ0FBQztZQUNELE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFRCwyQkFBMkIsQ0FBQyxTQUFxQjtZQUNoRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUQsT0FBTyxNQUFNLEtBQUssSUFBSSxDQUFDLCtCQUErQixDQUFDLENBQUMseUNBQWlDLENBQUMsdUNBQStCLENBQUM7UUFDM0gsQ0FBQztLQUNELENBQUE7SUE3Q1ksNEVBQWdDOytDQUFoQyxnQ0FBZ0M7UUFTMUMsV0FBQSxnQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHdDQUFtQixDQUFBO1FBQ25CLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsMENBQXdCLENBQUE7UUFDeEIsV0FBQSx5Q0FBdUIsQ0FBQTtRQUN2QixXQUFBLHFDQUFxQixDQUFBO09BZFgsZ0NBQWdDLENBNkM1QztJQUVELElBQUEsOEJBQWlCLEVBQUMsdURBQWlDLEVBQUUsZ0NBQWdDLG9DQUE0QixDQUFDIn0=