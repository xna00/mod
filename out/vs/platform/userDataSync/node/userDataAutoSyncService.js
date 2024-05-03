var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/platform/native/common/native", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataSync/common/userDataAutoSyncService", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/userDataSync/common/userDataSyncMachines"], function (require, exports, event_1, native_1, productService_1, storage_1, telemetry_1, userDataAutoSyncService_1, userDataSync_1, userDataSyncAccount_1, userDataSyncMachines_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataAutoSyncService = void 0;
    let UserDataAutoSyncService = class UserDataAutoSyncService extends userDataAutoSyncService_1.UserDataAutoSyncService {
        constructor(productService, userDataSyncStoreManagementService, userDataSyncStoreService, userDataSyncEnablementService, userDataSyncService, nativeHostService, logService, authTokenService, telemetryService, userDataSyncMachinesService, storageService) {
            super(productService, userDataSyncStoreManagementService, userDataSyncStoreService, userDataSyncEnablementService, userDataSyncService, logService, authTokenService, telemetryService, userDataSyncMachinesService, storageService);
            this._register(event_1.Event.debounce(event_1.Event.any(event_1.Event.map(nativeHostService.onDidFocusMainWindow, () => 'windowFocus'), event_1.Event.map(nativeHostService.onDidOpenMainWindow, () => 'windowOpen')), (last, source) => last ? [...last, source] : [source], 1000)(sources => this.triggerSync(sources, true, false)));
        }
    };
    exports.UserDataAutoSyncService = UserDataAutoSyncService;
    exports.UserDataAutoSyncService = UserDataAutoSyncService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(2, userDataSync_1.IUserDataSyncStoreService),
        __param(3, userDataSync_1.IUserDataSyncEnablementService),
        __param(4, userDataSync_1.IUserDataSyncService),
        __param(5, native_1.INativeHostService),
        __param(6, userDataSync_1.IUserDataSyncLogService),
        __param(7, userDataSyncAccount_1.IUserDataSyncAccountService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(10, storage_1.IStorageService)
    ], UserDataAutoSyncService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFBdXRvU3luY1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy9ub2RlL3VzZXJEYXRhQXV0b1N5bmNTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFlTyxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLGlEQUEyQjtRQUV2RSxZQUNrQixjQUErQixFQUNYLGtDQUF1RSxFQUNqRix3QkFBbUQsRUFDOUMsNkJBQTZELEVBQ3ZFLG1CQUF5QyxFQUMzQyxpQkFBcUMsRUFDaEMsVUFBbUMsRUFDL0IsZ0JBQTZDLEVBQ3ZELGdCQUFtQyxFQUN4QiwyQkFBeUQsRUFDdEUsY0FBK0I7WUFFaEQsS0FBSyxDQUFDLGNBQWMsRUFBRSxrQ0FBa0MsRUFBRSx3QkFBd0IsRUFBRSw2QkFBNkIsRUFBRSxtQkFBbUIsRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsMkJBQTJCLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFck8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsUUFBUSxDQUFtQixhQUFLLENBQUMsR0FBRyxDQUN4RCxhQUFLLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxFQUN0RSxhQUFLLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUNwRSxFQUFFLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNySCxDQUFDO0tBRUQsQ0FBQTtJQXZCWSwwREFBdUI7c0NBQXZCLHVCQUF1QjtRQUdqQyxXQUFBLGdDQUFlLENBQUE7UUFDZixXQUFBLGtEQUFtQyxDQUFBO1FBQ25DLFdBQUEsd0NBQXlCLENBQUE7UUFDekIsV0FBQSw2Q0FBOEIsQ0FBQTtRQUM5QixXQUFBLG1DQUFvQixDQUFBO1FBQ3BCLFdBQUEsMkJBQWtCLENBQUE7UUFDbEIsV0FBQSxzQ0FBdUIsQ0FBQTtRQUN2QixXQUFBLGlEQUEyQixDQUFBO1FBQzNCLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSxtREFBNEIsQ0FBQTtRQUM1QixZQUFBLHlCQUFlLENBQUE7T0FiTCx1QkFBdUIsQ0F1Qm5DIn0=