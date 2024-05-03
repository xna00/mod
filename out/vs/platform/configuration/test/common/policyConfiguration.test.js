/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/uri", "vs/platform/configuration/common/configurations", "vs/platform/files/common/fileService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/log/common/log", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/base/common/buffer", "vs/base/common/objects", "vs/platform/policy/common/filePolicyService", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils"], function (require, exports, assert, event_1, uri_1, configurations_1, fileService_1, inMemoryFilesystemProvider_1, log_1, configurationRegistry_1, platform_1, buffer_1, objects_1, filePolicyService_1, timeTravelScheduler_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('PolicyConfiguration', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let testObject;
        let fileService;
        let policyService;
        const policyFile = uri_1.URI.file('policyFile').with({ scheme: 'vscode-tests' });
        const policyConfigurationNode = {
            'id': 'policyConfiguration',
            'order': 1,
            'title': 'a',
            'type': 'object',
            'properties': {
                'policy.settingA': {
                    'type': 'string',
                    'default': 'defaultValueA',
                    policy: {
                        name: 'PolicySettingA',
                        minimumVersion: '1.0.0',
                    }
                },
                'policy.settingB': {
                    'type': 'string',
                    'default': 'defaultValueB',
                    policy: {
                        name: 'PolicySettingB',
                        minimumVersion: '1.0.0',
                    }
                },
                'nonPolicy.setting': {
                    'type': 'boolean',
                    'default': true
                }
            }
        };
        suiteSetup(() => platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration(policyConfigurationNode));
        suiteTeardown(() => platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).deregisterConfigurations([policyConfigurationNode]));
        setup(async () => {
            const defaultConfiguration = disposables.add(new configurations_1.DefaultConfiguration());
            await defaultConfiguration.initialize();
            fileService = disposables.add(new fileService_1.FileService(new log_1.NullLogService()));
            const diskFileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(policyFile.scheme, diskFileSystemProvider));
            policyService = disposables.add(new filePolicyService_1.FilePolicyService(policyFile, fileService, new log_1.NullLogService()));
            testObject = disposables.add(new configurations_1.PolicyConfiguration(defaultConfiguration, policyService, new log_1.NullLogService()));
        });
        test('initialize: with policies', async () => {
            await fileService.writeFile(policyFile, buffer_1.VSBuffer.fromString(JSON.stringify({ 'PolicySettingA': 'policyValueA' })));
            await testObject.initialize();
            const acutal = testObject.configurationModel;
            assert.strictEqual(acutal.getValue('policy.settingA'), 'policyValueA');
            assert.strictEqual(acutal.getValue('policy.settingB'), undefined);
            assert.strictEqual(acutal.getValue('nonPolicy.setting'), undefined);
            assert.deepStrictEqual(acutal.keys, ['policy.settingA']);
            assert.deepStrictEqual(acutal.overrides, []);
        });
        test('initialize: no policies', async () => {
            await testObject.initialize();
            const acutal = testObject.configurationModel;
            assert.deepStrictEqual(acutal.keys, []);
            assert.deepStrictEqual(acutal.overrides, []);
            assert.strictEqual(acutal.getValue('policy.settingA'), undefined);
            assert.strictEqual(acutal.getValue('policy.settingB'), undefined);
            assert.strictEqual(acutal.getValue('nonPolicy.setting'), undefined);
        });
        test('initialize: with policies but not registered', async () => {
            await fileService.writeFile(policyFile, buffer_1.VSBuffer.fromString(JSON.stringify({ 'PolicySettingA': 'policyValueA', 'PolicySettingB': 'policyValueB', 'PolicySettingC': 'policyValueC' })));
            await testObject.initialize();
            const acutal = testObject.configurationModel;
            assert.strictEqual(acutal.getValue('policy.settingA'), 'policyValueA');
            assert.strictEqual(acutal.getValue('policy.settingB'), 'policyValueB');
            assert.strictEqual(acutal.getValue('nonPolicy.setting'), undefined);
            assert.deepStrictEqual(acutal.keys, ['policy.settingA', 'policy.settingB']);
            assert.deepStrictEqual(acutal.overrides, []);
        });
        test('change: when policy is added', async () => {
            await fileService.writeFile(policyFile, buffer_1.VSBuffer.fromString(JSON.stringify({ 'PolicySettingA': 'policyValueA' })));
            await testObject.initialize();
            await (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
                await fileService.writeFile(policyFile, buffer_1.VSBuffer.fromString(JSON.stringify({ 'PolicySettingA': 'policyValueA', 'PolicySettingB': 'policyValueB', 'PolicySettingC': 'policyValueC' })));
                await promise;
            });
            const acutal = testObject.configurationModel;
            assert.strictEqual(acutal.getValue('policy.settingA'), 'policyValueA');
            assert.strictEqual(acutal.getValue('policy.settingB'), 'policyValueB');
            assert.strictEqual(acutal.getValue('nonPolicy.setting'), undefined);
            assert.deepStrictEqual(acutal.keys, ['policy.settingA', 'policy.settingB']);
            assert.deepStrictEqual(acutal.overrides, []);
        });
        test('change: when policy is updated', async () => {
            await fileService.writeFile(policyFile, buffer_1.VSBuffer.fromString(JSON.stringify({ 'PolicySettingA': 'policyValueA' })));
            await testObject.initialize();
            await (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
                await fileService.writeFile(policyFile, buffer_1.VSBuffer.fromString(JSON.stringify({ 'PolicySettingA': 'policyValueAChanged' })));
                await promise;
            });
            const acutal = testObject.configurationModel;
            assert.strictEqual(acutal.getValue('policy.settingA'), 'policyValueAChanged');
            assert.strictEqual(acutal.getValue('policy.settingB'), undefined);
            assert.strictEqual(acutal.getValue('nonPolicy.setting'), undefined);
            assert.deepStrictEqual(acutal.keys, ['policy.settingA']);
            assert.deepStrictEqual(acutal.overrides, []);
        });
        test('change: when policy is removed', async () => {
            await fileService.writeFile(policyFile, buffer_1.VSBuffer.fromString(JSON.stringify({ 'PolicySettingA': 'policyValueA' })));
            await testObject.initialize();
            await (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
                await fileService.writeFile(policyFile, buffer_1.VSBuffer.fromString(JSON.stringify({})));
                await promise;
            });
            const acutal = testObject.configurationModel;
            assert.strictEqual(acutal.getValue('policy.settingA'), undefined);
            assert.strictEqual(acutal.getValue('policy.settingB'), undefined);
            assert.strictEqual(acutal.getValue('nonPolicy.setting'), undefined);
            assert.deepStrictEqual(acutal.keys, []);
            assert.deepStrictEqual(acutal.overrides, []);
        });
        test('change: when policy setting is registered', async () => {
            await fileService.writeFile(policyFile, buffer_1.VSBuffer.fromString(JSON.stringify({ 'PolicySettingC': 'policyValueC' })));
            await testObject.initialize();
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            policyConfigurationNode.properties['policy.settingC'] = {
                'type': 'string',
                'default': 'defaultValueC',
                policy: {
                    name: 'PolicySettingC',
                    minimumVersion: '1.0.0',
                }
            };
            platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration((0, objects_1.deepClone)(policyConfigurationNode));
            await promise;
            const acutal = testObject.configurationModel;
            assert.strictEqual(acutal.getValue('policy.settingC'), 'policyValueC');
            assert.strictEqual(acutal.getValue('policy.settingA'), undefined);
            assert.strictEqual(acutal.getValue('policy.settingB'), undefined);
            assert.strictEqual(acutal.getValue('nonPolicy.setting'), undefined);
            assert.deepStrictEqual(acutal.keys, ['policy.settingC']);
            assert.deepStrictEqual(acutal.overrides, []);
        });
        test('change: when policy setting is deregistered', async () => {
            await fileService.writeFile(policyFile, buffer_1.VSBuffer.fromString(JSON.stringify({ 'PolicySettingA': 'policyValueA' })));
            await testObject.initialize();
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).deregisterConfigurations([policyConfigurationNode]);
            await promise;
            const acutal = testObject.configurationModel;
            assert.strictEqual(acutal.getValue('policy.settingA'), undefined);
            assert.strictEqual(acutal.getValue('policy.settingB'), undefined);
            assert.strictEqual(acutal.getValue('nonPolicy.setting'), undefined);
            assert.deepStrictEqual(acutal.keys, []);
            assert.deepStrictEqual(acutal.overrides, []);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9saWN5Q29uZmlndXJhdGlvbi50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9jb25maWd1cmF0aW9uL3Rlc3QvY29tbW9uL3BvbGljeUNvbmZpZ3VyYXRpb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQW1CaEcsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtRQUVqQyxNQUFNLFdBQVcsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFOUQsSUFBSSxVQUErQixDQUFDO1FBQ3BDLElBQUksV0FBeUIsQ0FBQztRQUM5QixJQUFJLGFBQTZCLENBQUM7UUFDbEMsTUFBTSxVQUFVLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQztRQUMzRSxNQUFNLHVCQUF1QixHQUF1QjtZQUNuRCxJQUFJLEVBQUUscUJBQXFCO1lBQzNCLE9BQU8sRUFBRSxDQUFDO1lBQ1YsT0FBTyxFQUFFLEdBQUc7WUFDWixNQUFNLEVBQUUsUUFBUTtZQUNoQixZQUFZLEVBQUU7Z0JBQ2IsaUJBQWlCLEVBQUU7b0JBQ2xCLE1BQU0sRUFBRSxRQUFRO29CQUNoQixTQUFTLEVBQUUsZUFBZTtvQkFDMUIsTUFBTSxFQUFFO3dCQUNQLElBQUksRUFBRSxnQkFBZ0I7d0JBQ3RCLGNBQWMsRUFBRSxPQUFPO3FCQUN2QjtpQkFDRDtnQkFDRCxpQkFBaUIsRUFBRTtvQkFDbEIsTUFBTSxFQUFFLFFBQVE7b0JBQ2hCLFNBQVMsRUFBRSxlQUFlO29CQUMxQixNQUFNLEVBQUU7d0JBQ1AsSUFBSSxFQUFFLGdCQUFnQjt3QkFDdEIsY0FBYyxFQUFFLE9BQU87cUJBQ3ZCO2lCQUNEO2dCQUNELG1CQUFt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