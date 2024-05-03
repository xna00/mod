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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/authentication/common/authentication", "../common/extHost.protocol", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/platform/notification/common/notification", "vs/workbench/services/extensions/common/extensions", "vs/platform/telemetry/common/telemetry", "vs/base/common/event", "vs/workbench/services/authentication/browser/authenticationAccessService", "vs/workbench/services/authentication/browser/authenticationUsageService", "vs/workbench/services/authentication/browser/authenticationService", "vs/base/common/uri", "vs/platform/opener/common/opener"], function (require, exports, lifecycle_1, nls, extHostCustomers_1, authentication_1, extHost_protocol_1, dialogs_1, severity_1, notification_1, extensions_1, telemetry_1, event_1, authenticationAccessService_1, authenticationUsageService_1, authenticationService_1, uri_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadAuthentication = exports.MainThreadAuthenticationProvider = void 0;
    class MainThreadAuthenticationProvider extends lifecycle_1.Disposable {
        constructor(_proxy, id, label, supportsMultipleAccounts, notificationService, onDidChangeSessionsEmitter) {
            super();
            this._proxy = _proxy;
            this.id = id;
            this.label = label;
            this.supportsMultipleAccounts = supportsMultipleAccounts;
            this.notificationService = notificationService;
            this.onDidChangeSessions = onDidChangeSessionsEmitter.event;
        }
        async getSessions(scopes) {
            return this._proxy.$getSessions(this.id, scopes);
        }
        createSession(scopes, options) {
            return this._proxy.$createSession(this.id, scopes, options);
        }
        async removeSession(sessionId) {
            await this._proxy.$removeSession(this.id, sessionId);
            this.notificationService.info(nls.localize('signedOut', "Successfully signed out."));
        }
    }
    exports.MainThreadAuthenticationProvider = MainThreadAuthenticationProvider;
    let MainThreadAuthentication = class MainThreadAuthentication extends lifecycle_1.Disposable {
        constructor(extHostContext, authenticationService, authenticationExtensionsService, authenticationAccessService, authenticationUsageService, dialogService, notificationService, extensionService, telemetryService, openerService) {
            super();
            this.authenticationService = authenticationService;
            this.authenticationExtensionsService = authenticationExtensionsService;
            this.authenticationAccessService = authenticationAccessService;
            this.authenticationUsageService = authenticationUsageService;
            this.dialogService = dialogService;
            this.notificationService = notificationService;
            this.extensionService = extensionService;
            this.telemetryService = telemetryService;
            this.openerService = openerService;
            this._registrations = this._register(new lifecycle_1.DisposableMap());
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostAuthentication);
            this._register(this.authenticationService.onDidChangeSessions(e => {
                this._proxy.$onDidChangeAuthenticationSessions(e.providerId, e.label);
            }));
        }
        async $registerAuthenticationProvider(id, label, supportsMultipleAccounts) {
            const emitter = new event_1.Emitter();
            this._registrations.set(id, emitter);
            const provider = new MainThreadAuthenticationProvider(this._proxy, id, label, supportsMultipleAccounts, this.notificationService, emitter);
            this.authenticationService.registerAuthenticationProvider(id, provider);
        }
        $unregisterAuthenticationProvider(id) {
            this._registrations.deleteAndDispose(id);
            this.authenticationService.unregisterAuthenticationProvider(id);
        }
        async $ensureProvider(id) {
            if (!this.authenticationService.isAuthenticationProviderRegistered(id)) {
                return await this.extensionService.activateByEvent((0, authenticationService_1.getAuthenticationProviderActivationEvent)(id), 1 /* ActivationKind.Immediate */);
            }
        }
        $sendDidChangeSessions(providerId, event) {
            const obj = this._registrations.get(providerId);
            if (obj instanceof event_1.Emitter) {
                obj.fire(event);
            }
        }
        $removeSession(providerId, sessionId) {
            return this.authenticationService.removeSession(providerId, sessionId);
        }
        async loginPrompt(providerName, extensionName, recreatingSession, options) {
            const message = recreatingSession
                ? nls.localize('confirmRelogin', "The extension '{0}' wants you to sign in again using {1}.", extensionName, providerName)
                : nls.localize('confirmLogin', "The extension '{0}' wants to sign in using {1}.", extensionName, providerName);
            const buttons = [
                {
                    label: nls.localize({ key: 'allow', comment: ['&& denotes a mnemonic'] }, "&&Allow"),
                    run() {
                        return true;
                    },
                }
            ];
            if (options?.learnMore) {
                buttons.push({
                    label: nls.localize('learnMore', "Learn more"),
                    run: async () => {
                        const result = this.loginPrompt(providerName, extensionName, recreatingSession, options);
                        await this.openerService.open(uri_1.URI.revive(options.learnMore), { allowCommands: true });
                        return await result;
                    }
                });
            }
            const { result } = await this.dialogService.prompt({
                type: severity_1.default.Info,
                message,
                buttons,
                detail: options?.detail,
                cancelButton: true,
            });
            return result ?? false;
        }
        async doGetSession(providerId, scopes, extensionId, extensionName, options) {
            const sessions = await this.authenticationService.getSessions(providerId, scopes, true);
            const provider = this.authenticationService.getProvider(providerId);
            // Error cases
            if (options.forceNewSession && options.createIfNone) {
                throw new Error('Invalid combination of options. Please remove one of the following: forceNewSession, createIfNone');
            }
            if (options.forceNewSession && options.silent) {
                throw new Error('Invalid combination of options. Please remove one of the following: forceNewSession, silent');
            }
            if (options.createIfNone && options.silent) {
                throw new Error('Invalid combination of options. Please remove one of the following: createIfNone, silent');
            }
            // Check if the sessions we have are valid
            if (!options.forceNewSession && sessions.length) {
                if (provider.supportsMultipleAccounts) {
                    if (options.clearSessionPreference) {
                        // Clearing the session preference is usually paired with createIfNone, so just remove the preference and
                        // defer to the rest of the logic in this function to choose the session.
                        this.authenticationExtensionsService.removeSessionPreference(providerId, extensionId, scopes);
                    }
                    else {
                        // If we have an existing session preference, use that. If not, we'll return any valid session at the end of this function.
                        const existingSessionPreference = this.authenticationExtensionsService.getSessionPreference(providerId, extensionId, scopes);
                        if (existingSessionPreference) {
                            const matchingSession = sessions.find(session => session.id === existingSessionPreference);
                            if (matchingSession && this.authenticationAccessService.isAccessAllowed(providerId, matchingSession.account.label, extensionId)) {
                                return matchingSession;
                            }
                        }
                    }
                }
                else if (this.authenticationAccessService.isAccessAllowed(providerId, sessions[0].account.label, extensionId)) {
                    return sessions[0];
                }
            }
            // We may need to prompt because we don't have a valid session
            // modal flows
            if (options.createIfNone || options.forceNewSession) {
                let uiOptions;
                if (typeof options.forceNewSession === 'object') {
                    uiOptions = options.forceNewSession;
                }
                // We only want to show the "recreating session" prompt if we are using forceNewSession & there are sessions
                // that we will be "forcing through".
                const recreatingSession = !!(options.forceNewSession && sessions.length);
                const isAllowed = await this.loginPrompt(provider.label, extensionName, recreatingSession, uiOptions);
                if (!isAllowed) {
                    throw new Error('User did not consent to login.');
                }
                let session;
                if (sessions?.length && !options.forceNewSession) {
                    session = provider.supportsMultipleAccounts
                        ? await this.authenticationExtensionsService.selectSession(providerId, extensionId, extensionName, scopes, sessions)
                        : sessions[0];
                }
                else {
                    let sessionToRecreate;
                    if (typeof options.forceNewSession === 'object' && options.forceNewSession.sessionToRecreate) {
                        sessionToRecreate = options.forceNewSession.sessionToRecreate;
                    }
                    else {
                        const sessionIdToRecreate = this.authenticationExtensionsService.getSessionPreference(providerId, extensionId, scopes);
                        sessionToRecreate = sessionIdToRecreate ? sessions.find(session => session.id === sessionIdToRecreate) : undefined;
                    }
                    session = await this.authenticationService.createSession(providerId, scopes, { activateImmediate: true, sessionToRecreate });
                }
                this.authenticationAccessService.updateAllowedExtensions(providerId, session.account.label, [{ id: extensionId, name: extensionName, allowed: true }]);
                this.authenticationExtensionsService.updateSessionPreference(providerId, extensionId, session);
                return session;
            }
            // For the silent flows, if we have a session, even though it may not be the user's preference, we'll return it anyway because it might be for a specific
            // set of scopes.
            const validSession = sessions.find(session => this.authenticationAccessService.isAccessAllowed(providerId, session.account.label, extensionId));
            if (validSession) {
                return validSession;
            }
            // passive flows (silent or default)
            if (!options.silent) {
                // If there is a potential session, but the extension doesn't have access to it, use the "grant access" flow,
                // otherwise request a new one.
                sessions.length
                    ? this.authenticationExtensionsService.requestSessionAccess(providerId, extensionId, extensionName, scopes, sessions)
                    : await this.authenticationExtensionsService.requestNewSession(providerId, scopes, extensionId, extensionName);
            }
            return undefined;
        }
        async $getSession(providerId, scopes, extensionId, extensionName, options) {
            const session = await this.doGetSession(providerId, scopes, extensionId, extensionName, options);
            if (session) {
                this.sendProviderUsageTelemetry(extensionId, providerId);
                this.authenticationUsageService.addAccountUsage(providerId, session.account.label, extensionId, extensionName);
            }
            return session;
        }
        async $getSessions(providerId, scopes, extensionId, extensionName) {
            const sessions = await this.authenticationService.getSessions(providerId, [...scopes], true);
            const accessibleSessions = sessions.filter(s => this.authenticationAccessService.isAccessAllowed(providerId, s.account.label, extensionId));
            if (accessibleSessions.length) {
                this.sendProviderUsageTelemetry(extensionId, providerId);
                for (const session of accessibleSessions) {
                    this.authenticationUsageService.addAccountUsage(providerId, session.account.label, extensionId, extensionName);
                }
            }
            return accessibleSessions;
        }
        sendProviderUsageTelemetry(extensionId, providerId) {
            this.telemetryService.publicLog2('authentication.providerUsage', { providerId, extensionId });
        }
    };
    exports.MainThreadAuthentication = MainThreadAuthentication;
    exports.MainThreadAuthentication = MainThreadAuthentication = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadAuthentication),
        __param(1, authentication_1.IAuthenticationService),
        __param(2, authentication_1.IAuthenticationExtensionsService),
        __param(3, authenticationAccessService_1.IAuthenticationAccessService),
        __param(4, authenticationUsageService_1.IAuthenticationUsageService),
        __param(5, dialogs_1.IDialogService),
        __param(6, notification_1.INotificationService),
        __param(7, extensions_1.IExtensionService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, opener_1.IOpenerService)
    ], MainThreadAuthentication);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEF1dGhlbnRpY2F0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZEF1dGhlbnRpY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdDaEcsTUFBYSxnQ0FBaUMsU0FBUSxzQkFBVTtRQUkvRCxZQUNrQixNQUFrQyxFQUNuQyxFQUFVLEVBQ1YsS0FBYSxFQUNiLHdCQUFpQyxFQUNoQyxtQkFBeUMsRUFDMUQsMEJBQXNFO1lBRXRFLEtBQUssRUFBRSxDQUFDO1lBUFMsV0FBTSxHQUFOLE1BQU0sQ0FBNEI7WUFDbkMsT0FBRSxHQUFGLEVBQUUsQ0FBUTtZQUNWLFVBQUssR0FBTCxLQUFLLENBQVE7WUFDYiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQVM7WUFDaEMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUkxRCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsMEJBQTBCLENBQUMsS0FBSyxDQUFDO1FBQzdELENBQUM7UUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQWlCO1lBQ2xDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBRUQsYUFBYSxDQUFDLE1BQWdCLEVBQUUsT0FBNEM7WUFDM0UsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBRUQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxTQUFpQjtZQUNwQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFF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