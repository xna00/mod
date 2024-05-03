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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/base/node/pfs", "vs/platform/environment/common/environment", "vs/platform/log/common/log"], function (require, exports, async_1, errors_1, lifecycle_1, network_1, path_1, resources_1, pfs_1, environment_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LogsDataCleaner = void 0;
    let LogsDataCleaner = class LogsDataCleaner extends lifecycle_1.Disposable {
        constructor(environmentService, logService) {
            super();
            this.environmentService = environmentService;
            this.logService = logService;
            const scheduler = this._register(new async_1.RunOnceScheduler(() => {
                this.cleanUpOldLogs();
            }, 10 * 1000 /* after 10s */));
            scheduler.schedule();
        }
        async cleanUpOldLogs() {
            this.logService.trace('[logs cleanup]: Starting to clean up old logs.');
            try {
                const currentLog = (0, resources_1.basename)(this.environmentService.logsHome);
                const logsRoot = (0, resources_1.dirname)(this.environmentService.logsHome.with({ scheme: network_1.Schemas.file })).fsPath;
                const logFiles = await pfs_1.Promises.readdir(logsRoot);
                const allSessions = logFiles.filter(logFile => /^\d{8}T\d{6}$/.test(logFile));
                const oldSessions = allSessions.sort().filter(session => session !== currentLog);
                const sessionsToDelete = oldSessions.slice(0, Math.max(0, oldSessions.length - 9));
                if (sessionsToDelete.length > 0) {
                    this.logService.trace(`[logs cleanup]: Removing log folders '${sessionsToDelete.join(', ')}'`);
                    await Promise.all(sessionsToDelete.map(sessionToDelete => pfs_1.Promises.rm((0, path_1.join)(logsRoot, sessionToDelete))));
                }
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
            }
        }
    };
    exports.LogsDataCleaner = LogsDataCleaner;
    exports.LogsDataCleaner = LogsDataCleaner = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, log_1.ILogService)
    ], LogsDataCleaner);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nc0RhdGFDbGVhbmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9jb2RlL25vZGUvc2hhcmVkUHJvY2Vzcy9jb250cmliL2xvZ3NEYXRhQ2xlYW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZekYsSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxzQkFBVTtRQUU5QyxZQUN1QyxrQkFBdUMsRUFDL0MsVUFBdUI7WUFFckQsS0FBSyxFQUFFLENBQUM7WUFIOEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUMvQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBSXJELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUU7Z0JBQzFELElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN2QixDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBQy9CLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN0QixDQUFDO1FBRU8sS0FBSyxDQUFDLGNBQWM7WUFDM0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQztZQUV4RSxJQUFJLENBQUM7Z0JBQ0osTUFBTSxVQUFVLEdBQUcsSUFBQSxvQkFBUSxFQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDOUQsTUFBTSxRQUFRLEdBQUcsSUFBQSxtQkFBTyxFQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztnQkFDakcsTUFBTSxRQUFRLEdBQUcsTUFBTSxjQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUVsRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUM5RSxNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxLQUFLLFVBQVUsQ0FBQyxDQUFDO2dCQUNqRixNQUFNLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFbkYsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ2pDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHlDQUF5QyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUUvRixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsY0FBUSxDQUFDLEVBQUUsQ0FBQyxJQUFBLFdBQUksRUFBQyxRQUFRLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFHLENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBQSwwQkFBaUIsRUFBQyxLQUFLLENBQUMsQ0FBQztZQUMxQixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUFuQ1ksMENBQWU7OEJBQWYsZUFBZTtRQUd6QixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsaUJBQVcsQ0FBQTtPQUpELGVBQWUsQ0FtQzNCIn0=