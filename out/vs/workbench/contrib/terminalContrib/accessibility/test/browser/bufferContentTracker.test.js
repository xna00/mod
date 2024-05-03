/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/amdX", "vs/base/common/platform", "vs/base/test/common/utils", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextMenuService", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/layout/browser/layoutService", "vs/platform/log/common/log", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/platform/terminal/common/terminal", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/workbench/contrib/terminal/browser/terminalConfigHelper", "vs/workbench/contrib/terminal/browser/terminalTestHelpers", "vs/workbench/contrib/terminal/browser/xterm/xtermTerminal", "vs/workbench/contrib/terminalContrib/accessibility/browser/bufferContentTracker", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices", "vs/platform/accessibilitySignal/browser/accessibilitySignalService"], function (require, exports, assert, amdX_1, platform_1, utils_1, configuration_1, testConfigurationService_1, contextkey_1, contextMenuService_1, contextView_1, instantiationServiceMock_1, mockKeybindingService_1, layoutService_1, log_1, terminalCapabilityStore_1, terminal_1, themeService_1, testThemeService_1, terminalConfigHelper_1, terminalTestHelpers_1, xtermTerminal_1, bufferContentTracker_1, lifecycle_1, workbenchTestServices_1, workbenchTestServices_2, accessibilitySignalService_1) {
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
        unicodeVersion: '6'
    };
    suite('Buffer Content Tracker', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        let configurationService;
        let themeService;
        let xterm;
        let capabilities;
        let configHelper;
        let bufferTracker;
        const prompt = 'vscode-git:(prompt/more-tests)';
        const promptPlusData = 'vscode-git:(prompt/more-tests) ' + 'some data';
        setup(async () => {
            configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: defaultTerminalConfig } });
            instantiationService = store.add(new instantiationServiceMock_1.TestInstantiationService());
            themeService = new testThemeService_1.TestThemeService();
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(themeService_1.IThemeService, themeService);
            instantiationService.stub(terminal_1.ITerminalLogService, new log_1.NullLogService());
            instantiationService.stub(log_1.ILoggerService, store.add(new workbenchTestServices_2.TestLoggerService()));
            instantiationService.stub(contextView_1.IContextMenuService, store.add(instantiationService.createInstance(contextMenuService_1.ContextMenuService)));
            instantiationService.stub(lifecycle_1.ILifecycleService, store.add(new workbenchTestServices_1.TestLifecycleService()));
            instantiationService.stub(contextkey_1.IContextKeyService, store.add(new mockKeybindingService_1.MockContextKeyService()));
            instantiationService.stub(accessibilitySignalService_1.IAccessibilitySignalService, {
                playSignal: async () => { },
                isSoundEnabled(signal) { return false; },
            });
            instantiationService.stub(layoutService_1.ILayoutService, new workbenchTestServices_1.TestLayoutService());
            configHelper = store.add(instantiationService.createInstance(terminalConfigHelper_1.TerminalConfigHelper));
            capabilities = store.add(new terminalCapabilityStore_1.TerminalCapabilityStore());
            if (!platform_1.isWindows) {
                capabilities.add(1 /* TerminalCapability.NaiveCwdDetection */, null);
            }
            const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
            xterm = store.add(instantiationService.createInstance(xtermTerminal_1.XtermTerminal, TerminalCtor, configHelper, 80, 30, { getBackgroundColor: () => undefined }, capabilities, '', true));
            const container = document.createElement('div');
            xterm.raw.open(container);
            configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: { tabs: { separator: ' - ', title: '${cwd}', description: '${cwd}' } } } });
            bufferTracker = store.add(instantiationService.createInstance(bufferContentTracker_1.BufferContentTracker, xterm));
        });
        test('should not clear the prompt line', async () => {
            assert.strictEqual(bufferTracker.lines.length, 0);
            await (0, terminalTestHelpers_1.writeP)(xterm.raw, prompt);
            xterm.clearBuffer();
            bufferTracker.update();
            assert.deepStrictEqual(bufferTracker.lines, [prompt]);
        });
        test('repeated updates should not change the content', async () => {
            assert.strictEqual(bufferTracker.lines.length, 0);
            await (0, terminalTestHelpers_1.writeP)(xterm.raw, prompt);
            bufferTracker.update();
            assert.deepStrictEqual(bufferTracker.lines, [prompt]);
            bufferTracker.update();
            assert.deepStrictEqual(bufferTracker.lines, [prompt]);
            bufferTracker.update();
            assert.deepStrictEqual(bufferTracker.lines, [prompt]);
        });
        test('should add lines in the viewport and scrollback', async () => {
            await writeAndAssertBufferState(promptPlusData, 38, xterm.raw, bufferTracker);
        });
        test('should add lines in the viewport and full scrollback', async () => {
            await writeAndAssertBufferState(promptPlusData, 1030, xterm.raw, bufferTracker);
        });
        test('should refresh viewport', async () => {
            await writeAndAssertBufferState(promptPlusData, 6, xterm.raw, bufferTracker);
            await (0, terminalTestHelpers_1.writeP)(xterm.raw, '\x1b[3Ainserteddata');
            bufferTracker.update();
            assert.deepStrictEqual(bufferTracker.lines, [promptPlusData, promptPlusData, `${promptPlusData}inserteddata`, promptPlusData, promptPlusData, promptPlusData]);
        });
        test('should refresh viewport with full scrollback', async () => {
            const content = `${prompt}\r\n`.repeat(1030).trimEnd();
            await (0, terminalTestHelpers_1.writeP)(xterm.raw, content);
            bufferTracker.update();
            await (0, terminalTestHelpers_1.writeP)(xterm.raw, '\x1b[4Ainsertion');
            bufferTracker.update();
            const expected = content.split('\r\n');
            expected[1025] = `${prompt}insertion`;
            assert.deepStrictEqual(bufferTracker.lines[1025], `${prompt}insertion`);
        });
        test('should cap the size of the cached lines, removing old lines in favor of new lines', async () => {
            const content = `${prompt}\r\n`.repeat(1036).trimEnd();
            await (0, terminalTestHelpers_1.writeP)(xterm.raw, content);
            bufferTracker.update();
            const expected = content.split('\r\n');
            // delete the 6 lines that should be trimmed
            for (let i = 0; i < 6; i++) {
                expected.pop();
            }
            // insert a new character
            await (0, terminalTestHelpers_1.writeP)(xterm.raw, '\x1b[2Ainsertion');
            bufferTracker.update();
            expected[1027] = `${prompt}insertion`;
            assert.strictEqual(bufferTracker.lines.length, expected.length);
            assert.deepStrictEqual(bufferTracker.lines, expected);
        });
    });
    async function writeAndAssertBufferState(data, rows, terminal, bufferTracker) {
        const content = `${data}\r\n`.repeat(rows).trimEnd();
        await (0, terminalTestHelpers_1.writeP)(terminal, content);
        bufferTracker.update();
        assert.strictEqual(bufferTracker.lines.length, rows);
        assert.deepStrictEqual(bufferTracker.lines, content.split('\r\n'));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyQ29udGVudFRyYWNrZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2FjY2Vzc2liaWxpdHkvdGVzdC9icm93c2VyL2J1ZmZlckNvbnRlbnRUcmFja2VyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUErQmhHLE1BQU0scUJBQXFCLEdBQW9DO1FBQzlELFVBQVUsRUFBRSxXQUFXO1FBQ3ZCLFVBQVUsRUFBRSxRQUFRO1FBQ3BCLGNBQWMsRUFBRSxRQUFRO1FBQ3hCLGVBQWUsRUFBRSxLQUFLO1FBQ3RCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLHFCQUFxQixFQUFFLENBQUM7UUFDeEIsMkJBQTJCLEVBQUUsQ0FBQztRQUM5QixjQUFjLEVBQUUsR0FBRztLQUNuQixDQUFDO0lBRUYsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtRQUNwQyxNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFeEQsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLG9CQUE4QyxDQUFDO1FBQ25ELElBQUksWUFBOEIsQ0FBQztRQUNuQyxJQUFJLEtBQW9CLENBQUM7UUFDekIsSUFBSSxZQUFxQyxDQUFDO1FBQzFDLElBQUksWUFBa0MsQ0FBQztRQUN2QyxJQUFJLGFBQW1DLENBQUM7UUFDeEMsTUFBTSxNQUFNLEdBQUcsZ0NBQWdDLENBQUM7UUFDaEQsTUFBTSxjQUFjLEdBQUcsaUNBQWlDLEdBQUcsV0FBVyxDQUFDO1FBRXZFLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNoQixvQkFBb0IsR0FBRyxJQUFJLG1EQUF3QixDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsVUFBVSxFQUFFLHFCQUFxQixFQUFFLEVB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