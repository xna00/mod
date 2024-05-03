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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/common/editor", "vs/workbench/services/output/common/output", "vs/workbench/services/activity/common/activity", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/preferences/common/preferences", "vs/base/common/date", "vs/platform/product/common/productService", "vs/platform/opener/common/opener", "vs/workbench/services/authentication/common/authentication", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/descriptors", "vs/workbench/common/views", "vs/workbench/contrib/userDataSync/browser/userDataSyncViews", "vs/workbench/services/userDataSync/common/userDataSync", "vs/base/common/codicons", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/host/browser/host", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/contrib/mergeEditor/common/mergeEditor", "vs/workbench/services/issue/common/issue", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/common/platform"], function (require, exports, actions_1, errors_1, event_1, lifecycle_1, resources_1, uri_1, model_1, language_1, resolverService_1, nls_1, actions_2, commands_1, contextkey_1, dialogs_1, instantiation_1, notification_1, quickInput_1, telemetry_1, userDataSync_1, editor_1, output_1, activity_1, editorService_1, preferences_1, date_1, productService_1, opener_1, authentication_1, platform_1, descriptors_1, views_1, userDataSyncViews_1, userDataSync_2, codicons_1, viewPaneContainer_1, actionCommonCategories_1, host_1, userDataProfile_1, textfiles_1, mergeEditor_1, issue_1, userDataProfile_2, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncWorkbenchContribution = void 0;
    const turnOffSyncCommand = { id: 'workbench.userDataSync.actions.turnOff', title: (0, nls_1.localize2)('stop sync', 'Turn Off') };
    const configureSyncCommand = { id: userDataSync_2.CONFIGURE_SYNC_COMMAND_ID, title: (0, nls_1.localize2)('configure sync', 'Configure...') };
    const showConflictsCommandId = 'workbench.userDataSync.actions.showConflicts';
    const syncNowCommand = {
        id: 'workbench.userDataSync.actions.syncNow',
        title: (0, nls_1.localize2)('sync now', 'Sync Now'),
        description(userDataSyncService) {
            if (userDataSyncService.status === "syncing" /* SyncStatus.Syncing */) {
                return (0, nls_1.localize)('syncing', "syncing");
            }
            if (userDataSyncService.lastSyncTime) {
                return (0, nls_1.localize)('synced with time', "synced {0}", (0, date_1.fromNow)(userDataSyncService.lastSyncTime, true));
            }
            return undefined;
        }
    };
    const showSyncSettingsCommand = { id: 'workbench.userDataSync.actions.settings', title: (0, nls_1.localize2)('sync settings', 'Show Settings'), };
    const showSyncedDataCommand = { id: 'workbench.userDataSync.actions.showSyncedData', title: (0, nls_1.localize2)('show synced data', 'Show Synced Data'), };
    const CONTEXT_TURNING_ON_STATE = new contextkey_1.RawContextKey('userDataSyncTurningOn', false);
    let UserDataSyncWorkbenchContribution = class UserDataSyncWorkbenchContribution extends lifecycle_1.Disposable {
        constructor(userDataSyncEnablementService, userDataSyncService, userDataSyncWorkbenchService, contextKeyService, activityService, notificationService, editorService, userDataProfilesService, userDataProfileService, dialogService, quickInputService, instantiationService, outputService, userDataAutoSyncService, textModelResolverService, preferencesService, telemetryService, productService, openerService, authenticationService, userDataSyncStoreManagementService, hostService, commandService, workbenchIssueService) {
            super();
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.userDataSyncService = userDataSyncService;
            this.userDataSyncWorkbenchService = userDataSyncWorkbenchService;
            this.activityService = activityService;
            this.notificationService = notificationService;
            this.editorService = editorService;
            this.userDataProfilesService = userDataProfilesService;
            this.userDataProfileService = userDataProfileService;
            this.dialogService = dialogService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.outputService = outputService;
            this.preferencesService = preferencesService;
            this.telemetryService = telemetryService;
            this.productService = productService;
            this.openerService = openerService;
            this.authenticationService = authenticationService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.hostService = hostService;
            this.commandService = commandService;
            this.workbenchIssueService = workbenchIssueService;
            this.globalActivityBadgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.accountBadgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.conflictsDisposables = new Map();
            this.invalidContentErrorDisposables = new Map();
            this.conflictsActionDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.turningOnSyncContext = CONTEXT_TURNING_ON_STATE.bindTo(contextKeyService);
            if (userDataSyncWorkbenchService.enabled) {
                (0, userDataSync_1.registerConfiguration)();
                this.updateAccountBadge();
                this.updateGlobalActivityBadge();
                this.onDidChangeConflicts(this.userDataSyncService.conflicts);
                this._register(event_1.Event.any(event_1.Event.debounce(userDataSyncService.onDidChangeStatus, () => undefined, 500), this.userDataSyncEnablementService.onDidChangeEnablement, this.userDataSyncWorkbenchService.onDidChangeAccountStatus)(() => {
                    this.updateAccountBadge();
                    this.updateGlobalActivityBadge();
                }));
                this._register(userDataSyncService.onDidChangeConflicts(() => this.onDidChangeConflicts(this.userDataSyncService.conflicts)));
                this._register(userDataSyncEnablementService.onDidChangeEnablement(() => this.onDidChangeConflicts(this.userDataSyncService.conflicts)));
                this._register(userDataSyncService.onSyncErrors(errors => this.onSynchronizerErrors(errors)));
                this._register(userDataAutoSyncService.onError(error => this.onAutoSyncError(error)));
                this.registerActions();
                this.registerViews();
                textModelResolverService.registerTextModelContentProvider(userDataSync_1.USER_DATA_SYNC_SCHEME, instantiationService.createInstance(UserDataRemoteContentProvider));
                this._register(event_1.Event.any(userDataSyncService.onDidChangeStatus, userDataSyncEnablementService.onDidChangeEnablement)(() => this.turningOnSync = !userDataSyncEnablementService.isEnabled() && userDataSyncService.status !== "idle" /* SyncStatus.Idle */));
            }
        }
        get turningOnSync() {
            return !!this.turningOnSyncContext.get();
        }
        set turningOnSync(turningOn) {
            this.turningOnSyncContext.set(turningOn);
            this.updateGlobalActivityBadge();
        }
        toKey({ syncResource: resource, profile }) {
            return `${profile.id}:${resource}`;
        }
        onDidChangeConflicts(conflicts) {
            this.updateGlobalActivityBadge();
            this.registerShowConflictsAction();
            if (!this.userDataSyncEnablementService.isEnabled()) {
                return;
            }
            if (conflicts.length) {
                // Clear and dispose conflicts those were cleared
                for (const [key, disposable] of this.conflictsDisposables.entries()) {
                    if (!conflicts.some(conflict => this.toKey(conflict) === key)) {
                        disposable.dispose();
                        this.conflictsDisposables.delete(key);
                    }
                }
                for (const conflict of this.userDataSyncService.conflicts) {
                    const key = this.toKey(conflict);
                    // Show conflicts notification if not shown before
                    if (!this.conflictsDisposables.has(key)) {
                        const conflictsArea = (0, userDataSync_2.getSyncAreaLabel)(conflict.syncResource);
                        const handle = this.notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)('conflicts detected', "Unable to sync due to conflicts in {0}. Please resolve them to continue.", conflictsArea.toLowerCase()), [
                            {
                                label: (0, nls_1.localize)('replace remote', "Replace Remote"),
                                run: () => {
                                    this.telemetryService.publicLog2('sync/handleConflicts', { source: conflict.syncResource, action: 'acceptLocal' });
                                    this.acceptLocal(conflict, conflict.conflicts[0]);
                                }
                            },
                            {
                                label: (0, nls_1.localize)('replace local', "Replace Local"),
                                run: () => {
                                    this.telemetryService.publicLog2('sync/handleConflicts', { source: conflict.syncResource, action: 'acceptRemote' });
                                    this.acceptRemote(conflict, conflict.conflicts[0]);
                                }
                            },
                            {
                                label: (0, nls_1.localize)('show conflicts', "Show Conflicts"),
                                run: () => {
                                    this.telemetryService.publicLog2('sync/showConflicts', { source: conflict.syncResource });
                                    this.userDataSyncWorkbenchService.showConflicts(conflict.conflicts[0]);
                                }
                            }
                        ], {
                            sticky: true
                        });
                        this.conflictsDisposables.set(key, (0, lifecycle_1.toDisposable)(() => {
                            // close the conflicts warning notification
                            handle.close();
                            this.conflictsDisposables.delete(key);
                        }));
                    }
                }
            }
            else {
                this.conflictsDisposables.forEach(disposable => disposable.dispose());
                this.conflictsDisposables.clear();
            }
        }
        async acceptRemote(syncResource, conflict) {
            try {
                await this.userDataSyncService.accept(syncResource, conflict.remoteResource, undefined, this.userDataSyncEnablementService.isEnabled());
            }
            catch (e) {
                this.notificationService.error((0, nls_1.localize)('accept failed', "Error while accepting changes. Please check [logs]({0}) for more details.", `command:${userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID}`));
            }
        }
        async acceptLocal(syncResource, conflict) {
            try {
                await this.userDataSyncService.accept(syncResource, conflict.localResource, undefined, this.userDataSyncEnablementService.isEnabled());
            }
            catch (e) {
                this.notificationService.error((0, nls_1.localize)('accept failed', "Error while accepting changes. Please check [logs]({0}) for more details.", `command:${userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID}`));
            }
        }
        onAutoSyncError(error) {
            switch (error.code) {
                case "SessionExpired" /* UserDataSyncErrorCode.SessionExpired */:
                    this.notificationService.notify({
                        severity: notification_1.Severity.Info,
                        message: (0, nls_1.localize)('session expired', "Settings sync was turned off because current session is expired, please sign in again to turn on sync."),
                        actions: {
                            primary: [new actions_1.Action('turn on sync', (0, nls_1.localize)('turn on sync', "Turn on Settings Sync..."), undefined, true, () => this.turnOn())]
                        }
                    });
                    break;
                case "TurnedOff" /* UserDataSyncErrorCode.TurnedOff */:
                    this.notificationService.notify({
                        severity: notification_1.Severity.Info,
                        message: (0, nls_1.localize)('turned off', "Settings sync was turned off from another device, please turn on sync again."),
                        actions: {
                            primary: [new actions_1.Action('turn on sync', (0, nls_1.localize)('turn on sync', "Turn on Settings Sync..."), undefined, true, () => this.turnOn())]
                        }
                    });
                    break;
                case "TooLarge" /* UserDataSyncErrorCode.TooLarge */:
                    if (error.resource === "keybindings" /* SyncResource.Keybindings */ || error.resource === "settings" /* SyncResource.Settings */ || error.resource === "tasks" /* SyncResource.Tasks */) {
                        this.disableSync(error.resource);
                        const sourceArea = (0, userDataSync_2.getSyncAreaLabel)(error.resource);
                        this.handleTooLargeError(error.resource, (0, nls_1.localize)('too large', "Disabled syncing {0} because size of the {1} file to sync is larger than {2}. Please open the file and reduce the size and enable sync", sourceArea.toLowerCase(), sourceArea.toLowerCase(), '100kb'), error);
                    }
                    break;
                case "LocalTooManyProfiles" /* UserDataSyncErrorCode.LocalTooManyProfiles */:
                    this.disableSync("profiles" /* SyncResource.Profiles */);
                    this.notificationService.error((0, nls_1.localize)('too many profiles', "Disabled syncing profiles because there are too many profiles to sync. Settings Sync supports syncing maximum 20 profiles. Please reduce the number of profiles and enable sync"));
                    break;
                case "IncompatibleLocalContent" /* UserDataSyncErrorCode.IncompatibleLocalContent */:
                case "Gone" /* UserDataSyncErrorCode.Gone */:
                case "UpgradeRequired" /* UserDataSyncErrorCode.UpgradeRequired */: {
                    const message = (0, nls_1.localize)('error upgrade required', "Settings sync is disabled because the current version ({0}, {1}) is not compatible with the sync service. Please update before turning on sync.", this.productService.version, this.productService.commit);
                    const operationId = error.operationId ? (0, nls_1.localize)('operationId', "Operation Id: {0}", error.operationId) : undefined;
                    this.notificationService.notify({
                        severity: notification_1.Severity.Error,
                        message: operationId ? `${message} ${operationId}` : message,
                    });
                    break;
                }
                case "MethodNotFound" /* UserDataSyncErrorCode.MethodNotFound */: {
                    const message = (0, nls_1.localize)('method not found', "Settings sync is disabled because the client is making invalid requests. Please report an issue with the logs.");
                    const operationId = error.operationId ? (0, nls_1.localize)('operationId', "Operation Id: {0}", error.operationId) : undefined;
                    this.notificationService.notify({
                        severity: notification_1.Severity.Error,
                        message: operationId ? `${message} ${operationId}` : message,
                        actions: {
                            primary: [
                                new actions_1.Action('Show Sync Logs', (0, nls_1.localize)('show sync logs', "Show Log"), undefined, true, () => this.commandService.executeCommand(userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID)),
                                new actions_1.Action('Report Issue', (0, nls_1.localize)('report issue', "Report Issue"), undefined, true, () => this.workbenchIssueService.openReporter())
                            ]
                        }
                    });
                    break;
                }
                case "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */:
                    this.notificationService.notify({
                        severity: notification_1.Severity.Error,
                        message: (0, nls_1.localize)('error reset required', "Settings sync is disabled because your data in the cloud is older than that of the client. Please clear your data in the cloud before turning on sync."),
                        actions: {
                            primary: [
                                new actions_1.Action('reset', (0, nls_1.localize)('reset', "Clear Data in Cloud..."), undefined, true, () => this.userDataSyncWorkbenchService.resetSyncedData()),
                                new actions_1.Action('show synced data', (0, nls_1.localize)('show synced data action', "Show Synced Data"), undefined, true, () => this.userDataSyncWorkbenchService.showSyncActivity())
                            ]
                        }
                    });
                    return;
                case "ServiceChanged" /* UserDataSyncErrorCode.ServiceChanged */:
                    this.notificationService.notify({
                        severity: notification_1.Severity.Info,
                        message: this.userDataSyncStoreManagementService.userDataSyncStore?.type === 'insiders' ?
                            (0, nls_1.localize)('service switched to insiders', "Settings Sync has been switched to insiders service") :
                            (0, nls_1.localize)('service switched to stable', "Settings Sync has been switched to stable service"),
                    });
                    return;
                case "DefaultServiceChanged" /* UserDataSyncErrorCode.DefaultServiceChanged */:
                    // Settings sync is using separate service
                    if (this.userDataSyncEnablementService.isEnabled()) {
                        this.notificationService.notify({
                            severity: notification_1.Severity.Info,
                            message: (0, nls_1.localize)('using separate service', "Settings sync now uses a separate service, more information is available in the [Settings Sync Documentation](https://aka.ms/vscode-settings-sync-help#_syncing-stable-versus-insiders)."),
                        });
                    }
                    // If settings sync got turned off then ask user to turn on sync again.
                    else {
                        this.notificationService.notify({
                            severity: notification_1.Severity.Info,
                            message: (0, nls_1.localize)('service changed and turned off', "Settings sync was turned off because {0} now uses a separate service. Please turn on sync again.", this.productService.nameLong),
                            actions: {
                                primary: [new actions_1.Action('turn on sync', (0, nls_1.localize)('turn on sync', "Turn on Settings Sync..."), undefined, true, () => this.turnOn())]
                            }
                        });
                    }
                    return;
            }
        }
        handleTooLargeError(resource, message, error) {
            const operationId = error.operationId ? (0, nls_1.localize)('operationId', "Operation Id: {0}", error.operationId) : undefined;
            this.notificationService.notify({
                severity: notification_1.Severity.Error,
                message: operationId ? `${message} ${operationId}` : message,
                actions: {
                    primary: [new actions_1.Action('open sync file', (0, nls_1.localize)('open file', "Open {0} File", (0, userDataSync_2.getSyncAreaLabel)(resource)), undefined, true, () => resource === "settings" /* SyncResource.Settings */ ? this.preferencesService.openUserSettings({ jsonEditor: true }) : this.preferencesService.openGlobalKeybindingSettings(true))]
                }
            });
        }
        onSynchronizerErrors(errors) {
            if (errors.length) {
                for (const { profile, syncResource: resource, error } of errors) {
                    switch (error.code) {
                        case "LocalInvalidContent" /* UserDataSyncErrorCode.LocalInvalidContent */:
                            this.handleInvalidContentError({ profile, syncResource: resource });
                            break;
                        default: {
                            const key = `${profile.id}:${resource}`;
                            const disposable = this.invalidContentErrorDisposables.get(key);
                            if (disposable) {
                                disposable.dispose();
                                this.invalidContentErrorDisposables.delete(key);
                            }
                        }
                    }
                }
            }
            else {
                this.invalidContentErrorDisposables.forEach(disposable => disposable.dispose());
                this.invalidContentErrorDisposables.clear();
            }
        }
        handleInvalidContentError({ profile, syncResource: source }) {
            if (this.userDataProfileService.currentProfile.id !== profile.id) {
                return;
            }
            const key = `${profile.id}:${source}`;
            if (this.invalidContentErrorDisposables.has(key)) {
                return;
            }
            if (source !== "settings" /* SyncResource.Settings */ && source !== "keybindings" /* SyncResource.Keybindings */ && source !== "tasks" /* SyncResource.Tasks */) {
                return;
            }
            if (!this.hostService.hasFocus) {
                return;
            }
            const resource = source === "settings" /* SyncResource.Settings */ ? this.userDataProfileService.currentProfile.settingsResource
                : source === "keybindings" /* SyncResource.Keybindings */ ? this.userDataProfileService.currentProfile.keybindingsResource
                    : this.userDataProfileService.currentProfile.tasksResource;
            const editorUri = editor_1.EditorResourceAccessor.getCanonicalUri(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if ((0, resources_1.isEqual)(resource, editorUri)) {
                // Do not show notification if the file in error is active
                return;
            }
            const errorArea = (0, userDataSync_2.getSyncAreaLabel)(source);
            const handle = this.notificationService.notify({
                severity: notification_1.Severity.Error,
                message: (0, nls_1.localize)('errorInvalidConfiguration', "Unable to sync {0} because the content in the file is not valid. Please open the file and correct it.", errorArea.toLowerCase()),
                actions: {
                    primary: [new actions_1.Action('open sync file', (0, nls_1.localize)('open file', "Open {0} File", errorArea), undefined, true, () => source === "settings" /* SyncResource.Settings */ ? this.preferencesService.openUserSettings({ jsonEditor: true }) : this.preferencesService.openGlobalKeybindingSettings(true))]
                }
            });
            this.invalidContentErrorDisposables.set(key, (0, lifecycle_1.toDisposable)(() => {
                // close the error warning notification
                handle.close();
                this.invalidContentErrorDisposables.delete(key);
            }));
        }
        getConflictsCount() {
            return this.userDataSyncService.conflicts.reduce((result, { conflicts }) => { return result + conflicts.length; }, 0);
        }
        async updateGlobalActivityBadge() {
            this.globalActivityBadgeDisposable.clear();
            let badge = undefined;
            let priority = undefined;
            if (this.userDataSyncService.conflicts.length && this.userDataSyncEnablementService.isEnabled()) {
                badge = new activity_1.NumberBadge(this.getConflictsCount(), () => (0, nls_1.localize)('has conflicts', "{0}: Conflicts Detected", userDataSync_2.SYNC_TITLE.value));
            }
            else if (this.turningOnSync) {
                badge = new activity_1.ProgressBadge(() => (0, nls_1.localize)('turning on syncing', "Turning on Settings Sync..."));
                priority = 1;
            }
            if (badge) {
                this.globalActivityBadgeDisposable.value = this.activityService.showGlobalActivity({ badge, priority });
            }
        }
        async updateAccountBadge() {
            this.accountBadgeDisposable.clear();
            let badge = undefined;
            if (this.userDataSyncService.status !== "uninitialized" /* SyncStatus.Uninitialized */ && this.userDataSyncEnablementService.isEnabled() && this.userDataSyncWorkbenchService.accountStatus === "unavailable" /* AccountStatus.Unavailable */) {
                badge = new activity_1.NumberBadge(1, () => (0, nls_1.localize)('sign in to sync', "Sign in to Sync Settings"));
            }
            if (badge) {
                this.accountBadgeDisposable.value = this.activityService.showAccountsActivity({ badge, priority: undefined });
            }
        }
        async turnOn() {
            try {
                if (!this.userDataSyncWorkbenchService.authenticationProviders.length) {
                    throw new Error((0, nls_1.localize)('no authentication providers', "No authentication providers are available."));
                }
                const turnOn = await this.askToConfigure();
                if (!turnOn) {
                    return;
                }
                if (this.userDataSyncStoreManagementService.userDataSyncStore?.canSwitch) {
                    await this.selectSettingsSyncService(this.userDataSyncStoreManagementService.userDataSyncStore);
                }
                await this.userDataSyncWorkbenchService.turnOn();
            }
            catch (e) {
                if ((0, errors_1.isCancellationError)(e)) {
                    return;
                }
                if (e instanceof userDataSync_1.UserDataSyncError) {
                    switch (e.code) {
                        case "TooLarge" /* UserDataSyncErrorCode.TooLarge */:
                            if (e.resource === "keybindings" /* SyncResource.Keybindings */ || e.resource === "settings" /* SyncResource.Settings */ || e.resource === "tasks" /* SyncResource.Tasks */) {
                                this.handleTooLargeError(e.resource, (0, nls_1.localize)('too large while starting sync', "Settings sync cannot be turned on because size of the {0} file to sync is larger than {1}. Please open the file and reduce the size and turn on sync", (0, userDataSync_2.getSyncAreaLabel)(e.resource).toLowerCase(), '100kb'), e);
                                return;
                            }
                            break;
                        case "IncompatibleLocalContent" /* UserDataSyncErrorCode.IncompatibleLocalContent */:
                        case "Gone" /* UserDataSyncErrorCode.Gone */:
                        case "UpgradeRequired" /* UserDataSyncErrorCode.UpgradeRequired */: {
                            const message = (0, nls_1.localize)('error upgrade required while starting sync', "Settings sync cannot be turned on because the current version ({0}, {1}) is not compatible with the sync service. Please update before turning on sync.", this.productService.version, this.productService.commit);
                            const operationId = e.operationId ? (0, nls_1.localize)('operationId', "Operation Id: {0}", e.operationId) : undefined;
                            this.notificationService.notify({
                                severity: notification_1.Severity.Error,
                                message: operationId ? `${message} ${operationId}` : message,
                            });
                            return;
                        }
                        case "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */:
                            this.notificationService.notify({
                                severity: notification_1.Severity.Error,
                                message: (0, nls_1.localize)('error reset required while starting sync', "Settings sync cannot be turned on because your data in the cloud is older than that of the client. Please clear your data in the cloud before turning on sync."),
                                actions: {
                                    primary: [
                                        new actions_1.Action('reset', (0, nls_1.localize)('reset', "Clear Data in Cloud..."), undefined, true, () => this.userDataSyncWorkbenchService.resetSyncedData()),
                                        new actions_1.Action('show synced data', (0, nls_1.localize)('show synced data action', "Show Synced Data"), undefined, true, () => this.userDataSyncWorkbenchService.showSyncActivity())
                                    ]
                                }
                            });
                            return;
                        case "Unauthorized" /* UserDataSyncErrorCode.Unauthorized */:
                        case "Forbidden" /* UserDataSyncErrorCode.Forbidden */:
                            this.notificationService.error((0, nls_1.localize)('auth failed', "Error while turning on Settings Sync: Authentication failed."));
                            return;
                    }
                    this.notificationService.error((0, nls_1.localize)('turn on failed with user data sync error', "Error while turning on Settings Sync. Please check [logs]({0}) for more details.", `command:${userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID}`));
                }
                else {
                    this.notificationService.error((0, nls_1.localize)({ key: 'turn on failed', comment: ['Substitution is for error reason'] }, "Error while turning on Settings Sync. {0}", (0, errors_1.getErrorMessage)(e)));
                }
            }
        }
        async askToConfigure() {
            return new Promise((c, e) => {
                const disposables = new lifecycle_1.DisposableStore();
                const quickPick = this.quickInputService.createQuickPick();
                disposables.add(quickPick);
                quickPick.title = userDataSync_2.SYNC_TITLE.value;
                quickPick.ok = false;
                quickPick.customButton = true;
                quickPick.customLabel = (0, nls_1.localize)('sign in and turn on', "Sign in");
                quickPick.description = (0, nls_1.localize)('configure and turn on sync detail', "Please sign in to backup and sync your data across devices.");
                quickPick.canSelectMany = true;
                quickPick.ignoreFocusOut = true;
                quickPick.hideInput = true;
                quickPick.hideCheckAll = true;
                const items = this.getConfigureSyncQuickPickItems();
                quickPick.items = items;
                quickPick.selectedItems = items.filter(item => this.userDataSyncEnablementService.isResourceEnabled(item.id));
                let accepted = false;
                disposables.add(event_1.Event.any(quickPick.onDidAccept, quickPick.onDidCustom)(() => {
                    accepted = true;
                    quickPick.hide();
                }));
                disposables.add(quickPick.onDidHide(() => {
                    try {
                        if (accepted) {
                            this.updateConfiguration(items, quickPick.selectedItems);
                        }
                        c(accepted);
                    }
                    catch (error) {
                        e(error);
                    }
                    finally {
                        disposables.dispose();
                    }
                }));
                quickPick.show();
            });
        }
        getConfigureSyncQuickPickItems() {
            const result = [{
                    id: "settings" /* SyncResource.Settings */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("settings" /* SyncResource.Settings */)
                }, {
                    id: "keybindings" /* SyncResource.Keybindings */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("keybindings" /* SyncResource.Keybindings */),
                }, {
                    id: "snippets" /* SyncResource.Snippets */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("snippets" /* SyncResource.Snippets */)
                }, {
                    id: "tasks" /* SyncResource.Tasks */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("tasks" /* SyncResource.Tasks */)
                }, {
                    id: "globalState" /* SyncResource.GlobalState */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("globalState" /* SyncResource.GlobalState */),
                }, {
                    id: "extensions" /* SyncResource.Extensions */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("extensions" /* SyncResource.Extensions */)
                }];
            if (this.userDataProfilesService.isEnabled()) {
                result.push({
                    id: "profiles" /* SyncResource.Profiles */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("profiles" /* SyncResource.Profiles */),
                });
            }
            return result;
        }
        updateConfiguration(items, selectedItems) {
            for (const item of items) {
                const wasEnabled = this.userDataSyncEnablementService.isResourceEnabled(item.id);
                const isEnabled = !!selectedItems.filter(selected => selected.id === item.id)[0];
                if (wasEnabled !== isEnabled) {
                    this.userDataSyncEnablementService.setResourceEnablement(item.id, isEnabled);
                }
            }
        }
        async configureSyncOptions() {
            return new Promise((c, e) => {
                const disposables = new lifecycle_1.DisposableStore();
                const quickPick = this.quickInputService.createQuickPick();
                disposables.add(quickPick);
                quickPick.title = (0, nls_1.localize)('configure sync title', "{0}: Configure...", userDataSync_2.SYNC_TITLE.value);
                quickPick.placeholder = (0, nls_1.localize)('configure sync placeholder', "Choose what to sync");
                quickPick.canSelectMany = true;
                quickPick.ignoreFocusOut = true;
                quickPick.ok = true;
                const items = this.getConfigureSyncQuickPickItems();
                quickPick.items = items;
                quickPick.selectedItems = items.filter(item => this.userDataSyncEnablementService.isResourceEnabled(item.id));
                disposables.add(quickPick.onDidAccept(async () => {
                    if (quickPick.selectedItems.length) {
                        this.updateConfiguration(items, quickPick.selectedItems);
                        quickPick.hide();
                    }
                }));
                disposables.add(quickPick.onDidHide(() => {
                    disposables.dispose();
                    c();
                }));
                quickPick.show();
            });
        }
        async turnOff() {
            const result = await this.dialogService.confirm({
                message: (0, nls_1.localize)('turn off sync confirmation', "Do you want to turn off sync?"),
                detail: (0, nls_1.localize)('turn off sync detail', "Your settings, keybindings, extensions, snippets and UI State will no longer be synced."),
                primaryButton: (0, nls_1.localize)({ key: 'turn off', comment: ['&& denotes a mnemonic'] }, "&&Turn off"),
                checkbox: this.userDataSyncWorkbenchService.accountStatus === "available" /* AccountStatus.Available */ ? {
                    label: (0, nls_1.localize)('turn off sync everywhere', "Turn off sync on all your devices and clear the data from the cloud.")
                } : undefined
            });
            if (result.confirmed) {
                return this.userDataSyncWorkbenchService.turnoff(!!result.checkboxChecked);
            }
        }
        disableSync(source) {
            switch (source) {
                case "settings" /* SyncResource.Settings */: return this.userDataSyncEnablementService.setResourceEnablement("settings" /* SyncResource.Settings */, false);
                case "keybindings" /* SyncResource.Keybindings */: return this.userDataSyncEnablementService.setResourceEnablement("keybindings" /* SyncResource.Keybindings */, false);
                case "snippets" /* SyncResource.Snippets */: return this.userDataSyncEnablementService.setResourceEnablement("snippets" /* SyncResource.Snippets */, false);
                case "tasks" /* SyncResource.Tasks */: return this.userDataSyncEnablementService.setResourceEnablement("tasks" /* SyncResource.Tasks */, false);
                case "extensions" /* SyncResource.Extensions */: return this.userDataSyncEnablementService.setResourceEnablement("extensions" /* SyncResource.Extensions */, false);
                case "globalState" /* SyncResource.GlobalState */: return this.userDataSyncEnablementService.setResourceEnablement("globalState" /* SyncResource.GlobalState */, false);
                case "profiles" /* SyncResource.Profiles */: return this.userDataSyncEnablementService.setResourceEnablement("profiles" /* SyncResource.Profiles */, false);
            }
        }
        showSyncActivity() {
            return this.outputService.showChannel(userDataSync_1.USER_DATA_SYNC_LOG_ID);
        }
        async selectSettingsSyncService(userDataSyncStore) {
            return new Promise((c, e) => {
                const disposables = new lifecycle_1.DisposableStore();
                const quickPick = disposables.add(this.quickInputService.createQuickPick());
                quickPick.title = (0, nls_1.localize)('switchSyncService.title', "{0}: Select Service", userDataSync_2.SYNC_TITLE.value);
                quickPick.description = (0, nls_1.localize)('switchSyncService.description', "Ensure you are using the same settings sync service when syncing with multiple environments");
                quickPick.hideInput = true;
                quickPick.ignoreFocusOut = true;
                const getDescription = (url) => {
                    const isDefault = (0, resources_1.isEqual)(url, userDataSyncStore.defaultUrl);
                    if (isDefault) {
                        return (0, nls_1.localize)('default', "Default");
                    }
                    return undefined;
                };
                quickPick.items = [
                    {
                        id: 'insiders',
                        label: (0, nls_1.localize)('insiders', "Insiders"),
                        description: getDescription(userDataSyncStore.insidersUrl)
                    },
                    {
                        id: 'stable',
                        label: (0, nls_1.localize)('stable', "Stable"),
                        description: getDescription(userDataSyncStore.stableUrl)
                    }
                ];
                disposables.add(quickPick.onDidAccept(async () => {
                    try {
                        await this.userDataSyncStoreManagementService.switch(quickPick.selectedItems[0].id);
                        c();
                    }
                    catch (error) {
                        e(error);
                    }
                    finally {
                        quickPick.hide();
                    }
                }));
                disposables.add(quickPick.onDidHide(() => disposables.dispose()));
                quickPick.show();
            });
        }
        registerActions() {
            if (this.userDataSyncEnablementService.canToggleEnablement()) {
                this.registerTurnOnSyncAction();
                this.registerTurnOffSyncAction();
            }
            this.registerTurningOnSyncAction();
            this.registerCancelTurnOnSyncAction();
            this.registerSignInAction(); // When Sync is turned on from CLI
            this.registerShowConflictsAction();
            this.registerEnableSyncViewsAction();
            this.registerManageSyncAction();
            this.registerSyncNowAction();
            this.registerConfigureSyncAction();
            this.registerShowSettingsAction();
            this.registerHelpAction();
            this.registerShowLogAction();
            this.registerResetSyncDataAction();
            this.registerAcceptMergesAction();
            if (platform_2.isWeb) {
                this.registerDownloadSyncActivityAction();
            }
        }
        registerTurnOnSyncAction() {
            const that = this;
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_SYNC_ENABLEMENT.toNegated(), CONTEXT_TURNING_ON_STATE.negate());
            this._register((0, actions_2.registerAction2)(class TurningOnSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userDataSync.actions.turnOn',
                        title: (0, nls_1.localize2)('global activity turn on sync', 'Backup and Sync Settings...'),
                        category: userDataSync_2.SYNC_TITLE,
                        f1: true,
                        precondition: when,
                        menu: [{
                                group: '3_settings_sync',
                                id: actions_2.MenuId.GlobalActivity,
                                when,
                                order: 1
                            }, {
                                group: '3_settings_sync',
                                id: actions_2.MenuId.MenubarPreferencesMenu,
                                when,
                                order: 1
                            }, {
                                group: '1_settings',
                                id: actions_2.MenuId.AccountsContext,
                                when,
                                order: 2
                            }]
                    });
                }
                async run() {
                    return that.turnOn();
                }
            }));
        }
        registerTurningOnSyncAction() {
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_SYNC_ENABLEMENT.toNegated(), CONTEXT_TURNING_ON_STATE);
            this._register((0, actions_2.registerAction2)(class TurningOnSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userData.actions.turningOn',
                        title: (0, nls_1.localize)('turnin on sync', "Turning on Settings Sync..."),
                        precondition: contextkey_1.ContextKeyExpr.false(),
                        menu: [{
                                group: '3_settings_sync',
                                id: actions_2.MenuId.GlobalActivity,
                                when,
                                order: 2
                            }, {
                                group: '1_settings',
                                id: actions_2.MenuId.AccountsContext,
                                when,
                            }]
                    });
                }
                async run() { }
            }));
        }
        registerCancelTurnOnSyncAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class TurningOnSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userData.actions.cancelTurnOn',
                        title: (0, nls_1.localize)('cancel turning on sync', "Cancel"),
                        icon: codicons_1.Codicon.stopCircle,
                        menu: {
                            id: actions_2.MenuId.ViewContainerTitle,
                            when: contextkey_1.ContextKeyExpr.and(CONTEXT_TURNING_ON_STATE, contextkey_1.ContextKeyExpr.equals('viewContainer', userDataSync_2.SYNC_VIEW_CONTAINER_ID)),
                            group: 'navigation',
                            order: 1
                        }
                    });
                }
                async run() {
                    return that.userDataSyncWorkbenchService.turnoff(false);
                }
            }));
        }
        registerSignInAction() {
            const that = this;
            const id = 'workbench.userData.actions.signin';
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_SYNC_ENABLEMENT, userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("unavailable" /* AccountStatus.Unavailable */));
            this._register((0, actions_2.registerAction2)(class StopSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userData.actions.signin',
                        title: (0, nls_1.localize)('sign in global', "Sign in to Sync Settings"),
                        menu: {
                            group: '3_settings_sync',
                            id: actions_2.MenuId.GlobalActivity,
                            when,
                            order: 2
                        }
                    });
                }
                async run() {
                    try {
                        await that.userDataSyncWorkbenchService.signIn();
                    }
                    catch (e) {
                        that.notificationService.error(e);
                    }
                }
            }));
            this._register(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.AccountsContext, {
                group: '1_settings',
                command: {
                    id,
                    title: (0, nls_1.localize)('sign in accounts', "Sign in to Sync Settings (1)"),
                },
                when
            }));
        }
        getShowConflictsTitle() {
            return (0, nls_1.localize2)('resolveConflicts_global', "Show Conflicts ({0})", this.getConflictsCount());
        }
        registerShowConflictsAction() {
            this.conflictsActionDisposable.value = undefined;
            const that = this;
            this.conflictsActionDisposable.value = (0, actions_2.registerAction2)(class TurningOnSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: showConflictsCommandId,
                        get title() { return that.getShowConflictsTitle(); },
                        category: userDataSync_2.SYNC_TITLE,
                        f1: true,
                        precondition: userDataSync_2.CONTEXT_HAS_CONFLICTS,
                        menu: [{
                                group: '3_settings_sync',
                                id: actions_2.MenuId.GlobalActivity,
                                when: userDataSync_2.CONTEXT_HAS_CONFLICTS,
                                order: 2
                            }, {
                                group: '3_settings_sync',
                                id: actions_2.MenuId.MenubarPreferencesMenu,
                                when: userDataSync_2.CONTEXT_HAS_CONFLICTS,
                                order: 2
                            }]
                    });
                }
                async run() {
                    return that.userDataSyncWorkbenchService.showConflicts();
                }
            });
        }
        registerManageSyncAction() {
            const that = this;
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_ENABLEMENT, userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */));
            this._register((0, actions_2.registerAction2)(class SyncStatusAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userDataSync.actions.manage',
                        title: (0, nls_1.localize)('sync is on', "Settings Sync is On"),
                        toggled: contextkey_1.ContextKeyTrueExpr.INSTANCE,
                        menu: [
                            {
                                id: actions_2.MenuId.GlobalActivity,
                                group: '3_settings_sync',
                                when,
                                order: 2
                            },
                            {
                                id: actions_2.MenuId.MenubarPreferencesMenu,
                                group: '3_settings_sync',
                                when,
                                order: 2,
                            },
                            {
                                id: actions_2.MenuId.AccountsContext,
                                group: '1_settings',
                                when,
                            }
                        ],
                    });
                }
                run(accessor) {
                    return new Promise((c, e) => {
                        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                        const commandService = accessor.get(commands_1.ICommandService);
                        const disposables = new lifecycle_1.DisposableStore();
                        const quickPick = quickInputService.createQuickPick();
                        disposables.add(quickPick);
                        const items = [];
                        if (that.userDataSyncService.conflicts.length) {
                            items.push({ id: showConflictsCommandId, label: `${userDataSync_2.SYNC_TITLE.value}: ${that.getShowConflictsTitle().original}` });
                            items.push({ type: 'separator' });
                        }
                        items.push({ id: configureSyncCommand.id, label: `${userDataSync_2.SYNC_TITLE.value}: ${configureSyncCommand.title.original}` });
                        items.push({ id: showSyncSettingsCommand.id, label: `${userDataSync_2.SYNC_TITLE.value}: ${showSyncSettingsCommand.title.original}` });
                        items.push({ id: showSyncedDataCommand.id, label: `${userDataSync_2.SYNC_TITLE.value}: ${showSyncedDataCommand.title.original}` });
                        items.push({ type: 'separator' });
                        items.push({ id: syncNowCommand.id, label: `${userDataSync_2.SYNC_TITLE.value}: ${syncNowCommand.title.original}`, description: syncNowCommand.description(that.userDataSyncService) });
                        if (that.userDataSyncEnablementService.canToggleEnablement()) {
                            const account = that.userDataSyncWorkbenchService.current;
                            items.push({ id: turnOffSyncCommand.id, label: `${userDataSync_2.SYNC_TITLE.value}: ${turnOffSyncCommand.title.original}`, description: account ? `${account.accountName} (${that.authenticationService.getProvider(account.authenticationProviderId).label})` : undefined });
                        }
                        quickPick.items = items;
                        disposables.add(quickPick.onDidAccept(() => {
                            if (quickPick.selectedItems[0] && quickPick.selectedItems[0].id) {
                                commandService.executeCommand(quickPick.selectedItems[0].id);
                            }
                            quickPick.hide();
                        }));
                        disposables.add(quickPick.onDidHide(() => {
                            disposables.dispose();
                            c();
                        }));
                        quickPick.show();
                    });
                }
            }));
        }
        registerEnableSyncViewsAction() {
            const that = this;
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */));
            this._register((0, actions_2.registerAction2)(class SyncStatusAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: showSyncedDataCommand.id,
                        title: showSyncedDataCommand.title,
                        category: userDataSync_2.SYNC_TITLE,
                        precondition: when,
                        menu: {
                            id: actions_2.MenuId.CommandPalette,
                            when
                        }
                    });
                }
                run(accessor) {
                    return that.userDataSyncWorkbenchService.showSyncActivity();
                }
            }));
        }
        registerSyncNowAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class SyncNowAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: syncNowCommand.id,
                        title: syncNowCommand.title,
                        category: userDataSync_2.SYNC_TITLE,
                        menu: {
                            id: actions_2.MenuId.CommandPalette,
                            when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_ENABLEMENT, userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */))
                        }
                    });
                }
                run(accessor) {
                    return that.userDataSyncWorkbenchService.syncNow();
                }
            }));
        }
        registerTurnOffSyncAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class StopSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: turnOffSyncCommand.id,
                        title: turnOffSyncCommand.title,
                        category: userDataSync_2.SYNC_TITLE,
                        menu: {
                            id: actions_2.MenuId.CommandPalette,
                            when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_SYNC_ENABLEMENT),
                        },
                    });
                }
                async run() {
                    try {
                        await that.turnOff();
                    }
                    catch (e) {
                        if (!(0, errors_1.isCancellationError)(e)) {
                            that.notificationService.error((0, nls_1.localize)('turn off failed', "Error while turning off Settings Sync. Please check [logs]({0}) for more details.", `command:${userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID}`));
                        }
                    }
                }
            }));
        }
        registerConfigureSyncAction() {
            const that = this;
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_SYNC_ENABLEMENT);
            this._register((0, actions_2.registerAction2)(class ConfigureSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: configureSyncCommand.id,
                        title: configureSyncCommand.title,
                        category: userDataSync_2.SYNC_TITLE,
                        icon: codicons_1.Codicon.settingsGear,
                        tooltip: (0, nls_1.localize)('configure', "Configure..."),
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when
                            }, {
                                id: actions_2.MenuId.ViewContainerTitle,
                                when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_ENABLEMENT, contextkey_1.ContextKeyExpr.equals('viewContainer', userDataSync_2.SYNC_VIEW_CONTAINER_ID)),
                                group: 'navigation',
                                order: 2
                            }]
                    });
                }
                run() { return that.configureSyncOptions(); }
            }));
        }
        registerShowLogAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class ShowSyncActivityAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID,
                        title: (0, nls_1.localize)('show sync log title', "{0}: Show Log", userDataSync_2.SYNC_TITLE.value),
                        tooltip: (0, nls_1.localize)('show sync log toolrip', "Show Log"),
                        icon: codicons_1.Codicon.output,
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */)),
                            }, {
                                id: actions_2.MenuId.ViewContainerTitle,
                                when: contextkey_1.ContextKeyExpr.equals('viewContainer', userDataSync_2.SYNC_VIEW_CONTAINER_ID),
                                group: 'navigation',
                                order: 1
                            }],
                    });
                }
                run() { return that.showSyncActivity(); }
            }));
        }
        registerShowSettingsAction() {
            this._register((0, actions_2.registerAction2)(class ShowSyncSettingsAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: showSyncSettingsCommand.id,
                        title: showSyncSettingsCommand.title,
                        category: userDataSync_2.SYNC_TITLE,
                        menu: {
                            id: actions_2.MenuId.CommandPalette,
                            when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */)),
                        },
                    });
                }
                run(accessor) {
                    accessor.get(preferences_1.IPreferencesService).openUserSettings({ jsonEditor: false, query: '@tag:sync' });
                }
            }));
        }
        registerHelpAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class HelpAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userDataSync.actions.help',
                        title: userDataSync_2.SYNC_TITLE,
                        category: actionCommonCategories_1.Categories.Help,
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */)),
                            }],
                    });
                }
                run() { return that.openerService.open(uri_1.URI.parse('https://aka.ms/vscode-settings-sync-help')); }
            }));
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.ViewContainerTitle, {
                command: {
                    id: 'workbench.userDataSync.actions.help',
                    title: actionCommonCategories_1.Categories.Help.value
                },
                when: contextkey_1.ContextKeyExpr.equals('viewContainer', userDataSync_2.SYNC_VIEW_CONTAINER_ID),
                group: '1_help',
            });
        }
        registerAcceptMergesAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class AcceptMergesAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userDataSync.actions.acceptMerges',
                        title: (0, nls_1.localize)('complete merges title', "Complete Merge"),
                        menu: [{
                                id: actions_2.MenuId.EditorContent,
                                when: contextkey_1.ContextKeyExpr.and(mergeEditor_1.ctxIsMergeResultEditor, contextkey_1.ContextKeyExpr.regex(mergeEditor_1.ctxMergeBaseUri.key, new RegExp(`^${userDataSync_1.USER_DATA_SYNC_SCHEME}:`))),
                            }],
                    });
                }
                async run(accessor, previewResource) {
                    const textFileService = accessor.get(textfiles_1.ITextFileService);
                    await textFileService.save(previewResource);
                    const content = await textFileService.read(previewResource);
                    await that.userDataSyncService.accept(this.getSyncResource(previewResource), previewResource, content.value, true);
                }
                getSyncResource(previewResource) {
                    const conflict = that.userDataSyncService.conflicts.find(({ conflicts }) => conflicts.some(conflict => (0, resources_1.isEqual)(conflict.previewResource, previewResource)));
                    if (conflict) {
                        return conflict;
                    }
                    throw new Error(`Unknown resource: ${previewResource.toString()}`);
                }
            }));
        }
        registerDownloadSyncActivityAction() {
            this._register((0, actions_2.registerAction2)(class DownloadSyncActivityAction extends actions_2.Action2 {
                constructor() {
                    super(userDataSync_2.DOWNLOAD_ACTIVITY_ACTION_DESCRIPTOR);
                }
                async run(accessor) {
                    const userDataSyncWorkbenchService = accessor.get(userDataSync_2.IUserDataSyncWorkbenchService);
                    const notificationService = accessor.get(notification_1.INotificationService);
                    const folder = await userDataSyncWorkbenchService.downloadSyncActivity();
                    if (folder) {
                        notificationService.info((0, nls_1.localize)('download sync activity complete', "Successfully downloaded Settings Sync activity."));
                    }
                }
            }));
        }
        registerViews() {
            const container = this.registerViewContainer();
            this.registerDataViews(container);
        }
        registerViewContainer() {
            return platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
                id: userDataSync_2.SYNC_VIEW_CONTAINER_ID,
                title: userDataSync_2.SYNC_TITLE,
                ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [userDataSync_2.SYNC_VIEW_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true }]),
                icon: userDataSync_2.SYNC_VIEW_ICON,
                hideIfEmpty: true,
            }, 0 /* ViewContainerLocation.Sidebar */);
        }
        registerResetSyncDataAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.actions.syncData.reset',
                        title: (0, nls_1.localize)('workbench.actions.syncData.reset', "Clear Data in Cloud..."),
                        menu: [{
                                id: actions_2.MenuId.ViewContainerTitle,
                                when: contextkey_1.ContextKeyExpr.equals('viewContainer', userDataSync_2.SYNC_VIEW_CONTAINER_ID),
                                group: '0_configure',
                            }],
                    });
                }
                run() { return that.userDataSyncWorkbenchService.resetSyncedData(); }
            }));
        }
        registerDataViews(container) {
            this._register(this.instantiationService.createInstance(userDataSyncViews_1.UserDataSyncDataViews, container));
        }
    };
    exports.UserDataSyncWorkbenchContribution = UserDataSyncWorkbenchContribution;
    exports.UserDataSyncWorkbenchContribution = UserDataSyncWorkbenchContribution = __decorate([
        __param(0, userDataSync_1.IUserDataSyncEnablementService),
        __param(1, userDataSync_1.IUserDataSyncService),
        __param(2, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, activity_1.IActivityService),
        __param(5, notification_1.INotificationService),
        __param(6, editorService_1.IEditorService),
        __param(7, userDataProfile_1.IUserDataProfilesService),
        __param(8, userDataProfile_2.IUserDataProfileService),
        __param(9, dialogs_1.IDialogService),
        __param(10, quickInput_1.IQuickInputService),
        __param(11, instantiation_1.IInstantiationService),
        __param(12, output_1.IOutputService),
        __param(13, userDataSync_1.IUserDataAutoSyncService),
        __param(14, resolverService_1.ITextModelService),
        __param(15, preferences_1.IPreferencesService),
        __param(16, telemetry_1.ITelemetryService),
        __param(17, productService_1.IProductService),
        __param(18, opener_1.IOpenerService),
        __param(19, authentication_1.IAuthenticationService),
        __param(20, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(21, host_1.IHostService),
        __param(22, commands_1.ICommandService),
        __param(23, issue_1.IWorkbenchIssueService)
    ], UserDataSyncWorkbenchContribution);
    let UserDataRemoteContentProvider = class UserDataRemoteContentProvider {
        constructor(userDataSyncService, modelService, languageService) {
            this.userDataSyncService = userDataSyncService;
            this.modelService = modelService;
            this.languageService = languageService;
        }
        provideTextContent(uri) {
            if (uri.scheme === userDataSync_1.USER_DATA_SYNC_SCHEME) {
                return this.userDataSyncService.resolveContent(uri).then(content => this.modelService.createModel(content || '', this.languageService.createById('jsonc'), uri));
            }
            return null;
        }
    };
    UserDataRemoteContentProvider = __decorate([
        __param(0, userDataSync_1.IUserDataSyncService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService)
    ], UserDataRemoteContentProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi91c2VyRGF0YVN5bmMvYnJvd3Nlci91c2VyRGF0YVN5bmMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBK0RoRyxNQUFNLGtCQUFrQixHQUFHLEVBQUUsRUFBRSxFQUFFLHdDQUF3QyxFQUFFLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQztJQUN2SCxNQUFNLG9CQUFvQixHQUFHLEVBQUUsRUFBRSxFQUFFLHdDQUF5QixFQUFFLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxnQkFBZ0IsRUFBRSxjQUFjLENBQUMsRUFBRSxDQUFDO0lBQ25ILE1BQU0sc0JBQXNCLEdBQUcsOENBQThDLENBQUM7SUFDOUUsTUFBTSxjQUFjLEdBQUc7UUFDdEIsRUFBRSxFQUFFLHdDQUF3QztRQUM1QyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztRQUN4QyxXQUFXLENBQUMsbUJBQXlDO1lBQ3BELElBQUksbUJBQW1CLENBQUMsTUFBTSx1Q0FBdUIsRUFBRSxDQUFDO2dCQUN2RCxPQUFPLElBQUEsY0FBUSxFQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBQ0QsSUFBSSxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDdEMsT0FBTyxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsSUFBQSxjQUFPLEVBQUMsbUJBQW1CLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDcEcsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7S0FDRCxDQUFD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