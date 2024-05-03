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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/platform/ipc/electron-sandbox/services", "vs/base/common/event", "vs/platform/instantiation/common/extensions"], function (require, exports, userDataSync_1, services_1, event_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UserDataAutoSyncService = class UserDataAutoSyncService {
        get onError() { return event_1.Event.map(this.channel.listen('onError'), e => userDataSync_1.UserDataSyncError.toUserDataSyncError(e)); }
        constructor(sharedProcessService) {
            this.channel = sharedProcessService.getChannel('userDataAutoSync');
        }
        triggerSync(sources, hasToLimitSync, disableCache) {
            return this.channel.call('triggerSync', [sources, hasToLimitSync, disableCache]);
        }
        turnOn() {
            return this.channel.call('turnOn');
        }
        turnOff(everywhere) {
            return this.channel.call('turnOff', [everywhere]);
        }
    };
    UserDataAutoSyncService = __decorate([
        __param(0, services_1.ISharedProcessService)
    ], UserDataAutoSyncService);
    (0, extensions_1.registerSingleton)(userDataSync_1.IUserDataAutoSyncService, UserDataAutoSyncService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFBdXRvU3luY1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyRGF0YVN5bmMvZWxlY3Ryb24tc2FuZGJveC91c2VyRGF0YUF1dG9TeW5jU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQVFoRyxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1QjtRQUs1QixJQUFJLE9BQU8sS0FBK0IsT0FBTyxhQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFRLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsZ0NBQWlCLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFbkosWUFDd0Isb0JBQTJDO1lBRWxFLElBQUksQ0FBQyxPQUFPLEdBQUcsb0JBQW9CLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUVELFdBQVcsQ0FBQyxPQUFpQixFQUFFLGNBQXVCLEVBQUUsWUFBcUI7WUFDNUUsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxPQUFPLEVBQUUsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDbEYsQ0FBQztRQUVELE1BQU07WUFDTCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxPQUFPLENBQUMsVUFBbUI7WUFDMUIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ25ELENBQUM7S0FFRCxDQUFBO0lBekJLLHVCQUF1QjtRQVExQixXQUFBLGdDQUFxQixDQUFBO09BUmxCLHVCQUF1QixDQXlCNUI7SUFFRCxJQUFBLDhCQUFpQixFQUFDLHVDQUF3QixFQUFFLHVCQUF1QixvQ0FBNEIsQ0FBQyJ9