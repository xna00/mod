/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/storage/common/storage"], function (require, exports, event_1, lifecycle_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProfileStorageChangesListenerChannel = void 0;
    class ProfileStorageChangesListenerChannel extends lifecycle_1.Disposable {
        constructor(storageMainService, userDataProfilesService, logService) {
            super();
            this.storageMainService = storageMainService;
            this.userDataProfilesService = userDataProfilesService;
            this.logService = logService;
            const disposable = this._register(new lifecycle_1.MutableDisposable());
            this._onDidChange = this._register(new event_1.Emitter({
                // Start listening to profile storage changes only when someone is listening
                onWillAddFirstListener: () => disposable.value = this.registerStorageChangeListeners(),
                // Stop listening to profile storage changes when no one is listening
                onDidRemoveLastListener: () => disposable.value = undefined
            }));
        }
        registerStorageChangeListeners() {
            this.logService.debug('ProfileStorageChangesListenerChannel#registerStorageChangeListeners');
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(event_1.Event.debounce(this.storageMainService.applicationStorage.onDidChangeStorage, (keys, e) => {
                if (keys) {
                    keys.push(e.key);
                }
                else {
                    keys = [e.key];
                }
                return keys;
            }, 100)(keys => this.onDidChangeApplicationStorage(keys)));
            disposables.add(event_1.Event.debounce(this.storageMainService.onDidChangeProfileStorage, (changes, e) => {
                if (!changes) {
                    changes = new Map();
                }
                let profileChanges = changes.get(e.profile.id);
                if (!profileChanges) {
                    changes.set(e.profile.id, profileChanges = { profile: e.profile, keys: [], storage: e.storage });
                }
                profileChanges.keys.push(e.key);
                return changes;
            }, 100)(keys => this.onDidChangeProfileStorage(keys)));
            return disposables;
        }
        onDidChangeApplicationStorage(keys) {
            const targetChangedProfiles = keys.includes(storage_1.TARGET_KEY) ? [this.userDataProfilesService.defaultProfile] : [];
            const profileStorageValueChanges = [];
            keys = keys.filter(key => key !== storage_1.TARGET_KEY);
            if (keys.length) {
                const keyTargets = (0, storage_1.loadKeyTargets)(this.storageMainService.applicationStorage.storage);
                profileStorageValueChanges.push({ profile: this.userDataProfilesService.defaultProfile, changes: keys.map(key => ({ key, scope: 0 /* StorageScope.PROFILE */, target: keyTargets[key] })) });
            }
            this.triggerEvents(targetChangedProfiles, profileStorageValueChanges);
        }
        onDidChangeProfileStorage(changes) {
            const targetChangedProfiles = [];
            const profileStorageValueChanges = new Map();
            for (const [profileId, profileChanges] of changes.entries()) {
                if (profileChanges.keys.includes(storage_1.TARGET_KEY)) {
                    targetChangedProfiles.push(profileChanges.profile);
                }
                const keys = profileChanges.keys.filter(key => key !== storage_1.TARGET_KEY);
                if (keys.length) {
                    const keyTargets = (0, storage_1.loadKeyTargets)(profileChanges.storage.storage);
                    profileStorageValueChanges.set(profileId, { profile: profileChanges.profile, changes: keys.map(key => ({ key, scope: 0 /* StorageScope.PROFILE */, target: keyTargets[key] })) });
                }
            }
            this.triggerEvents(targetChangedProfiles, [...profileStorageValueChanges.values()]);
        }
        triggerEvents(targetChanges, valueChanges) {
            if (targetChanges.length || valueChanges.length) {
                this._onDidChange.fire({ valueChanges, targetChanges });
            }
        }
        listen(_, event, arg) {
            switch (event) {
                case 'onDidChange': return this._onDidChange.event;
            }
            throw new Error(`[ProfileStorageChangesListenerChannel] Event not found: ${event}`);
        }
        async call(_, command) {
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.ProfileStorageChangesListenerChannel = ProfileStorageChangesListenerChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlU3RvcmFnZUlwYy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFQcm9maWxlL2VsZWN0cm9uLW1haW4vdXNlckRhdGFQcm9maWxlU3RvcmFnZUlwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsTUFBYSxvQ0FBcUMsU0FBUSxzQkFBVTtRQUluRSxZQUNrQixrQkFBdUMsRUFDdkMsdUJBQWlELEVBQ2pELFVBQXVCO1lBRXhDLEtBQUssRUFBRSxDQUFDO1lBSlMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUN2Qyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ2pELGVBQVUsR0FBVixVQUFVLENBQWE7WUFHeEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFlLENBQUMsQ0FBQztZQUN4RSxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLENBQzdDO2dCQUNDLDRFQUE0RTtnQkFDNUUsc0JBQXNCLEVBQUUsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsOEJBQThCLEVBQUU7Z0JBQ3RGLHFFQUFxRTtnQkFDckUsdUJBQXVCLEVBQUUsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxTQUFTO2FBQzNELENBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLDhCQUE4QjtZQUNyQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxxRUFBcUUsQ0FBQyxDQUFDO1lBQzdGLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsYUFBSyxDQUFDLFFB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