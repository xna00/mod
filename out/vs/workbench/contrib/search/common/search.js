/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/platform/workspace/common/workspace", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/base/common/cancellation", "vs/platform/files/common/files", "vs/editor/common/core/range", "vs/base/common/types", "vs/platform/contextkey/common/contextkey", "vs/base/common/strings", "vs/base/common/arrays"], function (require, exports, errors_1, workspace_1, editor_1, editorService_1, cancellation_1, files_1, range_1, types_1, contextkey_1, strings_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchStateKey = exports.SearchUIState = exports.WorkspaceSymbolItem = exports.WorkspaceSymbolProviderRegistry = void 0;
    exports.getWorkspaceSymbols = getWorkspaceSymbols;
    exports.getOutOfWorkspaceEditorResources = getOutOfWorkspaceEditorResources;
    exports.extractRangeFromFilter = extractRangeFromFilter;
    var WorkspaceSymbolProviderRegistry;
    (function (WorkspaceSymbolProviderRegistry) {
        const _supports = [];
        function register(provider) {
            let support = provider;
            if (support) {
                _supports.push(support);
            }
            return {
                dispose() {
                    if (support) {
                        const idx = _supports.indexOf(support);
                        if (idx >= 0) {
                            _supports.splice(idx, 1);
                            support = undefined;
                        }
                    }
                }
            };
        }
        WorkspaceSymbolProviderRegistry.register = register;
        function all() {
            return _supports.slice(0);
        }
        WorkspaceSymbolProviderRegistry.all = all;
    })(WorkspaceSymbolProviderRegistry || (exports.WorkspaceSymbolProviderRegistry = WorkspaceSymbolProviderRegistry = {}));
    class WorkspaceSymbolItem {
        constructor(symbol, provider) {
            this.symbol = symbol;
            this.provider = provider;
        }
    }
    exports.WorkspaceSymbolItem = WorkspaceSymbolItem;
    async function getWorkspaceSymbols(query, token = cancellation_1.CancellationToken.None) {
        const all = [];
        const promises = WorkspaceSymbolProviderRegistry.all().map(async (provider) => {
            try {
                const value = await provider.provideWorkspaceSymbols(query, token);
                if (!value) {
                    return;
                }
                for (const symbol of value) {
                    all.push(new WorkspaceSymbolItem(symbol, provider));
                }
            }
            catch (err) {
                (0, errors_1.onUnexpectedExternalError)(err);
            }
        });
        await Promise.all(promises);
        if (token.isCancellationRequested) {
            return [];
        }
        // de-duplicate entries
        function compareItems(a, b) {
            let res = (0, strings_1.compare)(a.symbol.name, b.symbol.name);
            if (res === 0) {
                res = a.symbol.kind - b.symbol.kind;
            }
            if (res === 0) {
                res = (0, strings_1.compare)(a.symbol.location.uri.toString(), b.symbol.location.uri.toString());
            }
            if (res === 0) {
                if (a.symbol.location.range && b.symbol.location.range) {
                    if (!range_1.Range.areIntersecting(a.symbol.location.range, b.symbol.location.range)) {
                        res = range_1.Range.compareRangesUsingStarts(a.symbol.location.range, b.symbol.location.range);
                    }
                }
                else if (a.provider.resolveWorkspaceSymbol && !b.provider.resolveWorkspaceSymbol) {
                    res = -1;
                }
                else if (!a.provider.resolveWorkspaceSymbol && b.provider.resolveWorkspaceSymbol) {
                    res = 1;
                }
            }
            if (res === 0) {
                res = (0, strings_1.compare)(a.symbol.containerName ?? '', b.symbol.containerName ?? '');
            }
            return res;
        }
        return (0, arrays_1.groupBy)(all, compareItems).map(group => group[0]).flat();
    }
    /**
     * Helper to return all opened editors with resources not belonging to the currently opened workspace.
     */
    function getOutOfWorkspaceEditorResources(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const contextService = accessor.get(workspace_1.IWorkspaceContextService);
        const fileService = accessor.get(files_1.IFileService);
        const resources = editorService.editors
            .map(editor => editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }))
            .filter(resource => !!resource && !contextService.isInsideWorkspace(resource) && fileService.hasProvider(resource));
        return resources;
    }
    // Supports patterns of <path><#|:|(><line><#|:|,><col?><:?>
    const LINE_COLON_PATTERN = /\s?[#:\(](?:line )?(\d*)(?:[#:,](\d*))?\)?:?\s*$/;
    function extractRangeFromFilter(filter, unless) {
        // Ignore when the unless character not the first character or is before the line colon pattern
        if (!filter || unless?.some(value => {
            const unlessCharPos = filter.indexOf(value);
            return unlessCharPos === 0 || unlessCharPos > 0 && !LINE_COLON_PATTERN.test(filter.substring(unlessCharPos + 1));
        })) {
            return undefined;
        }
        let range = undefined;
        // Find Line/Column number from search value using RegExp
        const patternMatch = LINE_COLON_PATTERN.exec(filter);
        if (patternMatch) {
            const startLineNumber = parseInt(patternMatch[1] ?? '', 10);
            // Line Number
            if ((0, types_1.isNumber)(startLineNumber)) {
                range = {
                    startLineNumber: startLineNumber,
                    startColumn: 1,
                    endLineNumber: startLineNumber,
                    endColumn: 1
                };
                // Column Number
                const startColumn = parseInt(patternMatch[2] ?? '', 10);
                if ((0, types_1.isNumber)(startColumn)) {
                    range = {
                        startLineNumber: range.startLineNumber,
                        startColumn: startColumn,
                        endLineNumber: range.endLineNumber,
                        endColumn: startColumn
                    };
                }
            }
            // User has typed "something:" or "something#" without a line number, in this case treat as start of file
            else if (patternMatch[1] === '') {
                range = {
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: 1,
                    endColumn: 1
                };
            }
        }
        if (patternMatch && range) {
            return {
                filter: filter.substr(0, patternMatch.index), // clear range suffix from search value
                range
            };
        }
        return undefined;
    }
    var SearchUIState;
    (function (SearchUIState) {
        SearchUIState[SearchUIState["Idle"] = 0] = "Idle";
        SearchUIState[SearchUIState["Searching"] = 1] = "Searching";
        SearchUIState[SearchUIState["SlowSearch"] = 2] = "SlowSearch";
    })(SearchUIState || (exports.SearchUIState = SearchUIState = {}));
    exports.SearchStateKey = new contextkey_1.RawContextKey('searchState', SearchUIState.Idle);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvY29tbW9uL3NlYXJjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnRWhHLGtEQW9EQztJQW1CRCw0RUFVQztJQVVELHdEQXlEQztJQXBMRCxJQUFpQiwrQkFBK0IsQ0EwQi9DO0lBMUJELFdBQWlCLCtCQUErQjtRQUUvQyxNQUFNLFNBQVMsR0FBK0IsRUFBRSxDQUFDO1FBRWpELFNBQWdCLFFBQVEsQ0FBQyxRQUFrQztZQUMxRCxJQUFJLE9BQU8sR0FBeUMsUUFBUSxDQUFDO1lBQzdELElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2IsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6QixDQUFDO1lBRUQsT0FBTztnQkFDTixPQUFPO29CQUNOLElBQUksT0FBTyxFQUFFLENBQUM7d0JBQ2IsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDdkMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7NEJBQ2QsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQ3pCLE9BQU8sR0FBRyxTQUFTLENBQUM7d0JBQ3JCLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO2FBQ0QsQ0FBQztRQUNILENBQUM7UUFqQmUsd0NBQVEsV0FpQnZCLENBQUE7UUFFRCxTQUFnQixHQUFHO1lBQ2xCLE9BQU8sU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBRmUsbUNBQUcsTUFFbEIsQ0FBQTtJQUNGLENBQUMsRUExQmdCLCtCQUErQiwrQ0FBL0IsK0JBQStCLFFBMEIvQztJQUVELE1B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