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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/userDataProfile/electron-main/userDataProfile", "vs/platform/workspace/common/workspace", "vs/base/common/async", "vs/platform/windows/electron-main/windows"], function (require, exports, lifecycle_1, lifecycleMainService_1, userDataProfile_1, workspace_1, async_1, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfilesHandler = void 0;
    let UserDataProfilesHandler = class UserDataProfilesHandler extends lifecycle_1.Disposable {
        constructor(lifecycleMainService, userDataProfilesService, windowsMainService) {
            super();
            this.userDataProfilesService = userDataProfilesService;
            this.windowsMainService = windowsMainService;
            this._register(lifecycleMainService.onWillLoadWindow(e => {
                if (e.reason === 2 /* LoadReason.LOAD */) {
                    this.unsetProfileForWorkspace(e.window);
                }
            }));
            this._register(lifecycleMainService.onBeforeCloseWindow(window => this.unsetProfileForWorkspace(window)));
            this._register(new async_1.RunOnceScheduler(() => this.cleanUpEmptyWindowAssociations(), 30 * 1000 /* after 30s */)).schedule();
        }
        async unsetProfileForWorkspace(window) {
            const workspace = this.getWorkspace(window);
            const profile = this.userDataProfilesService.getProfileForWorkspace(workspace);
            if (profile?.isTransient) {
                this.userDataProfilesService.unsetWorkspace(workspace, profile.isTransient);
                if (profile.isTransient) {
                    await this.userDataProfilesService.cleanUpTransientProfiles();
                }
            }
        }
        getWorkspace(window) {
            return window.openedWorkspace ?? (0, workspace_1.toWorkspaceIdentifier)(window.backupPath, window.isExtensionDevelopmentHost);
        }
        cleanUpEmptyWindowAssociations() {
            const associatedEmptyWindows = this.userDataProfilesService.getAssociatedEmptyWindows();
            if (associatedEmptyWindows.length === 0) {
                return;
            }
            const openedWorkspaces = this.windowsMainService.getWindows().map(window => this.getWorkspace(window));
            for (const associatedEmptyWindow of associatedEmptyWindows) {
                if (openedWorkspaces.some(openedWorkspace => openedWorkspace.id === associatedEmptyWindow.id)) {
                    continue;
                }
                this.userDataProfilesService.unsetWorkspace(associatedEmptyWindow, false);
            }
        }
    };
    exports.UserDataProfilesHandler = UserDataProfilesHandler;
    exports.UserDataProfilesHandler = UserDataProfilesHandler = __decorate([
        __param(0, lifecycleMainService_1.ILifecycleMainService),
        __param(1, userDataProfile_1.IUserDataProfilesMainService),
        __param(2, windows_1.IWindowsMainService)
    ], UserDataProfilesHandler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlc0hhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhUHJvZmlsZS9lbGVjdHJvbi1tYWluL3VzZXJEYXRhUHJvZmlsZXNIYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVV6RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHNCQUFVO1FBRXRELFlBQ3dCLG9CQUEyQyxFQUNuQix1QkFBcUQsRUFDOUQsa0JBQXVDO1lBRTdFLEtBQUssRUFBRSxDQUFDO1lBSHVDLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBOEI7WUFDOUQsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUc3RSxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN4RCxJQUFJLENBQUMsQ0FBQyxNQUFNLDRCQUFvQixFQUFFLENBQUM7b0JBQ2xDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3pDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyw4QkFBOEIsRUFBRSxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN6SCxDQUFDO1FBRU8sS0FBSyxDQUFDLHdCQUF3QixDQUFDLE1BQW1CO1lBQ3pELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQy9FLElBQUksT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsdUJBQXVCLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQzVFLElBQUksT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUN6QixNQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO2dCQUMvRCxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyxZQUFZLENBQUMsTUFBbUI7WUFDdkMsT0FBTyxNQUFNLENBQUMsZUFBZSxJQUFJLElBQUEsaUNBQXFCLEVBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUM5RyxDQUFDO1FBRU8sOEJBQThCO1lBQ3JDLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLHlCQUF5QixFQUFFLENBQUM7WUFDeEYsSUFBSSxzQkFBc0IsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3pDLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVSxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3ZHLEtBQUssTUFBTSxxQkFBcUIsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO2dCQUM1RCxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxFQUFFLEtBQUsscUJBQXFCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQkFDL0YsU0FBUztnQkFDVixDQUFDO2dCQUNELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxjQUFjLENBQUMscUJBQXFCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDM0UsQ0FBQztRQUNGLENBQUM7S0FFRCxDQUFBO0lBOUNZLDBEQUF1QjtzQ0FBdkIsdUJBQXVCO1FBR2pDLFdBQUEsNENBQXFCLENBQUE7UUFDckIsV0FBQSw4Q0FBNEIsQ0FBQTtRQUM1QixXQUFBLDZCQUFtQixDQUFBO09BTFQsdUJBQXVCLENBOENuQyJ9