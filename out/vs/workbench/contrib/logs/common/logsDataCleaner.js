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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/resources", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/base/common/async"], function (require, exports, lifecycle_1, files_1, resources_1, environmentService_1, lifecycle_2, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LogsDataCleaner = void 0;
    let LogsDataCleaner = class LogsDataCleaner extends lifecycle_1.Disposable {
        constructor(environmentService, fileService, lifecycleService) {
            super();
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.lifecycleService = lifecycleService;
            this.cleanUpOldLogsSoon();
        }
        cleanUpOldLogsSoon() {
            let handle = setTimeout(async () => {
                handle = undefined;
                const stat = await this.fileService.resolve((0, resources_1.dirname)(this.environmentService.logsHome));
                if (stat.children) {
                    const currentLog = (0, resources_1.basename)(this.environmentService.logsHome);
                    const allSessions = stat.children.filter(stat => stat.isDirectory && /^\d{8}T\d{6}$/.test(stat.name));
                    const oldSessions = allSessions.sort().filter((d, i) => d.name !== currentLog);
                    const toDelete = oldSessions.slice(0, Math.max(0, oldSessions.length - 49));
                    async_1.Promises.settled(toDelete.map(stat => this.fileService.del(stat.resource, { recursive: true })));
                }
            }, 10 * 1000);
            this.lifecycleService.onWillShutdown(() => {
                if (handle) {
                    clearTimeout(handle);
                    handle = undefined;
                }
            });
        }
    };
    exports.LogsDataCleaner = LogsDataCleaner;
    exports.LogsDataCleaner = LogsDataCleaner = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, lifecycle_2.ILifecycleService)
    ], LogsDataCleaner);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nc0RhdGFDbGVhbmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9sb2dzL2NvbW1vbi9sb2dzRGF0YUNsZWFuZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBU3pGLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsc0JBQVU7UUFFOUMsWUFDZ0Qsa0JBQWdELEVBQ2hFLFdBQXlCLEVBQ3BCLGdCQUFtQztZQUV2RSxLQUFLLEVBQUUsQ0FBQztZQUp1Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQThCO1lBQ2hFLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ3BCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFHdkUsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUVPLGtCQUFrQjtZQUN6QixJQUFJLE1BQU0sR0FBUSxVQUFVLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ3ZDLE1BQU0sR0FBRyxTQUFTLENBQUM7Z0JBQ25CLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBQSxtQkFBTyxFQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUN2RixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDbkIsTUFBTSxVQUFVLEdBQUcsSUFBQSxvQkFBUSxFQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDOUQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ3RHLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQyxDQUFDO29CQUMvRSxNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxXQUFXLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzVFLGdCQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNsRyxDQUFDO1lBQ0YsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUNkLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFO2dCQUN6QyxJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUNaLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDckIsTUFBTSxHQUFHLFNBQVMsQ0FBQztnQkFDcEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNELENBQUE7SUE5QlksMENBQWU7OEJBQWYsZUFBZTtRQUd6QixXQUFBLGlEQUE0QixDQUFBO1FBQzVCLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsNkJBQWlCLENBQUE7T0FMUCxlQUFlLENBOEIzQiJ9