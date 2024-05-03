define(["require", "exports", "assert", "vs/base/common/keyCodes", "vs/base/common/keybindings", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/severity", "vs/base/test/common/utils", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/abstractKeybindingService", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/platform/keybinding/test/common/keybindingsTestUtils", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, assert, keyCodes_1, keybindings_1, lifecycle_1, platform_1, severity_1, utils_1, contextkey_1, abstractKeybindingService_1, keybindingResolver_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1, keybindingsTestUtils_1, log_1, notification_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createContext(ctx) {
        return {
            getValue: (key) => {
                return ctx[key];
            }
        };
    }
    suite('AbstractKeybindingService', () => {
        class TestKeybindingService extends abstractKeybindingService_1.AbstractKeybindingService {
            constructor(resolver, contextKeyService, commandService, notificationService) {
                super(contextKeyService, commandService, telemetryUtils_1.NullTelemetryService, notificationService, new log_1.NullLogService());
                this._resolver = resolver;
            }
            _getResolver() {
                return this._resolver;
            }
            _documentHasFocus() {
                return true;
            }
            resolveKeybinding(kb) {
                return usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding.resolveKeybinding(kb, platform_1.OS);
            }
            resolveKeyboardEvent(keyboardEvent) {
                const chord = new keybindings_1.KeyCodeChord(keyboardEvent.ctrlKey, keyboardEvent.shiftKey, keyboardEvent.altKey, keyboardEvent.metaKey, keyboardEvent.keyCode).toKeybinding();
                return this.resolveKeybinding(chord)[0];
            }
            resolveUserBinding(userBinding) {
                return [];
            }
            testDispatch(kb) {
                const keybinding = (0, keybindings_1.createSimpleKeybinding)(kb, platform_1.OS);
                return this._dispatch({
                    _standardKeyboardEventBrand: true,
                    ctrlKey: keybinding.ctrlKey,
                    shiftKey: keybinding.shiftKey,
                    altKey: keybinding.altKey,
                    metaKey: keybinding.metaKey,
                    altGraphKey: false,
                    keyCode: keybinding.keyCode,
                    code: null
                }, null);
            }
            _dumpDebugInfo() {
                return '';
            }
            _dumpDebugInfoJSON() {
                return '';
            }
            registerSchemaContribution() {
                // noop
            }
            enableKeybindingHoldMode() {
                return undefined;
            }
        }
        let createTestKeybindingService = null;
        let currentContextValue = null;
        let executeCommandCalls = null;
        let showMessageCalls = null;
        let statusMessageCalls = null;
        let statusMessageCallsDisposed = null;
        teardown(() => {
            currentContextValue = null;
            executeCommandCalls = null;
            showMessageCalls = null;
            createTestKeybindingService = null;
            statusMessageCalls = null;
            statusMessageCallsDisposed = null;
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            createTestKeybindingService = (items) => {
                const contextKeyService = {
                    _serviceBrand: undefined,
                    onDidChangeContext: undefined,
                    bufferChangeEvents() { },
                    createKey: undefined,
                    contextMatchesRules: undefined,
                    getContextKeyValue: undefined,
                    createScoped: undefined,
                    createOverlay: undefined,
                    getContext: (target) => {
                        return currentContextValue;
                    },
                    updateParent: () => { }
                };
                const commandService = {
                    _serviceBrand: undefined,
                    onWillExecuteCommand: () => lifecycle_1.Disposable.None,
                    onDidExecuteCommand: () => lifecycle_1.Disposable.None,
                    executeCommand: (commandId, ...args) => {
                        executeCommandCalls.push({
                            commandId: commandId,
                            args: args
                        });
                        return Promise.resolve(undefined);
                    }
                };
                const notificationService = {
                    _serviceBrand: undefined,
                    onDidAddNotification: undefined,
                    onDidRemoveNotification: undefined,
                    onDidChangeFilter: undefined,
                    notify: (notification) => {
                        showMessageCalls.push({ sev: notification.severity, message: notification.message });
                        return new notification_1.NoOpNotification();
                    },
                    info: (message) => {
                        showMessageCalls.push({ sev: severity_1.default.Info, message });
                        return new notification_1.NoOpNotification();
                    },
                    warn: (message) => {
                        showMessageCalls.push({ sev: severity_1.default.Warning, message });
                        return new notification_1.NoOpNotification();
                    },
                    error: (message) => {
                        showMessageCalls.push({ sev: severity_1.default.Error, message });
                        return new notification_1.NoOpNotification();
                    },
                    prompt(severity, message, choices, options) {
                        throw new Error('not implemented');
                    },
                    status(message, options) {
                        statusMessageCalls.push(message);
                        return {
                            dispose: () => {
                                statusMessageCallsDisposed.push(message);
                            }
                        };
                    },
                    setFilter() {
                        throw new Error('not implemented');
                    },
                    getFilter() {
                        throw new Error('not implemented');
                    },
                    getFilters() {
                        throw new Error('not implemented');
                    },
                    removeFilter() {
                        throw new Error('not implemented');
                    }
                };
                const resolver = new keybindingResolver_1.KeybindingResolver(items, [], () => { });
                return new TestKeybindingService(resolver, contextKeyService, commandService, notificationService);
            };
        });
        function kbItem(keybinding, command, when) {
            return new resolvedKeybindingItem_1.ResolvedKeybindingItem((0, keybindingsTestUtils_1.createUSLayoutResolvedKeybinding)(keybinding, platform_1.OS), command, null, when, true, null, false);
        }
        function toUsLabel(keybinding) {
            return (0, keybindingsTestUtils_1.createUSLayoutResolvedKeybinding)(keybinding, platform_1.OS).getLabel();
        }
        suite('simple tests: single- and multi-chord keybindings are dispatched', () => {
            test('a single-chord keybinding is dispatched correctly; this test makes sure the dispatch in general works before we test empty-string/null command ID', () => {
                const key = 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */;
                const kbService = createTestKeybindingService([
                    kbItem(key, 'myCommand'),
                ]);
                currentContextValue = createContext({});
                const shouldPreventDefault = kbService.testDispatch(key);
                assert.deepStrictEqual(shouldPreventDefault, true);
                assert.deepStrictEqual(executeCommandCalls, ([{ commandId: "myCommand", args: [null] }]));
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, []);
                assert.deepStrictEqual(statusMessageCallsDisposed, []);
                kbService.dispose();
            });
            test('a multi-chord keybinding is dispatched correctly', () => {
                const chord0 = 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */;
                const chord1 = 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */;
                const key = [chord0, chord1];
                const kbService = createTestKeybindingService([
                    kbItem(key, 'myCommand'),
                ]);
                currentContextValue = createContext({});
                let shouldPreventDefault = kbService.testDispatch(chord0);
                assert.deepStrictEqual(shouldPreventDefault, true);
                assert.deepStrictEqual(executeCommandCalls, []);
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`]));
                assert.deepStrictEqual(statusMessageCallsDisposed, []);
                shouldPreventDefault = kbService.testDispatch(chord1);
                assert.deepStrictEqual(shouldPreventDefault, true);
                assert.deepStrictEqual(executeCommandCalls, ([{ commandId: "myCommand", args: [null] }]));
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`]));
                assert.deepStrictEqual(statusMessageCallsDisposed, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`]));
                kbService.dispose();
            });
        });
        suite('keybindings with empty-string/null command ID', () => {
            test('a single-chord keybinding with an empty string command ID unbinds the keybinding (shouldPreventDefault = false)', () => {
                const kbService = createTestKeybindingService([
                    kbItem(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 'myCommand'),
                    kbItem(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, ''),
                ]);
                // send Ctrl/Cmd + K
                currentContextValue = createContext({});
                const shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
                assert.deepStrictEqual(shouldPreventDefault, false);
                assert.deepStrictEqual(executeCommandCalls, []);
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, []);
                assert.deepStrictEqual(statusMessageCallsDisposed, []);
                kbService.dispose();
            });
            test('a single-chord keybinding with a null command ID unbinds the keybinding (shouldPreventDefault = false)', () => {
                const kbService = createTestKeybindingService([
                    kbItem(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 'myCommand'),
                    kbItem(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, null),
                ]);
                // send Ctrl/Cmd + K
                currentContextValue = createContext({});
                const shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
                assert.deepStrictEqual(shouldPreventDefault, false);
                assert.deepStrictEqual(executeCommandCalls, []);
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, []);
                assert.deepStrictEqual(statusMessageCallsDisposed, []);
                kbService.dispose();
            });
            test('a multi-chord keybinding with an empty-string command ID keeps the keybinding (shouldPreventDefault = true)', () => {
                const chord0 = 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */;
                const chord1 = 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */;
                const key = [chord0, chord1];
                const kbService = createTestKeybindingService([
                    kbItem(key, 'myCommand'),
                    kbItem(key, ''),
                ]);
                currentContextValue = createContext({});
                let shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
                assert.deepStrictEqual(shouldPreventDefault, true);
                assert.deepStrictEqual(executeCommandCalls, []);
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`]));
                assert.deepStrictEqual(statusMessageCallsDisposed, []);
                shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */);
                assert.deepStrictEqual(shouldPreventDefault, true);
                assert.deepStrictEqual(executeCommandCalls, []);
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`, `The key combination (${toUsLabel(chord0)}, ${toUsLabel(chord1)}) is not a command.`]));
                assert.deepStrictEqual(statusMessageCallsDisposed, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`]));
                kbService.dispose();
            });
            test('a multi-chord keybinding with a null command ID keeps the keybinding (shouldPreventDefault = true)', () => {
                const chord0 = 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */;
                const chord1 = 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */;
                const key = [chord0, chord1];
                const kbService = createTestKeybindingService([
                    kbItem(key, 'myCommand'),
                    kbItem(key, null),
                ]);
                currentContextValue = createContext({});
                let shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
                assert.deepStrictEqual(shouldPreventDefault, true);
                assert.deepStrictEqual(executeCommandCalls, []);
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`]));
                assert.deepStrictEqual(statusMessageCallsDisposed, []);
                shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */);
                assert.deepStrictEqual(shouldPreventDefault, true);
                assert.deepStrictEqual(executeCommandCalls, []);
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`, `The key combination (${toUsLabel(chord0)}, ${toUsLabel(chord1)}) is not a command.`]));
                assert.deepStrictEqual(statusMessageCallsDisposed, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`]));
                kbService.dispose();
            });
        });
        test('issue #16498: chord mode is quit for invalid chords', () => {
            const kbService = createTestKeybindingService([
                kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */), 'chordCommand'),
                kbItem(1 /* KeyCode.Backspace */, 'simpleCommand'),
            ]);
            // send Ctrl/Cmd + K
            let shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
            assert.strictEqual(shouldPreventDefault, true);
            assert.deepStrictEqual(executeCommandCalls, []);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, [
                `(${toUsLabel(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */)}) was pressed. Waiting for second key of chord...`
            ]);
            assert.deepStrictEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send backspace
            shouldPreventDefault = kbService.testDispatch(1 /* KeyCode.Backspace */);
            assert.strictEqual(shouldPreventDefault, true);
            assert.deepStrictEqual(executeCommandCalls, []);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, [
                `The key combination (${toUsLabel(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */)}, ${toUsLabel(1 /* KeyCode.Backspace */)}) is not a command.`
            ]);
            assert.deepStrictEqual(statusMessageCallsDisposed, [
                `(${toUsLabel(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */)}) was pressed. Waiting for second key of chord...`
            ]);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send backspace
            shouldPreventDefault = kbService.testDispatch(1 /* KeyCode.Backspace */);
            assert.strictEqual(shouldPreventDefault, true);
            assert.deepStrictEqual(executeCommandCalls, [{
                    commandId: 'simpleCommand',
                    args: [null]
                }]);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, []);
            assert.deepStrictEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            kbService.dispose();
        });
        test('issue #16833: Keybinding service should not testDispatch on modifier keys', () => {
            const kbService = createTestKeybindingService([
                kbItem(5 /* KeyCode.Ctrl */, 'nope'),
                kbItem(57 /* KeyCode.Meta */, 'nope'),
                kbItem(6 /* KeyCode.Alt */, 'nope'),
                kbItem(4 /* KeyCode.Shift */, 'nope'),
                kbItem(2048 /* KeyMod.CtrlCmd */, 'nope'),
                kbItem(256 /* KeyMod.WinCtrl */, 'nope'),
                kbItem(512 /* KeyMod.Alt */, 'nope'),
                kbItem(1024 /* KeyMod.Shift */, 'nope'),
            ]);
            function assertIsIgnored(keybinding) {
                const shouldPreventDefault = kbService.testDispatch(keybinding);
                assert.strictEqual(shouldPreventDefault, false);
                assert.deepStrictEqual(executeCommandCalls, []);
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, []);
                assert.deepStrictEqual(statusMessageCallsDisposed, []);
                executeCommandCalls = [];
                showMessageCalls = [];
                statusMessageCalls = [];
                statusMessageCallsDisposed = [];
            }
            assertIsIgnored(5 /* KeyCode.Ctrl */);
            assertIsIgnored(57 /* KeyCode.Meta */);
            assertIsIgnored(6 /* KeyCode.Alt */);
            assertIsIgnored(4 /* KeyCode.Shift */);
            assertIsIgnored(2048 /* KeyMod.CtrlCmd */);
            assertIsIgnored(256 /* KeyMod.WinCtrl */);
            assertIsIgnored(512 /* KeyMod.Alt */);
            assertIsIgnored(1024 /* KeyMod.Shift */);
            kbService.dispose();
        });
        test('can trigger command that is sharing keybinding with chord', () => {
            const kbService = createTestKeybindingService([
                kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */), 'chordCommand'),
                kbItem(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 'simpleCommand', contextkey_1.ContextKeyExpr.has('key1')),
            ]);
            // send Ctrl/Cmd + K
            currentContextValue = createContext({
                key1: true
            });
            let shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
            assert.strictEqual(shouldPreventDefault, true);
            assert.deepStrictEqual(executeCommandCalls, [{
                    commandId: 'simpleCommand',
                    args: [null]
                }]);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, []);
            assert.deepStrictEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send Ctrl/Cmd + K
            currentContextValue = createContext({});
            shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
            assert.strictEqual(shouldPreventDefault, true);
            assert.deepStrictEqual(executeCommandCalls, []);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, [
                `(${toUsLabel(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */)}) was pressed. Waiting for second key of chord...`
            ]);
            assert.deepStrictEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send Ctrl/Cmd + X
            currentContextValue = createContext({});
            shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */);
            assert.strictEqual(shouldPreventDefault, true);
            assert.deepStrictEqual(executeCommandCalls, [{
                    commandId: 'chordCommand',
                    args: [null]
                }]);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, []);
            assert.deepStrictEqual(statusMessageCallsDisposed, [
                `(${toUsLabel(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */)}) was pressed. Waiting for second key of chord...`
            ]);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            kbService.dispose();
        });
        test('cannot trigger chord if command is overwriting', () => {
            const kbService = createTestKeybindingService([
                kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */), 'chordCommand', contextkey_1.ContextKeyExpr.has('key1')),
                kbItem(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 'simpleCommand'),
            ]);
            // send Ctrl/Cmd + K
            currentContextValue = createContext({});
            let shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
            assert.strictEqual(shouldPreventDefault, true);
            assert.deepStrictEqual(executeCommandCalls, [{
                    commandId: 'simpleCommand',
                    args: [null]
                }]);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, []);
            assert.deepStrictEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send Ctrl/Cmd + K
            currentContextValue = createContext({
                key1: true
            });
            shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
            assert.strictEqual(shouldPreventDefault, true);
            assert.deepStrictEqual(executeCommandCalls, [{
                    commandId: 'simpleCommand',
                    args: [null]
                }]);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, []);
            assert.deepStrictEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send Ctrl/Cmd + X
            currentContextValue = createContext({
                key1: true
            });
            shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */);
            assert.strictEqual(shouldPreventDefault, false);
            assert.deepStrictEqual(executeCommandCalls, []);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, []);
            assert.deepStrictEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            kbService.dispose();
        });
        test('can have spying command', () => {
            const kbService = createTestKeybindingService([
                kbItem(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, '^simpleCommand'),
            ]);
            // send Ctrl/Cmd + K
            currentContextValue = createContext({});
            const shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
            assert.strictEqual(shouldPreventDefault, false);
            assert.deepStrictEqual(executeCommandCalls, [{
                    commandId: 'simpleCommand',
                    args: [null]
                }]);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, []);
            assert.deepStrictEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            kbService.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RLZXliaW5kaW5nU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9rZXliaW5kaW5nL3Rlc3QvY29tbW9uL2Fic3RyYWN0S2V5YmluZGluZ1NlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUF1QkEsU0FBUyxhQUFhLENBQUMsR0FBUTtRQUM5QixPQUFPO1lBQ04sUUFBUSxFQUFFLENBQUMsR0FBVyxFQUFFLEVBQUU7Z0JBQ3pCLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLENBQUM7U0FDRCxDQUFDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7UUFFdkMsTUFBTSxxQkFBc0IsU0FBUSxxREFBeUI7WUFHNUQsWUFDQyxRQUE0QixFQUM1QixpQkFBcUMsRUFDckMsY0FBK0IsRUFDL0IsbUJBQXlDO2dCQUV6QyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsY0FBYyxFQUFFLHFDQUFvQixFQUFFLG1CQUFtQixFQUFFLElBQUksb0JBQWMsRUFBRSxDQUFDLENBQUM7Z0JBQzFHLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1lBQzNCLENBQUM7WUFFUyxZQUFZO2dCQUNyQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDdkIsQ0FBQztZQUVTLGlCQUFpQjtnQkFDMUIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRU0saUJBQWlCLENBQUMsRUFBYztnQkFDdEMsT0FBTyx1REFBMEIsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsYUFBRSxDQUFDLENBQUM7WUFDN0QsQ0FBQztZQUVNLG9CQUFvQixDQUFDLGFBQTZCO2dCQUN4RCxNQUFNLEtBQUssR0FBRyxJQUFJLDBCQUFZLENBQzdCLGFBQWEsQ0FBQyxP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