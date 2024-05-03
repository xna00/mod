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
define(["require", "exports", "vs/base/common/async", "vs/base/common/date", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/nls", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/userDataSync/common/userDataSyncMachines"], function (require, exports, async_1, date_1, errorMessage_1, errors_1, event_1, lifecycle_1, platform_1, resources_1, uri_1, nls_1, productService_1, storage_1, telemetry_1, userDataSync_1, userDataSyncAccount_1, userDataSyncMachines_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataAutoSyncService = void 0;
    const disableMachineEventuallyKey = 'sync.disableMachineEventually';
    const sessionIdKey = 'sync.sessionId';
    const storeUrlKey = 'sync.storeUrl';
    const productQualityKey = 'sync.productQuality';
    let UserDataAutoSyncService = class UserDataAutoSyncService extends lifecycle_1.Disposable {
        get syncUrl() {
            const value = this.storageService.get(storeUrlKey, -1 /* StorageScope.APPLICATION */);
            return value ? uri_1.URI.parse(value) : undefined;
        }
        set syncUrl(syncUrl) {
            if (syncUrl) {
                this.storageService.store(storeUrlKey, syncUrl.toString(), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(storeUrlKey, -1 /* StorageScope.APPLICATION */);
            }
        }
        get productQuality() {
            return this.storageService.get(productQualityKey, -1 /* StorageScope.APPLICATION */);
        }
        set productQuality(productQuality) {
            if (productQuality) {
                this.storageService.store(productQualityKey, productQuality, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(productQualityKey, -1 /* StorageScope.APPLICATION */);
            }
        }
        constructor(productService, userDataSyncStoreManagementService, userDataSyncStoreService, userDataSyncEnablementService, userDataSyncService, logService, userDataSyncAccountService, telemetryService, userDataSyncMachinesService, storageService) {
            super();
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.userDataSyncService = userDataSyncService;
            this.logService = logService;
            this.userDataSyncAccountService = userDataSyncAccountService;
            this.telemetryService = telemetryService;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this.storageService = storageService;
            this.autoSync = this._register(new lifecycle_1.MutableDisposable());
            this.successiveFailures = 0;
            this.lastSyncTriggerTime = undefined;
            this.suspendUntilRestart = false;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this.sources = [];
            this.syncTriggerDelayer = this._register(new async_1.ThrottledDelayer(this.getSyncTriggerDelayTime()));
            this.lastSyncUrl = this.syncUrl;
            this.syncUrl = userDataSyncStoreManagementService.userDataSyncStore?.url;
            this.previousProductQuality = this.productQuality;
            this.productQuality = productService.quality;
            if (this.syncUrl) {
                this.logService.info('Using settings sync service', this.syncUrl.toString());
                this._register(userDataSyncStoreManagementService.onDidChangeUserDataSyncStore(() => {
                    if (!(0, resources_1.isEqual)(this.syncUrl, userDataSyncStoreManagementService.userDataSyncStore?.url)) {
                        this.lastSyncUrl = this.syncUrl;
                        this.syncUrl = userDataSyncStoreManagementService.userDataSyncStore?.url;
                        if (this.syncUrl) {
                            this.logService.info('Using settings sync service', this.syncUrl.toString());
                        }
                    }
                }));
                if (this.userDataSyncEnablementService.isEnabled()) {
                    this.logService.info('Auto Sync is enabled.');
                }
                else {
                    this.logService.info('Auto Sync is disabled.');
                }
                this.updateAutoSync();
                if (this.hasToDisableMachineEventually()) {
                    this.disableMachineEventually();
                }
                this._register(userDataSyncAccountService.onDidChangeAccount(() => this.updateAutoSync()));
                this._register(userDataSyncStoreService.onDidChangeDonotMakeRequestsUntil(() => this.updateAutoSync()));
                this._register(userDataSyncService.onDidChangeLocal(source => this.triggerSync([source], false, false)));
                this._register(event_1.Event.filter(this.userDataSyncEnablementService.onDidChangeResourceEnablement, ([, enabled]) => enabled)(() => this.triggerSync(['resourceEnablement'], false, false)));
                this._register(this.userDataSyncStoreManagementService.onDidChangeUserDataSyncStore(() => this.triggerSync(['userDataSyncStoreChanged'], false, false)));
            }
        }
        updateAutoSync() {
            const { enabled, message } = this.isAutoSyncEnabled();
            if (enabled) {
                if (this.autoSync.value === undefined) {
                    this.autoSync.value = new AutoSync(this.lastSyncUrl, 1000 * 60 * 5 /* 5 miutes */, this.userDataSyncStoreManagementService, this.userDataSyncStoreService, this.userDataSyncService, this.userDataSyncMachinesService, this.logService, this.telemetryService, this.storageService);
                    this.autoSync.value.register(this.autoSync.value.onDidStartSync(() => this.lastSyncTriggerTime = new Date().getTime()));
                    this.autoSync.value.register(this.autoSync.value.onDidFinishSync(e => this.onDidFinishSync(e)));
                    if (this.startAutoSync()) {
                        this.autoSync.value.start();
                    }
                }
            }
            else {
                this.syncTriggerDelayer.cancel();
                if (this.autoSync.value !== undefined) {
                    if (message) {
                        this.logService.info(message);
                    }
                    this.autoSync.clear();
                }
                /* log message when auto sync is not disabled by user */
                else if (message && this.userDataSyncEnablementService.isEnabled()) {
                    this.logService.info(message);
                }
            }
        }
        // For tests purpose only
        startAutoSync() { return true; }
        isAutoSyncEnabled() {
            if (!this.userDataSyncEnablementService.isEnabled()) {
                return { enabled: false, message: 'Auto Sync: Disabled.' };
            }
            if (!this.userDataSyncAccountService.account) {
                return { enabled: false, message: 'Auto Sync: Suspended until auth token is available.' };
            }
            if (this.userDataSyncStoreService.donotMakeRequestsUntil) {
                return { enabled: false, message: `Auto Sync: Suspended until ${(0, date_1.toLocalISOString)(this.userDataSyncStoreService.donotMakeRequestsUntil)} because server is not accepting requests until then.` };
            }
            if (this.suspendUntilRestart) {
                return { enabled: false, message: 'Auto Sync: Suspended until restart.' };
            }
            return { enabled: true };
        }
        async turnOn() {
            this.stopDisableMachineEventually();
            this.lastSyncUrl = this.syncUrl;
            this.updateEnablement(true);
        }
        async turnOff(everywhere, softTurnOffOnError, donotRemoveMachine) {
            try {
                // Remove machine
                if (this.userDataSyncAccountService.account && !donotRemoveMachine) {
                    await this.userDataSyncMachinesService.removeCurrentMachine();
                }
                // Disable Auto Sync
                this.updateEnablement(false);
                // Reset Session
                this.storageService.remove(sessionIdKey, -1 /* StorageScope.APPLICATION */);
                // Reset
                if (everywhere) {
                    this.telemetryService.publicLog2('sync/turnOffEveryWhere');
                    await this.userDataSyncService.reset();
                }
                else {
                    await this.userDataSyncService.resetLocal();
                }
            }
            catch (error) {
                this.logService.error(error);
                if (softTurnOffOnError) {
                    this.updateEnablement(false);
                }
                else {
                    throw error;
                }
            }
        }
        updateEnablement(enabled) {
            if (this.userDataSyncEnablementService.isEnabled() !== enabled) {
                this.userDataSyncEnablementService.setEnablement(enabled);
                this.updateAutoSync();
            }
        }
        hasProductQualityChanged() {
            return !!this.previousProductQuality && !!this.productQuality && this.previousProductQuality !== this.productQuality;
        }
        async onDidFinishSync(error) {
            if (!error) {
                // Sync finished without errors
                this.successiveFailures = 0;
                return;
            }
            // Error while syncing
            const userDataSyncError = userDataSync_1.UserDataSyncError.toUserDataSyncError(error);
            // Log to telemetry
            if (userDataSyncError instanceof userDataSync_1.UserDataAutoSyncError) {
                this.telemetryService.publicLog2(`autosync/error`, { code: userDataSyncError.code, service: this.userDataSyncStoreManagementService.userDataSyncStore.url.toString() });
            }
            // Session got expired
            if (userDataSyncError.code === "SessionExpired" /* UserDataSyncErrorCode.SessionExpired */) {
                await this.turnOff(false, true /* force soft turnoff on error */);
                this.logService.info('Auto Sync: Turned off sync because current session is expired');
            }
            // Turned off from another device
            else if (userDataSyncError.code === "TurnedOff" /* UserDataSyncErrorCode.TurnedOff */) {
                await this.turnOff(false, true /* force soft turnoff on error */);
                this.logService.info('Auto Sync: Turned off sync because sync is turned off in the cloud');
            }
            // Exceeded Rate Limit on Client
            else if (userDataSyncError.code === "LocalTooManyRequests" /* UserDataSyncErrorCode.LocalTooManyRequests */) {
                this.suspendUntilRestart = true;
                this.logService.info('Auto Sync: Suspended sync because of making too many requests to server');
                this.updateAutoSync();
            }
            // Exceeded Rate Limit on Server
            else if (userDataSyncError.code === "RemoteTooManyRequests" /* UserDataSyncErrorCode.TooManyRequests */) {
                await this.turnOff(false, true /* force soft turnoff on error */, true /* do not disable machine because disabling a machine makes request to server and can fail with TooManyRequests */);
                this.disableMachineEventually();
                this.logService.info('Auto Sync: Turned off sync because of making too many requests to server');
            }
            // Method Not Found
            else if (userDataSyncError.code === "MethodNotFound" /* UserDataSyncErrorCode.MethodNotFound */) {
                await this.turnOff(false, true /* force soft turnoff on error */);
                this.logService.info('Auto Sync: Turned off sync because current client is making requests to server that are not supported');
            }
            // Upgrade Required or Gone
            else if (userDataSyncError.code === "UpgradeRequired" /* UserDataSyncErrorCode.UpgradeRequired */ || userDataSyncError.code === "Gone" /* UserDataSyncErrorCode.Gone */) {
                await this.turnOff(false, true /* force soft turnoff on error */, true /* do not disable machine because disabling a machine makes request to server and can fail with upgrade required or gone */);
                this.disableMachineEventually();
                this.logService.info('Auto Sync: Turned off sync because current client is not compatible with server. Requires client upgrade.');
            }
            // Incompatible Local Content
            else if (userDataSyncError.code === "IncompatibleLocalContent" /* UserDataSyncErrorCode.IncompatibleLocalContent */) {
                await this.turnOff(false, true /* force soft turnoff on error */);
                this.logService.info(`Auto Sync: Turned off sync because server has ${userDataSyncError.resource} content with newer version than of client. Requires client upgrade.`);
            }
            // Incompatible Remote Content
            else if (userDataSyncError.code === "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */) {
                await this.turnOff(false, true /* force soft turnoff on error */);
                this.logService.info(`Auto Sync: Turned off sync because server has ${userDataSyncError.resource} content with older version than of client. Requires server reset.`);
            }
            // Service changed
            else if (userDataSyncError.code === "ServiceChanged" /* UserDataSyncErrorCode.ServiceChanged */ || userDataSyncError.code === "DefaultServiceChanged" /* UserDataSyncErrorCode.DefaultServiceChanged */) {
                // Check if default settings sync service has changed in web without changing the product quality
                // Then turn off settings sync and ask user to turn on again
                if (platform_1.isWeb && userDataSyncError.code === "DefaultServiceChanged" /* UserDataSyncErrorCode.DefaultServiceChanged */ && !this.hasProductQualityChanged()) {
                    await this.turnOff(false, true /* force soft turnoff on error */);
                    this.logService.info('Auto Sync: Turned off sync because default sync service is changed.');
                }
                // Service has changed by the user. So turn off and turn on sync.
                // Show a prompt to the user about service change.
                else {
                    await this.turnOff(false, true /* force soft turnoff on error */, true /* do not disable machine */);
                    await this.turnOn();
                    this.logService.info('Auto Sync: Sync Service changed. Turned off auto sync, reset local state and turned on auto sync.');
                }
            }
            else {
                this.logService.error(userDataSyncError);
                this.successiveFailures++;
            }
            this._onError.fire(userDataSyncError);
        }
        async disableMachineEventually() {
            this.storageService.store(disableMachineEventuallyKey, true, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            await (0, async_1.timeout)(1000 * 60 * 10);
            // Return if got stopped meanwhile.
            if (!this.hasToDisableMachineEventually()) {
                return;
            }
            this.stopDisableMachineEventually();
            // disable only if sync is disabled
            if (!this.userDataSyncEnablementService.isEnabled() && this.userDataSyncAccountService.account) {
                await this.userDataSyncMachinesService.removeCurrentMachine();
            }
        }
        hasToDisableMachineEventually() {
            return this.storageService.getBoolean(disableMachineEventuallyKey, -1 /* StorageScope.APPLICATION */, false);
        }
        stopDisableMachineEventually() {
            this.storageService.remove(disableMachineEventuallyKey, -1 /* StorageScope.APPLICATION */);
        }
        async triggerSync(sources, skipIfSyncedRecently, disableCache) {
            if (this.autoSync.value === undefined) {
                return this.syncTriggerDelayer.cancel();
            }
            if (skipIfSyncedRecently && this.lastSyncTriggerTime
                && Math.round((new Date().getTime() - this.lastSyncTriggerTime) / 1000) < 10) {
                this.logService.debug('Auto Sync: Skipped. Limited to once per 10 seconds.');
                return;
            }
            this.sources.push(...sources);
            return this.syncTriggerDelayer.trigger(async () => {
                this.logService.trace('activity sources', ...this.sources);
                const providerId = this.userDataSyncAccountService.account?.authenticationProviderId || '';
                this.telemetryService.publicLog2('sync/triggered', { sources: this.sources, providerId });
                this.sources = [];
                if (this.autoSync.value) {
                    await this.autoSync.value.sync('Activity', disableCache);
                }
            }, this.successiveFailures
                ? this.getSyncTriggerDelayTime() * 1 * Math.min(Math.pow(2, this.successiveFailures), 60) /* Delay exponentially until max 1 minute */
                : this.getSyncTriggerDelayTime());
        }
        getSyncTriggerDelayTime() {
            return 2000; /* Debounce for 2 seconds if there are no failures */
        }
    };
    exports.UserDataAutoSyncService = UserDataAutoSyncService;
    exports.UserDataAutoSyncService = UserDataAutoSyncService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(2, userDataSync_1.IUserDataSyncStoreService),
        __param(3, userDataSync_1.IUserDataSyncEnablementService),
        __param(4, userDataSync_1.IUserDataSyncService),
        __param(5, userDataSync_1.IUserDataSyncLogService),
        __param(6, userDataSyncAccount_1.IUserDataSyncAccountService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(9, storage_1.IStorageService)
    ], UserDataAutoSyncService);
    class AutoSync extends lifecycle_1.Disposable {
        static { this.INTERVAL_SYNCING = 'Interval'; }
        constructor(lastSyncUrl, interval /* in milliseconds */, userDataSyncStoreManagementService, userDataSyncStoreService, userDataSyncService, userDataSyncMachinesService, logService, telemetryService, storageService) {
            super();
            this.lastSyncUrl = lastSyncUrl;
            this.interval = interval;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncService = userDataSyncService;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this.logService = logService;
            this.telemetryService = telemetryService;
            this.storageService = storageService;
            this.intervalHandler = this._register(new lifecycle_1.MutableDisposable());
            this._onDidStartSync = this._register(new event_1.Emitter());
            this.onDidStartSync = this._onDidStartSync.event;
            this._onDidFinishSync = this._register(new event_1.Emitter());
            this.onDidFinishSync = this._onDidFinishSync.event;
            this.manifest = null;
        }
        start() {
            this._register(this.onDidFinishSync(() => this.waitUntilNextIntervalAndSync()));
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (this.syncPromise) {
                    this.syncPromise.cancel();
                    this.logService.info('Auto sync: Cancelled sync that is in progress');
                    this.syncPromise = undefined;
                }
                this.syncTask?.stop();
                this.logService.info('Auto Sync: Stopped');
            }));
            this.sync(AutoSync.INTERVAL_SYNCING, false);
        }
        waitUntilNextIntervalAndSync() {
            this.intervalHandler.value = (0, async_1.disposableTimeout)(() => {
                this.sync(AutoSync.INTERVAL_SYNCING, false);
                this.intervalHandler.value = undefined;
            }, this.interval);
        }
        sync(reason, disableCache) {
            const syncPromise = (0, async_1.createCancelablePromise)(async (token) => {
                if (this.syncPromise) {
                    try {
                        // Wait until existing sync is finished
                        this.logService.debug('Auto Sync: Waiting until sync is finished.');
                        await this.syncPromise;
                    }
                    catch (error) {
                        if ((0, errors_1.isCancellationError)(error)) {
                            // Cancelled => Disposed. Donot continue sync.
                            return;
                        }
                    }
                }
                return this.doSync(reason, disableCache, token);
            });
            this.syncPromise = syncPromise;
            this.syncPromise.finally(() => this.syncPromise = undefined);
            return this.syncPromise;
        }
        hasSyncServiceChanged() {
            return this.lastSyncUrl !== undefined && !(0, resources_1.isEqual)(this.lastSyncUrl, this.userDataSyncStoreManagementService.userDataSyncStore?.url);
        }
        async hasDefaultServiceChanged() {
            const previous = await this.userDataSyncStoreManagementService.getPreviousUserDataSyncStore();
            const current = this.userDataSyncStoreManagementService.userDataSyncStore;
            // check if defaults changed
            return !!current && !!previous &&
                (!(0, resources_1.isEqual)(current.defaultUrl, previous.defaultUrl) ||
                    !(0, resources_1.isEqual)(current.insidersUrl, previous.insidersUrl) ||
                    !(0, resources_1.isEqual)(current.stableUrl, previous.stableUrl));
        }
        async doSync(reason, disableCache, token) {
            this.logService.info(`Auto Sync: Triggered by ${reason}`);
            this._onDidStartSync.fire();
            let error;
            try {
                await this.createAndRunSyncTask(disableCache, token);
            }
            catch (e) {
                this.logService.error(e);
                error = e;
                if (userDataSync_1.UserDataSyncError.toUserDataSyncError(e).code === "MethodNotFound" /* UserDataSyncErrorCode.MethodNotFound */) {
                    try {
                        this.logService.info('Auto Sync: Client is making invalid requests. Cleaning up data...');
                        await this.userDataSyncService.cleanUpRemoteData();
                        this.logService.info('Auto Sync: Retrying sync...');
                        await this.createAndRunSyncTask(disableCache, token);
                        error = undefined;
                    }
                    catch (e1) {
                        this.logService.error(e1);
                        error = e1;
                    }
                }
            }
            this._onDidFinishSync.fire(error);
        }
        async createAndRunSyncTask(disableCache, token) {
            this.syncTask = await this.userDataSyncService.createSyncTask(this.manifest, disableCache);
            if (token.isCancellationRequested) {
                return;
            }
            this.manifest = this.syncTask.manifest;
            // Server has no data but this machine was synced before
            if (this.manifest === null && await this.userDataSyncService.hasPreviouslySynced()) {
                if (this.hasSyncServiceChanged()) {
                    if (await this.hasDefaultServiceChanged()) {
                        throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('default service changed', "Cannot sync because default service has changed"), "DefaultServiceChanged" /* UserDataSyncErrorCode.DefaultServiceChanged */);
                    }
                    else {
                        throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('service changed', "Cannot sync because sync service has changed"), "ServiceChanged" /* UserDataSyncErrorCode.ServiceChanged */);
                    }
                }
                else {
                    // Sync was turned off in the cloud
                    throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('turned off', "Cannot sync because syncing is turned off in the cloud"), "TurnedOff" /* UserDataSyncErrorCode.TurnedOff */);
                }
            }
            const sessionId = this.storageService.get(sessionIdKey, -1 /* StorageScope.APPLICATION */);
            // Server session is different from client session
            if (sessionId && this.manifest && sessionId !== this.manifest.session) {
                if (this.hasSyncServiceChanged()) {
                    if (await this.hasDefaultServiceChanged()) {
                        throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('default service changed', "Cannot sync because default service has changed"), "DefaultServiceChanged" /* UserDataSyncErrorCode.DefaultServiceChanged */);
                    }
                    else {
                        throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('service changed', "Cannot sync because sync service has changed"), "ServiceChanged" /* UserDataSyncErrorCode.ServiceChanged */);
                    }
                }
                else {
                    throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('session expired', "Cannot sync because current session is expired"), "SessionExpired" /* UserDataSyncErrorCode.SessionExpired */);
                }
            }
            const machines = await this.userDataSyncMachinesService.getMachines(this.manifest || undefined);
            // Return if cancellation is requested
            if (token.isCancellationRequested) {
                return;
            }
            const currentMachine = machines.find(machine => machine.isCurrent);
            // Check if sync was turned off from other machine
            if (currentMachine?.disabled) {
                // Throw TurnedOff error
                throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('turned off machine', "Cannot sync because syncing is turned off on this machine from another machine."), "TurnedOff" /* UserDataSyncErrorCode.TurnedOff */);
            }
            const startTime = new Date().getTime();
            await this.syncTask.run();
            this.telemetryService.publicLog2('settingsSync:sync', { duration: new Date().getTime() - startTime });
            // After syncing, get the manifest if it was not available before
            if (this.manifest === null) {
                try {
                    this.manifest = await this.userDataSyncStoreService.manifest(null);
                }
                catch (error) {
                    throw new userDataSync_1.UserDataAutoSyncError((0, errorMessage_1.toErrorMessage)(error), error instanceof userDataSync_1.UserDataSyncError ? error.code : "Unknown" /* UserDataSyncErrorCode.Unknown */);
                }
            }
            // Update local session id
            if (this.manifest && this.manifest.session !== sessionId) {
                this.storageService.store(sessionIdKey, this.manifest.session, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            // Return if cancellation is requested
            if (token.isCancellationRequested) {
                return;
            }
            // Add current machine
            if (!currentMachine) {
                await this.userDataSyncMachinesService.addCurrentMachine(this.manifest || undefined);
            }
        }
        register(t) {
            return super._register(t);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFBdXRvU3luY1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy9jb21tb24vdXNlckRhdGFBdXRvU3luY1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0NoRyxNQUFNLDJCQUEyQixHQUFHLCtCQUErQixDQUFDO0lBQ3BFLE1BQU0sWUFBWSxHQUFHLGdCQUFnQixDQUFDO0lBQ3RDLE1BQU0sV0FBVyxHQUFHLGVBQWUsQ0FBQztJQUNwQyxNQUFNLGlCQUFpQixHQUFHLHFCQUFxQixDQUFDO0lBRXpDLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsc0JBQVU7UUFjdEQsSUFBWSxPQUFPO1lBQ2xCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFdBQVcsb0NBQTJCLENBQUM7WUFDN0UsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUM3QyxDQUFDO1FBQ0QsSUFBWSxPQUFPLENBQUMsT0FBd0I7WUFDM0MsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLFFBQVEsRUFBRSxtRUFBa0QsQ0FBQztZQUM3RyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsV0FBVyxvQ0FBMkIsQ0FBQztZQUNuRSxDQUFDO1FBQ0YsQ0FBQztRQUdELElBQVksY0FBYztZQUN6QixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLGlCQUFpQixvQ0FB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