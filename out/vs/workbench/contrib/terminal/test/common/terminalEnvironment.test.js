/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/uri", "vs/workbench/contrib/terminal/common/terminalEnvironment", "vs/base/test/common/utils"], function (require, exports, assert_1, platform_1, uri_1, terminalEnvironment_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench - TerminalEnvironment', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('addTerminalEnvironmentKeys', () => {
            test('should set expected variables', () => {
                const env = {};
                (0, terminalEnvironment_1.addTerminalEnvironmentKeys)(env, '1.2.3', 'en', 'on');
                (0, assert_1.strictEqual)(env['TERM_PROGRAM'], 'vscode');
                (0, assert_1.strictEqual)(env['TERM_PROGRAM_VERSION'], '1.2.3');
                (0, assert_1.strictEqual)(env['COLORTERM'], 'truecolor');
                (0, assert_1.strictEqual)(env['LANG'], 'en_US.UTF-8');
            });
            test('should use language variant for LANG that is provided in locale', () => {
                const env = {};
                (0, terminalEnvironment_1.addTerminalEnvironmentKeys)(env, '1.2.3', 'en-au', 'on');
                (0, assert_1.strictEqual)(env['LANG'], 'en_AU.UTF-8', 'LANG is equal to the requested locale with UTF-8');
            });
            test('should fallback to en_US when no locale is provided', () => {
                const env2 = { FOO: 'bar' };
                (0, terminalEnvironment_1.addTerminalEnvironmentKeys)(env2, '1.2.3', undefined, 'on');
                (0, assert_1.strictEqual)(env2['LANG'], 'en_US.UTF-8', 'LANG is equal to en_US.UTF-8 as fallback.'); // More info on issue #14586
            });
            test('should fallback to en_US when an invalid locale is provided', () => {
                const env3 = { LANG: 'replace' };
                (0, terminalEnvironment_1.addTerminalEnvironmentKeys)(env3, '1.2.3', undefined, 'on');
                (0, assert_1.strictEqual)(env3['LANG'], 'en_US.UTF-8', 'LANG is set to the fallback LANG');
            });
            test('should override existing LANG', () => {
                const env4 = { LANG: 'en_AU.UTF-8' };
                (0, terminalEnvironment_1.addTerminalEnvironmentKeys)(env4, '1.2.3', undefined, 'on');
                (0, assert_1.strictEqual)(env4['LANG'], 'en_US.UTF-8', 'LANG is equal to the parent environment\'s LANG');
            });
        });
        suite('shouldSetLangEnvVariable', () => {
            test('auto', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({}, 'auto'), true);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US' }, 'auto'), true);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.utf' }, 'auto'), true);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.utf8' }, 'auto'), false);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.UTF-8' }, 'auto'), false);
            });
            test('off', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({}, 'off'), false);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US' }, 'off'), false);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.utf' }, 'off'), false);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.utf8' }, 'off'), false);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.UTF-8' }, 'off'), false);
            });
            test('on', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({}, 'on'), true);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US' }, 'on'), true);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.utf' }, 'on'), true);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.utf8' }, 'on'), true);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.UTF-8' }, 'on'), true);
            });
        });
        suite('getLangEnvVariable', () => {
            test('should fallback to en_US when no locale is provided', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)(undefined), 'en_US.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)(''), 'en_US.UTF-8');
            });
            test('should fallback to default language variants when variant isn\'t provided', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('af'), 'af_ZA.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('am'), 'am_ET.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('be'), 'be_BY.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('bg'), 'bg_BG.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('ca'), 'ca_ES.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('cs'), 'cs_CZ.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('da'), 'da_DK.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('de'), 'de_DE.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('el'), 'el_GR.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('en'), 'en_US.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('es'), 'es_ES.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('et'), 'et_EE.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('eu'), 'eu_ES.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('fi'), 'fi_FI.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('fr'), 'fr_FR.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('he'), 'he_IL.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('hr'), 'hr_HR.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('hu'), 'hu_HU.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('hy'), 'hy_AM.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('is'), 'is_IS.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('it'), 'it_IT.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('ja'), 'ja_JP.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('kk'), 'kk_KZ.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('ko'), 'ko_KR.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('lt'), 'lt_LT.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('nl'), 'nl_NL.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('no'), 'no_NO.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('pl'), 'pl_PL.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('pt'), 'pt_BR.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('ro'), 'ro_RO.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('ru'), 'ru_RU.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('sk'), 'sk_SK.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('sl'), 'sl_SI.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('sr'), 'sr_YU.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('sv'), 'sv_SE.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('tr'), 'tr_TR.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('uk'), 'uk_UA.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('zh'), 'zh_CN.UTF-8');
            });
            test('should set language variant based on full locale', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('en-AU'), 'en_AU.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('en-au'), 'en_AU.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('fa-ke'), 'fa_KE.UTF-8');
            });
        });
        suite('mergeEnvironments', () => {
            test('should add keys', () => {
                const parent = {
                    a: 'b'
                };
                const other = {
                    c: 'd'
                };
                (0, terminalEnvironment_1.mergeEnvironments)(parent, other);
                (0, assert_1.deepStrictEqual)(parent, {
                    a: 'b',
                    c: 'd'
                });
            });
            (!platform_1.isWindows ? test.skip : test)('should add keys ignoring case on Windows', () => {
                const parent = {
                    a: 'b'
                };
                const other = {
                    A: 'c'
                };
                (0, terminalEnvironment_1.mergeEnvironments)(parent, other);
                (0, assert_1.deepStrictEqual)(parent, {
                    a: 'c'
                });
            });
            test('null values should delete keys from the parent env', () => {
                const parent = {
                    a: 'b',
                    c: 'd'
                };
                const other = {
                    a: null
                };
                (0, terminalEnvironment_1.mergeEnvironments)(parent, other);
                (0, assert_1.deepStrictEqual)(parent, {
                    c: 'd'
                });
            });
            (!platform_1.isWindows ? test.skip : test)('null values should delete keys from the parent env ignoring case on Windows', () => {
                const parent = {
                    a: 'b',
                    c: 'd'
                };
                const other = {
                    A: null
                };
                (0, terminalEnvironment_1.mergeEnvironments)(parent, other);
                (0, assert_1.deepStrictEqual)(parent, {
                    c: 'd'
                });
            });
        });
        suite('getCwd', () => {
            // This helper checks the paths in a cross-platform friendly manner
            function assertPathsMatch(a, b) {
                (0, assert_1.strictEqual)(uri_1.URI.file(a).fsPath, uri_1.URI.file(b).fsPath);
            }
            test('should default to userHome for an empty workspace', async () => {
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, undefined, undefined), '/userHome/');
            });
            test('should use to the workspace if it exists', async () => {
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, uri_1.URI.file('/foo'), undefined), '/foo');
            });
            test('should use an absolute custom cwd as is', async () => {
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, undefined, '/foo'), '/foo');
            });
            test('should normalize a relative custom cwd against the workspace path', async () => {
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, uri_1.URI.file('/bar'), 'foo'), '/bar/foo');
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, uri_1.URI.file('/bar'), './foo'), '/bar/foo');
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, uri_1.URI.file('/bar'), '../foo'), '/foo');
            });
            test('should fall back for relative a custom cwd that doesn\'t have a workspace', async () => {
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, undefined, 'foo'), '/userHome/');
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, undefined, './foo'), '/userHome/');
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, undefined, '../foo'), '/userHome/');
            });
            test('should ignore custom cwd when told to ignore', async () => {
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [], ignoreConfigurationCwd: true }, '/userHome/', undefined, uri_1.URI.file('/bar'), '/foo'), '/bar');
            });
        });
        suite('preparePathForShell', () => {
            const wslPathBackend = {
                getWslPath: async (original, direction) => {
                    if (direction === 'unix-to-win') {
                        const match = original.match(/^\/mnt\/(?<drive>[a-zA-Z])\/(?<path>.+)$/);
                        const groups = match?.groups;
                        if (!groups) {
                            return original;
                        }
                        return `${groups.drive}:\\${groups.path.replace(/\//g, '\\')}`;
                    }
                    const match = original.match(/(?<drive>[a-zA-Z]):\\(?<path>.+)/);
                    const groups = match?.groups;
                    if (!groups) {
                        return original;
                    }
                    return `/mnt/${groups.drive.toLowerCase()}/${groups.path.replace(/\\/g, '/')}`;
                }
            };
            suite('Windows frontend, Windows backend', () => {
                test('Command Prompt', async () => {
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar', 'cmd', 'cmd', "cmd" /* WindowsShellType.CommandPrompt */, wslPathBackend, 1 /* OperatingSystem.Windows */, true), `c:\\foo\\bar`);
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar\'baz', 'cmd', 'cmd', "cmd" /* WindowsShellType.CommandPrompt */, wslPathBackend, 1 /* OperatingSystem.Windows */, true), `c:\\foo\\bar'baz`);
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar$(echo evil)baz', 'cmd', 'cmd', "cmd" /* WindowsShellType.CommandPrompt */, wslPathBackend, 1 /* OperatingSystem.Windows */, true), `"c:\\foo\\bar$(echo evil)baz"`);
                });
                test('PowerShell', async () => {
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar', 'pwsh', 'pwsh', "pwsh" /* WindowsShellType.PowerShell */, wslPathBackend, 1 /* OperatingSystem.Windows */, true), `c:\\foo\\bar`);
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar\'baz', 'pwsh', 'pwsh', "pwsh" /* WindowsShellType.PowerShell */, wslPathBackend, 1 /* OperatingSystem.Windows */, true), `& 'c:\\foo\\bar''baz'`);
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar$(echo evil)baz', 'pwsh', 'pwsh', "pwsh" /* WindowsShellType.PowerShell */, wslPathBackend, 1 /* OperatingSystem.Windows */, true), `& 'c:\\foo\\bar$(echo evil)baz'`);
                });
                test('Git Bash', async () => {
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar', 'bash', 'bash', "gitbash" /* WindowsShellType.GitBash */, wslPathBackend, 1 /* OperatingSystem.Windows */, true), `'c:/foo/bar'`);
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar$(echo evil)baz', 'bash', 'bash', "gitbash" /* WindowsShellType.GitBash */, wslPathBackend, 1 /* OperatingSystem.Windows */, true), `'c:/foo/bar(echo evil)baz'`);
                });
                test('WSL', async () => {
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar', 'bash', 'bash', "wsl" /* WindowsShellType.Wsl */, wslPathBackend, 1 /* OperatingSystem.Windows */, true), '/mnt/c/foo/bar');
                });
            });
            suite('Windows frontend, Linux backend', () => {
                test('Bash', async () => {
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('/foo/bar', 'bash', 'bash', "bash" /* PosixShellType.Bash */, wslPathBackend, 3 /* OperatingSystem.Linux */, true), `'/foo/bar'`);
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('/foo/bar\'baz', 'bash', 'bash', "bash" /* PosixShellType.Bash */, wslPathBackend, 3 /* OperatingSystem.Linux */, true), `'/foo/barbaz'`);
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('/foo/bar$(echo evil)baz', 'bash', 'bash', "bash" /* PosixShellType.Bash */, wslPathBackend, 3 /* OperatingSystem.Linux */, true), `'/foo/bar(echo evil)baz'`);
                });
            });
            suite('Linux frontend, Windows backend', () => {
                test('Command Prompt', async () => {
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar', 'cmd', 'cmd', "cmd" /* WindowsShellType.CommandPrompt */, wslPathBackend, 1 /* OperatingSystem.Windows */, false), `c:\\foo\\bar`);
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar\'baz', 'cmd', 'cmd', "cmd" /* WindowsShellType.CommandPrompt */, wslPathBackend, 1 /* OperatingSystem.Windows */, false), `c:\\foo\\bar'baz`);
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar$(echo evil)baz', 'cmd', 'cmd', "cmd" /* WindowsShellType.CommandPrompt */, wslPathBackend, 1 /* OperatingSystem.Windows */, false), `"c:\\foo\\bar$(echo evil)baz"`);
                });
                test('PowerShell', async () => {
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar', 'pwsh', 'pwsh', "pwsh" /* WindowsShellType.PowerShell */, wslPathBackend, 1 /* OperatingSystem.Windows */, false), `c:\\foo\\bar`);
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar\'baz', 'pwsh', 'pwsh', "pwsh" /* WindowsShellType.PowerShell */, wslPathBackend, 1 /* OperatingSystem.Windows */, false), `& 'c:\\foo\\bar''baz'`);
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar$(echo evil)baz', 'pwsh', 'pwsh', "pwsh" /* WindowsShellType.PowerShell */, wslPathBackend, 1 /* OperatingSystem.Windows */, false), `& 'c:\\foo\\bar$(echo evil)baz'`);
                });
                test('Git Bash', async () => {
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar', 'bash', 'bash', "gitbash" /* WindowsShellType.GitBash */, wslPathBackend, 1 /* OperatingSystem.Windows */, false), `'c:/foo/bar'`);
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar$(echo evil)baz', 'bash', 'bash', "gitbash" /* WindowsShellType.GitBash */, wslPathBackend, 1 /* OperatingSystem.Windows */, false), `'c:/foo/bar(echo evil)baz'`);
                });
                test('WSL', async () => {
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('c:\\foo\\bar', 'bash', 'bash', "wsl" /* WindowsShellType.Wsl */, wslPathBackend, 1 /* OperatingSystem.Windows */, false), '/mnt/c/foo/bar');
                });
            });
            suite('Linux frontend, Linux backend', () => {
                test('Bash', async () => {
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('/foo/bar', 'bash', 'bash', "bash" /* PosixShellType.Bash */, wslPathBackend, 3 /* OperatingSystem.Linux */, false), `'/foo/bar'`);
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('/foo/bar\'baz', 'bash', 'bash', "bash" /* PosixShellType.Bash */, wslPathBackend, 3 /* OperatingSystem.Linux */, false), `'/foo/barbaz'`);
                    (0, assert_1.strictEqual)(await (0, terminalEnvironment_1.preparePathForShell)('/foo/bar$(echo evil)baz', 'bash', 'bash', "bash" /* PosixShellType.Bash */, wslPathBackend, 3 /* OperatingSystem.Linux */, false), `'/foo/bar(echo evil)baz'`);
                });
            });
        });
        suite('createTerminalEnvironment', () => {
            const commonVariables = {
                COLORTERM: 'truecolor',
                TERM_PROGRAM: 'vscode'
            };
            test('should retain variables equal to the empty string', async () => {
                (0, assert_1.deepStrictEqual)(await (0, terminalEnvironment_1.createTerminalEnvironment)({}, undefined, undefined, undefined, 'off', { foo: 'bar', empty: '' }), { foo: 'bar', empty: '', ...commonVariables });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFbnZpcm9ubWVudC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC90ZXN0L2NvbW1vbi90ZXJtaW5hbEVudmlyb25tZW50LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsS0FBSyxDQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRTtRQUM3QyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLDRCQUE0QixFQUFFLEdBQUcsRUFBRTtZQUN4QyxJQUFJLENBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO2dCQUMxQyxNQUFNLEdBQUcsR0FBMkIsRUFBRSxDQUFDO2dCQUN2QyxJQUFBLGdEQUEwQixFQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNyRCxJQUFBLG9CQUFXLEVBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUMzQyxJQUFBLG9CQUFXLEVBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ2xELElBQUEsb0JBQVcsRUFBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQzNDLElBQUEsb0JBQVcsRUFBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDekMsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsaUVBQWlFLEVBQUUsR0FBRyxFQUFFO2dCQUM1RSxNQUFNLEdBQUcsR0FBMkIsRUFBRSxDQUFDO2dCQUN2QyxJQUFBLGdEQUEwQixFQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxD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QUM7Z0JBQ3JELElBQUEsb0JBQVcsRUFBQyxJQUFBLHdDQUFrQixFQUFDLElBQUksQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNyRCxJQUFBLG9CQUFXLEVBQUMsSUFBQSx3Q0FBa0IsRUFBQyxJQUFJLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDckQsSUFBQSxvQkFBVyxFQUFDLElBQUEsd0NBQWtCLEVBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ3JELElBQUEsb0JBQVcsRUFBQyxJQUFBLHdDQUFrQixFQUFDLElBQUksQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNyRCxJQUFBLG9CQUFXLEVBQUMsSUFBQSx3Q0FBa0IsRUFBQyxJQUFJLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDckQsSUFBQSxvQkFBVyxFQUFDLElBQUEsd0NBQWtCLEVBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ3JELElBQUEsb0JBQVcsRUFBQyxJQUFBLHdDQUFrQixFQUFDLElBQUksQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNyRCxJQUFBLG9CQUFXLEVBQUMsSUFBQSx3Q0FBa0IsRUFBQyxJQUFJLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDckQsSUFBQSxvQkFBVyxFQUFDLElBQUEsd0NBQWtCLEVBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ3JELElBQUEsb0JBQVcsRUFBQyxJQUFBLHdDQUFrQixFQUFDLElBQUksQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNyRCxJQUFBLG9CQUFXLEVBQUMsSUFBQSx3Q0FBa0IsRUFBQyxJQUFJLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDckQsSUFBQSxvQkFBVyxFQUFDLElBQUEsd0NBQWtCLEVBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ3JELElBQUEsb0JBQVcsRUFBQyxJQUFBLHdDQUFrQixFQUFDLElBQUksQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNyRCxJQUFBLG9CQUFXLEVBQUMsSUFBQSx3Q0FBa0IsRUFBQyxJQUFJLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDckQsSUFBQSxvQkFBVyxFQUFDLElBQUEsd0NBQWtCLEVBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ3JELElBQUEsb0JBQVcsRUFBQyxJQUFBLHdDQUFrQixFQUFDLElBQUksQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNyRCxJQUFBLG9CQUFXLEVBQUMsSUFBQSx3Q0FBa0IsRUFBQyxJQUFJLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDckQsSUFBQSxvQkFBVyxFQUFDLElBQUEsd0NBQWtCLEVBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ3JELElBQUEsb0JBQVcsRUFBQyxJQUFBLHdDQUFrQixFQUFDLElBQUksQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNyRCxJQUFBLG9CQUFXLEVBQUMsSUFBQSx3Q0FBa0IsRUFBQyxJQUFJLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDckQsSUFBQSxvQkFBVyxFQUFDLElBQUEsd0NBQWtCLEVBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ3JELElBQUEsb0JBQVcsRUFBQyxJQUFBLHdDQUFrQixFQUFDLElBQUksQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNyRCxJQUFBLG9CQUFXLEVBQUMsSUFBQSx3Q0FBa0IsRUFBQyxJQUFJLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDckQsSUFBQSxvQkFBVyxFQUFDLElBQUEsd0NBQWtCLEVBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ3JELElBQUEsb0JBQVcsRUFBQyxJQUFBLHdDQUFrQixFQUFDLElBQUksQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNyRCxJQUFBLG9CQUFXLEVBQUMsSUFBQSx3Q0FBa0IsRUFBQyxJQUFJLENB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LENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtZQUNwQixtRUFBbUU7WUFDbkUsU0FBUyxnQkFBZ0IsQ0FBQyxDQUFTLEVBQUUsQ0FBUztnQkFDN0MsSUFBQSxvQkFBVyxFQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckQsQ0FBQztZQUVELElBQUksQ0FBQyxtREFBbUQsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDcEUsZ0JBQWdCLENBQUMsTUFBTSxJQUFBLDRCQUFNLEVBQUMsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNsSSxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQywwQ0FBMEMsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDM0QsZ0JBQWdCLENBQUMsTUFBTSxJQUFBLDRCQUFNLEVBQUMsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbkksQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMseUNBQXlDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQzFELGdCQUFnQixDQUFDLE1BQU0sSUFBQSw0QkFBTSxFQUFDLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDekgsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsbUVBQW1FLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3BGLGdCQUFnQixDQUFDLE1BQU0sSUFBQSw0QkFBTSxFQUFDLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNsSSxnQkFBZ0IsQ0FBQyxNQUFNLElBQUEsNEJBQU0sRUFBQyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxPQUFPLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDcEksZ0JBQWdCLENBQUMsTUFBTSxJQUFBLDRCQUFNLEVBQUMsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEksQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsMkVBQTJFLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQzVGLGdCQUFnQixDQUFDLE1BQU0sSUFBQSw0QkFBTSxFQUFDLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQzdILGdCQUFnQixDQUFDLE1BQU0sSUFBQSw0QkFBTSxFQUFDLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQy9ILGdCQUFnQixDQUFDLE1BQU0sSUFBQSw0QkFBTSxFQUFDLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDakksQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsOENBQThDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQy9ELGdCQUFnQixDQUFDLE1BQU0sSUFBQSw0QkFBTSxFQUFDLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLHNCQUFzQixFQUFFLElBQUksRUFBRSxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxNQUFNLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM5SixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtZQUNqQyxNQUFNLGNBQWMsR0FBRztnQkFDdEIsVUFBVSxFQUFFLEtBQUssRUFBRSxRQUFnQixFQUFFLFNBQXdDLEVBQUUsRUFBRTtvQkFDaEYsSUFBSSxTQUFTLEtBQUssYUFBYSxFQUFFLENBQUM7d0JBQ2pDLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsMENBQTBDLENBQUMsQ0FBQzt3QkFDekUsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLE1BQU0sQ0FBQzt3QkFDN0IsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDOzRCQUNiLE9BQU8sUUFBUSxDQUFDO3dCQUNqQixDQUFDO3dCQUNELE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUNoRSxDQUFDO29CQUNELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsa0NBQWtDLENBQUMsQ0FBQztvQkFDakUsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLE1BQU0sQ0FBQztvQkFDN0IsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUNiLE9BQU8sUUFBUSxDQUFDO29CQUNqQixDQUFDO29CQUNELE9BQU8sUUFBUSxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNoRixDQUFDO2FBQ0QsQ0FBQztZQUNGLEtBQUssQ0FBQyxtQ0FBbUMsRUFBRSxHQUFHLEVBQUU7Z0JBQy9DLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLElBQUksRUFBRTtvQkFDakMsSUFBQSxvQkFBVyxFQUFDLE1BQU0sSUFBQSx5Q0FBbUIsRUFBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLEtBQUssOENBQWtDLGNBQWMsbUNBQTJCLElBQUksQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO29CQUNwSyxJQUFBLG9CQUFXLEVBQUMsTUFBTSxJQUFBLHlDQUFtQixFQUFDLG1CQUFtQixFQUFFLEtBQUssRUFBRSxLQUFLLDhDQUFrQyxjQUFjLG1DQUEyQixJQUFJLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO29CQUM3SyxJQUFBLG9CQUFXLEVBQUMsTUFBTSxJQUFBLHlDQUFtQixFQUFDLDZCQUE2QixFQUFFLEtBQUssRUFBRSxLQUFLLDhDQUFrQyxjQUFjLG1DQUEyQixJQUFJLENBQUMsRUFBRSwrQkFBK0IsQ0FBQyxDQUFDO2dCQUNyTSxDQUFDLENBQUMsQ0FBQztnQkFDSCxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssSUFBSSxFQUFFO29CQUM3QixJQUFBLG9CQUFXLEVBQUMsTUFBTSxJQUFBLHlDQUFtQixFQUFDLGNBQWMsRUFBRSxNQUFNLEVBQUUsTUFBTSw0Q0FBK0IsY0FBYyxtQ0FBMkIsSUFBSSxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7b0JBQ25LLElBQUEsb0JBQVcsRUFBQyxNQUFNLElBQUEseUNBQW1CLEVBQUMsbUJBQW1CLEVBQUUsTUFBTSxFQUFFLE1BQU0sNENBQStCLGNBQWMsbUNBQTJCLElBQUksQ0FBQyxFQUFFLHVCQUF1QixDQUFDLENBQUM7b0JBQ2pMLElBQUEsb0JBQVcsRUFBQyxNQUFNLElBQUEseUNBQW1CLEVBQUMsNkJBQTZCLEVBQUUsTUFBTSxFQUFFLE1BQU0sNENBQStCLGNBQWMsbUNBQTJCLElBQUksQ0FBQyxFQUFFLGlDQUFpQyxDQUFDLENBQUM7Z0JBQ3RNLENBQUMsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxJQUFJLEVBQUU7b0JBQzNCLElBQUEsb0JBQVcsRUFBQyxNQUFNLElBQUEseUNBQW1CLEVBQUMsY0FBYyxFQUFFLE1BQU0sRUFBRSxNQUFNLDRDQUE0QixjQUFjLG1DQUEyQixJQUFJLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztvQkFDaEssSUFBQSxvQkFBVyxFQUFDLE1BQU0sSUFBQSx5Q0FBbUIsRUFBQyw2QkFBNkIsRUFBRSxNQUFNLEVBQUUsTUFBTSw0Q0FBNEIsY0FBYyxtQ0FBMkIsSUFBSSxDQUFDLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztnQkFDOUwsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLElBQUksRUFBRTtvQkFDdEIsSUFBQSxvQkFBVyxFQUFDLE1BQU0sSUFBQSx5Q0FBbUIsRUFBQyxjQUFjLEVBQUUsTUFBTSxFQUFFLE1BQU0sb0NBQXdCLGNBQWMsbUNBQTJCLElBQUksQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBQy9KLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFDSCxLQUFLLENBQUMsaUNBQWlDLEVBQUUsR0FBRyxFQUFFO2dCQUM3QyxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssSUFBSSxFQUFFO29CQUN2QixJQUFBLG9CQUFXLEVBQUMsTUFBTSxJQUFBLHlDQUFtQixFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxvQ0FBdUIsY0FBYyxpQ0FBeUIsSUFBSSxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7b0JBQ25KLElBQUEsb0JBQVcsRUFBQyxNQUFNLElBQUEseUNBQW1CLEVBQUMsZUFBZSxFQUFFLE1BQU0sRUFBRSxNQUFNLG9DQUF1QixjQUFjLGlDQUF5QixJQUFJLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztvQkFDM0osSUFBQSxvQkFBVyxFQUFDLE1BQU0sSUFBQSx5Q0FBbUIsRUFBQyx5QkFBeUIsRUFBRSxNQUFNLEVBQUUsTUFBTSxvQ0FBdUIsY0FBYyxpQ0FBeUIsSUFBSSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztnQkFDakwsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUNILEtBQUssQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUU7Z0JBQzdDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLElBQUksRUFBRTtvQkFDakMsSUFBQSxvQkFBVyxFQUFDLE1BQU0sSUFBQSx5Q0FBbUIsRUFBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLEtBQUssOENBQWtDLGNBQWMsbUNBQTJCLEtBQUssQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO29CQUNySyxJQUFBLG9CQUFXLEVBQUMsTUFBTSxJQUFBLHlDQUFtQixFQUFDLG1CQUFtQixFQUFFLEtBQUssRUFBRSxLQUFLLDhDQUFrQyxjQUFjLG1DQUEyQixLQUFLLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO29CQUM5SyxJQUFBLG9CQUFXLEVBQUMsTUFBTSxJQUFBLHlDQUFtQixFQUFDLDZCQUE2QixFQUFFLEtBQUssRUFBRSxLQUFLLDhDQUFrQyxjQUFjLG1DQUEyQixLQUFLLENBQUMsRUFBRSwrQkFBK0IsQ0FBQyxDQUFDO2dCQUN0TSxDQUFDLENBQUMsQ0FBQztnQkFDSCxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssSUFBSSxFQUFFO29CQUM3QixJQUFBLG9CQUFXLEVBQUMsTUFBTSxJQUFBLHlDQUFtQixFQUFDLGNBQWMsRUFBRSxNQUFNLEVBQUUsTUFBTSw0Q0FBK0IsY0FBYyxtQ0FBMkIsS0FBSyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7b0JBQ3BLLElBQUEsb0JBQVcsRUFBQyxNQUFNLElBQUEseUNBQW1CLEVBQUMsbUJBQW1CLEVBQUUsTUFBTSxFQUFFLE1BQU0sNENBQStCLGNBQWMsbUNBQTJCLEtBQUssQ0FBQyxFQUFFLHVCQUF1QixDQUFDLENBQUM7b0JBQ2xMLElBQUEsb0JBQVcsRUFBQyxNQUFNLElBQUEseUNBQW1CLEVBQUMsNkJBQTZCLEVBQUUsTUFBTSxFQUFFLE1BQU0sNENBQStCLGNBQWMsbUNBQTJCLEtBQUssQ0FBQyxFQUFFLGlDQUFpQyxDQUFDLENBQUM7Z0JBQ3ZNLENBQUMsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxJQUFJLEVBQUU7b0JBQzNCLElBQUEsb0JBQVcsRUFBQyxNQUFNLElBQUEseUNBQW1CLEVBQUMsY0FBYyxFQUFFLE1BQU0sRUFBRSxNQUFNLDRDQUE0QixjQUFjLG1DQUEyQixLQUFLLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztvQkFDakssSUFBQSxvQkFBVyxFQUFDLE1BQU0sSUFBQSx5Q0FBbUIsRUFBQyw2QkFBNkIsRUFBRSxNQUFNLEVBQUUsTUFBTSw0Q0FBNEIsY0FBYyxtQ0FBMkIsS0FBSyxDQUFDLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztnQkFDL0wsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLElBQUksRUFBRTtvQkFDdEIsSUFBQSxvQkFBVyxFQUFDLE1BQU0sSUFBQSx5Q0FBbUIsRUFBQyxjQUFjLEVBQUUsTUFBTSxFQUFFLE1BQU0sb0NBQXdCLGNBQWMsbUNBQTJCLEtBQUssQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBQ2hLLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFDSCxLQUFLLENBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO2dCQUMzQyxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssSUFBSSxFQUFFO29CQUN2QixJQUFBLG9CQUFXLEVBQUMsTUFBTSxJQUFBLHlDQUFtQixFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxvQ0FBdUIsY0FBYyxpQ0FBeUIsS0FBSyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7b0JBQ3BKLElBQUEsb0JBQVcsRUFBQyxNQUFNLElBQUEseUNBQW1CLEVBQUMsZUFBZSxFQUFFLE1BQU0sRUFBRSxNQUFNLG9DQUF1QixjQUFjLGlDQUF5QixLQUFLLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztvQkFDNUosSUFBQSxvQkFBVyxFQUFDLE1BQU0sSUFBQSx5Q0FBbUIsRUFBQyx5QkFBeUIsRUFBRSxNQUFNLEVBQUUsTUFBTSxvQ0FBdUIsY0FBYyxpQ0FBeUIsS0FBSyxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztnQkFDbEwsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0gsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtZQUN2QyxNQUFNLGVBQWUsR0FBRztnQkFDdkIsU0FBUyxFQUFFLFdBQVc7Z0JBQ3RCLFlBQVksRUFBRSxRQUFRO2FBQ3RCLENBQUM7WUFDRixJQUFJLENBQUMsbURBQW1ELEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3BFLElBQUEsd0JBQWUsRUFDZCxNQUFNLElBQUEsK0NBQXlCLEVBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQ3RHLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEdBQUcsZUFBZSxFQUFFLENBQzdDLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==