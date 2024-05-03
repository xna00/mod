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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/storage/common/storage", "vs/platform/log/common/log", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/common/arrays", "vs/workbench/services/environment/common/environmentService", "vs/platform/userDataProfile/common/userDataProfileIpc"], function (require, exports, lifecycle_1, extensions_1, instantiation_1, userDataProfile_1, remoteAgentService_1, storage_1, log_1, userDataProfile_2, arrays_1, environmentService_1, userDataProfileIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IRemoteUserDataProfilesService = void 0;
    const associatedRemoteProfilesKey = 'associatedRemoteProfiles';
    exports.IRemoteUserDataProfilesService = (0, instantiation_1.createDecorator)('IRemoteUserDataProfilesService');
    let RemoteUserDataProfilesService = class RemoteUserDataProfilesService extends lifecycle_1.Disposable {
        constructor(environmentService, remoteAgentService, userDataProfilesService, userDataProfileService, storageService, logService) {
            super();
            this.environmentService = environmentService;
            this.remoteAgentService = remoteAgentService;
            this.userDataProfilesService = userDataProfilesService;
            this.userDataProfileService = userDataProfileService;
            this.storageService = storageService;
            this.logService = logService;
            this.initPromise = this.init();
        }
        async init() {
            const connection = this.remoteAgentService.getConnection();
            if (!connection) {
                return;
            }
            const environment = await this.remoteAgentService.getEnvironment();
            if (!environment) {
                return;
            }
            this.remoteUserDataProfilesService = new userDataProfileIpc_1.UserDataProfilesService(environment.profiles.all, environment.profiles.home, connection.getChannel('userDataProfiles'));
            this._register(this.userDataProfilesService.onDidChangeProfiles(e => this.onDidChangeLocalProfiles(e)));
            // Associate current local profile with remote profile
            const remoteProfile = await this.getAssociatedRemoteProfile(this.userDataProfileService.currentProfile, this.remoteUserDataProfilesService);
            if (!remoteProfile.isDefault) {
                this.setAssociatedRemoteProfiles([...this.getAssociatedRemoteProfiles(), remoteProfile.id]);
            }
            this.cleanUp();
        }
        async onDidChangeLocalProfiles(e) {
            for (const profile of e.removed) {
                const remoteProfile = this.remoteUserDataProfilesService?.profiles.find(p => p.id === profile.id);
                if (remoteProfile) {
                    await this.remoteUserDataProfilesService?.removeProfile(remoteProfile);
                }
            }
        }
        async getRemoteProfiles() {
            await this.initPromise;
            if (!this.remoteUserDataProfilesService) {
                throw new Error('Remote profiles service not available in the current window');
            }
            return this.remoteUserDataProfilesService.profiles;
        }
        async getRemoteProfile(localProfile) {
            await this.initPromise;
            if (!this.remoteUserDataProfilesService) {
                throw new Error('Remote profiles service not available in the current window');
            }
            return this.getAssociatedRemoteProfile(localProfile, this.remoteUserDataProfilesService);
        }
        async getAssociatedRemoteProfile(localProfile, remoteUserDataProfilesService) {
            // If the local profile is the default profile, return the remote default profile
            if (localProfile.isDefault) {
                return remoteUserDataProfilesService.defaultProfile;
            }
            let profile = remoteUserDataProfilesService.profiles.find(p => p.id === localProfile.id);
            if (!profile) {
                profile = await remoteUserDataProfilesService.createProfile(localProfile.id, localProfile.name, {
                    shortName: localProfile.shortName,
                    transient: localProfile.isTransient,
                    useDefaultFlags: localProfile.useDefaultFlags,
                });
                this.setAssociatedRemoteProfiles([...this.getAssociatedRemoteProfiles(), this.userDataProfileService.currentProfile.id]);
            }
            return profile;
        }
        getAssociatedRemoteProfiles() {
            if (this.environmentService.remoteAuthority) {
                const remotes = this.parseAssociatedRemoteProfiles();
                return remotes[this.environmentService.remoteAuthority] ?? [];
            }
            return [];
        }
        setAssociatedRemoteProfiles(profiles) {
            if (this.environmentService.remoteAuthority) {
                const remotes = this.parseAssociatedRemoteProfiles();
                profiles = (0, arrays_1.distinct)(profiles);
                if (profiles.length) {
                    remotes[this.environmentService.remoteAuthority] = profiles;
                }
                else {
                    delete remotes[this.environmentService.remoteAuthority];
                }
                if (Object.keys(remotes).length) {
                    this.storageService.store(associatedRemoteProfilesKey, JSON.stringify(remotes), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                }
                else {
                    this.storageService.remove(associatedRemoteProfilesKey, -1 /* StorageScope.APPLICATION */);
                }
            }
        }
        parseAssociatedRemoteProfiles() {
            if (this.environmentService.remoteAuthority) {
                const value = this.storageService.get(associatedRemoteProfilesKey, -1 /* StorageScope.APPLICATION */);
                try {
                    return value ? JSON.parse(value) : {};
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
            return {};
        }
        async cleanUp() {
            const associatedRemoteProfiles = [];
            for (const profileId of this.getAssociatedRemoteProfiles()) {
                const remoteProfile = this.remoteUserDataProfilesService?.profiles.find(p => p.id === profileId);
                if (!remoteProfile) {
                    continue;
                }
                const localProfile = this.userDataProfilesService.profiles.find(p => p.id === profileId);
                if (localProfile) {
                    if (localProfile.name !== remoteProfile.name || localProfile.shortName !== remoteProfile.shortName) {
                        await this.remoteUserDataProfilesService?.updateProfile(remoteProfile, { name: localProfile.name, shortName: localProfile.shortName });
                    }
                    associatedRemoteProfiles.push(profileId);
                    continue;
                }
                if (remoteProfile) {
                    // Cleanup remote profiles those are not available locally
                    await this.remoteUserDataProfilesService?.removeProfile(remoteProfile);
                }
            }
            this.setAssociatedRemoteProfiles(associatedRemoteProfiles);
        }
    };
    RemoteUserDataProfilesService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, userDataProfile_1.IUserDataProfilesService),
        __param(3, userDataProfile_2.IUserDataProfileService),
        __param(4, storage_1.IStorageService),
        __param(5, log_1.ILogService)
    ], RemoteUserDataProfilesService);
    (0, extensions_1.registerSingleton)(exports.IRemoteUserDataProfilesService, RemoteUserDataProfilesService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlVXNlckRhdGFQcm9maWxlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJEYXRhUHJvZmlsZS9jb21tb24vcmVtb3RlVXNlckRhdGFQcm9maWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFlaEcsTUFBTSwyQkFBMkIsR0FBRywwQkFBMEIsQ0FBQztJQUVsRCxRQUFBLDhCQUE4QixHQUFHLElBQUEsK0JBQWUsRUFBaUMsZ0NBQWdDLENBQUMsQ0FBQztJQU9oSSxJQUFNLDZCQUE2QixHQUFuQyxNQUFNLDZCQUE4QixTQUFRLHNCQUFVO1FBUXJELFlBQ2dELGtCQUFnRCxFQUN6RCxrQkFBdUMsRUFDbEMsdUJBQWlELEVBQ2xELHNCQUErQyxFQUN2RCxjQUErQixFQUNuQyxVQUF1QjtZQUVyRCxLQUFLLEVBQUUsQ0FBQztZQVB1Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQThCO1lBQ3pELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDbEMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUNsRCwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQ3ZELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNuQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBR3JELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2hDLENBQUM7UUFFTyxLQUFLLENBQUMsSUFBSTtZQUNqQixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDM0QsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNqQixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ25FLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbEIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsNkJBQTZCLEdBQUcsSUFBSSw0Q0FBdUIsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUNqSyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFeEcsc0RBQXNEO1lBQ3RELE1BQU0sYUFBYSxHQUFHLE1BQU0sSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLDZCQUE2QixDQUFDLENBQUM7WUFDNUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsRUFBRSxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3RixDQUFDO1lBRUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hCLENBQUM7UUFFTyxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBeUI7WUFDL0QsS0FBSyxNQUFNLE9BQU8sSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2pDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2xHLElBQUksYUFBYSxFQUFFLENBQUM7b0JBQ25CLE1BQU0sSUFBSSxDQUFDLDZCQUE2QixFQUFFLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDeEUsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLGlCQUFpQjtZQUN0QixNQUFNLElBQUksQ0FBQyxXQUFXLENBQUM7WUFFdkIsSUFBSSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO2dCQUN6QyxNQUFNLElBQUksS0FBSyxDQUFDLDZEQUE2RCxDQUFDLENBQUM7WUFDaEYsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLDZCQUE2QixDQUFDLFFBQVEsQ0FBQztRQUNwRCxDQUFDO1FBRUQsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFlBQThCO1lBQ3BELE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUV2QixJQUFJLENBQUMsSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sSUFBSSxLQUFLLENBQUMsNkRBQTZELENBQUMsQ0FBQztZQUNoRixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsMEJBQTBCLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1FBQzFGLENBQUM7UUFFTyxLQUFLLENBQUMsMEJBQTBCLENBQUMsWUFBOEIsRUFBRSw2QkFBdUQ7WUFDL0gsaUZBQWlGO1lBQ2pGLElBQUksWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUM1QixPQUFPLDZCQUE2QixDQUFDLGNBQWMsQ0FBQztZQUNyRCxDQUFDO1lBRUQsSUFBSSxPQUFPLEdBQUcsNkJBQTZCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3pGLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPLEdBQUcsTUFBTSw2QkFBNkIsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxZQUFZLENBQUMsSUFBSSxFQUFFO29CQUMvRixTQUFTLEVBQUUsWUFBWSxDQUFDLFNBQVM7b0JBQ2pDLFNBQVMsRUFBRSxZQUFZLENBQUMsV0FBVztvQkFDbkMsZUFBZSxFQUFFLFlBQVksQ0FBQyxlQUFlO2lCQUM3QyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUgsQ0FBQztZQUNELE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7UUFFTywyQkFBMkI7WUFDbEMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzdDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO2dCQUNyRCxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQy9ELENBQUM7WUFDRCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFTywyQkFBMkIsQ0FBQyxRQUFrQjtZQUNyRCxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDN0MsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUM7Z0JBQ3JELFFBQVEsR0FBRyxJQUFBLGlCQUFRLEVBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzlCLElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNyQixPQUFPLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxHQUFHLFFBQVEsQ0FBQztnQkFDN0QsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFDekQsQ0FBQztnQkFDRCxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ2pDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLG1FQUFrRCxDQUFDO2dCQUNsSSxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsMkJBQTJCLG9DQUEyQixDQUFDO2dCQUNuRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyw2QkFBNkI7WUFDcEMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzdDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLDJCQUEyQixvQ0FBMkIsQ0FBQztnQkFDN0YsSUFBSSxDQUFDO29CQUNKLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZDLENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztvQkFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzlCLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRU8sS0FBSyxDQUFDLE9BQU87WUFDcEIsTUFBTSx3QkFBd0IsR0FBYSxFQUFFLENBQUM7WUFDOUMsS0FBSyxNQUFNLFNBQVMsSUFBSSxJQUFJLENBQUMsMkJBQTJCLEVBQUUsRUFBRSxDQUFDO2dCQUM1RCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUM7Z0JBQ2pHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDcEIsU0FBUztnQkFDVixDQUFDO2dCQUNELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxTQUFTLENBQUMsQ0FBQztnQkFDekYsSUFBSSxZQUFZLEVBQUUsQ0FBQztvQkFDbEIsSUFBSSxZQUFZLENBQUMsSUFBSSxLQUFLLGFBQWEsQ0FBQyxJQUFJLElBQUksWUFBWSxDQUFDLFNBQVMsS0FBSyxhQUFhLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQ3BHLE1BQU0sSUFBSSxDQUFDLDZCQUE2QixFQUFFLGFBQWEsQ0FBQyxhQUFhLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7b0JBQ3hJLENBQUM7b0JBQ0Qsd0JBQXdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUN6QyxTQUFTO2dCQUNWLENBQUM7Z0JBQ0QsSUFBSSxhQUFhLEVBQUUsQ0FBQztvQkFDbkIsMERBQTBEO29CQUMxRCxNQUFNLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3hFLENBQUM7WUFDRixDQUFDO1lBQ0QsSUFBSSxDQUFDLDJCQUEyQixDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDNUQsQ0FBQztLQUVELENBQUE7SUF0SkssNkJBQTZCO1FBU2hDLFdBQUEsaURBQTRCLENBQUE7UUFDNUIsV0FBQSx3Q0FBbUIsQ0FBQTtRQUNuQixXQUFBLDBDQUF3QixDQUFBO1FBQ3hCLFdBQUEseUNBQXVCLENBQUE7UUFDdkIsV0FBQSx5QkFBZSxDQUFBO1FBQ2YsV0FBQSxpQkFBVyxDQUFBO09BZFIsNkJBQTZCLENBc0psQztJQUVELElBQUEsOEJBQWlCLEVBQUMsc0NBQThCLEVBQUUsNkJBQTZCLG9DQUE0QixDQUFDIn0=