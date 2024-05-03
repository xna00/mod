/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "vs/base/common/codicons", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/types", "vs/base/node/pfs", "vs/base/node/powershell", "vs/platform/terminal/node/terminalEnvironment", "path"], function (require, exports, cp, codicons_1, path_1, platform_1, types_1, pfs, powershell_1, terminalEnvironment_1, path_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.detectAvailableProfiles = detectAvailableProfiles;
    var Constants;
    (function (Constants) {
        Constants["UnixShellsPath"] = "/etc/shells";
    })(Constants || (Constants = {}));
    let profileSources;
    let logIfWslNotInstalled = true;
    function detectAvailableProfiles(profiles, defaultProfile, includeDetectedProfiles, configurationService, shellEnv = process.env, fsProvider, logService, variableResolver, testPwshSourcePaths) {
        fsProvider = fsProvider || {
            existsFile: pfs.SymlinkSupport.existsFile,
            readFile: pfs.Promises.readFile
        };
        if (platform_1.isWindows) {
            return detectAvailableWindowsProfiles(includeDetectedProfiles, fsProvider, shellEnv, logService, configurationService.getValue("terminal.integrated.useWslProfiles" /* TerminalSettingId.UseWslProfiles */) !== false, profiles && typeof profiles === 'object' ? { ...profiles } : configurationService.getValue("terminal.integrated.profiles.windows" /* TerminalSettingId.ProfilesWindows */), typeof defaultProfile === 'string' ? defaultProfile : configurationService.getValue("terminal.integrated.defaultProfile.windows" /* TerminalSettingId.DefaultProfileWindows */), testPwshSourcePaths, variableResolver);
        }
        return detectAvailableUnixProfiles(fsProvider, logService, includeDetectedProfiles, profiles && typeof profiles === 'object' ? { ...profiles } : configurationService.getValue(platform_1.isLinux ? "terminal.integrated.profiles.linux" /* TerminalSettingId.ProfilesLinux */ : "terminal.integrated.profiles.osx" /* TerminalSettingId.ProfilesMacOs */), typeof defaultProfile === 'string' ? defaultProfile : configurationService.getValue(platform_1.isLinux ? "terminal.integrated.defaultProfile.linux" /* TerminalSettingId.DefaultProfileLinux */ : "terminal.integrated.defaultProfile.osx" /* TerminalSettingId.DefaultProfileMacOs */), testPwshSourcePaths, variableResolver, shellEnv);
    }
    async function detectAvailableWindowsProfiles(includeDetectedProfiles, fsProvider, shellEnv, logService, useWslProfiles, configProfiles, defaultProfileName, testPwshSourcePaths, variableResolver) {
        // Determine the correct System32 path. We want to point to Sysnative
        // when the 32-bit version of VS Code is running on a 64-bit machine.
        // The reason for this is because PowerShell's important PSReadline
        // module doesn't work if this is not the case. See #27915.
        const is32ProcessOn64Windows = process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
        const system32Path = `${process.env['windir']}\\${is32ProcessOn64Windows ? 'Sysnative' : 'System32'}`;
        let useWSLexe = false;
        if ((0, terminalEnvironment_1.getWindowsBuildNumber)() >= 16299) {
            useWSLexe = true;
        }
        await initializeWindowsProfiles(testPwshSourcePaths);
        const detectedProfiles = new Map();
        // Add auto detected profiles
        if (includeDetectedProfiles) {
            detectedProfiles.set('PowerShell', {
                source: "PowerShell" /* ProfileSource.Pwsh */,
                icon: codicons_1.Codicon.terminalPowershell,
                isAutoDetected: true
            });
            detectedProfiles.set('Windows PowerShell', {
                path: `${system32Path}\\WindowsPowerShell\\v1.0\\powershell.exe`,
                icon: codicons_1.Codicon.terminalPowershell,
                isAutoDetected: true
            });
            detectedProfiles.set('Git Bash', {
                source: "Git Bash" /* ProfileSource.GitBash */,
                isAutoDetected: true
            });
            detectedProfiles.set('Command Prompt', {
                path: `${system32Path}\\cmd.exe`,
                icon: codicons_1.Codicon.terminalCmd,
                isAutoDetected: true
            });
            detectedProfiles.set('Cygwin', {
                path: [
                    { path: `${process.env['HOMEDRIVE']}\\cygwin64\\bin\\bash.exe`, isUnsafe: true },
                    { path: `${process.env['HOMEDRIVE']}\\cygwin\\bin\\bash.exe`, isUnsafe: true }
                ],
                args: ['--login'],
                isAutoDetected: true
            });
            detectedProfiles.set('bash (MSYS2)', {
                path: [
                    { path: `${process.env['HOMEDRIVE']}\\msys64\\usr\\bin\\bash.exe`, isUnsafe: true },
                ],
                args: ['--login', '-i'],
                // CHERE_INVOKING retains current working directory
                env: { CHERE_INVOKING: '1' },
                icon: codicons_1.Codicon.terminalBash,
                isAutoDetected: true
            });
            const cmderPath = `${process.env['CMDER_ROOT'] || `${process.env['HOMEDRIVE']}\\cmder`}\\vendor\\bin\\vscode_init.cmd`;
            detectedProfiles.set('Cmder', {
                path: `${system32Path}\\cmd.exe`,
                args: ['/K', cmderPath],
                // The path is safe if it was derived from CMDER_ROOT
                requiresPath: process.env['CMDER_ROOT'] ? cmderPath : { path: cmderPath, isUnsafe: true },
                isAutoDetected: true
            });
        }
        applyConfigProfilesToMap(configProfiles, detectedProfiles);
        const resultProfiles = await transformToTerminalProfiles(detectedProfiles.entries(), defaultProfileName, fsProvider, shellEnv, logService, variableResolver);
        if (includeDetectedProfiles && useWslProfiles) {
            try {
                const result = await getWslProfiles(`${system32Path}\\${useWSLexe ? 'wsl' : 'bash'}.exe`, defaultProfileName);
                for (const wslProfile of result) {
                    if (!configProfiles || !(wslProfile.profileName in configProfiles)) {
                        resultProfiles.push(wslProfile);
                    }
                }
            }
            catch (e) {
                if (logIfWslNotInstalled) {
                    logService?.trace('WSL is not installed, so could not detect WSL profiles');
                    logIfWslNotInstalled = false;
                }
            }
        }
        return resultProfiles;
    }
    async function transformToTerminalProfiles(entries, defaultProfileName, fsProvider, shellEnv = process.env, logService, variableResolver) {
        const promises = [];
        for (const [profileName, profile] of entries) {
            promises.push(getValidatedProfile(profileName, profile, defaultProfileName, fsProvider, shellEnv, logService, variableResolver));
        }
        return (await Promise.all(promises)).filter(e => !!e);
    }
    async function getValidatedProfile(profileName, profile, defaultProfileName, fsProvider, shellEnv = process.env, logService, variableResolver) {
        if (profile === null) {
            return undefined;
        }
        let originalPaths;
        let args;
        let icon = undefined;
        // use calculated values if path is not specified
        if ('source' in profile && !('path' in profile)) {
            const source = profileSources?.get(profile.source);
            if (!source) {
                return undefined;
            }
            originalPaths = source.paths;
            // if there are configured args, override the default ones
            args = profile.args || source.args;
            if (profile.icon) {
                icon = validateIcon(profile.icon);
            }
            else if (source.icon) {
                icon = source.icon;
            }
        }
        else {
            originalPaths = Array.isArray(profile.path) ? profile.path : [profile.path];
            args = platform_1.isWindows ? profile.args : Array.isArray(profile.args) ? profile.args : undefined;
            icon = validateIcon(profile.icon);
        }
        let paths;
        if (variableResolver) {
            // Convert to string[] for resolve
            const mapped = originalPaths.map(e => typeof e === 'string' ? e : e.path);
            const resolved = await variableResolver(mapped);
            // Convert resolved back to (T | string)[]
            paths = new Array(originalPaths.length);
            for (let i = 0; i < originalPaths.length; i++) {
                if (typeof originalPaths[i] === 'string') {
                    paths[i] = resolved[i];
                }
                else {
                    paths[i] = {
                        path: resolved[i],
                        isUnsafe: true
                    };
                }
            }
        }
        else {
            paths = originalPaths.slice();
        }
        let requiresUnsafePath;
        if (profile.requiresPath) {
            // Validate requiresPath exists
            let actualRequiredPath;
            if ((0, types_1.isString)(profile.requiresPath)) {
                actualRequiredPath = profile.requiresPath;
            }
            else {
                actualRequiredPath = profile.requiresPath.path;
                if (profile.requiresPath.isUnsafe) {
                    requiresUnsafePath = actualRequiredPath;
                }
            }
            const result = await fsProvider.existsFile(actualRequiredPath);
            if (!result) {
                return;
            }
        }
        const validatedProfile = await validateProfilePaths(profileName, defaultProfileName, paths, fsProvider, shellEnv, args, profile.env, profile.overrideName, profile.isAutoDetected, requiresUnsafePath);
        if (!validatedProfile) {
            logService?.debug('Terminal profile not validated', profileName, originalPaths);
            return undefined;
        }
        validatedProfile.isAutoDetected = profile.isAutoDetected;
        validatedProfile.icon = icon;
        validatedProfile.color = profile.color;
        return validatedProfile;
    }
    function validateIcon(icon) {
        if (typeof icon === 'string') {
            return { id: icon };
        }
        return icon;
    }
    async function initializeWindowsProfiles(testPwshSourcePaths) {
        if (profileSources && !testPwshSourcePaths) {
            return;
        }
        const [gitBashPaths, pwshPaths] = await Promise.all([getGitBashPaths(), testPwshSourcePaths || getPowershellPaths()]);
        profileSources = new Map();
        profileSources.set("Git Bash" /* ProfileSource.GitBash */, {
            profileName: 'Git Bash',
            paths: gitBashPaths,
            args: ['--login', '-i']
        });
        profileSources.set("PowerShell" /* ProfileSource.Pwsh */, {
            profileName: 'PowerShell',
            paths: pwshPaths,
            icon: codicons_1.Codicon.terminalPowershell
        });
    }
    async function getGitBashPaths() {
        const gitDirs = new Set();
        // Look for git.exe on the PATH and use that if found. git.exe is located at
        // `<installdir>/cmd/git.exe`. This is not an unsafe location because the git executable is
        // located on the PATH which is only controlled by the user/admin.
        const gitExePath = await (0, terminalEnvironment_1.findExecutable)('git.exe');
        if (gitExePath) {
            const gitExeDir = (0, path_2.dirname)(gitExePath);
            gitDirs.add((0, path_2.resolve)(gitExeDir, '../..'));
        }
        function addTruthy(set, value) {
            if (value) {
                set.add(value);
            }
        }
        // Add common git install locations
        addTruthy(gitDirs, process.env['ProgramW6432']);
        addTruthy(gitDirs, process.env['ProgramFiles']);
        addTruthy(gitDirs, process.env['ProgramFiles(X86)']);
        addTruthy(gitDirs, `${process.env['LocalAppData']}\\Program`);
        const gitBashPaths = [];
        for (const gitDir of gitDirs) {
            gitBashPaths.push(`${gitDir}\\Git\\bin\\bash.exe`, `${gitDir}\\Git\\usr\\bin\\bash.exe`, `${gitDir}\\usr\\bin\\bash.exe` // using Git for Windows SDK
            );
        }
        // Add special installs that don't follow the standard directory structure
        gitBashPaths.push(`${process.env['UserProfile']}\\scoop\\apps\\git\\current\\bin\\bash.exe`);
        gitBashPaths.push(`${process.env['UserProfile']}\\scoop\\apps\\git-with-openssh\\current\\bin\\bash.exe`);
        return gitBashPaths;
    }
    async function getPowershellPaths() {
        const paths = [];
        // Add all of the different kinds of PowerShells
        for await (const pwshExe of (0, powershell_1.enumeratePowerShellInstallations)()) {
            paths.push(pwshExe.exePath);
        }
        return paths;
    }
    async function getWslProfiles(wslPath, defaultProfileName) {
        const profiles = [];
        const distroOutput = await new Promise((resolve, reject) => {
            // wsl.exe output is encoded in utf16le (ie. A -> 0x4100)
            cp.exec('wsl.exe -l -q', { encoding: 'utf16le', timeout: 1000 }, (err, stdout) => {
                if (err) {
                    return reject('Problem occurred when getting wsl distros');
                }
                resolve(stdout);
            });
        });
        if (!distroOutput) {
            return [];
        }
        const regex = new RegExp(/[\r?\n]/);
        const distroNames = distroOutput.split(regex).filter(t => t.trim().length > 0 && t !== '');
        for (const distroName of distroNames) {
            // Skip empty lines
            if (distroName === '') {
                continue;
            }
            // docker-desktop and docker-desktop-data are treated as implementation details of
            // Docker Desktop for Windows and therefore not exposed
            if (distroName.startsWith('docker-desktop')) {
                continue;
            }
            // Create the profile, adding the icon depending on the distro
            const profileName = `${distroName} (WSL)`;
            const profile = {
                profileName,
                path: wslPath,
                args: [`-d`, `${distroName}`],
                isDefault: profileName === defaultProfileName,
                icon: getWslIcon(distroName),
                isAutoDetected: false
            };
            // Add the profile
            profiles.push(profile);
        }
        return profiles;
    }
    function getWslIcon(distroName) {
        if (distroName.includes('Ubuntu')) {
            return codicons_1.Codicon.terminalUbuntu;
        }
        else if (distroName.includes('Debian')) {
            return codicons_1.Codicon.terminalDebian;
        }
        else {
            return codicons_1.Codicon.terminalLinux;
        }
    }
    async function detectAvailableUnixProfiles(fsProvider, logService, includeDetectedProfiles, configProfiles, defaultProfileName, testPaths, variableResolver, shellEnv) {
        const detectedProfiles = new Map();
        // Add non-quick launch profiles
        if (includeDetectedProfiles && await fsProvider.existsFile("/etc/shells" /* Constants.UnixShellsPath */)) {
            const contents = (await fsProvider.readFile("/etc/shells" /* Constants.UnixShellsPath */)).toString();
            const profiles = ((testPaths || contents.split('\n'))
                .map(e => {
                const index = e.indexOf('#');
                return index === -1 ? e : e.substring(0, index);
            })
                .filter(e => e.trim().length > 0));
            const counts = new Map();
            for (const profile of profiles) {
                let profileName = (0, path_1.basename)(profile);
                let count = counts.get(profileName) || 0;
                count++;
                if (count > 1) {
                    profileName = `${profileName} (${count})`;
                }
                counts.set(profileName, count);
                detectedProfiles.set(profileName, { path: profile, isAutoDetected: true });
            }
        }
        applyConfigProfilesToMap(configProfiles, detectedProfiles);
        return await transformToTerminalProfiles(detectedProfiles.entries(), defaultProfileName, fsProvider, shellEnv, logService, variableResolver);
    }
    function applyConfigProfilesToMap(configProfiles, profilesMap) {
        if (!configProfiles) {
            return;
        }
        for (const [profileName, value] of Object.entries(configProfiles)) {
            if (value === null || typeof value !== 'object' || (!('path' in value) && !('source' in value))) {
                profilesMap.delete(profileName);
            }
            else {
                value.icon = value.icon || profilesMap.get(profileName)?.icon;
                profilesMap.set(profileName, value);
            }
        }
    }
    async function validateProfilePaths(profileName, defaultProfileName, potentialPaths, fsProvider, shellEnv, args, env, overrideName, isAutoDetected, requiresUnsafePath) {
        if (potentialPaths.length === 0) {
            return Promise.resolve(undefined);
        }
        const path = potentialPaths.shift();
        if (path === '') {
            return validateProfilePaths(profileName, defaultProfileName, potentialPaths, fsProvider, shellEnv, args, env, overrideName, isAutoDetected);
        }
        const isUnsafePath = typeof path !== 'string' && path.isUnsafe;
        const actualPath = typeof path === 'string' ? path : path.path;
        const profile = {
            profileName,
            path: actualPath,
            args,
            env,
            overrideName,
            isAutoDetected,
            isDefault: profileName === defaultProfileName,
            isUnsafePath,
            requiresUnsafePath
        };
        // For non-absolute paths, check if it's available on $PATH
        if ((0, path_1.basename)(actualPath) === actualPath) {
            // The executable isn't an absolute path, try find it on the PATH
            const envPaths = shellEnv.PATH ? shellEnv.PATH.split(path_1.delimiter) : undefined;
            const executable = await (0, terminalEnvironment_1.findExecutable)(actualPath, undefined, envPaths, undefined, fsProvider.existsFile);
            if (!executable) {
                return validateProfilePaths(profileName, defaultProfileName, potentialPaths, fsProvider, shellEnv, args);
            }
            profile.path = executable;
            profile.isFromPath = true;
            return profile;
        }
        const result = await fsProvider.existsFile((0, path_1.normalize)(actualPath));
        if (result) {
            return profile;
        }
        return validateProfilePaths(profileName, defaultProfileName, potentialPaths, fsProvider, shellEnv, args, env, overrideName, isAutoDetected);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9maWxlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvbm9kZS90ZXJtaW5hbFByb2ZpbGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBd0JoRywwREFzQ0M7SUE3Q0QsSUFBVyxTQUVWO0lBRkQsV0FBVyxTQUFTO1FBQ25CLDJDQUE4QixDQUFBO0lBQy9CLENBQUMsRUFGVSxTQUFTLEtBQVQsU0FBUyxRQUVuQjtJQUVELElBQUksY0FBa0UsQ0FBQztJQUN2RSxJQUFJLG9CQUFvQixHQUFZLElBQUksQ0FBQztJQUV6QyxTQUFnQix1QkFBdUIsQ0FDdEMsUUFBaUIsRUFDakIsY0FBdUIsRUFDdkIsdUJBQWdDLEVBQ2hDLG9CQUEyQyxFQUMzQyxXQUErQixPQUFPLENBQUMsR0FBRyxFQUMxQyxVQUF3QixFQUN4QixVQUF3QixFQUN4QixnQkFBd0QsRUFDeEQsbUJBQThCO1FBRTlCLFVBQVUsR0FBRyxVQUFVLElBQUk7WUFDMUIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxjQUFjLENBQUMsVUFBVTtZQUN6QyxRQUFRLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRO1NBQy9CLENBQUM7UUFDRixJQUFJLG9CQUFTLEVBQUUsQ0FBQztZQUNmLE9BQU8sOEJBQThCLENBQ3BDLHVCQUF1QixFQUN2QixVQUFVLEVBQ1YsUUFBUSxFQUNSLFVBQVUsRUFDVixvQkFBb0IsQ0FBQyxRQUFRLDZFQUFrQyxLQUFLLEtBQUssRUFDekUsUUFBUSxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLGdGQUFrRixFQUM1SyxPQUFPLGNBQWMsS0FBSyxRQUFRLENBQUMs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