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
define(["require", "exports", "vs/platform/workspace/common/workspace", "vs/workbench/services/configuration/common/jsonEditing", "vs/platform/workspaces/common/workspaces", "vs/platform/commands/common/commands", "vs/platform/notification/common/notification", "vs/platform/files/common/files", "vs/workbench/services/environment/common/environmentService", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/host/browser/host", "vs/workbench/services/workspaces/browser/abstractWorkspaceEditingService", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/platform/instantiation/common/extensions", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/configuration/common/configuration", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, workspace_1, jsonEditing_1, workspaces_1, commands_1, notification_1, files_1, environmentService_1, dialogs_1, textfiles_1, host_1, abstractWorkspaceEditingService_1, workspaceEditing_1, extensions_1, uriIdentity_1, workspaceTrust_1, configuration_1, userDataProfile_1, userDataProfile_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserWorkspaceEditingService = void 0;
    let BrowserWorkspaceEditingService = class BrowserWorkspaceEditingService extends abstractWorkspaceEditingService_1.AbstractWorkspaceEditingService {
        constructor(jsonEditingService, contextService, configurationService, notificationService, commandService, fileService, textFileService, workspacesService, environmentService, fileDialogService, dialogService, hostService, uriIdentityService, workspaceTrustManagementService, userDataProfilesService, userDataProfileService) {
            super(jsonEditingService, contextService, configurationService, notificationService, commandService, fileService, textFileService, workspacesService, environmentService, fileDialogService, dialogService, hostService, uriIdentityService, workspaceTrustManagementService, userDataProfilesService, userDataProfileService);
        }
        async enterWorkspace(workspaceUri) {
            const result = await this.doEnterWorkspace(workspaceUri);
            if (result) {
                // Open workspace in same window
                await this.hostService.openWindow([{ workspaceUri }], { forceReuseWindow: true });
            }
        }
    };
    exports.BrowserWorkspaceEditingService = BrowserWorkspaceEditingService;
    exports.BrowserWorkspaceEditingService = BrowserWorkspaceEditingService = __decorate([
        __param(0, jsonEditing_1.IJSONEditingService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, configuration_1.IWorkbenchConfigurationService),
        __param(3, notification_1.INotificationService),
        __param(4, commands_1.ICommandService),
        __param(5, files_1.IFileService),
        __param(6, textfiles_1.ITextFileService),
        __param(7, workspaces_1.IWorkspacesService),
        __param(8, environmentService_1.IWorkbenchEnvironmentService),
        __param(9, dialogs_1.IFileDialogService),
        __param(10, dialogs_1.IDialogService),
        __param(11, host_1.IHostService),
        __param(12, uriIdentity_1.IUriIdentityService),
        __param(13, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(14, userDataProfile_1.IUserDataProfilesService),
        __param(15, userDataProfile_2.IUserDataProfileService)
    ], BrowserWorkspaceEditingService);
    (0, extensions_1.registerSingleton)(workspaceEditing_1.IWorkspaceEditingService, BrowserWorkspaceEditingService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlRWRpdGluZ1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy93b3Jrc3BhY2VzL2Jyb3dzZXIvd29ya3NwYWNlRWRpdGluZ1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBdUJ6RixJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUErQixTQUFRLGlFQUErQjtRQUVsRixZQUNzQixrQkFBdUMsRUFDbEMsY0FBZ0MsRUFDMUIsb0JBQW9ELEVBQzlELG1CQUF5QyxFQUM5QyxjQUErQixFQUNsQyxXQUF5QixFQUNyQixlQUFpQyxFQUMvQixpQkFBcUMsRUFDM0Isa0JBQWdELEVBQzFELGlCQUFxQyxFQUN6QyxhQUE2QixFQUMvQixXQUF5QixFQUNsQixrQkFBdUMsRUFDMUIsK0JBQWlFLEVBQ3pFLHVCQUFpRCxFQUNsRCxzQkFBK0M7WUFFeEUsS0FBSyxDQUFDLGtCQUFrQixFQUFFLGNBQWMsRUFBRSxvQkFBb0IsRUFBRSxtQkFBbUIsRUFBRSxjQUFjLEVBQUUsV0FBVyxFQUFFLGVBQWUsRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFFLCtCQUErQixFQUFFLHVCQUF1QixFQUFFLHNCQUFzQixDQUFDLENBQUM7UUFDaFUsQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjLENBQUMsWUFBaUI7WUFDckMsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDekQsSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFFWixnQ0FBZ0M7Z0JBQ2hDLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLFlBQVksRUFBRSxDQUFDLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ25GLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQS9CWSx3RUFBOEI7NkNBQTlCLDhCQUE4QjtRQUd4QyxXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSw4Q0FBOEIsQ0FBQTtRQUM5QixXQUFBLG1DQUFvQixDQUFBO1FBQ3BCLFdBQUEsMEJBQWUsQ0FBQTtRQUNmLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsNEJBQWdCLENBQUE7UUFDaEIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLGlEQUE0QixDQUFBO1FBQzVCLFdBQUEsNEJBQWtCLENBQUE7UUFDbEIsWUFBQSx3QkFBYyxDQUFBO1FBQ2QsWUFBQSxtQkFBWSxDQUFBO1FBQ1osWUFBQSxpQ0FBbUIsQ0FBQTtRQUNuQixZQUFBLGlEQUFnQyxDQUFBO1FBQ2hDLFlBQUEsMENBQXdCLENBQUE7UUFDeEIsWUFBQSx5Q0FBdUIsQ0FBQTtPQWxCYiw4QkFBOEIsQ0ErQjFDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQywyQ0FBd0IsRUFBRSw4QkFBOEIsb0NBQTRCLENBQUMifQ==