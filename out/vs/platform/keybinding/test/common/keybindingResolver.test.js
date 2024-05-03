/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/keybindings", "vs/base/common/keyCodes", "vs/base/common/platform", "vs/base/test/common/utils", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/platform/keybinding/test/common/keybindingsTestUtils"], function (require, exports, assert, keybindings_1, keyCodes_1, platform_1, utils_1, contextkey_1, keybindingResolver_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1, keybindingsTestUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createContext(ctx) {
        return {
            getValue: (key) => {
                return ctx[key];
            }
        };
    }
    suite('KeybindingResolver', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function kbItem(keybinding, command, commandArgs, when, isDefault) {
            const resolvedKeybinding = (0, keybindingsTestUtils_1.createUSLayoutResolvedKeybinding)(keybinding, platform_1.OS);
            return new resolvedKeybindingItem_1.ResolvedKeybindingItem(resolvedKeybinding, command, commandArgs, when, isDefault, null, false);
        }
        function getDispatchStr(chord) {
            return usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding.getDispatchStr(chord);
        }
        test('resolve key', () => {
            const keybinding = 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 56 /* KeyCode.KeyZ */;
            const runtimeKeybinding = (0, keybindings_1.createSimpleKeybinding)(keybinding, platform_1.OS);
            const contextRules = contextkey_1.ContextKeyExpr.equals('bar', 'baz');
            const keybindingItem = kbItem(keybinding, 'yes', null, contextRules, true);
            assert.strictEqual(contextRules.evaluate(createContext({ bar: 'baz' })), true);
            assert.strictEqual(contextRules.evaluate(createContext({ bar: 'bz' })), false);
            const resolver = new keybindingResolver_1.KeybindingResolver([keybindingItem], [], () => { });
            const r1 = resolver.resolve(createContext({ bar: 'baz' }), [], getDispatchStr(runtimeKeybinding));
            assert.ok(r1.kind === 2 /* ResultKind.KbFound */);
            assert.strictEqual(r1.commandId, 'yes');
            const r2 = resolver.resolve(createContext({ bar: 'bz' }), [], getDispatchStr(runtimeKeybinding));
            assert.strictEqual(r2.kind, 0 /* ResultKind.NoMatchingKb */);
        });
        test('resolve key with arguments', () => {
            const commandArgs = { text: 'no' };
            const keybinding = 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 56 /* KeyCode.KeyZ */;
            const runtimeKeybinding = (0, keybindings_1.createSimpleKeybinding)(keybinding, platform_1.OS);
            const contextRules = contextkey_1.ContextKeyExpr.equals('bar', 'baz');
            const keybindingItem = kbItem(keybinding, 'yes', commandArgs, contextRules, true);
            const resolver = new keybindingResolver_1.KeybindingResolver([keybindingItem], [], () => { });
            const r = resolver.resolve(createContext({ bar: 'baz' }), [], getDispatchStr(runtimeKeybinding));
            assert.ok(r.kind === 2 /* ResultKind.KbFound */);
            assert.strictEqual(r.commandArgs, commandArgs);
        });
        suite('handle keybinding removals', () => {
            test('simple 1', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true)
                ];
                const overrides = [
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), false),
                ]);
            });
            test('simple 2', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ];
                const overrides = [
                    kbItem(33 /* KeyCode.KeyC */, 'yes3', null, contextkey_1.ContextKeyExpr.equals('3', 'c'), false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true),
                    kbItem(33 /* KeyCode.KeyC */, 'yes3', null, contextkey_1.ContextKeyExpr.equals('3', 'c'), false),
                ]);
            });
            test('removal with not matching when', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ];
                const overrides = [
                    kbItem(31 /* KeyCode.KeyA */, '-yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'b'), false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ]);
            });
            test('removal with not matching keybinding', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ];
                const overrides = [
                    kbItem(32 /* KeyCode.KeyB */, '-yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ]);
            });
            test('removal with matching keybinding and when', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ];
                const overrides = [
                    kbItem(31 /* KeyCode.KeyA */, '-yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ]);
            });
            test('removal with unspecified keybinding', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ];
                const overrides = [
                    kbItem(0, '-yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ]);
            });
            test('removal with unspecified when', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ];
                const overrides = [
                    kbItem(31 /* KeyCode.KeyA */, '-yes1', null, undefined, false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ]);
            });
            test('removal with unspecified when and unspecified keybinding', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ];
                const overrides = [
                    kbItem(0, '-yes1', null, undefined, false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ]);
            });
            test('issue #138997 - removal in default list', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, undefined, true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, undefined, true),
                    kbItem(0, '-yes1', null, undefined, false)
                ];
                const overrides = [];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, undefined, true)
                ]);
            });
            test('issue #612#issuecomment-222109084 cannot remove keybindings for commands with ^', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, '^yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ];
                const overrides = [
                    kbItem(31 /* KeyCode.KeyA */, '-yes1', null, undefined, false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ]);
            });
            test('issue #140884 Unable to reassign F1 as keybinding for Show All Commands', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'command1', null, undefined, true),
                ];
                const overrides = [
                    kbItem(31 /* KeyCode.KeyA */, '-command1', null, undefined, false),
                    kbItem(31 /* KeyCode.KeyA */, 'command1', null, undefined, false),
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(31 /* KeyCode.KeyA */, 'command1', null, undefined, false)
                ]);
            });
            test('issue #141638: Keyboard Shortcuts: Change When Expression might actually remove keybinding in Insiders', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'command1', null, undefined, true),
                ];
                const overrides = [
                    kbItem(31 /* KeyCode.KeyA */, 'command1', null, contextkey_1.ContextKeyExpr.equals('a', '1'), false),
                    kbItem(31 /* KeyCode.KeyA */, '-command1', null, undefined, false),
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(31 /* KeyCode.KeyA */, 'command1', null, contextkey_1.ContextKeyExpr.equals('a', '1'), false)
                ]);
            });
            test('issue #157751: Auto-quoting of context keys prevents removal of keybindings via UI', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'command1', null, contextkey_1.ContextKeyExpr.deserialize(`editorTextFocus && activeEditor != workbench.editor.notebook && editorLangId in julia.supportedLanguageIds`), true),
                ];
                const overrides = [
                    kbItem(31 /* KeyCode.KeyA */, '-command1', null, contextkey_1.ContextKeyExpr.deserialize(`editorTextFocus && activeEditor != 'workbench.editor.notebook' && editorLangId in 'julia.supportedLanguageIds'`), false),
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, []);
            });
            test('issue #160604: Remove keybindings with when clause does not work', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'command1', null, undefined, true),
                ];
                const overrides = [
                    kbItem(31 /* KeyCode.KeyA */, '-command1', null, contextkey_1.ContextKeyExpr.true(), false),
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, []);
            });
            test('contextIsEntirelyIncluded', () => {
                const toContextKeyExpression = (expr) => {
                    if (typeof expr === 'string' || !expr) {
                        return contextkey_1.ContextKeyExpr.deserialize(expr);
                    }
                    return expr;
                };
                const assertIsIncluded = (a, b) => {
                    assert.strictEqual(keybindingResolver_1.KeybindingResolver.whenIsEntirelyIncluded(toContextKeyExpression(a), toContextKeyExpression(b)), true);
                };
                const assertIsNotIncluded = (a, b) => {
                    assert.strictEqual(keybindingResolver_1.KeybindingResolver.whenIsEntirelyIncluded(toContextKeyExpression(a), toContextKeyExpression(b)), false);
                };
                assertIsIncluded(null, null);
                assertIsIncluded(null, contextkey_1.ContextKeyExpr.true());
                assertIsIncluded(contextkey_1.ContextKeyExpr.true(), null);
                assertIsIncluded(contextkey_1.ContextKeyExpr.true(), contextkey_1.ContextKeyExpr.true());
                assertIsIncluded('key1', null);
                assertIsIncluded('key1', '');
                assertIsIncluded('key1', 'key1');
                assertIsIncluded('key1', contextkey_1.ContextKeyExpr.true());
                assertIsIncluded('!key1', '');
                assertIsIncluded('!key1', '!key1');
                assertIsIncluded('key2', '');
                assertIsIncluded('key2', 'key2');
                assertIsIncluded('key1 && key1 && key2 && key2', 'key2');
                assertIsIncluded('key1 && key2', 'key2');
                assertIsIncluded('key1 && key2', 'key1');
                assertIsIncluded('key1 && key2', '');
                assertIsIncluded('key1', 'key1 || key2');
                assertIsIncluded('key1 || !key1', 'key2 || !key2');
                assertIsIncluded('key1', 'key1 || key2 && key3');
                assertIsNotIncluded('key1', '!key1');
                assertIsNotIncluded('!key1', 'key1');
                assertIsNotIncluded('key1 && key2', 'key3');
                assertIsNotIncluded('key1 && key2', 'key4');
                assertIsNotIncluded('key1', 'key2');
                assertIsNotIncluded('key1 || key2', 'key2');
                assertIsNotIncluded('', 'key2');
                assertIsNotIncluded(null, 'key2');
            });
        });
        suite('resolve command', () => {
            function _kbItem(keybinding, command, when) {
                return kbItem(keybinding, command, null, when, true);
            }
            const items = [
                // This one will never match because its "when" is always overwritten by another one
                _kbItem(54 /* KeyCode.KeyX */, 'first', contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('key1', true), contextkey_1.ContextKeyExpr.notEquals('key2', false))),
                // This one always overwrites first
                _kbItem(54 /* KeyCode.KeyX */, 'second', contextkey_1.ContextKeyExpr.equals('key2', true)),
                // This one is a secondary mapping for `second`
                _kbItem(56 /* KeyCode.KeyZ */, 'second', undefined),
                // This one sometimes overwrites first
                _kbItem(54 /* KeyCode.KeyX */, 'third', contextkey_1.ContextKeyExpr.equals('key3', true)),
                // This one is always overwritten by another one
                _kbItem(2048 /* KeyMod.CtrlCmd */ | 55 /* KeyCode.KeyY */, 'fourth', contextkey_1.ContextKeyExpr.equals('key4', true)),
                // This one overwrites with a chord the previous one
                _kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 55 /* KeyCode.KeyY */, 56 /* KeyCode.KeyZ */), 'fifth', undefined),
                // This one has no keybinding
                _kbItem(0, 'sixth', undefined),
                _kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 51 /* KeyCode.KeyU */), 'seventh', undefined),
                _kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */), 'seventh', undefined),
                _kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 51 /* KeyCode.KeyU */), 'uncomment lines', undefined),
                _kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */), // cmd+k cmd+c
                'comment lines', undefined),
                _kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */), // cmd+g cmd+c
                'unreachablechord', undefined),
                _kbItem(2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */, // cmd+g
                'eleven', undefined),
                _kbItem([2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 31 /* KeyCode.KeyA */, 32 /* KeyCode.KeyB */], // cmd+k a b
                'long multi chord', undefined),
                _kbItem([2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */], // cmd+b cmd+c
                'shadowed by long-multi-chord-2', undefined),
                _kbItem([2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */, 39 /* KeyCode.KeyI */], // cmd+b cmd+c i
                'long-multi-chord-2', undefined)
            ];
            const resolver = new keybindingResolver_1.KeybindingResolver(items, [], () => { });
            const testKbLookupByCommand = (commandId, expectedKeys) => {
                // Test lookup
                const lookupResult = resolver.lookupKeybindings(commandId);
                assert.strictEqual(lookupResult.length, expectedKeys.length, 'Length mismatch @ commandId ' + commandId);
                for (let i = 0, len = lookupResult.length; i < len; i++) {
                    const expected = (0, keybindingsTestUtils_1.createUSLayoutResolvedKeybinding)(expectedKeys[i], platform_1.OS);
                    assert.strictEqual(lookupResult[i].resolvedKeybinding.getUserSettingsLabel(), expected.getUserSettingsLabel(), 'value mismatch @ commandId ' + commandId);
                }
            };
            const testResolve = (ctx, _expectedKey, commandId) => {
                const expectedKeybinding = (0, keybindings_1.decodeKeybinding)(_expectedKey, platform_1.OS);
                const previousChord = [];
                for (let i = 0, len = expectedKeybinding.chords.length; i < len; i++) {
                    const chord = getDispatchStr(expectedKeybinding.chords[i]);
                    const result = resolver.resolve(ctx, previousChord, chord);
                    if (i === len - 1) {
                        // if it's the final chord, then we should find a valid command,
                        // and there should not be a chord.
                        assert.ok(result.kind === 2 /* ResultKind.KbFound */, `Enters multi chord for ${commandId} at chord ${i}`);
                        assert.strictEqual(result.commandId, commandId, `Enters multi chord for ${commandId} at chord ${i}`);
                    }
                    else if (i > 0) {
                        // if this is an intermediate chord, we should not find a valid command,
                        // and there should be an open chord we continue.
                        assert.ok(result.kind === 1 /* ResultKind.MoreChordsNeeded */, `Continues multi chord for ${commandId} at chord ${i}`);
                    }
                    else {
                        // if it's not the final chord and not an intermediate, then we should not
                        // find a valid command, and we should enter a chord.
                        assert.ok(result.kind === 1 /* ResultKind.MoreChordsNeeded */, `Enters multi chord for ${commandId} at chord ${i}`);
                    }
                    previousChord.push(chord);
                }
            };
            test('resolve command - 1', () => {
                testKbLookupByCommand('first', []);
            });
            test('resolve command - 2', () => {
                testKbLookupByCommand('second', [56 /* KeyCode.KeyZ */, 54 /* KeyCode.KeyX */]);
                testResolve(createContext({ key2: true }), 54 /* KeyCode.KeyX */, 'second');
                testResolve(createContext({}), 56 /* KeyCode.KeyZ */, 'second');
            });
            test('resolve command - 3', () => {
                testKbLookupByCommand('third', [54 /* KeyCode.KeyX */]);
                testResolve(createContext({ key3: true }), 54 /* KeyCode.KeyX */, 'third');
            });
            test('resolve command - 4', () => {
                testKbLookupByCommand('fourth', []);
            });
            test('resolve command - 5', () => {
                testKbLookupByCommand('fifth', [(0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 55 /* KeyCode.KeyY */, 56 /* KeyCode.KeyZ */)]);
                testResolve(createContext({}), (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 55 /* KeyCode.KeyY */, 56 /* KeyCode.KeyZ */), 'fifth');
            });
            test('resolve command - 6', () => {
                testKbLookupByCommand('seventh', [(0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */)]);
                testResolve(createContext({}), (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */), 'seventh');
            });
            test('resolve command - 7', () => {
                testKbLookupByCommand('uncomment lines', [(0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 51 /* KeyCode.KeyU */)]);
                testResolve(createContext({}), (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 51 /* KeyCode.KeyU */), 'uncomment lines');
            });
            test('resolve command - 8', () => {
                testKbLookupByCommand('comment lines', [(0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */)]);
                testResolve(createContext({}), (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */), 'comment lines');
            });
            test('resolve command - 9', () => {
                testKbLookupByCommand('unreachablechord', []);
            });
            test('resolve command - 10', () => {
                testKbLookupByCommand('eleven', [2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */]);
                testResolve(createContext({}), 2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */, 'eleven');
            });
            test('resolve command - 11', () => {
                testKbLookupByCommand('sixth', []);
            });
            test('resolve command - 12', () => {
                testKbLookupByCommand('long multi chord', [[2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 31 /* KeyCode.KeyA */, 32 /* KeyCode.KeyB */]]);
                testResolve(createContext({}), [2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 31 /* KeyCode.KeyA */, 32 /* KeyCode.KeyB */], 'long multi chord');
            });
            const emptyContext = createContext({});
            test('KBs having common prefix - the one defined later is returned', () => {
                testResolve(emptyContext, [2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */, 39 /* KeyCode.KeyI */], 'long-multi-chord-2');
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ1Jlc29sdmVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2tleWJpbmRpbmcvdGVzdC9jb21tb24va2V5YmluZGluZ1Jlc29sdmVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsU0FBUyxhQUFhLENBQUMsR0FBUTtRQUM5QixPQUFPO1lBQ04sUUFBUSxFQUFFLENBQUMsR0FBVyxFQUFFLEVBQUU7Z0JBQ3pCLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLENBQUM7U0FDRCxDQUFDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7UUFFaEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLFNBQVMsTUFBTSxDQUFDLFVBQTZCLEVBQUUsT0FBZSxFQUFFLFdBQWdCLEVBQUUsSUFBc0MsRUFBRSxTQUFrQjtZQUMzSSxNQUFNLGtCQUFrQixHQUFHLElBQUEsdURBQWdDLEVBQUMsVUFBVSxFQUFFLGFBQUUsQ0FBQyxDQUFDO1lBQzVFLE9BQU8sSUFBSSwrQ0FBc0IsQ0FDaEMsa0JBQWtCLEVBQ2xCLE9BQU8sRUFDUCxXQUFXLEVBQ1gsSUFBSSxFQUNKLFNBQVMsRUFDVCxJQUFJLEVBQ0osS0FBSyxDQUNMLENBQUM7UUFDSCxDQUFDO1FBRUQsU0FBUyxjQUFjLENBQUMsS0FBbUI7WUFDMUMsT0FBTyx1REFBMEIsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFFLENBQUM7UUFDMUQsQ0FBQztRQUVELElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO1lBQ3hCLE1BQU0sVUFBVSxHQUFHLG1EQUE2Qix3QkFBZSxDQUFDO1lBQ2hFLE1BQU0saUJBQWlCLEdBQUcsSUFBQSxvQ0FBc0IsRUFBQyxVQUFVLEVB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