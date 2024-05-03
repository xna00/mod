/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testTypes", "vs/workbench/contrib/testing/common/testingContextKeys"], function (require, exports, event_1, lifecycle_1, objects_1, contextkey_1, instantiation_1, storage_1, storedValue_1, testId_1, testTypes_1, testingContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestProfileService = exports.capabilityContextKeys = exports.canUseProfileWithTest = exports.ITestProfileService = void 0;
    exports.ITestProfileService = (0, instantiation_1.createDecorator)('testProfileService');
    /**
     * Gets whether the given profile can be used to run the test.
     */
    const canUseProfileWithTest = (profile, test) => profile.controllerId === test.controllerId && (testId_1.TestId.isRoot(test.item.extId) || !profile.tag || test.item.tags.includes(profile.tag));
    exports.canUseProfileWithTest = canUseProfileWithTest;
    const sorter = (a, b) => {
        if (a.isDefault !== b.isDefault) {
            return a.isDefault ? -1 : 1;
        }
        return a.label.localeCompare(b.label);
    };
    /**
     * Given a capabilities bitset, returns a map of context keys representing
     * them.
     */
    const capabilityContextKeys = (capabilities) => [
        [testingContextKeys_1.TestingContextKeys.hasRunnableTests.key, (capabilities & 2 /* TestRunProfileBitset.Run */) !== 0],
        [testingContextKeys_1.TestingContextKeys.hasDebuggableTests.key, (capabilities & 4 /* TestRunProfileBitset.Debug */) !== 0],
        [testingContextKeys_1.TestingContextKeys.hasCoverableTests.key, (capabilities & 8 /* TestRunProfileBitset.Coverage */) !== 0],
    ];
    exports.capabilityContextKeys = capabilityContextKeys;
    let TestProfileService = class TestProfileService extends lifecycle_1.Disposable {
        constructor(contextKeyService, storageService) {
            super();
            this.changeEmitter = this._register(new event_1.Emitter());
            this.controllerProfiles = new Map();
            /** @inheritdoc */
            this.onDidChange = this.changeEmitter.event;
            storageService.remove('testingPreferredProfiles', 1 /* StorageScope.WORKSPACE */); // cleanup old format
            this.userDefaults = this._register(new storedValue_1.StoredValue({
                key: 'testingPreferredProfiles2',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 1 /* StorageTarget.MACHINE */,
            }, storageService));
            this.capabilitiesContexts = {
                [2 /* TestRunProfileBitset.Run */]: testingContextKeys_1.TestingContextKeys.hasRunnableTests.bindTo(contextKeyService),
                [4 /* TestRunProfileBitset.Debug */]: testingContextKeys_1.TestingContextKeys.hasDebuggableTests.bindTo(contextKeyService),
                [8 /* TestRunProfileBitset.Coverage */]: testingContextKeys_1.TestingContextKeys.hasCoverableTests.bindTo(contextKeyService),
                [16 /* TestRunProfileBitset.HasNonDefaultProfile */]: testingContextKeys_1.TestingContextKeys.hasNonDefaultProfile.bindTo(contextKeyService),
                [32 /* TestRunProfileBitset.HasConfigurable */]: testingContextKeys_1.TestingContextKeys.hasConfigurableProfile.bindTo(contextKeyService),
                [64 /* TestRunProfileBitset.SupportsContinuousRun */]: testingContextKeys_1.TestingContextKeys.supportsContinuousRun.bindTo(contextKeyService),
            };
            this.refreshContextKeys();
        }
        /** @inheritdoc */
        addProfile(controller, profile) {
            const previousExplicitDefaultValue = this.userDefaults.get()?.[controller.id]?.[profile.profileId];
            const extended = {
                ...profile,
                isDefault: previousExplicitDefaultValue ?? profile.isDefault,
                wasInitiallyDefault: profile.isDefault,
            };
            let record = this.controllerProfiles.get(profile.controllerId);
            if (record) {
                record.profiles.push(extended);
                record.profiles.sort(sorter);
            }
            else {
                record = {
                    profiles: [extended],
                    controller,
                };
                this.controllerProfiles.set(profile.controllerId, record);
            }
            this.refreshContextKeys();
            this.changeEmitter.fire();
        }
        /** @inheritdoc */
        updateProfile(controllerId, profileId, update) {
            const ctrl = this.controllerProfiles.get(controllerId);
            if (!ctrl) {
                return;
            }
            const profile = ctrl.profiles.find(c => c.controllerId === controllerId && c.profileId === profileId);
            if (!profile) {
                return;
            }
            Object.assign(profile, update);
            ctrl.profiles.sort(sorter);
            // store updates is isDefault as if the user changed it (which they might
            // have through some extension-contributed UI)
            if (update.isDefault !== undefined) {
                const map = (0, objects_1.deepClone)(this.userDefaults.get({}));
                setIsDefault(map, profile, update.isDefault);
                this.userDefaults.store(map);
            }
            this.changeEmitter.fire();
        }
        /** @inheritdoc */
        configure(controllerId, profileId) {
            this.controllerProfiles.get(controllerId)?.controller.configureRunProfile(profileId);
        }
        /** @inheritdoc */
        removeProfile(controllerId, profileId) {
            const ctrl = this.controllerProfiles.get(controllerId);
            if (!ctrl) {
                return;
            }
            if (!profileId) {
                this.controllerProfiles.delete(controllerId);
                this.changeEmitter.fire();
                return;
            }
            const index = ctrl.profiles.findIndex(c => c.profileId === profileId);
            if (index === -1) {
                return;
            }
            ctrl.profiles.splice(index, 1);
            this.refreshContextKeys();
            this.changeEmitter.fire();
        }
        /** @inheritdoc */
        capabilitiesForTest(test) {
            const ctrl = this.controllerProfiles.get(test.controllerId);
            if (!ctrl) {
                return 0;
            }
            let capabilities = 0;
            for (const profile of ctrl.profiles) {
                if (!profile.tag || test.item.tags.includes(profile.tag)) {
                    capabilities |= capabilities & profile.group ? 16 /* TestRunProfileBitset.HasNonDefaultProfile */ : profile.group;
                }
            }
            return capabilities;
        }
        /** @inheritdoc */
        all() {
            return this.controllerProfiles.values();
        }
        /** @inheritdoc */
        getControllerProfiles(profileId) {
            return this.controllerProfiles.get(profileId)?.profiles ?? [];
        }
        /** @inheritdoc */
        getGroupDefaultProfiles(group) {
            let defaults = [];
            for (const { profiles } of this.controllerProfiles.values()) {
                defaults = defaults.concat(profiles.filter(c => c.group === group && c.isDefault));
            }
            // have *some* default profile to run if none are set otherwise
            if (defaults.length === 0) {
                for (const { profiles } of this.controllerProfiles.values()) {
                    const first = profiles.find(p => p.group === group);
                    if (first) {
                        defaults.push(first);
                        break;
                    }
                }
            }
            return defaults;
        }
        /** @inheritdoc */
        setGroupDefaultProfiles(group, profiles) {
            const next = {};
            for (const ctrl of this.controllerProfiles.values()) {
                next[ctrl.controller.id] = {};
                for (const profile of ctrl.profiles) {
                    if (profile.group !== group) {
                        continue;
                    }
                    setIsDefault(next, profile, profiles.some(p => p.profileId === profile.profileId));
                }
                // When switching a profile, if the controller has a same-named profile in
                // other groups, update those to match the enablement state as well.
                for (const profile of ctrl.profiles) {
                    if (profile.group === group) {
                        continue;
                    }
                    const matching = ctrl.profiles.find(p => p.group === group && p.label === profile.label);
                    if (matching) {
                        setIsDefault(next, profile, matching.isDefault);
                    }
                }
                ctrl.profiles.sort(sorter);
            }
            this.userDefaults.store(next);
            this.changeEmitter.fire();
        }
        refreshContextKeys() {
            let allCapabilities = 0;
            for (const { profiles } of this.controllerProfiles.values()) {
                for (const profile of profiles) {
                    allCapabilities |= allCapabilities & profile.group ? 16 /* TestRunProfileBitset.HasNonDefaultProfile */ : profile.group;
                    allCapabilities |= profile.supportsContinuousRun ? 64 /* TestRunProfileBitset.SupportsContinuousRun */ : 0;
                }
            }
            for (const group of testTypes_1.testRunProfileBitsetList) {
                this.capabilitiesContexts[group].set((allCapabilities & group) !== 0);
            }
        }
    };
    exports.TestProfileService = TestProfileService;
    exports.TestProfileService = TestProfileService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, storage_1.IStorageService)
    ], TestProfileService);
    const setIsDefault = (map, profile, isDefault) => {
        profile.isDefault = isDefault;
        map[profile.controllerId] ??= {};
        if (profile.isDefault !== profile.wasInitiallyDefault) {
            map[profile.controllerId][profile.profileId] = profile.isDefault;
        }
        else {
            delete map[profile.controllerId][profile.profileId];
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFByb2ZpbGVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2NvbW1vbi90ZXN0UHJvZmlsZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY25GLFFBQUEsbUJBQW1CLEdBQUcsSUFBQSwrQkFBZSxFQUFzQixvQkFBb0IsQ0FBQyxDQUFDO0lBOEQ5Rjs7T0FFRztJQUNJLE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxPQUF3QixFQUFFLElBQXNCLEVBQUUsRUFBRSxDQUN6RixPQUFPLENBQUMsWUFBWSxLQUFLLElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxlQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUQzSCxRQUFBLHFCQUFxQix5QkFDc0c7SUFFeEksTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFrQixFQUFFLENBQWtCLEVBQUUsRUFBRTtRQUN6RCxJQUFJLENBQUMsQ0FBQyxTQUFTLEtBQUssQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2pDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3QixDQUFDO1FBRUQsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkMsQ0FBQyxDQUFDO0lBTUY7OztPQUdHO0lBQ0ksTUFBTSxxQkFBcUIsR0FBRyxD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