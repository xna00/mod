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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/authentication/browser/actions/signOutOfAccountAction", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/workbench/services/extensions/common/extensionsRegistry", "./actions/manageTrustedExtensionsForAccountAction"], function (require, exports, lifecycle_1, strings_1, nls_1, actions_1, commands_1, contextkey_1, descriptors_1, platform_1, contributions_1, signOutOfAccountAction_1, authentication_1, environmentService_1, extensionFeatures_1, extensionsRegistry_1, manageTrustedExtensionsForAccountAction_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthenticationContribution = void 0;
    const codeExchangeProxyCommand = commands_1.CommandsRegistry.registerCommand('workbench.getCodeExchangeProxyEndpoints', function (accessor, _) {
        const environmentService = accessor.get(environmentService_1.IBrowserWorkbenchEnvironmentService);
        return environmentService.options?.codeExchangeProxyEndpoints;
    });
    const authenticationDefinitionSchema = {
        type: 'object',
        additionalProperties: false,
        properties: {
            id: {
                type: 'string',
                description: (0, nls_1.localize)('authentication.id', 'The id of the authentication provider.')
            },
            label: {
                type: 'string',
                description: (0, nls_1.localize)('authentication.label', 'The human readable name of the authentication provider.'),
            }
        }
    };
    const authenticationExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'authentication',
        jsonSchema: {
            description: (0, nls_1.localize)({ key: 'authenticationExtensionPoint', comment: [`'Contributes' means adds here`] }, 'Contributes authentication'),
            type: 'array',
            items: authenticationDefinitionSchema
        },
        activationEventsGenerator: (authenticationProviders, result) => {
            for (const authenticationProvider of authenticationProviders) {
                if (authenticationProvider.id) {
                    result.push(`onAuthenticationRequest:${authenticationProvider.id}`);
                }
            }
        }
    });
    class AuthenticationDataRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.authentication;
        }
        render(manifest) {
            const authentication = manifest.contributes?.authentication || [];
            if (!authentication.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const headers = [
                (0, nls_1.localize)('authenticationlabel', "Label"),
                (0, nls_1.localize)('authenticationid', "ID"),
            ];
            const rows = authentication
                .sort((a, b) => a.label.localeCompare(b.label))
                .map(auth => {
                return [
                    auth.label,
                    auth.id,
                ];
            });
            return {
                data: {
                    headers,
                    rows
                },
                dispose: () => { }
            };
        }
    }
    const extensionFeature = platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'authentication',
        label: (0, nls_1.localize)('authentication', "Authentication"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(AuthenticationDataRenderer),
    });
    let AuthenticationContribution = class AuthenticationContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.authentication'; }
        constructor(_authenticationService, _environmentService) {
            super();
            this._authenticationService = _authenticationService;
            this._environmentService = _environmentService;
            this._placeholderMenuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                command: {
                    id: 'noAuthenticationProviders',
                    title: (0, nls_1.localize)('authentication.Placeholder', "No accounts requested yet..."),
                    precondition: contextkey_1.ContextKeyExpr.false()
                },
            });
            this._register(codeExchangeProxyCommand);
            this._register(extensionFeature);
            this._registerHandlers();
            this._registerAuthenticationExtentionPointHandler();
            this._registerEnvContributedAuthenticationProviders();
            this._registerActions();
        }
        _registerAuthenticationExtentionPointHandler() {
            authenticationExtPoint.setHandler((extensions, { added, removed }) => {
                added.forEach(point => {
                    for (const provider of point.value) {
                        if ((0, strings_1.isFalsyOrWhitespace)(provider.id)) {
                            point.collector.error((0, nls_1.localize)('authentication.missingId', 'An authentication contribution must specify an id.'));
                            continue;
                        }
                        if ((0, strings_1.isFalsyOrWhitespace)(provider.label)) {
                            point.collector.error((0, nls_1.localize)('authentication.missingLabel', 'An authentication contribution must specify a label.'));
                            continue;
                        }
                        if (!this._authenticationService.declaredProviders.some(p => p.id === provider.id)) {
                            this._authenticationService.registerDeclaredAuthenticationProvider(provider);
                        }
                        else {
                            point.collector.error((0, nls_1.localize)('authentication.idConflict', "This authentication id '{0}' has already been registered", provider.id));
                        }
                    }
                });
                const removedExtPoints = removed.flatMap(r => r.value);
                removedExtPoints.forEach(point => {
                    const provider = this._authenticationService.declaredProviders.find(provider => provider.id === point.id);
                    if (provider) {
                        this._authenticationService.unregisterDeclaredAuthenticationProvider(provider.id);
                    }
                });
            });
        }
        _registerEnvContributedAuthenticationProviders() {
            if (!this._environmentService.options?.authenticationProviders?.length) {
                return;
            }
            for (const provider of this._environmentService.options.authenticationProviders) {
                this._authenticationService.registerAuthenticationProvider(provider.id, provider);
            }
        }
        _registerHandlers() {
            this._register(this._authenticationService.onDidRegisterAuthenticationProvider(_e => {
                this._placeholderMenuItem?.dispose();
                this._placeholderMenuItem = undefined;
            }));
            this._register(this._authenticationService.onDidUnregisterAuthenticationProvider(_e => {
                if (!this._authenticationService.getProviderIds().length) {
                    this._placeholderMenuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                        command: {
                            id: 'noAuthenticationProviders',
                            title: (0, nls_1.localize)('loading', "Loading..."),
                            precondition: contextkey_1.ContextKeyExpr.false()
                        }
                    });
                }
            }));
        }
        _registerActions() {
            this._register((0, actions_1.registerAction2)(signOutOfAccountAction_1.SignOutOfAccountAction));
            this._register((0, actions_1.registerAction2)(manageTrustedExtensionsForAccountAction_1.ManageTrustedExtensionsForAccountAction));
        }
    };
    exports.AuthenticationContribution = AuthenticationContribution;
    exports.AuthenticationContribution = AuthenticationContribution = __decorate([
        __param(0, authentication_1.IAuthenticationService),
        __param(1, environmentService_1.IBrowserWorkbenchEnvironmentService)
    ], AuthenticationContribution);
    (0, contributions_1.registerWorkbenchContribution2)(AuthenticationContribution.ID, AuthenticationContribution, 3 /* WorkbenchPhase.AfterRestored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb24uY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9hdXRoZW50aWNhdGlvbi9icm93c2VyL2F1dGhlbnRpY2F0aW9uLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQmhHLE1BQU0sd0JBQXdCLEdBQUcsMkJBQWdCLENBQUMsZUFBZSxDQUFDLHlDQUF5QyxFQUFFLFVBQVUsUUFBUSxFQUFFLENBQUM7UUFDakksTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdEQUFtQyxDQUFDLENBQUM7UUFDN0UsT0FBTyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsMEJBQTBCLENBQUM7SUFDL0QsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLDhCQUE4QixHQUFnQjtRQUNuRCxJQUFJLEVBQUUsUUFBUTtRQUNkLG9CQUFvQixFQUFFLEtBQUs7UUFDM0IsVUFBVSxFQUFFO1lBQ1gsRUFBRSxFQUFFO2dCQUNILElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSx3Q0FBd0MsQ0FBQzthQUNwRjtZQUNELEtBQUssRUFBRTtnQkFDTixJQUFJLEVBQUUsUUFBUTtnQkFDZCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUseURBQXlELENBQUM7YUFDeEc7U0FDRDtLQUNELENBQUM7SUFFRixNQUFNLHNCQUFzQixHQUFHLHVDQUFrQixDQUFDLHNCQUFzQixDQUFzQztRQUM3RyxjQUFjLEVBQUUsZ0JBQWdCO1FBQ2hDLFVBQVUsRUFBRTtZQUNYLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSw4QkFBOEIsRUFB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