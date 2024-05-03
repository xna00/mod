define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/platform/commands/common/commands", "vs/workbench/services/commands/common/commandService", "vs/workbench/services/extensions/common/extensions", "vs/platform/instantiation/common/instantiationService", "vs/platform/log/common/log"], function (require, exports, assert, lifecycle_1, commands_1, commandService_1, extensions_1, instantiationService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('CommandService', function () {
        let commandRegistration;
        setup(function () {
            commandRegistration = commands_1.CommandsRegistry.registerCommand('foo', function () { });
        });
        teardown(function () {
            commandRegistration.dispose();
        });
        test('activateOnCommand', () => {
            let lastEvent;
            const service = new commandService_1.CommandService(new instantiationService_1.InstantiationService(), new class extends extensions_1.NullExtensionService {
                activateByEvent(activationEvent) {
                    lastEvent = activationEvent;
                    return super.activateByEvent(activationEvent);
                }
            }, new log_1.NullLogService());
            return service.executeCommand('foo').then(() => {
                assert.ok(lastEvent, 'onCommand:foo');
                return service.executeCommand('unknownCommandId');
            }).then(() => {
                assert.ok(false);
            }, () => {
                assert.ok(lastEvent, 'onCommand:unknownCommandId');
            });
        });
        test('fwd activation error', async function () {
            const extensionService = new class extends extensions_1.NullExtensionService {
                activateByEvent(activationEvent) {
                    return Promise.reject(new Error('bad_activate'));
                }
            };
            const service = new commandService_1.CommandService(new instantiationService_1.InstantiationService(), extensionService, new log_1.NullLogService());
            await extensionService.whenInstalledExtensionsRegistered();
            return service.executeCommand('foo').then(() => assert.ok(false), err => {
                assert.strictEqual(err.message, 'bad_activate');
            });
        });
        test('!onReady, but executeCommand', function () {
            let callCounter = 0;
            const reg = commands_1.CommandsRegistry.registerCommand('bar', () => callCounter += 1);
            const service = new commandService_1.CommandService(new instantiationService_1.InstantiationService(), new class extends extensions_1.NullExtensionService {
                whenInstalledExtensionsRegistered() {
                    return new Promise(_resolve => { });
                }
            }, new log_1.NullLogService());
            service.executeCommand('bar');
            assert.strictEqual(callCounter, 1);
            reg.dispose();
        });
        test('issue #34913: !onReady, unknown command', function () {
            let callCounter = 0;
            let resolveFunc;
            const whenInstalledExtensionsRegistered = new Promise(_resolve => { resolveFunc = _resolve; });
            const service = new commandService_1.CommandService(new instantiationService_1.InstantiationService(), new class extends extensions_1.NullExtensionService {
                whenInstalledExtensionsRegistered() {
                    return whenInstalledExtensionsRegistered;
                }
            }, new log_1.NullLogService());
            const r = service.executeCommand('bar');
            assert.strictEqual(callCounter, 0);
            const reg = commands_1.CommandsRegistry.registerCommand('bar', () => callCounter += 1);
            resolveFunc(true);
            return r.then(() => {
                reg.dispose();
                assert.strictEqual(callCounter, 1);
            });
        });
        test('Stop waiting for * extensions to activate when trigger is satisfied #62457', function () {
            let callCounter = 0;
            const disposable = new lifecycle_1.DisposableStore();
            const events = [];
            const service = new commandService_1.CommandService(new instantiationService_1.InstantiationService(), new class extends extensions_1.NullExtensionService {
                activateByEvent(event) {
                    events.push(event);
                    if (event === '*') {
                        return new Promise(() => { }); //forever promise...
                    }
                    if (event.indexOf('onCommand:') === 0) {
                        return new Promise(resolve => {
                            setTimeout(() => {
                                const reg = commands_1.CommandsRegistry.registerCommand(event.substr('onCommand:'.length), () => {
                                    callCounter += 1;
                                });
                                disposable.add(reg);
                                resolve();
                            }, 0);
                        });
                    }
                    return Promise.resolve();
                }
            }, new log_1.NullLogService());
            return service.executeCommand('farboo').then(() => {
                assert.strictEqual(callCounter, 1);
                assert.deepStrictEqual(events.sort(), ['*', 'onCommand:farboo'].sort());
            }).finally(() => {
                disposable.dispose();
            });
        });
        test('issue #71471: wait for onCommand activation even if a command is registered', () => {
            const expectedOrder = ['registering command', 'resolving activation event', 'executing command'];
            const actualOrder = [];
            const disposables = new lifecycle_1.DisposableStore();
            const service = new commandService_1.CommandService(new instantiationService_1.InstantiationService(), new class extends extensions_1.NullExtensionService {
                activateByEvent(event) {
                    if (event === '*') {
                        return new Promise(() => { }); //forever promise...
                    }
                    if (event.indexOf('onCommand:') === 0) {
                        return new Promise(resolve => {
                            setTimeout(() => {
                                // Register the command after some time
                                actualOrder.push('registering command');
                                const reg = commands_1.CommandsRegistry.registerCommand(event.substr('onCommand:'.length), () => {
                                    actualOrder.push('executing command');
                                });
                                disposables.add(reg);
                                setTimeout(() => {
                                    // Resolve the activation event after some more time
                                    actualOrder.push('resolving activation event');
                                    resolve();
                                }, 10);
                            }, 10);
                        });
                    }
                    return Promise.resolve();
                }
            }, new log_1.NullLogService());
            return service.executeCommand('farboo2').then(() => {
                assert.deepStrictEqual(actualOrder, expectedOrder);
            }).finally(() => {
                disposables.dispose();
            });
        });
        test('issue #142155: execute commands synchronously if possible', async () => {
            const actualOrder = [];
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(commands_1.CommandsRegistry.registerCommand(`bizBaz`, () => {
                actualOrder.push('executing command');
            }));
            const extensionService = new class extends extensions_1.NullExtensionService {
                activationEventIsDone(_activationEvent) {
                    return true;
                }
            };
            const service = new commandService_1.CommandService(new instantiationService_1.InstantiationService(), extensionService, new log_1.NullLogService());
            await extensionService.whenInstalledExtensionsRegistered();
            try {
                actualOrder.push(`before call`);
                const promise = service.executeCommand('bizBaz');
                actualOrder.push(`after call`);
                await promise;
                actualOrder.push(`resolved`);
                assert.deepStrictEqual(actualOrder, [
                    'before call',
                    'executing command',
                    'after call',
                    'resolved'
                ]);
            }
            finally {
                disposables.dispose();
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZFNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2NvbW1hbmRzL3Rlc3QvY29tbW9uL2NvbW1hbmRTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBWUEsS0FBSyxDQUFDLGdCQUFnQixFQUFFO1FBRXZCLElBQUksbUJBQWdDLENBQUM7UUFFckMsS0FBSyxDQUFDO1lBQ0wsbUJBQW1CLEdBQUcsMkJBQWdCLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQ2hGLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDO1lBQ1IsbUJBQW1CLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1lBRTlCLElBQUksU0FBaUIsQ0FBQztZQUV0QixNQUFNLE9BQU8sR0FBRyxJQUFJLCtCQUFjLENBQUMsSUFBSSwyQ0FBb0IsRUFBRSxFQUFFLElBQUksS0FBTSxTQUFRLGlDQUFvQjtnQkFDM0YsZUFBZSxDQUFDLGVBQXVCO29CQUMvQyxTQUFTLEdBQUcsZUFBZSxDQUFDO29CQUM1QixPQUFPLEtBQUssQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQy9DLENBQUM7YUFDRCxFQUFFLElBQUksb0JBQWMsRUFBRSxDQUFDLENBQUM7WUFFekIsT0FBTyxPQUFPLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQzlDLE1BQU0sQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLGVBQWUsQ0FBQyxDQUFDO2dCQUN0QyxPQUFPLE9BQU8sQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZ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