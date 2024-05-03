/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "url", "child_process", "http", "vs/base/common/process", "vs/base/common/path", "vs/platform/environment/node/argv", "vs/platform/environment/node/wait", "vs/platform/environment/node/stdin"], function (require, exports, _fs, _url, _cp, _http, process_1, path_1, argv_1, wait_1, stdin_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.main = main;
    const isSupportedForCmd = (optionId) => {
        switch (optionId) {
            case 'user-data-dir':
            case 'extensions-dir':
            case 'export-default-configuration':
            case 'install-source':
            case 'enable-smoke-test-driver':
            case 'extensions-download-dir':
            case 'builtin-extensions-dir':
            case 'telemetry':
                return false;
            default:
                return true;
        }
    };
    const isSupportedForPipe = (optionId) => {
        switch (optionId) {
            case 'version':
            case 'help':
            case 'folder-uri':
            case 'file-uri':
            case 'add':
            case 'diff':
            case 'merge':
            case 'wait':
            case 'goto':
            case 'reuse-window':
            case 'new-window':
            case 'status':
            case 'install-extension':
            case 'uninstall-extension':
            case 'update-extensions':
            case 'list-extensions':
            case 'force':
            case 'show-versions':
            case 'category':
            case 'verbose':
            case 'remote':
            case 'locate-shell-integration-path':
                return true;
            default:
                return false;
        }
    };
    const cliPipe = process.env['VSCODE_IPC_HOOK_CLI'];
    const cliCommand = process.env['VSCODE_CLIENT_COMMAND'];
    const cliCommandCwd = process.env['VSCODE_CLIENT_COMMAND_CWD'];
    const cliRemoteAuthority = process.env['VSCODE_CLI_AUTHORITY'];
    const cliStdInFilePath = process.env['VSCODE_STDIN_FILE_PATH'];
    async function main(desc, args) {
        if (!cliPipe && !cliCommand) {
            console.log('Command is only available in WSL or inside a Visual Studio Code terminal.');
            return;
        }
        // take the local options and remove the ones that don't apply
        const options = { ...argv_1.OPTIONS, gitCredential: { type: 'string' }, openExternal: { type: 'boolean' } };
        const isSupported = cliCommand ? isSupportedForCmd : isSupportedForPipe;
        for (const optionId in argv_1.OPTIONS) {
            const optId = optionId;
            if (!isSupported(optId)) {
                delete options[optId];
            }
        }
        if (cliPipe) {
            options['openExternal'] = { type: 'boolean' };
        }
        const errorReporter = {
            onMultipleValues: (id, usedValue) => {
                console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
            },
            onEmptyValue: (id) => {
                console.error(`Ignoring option '${id}': Value must not be empty.`);
            },
            onUnknownOption: (id) => {
                console.error(`Ignoring option '${id}': not supported for ${desc.executableName}.`);
            },
            onDeprecatedOption: (deprecatedOption, message) => {
                console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
            }
        };
        const parsedArgs = (0, argv_1.parseArgs)(args, options, errorReporter);
        const mapFileUri = cliRemoteAuthority ? mapFileToRemoteUri : (uri) => uri;
        const verbose = !!parsedArgs['verbose'];
        if (parsedArgs.help) {
            console.log((0, argv_1.buildHelpMessage)(desc.productName, desc.executableName, desc.version, options));
            return;
        }
        if (parsedArgs.version) {
            console.log((0, argv_1.buildVersionMessage)(desc.version, desc.commit));
            return;
        }
        if (parsedArgs['locate-shell-integration-path']) {
            let file;
            switch (parsedArgs['locate-shell-integration-path']) {
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
            console.log((0, path_1.resolve)(__dirname, '../..', 'workbench', 'contrib', 'terminal', 'browser', 'media', file));
            return;
        }
        if (cliPipe) {
            if (parsedArgs['openExternal']) {
                openInBrowser(parsedArgs['_'], verbose);
                return;
            }
        }
        let remote = parsedArgs.remote;
        if (remote === 'local' || remote === 'false' || remote === '') {
            remote = null; // null represent a local window
        }
        const folderURIs = (parsedArgs['folder-uri'] || []).map(mapFileUri);
        parsedArgs['folder-uri'] = folderURIs;
        const fileURIs = (parsedArgs['file-uri'] || []).map(mapFileUri);
        parsedArgs['file-uri'] = fileURIs;
        const inputPaths = parsedArgs['_'];
        let hasReadStdinArg = false;
        for (const input of inputPaths) {
            if (input === '-') {
                hasReadStdinArg = true;
            }
            else {
                translatePath(input, mapFileUri, folderURIs, fileURIs);
            }
        }
        parsedArgs['_'] = [];
        if (hasReadStdinArg && (0, stdin_1.hasStdinWithoutTty)()) {
            try {
                let stdinFilePath = cliStdInFilePath;
                if (!stdinFilePath) {
                    stdinFilePath = (0, stdin_1.getStdinFilePath)();
                    await (0, stdin_1.readFromStdin)(stdinFilePath, verbose); // throws error if file can not be written
                }
                // Make sure to open tmp file
                translatePath(stdinFilePath, mapFileUri, folderURIs, fileURIs);
                // Enable --wait to get all data and ignore adding this to history
                parsedArgs.wait = true;
                parsedArgs['skip-add-to-recently-opened'] = true;
                console.log(`Reading from stdin via: ${stdinFilePath}`);
            }
            catch (e) {
                console.log(`Failed to create file to read via stdin: ${e.toString()}`);
            }
        }
        if (parsedArgs.extensionDevelopmentPath) {
            parsedArgs.extensionDevelopmentPath = parsedArgs.extensionDevelopmentPath.map(p => mapFileUri(pathToURI(p).href));
        }
        if (parsedArgs.extensionTestsPath) {
            parsedArgs.extensionTestsPath = mapFileUri(pathToURI(parsedArgs['extensionTestsPath']).href);
        }
        const crashReporterDirectory = parsedArgs['crash-reporter-directory'];
        if (crashReporterDirectory !== undefined && !crashReporterDirectory.match(/^([a-zA-Z]:[\\\/])/)) {
            console.log(`The crash reporter directory '${crashReporterDirectory}' must be an absolute Windows path (e.g. c:/crashes)`);
            return;
        }
        if (cliCommand) {
            if (parsedArgs['install-extension'] !== undefined || parsedArgs['uninstall-extension'] !== undefined || parsedArgs['list-extensions'] || parsedArgs['update-extensions']) {
                const cmdLine = [];
                parsedArgs['install-extension']?.forEach(id => cmdLine.push('--install-extension', id));
                parsedArgs['uninstall-extension']?.forEach(id => cmdLine.push('--uninstall-extension', id));
                ['list-extensions', 'force', 'show-versions', 'category'].forEach(opt => {
                    const value = parsedArgs[opt];
                    if (value !== undefined) {
                        cmdLine.push(`--${opt}=${value}`);
                    }
                });
                if (parsedArgs['update-extensions']) {
                    cmdLine.push('--update-extensions');
                }
                const cp = _cp.fork((0, path_1.join)(__dirname, '../../../server-main.js'), cmdLine, { stdio: 'inherit' });
                cp.on('error', err => console.log(err));
                return;
            }
            const newCommandline = [];
            for (const key in parsedArgs) {
                const val = parsedArgs[key];
                if (typeof val === 'boolean') {
                    if (val) {
                        newCommandline.push('--' + key);
                    }
                }
                else if (Array.isArray(val)) {
                    for (const entry of val) {
                        newCommandline.push(`--${key}=${entry.toString()}`);
                    }
                }
                else if (val) {
                    newCommandline.push(`--${key}=${val.toString()}`);
                }
            }
            if (remote !== null) {
                newCommandline.push(`--remote=${remote || cliRemoteAuthority}`);
            }
            const ext = (0, path_1.extname)(cliCommand);
            if (ext === '.bat' || ext === '.cmd') {
                const processCwd = cliCommandCwd || (0, process_1.cwd)();
                if (verbose) {
                    console.log(`Invoking: cmd.exe /C ${cliCommand} ${newCommandline.join(' ')} in ${processCwd}`);
                }
                _cp.spawn('cmd.exe', ['/C', cliCommand, ...newCommandline], {
                    stdio: 'inherit',
                    cwd: processCwd
                });
            }
            else {
                const cliCwd = (0, path_1.dirname)(cliCommand);
                const env = { ...process.env, ELECTRON_RUN_AS_NODE: '1' };
                newCommandline.unshift('resources/app/out/cli.js');
                if (verbose) {
                    console.log(`Invoking: cd "${cliCwd}" && ELECTRON_RUN_AS_NODE=1 "${cliCommand}" "${newCommandline.join('" "')}"`);
                }
                if (runningInWSL2()) {
                    if (verbose) {
                        console.log(`Using pipes for output.`);
                    }
                    const cp = _cp.spawn(cliCommand, newCommandline, { cwd: cliCwd, env, stdio: ['inherit', 'pipe', 'pipe'] });
                    cp.stdout.on('data', data => process.stdout.write(data));
                    cp.stderr.on('data', data => process.stderr.write(data));
                }
                else {
                    _cp.spawn(cliCommand, newCommandline, { cwd: cliCwd, env, stdio: 'inherit' });
                }
            }
        }
        else {
            if (parsedArgs.status) {
                sendToPipe({
                    type: 'status'
                }, verbose).then((res) => {
                    console.log(res);
                }).catch(e => {
                    console.error('Error when requesting status:', e);
                });
                return;
            }
            if (parsedArgs['install-extension'] !== undefined || parsedArgs['uninstall-extension'] !== undefined || parsedArgs['list-extensions'] || parsedArgs['update-extensions']) {
                sendToPipe({
                    type: 'extensionManagement',
                    list: parsedArgs['list-extensions'] ? { showVersions: parsedArgs['show-versions'], category: parsedArgs['category'] } : undefined,
                    install: asExtensionIdOrVSIX(parsedArgs['install-extension']),
                    uninstall: asExtensionIdOrVSIX(parsedArgs['uninstall-extension']),
                    force: parsedArgs['force']
                }, verbose).then((res) => {
                    console.log(res);
                }).catch(e => {
                    console.error('Error when invoking the extension management command:', e);
                });
                return;
            }
            let waitMarkerFilePath = undefined;
            if (parsedArgs['wait']) {
                if (!fileURIs.length) {
                    console.log('At least one file must be provided to wait for.');
                    return;
                }
                waitMarkerFilePath = (0, wait_1.createWaitMarkerFileSync)(verbose);
            }
            sendToPipe({
                type: 'open',
                fileURIs,
                folderURIs,
                diffMode: parsedArgs.diff,
                mergeMode: parsedArgs.merge,
                addMode: parsedArgs.add,
                gotoLineMode: parsedArgs.goto,
                forceReuseWindow: parsedArgs['reuse-window'],
                forceNewWindow: parsedArgs['new-window'],
                waitMarkerFilePath,
                remoteAuthority: remote
            }, verbose).catch(e => {
                console.error('Error when invoking the open command:', e);
            });
            if (waitMarkerFilePath) {
                waitForFileDeleted(waitMarkerFilePath);
            }
        }
    }
    function runningInWSL2() {
        if (!!process.env['WSL_DISTRO_NAME']) {
            try {
                return _cp.execSync('uname -r', { encoding: 'utf8' }).includes('-microsoft-');
            }
            catch (_e) {
                // Ignore
            }
        }
        return false;
    }
    async function waitForFileDeleted(path) {
        while (_fs.existsSync(path)) {
            await new Promise(res => setTimeout(res, 1000));
        }
    }
    function openInBrowser(args, verbose) {
        const uris = [];
        for (const location of args) {
            try {
                if (/^(http|https|file):\/\//.test(location)) {
                    uris.push(_url.parse(location).href);
                }
                else {
                    uris.push(pathToURI(location).href);
                }
            }
            catch (e) {
                console.log(`Invalid url: ${location}`);
            }
        }
        if (uris.length) {
            sendToPipe({
                type: 'openExternal',
                uris
            }, verbose).catch(e => {
                console.error('Error when invoking the open external command:', e);
            });
        }
    }
    function sendToPipe(args, verbose) {
        if (verbose) {
            console.log(JSON.stringify(args, null, '  '));
        }
        return new Promise((resolve, reject) => {
            const message = JSON.stringify(args);
            if (!cliPipe) {
                console.log('Message ' + message);
                resolve('');
                return;
            }
            const opts = {
                socketPath: cliPipe,
                path: '/',
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'accept': 'application/json'
                }
            };
            const req = _http.request(opts, res => {
                if (res.headers['content-type'] !== 'application/json') {
                    reject('Error in response: Invalid content type: Expected \'application/json\', is: ' + res.headers['content-type']);
                    return;
                }
                const chunks = [];
                res.setEncoding('utf8');
                res.on('data', chunk => {
                    chunks.push(chunk);
                });
                res.on('error', (err) => fatal('Error in response.', err));
                res.on('end', () => {
                    const content = chunks.join('');
                    try {
                        const obj = JSON.parse(content);
                        if (res.statusCode === 200) {
                            resolve(obj);
                        }
                        else {
                            reject(obj);
                        }
                    }
                    catch (e) {
                        reject('Error in response: Unable to parse response as JSON: ' + content);
                    }
                });
            });
            req.on('error', (err) => fatal('Error in request.', err));
            req.write(message);
            req.end();
        });
    }
    function asExtensionIdOrVSIX(inputs) {
        return inputs?.map(input => /\.vsix$/i.test(input) ? pathToURI(input).href : input);
    }
    function fatal(message, err) {
        console.error('Unable to connect to VS Code server: ' + message);
        console.error(err);
        process.exit(1);
    }
    const preferredCwd = process.env.PWD || (0, process_1.cwd)(); // prefer process.env.PWD as it does not follow symlinks
    function pathToURI(input) {
        input = input.trim();
        input = (0, path_1.resolve)(preferredCwd, input);
        return _url.pathToFileURL(input);
    }
    function translatePath(input, mapFileUri, folderURIS, fileURIS) {
        const url = pathToURI(input);
        const mappedUri = mapFileUri(url.href);
        try {
            const stat = _fs.lstatSync(_fs.realpathSync(input));
            if (stat.isFile()) {
                fileURIS.push(mappedUri);
            }
            else if (stat.isDirectory()) {
                folderURIS.push(mappedUri);
            }
            else if (input === '/dev/null') {
                // handle /dev/null passed to us by external tools such as `git difftool`
                fileURIS.push(mappedUri);
            }
        }
        catch (e) {
            if (e.code === 'ENOENT') {
                fileURIS.push(mappedUri);
            }
            else {
                console.log(`Problem accessing file ${input}. Ignoring file`, e);
            }
        }
    }
    function mapFileToRemoteUri(uri) {
        return uri.replace(/^file:\/\//, 'vscode-remote://' + cliRemoteAuthority);
    }
    const [, , productName, version, commit, executableName, ...remainingArgs] = process.argv;
    main({ productName, version, commit, executableName }, remainingArgs).then(null, err => {
        console.error(err.message || err.stack || err);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmNsaS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvc2VydmVyL25vZGUvc2VydmVyLmNsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXNGaEcsb0JBNlBDO0lBalRELE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxRQUFnQyxFQUFFLEVBQUU7UUFDOUQsUUFBUSxRQUFRLEVBQUUsQ0FBQztZQUNsQixLQUFLLGVBQWUsQ0FBQztZQUNyQixLQUFLLGdCQUFnQixDQUFDO1lBQ3RCLEtBQUssOEJBQThCLENBQUM7WUFDcEMsS0FBSyxnQkFBZ0IsQ0FBQztZQUN0QixLQUFLLDBCQUEwQixDQUFDO1lBQ2hDLEtBQUsseUJBQXlCLENBQUM7WUFDL0IsS0FBSyx3QkFBd0IsQ0FBQztZQUM5QixLQUFLLFdBQVc7Z0JBQ2YsT0FBTyxLQUFLLENBQUM7WUFDZDtnQkFDQyxPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7SUFDRixDQUFDLENBQUM7SUFFRixNQUFNLGtCQUFrQixHQUFHLENBQUMsUUFBZ0MsRUFBRSxFQUFFO1FBQy9ELFFBQVEsUUFBUSxFQUFFLENBQUM7WUFDbEIsS0FBSyxTQUFTLENBQUM7WUFDZixLQUFLLE1BQU0sQ0FBQztZQUNaLEtBQUssWUFBWSxDQUFDO1lBQ2xCLEtBQUssVUFBVSxDQUFDO1lBQ2hCLEtBQUssS0FBSyxDQUFDO1lBQ1gsS0FBSyxNQUFNLENBQUM7WUFDWixLQUFLLE9BQU8sQ0FBQztZQUNiLEtBQUssTUFBTSxDQUFDO1lBQ1osS0FBSyxNQUFNLENBQUM7WUFDWixLQUFLLGNBQWMsQ0FBQztZQUNwQixLQUFLLFlBQVksQ0FBQztZQUNsQixLQUFLLFFBQVEsQ0FBQztZQUNkLEtBQUssbUJBQW1CLENBQUM7WUFDekIsS0FBSyxxQkFBcUIsQ0FBQztZQUMzQixLQUFLLG1CQUFtQixD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