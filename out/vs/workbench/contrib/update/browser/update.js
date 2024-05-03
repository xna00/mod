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
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/services/activity/common/activity", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/platform/update/common/update", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/contrib/update/browser/releaseNotesEditor", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/workbench/services/host/browser/host", "vs/platform/product/common/productService", "vs/platform/userDataSync/common/userDataSync", "vs/platform/contextkey/common/contextkeys", "vs/base/common/async", "vs/workbench/services/userDataSync/common/userDataSync", "vs/base/common/event", "vs/base/common/actions"], function (require, exports, nls, severity_1, lifecycle_1, uri_1, activity_1, instantiation_1, opener_1, storage_1, update_1, notification_1, dialogs_1, environmentService_1, releaseNotesEditor_1, platform_1, configuration_1, contextkey_1, actions_1, commands_1, host_1, productService_1, userDataSync_1, contextkeys_1, async_1, userDataSync_2, event_1, actions_2) {
    "use strict";
    var ProductContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SwitchProductQualityContribution = exports.UpdateContribution = exports.ProductContribution = exports.DOWNLOAD_URL = exports.RELEASE_NOTES_URL = exports.MAJOR_MINOR_UPDATE_AVAILABLE = exports.CONTEXT_UPDATE_STATE = void 0;
    exports.showReleaseNotesInEditor = showReleaseNotesInEditor;
    exports.CONTEXT_UPDATE_STATE = new contextkey_1.RawContextKey('updateState', "uninitialized" /* StateType.Uninitialized */);
    exports.MAJOR_MINOR_UPDATE_AVAILABLE = new contextkey_1.RawContextKey('majorMinorUpdateAvailable', false);
    exports.RELEASE_NOTES_URL = new contextkey_1.RawContextKey('releaseNotesUrl', '');
    exports.DOWNLOAD_URL = new contextkey_1.RawContextKey('downloadUrl', '');
    let releaseNotesManager = undefined;
    function showReleaseNotesInEditor(instantiationService, version, useCurrentFile) {
        if (!releaseNotesManager) {
            releaseNotesManager = instantiationService.createInstance(releaseNotesEditor_1.ReleaseNotesManager);
        }
        return releaseNotesManager.show(version, useCurrentFile);
    }
    async function openLatestReleaseNotesInBrowser(accessor) {
        const openerService = accessor.get(opener_1.IOpenerService);
        const productService = accessor.get(productService_1.IProductService);
        if (productService.releaseNotesUrl) {
            const uri = uri_1.URI.parse(productService.releaseNotesUrl);
            await openerService.open(uri);
        }
        else {
            throw new Error(nls.localize('update.noReleaseNotesOnline', "This version of {0} does not have release notes online", productService.nameLong));
        }
    }
    async function showReleaseNotes(accessor, version) {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        try {
            await showReleaseNotesInEditor(instantiationService, version, false);
        }
        catch (err) {
            try {
                await instantiationService.invokeFunction(openLatestReleaseNotesInBrowser);
            }
            catch (err2) {
                throw new Error(`${err.message} and ${err2.message}`);
            }
        }
    }
    function parseVersion(version) {
        const match = /([0-9]+)\.([0-9]+)\.([0-9]+)/.exec(version);
        if (!match) {
            return undefined;
        }
        return {
            major: parseInt(match[1]),
            minor: parseInt(match[2]),
            patch: parseInt(match[3])
        };
    }
    function isMajorMinorUpdate(before, after) {
        return before.major < after.major || before.minor < after.minor;
    }
    let ProductContribution = class ProductContribution {
        static { ProductContribution_1 = this; }
        static { this.KEY = 'releaseNotes/lastVersion'; }
        constructor(storageService, instantiationService, notificationService, environmentService, openerService, configurationService, hostService, productService, contextKeyService) {
            if (productService.releaseNotesUrl) {
                const releaseNotesUrlKey = exports.RELEASE_NOTES_URL.bindTo(contextKeyService);
                releaseNotesUrlKey.set(productService.releaseNotesUrl);
            }
            if (productService.downloadUrl) {
                const downloadUrlKey = exports.DOWNLOAD_URL.bindTo(contextKeyService);
                downloadUrlKey.set(productService.downloadUrl);
            }
            if (platform_1.isWeb) {
                return;
            }
            hostService.hadLastFocus().then(async (hadLastFocus) => {
                if (!hadLastFocus) {
                    return;
                }
                const lastVersion = parseVersion(storageService.get(ProductContribution_1.KEY, -1 /* StorageScope.APPLICATION */, ''));
                const currentVersion = parseVersion(productService.version);
                const shouldShowReleaseNotes = configurationService.getValue('update.showReleaseNotes');
                const releaseNotesUrl = productService.releaseNotesUrl;
                // was there a major/minor update? if so, open release notes
                if (shouldShowReleaseNotes && !environmentService.skipReleaseNotes && releaseNotesUrl && lastVersion && currentVersion && isMajorMinorUpdate(lastVersion, currentVersion)) {
                    showReleaseNotesInEditor(instantiationService, productService.version, false)
                        .then(undefined, () => {
                        notificationService.prompt(severity_1.default.Info, nls.localize('read the release notes', "Welcome to {0} v{1}! Would you like to read the Release Notes?", productService.nameLong, productService.version), [{
                                label: nls.localize('releaseNotes', "Release Notes"),
                                run: () => {
                                    const uri = uri_1.URI.parse(releaseNotesUrl);
                                    openerService.open(uri);
                                }
                            }]);
                    });
                }
                storageService.store(ProductContribution_1.KEY, productService.version, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            });
        }
    };
    exports.ProductContribution = ProductContribution;
    exports.ProductContribution = ProductContribution = ProductContribution_1 = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notification_1.INotificationService),
        __param(3, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(4, opener_1.IOpenerService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, host_1.IHostService),
        __param(7, productService_1.IProductService),
        __param(8, contextkey_1.IContextKeyService)
    ], ProductContribution);
    let UpdateContribution = class UpdateContribution extends lifecycle_1.Disposable {
        constructor(storageService, instantiationService, notificationService, dialogService, updateService, activityService, contextKeyService, productService, openerService, configurationService, hostService) {
            super();
            this.storageService = storageService;
            this.instantiationService = instantiationService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.updateService = updateService;
            this.activityService = activityService;
            this.contextKeyService = contextKeyService;
            this.productService = productService;
            this.openerService = openerService;
            this.configurationService = configurationService;
            this.hostService = hostService;
            this.badgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.state = updateService.state;
            this.updateStateContextKey = exports.CONTEXT_UPDATE_STATE.bindTo(this.contextKeyService);
            this.majorMinorUpdateAvailableContextKey = exports.MAJOR_MINOR_UPDATE_AVAILABLE.bindTo(this.contextKeyService);
            this._register(updateService.onStateChange(this.onUpdateStateChange, this));
            this.onUpdateStateChange(this.updateService.state);
            /*
            The `update/lastKnownVersion` and `update/updateNotificationTime` storage keys are used in
            combination to figure out when to show a message to the user that he should update.
    
            This message should appear if the user has received an update notification but hasn't
            updated since 5 days.
            */
            const currentVersion = this.productService.commit;
            const lastKnownVersion = this.storageService.get('update/lastKnownVersion', -1 /* StorageScope.APPLICATION */);
            // if current version != stored version, clear both fields
            if (currentVersion !== lastKnownVersion) {
                this.storageService.remove('update/lastKnownVersion', -1 /* StorageScope.APPLICATION */);
                this.storageService.remove('update/updateNotificationTime', -1 /* StorageScope.APPLICATION */);
            }
            this.registerGlobalActivityActions();
        }
        async onUpdateStateChange(state) {
            this.updateStateContextKey.set(state.type);
            switch (state.type) {
                case "disabled" /* StateType.Disabled */:
                    if (state.reason === 5 /* DisablementReason.RunningAsAdmin */) {
                        this.notificationService.notify({
                            severity: notification_1.Severity.Info,
                            message: nls.localize('update service disabled', "Updates are disabled because you are running the user-scope installation of {0} as Administrator.", this.productService.nameLong),
                            actions: {
                                primary: [
                                    new actions_2.Action('', nls.localize('learn more', "Learn More"), undefined, undefined, () => {
                                        this.openerService.open('https://aka.ms/vscode-windows-setup');
                                    })
                                ]
                            },
                            neverShowAgain: { id: 'no-updates-running-as-admin', }
                        });
                    }
                    break;
                case "idle" /* StateType.Idle */:
                    if (state.error) {
                        this.onError(state.error);
                    }
                    else if (this.state.type === "checking for updates" /* StateType.CheckingForUpdates */ && this.state.explicit && await this.hostService.hadLastFocus()) {
                        this.onUpdateNotAvailable();
                    }
                    break;
                case "available for download" /* StateType.AvailableForDownload */:
                    this.onUpdateAvailable(state.update);
                    break;
                case "downloaded" /* StateType.Downloaded */:
                    this.onUpdateDownloaded(state.update);
                    break;
                case "ready" /* StateType.Ready */: {
                    const productVersion = state.update.productVersion;
                    if (productVersion) {
                        const currentVersion = parseVersion(this.productService.version);
                        const nextVersion = parseVersion(productVersion);
                        this.majorMinorUpdateAvailableContextKey.set(Boolean(currentVersion && nextVersion && isMajorMinorUpdate(currentVersion, nextVersion)));
                        this.onUpdateReady(state.update);
                    }
                    break;
                }
            }
            let badge = undefined;
            let priority = undefined;
            if (state.type === "available for download" /* StateType.AvailableForDownload */ || state.type === "downloaded" /* StateType.Downloaded */ || state.type === "ready" /* StateType.Ready */) {
                badge = new activity_1.NumberBadge(1, () => nls.localize('updateIsReady', "New {0} update available.", this.productService.nameShort));
            }
            else if (state.type === "checking for updates" /* StateType.CheckingForUpdates */) {
                badge = new activity_1.ProgressBadge(() => nls.localize('checkingForUpdates', "Checking for Updates..."));
                priority = 1;
            }
            else if (state.type === "downloading" /* StateType.Downloading */) {
                badge = new activity_1.ProgressBadge(() => nls.localize('downloading', "Downloading..."));
                priority = 1;
            }
            else if (state.type === "updating" /* StateType.Updating */) {
                badge = new activity_1.ProgressBadge(() => nls.localize('updating', "Updating..."));
                priority = 1;
            }
            this.badgeDisposable.clear();
            if (badge) {
                this.badgeDisposable.value = this.activityService.showGlobalActivity({ badge, priority });
            }
            this.state = state;
        }
        onError(error) {
            if (/The request timed out|The network connection was lost/i.test(error)) {
                return;
            }
            error = error.replace(/See https:\/\/github\.com\/Squirrel\/Squirrel\.Mac\/issues\/182 for more information/, 'This might mean the application was put on quarantine by macOS. See [this link](https://github.com/microsoft/vscode/issues/7426#issuecomment-425093469) for more information');
            this.notificationService.notify({
                severity: notification_1.Severity.Error,
                message: error,
                source: nls.localize('update service', "Update Service"),
            });
        }
        onUpdateNotAvailable() {
            this.dialogService.info(nls.localize('noUpdatesAvailable', "There are currently no updates available."));
        }
        // linux
        onUpdateAvailable(update) {
            if (!this.shouldShowNotification()) {
                return;
            }
            const productVersion = update.productVersion;
            if (!productVersion) {
                return;
            }
            this.notificationService.prompt(severity_1.default.Info, nls.localize('thereIsUpdateAvailable', "There is an available update."), [{
                    label: nls.localize('download update', "Download Update"),
                    run: () => this.updateService.downloadUpdate()
                }, {
                    label: nls.localize('later', "Later"),
                    run: () => { }
                }, {
                    label: nls.localize('releaseNotes', "Release Notes"),
                    run: () => {
                        this.instantiationService.invokeFunction(accessor => showReleaseNotes(accessor, productVersion));
                    }
                }]);
        }
        // windows fast updates
        onUpdateDownloaded(update) {
            if (platform_1.isMacintosh) {
                return;
            }
            if (this.configurationService.getValue('update.enableWindowsBackgroundUpdates') && this.productService.target === 'user') {
                return;
            }
            if (!this.shouldShowNotification()) {
                return;
            }
            const productVersion = update.productVersion;
            if (!productVersion) {
                return;
            }
            this.notificationService.prompt(severity_1.default.Info, nls.localize('updateAvailable', "There's an update available: {0} {1}", this.productService.nameLong, productVersion), [{
                    label: nls.localize('installUpdate', "Install Update"),
                    run: () => this.updateService.applyUpdate()
                }, {
                    label: nls.localize('later', "Later"),
                    run: () => { }
                }, {
                    label: nls.localize('releaseNotes', "Release Notes"),
                    run: () => {
                        this.instantiationService.invokeFunction(accessor => showReleaseNotes(accessor, productVersion));
                    }
                }]);
        }
        // windows and mac
        onUpdateReady(update) {
            if (!(platform_1.isWindows && this.productService.target !== 'user') && !this.shouldShowNotification()) {
                return;
            }
            const actions = [{
                    label: nls.localize('updateNow', "Update Now"),
                    run: () => this.updateService.quitAndInstall()
                }, {
                    label: nls.localize('later', "Later"),
                    run: () => { }
                }];
            const productVersion = update.productVersion;
            if (productVersion) {
                actions.push({
                    label: nls.localize('releaseNotes', "Release Notes"),
                    run: () => {
                        this.instantiationService.invokeFunction(accessor => showReleaseNotes(accessor, productVersion));
                    }
                });
            }
            // windows user fast updates and mac
            this.notificationService.prompt(severity_1.default.Info, nls.localize('updateAvailableAfterRestart', "Restart {0} to apply the latest update.", this.productService.nameLong), actions, { sticky: true });
        }
        shouldShowNotification() {
            const currentVersion = this.productService.commit;
            const currentMillis = new Date().getTime();
            const lastKnownVersion = this.storageService.get('update/lastKnownVersion', -1 /* StorageScope.APPLICATION */);
            // if version != stored version, save version and date
            if (currentVersion !== lastKnownVersion) {
                this.storageService.store('update/lastKnownVersion', currentVersion, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                this.storageService.store('update/updateNotificationTime', currentMillis, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            const updateNotificationMillis = this.storageService.getNumber('update/updateNotificationTime', -1 /* StorageScope.APPLICATION */, currentMillis);
            const diffDays = (currentMillis - updateNotificationMillis) / (1000 * 60 * 60 * 24);
            return diffDays > 5;
        }
        registerGlobalActivityActions() {
            commands_1.CommandsRegistry.registerCommand('update.check', () => this.updateService.checkForUpdates(true));
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
                group: '7_update',
                command: {
                    id: 'update.check',
                    title: nls.localize('checkForUpdates', "Check for Updates...")
                },
                when: exports.CONTEXT_UPDATE_STATE.isEqualTo("idle" /* StateType.Idle */)
            });
            commands_1.CommandsRegistry.registerCommand('update.checking', () => { });
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
                group: '7_update',
                command: {
                    id: 'update.checking',
                    title: nls.localize('checkingForUpdates', "Checking for Updates..."),
                    precondition: contextkey_1.ContextKeyExpr.false()
                },
                when: exports.CONTEXT_UPDATE_STATE.isEqualTo("checking for updates" /* StateType.CheckingForUpdates */)
            });
            commands_1.CommandsRegistry.registerCommand('update.downloadNow', () => this.updateService.downloadUpdate());
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
                group: '7_update',
                command: {
                    id: 'update.downloadNow',
                    title: nls.localize('download update_1', "Download Update (1)")
                },
                when: exports.CONTEXT_UPDATE_STATE.isEqualTo("available for download" /* StateType.AvailableForDownload */)
            });
            commands_1.CommandsRegistry.registerCommand('update.downloading', () => { });
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
                group: '7_update',
                command: {
                    id: 'update.downloading',
                    title: nls.localize('DownloadingUpdate', "Downloading Update..."),
                    precondition: contextkey_1.ContextKeyExpr.false()
                },
                when: exports.CONTEXT_UPDATE_STATE.isEqualTo("downloading" /* StateType.Downloading */)
            });
            commands_1.CommandsRegistry.registerCommand('update.install', () => this.updateService.applyUpdate());
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
                group: '7_update',
                command: {
                    id: 'update.install',
                    title: nls.localize('installUpdate...', "Install Update... (1)")
                },
                when: exports.CONTEXT_UPDATE_STATE.isEqualTo("downloaded" /* StateType.Downloaded */)
            });
            commands_1.CommandsRegistry.registerCommand('update.updating', () => { });
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
                group: '7_update',
                command: {
                    id: 'update.updating',
                    title: nls.localize('installingUpdate', "Installing Update..."),
                    precondition: contextkey_1.ContextKeyExpr.false()
                },
                when: exports.CONTEXT_UPDATE_STATE.isEqualTo("updating" /* StateType.Updating */)
            });
            if (this.productService.quality === 'stable') {
                commands_1.CommandsRegistry.registerCommand('update.showUpdateReleaseNotes', () => {
                    if (this.updateService.state.type !== "ready" /* StateType.Ready */) {
                        return;
                    }
                    const productVersion = this.updateService.state.update.productVersion;
                    if (productVersion) {
                        this.instantiationService.invokeFunction(accessor => showReleaseNotes(accessor, productVersion));
                    }
                });
                actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
                    group: '7_update',
                    order: 1,
                    command: {
                        id: 'update.showUpdateReleaseNotes',
                        title: nls.localize('showUpdateReleaseNotes', "Show Update Release Notes")
                    },
                    when: contextkey_1.ContextKeyExpr.and(exports.CONTEXT_UPDATE_STATE.isEqualTo("ready" /* StateType.Ready */), exports.MAJOR_MINOR_UPDATE_AVAILABLE)
                });
            }
            commands_1.CommandsRegistry.registerCommand('update.restart', () => this.updateService.quitAndInstall());
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
                group: '7_update',
                order: 2,
                command: {
                    id: 'update.restart',
                    title: nls.localize('restartToUpdate', "Restart to Update (1)")
                },
                when: exports.CONTEXT_UPDATE_STATE.isEqualTo("ready" /* StateType.Ready */)
            });
            commands_1.CommandsRegistry.registerCommand('_update.state', () => {
                return this.state;
            });
        }
    };
    exports.UpdateContribution = UpdateContribution;
    exports.UpdateContribution = UpdateContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notification_1.INotificationService),
        __param(3, dialogs_1.IDialogService),
        __param(4, update_1.IUpdateService),
        __param(5, activity_1.IActivityService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, productService_1.IProductService),
        __param(8, opener_1.IOpenerService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, host_1.IHostService)
    ], UpdateContribution);
    let SwitchProductQualityContribution = class SwitchProductQualityContribution extends lifecycle_1.Disposable {
        constructor(productService, environmentService) {
            super();
            this.productService = productService;
            this.environmentService = environmentService;
            this.registerGlobalActivityActions();
        }
        registerGlobalActivityActions() {
            const quality = this.productService.quality;
            const productQualityChangeHandler = this.environmentService.options?.productQualityChangeHandler;
            if (productQualityChangeHandler && (quality === 'stable' || quality === 'insider')) {
                const newQuality = quality === 'stable' ? 'insider' : 'stable';
                const commandId = `update.switchQuality.${newQuality}`;
                const isSwitchingToInsiders = newQuality === 'insider';
                this._register((0, actions_1.registerAction2)(class SwitchQuality extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: commandId,
                            title: isSwitchingToInsiders ? nls.localize('switchToInsiders', "Switch to Insiders Version...") : nls.localize('switchToStable', "Switch to Stable Version..."),
                            precondition: contextkeys_1.IsWebContext,
                            menu: {
                                id: actions_1.MenuId.GlobalActivity,
                                when: contextkeys_1.IsWebContext,
                                group: '7_update',
                            }
                        });
                    }
                    async run(accessor) {
                        const dialogService = accessor.get(dialogs_1.IDialogService);
                        const userDataSyncEnablementService = accessor.get(userDataSync_1.IUserDataSyncEnablementService);
                        const userDataSyncStoreManagementService = accessor.get(userDataSync_1.IUserDataSyncStoreManagementService);
                        const storageService = accessor.get(storage_1.IStorageService);
                        const userDataSyncWorkbenchService = accessor.get(userDataSync_2.IUserDataSyncWorkbenchService);
                        const userDataSyncService = accessor.get(userDataSync_1.IUserDataSyncService);
                        const notificationService = accessor.get(notification_1.INotificationService);
                        try {
                            const selectSettingsSyncServiceDialogShownKey = 'switchQuality.selectSettingsSyncServiceDialogShown';
                            const userDataSyncStore = userDataSyncStoreManagementService.userDataSyncStore;
                            let userDataSyncStoreType;
                            if (userDataSyncStore && isSwitchingToInsiders && userDataSyncEnablementService.isEnabled()
                                && !storageService.getBoolean(selectSettingsSyncServiceDialogShownKey, -1 /* StorageScope.APPLICATION */, false)) {
                                userDataSyncStoreType = await this.selectSettingsSyncService(dialogService);
                                if (!userDataSyncStoreType) {
                                    return;
                                }
                                storageService.store(selectSettingsSyncServiceDialogShownKey, true, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                                if (userDataSyncStoreType === 'stable') {
                                    // Update the stable service type in the current window, so that it uses stable service after switched to insiders version (after reload).
                                    await userDataSyncStoreManagementService.switch(userDataSyncStoreType);
                                }
                            }
                            const res = await dialogService.confirm({
                                type: 'info',
                                message: nls.localize('relaunchMessage', "Changing the version requires a reload to take effect"),
                                detail: newQuality === 'insider' ?
                                    nls.localize('relaunchDetailInsiders', "Press the reload button to switch to the Insiders version of VS Code.") :
                                    nls.localize('relaunchDetailStable', "Press the reload button to switch to the Stable version of VS Code."),
                                primaryButton: nls.localize({ key: 'reload', comment: ['&& denotes a mnemonic'] }, "&&Reload")
                            });
                            if (res.confirmed) {
                                const promises = [];
                                // If sync is happening wait until it is finished before reload
                                if (userDataSyncService.status === "syncing" /* SyncStatus.Syncing */) {
                                    promises.push(event_1.Event.toPromise(event_1.Event.filter(userDataSyncService.onDidChangeStatus, status => status !== "syncing" /* SyncStatus.Syncing */)));
                                }
                                // If user chose the sync service then synchronise the store type option in insiders service, so that other clients using insiders service are also updated.
                                if (isSwitchingToInsiders && userDataSyncStoreType) {
                                    promises.push(userDataSyncWorkbenchService.synchroniseUserDataSyncStoreType());
                                }
                                await async_1.Promises.settled(promises);
                                productQualityChangeHandler(newQuality);
                            }
                            else {
                                // Reset
                                if (userDataSyncStoreType) {
                                    storageService.remove(selectSettingsSyncServiceDialogShownKey, -1 /* StorageScope.APPLICATION */);
                                }
                            }
                        }
                        catch (error) {
                            notificationService.error(error);
                        }
                    }
                    async selectSettingsSyncService(dialogService) {
                        const { result } = await dialogService.prompt({
                            type: notification_1.Severity.Info,
                            message: nls.localize('selectSyncService.message', "Choose the settings sync service to use after changing the version"),
                            detail: nls.localize('selectSyncService.detail', "The Insiders version of VS Code will synchronize your settings, keybindings, extensions, snippets and UI State using separate insiders settings sync service by default."),
                            buttons: [
                                {
                                    label: nls.localize({ key: 'use insiders', comment: ['&& denotes a mnemonic'] }, "&&Insiders"),
                                    run: () => 'insiders'
                                },
                                {
                                    label: nls.localize({ key: 'use stable', comment: ['&& denotes a mnemonic'] }, "&&Stable (current)"),
                                    run: () => 'stable'
                                }
                            ],
                            cancelButton: true
                        });
                        return result;
                    }
                }));
            }
        }
    };
    exports.SwitchProductQualityContribution = SwitchProductQualityContribution;
    exports.SwitchProductQualityContribution = SwitchProductQualityContribution = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, environmentService_1.IBrowserWorkbenchEnvironmentService)
    ], SwitchProductQualityContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi91cGRhdGUvYnJvd3Nlci91cGRhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXFDaEcsNERBTUM7SUFiWSxRQUFBLG9CQUFvQixHQUFHLElBQUksMEJBQWEsQ0FBUyxhQUFhLGdEQUEwQixDQUFDO0lBQ3pGLFFBQUEsNEJBQTRCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzlGLFFBQUEsaUJBQWlCLEdBQUcsSUFBSSwwQkFBYSxDQUFTLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3JFLFFBQUEsWUFBWSxHQUFHLElBQUksMEJBQWEsQ0FBUyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFekUsSUFBSSxtQkFBbUIsR0FBb0MsU0FBUyxDQUFDO0lBRXJFLFNBQWdCLHdCQUF3QixDQUFDLG9CQUEyQyxFQUFFLE9BQWUsRUFBRSxjQUF1QjtRQUM3SCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUMxQixtQkFBbUIsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsd0NBQW1CLENBQUMsQ0FBQztRQUNoRixDQUFDO1FBRUQsT0FBTyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFFRCxLQUFLLFVBQVUsK0JBQStCLENBQUMsUUFBMEI7UUFDeEUsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1QkFBYyxDQUFDLENBQUM7UUFDbkQsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQ0FBZSxDQUFDLENBQUM7UUFFckQsSUFBSSxjQUFjLENBQUMs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