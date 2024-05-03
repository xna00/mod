/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects"], function (require, exports, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.merge = merge;
    function merge(local, remote, lastSync, ignored) {
        const localResult = { added: [], removed: [], updated: [] };
        let remoteResult = { added: [], removed: [], updated: [] };
        if (!remote) {
            const added = local.filter(({ id }) => !ignored.includes(id));
            if (added.length) {
                remoteResult.added = added;
            }
            else {
                remoteResult = null;
            }
            return {
                local: localResult,
                remote: remoteResult
            };
        }
        const localToRemote = compare(local, remote, ignored);
        if (localToRemote.added.length > 0 || localToRemote.removed.length > 0 || localToRemote.updated.length > 0) {
            const baseToLocal = compare(lastSync, local, ignored);
            const baseToRemote = compare(lastSync, remote, ignored);
            // Remotely removed profiles
            for (const id of baseToRemote.removed) {
                const e = local.find(profile => profile.id === id);
                if (e) {
                    localResult.removed.push(e);
                }
            }
            // Remotely added profiles
            for (const id of baseToRemote.added) {
                const remoteProfile = remote.find(profile => profile.id === id);
                // Got added in local
                if (baseToLocal.added.includes(id)) {
                    // Is different from local to remote
                    if (localToRemote.updated.includes(id)) {
                        // Remote wins always
                        localResult.updated.push(remoteProfile);
                    }
                }
                else {
                    localResult.added.push(remoteProfile);
                }
            }
            // Remotely updated profiles
            for (const id of baseToRemote.updated) {
                // Remote wins always
                localResult.updated.push(remote.find(profile => profile.id === id));
            }
            // Locally added profiles
            for (const id of baseToLocal.added) {
                // Not there in remote
                if (!baseToRemote.added.includes(id)) {
                    remoteResult.added.push(local.find(profile => profile.id === id));
                }
            }
            // Locally updated profiles
            for (const id of baseToLocal.updated) {
                // If removed in remote
                if (baseToRemote.removed.includes(id)) {
                    continue;
                }
                // If not updated in remote
                if (!baseToRemote.updated.includes(id)) {
                    remoteResult.updated.push(local.find(profile => profile.id === id));
                }
            }
            // Locally removed profiles
            for (const id of baseToLocal.removed) {
                const removedProfile = remote.find(profile => profile.id === id);
                if (removedProfile) {
                    remoteResult.removed.push(removedProfile);
                }
            }
        }
        if (remoteResult.added.length === 0 && remoteResult.removed.length === 0 && remoteResult.updated.length === 0) {
            remoteResult = null;
        }
        return { local: localResult, remote: remoteResult };
    }
    function compare(from, to, ignoredProfiles) {
        from = from ? from.filter(({ id }) => !ignoredProfiles.includes(id)) : [];
        to = to.filter(({ id }) => !ignoredProfiles.includes(id));
        const fromKeys = from.map(({ id }) => id);
        const toKeys = to.map(({ id }) => id);
        const added = toKeys.filter(key => !fromKeys.includes(key));
        const removed = fromKeys.filter(key => !toKeys.includes(key));
        const updated = [];
        for (const { id, name, shortName, icon, useDefaultFlags } of from) {
            if (removed.includes(id)) {
                continue;
            }
            const toProfile = to.find(p => p.id === id);
            if (!toProfile
                || toProfile.name !== name
                || toProfile.shortName !== shortName
                || toProfile.icon !== icon
                || !(0, objects_1.equals)(toProfile.useDefaultFlags, useDefaultFlags)) {
                updated.push(id);
            }
        }
        return { added, removed, updated };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlc01hbmlmZXN0TWVyZ2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy9jb21tb24vdXNlckRhdGFQcm9maWxlc01hbmlmZXN0TWVyZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFxQmhHLHNCQXVGQztJQXZGRCxTQUFnQixLQUFLLENBQUMsS0FBeUIsRUFBRSxNQUFxQyxFQUFFLFFBQXVDLEVBQUUsT0FBaUI7UUFDakosTUFBTSxXQUFXLEdBQW9HLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUM3SixJQUFJLFlBQVksR0FBdUcsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBRS9KLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNiLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5RCxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDbEIsWUFBWSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDNUIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFlBQVksR0FBRyxJQUFJLENBQUM7WUFDckIsQ0FBQztZQUNELE9BQU87Z0JBQ04sS0FBSyxFQUFFLFdBQVc7Z0JBQ2xCLE1BQU0sRUFBRSxZQUFZO2FBQ3BCLENBQUM7UUFDSCxDQUFDO1FBRUQsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFB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