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
define(["require", "exports", "vs/base/common/network", "vs/base/common/process", "vs/platform/configuration/common/configuration", "vs/platform/workspace/common/workspace", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/history/common/history", "vs/base/common/platform", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/path", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/decorators", "vs/base/common/themables", "vs/base/common/uri", "vs/base/common/objects", "vs/platform/terminal/common/terminalProfiles", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, network_1, process_1, configuration_1, workspace_1, configurationResolver_1, history_1, platform_1, terminal_1, terminal_2, path, codicons_1, iconRegistry_1, remoteAgentService_1, decorators_1, themables_1, uri_1, objects_1, terminalProfiles_1, terminal_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserTerminalProfileResolverService = exports.BaseTerminalProfileResolverService = void 0;
    const generatedProfileName = 'Generated';
    /*
     * Resolves terminal shell launch config and terminal profiles for the given operating system,
     * environment, and user configuration.
     */
    class BaseTerminalProfileResolverService {
        get defaultProfileName() { return this._defaultProfileName; }
        constructor(_context, _configurationService, _configurationResolverService, _historyService, _logService, _terminalProfileService, _workspaceContextService, _remoteAgentService) {
            this._context = _context;
            this._configurationService = _configurationService;
            this._configurationResolverService = _configurationResolverService;
            this._historyService = _historyService;
            this._logService = _logService;
            this._terminalProfileService = _terminalProfileService;
            this._workspaceContextService = _workspaceContextService;
            this._remoteAgentService = _remoteAgentService;
            this._iconRegistry = (0, iconRegistry_1.getIconRegistry)();
            if (this._remoteAgentService.getConnection()) {
                this._remoteAgentService.getEnvironment().then(env => this._primaryBackendOs = env?.os || platform_1.OS);
            }
            else {
                this._primaryBackendOs = platform_1.OS;
            }
            this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.defaultProfile.windows" /* TerminalSettingId.DefaultProfileWindows */) ||
                    e.affectsConfiguration("terminal.integrated.defaultProfile.osx" /* TerminalSettingId.DefaultProfileMacOs */) ||
                    e.affectsConfiguration("terminal.integrated.defaultProfile.linux" /* TerminalSettingId.DefaultProfileLinux */)) {
                    this._refreshDefaultProfileName();
                }
            });
            this._terminalProfileService.onDidChangeAvailableProfiles(() => this._refreshDefaultProfileName());
        }
        async _refreshDefaultProfileName() {
            if (this._primaryBackendOs) {
                this._defaultProfileName = (await this.getDefaultProfile({
                    remoteAuthority: this._remoteAgentService.getConnection()?.remoteAuthority,
                    os: this._primaryBackendOs
                }))?.profileName;
            }
        }
        resolveIcon(shellLaunchConfig, os) {
            if (shellLaunchConfig.icon) {
                shellLaunchConfig.icon = this._getCustomIcon(shellLaunchConfig.icon) || this.getDefaultIcon();
                return;
            }
            if (shellLaunchConfig.customPtyImplementation) {
                shellLaunchConfig.icon = this.getDefaultIcon();
                return;
            }
            if (shellLaunchConfig.executable) {
                return;
            }
            const defaultProfile = this._getUnresolvedRealDefaultProfile(os);
            if (defaultProfile) {
                shellLaunchConfig.icon = defaultProfile.icon;
            }
            if (!shellLaunchConfig.icon) {
                shellLaunchConfig.icon = this.getDefaultIcon();
            }
        }
        getDefaultIcon(resource) {
            return this._iconRegistry.getIcon(this._configurationService.getValue("terminal.integrated.tabs.defaultIcon" /* TerminalSettingId.TabsDefaultIcon */, { resource })) || codicons_1.Codicon.terminal;
        }
        async resolveShellLaunchConfig(shellLaunchConfig, options) {
            // Resolve the shell and shell args
            let resolvedProfile;
            if (shellLaunchConfig.executable) {
                resolvedProfile = await this._resolveProfile({
                    path: shellLaunchConfig.executable,
                    args: shellLaunchConfig.args,
                    profileName: generatedProfileName,
                    isDefault: false
                }, options);
            }
            else {
                resolvedProfile = await this.getDefaultProfile(options);
            }
            shellLaunchConfig.executable = resolvedProfile.path;
            shellLaunchConfig.args = resolvedProfile.args;
            if (resolvedProfile.env) {
                if (shellLaunchConfig.env) {
                    shellLaunchConfig.env = { ...shellLaunchConfig.env, ...resolvedProfile.env };
                }
                else {
                    shellLaunchConfig.env = resolvedProfile.env;
                }
            }
            // Verify the icon is valid, and fallback correctly to the generic terminal id if there is
            // an issue
            const resource = shellLaunchConfig === undefined || typeof shellLaunchConfig.cwd === 'string' ? undefined : shellLaunchConfig.cwd;
            shellLaunchConfig.icon = this._getCustomIcon(shellLaunchConfig.icon)
                || this._getCustomIcon(resolvedProfile.icon)
                || this.getDefaultIcon(resource);
            // Override the name if specified
            if (resolvedProfile.overrideName) {
                shellLaunchConfig.name = resolvedProfile.profileName;
            }
            // Apply the color
            shellLaunchConfig.color = shellLaunchConfig.color
                || resolvedProfile.color
                || this._configurationService.getValue("terminal.integrated.tabs.defaultColor" /* TerminalSettingId.TabsDefaultColor */, { resource });
            // Resolve useShellEnvironment based on the setting if it's not set
            if (shellLaunchConfig.useShellEnvironment === undefined) {
                shellLaunchConfig.useShellEnvironment = this._configurationService.getValue("terminal.integrated.inheritEnv" /* TerminalSettingId.InheritEnv */);
            }
        }
        async getDefaultShell(options) {
            return (await this.getDefaultProfile(options)).path;
        }
        async getDefaultShellArgs(options) {
            return (await this.getDefaultProfile(options)).args || [];
        }
        async getDefaultProfile(options) {
            return this._resolveProfile(await this._getUnresolvedDefaultProfile(options), options);
        }
        getEnvironment(remoteAuthority) {
            return this._context.getEnvironment(remoteAuthority);
        }
        _getCustomIcon(icon) {
            if (!icon) {
                return undefined;
            }
            if (typeof icon === 'string') {
                return themables_1.ThemeIcon.fromId(icon);
            }
            if (themables_1.ThemeIcon.isThemeIcon(icon)) {
                return icon;
            }
            if (uri_1.URI.isUri(icon) || (0, terminalProfiles_1.isUriComponents)(icon)) {
                return uri_1.URI.revive(icon);
            }
            if (typeof icon === 'object' && 'light' in icon && 'dark' in icon) {
                const castedIcon = icon;
                if ((uri_1.URI.isUri(castedIcon.light) || (0, terminalProfiles_1.isUriComponents)(castedIcon.light)) && (uri_1.URI.isUri(castedIcon.dark) || (0, terminalProfiles_1.isUriComponents)(castedIcon.dark))) {
                    return { light: uri_1.URI.revive(castedIcon.light), dark: uri_1.URI.revive(castedIcon.dark) };
                }
            }
            return undefined;
        }
        async _getUnresolvedDefaultProfile(options) {
            // If automation shell is allowed, prefer that
            if (options.allowAutomationShell) {
                const automationShellProfile = this._getUnresolvedAutomationShellProfile(options);
                if (automationShellProfile) {
                    return automationShellProfile;
                }
            }
            // Return the real default profile if it exists and is valid, wait for profiles to be ready
            // if the window just opened
            await this._terminalProfileService.profilesReady;
            const defaultProfile = this._getUnresolvedRealDefaultProfile(options.os);
            if (defaultProfile) {
                return this._setIconForAutomation(options, defaultProfile);
            }
            // If there is no real default profile, create a fallback default profile based on the shell
            // and shellArgs settings in addition to the current environment.
            return this._setIconForAutomation(options, await this._getUnresolvedFallbackDefaultProfile(options));
        }
        _setIconForAutomation(options, profile) {
            if (options.allowAutomationShell) {
                const profileClone = (0, objects_1.deepClone)(profile);
                profileClone.icon = codicons_1.Codicon.tools;
                return profileClone;
            }
            return profile;
        }
        _getUnresolvedRealDefaultProfile(os) {
            return this._terminalProfileService.getDefaultProfile(os);
        }
        async _getUnresolvedFallbackDefaultProfile(options) {
            const executable = await this._context.getDefaultSystemShell(options.remoteAuthority, options.os);
            // Try select an existing profile to fallback to, based on the default system shell, only do
            // this when it is NOT a local terminal in a remote window where the front and back end OS
            // differs (eg. Windows -> WSL, Mac -> Linux)
            if (options.os === platform_1.OS) {
                let existingProfile = this._terminalProfileService.availableProfiles.find(e => path.parse(e.path).name === path.parse(executable).name);
                if (existingProfile) {
                    if (options.allowAutomationShell) {
                        existingProfile = (0, objects_1.deepClone)(existingProfile);
                        existingProfile.icon = codicons_1.Codicon.tools;
                    }
                    return existingProfile;
                }
            }
            // Finally fallback to a generated profile
            let args;
            if (options.os === 2 /* OperatingSystem.Macintosh */ && path.parse(executable).name.match(/(zsh|bash)/)) {
                // macOS should launch a login shell by default
                args = ['--login'];
            }
            else {
                // Resolve undefined to []
                args = [];
            }
            const icon = this._guessProfileIcon(executable);
            return {
                profileName: generatedProfileName,
                path: executable,
                args,
                icon,
                isDefault: false
            };
        }
        _getUnresolvedAutomationShellProfile(options) {
            const automationProfile = this._configurationService.getValue(`terminal.integrated.automationProfile.${this._getOsKey(options.os)}`);
            if (this._isValidAutomationProfile(automationProfile, options.os)) {
                automationProfile.icon = this._getCustomIcon(automationProfile.icon) || codicons_1.Codicon.tools;
                return automationProfile;
            }
            return undefined;
        }
        async _resolveProfile(profile, options) {
            const env = await this._context.getEnvironment(options.remoteAuthority);
            if (options.os === 1 /* OperatingSystem.Windows */) {
                // Change Sysnative to System32 if the OS is Windows but NOT WoW64. It's
                // safe to assume that this was used by accident as Sysnative does not
                // exist and will break the terminal in non-WoW64 environments.
                const isWoW64 = !!env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
                const windir = env.windir;
                if (!isWoW64 && windir) {
                    const sysnativePath = path.join(windir, 'Sysnative').replace(/\//g, '\\').toLowerCase();
                    if (profile.path && profile.path.toLowerCase().indexOf(sysnativePath) === 0) {
                        profile.path = path.join(windir, 'System32', profile.path.substr(sysnativePath.length + 1));
                    }
                }
                // Convert / to \ on Windows for convenience
                if (profile.path) {
                    profile.path = profile.path.replace(/\//g, '\\');
                }
            }
            // Resolve path variables
            const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot(options.remoteAuthority ? network_1.Schemas.vscodeRemote : network_1.Schemas.file);
            const lastActiveWorkspace = activeWorkspaceRootUri ? this._workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri) ?? undefined : undefined;
            profile.path = await this._resolveVariables(profile.path, env, lastActiveWorkspace);
            // Resolve args variables
            if (profile.args) {
                if (typeof profile.args === 'string') {
                    profile.args = await this._resolveVariables(profile.args, env, lastActiveWorkspace);
                }
                else {
                    profile.args = await Promise.all(profile.args.map(arg => this._resolveVariables(arg, env, lastActiveWorkspace)));
                }
            }
            return profile;
        }
        async _resolveVariables(value, env, lastActiveWorkspace) {
            try {
                value = await this._configurationResolverService.resolveWithEnvironment(env, lastActiveWorkspace, value);
            }
            catch (e) {
                this._logService.error(`Could not resolve shell`, e);
            }
            return value;
        }
        _getOsKey(os) {
            switch (os) {
                case 3 /* OperatingSystem.Linux */: return 'linux';
                case 2 /* OperatingSystem.Macintosh */: return 'osx';
                case 1 /* OperatingSystem.Windows */: return 'windows';
            }
        }
        _guessProfileIcon(shell) {
            const file = path.parse(shell).name;
            switch (file) {
                case 'bash':
                    return codicons_1.Codicon.terminalBash;
                case 'pwsh':
                case 'powershell':
                    return codicons_1.Codicon.terminalPowershell;
                case 'tmux':
                    return codicons_1.Codicon.terminalTmux;
                case 'cmd':
                    return codicons_1.Codicon.terminalCmd;
                default:
                    return undefined;
            }
        }
        _isValidAutomationProfile(profile, os) {
            if (profile === null || profile === undefined || typeof profile !== 'object') {
                return false;
            }
            if ('path' in profile && typeof profile.path === 'string') {
                return true;
            }
            return false;
        }
    }
    exports.BaseTerminalProfileResolverService = BaseTerminalProfileResolverService;
    __decorate([
        (0, decorators_1.debounce)(200)
    ], BaseTerminalProfileResolverService.prototype, "_refreshDefaultProfileName", null);
    let BrowserTerminalProfileResolverService = class BrowserTerminalProfileResolverService extends BaseTerminalProfileResolverService {
        constructor(configurationResolverService, configurationService, historyService, logService, terminalInstanceService, terminalProfileService, workspaceContextService, remoteAgentService) {
            super({
                getDefaultSystemShell: async (remoteAuthority, os) => {
                    const backend = await terminalInstanceService.getBackend(remoteAuthority);
                    if (!remoteAuthority || !backend) {
                        // Just return basic values, this is only for serverless web and wouldn't be used
                        return os === 1 /* OperatingSystem.Windows */ ? 'pwsh' : 'bash';
                    }
                    return backend.getDefaultSystemShell(os);
                },
                getEnvironment: async (remoteAuthority) => {
                    const backend = await terminalInstanceService.getBackend(remoteAuthority);
                    if (!remoteAuthority || !backend) {
                        return process_1.env;
                    }
                    return backend.getEnvironment();
                }
            }, configurationService, configurationResolverService, historyService, logService, terminalProfileService, workspaceContextService, remoteAgentService);
        }
    };
    exports.BrowserTerminalProfileResolverService = BrowserTerminalProfileResolverService;
    exports.BrowserTerminalProfileResolverService = BrowserTerminalProfileResolverService = __decorate([
        __param(0, configurationResolver_1.IConfigurationResolverService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, history_1.IHistoryService),
        __param(3, terminal_1.ITerminalLogService),
        __param(4, terminal_3.ITerminalInstanceService),
        __param(5, terminal_2.ITerminalProfileService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, remoteAgentService_1.IRemoteAgentService)
    ], BrowserTerminalProfileResolverService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9maWxlUmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsUHJvZmlsZVJlc29sdmVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEyQmhHLE1BQU0sb0JBQW9CLEdBQUcsV0FBVyxDQUFDO0lBRXpDOzs7T0FHRztJQUNILE1BQXNCLGtDQUFrQztRQVF2RCxJQUFJLGtCQUFrQixLQUF5QixPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7UUFFakYsWUFDa0IsUUFBaUMsRUFDakMscUJBQTRDLEVBQzVDLDZCQUE0RCxFQUM1RCxlQUFnQyxFQUNoQyxXQUFnQyxFQUNoQyx1QkFBZ0QsRUFDaEQsd0JBQWtELEVBQ2xELG1CQUF3QztZQVB4QyxhQUFRLEdBQVIsUUFBUSxDQUF5QjtZQUNqQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzVDLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBK0I7WUFDNUQsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQ2hDLGdCQUFXLEdBQVgsV0FBVyxDQUFxQjtZQUNoQyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQXlCO1lBQ2hELDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDbEQsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQWJ6QyxrQkFBYSxHQUFrQixJQUFBLDhCQUFlLEdBQUUsQ0FBQztZQWVqRSxJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDO2dCQUM5QyxJQUFJLENBQUMsbUJBQW1CLENBQUMsY0FBYyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFF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