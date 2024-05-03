define(["require", "exports", "assert", "vs/platform/registry/common/platform", "vs/workbench/services/configuration/common/configurationModels", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/map", "vs/platform/workspace/common/workspace", "vs/base/common/uri", "vs/platform/workspace/test/common/testWorkspace", "vs/base/test/common/utils"], function (require, exports, assert, platform_1, configurationModels_1, configurationModels_2, configurationRegistry_1, map_1, workspace_1, uri_1, testWorkspace_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('FolderSettingsModelParser', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suiteSetup(() => {
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': 'FolderSettingsModelParser_1',
                'type': 'object',
                'properties': {
                    'FolderSettingsModelParser.window': {
                        'type': 'string',
                        'default': 'isSet'
                    },
                    'FolderSettingsModelParser.resource': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 4 /* ConfigurationScope.RESOURCE */,
                    },
                    'FolderSettingsModelParser.resourceLanguage': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                    },
                    'FolderSettingsModelParser.application': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    },
                    'FolderSettingsModelParser.machine': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    }
                }
            });
        });
        test('parse all folder settings', () => {
            const testObject = new configurationModels_2.ConfigurationModelParser('settings');
            testObject.parse(JSON.stringify({ 'FolderSettingsModelParser.window': 'window', 'FolderSettingsModelParser.resource': 'resource', 'FolderSettingsModelParser.application': 'application', 'FolderSettingsModelParser.machine': 'executable' }), { scopes: [4 /* ConfigurationScope.RESOURCE */, 3 /* ConfigurationScope.WINDOW */] });
            const expected = Object.create(null);
            expected['FolderSettingsModelParser'] = Object.create(null);
            expected['FolderSettingsModelParser']['window'] = 'window';
            expected['FolderSettingsModelParser']['resource'] = 'resource';
            assert.deepStrictEqual(testObject.configurationModel.contents, expected);
        });
        test('parse resource folder settings', () => {
            const testObject = new configurationModels_2.ConfigurationModelParser('settings');
            testObject.parse(JSON.stringify({ 'FolderSettingsModelParser.window': 'window', 'FolderSettingsModelParser.resource': 'resource', 'FolderSettingsModelParser.application': 'application', 'FolderSettingsModelParser.machine': 'executable' }), { scopes: [4 /* ConfigurationScope.RESOURCE */] });
            const expected = Object.create(null);
            expected['FolderSettingsModelParser'] = Object.create(null);
            expected['FolderSettingsModelParser']['resource'] = 'resource';
            assert.deepStrictEqual(testObject.configurationModel.contents, expected);
        });
        test('parse resource and resource language settings', () => {
            const testObject = new configurationModels_2.ConfigurationModelParser('settings');
            testObject.parse(JSON.stringify({ '[json]': { 'FolderSettingsModelParser.window': 'window', 'FolderSettingsModelParser.resource': 'resource', 'FolderSettingsModelParser.resourceLanguage': 'resourceLanguage', 'FolderSettingsModelParser.application': 'application', 'FolderSettingsModelParser.machine': 'executable' } }), { scopes: [4 /* ConfigurationScope.RESOURCE */, 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */] });
            const expected = Object.create(null);
            expected['FolderSettingsModelParser'] = Object.create(null);
            expected['FolderSettingsModelParser']['resource'] = 'resource';
            expected['FolderSettingsModelParser']['resourceLanguage'] = 'resourceLanguage';
            assert.deepStrictEqual(testObject.configurationModel.overrides, [{ 'contents': expected, 'identifiers': ['json'], 'keys': ['FolderSettingsModelParser.resource', 'FolderSettingsModelParser.resourceLanguage'] }]);
        });
        test('reparse folder settings excludes application and machine setting', () => {
            const parseOptions = { scopes: [4 /* ConfigurationScope.RESOURCE */, 3 /* ConfigurationScope.WINDOW */] };
            const testObject = new configurationModels_2.ConfigurationModelParser('settings');
            testObject.parse(JSON.stringify({ 'FolderSettingsModelParser.resource': 'resource', 'FolderSettingsModelParser.anotherApplicationSetting': 'executable' }), parseOptions);
            let expected = Object.create(null);
            expected['FolderSettingsModelParser'] = Object.create(null);
            expected['FolderSettingsModelParser']['resource'] = 'resource';
            expected['FolderSettingsModelParser']['anotherApplicationSetting'] = 'executable';
            assert.deepStrictEqual(testObject.configurationModel.contents, expected);
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': 'FolderSettingsModelParser_2',
                'type': 'object',
                'properties': {
                    'FolderSettingsModelParser.anotherApplicationSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    },
                    'FolderSettingsModelParser.anotherMachineSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    }
                }
            });
            testObject.reparse(parseOptions);
            expected = Object.create(null);
            expected['FolderSettingsModelParser'] = Object.create(null);
            expected['FolderSettingsModelParser']['resource'] = 'resource';
            assert.deepStrictEqual(testObject.configurationModel.contents, expected);
        });
    });
    suite('StandaloneConfigurationModelParser', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('parse tasks stand alone configuration model', () => {
            const testObject = new configurationModels_1.StandaloneConfigurationModelParser('tasks', 'tasks');
            testObject.parse(JSON.stringify({ 'version': '1.1.1', 'tasks': [] }));
            const expected = Object.create(null);
            expected['tasks'] = Object.create(null);
            expected['tasks']['version'] = '1.1.1';
            expected['tasks']['tasks'] = [];
            assert.deepStrictEqual(testObject.configurationModel.contents, expected);
        });
    });
    suite('Workspace Configuration', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const defaultConfigurationModel = toConfigurationModel({
            'editor.lineNumbers': 'on',
            'editor.fontSize': 12,
            'window.zoomLevel': 1,
            '[markdown]': {
                'editor.wordWrap': 'off'
            },
            'window.title': 'custom',
            'workbench.enableTabs': false,
            'editor.insertSpaces': true
        });
        test('Test compare same configurations', () => {
            const workspace = new testWorkspace_1.Workspace('a', [new workspace_1.WorkspaceFolder({ index: 0, name: 'a', uri: uri_1.URI.file('folder1') }), new workspace_1.WorkspaceFolder({ index: 1, name: 'b', uri: uri_1.URI.file('folder2') }), new workspace_1.WorkspaceFolder({ index: 2, name: 'c', uri: uri_1.URI.file('folder3') })]);
            const configuration1 = new configurationModels_1.Configuration(new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new map_1.ResourceMap(), new configurationModels_2.ConfigurationModel(), new map_1.ResourceMap(), workspace);
            configuration1.updateDefaultConfiguration(defaultConfigurationModel);
            configuration1.updateLocalUserConfiguration(toConfigurationModel({ 'window.title': 'native', '[typescript]': { 'editor.insertSpaces': false } }));
            configuration1.updateWorkspaceConfiguration(toConfigurationModel({ 'editor.lineNumbers': 'on' }));
            configuration1.updateFolderConfiguration(uri_1.URI.file('folder1'), toConfigurationModel({ 'editor.fontSize': 14 }));
            configuration1.updateFolderConfiguration(uri_1.URI.file('folder2'), toConfigurationModel({ 'editor.wordWrap': 'on' }));
            const configuration2 = new configurationModels_1.Configuration(new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new map_1.ResourceMap(), new configurationModels_2.ConfigurationModel(), new map_1.ResourceMap(), workspace);
            configuration2.updateDefaultConfiguration(defaultConfigurationModel);
            configuration2.updateLocalUserConfiguration(toConfigurationModel({ 'window.title': 'native', '[typescript]': { 'editor.insertSpaces': false } }));
            configuration2.updateWorkspaceConfiguration(toConfigurationModel({ 'editor.lineNumbers': 'on' }));
            configuration2.updateFolderConfiguration(uri_1.URI.file('folder1'), toConfigurationModel({ 'editor.fontSize': 14 }));
            configuration2.updateFolderConfiguration(uri_1.URI.file('folder2'), toConfigurationModel({ 'editor.wordWrap': 'on' }));
            const actual = configuration2.compare(configuration1);
            assert.deepStrictEqual(actual, { keys: [], overrides: [] });
        });
        test('Test compare different configurations', () => {
            const workspace = new testWorkspace_1.Workspace('a', [new workspace_1.WorkspaceFolder({ index: 0, name: 'a', uri: uri_1.URI.file('folder1') }), new workspace_1.WorkspaceFolder({ index: 1, name: 'b', uri: uri_1.URI.file('folder2') }), new workspace_1.WorkspaceFolder({ index: 2, name: 'c', uri: uri_1.URI.file('folder3') })]);
            const configuration1 = new configurationModels_1.Configuration(new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new map_1.ResourceMap(), new configurationModels_2.ConfigurationModel(), new map_1.ResourceMap(), workspace);
            configuration1.updateDefaultConfiguration(defaultConfigurationModel);
            configuration1.updateLocalUserConfiguration(toConfigurationModel({ 'window.title': 'native', '[typescript]': { 'editor.insertSpaces': false } }));
            configuration1.updateWorkspaceConfiguration(toConfigurationModel({ 'editor.lineNumbers': 'on' }));
            configuration1.updateFolderConfiguration(uri_1.URI.file('folder1'), toConfigurationModel({ 'editor.fontSize': 14 }));
            configuration1.updateFolderConfiguration(uri_1.URI.file('folder2'), toConfigurationModel({ 'editor.wordWrap': 'on' }));
            const configuration2 = new configurationModels_1.Configuration(new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new map_1.ResourceMap(), new configurationModels_2.ConfigurationModel(), new map_1.ResourceMap(), workspace);
            configuration2.updateDefaultConfiguration(defaultConfigurationModel);
            configuration2.updateLocalUserConfiguration(toConfigurationModel({ 'workbench.enableTabs': true, '[typescript]': { 'editor.insertSpaces': true } }));
            configuration2.updateWorkspaceConfiguration(toConfigurationModel({ 'editor.fontSize': 11 }));
            configuration2.updateFolderConfiguration(uri_1.URI.file('folder1'), toConfigurationModel({ 'editor.insertSpaces': true }));
            configuration2.updateFolderConfiguration(uri_1.URI.file('folder2'), toConfigurationModel({
                '[markdown]': {
                    'editor.wordWrap': 'on',
                    'editor.lineNumbers': 'relative'
                },
            }));
            const actual = configuration2.compare(configuration1);
            assert.deepStrictEqual(actual, { keys: ['editor.wordWrap', 'editor.fontSize', '[markdown]', 'window.title', 'workbench.enableTabs', '[typescript]'], overrides: [['markdown', ['editor.lineNumbers', 'editor.wordWrap']], ['typescript', ['editor.insertSpaces']]] });
        });
    });
    function toConfigurationModel(obj) {
        const parser = new configurationModels_2.ConfigurationModelParser('test');
        parser.parse(JSON.stringify(obj));
        return parser.configurationModel;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbk1vZGVscy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvY29uZmlndXJhdGlvbi90ZXN0L2NvbW1vbi9jb25maWd1cmF0aW9uTW9kZWxzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBZUEsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtRQUV2QyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsVUFBVSxDQUFDLEdBQUcsRUFBRTtZQUNmLE1BQU0scUJBQXFCLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUF1QixDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3pHLHFCQUFxQixDQUFDLHFCQUFxQixDQUFDO2dCQUMzQyxJQUFJLEVBQUUsNkJBQTZCO2dCQUNuQyxNQUFNLEVBQUUsUUFBUTtnQkFDaEIsWUFBWSxFQUFFO29CQUNiLGtDQUFrQyxFQUFFO3dCQUNuQyxNQUFNLEVBQUUsUUFBUTt3QkFDaEIsU0FBUyxFQUFFLE9BQU87cUJBQ2xCO29CQUNELG9DQUFvQyxFQUFFO3dCQUNyQyxNQUFNLEVBQUUsUUFBUTt3QkFDaEIsU0FBUyxFQUFFLE9BQU87d0JBQ2xCLEtBQUsscUNBQTZCO3FCQUNsQztvQkFDRCw0Q0FBNEMsRUFBRTt3QkFDN0MsTUFBTSxFQUFFLFFBQVE7d0JBQ2hCLFNBQVMsRUFBRSxPQUFPO3dCQUNsQixLQUFLLGlEQUF5QztxQkFDOUM7b0JBQ0QsdUNBQXVDLEVBQUU7d0JBQ3hDLE1BQU0sRUFBRSxRQUFRO3dCQUNoQixTQUFTLEVBQUUsT0FBTzt3QkFDbEIsS0FBSyx3Q0FBZ0M7cUJBQ3JDO29CQUNELG1DQUFtQyxFQUFFO3dCQUNwQyxNQUFNLEVBQUUsUUFBUTt3QkFDaEIsU0FBUyxFQUFFLE9BQU87d0JBQ2xCLEtBQUss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