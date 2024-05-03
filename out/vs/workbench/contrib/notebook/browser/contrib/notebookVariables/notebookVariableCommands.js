/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/uri", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService"], function (require, exports, cancellation_1, uri_1, nls_1, actions_1, clipboardService_1, notebookKernelService_1, notebookService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.COPY_NOTEBOOK_VARIABLE_VALUE_LABEL = exports.COPY_NOTEBOOK_VARIABLE_VALUE_ID = void 0;
    exports.COPY_NOTEBOOK_VARIABLE_VALUE_ID = 'workbench.debug.viewlet.action.copyWorkspaceVariableValue';
    exports.COPY_NOTEBOOK_VARIABLE_VALUE_LABEL = (0, nls_1.localize)('copyWorkspaceVariableValue', "Copy Value");
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: exports.COPY_NOTEBOOK_VARIABLE_VALUE_ID,
                title: exports.COPY_NOTEBOOK_VARIABLE_VALUE_LABEL,
                f1: false,
            });
        }
        run(accessor, context) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            if (context.value) {
                clipboardService.writeText(context.value);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: '_executeNotebookVariableProvider',
                title: (0, nls_1.localize)('executeNotebookVariableProvider', "Execute Notebook Variable Provider"),
                f1: false,
            });
        }
        async run(accessor, resource) {
            if (!resource) {
                return [];
            }
            const uri = uri_1.URI.revive(resource);
            const notebookKernelService = accessor.get(notebookKernelService_1.INotebookKernelService);
            const notebookService = accessor.get(notebookService_1.INotebookService);
            const notebookTextModel = notebookService.getNotebookTextModel(uri);
            if (!notebookTextModel) {
                return [];
            }
            const selectedKernel = notebookKernelService.getMatchingKernel(notebookTextModel).selected;
            if (selectedKernel && selectedKernel.hasVariableProvider) {
                const variables = selectedKernel.provideVariables(notebookTextModel.uri, undefined, 'named', 0, cancellation_1.CancellationToken.None);
                return await variables
                    .map(variable => { return variable; })
                    .toPromise();
            }
            return [];
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tWYXJpYWJsZUNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvbm90ZWJvb2tWYXJpYWJsZXMvbm90ZWJvb2tWYXJpYWJsZUNvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVluRixRQUFBLCtCQUErQixHQUFHLDJEQUEyRCxDQUFDO0lBQzlGLFFBQUEsa0NBQWtDLEdBQUcsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDdkcsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxpQkFBTztRQUNwQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsdUNBQStCO2dCQUNuQyxLQUFLLEVBQUUsMENBQWtDO2dCQUN6QyxFQUFFLEVBQUUsS0FBSzthQUNULENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxHQUFHLENBQUMsUUFBMEIsRUFBRSxPQUF1QjtZQUN0RCxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsb0NBQWlCLENBQUMsQ0FBQztZQUV6RCxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDbkIsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQyxDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUMsQ0FBQztJQUdILElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsaUJBQU87UUFDcEM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGtDQUFrQztnQkFDdEMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGlDQUFpQyxFQUFFLG9DQUFvQyxDQUFDO2dCQUN4RixFQUFFLEVBQUUsS0FBSzthQUNULENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCLEVBQUUsUUFBbUM7WUFDeEUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNmLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUVELE1BQU0sR0FBRyxHQUFHLFNBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakMsTUFBTSxxQkFBcUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhDQUFzQixDQUFDLENBQUM7WUFDbkUsTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxrQ0FBZ0IsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0saUJBQWlCLEdBQUcsZUFBZSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXBFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUN4QixPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxNQUFNLGNBQWMsR0FBRyxxQkFBcUIsQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUMzRixJQUFJLGNBQWMsSUFBSSxjQUFjLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDMUQsTUFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEgsT0FBTyxNQUFNLFNBQVM7cUJBQ3BCLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUNyQyxTQUFTLEVBQUUsQ0FBQztZQUNmLENBQUM7WUFFRCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7S0FDRCxDQUFDLENBQUMifQ==