/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/api/browser/mainThreadCommands", "vs/platform/commands/common/commands", "vs/workbench/api/test/common/testRPCProtocol", "vs/base/test/common/mock", "vs/base/test/common/utils"], function (require, exports, assert, mainThreadCommands_1, commands_1, testRPCProtocol_1, mock_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadCommands', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('dispose on unregister', function () {
            const commands = new mainThreadCommands_1.MainThreadCommands((0, testRPCProtocol_1.SingleProxyRPCProtocol)(null), undefined, new class extends (0, mock_1.mock)() {
            });
            assert.strictEqual(commands_1.CommandsRegistry.getCommand('foo'), undefined);
            // register
            commands.$registerCommand('foo');
            assert.ok(commands_1.CommandsRegistry.getCommand('foo'));
            // unregister
            commands.$unregisterCommand('foo');
            assert.strictEqual(commands_1.CommandsRegistry.getCommand('foo'), undefined);
            commands.dispose();
        });
        test('unregister all on dispose', function () {
            const commands = new mainThreadCommands_1.MainThreadCommands((0, testRPCProtocol_1.SingleProxyRPCProtocol)(null), undefined, new class extends (0, mock_1.mock)() {
            });
            assert.strictEqual(commands_1.CommandsRegistry.getCommand('foo'), undefined);
            commands.$registerCommand('foo');
            commands.$registerCommand('bar');
            assert.ok(commands_1.CommandsRegistry.getCommand('foo'));
            assert.ok(commands_1.CommandsRegistry.getCommand('bar'));
            commands.dispose();
            assert.strictEqual(commands_1.CommandsRegistry.getCommand('foo'), undefined);
            assert.strictEqual(commands_1.CommandsRegistry.getCommand('bar'), undefined);
        });
        test('activate and throw when needed', async function () {
            const activations = [];
            const runs = [];
            const commands = new mainThreadCommands_1.MainThreadCommands((0, testRPCProtocol_1.SingleProxyRPCProtocol)(null), new class extends (0, mock_1.mock)() {
                executeCommand(id) {
                    runs.push(id);
                    return Promise.resolve(undefined);
                }
            }, new class extends (0, mock_1.mock)() {
                activateByEvent(id) {
                    activations.push(id);
                    return Promise.resolve();
                }
            });
            // case 1: arguments and retry
            try {
                activations.length = 0;
                await commands.$executeCommand('bazz', [1, 2, { n: 3 }], true);
                assert.ok(false);
            }
            catch (e) {
                assert.deepStrictEqual(activations, ['onCommand:bazz']);
                assert.strictEqual(e.message, '$executeCommand:retry');
            }
            // case 2: no arguments and retry
            runs.length = 0;
            await commands.$executeCommand('bazz', [], true);
            assert.deepStrictEqual(runs, ['bazz']);
            // case 3: arguments and no retry
            runs.length = 0;
            await commands.$executeCommand('bazz', [1, 2, true], false);
            assert.deepStrictEqual(runs, ['bazz']);
            commands.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENvbW1hbmRzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvdGVzdC9icm93c2VyL21haW5UaHJlYWRDb21tYW5kcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLEtBQUssQ0FBQyxvQkFBb0IsRUFBRTtRQUUzQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFO1lBRTdCLE1BQU0sUUFBUSxHQUFHLElBQUksdUNBQWtCLENBQUMsSUFBQSx3Q0FBc0IsRUFBQyxJQUFJLENBQUMsRUFBRSxTQUFVLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQXFCO2FBQUksQ0FBQyxDQUFDO1lBQ25JLE1BQU0sQ0FBQyxXQUFXLENBQUMsMkJBQWdCLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRWxFLFdBQVc7WUFDWCxRQUFRLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDLEVBQUUsQ0FBQywyQkFBZ0IsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUU5QyxhQUFhO1lBQ2IsUUFBUSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxXQUFXLENBQUMsMkJBQWdCLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRWxFLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUVwQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywyQkFBMkIsRUFBRTtZQUVqQyxNQUFNLFFBQVEsR0FBRyxJQUFJLHVDQUFrQixDQUFDLElBQUEsd0NBQXNC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