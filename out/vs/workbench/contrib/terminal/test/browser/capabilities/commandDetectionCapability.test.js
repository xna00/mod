/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/terminal/common/capabilities/commandDetectionCapability", "vs/platform/log/common/log", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/amdX", "vs/workbench/contrib/terminal/browser/terminalTestHelpers", "vs/base/test/common/utils", "vs/base/common/lifecycle"], function (require, exports, assert_1, commandDetectionCapability_1, log_1, contextView_1, instantiationServiceMock_1, amdX_1, terminalTestHelpers_1, utils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestCommandDetectionCapability extends commandDetectionCapability_1.CommandDetectionCapability {
        clearCommands() {
            this._commands.length = 0;
        }
    }
    suite('CommandDetectionCapability', () => {
        let disposables;
        let xterm;
        let capability;
        let addEvents;
        let instantiationService;
        function assertCommands(expectedCommands) {
            (0, assert_1.deepStrictEqual)(capability.commands.map(e => e.command), expectedCommands.map(e => e.command));
            (0, assert_1.deepStrictEqual)(capability.commands.map(e => e.cwd), expectedCommands.map(e => e.cwd));
            (0, assert_1.deepStrictEqual)(capability.commands.map(e => e.exitCode), expectedCommands.map(e => e.exitCode));
            (0, assert_1.deepStrictEqual)(capability.commands.map(e => e.marker?.line), expectedCommands.map(e => e.marker?.line));
            // Ensure timestamps are set and were captured recently
            for (const command of capability.commands) {
                (0, assert_1.ok)(Math.abs(Date.now() - command.timestamp) < 2000);
            }
            (0, assert_1.deepStrictEqual)(addEvents, capability.commands);
            // Clear the commands to avoid re-asserting past commands
            addEvents.length = 0;
            capability.clearCommands();
        }
        async function printStandardCommand(prompt, command, output, cwd, exitCode) {
            if (cwd !== undefined) {
                capability.setCwd(cwd);
            }
            capability.handlePromptStart();
            await (0, terminalTestHelpers_1.writeP)(xterm, `\r${prompt}`);
            capability.handleCommandStart();
            await (0, terminalTestHelpers_1.writeP)(xterm, command);
            capability.handleCommandExecuted();
            await (0, terminalTestHelpers_1.writeP)(xterm, `\r\n${output}\r\n`);
            capability.handleCommandFinished(exitCode);
        }
        async function printCommandStart(prompt) {
            capability.handlePromptStart();
            await (0, terminalTestHelpers_1.writeP)(xterm, `\r${prompt}`);
            capability.handleCommandStart();
        }
        setup(async () => {
            disposables = new lifecycle_1.DisposableStore();
            const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
            xterm = new TerminalCtor({ allowProposedApi: true, cols: 80 });
            instantiationService = disposables.add(new instantiationServiceMock_1.TestInstantiationService());
            instantiationService.stub(contextView_1.IContextMenuService, { showContextMenu(delegate) { } });
            capability = disposables.add(new TestCommandDetectionCapability(xterm, new log_1.NullLogService()));
            addEvents = [];
            capability.onCommandFinished(e => addEvents.push(e));
            assertCommands([]);
        });
        teardown(() => disposables.dispose());
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('should not add commands when no capability methods are triggered', async () => {
            await (0, terminalTestHelpers_1.writeP)(xterm, 'foo\r\nbar\r\n');
            assertCommands([]);
            await (0, terminalTestHelpers_1.writeP)(xterm, 'baz\r\n');
            assertCommands([]);
        });
        test('should add commands for expected capability method calls', async () => {
            await printStandardCommand('$ ', 'echo foo', 'foo', undefined, 0);
            await printCommandStart('$ ');
            assertCommands([{
                    command: 'echo foo',
                    exitCode: 0,
                    cwd: undefined,
                    marker: { line: 0 }
                }]);
        });
        test('should trim the command when command executed appears on the following line', async () => {
            await printStandardCommand('$ ', 'echo foo\r\n', 'foo', undefined, 0);
            await printCommandStart('$ ');
            assertCommands([{
                    command: 'echo foo',
                    exitCode: 0,
                    cwd: undefined,
                    marker: { line: 0 }
                }]);
        });
        suite('cwd', () => {
            test('should add cwd to commands when it\'s set', async () => {
                await printStandardCommand('$ ', 'echo foo', 'foo', '/home', 0);
                await printStandardCommand('$ ', 'echo bar', 'bar', '/home/second', 0);
                await printCommandStart('$ ');
                assertCommands([
                    { command: 'echo foo', exitCode: 0, cwd: '/home', marker: { line: 0 } },
                    { command: 'echo bar', exitCode: 0, cwd: '/home/second', marker: { line: 2 } }
                ]);
            });
            test('should add old cwd to commands if no cwd sequence is output', async () => {
                await printStandardCommand('$ ', 'echo foo', 'foo', '/home', 0);
                await printStandardCommand('$ ', 'echo bar', 'bar', undefined, 0);
                await printCommandStart('$ ');
                assertCommands([
                    { command: 'echo foo', exitCode: 0, cwd: '/home', marker: { line: 0 } },
                    { command: 'echo bar', exitCode: 0, cwd: '/home', marker: { line: 2 } }
                ]);
            });
            test('should use an undefined cwd if it\'s not set initially', async () => {
                await printStandardCommand('$ ', 'echo foo', 'foo', undefined, 0);
                await printStandardCommand('$ ', 'echo bar', 'bar', '/home', 0);
                await printCommandStart('$ ');
                assertCommands([
                    { command: 'echo foo', exitCode: 0, cwd: undefined, marker: { line: 0 } },
                    { command: 'echo bar', exitCode: 0, cwd: '/home', marker: { line: 2 } }
                ]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZERldGVjdGlvbkNhcGFiaWxpdHkudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvdGVzdC9icm93c2VyL2NhcGFiaWxpdGllcy9jb21tYW5kRGV0ZWN0aW9uQ2FwYWJpbGl0eS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBaUJoRyxNQUFNLDhCQUErQixTQUFRLHVEQUEwQjtRQUN0RSxhQUFhO1lBQ1osSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQzNCLENBQUM7S0FDRDtJQUVELEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLEVBQUU7UUFDeEMsSUFBSSxXQUE0QixDQUFDO1FBRWpDLElBQUksS0FBZSxDQUFDO1FBQ3BCLElBQUksVUFBMEMsQ0FBQztRQUMvQyxJQUFJLFNBQTZCLENBQUM7UUFDbEMsSUFBSSxvQkFBOEMsQ0FBQztRQUVuRCxTQUFTLGNBQWMsQ0FBQyxnQkFBNEM7WUFDbkUsSUFBQSx3QkFBZSxFQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQy9GLElBQUEsd0JBQWUsRUFBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN2RixJQUFB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