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
define(["require", "exports", "vs/workbench/services/extensions/common/extHostCustomers", "../common/extHost.protocol", "vs/platform/remote/common/remoteAuthorityResolver", "vs/base/common/lifecycle", "vs/workbench/services/environment/common/environmentService"], function (require, exports, extHostCustomers_1, extHost_protocol_1, remoteAuthorityResolver_1, lifecycle_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadRemoteConnectionData = void 0;
    let MainThreadRemoteConnectionData = class MainThreadRemoteConnectionData extends lifecycle_1.Disposable {
        constructor(extHostContext, _environmentService, remoteAuthorityResolverService) {
            super();
            this._environmentService = _environmentService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostExtensionService);
            const remoteAuthority = this._environmentService.remoteAuthority;
            if (remoteAuthority) {
                this._register(remoteAuthorityResolverService.onDidChangeConnectionData(() => {
                    const connectionData = remoteAuthorityResolverService.getConnectionData(remoteAuthority);
                    if (connectionData) {
                        this._proxy.$updateRemoteConnectionData(connectionData);
                    }
                }));
            }
        }
    };
    exports.MainThreadRemoteConnectionData = MainThreadRemoteConnectionData;
    exports.MainThreadRemoteConnectionData = MainThreadRemoteConnectionData = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, remoteAuthorityResolver_1.IRemoteAuthorityResolverService)
    ], MainThreadRemoteConnectionData);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFJlbW90ZUNvbm5lY3Rpb25EYXRhLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZFJlbW90ZUNvbm5lY3Rpb25EYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVN6RixJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUErQixTQUFRLHNCQUFVO1FBSTdELFlBQ0MsY0FBK0IsRUFDa0IsbUJBQWlELEVBQ2pFLDhCQUErRDtZQUVoRyxLQUFLLEVBQUUsQ0FBQztZQUh5Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQThCO1lBSWxHLElBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFFOUUsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGVBQWUsQ0FBQztZQUNqRSxJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsU0FBUyxDQUFDLDhCQUE4QixDQUFDLHlCQUF5QixDQUFDLEdBQUcsRUFBRTtvQkFDNUUsTUFBTSxjQUFjLEdBQUcsOEJBQThCLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQ3pGLElBQUksY0FBYyxFQUFFLENBQUM7d0JBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsMkJBQTJCLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBQ3pELENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQXRCWSx3RUFBOEI7NkNBQTlCLDhCQUE4QjtRQUQxQyxrQ0FBZTtRQU9iLFdBQUEsaURBQTRCLENBQUE7UUFDNUIsV0FBQSx5REFBK0IsQ0FBQTtPQVByQiw4QkFBOEIsQ0FzQjFDIn0=