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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/extensions", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/workbench/services/activity/common/activity", "vs/workbench/services/authentication/browser/authenticationAccessService", "vs/workbench/services/authentication/browser/authenticationUsageService", "vs/workbench/services/authentication/common/authentication"], function (require, exports, lifecycle_1, nls, actions_1, commands_1, dialogs_1, extensions_1, notification_1, quickInput_1, storage_1, activity_1, authenticationAccessService_1, authenticationUsageService_1, authentication_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthenticationExtensionsService = void 0;
    // OAuth2 spec prohibits space in a scope, so use that to join them.
    const SCOPESLIST_SEPARATOR = ' ';
    // TODO@TylerLeonhardt: This should all go in MainThreadAuthentication
    let AuthenticationExtensionsService = class AuthenticationExtensionsService extends lifecycle_1.Disposable {
        constructor(activityService, storageService, dialogService, quickInputService, _authenticationService, _authenticationUsageService, _authenticationAccessService) {
            super();
            this.activityService = activityService;
            this.storageService = storageService;
            this.dialogService = dialogService;
            this.quickInputService = quickInputService;
            this._authenticationService = _authenticationService;
            this._authenticationUsageService = _authenticationUsageService;
            this._authenticationAccessService = _authenticationAccessService;
            this._signInRequestItems = new Map();
            this._sessionAccessRequestItems = new Map();
            this._accountBadgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.registerListeners();
        }
        registerListeners() {
            this._register(this._authenticationService.onDidChangeSessions(async (e) => {
                if (e.event.added?.length) {
                    await this.updateNewSessionRequests(e.providerId, e.event.added);
                }
                if (e.event.removed?.length) {
                    await this.updateAccessRequests(e.providerId, e.event.removed);
                }
                this.updateBadgeCount();
            }));
            this._register(this._authenticationService.onDidUnregisterAuthenticationProvider(e => {
                const accessRequests = this._sessionAccessRequestItems.get(e.id) || {};
                Object.keys(accessRequests).forEach(extensionId => {
                    this.removeAccessRequest(e.id, extensionId);
                });
            }));
        }
        async updateNewSessionRequests(providerId, addedSessions) {
            const existingRequestsForProvider = this._signInRequestItems.get(providerId);
            if (!existingRequestsForProvider) {
                return;
            }
            Object.keys(existingRequestsForProvider).forEach(requestedScopes => {
                if (addedSessions.some(session => session.scopes.slice().join(SCOPESLIST_SEPARATOR) === requestedScopes)) {
                    const sessionRequest = existingRequestsForProvider[requestedScopes];
                    sessionRequest?.disposables.forEach(item => item.dispose());
                    delete existingRequestsForProvider[requestedScopes];
                    if (Object.keys(existingRequestsForProvider).length === 0) {
                        this._signInRequestItems.delete(providerId);
                    }
                    else {
                        this._signInRequestItems.set(providerId, existingRequestsForProvider);
                    }
                }
            });
        }
        async updateAccessRequests(providerId, removedSessions) {
            const providerRequests = this._sessionAccessRequestItems.get(providerId);
            if (providerRequests) {
                Object.keys(providerRequests).forEach(extensionId => {
                    removedSessions.forEach(removed => {
                        const indexOfSession = providerRequests[extensionId].possibleSessions.findIndex(session => session.id === removed.id);
                        if (indexOfSession) {
                            providerRequests[extensionId].possibleSessions.splice(indexOfSession, 1);
                        }
                    });
                    if (!providerRequests[extensionId].possibleSessions.length) {
                        this.removeAccessRequest(providerId, extensionId);
                    }
                });
            }
        }
        updateBadgeCount() {
            this._accountBadgeDisposable.clear();
            let numberOfRequests = 0;
            this._signInRequestItems.forEach(providerRequests => {
                Object.keys(providerRequests).forEach(request => {
                    numberOfRequests += providerRequests[request].requestingExtensionIds.length;
                });
            });
            this._sessionAccessRequestItems.forEach(accessRequest => {
                numberOfRequests += Object.keys(accessRequest).length;
            });
            if (numberOfRequests > 0) {
                const badge = new activity_1.NumberBadge(numberOfRequests, () => nls.localize('sign in', "Sign in requested"));
                this._accountBadgeDisposable.value = this.activityService.showAccountsActivity({ badge });
            }
        }
        removeAccessRequest(providerId, extensionId) {
            const providerRequests = this._sessionAccessRequestItems.get(providerId) || {};
            if (providerRequests[extensionId]) {
                (0, lifecycle_1.dispose)(providerRequests[extensionId].disposables);
                delete providerRequests[extensionId];
                this.updateBadgeCount();
            }
        }
        //#region Session Preference
        updateSessionPreference(providerId, extensionId, session) {
            // The 3 parts of this key are important:
            // * Extension id: The extension that has a preference
            // * Provider id: The provider that the preference is for
            // * The scopes: The subset of sessions that the preference applies to
            const key = `${extensionId}-${providerId}-${session.scopes.join(' ')}`;
            // Store the preference in the workspace and application storage. This allows new workspaces to
            // have a preference set already to limit the number of prompts that are shown... but also allows
            // a specific workspace to override the global preference.
            this.storageService.store(key, session.id, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            this.storageService.store(key, session.id, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
        getSessionPreference(providerId, extensionId, scopes) {
            // The 3 parts of this key are important:
            // * Extension id: The extension that has a preference
            // * Provider id: The provider that the preference is for
            // * The scopes: The subset of sessions that the preference applies to
            const key = `${extensionId}-${providerId}-${scopes.join(' ')}`;
            // If a preference is set in the workspace, use that. Otherwise, use the global preference.
            return this.storageService.get(key, 1 /* StorageScope.WORKSPACE */) ?? this.storageService.get(key, -1 /* StorageScope.APPLICATION */);
        }
        removeSessionPreference(providerId, extensionId, scopes) {
            // The 3 parts of this key are important:
            // * Extension id: The extension that has a preference
            // * Provider id: The provider that the preference is for
            // * The scopes: The subset of sessions that the preference applies to
            const key = `${extensionId}-${providerId}-${scopes.join(' ')}`;
            // This won't affect any other workspaces that have a preference set, but it will remove the preference
            // for this workspace and the global preference. This is only paired with a call to updateSessionPreference...
            // so we really don't _need_ to remove them as they are about to be overridden anyway... but it's more correct
            // to remove them first... and in case this gets called from somewhere else in the future.
            this.storageService.remove(key, 1 /* StorageScope.WORKSPACE */);
            this.storageService.remove(key, -1 /* StorageScope.APPLICATION */);
        }
        //#endregion
        async showGetSessionPrompt(provider, accountName, extensionId, extensionName) {
            let SessionPromptChoice;
            (function (SessionPromptChoice) {
                SessionPromptChoice[SessionPromptChoice["Allow"] = 0] = "Allow";
                SessionPromptChoice[SessionPromptChoice["Deny"] = 1] = "Deny";
                SessionPromptChoice[SessionPromptChoice["Cancel"] = 2] = "Cancel";
            })(SessionPromptChoice || (SessionPromptChoice = {}));
            const { result } = await this.dialogService.prompt({
                type: notification_1.Severity.Info,
                message: nls.localize('confirmAuthenticationAccess', "The extension '{0}' wants to access the {1} account '{2}'.", extensionName, provider.label, accountName),
                buttons: [
                    {
                        label: nls.localize({ key: 'allow', comment: ['&& denotes a mnemonic'] }, "&&Allow"),
                        run: () => SessionPromptChoice.Allow
                    },
                    {
                        label: nls.localize({ key: 'deny', comment: ['&& denotes a mnemonic'] }, "&&Deny"),
                        run: () => SessionPromptChoice.Deny
                    }
                ],
                cancelButton: {
                    run: () => SessionPromptChoice.Cancel
                }
            });
            if (result !== SessionPromptChoice.Cancel) {
                this._authenticationAccessService.updateAllowedExtensions(provider.id, accountName, [{ id: extensionId, name: extensionName, allowed: result === SessionPromptChoice.Allow }]);
                this.removeAccessRequest(provider.id, extensionId);
            }
            return result === SessionPromptChoice.Allow;
        }
        async selectSession(providerId, extensionId, extensionName, scopes, availableSessions) {
            return new Promise((resolve, reject) => {
                // This function should be used only when there are sessions to disambiguate.
                if (!availableSessions.length) {
                    reject('No available sessions');
                    return;
                }
                const quickPick = this.quickInputService.createQuickPick();
                quickPick.ignoreFocusOut = true;
                const items = availableSessions.map(session => {
                    return {
                        label: session.account.label,
                        session: session
                    };
                });
                items.push({
                    label: nls.localize('useOtherAccount', "Sign in to another account")
                });
                quickPick.items = items;
                quickPick.title = nls.localize({
                    key: 'selectAccount',
                    comment: ['The placeholder {0} is the name of an extension. {1} is the name of the type of account, such as Microsoft or GitHub.']
                }, "The extension '{0}' wants to access a {1} account", extensionName, this._authenticationService.getProvider(providerId).label);
                quickPick.placeholder = nls.localize('getSessionPlateholder', "Select an account for '{0}' to use or Esc to cancel", extensionName);
                quickPick.onDidAccept(async (_) => {
                    const session = quickPick.selectedItems[0].session ?? await this._authenticationService.createSession(providerId, scopes);
                    const accountName = session.account.label;
                    this._authenticationAccessService.updateAllowedExtensions(providerId, accountName, [{ id: extensionId, name: extensionName, allowed: true }]);
                    this.updateSessionPreference(providerId, extensionId, session);
                    this.removeAccessRequest(providerId, extensionId);
                    quickPick.dispose();
                    resolve(session);
                });
                quickPick.onDidHide(_ => {
                    if (!quickPick.selectedItems[0]) {
                        reject('User did not consent to account access');
                    }
                    quickPick.dispose();
                });
                quickPick.show();
            });
        }
        async completeSessionAccessRequest(provider, extensionId, extensionName, scopes) {
            const providerRequests = this._sessionAccessRequestItems.get(provider.id) || {};
            const existingRequest = providerRequests[extensionId];
            if (!existingRequest) {
                return;
            }
            if (!provider) {
                return;
            }
            const possibleSessions = existingRequest.possibleSessions;
            let session;
            if (provider.supportsMultipleAccounts) {
                try {
                    session = await this.selectSession(provider.id, extensionId, extensionName, scopes, possibleSessions);
                }
                catch (_) {
                    // ignore cancel
                }
            }
            else {
                const approved = await this.showGetSessionPrompt(provider, possibleSessions[0].account.label, extensionId, extensionName);
                if (approved) {
                    session = possibleSessions[0];
                }
            }
            if (session) {
                this._authenticationUsageService.addAccountUsage(provider.id, session.account.label, extensionId, extensionName);
            }
        }
        requestSessionAccess(providerId, extensionId, extensionName, scopes, possibleSessions) {
            const providerRequests = this._sessionAccessRequestItems.get(providerId) || {};
            const hasExistingRequest = providerRequests[extensionId];
            if (hasExistingRequest) {
                return;
            }
            const provider = this._authenticationService.getProvider(providerId);
            const menuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                group: '3_accessRequests',
                command: {
                    id: `${providerId}${extensionId}Access`,
                    title: nls.localize({
                        key: 'accessRequest',
                        comment: [`The placeholder {0} will be replaced with an authentication provider''s label. {1} will be replaced with an extension name. (1) is to indicate that this menu item contributes to a badge count`]
                    }, "Grant access to {0} for {1}... (1)", provider.label, extensionName)
                }
            });
            const accessCommand = commands_1.CommandsRegistry.registerCommand({
                id: `${providerId}${extensionId}Access`,
                handler: async (accessor) => {
                    this.completeSessionAccessRequest(provider, extensionId, extensionName, scopes);
                }
            });
            providerRequests[extensionId] = { possibleSessions, disposables: [menuItem, accessCommand] };
            this._sessionAccessRequestItems.set(providerId, providerRequests);
            this.updateBadgeCount();
        }
        async requestNewSession(providerId, scopes, extensionId, extensionName) {
            if (!this._authenticationService.isAuthenticationProviderRegistered(providerId)) {
                // Activate has already been called for the authentication provider, but it cannot block on registering itself
                // since this is sync and returns a disposable. So, wait for registration event to fire that indicates the
                // provider is now in the map.
                await new Promise((resolve, _) => {
                    const dispose = this._authenticationService.onDidRegisterAuthenticationProvider(e => {
                        if (e.id === providerId) {
                            dispose.dispose();
                            resolve();
                        }
                    });
                });
            }
            let provider;
            try {
                provider = this._authenticationService.getProvider(providerId);
            }
            catch (_e) {
                return;
            }
            const providerRequests = this._signInRequestItems.get(providerId);
            const scopesList = scopes.join(SCOPESLIST_SEPARATOR);
            const extensionHasExistingRequest = providerRequests
                && providerRequests[scopesList]
                && providerRequests[scopesList].requestingExtensionIds.includes(extensionId);
            if (extensionHasExistingRequest) {
                return;
            }
            // Construct a commandId that won't clash with others generated here, nor likely with an extension's command
            const commandId = `${providerId}:${extensionId}:signIn${Object.keys(providerRequests || []).length}`;
            const menuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                group: '2_signInRequests',
                command: {
                    id: commandId,
                    title: nls.localize({
                        key: 'signInRequest',
                        comment: [`The placeholder {0} will be replaced with an authentication provider's label. {1} will be replaced with an extension name. (1) is to indicate that this menu item contributes to a badge count.`]
                    }, "Sign in with {0} to use {1} (1)", provider.label, extensionName)
                }
            });
            const signInCommand = commands_1.CommandsRegistry.registerCommand({
                id: commandId,
                handler: async (accessor) => {
                    const authenticationService = accessor.get(authentication_1.IAuthenticationService);
                    const session = await authenticationService.createSession(providerId, scopes);
                    this._authenticationAccessService.updateAllowedExtensions(providerId, session.account.label, [{ id: extensionId, name: extensionName, allowed: true }]);
                    this.updateSessionPreference(providerId, extensionId, session);
                }
            });
            if (providerRequests) {
                const existingRequest = providerRequests[scopesList] || { disposables: [], requestingExtensionIds: [] };
                providerRequests[scopesList] = {
                    disposables: [...existingRequest.disposables, menuItem, signInCommand],
                    requestingExtensionIds: [...existingRequest.requestingExtensionIds, extensionId]
                };
                this._signInRequestItems.set(providerId, providerRequests);
            }
            else {
                this._signInRequestItems.set(providerId, {
                    [scopesList]: {
                        disposables: [menuItem, signInCommand],
                        requestingExtensionIds: [extensionId]
                    }
                });
            }
            this.updateBadgeCount();
        }
    };
    exports.AuthenticationExtensionsService = AuthenticationExtensionsService;
    exports.AuthenticationExtensionsService = AuthenticationExtensionsService = __decorate([
        __param(0, activity_1.IActivityService),
        __param(1, storage_1.IStorageService),
        __param(2, dialogs_1.IDialogService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, authentication_1.IAuthenticationService),
        __param(5, authenticationUsageService_1.IAuthenticationUsageService),
        __param(6, authenticationAccessService_1.IAuthenticationAccessService)
    ], AuthenticationExtensionsService);
    (0, extensions_1.registerSingleton)(authentication_1.IAuthenticationExtensionsService, AuthenticationExtensionsService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb25FeHRlbnNpb25zU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2F1dGhlbnRpY2F0aW9uL2Jyb3dzZXIvYXV0aGVudGljYXRpb25FeHRlbnNpb25zU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQmhHLG9FQUFvRTtJQUNwRSxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQztJQVdqQyxzRUFBc0U7SUFDL0QsSUFBTSwrQkFBK0IsR0FBckMsTUFBTSwrQkFBZ0MsU0FBUSxzQkFBVTtRQU05RCxZQUNtQixlQUFrRCxFQUNuRCxjQUFnRCxFQUNqRCxhQUE4QyxFQUMxQyxpQkFBc0QsRUFDbEQsc0JBQStELEVBQzFELDJCQUF5RSxFQUN4RSw0QkFBMkU7WUFFekcsS0FBSyxFQUFFLENBQUM7WUFSMkIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ2xDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNoQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDekIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNqQywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1lBQ3pDLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBNkI7WUFDdkQsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUE4QjtZQVhsRyx3QkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBOEIsQ0FBQztZQUM1RCwrQkFBMEIsR0FBRyxJQUFJLEdBQUcsRUFBZ0gsQ0FBQztZQUNySiw0QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBWXpFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxp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