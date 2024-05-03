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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/platform/registry/common/platform", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/chat/common/languageModels", "vs/workbench/services/authentication/browser/authenticationAccessService", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/extensions/common/extensions"], function (require, exports, arrays_1, event_1, lifecycle_1, nls_1, log_1, progress_1, platform_1, extHost_protocol_1, languageModels_1, authenticationAccessService_1, authentication_1, extensionFeatures_1, extHostCustomers_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadLanguageModels = void 0;
    let MainThreadLanguageModels = class MainThreadLanguageModels {
        constructor(extHostContext, _chatProviderService, _extensionFeaturesManagementService, _logService, _authenticationService, _authenticationAccessService, _extensionService) {
            this._chatProviderService = _chatProviderService;
            this._extensionFeaturesManagementService = _extensionFeaturesManagementService;
            this._logService = _logService;
            this._authenticationService = _authenticationService;
            this._authenticationAccessService = _authenticationAccessService;
            this._extensionService = _extensionService;
            this._store = new lifecycle_1.DisposableStore();
            this._providerRegistrations = new lifecycle_1.DisposableMap();
            this._pendingProgress = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostChatProvider);
            this._proxy.$updateLanguageModels({ added: (0, arrays_1.coalesce)(_chatProviderService.getLanguageModelIds().map(id => _chatProviderService.lookupLanguageModel(id))) });
            this._store.add(_chatProviderService.onDidChangeLanguageModels(this._proxy.$updateLanguageModels, this._proxy));
        }
        dispose() {
            this._providerRegistrations.dispose();
            this._store.dispose();
        }
        $registerLanguageModelProvider(handle, identifier, metadata) {
            const dipsosables = new lifecycle_1.DisposableStore();
            dipsosables.add(this._chatProviderService.registerLanguageModelChat(identifier, {
                metadata,
                provideChatResponse: async (messages, from, options, progress, token) => {
                    const requestId = (Math.random() * 1e6) | 0;
                    this._pendingProgress.set(requestId, progress);
                    try {
                        await this._proxy.$provideLanguageModelResponse(handle, requestId, from, messages, options, token);
                    }
                    finally {
                        this._pendingProgress.delete(requestId);
                    }
                }
            }));
            if (metadata.auth) {
                dipsosables.add(this._registerAuthenticationProvider(metadata.extension, metadata.auth));
            }
            dipsosables.add(platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
                id: `lm-${identifier}`,
                label: (0, nls_1.localize)('languageModels', "Language Model ({0})", `${identifier}`),
                access: {
                    canToggle: false,
                },
            }));
            this._providerRegistrations.set(handle, dipsosables);
        }
        async $handleProgressChunk(requestId, chunk) {
            this._pendingProgress.get(requestId)?.report(chunk);
        }
        $unregisterProvider(handle) {
            this._providerRegistrations.deleteAndDispose(handle);
        }
        async $prepareChatAccess(extension, providerId, justification) {
            const activate = this._extensionService.activateByEvent(`onLanguageModelAccess:${providerId}`);
            const metadata = this._chatProviderService.lookupLanguageModel(providerId);
            if (metadata) {
                return metadata;
            }
            await Promise.race([
                activate,
                event_1.Event.toPromise(event_1.Event.filter(this._chatProviderService.onDidChangeLanguageModels, e => Boolean(e.added?.some(value => value.identifier === providerId))))
            ]);
            return this._chatProviderService.lookupLanguageModel(providerId);
        }
        async $fetchResponse(extension, providerId, requestId, messages, options, token) {
            await this._extensionFeaturesManagementService.getAccess(extension, `lm-${providerId}`);
            this._logService.debug('[CHAT] extension request STARTED', extension.value, requestId);
            const task = this._chatProviderService.makeLanguageModelChatRequest(providerId, extension, messages, options, new progress_1.Progress(value => {
                this._proxy.$handleResponseFragment(requestId, value);
            }), token);
            task.catch(err => {
                this._logService.error('[CHAT] extension request ERRORED', err, extension.value, requestId);
                throw err;
            }).finally(() => {
                this._logService.debug('[CHAT] extension request DONE', extension.value, requestId);
            });
            return task;
        }
        _registerAuthenticationProvider(extension, auth) {
            // This needs to be done in both MainThread & ExtHost ChatProvider
            const authProviderId = authentication_1.INTERNAL_AUTH_PROVIDER_PREFIX + extension.value;
            // Only register one auth provider per extension
            if (this._authenticationService.getProviderIds().includes(authProviderId)) {
                return lifecycle_1.Disposable.None;
            }
            const accountLabel = auth.accountLabel ?? (0, nls_1.localize)('languageModelsAccountId', 'Language Models');
            const disposables = new lifecycle_1.DisposableStore();
            this._authenticationService.registerAuthenticationProvider(authProviderId, new LanguageModelAccessAuthProvider(authProviderId, auth.providerLabel, accountLabel));
            disposables.add((0, lifecycle_1.toDisposable)(() => {
                this._authenticationService.unregisterAuthenticationProvider(authProviderId);
            }));
            disposables.add(this._authenticationAccessService.onDidChangeExtensionSessionAccess(async (e) => {
                const allowedExtensions = this._authenticationAccessService.readAllowedExtensions(authProviderId, accountLabel);
                const accessList = [];
                for (const allowedExtension of allowedExtensions) {
                    const from = await this._extensionService.getExtension(allowedExtension.id);
                    if (from) {
                        accessList.push({
                            from: from.identifier,
                            to: extension,
                            enabled: allowedExtension.allowed ?? true
                        });
                    }
                }
                this._proxy.$updateModelAccesslist(accessList);
            }));
            return disposables;
        }
    };
    exports.MainThreadLanguageModels = MainThreadLanguageModels;
    exports.MainThreadLanguageModels = MainThreadLanguageModels = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadLanguageModels),
        __param(1, languageModels_1.ILanguageModelsService),
        __param(2, extensionFeatures_1.IExtensionFeaturesManagementService),
        __param(3, log_1.ILogService),
        __param(4, authentication_1.IAuthenticationService),
        __param(5, authenticationAccessService_1.IAuthenticationAccessService),
        __param(6, extensions_1.IExtensionService)
    ], MainThreadLanguageModels);
    // The fake AuthenticationProvider that will be used to gate access to the Language Model. There will be one per provider.
    class LanguageModelAccessAuthProvider {
        constructor(id, label, _accountLabel) {
            this.id = id;
            this.label = label;
            this._accountLabel = _accountLabel;
            this.supportsMultipleAccounts = false;
            // Important for updating the UI
            this._onDidChangeSessions = new event_1.Emitter();
            this.onDidChangeSessions = this._onDidChangeSessions.event;
        }
        async getSessions(scopes) {
            // If there are no scopes and no session that means no extension has requested a session yet
            // and the user is simply opening the Account menu. In that case, we should not return any "sessions".
            if (scopes === undefined && !this._session) {
                return [];
            }
            if (this._session) {
                return [this._session];
            }
            return [await this.createSession(scopes || [], {})];
        }
        async createSession(scopes, options) {
            this._session = this._createFakeSession(scopes);
            this._onDidChangeSessions.fire({ added: [this._session], changed: [], removed: [] });
            return this._session;
        }
        removeSession(sessionId) {
            if (this._session) {
                this._onDidChangeSessions.fire({ added: [], changed: [], removed: [this._session] });
                this._session = undefined;
            }
            return Promise.resolve();
        }
        _createFakeSession(scopes) {
            return {
                id: 'fake-session',
                account: {
                    id: this.id,
                    label: this._accountLabel,
                },
                accessToken: 'fake-access-token',
                scopes,
            };
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZExhbmd1YWdlTW9kZWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZExhbmd1YWdlTW9kZWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW9CekYsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBd0I7UUFPcEMsWUFDQyxjQUErQixFQUNQLG9CQUE2RCxFQUNoRCxtQ0FBeUYsRUFDakgsV0FBeUMsRUFDOUIsc0JBQStELEVBQ3pELDRCQUEyRSxFQUN0RixpQkFBcUQ7WUFML0IseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF3QjtZQUMvQix3Q0FBbUMsR0FBbkMsbUNBQW1DLENBQXFDO1lBQ2hHLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ2IsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF3QjtZQUN4QyxpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQThCO1lBQ3JFLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFYeEQsV0FBTSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQy9CLDJCQUFzQixHQUFHLElBQUkseUJBQWEsRUFBVSxDQUFDO1lBQ3JELHFCQUFnQixHQUFHLElBQUksR0FBRyxFQUE0QyxDQUFDO1lBV3ZGLElBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFFMUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFBLGlCQUFRLEVBQUMsb0JBQW9CLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFF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