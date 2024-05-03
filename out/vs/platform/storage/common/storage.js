/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/performance", "vs/base/common/types", "vs/base/parts/storage/common/storage", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, async_1, event_1, lifecycle_1, performance_1, types_1, storage_1, instantiation_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryStorageService = exports.AbstractStorageService = exports.StorageTarget = exports.StorageScope = exports.WillSaveStateReason = exports.IStorageService = exports.TARGET_KEY = exports.IS_NEW_KEY = void 0;
    exports.loadKeyTargets = loadKeyTargets;
    exports.isProfileUsingDefaultStorage = isProfileUsingDefaultStorage;
    exports.logStorage = logStorage;
    exports.IS_NEW_KEY = '__$__isNewStorageMarker';
    exports.TARGET_KEY = '__$__targetStorageMarker';
    exports.IStorageService = (0, instantiation_1.createDecorator)('storageService');
    var WillSaveStateReason;
    (function (WillSaveStateReason) {
        /**
         * No specific reason to save state.
         */
        WillSaveStateReason[WillSaveStateReason["NONE"] = 0] = "NONE";
        /**
         * A hint that the workbench is about to shutdown.
         */
        WillSaveStateReason[WillSaveStateReason["SHUTDOWN"] = 1] = "SHUTDOWN";
    })(WillSaveStateReason || (exports.WillSaveStateReason = WillSaveStateReason = {}));
    var StorageScope;
    (function (StorageScope) {
        /**
         * The stored data will be scoped to all workspaces across all profiles.
         */
        StorageScope[StorageScope["APPLICATION"] = -1] = "APPLICATION";
        /**
         * The stored data will be scoped to all workspaces of the same profile.
         */
        StorageScope[StorageScope["PROFILE"] = 0] = "PROFILE";
        /**
         * The stored data will be scoped to the current workspace.
         */
        StorageScope[StorageScope["WORKSPACE"] = 1] = "WORKSPACE";
    })(StorageScope || (exports.StorageScope = StorageScope = {}));
    var StorageTarget;
    (function (StorageTarget) {
        /**
         * The stored data is user specific and applies across machines.
         */
        StorageTarget[StorageTarget["USER"] = 0] = "USER";
        /**
         * The stored data is machine specific.
         */
        StorageTarget[StorageTarget["MACHINE"] = 1] = "MACHINE";
    })(StorageTarget || (exports.StorageTarget = StorageTarget = {}));
    function loadKeyTargets(storage) {
        const keysRaw = storage.get(exports.TARGET_KEY);
        if (keysRaw) {
            try {
                return JSON.parse(keysRaw);
            }
            catch (error) {
                // Fail gracefully
            }
        }
        return Object.create(null);
    }
    class AbstractStorageService extends lifecycle_1.Disposable {
        static { this.DEFAULT_FLUSH_INTERVAL = 60 * 1000; } // every minute
        constructor(options = { flushInterval: AbstractStorageService.DEFAULT_FLUSH_INTERVAL }) {
            super();
            this.options = options;
            this._onDidChangeValue = this._register(new event_1.PauseableEmitter());
            this._onDidChangeTarget = this._register(new event_1.PauseableEmitter());
            this.onDidChangeTarget = this._onDidChangeTarget.event;
            this._onWillSaveState = this._register(new event_1.Emitter());
            this.onWillSaveState = this._onWillSaveState.event;
            this.flushWhenIdleScheduler = this._register(new async_1.RunOnceScheduler(() => this.doFlushWhenIdle(), this.options.flushInterval));
            this.runFlushWhenIdle = this._register(new lifecycle_1.MutableDisposable());
            this._workspaceKeyTargets = undefined;
            this._profileKeyTargets = undefined;
            this._applicationKeyTargets = undefined;
        }
        onDidChangeValue(scope, key, disposable) {
            return event_1.Event.filter(this._onDidChangeValue.event, e => e.scope === scope && (key === undefined || e.key === key), disposable);
        }
        doFlushWhenIdle() {
            this.runFlushWhenIdle.value = (0, async_1.runWhenGlobalIdle)(() => {
                if (this.shouldFlushWhenIdle()) {
                    this.flush();
                }
                // repeat
                this.flushWhenIdleScheduler.schedule();
            });
        }
        shouldFlushWhenIdle() {
            return true;
        }
        stopFlushWhenIdle() {
            (0, lifecycle_1.dispose)([this.runFlushWhenIdle, this.flushWhenIdleScheduler]);
        }
        initialize() {
            if (!this.initializationPromise) {
                this.initializationPromise = (async () => {
                    // Init all storage locations
                    (0, performance_1.mark)('code/willInitStorage');
                    try {
                        await this.doInitialize(); // Ask subclasses to initialize storage
                    }
                    finally {
                        (0, performance_1.mark)('code/didInitStorage');
                    }
                    // On some OS we do not get enough time to persist state on shutdown (e.g. when
                    // Windows restarts after applying updates). In other cases, VSCode might crash,
                    // so we periodically save state to reduce the chance of loosing any state.
                    // In the browser we do not have support for long running unload sequences. As such,
                    // we cannot ask for saving state in that moment, because that would result in a
                    // long running operation.
                    // Instead, periodically ask customers to save save. The library will be clever enough
                    // to only save state that has actually changed.
                    this.flushWhenIdleScheduler.schedule();
                })();
            }
            return this.initializationPromise;
        }
        emitDidChangeValue(scope, event) {
            const { key, external } = event;
            // Specially handle `TARGET_KEY`
            if (key === exports.TARGET_KEY) {
                // Clear our cached version which is now out of date
                switch (scope) {
                    case -1 /* StorageScope.APPLICATION */:
                        this._applicationKeyTargets = undefined;
                        break;
                    case 0 /* StorageScope.PROFILE */:
                        this._profileKeyTargets = undefined;
                        break;
                    case 1 /* StorageScope.WORKSPACE */:
                        this._workspaceKeyTargets = undefined;
                        break;
                }
                // Emit as `didChangeTarget` event
                this._onDidChangeTarget.fire({ scope });
            }
            // Emit any other key to outside
            else {
                this._onDidChangeValue.fire({ scope, key, target: this.getKeyTargets(scope)[key], external });
            }
        }
        emitWillSaveState(reason) {
            this._onWillSaveState.fire({ reason });
        }
        get(key, scope, fallbackValue) {
            return this.getStorage(scope)?.get(key, fallbackValue);
        }
        getBoolean(key, scope, fallbackValue) {
            return this.getStorage(scope)?.getBoolean(key, fallbackValue);
        }
        getNumber(key, scope, fallbackValue) {
            return this.getStorage(scope)?.getNumber(key, fallbackValue);
        }
        getObject(key, scope, fallbackValue) {
            return this.getStorage(scope)?.getObject(key, fallbackValue);
        }
        storeAll(entries, external) {
            this.withPausedEmitters(() => {
                for (const entry of entries) {
                    this.store(entry.key, entry.value, entry.scope, entry.target, external);
                }
            });
        }
        store(key, value, scope, target, external = false) {
            // We remove the key for undefined/null values
            if ((0, types_1.isUndefinedOrNull)(value)) {
                this.remove(key, scope, external);
                return;
            }
            // Update our datastructures but send events only after
            this.withPausedEmitters(() => {
                // Update key-target map
                this.updateKeyTarget(key, scope, target);
                // Store actual value
                this.getStorage(scope)?.set(key, value, external);
            });
        }
        remove(key, scope, external = false) {
            // Update our datastructures but send events only after
            this.withPausedEmitters(() => {
                // Update key-target map
                this.updateKeyTarget(key, scope, undefined);
                // Remove actual key
                this.getStorage(scope)?.delete(key, external);
            });
        }
        withPausedEmitters(fn) {
            // Pause emitters
            this._onDidChangeValue.pause();
            this._onDidChangeTarget.pause();
            try {
                fn();
            }
            finally {
                // Resume emitters
                this._onDidChangeValue.resume();
                this._onDidChangeTarget.resume();
            }
        }
        keys(scope, target) {
            const keys = [];
            const keyTargets = this.getKeyTargets(scope);
            for (const key of Object.keys(keyTargets)) {
                const keyTarget = keyTargets[key];
                if (keyTarget === target) {
                    keys.push(key);
                }
            }
            return keys;
        }
        updateKeyTarget(key, scope, target, external = false) {
            // Add
            const keyTargets = this.getKeyTargets(scope);
            if (typeof target === 'number') {
                if (keyTargets[key] !== target) {
                    keyTargets[key] = target;
                    this.getStorage(scope)?.set(exports.TARGET_KEY, JSON.stringify(keyTargets), external);
                }
            }
            // Remove
            else {
                if (typeof keyTargets[key] === 'number') {
                    delete keyTargets[key];
                    this.getStorage(scope)?.set(exports.TARGET_KEY, JSON.stringify(keyTargets), external);
                }
            }
        }
        get workspaceKeyTargets() {
            if (!this._workspaceKeyTargets) {
                this._workspaceKeyTargets = this.loadKeyTargets(1 /* StorageScope.WORKSPACE */);
            }
            return this._workspaceKeyTargets;
        }
        get profileKeyTargets() {
            if (!this._profileKeyTargets) {
                this._profileKeyTargets = this.loadKeyTargets(0 /* StorageScope.PROFILE */);
            }
            return this._profileKeyTargets;
        }
        get applicationKeyTargets() {
            if (!this._applicationKeyTargets) {
                this._applicationKeyTargets = this.loadKeyTargets(-1 /* StorageScope.APPLICATION */);
            }
            return this._applicationKeyTargets;
        }
        getKeyTargets(scope) {
            switch (scope) {
                case -1 /* StorageScope.APPLICATION */:
                    return this.applicationKeyTargets;
                case 0 /* StorageScope.PROFILE */:
                    return this.profileKeyTargets;
                default:
                    return this.workspaceKeyTargets;
            }
        }
        loadKeyTargets(scope) {
            const storage = this.getStorage(scope);
            return storage ? loadKeyTargets(storage) : Object.create(null);
        }
        isNew(scope) {
            return this.getBoolean(exports.IS_NEW_KEY, scope) === true;
        }
        async flush(reason = WillSaveStateReason.NONE) {
            // Signal event to collect changes
            this._onWillSaveState.fire({ reason });
            const applicationStorage = this.getStorage(-1 /* StorageScope.APPLICATION */);
            const profileStorage = this.getStorage(0 /* StorageScope.PROFILE */);
            const workspaceStorage = this.getStorage(1 /* StorageScope.WORKSPACE */);
            switch (reason) {
                // Unspecific reason: just wait when data is flushed
                case WillSaveStateReason.NONE:
                    await async_1.Promises.settled([
                        applicationStorage?.whenFlushed() ?? Promise.resolve(),
                        profileStorage?.whenFlushed() ?? Promise.resolve(),
                        workspaceStorage?.whenFlushed() ?? Promise.resolve()
                    ]);
                    break;
                // Shutdown: we want to flush as soon as possible
                // and not hit any delays that might be there
                case WillSaveStateReason.SHUTDOWN:
                    await async_1.Promises.settled([
                        applicationStorage?.flush(0) ?? Promise.resolve(),
                        profileStorage?.flush(0) ?? Promise.resolve(),
                        workspaceStorage?.flush(0) ?? Promise.resolve()
                    ]);
                    break;
            }
        }
        async log() {
            const applicationItems = this.getStorage(-1 /* StorageScope.APPLICATION */)?.items ?? new Map();
            const profileItems = this.getStorage(0 /* StorageScope.PROFILE */)?.items ?? new Map();
            const workspaceItems = this.getStorage(1 /* StorageScope.WORKSPACE */)?.items ?? new Map();
            return logStorage(applicationItems, profileItems, workspaceItems, this.getLogDetails(-1 /* StorageScope.APPLICATION */) ?? '', this.getLogDetails(0 /* StorageScope.PROFILE */) ?? '', this.getLogDetails(1 /* StorageScope.WORKSPACE */) ?? '');
        }
        async optimize(scope) {
            // Await pending data to be flushed to the DB
            // before attempting to optimize the DB
            await this.flush();
            return this.getStorage(scope)?.optimize();
        }
        async switch(to, preserveData) {
            // Signal as event so that clients can store data before we switch
            this.emitWillSaveState(WillSaveStateReason.NONE);
            if ((0, userDataProfile_1.isUserDataProfile)(to)) {
                return this.switchToProfile(to, preserveData);
            }
            return this.switchToWorkspace(to, preserveData);
        }
        canSwitchProfile(from, to) {
            if (from.id === to.id) {
                return false; // both profiles are same
            }
            if (isProfileUsingDefaultStorage(to) && isProfileUsingDefaultStorage(from)) {
                return false; // both profiles are using default
            }
            return true;
        }
        switchData(oldStorage, newStorage, scope) {
            this.withPausedEmitters(() => {
                // Signal storage keys that have changed
                const handledkeys = new Set();
                for (const [key, oldValue] of oldStorage) {
                    handledkeys.add(key);
                    const newValue = newStorage.get(key);
                    if (newValue !== oldValue) {
                        this.emitDidChangeValue(scope, { key, external: true });
                    }
                }
                for (const [key] of newStorage.items) {
                    if (!handledkeys.has(key)) {
                        this.emitDidChangeValue(scope, { key, external: true });
                    }
                }
            });
        }
    }
    exports.AbstractStorageService = AbstractStorageService;
    function isProfileUsingDefaultStorage(profile) {
        return profile.isDefault || !!profile.useDefaultFlags?.globalState;
    }
    class InMemoryStorageService extends AbstractStorageService {
        constructor() {
            super();
            this.applicationStorage = this._register(new storage_1.Storage(new storage_1.InMemoryStorageDatabase(), { hint: storage_1.StorageHint.STORAGE_IN_MEMORY }));
            this.profileStorage = this._register(new storage_1.Storage(new storage_1.InMemoryStorageDatabase(), { hint: storage_1.StorageHint.STORAGE_IN_MEMORY }));
            this.workspaceStorage = this._register(new storage_1.Storage(new storage_1.InMemoryStorageDatabase(), { hint: storage_1.StorageHint.STORAGE_IN_MEMORY }));
            this._register(this.workspaceStorage.onDidChangeStorage(e => this.emitDidChangeValue(1 /* StorageScope.WORKSPACE */, e)));
            this._register(this.profileStorage.onDidChangeStorage(e => this.emitDidChangeValue(0 /* StorageScope.PROFILE */, e)));
            this._register(this.applicationStorage.onDidChangeStorage(e => this.emitDidChangeValue(-1 /* StorageScope.APPLICATION */, e)));
        }
        getStorage(scope) {
            switch (scope) {
                case -1 /* StorageScope.APPLICATION */:
                    return this.applicationStorage;
                case 0 /* StorageScope.PROFILE */:
                    return this.profileStorage;
                default:
                    return this.workspaceStorage;
            }
        }
        getLogDetails(scope) {
            switch (scope) {
                case -1 /* StorageScope.APPLICATION */:
                    return 'inMemory (application)';
                case 0 /* StorageScope.PROFILE */:
                    return 'inMemory (profile)';
                default:
                    return 'inMemory (workspace)';
            }
        }
        async doInitialize() { }
        async switchToProfile() {
            // no-op when in-memory
        }
        async switchToWorkspace() {
            // no-op when in-memory
        }
        shouldFlushWhenIdle() {
            return false;
        }
        hasScope(scope) {
            return false;
        }
    }
    exports.InMemoryStorageService = InMemoryStorageService;
    async function logStorage(application, profile, workspace, applicationPath, profilePath, workspacePath) {
        const safeParse = (value) => {
            try {
                return JSON.parse(value);
            }
            catch (error) {
                return value;
            }
        };
        const applicationItems = new Map();
        const applicationItemsParsed = new Map();
        application.forEach((value, key) => {
            applicationItems.set(key, value);
            applicationItemsParsed.set(key, safeParse(value));
        });
        const profileItems = new Map();
        const profileItemsParsed = new Map();
        profile.forEach((value, key) => {
            profileItems.set(key, value);
            profileItemsParsed.set(key, safeParse(value));
        });
        const workspaceItems = new Map();
        const workspaceItemsParsed = new Map();
        workspace.forEach((value, key) => {
            workspaceItems.set(key, value);
            workspaceItemsParsed.set(key, safeParse(value));
        });
        if (applicationPath !== profilePath) {
            console.group(`Storage: Application (path: ${applicationPath})`);
        }
        else {
            console.group(`Storage: Application & Profile (path: ${applicationPath}, default profile)`);
        }
        const applicationValues = [];
        applicationItems.forEach((value, key) => {
            applicationValues.push({ key, value });
        });
        console.table(applicationValues);
        console.groupEnd();
        console.log(applicationItemsParsed);
        if (applicationPath !== profilePath) {
            console.group(`Storage: Profile (path: ${profilePath}, profile specific)`);
            const profileValues = [];
            profileItems.forEach((value, key) => {
                profileValues.push({ key, value });
            });
            console.table(profileValues);
            console.groupEnd();
            console.log(profileItemsParsed);
        }
        console.group(`Storage: Workspace (path: ${workspacePath})`);
        const workspaceValues = [];
        workspaceItems.forEach((value, key) => {
            workspaceValues.push({ key, value });
        });
        console.table(workspaceValues);
        console.groupEnd();
        console.log(workspaceItemsParsed);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vc3RvcmFnZS9jb21tb24vc3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEwU2hHLHdDQVdDO0lBb1lELG9FQUVDO0lBeURELGdDQWlFQztJQXp5QlksUUFBQSxVQUFVLEdBQUcseUJBQXlCLENBQUM7SUFDdkMsUUFBQSxVQUFVLEdBQUcsMEJBQTBCLENBQUM7SUFFeEMsUUFBQSxlQUFlLEdBQUcsSUFBQSwrQkFBZSxFQUFrQixnQkFBZ0IsQ0FBQyxDQUFDO0lBRWxGLElBQVksbUJBV1g7SUFYRCxXQUFZLG1CQUFtQjtRQUU5Qjs7V0FFRztRQUNILDZEQUFJLENBQUE7UUFFSjs7V0FFRztRQUNILHFFQUFRLENBQUE7SUFDVCxDQUFDLEVBWFcsbUJBQW1CLG1DQUFuQixtQkFBbUIsUUFXOUI7SUErTEQsSUFBa0IsWUFnQmpCO0lBaEJELFdBQWtCLFlBQVk7UUFFN0I7O1dBRUc7UUFDSCw4REFBZ0IsQ0FBQTtRQUVoQjs7V0FFRztRQUNILHFEQUFXLENBQUE7UUFFWDs7V0FFRztRQUNILHlEQUFhLENBQUE7SUFDZCxDQUFDLEVBaEJpQixZQUFZLDRCQUFaLFlBQVksUUFnQjdCO0lBRUQsSUFBa0IsYUFXakI7SUFYRCxXQUFrQixhQUFhO1FBRTlCOztXQUVHO1FBQ0gsaURBQUksQ0FBQTtRQUVKOztXQUVHO1FBQ0gsdURBQU8sQ0FBQTtJQUNSLENBQUMsRUFYaUIsYUFBYSw2QkFBYixhQUFhLFFBVzlCO0lBa0RELFNBQWdCLGNBQWMsQ0FBQyxPQUFpQjtRQUMvQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFVLENBQUMsQ0FBQztRQUN4QyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ2IsSUFBSSxDQUFD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