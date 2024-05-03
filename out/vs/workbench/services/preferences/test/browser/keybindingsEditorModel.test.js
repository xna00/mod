/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uuid", "vs/base/common/platform", "vs/base/common/keybindings", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/extensions/common/extensions", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/preferences/browser/keybindingsEditorModel", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/actions/common/actions", "vs/platform/extensions/common/extensions", "vs/base/test/common/utils"], function (require, exports, assert, uuid, platform_1, keybindings_1, commands_1, keybinding_1, extensions_1, contextkey_1, keybindingsEditorModel_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1, instantiationServiceMock_1, actions_1, extensions_2, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('KeybindingsEditorModel', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        let testObject;
        let extensions = [];
        setup(() => {
            extensions = [];
            instantiationService = disposables.add(new instantiationServiceMock_1.TestInstantiationService());
            instantiationService.stub(keybinding_1.IKeybindingService, {});
            instantiationService.stub(extensions_1.IExtensionService, {
                whenInstalledExtensionsRegistered: () => Promise.resolve(true),
                get extensions() { return extensions; }
            });
            testObject = disposables.add(instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, platform_1.OS));
            disposables.add(commands_1.CommandsRegistry.registerCommand('command_without_keybinding', () => { }));
        });
        test('fetch returns default keybindings', async () => {
            const expected = prepareKeybindingService(aResolvedKeybindingItem({ command: 'a' + uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'b' + uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */ }, secondChord: { keyCode: 9 /* KeyCode.Escape */ } }));
            await testObject.resolve(new Map());
            const actuals = asResolvedKeybindingItems(testObject.fetch(''));
            assertKeybindingItems(actuals, expected);
        });
        test('fetch returns distinct keybindings', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = prepareKeybindingService(aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */ } }));
            await testObject.resolve(new Map());
            const actuals = asResolvedKeybindingItems(testObject.fetch(''));
            assertKeybindingItems(actuals, [expected[0]]);
        });
        test('fetch returns default keybindings at the top', async () => {
            const expected = prepareKeybindingService(aResolvedKeybindingItem({ command: 'a' + uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'b' + uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */ }, secondChord: { keyCode: 9 /* KeyCode.Escape */ } }));
            await testObject.resolve(new Map());
            const actuals = asResolvedKeybindingItems(testObject.fetch('').slice(0, 2), true);
            assertKeybindingItems(actuals, expected);
        });
        test('fetch returns default keybindings sorted by command id', async () => {
            const keybindings = prepareKeybindingService(aResolvedKeybindingItem({ command: 'b' + uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'c' + uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */ }, secondChord: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'a' + uuid.generateUuid(), firstChord: { keyCode: 1 /* KeyCode.Backspace */ } }));
            const expected = [keybindings[2], keybindings[0], keybindings[1]];
            await testObject.resolve(new Map());
            const actuals = asResolvedKeybindingItems(testObject.fetch(''));
            assertKeybindingItems(actuals, expected);
        });
        test('fetch returns user keybinding first if default and user has same id', async () => {
            const sameId = 'b' + uuid.generateUuid();
            const keybindings = prepareKeybindingService(aResolvedKeybindingItem({ command: sameId, firstChord: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: sameId, firstChord: { keyCode: 9 /* KeyCode.Escape */ }, secondChord: { keyCode: 9 /* KeyCode.Escape */ }, isDefault: false }));
            const expected = [keybindings[1], keybindings[0]];
            await testObject.resolve(new Map());
            const actuals = asResolvedKeybindingItems(testObject.fetch(''));
            assertKeybindingItems(actuals, expected);
        });
        test('fetch returns keybinding with titles first', async () => {
            const keybindings = prepareKeybindingService(aResolvedKeybindingItem({ command: 'a' + uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'b' + uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */ }, secondChord: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'c' + uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */ }, secondChord: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'd' + uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */ }, secondChord: { keyCode: 9 /* KeyCode.Escape */ } }));
            registerCommandWithTitle(keybindings[1].command, 'B Title');
            registerCommandWithTitle(keybindings[3].command, 'A Title');
            const expected = [keybindings[3], keybindings[1], keybindings[0], keybindings[2]];
            instantiationService.stub(keybinding_1.IKeybindingService, 'getKeybindings', () => keybindings);
            instantiationService.stub(keybinding_1.IKeybindingService, 'getDefaultKeybindings', () => keybindings);
            await testObject.resolve(new Map());
            const actuals = asResolvedKeybindingItems(testObject.fetch(''));
            assertKeybindingItems(actuals, expected);
        });
        test('fetch returns keybinding with user first if title and id matches', async () => {
            const sameId = 'b' + uuid.generateUuid();
            const keybindings = prepareKeybindingService(aResolvedKeybindingItem({ command: 'a' + uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: sameId, firstChord: { keyCode: 9 /* KeyCode.Escape */ }, secondChord: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'c' + uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */ }, secondChord: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: sameId, firstChord: { keyCode: 9 /* KeyCode.Escape */ }, isDefault: false }));
            registerCommandWithTitle(keybindings[1].command, 'Same Title');
            const expected = [keybindings[3], keybindings[1], keybindings[0], keybindings[2]];
            await testObject.resolve(new Map());
            const actuals = asResolvedKeybindingItems(testObject.fetch(''));
            assertKeybindingItems(actuals, expected);
        });
        test('fetch returns default keybindings sorted by precedence', async () => {
            const expected = prepareKeybindingService(aResolvedKeybindingItem({ command: 'b' + uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'c' + uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */ }, secondChord: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'a' + uuid.generateUuid(), firstChord: { keyCode: 1 /* KeyCode.Backspace */ } }));
            await testObject.resolve(new Map());
            const actuals = asResolvedKeybindingItems(testObject.fetch('', true));
            assertKeybindingItems(actuals, expected);
        });
        test('convert keybinding without title to entry', async () => {
            const expected = aResolvedKeybindingItem({ command: 'a' + uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */ }, when: 'context1 && context2' });
            prepareKeybindingService(expected);
            await testObject.resolve(new Map());
            const actual = testObject.fetch('')[0];
            assert.strictEqual(actual.keybindingItem.command, expected.command);
            assert.strictEqual(actual.keybindingItem.commandLabel, '');
            assert.strictEqual(actual.keybindingItem.commandDefaultLabel, null);
            assert.strictEqual(actual.keybindingItem.keybinding.getAriaLabel(), expected.resolvedKeybinding.getAriaLabel());
            assert.strictEqual(actual.keybindingItem.when, expected.when.serialize());
        });
        test('convert keybinding with title to entry', async () => {
            const expected = aResolvedKeybindingItem({ command: 'a' + uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */ }, when: 'context1 && context2' });
            prepareKeybindingService(expected);
            registerCommandWithTitle(expected.command, 'Some Title');
            await testObject.resolve(new Map());
            const actual = testObject.fetch('')[0];
            assert.strictEqual(actual.keybindingItem.command, expected.command);
            assert.strictEqual(actual.keybindingItem.commandLabel, 'Some Title');
            assert.strictEqual(actual.keybindingItem.commandDefaultLabel, null);
            assert.strictEqual(actual.keybindingItem.keybinding.getAriaLabel(), expected.resolvedKeybinding.getAriaLabel());
            assert.strictEqual(actual.keybindingItem.when, expected.when.serialize());
        });
        test('convert without title and binding to entry', async () => {
            disposables.add(commands_1.CommandsRegistry.registerCommand('command_without_keybinding', () => { }));
            prepareKeybindingService();
            await testObject.resolve(new Map());
            const actual = testObject.fetch('').filter(element => element.keybindingItem.command === 'command_without_keybinding')[0];
            assert.strictEqual(actual.keybindingItem.command, 'command_without_keybinding');
            assert.strictEqual(actual.keybindingItem.commandLabel, '');
            assert.strictEqual(actual.keybindingItem.commandDefaultLabel, null);
            assert.strictEqual(actual.keybindingItem.keybinding, undefined);
            assert.strictEqual(actual.keybindingItem.when, '');
        });
        test('convert with title and without binding to entry', async () => {
            const id = 'a' + uuid.generateUuid();
            registerCommandWithTitle(id, 'some title');
            prepareKeybindingService();
            await testObject.resolve(new Map());
            const actual = testObject.fetch('').filter(element => element.keybindingItem.command === id)[0];
            assert.strictEqual(actual.keybindingItem.command, id);
            assert.strictEqual(actual.keybindingItem.commandLabel, 'some title');
            assert.strictEqual(actual.keybindingItem.commandDefaultLabel, null);
            assert.strictEqual(actual.keybindingItem.keybinding, undefined);
            assert.strictEqual(actual.keybindingItem.when, '');
        });
        test('filter by command id', async () => {
            const id = 'workbench.action.increaseViewSize';
            registerCommandWithTitle(id, 'some title');
            prepareKeybindingService();
            await testObject.resolve(new Map());
            const actual = testObject.fetch('workbench action view size').filter(element => element.keybindingItem.command === id)[0];
            assert.ok(actual);
        });
        test('filter by command title', async () => {
            const id = 'a' + uuid.generateUuid();
            registerCommandWithTitle(id, 'Increase view size');
            prepareKeybindingService();
            await testObject.resolve(new Map());
            const actual = testObject.fetch('increase size').filter(element => element.keybindingItem.command === id)[0];
            assert.ok(actual);
        });
        test('filter by system source', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */ }, when: 'context1 && context2' });
            prepareKeybindingService(expected);
            await testObject.resolve(new Map());
            const actual = testObject.fetch('system').filter(element => element.keybindingItem.command === command)[0];
            assert.ok(actual);
        });
        test('filter by user source', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */ }, when: 'context1 && context2', isDefault: false });
            prepareKeybindingService(expected);
            await testObject.resolve(new Map());
            const actual = testObject.fetch('user').filter(element => element.keybindingItem.command === command)[0];
            assert.ok(actual);
        });
        test('filter by default source with "@source: " prefix', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */ }, when: 'context1 && context2', isDefault: true });
            prepareKeybindingService(expected);
            await testObject.resolve(new Map());
            const actual = testObject.fetch('@source: default').filter(element => element.keybindingItem.command === command)[0];
            assert.ok(actual);
        });
        test('filter by user source with "@source: " prefix', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */ }, when: 'context1 && context2', isDefault: false });
            prepareKeybindingService(expected);
            await testObject.resolve(new Map());
            const actual = testObject.fetch('@source: user').filter(element => element.keybindingItem.command === command)[0];
            assert.ok(actual);
        });
        test('filter by command prefix with different commands', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */ }, when: 'context1 && context2', isDefault: true });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command: uuid.generateUuid(), firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, when: 'whenContext1 && whenContext2', isDefault: true }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch(`@command:${command}`);
            assert.strictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].keybindingItem.command, command);
        });
        test('filter by command prefix with same commands', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */ }, when: 'context1 && context2', isDefault: true });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, when: 'whenContext1 && whenContext2', isDefault: true }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch(`@command:${command}`);
            assert.strictEqual(actual.length, 2);
            assert.deepStrictEqual(actual[0].keybindingItem.command, command);
            assert.deepStrictEqual(actual[1].keybindingItem.command, command);
        });
        test('filter by when context', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */ }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected);
            await testObject.resolve(new Map());
            const actual = testObject.fetch('when context').filter(element => element.keybindingItem.command === command)[0];
            assert.ok(actual);
        });
        test('filter by cmd key', async () => {
            testObject = disposables.add(instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */));
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected);
            await testObject.resolve(new Map());
            const actual = testObject.fetch('cmd').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { metaKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by meta key', async () => {
            testObject = disposables.add(instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */));
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('meta').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { metaKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by command key', async () => {
            testObject = disposables.add(instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */));
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('command').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { metaKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by windows key', async () => {
            testObject = disposables.add(instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 1 /* OperatingSystem.Windows */));
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('windows').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { metaKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by alt key', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('alt').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { altKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by option key', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('option').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { altKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by ctrl key', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('ctrl').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { ctrlKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by control key', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('control').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { ctrlKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by shift key', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('shift').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { shiftKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by arrow', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 17 /* KeyCode.RightArrow */, modifiers: { shiftKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('arrow').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by modifier and key', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 17 /* KeyCode.RightArrow */, modifiers: { altKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 17 /* KeyCode.RightArrow */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('alt right').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { altKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by key and modifier', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 17 /* KeyCode.RightArrow */, modifiers: { altKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 17 /* KeyCode.RightArrow */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('right alt').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(0, actual.length);
        });
        test('filter by modifiers and key', async () => {
            testObject = disposables.add(instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */));
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true, metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('alt cmd esc').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { altKey: true, metaKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by modifiers in random order and key', async () => {
            testObject = disposables.add(instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */));
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('cmd shift esc').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { metaKey: true, shiftKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by first part', async () => {
            testObject = disposables.add(instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */));
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, secondChord: { keyCode: 20 /* KeyCode.Delete */ }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('cmd shift esc').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { metaKey: true, shiftKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter matches in chord part', async () => {
            testObject = disposables.add(instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */));
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, secondChord: { keyCode: 20 /* KeyCode.Delete */ }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('cmd del').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { metaKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, { keyCode: true });
        });
        test('filter matches first part and in chord part', async () => {
            testObject = disposables.add(instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */));
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, secondChord: { keyCode: 20 /* KeyCode.Delete */ }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, secondChord: { keyCode: 16 /* KeyCode.UpArrow */ }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('cmd shift esc del').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { shiftKey: true, metaKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, { keyCode: true });
        });
        test('filter exact matches', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, secondChord: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('"ctrl c"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { ctrlKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter exact matches with first and chord part', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, secondChord: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('"shift meta escape ctrl c"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { shiftKey: true, metaKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, { ctrlKey: true, keyCode: true });
        });
        test('filter exact matches with first and chord part no results', async () => {
            testObject = disposables.add(instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */));
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, secondChord: { keyCode: 20 /* KeyCode.Delete */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, secondChord: { keyCode: 16 /* KeyCode.UpArrow */ }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('"cmd shift esc del"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(0, actual.length);
        });
        test('filter matches with + separator', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, secondChord: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('"control+c"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { ctrlKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by keybinding prefix', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, secondChord: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('@keybinding:control+c').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { ctrlKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter matches with + separator in first and chord parts', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, secondChord: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('"shift+meta+escape ctrl+c"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { shiftKey: true, metaKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, { keyCode: true, ctrlKey: true });
        });
        test('filter by keybinding prefix with chord', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, secondChord: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('@keybinding:"shift+meta+escape ctrl+c"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { shiftKey: true, metaKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, { keyCode: true, ctrlKey: true });
        });
        test('filter exact matches with space #32993', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 10 /* KeyCode.Space */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 1 /* KeyCode.Backspace */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('"ctrl+space"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
        });
        test('filter exact matches with user settings label', async () => {
            testObject = disposables.add(instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */));
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 18 /* KeyCode.DownArrow */ } });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command: 'down', firstChord: { keyCode: 9 /* KeyCode.Escape */ } }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('"down"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { keyCode: true });
        });
        test('filter exact matches also return chords', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 41 /* KeyCode.KeyK */, modifiers: { ctrlKey: true } }, secondChord: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, secondChord: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('"control+k"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { ctrlKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter modifiers are not matched when not completely matched (prefix)', async () => {
            testObject = disposables.add(instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */));
            const term = `alt.${uuid.generateUuid()}`;
            const command = `command.${term}`;
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */ }, isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command: 'some_command', firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch(term);
            assert.strictEqual(1, actual.length);
            assert.strictEqual(command, actual[0].keybindingItem.command);
            assert.strictEqual(1, actual[0].commandIdMatches?.length);
        });
        test('filter modifiers are not matched when not completely matched (includes)', async () => {
            testObject = disposables.add(instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */));
            const term = `abcaltdef.${uuid.generateUuid()}`;
            const command = `command.${term}`;
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */ }, isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command: 'some_command', firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch(term);
            assert.strictEqual(1, actual.length);
            assert.strictEqual(command, actual[0].keybindingItem.command);
            assert.strictEqual(1, actual[0].commandIdMatches?.length);
        });
        test('filter modifiers are matched with complete term', async () => {
            testObject = disposables.add(instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */));
            const command = `command.${uuid.generateUuid()}`;
            const expected = aResolvedKeybindingItem({ command, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command: 'some_command', firstChord: { keyCode: 9 /* KeyCode.Escape */ }, isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('alt').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { altKey: true });
        });
        test('filter by extension', async () => {
            testObject = disposables.add(instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */));
            const command1 = `command.${uuid.generateUuid()}`;
            const command2 = `command.${uuid.generateUuid()}`;
            extensions.push({ identifier: new extensions_2.ExtensionIdentifier('foo'), displayName: 'foo bar' }, { identifier: new extensions_2.ExtensionIdentifier('bar'), displayName: 'bar foo' });
            disposables.add(actions_1.MenuRegistry.addCommand({ id: command2, title: 'title', category: 'category', source: { id: extensions[1].identifier.value, title: extensions[1].displayName } }));
            const expected = aResolvedKeybindingItem({ command: command1, firstChord: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, isDefault: true, extensionId: extensions[0].identifier.value });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command: command2, isDefault: true }));
            await testObject.resolve(new Map());
            let actual = testObject.fetch('@ext:foo');
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingItem.command, command1);
            actual = testObject.fetch('@ext:"bar foo"');
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingItem.command, command2);
        });
        function prepareKeybindingService(...keybindingItems) {
            instantiationService.stub(keybinding_1.IKeybindingService, 'getKeybindings', () => keybindingItems);
            instantiationService.stub(keybinding_1.IKeybindingService, 'getDefaultKeybindings', () => keybindingItems);
            return keybindingItems;
        }
        function registerCommandWithTitle(command, title) {
            disposables.add((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: command,
                        title: { value: title, original: title },
                        f1: true
                    });
                }
                async run() { }
            }));
        }
        function assertKeybindingItems(actual, expected) {
            assert.strictEqual(actual.length, expected.length);
            for (let i = 0; i < actual.length; i++) {
                assertKeybindingItem(actual[i], expected[i]);
            }
        }
        function assertKeybindingItem(actual, expected) {
            assert.strictEqual(actual.command, expected.command);
            if (actual.when) {
                assert.ok(!!expected.when);
                assert.strictEqual(actual.when.serialize(), expected.when.serialize());
            }
            else {
                assert.ok(!expected.when);
            }
            assert.strictEqual(actual.isDefault, expected.isDefault);
            if (actual.resolvedKeybinding) {
                assert.ok(!!expected.resolvedKeybinding);
                assert.strictEqual(actual.resolvedKeybinding.getLabel(), expected.resolvedKeybinding.getLabel());
            }
            else {
                assert.ok(!expected.resolvedKeybinding);
            }
        }
        function aResolvedKeybindingItem({ command, when, isDefault, firstChord, secondChord, extensionId }) {
            const aSimpleKeybinding = function (chord) {
                const { ctrlKey, shiftKey, altKey, metaKey } = chord.modifiers || { ctrlKey: false, shiftKey: false, altKey: false, metaKey: false };
                return new keybindings_1.KeyCodeChord(ctrlKey, shiftKey, altKey, metaKey, chord.keyCode);
            };
            const chords = [];
            if (firstChord) {
                chords.push(aSimpleKeybinding(firstChord));
                if (secondChord) {
                    chords.push(aSimpleKeybinding(secondChord));
                }
            }
            const keybinding = chords.length > 0 ? new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(chords, platform_1.OS) : undefined;
            return new resolvedKeybindingItem_1.ResolvedKeybindingItem(keybinding, command || 'some command', null, when ? contextkey_1.ContextKeyExpr.deserialize(when) : undefined, isDefault === undefined ? true : isDefault, extensionId ?? null, false);
        }
        function asResolvedKeybindingItems(keybindingEntries, keepUnassigned = false) {
            if (!keepUnassigned) {
                keybindingEntries = keybindingEntries.filter(keybindingEntry => !!keybindingEntry.keybindingItem.keybinding);
            }
            return keybindingEntries.map(entry => entry.keybindingItem.keybindingItem);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3NFZGl0b3JNb2RlbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvcHJlZmVyZW5jZXMvdGVzdC9icm93c2VyL2tleWJpbmRpbmdzRWRpdG9yTW9kZWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTRCaEcsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtRQUVwQyxNQUFNLFdBQVcsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFDOUQsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLFVBQWtDLENBQUM7UUFDdkMsSUFBSSxVQUFVLEdBQXFDLEVBQUUsQ0FBQztRQUV0RCxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsVUFBVSxHQUFHLEVBQUUsQ0FBQztZQUNoQixvQkFBb0IsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksbURBQXdCLEVBQUUsQ0FBQyxDQUFDO1lBRXZFLG9CQUFvQixDQUFDLElBQUksQ0FBQywrQkFBa0IsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNsRCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsOEJBQWlCLEVBQUU7Z0JBQzVDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUM5RCxJQUFJLFVBQVUsS0FBSyxPQUFPLFVBQXFDLENBQUMsQ0FBQyxDQUFDO2FBQ2xFLENBQUMsQ0FBQztZQUNILFVBQVUsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywrQ0FBc0IsRUFBRSxhQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTlGLFdBQVcsQ0FBQyxHQUFHLENBQUMsMkJBQWdCLENBQUMsZUFBZSxDQUFDLDRCQUE0QixF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