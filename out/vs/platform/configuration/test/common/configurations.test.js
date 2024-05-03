/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/objects", "vs/base/test/common/utils", "vs/platform/configuration/common/configurationRegistry", "vs/platform/configuration/common/configurations", "vs/platform/registry/common/platform"], function (require, exports, assert, event_1, objects_1, utils_1, configurationRegistry_1, configurations_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('DefaultConfiguration', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        setup(() => reset());
        teardown(() => reset());
        function reset() {
            configurationRegistry.deregisterConfigurations(configurationRegistry.getConfigurations());
            const configurationDefaultsOverrides = configurationRegistry.getConfigurationDefaultsOverrides();
            configurationRegistry.deregisterDefaultConfigurations([...configurationDefaultsOverrides.keys()].map(key => ({ extensionId: configurationDefaultsOverrides.get(key)?.source, overrides: { [key]: configurationDefaultsOverrides.get(key)?.value } })));
        }
        test('Test registering a property before initialize', async () => {
            const testObject = disposables.add(new configurations_1.DefaultConfiguration());
            configurationRegistry.registerConfiguration({
                'id': 'a',
                'order': 1,
                'title': 'a',
                'type': 'object',
                'properties': {
                    'a': {
                        'description': 'a',
                        'type': 'boolean',
                        'default': false,
                    }
                }
            });
            const actual = await testObject.initialize();
            assert.strictEqual(actual.getValue('a'), false);
        });
        test('Test registering a property and do not initialize', async () => {
            const testObject = disposables.add(new configurations_1.DefaultConfiguration());
            configurationRegistry.registerConfiguration({
                'id': 'a',
                'order': 1,
                'title': 'a',
                'type': 'object',
                'properties': {
                    'a': {
                        'description': 'a',
                        'type': 'boolean',
                        'default': false,
                    }
                }
            });
            assert.strictEqual(testObject.configurationModel.getValue('a'), undefined);
        });
        test('Test registering a property after initialize', async () => {
            const testObject = disposables.add(new configurations_1.DefaultConfiguration());
            await testObject.initialize();
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            configurationRegistry.registerConfiguration({
                'id': 'a',
                'order': 1,
                'title': 'a',
                'type': 'object',
                'properties': {
                    'defaultConfiguration.testSetting1': {
                        'description': 'a',
                        'type': 'boolean',
                        'default': false,
                    }
                }
            });
            const { defaults: actual, properties } = await promise;
            assert.strictEqual(actual.getValue('defaultConfiguration.testSetting1'), false);
            assert.deepStrictEqual(properties, ['defaultConfiguration.testSetting1']);
        });
        test('Test registering nested properties', async () => {
            const testObject = disposables.add(new configurations_1.DefaultConfiguration());
            configurationRegistry.registerConfiguration({
                'id': 'a',
                'order': 1,
                'title': 'a',
                'type': 'object',
                'properties': {
                    'a.b': {
                        'description': '1',
                        'type': 'object',
                        'default': {},
                    },
                    'a.b.c': {
                        'description': '2',
                        'type': 'object',
                        'default': '2',
                    }
                }
            });
            const actual = await testObject.initialize();
            assert.ok((0, objects_1.equals)(actual.getValue('a'), { b: { c: '2' } }));
            assert.ok((0, objects_1.equals)(actual.contents, { 'a': { b: { c: '2' } } }));
            assert.deepStrictEqual(actual.keys, ['a.b', 'a.b.c']);
        });
        test('Test registering the same property again', async () => {
            const testObject = disposables.add(new configurations_1.DefaultConfiguration());
            configurationRegistry.registerConfiguration({
                'id': 'a',
                'order': 1,
                'title': 'a',
                'type': 'object',
                'properties': {
                    'a': {
                        'description': 'a',
                        'type': 'boolean',
                        'default': true,
                    }
                }
            });
            configurationRegistry.registerConfiguration({
                'id': 'a',
                'order': 1,
                'title': 'a',
                'type': 'object',
                'properties': {
                    'a': {
                        'description': 'a',
                        'type': 'boolean',
                        'default': false,
                    }
                }
            });
            const actual = await testObject.initialize();
            assert.strictEqual(true, actual.getValue('a'));
        });
        test('Test registering an override identifier', async () => {
            const testObject = disposables.add(new configurations_1.DefaultConfiguration());
            configurationRegistry.registerDefaultConfigurations([{
                    overrides: {
                        '[a]': {
                            'b': true
                        }
                    }
                }]);
            const actual = await testObject.initialize();
            assert.ok((0, objects_1.equals)(actual.getValue('[a]'), { 'b': true }));
            assert.ok((0, objects_1.equals)(actual.contents, { '[a]': { 'b': true } }));
            assert.ok((0, objects_1.equals)(actual.overrides, [{ contents: { 'b': true }, identifiers: ['a'], keys: ['b'] }]));
            assert.deepStrictEqual(actual.keys, ['[a]']);
            assert.strictEqual(actual.getOverrideValue('b', 'a'), true);
        });
        test('Test registering a normal property and override identifier', async () => {
            const testObject = disposables.add(new configurations_1.DefaultConfiguration());
            configurationRegistry.registerConfiguration({
                'id': 'a',
                'order': 1,
                'title': 'a',
                'type': 'object',
                'properties': {
                    'b': {
                        'description': 'b',
                        'type': 'boolean',
                        'default': false,
                    }
                }
            });
            configurationRegistry.registerDefaultConfigurations([{
                    overrides: {
                        '[a]': {
                            'b': true
                        }
                    }
                }]);
            const actual = await testObject.initialize();
            assert.deepStrictEqual(actual.getValue('b'), false);
            assert.ok((0, objects_1.equals)(actual.getValue('[a]'), { 'b': true }));
            assert.ok((0, objects_1.equals)(actual.contents, { 'b': false, '[a]': { 'b': true } }));
            assert.ok((0, objects_1.equals)(actual.overrides, [{ contents: { 'b': true }, identifiers: ['a'], keys: ['b'] }]));
            assert.deepStrictEqual(actual.keys, ['b', '[a]']);
            assert.strictEqual(actual.getOverrideValue('b', 'a'), true);
        });
        test('Test normal property is registered after override identifier', async () => {
            const testObject = disposables.add(new configurations_1.DefaultConfiguration());
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            configurationRegistry.registerDefaultConfigurations([{
                    overrides: {
                        '[a]': {
                            'b': true
                        }
                    }
                }]);
            await testObject.initialize();
            configurationRegistry.registerConfiguration({
                'id': 'a',
                'order': 1,
                'title': 'a',
                'type': 'object',
                'properties': {
                    'b': {
                        'description': 'b',
                        'type': 'boolean',
                        'default': false,
                    }
                }
            });
            const { defaults: actual, properties } = await promise;
            assert.deepStrictEqual(actual.getValue('b'), false);
            assert.ok((0, objects_1.equals)(actual.getValue('[a]'), { 'b': true }));
            assert.ok((0, objects_1.equals)(actual.contents, { 'b': false, '[a]': { 'b': true } }));
            assert.ok((0, objects_1.equals)(actual.overrides, [{ contents: { 'b': true }, identifiers: ['a'], keys: ['b'] }]));
            assert.deepStrictEqual(actual.keys, ['[a]', 'b']);
            assert.strictEqual(actual.getOverrideValue('b', 'a'), true);
            assert.deepStrictEqual(properties, ['b']);
        });
        test('Test override identifier is registered after property', async () => {
            const testObject = disposables.add(new configurations_1.DefaultConfiguration());
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            configurationRegistry.registerConfiguration({
                'id': 'a',
                'order': 1,
                'title': 'a',
                'type': 'object',
                'properties': {
                    'b': {
                        'description': 'b',
                        'type': 'boolean',
                        'default': false,
                    }
                }
            });
            await testObject.initialize();
            configurationRegistry.registerDefaultConfigurations([{
                    overrides: {
                        '[a]': {
                            'b': true
                        }
                    }
                }]);
            const { defaults: actual, properties } = await promise;
            assert.deepStrictEqual(actual.getValue('b'), false);
            assert.ok((0, objects_1.equals)(actual.getValue('[a]'), { 'b': true }));
            assert.ok((0, objects_1.equals)(actual.contents, { 'b': false, '[a]': { 'b': true } }));
            assert.ok((0, objects_1.equals)(actual.overrides, [{ contents: { 'b': true }, identifiers: ['a'], keys: ['b'] }]));
            assert.deepStrictEqual(actual.keys, ['b', '[a]']);
            assert.strictEqual(actual.getOverrideValue('b', 'a'), true);
            assert.deepStrictEqual(properties, ['[a]']);
        });
        test('Test register override identifier and property after initialize', async () => {
            const testObject = disposables.add(new configurations_1.DefaultConfiguration());
            await testObject.initialize();
            configurationRegistry.registerConfiguration({
                'id': 'a',
                'order': 1,
                'title': 'a',
                'type': 'object',
                'properties': {
                    'b': {
                        'description': 'b',
                        'type': 'boolean',
                        'default': false,
                    }
                }
            });
            configurationRegistry.registerDefaultConfigurations([{
                    overrides: {
                        '[a]': {
                            'b': true
                        }
                    }
                }]);
            const actual = testObject.configurationModel;
            assert.deepStrictEqual(actual.getValue('b'), false);
            assert.ok((0, objects_1.equals)(actual.getValue('[a]'), { 'b': true }));
            assert.ok((0, objects_1.equals)(actual.contents, { 'b': false, '[a]': { 'b': true } }));
            assert.ok((0, objects_1.equals)(actual.overrides, [{ contents: { 'b': true }, identifiers: ['a'], keys: ['b'] }]));
            assert.deepStrictEqual(actual.keys, ['b', '[a]']);
            assert.strictEqual(actual.getOverrideValue('b', 'a'), true);
        });
        test('Test deregistering a property', async () => {
            const testObject = disposables.add(new configurations_1.DefaultConfiguration());
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            const node = {
                'id': 'a',
                'order': 1,
                'title': 'a',
                'type': 'object',
                'properties': {
                    'a': {
                        'description': 'a',
                        'type': 'boolean',
                        'default': false,
                    }
                }
            };
            configurationRegistry.registerConfiguration(node);
            await testObject.initialize();
            configurationRegistry.deregisterConfigurations([node]);
            const { defaults: actual, properties } = await promise;
            assert.strictEqual(actual.getValue('a'), undefined);
            assert.ok((0, objects_1.equals)(actual.contents, {}));
            assert.deepStrictEqual(actual.keys, []);
            assert.deepStrictEqual(properties, ['a']);
        });
        test('Test deregistering an override identifier', async () => {
            const testObject = disposables.add(new configurations_1.DefaultConfiguration());
            configurationRegistry.registerConfiguration({
                'id': 'a',
                'order': 1,
                'title': 'a',
                'type': 'object',
                'properties': {
                    'b': {
                        'description': 'b',
                        'type': 'boolean',
                        'default': false,
                    }
                }
            });
            const node = {
                overrides: {
                    '[a]': {
                        'b': true
                    }
                }
            };
            configurationRegistry.registerDefaultConfigurations([node]);
            await testObject.initialize();
            configurationRegistry.deregisterDefaultConfigurations([node]);
            assert.deepStrictEqual(testObject.configurationModel.getValue('[a]'), undefined);
            assert.ok((0, objects_1.equals)(testObject.configurationModel.contents, { 'b': false }));
            assert.ok((0, objects_1.equals)(testObject.configurationModel.overrides, []));
            assert.deepStrictEqual(testObject.configurationModel.keys, ['b']);
            assert.strictEqual(testObject.configurationModel.getOverrideValue('b', 'a'), undefined);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vY29uZmlndXJhdGlvbi90ZXN0L2NvbW1vbi9jb25maWd1cmF0aW9ucy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7UUFFbEMsTUFBTSxXQUFXLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBQzlELE1BQU0scUJBQXFCLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7UUFFNUYsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDckIsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFFeEIsU0FBUyxLQUFLO1lBQ2IscUJBQXFCLENBQUMsd0JBQXdCLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQzFGLE1BQU0sOEJBQThCLEdBQUcscUJBQXFCLENBQUMsaUNBQWlDLEVBQUUsQ0FBQztZQUNqRyxxQkFBcUIsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLEdBQUcsOEJBQThCLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsV0FBVyxFQUFFLDhCQUE4QixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSw4QkFBOEIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4UCxD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