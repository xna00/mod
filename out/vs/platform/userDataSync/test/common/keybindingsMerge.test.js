/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/userDataSync/common/keybindingsMerge", "vs/platform/userDataSync/test/common/userDataSyncClient"], function (require, exports, assert, utils_1, keybindingsMerge_1, userDataSyncClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('KeybindingsMerge - No Conflicts', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('merge when local and remote are same with one entry', async () => {
            const localContent = stringify([{ key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' }]);
            const remoteContent = stringify([{ key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' }]);
            const actual = await mergeKeybindings(localContent, remoteContent, null);
            assert.ok(!actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, localContent);
        });
        test('merge when local and remote are same with similar when contexts', async () => {
            const localContent = stringify([{ key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' }]);
            const remoteContent = stringify([{ key: 'alt+c', command: 'a', when: '!editorReadonly && editorTextFocus' }]);
            const actual = await mergeKeybindings(localContent, remoteContent, null);
            assert.ok(!actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, localContent);
        });
        test('merge when local and remote has entries in different order', async () => {
            const localContent = stringify([
                { key: 'alt+d', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+a', command: 'a', when: 'editorTextFocus' }
            ]);
            const remoteContent = stringify([
                { key: 'alt+a', command: 'a', when: 'editorTextFocus' },
                { key: 'alt+d', command: 'a', when: 'editorTextFocus && !editorReadonly' }
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, null);
            assert.ok(!actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, localContent);
        });
        test('merge when local and remote are same with multiple entries', async () => {
            const localContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } }
            ]);
            const remoteContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } }
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, null);
            assert.ok(!actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, localContent);
        });
        test('merge when local and remote are same with different base content', async () => {
            const localContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } }
            ]);
            const baseContent = stringify([
                { key: 'ctrl+c', command: 'e' },
                { key: 'shift+d', command: 'd', args: { text: '`' } }
            ]);
            const remoteContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } }
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, baseContent);
            assert.ok(!actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, localContent);
        });
        test('merge when local and remote are same with multiple entries in different order', async () => {
            const localContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } }
            ]);
            const remoteContent = stringify([
                { key: 'cmd+c', command: 'b', args: { text: '`' } },
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, null);
            assert.ok(!actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, localContent);
        });
        test('merge when local and remote are same when remove entry is in different order', async () => {
            const localContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } }
            ]);
            const remoteContent = stringify([
                { key: 'alt+d', command: '-a' },
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, null);
            assert.ok(!actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, localContent);
        });
        test('merge when a new entry is added to remote', async () => {
            const localContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
            ]);
            const remoteContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, null);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, remoteContent);
        });
        test('merge when multiple new entries are added to remote', async () => {
            const localContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
            ]);
            const remoteContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } },
                { key: 'cmd+d', command: 'c' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, null);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, remoteContent);
        });
        test('merge when multiple new entries are added to remote from base and local has not changed', async () => {
            const localContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
            ]);
            const remoteContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } },
                { key: 'cmd+d', command: 'c' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, localContent);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, remoteContent);
        });
        test('merge when an entry is removed from remote from base and local has not changed', async () => {
            const localContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } },
            ]);
            const remoteContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, localContent);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, remoteContent);
        });
        test('merge when an entry (same command) is removed from remote from base and local has not changed', async () => {
            const localContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
            ]);
            const remoteContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, localContent);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, remoteContent);
        });
        test('merge when an entry is updated in remote from base and local has not changed', async () => {
            const localContent = stringify([
                { key: 'alt+d', command: 'a', when: 'editorTextFocus && !editorReadonly' },
            ]);
            const remoteContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, localContent);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, remoteContent);
        });
        test('merge when a command with multiple entries is updated from remote from base and local has not changed', async () => {
            const localContent = stringify([
                { key: 'shift+c', command: 'c' },
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: 'b' },
                { key: 'cmd+c', command: 'a' },
            ]);
            const remoteContent = stringify([
                { key: 'shift+c', command: 'c' },
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: 'b' },
                { key: 'cmd+d', command: 'a' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, localContent);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, remoteContent);
        });
        test('merge when remote has moved forwareded with multiple changes and local stays with base', async () => {
            const localContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } },
                { key: 'alt+d', command: '-a' },
                { key: 'cmd+e', command: 'd' },
                { key: 'cmd+d', command: 'c', when: 'context1' },
            ]);
            const remoteContent = stringify([
                { key: 'alt+d', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'cmd+e', command: 'd' },
                { key: 'alt+d', command: '-a' },
                { key: 'alt+f', command: 'f' },
                { key: 'alt+d', command: '-f' },
                { key: 'cmd+d', command: 'c', when: 'context1' },
                { key: 'cmd+c', command: '-c' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, localContent);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, remoteContent);
        });
        test('merge when a new entry is added to local', async () => {
            const localContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } },
            ]);
            const remoteContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, null);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, localContent);
        });
        test('merge when multiple new entries are added to local', async () => {
            const localContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } },
                { key: 'cmd+d', command: 'c' },
            ]);
            const remoteContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, null);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, localContent);
        });
        test('merge when multiple new entries are added to local from base and remote is not changed', async () => {
            const localContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } },
                { key: 'cmd+d', command: 'c' },
            ]);
            const remoteContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, remoteContent);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, localContent);
        });
        test('merge when an entry is removed from local from base and remote has not changed', async () => {
            const localContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
            ]);
            const remoteContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, remoteContent);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, localContent);
        });
        test('merge when an entry (with same command) is removed from local from base and remote has not changed', async () => {
            const localContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
            ]);
            const remoteContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: '-a' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, remoteContent);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, localContent);
        });
        test('merge when an entry is updated in local from base and remote has not changed', async () => {
            const localContent = stringify([
                { key: 'alt+d', command: 'a', when: 'editorTextFocus' },
            ]);
            const remoteContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, remoteContent);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, localContent);
        });
        test('merge when a command with multiple entries is updated from local from base and remote has not changed', async () => {
            const localContent = stringify([
                { key: 'shift+c', command: 'c' },
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: 'b' },
                { key: 'cmd+c', command: 'a' },
            ]);
            const remoteContent = stringify([
                { key: 'shift+c', command: 'c' },
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+d', command: 'b' },
                { key: 'cmd+d', command: 'a' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, remoteContent);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, localContent);
        });
        test('merge when local has moved forwareded with multiple changes and remote stays with base', async () => {
            const localContent = stringify([
                { key: 'alt+d', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'cmd+e', command: 'd' },
                { key: 'alt+d', command: '-a' },
                { key: 'alt+f', command: 'f' },
                { key: 'alt+d', command: '-f' },
                { key: 'cmd+d', command: 'c', when: 'context1' },
                { key: 'cmd+c', command: '-c' },
            ]);
            const remoteContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'cmd+c', command: 'b', args: { text: '`' } },
                { key: 'alt+d', command: '-a' },
                { key: 'cmd+e', command: 'd' },
                { key: 'cmd+d', command: 'c', when: 'context1' },
            ]);
            const expected = stringify([
                { key: 'alt+d', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'cmd+e', command: 'd' },
                { key: 'alt+d', command: '-a' },
                { key: 'alt+f', command: 'f' },
                { key: 'alt+d', command: '-f' },
                { key: 'cmd+d', command: 'c', when: 'context1' },
                { key: 'cmd+c', command: '-c' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, remoteContent);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, expected);
        });
        test('merge when local and remote has moved forwareded with conflicts', async () => {
            const baseContent = stringify([
                { key: 'alt+d', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'ctrl+c', command: '-a' },
                { key: 'cmd+e', command: 'd' },
                { key: 'alt+a', command: 'f' },
                { key: 'alt+d', command: '-f' },
                { key: 'cmd+d', command: 'c', when: 'context1' },
                { key: 'cmd+c', command: '-c' },
            ]);
            const localContent = stringify([
                { key: 'alt+d', command: '-f' },
                { key: 'cmd+e', command: 'd' },
                { key: 'cmd+c', command: '-c' },
                { key: 'cmd+d', command: 'c', when: 'context1' },
                { key: 'alt+a', command: 'f' },
                { key: 'alt+e', command: 'e' },
            ]);
            const remoteContent = stringify([
                { key: 'alt+a', command: 'f' },
                { key: 'cmd+c', command: '-c' },
                { key: 'cmd+d', command: 'd' },
                { key: 'alt+d', command: '-f' },
                { key: 'alt+c', command: 'c', when: 'context1' },
                { key: 'alt+g', command: 'g', when: 'context2' },
            ]);
            const expected = stringify([
                { key: 'alt+d', command: '-f' },
                { key: 'cmd+d', command: 'd' },
                { key: 'cmd+c', command: '-c' },
                { key: 'alt+c', command: 'c', when: 'context1' },
                { key: 'alt+a', command: 'f' },
                { key: 'alt+e', command: 'e' },
                { key: 'alt+g', command: 'g', when: 'context2' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, baseContent);
            assert.ok(actual.hasChanges);
            assert.ok(!actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, expected);
        });
        test('merge when local and remote with one entry but different value', async () => {
            const localContent = stringify([{ key: 'alt+d', command: 'a', when: 'editorTextFocus && !editorReadonly' }]);
            const remoteContent = stringify([{ key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' }]);
            const actual = await mergeKeybindings(localContent, remoteContent, null);
            assert.ok(actual.hasChanges);
            assert.ok(actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, `[
	{
		"key": "alt+d",
		"command": "a",
		"when": "editorTextFocus && !editorReadonly"
	}
]`);
        });
        test('merge when local and remote with different keybinding', async () => {
            const localContent = stringify([
                { key: 'alt+d', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+a', command: '-a', when: 'editorTextFocus && !editorReadonly' }
            ]);
            const remoteContent = stringify([
                { key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+a', command: '-a', when: 'editorTextFocus && !editorReadonly' }
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, null);
            assert.ok(actual.hasChanges);
            assert.ok(actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, `[
	{
		"key": "alt+d",
		"command": "a",
		"when": "editorTextFocus && !editorReadonly"
	},
	{
		"key": "alt+a",
		"command": "-a",
		"when": "editorTextFocus && !editorReadonly"
	}
]`);
        });
        test('merge when the entry is removed in local but updated in remote', async () => {
            const baseContent = stringify([{ key: 'alt+d', command: 'a', when: 'editorTextFocus && !editorReadonly' }]);
            const localContent = stringify([]);
            const remoteContent = stringify([{ key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' }]);
            const actual = await mergeKeybindings(localContent, remoteContent, baseContent);
            assert.ok(actual.hasChanges);
            assert.ok(actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, `[]`);
        });
        test('merge when the entry is removed in local but updated in remote and a new entry is added in local', async () => {
            const baseContent = stringify([{ key: 'alt+d', command: 'a', when: 'editorTextFocus && !editorReadonly' }]);
            const localContent = stringify([{ key: 'alt+b', command: 'b' }]);
            const remoteContent = stringify([{ key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' }]);
            const actual = await mergeKeybindings(localContent, remoteContent, baseContent);
            assert.ok(actual.hasChanges);
            assert.ok(actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, `[
	{
		"key": "alt+b",
		"command": "b"
	}
]`);
        });
        test('merge when the entry is removed in remote but updated in local', async () => {
            const baseContent = stringify([{ key: 'alt+d', command: 'a', when: 'editorTextFocus && !editorReadonly' }]);
            const localContent = stringify([{ key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' }]);
            const remoteContent = stringify([]);
            const actual = await mergeKeybindings(localContent, remoteContent, baseContent);
            assert.ok(actual.hasChanges);
            assert.ok(actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, `[
	{
		"key": "alt+c",
		"command": "a",
		"when": "editorTextFocus && !editorReadonly"
	}
]`);
        });
        test('merge when the entry is removed in remote but updated in local and a new entry is added in remote', async () => {
            const baseContent = stringify([{ key: 'alt+d', command: 'a', when: 'editorTextFocus && !editorReadonly' }]);
            const localContent = stringify([{ key: 'alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' }]);
            const remoteContent = stringify([{ key: 'alt+b', command: 'b' }]);
            const actual = await mergeKeybindings(localContent, remoteContent, baseContent);
            assert.ok(actual.hasChanges);
            assert.ok(actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, `[
	{
		"key": "alt+c",
		"command": "a",
		"when": "editorTextFocus && !editorReadonly"
	},
	{
		"key": "alt+b",
		"command": "b"
	}
]`);
        });
        test('merge when local and remote has moved forwareded with conflicts (2)', async () => {
            const baseContent = stringify([
                { key: 'alt+d', command: 'a', when: 'editorTextFocus && !editorReadonly' },
                { key: 'alt+c', command: '-a' },
                { key: 'cmd+e', command: 'd' },
                { key: 'alt+a', command: 'f' },
                { key: 'alt+d', command: '-f' },
                { key: 'cmd+d', command: 'c', when: 'context1' },
                { key: 'cmd+c', command: '-c' },
            ]);
            const localContent = stringify([
                { key: 'alt+d', command: '-f' },
                { key: 'cmd+e', command: 'd' },
                { key: 'cmd+c', command: '-c' },
                { key: 'cmd+d', command: 'c', when: 'context1' },
                { key: 'alt+a', command: 'f' },
                { key: 'alt+e', command: 'e' },
            ]);
            const remoteContent = stringify([
                { key: 'alt+a', command: 'f' },
                { key: 'cmd+c', command: '-c' },
                { key: 'cmd+d', command: 'd' },
                { key: 'alt+d', command: '-f' },
                { key: 'alt+c', command: 'c', when: 'context1' },
                { key: 'alt+g', command: 'g', when: 'context2' },
            ]);
            const actual = await mergeKeybindings(localContent, remoteContent, baseContent);
            assert.ok(actual.hasChanges);
            assert.ok(actual.hasConflicts);
            assert.strictEqual(actual.mergeContent, `[
	{
		"key": "alt+d",
		"command": "-f"
	},
	{
		"key": "cmd+d",
		"command": "d"
	},
	{
		"key": "cmd+c",
		"command": "-c"
	},
	{
		"key": "cmd+d",
		"command": "c",
		"when": "context1"
	},
	{
		"key": "alt+a",
		"command": "f"
	},
	{
		"key": "alt+e",
		"command": "e"
	},
	{
		"key": "alt+g",
		"command": "g",
		"when": "context2"
	}
]`);
        });
    });
    async function mergeKeybindings(localContent, remoteContent, baseContent) {
        const userDataSyncUtilService = new userDataSyncClient_1.TestUserDataSyncUtilService();
        const formattingOptions = await userDataSyncUtilService.resolveFormattingOptions();
        return (0, keybindingsMerge_1.merge)(localContent, remoteContent, baseContent, formattingOptions, userDataSyncUtilService);
    }
    function stringify(value) {
        return JSON.stringify(value, null, '\t');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3NNZXJnZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVN5bmMvdGVzdC9jb21tb24va2V5YmluZGluZ3NNZXJnZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLEtBQUssQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUU7UUFFN0MsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxxREFBcUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN0RSxNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0NBQW9DLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0csTUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlHLE1BQU0sTUFBTSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN6RSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3ZELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlFQUFpRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xGLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3RyxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0NBQW9DLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUcsTUFBTSxNQUFNLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDOUIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDdkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNERBQTRELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDN0UsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDO2dCQUM5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0NBQW9DLEVBQUU7Z0JBQzFFLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRTthQUN2RCxDQUFDLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUM7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRTtnQkFDdkQsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2FBQzFFLENBQUMsQ0FBQztZQUNILE1BQU0sTUFBTSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN6RSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3ZELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDREQUE0RCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzdFLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQztnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUFFO2FBQ25ELENBQUMsQ0FBQztZQUNILE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQztnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUFFO2FBQ25ELENBQUMsQ0FBQztZQUNILE1BQU0sTUFBTSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN6RSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3ZELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtFQUFrRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ25GLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQztnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUFFO2FBQ25ELENBQUMsQ0FBQztZQUNILE1BQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQztnQkFDN0IsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTthQUNyRCxDQUFDLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUM7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTtnQkFDMUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTthQUNuRCxDQUFDLENBQUM7WUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixDQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDaEYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM5QixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN2RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywrRUFBK0UsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRyxNQUFNLFlBQVksR0FBRyxTQUFTLENBQUM7Z0JBQzlCLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTtnQkFDMUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTthQUNuRCxDQUFDLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUM7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDbkQsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTthQUMvQixDQUFDLENBQUM7WUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixDQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDekUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM5QixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN2RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4RUFBOEUsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMvRixNQUFNLFlBQVksR0FBRyxTQUFTLENBQUM7Z0JBQzlCLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTtnQkFDMUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTthQUNuRCxDQUFDLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUM7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO2dCQUMvQixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0NBQW9DLEVBQUU7Z0JBQzFFLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTthQUNuRCxDQUFDLENBQUM7WUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixDQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDekUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM5QixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN2RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywyQ0FBMkMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1RCxNQUFNLFlBQVksR0FBRyxTQUFTLENBQUM7Z0JBQzlCLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTtnQkFDMUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7YUFDL0IsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDO2dCQUMvQixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0NBQW9DLEVBQUU7Z0JBQzFFLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO2dCQUMvQixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7YUFDbkQsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ3hELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFEQUFxRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3RFLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQztnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTthQUMvQixDQUFDLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUM7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTtnQkFDMUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDbkQsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7YUFDOUIsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ3hELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlGQUF5RixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzFHLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQztnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTthQUMvQixDQUFDLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUM7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTtnQkFDMUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDbkQsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7YUFDOUIsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2pGLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ3hELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdGQUFnRixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2pHLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQztnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUFFO2FBQ25ELENBQUMsQ0FBQztZQUNILE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQztnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTthQUMvQixDQUFDLENBQUM7WUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixDQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDakYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDeEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0ZBQStGLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDaEgsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDO2dCQUM5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0NBQW9DLEVBQUU7Z0JBQzFFLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO2FBQy9CLENBQUMsQ0FBQztZQUNILE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQztnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2FBQzFFLENBQUMsQ0FBQztZQUNILE1BQU0sTUFBTSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNqRixNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztRQUN4RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4RUFBOEUsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMvRixNQUFNLFlBQVksR0FBRyxTQUFTLENBQUM7Z0JBQzlCLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTthQUMxRSxDQUFDLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUM7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTthQUMxRSxDQUFDLENBQUM7WUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixDQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDakYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDeEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUdBQXVHLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDeEgsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDO2dCQUM5QixFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDaEMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7YUFDOUIsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDO2dCQUMvQixFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDaEMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7YUFDOUIsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2pGLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ3hELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdGQUF3RixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3pHLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQztnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7Z0JBQ25ELEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO2dCQUMvQixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRTthQUNoRCxDQUFDLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUM7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTtnQkFDMUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7Z0JBQzlCLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO2dCQUMvQixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUU7Z0JBQ2hELEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO2FBQy9CLENBQUMsQ0FBQztZQUNILE1BQU0sTUFBTSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNqRixNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztRQUN4RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywwQ0FBMEMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMzRCxNQUFNLFlBQVksR0FBRyxTQUFTLENBQUM7Z0JBQzlCLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTtnQkFDMUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTthQUNuRCxDQUFDLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUM7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTtnQkFDMUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7YUFDL0IsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3ZELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9EQUFvRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3JFLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQztnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUFFO2dCQUNuRCxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTthQUM5QixDQUFDLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUM7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTtnQkFDMUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7YUFDL0IsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3ZELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdGQUF3RixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3pHLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQztnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUFFO2dCQUNuRCxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTthQUM5QixDQUFDLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUM7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTtnQkFDMUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7YUFDL0IsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3ZELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdGQUFnRixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2pHLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQztnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTthQUMvQixDQUFDLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUM7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTtnQkFDMUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTthQUNuRCxDQUFDLENBQUM7WUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixDQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDbEYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDdkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsb0dBQW9HLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDckgsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDO2dCQUM5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0NBQW9DLEVBQUU7YUFDMUUsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDO2dCQUMvQixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0NBQW9DLEVBQUU7Z0JBQzFFLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO2FBQy9CLENBQUMsQ0FBQztZQUNILE1BQU0sTUFBTSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUNsRixNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN2RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4RUFBOEUsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMvRixNQUFNLFlBQVksR0FBRyxTQUFTLENBQUM7Z0JBQzlCLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRTthQUN2RCxDQUFDLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUM7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTthQUMxRSxDQUFDLENBQUM7WUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixDQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDbEYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDdkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUdBQXVHLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDeEgsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDO2dCQUM5QixFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDaEMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7YUFDOUIsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDO2dCQUMvQixFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDaEMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7YUFDOUIsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3ZELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdGQUF3RixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3pHLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQztnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUM5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRTtnQkFDaEQsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7YUFDL0IsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDO2dCQUMvQixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0NBQW9DLEVBQUU7Z0JBQzFFLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDbkQsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUM5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFO2FBQ2hELENBQUMsQ0FBQztZQUNILE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQztnQkFDMUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUM5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRTtnQkFDaEQsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7YUFDL0IsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ25ELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlFQUFpRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xGLE1BQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQztnQkFDN0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDaEMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7Z0JBQzlCLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUM5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRTtnQkFDaEQsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7YUFDL0IsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDO2dCQUM5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7Z0JBQzlCLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO2dCQUMvQixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFO2dCQUNoRCxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7YUFDOUIsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDO2dCQUMvQixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUM5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRTtnQkFDaEQsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRTthQUNoRCxDQUFDLENBQUM7WUFDSCxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUM7Z0JBQzFCLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO2dCQUMvQixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUU7Z0JBQ2hELEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUM5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRTthQUNoRCxDQUFDLENBQUM7WUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixDQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDaEYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDbkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0VBQWdFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakYsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdHLE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5RyxNQUFNLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixDQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDekUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDL0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUNyQzs7Ozs7O0VBTUQsQ0FBQyxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdURBQXVELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDeEUsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDO2dCQUM5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0NBQW9DLEVBQUU7Z0JBQzFFLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTthQUMzRSxDQUFDLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUM7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTtnQkFDMUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2FBQzNFLENBQUMsQ0FBQztZQUNILE1BQU0sTUFBTSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN6RSxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMvQixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQ3JDOzs7Ozs7Ozs7OztFQVdELENBQUMsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdFQUFnRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2pGLE1BQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RyxNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbkMsTUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlHLE1BQU0sTUFBTSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNoRixNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMvQixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQ3JDLElBQUksQ0FBQyxDQUFDO1FBQ1IsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0dBQWtHLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbkgsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVHLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5RyxNQUFNLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixDQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDaEYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDL0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUNyQzs7Ozs7RUFLRCxDQUFDLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnRUFBZ0UsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNqRixNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0NBQW9DLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUcsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdHLE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNwQyxNQUFNLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixDQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDaEYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDL0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUNyQzs7Ozs7O0VBTUQsQ0FBQyxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUdBQW1HLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDcEgsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVHLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3RyxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRSxNQUFNLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixDQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDaEYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDL0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUNyQzs7Ozs7Ozs7OztFQVVELENBQUMsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFFQUFxRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3RGLE1BQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQztnQkFDN0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO2dCQUMxRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7Z0JBQzlCLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUM5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRTtnQkFDaEQsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7YUFDL0IsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDO2dCQUM5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7Z0JBQzlCLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO2dCQUMvQixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFO2dCQUNoRCxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7YUFDOUIsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDO2dCQUMvQixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDOUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7Z0JBQy9CLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUM5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDL0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRTtnQkFDaEQsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRTthQUNoRCxDQUFDLENBQUM7WUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixDQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDaEYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDL0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUNyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQStCRCxDQUFDLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUVKLENBQUMsQ0FBQyxDQUFDO0lBRUgsS0FBSyxVQUFVLGdCQUFnQixDQUFDLFlBQW9CLEVBQUUsYUFBcUIsRUFBRSxXQUEwQjtRQUN0RyxNQUFNLHVCQUF1QixHQUFHLElBQUksZ0RBQTJCLEVBQUUsQ0FBQztRQUNsRSxNQUFNLGlCQUFpQixHQUFHLE1BQU0sdUJBQXVCLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUNuRixPQUFPLElBQUEsd0JBQUssRUFBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO0lBQ3BHLENBQUM7SUFFRCxTQUFTLFNBQVMsQ0FBQyxLQUFVO1FBQzVCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzFDLENBQUMifQ==