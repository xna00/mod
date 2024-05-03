/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/nls", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/platform/action/common/actionCommonCategories"], function (require, exports, instantiation_1, contextkey_1, nls_1, codicons_1, iconRegistry_1, actionCommonCategories_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DOWNLOAD_ACTIVITY_ACTION_DESCRIPTOR = exports.SYNC_CONFLICTS_VIEW_ID = exports.SYNC_VIEW_CONTAINER_ID = exports.SHOW_SYNC_LOG_COMMAND_ID = exports.CONFIGURE_SYNC_COMMAND_ID = exports.CONTEXT_HAS_CONFLICTS = exports.CONTEXT_ENABLE_SYNC_CONFLICTS_VIEW = exports.CONTEXT_ENABLE_ACTIVITY_VIEWS = exports.CONTEXT_ACCOUNT_STATE = exports.CONTEXT_SYNC_ENABLEMENT = exports.CONTEXT_SYNC_STATE = exports.SYNC_VIEW_ICON = exports.SYNC_TITLE = exports.AccountStatus = exports.IUserDataSyncWorkbenchService = void 0;
    exports.getSyncAreaLabel = getSyncAreaLabel;
    exports.IUserDataSyncWorkbenchService = (0, instantiation_1.createDecorator)('IUserDataSyncWorkbenchService');
    function getSyncAreaLabel(source) {
        switch (source) {
            case "settings" /* SyncResource.Settings */: return (0, nls_1.localize)('settings', "Settings");
            case "keybindings" /* SyncResource.Keybindings */: return (0, nls_1.localize)('keybindings', "Keyboard Shortcuts");
            case "snippets" /* SyncResource.Snippets */: return (0, nls_1.localize)('snippets', "User Snippets");
            case "tasks" /* SyncResource.Tasks */: return (0, nls_1.localize)('tasks', "User Tasks");
            case "extensions" /* SyncResource.Extensions */: return (0, nls_1.localize)('extensions', "Extensions");
            case "globalState" /* SyncResource.GlobalState */: return (0, nls_1.localize)('ui state label', "UI State");
            case "profiles" /* SyncResource.Profiles */: return (0, nls_1.localize)('profiles', "Profiles");
            case "workspaceState" /* SyncResource.WorkspaceState */: return (0, nls_1.localize)('workspace state label', "Workspace State");
        }
    }
    var AccountStatus;
    (function (AccountStatus) {
        AccountStatus["Unavailable"] = "unavailable";
        AccountStatus["Available"] = "available";
    })(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
    exports.SYNC_TITLE = (0, nls_1.localize2)('sync category', "Settings Sync");
    exports.SYNC_VIEW_ICON = (0, iconRegistry_1.registerIcon)('settings-sync-view-icon', codicons_1.Codicon.sync, (0, nls_1.localize)('syncViewIcon', 'View icon of the Settings Sync view.'));
    // Contexts
    exports.CONTEXT_SYNC_STATE = new contextkey_1.RawContextKey('syncStatus', "uninitialized" /* SyncStatus.Uninitialized */);
    exports.CONTEXT_SYNC_ENABLEMENT = new contextkey_1.RawContextKey('syncEnabled', false);
    exports.CONTEXT_ACCOUNT_STATE = new contextkey_1.RawContextKey('userDataSyncAccountStatus', "unavailable" /* AccountStatus.Unavailable */);
    exports.CONTEXT_ENABLE_ACTIVITY_VIEWS = new contextkey_1.RawContextKey(`enableSyncActivityViews`, false);
    exports.CONTEXT_ENABLE_SYNC_CONFLICTS_VIEW = new contextkey_1.RawContextKey(`enableSyncConflictsView`, false);
    exports.CONTEXT_HAS_CONFLICTS = new contextkey_1.RawContextKey('hasConflicts', false);
    // Commands
    exports.CONFIGURE_SYNC_COMMAND_ID = 'workbench.userDataSync.actions.configure';
    exports.SHOW_SYNC_LOG_COMMAND_ID = 'workbench.userDataSync.actions.showLog';
    // VIEWS
    exports.SYNC_VIEW_CONTAINER_ID = 'workbench.view.sync';
    exports.SYNC_CONFLICTS_VIEW_ID = 'workbench.views.sync.conflicts';
    exports.DOWNLOAD_ACTIVITY_ACTION_DESCRIPTOR = {
        id: 'workbench.userDataSync.actions.downloadSyncActivity',
        title: (0, nls_1.localize2)('download sync activity title', "Download Settings Sync Activity"),
        category: actionCommonCategories_1.Categories.Developer,
        f1: true,
        precondition: contextkey_1.ContextKeyExpr.and(exports.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), exports.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */))
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdXNlckRhdGFTeW5jL2NvbW1vbi91c2VyRGF0YVN5bmMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0RoRyw0Q0FXQztJQXhDWSxRQUFBLDZCQUE2QixHQUFHLElBQUEsK0JBQWUsRUFBZ0MsK0JBQStCLENBQUMsQ0FBQztJQTZCN0gsU0FBZ0IsZ0JBQWdCLENBQUMsTUFBb0I7UUFDcEQsUUFBUSxNQUFNLEVBQUUsQ0FBQztZQUNoQiwyQ0FBMEIsQ0FBQyxDQUFDLE9BQU8sSUFBQSxjQUFRLEVBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3BFLGlEQUE2QixDQUFDLENBQUMsT0FBTyxJQUFBLGNBQVEsRUFBQyxhQUFhLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUNwRiwyQ0FBMEIsQ0FBQyxDQUFDLE9BQU8sSUFBQSxjQUFRLEVBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQ3pFLHFDQUF1QixDQUFDLENBQUMsT0FBTyxJQUFBLGNBQVEsRUFBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDaEUsK0NBQTRCLENBQUMsQ0FBQyxPQUFPLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztZQUMxRSxpREFBNkIsQ0FBQyxDQUFDLE9BQU8sSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDN0UsMkNBQTBCLENBQUMsQ0FBQyxPQUFPLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNwRSx1REFBZ0MsQ0FBQyxDQUFDLE9BQU8sSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUMvRixDQUFDO0lBQ0YsQ0FBQztJQUVELElBQWtCLGFBR2pCO0lBSEQsV0FBa0IsYUFBYTtRQUM5Qiw0Q0FBMkIsQ0FBQTtRQUMzQix3Q0FBdUIsQ0FBQTtJQUN4QixDQUFDLEVBSGlCLGFBQWEsNkJBQWIsYUFBYSxRQUc5QjtJQU1ZLFFBQUEsVUFBVSxHQUFxQixJQUFBLGVBQVMsRUFBQyxlQUFlLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFFM0UsUUFBQSxjQUFjLEdBQUcsSUFBQSwyQkFBWSxFQUFDLHlCQUF5QixFQUFFLGtCQUFPLENBQUMsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDLENBQUM7SUFFdEosV0FBVztJQUNFLFFBQUEsa0JBQWtCLEdBQUcsSUFBSSwwQkFBYSxDQUFTLFlBQVksaURBQTJCLENBQUM7SUFDdkYsUUFBQSx1QkFBdUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNFLFFBQUEscUJBQXFCLEdBQUcsSUFBSSwwQkFBYSxDQUFTLDJCQUEyQixnREFBNEIsQ0FBQztJQUMxRyxRQUFBLDZCQUE2QixHQUFHLElBQUksMEJBQWEsQ0FBVSx5QkFBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM3RixRQUFBLGtDQUFrQyxHQUFHLElBQUksMEJBQWEsQ0FBVSx5QkFBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNsRyxRQUFBLHFCQUFxQixHQUFHLElBQUksMEJBQWEsQ0FBVSxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFdkYsV0FBVztJQUNFLFFBQUEseUJBQXlCLEdBQUcsMENBQTBDLENBQUM7SUFDdkUsUUFBQSx3QkFBd0IsR0FBRyx3Q0FBd0MsQ0FBQztJQUVqRixRQUFRO0lBQ0ssUUFBQSxzQkFBc0IsR0FBRyxxQkFBcUIsQ0FBQztJQUMvQyxRQUFBLHNCQUFzQixHQUFHLGdDQUFnQyxDQUFDO0lBRTFELFFBQUEsbUNBQW1DLEdBQThCO1FBQzdFLEVBQUUsRUFBRSxxREFBcUQ7UUFDekQsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLDhCQUE4QixFQUFFLGlDQUFpQyxDQUFDO1FBQ25GLFFBQVEsRUFBRSxtQ0FBVSxDQUFDLFNBQVM7UUFDOUIsRUFBRSxFQUFFLElBQUk7UUFDUixZQUFZLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsNkJBQXFCLENBQUMsU0FBUywyQ0FBeUIsRUFBRSwwQkFBa0IsQ0FBQyxXQUFXLGdEQUEwQixDQUFDO0tBQ3BKLENBQUMifQ==