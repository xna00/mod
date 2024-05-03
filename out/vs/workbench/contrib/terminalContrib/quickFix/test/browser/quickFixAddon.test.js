/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextview/browser/contextMenuService", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/terminal/common/capabilities/commandDetectionCapability", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/workbench/contrib/terminalContrib/quickFix/browser/terminalQuickFixBuiltinActions", "vs/workbench/contrib/terminalContrib/quickFix/browser/quickFixAddon", "vs/base/common/uri", "vs/base/common/event", "vs/platform/label/common/label", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/contrib/terminalContrib/quickFix/browser/quickFix", "vs/amdX", "vs/editor/test/browser/editorTestServices", "vs/base/test/common/utils"], function (require, exports, assert_1, platform_1, configuration_1, testConfigurationService_1, contextMenuService_1, contextView_1, instantiationServiceMock_1, log_1, commandDetectionCapability_1, terminalCapabilityStore_1, terminalQuickFixBuiltinActions_1, quickFixAddon_1, uri_1, event_1, label_1, opener_1, storage_1, workbenchTestServices_1, quickFix_1, amdX_1, editorTestServices_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('QuickFixAddon', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let quickFixAddon;
        let commandDetection;
        let commandService;
        let openerService;
        let labelService;
        let terminal;
        let instantiationService;
        setup(async () => {
            instantiationService = store.add(new instantiationServiceMock_1.TestInstantiationService());
            const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
            terminal = store.add(new TerminalCtor({
                allowProposedApi: true,
                cols: 80,
                rows: 30
            }));
            instantiationService.stub(storage_1.IStorageService, store.add(new workbenchTestServices_1.TestStorageService()));
            instantiationService.stub(quickFix_1.ITerminalQuickFixService, {
                onDidRegisterProvider: event_1.Event.None,
                onDidUnregisterProvider: event_1.Event.None,
                onDidRegisterCommandSelector: event_1.Event.None,
                extensionQuickFixes: Promise.resolve([])
            });
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(label_1.ILabelService, {});
            const capabilities = store.add(new terminalCapabilityStore_1.TerminalCapabilityStore());
            instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            commandDetection = store.add(instantiationService.createInstance(commandDetectionCapability_1.CommandDetectionCapability, terminal));
            capabilities.add(2 /* TerminalCapability.CommandDetection */, commandDetection);
            instantiationService.stub(contextView_1.IContextMenuService, store.add(instantiationService.createInstance(contextMenuService_1.ContextMenuService)));
            instantiationService.stub(opener_1.IOpenerService, {});
            commandService = new editorTestServices_1.TestCommandService(instantiationService);
            quickFixAddon = instantiationService.createInstance(quickFixAddon_1.TerminalQuickFixAddon, [], capabilities);
            terminal.loadAddon(quickFixAddon);
        });
        suite('registerCommandFinishedListener & getMatchActions', () => {
            suite('gitSimilarCommand', () => {
                const expectedMap = new Map();
                const command = `git sttatus`;
                let output = `git: 'sttatus' is not a git command. See 'git --help'.

			The most similar command is
			status`;
                const exitCode = 1;
                const actions = [{
                        id: 'Git Similar',
                        enabled: true,
                        label: 'Run: git status',
                        tooltip: 'Run: git status',
                        command: 'git status'
                    }];
                const outputLines = output.split('\n');
                setup(() => {
                    const command = (0, terminalQuickFixBuiltinActions_1.gitSimilar)();
                    expectedMap.set(command.commandLineMatcher.toString(), [command]);
                    quickFixAddon.registerCommandFinishedListener(command);
                });
                suite('returns undefined when', () => {
                    test('output does not match', async () => {
                        (0, assert_1.strictEqual)(await ((0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, `invalid output`, terminalQuickFixBuiltinActions_1.GitSimilarOutputRegex, exitCode, [`invalid output`]), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                    test('command does not match', async () => {
                        (0, assert_1.strictEqual)(await ((0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(`gt sttatus`, output, terminalQuickFixBuiltinActions_1.GitSimilarOutputRegex, exitCode, outputLines), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                });
                suite('returns actions when', () => {
                    test('expected unix exit code', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitSimilarOutputRegex, exitCode, outputLines), expectedMap, commandService, openerService, labelService)), actions);
                    });
                    test('matching exit status', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitSimilarOutputRegex, 2, outputLines), expectedMap, commandService, openerService, labelService)), actions);
                    });
                });
                suite('returns match', () => {
                    test('returns match', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitSimilarOutputRegex, exitCode, outputLines), expectedMap, commandService, openerService, labelService)), actions);
                    });
                    test('returns multiple match', async () => {
                        output = `git: 'pu' is not a git command. See 'git --help'.
				The most similar commands are
						pull
						push`;
                        const actions = [{
                                id: 'Git Similar',
                                enabled: true,
                                label: 'Run: git pull',
                                tooltip: 'Run: git pull',
                                command: 'git pull'
                            }, {
                                id: 'Git Similar',
                                enabled: true,
                                label: 'Run: git push',
                                tooltip: 'Run: git push',
                                command: 'git push'
                            }];
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand('git pu', output, terminalQuickFixBuiltinActions_1.GitSimilarOutputRegex, exitCode, output.split('\n')), expectedMap, commandService, openerService, labelService)), actions);
                    });
                    test('passes any arguments through', async () => {
                        output = `git: 'checkoutt' is not a git command. See 'git --help'.
				The most similar commands are
						checkout`;
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand('git checkoutt .', output, terminalQuickFixBuiltinActions_1.GitSimilarOutputRegex, exitCode, output.split('\n')), expectedMap, commandService, openerService, labelService)), [{
                                id: 'Git Similar',
                                enabled: true,
                                label: 'Run: git checkout .',
                                tooltip: 'Run: git checkout .',
                                command: 'git checkout .'
                            }]);
                    });
                });
            });
            suite('gitTwoDashes', () => {
                const expectedMap = new Map();
                const command = `git add . -all`;
                const output = 'error: did you mean `--all` (with two dashes)?';
                const exitCode = 1;
                const actions = [{
                        id: 'Git Two Dashes',
                        enabled: true,
                        label: 'Run: git add . --all',
                        tooltip: 'Run: git add . --all',
                        command: 'git add . --all'
                    }];
                setup(() => {
                    const command = (0, terminalQuickFixBuiltinActions_1.gitTwoDashes)();
                    expectedMap.set(command.commandLineMatcher.toString(), [command]);
                    quickFixAddon.registerCommandFinishedListener(command);
                });
                suite('returns undefined when', () => {
                    test('output does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, `invalid output`, terminalQuickFixBuiltinActions_1.GitTwoDashesRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                    test('command does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(`gt sttatus`, output, terminalQuickFixBuiltinActions_1.GitTwoDashesRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                });
                suite('returns actions when', () => {
                    test('expected unix exit code', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitTwoDashesRegex, exitCode), expectedMap, commandService, openerService, labelService)), actions);
                    });
                    test('matching exit status', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitTwoDashesRegex, 2), expectedMap, commandService, openerService, labelService)), actions);
                    });
                });
            });
            suite('gitPull', () => {
                const expectedMap = new Map();
                const command = `git checkout vnext`;
                const output = 'Already on \'vnext\' \n Your branch is behind \'origin/vnext\' by 1 commit, and can be fast-forwarded.';
                const exitCode = 0;
                const actions = [{
                        id: 'Git Pull',
                        enabled: true,
                        label: 'Run: git pull',
                        tooltip: 'Run: git pull',
                        command: 'git pull'
                    }];
                setup(() => {
                    const command = (0, terminalQuickFixBuiltinActions_1.gitPull)();
                    expectedMap.set(command.commandLineMatcher.toString(), [command]);
                    quickFixAddon.registerCommandFinishedListener(command);
                });
                suite('returns undefined when', () => {
                    test('output does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, `invalid output`, terminalQuickFixBuiltinActions_1.GitPullOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                    test('command does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(`gt add`, output, terminalQuickFixBuiltinActions_1.GitPullOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                    test('exit code does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitPullOutputRegex, 2), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                });
                suite('returns actions when', () => {
                    test('matching exit status, command, ouput', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitPullOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), actions);
                    });
                });
            });
            if (!platform_1.isWindows) {
                suite('freePort', () => {
                    const expectedMap = new Map();
                    const portCommand = `yarn start dev`;
                    const output = `yarn run v1.22.17
			warning ../../package.json: No license field
			Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
				at Server.setupListenHandle [as _listen2] (node:net:1315:16)
				at listenInCluster (node:net:1363:12)
				at doListen (node:net:1501:7)
				at processTicksAndRejections (node:internal/process/task_queues:84:21)
			Emitted 'error' event on WebSocketServer instance at:
				at Server.emit (node:events:394:28)
				at emitErrorNT (node:net:1342:8)
				at processTicksAndRejections (node:internal/process/task_queues:83:21) {
			}
			error Command failed with exit code 1.
			info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.`;
                    const actionOptions = [{
                            id: 'Free Port',
                            label: 'Free port 3000',
                            run: true,
                            tooltip: 'Free port 3000',
                            enabled: true
                        }];
                    setup(() => {
                        const command = (0, terminalQuickFixBuiltinActions_1.freePort)(() => Promise.resolve());
                        expectedMap.set(command.commandLineMatcher.toString(), [command]);
                        quickFixAddon.registerCommandFinishedListener(command);
                    });
                    suite('returns undefined when', () => {
                        test('output does not match', async () => {
                            (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(portCommand, `invalid output`, terminalQuickFixBuiltinActions_1.FreePortOutputRegex), expectedMap, commandService, openerService, labelService)), undefined);
                        });
                    });
                    test('returns actions', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(portCommand, output, terminalQuickFixBuiltinActions_1.FreePortOutputRegex), expectedMap, commandService, openerService, labelService)), actionOptions);
                    });
                });
            }
            suite('gitPushSetUpstream', () => {
                const expectedMap = new Map();
                const command = `git push`;
                const output = `fatal: The current branch test22 has no upstream branch.
			To push the current branch and set the remote as upstream, use

				git push --set-upstream origin test22`;
                const exitCode = 128;
                const actions = [{
                        id: 'Git Push Set Upstream',
                        enabled: true,
                        label: 'Run: git push --set-upstream origin test22',
                        tooltip: 'Run: git push --set-upstream origin test22',
                        command: 'git push --set-upstream origin test22'
                    }];
                setup(() => {
                    const command = (0, terminalQuickFixBuiltinActions_1.gitPushSetUpstream)();
                    expectedMap.set(command.commandLineMatcher.toString(), [command]);
                    quickFixAddon.registerCommandFinishedListener(command);
                });
                suite('returns undefined when', () => {
                    test('output does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, `invalid output`, terminalQuickFixBuiltinActions_1.GitPushOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                    test('command does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(`git status`, output, terminalQuickFixBuiltinActions_1.GitPushOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                });
                suite('returns actions when', () => {
                    test('expected unix exit code', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitPushOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), actions);
                    });
                    test('matching exit status', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitPushOutputRegex, 2), expectedMap, commandService, openerService, labelService)), actions);
                    });
                });
            });
            suite('gitCreatePr', () => {
                const expectedMap = new Map();
                const command = `git push`;
                const output = `Total 0 (delta 0), reused 0 (delta 0), pack-reused 0
			remote:
			remote: Create a pull request for 'test22' on GitHub by visiting:
			remote:      https://github.com/meganrogge/xterm.js/pull/new/test22
			remote:
			To https://github.com/meganrogge/xterm.js
			 * [new branch]        test22 -> test22
			Branch 'test22' set up to track remote branch 'test22' from 'origin'. `;
                const exitCode = 0;
                const actions = [{
                        id: 'Git Create Pr',
                        enabled: true,
                        label: 'Open: https://github.com/meganrogge/xterm.js/pull/new/test22',
                        tooltip: 'Open: https://github.com/meganrogge/xterm.js/pull/new/test22',
                        uri: uri_1.URI.parse('https://github.com/meganrogge/xterm.js/pull/new/test22')
                    }];
                setup(() => {
                    const command = (0, terminalQuickFixBuiltinActions_1.gitCreatePr)();
                    expectedMap.set(command.commandLineMatcher.toString(), [command]);
                    quickFixAddon.registerCommandFinishedListener(command);
                });
                suite('returns undefined when', () => {
                    test('output does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, `invalid output`, terminalQuickFixBuiltinActions_1.GitCreatePrOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                    test('command does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(`git status`, output, terminalQuickFixBuiltinActions_1.GitCreatePrOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                    test('failure exit status', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitCreatePrOutputRegex, 2), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                });
                suite('returns actions when', () => {
                    test('expected unix exit code', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitCreatePrOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), actions);
                    });
                });
            });
        });
        suite('gitPush - multiple providers', () => {
            const expectedMap = new Map();
            const command = `git push`;
            const output = `fatal: The current branch test22 has no upstream branch.
		To push the current branch and set the remote as upstream, use

			git push --set-upstream origin test22`;
            const exitCode = 128;
            const actions = [{
                    id: 'Git Push Set Upstream',
                    enabled: true,
                    label: 'Run: git push --set-upstream origin test22',
                    tooltip: 'Run: git push --set-upstream origin test22',
                    command: 'git push --set-upstream origin test22'
                }];
            setup(() => {
                const pushCommand = (0, terminalQuickFixBuiltinActions_1.gitPushSetUpstream)();
                const prCommand = (0, terminalQuickFixBuiltinActions_1.gitCreatePr)();
                quickFixAddon.registerCommandFinishedListener(prCommand);
                expectedMap.set(pushCommand.commandLineMatcher.toString(), [pushCommand, prCommand]);
            });
            suite('returns undefined when', () => {
                test('output does not match', async () => {
                    (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, `invalid output`, terminalQuickFixBuiltinActions_1.GitPushOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                });
                test('command does not match', async () => {
                    (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(`git status`, output, terminalQuickFixBuiltinActions_1.GitPushOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                });
            });
            suite('returns actions when', () => {
                test('expected unix exit code', async () => {
                    assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitPushOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), actions);
                });
                test('matching exit status', async () => {
                    assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitPushOutputRegex, 2), expectedMap, commandService, openerService, labelService)), actions);
                });
            });
        });
        suite('pwsh feedback providers', () => {
            suite('General', () => {
                const expectedMap = new Map();
                const command = `not important`;
                const output = [
                    `...`,
                    ``,
                    `Suggestion [General]:`,
                    `  The most similar commands are: python3, python3m, pamon, python3.6, rtmon, echo, pushd, etsn, pwsh, pwconv.`,
                    ``,
                    `Suggestion [cmd-not-found]:`,
                    `  Command 'python' not found, but can be installed with:`,
                    `  sudo apt install python3`,
                    `  sudo apt install python`,
                    `  sudo apt install python-minimal`,
                    `  You also have python3 installed, you can run 'python3' instead.'`,
                    ``,
                ].join('\n');
                const exitCode = 128;
                const actions = [
                    'python3',
                    'python3m',
                    'pamon',
                    'python3.6',
                    'rtmon',
                    'echo',
                    'pushd',
                    'etsn',
                    'pwsh',
                    'pwconv',
                ].map(command => {
                    return {
                        id: 'Pwsh General Error',
                        enabled: true,
                        label: `Run: ${command}`,
                        tooltip: `Run: ${command}`,
                        command: command
                    };
                });
                setup(() => {
                    const pushCommand = (0, terminalQuickFixBuiltinActions_1.pwshGeneralError)();
                    quickFixAddon.registerCommandFinishedListener(pushCommand);
                    expectedMap.set(pushCommand.commandLineMatcher.toString(), [pushCommand]);
                });
                test('returns undefined when output does not match', async () => {
                    (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, `invalid output`, terminalQuickFixBuiltinActions_1.PwshGeneralErrorOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                });
                test('returns actions when output matches', async () => {
                    assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.PwshGeneralErrorOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), actions);
                });
            });
            suite('Unix cmd-not-found', () => {
                const expectedMap = new Map();
                const command = `not important`;
                const output = [
                    `...`,
                    ``,
                    `Suggestion [General]`,
                    `  The most similar commands are: python3, python3m, pamon, python3.6, rtmon, echo, pushd, etsn, pwsh, pwconv.`,
                    ``,
                    `Suggestion [cmd-not-found]:`,
                    `  Command 'python' not found, but can be installed with:`,
                    `  sudo apt install python3`,
                    `  sudo apt install python`,
                    `  sudo apt install python-minimal`,
                    `  You also have python3 installed, you can run 'python3' instead.'`,
                    ``,
                ].join('\n');
                const exitCode = 128;
                const actions = [
                    'sudo apt install python3',
                    'sudo apt install python',
                    'sudo apt install python-minimal',
                    'python3',
                ].map(command => {
                    return {
                        id: 'Pwsh Unix Command Not Found Error',
                        enabled: true,
                        label: `Run: ${command}`,
                        tooltip: `Run: ${command}`,
                        command: command
                    };
                });
                setup(() => {
                    const pushCommand = (0, terminalQuickFixBuiltinActions_1.pwshUnixCommandNotFoundError)();
                    quickFixAddon.registerCommandFinishedListener(pushCommand);
                    expectedMap.set(pushCommand.commandLineMatcher.toString(), [pushCommand]);
                });
                test('returns undefined when output does not match', async () => {
                    (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, `invalid output`, terminalQuickFixBuiltinActions_1.PwshUnixCommandNotFoundErrorOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                });
                test('returns actions when output matches', async () => {
                    assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.PwshUnixCommandNotFoundErrorOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), actions);
                });
            });
        });
    });
    function createCommand(command, output, outputMatcher, exitCode, outputLines) {
        return {
            cwd: '',
            commandStartLineContent: '',
            markProperties: {},
            executedX: undefined,
            startX: undefined,
            command,
            isTrusted: true,
            exitCode,
            getOutput: () => { return output; },
            getOutputMatch: (_matcher) => {
                if (outputMatcher) {
                    const regexMatch = output.match(outputMatcher) ?? undefined;
                    if (regexMatch) {
                        return outputLines ? { regexMatch, outputLines } : { regexMatch, outputLines: [] };
                    }
                }
                return undefined;
            },
            timestamp: Date.now(),
            hasOutput: () => !!output
        };
    }
    function assertMatchOptions(actual, expected) {
        (0, assert_1.strictEqual)(actual?.length, expected.length);
        for (let i = 0; i < expected.length; i++) {
            const expectedItem = expected[i];
            const actualItem = actual[i];
            (0, assert_1.strictEqual)(actualItem.id, expectedItem.id, `ID`);
            (0, assert_1.strictEqual)(actualItem.enabled, expectedItem.enabled, `enabled`);
            (0, assert_1.strictEqual)(actualItem.label, expectedItem.label, `label`);
            (0, assert_1.strictEqual)(actualItem.tooltip, expectedItem.tooltip, `tooltip`);
            if (expectedItem.command) {
                (0, assert_1.strictEqual)(actualItem.command, expectedItem.command);
            }
            if (expectedItem.uri) {
                (0, assert_1.strictEqual)(actualItem.uri.toString(), expectedItem.uri.toString());
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tGaXhBZGRvbi50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvcXVpY2tGaXgvdGVzdC9icm93c2VyL3F1aWNrRml4QWRkb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQStCaEcsS0FBSyxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFDM0IsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRXhELElBQUksYUFBb0MsQ0FBQztRQUN6QyxJQUFJLGdCQUE0QyxDQUFDO1FBQ2pELElBQUksY0FBa0MsQ0FBQztRQUN2QyxJQUFJLGFBQTRCLENBQUM7UUFDakMsSUFBSSxZQUEwQixDQUFDO1FBQy9CLElBQUksUUFBa0IsQ0FBQztRQUN2QixJQUFJLG9CQUE4QyxDQUFDO1FBRW5ELEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNoQixvQkFBb0IsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksbURBQXdCLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sWUFBWSxHQUFHLENBQUMsTUFBTSxJQUFBLDBCQUFtQixFQUFnQyxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFDekgsUUFBUSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxZQUFZLENBQUM7Z0JBQ3JDLGdCQUFnQixFQUFFLElBQUk7Z0JBQ3RCLElBQUksRUFBRSxFQUFFO2dCQUNSLElBQUksRUFBRSxFQUFFO2FBQ1IsQ0FBQyxDQUFDLENBQUM7WUFDSixvQkFBb0IsQ0FBQyxJQUFJLENBQUMseUJBQWUsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksMENBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7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