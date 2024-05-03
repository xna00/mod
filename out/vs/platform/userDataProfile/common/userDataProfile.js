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
define(["require", "exports", "vs/base/common/hash", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/workspace/common/workspace", "vs/base/common/map", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/async", "vs/base/common/uuid", "vs/base/common/strings", "vs/base/common/types"], function (require, exports, hash_1, event_1, lifecycle_1, resources_1, uri_1, nls_1, environment_1, files_1, instantiation_1, log_1, workspace_1, map_1, uriIdentity_1, async_1, uuid_1, strings_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryUserDataProfilesService = exports.UserDataProfilesService = exports.IUserDataProfilesService = exports.ProfileResourceType = void 0;
    exports.isUserDataProfile = isUserDataProfile;
    exports.reviveProfile = reviveProfile;
    exports.toUserDataProfile = toUserDataProfile;
    var ProfileResourceType;
    (function (ProfileResourceType) {
        ProfileResourceType["Settings"] = "settings";
        ProfileResourceType["Keybindings"] = "keybindings";
        ProfileResourceType["Snippets"] = "snippets";
        ProfileResourceType["Tasks"] = "tasks";
        ProfileResourceType["Extensions"] = "extensions";
        ProfileResourceType["GlobalState"] = "globalState";
    })(ProfileResourceType || (exports.ProfileResourceType = ProfileResourceType = {}));
    function isUserDataProfile(thing) {
        const candidate = thing;
        return !!(candidate && typeof candidate === 'object'
            && typeof candidate.id === 'string'
            && typeof candidate.isDefault === 'boolean'
            && typeof candidate.name === 'string'
            && uri_1.URI.isUri(candidate.location)
            && uri_1.URI.isUri(candidate.globalStorageHome)
            && uri_1.URI.isUri(candidate.settingsResource)
            && uri_1.URI.isUri(candidate.keybindingsResource)
            && uri_1.URI.isUri(candidate.tasksResource)
            && uri_1.URI.isUri(candidate.snippetsHome)
            && uri_1.URI.isUri(candidate.extensionsResource));
    }
    exports.IUserDataProfilesService = (0, instantiation_1.createDecorator)('IUserDataProfilesService');
    function reviveProfile(profile, scheme) {
        return {
            id: profile.id,
            isDefault: profile.isDefault,
            name: profile.name,
            shortName: profile.shortName,
            icon: profile.icon,
            location: uri_1.URI.revive(profile.location).with({ scheme }),
            globalStorageHome: uri_1.URI.revive(profile.globalStorageHome).with({ scheme }),
            settingsResource: uri_1.URI.revive(profile.settingsResource).with({ scheme }),
            keybindingsResource: uri_1.URI.revive(profile.keybindingsResource).with({ scheme }),
            tasksResource: uri_1.URI.revive(profile.tasksResource).with({ scheme }),
            snippetsHome: uri_1.URI.revive(profile.snippetsHome).with({ scheme }),
            extensionsResource: uri_1.URI.revive(profile.extensionsResource).with({ scheme }),
            cacheHome: uri_1.URI.revive(profile.cacheHome).with({ scheme }),
            useDefaultFlags: profile.useDefaultFlags,
            isTransient: profile.isTransient,
        };
    }
    function toUserDataProfile(id, name, location, profilesCacheHome, options, defaultProfile) {
        return {
            id,
            name,
            location,
            isDefault: false,
            shortName: options?.shortName,
            icon: options?.icon,
            globalStorageHome: defaultProfile && options?.useDefaultFlags?.globalState ? defaultProfile.globalStorageHome : (0, resources_1.joinPath)(location, 'globalStorage'),
            settingsResource: defaultProfile && options?.useDefaultFlags?.settings ? defaultProfile.settingsResource : (0, resources_1.joinPath)(location, 'settings.json'),
            keybindingsResource: defaultProfile && options?.useDefaultFlags?.keybindings ? defaultProfile.keybindingsResource : (0, resources_1.joinPath)(location, 'keybindings.json'),
            tasksResource: defaultProfile && options?.useDefaultFlags?.tasks ? defaultProfile.tasksResource : (0, resources_1.joinPath)(location, 'tasks.json'),
            snippetsHome: defaultProfile && options?.useDefaultFlags?.snippets ? defaultProfile.snippetsHome : (0, resources_1.joinPath)(location, 'snippets'),
            extensionsResource: defaultProfile && options?.useDefaultFlags?.extensions ? defaultProfile.extensionsResource : (0, resources_1.joinPath)(location, 'extensions.json'),
            cacheHome: (0, resources_1.joinPath)(profilesCacheHome, id),
            useDefaultFlags: options?.useDefaultFlags,
            isTransient: options?.transient
        };
    }
    let UserDataProfilesService = class UserDataProfilesService extends lifecycle_1.Disposable {
        static { this.PROFILES_KEY = 'userDataProfiles'; }
        static { this.PROFILE_ASSOCIATIONS_KEY = 'profileAssociations'; }
        get defaultProfile() { return this.profiles[0]; }
        get profiles() { return [...this.profilesObject.profiles, ...this.transientProfilesObject.profiles]; }
        constructor(environmentService, fileService, uriIdentityService, logService) {
            super();
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this.enabled = true;
            this._onDidChangeProfiles = this._register(new event_1.Emitter());
            this.onDidChangeProfiles = this._onDidChangeProfiles.event;
            this._onWillCreateProfile = this._register(new event_1.Emitter());
            this.onWillCreateProfile = this._onWillCreateProfile.event;
            this._onWillRemoveProfile = this._register(new event_1.Emitter());
            this.onWillRemoveProfile = this._onWillRemoveProfile.event;
            this._onDidResetWorkspaces = this._register(new event_1.Emitter());
            this.onDidResetWorkspaces = this._onDidResetWorkspaces.event;
            this.profileCreationPromises = new Map();
            this.transientProfilesObject = {
                profiles: [],
                workspaces: new map_1.ResourceMap(),
                emptyWindows: new Map()
            };
            this.profilesHome = (0, resources_1.joinPath)(this.environmentService.userRoamingDataHome, 'profiles');
            this.profilesCacheHome = (0, resources_1.joinPath)(this.environmentService.cacheHome, 'CachedProfilesData');
        }
        init() {
            this._profilesObject = undefined;
        }
        setEnablement(enabled) {
            if (this.enabled !== enabled) {
                this._profilesObject = undefined;
                this.enabled = enabled;
            }
        }
        isEnabled() {
            return this.enabled;
        }
        get profilesObject() {
            if (!this._profilesObject) {
                const defaultProfile = this.createDefaultProfile();
                const profiles = [defaultProfile];
                if (this.enabled) {
                    try {
                        for (const storedProfile of this.getStoredProfiles()) {
                            if (!storedProfile.name || !(0, types_1.isString)(storedProfile.name) || !storedProfile.location) {
                                this.logService.warn('Skipping the invalid stored profile', storedProfile.location || storedProfile.name);
                                continue;
                            }
                            profiles.push(toUserDataProfile((0, resources_1.basename)(storedProfile.location), storedProfile.name, storedProfile.location, this.profilesCacheHome, { shortName: storedProfile.shortName, icon: storedProfile.icon, useDefaultFlags: storedProfile.useDefaultFlags }, defaultProfile));
                        }
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                }
                const workspaces = new map_1.ResourceMap();
                const emptyWindows = new Map();
                if (profiles.length) {
                    try {
                        const profileAssociaitions = this.getStoredProfileAssociations();
                        if (profileAssociaitions.workspaces) {
                            for (const [workspacePath, profileId] of Object.entries(profileAssociaitions.workspaces)) {
                                const workspace = uri_1.URI.parse(workspacePath);
                                const profile = profiles.find(p => p.id === profileId);
                                if (profile) {
                                    workspaces.set(workspace, profile);
                                }
                            }
                        }
                        if (profileAssociaitions.emptyWindows) {
                            for (const [windowId, profileId] of Object.entries(profileAssociaitions.emptyWindows)) {
                                const profile = profiles.find(p => p.id === profileId);
                                if (profile) {
                                    emptyWindows.set(windowId, profile);
                                }
                            }
                        }
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                }
                this._profilesObject = { profiles, workspaces, emptyWindows };
            }
            return this._profilesObject;
        }
        createDefaultProfile() {
            const defaultProfile = toUserDataProfile('__default__profile__', (0, nls_1.localize)('defaultProfile', "Default"), this.environmentService.userRoamingDataHome, this.profilesCacheHome);
            return { ...defaultProfile, extensionsResource: this.getDefaultProfileExtensionsLocation() ?? defaultProfile.extensionsResource, isDefault: true };
        }
        async createTransientProfile(workspaceIdentifier) {
            const namePrefix = `Temp`;
            const nameRegEx = new RegExp(`${(0, strings_1.escapeRegExpCharacters)(namePrefix)}\\s(\\d+)`);
            let nameIndex = 0;
            for (const profile of this.profiles) {
                const matches = nameRegEx.exec(profile.name);
                const index = matches ? parseInt(matches[1]) : 0;
                nameIndex = index > nameIndex ? index : nameIndex;
            }
            const name = `${namePrefix} ${nameIndex + 1}`;
            return this.createProfile((0, hash_1.hash)((0, uuid_1.generateUuid)()).toString(16), name, { transient: true }, workspaceIdentifier);
        }
        async createNamedProfile(name, options, workspaceIdentifier) {
            return this.createProfile((0, hash_1.hash)((0, uuid_1.generateUuid)()).toString(16), name, options, workspaceIdentifier);
        }
        async createProfile(id, name, options, workspaceIdentifier) {
            if (!this.enabled) {
                throw new Error(`Profiles are disabled in the current environment.`);
            }
            const profile = await this.doCreateProfile(id, name, options);
            if (workspaceIdentifier) {
                await this.setProfileForWorkspace(workspaceIdentifier, profile);
            }
            return profile;
        }
        async doCreateProfile(id, name, options) {
            if (!(0, types_1.isString)(name) || !name) {
                throw new Error('Name of the profile is mandatory and must be of type `string`');
            }
            let profileCreationPromise = this.profileCreationPromises.get(name);
            if (!profileCreationPromise) {
                profileCreationPromise = (async () => {
                    try {
                        const existing = this.profiles.find(p => p.name === name || p.id === id);
                        if (existing) {
                            return existing;
                        }
                        const profile = toUserDataProfile(id, name, (0, resources_1.joinPath)(this.profilesHome, id), this.profilesCacheHome, options, this.defaultProfile);
                        await this.fileService.createFolder(profile.location);
                        const joiners = [];
                        this._onWillCreateProfile.fire({
                            profile,
                            join(promise) {
                                joiners.push(promise);
                            }
                        });
                        await async_1.Promises.settled(joiners);
                        this.updateProfiles([profile], [], []);
                        return profile;
                    }
                    finally {
                        this.profileCreationPromises.delete(name);
                    }
                })();
                this.profileCreationPromises.set(name, profileCreationPromise);
            }
            return profileCreationPromise;
        }
        async updateProfile(profileToUpdate, options) {
            if (!this.enabled) {
                throw new Error(`Profiles are disabled in the current environment.`);
            }
            let profile = this.profiles.find(p => p.id === profileToUpdate.id);
            if (!profile) {
                throw new Error(`Profile '${profileToUpdate.name}' does not exist`);
            }
            profile = toUserDataProfile(profile.id, options.name ?? profile.name, profile.location, this.profilesCacheHome, {
                shortName: options.shortName ?? profile.shortName,
                icon: options.icon === null ? undefined : options.icon ?? profile.icon,
                transient: options.transient ?? profile.isTransient,
                useDefaultFlags: options.useDefaultFlags ?? profile.useDefaultFlags
            }, this.defaultProfile);
            this.updateProfiles([], [], [profile]);
            return profile;
        }
        async removeProfile(profileToRemove) {
            if (!this.enabled) {
                throw new Error(`Profiles are disabled in the current environment.`);
            }
            if (profileToRemove.isDefault) {
                throw new Error('Cannot remove default profile');
            }
            const profile = this.profiles.find(p => p.id === profileToRemove.id);
            if (!profile) {
                throw new Error(`Profile '${profileToRemove.name}' does not exist`);
            }
            const joiners = [];
            this._onWillRemoveProfile.fire({
                profile,
                join(promise) {
                    joiners.push(promise);
                }
            });
            try {
                await Promise.allSettled(joiners);
            }
            catch (error) {
                this.logService.error(error);
            }
            for (const windowId of [...this.profilesObject.emptyWindows.keys()]) {
                if (profile.id === this.profilesObject.emptyWindows.get(windowId)?.id) {
                    this.profilesObject.emptyWindows.delete(windowId);
                }
            }
            for (const workspace of [...this.profilesObject.workspaces.keys()]) {
                if (profile.id === this.profilesObject.workspaces.get(workspace)?.id) {
                    this.profilesObject.workspaces.delete(workspace);
                }
            }
            this.updateStoredProfileAssociations();
            this.updateProfiles([], [profile], []);
            try {
                await this.fileService.del(profile.cacheHome, { recursive: true });
            }
            catch (error) {
                if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.error(error);
                }
            }
        }
        async setProfileForWorkspace(workspaceIdentifier, profileToSet) {
            if (!this.enabled) {
                throw new Error(`Profiles are disabled in the current environment.`);
            }
            const profile = this.profiles.find(p => p.id === profileToSet.id);
            if (!profile) {
                throw new Error(`Profile '${profileToSet.name}' does not exist`);
            }
            this.updateWorkspaceAssociation(workspaceIdentifier, profile);
        }
        unsetWorkspace(workspaceIdentifier, transient) {
            if (!this.enabled) {
                throw new Error(`Profiles are disabled in the current environment.`);
            }
            this.updateWorkspaceAssociation(workspaceIdentifier, undefined, transient);
        }
        async resetWorkspaces() {
            this.transientProfilesObject.workspaces.clear();
            this.transientProfilesObject.emptyWindows.clear();
            this.profilesObject.workspaces.clear();
            this.profilesObject.emptyWindows.clear();
            this.updateStoredProfileAssociations();
            this._onDidResetWorkspaces.fire();
        }
        async cleanUp() {
            if (!this.enabled) {
                return;
            }
            if (await this.fileService.exists(this.profilesHome)) {
                const stat = await this.fileService.resolve(this.profilesHome);
                await Promise.all((stat.children || [])
                    .filter(child => child.isDirectory && this.profiles.every(p => !this.uriIdentityService.extUri.isEqual(p.location, child.resource)))
                    .map(child => this.fileService.del(child.resource, { recursive: true })));
            }
        }
        async cleanUpTransientProfiles() {
            if (!this.enabled) {
                return;
            }
            const unAssociatedTransientProfiles = this.transientProfilesObject.profiles.filter(p => !this.isProfileAssociatedToWorkspace(p));
            await Promise.allSettled(unAssociatedTransientProfiles.map(p => this.removeProfile(p)));
        }
        getProfileForWorkspace(workspaceIdentifier) {
            const workspace = this.getWorkspace(workspaceIdentifier);
            return uri_1.URI.isUri(workspace) ? this.transientProfilesObject.workspaces.get(workspace) ?? this.profilesObject.workspaces.get(workspace) : this.transientProfilesObject.emptyWindows.get(workspace) ?? this.profilesObject.emptyWindows.get(workspace);
        }
        getWorkspace(workspaceIdentifier) {
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceIdentifier)) {
                return workspaceIdentifier.uri;
            }
            if ((0, workspace_1.isWorkspaceIdentifier)(workspaceIdentifier)) {
                return workspaceIdentifier.configPath;
            }
            return workspaceIdentifier.id;
        }
        isProfileAssociatedToWorkspace(profile) {
            if ([...this.transientProfilesObject.emptyWindows.values()].some(windowProfile => this.uriIdentityService.extUri.isEqual(windowProfile.location, profile.location))) {
                return true;
            }
            if ([...this.transientProfilesObject.workspaces.values()].some(workspaceProfile => this.uriIdentityService.extUri.isEqual(workspaceProfile.location, profile.location))) {
                return true;
            }
            if ([...this.profilesObject.emptyWindows.values()].some(windowProfile => this.uriIdentityService.extUri.isEqual(windowProfile.location, profile.location))) {
                return true;
            }
            if ([...this.profilesObject.workspaces.values()].some(workspaceProfile => this.uriIdentityService.extUri.isEqual(workspaceProfile.location, profile.location))) {
                return true;
            }
            return false;
        }
        updateProfiles(added, removed, updated) {
            const allProfiles = [...this.profiles, ...added];
            const storedProfiles = [];
            this.transientProfilesObject.profiles = [];
            for (let profile of allProfiles) {
                if (profile.isDefault) {
                    continue;
                }
                if (removed.some(p => profile.id === p.id)) {
                    continue;
                }
                profile = updated.find(p => profile.id === p.id) ?? profile;
                if (profile.isTransient) {
                    this.transientProfilesObject.profiles.push(profile);
                }
                else {
                    storedProfiles.push({ location: profile.location, name: profile.name, shortName: profile.shortName, icon: profile.icon, useDefaultFlags: profile.useDefaultFlags });
                }
            }
            this.saveStoredProfiles(storedProfiles);
            this._profilesObject = undefined;
            this.triggerProfilesChanges(added, removed, updated);
        }
        triggerProfilesChanges(added, removed, updated) {
            this._onDidChangeProfiles.fire({ added, removed, updated, all: this.profiles });
        }
        updateWorkspaceAssociation(workspaceIdentifier, newProfile, transient) {
            // Force transient if the new profile to associate is transient
            transient = newProfile?.isTransient ? true : transient;
            if (!transient) {
                // Unset the transiet workspace association if any
                this.updateWorkspaceAssociation(workspaceIdentifier, undefined, true);
            }
            const workspace = this.getWorkspace(workspaceIdentifier);
            const profilesObject = transient ? this.transientProfilesObject : this.profilesObject;
            // Folder or Multiroot workspace
            if (uri_1.URI.isUri(workspace)) {
                profilesObject.workspaces.delete(workspace);
                if (newProfile) {
                    profilesObject.workspaces.set(workspace, newProfile);
                }
            }
            // Empty Window
            else {
                profilesObject.emptyWindows.delete(workspace);
                if (newProfile) {
                    profilesObject.emptyWindows.set(workspace, newProfile);
                }
            }
            if (!transient) {
                this.updateStoredProfileAssociations();
            }
        }
        updateStoredProfileAssociations() {
            const workspaces = {};
            for (const [workspace, profile] of this.profilesObject.workspaces.entries()) {
                workspaces[workspace.toString()] = profile.id;
            }
            const emptyWindows = {};
            for (const [windowId, profile] of this.profilesObject.emptyWindows.entries()) {
                emptyWindows[windowId.toString()] = profile.id;
            }
            this.saveStoredProfileAssociations({ workspaces, emptyWindows });
            this._profilesObject = undefined;
        }
        // TODO: @sandy081 Remove migration after couple of releases
        migrateStoredProfileAssociations(storedProfileAssociations) {
            const workspaces = {};
            const defaultProfile = this.createDefaultProfile();
            if (storedProfileAssociations.workspaces) {
                for (const [workspace, location] of Object.entries(storedProfileAssociations.workspaces)) {
                    const uri = uri_1.URI.parse(location);
                    workspaces[workspace] = this.uriIdentityService.extUri.isEqual(uri, defaultProfile.location) ? defaultProfile.id : this.uriIdentityService.extUri.basename(uri);
                }
            }
            const emptyWindows = {};
            if (storedProfileAssociations.emptyWindows) {
                for (const [workspace, location] of Object.entries(storedProfileAssociations.emptyWindows)) {
                    const uri = uri_1.URI.parse(location);
                    emptyWindows[workspace] = this.uriIdentityService.extUri.isEqual(uri, defaultProfile.location) ? defaultProfile.id : this.uriIdentityService.extUri.basename(uri);
                }
            }
            return { workspaces, emptyWindows };
        }
        getStoredProfiles() { return []; }
        saveStoredProfiles(storedProfiles) { throw new Error('not implemented'); }
        getStoredProfileAssociations() { return {}; }
        saveStoredProfileAssociations(storedProfileAssociations) { throw new Error('not implemented'); }
        getDefaultProfileExtensionsLocation() { return undefined; }
    };
    exports.UserDataProfilesService = UserDataProfilesService;
    exports.UserDataProfilesService = UserDataProfilesService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, log_1.ILogService)
    ], UserDataProfilesService);
    class InMemoryUserDataProfilesService extends UserDataProfilesService {
        constructor() {
            super(...arguments);
            this.storedProfiles = [];
            this.storedProfileAssociations = {};
        }
        getStoredProfiles() { return this.storedProfiles; }
        saveStoredProfiles(storedProfiles) { this.storedProfiles = storedProfiles; }
        getStoredProfileAssociations() { return this.storedProfileAssociations; }
        saveStoredProfileAssociations(storedProfileAssociations) { this.storedProfileAssociations = storedProfileAssociations; }
    }
    exports.InMemoryUserDataProfilesService = InMemoryUserDataProfilesService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVByb2ZpbGUvY29tbW9uL3VzZXJEYXRhUHJvZmlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFxRGhHLDhDQWVDO0lBb0RELHNDQWtCQztJQUVELDhDQWtCQztJQXpJRCxJQUFrQixtQkFPakI7SUFQRCxXQUFrQixtQkFBbUI7UUFDcEMsNENBQXFCLENBQUE7UUFDckIsa0RBQTJCLENBQUE7UUFDM0IsNENBQXFCLENBQUE7UUFDckIsc0NBQWUsQ0FBQTtRQUNmLGdEQUF5QixDQUFBO1FBQ3pCLGtEQUEyQixDQUFBO0lBQzVCLENBQUMsRUFQaUIsbUJBQW1CLG1DQUFuQixtQkFBbUIsUUFPcEM7SUF5QkQsU0FBZ0IsaUJBQWlCLENBQUMsS0FBYztRQUMvQyxNQUFNLFNBQVMsR0FBRyxLQUFxQyxDQUFDO1FBRXhELE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUyxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVE7ZUFDaEQsT0FBTyxTQUFTLENBQUMsRUFBRSxLQUFLLFFBQVE7ZUFDaEMsT0FBTyxTQUFTLENBQUMsU0FBUyxLQUFLLFNBQVM7ZUFDeEMsT0FBTyxTQUFTLENBQUMsSUFBSSxLQUFLLFFBQVE7ZUFDbEMsU0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO2VBQzdCLFNBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDO2VBQ3RDLFNBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDO2VBQ3JDLFNBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDO2VBQ3hDLFNBQUcsQ0FBQyxLQUFLLENBQUMsU0FB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