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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/editSessions/common/editSessions", "vs/platform/dialogs/common/dialogs", "vs/base/common/uuid", "vs/workbench/services/authentication/browser/authenticationService", "vs/base/common/platform", "vs/platform/userDataSync/common/userDataSyncMachines", "vs/base/common/event", "vs/base/common/errors", "vs/platform/secrets/common/secrets"], function (require, exports, lifecycle_1, nls_1, actions_1, contextkey_1, environment_1, files_1, productService_1, quickInput_1, storage_1, userDataSync_1, authentication_1, extensions_1, editSessions_1, dialogs_1, uuid_1, authenticationService_1, platform_1, userDataSyncMachines_1, event_1, errors_1, secrets_1) {
    "use strict";
    var EditSessionsWorkbenchService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditSessionsWorkbenchService = void 0;
    let EditSessionsWorkbenchService = class EditSessionsWorkbenchService extends lifecycle_1.Disposable {
        static { EditSessionsWorkbenchService_1 = this; }
        static { this.CACHED_SESSION_STORAGE_KEY = 'editSessionAccountPreference'; }
        get isSignedIn() {
            return this.existingSessionId !== undefined;
        }
        get onDidSignIn() {
            return this._didSignIn.event;
        }
        get onDidSignOut() {
            return this._didSignOut.event;
        }
        get lastWrittenResources() {
            return this._lastWrittenResources;
        }
        get lastReadResources() {
            return this._lastReadResources;
        }
        constructor(fileService, storageService, quickInputService, authenticationService, extensionService, environmentService, logService, productService, contextKeyService, dialogService, secretStorageService) {
            super();
            this.fileService = fileService;
            this.storageService = storageService;
            this.quickInputService = quickInputService;
            this.authenticationService = authenticationService;
            this.extensionService = extensionService;
            this.environmentService = environmentService;
            this.logService = logService;
            this.productService = productService;
            this.contextKeyService = contextKeyService;
            this.dialogService = dialogService;
            this.secretStorageService = secretStorageService;
            this.SIZE_LIMIT = Math.floor(1024 * 1024 * 1.9); // 2 MB
            this.serverConfiguration = this.productService['editSessions.store'];
            this.initialized = false;
            this._didSignIn = new event_1.Emitter();
            this._didSignOut = new event_1.Emitter();
            this._lastWrittenResources = new Map();
            this._lastReadResources = new Map();
            // If the user signs out of the current session, reset our cached auth state in memory and on disk
            this._register(this.authenticationService.onDidChangeSessions((e) => this.onDidChangeSessions(e.event)));
            // If another window changes the preferred session storage, reset our cached auth state in memory
            this._register(this.storageService.onDidChangeValue(-1 /* StorageScope.APPLICATION */, EditSessionsWorkbenchService_1.CACHED_SESSION_STORAGE_KEY, this._register(new lifecycle_1.DisposableStore()))(() => this.onDidChangeStorage()));
            this.registerSignInAction();
            this.registerResetAuthenticationAction();
            this.signedInContext = editSessions_1.EDIT_SESSIONS_SIGNED_IN.bindTo(this.contextKeyService);
            this.signedInContext.set(this.existingSessionId !== undefined);
        }
        /**
         * @param resource: The resource to retrieve content for.
         * @param content An object representing resource state to be restored.
         * @returns The ref of the stored state.
         */
        async write(resource, content) {
            await this.initialize('write', false);
            if (!this.initialized) {
                throw new Error('Please sign in to store your edit session.');
            }
            if (typeof content !== 'string' && content.machine === undefined) {
                content.machine = await this.getOrCreateCurrentMachineId();
            }
            content = typeof content === 'string' ? content : JSON.stringify(content);
            const ref = await this.storeClient.writeResource(resource, content, null, undefined, (0, userDataSync_1.createSyncHeaders)((0, uuid_1.generateUuid)()));
            this._lastWrittenResources.set(resource, { ref, content });
            return ref;
        }
        /**
         * @param resource: The resource to retrieve content for.
         * @param ref: A specific content ref to retrieve content for, if it exists.
         * If undefined, this method will return the latest saved edit session, if any.
         *
         * @returns An object representing the requested or latest state, if any.
         */
        async read(resource, ref) {
            await this.initialize('read', false);
            if (!this.initialized) {
                throw new Error('Please sign in to apply your latest edit session.');
            }
            let content;
            const headers = (0, userDataSync_1.createSyncHeaders)((0, uuid_1.generateUuid)());
            try {
                if (ref !== undefined) {
                    content = await this.storeClient?.resolveResourceContent(resource, ref, undefined, headers);
                }
                else {
                    const result = await this.storeClient?.readResource(resource, null, undefined, headers);
                    content = result?.content;
                    ref = result?.ref;
                }
            }
            catch (ex) {
                this.logService.error(ex);
            }
            // TODO@joyceerhl Validate session data, check schema version
            if (content !== undefined && content !== null && ref !== undefined) {
                this._lastReadResources.set(resource, { ref, content });
                return { ref, content };
            }
            return undefined;
        }
        async delete(resource, ref) {
            await this.initialize('write', false);
            if (!this.initialized) {
                throw new Error(`Unable to delete edit session with ref ${ref}.`);
            }
            try {
                await this.storeClient?.deleteResource(resource, ref);
            }
            catch (ex) {
                this.logService.error(ex);
            }
        }
        async list(resource) {
            await this.initialize('read', false);
            if (!this.initialized) {
                throw new Error(`Unable to list edit sessions.`);
            }
            try {
                return this.storeClient?.getAllResourceRefs(resource) ?? [];
            }
            catch (ex) {
                this.logService.error(ex);
            }
            return [];
        }
        async initialize(reason, silent = false) {
            if (this.initialized) {
                return true;
            }
            this.initialized = await this.doInitialize(reason, silent);
            this.signedInContext.set(this.initialized);
            if (this.initialized) {
                this._didSignIn.fire();
            }
            return this.initialized;
        }
        /**
         *
         * Ensures that the store client is initialized,
         * meaning that authentication is configured and it
         * can be used to communicate with the remote storage service
         */
        async doInitialize(reason, silent) {
            // Wait for authentication extensions to be registered
            await this.extensionService.whenInstalledExtensionsRegistered();
            if (!this.serverConfiguration?.url) {
                throw new Error('Unable to initialize sessions sync as session sync preference is not configured in product.json.');
            }
            if (this.storeClient === undefined) {
                return false;
            }
            this._register(this.storeClient.onTokenFailed(() => {
                this.logService.info('Clearing edit sessions authentication preference because of successive token failures.');
                this.clearAuthenticationPreference();
            }));
            if (this.machineClient === undefined) {
                this.machineClient = new userDataSyncMachines_1.UserDataSyncMachinesService(this.environmentService, this.fileService, this.storageService, this.storeClient, this.logService, this.productService);
            }
            // If we already have an existing auth session in memory, use that
            if (this.authenticationInfo !== undefined) {
                return true;
            }
            const authenticationSession = await this.getAuthenticationSession(reason, silent);
            if (authenticationSession !== undefined) {
                this.authenticationInfo = authenticationSession;
                this.storeClient.setAuthToken(authenticationSession.token, authenticationSession.providerId);
            }
            return authenticationSession !== undefined;
        }
        async getMachineById(machineId) {
            await this.initialize('read', false);
            if (!this.cachedMachines) {
                const machines = await this.machineClient.getMachines();
                this.cachedMachines = machines.reduce((map, machine) => map.set(machine.id, machine.name), new Map());
            }
            return this.cachedMachines.get(machineId);
        }
        async getOrCreateCurrentMachineId() {
            const currentMachineId = await this.machineClient.getMachines().then((machines) => machines.find((m) => m.isCurrent)?.id);
            if (currentMachineId === undefined) {
                await this.machineClient.addCurrentMachine();
                return await this.machineClient.getMachines().then((machines) => machines.find((m) => m.isCurrent).id);
            }
            return currentMachineId;
        }
        async getAuthenticationSession(reason, silent) {
            // If the user signed in previously and the session is still available, reuse that without prompting the user again
            if (this.existingSessionId) {
                this.logService.info(`Searching for existing authentication session with ID ${this.existingSessionId}`);
                const existingSession = await this.getExistingSession();
                if (existingSession) {
                    this.logService.info(`Found existing authentication session with ID ${existingSession.session.id}`);
                    return { sessionId: existingSession.session.id, token: existingSession.session.idToken ?? existingSession.session.accessToken, providerId: existingSession.session.providerId };
                }
                else {
                    this._didSignOut.fire();
                }
            }
            // If settings sync is already enabled, avoid asking again to authenticate
            if (this.shouldAttemptEditSessionInit()) {
                this.logService.info(`Reusing user data sync enablement`);
                const authenticationSessionInfo = await (0, authenticationService_1.getCurrentAuthenticationSessionInfo)(this.secretStorageService, this.productService);
                if (authenticationSessionInfo !== undefined) {
                    this.logService.info(`Using current authentication session with ID ${authenticationSessionInfo.id}`);
                    this.existingSessionId = authenticationSessionInfo.id;
                    return { sessionId: authenticationSessionInfo.id, token: authenticationSessionInfo.accessToken, providerId: authenticationSessionInfo.providerId };
                }
            }
            // If we aren't supposed to prompt the user because
            // we're in a silent flow, just return here
            if (silent) {
                return;
            }
            // Ask the user to pick a preferred account
            const authenticationSession = await this.getAccountPreference(reason);
            if (authenticationSession !== undefined) {
                this.existingSessionId = authenticationSession.id;
                return { sessionId: authenticationSession.id, token: authenticationSession.idToken ?? authenticationSession.accessToken, providerId: authenticationSession.providerId };
            }
            return undefined;
        }
        shouldAttemptEditSessionInit() {
            return platform_1.isWeb && this.storageService.isNew(-1 /* StorageScope.APPLICATION */) && this.storageService.isNew(1 /* StorageScope.WORKSPACE */);
        }
        /**
         *
         * Prompts the user to pick an authentication option for storing and getting edit sessions.
         */
        async getAccountPreference(reason) {
            const quickpick = this.quickInputService.createQuickPick();
            quickpick.ok = false;
            quickpick.placeholder = reason === 'read' ? (0, nls_1.localize)('choose account read placeholder', "Select an account to restore your working changes from the cloud") : (0, nls_1.localize)('choose account placeholder', "Select an account to store your working changes in the cloud");
            quickpick.ignoreFocusOut = true;
            quickpick.items = await this.createQuickpickItems();
            return new Promise((resolve, reject) => {
                quickpick.onDidHide((e) => {
                    reject(new errors_1.CancellationError());
                    quickpick.dispose();
                });
                quickpick.onDidAccept(async (e) => {
                    const selection = quickpick.selectedItems[0];
                    const session = 'provider' in selection ? { ...await this.authenticationService.createSession(selection.provider.id, selection.provider.scopes), providerId: selection.provider.id } : ('session' in selection ? selection.session : undefined);
                    resolve(session);
                    quickpick.hide();
                });
                quickpick.show();
            });
        }
        async createQuickpickItems() {
            const options = [];
            options.push({ type: 'separator', label: (0, nls_1.localize)('signed in', "Signed In") });
            const sessions = await this.getAllSessions();
            options.push(...sessions);
            options.push({ type: 'separator', label: (0, nls_1.localize)('others', "Others") });
            for (const authenticationProvider of (await this.getAuthenticationProviders())) {
                const signedInForProvider = sessions.some(account => account.session.providerId === authenticationProvider.id);
                if (!signedInForProvider || this.authenticationService.getProvider(authenticationProvider.id).supportsMultipleAccounts) {
                    const providerName = this.authenticationService.getProvider(authenticationProvider.id).label;
                    options.push({ label: (0, nls_1.localize)('sign in using account', "Sign in with {0}", providerName), provider: authenticationProvider });
                }
            }
            return options;
        }
        /**
         *
         * Returns all authentication sessions available from {@link getAuthenticationProviders}.
         */
        async getAllSessions() {
            const authenticationProviders = await this.getAuthenticationProviders();
            const accounts = new Map();
            let currentSession;
            for (const provider of authenticationProviders) {
                const sessions = await this.authenticationService.getSessions(provider.id, provider.scopes);
                for (const session of sessions) {
                    const item = {
                        label: session.account.label,
                        description: this.authenticationService.getProvider(provider.id).label,
                        session: { ...session, providerId: provider.id }
                    };
                    accounts.set(item.session.account.id, item);
                    if (this.existingSessionId === session.id) {
                        currentSession = item;
                    }
                }
            }
            if (currentSession !== undefined) {
                accounts.set(currentSession.session.account.id, currentSession);
            }
            return [...accounts.values()].sort((a, b) => a.label.localeCompare(b.label));
        }
        /**
         *
         * Returns all authentication providers which can be used to authenticate
         * to the remote storage service, based on product.json configuration
         * and registered authentication providers.
         */
        async getAuthenticationProviders() {
            if (!this.serverConfiguration) {
                throw new Error('Unable to get configured authentication providers as session sync preference is not configured in product.json.');
            }
            // Get the list of authentication providers configured in product.json
            const authenticationProviders = this.serverConfiguration.authenticationProviders;
            const configuredAuthenticationProviders = Object.keys(authenticationProviders).reduce((result, id) => {
                result.push({ id, scopes: authenticationProviders[id].scopes });
                return result;
            }, []);
            // Filter out anything that isn't currently available through the authenticationService
            const availableAuthenticationProviders = this.authenticationService.declaredProviders;
            return configuredAuthenticationProviders.filter(({ id }) => availableAuthenticationProviders.some(provider => provider.id === id));
        }
        get existingSessionId() {
            return this.storageService.get(EditSessionsWorkbenchService_1.CACHED_SESSION_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
        }
        set existingSessionId(sessionId) {
            this.logService.trace(`Saving authentication session preference for ID ${sessionId}.`);
            if (sessionId === undefined) {
                this.storageService.remove(EditSessionsWorkbenchService_1.CACHED_SESSION_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
            }
            else {
                this.storageService.store(EditSessionsWorkbenchService_1.CACHED_SESSION_STORAGE_KEY, sessionId, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
        }
        async getExistingSession() {
            const accounts = await this.getAllSessions();
            return accounts.find((account) => account.session.id === this.existingSessionId);
        }
        async onDidChangeStorage() {
            const newSessionId = this.existingSessionId;
            const previousSessionId = this.authenticationInfo?.sessionId;
            if (previousSessionId !== newSessionId) {
                this.logService.trace(`Resetting authentication state because authentication session ID preference changed from ${previousSessionId} to ${newSessionId}.`);
                this.authenticationInfo = undefined;
                this.initialized = false;
            }
        }
        clearAuthenticationPreference() {
            this.authenticationInfo = undefined;
            this.initialized = false;
            this.existingSessionId = undefined;
            this.signedInContext.set(false);
        }
        onDidChangeSessions(e) {
            if (this.authenticationInfo?.sessionId && e.removed?.find(session => session.id === this.authenticationInfo?.sessionId)) {
                this.clearAuthenticationPreference();
            }
        }
        registerSignInAction() {
            const that = this;
            const id = 'workbench.editSessions.actions.signIn';
            const when = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(editSessions_1.EDIT_SESSIONS_PENDING_KEY, false), contextkey_1.ContextKeyExpr.equals(editSessions_1.EDIT_SESSIONS_SIGNED_IN_KEY, false));
            this._register((0, actions_1.registerAction2)(class ResetEditSessionAuthenticationAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id,
                        title: (0, nls_1.localize)('sign in', 'Turn on Cloud Changes...'),
                        category: editSessions_1.EDIT_SESSION_SYNC_CATEGORY,
                        precondition: when,
                        menu: [{
                                id: actions_1.MenuId.CommandPalette,
                            },
                            {
                                id: actions_1.MenuId.AccountsContext,
                                group: '2_editSessions',
                                when,
                            }]
                    });
                }
                async run() {
                    return await that.initialize('write', false);
                }
            }));
            this._register(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                group: '2_editSessions',
                command: {
                    id,
                    title: (0, nls_1.localize)('sign in badge', 'Turn on Cloud Changes... (1)'),
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(editSessions_1.EDIT_SESSIONS_PENDING_KEY, true), contextkey_1.ContextKeyExpr.equals(editSessions_1.EDIT_SESSIONS_SIGNED_IN_KEY, false))
            }));
        }
        registerResetAuthenticationAction() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class ResetEditSessionAuthenticationAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.resetAuth',
                        title: (0, nls_1.localize)('reset auth.v3', 'Turn off Cloud Changes...'),
                        category: editSessions_1.EDIT_SESSION_SYNC_CATEGORY,
                        precondition: contextkey_1.ContextKeyExpr.equals(editSessions_1.EDIT_SESSIONS_SIGNED_IN_KEY, true),
                        menu: [{
                                id: actions_1.MenuId.CommandPalette,
                            },
                            {
                                id: actions_1.MenuId.AccountsContext,
                                group: '2_editSessions',
                                when: contextkey_1.ContextKeyExpr.equals(editSessions_1.EDIT_SESSIONS_SIGNED_IN_KEY, true),
                            }]
                    });
                }
                async run() {
                    const result = await that.dialogService.confirm({
                        message: (0, nls_1.localize)('sign out of cloud changes clear data prompt', 'Do you want to disable storing working changes in the cloud?'),
                        checkbox: { label: (0, nls_1.localize)('delete all cloud changes', 'Delete all stored data from the cloud.') }
                    });
                    if (result.confirmed) {
                        if (result.checkboxChecked) {
                            that.storeClient?.deleteResource('editSessions', null);
                        }
                        that.clearAuthenticationPreference();
                    }
                }
            }));
        }
    };
    exports.EditSessionsWorkbenchService = EditSessionsWorkbenchService;
    exports.EditSessionsWorkbenchService = EditSessionsWorkbenchService = EditSessionsWorkbenchService_1 = __decorate([
        __param(0, files_1.IFileService),
        __param(1, storage_1.IStorageService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, authentication_1.IAuthenticationService),
        __param(4, extensions_1.IExtensionService),
        __param(5, environment_1.IEnvironmentService),
        __param(6, editSessions_1.IEditSessionsLogService),
        __param(7, productService_1.IProductService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, dialogs_1.IDialogService),
        __param(10, secrets_1.ISecretStorageService)
    ], EditSessionsWorkbenchService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFNlc3Npb25zU3RvcmFnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2VkaXRTZXNzaW9ucy9icm93c2VyL2VkaXRTZXNzaW9uc1N0b3JhZ2VTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE0QnpGLElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTZCLFNBQVEsc0JBQVU7O2lCQVU1QywrQkFBMEIsR0FBRyw4QkFBOEIsQUFBakMsQ0FBa0M7UUFLM0UsSUFBSSxVQUFVO1lBQ2IsT0FBTyxJQUFJLENBQUMsaUJBQWlCLEtBQUssU0FBUyxDQUFDO1FBQzdDLENBQUM7UUFHRCxJQUFJLFdBQVc7WUFDZCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1FBQzlCLENBQUM7UUFHRCxJQUFJLFlBQVk7WUFDZixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO1FBQy9CLENBQUM7UUFHRCxJQUFJLG9CQUFvQjtZQUN2QixPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQztRQUNuQyxDQUFDO1FBR0QsSUFBSSxpQkFBaUI7WUFDcEIsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUM7UUFDaEMsQ0FBQztRQUlELFlBQ2UsV0FBMEMsRUFDdkMsY0FBZ0QsRUFDN0MsaUJBQXNELEVBQ2xELHFCQUE4RCxFQUNuRSxnQkFBb0QsRUFDbEQsa0JBQXdELEVBQ3BELFVBQW9ELEVBQzVELGNBQWdELEVBQzdDLGlCQUFzRCxFQUMxRCxhQUE4QyxFQUN2QyxvQkFBNEQ7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFadUIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDdEIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQzVCLHNCQUFp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