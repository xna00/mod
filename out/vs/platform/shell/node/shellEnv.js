/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "vs/base/common/path", "vs/nls", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/platform", "vs/base/common/uuid", "vs/base/node/shell", "vs/platform/environment/node/argvHelper", "vs/base/common/async", "vs/base/common/numbers"], function (require, exports, child_process_1, path_1, nls_1, cancellation_1, errorMessage_1, errors_1, platform_1, uuid_1, shell_1, argvHelper_1, async_1, numbers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getResolvedShellEnv = getResolvedShellEnv;
    let unixShellEnvPromise = undefined;
    /**
     * Resolves the shell environment by spawning a shell. This call will cache
     * the shell spawning so that subsequent invocations use that cached result.
     *
     * Will throw an error if:
     * - we hit a timeout of `MAX_SHELL_RESOLVE_TIME`
     * - any other error from spawning a shell to figure out the environment
     */
    async function getResolvedShellEnv(configurationService, logService, args, env) {
        // Skip if --force-disable-user-env
        if (args['force-disable-user-env']) {
            logService.trace('resolveShellEnv(): skipped (--force-disable-user-env)');
            return {};
        }
        // Skip on windows
        else if (platform_1.isWindows) {
            logService.trace('resolveShellEnv(): skipped (Windows)');
            return {};
        }
        // Skip if running from CLI already
        else if ((0, argvHelper_1.isLaunchedFromCli)(env) && !args['force-user-env']) {
            logService.trace('resolveShellEnv(): skipped (VSCODE_CLI is set)');
            return {};
        }
        // Otherwise resolve (macOS, Linux)
        else {
            if ((0, argvHelper_1.isLaunchedFromCli)(env)) {
                logService.trace('resolveShellEnv(): running (--force-user-env)');
            }
            else {
                logService.trace('resolveShellEnv(): running (macOS/Linux)');
            }
            // Call this only once and cache the promise for
            // subsequent calls since this operation can be
            // expensive (spawns a process).
            if (!unixShellEnvPromise) {
                unixShellEnvPromise = async_1.Promises.withAsyncBody(async (resolve, reject) => {
                    const cts = new cancellation_1.CancellationTokenSource();
                    let timeoutValue = 10000; // default to 10 seconds
                    const configuredTimeoutValue = configurationService.getValue('application.shellEnvironmentResolutionTimeout');
                    if (typeof configuredTimeoutValue === 'number') {
                        timeoutValue = (0, numbers_1.clamp)(configuredTimeoutValue, 1, 120) * 1000 /* convert from seconds */;
                    }
                    // Give up resolving shell env after some time
                    const timeout = setTimeout(() => {
                        cts.dispose(true);
                        reject(new Error((0, nls_1.localize)('resolveShellEnvTimeout', "Unable to resolve your shell environment in a reasonable time. Please review your shell configuration and restart.")));
                    }, timeoutValue);
                    // Resolve shell env and handle errors
                    try {
                        resolve(await doResolveUnixShellEnv(logService, cts.token));
                    }
                    catch (error) {
                        if (!(0, errors_1.isCancellationError)(error) && !cts.token.isCancellationRequested) {
                            reject(new Error((0, nls_1.localize)('resolveShellEnvError', "Unable to resolve your shell environment: {0}", (0, errorMessage_1.toErrorMessage)(error))));
                        }
                        else {
                            resolve({});
                        }
                    }
                    finally {
                        clearTimeout(timeout);
                        cts.dispose();
                    }
                });
            }
            return unixShellEnvPromise;
        }
    }
    async function doResolveUnixShellEnv(logService, token) {
        const runAsNode = process.env['ELECTRON_RUN_AS_NODE'];
        logService.trace('getUnixShellEnvironment#runAsNode', runAsNode);
        const noAttach = process.env['ELECTRON_NO_ATTACH_CONSOLE'];
        logService.trace('getUnixShellEnvironment#noAttach', noAttach);
        const mark = (0, uuid_1.generateUuid)().replace(/-/g, '').substr(0, 12);
        const regex = new RegExp(mark + '({.*})' + mark);
        const env = {
            ...process.env,
            ELECTRON_RUN_AS_NODE: '1',
            ELECTRON_NO_ATTACH_CONSOLE: '1',
            VSCODE_RESOLVING_ENVIRONMENT: '1'
        };
        logService.trace('getUnixShellEnvironment#env', env);
        const systemShellUnix = await (0, shell_1.getSystemShell)(platform_1.OS, env);
        logService.trace('getUnixShellEnvironment#shell', systemShellUnix);
        return new Promise((resolve, reject) => {
            if (token.isCancellationRequested) {
                return reject(new errors_1.CancellationError());
            }
            // handle popular non-POSIX shells
            const name = (0, path_1.basename)(systemShellUnix);
            let command, shellArgs;
            const extraArgs = '';
            if (/^pwsh(-preview)?$/.test(name)) {
                // Older versions of PowerShell removes double quotes sometimes so we use "double single quotes" which is how
                // you escape single quotes inside of a single quoted string.
                command = `& '${process.execPath}' ${extraArgs} -p '''${mark}'' + JSON.stringify(process.env) + ''${mark}'''`;
                shellArgs = ['-Login', '-Command'];
            }
            else if (name === 'nu') { // nushell requires ^ before quoted path to treat it as a command
                command = `^'${process.execPath}' ${extraArgs} -p '"${mark}" + JSON.stringify(process.env) + "${mark}"'`;
                shellArgs = ['-i', '-l', '-c'];
            }
            else if (name === 'xonsh') { // #200374: native implementation is shorter
                command = `import os, json; print("${mark}", json.dumps(dict(os.environ)), "${mark}")`;
                shellArgs = ['-i', '-l', '-c'];
            }
            else {
                command = `'${process.execPath}' ${extraArgs} -p '"${mark}" + JSON.stringify(process.env) + "${mark}"'`;
                if (name === 'tcsh' || name === 'csh') {
                    shellArgs = ['-ic'];
                }
                else {
                    shellArgs = ['-i', '-l', '-c'];
                }
            }
            logService.trace('getUnixShellEnvironment#spawn', JSON.stringify(shellArgs), command);
            const child = (0, child_process_1.spawn)(systemShellUnix, [...shellArgs, command], {
                detached: true,
                stdio: ['ignore', 'pipe', 'pipe'],
                env
            });
            token.onCancellationRequested(() => {
                child.kill();
                return reject(new errors_1.CancellationError());
            });
            child.on('error', err => {
                logService.error('getUnixShellEnvironment#errorChildProcess', (0, errorMessage_1.toErrorMessage)(err));
                reject(err);
            });
            const buffers = [];
            child.stdout.on('data', b => buffers.push(b));
            const stderr = [];
            child.stderr.on('data', b => stderr.push(b));
            child.on('close', (code, signal) => {
                const raw = Buffer.concat(buffers).toString('utf8');
                logService.trace('getUnixShellEnvironment#raw', raw);
                const stderrStr = Buffer.concat(stderr).toString('utf8');
                if (stderrStr.trim()) {
                    logService.trace('getUnixShellEnvironment#stderr', stderrStr);
                }
                if (code || signal) {
                    return reject(new Error((0, nls_1.localize)('resolveShellEnvExitError', "Unexpected exit code from spawned shell (code {0}, signal {1})", code, signal)));
                }
                const match = regex.exec(raw);
                const rawStripped = match ? match[1] : '{}';
                try {
                    const env = JSON.parse(rawStripped);
                    if (runAsNode) {
                        env['ELECTRON_RUN_AS_NODE'] = runAsNode;
                    }
                    else {
                        delete env['ELECTRON_RUN_AS_NODE'];
                    }
                    if (noAttach) {
                        env['ELECTRON_NO_ATTACH_CONSOLE'] = noAttach;
                    }
                    else {
                        delete env['ELECTRON_NO_ATTACH_CONSOLE'];
                    }
                    delete env['VSCODE_RESOLVING_ENVIRONMENT'];
                    // https://github.com/microsoft/vscode/issues/22593#issuecomment-336050758
                    delete env['XDG_RUNTIME_DIR'];
                    logService.trace('getUnixShellEnvironment#result', env);
                    resolve(env);
                }
                catch (err) {
                    logService.error('getUnixShellEnvironment#errorCaught', (0, errorMessage_1.toErrorMessage)(err));
                    reject(err);
                }
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGxFbnYuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3NoZWxsL25vZGUvc2hlbGxFbnYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUE0QmhHLGtEQW9FQztJQTlFRCxJQUFJLG1CQUFtQixHQUE0QyxTQUFTLENBQUM7SUFFN0U7Ozs7Ozs7T0FPRztJQUNJLEtBQUssVUFBVSxtQkFBbUIsQ0FBQyxvQkFBMkMsRUFBRSxVQUF1QixFQUFFLElBQXNCLEVBQUUsR0FBd0I7UUFFL0osbUNBQW1DO1FBQ25DLElBQUksSUFBSSxDQUFDLHdCQUF3QixDQUFDLEVBQUUsQ0FBQztZQUNwQyxVQUFVLENBQUMsS0FBSyxDQUFDLHVEQUF1RCxDQUFDLENBQUM7WUFFMUUsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRUQsa0JBQWtCO2FBQ2IsSUFBSSxvQkFBUyxFQUFFLENBQUM7WUFDcEIsVUFBVSxDQUFDLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1lBRXpELE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVELG1DQUFtQzthQUM5QixJQUFJLElBQUEsOEJBQWlCLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO1lBQzVELFVBQVUsQ0FBQyxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQztZQUVuRSxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFRCxtQ0FBbUM7YUFDOUIsQ0FBQztZQUNMLElBQUksSUFBQSw4QkFBaUIsRUFBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM1QixVQUFVLENBQUMsS0FBSyxDQUFDLCtDQUErQyxDQUFDLENBQUM7WUFDbkUsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFVBQVUsQ0FBQyxLQUFLLENBQUMsMENB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