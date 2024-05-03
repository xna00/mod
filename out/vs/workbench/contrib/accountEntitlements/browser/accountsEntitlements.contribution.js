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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/authentication/common/authentication", "vs/platform/actions/common/actions", "vs/workbench/services/activity/common/activity", "vs/platform/product/common/productService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensions/common/extensions", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/request/common/request", "vs/base/common/cancellation", "vs/platform/dialogs/common/dialogs", "vs/base/common/platform", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, platform_1, contributions_1, lifecycle_1, contextkey_1, commands_1, telemetry_1, authentication_1, actions_1, activity_1, productService_1, extensionManagement_1, extensions_1, storage_1, extensions_2, configurationRegistry_1, configuration_1, nls_1, configuration_2, request_1, cancellation_1, dialogs_1, platform_2, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const accountsBadgeConfigKey = 'workbench.accounts.experimental.showEntitlements';
    const chatWelcomeViewConfigKey = 'workbench.chat.experimental.showWelcomeView';
    let EntitlementsContribution = class EntitlementsContribution extends lifecycle_1.Disposable {
        constructor(contextService, commandService, telemetryService, authenticationService, productService, storageService, extensionManagementService, activityService, extensionService, configurationService, requestService) {
            super();
            this.contextService = contextService;
            this.commandService = commandService;
            this.telemetryService = telemetryService;
            this.authenticationService = authenticationService;
            this.productService = productService;
            this.storageService = storageService;
            this.extensionManagementService = extensionManagementService;
            this.activityService = activityService;
            this.extensionService = extensionService;
            this.configurationService = configurationService;
            this.requestService = requestService;
            this.isInitialized = false;
            this.showAccountsBadgeContextKey = new contextkey_1.RawContextKey(accountsBadgeConfigKey, false).bindTo(this.contextService);
            this.showChatWelcomeViewContextKey = new contextkey_1.RawContextKey(chatWelcomeViewConfigKey, false).bindTo(this.contextService);
            this.accountsMenuBadgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            if (!this.productService.gitHubEntitlement || platform_2.isWeb) {
                return;
            }
            this.extensionManagementService.getInstalled().then(async (exts) => {
                const installed = exts.find(value => extensions_1.ExtensionIdentifier.equals(value.identifier.id, this.productService.gitHubEntitlement.extensionId));
                if (installed) {
                    this.disableEntitlements();
                }
                else {
                    this.registerListeners();
                }
            });
        }
        registerListeners() {
            this._register(this.extensionService.onDidChangeExtensions(async (result) => {
                for (const ext of result.added) {
                    if (extensions_1.ExtensionIdentifier.equals(this.productService.gitHubEntitlement.extensionId, ext.identifier)) {
                        this.disableEntitlements();
                        return;
                    }
                }
            }));
            this._register(this.authenticationService.onDidChangeSessions(async (e) => {
                if (e.providerId === this.productService.gitHubEntitlement.providerId && e.event.added?.length) {
                    await this.enableEntitlements(e.event.added[0]);
                }
                else if (e.providerId === this.productService.gitHubEntitlement.providerId && e.event.removed?.length) {
                    this.showAccountsBadgeContextKey.set(false);
                    this.showChatWelcomeViewContextKey.set(false);
                    this.accountsMenuBadgeDisposable.clear();
                }
            }));
            this._register(this.authenticationService.onDidRegisterAuthenticationProvider(async (e) => {
                if (e.id === this.productService.gitHubEntitlement.providerId) {
                    await this.enableEntitlements((await this.authenticationService.getSessions(e.id))[0]);
                }
            }));
        }
        async getEntitlementsInfo(session) {
            if (this.isInitialized) {
                return [false, ''];
            }
            const context = await this.requestService.request({
                type: 'GET',
                url: this.productService.gitHubEntitlement.entitlementUrl,
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            }, cancellation_1.CancellationToken.None);
            if (context.res.statusCode && context.res.statusCode !== 200) {
                return [false, ''];
            }
            const result = await (0, request_1.asText)(context);
            if (!result) {
                return [false, ''];
            }
            let parsedResult;
            try {
                parsedResult = JSON.parse(result);
            }
            catch (err) {
                //ignore
                return [false, ''];
            }
            if (!(this.productService.gitHubEntitlement.enablementKey in parsedResult) || !parsedResult[this.productService.gitHubEntitlement.enablementKey]) {
                this.telemetryService.publicLog2('entitlements.enabled', { enabled: false });
                return [false, ''];
            }
            this.telemetryService.publicLog2('entitlements.enabled', { enabled: true });
            this.isInitialized = true;
            const orgs = parsedResult['organization_login_list'];
            return [true, orgs ? orgs[orgs.length - 1] : undefined];
        }
        async enableEntitlements(session) {
            const isInternal = (0, telemetryUtils_1.isInternalTelemetry)(this.productService, this.configurationService);
            const showAccountsBadge = this.configurationService.inspect(accountsBadgeConfigKey).value ?? false;
            const showWelcomeView = this.configurationService.inspect(chatWelcomeViewConfigKey).value ?? false;
            const [enabled, org] = await this.getEntitlementsInfo(session);
            if (enabled) {
                if (isInternal && showWelcomeView) {
                    this.showChatWelcomeViewContextKey.set(true);
                    this.telemetryService.publicLog2(chatWelcomeViewConfigKey, { enabled: true });
                }
                if (showAccountsBadge) {
                    this.createAccountsBadge(org);
                    this.showAccountsBadgeContextKey.set(showAccountsBadge);
                    this.telemetryService.publicLog2(accountsBadgeConfigKey, { enabled: true });
                }
            }
        }
        disableEntitlements() {
            this.storageService.store(accountsBadgeConfigKey, false, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            this.storageService.store(chatWelcomeViewConfigKey, false, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            this.showAccountsBadgeContextKey.set(false);
            this.showChatWelcomeViewContextKey.set(false);
            this.accountsMenuBadgeDisposable.clear();
        }
        async createAccountsBadge(org) {
            const menuTitle = org ? this.productService.gitHubEntitlement.command.title.replace('{{org}}', org) : this.productService.gitHubEntitlement.command.titleWithoutPlaceHolder;
            const badge = new activity_1.NumberBadge(1, () => menuTitle);
            this.accountsMenuBadgeDisposable.value = this.activityService.showAccountsActivity({ badge, });
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.entitlementAction',
                        title: menuTitle,
                        f1: false,
                        menu: {
                            id: actions_1.MenuId.AccountsContext,
                            group: '5_AccountsEntitlements',
                            when: contextkey_1.ContextKeyExpr.equals(accountsBadgeConfigKey, true),
                        }
                    });
                }
                async run(accessor) {
                    const productService = accessor.get(productService_1.IProductService);
                    const commandService = accessor.get(commands_1.ICommandService);
                    const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
                    const storageService = accessor.get(storage_1.IStorageService);
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const telemetryService = accessor.get(telemetry_1.ITelemetryService);
                    const confirmation = await dialogService.confirm({
                        type: 'question',
                        message: productService.gitHubEntitlement.confirmationMessage,
                        primaryButton: productService.gitHubEntitlement.confirmationAction,
                    });
                    if (confirmation.confirmed) {
                        commandService.executeCommand(productService.gitHubEntitlement.command.action, productService.gitHubEntitlement.extensionId);
                        telemetryService.publicLog2('accountsEntitlements.action', {
                            command: productService.gitHubEntitlement.command.action,
                        });
                    }
                    else {
                        telemetryService.publicLog2('accountsEntitlements.action', {
                            command: productService.gitHubEntitlement.command.action + '-dismissed',
                        });
                    }
                    const contextKey = new contextkey_1.RawContextKey(accountsBadgeConfigKey, true).bindTo(contextKeyService);
                    contextKey.set(false);
                    storageService.store(accountsBadgeConfigKey, false, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                }
            }));
        }
    };
    EntitlementsContribution = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, commands_1.ICommandService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, authentication_1.IAuthenticationService),
        __param(4, productService_1.IProductService),
        __param(5, storage_1.IStorageService),
        __param(6, extensionManagement_1.IExtensionManagementService),
        __param(7, activity_1.IActivityService),
        __param(8, extensions_2.IExtensionService),
        __param(9, configuration_2.IConfigurationService),
        __param(10, request_1.IRequestService)
    ], EntitlementsContribution);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        ...configuration_1.applicationConfigurationNodeBase,
        properties: {
            'workbench.accounts.experimental.showEntitlements': {
                scope: 2 /* ConfigurationScope.MACHINE */,
                type: 'boolean',
                default: false,
                tags: ['experimental'],
                description: (0, nls_1.localize)('workbench.accounts.showEntitlements', "When enabled, available entitlements for the account will be show in the accounts menu.")
            }
        }
    });
    configurationRegistry.registerConfiguration({
        ...configuration_1.applicationConfigurationNodeBase,
        properties: {
            'workbench.chat.experimental.showWelcomeView': {
                scope: 2 /* ConfigurationScope.MACHINE */,
                type: 'boolean',
                default: false,
                tags: ['experimental'],
                description: (0, nls_1.localize)('workbench.chat.showWelcomeView', "When enabled, the chat panel welcome view will be shown.")
            }
        }
    });
    (0, contributions_1.registerWorkbenchContribution2)('workbench.contrib.entitlements', EntitlementsContribution, 2 /* WorkbenchPhase.BlockRestore */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3VudHNFbnRpdGxlbWVudHMuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9hY2NvdW50RW50aXRsZW1lbnRzL2Jyb3dzZXIvYWNjb3VudHNFbnRpdGxlbWVudHMuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBMkJoRyxNQUFNLHNCQUFzQixHQUFHLGtEQUFrRCxDQUFDO0lBQ2xGLE1BQU0sd0JBQXdCLEdBQUcsNkNBQTZDLENBQUM7SUFjL0UsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTtRQU9oRCxZQUNxQixjQUEyQyxFQUM5QyxjQUF3QyxFQUN0QyxnQkFBNEMsRUFDdkMscUJBQXNELEVBQzdELGNBQXdDLEVBQ3hDLGNBQXdDLEVBQzVCLDBCQUFnRSxFQUMzRSxlQUEwQyxFQUN6QyxnQkFBNEMsRUFDeEMsb0JBQW9ELEVBQzFELGNBQXdDO1lBQ3pELEtBQUssRUFBRSxDQUFDO1lBWHFCLG1CQUFjLEdBQWQsY0FBYyxDQUFvQjtZQUNyQyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDN0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUM5QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQ3BELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUMvQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbkIsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUNsRSxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDaEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUMvQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2pELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQWhCbEQsa0JB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