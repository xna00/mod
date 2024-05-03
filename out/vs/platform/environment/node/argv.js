/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "minimist", "vs/base/common/platform", "vs/nls"], function (require, exports, minimist, platform_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OPTIONS = exports.NATIVE_CLI_COMMANDS = void 0;
    exports.parseArgs = parseArgs;
    exports.formatOptions = formatOptions;
    exports.buildHelpMessage = buildHelpMessage;
    exports.buildVersionMessage = buildVersionMessage;
    /**
     * This code is also used by standalone cli's. Avoid adding any other dependencies.
     */
    const helpCategories = {
        o: (0, nls_1.localize)('optionsUpperCase', "Options"),
        e: (0, nls_1.localize)('extensionsManagement', "Extensions Management"),
        t: (0, nls_1.localize)('troubleshooting', "Troubleshooting")
    };
    exports.NATIVE_CLI_COMMANDS = ['tunnel', 'serve-web'];
    exports.OPTIONS = {
        'tunnel': {
            type: 'subcommand',
            description: 'Make the current machine accessible from vscode.dev or other machines through a secure tunnel',
            options: {
                'cli-data-dir': { type: 'string', args: 'dir', description: (0, nls_1.localize)('cliDataDir', "Directory where CLI metadata should be stored.") },
                'disable-telemetry': { type: 'boolean' },
                'telemetry-level': { type: 'string' },
                user: {
                    type: 'subcommand',
                    options: {
                        login: {
                            type: 'subcommand',
                            options: {
                                provider: { type: 'string' },
                                'access-token': { type: 'string' }
                            }
                        }
                    }
                }
            }
        },
        'serve-web': {
            type: 'subcommand',
            description: 'Run a server that displays the editor UI in browsers.',
            options: {
                'cli-data-dir': { type: 'string', args: 'dir', description: (0, nls_1.localize)('cliDataDir', "Directory where CLI metadata should be stored.") },
                'disable-telemetry': { type: 'boolean' },
                'telemetry-level': { type: 'string' },
            }
        },
        'diff': { type: 'boolean', cat: 'o', alias: 'd', args: ['file', 'file'], description: (0, nls_1.localize)('diff', "Compare two files with each other.") },
        'merge': { type: 'boolean', cat: 'o', alias: 'm', args: ['path1', 'path2', 'base', 'result'], description: (0, nls_1.localize)('merge', "Perform a three-way merge by providing paths for two modified versions of a file, the common origin of both modified versions and the output file to save merge results.") },
        'add': { type: 'boolean', cat: 'o', alias: 'a', args: 'folder', description: (0, nls_1.localize)('add', "Add folder(s) to the last active window.") },
        'goto': { type: 'boolean', cat: 'o', alias: 'g', args: 'file:line[:character]', description: (0, nls_1.localize)('goto', "Open a file at the path on the specified line and character position.") },
        'new-window': { type: 'boolean', cat: 'o', alias: 'n', description: (0, nls_1.localize)('newWindow', "Force to open a new window.") },
        'reuse-window': { type: 'boolean', cat: 'o', alias: 'r', description: (0, nls_1.localize)('reuseWindow', "Force to open a file or folder in an already opened window.") },
        'wait': { type: 'boolean', cat: 'o', alias: 'w', description: (0, nls_1.localize)('wait', "Wait for the files to be closed before returning.") },
        'waitMarkerFilePath': { type: 'string' },
        'locale': { type: 'string', cat: 'o', args: 'locale', description: (0, nls_1.localize)('locale', "The locale to use (e.g. en-US or zh-TW).") },
        'user-data-dir': { type: 'string', cat: 'o', args: 'dir', description: (0, nls_1.localize)('userDataDir', "Specifies the directory that user data is kept in. Can be used to open multiple distinct instances of Code.") },
        'profile': { type: 'string', 'cat': 'o', args: 'profileName', description: (0, nls_1.localize)('profileName', "Opens the provided folder or workspace with the given profile and associates the profile with the workspace. If the profile does not exist, a new empty one is created.") },
        'help': { type: 'boolean', cat: 'o', alias: 'h', description: (0, nls_1.localize)('help', "Print usage.") },
        'extensions-dir': { type: 'string', deprecates: ['extensionHomePath'], cat: 'e', args: 'dir', description: (0, nls_1.localize)('extensionHomePath', "Set the root path for extensions.") },
        'extensions-download-dir': { type: 'string' },
        'builtin-extensions-dir': { type: 'string' },
        'list-extensions': { type: 'boolean', cat: 'e', description: (0, nls_1.localize)('listExtensions', "List the installed extensions.") },
        'show-versions': { type: 'boolean', cat: 'e', description: (0, nls_1.localize)('showVersions', "Show versions of installed extensions, when using --list-extensions.") },
        'category': { type: 'string', allowEmptyValue: true, cat: 'e', description: (0, nls_1.localize)('category', "Filters installed extensions by provided category, when using --list-extensions."), args: 'category' },
        'install-extension': { type: 'string[]', cat: 'e', args: 'ext-id | path', description: (0, nls_1.localize)('installExtension', "Installs or updates an extension. The argument is either an extension id or a path to a VSIX. The identifier of an extension is '${publisher}.${name}'. Use '--force' argument to update to latest version. To install a specific version provide '@${version}'. For example: 'vscode.csharp@1.2.3'.") },
        'pre-release': { type: 'boolean', cat: 'e', description: (0, nls_1.localize)('install prerelease', "Installs the pre-release version of the extension, when using --install-extension") },
        'uninstall-extension': { type: 'string[]', cat: 'e', args: 'ext-id', description: (0, nls_1.localize)('uninstallExtension', "Uninstalls an extension.") },
        'update-extensions': { type: 'boolean', cat: 'e', description: (0, nls_1.localize)('updateExtensions', "Update the installed extensions.") },
        'enable-proposed-api': { type: 'string[]', allowEmptyValue: true, cat: 'e', args: 'ext-id', description: (0, nls_1.localize)('experimentalApis', "Enables proposed API features for extensions. Can receive one or more extension IDs to enable individually.") },
        'version': { type: 'boolean', cat: 't', alias: 'v', description: (0, nls_1.localize)('version', "Print version.") },
        'verbose': { type: 'boolean', cat: 't', global: true, description: (0, nls_1.localize)('verbose', "Print verbose output (implies --wait).") },
        'log': { type: 'string[]', cat: 't', args: 'level', global: true, description: (0, nls_1.localize)('log', "Log level to use. Default is 'info'. Allowed values are 'critical', 'error', 'warn', 'info', 'debug', 'trace', 'off'. You can also configure the log level of an extension by passing extension id and log level in the following format: '${publisher}.${name}:${logLevel}'. For example: 'vscode.csharp:trace'. Can receive one or more such entries.") },
        'status': { type: 'boolean', alias: 's', cat: 't', description: (0, nls_1.localize)('status', "Print process usage and diagnostics information.") },
        'prof-startup': { type: 'boolean', cat: 't', description: (0, nls_1.localize)('prof-startup', "Run CPU profiler during startup.") },
        'prof-append-timers': { type: 'string' },
        'prof-duration-markers': { type: 'string[]' },
        'prof-duration-markers-file': { type: 'string' },
        'no-cached-data': { type: 'boolean' },
        'prof-startup-prefix': { type: 'string' },
        'prof-v8-extensions': { type: 'boolean' },
        'disable-extensions': { type: 'boolean', deprecates: ['disableExtensions'], cat: 't', description: (0, nls_1.localize)('disableExtensions', "Disable all installed extensions. This option is not persisted and is effective only when the command opens a new window.") },
        'disable-extension': { type: 'string[]', cat: 't', args: 'ext-id', description: (0, nls_1.localize)('disableExtension', "Disable the provided extension. This option is not persisted and is effective only when the command opens a new window.") },
        'sync': { type: 'string', cat: 't', description: (0, nls_1.localize)('turn sync', "Turn sync on or off."), args: ['on | off'] },
        'inspect-extensions': { type: 'string', allowEmptyValue: true, deprecates: ['debugPluginHost'], args: 'port', cat: 't', description: (0, nls_1.localize)('inspect-extensions', "Allow debugging and profiling of extensions. Check the developer tools for the connection URI.") },
        'inspect-brk-extensions': { type: 'string', allowEmptyValue: true, deprecates: ['debugBrkPluginHost'], args: 'port', cat: 't', description: (0, nls_1.localize)('inspect-brk-extensions', "Allow debugging and profiling of extensions with the extension host being paused after start. Check the developer tools for the connection URI.") },
        'disable-gpu': { type: 'boolean', cat: 't', description: (0, nls_1.localize)('disableGPU', "Disable GPU hardware acceleration.") },
        'disable-chromium-sandbox': { type: 'boolean', cat: 't', description: (0, nls_1.localize)('disableChromiumSandbox', "Use this option only when there is requirement to launch the application as sudo user on Linux or when running as an elevated user in an applocker environment on Windows.") },
        'sandbox': { type: 'boolean' },
        'telemetry': { type: 'boolean', cat: 't', description: (0, nls_1.localize)('telemetry', "Shows all telemetry events which VS code collects.") },
        'remote': { type: 'string', allowEmptyValue: true },
        'folder-uri': { type: 'string[]', cat: 'o', args: 'uri' },
        'file-uri': { type: 'string[]', cat: 'o', args: 'uri' },
        'locate-extension': { type: 'string[]' },
        'extensionDevelopmentPath': { type: 'string[]' },
        'extensionDevelopmentKind': { type: 'string[]' },
        'extensionTestsPath': { type: 'string' },
        'extensionEnvironment': { type: 'string' },
        'debugId': { type: 'string' },
        'debugRenderer': { type: 'boolean' },
        'inspect-ptyhost': { type: 'string', allowEmptyValue: true },
        'inspect-brk-ptyhost': { type: 'string', allowEmptyValue: true },
        'inspect-search': { type: 'string', deprecates: ['debugSearch'], allowEmptyValue: true },
        'inspect-brk-search': { type: 'string', deprecates: ['debugBrkSearch'], allowEmptyValue: true },
        'inspect-sharedprocess': { type: 'string', allowEmptyValue: true },
        'inspect-brk-sharedprocess': { type: 'string', allowEmptyValue: true },
        'export-default-configuration': { type: 'string' },
        'install-source': { type: 'string' },
        'enable-smoke-test-driver': { type: 'boolean' },
        'logExtensionHostCommunication': { type: 'boolean' },
        'skip-release-notes': { type: 'boolean' },
        'skip-welcome': { type: 'boolean' },
        'disable-telemetry': { type: 'boolean' },
        'disable-updates': { type: 'boolean' },
        'use-inmemory-secretstorage': { type: 'boolean', deprecates: ['disable-keytar'] },
        'password-store': { type: 'string' },
        'disable-workspace-trust': { type: 'boolean' },
        'disable-crash-reporter': { type: 'boolean' },
        'crash-reporter-directory': { type: 'string' },
        'crash-reporter-id': { type: 'string' },
        'skip-add-to-recently-opened': { type: 'boolean' },
        'unity-launch': { type: 'boolean' },
        'open-url': { type: 'boolean' },
        'file-write': { type: 'boolean' },
        'file-chmod': { type: 'boolean' },
        'install-builtin-extension': { type: 'string[]' },
        'force': { type: 'boolean' },
        'do-not-sync': { type: 'boolean' },
        'trace': { type: 'boolean' },
        'trace-category-filter': { type: 'string' },
        'trace-options': { type: 'string' },
        'preserve-env': { type: 'boolean' },
        'force-user-env': { type: 'boolean' },
        'force-disable-user-env': { type: 'boolean' },
        'open-devtools': { type: 'boolean' },
        'disable-gpu-sandbox': { type: 'boolean' },
        'logsPath': { type: 'string' },
        '__enable-file-policy': { type: 'boolean' },
        'editSessionId': { type: 'string' },
        'continueOn': { type: 'string' },
        'locate-shell-integration-path': { type: 'string', args: ['bash', 'pwsh', 'zsh', 'fish'] },
        'enable-coi': { type: 'boolean' },
        // chromium flags
        'no-proxy-server': { type: 'boolean' },
        // Minimist incorrectly parses keys that start with `--no`
        // https://github.com/substack/minimist/blob/aeb3e27dae0412de5c0494e9563a5f10c82cc7a9/index.js#L118-L121
        // If --no-sandbox is passed via cli wrapper it will be treated as --sandbox which is incorrect, we use
        // the alias here to make sure --no-sandbox is always respected.
        // For https://github.com/microsoft/vscode/issues/128279
        'no-sandbox': { type: 'boolean', alias: 'sandbox' },
        'proxy-server': { type: 'string' },
        'proxy-bypass-list': { type: 'string' },
        'proxy-pac-url': { type: 'string' },
        'js-flags': { type: 'string' }, // chrome js flags
        'inspect': { type: 'string', allowEmptyValue: true },
        'inspect-brk': { type: 'string', allowEmptyValue: true },
        'nolazy': { type: 'boolean' }, // node inspect
        'force-device-scale-factor': { type: 'string' },
        'force-renderer-accessibility': { type: 'boolean' },
        'ignore-certificate-errors': { type: 'boolean' },
        'allow-insecure-localhost': { type: 'boolean' },
        'log-net-log': { type: 'string' },
        'vmodule': { type: 'string' },
        '_urls': { type: 'string[]' },
        'disable-dev-shm-usage': { type: 'boolean' },
        'profile-temp': { type: 'boolean' },
        'ozone-platform': { type: 'string' },
        _: { type: 'string[]' } // main arguments
    };
    const ignoringReporter = {
        onUnknownOption: () => { },
        onMultipleValues: () => { },
        onEmptyValue: () => { },
        onDeprecatedOption: () => { }
    };
    function parseArgs(args, options, errorReporter = ignoringReporter) {
        const firstArg = args.find(a => a.length > 0 && a[0] !== '-');
        const alias = {};
        const stringOptions = ['_'];
        const booleanOptions = [];
        const globalOptions = {};
        let command = undefined;
        for (const optionId in options) {
            const o = options[optionId];
            if (o.type === 'subcommand') {
                if (optionId === firstArg) {
                    command = o;
                }
            }
            else {
                if (o.alias) {
                    alias[optionId] = o.alias;
                }
                if (o.type === 'string' || o.type === 'string[]') {
                    stringOptions.push(optionId);
                    if (o.deprecates) {
                        stringOptions.push(...o.deprecates);
                    }
                }
                else if (o.type === 'boolean') {
                    booleanOptions.push(optionId);
                    if (o.deprecates) {
                        booleanOptions.push(...o.deprecates);
                    }
                }
                if (o.global) {
                    globalOptions[optionId] = o;
                }
            }
        }
        if (command && firstArg) {
            const options = globalOptions;
            for (const optionId in command.options) {
                options[optionId] = command.options[optionId];
            }
            const newArgs = args.filter(a => a !== firstArg);
            const reporter = errorReporter.getSubcommandReporter ? errorReporter.getSubcommandReporter(firstArg) : undefined;
            const subcommandOptions = parseArgs(newArgs, options, reporter);
            return {
                [firstArg]: subcommandOptions,
                _: []
            };
        }
        // remove aliases to avoid confusion
        const parsedArgs = minimist(args, { string: stringOptions, boolean: booleanOptions, alias });
        const cleanedArgs = {};
        const remainingArgs = parsedArgs;
        // https://github.com/microsoft/vscode/issues/58177, https://github.com/microsoft/vscode/issues/106617
        cleanedArgs._ = parsedArgs._.map(arg => String(arg)).filter(arg => arg.length > 0);
        delete remainingArgs._;
        for (const optionId in options) {
            const o = options[optionId];
            if (o.type === 'subcommand') {
                continue;
            }
            if (o.alias) {
                delete remainingArgs[o.alias];
            }
            let val = remainingArgs[optionId];
            if (o.deprecates) {
                for (const deprecatedId of o.deprecates) {
                    if (remainingArgs.hasOwnProperty(deprecatedId)) {
                        if (!val) {
                            val = remainingArgs[deprecatedId];
                            if (val) {
                                errorReporter.onDeprecatedOption(deprecatedId, o.deprecationMessage || (0, nls_1.localize)('deprecated.useInstead', 'Use {0} instead.', optionId));
                            }
                        }
                        delete remainingArgs[deprecatedId];
                    }
                }
            }
            if (typeof val !== 'undefined') {
                if (o.type === 'string[]') {
                    if (!Array.isArray(val)) {
                        val = [val];
                    }
                    if (!o.allowEmptyValue) {
                        const sanitized = val.filter((v) => v.length > 0);
                        if (sanitized.length !== val.length) {
                            errorReporter.onEmptyValue(optionId);
                            val = sanitized.length > 0 ? sanitized : undefined;
                        }
                    }
                }
                else if (o.type === 'string') {
                    if (Array.isArray(val)) {
                        val = val.pop(); // take the last
                        errorReporter.onMultipleValues(optionId, val);
                    }
                    else if (!val && !o.allowEmptyValue) {
                        errorReporter.onEmptyValue(optionId);
                        val = undefined;
                    }
                }
                cleanedArgs[optionId] = val;
                if (o.deprecationMessage) {
                    errorReporter.onDeprecatedOption(optionId, o.deprecationMessage);
                }
            }
            delete remainingArgs[optionId];
        }
        for (const key in remainingArgs) {
            errorReporter.onUnknownOption(key);
        }
        return cleanedArgs;
    }
    function formatUsage(optionId, option) {
        let args = '';
        if (option.args) {
            if (Array.isArray(option.args)) {
                args = ` <${option.args.join('> <')}>`;
            }
            else {
                args = ` <${option.args}>`;
            }
        }
        if (option.alias) {
            return `-${option.alias} --${optionId}${args}`;
        }
        return `--${optionId}${args}`;
    }
    // exported only for testing
    function formatOptions(options, columns) {
        const usageTexts = [];
        for (const optionId in options) {
            const o = options[optionId];
            const usageText = formatUsage(optionId, o);
            usageTexts.push([usageText, o.description]);
        }
        return formatUsageTexts(usageTexts, columns);
    }
    function formatUsageTexts(usageTexts, columns) {
        const maxLength = usageTexts.reduce((previous, e) => Math.max(previous, e[0].length), 12);
        const argLength = maxLength + 2 /*left padding*/ + 1 /*right padding*/;
        if (columns - argLength < 25) {
            // Use a condensed version on narrow terminals
            return usageTexts.reduce((r, ut) => r.concat([`  ${ut[0]}`, `      ${ut[1]}`]), []);
        }
        const descriptionColumns = columns - argLength - 1;
        const result = [];
        for (const ut of usageTexts) {
            const usage = ut[0];
            const wrappedDescription = wrapText(ut[1], descriptionColumns);
            const keyPadding = indent(argLength - usage.length - 2 /*left padding*/);
            result.push('  ' + usage + keyPadding + wrappedDescription[0]);
            for (let i = 1; i < wrappedDescription.length; i++) {
                result.push(indent(argLength) + wrappedDescription[i]);
            }
        }
        return result;
    }
    function indent(count) {
        return ' '.repeat(count);
    }
    function wrapText(text, columns) {
        const lines = [];
        while (text.length) {
            const index = text.length < columns ? text.length : text.lastIndexOf(' ', columns);
            const line = text.slice(0, index).trim();
            text = text.slice(index);
            lines.push(line);
        }
        return lines;
    }
    function buildHelpMessage(productName, executableName, version, options, capabilities) {
        const columns = (process.stdout).isTTY && (process.stdout).columns || 80;
        const inputFiles = capabilities?.noInputFiles !== true ? `[${(0, nls_1.localize)('paths', 'paths')}...]` : '';
        const help = [`${productName} ${version}`];
        help.push('');
        help.push(`${(0, nls_1.localize)('usage', "Usage")}: ${executableName} [${(0, nls_1.localize)('options', "options")}]${inputFiles}`);
        help.push('');
        if (capabilities?.noPipe !== true) {
            if (platform_1.isWindows) {
                help.push((0, nls_1.localize)('stdinWindows', "To read output from another program, append '-' (e.g. 'echo Hello World | {0} -')", executableName));
            }
            else {
                help.push((0, nls_1.localize)('stdinUnix', "To read from stdin, append '-' (e.g. 'ps aux | grep code | {0} -')", executableName));
            }
            help.push('');
        }
        const optionsByCategory = {};
        const subcommands = [];
        for (const optionId in options) {
            const o = options[optionId];
            if (o.type === 'subcommand') {
                if (o.description) {
                    subcommands.push({ command: optionId, description: o.description });
                }
            }
            else if (o.description && o.cat) {
                let optionsByCat = optionsByCategory[o.cat];
                if (!optionsByCat) {
                    optionsByCategory[o.cat] = optionsByCat = {};
                }
                optionsByCat[optionId] = o;
            }
        }
        for (const helpCategoryKey in optionsByCategory) {
            const key = helpCategoryKey;
            const categoryOptions = optionsByCategory[key];
            if (categoryOptions) {
                help.push(helpCategories[key]);
                help.push(...formatOptions(categoryOptions, columns));
                help.push('');
            }
        }
        if (subcommands.length) {
            help.push((0, nls_1.localize)('subcommands', "Subcommands"));
            help.push(...formatUsageTexts(subcommands.map(s => [s.command, s.description]), columns));
            help.push('');
        }
        return help.join('\n');
    }
    function buildVersionMessage(version, commit) {
        return `${version || (0, nls_1.localize)('unknownVersion', "Unknown version")}\n${commit || (0, nls_1.localize)('unknownCommit', "Unknown commit")}\n${process.arch}`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJndi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZW52aXJvbm1lbnQvbm9kZS9hcmd2LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdPaEcsOEJBd0hDO0lBa0JELHNDQVFDO0lBc0NELDRDQW1EQztJQUVELGtEQUVDO0lBeGNEOztPQUVHO0lBQ0gsTUFBTSxjQUFjLEdBQUc7UUFDdEIsQ0FBQyxFQUFFLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLFNBQVMsQ0FBQztRQUMxQyxDQUFDLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsdUJBQXVCLENBQUM7UUFDNUQsQ0FBQyxFQUFFLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDO0tBQ2pELENBQUM7SUE2QlcsUUFBQSxtQkFBbUIsR0FBRyxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQVUsQ0FBQztJQUV2RCxRQUFBLE9BQU8sR0FBbUQ7UUFDdEUsUUFBUSxFQUFFO1lBQ1QsSUFBSSxFQUFFLFlBQVk7WUFDbEIsV0FBVyxFQUFFLCtGQUErRjtZQUM1RyxPQUFPLEVBQUU7Z0JBQ1IsY0FBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsZ0RBQWdELENBQUMsRUFBRTtnQkFDdEksbUJBQW1CLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO2dCQUN4QyxpQkFBaUIsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7Z0JBQ3JDLElBQUksRUFBRTtvQkFDTCxJQUFJLEVBQUUsWUFBWTtvQkFDbEIsT0FBTyxFQUFFO3dCQUNSLEtBQUssRUFBRTs0QkFDTixJQUFJLEVBQUUsWUFBWTs0QkFDbEIs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