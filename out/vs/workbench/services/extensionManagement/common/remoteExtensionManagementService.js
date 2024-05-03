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
define(["require", "exports", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/userDataProfile/common/remoteUserDataProfiles", "vs/workbench/services/extensionManagement/common/extensionManagementChannelClient", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, uriIdentity_1, remoteUserDataProfiles_1, extensionManagementChannelClient_1, userDataProfile_1, userDataProfile_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteExtensionManagementService = void 0;
    let RemoteExtensionManagementService = class RemoteExtensionManagementService extends extensionManagementChannelClient_1.ProfileAwareExtensionManagementChannelClient {
        constructor(channel, userDataProfileService, userDataProfilesService, remoteUserDataProfilesService, uriIdentityService) {
            super(channel, userDataProfileService, uriIdentityService);
            this.userDataProfilesService = userDataProfilesService;
            this.remoteUserDataProfilesService = remoteUserDataProfilesService;
        }
        async filterEvent(e) {
            if (e.applicationScoped) {
                return true;
            }
            if (!e.profileLocation && this.userDataProfileService.currentProfile.isDefault) {
                return true;
            }
            const currentRemoteProfile = await this.remoteUserDataProfilesService.getRemoteProfile(this.userDataProfileService.currentProfile);
            if (this.uriIdentityService.extUri.isEqual(currentRemoteProfile.extensionsResource, e.profileLocation)) {
                return true;
            }
            return false;
        }
        async getProfileLocation(profileLocation) {
            if (!profileLocation && this.userDataProfileService.currentProfile.isDefault) {
                return undefined;
            }
            profileLocation = await super.getProfileLocation(profileLocation);
            let profile = this.userDataProfilesService.profiles.find(p => this.uriIdentityService.extUri.isEqual(p.extensionsResource, profileLocation));
            if (profile) {
                profile = await this.remoteUserDataProfilesService.getRemoteProfile(profile);
            }
            else {
                profile = (await this.remoteUserDataProfilesService.getRemoteProfiles()).find(p => this.uriIdentityService.extUri.isEqual(p.extensionsResource, profileLocation));
            }
            return profile?.extensionsResource;
        }
        async switchExtensionsProfile(previousProfileLocation, currentProfileLocation, preserveExtensions) {
            const remoteProfiles = await this.remoteUserDataProfilesService.getRemoteProfiles();
            const previousProfile = remoteProfiles.find(p => this.uriIdentityService.extUri.isEqual(p.extensionsResource, previousProfileLocation));
            const currentProfile = remoteProfiles.find(p => this.uriIdentityService.extUri.isEqual(p.extensionsResource, currentProfileLocation));
            if (previousProfile?.id === currentProfile?.id) {
                return { added: [], removed: [] };
            }
            return super.switchExtensionsProfile(previousProfileLocation, currentProfileLocation, preserveExtensions);
        }
    };
    exports.RemoteExtensionManagementService = RemoteExtensionManagementService;
    exports.RemoteExtensionManagementService = RemoteExtensionManagementService = __decorate([
        __param(1, userDataProfile_1.IUserDataProfileService),
        __param(2, userDataProfile_2.IUserDataProfilesService),
        __param(3, remoteUserDataProfiles_1.IRemoteUserDataProfilesService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], RemoteExtensionManagementService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRXh0ZW5zaW9uTWFuYWdlbWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25NYW5hZ2VtZW50L2NvbW1vbi9yZW1vdGVFeHRlbnNpb25NYW5hZ2VtZW50U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBaUMsU0FBUSwrRUFBNEM7UUFFakcsWUFDQyxPQUFpQixFQUNRLHNCQUErQyxFQUM3Qix1QkFBaUQsRUFDM0MsNkJBQTZELEVBQ3pGLGtCQUF1QztZQUU1RCxLQUFLLENBQUMsT0FBTyxFQUFFLHNCQUFzQixFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFKaEIsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUMzQyxrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQWdDO1FBSS9HLENBQUM7UUFFUyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQXVCO1lBQ2xELElBQUksQ0FBQyxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELElBQUksQ0FBQyxDQUFDLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2hGLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE1BQU0sb0JBQW9CLEdBQUcsTUFBTSxJQUFJLENBQUMsNkJBQTZCLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ25JLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENB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