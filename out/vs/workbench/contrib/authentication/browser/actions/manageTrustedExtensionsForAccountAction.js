/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/date", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/dialogs/common/dialogs", "vs/platform/product/common/productService", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/authentication/browser/authenticationAccessService", "vs/workbench/services/authentication/browser/authenticationUsageService", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/extensions/common/extensions"], function (require, exports, date_1, lifecycle_1, nls_1, actions_1, dialogs_1, productService_1, quickInput_1, authenticationAccessService_1, authenticationUsageService_1, authentication_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ManageTrustedExtensionsForAccountAction = void 0;
    class ManageTrustedExtensionsForAccountAction extends actions_1.Action2 {
        constructor() {
            super({
                id: '_manageTrustedExtensionsForAccount',
                title: (0, nls_1.localize2)('manageTrustedExtensionsForAccount', "Manage Trusted Extensions For Account"),
                category: (0, nls_1.localize2)('accounts', "Accounts"),
                f1: true
            });
        }
        async run(accessor, options) {
            const productService = accessor.get(productService_1.IProductService);
            const extensionService = accessor.get(extensions_1.IExtensionService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const authenticationService = accessor.get(authentication_1.IAuthenticationService);
            const authenticationUsageService = accessor.get(authenticationUsageService_1.IAuthenticationUsageService);
            const authenticationAccessService = accessor.get(authenticationAccessService_1.IAuthenticationAccessService);
            let providerId = options?.providerId;
            let accountLabel = options?.accountLabel;
            if (!providerId || !accountLabel) {
                const accounts = new Array();
                for (const id of authenticationService.getProviderIds()) {
                    const providerLabel = authenticationService.getProvider(id).label;
                    const sessions = await authenticationService.getSessions(id);
                    const uniqueAccountLabels = new Set();
                    for (const session of sessions) {
                        if (!uniqueAccountLabels.has(session.account.label)) {
                            uniqueAccountLabels.add(session.account.label);
                            accounts.push({ providerId: id, providerLabel, accountLabel: session.account.label });
                        }
                    }
                }
                const pick = await quickInputService.pick(accounts.map(account => ({
                    providerId: account.providerId,
                    label: account.accountLabel,
                    description: account.providerLabel
                })), {
                    placeHolder: (0, nls_1.localize)('pickAccount', "Pick an account to manage trusted extensions for"),
                    matchOnDescription: true,
                });
                if (pick) {
                    providerId = pick.providerId;
                    accountLabel = pick.label;
                }
                else {
                    return;
                }
            }
            const allowedExtensions = authenticationAccessService.readAllowedExtensions(providerId, accountLabel);
            const trustedExtensionAuthAccess = productService.trustedExtensionAuthAccess;
            const trustedExtensionIds = 
            // Case 1: trustedExtensionAuthAccess is an array
            Array.isArray(trustedExtensionAuthAccess)
                ? trustedExtensionAuthAccess
                // Case 2: trustedExtensionAuthAccess is an object
                : typeof trustedExtensionAuthAccess === 'object'
                    ? trustedExtensionAuthAccess[providerId] ?? []
                    : [];
            for (const extensionId of trustedExtensionIds) {
                const allowedExtension = allowedExtensions.find(ext => ext.id === extensionId);
                if (!allowedExtension) {
                    // Add the extension to the allowedExtensions list
                    const extension = await extensionService.getExtension(extensionId);
                    if (extension) {
                        allowedExtensions.push({
                            id: extensionId,
                            name: extension.displayName || extension.name,
                            allowed: true,
                            trusted: true
                        });
                    }
                }
                else {
                    // Update the extension to be allowed
                    allowedExtension.allowed = true;
                    allowedExtension.trusted = true;
                }
            }
            if (!allowedExtensions.length) {
                dialogService.info((0, nls_1.localize)('noTrustedExtensions', "This account has not been used by any extensions."));
                return;
            }
            const disposableStore = new lifecycle_1.DisposableStore();
            const quickPick = disposableStore.add(quickInputService.createQuickPick());
            quickPick.canSelectMany = true;
            quickPick.customButton = true;
            quickPick.customLabel = (0, nls_1.localize)('manageTrustedExtensions.cancel', 'Cancel');
            const usages = authenticationUsageService.readAccountUsages(providerId, accountLabel);
            const trustedExtensions = [];
            const otherExtensions = [];
            for (const extension of allowedExtensions) {
                const usage = usages.find(usage => extension.id === usage.extensionId);
                extension.lastUsed = usage?.lastUsed;
                if (extension.trusted) {
                    trustedExtensions.push(extension);
                }
                else {
                    otherExtensions.push(extension);
                }
            }
            const sortByLastUsed = (a, b) => (b.lastUsed || 0) - (a.lastUsed || 0);
            const toQuickPickItem = function (extension) {
                const lastUsed = extension.lastUsed;
                const description = lastUsed
                    ? (0, nls_1.localize)({ key: 'accountLastUsedDate', comment: ['The placeholder {0} is a string with time information, such as "3 days ago"'] }, "Last used this account {0}", (0, date_1.fromNow)(lastUsed, true))
                    : (0, nls_1.localize)('notUsed', "Has not used this account");
                let tooltip;
                let disabled;
                if (extension.trusted) {
                    tooltip = (0, nls_1.localize)('trustedExtensionTooltip', "This extension is trusted by Microsoft and\nalways has access to this account");
                    disabled = true;
                }
                return {
                    label: extension.name,
                    extension,
                    description,
                    tooltip,
                    disabled,
                    picked: extension.allowed === undefined || extension.allowed
                };
            };
            const items = [
                ...otherExtensions.sort(sortByLastUsed).map(toQuickPickItem),
                { type: 'separator', label: (0, nls_1.localize)('trustedExtensions', "Trusted by Microsoft") },
                ...trustedExtensions.sort(sortByLastUsed).map(toQuickPickItem)
            ];
            quickPick.items = items;
            quickPick.selectedItems = items.filter((item) => item.type !== 'separator' && (item.extension.allowed === undefined || item.extension.allowed));
            quickPick.title = (0, nls_1.localize)('manageTrustedExtensions', "Manage Trusted Extensions");
            quickPick.placeholder = (0, nls_1.localize)('manageExtensions', "Choose which extensions can access this account");
            disposableStore.add(quickPick.onDidAccept(() => {
                const updatedAllowedList = quickPick.items
                    .filter((item) => item.type !== 'separator')
                    .map(i => i.extension);
                const allowedExtensionsSet = new Set(quickPick.selectedItems.map(i => i.extension));
                updatedAllowedList.forEach(extension => {
                    extension.allowed = allowedExtensionsSet.has(extension);
                });
                authenticationAccessService.updateAllowedExtensions(providerId, accountLabel, updatedAllowedList);
                quickPick.hide();
            }));
            disposableStore.add(quickPick.onDidHide(() => {
                disposableStore.dispose();
            }));
            disposableStore.add(quickPick.onDidCustom(() => {
                quickPick.hide();
            }));
            quickPick.show();
        }
    }
    exports.ManageTrustedExtensionsForAccountAction = ManageTrustedExtensionsForAccountAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuYWdlVHJ1c3RlZEV4dGVuc2lvbnNGb3JBY2NvdW50QWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9hdXRoZW50aWNhdGlvbi9icm93c2VyL2FjdGlvbnMvbWFuYWdlVHJ1c3RlZEV4dGVuc2lvbnNGb3JBY2NvdW50QWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVoRyxNQUFhLHVDQUF3QyxTQUFRLGlCQUFPO1FBQ25FO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxvQ0FBb0M7Z0JBQ3hDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxtQ0FBbUMsRUFBRSx1Q0FBdUMsQ0FBQztnQkFDOUYsUUFBUSxFQUFFLElBQUEsZUFBUyxFQUFDLFVBQVUsRUFBRSxVQUFVLENBQUM7Z0JBQzNDLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEIsRUFBRSxPQUFzRDtZQUNwRyxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLGdDQUFlLENBQUMsQ0FBQztZQUNyRCxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWlCLENBQUMsQ0FBQztZQUN6RCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUFjLENBQUMsQ0FBQztZQUNuRCxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQztZQUMzRCxNQUFNLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUNBQXNCLENBQUMsQ0FBQztZQUNuRSxNQUFNLDBCQUEwQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0RBQTJC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