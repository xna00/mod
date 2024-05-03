/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "os", "vs/base/common/platform", "vs/base/test/common/utils", "vs/platform/log/common/log", "vs/platform/terminal/node/terminalEnvironment"], function (require, exports, assert_1, os_1, platform_1, utils_1, log_1, terminalEnvironment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const enabledProcessOptions = { shellIntegration: { enabled: true, suggestEnabled: false, nonce: '' }, windowsEnableConpty: true, environmentVariableCollections: undefined, workspaceFolder: undefined };
    const disabledProcessOptions = { shellIntegration: { enabled: false, suggestEnabled: false, nonce: '' }, windowsEnableConpty: true, environmentVariableCollections: undefined, workspaceFolder: undefined };
    const winptyProcessOptions = { shellIntegration: { enabled: true, suggestEnabled: false, nonce: '' }, windowsEnableConpty: false, environmentVariableCollections: undefined, workspaceFolder: undefined };
    const pwshExe = process.platform === 'win32' ? 'pwsh.exe' : 'pwsh';
    const repoRoot = process.platform === 'win32' ? process.cwd()[0].toLowerCase() + process.cwd().substring(1) : process.cwd();
    const logService = new log_1.NullLogService();
    const productService = { applicationName: 'vscode' };
    const defaultEnvironment = {};
    suite('platform - terminalEnvironment', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('getShellIntegrationInjection', () => {
            suite('should not enable', () => {
                // This test is only expected to work on Windows 10 build 18309 and above
                ((0, terminalEnvironment_1.getWindowsBuildNumber)() < 18309 ? test.skip : test)('when isFeatureTerminal or when no executable is provided', () => {
                    (0, assert_1.ok)(!(0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-l', '-NoLogo'], isFeatureTerminal: true }, enabledProcessOptions, defaultEnvironment, logService, productService));
                    (0, assert_1.ok)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-l', '-NoLogo'], isFeatureTerminal: false }, enabledProcessOptions, defaultEnvironment, logService, productService));
                });
                if (platform_1.isWindows) {
                    test('when on windows with conpty false', () => {
                        (0, assert_1.ok)(!(0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-l'], isFeatureTerminal: false }, winptyProcessOptions, defaultEnvironment, logService, productService));
                    });
                }
            });
            // These tests are only expected to work on Windows 10 build 18309 and above
            ((0, terminalEnvironment_1.getWindowsBuildNumber)() < 18309 ? suite.skip : suite)('pwsh', () => {
                const expectedPs1 = process.platform === 'win32'
                    ? `try { . "${repoRoot}\\out\\vs\\workbench\\contrib\\terminal\\browser\\media\\shellIntegration.ps1" } catch {}`
                    : `. "${repoRoot}/out/vs/workbench/contrib/terminal/browser/media/shellIntegration.ps1"`;
                suite('should override args', () => {
                    const enabledExpectedResult = Object.freeze({
                        newArgs: [
                            '-noexit',
                            '-command',
                            expectedPs1
                        ],
                        envMixin: {
                            VSCODE_INJECTION: '1'
                        }
                    });
                    test('when undefined, []', () => {
                        (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: [] }, enabledProcessOptions, defaultEnvironment, logService, productService), enabledExpectedResult);
                        (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: undefined }, enabledProcessOptions, defaultEnvironment, logService, productService), enabledExpectedResult);
                    });
                    suite('when no logo', () => {
                        test('array - case insensitive', () => {
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-NoLogo'] }, enabledProcessOptions, defaultEnvironment, logService, productService), enabledExpectedResult);
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-NOLOGO'] }, enabledProcessOptions, defaultEnvironment, logService, productService), enabledExpectedResult);
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-nol'] }, enabledProcessOptions, defaultEnvironment, logService, productService), enabledExpectedResult);
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-NOL'] }, enabledProcessOptions, defaultEnvironment, logService, productService), enabledExpectedResult);
                        });
                        test('string - case insensitive', () => {
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: '-NoLogo' }, enabledProcessOptions, defaultEnvironment, logService, productService), enabledExpectedResult);
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: '-NOLOGO' }, enabledProcessOptions, defaultEnvironment, logService, productService), enabledExpectedResult);
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: '-nol' }, enabledProcessOptions, defaultEnvironment, logService, productService), enabledExpectedResult);
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: '-NOL' }, enabledProcessOptions, defaultEnvironment, logService, productService), enabledExpectedResult);
                        });
                    });
                });
                suite('should incorporate login arg', () => {
                    const enabledExpectedResult = Object.freeze({
                        newArgs: [
                            '-l',
                            '-noexit',
                            '-command',
                            expectedPs1
                        ],
                        envMixin: {
                            VSCODE_INJECTION: '1'
                        }
                    });
                    test('when array contains no logo and login', () => {
                        (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-l', '-NoLogo'] }, enabledProcessOptions, defaultEnvironment, logService, productService), enabledExpectedResult);
                    });
                    test('when string', () => {
                        (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: '-l' }, enabledProcessOptions, defaultEnvironment, logService, productService), enabledExpectedResult);
                    });
                });
                suite('should not modify args', () => {
                    test('when shell integration is disabled', () => {
                        (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-l'] }, disabledProcessOptions, defaultEnvironment, logService, productService), undefined);
                        (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: '-l' }, disabledProcessOptions, defaultEnvironment, logService, productService), undefined);
                        (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: undefined }, disabledProcessOptions, defaultEnvironment, logService, productService), undefined);
                    });
                    test('when using unrecognized arg', () => {
                        (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-l', '-NoLogo', '-i'] }, disabledProcessOptions, defaultEnvironment, logService, productService), undefined);
                    });
                    test('when using unrecognized arg (string)', () => {
                        (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: '-i' }, disabledProcessOptions, defaultEnvironment, logService, productService), undefined);
                    });
                });
            });
            if (process.platform !== 'win32') {
                suite('zsh', () => {
                    suite('should override args', () => {
                        const username = (0, os_1.userInfo)().username;
                        const expectedDir = new RegExp(`.+\/${username}-vscode-zsh`);
                        const customZdotdir = '/custom/zsh/dotdir';
                        const expectedDests = [
                            new RegExp(`.+\\/${username}-vscode-zsh\\/\\.zshrc`),
                            new RegExp(`.+\\/${username}-vscode-zsh\\/\\.zprofile`),
                            new RegExp(`.+\\/${username}-vscode-zsh\\/\\.zshenv`),
                            new RegExp(`.+\\/${username}-vscode-zsh\\/\\.zlogin`)
                        ];
                        const expectedSources = [
                            /.+\/out\/vs\/workbench\/contrib\/terminal\/browser\/media\/shellIntegration-rc.zsh/,
                            /.+\/out\/vs\/workbench\/contrib\/terminal\/browser\/media\/shellIntegration-profile.zsh/,
                            /.+\/out\/vs\/workbench\/contrib\/terminal\/browser\/media\/shellIntegration-env.zsh/,
                            /.+\/out\/vs\/workbench\/contrib\/terminal\/browser\/media\/shellIntegration-login.zsh/
                        ];
                        function assertIsEnabled(result, globalZdotdir = (0, os_1.homedir)()) {
                            (0, assert_1.strictEqual)(Object.keys(result.envMixin).length, 3);
                            (0, assert_1.ok)(result.envMixin['ZDOTDIR']?.match(expectedDir));
                            (0, assert_1.strictEqual)(result.envMixin['USER_ZDOTDIR'], globalZdotdir);
                            (0, assert_1.ok)(result.envMixin['VSCODE_INJECTION']?.match('1'));
                            (0, assert_1.strictEqual)(result.filesToCopy?.length, 4);
                            (0, assert_1.ok)(result.filesToCopy[0].dest.match(expectedDests[0]));
                            (0, assert_1.ok)(result.filesToCopy[1].dest.match(expectedDests[1]));
                            (0, assert_1.ok)(result.filesToCopy[2].dest.match(expectedDests[2]));
                            (0, assert_1.ok)(result.filesToCopy[3].dest.match(expectedDests[3]));
                            (0, assert_1.ok)(result.filesToCopy[0].source.match(expectedSources[0]));
                            (0, assert_1.ok)(result.filesToCopy[1].source.match(expectedSources[1]));
                            (0, assert_1.ok)(result.filesToCopy[2].source.match(expectedSources[2]));
                            (0, assert_1.ok)(result.filesToCopy[3].source.match(expectedSources[3]));
                        }
                        test('when undefined, []', () => {
                            const result1 = (0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'zsh', args: [] }, enabledProcessOptions, defaultEnvironment, logService, productService);
                            (0, assert_1.deepStrictEqual)(result1?.newArgs, ['-i']);
                            assertIsEnabled(result1);
                            const result2 = (0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'zsh', args: undefined }, enabledProcessOptions, defaultEnvironment, logService, productService);
                            (0, assert_1.deepStrictEqual)(result2?.newArgs, ['-i']);
                            assertIsEnabled(result2);
                        });
                        suite('should incorporate login arg', () => {
                            test('when array', () => {
                                const result = (0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'zsh', args: ['-l'] }, enabledProcessOptions, defaultEnvironment, logService, productService);
                                (0, assert_1.deepStrictEqual)(result?.newArgs, ['-il']);
                                assertIsEnabled(result);
                            });
                        });
                        suite('should not modify args', () => {
                            test('when shell integration is disabled', () => {
                                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'zsh', args: ['-l'] }, disabledProcessOptions, defaultEnvironment, logService, productService), undefined);
                                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'zsh', args: undefined }, disabledProcessOptions, defaultEnvironment, logService, productService), undefined);
                            });
                            test('when using unrecognized arg', () => {
                                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'zsh', args: ['-l', '-fake'] }, disabledProcessOptions, defaultEnvironment, logService, productService), undefined);
                            });
                        });
                        suite('should incorporate global ZDOTDIR env variable', () => {
                            test('when custom ZDOTDIR', () => {
                                const result1 = (0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'zsh', args: [] }, enabledProcessOptions, { ...defaultEnvironment, ZDOTDIR: customZdotdir }, logService, productService);
                                (0, assert_1.deepStrictEqual)(result1?.newArgs, ['-i']);
                                assertIsEnabled(result1, customZdotdir);
                            });
                            test('when undefined', () => {
                                const result1 = (0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'zsh', args: [] }, enabledProcessOptions, undefined, logService, productService);
                                (0, assert_1.deepStrictEqual)(result1?.newArgs, ['-i']);
                                assertIsEnabled(result1);
                            });
                        });
                    });
                });
                suite('bash', () => {
                    suite('should override args', () => {
                        test('when undefined, [], empty string', () => {
                            const enabledExpectedResult = Object.freeze({
                                newArgs: [
                                    '--init-file',
                                    `${repoRoot}/out/vs/workbench/contrib/terminal/browser/media/shellIntegration-bash.sh`
                                ],
                                envMixin: {
                                    VSCODE_INJECTION: '1'
                                }
                            });
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'bash', args: [] }, enabledProcessOptions, defaultEnvironment, logService, productService), enabledExpectedResult);
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'bash', args: '' }, enabledProcessOptions, defaultEnvironment, logService, productService), enabledExpectedResult);
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'bash', args: undefined }, enabledProcessOptions, defaultEnvironment, logService, productService), enabledExpectedResult);
                        });
                        suite('should set login env variable and not modify args', () => {
                            const enabledExpectedResult = Object.freeze({
                                newArgs: [
                                    '--init-file',
                                    `${repoRoot}/out/vs/workbench/contrib/terminal/browser/media/shellIntegration-bash.sh`
                                ],
                                envMixin: {
                                    VSCODE_INJECTION: '1',
                                    VSCODE_SHELL_LOGIN: '1'
                                }
                            });
                            test('when array', () => {
                                (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'bash', args: ['-l'] }, enabledProcessOptions, defaultEnvironment, logService, productService), enabledExpectedResult);
                            });
                        });
                        suite('should not modify args', () => {
                            test('when shell integration is disabled', () => {
                                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'bash', args: ['-l'] }, disabledProcessOptions, defaultEnvironment, logService, productService), undefined);
                                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'bash', args: undefined }, disabledProcessOptions, defaultEnvironment, logService, productService), undefined);
                            });
                            test('when custom array entry', () => {
                                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'bash', args: ['-l', '-i'] }, disabledProcessOptions, defaultEnvironment, logService, productService), undefined);
                            });
                        });
                    });
                });
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFbnZpcm9ubWVudC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC90ZXN0L25vZGUvdGVybWluYWxFbnZpcm9ubWVudC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBV2hHLE1BQU0scUJBQXFCLEdBQTRCLEVBQUUsZ0JBQWdCLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSw4QkFBOEIsRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLFNBQVMsRUFBRSxDQUFDO0lBQ25PLE1BQU0sc0JBQXNCLEdBQTRCLEVBQUUsZ0JBQWdCLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSw4QkFBOEIsRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLFNBQVMsRUFBRSxDQUFDO0lBQ3JPLE1BQU0sb0JBQW9CLEdBQTRCLEVBQUUsZ0JBQWdCLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLG1CQUFtQixFQUFFLEtBQUssRUFBRSw4QkFBOEIsRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLFNBQVMsRUFBRSxDQUFDO0lBQ25PLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUNuRSxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFB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Q3JELElBQUEsb0JBQVcsRUFBQyxNQUFNLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQzs0QkFDM0MsSUFBQSxXQUFFLEVBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ3ZELElBQUEsV0FBRSxFQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUN2RCxJQUFBLFdBQUUsRUFBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDdkQsSUFBQSxXQUFFLEVBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ3ZELElBQUEsV0FBRSxFQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUMzRCxJQUFBLFdBQUUsRUFBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDM0QsSUFBQSxXQUFFLEVBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQzNELElBQUEsV0FBRSxFQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFD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