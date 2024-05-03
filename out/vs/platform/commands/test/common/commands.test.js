define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/platform/commands/common/commands"], function (require, exports, assert, lifecycle_1, utils_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Command Tests', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('register command - no handler', function () {
            assert.throws(() => commands_1.CommandsRegistry.registerCommand('foo', null));
        });
        test('register/dispose', () => {
            const command = function () { };
            const reg = commands_1.CommandsRegistry.registerCommand('foo', command);
            assert.ok(commands_1.CommandsRegistry.getCommand('foo').handler === command);
            reg.dispose();
            assert.ok(commands_1.CommandsRegistry.getCommand('foo') === undefined);
        });
        test('register/register/dispose', () => {
            const command1 = function () { };
            const command2 = function () { };
            // dispose overriding command
            let reg1 = commands_1.CommandsRegistry.registerCommand('foo', command1);
            assert.ok(commands_1.CommandsRegistry.getCommand('foo').handler === command1);
            let reg2 = commands_1.CommandsRegistry.registerCommand('foo', command2);
            assert.ok(commands_1.CommandsRegistry.getCommand('foo').handler === command2);
            reg2.dispose();
            assert.ok(commands_1.CommandsRegistry.getCommand('foo').handler === command1);
            reg1.dispose();
            assert.ok(commands_1.CommandsRegistry.getCommand('foo') === undefined);
            // dispose override command first
            reg1 = commands_1.CommandsRegistry.registerCommand('foo', command1);
            reg2 = commands_1.CommandsRegistry.registerCommand('foo', command2);
            assert.ok(commands_1.CommandsRegistry.getCommand('foo').handler === command2);
            reg1.dispose();
            assert.ok(commands_1.CommandsRegistry.getCommand('foo').handler === command2);
            reg2.dispose();
            assert.ok(commands_1.CommandsRegistry.getCommand('foo') === undefined);
        });
        test('command with description', function () {
            const r1 = commands_1.CommandsRegistry.registerCommand('test', function (accessor, args) {
                assert.ok(typeof args === 'string');
            });
            const r2 = commands_1.CommandsRegistry.registerCommand('test2', function (accessor, args) {
                assert.ok(typeof args === 'string');
            });
            const r3 = commands_1.CommandsRegistry.registerCommand({
                id: 'test3',
                handler: function (accessor, args) {
                    return true;
                },
                metadata: {
                    description: 'a command',
                    args: [{ name: 'value', constraint: Number }]
                }
            });
            commands_1.CommandsRegistry.getCommands().get('test').handler.apply(undefined, [undefined, 'string']);
            commands_1.CommandsRegistry.getCommands().get('test2').handler.apply(undefined, [undefined, 'string']);
            assert.throws(() => commands_1.CommandsRegistry.getCommands().get('test3').handler.apply(undefined, [undefined, 'string']));
            assert.strictEqual(commands_1.CommandsRegistry.getCommands().get('test3').handler.apply(undefined, [undefined, 1]), true);
            (0, lifecycle_1.combinedDisposable)(r1, r2, r3).dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vY29tbWFuZHMvdGVzdC9jb21tb24vY29tbWFuZHMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFTQSxLQUFLLENBQUMsZUFBZSxFQUFFO1FBRXRCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsK0JBQStCLEVBQUU7WUFDckMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQywyQkFBZ0IsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLElBQUssQ0FBQyxDQUFDLENBQUM7UUFDckUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1lBQzdCLE1BQU0sT0FBTyxHQUFHLGNBQWMsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sR0FBRyxHQUFHLDJCQUFnQixDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDN0QsTUFBTSxDQUFDLEVBQUUsQ0FBQywyQkFBZ0IsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFFLENBQUMsT0FBTyxLQUFLLE9BQU8sQ0FBQyxDQUFDO1lBQ25FLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNkLE1BQU0sQ0FBQyxFQUFFLENBQUMsMkJBQWdCLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDO1FBQzdELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtZQUN0QyxNQUFNLFFBQVEsR0FBRyxjQUFjLENBQUMsQ0FBQztZQUNqQyxNQUFNLFFBQVEsR0FBRyxjQUFjLENBQUMsQ0FBQztZQUVqQyw2QkFBNkI7WUFDN0IsSUFBSSxJQUFJLEdBQUcsMkJB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RUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzlGLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsMkJBQWdCLENBQUMsV0FBVyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsU0FBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuSCxNQUFNLENBQUMsV0FBVyxDQUFDLDJCQUFnQixDQUFDLFdBQVcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLFNBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRWpILElBQUEsOEJBQWtCLEVBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMxQyxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=