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
define(["require", "exports", "vs/platform/backup/electron-main/backup", "vs/platform/windows/electron-main/windows", "vs/platform/workspaces/electron-main/workspacesHistoryMainService", "vs/platform/workspaces/electron-main/workspacesManagementMainService"], function (require, exports, backup_1, windows_1, workspacesHistoryMainService_1, workspacesManagementMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspacesMainService = void 0;
    let WorkspacesMainService = class WorkspacesMainService {
        constructor(workspacesManagementMainService, windowsMainService, workspacesHistoryMainService, backupMainService) {
            this.workspacesManagementMainService = workspacesManagementMainService;
            this.windowsMainService = windowsMainService;
            this.workspacesHistoryMainService = workspacesHistoryMainService;
            this.backupMainService = backupMainService;
            //#endregion
            //#region Workspaces History
            this.onDidChangeRecentlyOpened = this.workspacesHistoryMainService.onDidChangeRecentlyOpened;
        }
        //#region Workspace Management
        async enterWorkspace(windowId, path) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                return this.workspacesManagementMainService.enterWorkspace(window, this.windowsMainService.getWindows(), path);
            }
            return undefined;
        }
        createUntitledWorkspace(windowId, folders, remoteAuthority) {
            return this.workspacesManagementMainService.createUntitledWorkspace(folders, remoteAuthority);
        }
        deleteUntitledWorkspace(windowId, workspace) {
            return this.workspacesManagementMainService.deleteUntitledWorkspace(workspace);
        }
        getWorkspaceIdentifier(windowId, workspacePath) {
            return this.workspacesManagementMainService.getWorkspaceIdentifier(workspacePath);
        }
        getRecentlyOpened(windowId) {
            return this.workspacesHistoryMainService.getRecentlyOpened();
        }
        addRecentlyOpened(windowId, recents) {
            return this.workspacesHistoryMainService.addRecentlyOpened(recents);
        }
        removeRecentlyOpened(windowId, paths) {
            return this.workspacesHistoryMainService.removeRecentlyOpened(paths);
        }
        clearRecentlyOpened(windowId) {
            return this.workspacesHistoryMainService.clearRecentlyOpened();
        }
        //#endregion
        //#region Dirty Workspaces
        async getDirtyWorkspaces() {
            return this.backupMainService.getDirtyWorkspaces();
        }
    };
    exports.WorkspacesMainService = WorkspacesMainService;
    exports.WorkspacesMainService = WorkspacesMainService = __decorate([
        __param(0, workspacesManagementMainService_1.IWorkspacesManagementMainService),
        __param(1, windows_1.IWindowsMainService),
        __param(2, workspacesHistoryMainService_1.IWorkspacesHistoryMainService),
        __param(3, backup_1.IBackupMainService)
    ], WorkspacesMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlc01haW5TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93b3Jrc3BhY2VzL2VsZWN0cm9uLW1haW4vd29ya3NwYWNlc01haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVl6RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFxQjtRQUlqQyxZQUNtQywrQkFBa0YsRUFDL0Ysa0JBQXdELEVBQzlDLDRCQUE0RSxFQUN2RixpQkFBc0Q7WUFIdkIsb0NBQStCLEdBQS9CLCtCQUErQixDQUFrQztZQUM5RSx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzdCLGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBK0I7WUFDdEUsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQTJCM0UsWUFBWTtZQUVaLDRCQUE0QjtZQUVuQiw4QkFBeUIsR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMseUJBQXlCLENBQUM7UUE3QmpHLENBQUM7UUFFRCw4QkFBOEI7UUFFOUIsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFnQixFQUFFLElBQVM7WUFDL0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvRCxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLE9BQU8sSUFBSSxDQUFDLCtCQUErQixDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hILENBQUM7WUFFRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsdUJBQXVCLENBQUMsUUFBZ0IsRUFBRSxPQUF3QyxFQUFFLGVBQXdCO1lBQzNHLE9BQU8sSUFBSSxDQUFDLCtCQUErQixDQUFDLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxlQUFlLENBQUMsQ0FBQztRQUMvRixDQUFDO1FBRUQsdUJBQXVCLENBQUMsUUFBZ0IsRUFBRSxTQUErQjtZQUN4RSxPQUFPLElBQUksQ0FBQywrQkFBK0IsQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNoRixDQUFDO1FBRUQsc0JBQXNCLENBQUMsUUFBZ0IsRUFBRSxhQUFrQjtZQUMxRCxPQUFPLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxzQkFBc0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNuRixDQUFDO1FBUUQsaUJBQWlCLENBQUMsUUFBZ0I7WUFDakMsT0FBTyxJQUFJLENBQUMsNEJBQTRCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUM5RCxDQUFDO1FBRUQsaUJBQWlCLENBQUMsUUFBZ0IsRUFBRSxPQUFrQjtZQUNyRCxPQUFPLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyRSxDQUFDO1FBRUQsb0JBQW9CLENBQUMsUUFBZ0IsRUFBRSxLQUFZO1lBQ2xELE9BQU8sSUFBSSxDQUFDLDRCQUE0QixDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RFLENBQUM7UUFFRCxtQkFBbUIsQ0FBQyxRQUFnQjtZQUNuQyxPQUFPLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQ2hFLENBQUM7UUFFRCxZQUFZO1FBR1osMEJBQTBCO1FBRTFCLEtBQUssQ0FBQyxrQkFBa0I7WUFDdkIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUNwRCxDQUFDO0tBR0QsQ0FBQTtJQW5FWSxzREFBcUI7b0NBQXJCLHFCQUFxQjtRQUsvQixXQUFBLGtFQUFnQyxDQUFBO1FBQ2hDLFdBQUEsNkJBQW1CLENBQUE7UUFDbkIsV0FBQSw0REFBNkIsQ0FBQTtRQUM3QixXQUFBLDJCQUFrQixDQUFBO09BUlIscUJBQXFCLENBbUVqQyJ9