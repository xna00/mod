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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/host/browser/host"], function (require, exports, nls_1, lifecycle_1, workspaceTrust_1, environmentService_1, extensionManagement_1, extensions_1, host_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionEnablementWorkspaceTrustTransitionParticipant = void 0;
    let ExtensionEnablementWorkspaceTrustTransitionParticipant = class ExtensionEnablementWorkspaceTrustTransitionParticipant extends lifecycle_1.Disposable {
        constructor(extensionService, hostService, environmentService, extensionEnablementService, workspaceTrustEnablementService, workspaceTrustManagementService) {
            super();
            if (workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                // The extension enablement participant will be registered only after the
                // workspace trust state has been initialized. There is no need to execute
                // the participant as part of the initialization process, as the workspace
                // trust state is initialized before starting the extension host.
                workspaceTrustManagementService.workspaceTrustInitialized.then(() => {
                    const workspaceTrustTransitionParticipant = new class {
                        async participate(trusted) {
                            if (trusted) {
                                // Untrusted -> Trusted
                                await extensionEnablementService.updateExtensionsEnablementsWhenWorkspaceTrustChanges();
                            }
                            else {
                                // Trusted -> Untrusted
                                if (environmentService.remoteAuthority) {
                                    hostService.reload();
                                }
                                else {
                                    const stopped = await extensionService.stopExtensionHosts((0, nls_1.localize)('restartExtensionHost.reason', "Restarting extension host due to workspace trust change."));
                                    await extensionEnablementService.updateExtensionsEnablementsWhenWorkspaceTrustChanges();
                                    if (stopped) {
                                        extensionService.startExtensionHosts();
                                    }
                                }
                            }
                        }
                    };
                    // Execute BEFORE the workspace trust transition completes
                    this._register(workspaceTrustManagementService.addWorkspaceTrustTransitionParticipant(workspaceTrustTransitionParticipant));
                });
            }
        }
    };
    exports.ExtensionEnablementWorkspaceTrustTransitionParticipant = ExtensionEnablementWorkspaceTrustTransitionParticipant;
    exports.ExtensionEnablementWorkspaceTrustTransitionParticipant = ExtensionEnablementWorkspaceTrustTransitionParticipant = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, host_1.IHostService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(4, workspaceTrust_1.IWorkspaceTrustEnablementService),
        __param(5, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], ExtensionEnablementWorkspaceTrustTransitionParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRW5hYmxlbWVudFdvcmtzcGFjZVRydXN0VHJhbnNpdGlvblBhcnRpY2lwYW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvZXh0ZW5zaW9uRW5hYmxlbWVudFdvcmtzcGFjZVRydXN0VHJhbnNpdGlvblBhcnRpY2lwYW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVd6RixJQUFNLHNEQUFzRCxHQUE1RCxNQUFNLHNEQUF1RCxTQUFRLHNCQUFVO1FBQ3JGLFlBQ29CLGdCQUFtQyxFQUN4QyxXQUF5QixFQUNULGtCQUFnRCxFQUN4QywwQkFBZ0UsRUFDcEUsK0JBQWlFLEVBQ2pFLCtCQUFpRTtZQUVuRyxLQUFLLEVBQUUsQ0FBQztZQUVSLElBQUksK0JBQStCLENBQUMsdUJBQXVCLEVBQUUsRUFBRSxDQUFDO2dCQUMvRCx5RUFBeUU7Z0JBQ3pFLDBFQUEwRTtnQkFDMUUsMEVBQTBFO2dCQUMxRSxpRUFBaUU7Z0JBQ2pFLCtCQUErQixDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7b0JBQ25FLE1BQU0sbUNBQW1DLEdBQUcsSUFBSTt3QkFDL0MsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFnQjs0QkFDakMsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQ0FDYix1QkFBdUI7Z0NBQ3ZCLE1BQU0sMEJBQTBCLENBQUMsb0RBQW9ELEVBQUUsQ0FBQzs0QkFDekYsQ0FBQztpQ0FBTSxDQUFDO2dDQUNQLHVCQUF1QjtnQ0FDdkIsSUFBSSxrQkFBa0IsQ0FBQyxlQUFlLEVBQUUsQ0FBQztvQ0FDeEMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dDQUN0QixDQUFDO3FDQUFNLENBQUM7b0NBQ1AsTUFBTSxPQUFPLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSwwREFBMEQsQ0FBQyxDQUFDLENBQUM7b0NBQy9KLE1BQU0sMEJBQTBCLENBQUMsb0RBQW9ELEVBQUUsQ0FBQztvQ0FDeEYsSUFBSSxPQUFPLEVBQUUsQ0FBQzt3Q0FDYixnQkFBZ0IsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO29DQUN4QyxDQUFDO2dDQUNGLENBQUM7NEJBQ0YsQ0FBQzt3QkFDRixDQUFDO3FCQUNELENBQUM7b0JBRUYsMERBQTBEO29CQUMxRCxJQUFJLENBQUMsU0FBUyxDQUFDLCtCQUErQixDQUFDLHNDQUFzQyxDQUFDLG1DQUFtQyxDQUFDLENBQUMsQ0FBQztnQkFDN0gsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUExQ1ksd0hBQXNEO3FFQUF0RCxzREFBc0Q7UUFFaEUsV0FBQSw4QkFBaUIsQ0FBQTtRQUNqQixXQUFBLG1CQUFZLENBQUE7UUFDWixXQUFBLGlEQUE0QixDQUFBO1FBQzVCLFdBQUEsMERBQW9DLENBQUE7UUFDcEMsV0FBQSxpREFBZ0MsQ0FBQTtRQUNoQyxXQUFBLGlEQUFnQyxDQUFBO09BUHRCLHNEQUFzRCxDQTBDbEUifQ==