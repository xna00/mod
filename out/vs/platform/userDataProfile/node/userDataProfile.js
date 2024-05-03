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
define(["require", "exports", "vs/base/common/uri", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/state/node/state", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile", "vs/base/common/types", "vs/platform/state/node/stateService"], function (require, exports, uri_1, environment_1, files_1, log_1, state_1, uriIdentity_1, userDataProfile_1, types_1, stateService_1) {
    "use strict";
    var UserDataProfilesReadonlyService_1, UserDataProfilesService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ServerUserDataProfilesService = exports.UserDataProfilesService = exports.UserDataProfilesReadonlyService = void 0;
    let UserDataProfilesReadonlyService = class UserDataProfilesReadonlyService extends userDataProfile_1.UserDataProfilesService {
        static { UserDataProfilesReadonlyService_1 = this; }
        static { this.PROFILE_ASSOCIATIONS_MIGRATION_KEY = 'profileAssociationsMigration'; }
        constructor(stateReadonlyService, uriIdentityService, nativeEnvironmentService, fileService, logService) {
            super(nativeEnvironmentService, fileService, uriIdentityService, logService);
            this.stateReadonlyService = stateReadonlyService;
            this.nativeEnvironmentService = nativeEnvironmentService;
        }
        getStoredProfiles() {
            const storedProfilesState = this.stateReadonlyService.getItem(UserDataProfilesReadonlyService_1.PROFILES_KEY, []);
            return storedProfilesState.map(p => ({ ...p, location: (0, types_1.isString)(p.location) ? this.uriIdentityService.extUri.joinPath(this.profilesHome, p.location) : uri_1.URI.revive(p.location) }));
        }
        getStoredProfileAssociations() {
            const associations = this.stateReadonlyService.getItem(UserDataProfilesReadonlyService_1.PROFILE_ASSOCIATIONS_KEY, {});
            const migrated = this.stateReadonlyService.getItem(UserDataProfilesReadonlyService_1.PROFILE_ASSOCIATIONS_MIGRATION_KEY, false);
            return migrated ? associations : this.migrateStoredProfileAssociations(associations);
        }
        getDefaultProfileExtensionsLocation() {
            return this.uriIdentityService.extUri.joinPath(uri_1.URI.file(this.nativeEnvironmentService.extensionsPath).with({ scheme: this.profilesHome.scheme }), 'extensions.json');
        }
    };
    exports.UserDataProfilesReadonlyService = UserDataProfilesReadonlyService;
    exports.UserDataProfilesReadonlyService = UserDataProfilesReadonlyService = UserDataProfilesReadonlyService_1 = __decorate([
        __param(0, state_1.IStateReadService),
        __param(1, uriIdentity_1.IUriIdentityService),
        __param(2, environment_1.INativeEnvironmentService),
        __param(3, files_1.IFileService),
        __param(4, log_1.ILogService)
    ], UserDataProfilesReadonlyService);
    let UserDataProfilesService = UserDataProfilesService_1 = class UserDataProfilesService extends UserDataProfilesReadonlyService {
        constructor(stateService, uriIdentityService, environmentService, fileService, logService) {
            super(stateService, uriIdentityService, environmentService, fileService, logService);
            this.stateService = stateService;
        }
        saveStoredProfiles(storedProfiles) {
            if (storedProfiles.length) {
                this.stateService.setItem(UserDataProfilesService_1.PROFILES_KEY, storedProfiles.map(profile => ({ ...profile, location: this.uriIdentityService.extUri.basename(profile.location) })));
            }
            else {
                this.stateService.removeItem(UserDataProfilesService_1.PROFILES_KEY);
            }
        }
        getStoredProfiles() {
            const storedProfiles = super.getStoredProfiles();
            if (!this.stateService.getItem('userDataProfilesMigration', false)) {
                this.saveStoredProfiles(storedProfiles);
                this.stateService.setItem('userDataProfilesMigration', true);
            }
            return storedProfiles;
        }
        saveStoredProfileAssociations(storedProfileAssociations) {
            if (storedProfileAssociations.emptyWindows || storedProfileAssociations.workspaces) {
                this.stateService.setItem(UserDataProfilesService_1.PROFILE_ASSOCIATIONS_KEY, storedProfileAssociations);
            }
            else {
                this.stateService.removeItem(UserDataProfilesService_1.PROFILE_ASSOCIATIONS_KEY);
            }
        }
        getStoredProfileAssociations() {
            const oldKey = 'workspaceAndProfileInfo';
            const storedWorkspaceInfos = this.stateService.getItem(oldKey, undefined);
            if (storedWorkspaceInfos) {
                this.stateService.removeItem(oldKey);
                const workspaces = storedWorkspaceInfos.reduce((result, { workspace, profile }) => {
                    result[uri_1.URI.revive(workspace).toString()] = uri_1.URI.revive(profile).toString();
                    return result;
                }, {});
                this.stateService.setItem(UserDataProfilesService_1.PROFILE_ASSOCIATIONS_KEY, { workspaces });
            }
            const associations = super.getStoredProfileAssociations();
            if (!this.stateService.getItem(UserDataProfilesService_1.PROFILE_ASSOCIATIONS_MIGRATION_KEY, false)) {
                this.saveStoredProfileAssociations(associations);
                this.stateService.setItem(UserDataProfilesService_1.PROFILE_ASSOCIATIONS_MIGRATION_KEY, true);
            }
            return associations;
        }
    };
    exports.UserDataProfilesService = UserDataProfilesService;
    exports.UserDataProfilesService = UserDataProfilesService = UserDataProfilesService_1 = __decorate([
        __param(0, state_1.IStateService),
        __param(1, uriIdentity_1.IUriIdentityService),
        __param(2, environment_1.INativeEnvironmentService),
        __param(3, files_1.IFileService),
        __param(4, log_1.ILogService)
    ], UserDataProfilesService);
    let ServerUserDataProfilesService = class ServerUserDataProfilesService extends UserDataProfilesService {
        constructor(uriIdentityService, environmentService, fileService, logService) {
            super(new stateService_1.StateService(0 /* SaveStrategy.IMMEDIATE */, environmentService, logService, fileService), uriIdentityService, environmentService, fileService, logService);
        }
        async init() {
            await this.stateService.init();
            return super.init();
        }
    };
    exports.ServerUserDataProfilesService = ServerUserDataProfilesService;
    exports.ServerUserDataProfilesService = ServerUserDataProfilesService = __decorate([
        __param(0, uriIdentity_1.IUriIdentityService),
        __param(1, environment_1.INativeEnvironmentService),
        __param(2, files_1.IFileService),
        __param(3, log_1.ILogService)
    ], ServerUserDataProfilesService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVByb2ZpbGUvbm9kZS91c2VyRGF0YVByb2ZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWV6RixJQUFNLCtCQUErQixHQUFyQyxNQUFNLCtCQUFnQyxTQUFRLHlDQUEyQjs7aUJBRXJELHVDQUFrQyxHQUFHLDhCQUE4QixBQUFqQyxDQUFrQztRQUU5RixZQUNxQyxvQkFBdUMsRUFDdEQsa0JBQXVDLEVBQ2hCLHdCQUFtRCxFQUNqRixXQUF5QixFQUMxQixVQUF1QjtZQUVwQyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBTnpDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBbUI7WUFFL0IsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEyQjtRQUtoRyxDQUFDO1FBRWtCLGlCQUFpQjtZQUNuQyxNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQXVDLGlDQUErQixDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0SixPQUFPLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBQSxnQkFBUSxFQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFB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