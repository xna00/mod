/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/nls", "vs/workbench/contrib/notebook/common/notebookKernelService"], function (require, exports, cancellation_1, nls_1, notebookKernelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookVariableDataSource = void 0;
    class NotebookVariableDataSource {
        constructor(notebookKernelService) {
            this.notebookKernelService = notebookKernelService;
            this.cancellationTokenSource = new cancellation_1.CancellationTokenSource();
        }
        hasChildren(element) {
            return element.kind === 'root' || element.hasNamedChildren || element.indexedChildrenCount > 0;
        }
        cancel() {
            this.cancellationTokenSource.cancel();
            this.cancellationTokenSource.dispose();
            this.cancellationTokenSource = new cancellation_1.CancellationTokenSource();
        }
        async getChildren(element) {
            if (element.kind === 'root') {
                return this.getRootVariables(element.notebook);
            }
            else {
                return this.getVariables(element);
            }
        }
        async getVariables(parent) {
            const selectedKernel = this.notebookKernelService.getMatchingKernel(parent.notebook).selected;
            if (selectedKernel && selectedKernel.hasVariableProvider) {
                let children = [];
                if (parent.hasNamedChildren) {
                    const variables = selectedKernel.provideVariables(parent.notebook.uri, parent.extHostId, 'named', 0, this.cancellationTokenSource.token);
                    const childNodes = await variables
                        .map(variable => { return this.createVariableElement(variable, parent.notebook); })
                        .toPromise();
                    children = children.concat(childNodes);
                }
                if (parent.indexedChildrenCount > 0) {
                    const childNodes = await this.getIndexedChildren(parent, selectedKernel);
                    children = children.concat(childNodes);
                }
                return children;
            }
            return [];
        }
        async getIndexedChildren(parent, kernel) {
            const childNodes = [];
            if (parent.indexedChildrenCount > notebookKernelService_1.variablePageSize) {
                const nestedPageSize = Math.floor(Math.max(parent.indexedChildrenCount / notebookKernelService_1.variablePageSize, 100));
                const indexedChildCountLimit = 1_000_000;
                let start = parent.indexStart ?? 0;
                const last = start + Math.min(parent.indexedChildrenCount, indexedChildCountLimit);
                for (; start < last; start += nestedPageSize) {
                    let end = start + nestedPageSize;
                    if (end > last) {
                        end = last;
                    }
                    childNodes.push({
                        kind: 'variable',
                        notebook: parent.notebook,
                        id: parent.id + `${start}`,
                        extHostId: parent.extHostId,
                        name: `[${start}..${end - 1}]`,
                        value: '',
                        indexedChildrenCount: end - start,
                        indexStart: start,
                        hasNamedChildren: false
                    });
                }
                if (parent.indexedChildrenCount > indexedChildCountLimit) {
                    childNodes.push({
                        kind: 'variable',
                        notebook: parent.notebook,
                        id: parent.id + `${last + 1}`,
                        extHostId: parent.extHostId,
                        name: (0, nls_1.localize)('notebook.indexedChildrenLimitReached', "Display limit reached"),
                        value: '',
                        indexedChildrenCount: 0,
                        hasNamedChildren: false
                    });
                }
            }
            else if (parent.indexedChildrenCount > 0) {
                const variables = kernel.provideVariables(parent.notebook.uri, parent.extHostId, 'indexed', parent.indexStart ?? 0, this.cancellationTokenSource.token);
                for await (const variable of variables) {
                    childNodes.push(this.createVariableElement(variable, parent.notebook));
                    if (childNodes.length >= notebookKernelService_1.variablePageSize) {
                        break;
                    }
                }
            }
            return childNodes;
        }
        async getRootVariables(notebook) {
            const selectedKernel = this.notebookKernelService.getMatchingKernel(notebook).selected;
            if (selectedKernel && selectedKernel.hasVariableProvider) {
                const variables = selectedKernel.provideVariables(notebook.uri, undefined, 'named', 0, this.cancellationTokenSource.token);
                return await variables
                    .map(variable => { return this.createVariableElement(variable, notebook); })
                    .toPromise();
            }
            return [];
        }
        createVariableElement(variable, notebook) {
            return {
                ...variable,
                kind: 'variable',
                notebook,
                extHostId: variable.id,
                id: `${variable.id}`
            };
        }
    }
    exports.NotebookVariableDataSource = NotebookVariableDataSource;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tWYXJpYWJsZXNEYXRhU291cmNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvbm90ZWJvb2tWYXJpYWJsZXMvbm90ZWJvb2tWYXJpYWJsZXNEYXRhU291cmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQThCaEcsTUFBYSwwQkFBMEI7UUFJdEMsWUFBNkIscUJBQTZDO1lBQTdDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUFDekUsSUFBSSxDQUFDLHVCQUF1QixHQUFHLElBQUksc0NBQXVCLEVBQUUsQ0FBQztRQUM5RCxDQUFDO1FBRUQsV0FBVyxDQUFDLE9BQWtEO1lBQzdELE9BQU8sT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLElBQUksT0FBTyxDQUFDLGdCQUFnQixJQUFJLE9BQU8sQ0FBQyxvQkFBb0IsR0FBRyxDQUFDLENBQUM7UUFDaEcsQ0FBQztRQUVNLE1BQU07WUFDWixJQUFJLENBQUMsdUJBQXVCLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDdEMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLHNDQUF1QixFQUFFLENBQUM7UUFDOUQsQ0FBQztRQUVELEtBQUssQ0FBQyxXQUFXLENBQUMsT0FBa0Q7WUFDbkUsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRSxDQUFDO2dCQUM3QixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNuQyxD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