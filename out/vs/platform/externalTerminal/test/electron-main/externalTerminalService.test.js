/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/externalTerminal/common/externalTerminal", "vs/platform/externalTerminal/node/externalTerminalService"], function (require, exports, assert_1, utils_1, externalTerminal_1, externalTerminalService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const mockConfig = Object.freeze({
        terminal: {
            explorerKind: 'external',
            external: {
                windowsExec: 'testWindowsShell',
                osxExec: 'testOSXShell',
                linuxExec: 'testLinuxShell'
            }
        }
    });
    suite('ExternalTerminalService', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test(`WinTerminalService - uses terminal from configuration`, done => {
            const testShell = 'cmd';
            const testCwd = 'path/to/workspace';
            const mockSpawner = {
                spawn: (command, args, opts) => {
                    (0, assert_1.strictEqual)(command, testShell, 'shell should equal expected');
                    (0, assert_1.strictEqual)(args[args.length - 1], mockConfig.terminal.external.windowsExec);
                    (0, assert_1.strictEqual)(opts.cwd, testCwd);
                    done();
                    return {
                        on: (evt) => evt
                    };
                }
            };
            const testService = new externalTerminalService_1.WindowsExternalTerminalService();
            testService.spawnTerminal(mockSpawner, mockConfig.terminal.external, testShell, testCwd);
        });
        test(`WinTerminalService - uses default terminal when configuration.terminal.external.windowsExec is undefined`, done => {
            const testShell = 'cmd';
            const testCwd = 'path/to/workspace';
            const mockSpawner = {
                spawn: (command, args, opts) => {
                    (0, assert_1.strictEqual)(args[args.length - 1], externalTerminalService_1.WindowsExternalTerminalService.getDefaultTerminalWindows());
                    done();
                    return {
                        on: (evt) => evt
                    };
                }
            };
            mockConfig.terminal.external.windowsExec = undefined;
            const testService = new externalTerminalService_1.WindowsExternalTerminalService();
            testService.spawnTerminal(mockSpawner, mockConfig.terminal.external, testShell, testCwd);
        });
        test(`WinTerminalService - cwd is correct regardless of case`, done => {
            const testShell = 'cmd';
            const testCwd = 'c:/foo';
            const mockSpawner = {
                spawn: (command, args, opts) => {
                    (0, assert_1.strictEqual)(opts.cwd, 'C:/foo', 'cwd should be uppercase regardless of the case that\'s passed in');
                    done();
                    return {
                        on: (evt) => evt
                    };
                }
            };
            const testService = new externalTerminalService_1.WindowsExternalTerminalService();
            testService.spawnTerminal(mockSpawner, mockConfig.terminal.external, testShell, testCwd);
        });
        test(`WinTerminalService - cmder should be spawned differently`, done => {
            const testShell = 'cmd';
            const testCwd = 'c:/foo';
            const mockSpawner = {
                spawn: (command, args, opts) => {
                    (0, assert_1.deepStrictEqual)(args, ['C:/foo']);
                    (0, assert_1.strictEqual)(opts, undefined);
                    done();
                    return { on: (evt) => evt };
                }
            };
            const testService = new externalTerminalService_1.WindowsExternalTerminalService();
            testService.spawnTerminal(mockSpawner, { windowsExec: 'cmder' }, testShell, testCwd);
        });
        test(`WinTerminalService - windows terminal should open workspace directory`, done => {
            const testShell = 'wt';
            const testCwd = 'c:/foo';
            const mockSpawner = {
                spawn: (command, args, opts) => {
                    (0, assert_1.strictEqual)(opts.cwd, 'C:/foo');
                    done();
                    return { on: (evt) => evt };
                }
            };
            const testService = new externalTerminalService_1.WindowsExternalTerminalService();
            testService.spawnTerminal(mockSpawner, mockConfig.terminal.external, testShell, testCwd);
        });
        test(`MacTerminalService - uses terminal from configuration`, done => {
            const testCwd = 'path/to/workspace';
            const mockSpawner = {
                spawn: (command, args, opts) => {
                    (0, assert_1.strictEqual)(args[1], mockConfig.terminal.external.osxExec);
                    done();
                    return {
                        on: (evt) => evt
                    };
                }
            };
            const testService = new externalTerminalService_1.MacExternalTerminalService();
            testService.spawnTerminal(mockSpawner, mockConfig.terminal.external, testCwd);
        });
        test(`MacTerminalService - uses default terminal when configuration.terminal.external.osxExec is undefined`, done => {
            const testCwd = 'path/to/workspace';
            const mockSpawner = {
                spawn: (command, args, opts) => {
                    (0, assert_1.strictEqual)(args[1], externalTerminal_1.DEFAULT_TERMINAL_OSX);
                    done();
                    return {
                        on: (evt) => evt
                    };
                }
            };
            const testService = new externalTerminalService_1.MacExternalTerminalService();
            testService.spawnTerminal(mockSpawner, { osxExec: undefined }, testCwd);
        });
        test(`LinuxTerminalService - uses terminal from configuration`, done => {
            const testCwd = 'path/to/workspace';
            const mockSpawner = {
                spawn: (command, args, opts) => {
                    (0, assert_1.strictEqual)(command, mockConfig.terminal.external.linuxExec);
                    (0, assert_1.strictEqual)(opts.cwd, testCwd);
                    done();
                    return {
                        on: (evt) => evt
                    };
                }
            };
            const testService = new externalTerminalService_1.LinuxExternalTerminalService();
            testService.spawnTerminal(mockSpawner, mockConfig.terminal.external, testCwd);
        });
        test(`LinuxTerminalService - uses default terminal when configuration.terminal.external.linuxExec is undefined`, done => {
            externalTerminalService_1.LinuxExternalTerminalService.getDefaultTerminalLinuxReady().then(defaultTerminalLinux => {
                const testCwd = 'path/to/workspace';
                const mockSpawner = {
                    spawn: (command, args, opts) => {
                        (0, assert_1.strictEqual)(command, defaultTerminalLinux);
                        done();
                        return {
                            on: (evt) => evt
                        };
                    }
                };
                mockConfig.terminal.external.linuxExec = undefined;
                const testService = new externalTerminalService_1.LinuxExternalTerminalService();
                testService.spawnTerminal(mockSpawner, mockConfig.terminal.external, testCwd);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZXJuYWxUZXJtaW5hbFNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZXh0ZXJuYWxUZXJtaW5hbC90ZXN0L2VsZWN0cm9uLW1haW4vZXh0ZXJuYWxUZXJtaW5hbFNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFpQztRQUNoRSxRQUFRLEVBQUU7WUFDVCxZQUFZLEVBQUUsVUFBVTtZQUN4QixRQUFRLEVBQUU7Z0JBQ1QsV0FBVyxFQUFFLGtCQUFrQjtnQkFDL0IsT0FBTyxFQUFFLGNBQWM7Z0JBQ3ZCLFNBQVMsRUFBRSxnQkFBZ0I7YUFDM0I7U0FDRDtLQUNELENBQUMsQ0FBQztJQUVILEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7UUFDckMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyx1REFBdUQsRUFBRSxJQUFJLENBQUMsRUFBRTtZQUNwRSxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDeEIsTUFBTSxPQUFPLEdBQUcsbUJBQW1CLENBQUM7WUFDcEMsTUFBTSxXQUFXLEdBQVE7Z0JBQ3hCLEtBQUssRUFBRSxDQUFDLE9BQVksRUFBRSxJQUFTLEVBQUUsSUFBUyxFQUFFLEVBQUU7b0JBQzdDLElBQUEsb0JBQVcsRUFBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLDZCQUE2QixDQUFDLENBQUM7b0JBQy9ELElBQUEsb0JBQVcsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDN0UsSUFBQSxvQkFBVyxFQUFDLElBQUks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