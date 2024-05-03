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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/types", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/workbench/services/authentication/browser/authenticationAccessService", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/extensions/common/extensions"], function (require, exports, event_1, lifecycle_1, strings_1, types_1, nls_1, extensions_1, authenticationAccessService_1, authentication_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthenticationService = void 0;
    exports.getAuthenticationProviderActivationEvent = getAuthenticationProviderActivationEvent;
    exports.getCurrentAuthenticationSessionInfo = getCurrentAuthenticationSessionInfo;
    function getAuthenticationProviderActivationEvent(id) { return `onAuthenticationRequest:${id}`; }
    async function getCurrentAuthenticationSessionInfo(secretStorageService, productService) {
        const authenticationSessionValue = await secretStorageService.get(`${productService.urlProtocol}.loginAccount`);
        if (authenticationSessionValue) {
            try {
                const authenticationSessionInfo = JSON.parse(authenticationSessionValue);
                if (authenticationSessionInfo
                    && (0, types_1.isString)(authenticationSessionInfo.id)
                    && (0, types_1.isString)(authenticationSessionInfo.accessToken)
                    && (0, types_1.isString)(authenticationSessionInfo.providerId)) {
                    return authenticationSessionInfo;
                }
            }
            catch (e) {
                // This is a best effort operation.
                console.error(`Failed parsing current auth session value: ${e}`);
            }
        }
        return undefined;
    }
    let AuthenticationService = class AuthenticationService extends lifecycle_1.Disposable {
        constructor(_extensionService, authenticationAccessService) {
            super();
            this._extensionService = _extensionService;
            this._onDidRegisterAuthenticationProvider = this._register(new event_1.Emitter());
            this.onDidRegisterAuthenticationProvider = this._onDidRegisterAuthenticationProvider.event;
            this._onDidUnregisterAuthenticationProvider = this._register(new event_1.Emitter());
            this.onDidUnregisterAuthenticationProvider = this._onDidUnregisterAuthenticationProvider.event;
            this._onDidChangeSessions = this._register(new event_1.Emitter());
            this.onDidChangeSessions = this._onDidChangeSessions.event;
            this._onDidChangeDeclaredProviders = this._register(new event_1.Emitter());
            this.onDidChangeDeclaredProviders = this._onDidChangeDeclaredProviders.event;
            this._authenticationProviders = new Map();
            this._authenticationProviderDisposables = this._register(new lifecycle_1.DisposableMap());
            this._declaredProviders = [];
            this._register(authenticationAccessService.onDidChangeExtensionSessionAccess(e => {
                // The access has changed, not the actual session itself but extensions depend on this event firing
                // when they have gained access to an account so this fires that event.
                this._onDidChangeSessions.fire({
                    providerId: e.providerId,
                    label: e.accountName,
                    event: {
                        added: [],
                        changed: [],
                        removed: []
                    }
                });
            }));
        }
        get declaredProviders() {
            return this._declaredProviders;
        }
        registerDeclaredAuthenticationProvider(provider) {
            if ((0, strings_1.isFalsyOrWhitespace)(provider.id)) {
                throw new Error((0, nls_1.localize)('authentication.missingId', 'An authentication contribution must specify an id.'));
            }
            if ((0, strings_1.isFalsyOrWhitespace)(provider.label)) {
                throw new Error((0, nls_1.localize)('authentication.missingLabel', 'An authentication contribution must specify a label.'));
            }
            if (this.declaredProviders.some(p => p.id === provider.id)) {
                throw new Error((0, nls_1.localize)('authentication.idConflict', "This authentication id '{0}' has already been registered", provider.id));
            }
            this._declaredProviders.push(provider);
            this._onDidChangeDeclaredProviders.fire();
        }
        unregisterDeclaredAuthenticationProvider(id) {
            const index = this.declaredProviders.findIndex(provider => provider.id === id);
            if (index > -1) {
                this.declaredProviders.splice(index, 1);
            }
            this._onDidChangeDeclaredProviders.fire();
        }
        isAuthenticationProviderRegistered(id) {
            return this._authenticationProviders.has(id);
        }
        registerAuthenticationProvider(id, authenticationProvider) {
            this._authenticationProviders.set(id, authenticationProvider);
            const disposableStore = new lifecycle_1.DisposableStore();
            disposableStore.add(authenticationProvider.onDidChangeSessions(e => this._onDidChangeSessions.fire({
                providerId: id,
                label: authenticationProvider.label,
                event: e
            })));
            if ((0, lifecycle_1.isDisposable)(authenticationProvider)) {
                disposableStore.add(authenticationProvider);
            }
            this._authenticationProviderDisposables.set(id, disposableStore);
            this._onDidRegisterAuthenticationProvider.fire({ id, label: authenticationProvider.label });
        }
        unregisterAuthenticationProvider(id) {
            const provider = this._authenticationProviders.get(id);
            if (provider) {
                this._authenticationProviders.delete(id);
                this._onDidUnregisterAuthenticationProvider.fire({ id, label: provider.label });
            }
            this._authenticationProviderDisposables.deleteAndDispose(id);
        }
        getProviderIds() {
            const providerIds = [];
            this._authenticationProviders.forEach(provider => {
                providerIds.push(provider.id);
            });
            return providerIds;
        }
        getProvider(id) {
            if (this._authenticationProviders.has(id)) {
                return this._authenticationProviders.get(id);
            }
            throw new Error(`No authentication provider '${id}' is currently registered.`);
        }
        async getSessions(id, scopes, activateImmediate = false) {
            const authProvider = this._authenticationProviders.get(id) || await this.tryActivateProvider(id, activateImmediate);
            if (authProvider) {
                return await authProvider.getSessions(scopes);
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async createSession(id, scopes, options) {
            const authProvider = this._authenticationProviders.get(id) || await this.tryActivateProvider(id, !!options?.activateImmediate);
            if (authProvider) {
                return await authProvider.createSession(scopes, {
                    sessionToRecreate: options?.sessionToRecreate
                });
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async removeSession(id, sessionId) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return authProvider.removeSession(sessionId);
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async tryActivateProvider(providerId, activateImmediate) {
            await this._extensionService.activateByEvent(getAuthenticationProviderActivationEvent(providerId), activateImmediate ? 1 /* ActivationKind.Immediate */ : 0 /* ActivationKind.Normal */);
            let provider = this._authenticationProviders.get(providerId);
            if (provider) {
                return provider;
            }
            // When activate has completed, the extension has made the call to `registerAuthenticationProvider`.
            // However, activate cannot block on this, so the renderer may not have gotten the event yet.
            const didRegister = new Promise((resolve, _) => {
                this.onDidRegisterAuthenticationProvider(e => {
                    if (e.id === providerId) {
                        provider = this._authenticationProviders.get(providerId);
                        if (provider) {
                            resolve(provider);
                        }
                        else {
                            throw new Error(`No authentication provider '${providerId}' is currently registered.`);
                        }
                    }
                });
            });
            const didTimeout = new Promise((_, reject) => {
                setTimeout(() => {
                    reject('Timed out waiting for authentication provider to register');
                }, 5000);
            });
            return Promise.race([didRegister, didTimeout]);
        }
    };
    exports.AuthenticationService = AuthenticationService;
    exports.AuthenticationService = AuthenticationService = __decorate([
        __param(0, extensions_2.IExtensionService),
        __param(1, authenticationAccessService_1.IAuthenticationAccessService)
    ], AuthenticationService);
    (0, extensions_1.registerSingleton)(authentication_1.IAuthenticationService, AuthenticationService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb25TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvYXV0aGVudGljYXRpb24vYnJvd3Nlci9hdXRoZW50aWNhdGlvblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY2hHLDRGQUF3SDtJQUl4SCxrRkFxQkM7SUF6QkQsU0FBZ0Isd0NBQXdDLENBQUMsRUFBVSxJQUFZLE9BQU8sMkJBQTJCLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUlqSCxLQUFLLFVBQVUsbUNBQW1DLENBQ3hELG9CQUEyQyxFQUMzQyxjQUErQjtRQUUvQixNQUFNLDBCQUEwQixHQUFHLE1BQU0sb0JBQW9CLENBQUMsR0FBRyxDQUFDLEdBQUcsY0FBYyxDQUFDLFdBQVcsZUFBZSxDQUFDLENBQUM7UUFDaEgsSUFBSSwwQkFBMEIsRUFBRSxDQUFDO1lBQ2hDLElBQUksQ0FBQztnQkFDSixNQUFNLHlCQUF5QixHQUE4QixJQUFJLENBQUMsS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUM7Z0JBQ3BHLElBQUkseUJBQXlCO3VCQUN6QixJQUFBLGdCQUFRLEVBQUMseUJBQXlCLENBQUMsRUFBRSxDQUFDO3VCQUN0QyxJQUFBLGdCQUFRLEVBQUMseUJBQXlCLENBQUMsV0FBVyxDQUFDO3VCQUMvQyxJQUFBLGdCQUFRLEVBQUMseUJBQXlCLENBQUMsVUFBVSxDQUFDLEVBQ2hELENBQUM7b0JBQ0YsT0FBTyx5QkFBeUIsQ0FBQztnQkFDbEMsQ0FBQztZQUNGLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLG1DQUFtQztnQkFDbkMsT0FBTyxDQUFDLEtBQUssQ0FBQyw4Q0FBOEMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsRSxDQUFD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