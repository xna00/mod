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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/storage/common/storageIpc", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/node/workspaces", "vs/platform/native/common/native", "vs/platform/ipc/common/mainProcessService", "vs/base/common/network"], function (require, exports, async_1, errors_1, lifecycle_1, path_1, pfs_1, environment_1, log_1, storageIpc_1, workspace_1, workspaces_1, native_1, mainProcessService_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnusedWorkspaceStorageDataCleaner = void 0;
    let UnusedWorkspaceStorageDataCleaner = class UnusedWorkspaceStorageDataCleaner extends lifecycle_1.Disposable {
        constructor(environmentService, logService, nativeHostService, mainProcessService) {
            super();
            this.environmentService = environmentService;
            this.logService = logService;
            this.nativeHostService = nativeHostService;
            this.mainProcessService = mainProcessService;
            const scheduler = this._register(new async_1.RunOnceScheduler(() => {
                this.cleanUpStorage();
            }, 30 * 1000 /* after 30s */));
            scheduler.schedule();
        }
        async cleanUpStorage() {
            this.logService.trace('[storage cleanup]: Starting to clean up workspace storage folders for unused empty workspaces.');
            try {
                const workspaceStorageHome = this.environmentService.workspaceStorageHome.with({ scheme: network_1.Schemas.file }).fsPath;
                const workspaceStorageFolders = await pfs_1.Promises.readdir(workspaceStorageHome);
                const storageClient = new storageIpc_1.StorageClient(this.mainProcessService.getChannel('storage'));
                await Promise.all(workspaceStorageFolders.map(async (workspaceStorageFolder) => {
                    const workspaceStoragePath = (0, path_1.join)(workspaceStorageHome, workspaceStorageFolder);
                    if (workspaceStorageFolder.length === workspaces_1.NON_EMPTY_WORKSPACE_ID_LENGTH) {
                        return; // keep workspace storage for folders/workspaces that can be accessed still
                    }
                    if (workspaceStorageFolder === workspace_1.EXTENSION_DEVELOPMENT_EMPTY_WINDOW_WORKSPACE.id) {
                        return; // keep workspace storage for empty extension development workspaces
                    }
                    const windows = await this.nativeHostService.getWindows({ includeAuxiliaryWindows: false });
                    if (windows.some(window => window.workspace?.id === workspaceStorageFolder)) {
                        return; // keep workspace storage for empty workspaces opened as window
                    }
                    const isStorageUsed = await storageClient.isUsed(workspaceStoragePath);
                    if (isStorageUsed) {
                        return; // keep workspace storage for empty workspaces that are in use
                    }
                    this.logService.trace(`[storage cleanup]: Deleting workspace storage folder ${workspaceStorageFolder} as it seems to be an unused empty workspace.`);
                    await pfs_1.Promises.rm(workspaceStoragePath);
                }));
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
            }
        }
    };
    exports.UnusedWorkspaceStorageDataCleaner = UnusedWorkspaceStorageDataCleaner;
    exports.UnusedWorkspaceStorageDataCleaner = UnusedWorkspaceStorageDataCleaner = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, log_1.ILogService),
        __param(2, native_1.INativeHostService),
        __param(3, mainProcessService_1.IMainProcessService)
    ], UnusedWorkspaceStorageDataCleaner);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZURhdGFDbGVhbmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9jb2RlL25vZGUvc2hhcmVkUHJvY2Vzcy9jb250cmliL3N0b3JhZ2VEYXRhQ2xlYW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQnpGLElBQU0saUNBQWlDLEdBQXZDLE1BQU0saUNBQWtDLFNBQVEsc0JBQVU7UUFFaEUsWUFDNkMsa0JBQTZDLEVBQzNELFVBQXVCLEVBQ2hCLGlCQUFxQyxFQUNwQyxrQkFBdUM7WUFFN0UsS0FBSyxFQUFFLENBQUM7WUFMb0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUEyQjtZQUMzRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2hCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDcEMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUk3RSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFO2dCQUMxRCxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDdkIsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztZQUMvQixTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDdEIsQ0FBQztRQUVPLEtBQUssQ0FBQyxjQUFjO1lBQzNCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLGdHQUFnRyxDQUFDLENBQUM7WUFFeEgsSUFBSSxDQUFDO2dCQUNKLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxpQkFBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDO2dCQUNoSCxNQUFNLHVCQUF1QixHQUFHLE1BQU0sY0FBUSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2dCQUM3RSxNQUFNLGFBQWEsR0FBRyxJQUFJLDBCQUFhLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUV2RixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyxzQkFBc0IsRUFBQyxFQUFFO29CQUM1RSxNQUFNLG9CQUFvQixHQUFHLElBQUEsV0FBSSxFQUFDLG9CQUFvQixFQUFFLHNCQUFzQixDQUFDLENBQUM7b0JBRWhGLElBQUksc0JBQXNCLENBQUMsTUFBTSxLQUFLLDBDQUE2QixFQUFFLENBQUM7d0JBQ3JFLE9BQU8sQ0FBQywyRUFBMkU7b0JBQ3BGLENBQUM7b0JBRUQsSUFBSSxzQkFBc0IsS0FBSyx3REFBNEMsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDaEYsT0FBTyxDQUFDLG9FQUFvRTtvQkFDN0UsQ0FBQztvQkFFRCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsRUFBRSx1QkFBdUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO29CQUM1RixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEVBQUUsS0FBSyxzQkFBc0IsQ0FBQyxFQUFFLENBQUM7d0JBQzdFLE9BQU8sQ0FBQywrREFBK0Q7b0JBQ3hFLENBQUM7b0JBRUQsTUFBTSxhQUFhLEdBQUcsTUFBTSxhQUFhLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUM7b0JBQ3ZFLElBQUksYUFBYSxFQUFFLENBQUM7d0JBQ25CLE9BQU8sQ0FBQyw4REFBOEQ7b0JBQ3ZFLENBQUM7b0JBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsd0RBQXdELHNCQUFzQiwrQ0FBK0MsQ0FBQyxDQUFDO29CQUVySixNQUFNLGNBQVEsQ0FBQyxFQUFFLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDekMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFBLDBCQUFpQixFQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzFCLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQXJEWSw4RUFBaUM7Z0RBQWpDLGlDQUFpQztRQUczQyxXQUFBLHVDQUF5QixDQUFBO1FBQ3pCLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEsMkJBQWtCLENBQUE7UUFDbEIsV0FBQSx3Q0FBbUIsQ0FBQTtPQU5ULGlDQUFpQyxDQXFEN0MifQ==