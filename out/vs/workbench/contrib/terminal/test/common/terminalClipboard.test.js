/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/dialogs/common/dialogs", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/terminal/common/terminalClipboard"], function (require, exports, assert_1, utils_1, configuration_1, testConfigurationService_1, dialogs_1, testDialogService_1, instantiationServiceMock_1, terminalClipboard_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TerminalClipboard', function () {
        suite('shouldPasteTerminalText', () => {
            let instantiationService;
            let configurationService;
            let dialogService;
            setup(async () => {
                instantiationService = new instantiationServiceMock_1.TestInstantiationService();
                configurationService = new testConfigurationService_1.TestConfigurationService({
                    ["terminal.integrated.enableMultiLinePasteWarning" /* TerminalSettingId.EnableMultiLinePasteWarning */]: 'auto'
                });
                dialogService = new testDialogService_1.TestDialogService(undefined, { result: { confirmed: false } });
                instantiationService.stub(configuration_1.IConfigurationService, configurationService);
                instantiationService.stub(dialogs_1.IDialogService, dialogService);
            });
            (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
            function setConfigValue(value) {
                configurationService = new testConfigurationService_1.TestConfigurationService({
                    ["terminal.integrated.enableMultiLinePasteWarning" /* TerminalSettingId.EnableMultiLinePasteWarning */]: value
                });
                instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            }
            test('Single line string', async () => {
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo', undefined), true);
                setConfigValue('always');
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo', undefined), true);
                setConfigValue('never');
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo', undefined), true);
            });
            test('Single line string with trailing new line', async () => {
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\n', undefined), true);
                setConfigValue('always');
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\n', undefined), false);
                setConfigValue('never');
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\n', undefined), true);
            });
            test('Multi-line string', async () => {
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', undefined), false);
                setConfigValue('always');
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', undefined), false);
                setConfigValue('never');
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', undefined), true);
            });
            test('Bracketed paste mode', async () => {
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', true), true);
                setConfigValue('always');
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', true), false);
                setConfigValue('never');
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', true), true);
            });
            test('Legacy config', async () => {
                setConfigValue(true); // 'auto'
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', undefined), false);
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', true), true);
                setConfigValue(false); // 'never'
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', true), true);
            });
            test('Invalid config', async () => {
                setConfigValue(123);
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', undefined), false);
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', true), true);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDbGlwYm9hcmQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvdGVzdC9jb21tb24vdGVybWluYWxDbGlwYm9hcmQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVloRyxLQUFLLENBQUMsbUJBQW1CLEVBQUU7UUFFMUIsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtZQUNyQyxJQUFJLG9CQUE4QyxDQUFDO1lBQ25ELElBQUksb0JBQThDLENBQUM7WUFDbkQsSUFBSSxhQUFnQyxDQUFDO1lBRXJDLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDaEIsb0JBQW9CLEdBQUcsSUFBSSxtREFBd0IsRUFBRSxDQUFDO2dCQUN0RCxvQkFBb0IsR0FBRyxJQUFJLG1EQUF3QixDQUFDO29CQUNuRCx1R0FBK0MsRUFBRSxNQUFNO2lCQUN2RCxDQUFDLENBQUM7Z0JBQ0gsYUFBYSxHQUFHLElBQUkscUNBQWlCLENBQUMsU0FBUyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFFbkYsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHFDQUFxQixFQUFFLG9CQUFvQixDQUFDLENBQUM7Z0JBQ3ZFLG9CQUFvQixDQUFDLElBQUksQ0FBQyx3QkFBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQzFELENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1lBRTFDLFNBQVMsY0FBYyxDQUFDLEtBQWM7Z0JBQ3JDLG9CQUFvQixHQUFHLElBQUksbURBQXdCLENBQUM7b0JBQ25ELHVHQUErQyxFQUFFLEtBQUs7aUJBQ3RELENBQUMsQ0FBQztnQkFDSCxvQkFBb0Is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