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
define(["require", "exports", "child_process", "vs/base/common/decorators", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/processes", "vs/base/node/pfs", "vs/base/node/processes", "vs/nls", "vs/platform/externalTerminal/common/externalTerminal"], function (require, exports, cp, decorators_1, network_1, path, env, processes_1, pfs, processes, nls, externalTerminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinuxExternalTerminalService = exports.MacExternalTerminalService = exports.WindowsExternalTerminalService = void 0;
    const TERMINAL_TITLE = nls.localize('console.title', "VS Code Console");
    class ExternalTerminalService {
        async getDefaultTerminalForPlatforms() {
            return {
                windows: WindowsExternalTerminalService.getDefaultTerminalWindows(),
                linux: await LinuxExternalTerminalService.getDefaultTerminalLinuxReady(),
                osx: 'xterm'
            };
        }
    }
    class WindowsExternalTerminalService extends ExternalTerminalService {
        static { this.CMD = 'cmd.exe'; }
        openTerminal(configuration, cwd) {
            return this.spawnTerminal(cp, configuration, processes.getWindowsShell(), cwd);
        }
        spawnTerminal(spawner, configuration, command, cwd) {
            const exec = configuration.windowsExec || WindowsExternalTerminalService.getDefaultTerminalWindows();
            // Make the drive letter uppercase on Windows (see #9448)
            if (cwd && cwd[1] === ':') {
                cwd = cwd[0].toUpperCase() + cwd.substr(1);
            }
            // cmder ignores the environment cwd and instead opts to always open in %USERPROFILE%
            // unless otherwise specified
            const basename = path.basename(exec, '.exe').toLowerCase();
            if (basename === 'cmder') {
                spawner.spawn(exec, cwd ? [cwd] : undefined);
                return Promise.resolve(undefined);
            }
            const cmdArgs = ['/c', 'start', '/wait'];
            if (exec.indexOf(' ') >= 0) {
                // The "" argument is the window title. Without this, exec doesn't work when the path
                // contains spaces
                cmdArgs.push('""');
            }
            cmdArgs.push(exec);
            // Add starting directory parameter for Windows Terminal (see #90734)
            if (basename === 'wt') {
                cmdArgs.push('-d .');
            }
            return new Promise((c, e) => {
                const env = getSanitizedEnvironment(process);
                const child = spawner.spawn(command, cmdArgs, { cwd, env, detached: true });
                child.on('error', e);
                child.on('exit', () => c());
            });
        }
        async runInTerminal(title, dir, args, envVars, settings) {
            const exec = 'windowsExec' in settings && settings.windowsExec ? settings.windowsExec : WindowsExternalTerminalService.getDefaultTerminalWindows();
            const wt = await WindowsExternalTerminalService.getWtExePath();
            return new Promise((resolve, reject) => {
                const title = `"${dir} - ${TERMINAL_TITLE}"`;
                const command = `"${args.join('" "')}" & pause`; // use '|' to only pause on non-zero exit code
                // merge environment variables into a copy of the process.env
                const env = Object.assign({}, getSanitizedEnvironment(process), envVars);
                // delete environment variables that have a null value
                Object.keys(env).filter(v => env[v] === null).forEach(key => delete env[key]);
                const options = {
                    cwd: dir,
                    env: env,
                    windowsVerbatimArguments: true
                };
                let spawnExec;
                let cmdArgs;
                if (path.basename(exec, '.exe') === 'wt') {
                    // Handle Windows Terminal specially; -d to set the cwd and run a cmd.exe instance
                    // inside it
                    spawnExec = exec;
                    cmdArgs = ['-d', '.', WindowsExternalTerminalService.CMD, '/c', command];
                }
                else if (wt) {
                    // prefer to use the window terminal to spawn if it's available instead
                    // of start, since that allows ctrl+c handling (#81322)
                    spawnExec = wt;
                    cmdArgs = ['-d', '.', exec, '/c', command];
                }
                else {
                    spawnExec = WindowsExternalTerminalService.CMD;
                    cmdArgs = ['/c', 'start', title, '/wait', exec, '/c', `"${command}"`];
                }
                const cmd = cp.spawn(spawnExec, cmdArgs, options);
                cmd.on('error', err => {
                    reject(improveError(err));
                });
                resolve(undefined);
            });
        }
        static getDefaultTerminalWindows() {
            if (!WindowsExternalTerminalService._DEFAULT_TERMINAL_WINDOWS) {
                const isWoW64 = !!process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
                WindowsExternalTerminalService._DEFAULT_TERMINAL_WINDOWS = `${process.env.windir ? process.env.windir : 'C:\\Windows'}\\${isWoW64 ? 'Sysnative' : 'System32'}\\cmd.exe`;
            }
            return WindowsExternalTerminalService._DEFAULT_TERMINAL_WINDOWS;
        }
        static async getWtExePath() {
            try {
                const wtPath = await processes.win32.findExecutable('wt');
                return await pfs.Promises.exists(wtPath) ? wtPath : undefined;
            }
            catch {
                return undefined;
            }
        }
    }
    exports.WindowsExternalTerminalService = WindowsExternalTerminalService;
    __decorate([
        decorators_1.memoize
    ], WindowsExternalTerminalService, "getWtExePath", null);
    class MacExternalTerminalService extends ExternalTerminalService {
        static { this.OSASCRIPT = '/usr/bin/osascript'; } // osascript is the AppleScript interpreter on OS X
        openTerminal(configuration, cwd) {
            return this.spawnTerminal(cp, configuration, cwd);
        }
        runInTerminal(title, dir, args, envVars, settings) {
            const terminalApp = settings.osxExec || externalTerminal_1.DEFAULT_TERMINAL_OSX;
            return new Promise((resolve, reject) => {
                if (terminalApp === externalTerminal_1.DEFAULT_TERMINAL_OSX || terminalApp === 'iTerm.app') {
                    // On OS X we launch an AppleScript that creates (or reuses) a Terminal window
                    // and then launches the program inside that window.
                    const script = terminalApp === externalTerminal_1.DEFAULT_TERMINAL_OSX ? 'TerminalHelper' : 'iTermHelper';
                    const scriptpath = network_1.FileAccess.asFileUri(`vs/workbench/contrib/externalTerminal/node/${script}.scpt`).fsPath;
                    const osaArgs = [
                        scriptpath,
                        '-t', title || TERMINAL_TITLE,
                        '-w', dir,
                    ];
                    for (const a of args) {
                        osaArgs.push('-a');
                        osaArgs.push(a);
                    }
                    if (envVars) {
                        // merge environment variables into a copy of the process.env
                        const env = Object.assign({}, getSanitizedEnvironment(process), envVars);
                        for (const key in env) {
                            const value = env[key];
                            if (value === null) {
                                osaArgs.push('-u');
                                osaArgs.push(key);
                            }
                            else {
                                osaArgs.push('-e');
                                osaArgs.push(`${key}=${value}`);
                            }
                        }
                    }
                    let stderr = '';
                    const osa = cp.spawn(MacExternalTerminalService.OSASCRIPT, osaArgs);
                    osa.on('error', err => {
                        reject(improveError(err));
                    });
                    osa.stderr.on('data', (data) => {
                        stderr += data.toString();
                    });
                    osa.on('exit', (code) => {
                        if (code === 0) { // OK
                            resolve(undefined);
                        }
                        else {
                            if (stderr) {
                                const lines = stderr.split('\n', 1);
                                reject(new Error(lines[0]));
                            }
                            else {
                                reject(new Error(nls.localize('mac.terminal.script.failed', "Script '{0}' failed with exit code {1}", script, code)));
                            }
                        }
                    });
                }
                else {
                    reject(new Error(nls.localize('mac.terminal.type.not.supported', "'{0}' not supported", terminalApp)));
                }
            });
        }
        spawnTerminal(spawner, configuration, cwd) {
            const terminalApp = configuration.osxExec || externalTerminal_1.DEFAULT_TERMINAL_OSX;
            return new Promise((c, e) => {
                const args = ['-a', terminalApp];
                if (cwd) {
                    args.push(cwd);
                }
                const env = getSanitizedEnvironment(process);
                const child = spawner.spawn('/usr/bin/open', args, { cwd, env });
                child.on('error', e);
                child.on('exit', () => c());
            });
        }
    }
    exports.MacExternalTerminalService = MacExternalTerminalService;
    class LinuxExternalTerminalService extends ExternalTerminalService {
        static { this.WAIT_MESSAGE = nls.localize('press.any.key', "Press any key to continue..."); }
        openTerminal(configuration, cwd) {
            return this.spawnTerminal(cp, configuration, cwd);
        }
        runInTerminal(title, dir, args, envVars, settings) {
            const execPromise = settings.linuxExec ? Promise.resolve(settings.linuxExec) : LinuxExternalTerminalService.getDefaultTerminalLinuxReady();
            return new Promise((resolve, reject) => {
                const termArgs = [];
                //termArgs.push('--title');
                //termArgs.push(`"${TERMINAL_TITLE}"`);
                execPromise.then(exec => {
                    if (exec.indexOf('gnome-terminal') >= 0) {
                        termArgs.push('-x');
                    }
                    else {
                        termArgs.push('-e');
                    }
                    termArgs.push('bash');
                    termArgs.push('-c');
                    const bashCommand = `${quote(args)}; echo; read -p "${LinuxExternalTerminalService.WAIT_MESSAGE}" -n1;`;
                    termArgs.push(`''${bashCommand}''`); // wrapping argument in two sets of ' because node is so "friendly" that it removes one set...
                    // merge environment variables into a copy of the process.env
                    const env = Object.assign({}, getSanitizedEnvironment(process), envVars);
                    // delete environment variables that have a null value
                    Object.keys(env).filter(v => env[v] === null).forEach(key => delete env[key]);
                    const options = {
                        cwd: dir,
                        env: env
                    };
                    let stderr = '';
                    const cmd = cp.spawn(exec, termArgs, options);
                    cmd.on('error', err => {
                        reject(improveError(err));
                    });
                    cmd.stderr.on('data', (data) => {
                        stderr += data.toString();
                    });
                    cmd.on('exit', (code) => {
                        if (code === 0) { // OK
                            resolve(undefined);
                        }
                        else {
                            if (stderr) {
                                const lines = stderr.split('\n', 1);
                                reject(new Error(lines[0]));
                            }
                            else {
                                reject(new Error(nls.localize('linux.term.failed', "'{0}' failed with exit code {1}", exec, code)));
                            }
                        }
                    });
                });
            });
        }
        static async getDefaultTerminalLinuxReady() {
            if (!LinuxExternalTerminalService._DEFAULT_TERMINAL_LINUX_READY) {
                if (!env.isLinux) {
                    LinuxExternalTerminalService._DEFAULT_TERMINAL_LINUX_READY = Promise.resolve('xterm');
                }
                else {
                    const isDebian = await pfs.Promises.exists('/etc/debian_version');
                    LinuxExternalTerminalService._DEFAULT_TERMINAL_LINUX_READY = new Promise(r => {
                        if (isDebian) {
                            r('x-terminal-emulator');
                        }
                        else if (process.env.DESKTOP_SESSION === 'gnome' || process.env.DESKTOP_SESSION === 'gnome-classic') {
                            r('gnome-terminal');
                        }
                        else if (process.env.DESKTOP_SESSION === 'kde-plasma') {
                            r('konsole');
                        }
                        else if (process.env.COLORTERM) {
                            r(process.env.COLORTERM);
                        }
                        else if (process.env.TERM) {
                            r(process.env.TERM);
                        }
                        else {
                            r('xterm');
                        }
                    });
                }
            }
            return LinuxExternalTerminalService._DEFAULT_TERMINAL_LINUX_READY;
        }
        spawnTerminal(spawner, configuration, cwd) {
            const execPromise = configuration.linuxExec ? Promise.resolve(configuration.linuxExec) : LinuxExternalTerminalService.getDefaultTerminalLinuxReady();
            return new Promise((c, e) => {
                execPromise.then(exec => {
                    const env = getSanitizedEnvironment(process);
                    const child = spawner.spawn(exec, [], { cwd, env });
                    child.on('error', e);
                    child.on('exit', () => c());
                });
            });
        }
    }
    exports.LinuxExternalTerminalService = LinuxExternalTerminalService;
    function getSanitizedEnvironment(process) {
        const env = { ...process.env };
        (0, processes_1.sanitizeProcessEnvironment)(env);
        return env;
    }
    /**
     * tries to turn OS errors into more meaningful error messages
     */
    function improveError(err) {
        if ('errno' in err && err['errno'] === 'ENOENT' && 'path' in err && typeof err['path'] === 'string') {
            return new Error(nls.localize('ext.term.app.not.found', "can't find terminal application '{0}'", err['path']));
        }
        return err;
    }
    /**
     * Quote args if necessary and combine into a space separated string.
     */
    function quote(args) {
        let r = '';
        for (const a of args) {
            if (a.indexOf(' ') >= 0) {
                r += '"' + a + '"';
            }
            else {
                r += a;
            }
            r += ' ';
        }
        return r;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZXJuYWxUZXJtaW5hbFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVybmFsVGVybWluYWwvbm9kZS9leHRlcm5hbFRlcm1pbmFsU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7SUFjaEcsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUV4RSxNQUFlLHVCQUF1QjtRQUdyQyxLQUFLLENBQUMsOEJBQThCO1lBQ25DLE9BQU87Z0JBQ04sT0FBTyxFQUFFLDhCQUE4QixDQUFDLHlCQUF5QixFQUFFO2dCQUNuRSxLQUFLLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQyw0QkFBNEIsRUFBRTtnQkFDeEUsR0FBRyxFQUFFLE9BQU87YUFDWixDQUFDO1FBQ0gsQ0FBQztLQUNEO0lBRUQsTUFBYSw4QkFBK0IsU0FBUSx1QkFBdUI7aUJBQ2xELFFBQUcsR0FBRyxTQUFTLENBQUM7UUFHakMsWUFBWSxDQUFDLGFBQXdDLEVBQUUsR0FBWTtZQUN6RSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFLGFBQWEsRUFBRSxTQUFTLENBQUMsZUFBZSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVNLGFBQWEsQ0FBQyxPQUFrQixFQUFFLGFBQXdDLEVBQUUsT0FBZSxFQUFFLEdBQVk7WUFDL0csTUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLFdBQVcsSUFBSSw4QkFBOEIsQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1lBRXJHLHlEQUF5RDtZQUN6RCxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQzNCLEdBQUcsR0FBRyxH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