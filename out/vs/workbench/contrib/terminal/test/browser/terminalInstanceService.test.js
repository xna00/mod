/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/browser/contextKeyService", "vs/workbench/contrib/terminal/browser/terminalInstanceService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/test/browser/workbenchTestServices", "vs/base/test/common/utils"], function (require, exports, assert_1, uri_1, instantiationServiceMock_1, contextkey_1, contextKeyService_1, terminalInstanceService_1, configuration_1, testConfigurationService_1, environmentService_1, workbenchTestServices_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench - TerminalInstanceService', () => {
        let instantiationService;
        let terminalInstanceService;
        setup(async () => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            // TODO: Should be able to create these services without this config set
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService({
                terminal: {
                    integrated: {
                        fontWeight: 'normal'
                    }
                }
            }));
            instantiationService.stub(contextkey_1.IContextKeyService, instantiationService.createInstance(contextKeyService_1.ContextKeyService));
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, workbenchTestServices_1.TestEnvironmentService);
            terminalInstanceService = instantiationService.createInstance(terminalInstanceService_1.TerminalInstanceService);
        });
        teardown(() => {
            instantiationService.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('convertProfileToShellLaunchConfig', () => {
            test('should return an empty shell launch config when undefined is provided', () => {
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig(), {});
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig(undefined), {});
            });
            test('should return the same shell launch config when provided', () => {
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig({}), {});
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig({ executable: '/foo' }), { executable: '/foo' });
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig({ executable: '/foo', cwd: '/bar', args: ['a', 'b'] }), { executable: '/foo', cwd: '/bar', args: ['a', 'b'] });
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig({ executable: '/foo' }, '/bar'), { executable: '/foo', cwd: '/bar' });
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig({ executable: '/foo', cwd: '/bar' }, '/baz'), { executable: '/foo', cwd: '/baz' });
            });
            test('should convert a provided profile to a shell launch config', () => {
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig({
                    profileName: 'abc',
                    path: '/foo',
                    isDefault: true
                }), {
                    args: undefined,
                    color: undefined,
                    cwd: undefined,
                    env: undefined,
                    executable: '/foo',
                    icon: undefined,
                    name: undefined
                });
                const icon = uri_1.URI.file('/icon');
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig({
                    profileName: 'abc',
                    path: '/foo',
                    isDefault: true,
                    args: ['a', 'b'],
                    color: 'color',
                    env: { test: 'TEST' },
                    icon
                }, '/bar'), {
                    args: ['a', 'b'],
                    color: 'color',
                    cwd: '/bar',
                    env: { test: 'TEST' },
                    executable: '/foo',
                    icon,
                    name: undefined
                });
            });
            test('should respect overrideName in profile', () => {
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig({
                    profileName: 'abc',
                    path: '/foo',
                    isDefault: true,
                    overrideName: true
                }), {
                    args: undefined,
                    color: undefined,
                    cwd: undefined,
                    env: undefined,
                    executable: '/foo',
                    icon: undefined,
                    name: 'abc'
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxJbnN0YW5jZVNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvdGVzdC9icm93c2VyL3Rlcm1pbmFsSW5zdGFuY2VTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFnQmhHLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxHQUFHLEVBQUU7UUFDakQsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLHVCQUFpRCxDQUFDO1FBRXRELEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNoQixvQkFBb0IsR0FBRyxJQUFJLG1EQUF3QixFQUFFLENBQUM7WUFDdEQsd0VBQXdFO1lBQ3hFLG9CQUFvQixDQUFDLElBQUksQ0FBQyxxQ0FBcUIsRUFBRSxJQUFJLG1EQUF3QixDQUFDO2dCQUM3RSxRQUFRLEVBQUU7b0JBQ1QsVUFBVSxFQUFFO3dCQUNYLFVBQVUsRUFBRSxRQUFRO3FCQUNwQjtpQkFDRDthQUNELENBQUMsQ0FBQyxDQUFDO1lBQ0osb0JBQW9CLENBQUMsSUFBSSxDQUFDLCtCQUFrQixFQUFFLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxxQ0FBaUIsQ0FBQyxDQUFDLENBQUM7WUFDdEcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGlEQUE0QixFQUFFLDhDQUFzQixDQUFDLENBQUM7WUFFaEYsdUJBQXVCLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlEQUF1QixDQUFDLENBQUM7UUFDeEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2Isb0JBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FB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