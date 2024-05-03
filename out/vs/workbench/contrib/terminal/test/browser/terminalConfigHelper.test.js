/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/terminal/browser/terminalConfigHelper", "vs/editor/common/config/editorOptions", "vs/platform/configuration/test/common/testConfigurationService", "vs/base/test/common/utils", "vs/base/common/lifecycle", "vs/base/browser/window", "vs/base/browser/dom"], function (require, exports, assert, terminalConfigHelper_1, editorOptions_1, testConfigurationService_1, utils_1, lifecycle_1, window_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestTerminalConfigHelper extends terminalConfigHelper_1.TerminalConfigHelper {
        set linuxDistro(distro) {
            this._linuxDistro = distro;
        }
    }
    suite('Workbench - TerminalConfigHelper', function () {
        let store;
        let fixture;
        // This suite has retries setup because the font-related tests flake only on GitHub actions, not
        // ADO. It seems Electron hangs for some reason only on GH actions, so the two options are to
        // retry or remove the test outright (which would drop coverage).
        this.retries(3);
        setup(() => {
            store = new lifecycle_1.DisposableStore();
            fixture = window_1.mainWindow.document.body;
        });
        teardown(() => store.dispose());
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('TerminalConfigHelper - getFont fontFamily', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: { fontFamily: 'foo' },
                terminal: { integrated: { fontFamily: 'bar' } }
            });
            const configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.getFont((0, dom_1.getActiveWindow)()).fontFamily, 'bar, monospace', 'terminal.integrated.fontFamily should be selected over editor.fontFamily');
        });
        test('TerminalConfigHelper - getFont fontFamily (Linux Fedora)', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: { fontFamily: 'foo' },
                terminal: { integrated: { fontFamily: null } }
            });
            const configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.linuxDistro = 2 /* LinuxDistro.Fedora */;
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.getFont((0, dom_1.getActiveWindow)()).fontFamily, '\'DejaVu Sans Mono\', monospace', 'Fedora should have its font overridden when terminal.integrated.fontFamily not set');
        });
        test('TerminalConfigHelper - getFont fontFamily (Linux Ubuntu)', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: { fontFamily: 'foo' },
                terminal: { integrated: { fontFamily: null } }
            });
            const configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.linuxDistro = 3 /* LinuxDistro.Ubuntu */;
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.getFont((0, dom_1.getActiveWindow)()).fontFamily, '\'Ubuntu Mono\', monospace', 'Ubuntu should have its font overridden when terminal.integrated.fontFamily not set');
        });
        test('TerminalConfigHelper - getFont fontFamily (Linux Unknown)', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: { fontFamily: 'foo' },
                terminal: { integrated: { fontFamily: null } }
            });
            const configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.getFont((0, dom_1.getActiveWindow)()).fontFamily, 'foo, monospace', 'editor.fontFamily should be the fallback when terminal.integrated.fontFamily not set');
        });
        test('TerminalConfigHelper - getFont fontSize 10', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fontFamily: 'foo',
                    fontSize: 9
                },
                terminal: {
                    integrated: {
                        fontFamily: 'bar',
                        fontSize: 10
                    }
                }
            });
            const configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.getFont((0, dom_1.getActiveWindow)()).fontSize, 10, 'terminal.integrated.fontSize should be selected over editor.fontSize');
        });
        test('TerminalConfigHelper - getFont fontSize 0', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fontFamily: 'foo'
                },
                terminal: {
                    integrated: {
                        fontFamily: null,
                        fontSize: 0
                    }
                }
            });
            let configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.linuxDistro = 3 /* LinuxDistro.Ubuntu */;
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.getFont((0, dom_1.getActiveWindow)()).fontSize, 8, 'The minimum terminal font size (with adjustment) should be used when terminal.integrated.fontSize less than it');
            configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.getFont((0, dom_1.getActiveWindow)()).fontSize, 6, 'The minimum terminal font size should be used when terminal.integrated.fontSize less than it');
        });
        test('TerminalConfigHelper - getFont fontSize 1500', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fontFamily: 'foo'
                },
                terminal: {
                    integrated: {
                        fontFamily: 0,
                        fontSize: 1500
                    }
                }
            });
            const configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.getFont((0, dom_1.getActiveWindow)()).fontSize, 100, 'The maximum terminal font size should be used when terminal.integrated.fontSize more than it');
        });
        test('TerminalConfigHelper - getFont fontSize null', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fontFamily: 'foo'
                },
                terminal: {
                    integrated: {
                        fontFamily: 0,
                        fontSize: null
                    }
                }
            });
            let configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.linuxDistro = 3 /* LinuxDistro.Ubuntu */;
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.getFont((0, dom_1.getActiveWindow)()).fontSize, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize + 2, 'The default editor font size (with adjustment) should be used when terminal.integrated.fontSize is not set');
            configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.getFont((0, dom_1.getActiveWindow)()).fontSize, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize, 'The default editor font size should be used when terminal.integrated.fontSize is not set');
        });
        test('TerminalConfigHelper - getFont lineHeight 2', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fontFamily: 'foo',
                    lineHeight: 1
                },
                terminal: {
                    integrated: {
                        fontFamily: 0,
                        lineHeight: 2
                    }
                }
            });
            const configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.getFont((0, dom_1.getActiveWindow)()).lineHeight, 2, 'terminal.integrated.lineHeight should be selected over editor.lineHeight');
        });
        test('TerminalConfigHelper - getFont lineHeight 0', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fontFamily: 'foo',
                    lineHeight: 1
                },
                terminal: {
                    integrated: {
                        fontFamily: 0,
                        lineHeight: 0
                    }
                }
            });
            const configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.getFont((0, dom_1.getActiveWindow)()).lineHeight, 1, 'editor.lineHeight should be 1 when terminal.integrated.lineHeight not set');
        });
        test('TerminalConfigHelper - isMonospace monospace', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                terminal: {
                    integrated: {
                        fontFamily: 'monospace'
                    }
                }
            });
            const configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.configFontIsMonospace(), true, 'monospace is monospaced');
        });
        test('TerminalConfigHelper - isMonospace sans-serif', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                terminal: {
                    integrated: {
                        fontFamily: 'sans-serif'
                    }
                }
            });
            const configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.configFontIsMonospace(), false, 'sans-serif is not monospaced');
        });
        test('TerminalConfigHelper - isMonospace serif', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                terminal: {
                    integrated: {
                        fontFamily: 'serif'
                    }
                }
            });
            const configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.configFontIsMonospace(), false, 'serif is not monospaced');
        });
        test('TerminalConfigHelper - isMonospace monospace falls back to editor.fontFamily', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fontFamily: 'monospace'
                },
                terminal: {
                    integrated: {
                        fontFamily: null
                    }
                }
            });
            const configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.configFontIsMonospace(), true, 'monospace is monospaced');
        });
        test('TerminalConfigHelper - isMonospace sans-serif falls back to editor.fontFamily', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fontFamily: 'sans-serif'
                },
                terminal: {
                    integrated: {
                        fontFamily: null
                    }
                }
            });
            const configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.configFontIsMonospace(), false, 'sans-serif is not monospaced');
        });
        test('TerminalConfigHelper - isMonospace serif falls back to editor.fontFamily', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fontFamily: 'serif'
                },
                terminal: {
                    integrated: {
                        fontFamily: null
                    }
                }
            });
            const configHelper = store.add(new TestTerminalConfigHelper(configurationService, null, null, null, null));
            configHelper.panelContainer = fixture;
            assert.strictEqual(configHelper.configFontIsMonospace(), false, 'serif is not monospaced');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDb25maWdIZWxwZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvdGVzdC9icm93c2VyL3Rlcm1pbmFsQ29uZmlnSGVscGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsTUFBTSx3QkFBeUIsU0FBUSwyQ0FBb0I7UUFDMUQsSUFBSSxXQUFXLENBQUMsTUFBbUI7WUFDbEMsSUFBSSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUM7UUFDNUIsQ0FBQztLQUNEO0lBRUQsS0FBSyxDQUFDLGtDQUFrQyxFQUFFO1FBQ3pDLElBQUksS0FBc0IsQ0FBQztRQUMzQixJQUFJLE9BQW9CLENBQUM7UUFFekIsZ0dBQWdHO1FBQ2hHLDZGQUE2RjtRQUM3RixpRUFBaUU7UUFDakUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVoQixLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsS0FBSyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzlCLE9BQU8sR0FBRyxtQkFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDcEMsQ0FBQyxDQUFDLENBQUM7UUFDSCxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFFaEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQywyQ0FBMkMsRUFBRSxHQUFHLEVBQUU7WUFDdEQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLG1EQUF3QixDQUFDO2dCQUN6RCxNQUFNLEVBQUUsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFO2dCQUM3QixRQUFRLEVBQUUsRUFBRSxVQUFVLEVBQUUsRUFBRSxVQUFVLEVBQUUsS0FBSyxF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