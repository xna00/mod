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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, async_1, lifecycle_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfilesCleaner = void 0;
    let UserDataProfilesCleaner = class UserDataProfilesCleaner extends lifecycle_1.Disposable {
        constructor(userDataProfilesService) {
            super();
            const scheduler = this._register(new async_1.RunOnceScheduler(() => {
                userDataProfilesService.cleanUp();
            }, 10 * 1000 /* after 10s */));
            scheduler.schedule();
        }
    };
    exports.UserDataProfilesCleaner = UserDataProfilesCleaner;
    exports.UserDataProfilesCleaner = UserDataProfilesCleaner = __decorate([
        __param(0, userDataProfile_1.IUserDataProfilesService)
    ], UserDataProfilesCleaner);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlc0NsZWFuZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2NvZGUvbm9kZS9zaGFyZWRQcm9jZXNzL2NvbnRyaWIvdXNlckRhdGFQcm9maWxlc0NsZWFuZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBTXpGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsc0JBQVU7UUFFdEQsWUFDMkIsdUJBQWlEO1lBRTNFLEtBQUssRUFBRSxDQUFDO1lBRVIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdCQUFnQixDQUFDLEdBQUcsRUFBRTtnQkFDMUQsdUJBQXVCLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztZQUMvQixTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDdEIsQ0FBQztLQUNELENBQUE7SUFaWSwwREFBdUI7c0NBQXZCLHVCQUF1QjtRQUdqQyxXQUFBLDBDQUF3QixDQUFBO09BSGQsdUJBQXVCLENBWW5DIn0=