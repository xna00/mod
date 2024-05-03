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
define(["require", "exports", "vs/nls", "vs/workbench/services/workingCopy/common/workingCopyBackupService", "vs/base/common/uri", "vs/platform/instantiation/common/extensions", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/common/contributions", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/workingCopy/electron-sandbox/workingCopyBackupTracker"], function (require, exports, nls_1, workingCopyBackupService_1, uri_1, extensions_1, workingCopyBackup_1, files_1, log_1, environmentService_1, contributions_1, lifecycle_1, workingCopyBackupTracker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWorkingCopyBackupService = void 0;
    let NativeWorkingCopyBackupService = class NativeWorkingCopyBackupService extends workingCopyBackupService_1.WorkingCopyBackupService {
        constructor(environmentService, fileService, logService, lifecycleService) {
            super(environmentService.backupPath ? uri_1.URI.file(environmentService.backupPath).with({ scheme: environmentService.userRoamingDataHome.scheme }) : undefined, fileService, logService);
            this.lifecycleService = lifecycleService;
            this.registerListeners();
        }
        registerListeners() {
            // Lifecycle: ensure to prolong the shutdown for as long
            // as pending backup operations have not finished yet.
            // Otherwise, we risk writing partial backups to disk.
            this._register(this.lifecycleService.onWillShutdown(event => event.join(this.joinBackups(), { id: 'join.workingCopyBackups', label: (0, nls_1.localize)('join.workingCopyBackups', "Backup working copies") })));
        }
    };
    exports.NativeWorkingCopyBackupService = NativeWorkingCopyBackupService;
    exports.NativeWorkingCopyBackupService = NativeWorkingCopyBackupService = __decorate([
        __param(0, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, log_1.ILogService),
        __param(3, lifecycle_1.ILifecycleService)
    ], NativeWorkingCopyBackupService);
    // Register Service
    (0, extensions_1.registerSingleton)(workingCopyBackup_1.IWorkingCopyBackupService, NativeWorkingCopyBackupService, 0 /* InstantiationType.Eager */);
    // Register Backup Tracker
    (0, contributions_1.registerWorkbenchContribution2)(workingCopyBackupTracker_1.NativeWorkingCopyBackupTracker.ID, workingCopyBackupTracker_1.NativeWorkingCopyBackupTracker, 1 /* WorkbenchPhase.BlockStartup */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlCYWNrdXBTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvZWxlY3Ryb24tc2FuZGJveC93b3JraW5nQ29weUJhY2t1cFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY3pGLElBQU0sOEJBQThCLEdBQXBDLE1BQU0sOEJBQStCLFNBQVEsbURBQXdCO1FBRTNFLFlBQ3FDLGtCQUFzRCxFQUM1RSxXQUF5QixFQUMxQixVQUF1QixFQUNBLGdCQUFtQztZQUV2RSxLQUFLLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRmhKLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFJdkUsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQjtZQUV4Qix3REFBd0Q7WUFDeEQsc0RBQXNEO1lBQ3RELHNEQUFzRDtZQUN0RCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSx5QkFBeUIsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsdUJBQXVCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZNLENBQUM7S0FDRCxDQUFBO0lBcEJZLHdFQUE4Qjs2Q0FBOUIsOEJBQThCO1FBR3hDLFdBQUEsdURBQWtDLENBQUE7UUFDbEMsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSw2QkFBaUIsQ0FBQTtPQU5QLDhCQUE4QixDQW9CMUM7SUFFRCxtQkFBbUI7SUFDbkIsSUFBQSw4QkFBaUIsRUFBQyw2Q0FBeUIsRUFBRSw4QkFBOEIsa0NBQTBCLENBQUM7SUFFdEcsMEJBQTBCO0lBQzFCLElBQUEsOENBQThCLEVBQUMseURBQThCLENBQUMsRUFBRSxFQUFFLHlEQUE4QixzQ0FBOEIsQ0FBQyJ9