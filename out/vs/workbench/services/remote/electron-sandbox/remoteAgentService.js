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
define(["require", "exports", "vs/nls", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/product/common/productService", "vs/workbench/services/remote/common/abstractRemoteAgentService", "vs/platform/sign/common/sign", "vs/platform/log/common/log", "vs/workbench/services/environment/common/environmentService", "vs/platform/notification/common/notification", "vs/workbench/common/contributions", "vs/platform/telemetry/common/telemetry", "vs/platform/native/common/native", "vs/base/common/uri", "vs/platform/opener/common/opener", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/remote/common/remoteSocketFactoryService"], function (require, exports, nls, remoteAgentService_1, remoteAuthorityResolver_1, productService_1, abstractRemoteAgentService_1, sign_1, log_1, environmentService_1, notification_1, contributions_1, telemetry_1, native_1, uri_1, opener_1, userDataProfile_1, remoteSocketFactoryService_1) {
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
        static { this.ID = 'workbench.contrib.nativeRemoteConnectionFailureNotification'; }
        constructor(_remoteAgentService, notificationService, environmentService, telemetryService, nativeHostService, _remoteAuthorityResolverService, openerService) {
            this._remoteAgentService = _remoteAgentService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            // Let's cover the case where connecting to fetch the remote extension info fails
            this._remoteAgentService.getRawEnvironment()
                .then(undefined, err => {
                if (!remoteAuthorityResolver_1.RemoteAuthorityResolverError.isHandled(err)) {
                    const choices = [
                        {
                            label: nls.localize('devTools', "Open Developer Tools"),
                            run: () => nativeHostService.openDevTools()
                        }
                    ];
                    const troubleshootingURL = this._getTroubleshootingURL();
                    if (troubleshootingURL) {
                        choices.push({
                            label: nls.localize('directUrl', "Open in browser"),
                            run: () => openerService.open(troubleshootingURL, { openExternal: true })
                        });
                    }
                    notificationService.prompt(notification_1.Severity.Error, nls.localize('connectionError', "Failed to connect to the remote extension host server (Error: {0})", err ? err.message : ''), choices);
                }
            });
        }
        _getTroubleshootingURL() {
            const remoteAgentConnection = this._remoteAgentService.getConnection();
            if (!remoteAgentConnection) {
                return null;
            }
            const connectionData = this._remoteAuthorityResolverService.getConnectionData(remoteAgentConnection.remoteAuthority);
            if (!connectionData || connectionData.connectTo.type !== 0 /* RemoteConnectionType.WebSocket */) {
                return null;
            }
            return uri_1.URI.from({
                scheme: 'http',
                authority: `${connectionData.connectTo.host}:${connectionData.connectTo.port}`,
                path: `/version`
            });
        }
    };
    RemoteConnectionFailureNotificationContribution = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, notification_1.INotificationService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, native_1.INativeHostService),
        __param(5, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(6, opener_1.IOpenerService)
    ], RemoteConnectionFailureNotificationContribution);
    (0, contributions_1.registerWorkbenchContribution2)(RemoteConnectionFailureNotificationContribution.ID, RemoteConnectionFailureNotificationContribution, 2 /* WorkbenchPhase.BlockRestore */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQWdlbnRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvcmVtb3RlL2VsZWN0cm9uLXNhbmRib3gvcmVtb3RlQWdlbnRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSx1REFBMEI7UUFDakUsWUFDOEIsMEJBQXVELEVBQzNELHNCQUErQyxFQUMxQyxrQkFBZ0QsRUFDN0QsY0FBK0IsRUFDZiw4QkFBK0QsRUFDbEYsV0FBeUIsRUFDMUIsVUFBdUI7WUFFcEMsS0FBSyxDQUFDLDBCQUEwQixFQUFFLHNCQUFzQixFQUFFLGtCQUFrQixFQUFFLGNBQWMsRUFBRSw4QkFBOEIsRUFBRSxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDeEosQ0FBQztLQUNELENBQUE7SUFaWSxnREFBa0I7aUNBQWxCLGtCQUFrQjtRQUU1QixXQUFBLHdEQUEyQixDQUFBO1FBQzNCLFdBQUEseUNBQXVCLENBQUE7UUFDdkIsV0FBQSxpREFBNEIsQ0FBQTtRQUM1QixXQUFBLGdDQUFlLENBQUE7UUFDZixXQUFBLHlEQUErQixDQUFBO1FBQy9CLFdBQUEsbUJBQVksQ0FBQTtRQUNaLFdBQUEsaUJBQVcsQ0FBQTtPQVJELGtCQUFrQixDQVk5QjtJQUVELElBQU0sK0NBQStDLEdBQXJELE1BQU0sK0NBQStDO2lCQUVwQyxPQUFFLEdBQUcsNkRBQTZELEFBQWhFLENBQWlFO1FBRW5GLFlBQ3VDLG1CQUF3QyxFQUN4RCxtQkFBeUMsRUFDakMsa0JBQWdELEVBQzNELGdCQUFtQyxFQUNsQyxpQkFBcUMsRUFDUCwrQkFBZ0UsRUFDbEcsYUFBNkI7WUFOUCx3QkFBbUIsR0FBbkIsbUJBQW1C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