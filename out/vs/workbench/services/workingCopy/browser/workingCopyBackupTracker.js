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
define(["require", "exports", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/workbench/services/workingCopy/common/workingCopyBackupTracker", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService"], function (require, exports, workingCopyBackup_1, filesConfigurationService_1, workingCopyService_1, lifecycle_1, log_1, workingCopyBackupTracker_1, workingCopyEditorService_1, editorService_1, editorGroupsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserWorkingCopyBackupTracker = void 0;
    let BrowserWorkingCopyBackupTracker = class BrowserWorkingCopyBackupTracker extends workingCopyBackupTracker_1.WorkingCopyBackupTracker {
        static { this.ID = 'workbench.contrib.browserWorkingCopyBackupTracker'; }
        constructor(workingCopyBackupService, filesConfigurationService, workingCopyService, lifecycleService, logService, workingCopyEditorService, editorService, editorGroupService) {
            super(workingCopyBackupService, workingCopyService, logService, lifecycleService, filesConfigurationService, workingCopyEditorService, editorService, editorGroupService);
        }
        onFinalBeforeShutdown(reason) {
            // Web: we cannot perform long running in the shutdown phase
            // As such we need to check sync if there are any modified working
            // copies that have not been backed up yet and then prevent the
            // shutdown if that is the case.
            const modifiedWorkingCopies = this.workingCopyService.modifiedWorkingCopies;
            if (!modifiedWorkingCopies.length) {
                return false; // nothing modified: no veto
            }
            if (!this.filesConfigurationService.isHotExitEnabled) {
                return true; // modified without backup: veto
            }
            for (const modifiedWorkingCopy of modifiedWorkingCopies) {
                if (!this.workingCopyBackupService.hasBackupSync(modifiedWorkingCopy, this.getContentVersion(modifiedWorkingCopy))) {
                    this.logService.warn('Unload veto: pending backups');
                    return true; // modified without backup: veto
                }
            }
            return false; // modified and backed up: no veto
        }
    };
    exports.BrowserWorkingCopyBackupTracker = BrowserWorkingCopyBackupTracker;
    exports.BrowserWorkingCopyBackupTracker = BrowserWorkingCopyBackupTracker = __decorate([
        __param(0, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(1, filesConfigurationService_1.IFilesConfigurationService),
        __param(2, workingCopyService_1.IWorkingCopyService),
        __param(3, lifecycle_1.ILifecycleService),
        __param(4, log_1.ILogService),
        __param(5, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(6, editorService_1.IEditorService),
        __param(7, editorGroupsService_1.IEditorGroupsService)
    ], BrowserWorkingCopyBackupTracker);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlCYWNrdXBUcmFja2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvYnJvd3Nlci93b3JraW5nQ29weUJhY2t1cFRyYWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0sK0JBQStCLEdBQXJDLE1BQU0sK0JBQWdDLFNBQVEsbURBQXdCO2lCQUU1RCxPQUFFLEdBQUcsbURBQW1ELEFBQXRELENBQXVEO1FBRXpFLFlBQzRCLHdCQUFtRCxFQUNsRCx5QkFBcUQsRUFDNUQsa0JBQXVDLEVBQ3pDLGdCQUFtQyxFQUN6QyxVQUF1QixFQUNULHdCQUFtRCxFQUM5RCxhQUE2QixFQUN2QixrQkFBd0M7WUFFOUQsS0FBSyxDQUFDLHdCQUF3QixFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSx5QkFBeUIsRUFBRSx3QkFBd0IsRUFBRSxhQUFhLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUMzSyxDQUFDO1FBRVMscUJBQXFCLENBQUMsTUFBc0I7WUFFckQsNERBQTREO1lBQzVELGtFQUFrRTtZQUNsRSwrREFBK0Q7WUFDL0QsZ0NBQWdDO1lBRWhDLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLHFCQUFxQixDQUFDO1lBQzVFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDbkMsT0FBTyxLQUFLLENBQUMsQ0FBQyw0QkFBNEI7WUFDM0MsQ0FBQztZQUVELElBQUksQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDdEQsT0FBTyxJQUFJLENBQUMsQ0FBQyxnQ0FBZ0M7WUFDOUMsQ0FBQztZQUVELEtBQUssTUFBTSxtQkFBbUIsSUFBSSxxQkFBcUIsRUFBRSxDQUFDO2dCQUN6RCxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3BILElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUM7b0JBRXJELE9BQU8sSUFBSSxDQUFDLENBQUMsZ0NBQWdDO2dCQUM5QyxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDLENBQUMsa0NBQWtDO1FBQ2pELENBQUM7O0lBMUNXLDBFQUErQjs4Q0FBL0IsK0JBQStCO1FBS3pDLFdBQUEsNkNBQXlCLENBQUE7UUFDekIsV0FBQSxzREFBMEIsQ0FBQTtRQUMxQixXQUFBLHdDQUFtQixDQUFBO1FBQ25CLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSxvREFBeUIsQ0FBQTtRQUN6QixXQUFBLDhCQUFjLENBQUE7UUFDZCxXQUFBLDBDQUFvQixDQUFBO09BWlYsK0JBQStCLENBMkMzQyJ9