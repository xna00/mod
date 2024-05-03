/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/userDataProfile/common/userDataProfile", "vs/base/common/uriIpc"], function (require, exports, event_1, lifecycle_1, userDataProfile_1, uriIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfilesService = exports.RemoteUserDataProfilesServiceChannel = void 0;
    class RemoteUserDataProfilesServiceChannel {
        constructor(service, getUriTransformer) {
            this.service = service;
            this.getUriTransformer = getUriTransformer;
        }
        listen(context, event) {
            const uriTransformer = this.getUriTransformer(context);
            switch (event) {
                case 'onDidChangeProfiles': return event_1.Event.map(this.service.onDidChangeProfiles, e => {
                    return {
                        all: e.all.map(p => (0, uriIpc_1.transformOutgoingURIs)({ ...p }, uriTransformer)),
                        added: e.added.map(p => (0, uriIpc_1.transformOutgoingURIs)({ ...p }, uriTransformer)),
                        removed: e.removed.map(p => (0, uriIpc_1.transformOutgoingURIs)({ ...p }, uriTransformer)),
                        updated: e.updated.map(p => (0, uriIpc_1.transformOutgoingURIs)({ ...p }, uriTransformer))
                    };
                });
            }
            throw new Error(`Invalid listen ${event}`);
        }
        async call(context, command, args) {
            const uriTransformer = this.getUriTransformer(context);
            switch (command) {
                case 'createProfile': {
                    const profile = await this.service.createProfile(args[0], args[1], args[2]);
                    return (0, uriIpc_1.transformOutgoingURIs)({ ...profile }, uriTransformer);
                }
                case 'updateProfile': {
                    let profile = (0, userDataProfile_1.reviveProfile)((0, uriIpc_1.transformIncomingURIs)(args[0], uriTransformer), this.service.profilesHome.scheme);
                    profile = await this.service.updateProfile(profile, args[1]);
                    return (0, uriIpc_1.transformOutgoingURIs)({ ...profile }, uriTransformer);
                }
                case 'removeProfile': {
                    const profile = (0, userDataProfile_1.reviveProfile)((0, uriIpc_1.transformIncomingURIs)(args[0], uriTransformer), this.service.profilesHome.scheme);
                    return this.service.removeProfile(profile);
                }
            }
            throw new Error(`Invalid call ${command}`);
        }
    }
    exports.RemoteUserDataProfilesServiceChannel = RemoteUserDataProfilesServiceChannel;
    class UserDataProfilesService extends lifecycle_1.Disposable {
        get defaultProfile() { return this.profiles[0]; }
        get profiles() { return this._profiles; }
        constructor(profiles, profilesHome, channel) {
            super();
            this.profilesHome = profilesHome;
            this.channel = channel;
            this._profiles = [];
            this._onDidChangeProfiles = this._register(new event_1.Emitter());
            this.onDidChangeProfiles = this._onDidChangeProfiles.event;
            this.enabled = true;
            this._profiles = profiles.map(profile => (0, userDataProfile_1.reviveProfile)(profile, this.profilesHome.scheme));
            this._register(this.channel.listen('onDidChangeProfiles')(e => {
                const added = e.added.map(profile => (0, userDataProfile_1.reviveProfile)(profile, this.profilesHome.scheme));
                const removed = e.removed.map(profile => (0, userDataProfile_1.reviveProfile)(profile, this.profilesHome.scheme));
                const updated = e.updated.map(profile => (0, userDataProfile_1.reviveProfile)(profile, this.profilesHome.scheme));
                this._profiles = e.all.map(profile => (0, userDataProfile_1.reviveProfile)(profile, this.profilesHome.scheme));
                this._onDidChangeProfiles.fire({ added, removed, updated, all: this.profiles });
            }));
            this.onDidResetWorkspaces = this.channel.listen('onDidResetWorkspaces');
        }
        setEnablement(enabled) {
            this.enabled = enabled;
        }
        isEnabled() {
            return this.enabled;
        }
        async createNamedProfile(name, options, workspaceIdentifier) {
            const result = await this.channel.call('createNamedProfile', [name, options, workspaceIdentifier]);
            return (0, userDataProfile_1.reviveProfile)(result, this.profilesHome.scheme);
        }
        async createProfile(id, name, options, workspaceIdentifier) {
            const result = await this.channel.call('createProfile', [id, name, options, workspaceIdentifier]);
            return (0, userDataProfile_1.reviveProfile)(result, this.profilesHome.scheme);
        }
        async createTransientProfile(workspaceIdentifier) {
            const result = await this.channel.call('createTransientProfile', [workspaceIdentifier]);
            return (0, userDataProfile_1.reviveProfile)(result, this.profilesHome.scheme);
        }
        async setProfileForWorkspace(workspaceIdentifier, profile) {
            await this.channel.call('setProfileForWorkspace', [workspaceIdentifier, profile]);
        }
        removeProfile(profile) {
            return this.channel.call('removeProfile', [profile]);
        }
        async updateProfile(profile, updateOptions) {
            const result = await this.channel.call('updateProfile', [profile, updateOptions]);
            return (0, userDataProfile_1.reviveProfile)(result, this.profilesHome.scheme);
        }
        resetWorkspaces() {
            return this.channel.call('resetWorkspaces');
        }
        cleanUp() {
            return this.channel.call('cleanUp');
        }
        cleanUpTransientProfiles() {
            return this.channel.call('cleanUpTransientProfiles');
        }
    }
    exports.UserDataProfilesService = UserDataProfilesService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVByb2ZpbGUvY29tbW9uL3VzZXJEYXRhUHJvZmlsZUlwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSxvQ0FBb0M7UUFFaEQsWUFDa0IsT0FBaUMsRUFDakMsaUJBQTJEO1lBRDNELFlBQU8sR0FBUCxPQUFPLENBQTBCO1lBQ2pDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBMEM7UUFDekUsQ0FBQztRQUVMLE1BQU0sQ0FBQyxPQUFZLEVBQUUsS0FBYTtZQUNqQyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkQsUUFBUSxLQUFLLEVBQUUsQ0FBQztnQkFDZixLQUFLLHFCQUFxQixDQUFDLENBQUMsT0FBTyxhQUFLLENBQUMsR0FBRyxDQUFpRCxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxFQUFFO29CQUNsSSxPQUFPO3dCQUNOLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUEsOEJBQXFCLEVBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLGNBQWMsQ0FBQyxDQUFDO3dCQUNwRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLDhCQUFxQixFQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQzt3QkFDeEUsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBQSw4QkFBcUIs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