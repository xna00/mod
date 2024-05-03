/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, objects, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.merge = merge;
    function merge(localStorage, remoteStorage, baseStorage, storageKeys, logService) {
        if (!remoteStorage) {
            return { remote: { added: Object.keys(localStorage), removed: [], updated: [], all: Object.keys(localStorage).length > 0 ? localStorage : null }, local: { added: {}, removed: [], updated: {} } };
        }
        const localToRemote = compare(localStorage, remoteStorage);
        if (localToRemote.added.size === 0 && localToRemote.removed.size === 0 && localToRemote.updated.size === 0) {
            // No changes found between local and remote.
            return { remote: { added: [], removed: [], updated: [], all: null }, local: { added: {}, removed: [], updated: {} } };
        }
        const baseToRemote = baseStorage ? compare(baseStorage, remoteStorage) : { added: Object.keys(remoteStorage).reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
        const baseToLocal = baseStorage ? compare(baseStorage, localStorage) : { added: Object.keys(localStorage).reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
        const local = { added: {}, removed: [], updated: {} };
        const remote = objects.deepClone(remoteStorage);
        const isFirstTimeSync = !baseStorage;
        // Added in local
        for (const key of baseToLocal.added.values()) {
            // If syncing for first time remote value gets precedence always,
            // except for sync service type key - local value takes precedence for this key
            if (key !== userDataSync_1.SYNC_SERVICE_URL_TYPE && isFirstTimeSync && baseToRemote.added.has(key)) {
                continue;
            }
            remote[key] = localStorage[key];
        }
        // Updated in local
        for (const key of baseToLocal.updated.values()) {
            remote[key] = localStorage[key];
        }
        // Removed in local
        for (const key of baseToLocal.removed.values()) {
            // Do not remove from remote if key is not registered.
            if (storageKeys.unregistered.includes(key)) {
                continue;
            }
            delete remote[key];
        }
        // Added in remote
        for (const key of baseToRemote.added.values()) {
            const remoteValue = remoteStorage[key];
            if (storageKeys.machine.includes(key)) {
                logService.info(`GlobalState: Skipped adding ${key} in local storage because it is declared as machine scoped.`);
                continue;
            }
            // Skip if the value is also added in local from the time it is last synced
            if (baseStorage && baseToLocal.added.has(key)) {
                continue;
            }
            const localValue = localStorage[key];
            if (localValue && localValue.value === remoteValue.value) {
                continue;
            }
            // Local sync service type value takes precedence if syncing for first time
            if (key === userDataSync_1.SYNC_SERVICE_URL_TYPE && isFirstTimeSync && baseToLocal.added.has(key)) {
                continue;
            }
            if (localValue) {
                local.updated[key] = remoteValue;
            }
            else {
                local.added[key] = remoteValue;
            }
        }
        // Updated in Remote
        for (const key of baseToRemote.updated.values()) {
            const remoteValue = remoteStorage[key];
            if (storageKeys.machine.includes(key)) {
                logService.info(`GlobalState: Skipped updating ${key} in local storage because it is declared as machine scoped.`);
                continue;
            }
            // Skip if the value is also updated or removed in local
            if (baseToLocal.updated.has(key) || baseToLocal.removed.has(key)) {
                continue;
            }
            const localValue = localStorage[key];
            if (localValue && localValue.value === remoteValue.value) {
                continue;
            }
            local.updated[key] = remoteValue;
        }
        // Removed in remote
        for (const key of baseToRemote.removed.values()) {
            if (storageKeys.machine.includes(key)) {
                logService.trace(`GlobalState: Skipped removing ${key} in local storage because it is declared as machine scoped.`);
                continue;
            }
            // Skip if the value is also updated or removed in local
            if (baseToLocal.updated.has(key) || baseToLocal.removed.has(key)) {
                continue;
            }
            local.removed.push(key);
        }
        const result = compare(remoteStorage, remote);
        return { local, remote: { added: [...result.added], updated: [...result.updated], removed: [...result.removed], all: result.added.size === 0 && result.removed.size === 0 && result.updated.size === 0 ? null : remote } };
    }
    function compare(from, to) {
        const fromKeys = Object.keys(from);
        const toKeys = Object.keys(to);
        const added = toKeys.filter(key => !fromKeys.includes(key)).reduce((r, key) => { r.add(key); return r; }, new Set());
        const removed = fromKeys.filter(key => !toKeys.includes(key)).reduce((r, key) => { r.add(key); return r; }, new Set());
        const updated = new Set();
        for (const key of fromKeys) {
            if (removed.has(key)) {
                continue;
            }
            const value1 = from[key];
            const value2 = to[key];
            if (!objects.equals(value1, value2)) {
                updated.add(key);
            }
        }
        return { added, removed, updated };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsU3RhdGVNZXJnZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFTeW5jL2NvbW1vbi9nbG9iYWxTdGF0ZU1lcmdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBWWhHLHNCQXlHQztJQXpHRCxTQUFnQixLQUFLLENBQUMsWUFBOEMsRUFBRSxhQUFzRCxFQUFFLFdBQW9ELEVBQUUsV0FBb0YsRUFBRSxVQUF1QjtRQUNoUyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDcEIsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUNwTSxDQUFDO1FBRUQsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztRQUMzRCxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDNUcsNkNBQTZDO1lBQzdDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBQ3ZILENBQUM7UUFFRCxNQUFNLFlBQVksR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksR0FBRyxFQUFVLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxHQUFHLEVBQVUsRUFBRSxPQUFPLEVBQUUsSUFBSSxHQUFHLEVBQVUsRUFBRSxDQUFDO1FBQ3BPLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxHQUFHLEVBQVUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEdBQUcsRUFBVSxFQUFFLE9BQU8sRUFBRSxJQUFJLEdBQUcsRUFBVSxFQUFFLENBQUM7UUFFak8sTUFBTSxLQUFLLEdBQThHLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFB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LEtBQUssRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO0lBQzVOLENBQUM7SUFFRCxTQUFTLE9BQU8sQ0FBQyxJQUE0QixFQUFFLEVBQTBCO1FBQ3hFLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMvQixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksR0FBRyxFQUFVLENBQUMsQ0FBQztRQUM3SCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksR0FBRyxFQUFVLENBQUMsQ0FBQztRQUMvSCxNQUFNLE9BQU8sR0FBZ0IsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUUvQyxLQUFLLE1BQU0sR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQzVCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN0QixTQUFTO1lBQ1YsQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN6QixNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ3JDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEIsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQztJQUNwQyxDQUFDIn0=