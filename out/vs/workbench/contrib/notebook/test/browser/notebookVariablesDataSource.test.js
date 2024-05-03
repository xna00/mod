define(["require", "exports", "assert", "vs/base/common/async", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/workbench/contrib/notebook/browser/contrib/notebookVariables/notebookVariablesDataSource"], function (require, exports, assert, async_1, mock_1, utils_1, notebookVariablesDataSource_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookVariableDataSource', () => {
        let dataSource;
        const notebookModel = { uri: 'one.ipynb', languages: ['python'] };
        let provideVariablesCalled = false;
        let results = [
            { id: 1, name: 'a', value: '1', hasNamedChildren: false, indexedChildrenCount: 0 },
        ];
        const kernel = new class extends (0, mock_1.mock)() {
            constructor() {
                super(...arguments);
                this.hasVariableProvider = true;
            }
            provideVariables(notebookUri, parentId, kind, start, token) {
                provideVariablesCalled = true;
                const source = new async_1.AsyncIterableSource();
                for (let i = 0; i < results.length; i++) {
                    if (token.isCancellationRequested) {
                        break;
                    }
                    if (results[i].action) {
                        results[i].action();
                    }
                    source.emitOne(results[i]);
                }
                setTimeout(() => source.resolve(), 0);
                return source.asyncIterable;
            }
        };
        const kernelService = new class extends (0, mock_1.mock)() {
            getMatchingKernel(notebook) {
                return { selected: kernel, all: [], suggestions: [], hidden: [] };
            }
        };
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            provideVariablesCalled = false;
            dataSource = new notebookVariablesDataSource_1.NotebookVariableDataSource(kernelService);
        });
        test('Root element should return children', async () => {
            const variables = await dataSource.getChildren({ kind: 'root', notebook: notebookModel });
            assert.strictEqual(variables.length, 1);
        });
        test('Get children of list element', async () => {
            const parent = { kind: 'variable', notebook: notebookModel, id: '1', extHostId: 1, name: 'list', value: '[...]', hasNamedChildren: false, indexedChildrenCount: 5 };
            results = [
                { id: 2, name: 'first', value: '1', hasNamedChildren: false, indexedChildrenCount: 0 },
                { id: 3, name: 'second', value: '2', hasNamedChildren: false, indexedChildrenCount: 0 },
                { id: 4, name: 'third', value: '3', hasNamedChildren: false, indexedChildrenCount: 0 },
                { id: 5, name: 'fourth', value: '4', hasNamedChildren: false, indexedChildrenCount: 0 },
                { id: 6, name: 'fifth', value: '5', hasNamedChildren: false, indexedChildrenCount: 0 },
            ];
            const variables = await dataSource.getChildren(parent);
            assert.strictEqual(variables.length, 5);
        });
        test('Get children for large list', async () => {
            const parent = { kind: 'variable', notebook: notebookModel, id: '1', extHostId: 1, name: 'list', value: '[...]', hasNamedChildren: false, indexedChildrenCount: 2000 };
            results = [];
            const variables = await dataSource.getChildren(parent);
            assert(variables.length > 1, 'We should have results for groups of children');
            assert(!provideVariablesCalled, 'provideVariables should not be called');
            assert.equal(variables[0].extHostId, parent.extHostId, 'ExtHostId should match the parent since we will use it to get the real children');
        });
        test('Get children for very large list', async () => {
            const parent = { kind: 'variable', notebook: notebookModel, id: '1', extHostId: 1, name: 'list', value: '[...]', hasNamedChildren: false, indexedChildrenCount: 1_000_000 };
            results = [];
            const groups = await dataSource.getChildren(parent);
            const children = await dataSource.getChildren(groups[99]);
            assert(children.length === 100, 'We should have a full page of child groups');
            assert(!provideVariablesCalled, 'provideVariables should not be called');
            assert.equal(children[0].extHostId, parent.extHostId, 'ExtHostId should match the parent since we will use it to get the real children');
        });
        test('Cancel while enumerating through children', async () => {
            const parent = { kind: 'variable', notebook: notebookModel, id: '1', extHostId: 1, name: 'list', value: '[...]', hasNamedChildren: false, indexedChildrenCount: 10 };
            results = [
                { id: 2, name: 'first', value: '1', hasNamedChildren: false, indexedChildrenCount: 0 },
                { id: 3, name: 'second', value: '2', hasNamedChildren: false, indexedChildrenCount: 0 },
                { id: 4, name: 'third', value: '3', hasNamedChildren: false, indexedChildrenCount: 0 },
                { id: 5, name: 'fourth', value: '4', hasNamedChildren: false, indexedChildrenCount: 0 },
                { id: 5, name: 'fifth', value: '4', hasNamedChildren: false, indexedChildrenCount: 0, action: () => dataSource.cancel() },
                { id: 7, name: 'sixth', value: '6', hasNamedChildren: false, indexedChildrenCount: 0 },
                { id: 8, name: 'seventh', value: '7', hasNamedChildren: false, indexedChildrenCount: 0 },
                { id: 9, name: 'eighth', value: '8', hasNamedChildren: false, indexedChildrenCount: 0 },
                { id: 10, name: 'ninth', value: '9', hasNamedChildren: false, indexedChildrenCount: 0 },
                { id: 11, name: 'tenth', value: '10', hasNamedChildren: false, indexedChildrenCount: 0 },
            ];
            const variables = await dataSource.getChildren(parent);
            assert.equal(variables.length, 5, 'Iterating should have been cancelled');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tWYXJpYWJsZXNEYXRhU291cmNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL3Rlc3QvYnJvd3Nlci9ub3RlYm9va1ZhcmlhYmxlc0RhdGFTb3VyY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFlQSxLQUFLLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFO1FBQ3hDLElBQUksVUFBc0MsQ0FBQztRQUMzQyxNQUFNLGFBQWEsR0FBRyxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQWtDLENBQUM7UUFDbEcsSUFBSSxzQkFBc0IsR0FBRyxLQUFLLENBQUM7UUFHbkMsSUFBSSxPQUFPLEdBQWdDO1lBQzFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRTtTQUNsRixDQUFDO1FBRUYsTUFBTSxNQUFNLEdBQUcsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQW1CO1lBQXJDOztnQkFDVCx3QkFBbUIsR0FBRyxJQUFJLENBQUM7WUF1QnJDLENBQUM7WUF0QlMsZ0JBQWdCLENBQ3hCLFdBQWdCLEVBQ2hCLFFBQTRCLEVBQzVCLElBQXlCLEVBQ3pCLEtBQWEsRUFDYixLQUF3QjtnQkFFeEIsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO2dCQUM5QixNQUFNLE1BQU0sR0FBRyxJQUFJLDJCQUFtQixFQUFtQixDQUFDO2dCQUMxRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFD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