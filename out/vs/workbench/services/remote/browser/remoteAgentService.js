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
define(["require", "exports", "vs/nls", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/remote/common/abstractRemoteAgentService", "vs/platform/product/common/productService", "vs/platform/sign/common/sign", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/workbench/common/contributions", "vs/workbench/services/host/browser/host", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/remote/common/remoteSocketFactoryService"], function (require, exports, nls, environmentService_1, remoteAgentService_1, remoteAuthorityResolver_1, abstractRemoteAgentService_1, productService_1, sign_1, log_1, notification_1, dialogs_1, contributions_1, host_1, userDataProfile_1, remoteSocketFactoryService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAgentService = void 0;
    let RemoteAgentService = class RemoteAgentService extends abstractRemoteAgentService_1.AbstractRemoteAgentService {
        constructor(remoteSocketFactoryService, userDataProfileService, environmentService, productService, remoteAuthorityResolverService, signService, logService) {
            super(remoteSocketFactoryService, userDataProfileService, environmentService, productService, remoteAuthorityResolverService, signService, logService);
        }
    };
    exports.RemoteAgentService = RemoteAgentService;
    exports.RemoteAgentService = RemoteAgentService = __decorate([
        __param(0, remoteSocketFactoryService_1.IRemoteSocketFactoryService),
        __param(1, userDataProfile_1.IUserDataProfileService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, productService_1.IProductService),
        __param(4, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(5, sign_1.ISignService),
        __param(6, log_1.ILogService)
    ], RemoteAgentService);
    let RemoteConnectionFailureNotificationContribution = class RemoteConnectionFailureNotificationContribution {
        static { this.ID = 'workbench.contrib.browserRemoteConnectionFailureNotification'; }
        constructor(remoteAgentService, _dialogService, _hostService) {
            this._dialogService = _dialogService;
            this._hostService = _hostService;
            // Let's cover the case where connecting to fetch the remote extension info fails
            remoteAgentService.getRawEnvironment()
                .then(undefined, (err) => {
                if (!remoteAuthorityResolver_1.RemoteAuthorityResolverError.isHandled(err)) {
                    this._presentConnectionError(err);
                }
            });
        }
        async _presentConnectionError(err) {
            await this._dialogService.prompt({
                type: notification_1.Severity.Error,
                message: nls.localize('connectionError', "An unexpected error occurred that requires a reload of this page."),
                detail: nls.localize('connectionErrorDetail', "The workbench failed to connect to the server (Error: {0})", err ? err.message : ''),
                buttons: [
                    {
                        label: nls.localize({ key: 'reload', comment: ['&& denotes a mnemonic'] }, "&&Reload"),
                        run: () => this._hostService.reload()
                    }
                ]
            });
        }
    };
    RemoteConnectionFailureNotificationContribution = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, dialogs_1.IDialogService),
        __param(2, host_1.IHostService)
    ], RemoteConnectionFailureNotificationContribution);
    (0, contributions_1.registerWorkbenchContribution2)(RemoteConnectionFailureNotificationContribution.ID, RemoteConnectionFailureNotificationContribution, 2 /* WorkbenchPhase.BlockRestore */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQWdlbnRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvcmVtb3RlL2Jyb3dzZXIvcmVtb3RlQWdlbnRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlCekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSx1REFBMEI7UUFFakUsWUFDOEIsMEJBQXVELEVBQzNELHNCQUErQyxFQUMxQyxrQkFBZ0QsRUFDN0QsY0FBK0IsRUFDZiw4QkFBK0QsRUFDbEYsV0FBeUIsRUFDMUIsVUFBdUI7WUFFcEMsS0FBSyxDQUFDLDBCQUEwQixFQUFFLHNCQUFzQixFQUFFLGtCQUFrQixFQUFFLGNBQWMsRUFBRSw4QkFBOEIsRUFBRSxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDeEosQ0FBQztLQUNELENBQUE7SUFiWSxnREFBa0I7aUNBQWxCLGtCQUFrQjtRQUc1QixXQUFBLHdEQUEyQixDQUFBO1FBQzNCLFdBQUEseUNBQXVCLENBQUE7UUFDdkIsV0FBQSxpREFBNEIsQ0FBQTtRQUM1QixXQUFBLGdDQUFlLENBQUE7UUFDZixXQUFBLHlEQUErQixDQUFBO1FBQy9CLFdBQUEsbUJBQVksQ0FBQTtRQUNaLFdBQUEsaUJBQVcsQ0FBQTtPQVRELGtCQUFrQixDQWE5QjtJQUVELElBQU0sK0NBQStDLEdBQXJELE1BQU0sK0NBQStDO2lCQUVwQyxPQUFFLEdBQUcsOERBQThELEFBQWpFLENBQWtFO1FBRXBGLFlBQ3NCLGtCQUF1QyxFQUMzQixjQUE4QixFQUNoQyxZQUEwQjtZQUR4QixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDaEMsaUJBQVksR0FBWixZQUFZLENBQWM7WUFFekQsaUZBQWlGO1lBQ2pGLGtCQUFrQixDQUFDLGlCQUFpQixFQUFFO2lCQUNwQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ3hCLElBQUksQ0FBQyxzREFBNEIsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDbEQsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sS0FBSyxDQUFDLHVCQUF1QixDQUFDLEdBQVE7WUFDN0MsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQztnQkFDaEMsSUFBSSxFQUFFLHVCQUFRLENBQUMsS0FBSztnQkFDcEIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsbUVBQW1FLENBQUM7Z0JBQzdHLE1BQU0sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHVCQUF1QixFQUFFLDREQUE0RCxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNuSSxPQUFPLEVBQUU7b0JBQ1I7d0JBQ0MsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUM7d0JBQ3RGLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRTtxQkFDckM7aUJBQ0Q7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDOztJQTlCSSwrQ0FBK0M7UUFLbEQsV0FBQSx3Q0FBbUIsQ0FBQTtRQUNuQixXQUFBLHdCQUFjLENBQUE7UUFDZCxXQUFBLG1CQUFZLENBQUE7T0FQVCwrQ0FBK0MsQ0FnQ3BEO0lBRUQsSUFBQSw4Q0FBOEIsRUFBQywrQ0FBK0MsQ0FBQyxFQUFFLEVBQUUsK0NBQStDLHNDQUE4QixDQUFDIn0=