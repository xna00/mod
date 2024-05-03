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
define(["require", "exports", "vs/platform/files/common/files", "vs/workbench/services/environment/common/environmentService", "vs/platform/log/common/log", "vs/workbench/services/workingCopy/common/workingCopyBackupService", "vs/platform/instantiation/common/extensions", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/base/common/resources", "vs/platform/workspace/common/workspace", "vs/workbench/common/contributions", "vs/workbench/services/workingCopy/browser/workingCopyBackupTracker"], function (require, exports, files_1, environmentService_1, log_1, workingCopyBackupService_1, extensions_1, workingCopyBackup_1, resources_1, workspace_1, contributions_1, workingCopyBackupTracker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserWorkingCopyBackupService = void 0;
    let BrowserWorkingCopyBackupService = class BrowserWorkingCopyBackupService extends workingCopyBackupService_1.WorkingCopyBackupService {
        constructor(contextService, environmentService, fileService, logService) {
            super((0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'Backups', contextService.getWorkspace().id), fileService, logService);
        }
    };
    exports.BrowserWorkingCopyBackupService = BrowserWorkingCopyBackupService;
    exports.BrowserWorkingCopyBackupService = BrowserWorkingCopyBackupService = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, files_1.IFileService),
        __param(3, log_1.ILogService)
    ], BrowserWorkingCopyBackupService);
    // Register Service
    (0, extensions_1.registerSingleton)(workingCopyBackup_1.IWorkingCopyBackupService, BrowserWorkingCopyBackupService, 0 /* InstantiationType.Eager */);
    // Register Backup Tracker
    (0, contributions_1.registerWorkbenchContribution2)(workingCopyBackupTracker_1.BrowserWorkingCopyBackupTracker.ID, workingCopyBackupTracker_1.BrowserWorkingCopyBackupTracker, 1 /* WorkbenchPhase.BlockStartup */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlCYWNrdXBTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvYnJvd3Nlci93b3JraW5nQ29weUJhY2t1cFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0sK0JBQStCLEdBQXJDLE1BQU0sK0JBQWdDLFNBQVEsbURBQXdCO1FBRTVFLFlBQzJCLGNBQXdDLEVBQ3BDLGtCQUFnRCxFQUNoRSxXQUF5QixFQUMxQixVQUF1QjtZQUVwQyxLQUFLLENBQUMsSUFBQSxvQkFBUSxFQUFDLGtCQUFrQixDQUFDLG1CQUFtQixFQUFFLFNBQVMsRUFBRSxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQy9ILENBQUM7S0FDRCxDQUFBO0lBVlksMEVBQStCOzhDQUEvQiwrQkFBK0I7UUFHekMsV0FBQSxvQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLGlEQUE0QixDQUFBO1FBQzVCLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsaUJBQVcsQ0FBQTtPQU5ELCtCQUErQixDQVUzQztJQUVELG1CQUFtQjtJQUNuQixJQUFBLDhCQUFpQixFQUFDLDZDQUF5QixFQUFFLCtCQUErQixrQ0FBMEIsQ0FBQztJQUV2RywwQkFBMEI7SUFDMUIsSUFBQSw4Q0FBOEIsRUFBQywwREFBK0IsQ0FBQyxFQUFFLEVBQUUsMERBQStCLHNDQUE4QixDQUFDIn0=