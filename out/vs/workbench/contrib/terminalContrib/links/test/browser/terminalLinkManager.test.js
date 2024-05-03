/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/arrays", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextview/browser/contextMenuService", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/workbench/common/views", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkManager", "vs/workbench/contrib/terminal/test/browser/xterm/xtermTerminal.test", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkResolver", "vs/amdX", "vs/base/test/common/utils"], function (require, exports, assert_1, arrays_1, configuration_1, testConfigurationService_1, contextMenuService_1, contextView_1, instantiationServiceMock_1, log_1, storage_1, themeService_1, testThemeService_1, views_1, terminalLinkManager_1, xtermTerminal_test_1, workbenchTestServices_1, terminalLinkResolver_1, amdX_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const defaultTerminalConfig = {
        fontFamily: 'monospace',
        fontWeight: 'normal',
        fontWeightBold: 'normal',
        gpuAcceleration: 'off',
        scrollback: 1000,
        fastScrollSensitivity: 2,
        mouseWheelScrollSensitivity: 1,
        unicodeVersion: '11',
        wordSeparators: ' ()[]{}\',"`─‘’'
    };
    class TestLinkManager extends terminalLinkManager_1.TerminalLinkManager {
        async _getLinksForType(y, type) {
            switch (type) {
                case 'word':
                    return this._links?.wordLinks?.[y] ? [this._links?.wordLinks?.[y]] : undefined;
                case 'url':
                    return this._links?.webLinks?.[y] ? [this._links?.webLinks?.[y]] : undefined;
                case 'localFile':
                    return this._links?.fileLinks?.[y] ? [this._links?.fileLinks?.[y]] : undefined;
            }
        }
        setLinks(links) {
            this._links = links;
        }
    }
    suite('TerminalLinkManager', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        let configurationService;
        let themeService;
        let viewDescriptorService;
        let xterm;
        let linkManager;
        setup(async () => {
            configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fastScrollSensitivity: 2,
                    mouseWheelScrollSensitivity: 1
                },
                terminal: {
                    integrated: defaultTerminalConfig
                }
            });
            themeService = new testThemeService_1.TestThemeService();
            viewDescriptorService = new xtermTerminal_test_1.TestViewDescriptorService();
            instantiationService = store.add(new instantiationServiceMock_1.TestInstantiationService());
            instantiationService.stub(contextView_1.IContextMenuService, store.add(instantiationService.createInstance(contextMenuService_1.ContextMenuService)));
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            instantiationService.stub(storage_1.IStorageService, store.add(new workbenchTestServices_1.TestStorageService()));
            instantiationService.stub(themeService_1.IThemeService, themeService);
            instantiationService.stub(views_1.IViewDescriptorService, viewDescriptorService);
            const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
            xterm = store.add(new TerminalCtor({ allowProposedApi: true, cols: 80, rows: 30 }));
            linkManager = store.add(instantiationService.createInstance(TestLinkManager, xterm, upcastPartial({
                get initialCwd() {
                    return '';
                }
            }), {
                get(capability) {
                    return undefined;
                }
            }, instantiationService.createInstance(terminalLinkResolver_1.TerminalLinkResolver)));
        });
        suite('registerExternalLinkProvider', () => {
            test('should not leak disposables if the link manager is already disposed', () => {
                linkManager.externalProvideLinksCb = async () => undefined;
                linkManager.dispose();
                linkManager.externalProvideLinksCb = async () => undefined;
            });
        });
        suite('getLinks and open recent link', () => {
            test('should return no links', async () => {
                const links = await linkManager.getLinks();
                (0, arrays_1.equals)(links.viewport.webLinks, []);
                (0, arrays_1.equals)(links.viewport.wordLinks, []);
                (0, arrays_1.equals)(links.viewport.fileLinks, []);
                const webLink = await linkManager.openRecentLink('url');
                (0, assert_1.strictEqual)(webLink, undefined);
                const fileLink = await linkManager.openRecentLink('localFile');
                (0, assert_1.strictEqual)(fileLink, undefined);
            });
            test('should return word links in order', async () => {
                const link1 = {
                    range: {
                        start: { x: 1, y: 1 }, end: { x: 14, y: 1 }
                    },
                    text: '1_我是学生.txt',
                    activate: () => Promise.resolve('')
                };
                const link2 = {
                    range: {
                        start: { x: 1, y: 1 }, end: { x: 14, y: 1 }
                    },
                    text: '2_我是学生.txt',
                    activate: () => Promise.resolve('')
                };
                linkManager.setLinks({ wordLinks: [link1, link2] });
                const links = await linkManager.getLinks();
                (0, assert_1.deepStrictEqual)(links.viewport.wordLinks?.[0].text, link2.text);
                (0, assert_1.deepStrictEqual)(links.viewport.wordLinks?.[1].text, link1.text);
                const webLink = await linkManager.openRecentLink('url');
                (0, assert_1.strictEqual)(webLink, undefined);
                const fileLink = await linkManager.openRecentLink('localFile');
                (0, assert_1.strictEqual)(fileLink, undefined);
            });
            test('should return web links in order', async () => {
                const link1 = {
                    range: { start: { x: 5, y: 1 }, end: { x: 40, y: 1 } },
                    text: 'https://foo.bar/[this is foo site 1]',
                    activate: () => Promise.resolve('')
                };
                const link2 = {
                    range: { start: { x: 5, y: 2 }, end: { x: 40, y: 2 } },
                    text: 'https://foo.bar/[this is foo site 2]',
                    activate: () => Promise.resolve('')
                };
                linkManager.setLinks({ webLinks: [link1, link2] });
                const links = await linkManager.getLinks();
                (0, assert_1.deepStrictEqual)(links.viewport.webLinks?.[0].text, link2.text);
                (0, assert_1.deepStrictEqual)(links.viewport.webLinks?.[1].text, link1.text);
                const webLink = await linkManager.openRecentLink('url');
                (0, assert_1.strictEqual)(webLink, link2);
                const fileLink = await linkManager.openRecentLink('localFile');
                (0, assert_1.strictEqual)(fileLink, undefined);
            });
            test('should return file links in order', async () => {
                const link1 = {
                    range: { start: { x: 1, y: 1 }, end: { x: 32, y: 1 } },
                    text: 'file:///C:/users/test/file_1.txt',
                    activate: () => Promise.resolve('')
                };
                const link2 = {
                    range: { start: { x: 1, y: 2 }, end: { x: 32, y: 2 } },
                    text: 'file:///C:/users/test/file_2.txt',
                    activate: () => Promise.resolve('')
                };
                linkManager.setLinks({ fileLinks: [link1, link2] });
                const links = await linkManager.getLinks();
                (0, assert_1.deepStrictEqual)(links.viewport.fileLinks?.[0].text, link2.text);
                (0, assert_1.deepStrictEqual)(links.viewport.fileLinks?.[1].text, link1.text);
                const webLink = await linkManager.openRecentLink('url');
                (0, assert_1.strictEqual)(webLink, undefined);
                linkManager.setLinks({ fileLinks: [link2] });
                const fileLink = await linkManager.openRecentLink('localFile');
                (0, assert_1.strictEqual)(fileLink, link2);
            });
        });
    });
    function upcastPartial(v) {
        return v;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rTWFuYWdlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvbGlua3MvdGVzdC9icm93c2VyL3Rlcm1pbmFsTGlua01hbmFnZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXlCaEcsTUFBTSxxQkFBcUIsR0FBb0M7UUFDOUQsVUFBVSxFQUFFLFdBQVc7UUFDdkIsVUFBVSxFQUFFLFFBQVE7UUFDcEIsY0FBYyxFQUFFLFFBQVE7UUFDeEIsZUFBZSxFQUFFLEtBQUs7UUFDdEIsVUFBVSxFQUFFLElBQUk7UUFDaEIscUJBQXFCLEVBQUUsQ0FBQztRQUN4QiwyQkFBMkIsRUFBRSxDQUFDO1FBQzlCLGNBQWMsRUFBRSxJQUFJO1FBQ3BCLGNBQWMsRUFBRSxpQkFBaUI7S0FDakMsQ0FBQztJQUVGLE1BQU0sZUFBZ0IsU0FBUSx5Q0FBbUI7UUFFN0IsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQVMsRUFBRSxJQUFrQztZQUN0RixRQUFRLElBQUksRUFBRSxDQUFDO2dCQUNkLEtBQUssTUFBTTtvQkFDVixPQUFPLElBQUksQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7Z0JBQ2hGLEtBQUssS0FBSztvQkFDVCxPQUFPLElBQUksQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxD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