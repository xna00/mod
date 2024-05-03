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
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/ipc/electron-sandbox/services", "vs/platform/actions/common/actions", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/native/common/native", "vs/platform/notification/common/notification", "vs/workbench/services/userDataSync/common/userDataSync", "vs/base/common/network", "vs/base/parts/ipc/common/ipc", "vs/base/common/lifecycle"], function (require, exports, contributions_1, userDataSync_1, services_1, actions_1, nls_1, environment_1, files_1, native_1, notification_1, userDataSync_2, network_1, ipc_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UserDataSyncServicesContribution = class UserDataSyncServicesContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.userDataSyncServices'; }
        constructor(userDataSyncUtilService, sharedProcessService) {
            super();
            sharedProcessService.registerChannel('userDataSyncUtil', ipc_1.ProxyChannel.fromService(userDataSyncUtilService, this._store));
        }
    };
    UserDataSyncServicesContribution = __decorate([
        __param(0, userDataSync_1.IUserDataSyncUtilService),
        __param(1, services_1.ISharedProcessService)
    ], UserDataSyncServicesContribution);
    (0, contributions_1.registerWorkbenchContribution2)(UserDataSyncServicesContribution.ID, UserDataSyncServicesContribution, 1 /* WorkbenchPhase.BlockStartup */);
    (0, actions_1.registerAction2)(class OpenSyncBackupsFolder extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.userData.actions.openSyncBackupsFolder',
                title: (0, nls_1.localize2)('Open Backup folder', "Open Local Backups Folder"),
                category: userDataSync_2.SYNC_TITLE,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */),
                }
            });
        }
        async run(accessor) {
            const syncHome = accessor.get(environment_1.IEnvironmentService).userDataSyncHome;
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const fileService = accessor.get(files_1.IFileService);
            const notificationService = accessor.get(notification_1.INotificationService);
            if (await fileService.exists(syncHome)) {
                const folderStat = await fileService.resolve(syncHome);
                const item = folderStat.children && folderStat.children[0] ? folderStat.children[0].resource : syncHome;
                return nativeHostService.showItemInFolder(item.with({ scheme: network_1.Schemas.file }).fsPath);
            }
            else {
                notificationService.info((0, nls_1.localize)('no backups', "Local backups folder does not exist"));
            }
        }
    });
    (0, actions_1.registerAction2)(class DownloadSyncActivityAction extends actions_1.Action2 {
        constructor() {
            super(userDataSync_2.DOWNLOAD_ACTIVITY_ACTION_DESCRIPTOR);
        }
        async run(accessor) {
            const userDataSyncWorkbenchService = accessor.get(userDataSync_2.IUserDataSyncWorkbenchService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const hostService = accessor.get(native_1.INativeHostService);
            const folder = await userDataSyncWorkbenchService.downloadSyncActivity();
            if (folder) {
                notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('download sync activity complete', "Successfully downloaded Settings Sync activity."), [{
                        label: (0, nls_1.localize)('open', "Open Folder"),
                        run: () => hostService.showItemInFolder(folder.fsPath)
                    }]);
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdXNlckRhdGFTeW5jL2VsZWN0cm9uLXNhbmRib3gvdXNlckRhdGFTeW5jLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQWlCaEcsSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBaUMsU0FBUSxzQkFBVTtpQkFFeEMsT0FBRSxHQUFHLHdDQUF3QyxBQUEzQyxDQUE0QztRQUU5RCxZQUMyQix1QkFBaUQsRUFDcEQsb0JBQTJDO1lBRWxFLEtBQUssRUFBRSxDQUFDO1lBQ1Isb0JBQW9CLENBQUMsZUFBZSxDQUFDLGtCQUFrQixFQUFFLGtCQUFZLENBQUMsV0FBVyxDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzFILENBQUM7O0lBVkksZ0NBQWdDO1FBS25DLFdBQUEsdUNBQXdCLENBQUE7UUFDeEIsV0FBQSxnQ0FBcUIsQ0FBQTtPQU5sQixnQ0FBZ0MsQ0FXckM7SUFFRCxJQUFBLDhDQUE4QixFQUFDLGdDQUFnQyxDQUFDLEVBQUUsRUFBRSxnQ0FBZ0Msc0NBQThCLENBQUM7SUFFbkksSUFBQSx5QkFBZSxFQUFDLE1BQU0scUJBQXNCLFNBQVEsaUJBQU87UUFDMUQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGtEQUFrRDtnQkFDdEQsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLG9CQUFvQixFQUFFLDJCQUEyQixDQUFDO2dCQUNuRSxRQUFRLEVBQUUseUJBQVU7Z0JBQ3BCLElBQUksRUFBRTtvQkFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxjQUFjO29CQUN6QixJQUFJLEVBQUUsaUNBQWtCLENB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