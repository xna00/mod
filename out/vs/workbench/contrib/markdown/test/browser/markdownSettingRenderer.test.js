define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/configuration/common/configurationRegistry", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/registry/common/platform", "vs/workbench/contrib/markdown/browser/markdownSettingRenderer"], function (require, exports, assert, uri_1, utils_1, configurationRegistry_1, testConfigurationService_1, platform_1, markdownSettingRenderer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const configuration = {
        'id': 'examples',
        'title': 'Examples',
        'type': 'object',
        'properties': {
            'example.booleanSetting': {
                'type': 'boolean',
                'default': false,
                'scope': 1 /* ConfigurationScope.APPLICATION */
            },
            'example.booleanSetting2': {
                'type': 'boolean',
                'default': true,
                'scope': 1 /* ConfigurationScope.APPLICATION */
            },
            'example.stringSetting': {
                'type': 'string',
                'default': 'one',
                'scope': 1 /* ConfigurationScope.APPLICATION */
            },
            'example.numberSetting': {
                'type': 'number',
                'default': 3,
                'scope': 1 /* ConfigurationScope.APPLICATION */
            }
        }
    };
    class MarkdownConfigurationService extends testConfigurationService_1.TestConfigurationService {
        async updateValue(key, value) {
            const [section, setting] = key.split('.');
            return this.setUserConfiguration(section, { [setting]: value });
        }
    }
    suite('Markdown Setting Renderer Test', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let configurationService;
        let preferencesService;
        let contextMenuService;
        let settingRenderer;
        suiteSetup(() => {
            configurationService = new MarkdownConfigurationService();
            preferencesService = {};
            contextMenuService = {};
            platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration(configuration);
            settingRenderer = new markdownSettingRenderer_1.SimpleSettingRenderer(configurationService, contextMenuService, preferencesService, { publicLog2: () => { } }, { writeText: async () => { } });
        });
        suiteTeardown(() => {
            platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).deregisterConfigurations([configuration]);
        });
        test('render code setting button with value', () => {
            const htmlRenderer = settingRenderer.getHtmlRenderer();
            const htmlNoValue = '<code codesetting="example.booleanSetting">';
            const renderedHtmlNoValue = htmlRenderer(htmlNoValue);
            assert.strictEqual(renderedHtmlNoValue, `<code tabindex="0"><a href="code-setting://example.booleanSetting" class="codesetting" title="View or change setting" aria-role="button"><svg width="14" height="14" viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M9.1 4.4L8.6 2H7.4l-.5 2.4-.7.3-2-1.3-.9.8 1.3 2-.2.7-2.4.5v1.2l2.4.5.3.8-1.3 2 .8.8 2-1.3.8.3.4 2.3h1.2l.5-2.4.8-.3 2 1.3.8-.8-1.3-2 .3-.8 2.3-.4V7.4l-2.4-.5-.3-.8 1.3-2-.8-.8-2 1.3-.7-.2zM9.4 1l.5 2.4L12 2.1l2 2-1.4 2.1 2.4.4v2.8l-2.4.5L14 12l-2 2-2.1-1.4-.5 2.4H6.6l-.5-2.4L4 13.9l-2-2 1.4-2.1L1 9.4V6.6l2.4-.5L2.1 4l2-2 2.1 1.4.4-2.4h2.8zm.6 7c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM8 9c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1z"/></svg>
			<span class="separator"></span>
			<span class="setting-name">example.booleanSetting</span>
		</a></code><code>`);
        });
        test('actions with no value', () => {
            const uri = uri_1.URI.parse(settingRenderer.settingToUriString('example.booleanSetting'));
            const actions = settingRenderer.getActions(uri);
            assert.strictEqual(actions?.length, 2);
            assert.strictEqual(actions[0].label, 'View "Example: Boolean Setting" in Settings');
        });
        test('actions with value + updating and restoring', async () => {
            await configurationService.setUserConfiguration('example', { stringSetting: 'two' });
            const uri = uri_1.URI.parse(settingRenderer.settingToUriString('example.stringSetting', 'three'));
            const verifyOriginalState = (actions) => {
                assert.strictEqual(actions?.length, 3);
                assert.strictEqual(actions[0].label, 'Set "Example: String Setting" to "three"');
                assert.strictEqual(actions[1].label, 'View in Settings');
                assert.strictEqual(configurationService.getValue('example.stringSetting'), 'two');
                return true;
            };
            const actions = settingRenderer.getActions(uri);
            if (verifyOriginalState(actions)) {
                // Update the value
                await actions[0].run();
                assert.strictEqual(configurationService.getValue('example.stringSetting'), 'three');
                const actionsUpdated = settingRenderer.getActions(uri);
                assert.strictEqual(actionsUpdated?.length, 3);
                assert.strictEqual(actionsUpdated[0].label, 'Restore value of "Example: String Setting"');
                assert.strictEqual(actions[1].label, 'View in Settings');
                assert.strictEqual(actions[2].label, 'Copy Setting ID');
                assert.strictEqual(configurationService.getValue('example.stringSetting'), 'three');
                // Restore the value
                await actionsUpdated[0].run();
                verifyOriginalState(settingRenderer.getActions(uri));
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd25TZXR0aW5nUmVuZGVyZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWFya2Rvd24vdGVzdC9icm93c2VyL21hcmtkb3duU2V0dGluZ1JlbmRlcmVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBZUEsTUFBTSxhQUFhLEdBQXVCO1FBQ3pDLElBQUksRUFBRSxVQUFVO1FBQ2hCLE9BQU8sRUFBRSxVQUFVO1FBQ25CLE1BQU0sRUFBRSxRQUFRO1FBQ2hCLFlBQVksRUFBRTtZQUNiLHdCQUF3QixFQUFFO2dCQUN6QixNQUFNLEVBQUUsU0FBUztnQkFDakIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLE9BQU8sd0NBQWdDO2FBQ3ZDO1lBQ0QseUJBQXlCLEVBQUU7Z0JBQzFCLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixTQUFTLEVBQUUsSUFBSTtnQkFDZixPQUFPLHdDQUFnQzthQUN2QztZQUNELHVCQUF1QixFQUFFO2dCQUN4QixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLE9BQU8sd0NBQWdDO2FBQ3ZDO1lBQ0QsdUJBQXVCLEVBQUU7Z0JBQ3hCLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixTQUFTLEVBQUUsQ0FBQztnQkFDWixPQUFPLHdDQUFnQzthQUN2QztTQUNEO0tBQ0QsQ0FBQztJQUVGLE1BQU0sNEJBQTZCLFNBQVEsbURBQXdCO1FBQ3pELEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBVyxFQUFFLEtBQVU7WUFDakQsTUFBTSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFDLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsT0FB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