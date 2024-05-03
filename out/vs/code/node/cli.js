/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "fs", "os", "vs/base/common/event", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/ports", "vs/base/node/pfs", "vs/base/node/ports", "vs/platform/files/node/watcher/nodejs/nodejsWatcherLib", "vs/platform/environment/node/argv", "vs/platform/environment/node/argvHelper", "vs/platform/environment/node/stdin", "vs/platform/environment/node/wait", "vs/platform/product/common/product", "vs/base/common/cancellation", "vs/base/common/extpath", "vs/platform/profiling/common/profiling", "vs/base/common/network", "vs/base/common/process", "vs/base/node/unc", "vs/base/common/uri", "vs/base/common/async"], function (require, exports, child_process_1, fs_1, os_1, event_1, path_1, platform_1, ports_1, pfs_1, ports_2, nodejsWatcherLib_1, argv_1, argvHelper_1, stdin_1, wait_1, product_1, cancellation_1, extpath_1, profiling_1, network_1, process_1, unc_1, uri_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.main = main;
    function shouldSpawnCliProcess(argv) {
        return !!argv['install-source']
            || !!argv['list-extensions']
            || !!argv['install-extension']
            || !!argv['uninstall-extension']
            || !!argv['update-extensions']
            || !!argv['locate-extension']
            || !!argv['telemetry'];
    }
    async function main(argv) {
        let args;
        try {
            args = (0, argvHelper_1.parseCLIProcessArgv)(argv);
        }
        catch (err) {
            console.error(err.message);
            return;
        }
        for (const subcommand of argv_1.NATIVE_CLI_COMMANDS) {
            if (args[subcommand]) {
                if (!product_1.default.tunnelApplicationName) {
                    console.error(`'${subcommand}' command not supported in ${product_1.default.applicationName}`);
                    return;
                }
                const tunnelArgs = argv.slice(argv.indexOf(subcommand) + 1); // all arguments behind `tunnel`
                return new Promise((resolve, reject) => {
                    let tunnelProcess;
                    const stdio = ['ignore', 'pipe', 'pipe'];
                    if (process.env['VSCODE_DEV']) {
                        tunnelProcess = (0, child_process_1.spawn)('cargo', ['run', '--', subcommand, ...tunnelArgs], { cwd: (0, path_1.join)(getAppRoot(), 'cli'), stdio });
                    }
                    else {
                        const appPath = process.platform === 'darwin'
                            // ./Contents/MacOS/Electron => ./Contents/Resources/app/bin/code-tunnel-insiders
                            ? (0, path_1.join)((0, path_1.dirname)((0, path_1.dirname)(process.execPath)), 'Resources', 'app')
                            : (0, path_1.dirname)(process.execPath);
                        const tunnelCommand = (0, path_1.join)(appPath, 'bin', `${product_1.default.tunnelApplicationName}${platform_1.isWindows ? '.exe' : ''}`);
                        tunnelProcess = (0, child_process_1.spawn)(tunnelCommand, [subcommand, ...tunnelArgs], { cwd: (0, process_1.cwd)(), stdio });
                    }
                    tunnelProcess.stdout.pipe(process.stdout);
                    tunnelProcess.stderr.pipe(process.stderr);
                    tunnelProcess.on('exit', resolve);
                    tunnelProcess.on('error', reject);
                });
            }
        }
        // Help
        if (args.help) {
            const executable = `${product_1.default.applicationName}${platform_1.isWindows ? '.exe' : ''}`;
            console.log((0, argv_1.buildHelpMessage)(product_1.default.nameLong, executable, product_1.default.version, argv_1.OPTIONS));
        }
        // Version Info
        else if (args.version) {
            console.log((0, argv_1.buildVersionMessage)(product_1.default.version, product_1.default.commit));
        }
        // Shell integration
        else if (args['locate-shell-integration-path']) {
            let file;
            switch (args['locate-shell-integration-path']) {
                // Usage: `[[ "$TERM_PROGRAM" == "vscode" ]] && . "$(code --locate-shell-integration-path bash)"`
                case 'bash':
                    file = 'shellIntegration-bash.sh';
                    break;
                // Usage: `if ($env:TERM_PROGRAM -eq "vscode") { . "$(code --locate-shell-integration-path pwsh)" }`
                case 'pwsh':
                    file = 'shellIntegration.ps1';
                    break;
                // Usage: `[[ "$TERM_PROGRAM" == "vscode" ]] && . "$(code --locate-shell-integration-path zsh)"`
                case 'zsh':
                    file = 'shellIntegration-rc.zsh';
                    break;
                // Usage: `string match -q "$TERM_PROGRAM" "vscode"; and . (code --locate-shell-integration-path fish)`
                case 'fish':
                    file = 'fish_xdg_data/fish/vendor_conf.d/shellIntegration.fish';
                    break;
                default: throw new Error('Error using --locate-shell-integration-path: Invalid shell type');
            }
            console.log((0, path_1.join)(getAppRoot(), 'out', 'vs', 'workbench', 'contrib', 'terminal', 'browser', 'media', file));
        }
        // Extensions Management
        else if (shouldSpawnCliProcess(args)) {
            const cli = await new Promise((resolve, reject) => require(['vs/code/node/cliProcessMain'], resolve, reject));
            await cli.main(args);
            return;
        }
        // Write File
        else if (args['file-write']) {
            const source = args._[0];
            const target = args._[1];
            // Windows: set the paths as allowed UNC paths given
            // they are explicitly provided by the user as arguments
            if (platform_1.isWindows) {
                for (const path of [source, target]) {
                    if ((0, extpath_1.isUNC)(path)) {
                        (0, unc_1.addUNCHostToAllowlist)(uri_1.URI.file(path).authority);
                    }
                }
            }
            // Validate
            if (!source || !target || source === target || // make sure source and target are provided and are not the same
                !(0, path_1.isAbsolute)(source) || !(0, path_1.isAbsolute)(target) || // make sure both source and target are absolute paths
                !(0, fs_1.existsSync)(source) || !(0, fs_1.statSync)(source).isFile() || // make sure source exists as file
                !(0, fs_1.existsSync)(target) || !(0, fs_1.statSync)(target).isFile() // make sure target exists as file
            ) {
                throw new Error('Using --file-write with invalid arguments.');
            }
            try {
                // Check for readonly status and chmod if so if we are told so
                let targetMode = 0;
                let restoreMode = false;
                if (!!args['file-chmod']) {
                    targetMode = (0, fs_1.statSync)(target).mode;
                    if (!(targetMode & 0o200 /* File mode indicating writable by owner */)) {
                        (0, fs_1.chmodSync)(target, targetMode | 0o200);
                        restoreMode = true;
                    }
                }
                // Write source to target
                const data = (0, fs_1.readFileSync)(source);
                if (platform_1.isWindows) {
                    // On Windows we use a different strategy of saving the file
                    // by first truncating the file and then writing with r+ mode.
                    // This helps to save hidden files on Windows
                    // (see https://github.com/microsoft/vscode/issues/931) and
                    // prevent removing alternate data streams
                    // (see https://github.com/microsoft/vscode/issues/6363)
                    (0, fs_1.truncateSync)(target, 0);
                    (0, pfs_1.writeFileSync)(target, data, { flag: 'r+' });
                }
                else {
                    (0, pfs_1.writeFileSync)(target, data);
                }
                // Restore previous mode as needed
                if (restoreMode) {
                    (0, fs_1.chmodSync)(target, targetMode);
                }
            }
            catch (error) {
                error.message = `Error using --file-write: ${error.message}`;
                throw error;
            }
        }
        // Just Code
        else {
            const env = {
                ...process.env,
                'ELECTRON_NO_ATTACH_CONSOLE': '1'
            };
            delete env['ELECTRON_RUN_AS_NODE'];
            const processCallbacks = [];
            if (args.verbose) {
                env['ELECTRON_ENABLE_LOGGING'] = '1';
            }
            if (args.verbose || args.status) {
                processCallbacks.push(async (child) => {
                    child.stdout?.on('data', (data) => console.log(data.toString('utf8').trim()));
                    child.stderr?.on('data', (data) => console.log(data.toString('utf8').trim()));
                    await event_1.Event.toPromise(event_1.Event.fromNodeEventEmitter(child, 'exit'));
                });
            }
            const hasReadStdinArg = args._.some(arg => arg === '-');
            if (hasReadStdinArg) {
                // remove the "-" argument when we read from stdin
                args._ = args._.filter(a => a !== '-');
                argv = argv.filter(a => a !== '-');
            }
            let stdinFilePath;
            if ((0, stdin_1.hasStdinWithoutTty)()) {
                // Read from stdin: we require a single "-" argument to be passed in order to start reading from
                // stdin. We do this because there is no reliable way to find out if data is piped to stdin. Just
                // checking for stdin being connected to a TTY is not enough (https://github.com/microsoft/vscode/issues/40351)
                if (hasReadStdinArg) {
                    stdinFilePath = (0, stdin_1.getStdinFilePath)();
                    try {
                        const readFromStdinDone = new async_1.DeferredPromise();
                        await (0, stdin_1.readFromStdin)(stdinFilePath, !!args.verbose, () => readFromStdinDone.complete());
                        if (!args.wait) {
                            // if `--wait` is not provided, we keep this process alive
                            // for at least as long as the stdin stream is open to
                            // ensure that we read all the data.
                            // the downside is that the Code CLI process will then not
                            // terminate until stdin is closed, but users can always
                            // pass `--wait` to prevent that from happening (this is
                            // actually what we enforced until v1.85.x but then was
                            // changed to not enforce it anymore).
                            // a solution in the future would possibly be to exit, when
                            // the Code process exits. this would require some careful
                            // solution though in case Code is already running and this
                            // is a second instance telling the first instance what to
                            // open.
                            processCallbacks.push(() => readFromStdinDone.p);
                        }
                        // Make sure to open tmp file as editor but ignore it in the "recently open" list
                        (0, argvHelper_1.addArg)(argv, stdinFilePath);
                        (0, argvHelper_1.addArg)(argv, '--skip-add-to-recently-opened');
                        console.log(`Reading from stdin via: ${stdinFilePath}`);
                    }
                    catch (e) {
                        console.log(`Failed to create file to read via stdin: ${e.toString()}`);
                        stdinFilePath = undefined;
                    }
                }
                else {
                    // If the user pipes data via stdin but forgot to add the "-" argument, help by printing a message
                    // if we detect that data flows into via stdin after a certain timeout.
                    processCallbacks.push(_ => (0, stdin_1.stdinDataListener)(1000).then(dataReceived => {
                        if (dataReceived) {
                            if (platform_1.isWindows) {
                                console.log(`Run with '${product_1.default.applicationName} -' to read output from another program (e.g. 'echo Hello World | ${product_1.default.applicationName} -').`);
                            }
                            else {
                                console.log(`Run with '${product_1.default.applicationName} -' to read from stdin (e.g. 'ps aux | grep code | ${product_1.default.applicationName} -').`);
                            }
                        }
                    }));
                }
            }
            const isMacOSBigSurOrNewer = platform_1.isMacintosh && (0, os_1.release)() > '20.0.0';
            // If we are started with --wait create a random temporary file
            // and pass it over to the starting instance. We can use this file
            // to wait for it to be deleted to monitor that the edited file
            // is closed and then exit the waiting process.
            let waitMarkerFilePath;
            if (args.wait) {
                waitMarkerFilePath = (0, wait_1.createWaitMarkerFileSync)(args.verbose);
                if (waitMarkerFilePath) {
                    (0, argvHelper_1.addArg)(argv, '--waitMarkerFilePath', waitMarkerFilePath);
                }
                // When running with --wait, we want to continue running CLI process
                // until either:
                // - the wait marker file has been deleted (e.g. when closing the editor)
                // - the launched process terminates (e.g. due to a crash)
                processCallbacks.push(async (child) => {
                    let childExitPromise;
                    if (isMacOSBigSurOrNewer) {
                        // On Big Sur, we resolve the following promise only when the child,
                        // i.e. the open command, exited with a signal or error. Otherwise, we
                        // wait for the marker file to be deleted or for the child to error.
                        childExitPromise = new Promise(resolve => {
                            // Only resolve this promise if the child (i.e. open) exited with an error
                            child.on('exit', (code, signal) => {
                                if (code !== 0 || signal) {
                                    resolve();
                                }
                            });
                        });
                    }
                    else {
                        // On other platforms, we listen for exit in case the child exits before the
                        // marker file is deleted.
                        childExitPromise = event_1.Event.toPromise(event_1.Event.fromNodeEventEmitter(child, 'exit'));
                    }
                    try {
                        await Promise.race([
                            (0, pfs_1.whenDeleted)(waitMarkerFilePath),
                            event_1.Event.toPromise(event_1.Event.fromNodeEventEmitter(child, 'error')),
                            childExitPromise
                        ]);
                    }
                    finally {
                        if (stdinFilePath) {
                            (0, fs_1.unlinkSync)(stdinFilePath); // Make sure to delete the tmp stdin file if we have any
                        }
                    }
                });
            }
            // If we have been started with `--prof-startup` we need to find free ports to profile
            // the main process, the renderer, and the extension host. We also disable v8 cached data
            // to get better profile traces. Last, we listen on stdout for a signal that tells us to
            // stop profiling.
            if (args['prof-startup']) {
                const portMain = await (0, ports_2.findFreePort)((0, ports_1.randomPort)(), 10, 3000);
                const portRenderer = await (0, ports_2.findFreePort)(portMain + 1, 10, 3000);
                const portExthost = await (0, ports_2.findFreePort)(portRenderer + 1, 10, 3000);
                // fail the operation when one of the ports couldn't be acquired.
                if (portMain * portRenderer * portExthost === 0) {
                    throw new Error('Failed to find free ports for profiler. Make sure to shutdown all instances of the editor first.');
                }
                const filenamePrefix = (0, extpath_1.randomPath)((0, os_1.homedir)(), 'prof');
                (0, argvHelper_1.addArg)(argv, `--inspect-brk=${portMain}`);
                (0, argvHelper_1.addArg)(argv, `--remote-debugging-port=${portRenderer}`);
                (0, argvHelper_1.addArg)(argv, `--inspect-brk-extensions=${portExthost}`);
                (0, argvHelper_1.addArg)(argv, `--prof-startup-prefix`, filenamePrefix);
                (0, argvHelper_1.addArg)(argv, `--no-cached-data`);
                (0, pfs_1.writeFileSync)(filenamePrefix, argv.slice(-6).join('|'));
                processCallbacks.push(async (_child) => {
                    class Profiler {
                        static async start(name, filenamePrefix, opts) {
                            const profiler = await new Promise((resolve_1, reject_1) => { require(['v8-inspect-profiler'], resolve_1, reject_1); });
                            let session;
                            try {
                                session = await profiler.startProfiling(opts);
                            }
                            catch (err) {
                                console.error(`FAILED to start profiling for '${name}' on port '${opts.port}'`);
                            }
                            return {
                                async stop() {
                                    if (!session) {
                                        return;
                                    }
                                    let suffix = '';
                                    const result = await session.stop();
                                    if (!process.env['VSCODE_DEV']) {
                                        // when running from a not-development-build we remove
                                        // absolute filenames because we don't want to reveal anything
                                        // about users. We also append the `.txt` suffix to make it
                                        // easier to attach these files to GH issues
                                        result.profile = profiling_1.Utils.rewriteAbsolutePaths(result.profile, 'piiRemoved');
                                        suffix = '.txt';
                                    }
                                    (0, pfs_1.writeFileSync)(`${filenamePrefix}.${name}.cpuprofile${suffix}`, JSON.stringify(result.profile, undefined, 4));
                                }
                            };
                        }
                    }
                    try {
                        // load and start profiler
                        const mainProfileRequest = Profiler.start('main', filenamePrefix, { port: portMain });
                        const extHostProfileRequest = Profiler.start('extHost', filenamePrefix, { port: portExthost, tries: 300 });
                        const rendererProfileRequest = Profiler.start('renderer', filenamePrefix, {
                            port: portRenderer,
                            tries: 200,
                            target: function (targets) {
                                return targets.filter(target => {
                                    if (!target.webSocketDebuggerUrl) {
                                        return false;
                                    }
                                    if (target.type === 'page') {
                                        return target.url.indexOf('workbench/workbench.html') > 0 || target.url.indexOf('workbench/workbench-dev.html') > 0;
                                    }
                                    else {
                                        return true;
                                    }
                                })[0];
                            }
                        });
                        const main = await mainProfileRequest;
                        const extHost = await extHostProfileRequest;
                        const renderer = await rendererProfileRequest;
                        // wait for the renderer to delete the marker file
                        await (0, pfs_1.whenDeleted)(filenamePrefix);
                        // stop profiling
                        await main.stop();
                        await renderer.stop();
                        await extHost.stop();
                        // re-create the marker file to signal that profiling is done
                        (0, pfs_1.writeFileSync)(filenamePrefix, '');
                    }
                    catch (e) {
                        console.error('Failed to profile startup. Make sure to quit Code first.');
                    }
                });
            }
            const options = {
                detached: true,
                env
            };
            if (!args.verbose) {
                options['stdio'] = 'ignore';
            }
            let child;
            if (!isMacOSBigSurOrNewer) {
                if (!args.verbose && args.status) {
                    options['stdio'] = ['ignore', 'pipe', 'ignore']; // restore ability to see output when --status is used
                }
                // We spawn process.execPath directly
                child = (0, child_process_1.spawn)(process.execPath, argv.slice(2), options);
            }
            else {
                // On Big Sur, we spawn using the open command to obtain behavior
                // similar to if the app was launched from the dock
                // https://github.com/microsoft/vscode/issues/102975
                // The following args are for the open command itself, rather than for VS Code:
                // -n creates a new instance.
                //    Without -n, the open command re-opens the existing instance as-is.
                // -g starts the new instance in the background.
                //    Later, Electron brings the instance to the foreground.
                //    This way, Mac does not automatically try to foreground the new instance, which causes
                //    focusing issues when the new instance only sends data to a previous instance and then closes.
                const spawnArgs = ['-n', '-g'];
                // -a opens the given application.
                spawnArgs.push('-a', process.execPath); // -a: opens a specific application
                if (args.verbose || args.status) {
                    spawnArgs.push('--wait-apps'); // `open --wait-apps`: blocks until the launched app is closed (even if they were already running)
                    // The open command only allows for redirecting stderr and stdout to files,
                    // so we make it redirect those to temp files, and then use a logger to
                    // redirect the file output to the console
                    for (const outputType of args.verbose ? ['stdout', 'stderr'] : ['stdout']) {
                        // Tmp file to target output to
                        const tmpName = (0, extpath_1.randomPath)((0, os_1.tmpdir)(), `code-${outputType}`);
                        (0, pfs_1.writeFileSync)(tmpName, '');
                        spawnArgs.push(`--${outputType}`, tmpName);
                        // Listener to redirect content to stdout/stderr
                        processCallbacks.push(async (child) => {
                            try {
                                const stream = outputType === 'stdout' ? process.stdout : process.stderr;
                                const cts = new cancellation_1.CancellationTokenSource();
                                child.on('close', () => {
                                    // We must dispose the token to stop watching,
                                    // but the watcher might still be reading data.
                                    setTimeout(() => cts.dispose(true), 200);
                                });
                                await (0, nodejsWatcherLib_1.watchFileContents)(tmpName, chunk => stream.write(chunk), () => { }, cts.token);
                            }
                            finally {
                                (0, fs_1.unlinkSync)(tmpName);
                            }
                        });
                    }
                }
                for (const e in env) {
                    // Ignore the _ env var, because the open command
                    // ignores it anyway.
                    // Pass the rest of the env vars in to fix
                    // https://github.com/microsoft/vscode/issues/134696.
                    if (e !== '_') {
                        spawnArgs.push('--env');
                        spawnArgs.push(`${e}=${env[e]}`);
                    }
                }
                spawnArgs.push('--args', ...argv.slice(2)); // pass on our arguments
                if (env['VSCODE_DEV']) {
                    // If we're in development mode, replace the . arg with the
                    // vscode source arg. Because the OSS app isn't bundled,
                    // it needs the full vscode source arg to launch properly.
                    const curdir = '.';
                    const launchDirIndex = spawnArgs.indexOf(curdir);
                    if (launchDirIndex !== -1) {
                        spawnArgs[launchDirIndex] = (0, path_1.resolve)(curdir);
                    }
                }
                // We already passed over the env variables
                // using the --env flags, so we can leave them out here.
                // Also, we don't need to pass env._, which is different from argv._
                child = (0, child_process_1.spawn)('open', spawnArgs, { ...options, env: {} });
            }
            return Promise.all(processCallbacks.map(callback => callback(child)));
        }
    }
    function getAppRoot() {
        return (0, path_1.dirname)(network_1.FileAccess.asFileUri('').fsPath);
    }
    function eventuallyExit(code) {
        setTimeout(() => process.exit(code), 0);
    }
    main(process.argv)
        .then(() => eventuallyExit(0))
        .then(null, err => {
        console.error(err.message || err.stack || err);
        eventuallyExit(1);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9jb2RlL25vZGUvY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBMENoRyxvQkEwZEM7SUF4ZUQsU0FBUyxxQkFBcUIsQ0FBQyxJQUFzQjtRQUNwRCxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7ZUFDM0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztlQUN6QixDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDO2VBQzNCLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUM7ZUFDN0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztlQUMzQixDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDO2VBQzFCLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDekIsQ0FBQztJQU1NLEtBQUssVUFBVSxJQUFJLENBQUMsSUFBYztRQUN4QyxJQUFJLElBQXNCLENBQUM7UUFFM0IsSUFBSSxDQUFDO1lBQ0osSUFBSSxHQUFHLElBQUEsZ0NBQW1CLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzQixPQUFPO1FBQ1IsQ0FBQztRQUVELEtBQUssTUFBTSxVQUFVLElBQUksMEJBQW1CLEVBQUUsQ0FBQztZQUM5QyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUMsaUJBQU8sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO29CQUNwQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksVUFBVSw4QkFBOEIsaUJB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