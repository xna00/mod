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
define(["require", "exports", "vs/base/browser/broadcast", "vs/base/common/marshalling", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, broadcast_1, marshalling_1, environment_1, files_1, log_1, uriIdentity_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserUserDataProfilesService = void 0;
    let BrowserUserDataProfilesService = class BrowserUserDataProfilesService extends userDataProfile_1.UserDataProfilesService {
        constructor(environmentService, fileService, uriIdentityService, logService) {
            super(environmentService, fileService, uriIdentityService, logService);
            this.changesBroadcastChannel = this._register(new broadcast_1.BroadcastDataChannel(`${userDataProfile_1.UserDataProfilesService.PROFILES_KEY}.changes`));
            this._register(this.changesBroadcastChannel.onDidReceiveData(changes => {
                try {
                    this._profilesObject = undefined;
                    const added = changes.added.map(p => (0, userDataProfile_1.reviveProfile)(p, this.profilesHome.scheme));
                    const removed = changes.removed.map(p => (0, userDataProfile_1.reviveProfile)(p, this.profilesHome.scheme));
                    const updated = changes.updated.map(p => (0, userDataProfile_1.reviveProfile)(p, this.profilesHome.scheme));
                    this.updateTransientProfiles(added.filter(a => a.isTransient), removed.filter(a => a.isTransient), updated.filter(a => a.isTransient));
                    this._onDidChangeProfiles.fire({
                        added,
                        removed,
                        updated,
                        all: this.profiles
                    });
                }
                catch (error) { /* ignore */ }
            }));
        }
        updateTransientProfiles(added, removed, updated) {
            if (added.length) {
                this.transientProfilesObject.profiles.push(...added);
            }
            if (removed.length || updated.length) {
                const allTransientProfiles = this.transientProfilesObject.profiles;
                this.transientProfilesObject.profiles = [];
                for (const profile of allTransientProfiles) {
                    if (removed.some(p => profile.id === p.id)) {
                        continue;
                    }
                    this.transientProfilesObject.profiles.push(updated.find(p => profile.id === p.id) ?? profile);
                }
            }
        }
        getStoredProfiles() {
            try {
                const value = localStorage.getItem(userDataProfile_1.UserDataProfilesService.PROFILES_KEY);
                if (value) {
                    return (0, marshalling_1.revive)(JSON.parse(value));
                }
            }
            catch (error) {
                /* ignore */
                this.logService.error(error);
            }
            return [];
        }
        triggerProfilesChanges(added, removed, updated) {
            super.triggerProfilesChanges(added, removed, updated);
            this.changesBroadcastChannel.postData({ added, removed, updated });
        }
        saveStoredProfiles(storedProfiles) {
            localStorage.setItem(userDataProfile_1.UserDataProfilesService.PROFILES_KEY, JSON.stringify(storedProfiles));
        }
        getStoredProfileAssociations() {
            const migrateKey = 'profileAssociationsMigration';
            try {
                const value = localStorage.getItem(userDataProfile_1.UserDataProfilesService.PROFILE_ASSOCIATIONS_KEY);
                if (value) {
                    let associations = JSON.parse(value);
                    if (!localStorage.getItem(migrateKey)) {
                        associations = this.migrateStoredProfileAssociations(associations);
                        this.saveStoredProfileAssociations(associations);
                        localStorage.setItem(migrateKey, 'true');
                    }
                    return associations;
                }
            }
            catch (error) {
                /* ignore */
                this.logService.error(error);
            }
            return {};
        }
        saveStoredProfileAssociations(storedProfileAssociations) {
            localStorage.setItem(userDataProfile_1.UserDataProfilesService.PROFILE_ASSOCIATIONS_KEY, JSON.stringify(storedProfileAssociations));
        }
    };
    exports.BrowserUserDataProfilesService = BrowserUserDataProfilesService;
    exports.BrowserUserDataProfilesService = BrowserUserDataProfilesService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, log_1.ILogService)
    ], BrowserUserDataProfilesService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVByb2ZpbGUvYnJvd3Nlci91c2VyRGF0YVByb2ZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0sOEJBQThCLEdBQXBDLE1BQU0sOEJBQStCLFNBQVEseUNBQXVCO1FBSTFFLFlBQ3NCLGtCQUF1QyxFQUM5QyxXQUF5QixFQUNsQixrQkFBdUMsRUFDL0MsVUFBdUI7WUFFcEMsS0FBSyxDQUFDLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN2RSxJQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGdDQUFvQixDQUE0QixHQUFHLHlDQUF1QixDQUFDLFlBQVksVUFBVSxDQUFDLENBQUMsQ0FBQztZQUN0SixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDdEUsSUFBSSxDQUFDO29CQUNKLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDO29CQUNqQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUEsK0JBQWEsRUFBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUNqRixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUEsK0JBQWEsRUFBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENB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