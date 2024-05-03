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
define(["require", "exports", "vs/base/common/codicons", "vs/platform/configuration/common/configuration", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/workbench/contrib/terminal/browser/terminalIcons", "vs/nls", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/theme/common/iconRegistry", "vs/base/common/path", "vs/platform/notification/common/notification"], function (require, exports, codicons_1, configuration_1, quickInput_1, terminalIcon_1, terminalIcons_1, nls, themeService_1, themables_1, terminal_1, iconRegistry_1, path_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalProfileQuickpick = void 0;
    let TerminalProfileQuickpick = class TerminalProfileQuickpick {
        constructor(_terminalProfileService, _terminalProfileResolverService, _configurationService, _quickInputService, _themeService, _notificationService) {
            this._terminalProfileService = _terminalProfileService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._configurationService = _configurationService;
            this._quickInputService = _quickInputService;
            this._themeService = _themeService;
            this._notificationService = _notificationService;
        }
        async showAndGetResult(type) {
            const platformKey = await this._terminalProfileService.getPlatformKey();
            const profilesKey = "terminal.integrated.profiles." /* TerminalSettingPrefix.Profiles */ + platformKey;
            const result = await this._createAndShow(type);
            const defaultProfileKey = `${"terminal.integrated.defaultProfile." /* TerminalSettingPrefix.DefaultProfile */}${platformKey}`;
            if (!result) {
                return;
            }
            if (type === 'setDefault') {
                if ('command' in result.profile) {
                    return; // Should never happen
                }
                else if ('id' in result.profile) {
                    // extension contributed profile
                    await this._configurationService.updateValue(defaultProfileKey, result.profile.title, 2 /* ConfigurationTarget.USER */);
                    return {
                        config: {
                            extensionIdentifier: result.profile.extensionIdentifier,
                            id: result.profile.id,
                            title: result.profile.title,
                            options: {
                                color: result.profile.color,
                                icon: result.profile.icon
                            }
                        },
                        keyMods: result.keyMods
                    };
                }
                // Add the profile to settings if necessary
                if ('isAutoDetected' in result.profile) {
                    const profilesConfig = await this._configurationService.getValue(profilesKey);
                    if (typeof profilesConfig === 'object') {
                        const newProfile = {
                            path: result.profile.path
                        };
                        if (result.profile.args) {
                            newProfile.args = result.profile.args;
                        }
                        profilesConfig[result.profile.profileName] = newProfile;
                    }
                    await this._configurationService.updateValue(profilesKey, profilesConfig, 2 /* ConfigurationTarget.USER */);
                }
                // Set the default profile
                await this._configurationService.updateValue(defaultProfileKey, result.profileName, 2 /* ConfigurationTarget.USER */);
            }
            else if (type === 'createInstance') {
                if ('id' in result.profile) {
                    return {
                        config: {
                            extensionIdentifier: result.profile.extensionIdentifier,
                            id: result.profile.id,
                            title: result.profile.title,
                            options: {
                                icon: result.profile.icon,
                                color: result.profile.color,
                            }
                        },
                        keyMods: result.keyMods
                    };
                }
                else {
                    return { config: result.profile, keyMods: result.keyMods };
                }
            }
            // for tests
            return 'profileName' in result.profile ? result.profile.profileName : result.profile.title;
        }
        async _createAndShow(type) {
            const platformKey = await this._terminalProfileService.getPlatformKey();
            const profiles = this._terminalProfileService.availableProfiles;
            const profilesKey = "terminal.integrated.profiles." /* TerminalSettingPrefix.Profiles */ + platformKey;
            const defaultProfileName = this._terminalProfileService.getDefaultProfileName();
            let keyMods;
            const options = {
                placeHolder: type === 'createInstance' ? nls.localize('terminal.integrated.selectProfileToCreate', "Select the terminal profile to create") : nls.localize('terminal.integrated.chooseDefaultProfile', "Select your default terminal profile"),
                onDidTriggerItemButton: async (context) => {
                    // Get the user's explicit permission to use a potentially unsafe path
                    if (!await this._isProfileSafe(context.item.profile)) {
                        return;
                    }
                    if ('command' in context.item.profile) {
                        return;
                    }
                    if ('id' in context.item.profile) {
                        return;
                    }
                    const configProfiles = this._configurationService.getValue("terminal.integrated.profiles." /* TerminalSettingPrefix.Profiles */ + platformKey);
                    const existingProfiles = !!configProfiles ? Object.keys(configProfiles) : [];
                    const name = await this._quickInputService.input({
                        prompt: nls.localize('enterTerminalProfileName', "Enter terminal profile name"),
                        value: context.item.profile.profileName,
                        validateInput: async (input) => {
                            if (existingProfiles.includes(input)) {
                                return nls.localize('terminalProfileAlreadyExists', "A terminal profile already exists with that name");
                            }
                            return undefined;
                        }
                    });
                    if (!name) {
                        return;
                    }
                    const newConfigValue = { ...configProfiles };
                    newConfigValue[name] = { path: context.item.profile.path };
                    if (context.item.profile.args) {
                        newConfigValue[name].args = context.item.profile.args;
                    }
                    if (context.item.profile.env) {
                        newConfigValue[name].env = context.item.profile.env;
                    }
                    await this._configurationService.updateValue(profilesKey, newConfigValue, 2 /* ConfigurationTarget.USER */);
                },
                onKeyMods: mods => keyMods = mods
            };
            // Build quick pick items
            const quickPickItems = [];
            const configProfiles = profiles.filter(e => !e.isAutoDetected);
            const autoDetectedProfiles = profiles.filter(e => e.isAutoDetected);
            if (configProfiles.length > 0) {
                quickPickItems.push({ type: 'separator', label: nls.localize('terminalProfiles', "profiles") });
                quickPickItems.push(...this._sortProfileQuickPickItems(configProfiles.map(e => this._createProfileQuickPickItem(e)), defaultProfileName));
            }
            quickPickItems.push({ type: 'separator', label: nls.localize('ICreateContributedTerminalProfileOptions', "contributed") });
            const contributedProfiles = [];
            for (const contributed of this._terminalProfileService.contributedProfiles) {
                let icon;
                if (typeof contributed.icon === 'string') {
                    if (contributed.icon.startsWith('$(')) {
                        icon = themables_1.ThemeIcon.fromString(contributed.icon);
                    }
                    else {
                        icon = themables_1.ThemeIcon.fromId(contributed.icon);
                    }
                }
                if (!icon || !(0, iconRegistry_1.getIconRegistry)().getIcon(icon.id)) {
                    icon = this._terminalProfileResolverService.getDefaultIcon();
                }
                const uriClasses = (0, terminalIcon_1.getUriClasses)(contributed, this._themeService.getColorTheme().type, true);
                const colorClass = (0, terminalIcon_1.getColorClass)(contributed);
                const iconClasses = [];
                if (uriClasses) {
                    iconClasses.push(...uriClasses);
                }
                if (colorClass) {
                    iconClasses.push(colorClass);
                }
                contributedProfiles.push({
                    label: `$(${icon.id}) ${contributed.title}`,
                    profile: {
                        extensionIdentifier: contributed.extensionIdentifier,
                        title: contributed.title,
                        icon: contributed.icon,
                        id: contributed.id,
                        color: contributed.color
                    },
                    profileName: contributed.title,
                    iconClasses
                });
            }
            if (contributedProfiles.length > 0) {
                quickPickItems.push(...this._sortProfileQuickPickItems(contributedProfiles, defaultProfileName));
            }
            if (autoDetectedProfiles.length > 0) {
                quickPickItems.push({ type: 'separator', label: nls.localize('terminalProfiles.detected', "detected") });
                quickPickItems.push(...this._sortProfileQuickPickItems(autoDetectedProfiles.map(e => this._createProfileQuickPickItem(e)), defaultProfileName));
            }
            const colorStyleDisposable = (0, terminalIcon_1.createColorStyleElement)(this._themeService.getColorTheme());
            const result = await this._quickInputService.pick(quickPickItems, options);
            colorStyleDisposable.dispose();
            if (!result) {
                return undefined;
            }
            if (!await this._isProfileSafe(result.profile)) {
                return undefined;
            }
            if (keyMods) {
                result.keyMods = keyMods;
            }
            return result;
        }
        async _isProfileSafe(profile) {
            const isUnsafePath = 'isUnsafePath' in profile && profile.isUnsafePath;
            const requiresUnsafePath = 'requiresUnsafePath' in profile && profile.requiresUnsafePath;
            if (!isUnsafePath && !requiresUnsafePath) {
                return true;
            }
            // Get the user's explicit permission to use a potentially unsafe path
            return await new Promise(r => {
                const unsafePaths = [];
                if (isUnsafePath) {
                    unsafePaths.push(profile.path);
                }
                if (requiresUnsafePath) {
                    unsafePaths.push(requiresUnsafePath);
                }
                // Notify about unsafe path(s). At the time of writing, multiple unsafe paths isn't
                // possible so the message is optimized for a single path.
                const handle = this._notificationService.prompt(notification_1.Severity.Warning, nls.localize('unsafePathWarning', 'This terminal profile uses a potentially unsafe path that can be modified by another user: {0}. Are you sure you want to use it?', `"${unsafePaths.join(',')}"`), [{
                        label: nls.localize('yes', 'Yes'),
                        run: () => r(true)
                    }, {
                        label: nls.localize('cancel', 'Cancel'),
                        run: () => r(false)
                    }]);
                handle.onDidClose(() => r(false));
            });
        }
        _createProfileQuickPickItem(profile) {
            const buttons = [{
                    iconClass: themables_1.ThemeIcon.asClassName(terminalIcons_1.configureTerminalProfileIcon),
                    tooltip: nls.localize('createQuickLaunchProfile', "Configure Terminal Profile")
                }];
            const icon = (profile.icon && themables_1.ThemeIcon.isThemeIcon(profile.icon)) ? profile.icon : codicons_1.Codicon.terminal;
            const label = `$(${icon.id}) ${profile.profileName}`;
            const friendlyPath = profile.isFromPath ? (0, path_1.basename)(profile.path) : profile.path;
            const colorClass = (0, terminalIcon_1.getColorClass)(profile);
            const iconClasses = [];
            if (colorClass) {
                iconClasses.push(colorClass);
            }
            if (profile.args) {
                if (typeof profile.args === 'string') {
                    return { label, description: `${profile.path} ${profile.args}`, profile, profileName: profile.profileName, buttons, iconClasses };
                }
                const argsString = profile.args.map(e => {
                    if (e.includes(' ')) {
                        return `"${e.replace(/"/g, '\\"')}"`; // CodeQL [SM02383] js/incomplete-sanitization This is only used as a label on the UI so this isn't a problem
                    }
                    return e;
                }).join(' ');
                return { label, description: `${friendlyPath} ${argsString}`, profile, profileName: profile.profileName, buttons, iconClasses };
            }
            return { label, description: friendlyPath, profile, profileName: profile.profileName, buttons, iconClasses };
        }
        _sortProfileQuickPickItems(items, defaultProfileName) {
            return items.sort((a, b) => {
                if (b.profileName === defaultProfileName) {
                    return 1;
                }
                if (a.profileName === defaultProfileName) {
                    return -1;
                }
                return a.profileName.localeCompare(b.profileName);
            });
        }
    };
    exports.TerminalProfileQuickpick = TerminalProfileQuickpick;
    exports.TerminalProfileQuickpick = TerminalProfileQuickpick = __decorate([
        __param(0, terminal_1.ITerminalProfileService),
        __param(1, terminal_1.ITerminalProfileResolverService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, themeService_1.IThemeService),
        __param(5, notification_1.INotificationService)
    ], TerminalProfileQuickpick);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9maWxlUXVpY2twaWNrLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsUHJvZmlsZVF1aWNrcGljay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQnpGLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXdCO1FBQ3BDLFlBQzJDLHVCQUFnRCxFQUN4QywrQkFBZ0UsRUFDMUUscUJBQTRDLEVBQy9DLGtCQUFzQyxFQUMzQyxhQUE0QixFQUNyQixvQkFBMEM7WUFMdkMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF5QjtZQUN4QyxvQ0FBK0IsR0FBL0IsK0JBQStCLENBQWlDO1lBQzFFLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDL0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUMzQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUNyQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1FBQzlFLENBQUM7UUFFTCxLQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBcUM7WUFDM0QsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDeEUsTUFBTSxXQUFXLEdBQUcsdUVBQWlDLFdBQVcsQ0FBQztZQUNqRSxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0MsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLGdGQUFvQyxHQUFHLFdBQVcsRUFBRSxDQUFDO1lBQ2xGLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksSUFBSSxLQUFLLFlBQVksRUFB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