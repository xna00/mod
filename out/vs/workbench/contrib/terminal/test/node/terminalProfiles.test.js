/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/platform/terminal/node/terminalProfiles", "vs/platform/configuration/test/common/testConfigurationService", "vs/base/test/common/utils"], function (require, exports, assert_1, platform_1, terminalProfiles_1, testConfigurationService_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Assets that two profiles objects are equal, this will treat explicit undefined and unset
     * properties the same. Order of the profiles is ignored.
     */
    function profilesEqual(actualProfiles, expectedProfiles) {
        (0, assert_1.strictEqual)(actualProfiles.length, expectedProfiles.length, `Actual: ${actualProfiles.map(e => e.profileName).join(',')}\nExpected: ${expectedProfiles.map(e => e.profileName).join(',')}`);
        for (const expected of expectedProfiles) {
            const actual = actualProfiles.find(e => e.profileName === expected.profileName);
            (0, assert_1.ok)(actual, `Expected profile ${expected.profileName} not found`);
            (0, assert_1.strictEqual)(actual.profileName, expected.profileName);
            (0, assert_1.strictEqual)(actual.path, expected.path);
            (0, assert_1.deepStrictEqual)(actual.args, expected.args);
            (0, assert_1.strictEqual)(actual.isAutoDetected, expected.isAutoDetected);
            (0, assert_1.strictEqual)(actual.overrideName, expected.overrideName);
        }
    }
    suite('Workbench - TerminalProfiles', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('detectAvailableProfiles', () => {
            if (platform_1.isWindows) {
                test('should detect Git Bash and provide login args', async () => {
                    const fsProvider = createFsProvider([
                        'C:\\Program Files\\Git\\bin\\bash.exe'
                    ]);
                    const config = {
                        profiles: {
                            windows: {
                                'Git Bash': { source: "Git Bash" /* ProfileSource.GitBash */ }
                            },
                            linux: {},
                            osx: {}
                        },
                        useWslProfiles: false
                    };
                    const configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: config } });
                    const profiles = await (0, terminalProfiles_1.detectAvailableProfiles)(undefined, undefined, false, configurationService, process.env, fsProvider, undefined, undefined, undefined);
                    const expected = [
                        { profileName: 'Git Bash', path: 'C:\\Program Files\\Git\\bin\\bash.exe', args: ['--login', '-i'], isDefault: true }
                    ];
                    profilesEqual(profiles, expected);
                });
                test('should allow source to have args', async () => {
                    const pwshSourcePaths = [
                        'C:\\Program Files\\PowerShell\\7\\pwsh.exe'
                    ];
                    const fsProvider = createFsProvider(pwshSourcePaths);
                    const config = {
                        profiles: {
                            windows: {
                                'PowerShell': { source: "PowerShell" /* ProfileSource.Pwsh */, args: ['-NoProfile'], overrideName: true }
                            },
                            linux: {},
                            osx: {},
                        },
                        useWslProfiles: false
                    };
                    const configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: config } });
                    const profiles = await (0, terminalProfiles_1.detectAvailableProfiles)(undefined, undefined, false, configurationService, process.env, fsProvider, undefined, undefined, pwshSourcePaths);
                    const expected = [
                        { profileName: 'PowerShell', path: 'C:\\Program Files\\PowerShell\\7\\pwsh.exe', overrideName: true, args: ['-NoProfile'], isDefault: true }
                    ];
                    profilesEqual(profiles, expected);
                });
                test('configured args should override default source ones', async () => {
                    const fsProvider = createFsProvider([
                        'C:\\Program Files\\Git\\bin\\bash.exe'
                    ]);
                    const config = {
                        profiles: {
                            windows: {
                                'Git Bash': { source: "Git Bash" /* ProfileSource.GitBash */, args: [] }
                            },
                            linux: {},
                            osx: {}
                        },
                        useWslProfiles: false
                    };
                    const configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: config } });
                    const profiles = await (0, terminalProfiles_1.detectAvailableProfiles)(undefined, undefined, false, configurationService, process.env, fsProvider, undefined, undefined, undefined);
                    const expected = [{ profileName: 'Git Bash', path: 'C:\\Program Files\\Git\\bin\\bash.exe', args: [], isAutoDetected: undefined, overrideName: undefined, isDefault: true }];
                    profilesEqual(profiles, expected);
                });
                suite('pwsh source detection/fallback', () => {
                    const pwshSourceConfig = {
                        profiles: {
                            windows: {
                                'PowerShell': { source: "PowerShell" /* ProfileSource.Pwsh */ }
                            },
                            linux: {},
                            osx: {},
                        },
                        useWslProfiles: false
                    };
                    test('should prefer pwsh 7 to Windows PowerShell', async () => {
                        const pwshSourcePaths = [
                            'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
                            'C:\\Sysnative\\WindowsPowerShell\\v1.0\\powershell.exe',
                            'C:\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
                        ];
                        const fsProvider = createFsProvider(pwshSourcePaths);
                        const configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: pwshSourceConfig } });
                        const profiles = await (0, terminalProfiles_1.detectAvailableProfiles)(undefined, undefined, false, configurationService, process.env, fsProvider, undefined, undefined, pwshSourcePaths);
                        const expected = [
                            { profileName: 'PowerShell', path: 'C:\\Program Files\\PowerShell\\7\\pwsh.exe', isDefault: true }
                        ];
                        profilesEqual(profiles, expected);
                    });
                    test('should prefer pwsh 7 to pwsh 6', async () => {
                        const pwshSourcePaths = [
                            'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
                            'C:\\Program Files\\PowerShell\\6\\pwsh.exe',
                            'C:\\Sysnative\\WindowsPowerShell\\v1.0\\powershell.exe',
                            'C:\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
                        ];
                        const fsProvider = createFsProvider(pwshSourcePaths);
                        const configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: pwshSourceConfig } });
                        const profiles = await (0, terminalProfiles_1.detectAvailableProfiles)(undefined, undefined, false, configurationService, process.env, fsProvider, undefined, undefined, pwshSourcePaths);
                        const expected = [
                            { profileName: 'PowerShell', path: 'C:\\Program Files\\PowerShell\\7\\pwsh.exe', isDefault: true }
                        ];
                        profilesEqual(profiles, expected);
                    });
                    test('should fallback to Windows PowerShell', async () => {
                        const pwshSourcePaths = [
                            'C:\\Windows\\Sysnative\\WindowsPowerShell\\v1.0\\powershell.exe',
                            'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
                        ];
                        const fsProvider = createFsProvider(pwshSourcePaths);
                        const configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: pwshSourceConfig } });
                        const profiles = await (0, terminalProfiles_1.detectAvailableProfiles)(undefined, undefined, false, configurationService, process.env, fsProvider, undefined, undefined, pwshSourcePaths);
                        (0, assert_1.strictEqual)(profiles.length, 1);
                        (0, assert_1.strictEqual)(profiles[0].profileName, 'PowerShell');
                    });
                });
            }
            else {
                const absoluteConfig = {
                    profiles: {
                        windows: {},
                        osx: {
                            'fakeshell1': { path: '/bin/fakeshell1' },
                            'fakeshell2': { path: '/bin/fakeshell2' },
                            'fakeshell3': { path: '/bin/fakeshell3' }
                        },
                        linux: {
                            'fakeshell1': { path: '/bin/fakeshell1' },
                            'fakeshell2': { path: '/bin/fakeshell2' },
                            'fakeshell3': { path: '/bin/fakeshell3' }
                        }
                    },
                    useWslProfiles: false
                };
                const onPathConfig = {
                    profiles: {
                        windows: {},
                        osx: {
                            'fakeshell1': { path: 'fakeshell1' },
                            'fakeshell2': { path: 'fakeshell2' },
                            'fakeshell3': { path: 'fakeshell3' }
                        },
                        linux: {
                            'fakeshell1': { path: 'fakeshell1' },
                            'fakeshell2': { path: 'fakeshell2' },
                            'fakeshell3': { path: 'fakeshell3' }
                        }
                    },
                    useWslProfiles: false
                };
                test('should detect shells via absolute paths', async () => {
                    const fsProvider = createFsProvider([
                        '/bin/fakeshell1',
                        '/bin/fakeshell3'
                    ]);
                    const configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: absoluteConfig } });
                    const profiles = await (0, terminalProfiles_1.detectAvailableProfiles)(undefined, undefined, false, configurationService, process.env, fsProvider, undefined, undefined, undefined);
                    const expected = [
                        { profileName: 'fakeshell1', path: '/bin/fakeshell1', isDefault: true },
                        { profileName: 'fakeshell3', path: '/bin/fakeshell3', isDefault: true }
                    ];
                    profilesEqual(profiles, expected);
                });
                test('should auto detect shells via /etc/shells', async () => {
                    const fsProvider = createFsProvider([
                        '/bin/fakeshell1',
                        '/bin/fakeshell3'
                    ], '/bin/fakeshell1\n/bin/fakeshell3');
                    const configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: onPathConfig } });
                    const profiles = await (0, terminalProfiles_1.detectAvailableProfiles)(undefined, undefined, true, configurationService, process.env, fsProvider, undefined, undefined, undefined);
                    const expected = [
                        { profileName: 'fakeshell1', path: '/bin/fakeshell1', isFromPath: true, isDefault: true },
                        { profileName: 'fakeshell3', path: '/bin/fakeshell3', isFromPath: true, isDefault: true }
                    ];
                    profilesEqual(profiles, expected);
                });
                test('should validate auto detected shells from /etc/shells exist', async () => {
                    // fakeshell3 exists in /etc/shells but not on FS
                    const fsProvider = createFsProvider([
                        '/bin/fakeshell1'
                    ], '/bin/fakeshell1\n/bin/fakeshell3');
                    const configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: onPathConfig } });
                    const profiles = await (0, terminalProfiles_1.detectAvailableProfiles)(undefined, undefined, true, configurationService, process.env, fsProvider, undefined, undefined, undefined);
                    const expected = [
                        { profileName: 'fakeshell1', path: '/bin/fakeshell1', isFromPath: true, isDefault: true }
                    ];
                    profilesEqual(profiles, expected);
                });
            }
        });
        function createFsProvider(expectedPaths, etcShellsContent = '') {
            const provider = {
                async existsFile(path) {
                    return expectedPaths.includes(path);
                },
                async readFile(path) {
                    if (path !== '/etc/shells') {
                        (0, assert_1.fail)('Unexepected path');
                    }
                    return Buffer.from(etcShellsContent);
                }
            };
            return provider;
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9maWxlcy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC90ZXN0L25vZGUvdGVybWluYWxQcm9maWxlcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHOzs7T0FHRztJQUNILFNBQVMsYUFBYSxDQUFDLGNBQWtDLEVBQUUsZ0JBQW9DO1FBQzlGLElBQUEsb0JBQVcsRUFBQyxjQUFjLENBQUMsTUFBTSxFQUFFLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxXQUFXLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxlQUFlLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzVMLEtBQUssTUFBTSxRQUFRLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztZQUN6QyxNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsS0FBSyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDaEYsSUFBQSxXQUFFLEVBQUMsTUFBTSxFQUFFLG9CQUFvQixRQUFRLENBQUMsV0FBVyxZQUFZLENBQUMsQ0FBQztZQUNqRSxJQUFBLG9CQUFXLEVBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDdEQsSUFBQSxvQkFBVyxFQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFD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