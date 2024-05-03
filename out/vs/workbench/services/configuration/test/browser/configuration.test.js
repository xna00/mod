/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/resources", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/workbench/services/configuration/browser/configuration", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, event_1, resources_1, uri_1, utils_1, configurationRegistry_1, platform_1, configuration_1, environmentService_1, workbenchTestServices_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ConfigurationCache {
        constructor() {
            this.cache = new Map();
        }
        needsCaching(resource) { return false; }
        async read({ type, key }) { return this.cache.get(`${type}:${key}`) || ''; }
        async write({ type, key }, content) { this.cache.set(`${type}:${key}`, content); }
        async remove({ type, key }) { this.cache.delete(`${type}:${key}`); }
    }
    suite('DefaultConfiguration', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        const cacheKey = { type: 'defaults', key: 'configurationDefaultsOverrides' };
        let configurationCache;
        setup(() => {
            configurationCache = new ConfigurationCache();
            configurationRegistry.registerConfiguration({
                'id': 'test.configurationDefaultsOverride',
                'type': 'object',
                'properties': {
                    'test.configurationDefaultsOverride': {
                        'type': 'string',
                        'default': 'defaultValue',
                    }
                }
            });
        });
        teardown(() => {
            configurationRegistry.deregisterConfigurations(configurationRegistry.getConfigurations());
            const configurationDefaultsOverrides = configurationRegistry.getConfigurationDefaultsOverrides();
            configurationRegistry.deregisterDefaultConfigurations([...configurationDefaultsOverrides.keys()].map(key => ({ extensionId: configurationDefaultsOverrides.get(key)?.source, overrides: { [key]: configurationDefaultsOverrides.get(key)?.value } })));
        });
        test('configuration default overrides are read from environment', async () => {
            const environmentService = new environmentService_1.BrowserWorkbenchEnvironmentService('', (0, resources_1.joinPath)(uri_1.URI.file('tests').with({ scheme: 'vscode-tests' }), 'logs'), { configurationDefaults: { 'test.configurationDefaultsOverride': 'envOverrideValue' } }, workbenchTestServices_2.TestProductService);
            const testObject = disposables.add(new configuration_1.DefaultConfiguration(configurationCache, environmentService));
            await testObject.initialize();
            assert.deepStrictEqual(testObject.configurationModel.getValue('test.configurationDefaultsOverride'), 'envOverrideValue');
        });
        test('configuration default overrides are read from cache', async () => {
            localStorage.setItem(configuration_1.DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY, 'yes');
            await configurationCache.write(cacheKey, JSON.stringify({ 'test.configurationDefaultsOverride': 'overrideValue' }));
            const testObject = disposables.add(new configuration_1.DefaultConfiguration(configurationCache, workbenchTestServices_1.TestEnvironmentService));
            const actual = await testObject.initialize();
            assert.deepStrictEqual(actual.getValue('test.configurationDefaultsOverride'), 'overrideValue');
            assert.deepStrictEqual(testObject.configurationModel.getValue('test.configurationDefaultsOverride'), 'overrideValue');
        });
        test('configuration default overrides are not read from cache when model is read before initialize', async () => {
            localStorage.setItem(configuration_1.DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY, 'yes');
            await configurationCache.write(cacheKey, JSON.stringify({ 'test.configurationDefaultsOverride': 'overrideValue' }));
            const testObject = disposables.add(new configuration_1.DefaultConfiguration(configurationCache, workbenchTestServices_1.TestEnvironmentService));
            assert.deepStrictEqual(testObject.configurationModel.getValue('test.configurationDefaultsOverride'), undefined);
        });
        test('configuration default overrides read from cache override environment', async () => {
            const environmentService = new environmentService_1.BrowserWorkbenchEnvironmentService('', (0, resources_1.joinPath)(uri_1.URI.file('tests').with({ scheme: 'vscode-tests' }), 'logs'), { configurationDefaults: { 'test.configurationDefaultsOverride': 'envOverrideValue' } }, workbenchTestServices_2.TestProductService);
            localStorage.setItem(configuration_1.DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY, 'yes');
            await configurationCache.write(cacheKey, JSON.stringify({ 'test.configurationDefaultsOverride': 'overrideValue' }));
            const testObject = disposables.add(new configuration_1.DefaultConfiguration(configurationCache, environmentService));
            const actual = await testObject.initialize();
            assert.deepStrictEqual(actual.getValue('test.configurationDefaultsOverride'), 'overrideValue');
        });
        test('configuration default overrides are read from cache when default configuration changed', async () => {
            localStorage.setItem(configuration_1.DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY, 'yes');
            await configurationCache.write(cacheKey, JSON.stringify({ 'test.configurationDefaultsOverride': 'overrideValue' }));
            const testObject = disposables.add(new configuration_1.DefaultConfiguration(configurationCache, workbenchTestServices_1.TestEnvironmentService));
            await testObject.initialize();
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            configurationRegistry.registerConfiguration({
                'id': 'test.configurationDefaultsOverride',
                'type': 'object',
                'properties': {
                    'test.configurationDefaultsOverride1': {
                        'type': 'string',
                        'default': 'defaultValue',
                    }
                }
            });
            const { defaults: actual } = await promise;
            assert.deepStrictEqual(actual.getValue('test.configurationDefaultsOverride'), 'overrideValue');
        });
        test('configuration default overrides are not read from cache after reload', async () => {
            localStorage.setItem(configuration_1.DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY, 'yes');
            await configurationCache.write(cacheKey, JSON.stringify({ 'test.configurationDefaultsOverride': 'overrideValue' }));
            const testObject = disposables.add(new configuration_1.DefaultConfiguration(configurationCache, workbenchTestServices_1.TestEnvironmentService));
            await testObject.initialize();
            const actual = testObject.reload();
            assert.deepStrictEqual(actual.getValue('test.configurationDefaultsOverride'), 'defaultValue');
        });
        test('cache is reset after reload', async () => {
            localStorage.setItem(configuration_1.DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY, 'yes');
            await configurationCache.write(cacheKey, JSON.stringify({ 'test.configurationDefaultsOverride': 'overrideValue' }));
            const testObject = disposables.add(new configuration_1.DefaultConfiguration(configurationCache, workbenchTestServices_1.TestEnvironmentService));
            await testObject.initialize();
            testObject.reload();
            assert.deepStrictEqual(await configurationCache.read(cacheKey), '');
        });
        test('configuration default overrides are written in cache', async () => {
            const testObject = disposables.add(new configuration_1.DefaultConfiguration(configurationCache, workbenchTestServices_1.TestEnvironmentService));
            await testObject.initialize();
            testObject.reload();
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            configurationRegistry.registerDefaultConfigurations([{ overrides: { 'test.configurationDefaultsOverride': 'newoverrideValue' } }]);
            await promise;
            const actual = JSON.parse(await configurationCache.read(cacheKey));
            assert.deepStrictEqual(actual, { 'test.configurationDefaultsOverride': 'newoverrideValue' });
        });
        test('configuration default overrides are removed from cache if there are no overrides', async () => {
            const testObject = disposables.add(new configuration_1.DefaultConfiguration(configurationCache, workbenchTestServices_1.TestEnvironmentService));
            await testObject.initialize();
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            configurationRegistry.registerConfiguration({
                'id': 'test.configurationDefaultsOverride',
                'type': 'object',
                'properties': {
                    'test.configurationDefaultsOverride1': {
                        'type': 'string',
                        'default': 'defaultValue',
                    }
                }
            });
            await promise;
            assert.deepStrictEqual(await configurationCache.read(cacheKey), '');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbi50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvY29uZmlndXJhdGlvbi90ZXN0L2Jyb3dzZXIvY29uZmlndXJhdGlvbi50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBZWhHLE1BQU0sa0JBQWtCO1FBQXhCO1lBQ2tCLFVBQUssR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztRQUtwRCxDQUFDO1FBSkEsWUFBWSxDQUFDLFFBQWEsSUFBYSxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDdEQsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQW9CLElBQXFCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLElBQUksR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQy9HLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFvQixFQUFFLE9BQWUsSUFBbUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLElBQUksR0FBRyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNILEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFvQixJQUFtQixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNyRztJQUVELEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7UUFFbEMsTUFBTSxXQUFXLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBQzlELE1BQU0scUJBQXFC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