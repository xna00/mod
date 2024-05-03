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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/extensions", "vs/workbench/services/userDataSync/common/userDataSync", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/services/authentication/browser/authenticationService", "vs/workbench/services/authentication/common/authentication", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/workbench/services/extensions/common/extensions", "vs/nls", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/platform/contextkey/common/contextkey", "vs/platform/progress/common/progress", "vs/base/common/uri", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/base/common/platform", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/platform/userDataSync/common/globalStateSync", "vs/base/common/errors", "vs/base/common/async", "vs/base/common/cancellation", "vs/workbench/services/editor/common/editorService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/common/editor", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/userData/browser/userDataInit", "vs/platform/secrets/common/secrets", "vs/platform/files/common/files", "vs/base/common/strings", "vs/platform/userDataSync/common/userDataSyncMachines"], function (require, exports, userDataSync_1, telemetry_1, extensions_1, userDataSync_2, lifecycle_1, event_1, authenticationService_1, authentication_1, userDataSyncAccount_1, quickInput_1, storage_1, log_1, productService_1, extensions_2, nls_1, notification_1, dialogs_1, contextkey_1, progress_1, uri_1, views_1, viewsService_1, lifecycle_2, platform_1, instantiation_1, userDataSyncStoreService_1, globalStateSync_1, errors_1, async_1, cancellation_1, editorService_1, uriIdentity_1, editor_1, environmentService_1, userDataInit_1, secrets_1, files_1, strings_1, userDataSyncMachines_1) {
    "use strict";
    var UserDataSyncWorkbenchService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncWorkbenchService = void 0;
    exports.isMergeEditorInput = isMergeEditorInput;
    class UserDataSyncAccount {
        constructor(authenticationProviderId, session) {
            this.authenticationProviderId = authenticationProviderId;
            this.session = session;
        }
        get sessionId() { return this.session.id; }
        get accountName() { return this.session.account.label; }
        get accountId() { return this.session.account.id; }
        get token() { return this.session.idToken || this.session.accessToken; }
    }
    function isMergeEditorInput(editor) {
        const candidate = editor;
        return uri_1.URI.isUri(candidate?.base) && uri_1.URI.isUri(candidate?.input1?.uri) && uri_1.URI.isUri(candidate?.input2?.uri) && uri_1.URI.isUri(candidate?.result);
    }
    let UserDataSyncWorkbenchService = class UserDataSyncWorkbenchService extends lifecycle_1.Disposable {
        static { UserDataSyncWorkbenchService_1 = this; }
        static { this.DONOT_USE_WORKBENCH_SESSION_STORAGE_KEY = 'userDataSyncAccount.donotUseWorkbenchSession'; }
        static { this.CACHED_AUTHENTICATION_PROVIDER_KEY = 'userDataSyncAccountProvider'; }
        static { this.CACHED_SESSION_STORAGE_KEY = 'userDataSyncAccountPreference'; }
        get enabled() { return !!this.userDataSyncStoreManagementService.userDataSyncStore; }
        get authenticationProviders() { return this._authenticationProviders; }
        get accountStatus() { return this._accountStatus; }
        get current() { return this._current; }
        constructor(userDataSyncService, uriIdentityService, authenticationService, userDataSyncAccountService, quickInputService, storageService, userDataSyncEnablementService, userDataAutoSyncService, telemetryService, logService, productService, extensionService, environmentService, secretStorageService, notificationService, progressService, dialogService, contextKeyService, viewsService, viewDescriptorService, userDataSyncStoreManagementService, lifecycleService, instantiationService, editorService, userDataInitializationService, fileService, fileDialogService, userDataSyncMachinesService) {
            super();
            this.userDataSyncService = userDataSyncService;
            this.uriIdentityService = uriIdentityService;
            this.authenticationService = authenticationService;
            this.userDataSyncAccountService = userDataSyncAccountService;
            this.quickInputService = quickInputService;
            this.storageService = storageService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.userDataAutoSyncService = userDataAutoSyncService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.productService = productService;
            this.extensionService = extensionService;
            this.environmentService = environmentService;
            this.secretStorageService = secretStorageService;
            this.notificationService = notificationService;
            this.progressService = progressService;
            this.dialogService = dialogService;
            this.viewsService = viewsService;
            this.viewDescriptorService = viewDescriptorService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.lifecycleService = lifecycleService;
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.userDataInitializationService = userDataInitializationService;
            this.fileService = fileService;
            this.fileDialogService = fileDialogService;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this._authenticationProviders = [];
            this._accountStatus = "unavailable" /* AccountStatus.Unavailable */;
            this._onDidChangeAccountStatus = this._register(new event_1.Emitter());
            this.onDidChangeAccountStatus = this._onDidChangeAccountStatus.event;
            this.turnOnSyncCancellationToken = undefined;
            this._cachedCurrentAuthenticationProviderId = null;
            this._cachedCurrentSessionId = null;
            this.syncEnablementContext = userDataSync_2.CONTEXT_SYNC_ENABLEMENT.bindTo(contextKeyService);
            this.syncStatusContext = userDataSync_2.CONTEXT_SYNC_STATE.bindTo(contextKeyService);
            this.accountStatusContext = userDataSync_2.CONTEXT_ACCOUNT_STATE.bindTo(contextKeyService);
            this.activityViewsEnablementContext = userDataSync_2.CONTEXT_ENABLE_ACTIVITY_VIEWS.bindTo(contextKeyService);
            this.hasConflicts = userDataSync_2.CONTEXT_HAS_CONFLICTS.bindTo(contextKeyService);
            this.enableConflictsViewContext = userDataSync_2.CONTEXT_ENABLE_SYNC_CONFLICTS_VIEW.bindTo(contextKeyService);
            if (this.userDataSyncStoreManagementService.userDataSyncStore) {
                this.syncStatusContext.set(this.userDataSyncService.status);
                this._register(userDataSyncService.onDidChangeStatus(status => this.syncStatusContext.set(status)));
                this.syncEnablementContext.set(userDataSyncEnablementService.isEnabled());
                this._register(userDataSyncEnablementService.onDidChangeEnablement(enabled => this.syncEnablementContext.set(enabled)));
                this.waitAndInitialize();
            }
        }
        updateAuthenticationProviders() {
            this._authenticationProviders = (this.userDataSyncStoreManagementService.userDataSyncStore?.authenticationProviders || []).filter(({ id }) => this.authenticationService.declaredProviders.some(provider => provider.id === id));
        }
        isSupportedAuthenticationProviderId(authenticationProviderId) {
            return this.authenticationProviders.some(({ id }) => id === authenticationProviderId);
        }
        async waitAndInitialize() {
            /* wait */
            await Promise.all([this.extensionService.whenInstalledExtensionsRegistered(), this.userDataInitializationService.whenInitializationFinished()]);
            /* initialize */
            try {
                await this.initialize();
            }
            catch (error) {
                // Do not log if the current window is running extension tests
                if (!this.environmentService.extensionTestsLocationURI) {
                    this.logService.error(error);
                }
            }
        }
        async initialize() {
            if (platform_1.isWeb) {
                const authenticationSession = await (0, authenticationService_1.getCurrentAuthenticationSessionInfo)(this.secretStorageService, this.productService);
                if (this.currentSessionId === undefined && authenticationSession?.id) {
                    if (this.environmentService.options?.settingsSyncOptions?.authenticationProvider && this.environmentService.options.settingsSyncOptions.enabled) {
                        this.currentSessionId = authenticationSession.id;
                    }
                    // Backward compatibility
                    else if (this.useWorkbenchSessionId) {
                        this.currentSessionId = authenticationSession.id;
                    }
                    this.useWorkbenchSessionId = false;
                }
            }
            await this.update();
            this._register(this.authenticationService.onDidChangeDeclaredProviders(() => this.updateAuthenticationProviders()));
            this._register(event_1.Event.filter(event_1.Event.any(this.authenticationService.onDidRegisterAuthenticationProvider, this.authenticationService.onDidUnregisterAuthenticationProvider), info => this.isSupportedAuthenticationProviderId(info.id))(() => this.update()));
            this._register(event_1.Event.filter(this.userDataSyncAccountService.onTokenFailed, isSuccessive => !isSuccessive)(() => this.update('token failure')));
            this._register(event_1.Event.filter(this.authenticationService.onDidChangeSessions, e => this.isSupportedAuthenticationProviderId(e.providerId))(({ event }) => this.onDidChangeSessions(event)));
            this._register(this.storageService.onDidChangeValue(-1 /* StorageScope.APPLICATION */, UserDataSyncWorkbenchService_1.CACHED_SESSION_STORAGE_KEY, this._register(new lifecycle_1.DisposableStore()))(() => this.onDidChangeStorage()));
            this._register(event_1.Event.filter(this.userDataSyncAccountService.onTokenFailed, bailout => bailout)(() => this.onDidAuthFailure()));
            this.hasConflicts.set(this.userDataSyncService.conflicts.length > 0);
            this._register(this.userDataSyncService.onDidChangeConflicts(conflicts => {
                this.hasConflicts.set(conflicts.length > 0);
                if (!conflicts.length) {
                    this.enableConflictsViewContext.reset();
                }
                // Close merge editors with no conflicts
                this.editorService.editors.filter(input => {
                    const remoteResource = (0, editor_1.isDiffEditorInput)(input) ? input.original.resource : isMergeEditorInput(input) ? input.input1.uri : undefined;
                    if (remoteResource?.scheme !== userDataSync_1.USER_DATA_SYNC_SCHEME) {
                        return false;
                    }
                    return !this.userDataSyncService.conflicts.some(({ conflicts }) => conflicts.some(({ previewResource }) => this.uriIdentityService.extUri.isEqual(previewResource, input.resource)));
                }).forEach(input => input.dispose());
            }));
        }
        async update(reason) {
            if (reason) {
                this.logService.info(`Settings Sync: Updating due to ${reason}`);
            }
            this.updateAuthenticationProviders();
            await this.updateCurrentAccount();
            if (this._current) {
                this.currentAuthenticationProviderId = this._current.authenticationProviderId;
            }
            await this.updateToken(this._current);
            this.updateAccountStatus(this._current ? "available" /* AccountStatus.Available */ : "unavailable" /* AccountStatus.Unavailable */);
        }
        async updateCurrentAccount() {
            const currentSessionId = this.currentSessionId;
            const currentAuthenticationProviderId = this.currentAuthenticationProviderId;
            if (currentSessionId) {
                const authenticationProviders = currentAuthenticationProviderId ? this.authenticationProviders.filter(({ id }) => id === currentAuthenticationProviderId) : this.authenticationProviders;
                for (const { id, scopes } of authenticationProviders) {
                    const sessions = (await this.authenticationService.getSessions(id, scopes)) || [];
                    for (const session of sessions) {
                        if (session.id === currentSessionId) {
                            this._current = new UserDataSyncAccount(id, session);
                            return;
                        }
                    }
                }
            }
            this._current = undefined;
        }
        async updateToken(current) {
            let value = undefined;
            if (current) {
                try {
                    this.logService.trace('Settings Sync: Updating the token for the account', current.accountName);
                    const token = current.token;
                    this.logService.trace('Settings Sync: Token updated for the account', current.accountName);
                    value = { token, authenticationProviderId: current.authenticationProviderId };
                }
                catch (e) {
                    this.logService.error(e);
                }
            }
            await this.userDataSyncAccountService.updateAccount(value);
        }
        updateAccountStatus(accountStatus) {
            if (this._accountStatus !== accountStatus) {
                const previous = this._accountStatus;
                this.logService.trace(`Settings Sync: Account status changed from ${previous} to ${accountStatus}`);
                this._accountStatus = accountStatus;
                this.accountStatusContext.set(accountStatus);
                this._onDidChangeAccountStatus.fire(accountStatus);
            }
        }
        async turnOn() {
            if (!this.authenticationProviders.length) {
                throw new Error((0, nls_1.localize)('no authentication providers', "Settings sync cannot be turned on because there are no authentication providers available."));
            }
            if (this.userDataSyncEnablementService.isEnabled()) {
                return;
            }
            if (this.userDataSyncService.status !== "idle" /* SyncStatus.Idle */) {
                throw new Error('Cannot turn on sync while syncing');
            }
            const picked = await this.pick();
            if (!picked) {
                throw new errors_1.CancellationError();
            }
            // User did not pick an account or login failed
            if (this.accountStatus !== "available" /* AccountStatus.Available */) {
                throw new Error((0, nls_1.localize)('no account', "No account available"));
            }
            const turnOnSyncCancellationToken = this.turnOnSyncCancellationToken = new cancellation_1.CancellationTokenSource();
            const disposable = platform_1.isWeb ? lifecycle_1.Disposable.None : this.lifecycleService.onBeforeShutdown(e => e.veto((async () => {
                const { confirmed } = await this.dialogService.confirm({
                    type: 'warning',
                    message: (0, nls_1.localize)('sync in progress', "Settings Sync is being turned on. Would you like to cancel it?"),
                    title: (0, nls_1.localize)('settings sync', "Settings Sync"),
                    primaryButton: (0, nls_1.localize)({ key: 'yes', comment: ['&& denotes a mnemonic'] }, "&&Yes"),
                    cancelButton: (0, nls_1.localize)('no', "No")
                });
                if (confirmed) {
                    turnOnSyncCancellationToken.cancel();
                }
                return !confirmed;
            })(), 'veto.settingsSync'));
            try {
                await this.doTurnOnSync(turnOnSyncCancellationToken.token);
            }
            finally {
                disposable.dispose();
                this.turnOnSyncCancellationToken = undefined;
            }
            await this.userDataAutoSyncService.turnOn();
            if (this.userDataSyncStoreManagementService.userDataSyncStore?.canSwitch) {
                await this.synchroniseUserDataSyncStoreType();
            }
            this.currentAuthenticationProviderId = this.current?.authenticationProviderId;
            if (this.environmentService.options?.settingsSyncOptions?.enablementHandler && this.currentAuthenticationProviderId) {
                this.environmentService.options.settingsSyncOptions.enablementHandler(true, this.currentAuthenticationProviderId);
            }
            this.notificationService.info((0, nls_1.localize)('sync turned on', "{0} is turned on", userDataSync_2.SYNC_TITLE.value));
        }
        async turnoff(everywhere) {
            if (this.userDataSyncEnablementService.isEnabled()) {
                await this.userDataAutoSyncService.turnOff(everywhere);
                if (this.environmentService.options?.settingsSyncOptions?.enablementHandler && this.currentAuthenticationProviderId) {
                    this.environmentService.options.settingsSyncOptions.enablementHandler(false, this.currentAuthenticationProviderId);
                }
            }
            if (this.turnOnSyncCancellationToken) {
                this.turnOnSyncCancellationToken.cancel();
            }
        }
        async synchroniseUserDataSyncStoreType() {
            if (!this.userDataSyncAccountService.account) {
                throw new Error('Cannot update because you are signed out from settings sync. Please sign in and try again.');
            }
            if (!platform_1.isWeb || !this.userDataSyncStoreManagementService.userDataSyncStore) {
                // Not supported
                return;
            }
            const userDataSyncStoreUrl = this.userDataSyncStoreManagementService.userDataSyncStore.type === 'insiders' ? this.userDataSyncStoreManagementService.userDataSyncStore.stableUrl : this.userDataSyncStoreManagementService.userDataSyncStore.insidersUrl;
            const userDataSyncStoreClient = this.instantiationService.createInstance(userDataSyncStoreService_1.UserDataSyncStoreClient, userDataSyncStoreUrl);
            userDataSyncStoreClient.setAuthToken(this.userDataSyncAccountService.account.token, this.userDataSyncAccountService.account.authenticationProviderId);
            await this.instantiationService.createInstance(globalStateSync_1.UserDataSyncStoreTypeSynchronizer, userDataSyncStoreClient).sync(this.userDataSyncStoreManagementService.userDataSyncStore.type);
        }
        syncNow() {
            return this.userDataAutoSyncService.triggerSync(['Sync Now'], false, true);
        }
        async doTurnOnSync(token) {
            const disposables = new lifecycle_1.DisposableStore();
            const manualSyncTask = await this.userDataSyncService.createManualSyncTask();
            try {
                await this.progressService.withProgress({
                    location: 10 /* ProgressLocation.Window */,
                    title: userDataSync_2.SYNC_TITLE.value,
                    command: userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID,
                    delay: 500,
                }, async (progress) => {
                    progress.report({ message: (0, nls_1.localize)('turning on', "Turning on...") });
                    disposables.add(this.userDataSyncService.onDidChangeStatus(status => {
                        if (status === "hasConflicts" /* SyncStatus.HasConflicts */) {
                            progress.report({ message: (0, nls_1.localize)('resolving conflicts', "Resolving conflicts...") });
                        }
                        else {
                            progress.report({ message: (0, nls_1.localize)('syncing...', "Turning on...") });
                        }
                    }));
                    await manualSyncTask.merge();
                    if (this.userDataSyncService.status === "hasConflicts" /* SyncStatus.HasConflicts */) {
                        await this.handleConflictsWhileTurningOn(token);
                    }
                    await manualSyncTask.apply();
                });
            }
            catch (error) {
                await manualSyncTask.stop();
                throw error;
            }
            finally {
                disposables.dispose();
            }
        }
        async handleConflictsWhileTurningOn(token) {
            await this.dialogService.prompt({
                type: notification_1.Severity.Warning,
                message: (0, nls_1.localize)('conflicts detected', "Conflicts Detected"),
                detail: (0, nls_1.localize)('resolve', "Please resolve conflicts to turn on..."),
                buttons: [
                    {
                        label: (0, nls_1.localize)({ key: 'show conflicts', comment: ['&& denotes a mnemonic'] }, "&&Show Conflicts"),
                        run: async () => {
                            const waitUntilConflictsAreResolvedPromise = (0, async_1.raceCancellationError)(event_1.Event.toPromise(event_1.Event.filter(this.userDataSyncService.onDidChangeConflicts, conficts => conficts.length === 0)), token);
                            await this.showConflicts(this.userDataSyncService.conflicts[0]?.conflicts[0]);
                            await waitUntilConflictsAreResolvedPromise;
                        }
                    },
                    {
                        label: (0, nls_1.localize)({ key: 'replace local', comment: ['&& denotes a mnemonic'] }, "Replace &&Local"),
                        run: async () => this.replace(true)
                    },
                    {
                        label: (0, nls_1.localize)({ key: 'replace remote', comment: ['&& denotes a mnemonic'] }, "Replace &&Remote"),
                        run: () => this.replace(false)
                    },
                ],
                cancelButton: {
                    run: () => {
                        throw new errors_1.CancellationError();
                    }
                }
            });
        }
        async replace(local) {
            for (const conflict of this.userDataSyncService.conflicts) {
                for (const preview of conflict.conflicts) {
                    await this.accept({ syncResource: conflict.syncResource, profile: conflict.profile }, local ? preview.remoteResource : preview.localResource, undefined, { force: true });
                }
            }
        }
        async accept(resource, conflictResource, content, apply) {
            return this.userDataSyncService.accept(resource, conflictResource, content, apply);
        }
        async showConflicts(conflictToOpen) {
            if (!this.userDataSyncService.conflicts.length) {
                return;
            }
            this.enableConflictsViewContext.set(true);
            const view = await this.viewsService.openView(userDataSync_2.SYNC_CONFLICTS_VIEW_ID);
            if (view && conflictToOpen) {
                await view.open(conflictToOpen);
            }
        }
        async resetSyncedData() {
            const { confirmed } = await this.dialogService.confirm({
                type: 'info',
                message: (0, nls_1.localize)('reset', "This will clear your data in the cloud and stop sync on all your devices."),
                title: (0, nls_1.localize)('reset title', "Clear"),
                primaryButton: (0, nls_1.localize)({ key: 'resetButton', comment: ['&& denotes a mnemonic'] }, "&&Reset"),
            });
            if (confirmed) {
                await this.userDataSyncService.resetRemote();
            }
        }
        async getAllLogResources() {
            const logsFolders = [];
            const stat = await this.fileService.resolve(this.uriIdentityService.extUri.dirname(this.environmentService.logsHome));
            if (stat.children) {
                logsFolders.push(...stat.children
                    .filter(stat => stat.isDirectory && /^\d{8}T\d{6}$/.test(stat.name))
                    .sort()
                    .reverse()
                    .map(d => d.resource));
            }
            const result = [];
            for (const logFolder of logsFolders) {
                const folderStat = await this.fileService.resolve(logFolder);
                const childStat = folderStat.children?.find(stat => this.uriIdentityService.extUri.basename(stat.resource).startsWith(`${userDataSync_1.USER_DATA_SYNC_LOG_ID}.`));
                if (childStat) {
                    result.push(childStat.resource);
                }
            }
            return result;
        }
        async showSyncActivity() {
            this.activityViewsEnablementContext.set(true);
            await this.waitForActiveSyncViews();
            await this.viewsService.openViewContainer(userDataSync_2.SYNC_VIEW_CONTAINER_ID);
        }
        async downloadSyncActivity() {
            const result = await this.fileDialogService.showOpenDialog({
                title: (0, nls_1.localize)('download sync activity dialog title', "Select folder to download Settings Sync activity"),
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: (0, nls_1.localize)('download sync activity dialog open label', "Save"),
            });
            if (!result?.[0]) {
                return;
            }
            return this.progressService.withProgress({ location: 10 /* ProgressLocation.Window */ }, async () => {
                const machines = await this.userDataSyncMachinesService.getMachines();
                const currentMachine = machines.find(m => m.isCurrent);
                const name = (currentMachine ? currentMachine.name + ' - ' : '') + 'Settings Sync Activity';
                const stat = await this.fileService.resolve(result[0]);
                const nameRegEx = new RegExp(`${(0, strings_1.escapeRegExpCharacters)(name)}\\s(\\d+)`);
                const indexes = [];
                for (const child of stat.children ?? []) {
                    if (child.name === name) {
                        indexes.push(0);
                    }
                    else {
                        const matches = nameRegEx.exec(child.name);
                        if (matches) {
                            indexes.push(parseInt(matches[1]));
                        }
                    }
                }
                indexes.sort((a, b) => a - b);
                const folder = this.uriIdentityService.extUri.joinPath(result[0], indexes[0] !== 0 ? name : `${name} ${indexes[indexes.length - 1] + 1}`);
                await Promise.all([
                    this.userDataSyncService.saveRemoteActivityData(this.uriIdentityService.extUri.joinPath(folder, 'remoteActivity.json')),
                    (async () => {
                        const logResources = await this.getAllLogResources();
                        await Promise.all(logResources.map(async (logResource) => this.fileService.copy(logResource, this.uriIdentityService.extUri.joinPath(folder, 'logs', `${this.uriIdentityService.extUri.basename(this.uriIdentityService.extUri.dirname(logResource))}.log`))));
                    })(),
                    this.fileService.copy(this.environmentService.userDataSyncHome, this.uriIdentityService.extUri.joinPath(folder, 'localActivity')),
                ]);
                return folder;
            });
        }
        async waitForActiveSyncViews() {
            const viewContainer = this.viewDescriptorService.getViewContainerById(userDataSync_2.SYNC_VIEW_CONTAINER_ID);
            if (viewContainer) {
                const model = this.viewDescriptorService.getViewContainerModel(viewContainer);
                if (!model.activeViewDescriptors.length) {
                    await event_1.Event.toPromise(event_1.Event.filter(model.onDidChangeActiveViewDescriptors, e => model.activeViewDescriptors.length > 0));
                }
            }
        }
        async signIn() {
            const currentAuthenticationProviderId = this.currentAuthenticationProviderId;
            const authenticationProvider = currentAuthenticationProviderId ? this.authenticationProviders.find(p => p.id === currentAuthenticationProviderId) : undefined;
            if (authenticationProvider) {
                await this.doSignIn(authenticationProvider);
            }
            else {
                await this.pick();
            }
        }
        async pick() {
            const result = await this.doPick();
            if (!result) {
                return false;
            }
            await this.doSignIn(result);
            return true;
        }
        async doPick() {
            if (this.authenticationProviders.length === 0) {
                return undefined;
            }
            const authenticationProviders = [...this.authenticationProviders].sort(({ id }) => id === this.currentAuthenticationProviderId ? -1 : 1);
            const allAccounts = new Map();
            if (authenticationProviders.length === 1) {
                const accounts = await this.getAccounts(authenticationProviders[0].id, authenticationProviders[0].scopes);
                if (accounts.length) {
                    allAccounts.set(authenticationProviders[0].id, accounts);
                }
                else {
                    // Single auth provider and no accounts
                    return authenticationProviders[0];
                }
            }
            let result;
            const disposables = new lifecycle_1.DisposableStore();
            const quickPick = disposables.add(this.quickInputService.createQuickPick());
            const promise = new Promise(c => {
                disposables.add(quickPick.onDidHide(() => {
                    disposables.dispose();
                    c(result);
                }));
            });
            quickPick.title = userDataSync_2.SYNC_TITLE.value;
            quickPick.ok = false;
            quickPick.ignoreFocusOut = true;
            quickPick.placeholder = (0, nls_1.localize)('choose account placeholder', "Select an account to sign in");
            quickPick.show();
            if (authenticationProviders.length > 1) {
                quickPick.busy = true;
                for (const { id, scopes } of authenticationProviders) {
                    const accounts = await this.getAccounts(id, scopes);
                    if (accounts.length) {
                        allAccounts.set(id, accounts);
                    }
                }
                quickPick.busy = false;
            }
            quickPick.items = this.createQuickpickItems(authenticationProviders, allAccounts);
            disposables.add(quickPick.onDidAccept(() => {
                result = quickPick.selectedItems[0]?.account ? quickPick.selectedItems[0]?.account : quickPick.selectedItems[0]?.authenticationProvider;
                quickPick.hide();
            }));
            return promise;
        }
        async getAccounts(authenticationProviderId, scopes) {
            const accounts = new Map();
            let currentAccount = null;
            const sessions = await this.authenticationService.getSessions(authenticationProviderId, scopes) || [];
            for (const session of sessions) {
                const account = new UserDataSyncAccount(authenticationProviderId, session);
                accounts.set(account.accountId, account);
                if (account.sessionId === this.currentSessionId) {
                    currentAccount = account;
                }
            }
            if (currentAccount) {
                // Always use current account if available
                accounts.set(currentAccount.accountId, currentAccount);
            }
            return currentAccount ? [...accounts.values()] : [...accounts.values()].sort(({ sessionId }) => sessionId === this.currentSessionId ? -1 : 1);
        }
        createQuickpickItems(authenticationProviders, allAccounts) {
            const quickPickItems = [];
            // Signed in Accounts
            if (allAccounts.size) {
                quickPickItems.push({ type: 'separator', label: (0, nls_1.localize)('signed in', "Signed in") });
                for (const authenticationProvider of authenticationProviders) {
                    const accounts = (allAccounts.get(authenticationProvider.id) || []).sort(({ sessionId }) => sessionId === this.currentSessionId ? -1 : 1);
                    const providerName = this.authenticationService.getProvider(authenticationProvider.id).label;
                    for (const account of accounts) {
                        quickPickItems.push({
                            label: `${account.accountName} (${providerName})`,
                            description: account.sessionId === this.current?.sessionId ? (0, nls_1.localize)('last used', "Last Used with Sync") : undefined,
                            account,
                            authenticationProvider,
                        });
                    }
                }
                quickPickItems.push({ type: 'separator', label: (0, nls_1.localize)('others', "Others") });
            }
            // Account Providers
            for (const authenticationProvider of authenticationProviders) {
                const provider = this.authenticationService.getProvider(authenticationProvider.id);
                if (!allAccounts.has(authenticationProvider.id) || provider.supportsMultipleAccounts) {
                    const providerName = provider.label;
                    quickPickItems.push({ label: (0, nls_1.localize)('sign in using account', "Sign in with {0}", providerName), authenticationProvider });
                }
            }
            return quickPickItems;
        }
        async doSignIn(accountOrAuthProvider) {
            let sessionId;
            if ((0, userDataSync_1.isAuthenticationProvider)(accountOrAuthProvider)) {
                if (this.environmentService.options?.settingsSyncOptions?.authenticationProvider?.id === accountOrAuthProvider.id) {
                    sessionId = await this.environmentService.options?.settingsSyncOptions?.authenticationProvider?.signIn();
                }
                else {
                    sessionId = (await this.authenticationService.createSession(accountOrAuthProvider.id, accountOrAuthProvider.scopes)).id;
                }
                this.currentAuthenticationProviderId = accountOrAuthProvider.id;
            }
            else {
                if (this.environmentService.options?.settingsSyncOptions?.authenticationProvider?.id === accountOrAuthProvider.authenticationProviderId) {
                    sessionId = await this.environmentService.options?.settingsSyncOptions?.authenticationProvider?.signIn();
                }
                else {
                    sessionId = accountOrAuthProvider.sessionId;
                }
                this.currentAuthenticationProviderId = accountOrAuthProvider.authenticationProviderId;
            }
            this.currentSessionId = sessionId;
            await this.update();
        }
        async onDidAuthFailure() {
            this.telemetryService.publicLog2('sync/successiveAuthFailures');
            this.currentSessionId = undefined;
            await this.update('auth failure');
        }
        onDidChangeSessions(e) {
            if (this.currentSessionId && e.removed?.find(session => session.id === this.currentSessionId)) {
                this.currentSessionId = undefined;
            }
            this.update('change in sessions');
        }
        onDidChangeStorage() {
            if (this.currentSessionId !== this.getStoredCachedSessionId() /* This checks if current window changed the value or not */) {
                this._cachedCurrentSessionId = null;
                this.update('change in storage');
            }
        }
        get currentAuthenticationProviderId() {
            if (this._cachedCurrentAuthenticationProviderId === null) {
                this._cachedCurrentAuthenticationProviderId = this.storageService.get(UserDataSyncWorkbenchService_1.CACHED_AUTHENTICATION_PROVIDER_KEY, -1 /* StorageScope.APPLICATION */);
            }
            return this._cachedCurrentAuthenticationProviderId;
        }
        set currentAuthenticationProviderId(currentAuthenticationProviderId) {
            if (this._cachedCurrentAuthenticationProviderId !== currentAuthenticationProviderId) {
                this._cachedCurrentAuthenticationProviderId = currentAuthenticationProviderId;
                if (currentAuthenticationProviderId === undefined) {
                    this.storageService.remove(UserDataSyncWorkbenchService_1.CACHED_AUTHENTICATION_PROVIDER_KEY, -1 /* StorageScope.APPLICATION */);
                }
                else {
                    this.storageService.store(UserDataSyncWorkbenchService_1.CACHED_AUTHENTICATION_PROVIDER_KEY, currentAuthenticationProviderId, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                }
            }
        }
        get currentSessionId() {
            if (this._cachedCurrentSessionId === null) {
                this._cachedCurrentSessionId = this.getStoredCachedSessionId();
            }
            return this._cachedCurrentSessionId;
        }
        set currentSessionId(cachedSessionId) {
            if (this._cachedCurrentSessionId !== cachedSessionId) {
                this._cachedCurrentSessionId = cachedSessionId;
                if (cachedSessionId === undefined) {
                    this.logService.info('Settings Sync: Reset current session');
                    this.storageService.remove(UserDataSyncWorkbenchService_1.CACHED_SESSION_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
                }
                else {
                    this.logService.info('Settings Sync: Updated current session', cachedSessionId);
                    this.storageService.store(UserDataSyncWorkbenchService_1.CACHED_SESSION_STORAGE_KEY, cachedSessionId, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                }
            }
        }
        getStoredCachedSessionId() {
            return this.storageService.get(UserDataSyncWorkbenchService_1.CACHED_SESSION_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
        }
        get useWorkbenchSessionId() {
            return !this.storageService.getBoolean(UserDataSyncWorkbenchService_1.DONOT_USE_WORKBENCH_SESSION_STORAGE_KEY, -1 /* StorageScope.APPLICATION */, false);
        }
        set useWorkbenchSessionId(useWorkbenchSession) {
            this.storageService.store(UserDataSyncWorkbenchService_1.DONOT_USE_WORKBENCH_SESSION_STORAGE_KEY, !useWorkbenchSession, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
    };
    exports.UserDataSyncWorkbenchService = UserDataSyncWorkbenchService;
    exports.UserDataSyncWorkbenchService = UserDataSyncWorkbenchService = UserDataSyncWorkbenchService_1 = __decorate([
        __param(0, userDataSync_1.IUserDataSyncService),
        __param(1, uriIdentity_1.IUriIdentityService),
        __param(2, authentication_1.IAuthenticationService),
        __param(3, userDataSyncAccount_1.IUserDataSyncAccountService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, storage_1.IStorageService),
        __param(6, userDataSync_1.IUserDataSyncEnablementService),
        __param(7, userDataSync_1.IUserDataAutoSyncService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, log_1.ILogService),
        __param(10, productService_1.IProductService),
        __param(11, extensions_2.IExtensionService),
        __param(12, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(13, secrets_1.ISecretStorageService),
        __param(14, notification_1.INotificationService),
        __param(15, progress_1.IProgressService),
        __param(16, dialogs_1.IDialogService),
        __param(17, contextkey_1.IContextKeyService),
        __param(18, viewsService_1.IViewsService),
        __param(19, views_1.IViewDescriptorService),
        __param(20, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(21, lifecycle_2.ILifecycleService),
        __param(22, instantiation_1.IInstantiationService),
        __param(23, editorService_1.IEditorService),
        __param(24, userDataInit_1.IUserDataInitializationService),
        __param(25, files_1.IFileService),
        __param(26, dialogs_1.IFileDialogService),
        __param(27, userDataSyncMachines_1.IUserDataSyncMachinesService)
    ], UserDataSyncWorkbenchService);
    (0, extensions_1.registerSingleton)(userDataSync_2.IUserDataSyncWorkbenchService, UserDataSyncWorkbenchService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jV29ya2JlbmNoU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJEYXRhU3luYy9icm93c2VyL3VzZXJEYXRhU3luY1dvcmtiZW5jaFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXVEaEcsZ0RBR0M7SUFkRCxNQUFNLG1CQUFtQjtRQUV4QixZQUFxQix3QkFBZ0MsRUFBbUIsT0FBOEI7WUFBakYsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUFRO1lBQW1CLFlBQU8sR0FBUCxPQUFPLENBQXVCO1FBQUksQ0FBQztRQUUzRyxJQUFJLFNBQVMsS0FBYSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNuRCxJQUFJLFdBQVcsS0FBYSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDaEUsSUFBSSxTQUFTLEtBQWEsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNELElBQUksS0FBSyxLQUFhLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0tBQ2hGO0lBR0QsU0FBZ0Isa0JBQWtCLENBQUMsTUFBZTtRQUNqRCxNQUFNLFNBQVMsR0FBRyxNQUEwQixDQUFDO1FBQzdDLE9BQU8sU0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksU0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLFNBQUcsQ0FBQyxLQUFL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