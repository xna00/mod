/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/severity", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/authentication/browser/authenticationAccessService", "vs/workbench/services/authentication/browser/authenticationUsageService", "vs/workbench/services/authentication/common/authentication"], function (require, exports, severity_1, nls_1, actions_1, dialogs_1, authenticationAccessService_1, authenticationUsageService_1, authentication_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SignOutOfAccountAction = void 0;
    class SignOutOfAccountAction extends actions_1.Action2 {
        constructor() {
            super({
                id: '_signOutOfAccount',
                title: (0, nls_1.localize)('signOutOfAccount', "Sign out of account"),
                f1: false
            });
        }
        async run(accessor, { providerId, accountLabel }) {
            const authenticationService = accessor.get(authentication_1.IAuthenticationService);
            const authenticationUsageService = accessor.get(authenticationUsageService_1.IAuthenticationUsageService);
            const authenticationAccessService = accessor.get(authenticationAccessService_1.IAuthenticationAccessService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            if (!providerId || !accountLabel) {
                throw new Error('Invalid arguments. Expected: { providerId: string; accountLabel: string }');
            }
            const allSessions = await authenticationService.getSessions(providerId);
            const sessions = allSessions.filter(s => s.account.label === accountLabel);
            const accountUsages = authenticationUsageService.readAccountUsages(providerId, accountLabel);
            const { confirmed } = await dialogService.confirm({
                type: severity_1.default.Info,
                message: accountUsages.length
                    ? (0, nls_1.localize)('signOutMessage', "The account '{0}' has been used by: \n\n{1}\n\n Sign out from these extensions?", accountLabel, accountUsages.map(usage => usage.extensionName).join('\n'))
                    : (0, nls_1.localize)('signOutMessageSimple', "Sign out of '{0}'?", accountLabel),
                primaryButton: (0, nls_1.localize)({ key: 'signOut', comment: ['&& denotes a mnemonic'] }, "&&Sign Out")
            });
            if (confirmed) {
                const removeSessionPromises = sessions.map(session => authenticationService.removeSession(providerId, session.id));
                await Promise.all(removeSessionPromises);
                authenticationUsageService.removeAccountUsage(providerId, accountLabel);
                authenticationAccessService.removeAllowedExtensions(providerId, accountLabel);
            }
        }
    }
    exports.SignOutOfAccountAction = SignOutOfAccountAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbk91dE9mQWNjb3VudEFjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYXV0aGVudGljYXRpb24vYnJvd3Nlci9hY3Rpb25zL3NpZ25PdXRPZkFjY291bnRBY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLE1BQWEsc0JBQXVCLFNBQVEsaUJBQU87UUFDbEQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLG1CQUFtQjtnQkFDdkIsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLHFCQUFxQixDQUFDO2dCQUMxRCxFQUFFLEVBQUUsS0FBSzthQUNULENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCLEVBQUUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFnRDtZQUN4SCxNQUFNLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUNBQXNCLENBQUMsQ0FBQztZQUNuRSxNQUFNLDBCQUEwQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0RBQTJCLENBQUMsQ0FBQztZQUM3RSxNQUFNLDJCQUEyQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMERBQTRCLENBQUMsQ0FBQztZQUMvRSxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUFjLENBQUMsQ0FBQztZQUVuRCxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ2xDLE1BQU0sSUFBSSxLQUFLLENBQUMsMkVBQTJFLENBQUMsQ0FBQztZQUM5RixDQUFDO1lBRUQsTUFBTSxXQUFXLEdBQUcsTUFBTSxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDeEUsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxLQUFLLFlBQVksQ0FBQyxDQUFDO1lBRTNFLE1BQU0sYUFBYSxHQUFHLDBCQUEwQixDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUU3RixNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsTUFBTSxhQUFhLENBQUMsT0FBTyxDQUFDO2dCQUNqRCxJQUFJLEVBQUUsa0JBQVEsQ0FBQyxJQUFJO2dCQUNuQixPQUFPLEVBQUUsYUFBYSxDQUFDLE1BQU07b0JBQzVCLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxpRkFBaUYsRUFBRSxZQUFZLEVBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3pMLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSxvQkFBb0IsRUFBRSxZQUFZLENBQUM7Z0JBQ3ZFLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQzthQUM3RixDQUFDLENBQUM7WUFFSCxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLE1BQU0scUJBQXFCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ILE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2dCQUN6QywwQkFBMEIsQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ3hFLDJCQUEyQixDQUFDLHVCQUF1QixDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUMvRSxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBdkNELHdEQXVDQyJ9