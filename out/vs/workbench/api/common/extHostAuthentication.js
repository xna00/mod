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
define(["require", "exports", "vs/base/common/event", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes", "vs/platform/extensions/common/extensions", "vs/workbench/services/authentication/common/authentication", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService"], function (require, exports, event_1, extHost_protocol_1, extHostTypes_1, extensions_1, authentication_1, instantiation_1, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostAuthentication = exports.IExtHostAuthentication = void 0;
    exports.IExtHostAuthentication = (0, instantiation_1.createDecorator)('IExtHostAuthentication');
    let ExtHostAuthentication = class ExtHostAuthentication {
        constructor(extHostRpc) {
            this._authenticationProviders = new Map();
            this._onDidChangeSessions = new event_1.Emitter();
            this.onDidChangeSessions = this._onDidChangeSessions.event;
            this._getSessionTaskSingler = new TaskSingler();
            this._getSessionsTaskSingler = new TaskSingler();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadAuthentication);
        }
        async getSession(requestingExtension, providerId, scopes, options = {}) {
            const extensionId = extensions_1.ExtensionIdentifier.toKey(requestingExtension.identifier);
            const sortedScopes = [...scopes].sort().join(' ');
            return await this._getSessionTaskSingler.getOrCreate(`${extensionId} ${providerId} ${sortedScopes}`, async () => {
                await this._proxy.$ensureProvider(providerId);
                const extensionName = requestingExtension.displayName || requestingExtension.name;
                return this._proxy.$getSession(providerId, scopes, extensionId, extensionName, options);
            });
        }
        async getSessions(requestingExtension, providerId, scopes) {
            const extensionId = extensions_1.ExtensionIdentifier.toKey(requestingExtension.identifier);
            const sortedScopes = [...scopes].sort().join(' ');
            return await this._getSessionsTaskSingler.getOrCreate(`${extensionId} ${sortedScopes}`, async () => {
                await this._proxy.$ensureProvider(providerId);
                const extensionName = requestingExtension.displayName || requestingExtension.name;
                return this._proxy.$getSessions(providerId, scopes, extensionId, extensionName);
            });
        }
        async removeSession(providerId, sessionId) {
            const providerData = this._authenticationProviders.get(providerId);
            if (!providerData) {
                return this._proxy.$removeSession(providerId, sessionId);
            }
            return providerData.provider.removeSession(sessionId);
        }
        registerAuthenticationProvider(id, label, provider, options) {
            if (this._authenticationProviders.get(id)) {
                throw new Error(`An authentication provider with id '${id}' is already registered.`);
            }
            this._authenticationProviders.set(id, { label, provider, options: options ?? { supportsMultipleAccounts: false } });
            const listener = provider.onDidChangeSessions(e => this._proxy.$sendDidChangeSessions(id, e));
            this._proxy.$registerAuthenticationProvider(id, label, options?.supportsMultipleAccounts ?? false);
            return new extHostTypes_1.Disposable(() => {
                listener.dispose();
                this._authenticationProviders.delete(id);
                this._proxy.$unregisterAuthenticationProvider(id);
            });
        }
        $createSession(providerId, scopes, options) {
            const providerData = this._authenticationProviders.get(providerId);
            if (providerData) {
                return Promise.resolve(providerData.provider.createSession(scopes, options));
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
        $removeSession(providerId, sessionId) {
            const providerData = this._authenticationProviders.get(providerId);
            if (providerData) {
                return Promise.resolve(providerData.provider.removeSession(sessionId));
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
        $getSessions(providerId, scopes) {
            const providerData = this._authenticationProviders.get(providerId);
            if (providerData) {
                return Promise.resolve(providerData.provider.getSessions(scopes));
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
        $onDidChangeAuthenticationSessions(id, label) {
            // Don't fire events for the internal auth providers
            if (!id.startsWith(authentication_1.INTERNAL_AUTH_PROVIDER_PREFIX)) {
                this._onDidChangeSessions.fire({ provider: { id, label } });
            }
            return Promise.resolve();
        }
    };
    exports.ExtHostAuthentication = ExtHostAuthentication;
    exports.ExtHostAuthentication = ExtHostAuthentication = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostAuthentication);
    class TaskSingler {
        constructor() {
            this._inFlightPromises = new Map();
        }
        getOrCreate(key, promiseFactory) {
            const inFlight = this._inFlightPromises.get(key);
            if (inFlight) {
                return inFlight;
            }
            const promise = promiseFactory().finally(() => this._inFlightPromises.delete(key));
            this._inFlightPromises.set(key, promise);
            return promise;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEF1dGhlbnRpY2F0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0QXV0aGVudGljYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBWW5GLFFBQUEsc0JBQXNCLEdBQUcsSUFBQSwrQkFBZSxFQUF5Qix3QkFBd0IsQ0FBQyxDQUFDO0lBUWpHLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXFCO1FBYWpDLFlBQ3FCLFVBQThCO1lBVDNDLDZCQUF3QixHQUFzQyxJQUFJLEdBQUcsRUFBZ0MsQ0FBQztZQUV0Ryx5QkFBb0IsR0FBRyxJQUFJLGVBQU8sRUFBNEMsQ0FBQztZQUM5RSx3QkFBbUIsR0FBb0QsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQztZQUV4RywyQkFBc0IsR0FBRyxJQUFJLFdBQVcsRUFBNEMsQ0FBQztZQUNyRiw0QkFBdUIsR0FBRyxJQUFJLFdBQVcsRUFBK0MsQ0FBQztZQUtoRyxJQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFNRCxLQUFLLENBQUMsVUFBVSxDQUFDLG1CQUEwQyxFQUFFLFVBQWtCLEVBQUUsTUFBeUIsRUFBRSxVQUFrRCxFQUFFO1lBQy9KLE1BQU0sV0FBVyxHQUFHLGdDQUFtQixDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM5RSxNQUFNLFlBQVksR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xELE9BQU8sTUFBTSxJQUFJLENBQUMsc0JBQXNCLENBQUMs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