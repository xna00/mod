/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.merge = merge;
    exports.areSame = areSame;
    function merge(local, remote, base) {
        const localAdded = {};
        const localUpdated = {};
        const localRemoved = new Set();
        if (!remote) {
            return {
                local: { added: localAdded, updated: localUpdated, removed: [...localRemoved.values()] },
                remote: { added: local, updated: {}, removed: [] },
                conflicts: []
            };
        }
        const localToRemote = compare(local, remote);
        if (localToRemote.added.size === 0 && localToRemote.removed.size === 0 && localToRemote.updated.size === 0) {
            // No changes found between local and remote.
            return {
                local: { added: localAdded, updated: localUpdated, removed: [...localRemoved.values()] },
                remote: { added: {}, updated: {}, removed: [] },
                conflicts: []
            };
        }
        const baseToLocal = compare(base, local);
        const baseToRemote = compare(base, remote);
        const remoteAdded = {};
        const remoteUpdated = {};
        const remoteRemoved = new Set();
        const conflicts = new Set();
        // Removed snippets in Local
        for (const key of baseToLocal.removed.values()) {
            // Conflict - Got updated in remote.
            if (baseToRemote.updated.has(key)) {
                // Add to local
                localAdded[key] = remote[key];
            }
            // Remove it in remote
            else {
                remoteRemoved.add(key);
            }
        }
        // Removed snippets in Remote
        for (const key of baseToRemote.removed.values()) {
            if (conflicts.has(key)) {
                continue;
            }
            // Conflict - Got updated in local
            if (baseToLocal.updated.has(key)) {
                conflicts.add(key);
            }
            // Also remove in Local
            else {
                localRemoved.add(key);
            }
        }
        // Updated snippets in Local
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
            else {
                remoteUpdated[key] = local[key];
            }
        }
        // Updated snippets in Remote
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
            else if (local[key] !== undefined) {
                localUpdated[key] = remote[key];
            }
        }
        // Added snippets in Local
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
            else {
                remoteAdded[key] = local[key];
            }
        }
        // Added snippets in remote
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
                localAdded[key] = remote[key];
            }
        }
        return {
            local: { added: localAdded, removed: [...localRemoved.values()], updated: localUpdated },
            remote: { added: remoteAdded, removed: [...remoteRemoved.values()], updated: remoteUpdated },
            conflicts: [...conflicts.values()],
        };
    }
    function compare(from, to) {
        const fromKeys = from ? Object.keys(from) : [];
        const toKeys = to ? Object.keys(to) : [];
        const added = toKeys.filter(key => !fromKeys.includes(key)).reduce((r, key) => { r.add(key); return r; }, new Set());
        const removed = fromKeys.filter(key => !toKeys.includes(key)).reduce((r, key) => { r.add(key); return r; }, new Set());
        const updated = new Set();
        for (const key of fromKeys) {
            if (removed.has(key)) {
                continue;
            }
            const fromSnippet = from[key];
            const toSnippet = to[key];
            if (fromSnippet !== toSnippet) {
                updated.add(key);
            }
        }
        return { added, removed, updated };
    }
    function areSame(a, b) {
        const { added, removed, updated } = compare(a, b);
        return added.size === 0 && removed.size === 0 && updated.size === 0;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldHNNZXJnZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFTeW5jL2NvbW1vbi9zbmlwcGV0c01lcmdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBa0JoRyxzQkFpSUM7SUF1QkQsMEJBR0M7SUEzSkQsU0FBZ0IsS0FBSyxDQUFDLEtBQWdDLEVBQUUsTUFBd0MsRUFBRSxJQUFzQztRQUN2SSxNQUFNLFVBQVUsR0FBOEIsRUFBRSxDQUFDO1FBQ2pELE1BQU0sWUFBWSxHQUE4QixFQUFFLENBQUM7UUFDbkQsTUFBTSxZQUFZLEdBQWdCLElBQUksR0FBRyxFQUFVLENBQUM7UUFFcEQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2IsT0FBTztnQkFDTixLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLENBQUMsR0FBRyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRTtnQkFDeEYsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7Z0JBQ2xELFNBQVMsRUFBRSxFQUFFO2FBQ2IsQ0FBQztRQUNILENBQUM7UUFFRCxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzdDLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLGFBQWEsQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUM1Ryw2Q0FBNkM7WUFDN0MsT0FBTztnQkFDTixLQUFLLEVB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QUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEdBQUcsRUFBVSxDQUFDLENBQUM7UUFDN0gsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEdBQUcsRUFBVSxDQUFDLENBQUM7UUFDL0gsTUFBTSxPQUFPLEdBQWdCLElBQUksR0FBRyxFQUFVLENBQUM7UUFFL0MsS0FBSyxNQUFNLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUM1QixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDdEIsU0FBUztZQUNWLENBQUM7WUFDRCxNQUFNLFdBQVcsR0FBRyxJQUFLLENBQUMsR0FBRyxDQUFFLENBQUM7WUFDaEMsTUFBTSxTQUFTLEdBQUcsRUFBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDO1lBQzVCLElBQUksV0FBVyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUMvQixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7SUFDcEMsQ0FBQztJQUVELFNBQWdCLE9BQU8sQ0FBQyxDQUE0QixFQUFFLENBQTRCO1FBQ2pGLE1BQU0sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEQsT0FBTyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQztJQUNyRSxDQUFDIn0=