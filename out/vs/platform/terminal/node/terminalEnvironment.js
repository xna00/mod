/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/strings", "vs/base/common/types", "vs/base/node/pfs", "vs/platform/terminal/common/environmentVariable", "vs/platform/terminal/common/environmentVariableShared", "vs/platform/terminal/common/environmentVariableCollection"], function (require, exports, os, network_1, objects_1, path, platform_1, process, strings_1, types_1, pfs, environmentVariable_1, environmentVariableShared_1, environmentVariableCollection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getWindowsBuildNumber = getWindowsBuildNumber;
    exports.findExecutable = findExecutable;
    exports.getShellIntegrationInjection = getShellIntegrationInjection;
    function getWindowsBuildNumber() {
        const osVersion = (/(\d+)\.(\d+)\.(\d+)/g).exec(os.release());
        let buildNumber = 0;
        if (osVersion && osVersion.length === 4) {
            buildNumber = parseInt(osVersion[3]);
        }
        return buildNumber;
    }
    async function findExecutable(command, cwd, paths, env = process.env, exists = pfs.Promises.exists) {
        // If we have an absolute path then we take it.
        if (path.isAbsolute(command)) {
            return await exists(command) ? command : undefined;
        }
        if (cwd === undefined) {
            cwd = process.cwd();
        }
        const dir = path.dirname(command);
        if (dir !== '.') {
            // We have a directory and the directory is relative (see above). Make the path absolute
            // to the current working directory.
            const fullPath = path.join(cwd, command);
            return await exists(fullPath) ? fullPath : undefined;
        }
        const envPath = (0, objects_1.getCaseInsensitive)(env, 'PATH');
        if (paths === undefined && (0, types_1.isString)(envPath)) {
            paths = envPath.split(path.delimiter);
        }
        // No PATH environment. Make path absolute to the cwd.
        if (paths === undefined || paths.length === 0) {
            const fullPath = path.join(cwd, command);
            return await exists(fullPath) ? fullPath : undefined;
        }
        // We have a simple file name. We get the path variable from the env
        // and try to find the executable on the path.
        for (const pathEntry of paths) {
            // The path entry is absolute.
            let fullPath;
            if (path.isAbsolute(pathEntry)) {
                fullPath = path.join(pathEntry, command);
            }
            else {
                fullPath = path.join(cwd, pathEntry, command);
            }
            if (await exists(fullPath)) {
                return fullPath;
            }
            if (platform_1.isWindows) {
                let withExtension = fullPath + '.com';
                if (await exists(withExtension)) {
                    return withExtension;
                }
                withExtension = fullPath + '.exe';
                if (await exists(withExtension)) {
                    return withExtension;
                }
            }
        }
        const fullPath = path.join(cwd, command);
        return await exists(fullPath) ? fullPath : undefined;
    }
    /**
     * For a given shell launch config, returns arguments to replace and an optional environment to
     * mixin to the SLC's environment to enable shell integration. This must be run within the context
     * that creates the process to ensure accuracy. Returns undefined if shell integration cannot be
     * enabled.
     */
    function getShellIntegrationInjection(shellLaunchConfig, options, env, logService, productService) {
        // Conditionally disable shell integration arg injection
        // - The global setting is disabled
        // - There is no executable (not sure what script to run)
        // - The terminal is used by a feature like tasks or debugging
        const useWinpty = platform_1.isWindows && (!options.windowsEnableConpty || getWindowsBuildNumber() < 18309);
        if (
        // The global setting is disabled
        !options.shellIntegration.enabled ||
            // There is no executable (so there's no way to determine how to inject)
            !shellLaunchConfig.executable ||
            // It's a feature terminal (tasks, debug), unless it's explicitly being forced
            (shellLaunchConfig.isFeatureTerminal && !shellLaunchConfig.forceShellIntegration) ||
            // The ignoreShellIntegration flag is passed (eg. relaunching without shell integration)
            shellLaunchConfig.ignoreShellIntegration ||
            // Winpty is unsupported
            useWinpty) {
            return undefined;
        }
        const originalArgs = shellLaunchConfig.args;
        const shell = process.platform === 'win32' ? path.basename(shellLaunchConfig.executable).toLowerCase() : path.basename(shellLaunchConfig.executable);
        const appRoot = path.dirname(network_1.FileAccess.asFileUri('').fsPath);
        let newArgs;
        const envMixin = {
            'VSCODE_INJECTION': '1'
        };
        if (options.shellIntegration.nonce) {
            envMixin['VSCODE_NONCE'] = options.shellIntegration.nonce;
        }
        // Windows
        if (platform_1.isWindows) {
            if (shell === 'pwsh.exe' || shell === 'powershell.exe') {
                if (!originalArgs || arePwshImpliedArgs(originalArgs)) {
                    newArgs = shellIntegrationArgs.get(ShellIntegrationExecutable.WindowsPwsh);
                }
                else if (arePwshLoginArgs(originalArgs)) {
                    newArgs = shellIntegrationArgs.get(ShellIntegrationExecutable.WindowsPwshLogin);
                }
                if (!newArgs) {
                    return undefined;
                }
                newArgs = [...newArgs]; // Shallow clone the array to avoid setting the default array
                newArgs[newArgs.length - 1] = (0, strings_1.format)(newArgs[newArgs.length - 1], appRoot, '');
                if (options.shellIntegration.suggestEnabled) {
                    envMixin['VSCODE_SUGGEST'] = '1';
                }
                return { newArgs, envMixin };
            }
            logService.warn(`Shell integration cannot be enabled for executable "${shellLaunchConfig.executable}" and args`, shellLaunchConfig.args);
            return undefined;
        }
        // Linux & macOS
        switch (shell) {
            case 'bash': {
                if (!originalArgs || originalArgs.length === 0) {
                    newArgs = shellIntegrationArgs.get(ShellIntegrationExecutable.Bash);
                }
                else if (areZshBashLoginArgs(originalArgs)) {
                    envMixin['VSCODE_SHELL_LOGIN'] = '1';
                    addEnvMixinPathPrefix(options, envMixin);
                    newArgs = shellIntegrationArgs.get(ShellIntegrationExecutable.Bash);
                }
                if (!newArgs) {
                    return undefined;
                }
                newArgs = [...newArgs]; // Shallow clone the array to avoid setting the default array
                newArgs[newArgs.length - 1] = (0, strings_1.format)(newArgs[newArgs.length - 1], appRoot);
                return { newArgs, envMixin };
            }
            case 'fish': {
                // The injection mechanism used for fish is to add a custom dir to $XDG_DATA_DIRS which
                // is similar to $ZDOTDIR in zsh but contains a list of directories to run from.
                const oldDataDirs = env?.XDG_DATA_DIRS ?? '/usr/local/share:/usr/share';
                const newDataDir = path.join(appRoot, 'out/vs/workbench/contrib/terminal/browser/media/fish_xdg_data');
                envMixin['XDG_DATA_DIRS'] = `${oldDataDirs}:${newDataDir}`;
                addEnvMixinPathPrefix(options, envMixin);
                return { newArgs: undefined, envMixin };
            }
            case 'pwsh': {
                if (!originalArgs || arePwshImpliedArgs(originalArgs)) {
                    newArgs = shellIntegrationArgs.get(ShellIntegrationExecutable.Pwsh);
                }
                else if (arePwshLoginArgs(originalArgs)) {
                    newArgs = shellIntegrationArgs.get(ShellIntegrationExecutable.PwshLogin);
                }
                if (!newArgs) {
                    return undefined;
                }
                if (options.shellIntegration.suggestEnabled) {
                    envMixin['VSCODE_SUGGEST'] = '1';
                }
                newArgs = [...newArgs]; // Shallow clone the array to avoid setting the default array
                newArgs[newArgs.length - 1] = (0, strings_1.format)(newArgs[newArgs.length - 1], appRoot, '');
                return { newArgs, envMixin };
            }
            case 'zsh': {
                if (!originalArgs || originalArgs.length === 0) {
                    newArgs = shellIntegrationArgs.get(ShellIntegrationExecutable.Zsh);
                }
                else if (areZshBashLoginArgs(originalArgs)) {
                    newArgs = shellIntegrationArgs.get(ShellIntegrationExecutable.ZshLogin);
                    addEnvMixinPathPrefix(options, envMixin);
                }
                else if (originalArgs === shellIntegrationArgs.get(ShellIntegrationExecutable.Zsh) || originalArgs === shellIntegrationArgs.get(ShellIntegrationExecutable.ZshLogin)) {
                    newArgs = originalArgs;
                }
                if (!newArgs) {
                    return undefined;
                }
                newArgs = [...newArgs]; // Shallow clone the array to avoid setting the default array
                newArgs[newArgs.length - 1] = (0, strings_1.format)(newArgs[newArgs.length - 1], appRoot);
                // Move .zshrc into $ZDOTDIR as the way to activate the script
                let username;
                try {
                    username = os.userInfo().username;
                }
                catch {
                    username = 'unknown';
                }
                const zdotdir = path.join(os.tmpdir(), `${username}-${productService.applicationName}-zsh`);
                envMixin['ZDOTDIR'] = zdotdir;
                const userZdotdir = env?.ZDOTDIR ?? os.homedir() ?? `~`;
                envMixin['USER_ZDOTDIR'] = userZdotdir;
                const filesToCopy = [];
                filesToCopy.push({
                    source: path.join(appRoot, 'out/vs/workbench/contrib/terminal/browser/media/shellIntegration-rc.zsh'),
                    dest: path.join(zdotdir, '.zshrc')
                });
                filesToCopy.push({
                    source: path.join(appRoot, 'out/vs/workbench/contrib/terminal/browser/media/shellIntegration-profile.zsh'),
                    dest: path.join(zdotdir, '.zprofile')
                });
                filesToCopy.push({
                    source: path.join(appRoot, 'out/vs/workbench/contrib/terminal/browser/media/shellIntegration-env.zsh'),
                    dest: path.join(zdotdir, '.zshenv')
                });
                filesToCopy.push({
                    source: path.join(appRoot, 'out/vs/workbench/contrib/terminal/browser/media/shellIntegration-login.zsh'),
                    dest: path.join(zdotdir, '.zlogin')
                });
                return { newArgs, envMixin, filesToCopy };
            }
        }
        logService.warn(`Shell integration cannot be enabled for executable "${shellLaunchConfig.executable}" and args`, shellLaunchConfig.args);
        return undefined;
    }
    /**
     * On macOS the profile calls path_helper which adds a bunch of standard bin directories to the
     * beginning of the PATH. This causes significant problems for the environment variable
     * collection API as the custom paths added to the end will now be somewhere in the middle of
     * the PATH. To combat this, VSCODE_PATH_PREFIX is used to re-apply any prefix after the profile
     * has run. This will cause duplication in the PATH but should fix the issue.
     *
     * See #99878 for more information.
     */
    function addEnvMixinPathPrefix(options, envMixin) {
        if (platform_1.isMacintosh && options.environmentVariableCollections) {
            // Deserialize and merge
            const deserialized = (0, environmentVariableShared_1.deserializeEnvironmentVariableCollections)(options.environmentVariableCollections);
            const merged = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(deserialized);
            // Get all prepend PATH entries
            const pathEntry = merged.getVariableMap({ workspaceFolder: options.workspaceFolder }).get('PATH');
            const prependToPath = [];
            if (pathEntry) {
                for (const mutator of pathEntry) {
                    if (mutator.type === environmentVariable_1.EnvironmentVariableMutatorType.Prepend) {
                        prependToPath.push(mutator.value);
                    }
                }
            }
            // Add to the environment mixin to be applied in the shell integration script
            if (prependToPath.length > 0) {
                envMixin['VSCODE_PATH_PREFIX'] = prependToPath.join('');
            }
        }
    }
    var ShellIntegrationExecutable;
    (function (ShellIntegrationExecutable) {
        ShellIntegrationExecutable["WindowsPwsh"] = "windows-pwsh";
        ShellIntegrationExecutable["WindowsPwshLogin"] = "windows-pwsh-login";
        ShellIntegrationExecutable["Pwsh"] = "pwsh";
        ShellIntegrationExecutable["PwshLogin"] = "pwsh-login";
        ShellIntegrationExecutable["Zsh"] = "zsh";
        ShellIntegrationExecutable["ZshLogin"] = "zsh-login";
        ShellIntegrationExecutable["Bash"] = "bash";
    })(ShellIntegrationExecutable || (ShellIntegrationExecutable = {}));
    const shellIntegrationArgs = new Map();
    // The try catch swallows execution policy errors in the case of the archive distributable
    shellIntegrationArgs.set(ShellIntegrationExecutable.WindowsPwsh, ['-noexit', '-command', 'try { . \"{0}\\out\\vs\\workbench\\contrib\\terminal\\browser\\media\\shellIntegration.ps1\" } catch {}{1}']);
    shellIntegrationArgs.set(ShellIntegrationExecutable.WindowsPwshLogin, ['-l', '-noexit', '-command', 'try { . \"{0}\\out\\vs\\workbench\\contrib\\terminal\\browser\\media\\shellIntegration.ps1\" } catch {}{1}']);
    shellIntegrationArgs.set(ShellIntegrationExecutable.Pwsh, ['-noexit', '-command', '. "{0}/out/vs/workbench/contrib/terminal/browser/media/shellIntegration.ps1"{1}']);
    shellIntegrationArgs.set(ShellIntegrationExecutable.PwshLogin, ['-l', '-noexit', '-command', '. "{0}/out/vs/workbench/contrib/terminal/browser/media/shellIntegration.ps1"']);
    shellIntegrationArgs.set(ShellIntegrationExecutable.Zsh, ['-i']);
    shellIntegrationArgs.set(ShellIntegrationExecutable.ZshLogin, ['-il']);
    shellIntegrationArgs.set(ShellIntegrationExecutable.Bash, ['--init-file', '{0}/out/vs/workbench/contrib/terminal/browser/media/shellIntegration-bash.sh']);
    const loginArgs = ['-login', '-l'];
    const pwshImpliedArgs = ['-nol', '-nologo'];
    function arePwshLoginArgs(originalArgs) {
        if (typeof originalArgs === 'string') {
            return loginArgs.includes(originalArgs.toLowerCase());
        }
        else {
            return originalArgs.length === 1 && loginArgs.includes(originalArgs[0].toLowerCase()) ||
                (originalArgs.length === 2 &&
                    (((loginArgs.includes(originalArgs[0].toLowerCase())) || loginArgs.includes(originalArgs[1].toLowerCase())))
                    && ((pwshImpliedArgs.includes(originalArgs[0].toLowerCase())) || pwshImpliedArgs.includes(originalArgs[1].toLowerCase())));
        }
    }
    function arePwshImpliedArgs(originalArgs) {
        if (typeof originalArgs === 'string') {
            return pwshImpliedArgs.includes(originalArgs.toLowerCase());
        }
        else {
            return originalArgs.length === 0 || originalArgs?.length === 1 && pwshImpliedArgs.includes(originalArgs[0].toLowerCase());
        }
    }
    function areZshBashLoginArgs(originalArgs) {
        return originalArgs === 'string' && loginArgs.includes(originalArgs.toLowerCase())
            || typeof originalArgs !== 'string' && originalArgs.length === 1 && loginArgs.includes(originalArgs[0].toLowerCase());
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFbnZpcm9ubWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvbm9kZS90ZXJtaW5hbEVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBa0JoRyxzREFPQztJQUVELHdDQW1EQztJQTBCRCxvRUF1SkM7SUE3T0QsU0FBZ0IscUJBQXFCO1FBQ3BDLE1BQU0sU0FBUyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDOUQsSUFBSSxXQUFXLEdBQVcsQ0FBQyxDQUFDO1FBQzVCLElBQUksU0FBUyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDekMsV0FBVyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBQ0QsT0FBTyxXQUFXLENBQUM7SUFDcEIsQ0FBQztJQUVNLEtBQUssVUFBVSxjQUFjLENBQUMsT0FBZSxFQUFFLEdBQVksRUFBRSxLQUFnQixFQUFFLE1BQTJCLE9BQU8sQ0FBQyxHQUEwQixFQUFFLFNBQTZDLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTTtRQUNwTiwrQ0FBK0M7UUFDL0MsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDOUIsT0FBTyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDcEQsQ0FBQztRQUNELElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3ZCLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDckIsQ0FB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