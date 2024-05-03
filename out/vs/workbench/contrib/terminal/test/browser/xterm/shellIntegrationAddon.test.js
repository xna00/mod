/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/platform/terminal/common/xterm/shellIntegrationAddon", "vs/platform/log/common/log", "vs/amdX", "vs/workbench/contrib/terminal/browser/terminalTestHelpers", "vs/base/common/lifecycle", "vs/base/test/common/utils"], function (require, exports, assert_1, sinon, shellIntegrationAddon_1, log_1, amdX_1, terminalTestHelpers_1, lifecycle_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestShellIntegrationAddon extends shellIntegrationAddon_1.ShellIntegrationAddon {
        getCommandDetectionMock(terminal) {
            const capability = super._createOrGetCommandDetection(terminal);
            this.capabilities.add(2 /* TerminalCapability.CommandDetection */, capability);
            return sinon.mock(capability);
        }
        getCwdDectionMock() {
            const capability = super._createOrGetCwdDetection();
            this.capabilities.add(0 /* TerminalCapability.CwdDetection */, capability);
            return sinon.mock(capability);
        }
    }
    suite('ShellIntegrationAddon', () => {
        let store;
        setup(() => store = new lifecycle_1.DisposableStore());
        teardown(() => store.dispose());
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let xterm;
        let shellIntegrationAddon;
        let capabilities;
        setup(async () => {
            const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
            xterm = store.add(new TerminalCtor({ allowProposedApi: true, cols: 80, rows: 30 }));
            shellIntegrationAddon = store.add(new TestShellIntegrationAddon('', true, undefined, new log_1.NullLogService()));
            xterm.loadAddon(shellIntegrationAddon);
            capabilities = shellIntegrationAddon.capabilities;
        });
        suite('cwd detection', () => {
            test('should activate capability on the cwd sequence (OSC 633 ; P ; Cwd=<cwd> ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(0 /* TerminalCapability.CwdDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(0 /* TerminalCapability.CwdDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;P;Cwd=/foo\x07');
                (0, assert_1.strictEqual)(capabilities.has(0 /* TerminalCapability.CwdDetection */), true);
            });
            test('should pass cwd sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCwdDectionMock();
                mock.expects('updateCwd').once().withExactArgs('/foo');
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;P;Cwd=/foo\x07');
                mock.verify();
            });
            test('detect ITerm sequence: `OSC 1337 ; CurrentDir=<Cwd> ST`', async () => {
                const cases = [
                    ['root', '/', '/'],
                    ['non-root', '/some/path', '/some/path'],
                ];
                for (const x of cases) {
                    const [title, input, expected] = x;
                    const mock = shellIntegrationAddon.getCwdDectionMock();
                    mock.expects('updateCwd').once().withExactArgs(expected).named(title);
                    await (0, terminalTestHelpers_1.writeP)(xterm, `\x1b]1337;CurrentDir=${input}\x07`);
                    mock.verify();
                }
            });
            suite('detect `SetCwd` sequence: `OSC 7; scheme://cwd ST`', () => {
                test('should accept well-formatted URLs', async () => {
                    const cases = [
                        // Different hostname values:
                        ['empty hostname, pointing root', 'file:///', '/'],
                        ['empty hostname', 'file:///test-root/local', '/test-root/local'],
                        ['non-empty hostname', 'file://some-hostname/test-root/local', '/test-root/local'],
                        // URL-encoded chars:
                        ['URL-encoded value (1)', 'file:///test-root/%6c%6f%63%61%6c', '/test-root/local'],
                        ['URL-encoded value (2)', 'file:///test-root/local%22', '/test-root/local"'],
                        ['URL-encoded value (3)', 'file:///test-root/local"', '/test-root/local"'],
                    ];
                    for (const x of cases) {
                        const [title, input, expected] = x;
                        const mock = shellIntegrationAddon.getCwdDectionMock();
                        mock.expects('updateCwd').once().withExactArgs(expected).named(title);
                        await (0, terminalTestHelpers_1.writeP)(xterm, `\x1b]7;${input}\x07`);
                        mock.verify();
                    }
                });
                test('should ignore ill-formatted URLs', async () => {
                    const cases = [
                        // Different hostname values:
                        ['no hostname, pointing root', 'file://'],
                        // Non-`file` scheme values:
                        ['no scheme (1)', '/test-root'],
                        ['no scheme (2)', '//test-root'],
                        ['no scheme (3)', '///test-root'],
                        ['no scheme (4)', ':///test-root'],
                        ['http', 'http:///test-root'],
                        ['ftp', 'ftp:///test-root'],
                        ['ssh', 'ssh:///test-root'],
                    ];
                    for (const x of cases) {
                        const [title, input] = x;
                        const mock = shellIntegrationAddon.getCwdDectionMock();
                        mock.expects('updateCwd').never().named(title);
                        await (0, terminalTestHelpers_1.writeP)(xterm, `\x1b]7;${input}\x07`);
                        mock.verify();
                    }
                });
            });
            test('detect `SetWindowsFrindlyCwd` sequence: `OSC 9 ; 9 ; <cwd> ST`', async () => {
                const cases = [
                    ['root', '/', '/'],
                    ['non-root', '/some/path', '/some/path'],
                ];
                for (const x of cases) {
                    const [title, input, expected] = x;
                    const mock = shellIntegrationAddon.getCwdDectionMock();
                    mock.expects('updateCwd').once().withExactArgs(expected).named(title);
                    await (0, terminalTestHelpers_1.writeP)(xterm, `\x1b]9;9;${input}\x07`);
                    mock.verify();
                }
            });
        });
        suite('command tracking', () => {
            test('should activate capability on the prompt start sequence (OSC 633 ; A ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;A\x07');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), true);
            });
            test('should pass prompt start sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('handlePromptStart').once().withExactArgs();
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;A\x07');
                mock.verify();
            });
            test('should activate capability on the command start sequence (OSC 633 ; B ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;B\x07');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), true);
            });
            test('should pass command start sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('handleCommandStart').once().withExactArgs();
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;B\x07');
                mock.verify();
            });
            test('should activate capability on the command executed sequence (OSC 633 ; C ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;C\x07');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), true);
            });
            test('should pass command executed sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('handleCommandExecuted').once().withExactArgs();
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;C\x07');
                mock.verify();
            });
            test('should activate capability on the command finished sequence (OSC 633 ; D ; <ExitCode> ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;D;7\x07');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), true);
            });
            test('should pass command finished sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('handleCommandFinished').once().withExactArgs(7);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;D;7\x07');
                mock.verify();
            });
            test('should pass command line sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('setCommandLine').once().withExactArgs('', false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;E\x07');
                mock.verify();
                const mock2 = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock2.expects('setCommandLine').twice().withExactArgs('cmd', false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;E;cmd\x07');
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;E;cmd;invalid-nonce\x07');
                mock2.verify();
            });
            test('should not activate capability on the cwd sequence (OSC 633 ; P=Cwd=<cwd> ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;P;Cwd=/foo\x07');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
            });
            test('should pass cwd sequence to the capability if it\'s initialized', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('setCwd').once().withExactArgs('/foo');
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;P;Cwd=/foo\x07');
                mock.verify();
            });
        });
        suite('BufferMarkCapability', () => {
            test('SetMark', async () => {
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;SetMark;\x07');
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), true);
            });
            test('SetMark - ID', async () => {
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;SetMark;1;\x07');
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), true);
            });
            test('SetMark - hidden', async () => {
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;SetMark;;Hidden\x07');
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), true);
            });
            test('SetMark - hidden & ID', async () => {
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;SetMark;1;Hidden\x07');
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), true);
            });
            suite('parseMarkSequence', () => {
                test('basic', async () => {
                    (0, assert_1.deepEqual)((0, shellIntegrationAddon_1.parseMarkSequence)(['', '']), { id: undefined, hidden: false });
                });
                test('ID', async () => {
                    (0, assert_1.deepEqual)((0, shellIntegrationAddon_1.parseMarkSequence)(['Id=3', '']), { id: "3", hidden: false });
                });
                test('hidden', async () => {
                    (0, assert_1.deepEqual)((0, shellIntegrationAddon_1.parseMarkSequence)(['', 'Hidden']), { id: undefined, hidden: true });
                });
                test('ID + hidden', async () => {
                    (0, assert_1.deepEqual)((0, shellIntegrationAddon_1.parseMarkSequence)(['Id=4555', 'Hidden']), { id: "4555", hidden: true });
                });
            });
        });
        suite('deserializeMessage', () => {
            // A single literal backslash, in order to avoid confusion about whether we are escaping test data or testing escapes.
            const Backslash = '\\';
            const Newline = '\n';
            const Semicolon = ';';
            const cases = [
                ['empty', '', ''],
                ['basic', 'value', 'value'],
                ['space', 'some thing', 'some thing'],
                ['escaped backslash', `${Backslash}${Backslash}`, Backslash],
                ['non-initial escaped backslash', `foo${Backslash}${Backslash}`, `foo${Backslash}`],
                ['two escaped backslashes', `${Backslash}${Backslash}${Backslash}${Backslash}`, `${Backslash}${Backslash}`],
                ['escaped backslash amidst text', `Hello${Backslash}${Backslash}there`, `Hello${Backslash}there`],
                ['backslash escaped literally and as hex', `${Backslash}${Backslash} is same as ${Backslash}x5c`, `${Backslash} is same as ${Backslash}`],
                ['escaped semicolon', `${Backslash}x3b`, Semicolon],
                ['non-initial escaped semicolon', `foo${Backslash}x3b`, `foo${Semicolon}`],
                ['escaped semicolon (upper hex)', `${Backslash}x3B`, Semicolon],
                ['escaped backslash followed by literal "x3b" is not a semicolon', `${Backslash}${Backslash}x3b`, `${Backslash}x3b`],
                ['non-initial escaped backslash followed by literal "x3b" is not a semicolon', `foo${Backslash}${Backslash}x3b`, `foo${Backslash}x3b`],
                ['escaped backslash followed by escaped semicolon', `${Backslash}${Backslash}${Backslash}x3b`, `${Backslash}${Semicolon}`],
                ['escaped semicolon amidst text', `some${Backslash}x3bthing`, `some${Semicolon}thing`],
                ['escaped newline', `${Backslash}x0a`, Newline],
                ['non-initial escaped newline', `foo${Backslash}x0a`, `foo${Newline}`],
                ['escaped newline (upper hex)', `${Backslash}x0A`, Newline],
                ['escaped backslash followed by literal "x0a" is not a newline', `${Backslash}${Backslash}x0a`, `${Backslash}x0a`],
                ['non-initial escaped backslash followed by literal "x0a" is not a newline', `foo${Backslash}${Backslash}x0a`, `foo${Backslash}x0a`],
            ];
            cases.forEach(([title, input, expected]) => {
                test(title, () => (0, assert_1.strictEqual)((0, shellIntegrationAddon_1.deserializeMessage)(input), expected));
            });
        });
        test('parseKeyValueAssignment', () => {
            const cases = [
                ['empty', '', ['', undefined]],
                ['no "=" sign', 'some-text', ['some-text', undefined]],
                ['empty value', 'key=', ['key', '']],
                ['empty key', '=value', ['', 'value']],
                ['normal', 'key=value', ['key', 'value']],
                ['multiple "=" signs (1)', 'key==value', ['key', '=value']],
                ['multiple "=" signs (2)', 'key=value===true', ['key', 'value===true']],
                ['just a "="', '=', ['', '']],
                ['just a "=="', '==', ['', '=']],
            ];
            cases.forEach(x => {
                const [title, input, [key, value]] = x;
                (0, assert_1.deepStrictEqual)((0, shellIntegrationAddon_1.parseKeyValueAssignment)(input), { key, value }, title);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGxJbnRlZ3JhdGlvbkFkZG9uLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL3Rlc3QvYnJvd3Nlci94dGVybS9zaGVsbEludGVncmF0aW9uQWRkb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyxNQUFNLHlCQUEwQixTQUFRLDZDQUFxQjtRQUM1RCx1QkFBdUIsQ0FBQyxRQUFrQjtZQUN6QyxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsNEJBQTRCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLDhDQUFzQyxVQUFVLENBQUMsQ0FBQztZQUN2RSxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUNELGlCQUFpQjtZQUNoQixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUNwRCxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsMENBQWtDLFVBQVUsQ0FBQyxDQUFDO1lBQ25FLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMvQixDQUFDO0tBQ0Q7SUFFRCxLQUFLLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBQ25DLElBQUksS0FBc0IsQ0FBQztRQUMzQixLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7UUFDM0MsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ2hDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLEtBQWUsQ0FBQztRQUNwQixJQUFJ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