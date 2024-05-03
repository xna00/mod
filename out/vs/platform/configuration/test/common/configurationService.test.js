/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/network", "vs/base/common/uri", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/configuration/common/configurationService", "vs/platform/files/common/fileService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/log/common/log", "vs/platform/policy/common/filePolicyService", "vs/platform/policy/common/policy", "vs/platform/registry/common/platform"], function (require, exports, assert, buffer_1, event_1, network_1, uri_1, timeTravelScheduler_1, utils_1, configuration_1, configurationRegistry_1, configurationService_1, fileService_1, inMemoryFilesystemProvider_1, log_1, filePolicyService_1, policy_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ConfigurationService.test.ts', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let fileService;
        let settingsResource;
        setup(async () => {
            fileService = disposables.add(new fileService_1.FileService(new log_1.NullLogService()));
            const diskFileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider));
            settingsResource = uri_1.URI.file('settings.json');
        });
        test('simple', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(settingsResource, buffer_1.VSBuffer.fromString('{ "foo": "bar" }'));
            const testObject = disposables.add(new configurationService_1.ConfigurationService(settingsResource, fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await testObject.initialize();
            const config = testObject.getValue();
            assert.ok(config);
            assert.strictEqual(config.foo, 'bar');
        }));
        test('config gets flattened', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(settingsResource, buffer_1.VSBuffer.fromString('{ "testworkbench.editor.tabs": true }'));
            const testObject = disposables.add(new configurationService_1.ConfigurationService(settingsResource, fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await testObject.initialize();
            const config = testObject.getValue();
            assert.ok(config);
            assert.ok(config.testworkbench);
            assert.ok(config.testworkbench.editor);
            assert.strictEqual(config.testworkbench.editor.tabs, true);
        }));
        test('error case does not explode', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(settingsResource, buffer_1.VSBuffer.fromString(',,,,'));
            const testObject = disposables.add(new configurationService_1.ConfigurationService(settingsResource, fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await testObject.initialize();
            const config = testObject.getValue();
            assert.ok(config);
        }));
        test('missing file does not explode', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const testObject = disposables.add(new configurationService_1.ConfigurationService(uri_1.URI.file('__testFile'), fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await testObject.initialize();
            const config = testObject.getValue();
            assert.ok(config);
        }));
        test('trigger configuration change event when file does not exist', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const testObject = disposables.add(new configurationService_1.ConfigurationService(settingsResource, fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await testObject.initialize();
            return new Promise((c, e) => {
                disposables.add(event_1.Event.filter(testObject.onDidChangeConfiguration, e => e.source === 2 /* ConfigurationTarget.USER */)(() => {
                    assert.strictEqual(testObject.getValue('foo'), 'bar');
                    c();
                }));
                fileService.writeFile(settingsResource, buffer_1.VSBuffer.fromString('{ "foo": "bar" }')).catch(e);
            });
        }));
        test('trigger configuration change event when file exists', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const testObject = disposables.add(new configurationService_1.ConfigurationService(settingsResource, fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await fileService.writeFile(settingsResource, buffer_1.VSBuffer.fromString('{ "foo": "bar" }'));
            await testObject.initialize();
            return new Promise((c) => {
                disposables.add(event_1.Event.filter(testObject.onDidChangeConfiguration, e => e.source === 2 /* ConfigurationTarget.USER */)(async (e) => {
                    assert.strictEqual(testObject.getValue('foo'), 'barz');
                    c();
                }));
                fileService.writeFile(settingsResource, buffer_1.VSBuffer.fromString('{ "foo": "barz" }'));
            });
        }));
        test('reloadConfiguration', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(settingsResource, buffer_1.VSBuffer.fromString('{ "foo": "bar" }'));
            const testObject = disposables.add(new configurationService_1.ConfigurationService(settingsResource, fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await testObject.initialize();
            let config = testObject.getValue();
            assert.ok(config);
            assert.strictEqual(config.foo, 'bar');
            await fileService.writeFile(settingsResource, buffer_1.VSBuffer.fromString('{ "foo": "changed" }'));
            // force a reload to get latest
            await testObject.reloadConfiguration();
            config = testObject.getValue();
            assert.ok(config);
            assert.strictEqual(config.foo, 'changed');
        }));
        test('model defaults', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configuration.service.testSetting': {
                        'type': 'string',
                        'default': 'isSet'
                    }
                }
            });
            let testObject = disposables.add(new configurationService_1.ConfigurationService(uri_1.URI.file('__testFile'), fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await testObject.initialize();
            let setting = testObject.getValue();
            assert.ok(setting);
            assert.strictEqual(setting.configuration.service.testSetting, 'isSet');
            await fileService.writeFile(settingsResource, buffer_1.VSBuffer.fromString('{ "testworkbench.editor.tabs": true }'));
            testObject = disposables.add(new configurationService_1.ConfigurationService(settingsResource, fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await testObject.initialize();
            setting = testObject.getValue();
            assert.ok(setting);
            assert.strictEqual(setting.configuration.service.testSetting, 'isSet');
            await fileService.writeFile(settingsResource, buffer_1.VSBuffer.fromString('{ "configuration.service.testSetting": "isChanged" }'));
            await testObject.reloadConfiguration();
            setting = testObject.getValue();
            assert.ok(setting);
            assert.strictEqual(setting.configuration.service.testSetting, 'isChanged');
        }));
        test('lookup', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'lookup.service.testSetting': {
                        'type': 'string',
                        'default': 'isSet'
                    }
                }
            });
            const testObject = disposables.add(new configurationService_1.ConfigurationService(settingsResource, fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await testObject.initialize();
            let res = testObject.inspect('something.missing');
            assert.strictEqual(res.value, undefined);
            assert.strictEqual(res.defaultValue, undefined);
            assert.strictEqual(res.userValue, undefined);
            assert.strictEqual((0, configuration_1.isConfigured)(res), false);
            res = testObject.inspect('lookup.service.testSetting');
            assert.strictEqual(res.defaultValue, 'isSet');
            assert.strictEqual(res.value, 'isSet');
            assert.strictEqual(res.userValue, undefined);
            assert.strictEqual((0, configuration_1.isConfigured)(res), false);
            await fileService.writeFile(settingsResource, buffer_1.VSBuffer.fromString('{ "lookup.service.testSetting": "bar" }'));
            await testObject.reloadConfiguration();
            res = testObject.inspect('lookup.service.testSetting');
            assert.strictEqual(res.defaultValue, 'isSet');
            assert.strictEqual(res.userValue, 'bar');
            assert.strictEqual(res.value, 'bar');
            assert.strictEqual((0, configuration_1.isConfigured)(res), true);
        }));
        test('lookup with null', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': '_testNull',
                'type': 'object',
                'properties': {
                    'lookup.service.testNullSetting': {
                        'type': 'null',
                    }
                }
            });
            const testObject = disposables.add(new configurationService_1.ConfigurationService(settingsResource, fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await testObject.initialize();
            let res = testObject.inspect('lookup.service.testNullSetting');
            assert.strictEqual(res.defaultValue, null);
            assert.strictEqual(res.value, null);
            assert.strictEqual(res.userValue, undefined);
            await fileService.writeFile(settingsResource, buffer_1.VSBuffer.fromString('{ "lookup.service.testNullSetting": null }'));
            await testObject.reloadConfiguration();
            res = testObject.inspect('lookup.service.testNullSetting');
            assert.strictEqual(res.defaultValue, null);
            assert.strictEqual(res.value, null);
            assert.strictEqual(res.userValue, null);
        }));
        test('update configuration', async () => {
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.testSetting': {
                        'type': 'string',
                        'default': 'isSet'
                    }
                }
            });
            const testObject = disposables.add(new configurationService_1.ConfigurationService(settingsResource, fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await testObject.initialize();
            await testObject.updateValue('configurationService.testSetting', 'value');
            assert.strictEqual(testObject.getValue('configurationService.testSetting'), 'value');
        });
        test('update configuration when exist', async () => {
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.testSetting': {
                        'type': 'string',
                        'default': 'isSet'
                    }
                }
            });
            const testObject = disposables.add(new configurationService_1.ConfigurationService(settingsResource, fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await testObject.initialize();
            await testObject.updateValue('configurationService.testSetting', 'value');
            await testObject.updateValue('configurationService.testSetting', 'updatedValue');
            assert.strictEqual(testObject.getValue('configurationService.testSetting'), 'updatedValue');
        });
        test('update configuration to default value should remove', async () => {
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.testSetting': {
                        'type': 'string',
                        'default': 'isSet'
                    }
                }
            });
            const testObject = disposables.add(new configurationService_1.ConfigurationService(settingsResource, fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await testObject.initialize();
            await testObject.updateValue('configurationService.testSetting', 'value');
            await testObject.updateValue('configurationService.testSetting', 'isSet');
            const inspect = testObject.inspect('configurationService.testSetting');
            assert.strictEqual(inspect.userValue, undefined);
        });
        test('update configuration should remove when undefined is passed', async () => {
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.testSetting': {
                        'type': 'string',
                        'default': 'isSet'
                    }
                }
            });
            const testObject = disposables.add(new configurationService_1.ConfigurationService(settingsResource, fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await testObject.initialize();
            await testObject.updateValue('configurationService.testSetting', 'value');
            await testObject.updateValue('configurationService.testSetting', undefined);
            const inspect = testObject.inspect('configurationService.testSetting');
            assert.strictEqual(inspect.userValue, undefined);
        });
        test('update unknown configuration', async () => {
            const testObject = disposables.add(new configurationService_1.ConfigurationService(settingsResource, fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await testObject.initialize();
            await testObject.updateValue('configurationService.unknownSetting', 'value');
            assert.strictEqual(testObject.getValue('configurationService.unknownSetting'), 'value');
        });
        test('update configuration in non user target throws error', async () => {
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.testSetting': {
                        'type': 'string',
                        'default': 'isSet'
                    }
                }
            });
            const testObject = disposables.add(new configurationService_1.ConfigurationService(settingsResource, fileService, new policy_1.NullPolicyService(), new log_1.NullLogService()));
            await testObject.initialize();
            try {
                await testObject.updateValue('configurationService.testSetting', 'value', 5 /* ConfigurationTarget.WORKSPACE */);
                assert.fail('Should fail with error');
            }
            catch (e) {
                // succeess
            }
        });
        test('update configuration throws error for policy setting', async () => {
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.policySetting': {
                        'type': 'string',
                        'default': 'isSet',
                        policy: {
                            name: 'configurationService.policySetting',
                            minimumVersion: '1.0.0',
                        }
                    }
                }
            });
            const logService = new log_1.NullLogService();
            const policyFile = uri_1.URI.file('policies.json');
            await fileService.writeFile(policyFile, buffer_1.VSBuffer.fromString('{ "configurationService.policySetting": "policyValue" }'));
            const policyService = disposables.add(new filePolicyService_1.FilePolicyService(policyFile, fileService, logService));
            const testObject = disposables.add(new configurationService_1.ConfigurationService(settingsResource, fileService, policyService, logService));
            await testObject.initialize();
            try {
                await testObject.updateValue('configurationService.policySetting', 'value');
                assert.fail('Should throw error');
            }
            catch (error) {
                // succeess
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvblNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vY29uZmlndXJhdGlvbi90ZXN0L2NvbW1vbi9jb25maWd1cmF0aW9uU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBb0JoRyxLQUFLLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO1FBRTFDLE1BQU0sV0FBVyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUU5RCxJQUFJLFdBQXlCLENBQUM7UUFDOUIsSUFBSSxnQkFBcUIsQ0FBQztRQUUxQixLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDaEIsV0FBVyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx5QkFBVyxDQUFDLElBQUksb0JBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRSxNQUFNLHNCQUFzQixHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx1REFBMEIsRUFBRSxDQUFDLENBQUM7WUFDakYsV0FBVyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLGdCQUFnQixHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDOUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUEsd0NBQWtCLEVBQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakYsTUFBTSxXQUFXLENBQUMsU0FBUyxDQUFDLGdCQUFnQixFQUFFLGlCQUFRLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLENB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