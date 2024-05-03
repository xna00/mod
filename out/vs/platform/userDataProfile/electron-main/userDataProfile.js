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
define(["require", "exports", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataProfile/node/userDataProfile", "vs/platform/state/node/state"], function (require, exports, environment_1, files_1, instantiation_1, log_1, uriIdentity_1, userDataProfile_1, userDataProfile_2, state_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfilesMainService = exports.IUserDataProfilesMainService = void 0;
    exports.IUserDataProfilesMainService = (0, instantiation_1.refineServiceDecorator)(userDataProfile_1.IUserDataProfilesService);
    let UserDataProfilesMainService = class UserDataProfilesMainService extends userDataProfile_2.UserDataProfilesService {
        constructor(stateService, uriIdentityService, environmentService, fileService, logService) {
            super(stateService, uriIdentityService, environmentService, fileService, logService);
        }
        getAssociatedEmptyWindows() {
            const emptyWindows = [];
            for (const id of this.profilesObject.emptyWindows.keys()) {
                emptyWindows.push({ id });
            }
            return emptyWindows;
        }
    };
    exports.UserDataProfilesMainService = UserDataProfilesMainService;
    exports.UserDataProfilesMainService = UserDataProfilesMainService = __decorate([
        __param(0, state_1.IStateService),
        __param(1, uriIdentity_1.IUriIdentityService),
        __param(2, environment_1.INativeEnvironmentService),
        __param(3, files_1.IFileService),
        __param(4, log_1.ILogService)
    ], UserDataProfilesMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVByb2ZpbGUvZWxlY3Ryb24tbWFpbi91c2VyRGF0YVByb2ZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYW5GLFFBQUEsNEJBQTRCLEdBQUcsSUFBQSxzQ0FBc0IsRUFBeUQsMENBQXdCLENBQUMsQ0FBQztJQVM5SSxJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLHlDQUF1QjtRQUV2RSxZQUNnQixZQUEyQixFQUNyQixrQkFBdUMsRUFDakMsa0JBQTZDLEVBQzFELFdBQXlCLEVBQzFCLFVBQXVCO1lBRXBDLEtBQUssQ0FBQyxZQUFZLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFFRCx5QkFBeUI7WUFDeEIsTUFBTSxZQUFZLEdBQWdDLEVBQUUsQ0FBQztZQUNyRCxLQUFLLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUM7Z0JBQzFELFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFDRCxPQUFPLFlBQVksQ0FBQztRQUNyQixDQUFDO0tBRUQsQ0FBQTtJQXBCWSxrRUFBMkI7MENBQTNCLDJCQUEyQjtRQUdyQyxXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsdUNBQXlCLENBQUE7UUFDekIsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSxpQkFBVyxDQUFBO09BUEQsMkJBQTJCLENBb0J2QyJ9