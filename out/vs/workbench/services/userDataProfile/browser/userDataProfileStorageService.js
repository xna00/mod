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
define(["require", "exports", "vs/base/common/event", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/userDataProfile/common/userDataProfileStorageService", "vs/platform/storage/common/storage", "vs/workbench/services/storage/browser/storageService", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/common/lifecycle"], function (require, exports, event_1, extensions_1, log_1, userDataProfileStorageService_1, storage_1, storageService_1, userDataProfile_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfileStorageService = void 0;
    let UserDataProfileStorageService = class UserDataProfileStorageService extends userDataProfileStorageService_1.AbstractUserDataProfileStorageService {
        constructor(storageService, userDataProfileService, logService) {
            super(storageService);
            this.userDataProfileService = userDataProfileService;
            this.logService = logService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            const disposables = this._register(new lifecycle_1.DisposableStore());
            this._register(event_1.Event.filter(storageService.onDidChangeTarget, e => e.scope === 0 /* StorageScope.PROFILE */, disposables)(() => this.onDidChangeStorageTargetInCurrentProfile()));
            this._register(storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, undefined, disposables)(e => this.onDidChangeStorageValueInCurrentProfile(e)));
        }
        onDidChangeStorageTargetInCurrentProfile() {
            // Not broadcasting changes to other windows/tabs as it is not required in web.
            // Revisit if needed in future.
            this._onDidChange.fire({ targetChanges: [this.userDataProfileService.currentProfile], valueChanges: [] });
        }
        onDidChangeStorageValueInCurrentProfile(e) {
            // Not broadcasting changes to other windows/tabs as it is not required in web
            // Revisit if needed in future.
            this._onDidChange.fire({ targetChanges: [], valueChanges: [{ profile: this.userDataProfileService.currentProfile, changes: [e] }] });
        }
        createStorageDatabase(profile) {
            return (0, storage_1.isProfileUsingDefaultStorage)(profile) ? storageService_1.IndexedDBStorageDatabase.createApplicationStorage(this.logService) : storageService_1.IndexedDBStorageDatabase.createProfileStorage(profile, this.logService);
        }
    };
    exports.UserDataProfileStorageService = UserDataProfileStorageService;
    exports.UserDataProfileStorageService = UserDataProfileStorageService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, userDataProfile_1.IUserDataProfileService),
        __param(2, log_1.ILogService)
    ], UserDataProfileStorageService);
    (0, extensions_1.registerSingleton)(userDataProfileStorageService_1.IUserDataProfileStorageService, UserDataProfileStorageService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlU3RvcmFnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyRGF0YVByb2ZpbGUvYnJvd3Nlci91c2VyRGF0YVByb2ZpbGVTdG9yYWdlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBOEIsU0FBUSxxRUFBcUM7UUFLdkYsWUFDa0IsY0FBK0IsRUFDdkIsc0JBQWdFLEVBQzVFLFVBQXdDO1lBRXJELEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUhvQiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQzNELGVBQVUsR0FBVixVQUFVLENBQWE7WUFOckMsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUEwQixDQUFDLENBQUM7WUFDN0UsZ0JBQVcsR0FBa0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFRN0UsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQzFELElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxpQ0FBeUIsRUFBRSxXQUFXLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsd0NBQXdDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLCtCQUF1QixTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsdUNBQXVDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JKLENBQUM7UUFFTyx3Q0FBd0M7WUFDL0MsK0VBQStFO1lBQy9FLCtCQUErQjtZQUMvQixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLGFBQWEsRUFBRSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMzRyxDQUFDO1FBRU8sdUNBQXVDLENBQUMsQ0FBa0M7WUFDakYsOEVBQThFO1lBQzlFLCtCQUErQjtZQUMvQixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGNBQWMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3RJLENBQUM7UUFFUyxxQkFBcUIsQ0FBQyxPQUF5QjtZQUN4RCxPQUFPLElBQUEsc0NBQTRCLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLHlDQUF3QixDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMseUNBQXdCLENBQUMsb0JBQW9CLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM3TCxDQUFDO0tBQ0QsQ0FBQTtJQS9CWSxzRUFBNkI7NENBQTdCLDZCQUE2QjtRQU12QyxXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLHlDQUF1QixDQUFBO1FBQ3ZCLFdBQUEsaUJBQVcsQ0FBQTtPQVJELDZCQUE2QixDQStCekM7SUFFRCxJQUFBLDhCQUFpQixFQUFDLDhEQUE4QixFQUFFLDZCQUE2QixvQ0FBNEIsQ0FBQyJ9