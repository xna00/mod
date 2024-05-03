/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/json", "vs/base/common/objects", "vs/platform/contextkey/common/contextkey", "vs/platform/userDataSync/common/content"], function (require, exports, arrays_1, json_1, objects, contextkey_1, contentUtil) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.merge = merge;
    function parseKeybindings(content) {
        return (0, json_1.parse)(content) || [];
    }
    async function merge(localContent, remoteContent, baseContent, formattingOptions, userDataSyncUtilService) {
        const local = parseKeybindings(localContent);
        const remote = parseKeybindings(remoteContent);
        const base = baseContent ? parseKeybindings(baseContent) : null;
        const userbindings = [...local, ...remote, ...(base || [])].map(keybinding => keybinding.key);
        const normalizedKeys = await userDataSyncUtilService.resolveUserBindings(userbindings);
        const keybindingsMergeResult = computeMergeResultByKeybinding(local, remote, base, normalizedKeys);
        if (!keybindingsMergeResult.hasLocalForwarded && !keybindingsMergeResult.hasRemoteForwarded) {
            // No changes found between local and remote.
            return { mergeContent: localContent, hasChanges: false, hasConflicts: false };
        }
        if (!keybindingsMergeResult.hasLocalForwarded && keybindingsMergeResult.hasRemoteForwarded) {
            return { mergeContent: remoteContent, hasChanges: true, hasConflicts: false };
        }
        if (keybindingsMergeResult.hasLocalForwarded && !keybindingsMergeResult.hasRemoteForwarded) {
            // Local has moved forward and remote has not. Return local.
            return { mergeContent: localContent, hasChanges: true, hasConflicts: false };
        }
        // Both local and remote has moved forward.
        const localByCommand = byCommand(local);
        const remoteByCommand = byCommand(remote);
        const baseByCommand = base ? byCommand(base) : null;
        const localToRemoteByCommand = compareByCommand(localByCommand, remoteByCommand, normalizedKeys);
        const baseToLocalByCommand = baseByCommand ? compareByCommand(baseByCommand, localByCommand, normalizedKeys) : { added: [...localByCommand.keys()].reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
        const baseToRemoteByCommand = baseByCommand ? compareByCommand(baseByCommand, remoteByCommand, normalizedKeys) : { added: [...remoteByCommand.keys()].reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
        const commandsMergeResult = computeMergeResult(localToRemoteByCommand, baseToLocalByCommand, baseToRemoteByCommand);
        let mergeContent = localContent;
        // Removed commands in Remote
        for (const command of commandsMergeResult.removed.values()) {
            if (commandsMergeResult.conflicts.has(command)) {
                continue;
            }
            mergeContent = removeKeybindings(mergeContent, command, formattingOptions);
        }
        // Added commands in remote
        for (const command of commandsMergeResult.added.values()) {
            if (commandsMergeResult.conflicts.has(command)) {
                continue;
            }
            const keybindings = remoteByCommand.get(command);
            // Ignore negated commands
            if (keybindings.some(keybinding => keybinding.command !== `-${command}` && keybindingsMergeResult.conflicts.has(normalizedKeys[keybinding.key]))) {
                commandsMergeResult.conflicts.add(command);
                continue;
            }
            mergeContent = addKeybindings(mergeContent, keybindings, formattingOptions);
        }
        // Updated commands in Remote
        for (const command of commandsMergeResult.updated.values()) {
            if (commandsMergeResult.conflicts.has(command)) {
                continue;
            }
            const keybindings = remoteByCommand.get(command);
            // Ignore negated commands
            if (keybindings.some(keybinding => keybinding.command !== `-${command}` && keybindingsMergeResult.conflicts.has(normalizedKeys[keybinding.key]))) {
                commandsMergeResult.conflicts.add(command);
                continue;
            }
            mergeContent = updateKeybindings(mergeContent, command, keybindings, formattingOptions);
        }
        return { mergeContent, hasChanges: true, hasConflicts: commandsMergeResult.conflicts.size > 0 };
    }
    function computeMergeResult(localToRemote, baseToLocal, baseToRemote) {
        const added = new Set();
        const removed = new Set();
        const updated = new Set();
        const conflicts = new Set();
        // Removed keys in Local
        for (const key of baseToLocal.removed.values()) {
            // Got updated in remote
            if (baseToRemote.updated.has(key)) {
                conflicts.add(key);
            }
        }
        // Removed keys in Remote
        for (const key of baseToRemote.removed.values()) {
            if (conflicts.has(key)) {
                continue;
            }
            // Got updated in local
            if (baseToLocal.updated.has(key)) {
                conflicts.add(key);
            }
            else {
                // remove the key
                removed.add(key);
            }
        }
        // Added keys in Local
        for (const key of baseToLocal.added.values()) {
            if (conflicts.has(key)) {
                continue;
            }
            // Got added in remote
            if (baseToRemote.added.has(key)) {
                // Has different value
                if (localToRemote.updated.has(key)) {
                    conflicts.add(key);
                }
            }
        }
        // Added keys in remote
        for (const key of baseToRemote.added.values()) {
            if (conflicts.has(key)) {
                continue;
            }
            // Got added in local
            if (baseToLocal.added.has(key)) {
                // Has different value
                if (localToRemote.updated.has(key)) {
                    conflicts.add(key);
                }
            }
            else {
                added.add(key);
            }
        }
        // Updated keys in Local
        for (const key of baseToLocal.updated.values()) {
            if (conflicts.has(key)) {
                continue;
            }
            // Got updated in remote
            if (baseToRemote.updated.has(key)) {
                // Has different value
                if (localToRemote.updated.has(key)) {
                    conflicts.add(key);
                }
            }
        }
        // Updated keys in Remote
        for (const key of baseToRemote.updated.values()) {
            if (conflicts.has(key)) {
                continue;
            }
            // Got updated in local
            if (baseToLocal.updated.has(key)) {
                // Has different value
                if (localToRemote.updated.has(key)) {
                    conflicts.add(key);
                }
            }
            else {
                // updated key
                updated.add(key);
            }
        }
        return { added, removed, updated, conflicts };
    }
    function computeMergeResultByKeybinding(local, remote, base, normalizedKeys) {
        const empty = new Set();
        const localByKeybinding = byKeybinding(local, normalizedKeys);
        const remoteByKeybinding = byKeybinding(remote, normalizedKeys);
        const baseByKeybinding = base ? byKeybinding(base, normalizedKeys) : null;
        const localToRemoteByKeybinding = compareByKeybinding(localByKeybinding, remoteByKeybinding);
        if (localToRemoteByKeybinding.added.size === 0 && localToRemoteByKeybinding.removed.size === 0 && localToRemoteByKeybinding.updated.size === 0) {
            return { hasLocalForwarded: false, hasRemoteForwarded: false, added: empty, removed: empty, updated: empty, conflicts: empty };
        }
        const baseToLocalByKeybinding = baseByKeybinding ? compareByKeybinding(baseByKeybinding, localByKeybinding) : { added: [...localByKeybinding.keys()].reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
        if (baseToLocalByKeybinding.added.size === 0 && baseToLocalByKeybinding.removed.size === 0 && baseToLocalByKeybinding.updated.size === 0) {
            // Remote has moved forward and local has not.
            return { hasLocalForwarded: false, hasRemoteForwarded: true, added: empty, removed: empty, updated: empty, conflicts: empty };
        }
        const baseToRemoteByKeybinding = baseByKeybinding ? compareByKeybinding(baseByKeybinding, remoteByKeybinding) : { added: [...remoteByKeybinding.keys()].reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
        if (baseToRemoteByKeybinding.added.size === 0 && baseToRemoteByKeybinding.removed.size === 0 && baseToRemoteByKeybinding.updated.size === 0) {
            return { hasLocalForwarded: true, hasRemoteForwarded: false, added: empty, removed: empty, updated: empty, conflicts: empty };
        }
        const { added, removed, updated, conflicts } = computeMergeResult(localToRemoteByKeybinding, baseToLocalByKeybinding, baseToRemoteByKeybinding);
        return { hasLocalForwarded: true, hasRemoteForwarded: true, added, removed, updated, conflicts };
    }
    function byKeybinding(keybindings, keys) {
        const map = new Map();
        for (const keybinding of keybindings) {
            const key = keys[keybinding.key];
            let value = map.get(key);
            if (!value) {
                value = [];
                map.set(key, value);
            }
            value.push(keybinding);
        }
        return map;
    }
    function byCommand(keybindings) {
        const map = new Map();
        for (const keybinding of keybindings) {
            const command = keybinding.command[0] === '-' ? keybinding.command.substring(1) : keybinding.command;
            let value = map.get(command);
            if (!value) {
                value = [];
                map.set(command, value);
            }
            value.push(keybinding);
        }
        return map;
    }
    function compareByKeybinding(from, to) {
        const fromKeys = [...from.keys()];
        const toKeys = [...to.keys()];
        const added = toKeys.filter(key => !fromKeys.includes(key)).reduce((r, key) => { r.add(key); return r; }, new Set());
        const removed = fromKeys.filter(key => !toKeys.includes(key)).reduce((r, key) => { r.add(key); return r; }, new Set());
        const updated = new Set();
        for (const key of fromKeys) {
            if (removed.has(key)) {
                continue;
            }
            const value1 = from.get(key).map(keybinding => ({ ...keybinding, ...{ key } }));
            const value2 = to.get(key).map(keybinding => ({ ...keybinding, ...{ key } }));
            if (!(0, arrays_1.equals)(value1, value2, (a, b) => isSameKeybinding(a, b))) {
                updated.add(key);
            }
        }
        return { added, removed, updated };
    }
    function compareByCommand(from, to, normalizedKeys) {
        const fromKeys = [...from.keys()];
        const toKeys = [...to.keys()];
        const added = toKeys.filter(key => !fromKeys.includes(key)).reduce((r, key) => { r.add(key); return r; }, new Set());
        const removed = fromKeys.filter(key => !toKeys.includes(key)).reduce((r, key) => { r.add(key); return r; }, new Set());
        const updated = new Set();
        for (const key of fromKeys) {
            if (removed.has(key)) {
                continue;
            }
            const value1 = from.get(key).map(keybinding => ({ ...keybinding, ...{ key: normalizedKeys[keybinding.key] } }));
            const value2 = to.get(key).map(keybinding => ({ ...keybinding, ...{ key: normalizedKeys[keybinding.key] } }));
            if (!areSameKeybindingsWithSameCommand(value1, value2)) {
                updated.add(key);
            }
        }
        return { added, removed, updated };
    }
    function areSameKeybindingsWithSameCommand(value1, value2) {
        // Compare entries adding keybindings
        if (!(0, arrays_1.equals)(value1.filter(({ command }) => command[0] !== '-'), value2.filter(({ command }) => command[0] !== '-'), (a, b) => isSameKeybinding(a, b))) {
            return false;
        }
        // Compare entries removing keybindings
        if (!(0, arrays_1.equals)(value1.filter(({ command }) => command[0] === '-'), value2.filter(({ command }) => command[0] === '-'), (a, b) => isSameKeybinding(a, b))) {
            return false;
        }
        return true;
    }
    function isSameKeybinding(a, b) {
        if (a.command !== b.command) {
            return false;
        }
        if (a.key !== b.key) {
            return false;
        }
        const whenA = contextkey_1.ContextKeyExpr.deserialize(a.when);
        const whenB = contextkey_1.ContextKeyExpr.deserialize(b.when);
        if ((whenA && !whenB) || (!whenA && whenB)) {
            return false;
        }
        if (whenA && whenB && !whenA.equals(whenB)) {
            return false;
        }
        if (!objects.equals(a.args, b.args)) {
            return false;
        }
        return true;
    }
    function addKeybindings(content, keybindings, formattingOptions) {
        for (const keybinding of keybindings) {
            content = contentUtil.edit(content, [-1], keybinding, formattingOptions);
        }
        return content;
    }
    function removeKeybindings(content, command, formattingOptions) {
        const keybindings = parseKeybindings(content);
        for (let index = keybindings.length - 1; index >= 0; index--) {
            if (keybindings[index].command === command || keybindings[index].command === `-${command}`) {
                content = contentUtil.edit(content, [index], undefined, formattingOptions);
            }
        }
        return content;
    }
    function updateKeybindings(content, command, keybindings, formattingOptions) {
        const allKeybindings = parseKeybindings(content);
        const location = allKeybindings.findIndex(keybinding => keybinding.command === command || keybinding.command === `-${command}`);
        // Remove all entries with this command
        for (let index = allKeybindings.length - 1; index >= 0; index--) {
            if (allKeybindings[index].command === command || allKeybindings[index].command === `-${command}`) {
                content = contentUtil.edit(content, [index], undefined, formattingOptions);
            }
        }
        // add all entries at the same location where the entry with this command was located.
        for (let index = keybindings.length - 1; index >= 0; index--) {
            content = contentUtil.edit(content, [location], keybindings[index], formattingOptions);
        }
        return content;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3NNZXJnZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFTeW5jL2NvbW1vbi9rZXliaW5kaW5nc01lcmdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBK0JoRyxzQkF1RUM7SUEzRUQsU0FBUyxnQkFBZ0IsQ0FBQyxPQUFlO1FBQ3hDLE9BQU8sSUFBQSxZQUFLLEVBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQzdCLENBQUM7SUFFTSxLQUFLLFVBQVUsS0FBSyxDQUFDLFlBQW9CLEVBQUUsYUFBcUIsRUFBRSxXQUEwQixFQUFFLGlCQUFvQyxFQUFFLHVCQUFpRDtRQUMzTCxNQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM3QyxNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUMvQyxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFFaEUsTUFBTSxZQUFZLEdBQWEsQ0FBQyxHQUFHLEtBQUssRUFBRSxHQUFHLE1BQU0sRUFBRSxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hHLE1BQU0sY0FBYyxHQUFHLE1BQU0sdUJBQXVCLENBQUMsbUJBQW1CLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdkYsTUFBTSxzQkFBc0IsR0FBRyw4QkFBOEIsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztRQUVuRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsaUJBQWlCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQzdGLDZDQUE2QztZQUM3QyxPQUFPLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUMvRSxDQUFDO1FBRUQsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGlCQUFpQixJQUFJLHNCQUFzQixDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDNUYsT0FBTyxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDL0UsQ0FBQztRQUVELElBQUksc0JBQXNCLENBQUMsaUJBQWlCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQzVGLDREQUE0RDtZQUM1RCxPQUFPLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUM5RSxDQUFDO1FBRUQsMkNBQTJDO1FBQzNDLE1BQU0sY0FBYyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4QyxNQUFNLGVBQWUsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUMsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNwRCxNQUFNLHNCQUFzQixHQUFHLGdCQUFnQixDQUFDLGNBQWMsRUFBRSxlQUFlLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDakcsTUFBTSxvQkFBb0IsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsR0FBRyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxHQUFHLEVBQVUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEdBQUcsRUFBVSxFQUFFLE9BQU8sRUFBRSxJQUFJLEdBQUcsRUFBVSxFQUFFLENBQUM7UUFDMVEsTUFBTSxxQkFBcUIsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxlQUFlLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsR0FBRyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxHQUFHLEVBQVUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEdBQUcsRUFBVSxFQUFFLE9BQU8sRUFBRSxJQUFJLEdBQUcsRUFBVSxFQUFFLENBQUM7UUFFN1EsTUFBTSxtQkFBbUIsR0FBRyxrQkFBa0IsQ0FBQyxzQkFBc0IsRUFBRSxvQkFBb0IsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3BILElBQUksWUFBWSxHQUFHLFlBQVksQ0FBQztRQUVoQyw2QkFBNkI7UUFDN0IsS0FBSyxNQUFNLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztZQUM1RCxJQUFJLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDaEQsU0FBUztZQUNWLENBQUM7WUFDRCxZQUFZLEdBQUcsaUJBQWlCLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQzVFLENBQUM7UUFFRCwyQkFBMkI7UUFDM0IsS0FBSyxNQUFNLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztZQUMxRCxJQUFJLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDaEQsU0FBUztZQUNWLENBQUM7WUFDRCxNQUFNLFdBQVcsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxDQUFDO1lBQ2xELDBCQUEwQjtZQUMxQixJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxLQUFLLElBQUksT0FBTyxFQUFFLElBQUksc0JBQXNCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNsSixtQkFBbUIsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMzQyxTQUFTO1lBQ1YsQ0FBQztZQUNELFlBQVksR0FBRyxjQUFjLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQzdFLENBQUM7UUFFRCw2QkFBNkI7UUFDN0IsS0FBSyxNQUFNLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztZQUM1RCxJQUFJLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDaEQsU0FBUztZQUNWLENBQUM7WUFDRCxNQUFNLFdBQVcsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxDQUFDO1lBQ2xELDBCQUEwQjtZQUMxQixJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxLQUFLLElBQUksT0FBTyxFQUFFLElBQUksc0JBQXNCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNsSixtQkFBbUIsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMzQyxTQUFTO1lBQ1YsQ0FBQztZQUNELFlBQVksR0FBRyxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3pGLENBQUM7UUFFRCxPQUFPLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUM7SUFDakcsQ0FBQztJQUVELFNBQVMsa0JBQWtCLENBQUMsYUFBNkIsRUFBRSxXQUEyQixFQUFFLFlBQTRCO1FBQ25ILE1BQU0sS0FBSyxHQUFnQixJQUFJLEdBQUcsRUFBVSxDQUFDO1FBQzdDLE1BQU0sT0FBTyxHQUFnQixJQUFJLEdBQUcsRUFBVSxDQUFDO1FBQy9DLE1BQU0sT0FBTyxHQUFnQixJQUFJLEdBQUcsRUFBVSxDQUFDO1FBQy9DLE1BQU0sU0FBUyxHQUFnQixJQUFJLEdBQUcsRUFBVSxDQUFDO1FBRWpELHdCQUF3QjtRQUN4QixLQUFLLE1BQU0sR0FBRyxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztZQUNoRCx3QkFBd0I7WUFDeEIsSUFBSSxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BCLENBQUM7UUFDRixDQUFDO1FBRUQseUJBQXlCO1FBQ3pCLEtBQUssTUFBTSxHQUFHLElBQUksWUFBWSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO1lBQ2pELElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN4QixTQUFTO1lBQ1YsQ0FBQztZQUNELHVCQUF1QjtZQUN2QixJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2xDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDcEIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLGlCQUFpQjtnQkFDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQixDQUFDO1FBQ0YsQ0FBQztRQUVELHNCQUFzQjtRQUN0QixLQUFLLE1BQU0sR0FBRyxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztZQUM5QyxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDeEIsU0FBUztZQUNWLENBQUM7WUFDRCxzQkFBc0I7WUFDdEIsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNqQyxzQkFBc0I7Z0JBQ3RCLElBQUksYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDcEMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDcEIsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsdUJBQXVCO1FBQ3ZCLEtBQUssTUFBTSxHQUFHLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO1lBQy9DLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN4QixTQUFTO1lBQ1YsQ0FBQztZQUNELHFCQUFxQjtZQUNyQixJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hDLHNCQUFzQjtnQkFDdEIsSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNwQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNwQixDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDaEIsQ0FBQztRQUNGLENBQUM7UUFFRCx3QkFBd0I7UUFDeEIsS0FBSyxNQUFNLEdBQUcsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7WUFDaEQsSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLFNBQVM7WUFDVixDQUFDO1lBQ0Qsd0JBQXdCO1lBQ3hCLElBQUksWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDbkMsc0JBQXNCO2dCQUN0QixJQUFJLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3BDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BCLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVELHlCQUF5QjtRQUN6QixLQUFLLE1BQU0sR0FBRyxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztZQUNqRCxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDeEIsU0FBUztZQUNWLENBQUM7WUFDRCx1QkFBdUI7WUFDdkIsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNsQyxzQkFBc0I7Z0JBQ3RCLElBQUksYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDcEMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDcEIsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxjQUFjO2dCQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEIsQ0FBQztRQUNGLENBQUM7UUFDRCxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLENBQUM7SUFDL0MsQ0FBQztJQUVELFNBQVMsOEJBQThCLENBQUMsS0FBZ0MsRUFBRSxNQUFpQyxFQUFFLElBQXNDLEVBQUUsY0FBeUM7UUFDN0wsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUNoQyxNQUFNLGlCQUFpQixHQUFHLFlBQVksQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDOUQsTUFBTSxrQkFBa0IsR0FBRyxZQUFZLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFFMUUsTUFBTSx5QkFBeUIsR0FBRyxtQkFBbUIsQ0FBQyxpQkFBaUIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQzdGLElBQUkseUJBQXlCLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLElBQUkseUJBQXlCLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxDQUFDLElBQUkseUJBQXlCLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNoSixPQUFPLEVBQUUsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDaEksQ0FBQztRQUVELE1BQU0sdUJBQXVCLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLGdCQUFnQixFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEdBQUcsRUFBVSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksR0FBRyxFQUFVLEVBQUUsT0FBTyxFQUFFLElBQUksR0FBRyxFQUFVLEVBQUUsQ0FBQztRQUM1USxJQUFJLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDMUksOENBQThDO1lBQzlDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUMvSCxDQUFDO1FBRUQsTUFBTSx3QkFBd0IsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsZ0JBQWdCLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxHQUFHLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksR0FBRyxFQUFVLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxHQUFHLEVBQVUsRUFBRSxPQUFPLEVBQUUsSUFBSSxHQUFHLEVBQVUsRUFBRSxDQUFDO1FBQy9RLElBQUksd0JBQXdCLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksd0JBQXdCLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksd0JBQXdCLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUM3SSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDL0gsQ0FBQztRQUVELE1BQU0sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsR0FBRyxrQkFBa0IsQ0FBQyx5QkFBeUIsRUFBRSx1QkFBdUIsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1FBQ2hKLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDO0lBQ2xHLENBQUM7SUFFRCxTQUFTLFlBQVksQ0FBQyxXQUFzQyxFQUFFLElBQStCO1FBQzVGLE1BQU0sR0FBRyxHQUEyQyxJQUFJLEdBQUcsRUFBcUMsQ0FBQztRQUNqRyxLQUFLLE1BQU0sVUFBVSxJQUFJLFdBQVcsRUFBRSxDQUFDO1lBQ3RDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakMsSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN6QixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDWCxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyQixDQUFDO1lBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUV4QixDQUFDO1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDWixDQUFDO0lBRUQsU0FBUyxTQUFTLENBQUMsV0FBc0M7UUFDeEQsTUFBTSxHQUFHLEdBQTJDLElBQUksR0FBRyxFQUFxQyxDQUFDO1FBQ2pHLEtBQUssTUFBTSxVQUFVLElBQUksV0FBVyxFQUFFLENBQUM7WUFDdEMsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO1lBQ3JHLElBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ1gsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDekIsQ0FBQztZQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDeEIsQ0FBQztRQUNELE9BQU8sR0FBRyxDQUFDO0lBQ1osQ0FBQztJQUdELFNBQVMsbUJBQW1CLENBQUMsSUFBNEMsRUFBRSxFQUEwQztRQUNwSCxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDbEMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzlCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxHQUFHLEVBQVUsQ0FBQyxDQUFDO1FBQzdILE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxHQUFHLEVBQVUsQ0FBQyxDQUFDO1FBQy9ILE1BQU0sT0FBTyxHQUFnQixJQUFJLEdBQUcsRUFBVSxDQUFDO1FBRS9DLEtBQUssTUFBTSxHQUFHLElBQUksUUFBUSxFQUFFLENBQUM7WUFDNUIsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RCLFNBQVM7WUFDVixDQUFDO1lBQ0QsTUFBTSxNQUFNLEdBQThCLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFFLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsVUFBVSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RyxNQUFNLE1BQU0sR0FBOEIsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxVQUFVLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFHLElBQUksQ0FBQyxJQUFBLGVBQU0sRUFBQyxNQUFNLEVBQUUsTUFBTSxFQUFF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