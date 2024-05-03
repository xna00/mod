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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/objects", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/terminal/common/terminalPlatformConfiguration", "vs/platform/terminal/common/terminalProfiles", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/common/terminalExtensionPoints", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, arrays, objects, async_1, decorators_1, event_1, lifecycle_1, platform_1, configuration_1, contextkey_1, terminalPlatformConfiguration_1, terminalProfiles_1, terminal_1, terminalActions_1, terminalContextKey_1, terminalExtensionPoints_1, environmentService_1, extensions_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalProfileService = void 0;
    /*
     * Links TerminalService with TerminalProfileResolverService
     * and keeps the available terminal profiles updated
     */
    let TerminalProfileService = class TerminalProfileService extends lifecycle_1.Disposable {
        get onDidChangeAvailableProfiles() { return this._onDidChangeAvailableProfiles.event; }
        get profilesReady() { return this._profilesReadyPromise; }
        get availableProfiles() {
            if (!this._platformConfigJustRefreshed) {
                this.refreshAvailableProfiles();
            }
            return this._availableProfiles || [];
        }
        get contributedProfiles() {
            const userConfiguredProfileNames = this._availableProfiles?.map(p => p.profileName) || [];
            // Allow a user defined profile to override an extension contributed profile with the same name
            return this._contributedProfiles?.filter(p => !userConfiguredProfileNames.includes(p.title)) || [];
        }
        constructor(_contextKeyService, _configurationService, _terminalContributionService, _extensionService, _remoteAgentService, _environmentService, _terminalInstanceService) {
            super();
            this._contextKeyService = _contextKeyService;
            this._configurationService = _configurationService;
            this._terminalContributionService = _terminalContributionService;
            this._extensionService = _extensionService;
            this._remoteAgentService = _remoteAgentService;
            this._environmentService = _environmentService;
            this._terminalInstanceService = _terminalInstanceService;
            this._contributedProfiles = [];
            this._platformConfigJustRefreshed = false;
            this._profileProviders = new Map();
            this._onDidChangeAvailableProfiles = this._register(new event_1.Emitter());
            // in web, we don't want to show the dropdown unless there's a web extension
            // that contributes a profile
            this._extensionService.onDidChangeExtensions(() => this.refreshAvailableProfiles());
            this._webExtensionContributedProfileContextKey = terminalContextKey_1.TerminalContextKeys.webExtensionContributedProfile.bindTo(this._contextKeyService);
            this._updateWebContextKey();
            this._profilesReadyPromise = this._remoteAgentService.getEnvironment()
                .then(() => {
                // Wait up to 20 seconds for profiles to be ready so it's assured that we know the actual
                // default terminal before launching the first terminal. This isn't expected to ever take
                // this long.
                this._profilesReadyBarrier = new async_1.AutoOpenBarrier(20000);
                return this._profilesReadyBarrier.wait().then(() => { });
            });
            this.refreshAvailableProfiles();
            this._setupConfigListener();
        }
        async _setupConfigListener() {
            const platformKey = await this.getPlatformKey();
            this._register(this._configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration("terminal.integrated.automationProfile." /* TerminalSettingPrefix.AutomationProfile */ + platformKey) ||
                    e.affectsConfiguration("terminal.integrated.defaultProfile." /* TerminalSettingPrefix.DefaultProfile */ + platformKey) ||
                    e.affectsConfiguration("terminal.integrated.profiles." /* TerminalSettingPrefix.Profiles */ + platformKey) ||
                    e.affectsConfiguration("terminal.integrated.useWslProfiles" /* TerminalSettingId.UseWslProfiles */)) {
                    if (e.source !== 7 /* ConfigurationTarget.DEFAULT */) {
                        // when _refreshPlatformConfig is called within refreshAvailableProfiles
                        // on did change configuration is fired. this can lead to an infinite recursion
                        this.refreshAvailableProfiles();
                        this._platformConfigJustRefreshed = false;
                    }
                    else {
                        this._platformConfigJustRefreshed = true;
                    }
                }
            }));
        }
        getDefaultProfileName() {
            return this._defaultProfileName;
        }
        getDefaultProfile(os) {
            let defaultProfileName;
            if (os) {
                defaultProfileName = this._configurationService.getValue(`${"terminal.integrated.defaultProfile." /* TerminalSettingPrefix.DefaultProfile */}${this._getOsKey(os)}`);
                if (!defaultProfileName || typeof defaultProfileName !== 'string') {
                    return undefined;
                }
            }
            else {
                defaultProfileName = this._defaultProfileName;
            }
            if (!defaultProfileName) {
                return undefined;
            }
            // IMPORTANT: Only allow the default profile name to find non-auto detected profiles as
            // to avoid unsafe path profiles being picked up.
            return this.availableProfiles.find(e => e.profileName === defaultProfileName && !e.isAutoDetected);
        }
        _getOsKey(os) {
            switch (os) {
                case 3 /* OperatingSystem.Linux */: return 'linux';
                case 2 /* OperatingSystem.Macintosh */: return 'osx';
                case 1 /* OperatingSystem.Windows */: return 'windows';
            }
        }
        refreshAvailableProfiles() {
            this._refreshAvailableProfilesNow();
        }
        async _refreshAvailableProfilesNow() {
            // Profiles
            const profiles = await this._detectProfiles(true);
            const profilesChanged = !arrays.equals(profiles, this._availableProfiles, profilesEqual);
            // Contributed profiles
            const contributedProfilesChanged = await this._updateContributedProfiles();
            // Automation profiles
            const platform = await this.getPlatformKey();
            const automationProfile = this._configurationService.getValue(`${"terminal.integrated.automationProfile." /* TerminalSettingPrefix.AutomationProfile */}${platform}`);
            const automationProfileChanged = !objects.equals(automationProfile, this._automationProfile);
            // Update
            if (profilesChanged || contributedProfilesChanged || automationProfileChanged) {
                this._availableProfiles = profiles;
                this._automationProfile = automationProfile;
                this._onDidChangeAvailableProfiles.fire(this._availableProfiles);
                this._profilesReadyBarrier.open();
                this._updateWebContextKey();
                await this._refreshPlatformConfig(this._availableProfiles);
            }
        }
        async _updateContributedProfiles() {
            const platformKey = await this.getPlatformKey();
            const excludedContributedProfiles = [];
            const configProfiles = this._configurationService.getValue("terminal.integrated.profiles." /* TerminalSettingPrefix.Profiles */ + platformKey);
            for (const [profileName, value] of Object.entries(configProfiles)) {
                if (value === null) {
                    excludedContributedProfiles.push(profileName);
                }
            }
            const filteredContributedProfiles = Array.from(this._terminalContributionService.terminalProfiles.filter(p => !excludedContributedProfiles.includes(p.title)));
            const contributedProfilesChanged = !arrays.equals(filteredContributedProfiles, this._contributedProfiles, contributedProfilesEqual);
            this._contributedProfiles = filteredContributedProfiles;
            return contributedProfilesChanged;
        }
        getContributedProfileProvider(extensionIdentifier, id) {
            const extMap = this._profileProviders.get(extensionIdentifier);
            return extMap?.get(id);
        }
        async _detectProfiles(includeDetectedProfiles) {
            const primaryBackend = await this._terminalInstanceService.getBackend(this._environmentService.remoteAuthority);
            if (!primaryBackend) {
                return this._availableProfiles || [];
            }
            const platform = await this.getPlatformKey();
            this._defaultProfileName = this._configurationService.getValue(`${"terminal.integrated.defaultProfile." /* TerminalSettingPrefix.DefaultProfile */}${platform}`) ?? undefined;
            return primaryBackend.getProfiles(this._configurationService.getValue(`${"terminal.integrated.profiles." /* TerminalSettingPrefix.Profiles */}${platform}`), this._defaultProfileName, includeDetectedProfiles);
        }
        _updateWebContextKey() {
            this._webExtensionContributedProfileContextKey.set(platform_1.isWeb && this._contributedProfiles.length > 0);
        }
        async _refreshPlatformConfig(profiles) {
            const env = await this._remoteAgentService.getEnvironment();
            (0, terminalPlatformConfiguration_1.registerTerminalDefaultProfileConfiguration)({ os: env?.os || platform_1.OS, profiles }, this._contributedProfiles);
            (0, terminalActions_1.refreshTerminalActions)(profiles);
        }
        async getPlatformKey() {
            const env = await this._remoteAgentService.getEnvironment();
            if (env) {
                return env.os === 1 /* OperatingSystem.Windows */ ? 'windows' : (env.os === 2 /* OperatingSystem.Macintosh */ ? 'osx' : 'linux');
            }
            return platform_1.isWindows ? 'windows' : (platform_1.isMacintosh ? 'osx' : 'linux');
        }
        registerTerminalProfileProvider(extensionIdentifier, id, profileProvider) {
            let extMap = this._profileProviders.get(extensionIdentifier);
            if (!extMap) {
                extMap = new Map();
                this._profileProviders.set(extensionIdentifier, extMap);
            }
            extMap.set(id, profileProvider);
            return (0, lifecycle_1.toDisposable)(() => this._profileProviders.delete(id));
        }
        async registerContributedProfile(args) {
            const platformKey = await this.getPlatformKey();
            const profilesConfig = await this._configurationService.getValue(`${"terminal.integrated.profiles." /* TerminalSettingPrefix.Profiles */}${platformKey}`);
            if (typeof profilesConfig === 'object') {
                const newProfile = {
                    extensionIdentifier: args.extensionIdentifier,
                    icon: args.options.icon,
                    id: args.id,
                    title: args.title,
                    color: args.options.color
                };
                profilesConfig[args.title] = newProfile;
            }
            await this._configurationService.updateValue(`${"terminal.integrated.profiles." /* TerminalSettingPrefix.Profiles */}${platformKey}`, profilesConfig, 2 /* ConfigurationTarget.USER */);
            return;
        }
        async getContributedDefaultProfile(shellLaunchConfig) {
            // prevents recursion with the MainThreadTerminalService call to create terminal
            // and defers to the provided launch config when an executable is provided
            if (shellLaunchConfig && !shellLaunchConfig.extHostTerminalId && !('executable' in shellLaunchConfig)) {
                const key = await this.getPlatformKey();
                const defaultProfileName = this._configurationService.getValue(`${"terminal.integrated.defaultProfile." /* TerminalSettingPrefix.DefaultProfile */}${key}`);
                const contributedDefaultProfile = this.contributedProfiles.find(p => p.title === defaultProfileName);
                return contributedDefaultProfile;
            }
            return undefined;
        }
    };
    exports.TerminalProfileService = TerminalProfileService;
    __decorate([
        (0, decorators_1.throttle)(2000)
    ], TerminalProfileService.prototype, "refreshAvailableProfiles", null);
    exports.TerminalProfileService = TerminalProfileService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, terminalExtensionPoints_1.ITerminalContributionService),
        __param(3, extensions_1.IExtensionService),
        __param(4, remoteAgentService_1.IRemoteAgentService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, terminal_1.ITerminalInstanceService)
    ], TerminalProfileService);
    function profilesEqual(one, other) {
        return one.profileName === other.profileName &&
            (0, terminalProfiles_1.terminalProfileArgsMatch)(one.args, other.args) &&
            one.color === other.color &&
            (0, terminalProfiles_1.terminalIconsEqual)(one.icon, other.icon) &&
            one.isAutoDetected === other.isAutoDetected &&
            one.isDefault === other.isDefault &&
            one.overrideName === other.overrideName &&
            one.path === other.path;
    }
    function contributedProfilesEqual(one, other) {
        return one.extensionIdentifier === other.extensionIdentifier &&
            one.color === other.color &&
            one.icon === other.icon &&
            one.id === other.id &&
            one.title === other.title;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9maWxlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbFByb2ZpbGVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXVCaEc7OztPQUdHO0lBQ0ksSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSxzQkFBVTtRQWNyRCxJQUFJLDRCQUE0QixLQUFnQyxPQUFPLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRWxILElBQUksYUFBYSxLQUFvQixPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7UUFDekUsSUFBSSxpQkFBaUI7WUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUNqQyxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsa0JBQWtCLElBQUksRUFBRSxDQUFDO1FBQ3RDLENBQUM7UUFDRCxJQUFJLG1CQUFtQjtZQUN0QixNQUFNLDBCQUEwQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzFGLCtGQUErRjtZQUMvRixPQUFPLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDcEcsQ0FBQztRQUVELFlBQ3FCLGtCQUF1RCxFQUNw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