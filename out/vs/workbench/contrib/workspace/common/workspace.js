/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MANAGE_TRUST_COMMAND_ID = exports.WorkspaceTrustContext = void 0;
    /**
     * Trust Context Keys
     */
    exports.WorkspaceTrustContext = {
        IsEnabled: new contextkey_1.RawContextKey('isWorkspaceTrustEnabled', false, (0, nls_1.localize)('workspaceTrustEnabledCtx', "Whether the workspace trust feature is enabled.")),
        IsTrusted: new contextkey_1.RawContextKey('isWorkspaceTrusted', false, (0, nls_1.localize)('workspaceTrustedCtx', "Whether the current workspace has been trusted by the user."))
    };
    exports.MANAGE_TRUST_COMMAND_ID = 'workbench.trust.manage';
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93b3Jrc3BhY2UvY29tbW9uL3dvcmtzcGFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEc7O09BRUc7SUFFVSxRQUFBLHFCQUFxQixHQUFHO1FBQ3BDLFNBQVMsRUFBRSxJQUFJLDBCQUFhLENBQVUseUJBQXlCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLDBCQUEwQixFQUFFLGlEQUFpRCxDQUFDLENBQUM7UUFDaEssU0FBUyxFQUFFLElBQUksMEJBQWEsQ0FBVSxvQkFBb0IsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsNkRBQTZELENBQUMsQ0FBQztLQUNsSyxDQUFDO0lBRVcsUUFBQSx1QkFBdUIsR0FBRyx3QkFBd0IsQ0FBQyJ9