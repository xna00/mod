/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncEnablementService"], function (require, exports, extensions_1, userDataSync_1, userDataSyncEnablementService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncEnablementService = void 0;
    class UserDataSyncEnablementService extends userDataSyncEnablementService_1.UserDataSyncEnablementService {
        get workbenchEnvironmentService() { return this.environmentService; }
        getResourceSyncStateVersion(resource) {
            return resource === "extensions" /* SyncResource.Extensions */ ? this.workbenchEnvironmentService.options?.settingsSyncOptions?.extensionsSyncStateVersion : undefined;
        }
    }
    exports.UserDataSyncEnablementService = UserDataSyncEnablementService;
    (0, extensions_1.registerSingleton)(userDataSync_1.IUserDataSyncEnablementService, UserDataSyncEnablementService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jRW5hYmxlbWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyRGF0YVN5bmMvYnJvd3Nlci91c2VyRGF0YVN5bmNFbmFibGVtZW50U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBYSw2QkFBOEIsU0FBUSw2REFBaUM7UUFFbkYsSUFBYywyQkFBMkIsS0FBMEMsT0FBNEMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUVoSiwyQkFBMkIsQ0FBQyxRQUFzQjtZQUMxRCxPQUFPLFFBQVEsK0NBQTRCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUNySixDQUFDO0tBRUQ7SUFSRCxzRUFRQztJQUVELElBQUEsOEJBQWlCLEVBQUMsNkNBQThCLEVBQUUsNkJBQTZCLG9DQUE0QixDQUFDIn0=