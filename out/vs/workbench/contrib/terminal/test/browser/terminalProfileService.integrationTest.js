/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/contrib/terminal/browser/terminalProfileService", "vs/workbench/contrib/terminal/common/terminalExtensionPoints", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/common/platform", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/configuration/common/configuration", "vs/workbench/services/extensions/common/extensions", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/environment/common/environmentService", "vs/platform/theme/common/themeService", "vs/base/common/codicons", "assert", "vs/base/common/event", "vs/workbench/contrib/terminal/browser/terminalProfileQuickpick", "vs/platform/theme/test/common/testThemeService", "vs/platform/quickinput/common/quickInput"], function (require, exports, instantiationServiceMock_1, terminal_1, testConfigurationService_1, workbenchTestServices_1, terminalProfileService_1, terminalExtensionPoints_1, terminal_2, platform_1, mockKeybindingService_1, configuration_1, extensions_1, contextkey_1, remoteAgentService_1, environmentService_1, themeService_1, codicons_1, assert_1, event_1, terminalProfileQuickpick_1, testThemeService_1, quickInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestTerminalProfileService extends terminalProfileService_1.TerminalProfileService {
        refreshAvailableProfiles() {
            this.hasRefreshedProfiles = this._refreshAvailableProfilesNow();
        }
        refreshAndAwaitAvailableProfiles() {
            this.refreshAvailableProfiles();
            if (!this.hasRefreshedProfiles) {
                throw new Error('has not refreshed profiles yet');
            }
            return this.hasRefreshedProfiles;
        }
    }
    class MockTerminalProfileService {
        constructor() {
            this.availableProfiles = [];
            this.contributedProfiles = [];
        }
        async getPlatformKey() {
            return 'linux';
        }
        getDefaultProfileName() {
            return this._defaultProfileName;
        }
        setProfiles(profiles, contributed) {
            this.availableProfiles = profiles;
            this.contributedProfiles = contributed;
        }
        setDefaultProfileName(name) {
            this._defaultProfileName = name;
        }
    }
    class MockQuickInputService {
        constructor() {
            this._pick = powershellPick;
        }
        async pick(picks, options, token) {
            Promise.resolve(picks);
            return this._pick;
        }
        setPick(pick) {
            this._pick = pick;
        }
    }
    class TestTerminalProfileQuickpick extends terminalProfileQuickpick_1.TerminalProfileQuickpick {
    }
    class TestTerminalExtensionService extends workbenchTestServices_1.TestExtensionService {
        constructor() {
            super(...arguments);
            this._onDidChangeExtensions = new event_1.Emitter();
        }
    }
    class TestTerminalContributionService {
        constructor() {
            this.terminalProfiles = [];
        }
        setProfiles(profiles) {
            this.terminalProfiles = profiles;
        }
    }
    class TestTerminalInstanceService {
        constructor() {
            this._profiles = new Map();
            this._hasReturnedNone = true;
        }
        async getBackend(remoteAuthority) {
            return {
                getProfiles: async () => {
                    if (this._hasReturnedNone) {
                        return this._profiles.get(remoteAuthority ?? '') || [];
                    }
                    else {
                        this._hasReturnedNone = true;
                        return [];
                    }
                }
            };
        }
        setProfiles(remoteAuthority, profiles) {
            this._profiles.set(remoteAuthority ?? '', profiles);
        }
        setReturnNone() {
            this._hasReturnedNone = false;
        }
    }
    class TestRemoteAgentService {
        setEnvironment(os) {
            this._os = os;
        }
        async getEnvironment() {
            return { os: this._os };
        }
    }
    const defaultTerminalConfig = { profiles: { windows: {}, linux: {}, osx: {} } };
    let powershellProfile = {
        profileName: 'PowerShell',
        path: 'C:\\Powershell.exe',
        isDefault: true,
        icon: codicons_1.Codicon.terminalPowershell
    };
    let jsdebugProfile = {
        extensionIdentifier: 'ms-vscode.js-debug-nightly',
        icon: 'debug',
        id: 'extension.js-debug.debugTerminal',
        title: 'JavaScript Debug Terminal'
    };
    const powershellPick = { label: 'Powershell', profile: powershellProfile, profileName: powershellProfile.profileName };
    const jsdebugPick = { label: 'Javascript Debug Terminal', profile: jsdebugProfile, profileName: jsdebugProfile.title };
    suite('TerminalProfileService', () => {
        let configurationService;
        let terminalInstanceService;
        let terminalProfileService;
        let remoteAgentService;
        let extensionService;
        let environmentService;
        let instantiationService;
        setup(async () => {
            configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: defaultTerminalConfig } });
            remoteAgentService = new TestRemoteAgentService();
            terminalInstanceService = new TestTerminalInstanceService();
            extensionService = new TestTerminalExtensionService();
            environmentService = { remoteAuthority: undefined };
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            const themeService = new testThemeService_1.TestThemeService();
            const terminalContributionService = new TestTerminalContributionService();
            const contextKeyService = new mockKeybindingService_1.MockContextKeyService();
            instantiationService.stub(contextkey_1.IContextKeyService, contextKeyService);
            instantiationService.stub(extensions_1.IExtensionService, extensionService);
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            instantiationService.stub(terminalExtensionPoints_1.ITerminalContributionService, terminalContributionService);
            instantiationService.stub(terminal_2.ITerminalInstanceService, terminalInstanceService);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, environmentService);
            instantiationService.stub(themeService_1.IThemeService, themeService);
            terminalProfileService = instantiationService.createInstance(TestTerminalProfileService);
            //reset as these properties are changed in each test
            powershellProfile = {
                profileName: 'PowerShell',
                path: 'C:\\Powershell.exe',
                isDefault: true,
                icon: codicons_1.Codicon.terminalPowershell
            };
            jsdebugProfile = {
                extensionIdentifier: 'ms-vscode.js-debug-nightly',
                icon: 'debug',
                id: 'extension.js-debug.debugTerminal',
                title: 'JavaScript Debug Terminal'
            };
            terminalInstanceService.setProfiles(undefined, [powershellProfile]);
            terminalInstanceService.setProfiles('fakeremote', []);
            terminalContributionService.setProfiles([jsdebugProfile]);
            if (platform_1.isWindows) {
                remoteAgentService.setEnvironment(1 /* OperatingSystem.Windows */);
            }
            else if (platform_1.isLinux) {
                remoteAgentService.setEnvironment(3 /* OperatingSystem.Linux */);
            }
            else {
                remoteAgentService.setEnvironment(2 /* OperatingSystem.Macintosh */);
            }
            configurationService.setUserConfiguration('terminal', { integrated: defaultTerminalConfig });
        });
        teardown(() => {
            instantiationService.dispose();
        });
        suite('Contributed Profiles', () => {
            test('should filter out contributed profiles set to null (Linux)', async () => {
                remoteAgentService.setEnvironment(3 /* OperatingSystem.Linux */);
                await configurationService.setUserConfiguration('terminal', {
                    integrated: {
                        profiles: {
                            linux: {
                                'JavaScript Debug Terminal': null
                            }
                        }
                    }
                });
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true, source: 2 /* ConfigurationTarget.USER */ });
                await terminalProfileService.refreshAndAwaitAvailableProfiles();
                (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
                (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, []);
            });
            test('should filter out contributed profiles set to null (Windows)', async () => {
                remoteAgentService.setEnvironment(1 /* OperatingSystem.Windows */);
                await configurationService.setUserConfiguration('terminal', {
                    integrated: {
                        profiles: {
                            windows: {
                                'JavaScript Debug Terminal': null
                            }
                        }
                    }
                });
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true, source: 2 /* ConfigurationTarget.USER */ });
                await terminalProfileService.refreshAndAwaitAvailableProfiles();
                (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
                (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, []);
            });
            test('should filter out contributed profiles set to null (macOS)', async () => {
                remoteAgentService.setEnvironment(2 /* OperatingSystem.Macintosh */);
                await configurationService.setUserConfiguration('terminal', {
                    integrated: {
                        profiles: {
                            osx: {
                                'JavaScript Debug Terminal': null
                            }
                        }
                    }
                });
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true, source: 2 /* ConfigurationTarget.USER */ });
                await terminalProfileService.refreshAndAwaitAvailableProfiles();
                (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
                (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, []);
            });
            test('should include contributed profiles', async () => {
                await terminalProfileService.refreshAndAwaitAvailableProfiles();
                (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
                (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
            });
        });
        test('should get profiles from remoteTerminalService when there is a remote authority', async () => {
            environmentService = { remoteAuthority: 'fakeremote' };
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, environmentService);
            terminalProfileService = instantiationService.createInstance(TestTerminalProfileService);
            await terminalProfileService.hasRefreshedProfiles;
            (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, []);
            (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
            terminalInstanceService.setProfiles('fakeremote', [powershellProfile]);
            await terminalProfileService.refreshAndAwaitAvailableProfiles();
            (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
        });
        test('should fire onDidChangeAvailableProfiles only when available profiles have changed via user config', async () => {
            powershellProfile.icon = codicons_1.Codicon.lightBulb;
            let calls = [];
            terminalProfileService.onDidChangeAvailableProfiles(e => calls.push(e));
            await configurationService.setUserConfiguration('terminal', {
                integrated: {
                    profiles: {
                        windows: powershellProfile,
                        linux: powershellProfile,
                        osx: powershellProfile
                    }
                }
            });
            await terminalProfileService.hasRefreshedProfiles;
            (0, assert_1.deepStrictEqual)(calls, [
                [powershellProfile]
            ]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
            calls = [];
            await terminalProfileService.refreshAndAwaitAvailableProfiles();
            (0, assert_1.deepStrictEqual)(calls, []);
        });
        test('should fire onDidChangeAvailableProfiles when available or contributed profiles have changed via remote/localTerminalService', async () => {
            powershellProfile.isDefault = false;
            terminalInstanceService.setProfiles(undefined, [powershellProfile]);
            const calls = [];
            terminalProfileService.onDidChangeAvailableProfiles(e => calls.push(e));
            await terminalProfileService.hasRefreshedProfiles;
            (0, assert_1.deepStrictEqual)(calls, [
                [powershellProfile]
            ]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
        });
        test('should call refreshAvailableProfiles _onDidChangeExtensions', async () => {
            extensionService._onDidChangeExtensions.fire();
            const calls = [];
            terminalProfileService.onDidChangeAvailableProfiles(e => calls.push(e));
            await terminalProfileService.hasRefreshedProfiles;
            (0, assert_1.deepStrictEqual)(calls, [
                [powershellProfile]
            ]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
        });
        suite('Profiles Quickpick', () => {
            let quickInputService;
            let mockTerminalProfileService;
            let terminalProfileQuickpick;
            setup(async () => {
                quickInputService = new MockQuickInputService();
                mockTerminalProfileService = new MockTerminalProfileService();
                instantiationService.stub(quickInput_1.IQuickInputService, quickInputService);
                instantiationService.stub(terminal_1.ITerminalProfileService, mockTerminalProfileService);
                terminalProfileQuickpick = instantiationService.createInstance(TestTerminalProfileQuickpick);
            });
            test('setDefault', async () => {
                powershellProfile.isDefault = false;
                mockTerminalProfileService.setProfiles([powershellProfile], [jsdebugProfile]);
                mockTerminalProfileService.setDefaultProfileName(jsdebugProfile.title);
                const result = await terminalProfileQuickpick.showAndGetResult('setDefault');
                (0, assert_1.deepStrictEqual)(result, powershellProfile.profileName);
            });
            test('setDefault to contributed', async () => {
                mockTerminalProfileService.setDefaultProfileName(powershellProfile.profileName);
                quickInputService.setPick(jsdebugPick);
                const result = await terminalProfileQuickpick.showAndGetResult('setDefault');
                const expected = {
                    config: {
                        extensionIdentifier: jsdebugProfile.extensionIdentifier,
                        id: jsdebugProfile.id,
                        options: { color: undefined, icon: 'debug' },
                        title: jsdebugProfile.title,
                    },
                    keyMods: undefined
                };
                (0, assert_1.deepStrictEqual)(result, expected);
            });
            test('createInstance', async () => {
                mockTerminalProfileService.setDefaultProfileName(powershellProfile.profileName);
                const pick = { ...powershellPick, keyMods: { alt: true, ctrlCmd: false } };
                quickInputService.setPick(pick);
                const result = await terminalProfileQuickpick.showAndGetResult('createInstance');
                (0, assert_1.deepStrictEqual)(result, { config: powershellProfile, keyMods: { alt: true, ctrlCmd: false } });
            });
            test('createInstance with contributed', async () => {
                const pick = { ...jsdebugPick, keyMods: { alt: true, ctrlCmd: false } };
                quickInputService.setPick(pick);
                const result = await terminalProfileQuickpick.showAndGetResult('createInstance');
                const expected = {
                    config: {
                        extensionIdentifier: jsdebugProfile.extensionIdentifier,
                        id: jsdebugProfile.id,
                        options: { color: undefined, icon: 'debug' },
                        title: jsdebugProfile.title,
                    },
                    keyMods: { alt: true, ctrlCmd: false }
                };
                (0, assert_1.deepStrictEqual)(result, expected);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9maWxlU2VydmljZS5pbnRlZ3JhdGlvblRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL3Rlc3QvYnJvd3Nlci90ZXJtaW5hbFByb2ZpbGVTZXJ2aWNlLmludGVncmF0aW9uVGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTJCaEcsTUFBTSwwQkFBMkIsU0FBUSwrQ0FBc0I7UUFFckQsd0JBQXdCO1lBQ2hDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztRQUNqRSxDQUFDO1FBQ0QsZ0NBQWdDO1lBQy9CLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO1lBQ25ELENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztRQUNsQyxDQUFDO0tBQ0Q7SUFFRCxNQUFNLDBCQUEwQjtRQUFoQztZQUdDLHNCQUFpQixHQUFvQyxFQUFFLENBQUM7WUFDeEQsd0JBQW1CLEdBQTZDLEVBQUUsQ0FBQztRQWNwRSxDQUFDO1FBYkEsS0FBSyxDQUFDLGNBQWM7WUFDbkIsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztRQUNELHFCQUFxQjtZQUNwQixPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztRQUNqQyxDQUFDO1FBQ0QsV0FBVyxDQUFDLFFBQTRCLEVBQUUsV0FBd0M7WUFDakYsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQztZQUNsQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsV0FBVyxDQUFDO1FBQ3hDLENBQUM7UUFDRCxxQkFBcUIsQ0FBQyxJQUFZO1lBQ2pDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7UUFDakMsQ0FBQztLQUNEO0lBR0QsTUFBTSxxQkFBcUI7UUFBM0I7WUFDQyxVQUFLLEdBQTBCLGNBQWMsQ0FBQztRQVkvQyxDQUFDO1FBUkEsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFVLEVBQUUsT0FBYSxFQUFFLEtBQVc7WUFDaEQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbkIsQ0FBQztRQUVELE9BQU8sQ0FBQyxJQUEyQjtZQUNsQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNuQixDQUFDO0tBQ0Q7SUFFRCxNQUFNLDRCQUE2QixTQUFRLG1EQUF3QjtLQUVsRTtJQUVELE1BQU0sNEJBQTZCLFNBQVEsNENBQW9CO1FBQS9EOztZQUNVLDJCQUFzQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7UUFDdkQsQ0FBQztLQUFBO0lBRUQsTUFBTSwrQkFBK0I7UUFBckM7WUFFQyxxQkFBZ0IsR0FBeUMsRUFBRSxDQUFDO1FBSTdELENBQUM7UUFIQSxXQUFXLENBQUMsUUFBcUM7WUFDaEQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFFBQVEsQ0FBQztRQUNsQyxDQUFDO0tBQ0Q7SUFFRCxNQUFNLDJCQUEyQjtRQUFqQztZQUNTLGNBQVMsR0FBb0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUN2RCxxQkFBZ0IsR0FBRyxJQUFJLENBQUM7UUFtQmpDLENBQUM7UUFsQkEsS0FBSyxDQUFDLFVBQVUsQ0FBQyxlQUFtQztZQUNuRCxPQUFPO2dCQUNOLFdBQVcsRUFBRSxLQUFLLElBQUksRUFBRTtvQkFDdkIsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQzt3QkFDM0IsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUN4RCxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQzt3QkFDN0IsT0FBTyxFQUFFLENBQUM7b0JBQ1gsQ0FBQztnQkFDRixDQUFDO2FBQ21DLENBQUM7UUFDdkMsQ0FBQztRQUNELFdBQVcsQ0FBQyxlQUFtQyxFQUFFLFFBQTRCO1lBQzVFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUNELGFBQWE7WUFDWixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO1FBQy9CLENBQUM7S0FDRDtJQUVELE1BQU0sc0JBQXNCO1FBRTNCLGNBQWMsQ0FBQyxFQUFtQjtZQUNqQyxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztRQUNmLENBQUM7UUFDRCxLQUFLLENBQUMsY0FBYztZQUNuQixPQUFPLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQTZCLENBQUM7UUFDcEQsQ0FBQztLQUNEO0lBRUQsTUFBTSxxQkFBcUIsR0FBb0MsRUFBRSxRQUFRLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7SUFDakgsSUFBSSxpQkFBaUIsR0FBRztRQUN2QixXQUFXLEVBQUUsWUFBWTtRQUN6QixJQUFJLEVBQUUsb0JBQW9CO1FBQzFCLFNBQVMsRUFBRSxJQUFJO1FBQ2YsSUFBSSxFQUFFLGtCQUFPLENBQUMsa0JBQWtCO0tBQ2hDLENBQUM7SUFDRixJQUFJLGNBQWMsR0FBRztRQUNwQixtQkFBbUIsRUFBRSw0QkFBNEI7UUFDakQsSUFBSSxFQUFFLE9BQU87UUFDYixFQUFFLEVBQUUsa0NBQWtDO1FBQ3RDLEtBQUssRUFBRSwyQkFBMkI7S0FDbEMsQ0FBQztJQUNGLE1BQU0sY0FBYyxHQUFHLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ3ZILE1BQU0sV0FBVyxHQUFHLEVBQUUsS0FBSyxFQUFFLDJCQUEyQixFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQUUsV0FBVyxFQUFFLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUV2SCxLQUFLLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO1FBQ3BDLElBQUksb0JBQThDLENBQUM7UUFDbkQsSUFBSSx1QkFBb0QsQ0FBQztRQUN6RCxJQUFJLHNCQUFrRCxDQUFDO1FBQ3ZELElBQUksa0JBQTBDLENBQUM7UUFDL0MsSUFBSSxnQkFBOEMsQ0FBQztRQUNuRCxJQUFJLGtCQUFnRCxDQUFDO1FBQ3JELElBQUksb0JBQThDLENBQUM7UUFFbkQsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ2hCLG9CQUFvQixHQUFHLElBQUksbURBQXdCLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxVQUFVLEVBQUUscUJBQXFCLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDekcsa0JBQWtCLEdBQUcsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO1lBQ2xELHVCQUF1QixHQUFHLElBQUksMkJBQTJCLEVBQUUsQ0FBQztZQUM1RCxnQkFBZ0IsR0FBRyxJQUFJLDRCQUE0QixFQUFFLENBQUM7WUFDdEQsa0JBQWtCLEdBQUcsRUFBRSxlQUFlLEVBQUUsU0FBUyxFQUFrQyxDQUFDO1lBQ3BGLG9CQUFvQixHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztZQUV0RCxNQUFNLFlBQVksR0FBRyxJQUFJLG1DQUFnQixFQUFFLENBQUM7WUFDNUMsTUFBTSwyQkFBMkIsR0FBRyxJQUFJLCtCQUErQixFQUFFLENBQUM7WUFDMUUsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLDZDQUFxQixFQUFFLENBQUM7WUFFdEQsb0JBQW9CLENBQUMsSUFBSSxDQUFDLCtCQUFrQixFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDakUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDhCQUFpQixFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDL0Qsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHFDQUFxQixFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFDdkUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHdDQUFtQixFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFDbkUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHNEQUE0QixFQUFFLDJCQUEyQixDQUFDLENBQUM7WUFDckYsb0JBQW9CLENBQUMsSUFBSSxDQUFDLG1DQUF3QixFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFDN0Usb0JBQW9CLENBQUMsSUFBSSxDQUFDLGlEQUE0QixFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFDNUUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDRCQUFhLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFFdkQsc0JBQXNCLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDBCQUEwQixDQUFDLENBQUM7WUFFekYsb0RBQW9EO1lBQ3BELGlCQUFpQixHQUFHO2dCQUNuQixXQUFXLEVBQUUsWUFBWTtnQkFDekIsSUFBSSxFQUFFLG9CQUFvQjtnQkFDMUIsU0FBUyxFQUFFLElBQUk7Z0JBQ2YsSUFBSSxFQUFFLGtCQUFPLENBQUMsa0JBQWtCO2FBQ2hDLENBQUM7WUFDRixjQUFjLEdBQUc7Z0JBQ2hCLG1CQUFtQixFQUFFLDRCQUE0QjtnQkFDakQsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsRUFBRSxFQUFFLGtDQUFrQztnQkFDdEMsS0FBSyxFQUFFLDJCQUEyQjthQUNsQyxDQUFDO1lBRUYsdUJBQXVCLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUNwRSx1QkFBdUIsQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RELDJCQUEyQixDQUFDLFdBQVcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDMUQsSUFBSSxvQkFBUyxFQUFFLENBQUM7Z0JBQ2Ysa0JBQWtCLENBQUMsY0FBYyxpQ0FBeUIsQ0FBQztZQUM1RCxDQUFDO2lCQUFNLElBQUksa0JBQU8sRUFBRSxDQUFDO2dCQUNwQixrQkFBa0IsQ0FBQyxjQUFjLCtCQUF1QixDQUFDO1lBQzFELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxrQkFBa0IsQ0FBQyxjQUFjLG1DQUEyQixDQUFDO1lBQzlELENBQUM7WUFDRCxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsRUFBRSxVQUFVLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO1FBQzlGLENBQUMsQ0FBQyxDQUFDO1FBQ0gsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsS0FBSyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtZQUNsQyxJQUFJLENBQUMsNERBQTRELEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQzdFLGtCQUFrQixDQUFDLGNBQWMsK0JBQXVCLENBQUM7Z0JBQ3pELE1BQU0sb0JBQW9CLENBQUMsb0JBQW9CLENBQUMsVUFBVSxFQUFFO29CQUMzRCxVQUFVLEVBQUU7d0JBQ1gsUUFBUSxFQUFFOzRCQUNULEtBQUssRUFBRTtnQ0FDTiwyQkFBMkIsRUFBRSxJQUFJOzZCQUNqQzt5QkFDRDtxQkFDRDtpQkFDRCxDQUFDLENBQUM7Z0JBQ0gsb0JBQW9CLENBQUMsK0JBQStCLENBQUMsSUFBSSxDQUFDLEVBQUUsb0JBQW9CLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLE1BQU0sa0NBQTBCLEVBQVMsQ0FBQyxDQUFDO2dCQUN6SSxNQUFNLHNCQUFzQixDQUFDLGdDQUFnQyxFQUFFLENBQUM7Z0JBQ2hFLElBQUEsd0JBQWUsRUFBQyxzQkFBc0IsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQkFDL0UsSUFBQSx3QkFBZSxFQUFDLHNCQUFzQixDQUFDLG1CQUFtQixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLDhEQUE4RCxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUMvRSxrQkFBa0IsQ0FBQyxjQUFjLGlDQUF5QixDQUFDO2dCQUMzRCxNQUFNLG9CQUFvQixDQUFDLG9CQUFvQixDQUFDLFVBQVUsRUFBRTtvQkFDM0QsVUFBVSxFQUFFO3dCQUNYLFFBQVEsRUFBRTs0QkFDVCxPQUFPLEVBQUU7Z0NBQ1IsMkJBQTJCLEVBQUUsSUFBSTs2QkFDakM7eUJBQ0Q7cUJBQ0Q7aUJBQ0QsQ0FBQyxDQUFDO2dCQUNILG9CQUFvQixDQUFDLCtCQUErQixDQUFDLElBQUksQ0FBQyxFQUFFLG9CQUFvQixFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxNQUFNLGtDQUEwQixFQUFTLENBQUMsQ0FBQztnQkFDekksTUFBTSxzQkFBc0IsQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDO2dCQUNoRSxJQUFBLHdCQUFlLEVBQUMsc0JBQXNCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7Z0JBQy9FLElBQUEsd0JBQWUsRUFBQyxzQkFBc0IsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNqRSxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyw0REFBNEQsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDN0Usa0JBQWtCLENBQUMsY0FBYyxtQ0FBMkIsQ0FBQztnQkFDN0QsTUFBTSxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUU7b0JBQzNELFVBQVUsRUFBRTt3QkFDWCxRQUFRLEVBQUU7NEJBQ1QsR0FBRyxFQUFFO2dDQUNKLDJCQUEyQixFQUFFLElBQUk7NkJBQ2pDO3lCQUNEO3FCQUNEO2lCQUNELENBQUMsQ0FBQztnQkFDSCxvQkFBb0IsQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxvQkFBb0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxrQ0FBMEIsRUFBUyxDQUFDLENBQUM7Z0JBQ3pJLE1BQU0sc0JBQXNCLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQztnQkFDaEUsSUFBQSx3QkFBZSxFQUFDLHNCQUFzQixDQUFDLGlCQUFpQixFQUFFLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO2dCQUMvRSxJQUFBLHdCQUFlLEVBQUMsc0JBQXNCLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDakUsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMscUNBQXFDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3RELE1BQU0sc0JBQXNCLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQztnQkFDaEUsSUFBQSx3QkFBZSxFQUFDLHNCQUFzQixDQUFDLGlCQUFpQixFQUFFLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO2dCQUMvRSxJQUFBLHdCQUFlLEVBQUMsc0JBQXNCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBQy9FLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsaUZBQWlGLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbEcsa0JBQWtCLEdBQUcsRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFrQyxDQUFDO1lBQ3ZGLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpREFBNEIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQzVFLHNCQUFzQixHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQ3pGLE1BQU0sc0JBQXNCLENBQUMsb0JBQW9CLENBQUM7WUFDbEQsSUFBQSx3QkFBZSxFQUFDLHNCQUFzQixDQUFDLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzlELElBQUEsd0JBQWUsRUFBQyxzQkFBc0IsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDOUUsdUJBQXVCLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUN2RSxNQUFNLHNCQUFzQixDQUFDLGdDQUFnQyxFQUFFLENBQUM7WUFDaEUsSUFBQSx3QkFBZSxFQUFDLHNCQUFzQixDQUFDLGlCQUFpQixFQUFFLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBQy9FLElBQUEsd0JBQWUsRUFBQyxzQkFBc0IsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDL0UsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsb0dBQW9HLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDckgsaUJBQWlCLENBQUMsSUFBSSxHQUFHLGtCQUFPLENBQUMsU0FBUyxDQUFDO1lBQzNDLElBQUksS0FBSyxHQUF5QixFQUFFLENBQUM7WUFDckMsc0JBQXNCLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEUsTUFBTSxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUU7Z0JBQzNELFVBQVUsRUFBRTtvQkFDWCxRQUFRLEVBQUU7d0JBQ1QsT0FBTyxFQUFFLGlCQUFpQjt3QkFDMUIsS0FBSyxFQUFFLGlCQUFpQjt3QkFDeEIsR0FBRyxFQUFFLGlCQUFpQjtxQkFDdEI7aUJBQ0Q7YUFDRCxDQUFDLENBQUM7WUFDSCxNQUFNLHNCQUFzQixDQUFDLG9CQUFvQixDQUFDO1lBQ2xELElBQUEsd0JBQWUsRUFBQyxLQUFLLEVBQUU7Z0JBQ3RCLENBQUMsaUJBQWlCLENBQUM7YUFDbkIsQ0FBQyxDQUFDO1lBQ0gsSUFBQSx3QkFBZSxFQUFDLHNCQUFzQixDQUFDLGlCQUFpQixFQUFFLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBQy9FLElBQUEsd0JBQWUsRUFBQyxzQkFBc0IsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDOUUsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNYLE1BQU0sc0JBQXNCLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQztZQUNoRSxJQUFBLHdCQUFlLEVBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDhIQUE4SCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQy9JLGlCQUFpQixDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDcEMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUNwRSxNQUFNLEtBQUssR0FBeUIsRUFBRSxDQUFDO1lBQ3ZDLHNCQUFzQixDQUFDLDRCQUE0QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sc0JBQXNCLENBQUMsb0JBQW9CLENBQUM7WUFDbEQsSUFBQSx3QkFBZSxFQUFDLEtBQUssRUFBRTtnQkFDdEIsQ0FBQyxpQkFBaUIsQ0FBQzthQUNuQixDQUFDLENBQUM7WUFDSCxJQUFBLHdCQUFlLEVBQUMsc0JBQXNCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFDL0UsSUFBQSx3QkFBZSxFQUFDLHNCQUFzQixDQUFDLG1CQUFtQixFQUFFLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUMvRSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw2REFBNkQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM5RSxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMvQyxNQUFNLEtBQUssR0FBeUIsRUFBRSxDQUFDO1lBQ3ZDLHNCQUFzQixDQUFDLDRCQUE0QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sc0JBQXNCLENBQUMsb0JBQW9CLENBQUM7WUFDbEQsSUFBQSx3QkFBZSxFQUFDLEtBQUssRUFBRTtnQkFDdEIsQ0FBQyxpQkFBaUIsQ0FBQzthQUNuQixDQUFDLENBQUM7WUFDSCxJQUFBLHdCQUFlLEVBQUMsc0JBQXNCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFDL0UsSUFBQSx3QkFBZSxFQUFDLHNCQUFzQixDQUFDLG1CQUFtQixFQUFFLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUMvRSxDQUFDLENBQUMsQ0FBQztRQUNILEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7WUFDaEMsSUFBSSxpQkFBd0MsQ0FBQztZQUM3QyxJQUFJLDBCQUFzRCxDQUFDO1lBQzNELElBQUksd0JBQXNELENBQUM7WUFDM0QsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUNoQixpQkFBaUIsR0FBRyxJQUFJLHFCQUFxQixFQUFFLENBQUM7Z0JBQ2hELDBCQUEwQixHQUFHLElBQUksMEJBQTBCLEVBQUUsQ0FBQztnQkFDOUQsb0JBQW9CLENBQUMsSUFBSSxDQUFDLCtCQUFrQixFQUFFLGlCQUFpQixDQUFDLENBQUM7Z0JBQ2pFLG9CQUFvQixDQUFDLElBQUksQ0FBQyxrQ0FBdUIsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO2dCQUMvRSx3QkFBd0IsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNEJBQTRCLENBQUMsQ0FBQztZQUM5RixDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQzdCLGlCQUFpQixDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7Z0JBQ3BDLDBCQUEwQixDQUFDLFdBQVcsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO2dCQUM5RSwwQkFBMEIsQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZFLE1BQU0sTUFBTSxHQUFHLE1BQU0sd0JBQXdCLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQzdFLElBQUEsd0JBQWUsRUFBQyxNQUFNLEVBQUUsaUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDeEQsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQzVDLDBCQUEwQixDQUFDLHFCQUFxQixDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNoRixpQkFBaUIsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ3ZDLE1BQU0sTUFBTSxHQUFHLE1BQU0sd0JBQXdCLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQzdFLE1BQU0sUUFBUSxHQUFHO29CQUNoQixNQUFNLEVBQUU7d0JBQ1AsbUJBQW1CLEVBQUUsY0FBYyxDQUFDLG1CQUFtQjt3QkFDdkQsRUFBRSxFQUFFLGNBQWMsQ0FBQyxFQUFFO3dCQUNyQixPQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUU7d0JBQzVDLEtBQUssRUFBRSxjQUFjLENBQUMsS0FBSztxQkFDM0I7b0JBQ0QsT0FBTyxFQUFFLFNBQVM7aUJBQ2xCLENBQUM7Z0JBQ0YsSUFBQSx3QkFBZSxFQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNuQyxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDakMsMEJBQTBCLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ2hGLE1BQU0sSUFBSSxHQUFHLEVBQUUsR0FBRyxjQUFjLEVBQUUsT0FBTyxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQztnQkFDM0UsaUJBQWlCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLE1BQU0sR0FBRyxNQUFNLHdCQUF3QixDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQ2pGLElBQUEsd0JBQWUsRUFBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsT0FBTyxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2hHLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUNsRCxNQUFNLElBQUksR0FBRyxFQUFFLEdBQUcsV0FBVyxFQUFFLE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUM7Z0JBQ3hFLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxNQUFNLEdBQUcsTUFBTSx3QkFBd0IsQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUNqRixNQUFNLFFBQVEsR0FBRztvQkFDaEIsTUFBTSxFQUFFO3dCQUNQLG1CQUFtQixFQUFFLGNBQWMsQ0FBQyxtQkFBbUI7d0JBQ3ZELEVBQUUsRUFBRSxjQUFjLENBQUMsRUFBRTt3QkFDckIsT0FBTyxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO3dCQUM1QyxLQUFLLEVBQUUsY0FBYyxDQUFDLEtBQUs7cUJBQzNCO29CQUNELE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRTtpQkFDdEMsQ0FBQztnQkFDRixJQUFBLHdCQUFlLEVBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ25DLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9