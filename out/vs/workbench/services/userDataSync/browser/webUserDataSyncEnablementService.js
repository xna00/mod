/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/services/userDataSync/browser/userDataSyncEnablementService"], function (require, exports, extensions_1, userDataSync_1, userDataSyncEnablementService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebUserDataSyncEnablementService = void 0;
    class WebUserDataSyncEnablementService extends userDataSyncEnablementService_1.UserDataSyncEnablementService {
        constructor() {
            super(...arguments);
            this.enabled = undefined;
        }
        canToggleEnablement() {
            return this.isTrusted() && super.canToggleEnablement();
        }
        isEnabled() {
            if (!this.isTrusted()) {
                return false;
            }
            if (this.enabled === undefined) {
                this.enabled = this.workbenchEnvironmentService.options?.settingsSyncOptions?.enabled;
            }
            if (this.enabled === undefined) {
                this.enabled = super.isEnabled();
            }
            return this.enabled;
        }
        setEnablement(enabled) {
            if (enabled && !this.canToggleEnablement()) {
                return;
            }
            if (this.enabled !== enabled) {
                this.enabled = enabled;
                super.setEnablement(enabled);
            }
        }
        getResourceSyncStateVersion(resource) {
            return resource === "extensions" /* SyncResource.Extensions */ ? this.workbenchEnvironmentService.options?.settingsSyncOptions?.extensionsSyncStateVersion : undefined;
        }
        isTrusted() {
            return !!this.workbenchEnvironmentService.options?.workspaceProvider?.trusted;
        }
    }
    exports.WebUserDataSyncEnablementService = WebUserDataSyncEnablementService;
    (0, extensions_1.registerSingleton)(userDataSync_1.IUserDataSyncEnablementService, WebUserDataSyncEnablementService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViVXNlckRhdGFTeW5jRW5hYmxlbWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyRGF0YVN5bmMvYnJvd3Nlci93ZWJVc2VyRGF0YVN5bmNFbmFibGVtZW50U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSxnQ0FBaUMsU0FBUSw2REFBNkI7UUFBbkY7O1lBRVMsWUFBTyxHQUF3QixTQUFTLENBQUM7UUFxQ2xELENBQUM7UUFuQ1MsbUJBQW1CO1lBQzNCLE9BQU8sSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQ3hELENBQUM7UUFFUSxTQUFTO1lBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQztnQkFDdkIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsT0FBTyxDQUFDO1lBQ3ZGLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2xDLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDckIsQ0FBQztRQUVRLGFBQWEsQ0FBQyxPQUFnQjtZQUN0QyxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUM7Z0JBQzVDLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLE9BQU8sRUFBRSxDQUFDO2dCQUM5QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztnQkFDdkIsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5QixDQUFDO1FBQ0YsQ0FBQztRQUVRLDJCQUEyQixDQUFDLFFBQXNCO1lBQzFELE9BQU8sUUFBUSwrQ0FBNEIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ3JKLENBQUM7UUFFTyxTQUFTO1lBQ2hCLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsT0FBTyxDQUFDO1FBQy9FLENBQUM7S0FFRDtJQXZDRCw0RUF1Q0M7SUFFRCxJQUFBLDhCQUFpQixFQUFDLDZDQUE4QixFQUFFLGdDQUFnQyxvQ0FBNEIsQ0FBQyJ9