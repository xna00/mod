/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/files/common/fileService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/uriIdentity/common/uriIdentityService", "vs/workbench/contrib/debug/browser/debugConfigurationManager", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/preferences/common/preferences", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, cancellation_1, event_1, lifecycle_1, uri_1, utils_1, configuration_1, testConfigurationService_1, contextKeyService_1, fileService_1, serviceCollection_1, instantiationServiceMock_1, log_1, uriIdentityService_1, debugConfigurationManager_1, debug_1, preferences_1, workbenchTestServices_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('debugConfigurationManager', () => {
        const configurationProviderType = 'custom-type';
        let _debugConfigurationManager;
        let disposables;
        const adapterManager = {
            getDebugAdapterDescriptor(session, config) {
                return Promise.resolve(undefined);
            },
            activateDebuggers(activationEvent, debugType) {
                return Promise.resolve();
            },
            get onDidDebuggersExtPointRead() {
                return event_1.Event.None;
            }
        };
        const preferencesService = {
            userSettingsResource: uri_1.URI.file('/tmp/settings.json')
        };
        const configurationService = new testConfigurationService_1.TestConfigurationService();
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            const fileService = disposables.add(new fileService_1.FileService(new log_1.NullLogService()));
            const instantiationService = disposables.add(new instantiationServiceMock_1.TestInstantiationService(new serviceCollection_1.ServiceCollection([preferences_1.IPreferencesService, preferencesService], [configuration_1.IConfigurationService, configurationService])));
            _debugConfigurationManager = new debugConfigurationManager_1.ConfigurationManager(adapterManager, new workbenchTestServices_2.TestContextService(), configurationService, new workbenchTestServices_1.TestQuickInputService(), instantiationService, new workbenchTestServices_2.TestStorageService(), new workbenchTestServices_2.TestExtensionService(), new workbenchTestServices_2.TestHistoryService(), new uriIdentityService_1.UriIdentityService(fileService), new contextKeyService_1.ContextKeyService(configurationService));
        });
        teardown(() => disposables.dispose());
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('resolves configuration based on type', async () => {
            disposables.add(_debugConfigurationManager.registerDebugConfigurationProvider({
                type: configurationProviderType,
                resolveDebugConfiguration: (folderUri, config, token) => {
                    assert.strictEqual(config.type, configurationProviderType);
                    return Promise.resolve({
                        ...config,
                        configurationResolved: true
                    });
                },
                triggerKind: debug_1.DebugConfigurationProviderTriggerKind.Initial
            }));
            const initialConfig = {
                type: configurationProviderType,
                request: 'launch',
                name: 'configName',
            };
            const resultConfig = await _debugConfigurationManager.resolveConfigurationByProviders(undefined, configurationProviderType, initialConfig, cancellation_1.CancellationToken.None);
            assert.strictEqual(resultConfig.configurationResolved, true, 'Configuration should be updated by test provider');
        });
        test('resolves configuration from second provider if type changes', async () => {
            const secondProviderType = 'second-provider';
            disposables.add(_debugConfigurationManager.registerDebugConfigurationProvider({
                type: configurationProviderType,
                resolveDebugConfiguration: (folderUri, config, token) => {
                    assert.strictEqual(config.type, configurationProviderType);
                    return Promise.resolve({
                        ...config,
                        type: secondProviderType
                    });
                },
                triggerKind: debug_1.DebugConfigurationProviderTriggerKind.Initial
            }));
            disposables.add(_debugConfigurationManager.registerDebugConfigurationProvider({
                type: secondProviderType,
                resolveDebugConfiguration: (folderUri, config, token) => {
                    assert.strictEqual(config.type, secondProviderType);
                    return Promise.resolve({
                        ...config,
                        configurationResolved: true
                    });
                },
                triggerKind: debug_1.DebugConfigurationProviderTriggerKind.Initial
            }));
            const initialConfig = {
                type: configurationProviderType,
                request: 'launch',
                name: 'configName',
            };
            const resultConfig = await _debugConfigurationManager.resolveConfigurationByProviders(undefined, configurationProviderType, initialConfig, cancellation_1.CancellationToken.None);
            assert.strictEqual(resultConfig.type, secondProviderType);
            assert.strictEqual(resultConfig.configurationResolved, true, 'Configuration should be updated by test provider');
        });
        teardown(() => disposables.clear());
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdDb25maWd1cmF0aW9uTWFuYWdlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy90ZXN0L2Jyb3dzZXIvZGVidWdDb25maWd1cmF0aW9uTWFuYWdlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBc0JoRyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1FBQ3ZDLE1BQU0seUJBQXlCLEdBQUcsYUFBYSxDQUFDO1FBQ2hELElBQUksMEJBQWdELENBQUM7UUFDckQsSUFBSSxXQUE0QixDQUFDO1FBRWpDLE1BQU0sY0FBYyxHQUFvQjtZQUN2Qyx5QkFBeUIsQ0FBQyxPQUFzQixFQUFFLE1BQWU7Z0JBQ2hFLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNuQyxDQUFDO1lBRUQsaUJBQWlCLENBQUMsZUFBdUIsRUFBRSxTQUFrQjtnQkFDNUQsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDMUIsQ0FBQztZQUVELElBQUksMEJBQTBCO2dCQUM3QixPQUFPLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDbkIsQ0FBQztTQUNELENBQUM7UUFFRixNQUFNLGtCQUFrQixHQUF3QjtZQUMvQyxvQkFBb0IsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDO1NBQ3BELENBQUM7UUFFRixNQUFNLG9CQUFvQixHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztRQUM1RCxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx5QkFBVyxDQUFDLElBQUksb0JBQWMsRUFB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