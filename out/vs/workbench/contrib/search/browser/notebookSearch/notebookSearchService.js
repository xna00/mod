var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/map", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/search/browser/notebookSearch/searchNotebookHelpers", "vs/workbench/services/search/common/search", "vs/base/common/arrays", "vs/base/common/types", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/services/search/common/queryBuilder", "vs/platform/instantiation/common/instantiation"], function (require, exports, cancellation_1, map_1, configuration_1, log_1, uriIdentity_1, notebookService_1, searchNotebookHelpers_1, search_1, arrays, types_1, editorResolverService_1, notebookEditorService_1, queryBuilder_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookSearchService = void 0;
    let NotebookSearchService = class NotebookSearchService {
        constructor(uriIdentityService, notebookEditorService, logService, notebookService, configurationService, editorResolverService, searchService, instantiationService) {
            this.uriIdentityService = uriIdentityService;
            this.notebookEditorService = notebookEditorService;
            this.logService = logService;
            this.notebookService = notebookService;
            this.configurationService = configurationService;
            this.editorResolverService = editorResolverService;
            this.searchService = searchService;
            this.queryBuilder = instantiationService.createInstance(queryBuilder_1.QueryBuilder);
        }
        notebookSearch(query, token, searchInstanceID, onProgress) {
            if (query.type !== 2 /* QueryType.Text */) {
                return {
                    openFilesToScan: new map_1.ResourceSet(),
                    completeData: Promise.resolve({
                        messages: [],
                        limitHit: false,
                        results: [],
                    }),
                    allScannedFiles: Promise.resolve(new map_1.ResourceSet()),
                };
            }
            const localNotebookWidgets = this.getLocalNotebookWidgets();
            const localNotebookFiles = localNotebookWidgets.map(widget => widget.viewModel.uri);
            const getAllResults = () => {
                const searchStart = Date.now();
                const localResultPromise = this.getLocalNotebookResults(query, token ?? cancellation_1.CancellationToken.None, localNotebookWidgets, searchInstanceID);
                const searchLocalEnd = Date.now();
                const experimentalNotebooksEnabled = this.configurationService.getValue('search').experimental?.closedNotebookRichContentResults ?? false;
                let closedResultsPromise = Promise.resolve(undefined);
                if (experimentalNotebooksEnabled) {
                    closedResultsPromise = this.getClosedNotebookResults(query, new map_1.ResourceSet(localNotebookFiles, uri => this.uriIdentityService.extUri.getComparisonKey(uri)), token ?? cancellation_1.CancellationToken.None);
                }
                const promise = Promise.all([localResultPromise, closedResultsPromise]);
                return {
                    completeData: promise.then((resolvedPromise) => {
                        const openNotebookResult = resolvedPromise[0];
                        const closedNotebookResult = resolvedPromise[1];
                        const resolved = resolvedPromise.filter((e) => !!e);
                        const resultArray = [...openNotebookResult.results.values(), ...closedNotebookResult?.results.values() ?? []];
                        const results = arrays.coalesce(resultArray);
                        if (onProgress) {
                            results.forEach(onProgress);
                        }
                        this.logService.trace(`local notebook search time | ${searchLocalEnd - searchStart}ms`);
                        return {
                            messages: [],
                            limitHit: resolved.reduce((prev, cur) => prev || cur.limitHit, false),
                            results,
                        };
                    }),
                    allScannedFiles: promise.then(resolvedPromise => {
                        const openNotebookResults = resolvedPromise[0];
                        const closedNotebookResults = resolvedPromise[1];
                        const results = arrays.coalesce([...openNotebookResults.results.keys(), ...closedNotebookResults?.results.keys() ?? []]);
                        return new map_1.ResourceSet(results, uri => this.uriIdentityService.extUri.getComparisonKey(uri));
                    })
                };
            };
            const promiseResults = getAllResults();
            return {
                openFilesToScan: new map_1.ResourceSet(localNotebookFiles),
                completeData: promiseResults.completeData,
                allScannedFiles: promiseResults.allScannedFiles
            };
        }
        async doesFileExist(includes, folderQueries, token) {
            const promises = includes.map(async (includePattern) => {
                const query = this.queryBuilder.file(folderQueries.map(e => e.folder), {
                    includePattern: includePattern.startsWith('/') ? includePattern : '**/' + includePattern, // todo: find cleaner way to ensure that globs match all appropriate filetypes
                    exists: true
                });
                return this.searchService.fileSearch(query, token).then((ret) => {
                    if (!ret.limitHit) {
                        throw Error('File not found');
                    }
                });
            });
            return Promise.any(promises).then(() => true).catch(() => false);
        }
        async getClosedNotebookResults(textQuery, scannedFiles, token) {
            const userAssociations = this.editorResolverService.getAllUserAssociations();
            const allPriorityInfo = new Map();
            const contributedNotebookTypes = this.notebookService.getContributedNotebookTypes();
            userAssociations.forEach(association => {
                // we gather the editor associations here, but cannot check them until we actually have the files that the glob matches
                // this is because longer patterns take precedence over shorter ones, and even if there is a user association that
                // specifies the exact same glob as a contributed notebook type, there might be another user association that is longer/more specific
                // that still matches the path and should therefore take more precedence.
                if (!association.filenamePattern) {
                    return;
                }
                const info = {
                    isFromSettings: true,
                    filenamePatterns: [association.filenamePattern]
                };
                const existingEntry = allPriorityInfo.get(association.viewType);
                if (existingEntry) {
                    allPriorityInfo.set(association.viewType, existingEntry.concat(info));
                }
                else {
                    allPriorityInfo.set(association.viewType, [info]);
                }
            });
            const promises = [];
            contributedNotebookTypes.forEach((notebook) => {
                if (notebook.selectors.length > 0) {
                    promises.push((async () => {
                        const includes = notebook.selectors.map((selector) => {
                            const globPattern = selector.include || selector;
                            return globPattern.toString();
                        });
                        const isInWorkspace = await this.doesFileExist(includes, textQuery.folderQueries, token);
                        if (isInWorkspace) {
                            const canResolve = await this.notebookService.canResolve(notebook.id);
                            if (!canResolve) {
                                return undefined;
                            }
                            const serializer = (await this.notebookService.withNotebookDataProvider(notebook.id)).serializer;
                            return await serializer.searchInNotebooks(textQuery, token, allPriorityInfo);
                        }
                        else {
                            return undefined;
                        }
                    })());
                }
            });
            const start = Date.now();
            const searchComplete = arrays.coalesce(await Promise.all(promises));
            const results = searchComplete.flatMap(e => e.results);
            let limitHit = searchComplete.some(e => e.limitHit);
            // results are already sorted with high priority first, filter out duplicates.
            const uniqueResults = new map_1.ResourceMap(uri => this.uriIdentityService.extUri.getComparisonKey(uri));
            let numResults = 0;
            for (const result of results) {
                if (textQuery.maxResults && numResults >= textQuery.maxResults) {
                    limitHit = true;
                    break;
                }
                if (!scannedFiles.has(result.resource) && !uniqueResults.has(result.resource)) {
                    uniqueResults.set(result.resource, result.cellResults.length > 0 ? result : null);
                    numResults++;
                }
            }
            const end = Date.now();
            this.logService.trace(`query: ${textQuery.contentPattern.pattern}`);
            this.logService.trace(`closed notebook search time | ${end - start}ms`);
            return {
                results: uniqueResults,
                limitHit
            };
        }
        async getLocalNotebookResults(query, token, widgets, searchID) {
            const localResults = new map_1.ResourceMap(uri => this.uriIdentityService.extUri.getComparisonKey(uri));
            let limitHit = false;
            for (const widget of widgets) {
                if (!widget.hasModel()) {
                    continue;
                }
                const askMax = (0, types_1.isNumber)(query.maxResults) ? query.maxResults + 1 : Number.MAX_SAFE_INTEGER;
                const uri = widget.viewModel.uri;
                if (!(0, search_1.pathIncludedInQuery)(query, uri.fsPath)) {
                    continue;
                }
                let matches = await widget
                    .find(query.contentPattern.pattern, {
                    regex: query.contentPattern.isRegExp,
                    wholeWord: query.contentPattern.isWordMatch,
                    caseSensitive: query.contentPattern.isCaseSensitive,
                    includeMarkupInput: query.contentPattern.notebookInfo?.isInNotebookMarkdownInput ?? true,
                    includeMarkupPreview: query.contentPattern.notebookInfo?.isInNotebookMarkdownPreview ?? true,
                    includeCodeInput: query.contentPattern.notebookInfo?.isInNotebookCellInput ?? true,
                    includeOutput: query.contentPattern.notebookInfo?.isInNotebookCellOutput ?? true,
                }, token, false, true, searchID);
                if (matches.length) {
                    if (askMax && matches.length >= askMax) {
                        limitHit = true;
                        matches = matches.slice(0, askMax - 1);
                    }
                    const cellResults = matches.map(match => {
                        const contentResults = (0, searchNotebookHelpers_1.contentMatchesToTextSearchMatches)(match.contentMatches, match.cell);
                        const webviewResults = (0, searchNotebookHelpers_1.webviewMatchesToTextSearchMatches)(match.webviewMatches);
                        return {
                            cell: match.cell,
                            index: match.index,
                            contentResults: contentResults,
                            webviewResults: webviewResults,
                        };
                    });
                    const fileMatch = {
                        resource: uri, cellResults: cellResults
                    };
                    localResults.set(uri, fileMatch);
                }
                else {
                    localResults.set(uri, null);
                }
            }
            return {
                results: localResults,
                limitHit
            };
        }
        getLocalNotebookWidgets() {
            const notebookWidgets = this.notebookEditorService.retrieveAllExistingWidgets();
            return notebookWidgets
                .map(widget => widget.value)
                .filter((val) => !!val && val.hasModel());
        }
    };
    exports.NotebookSearchService = NotebookSearchService;
    exports.NotebookSearchService = NotebookSearchService = __decorate([
        __param(0, uriIdentity_1.IUriIdentityService),
        __param(1, notebookEditorService_1.INotebookEditorService),
        __param(2, log_1.ILogService),
        __param(3, notebookService_1.INotebookService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, editorResolverService_1.IEditorResolverService),
        __param(6, search_1.ISearchService),
        __param(7, instantiation_1.IInstantiationService)
    ], NotebookSearchService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tTZWFyY2hTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvYnJvd3Nlci9ub3RlYm9va1NlYXJjaC9ub3RlYm9va1NlYXJjaFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQWtDTyxJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFxQjtRQUdqQyxZQUN1QyxrQkFBdUMsRUFDcEMscUJBQTZDLEVBQ3hELFVBQXVCLEVBQ2xCLGVBQWlDLEVBQzVCLG9CQUEyQyxFQUMxQyxxQkFBNkMsRUFDckQsYUFBNkIsRUFDdkMsb0JBQTJDO1lBUDVCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDcEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQUN4RCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2xCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUM1Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzFDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUFDckQsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBRzlELElBQUksQ0FBQyxZQUFZLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJCQUFZLENBQUMsQ0FBQztRQUN2RSxDQUFDO1FBRUQsY0FBYyxDQUFDLEtBQWlCLEVBQUUsS0FBb0MsRUFBRSxnQkFBd0IsRUFBRSxVQUFrRDtZQU1uSixJQUFJLEtBQUssQ0FBQyxJQUFJLDJCQUFtQixFQUFFLENBQUM7Z0JBQ25DLE9BQU87b0JBQ04sZUFBZSxFQUFFLElBQUksaUJBQVcsRUFBRTtvQkFDbEMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUM7d0JBQzdCLFFBQVEsRUFBRSxFQUFFO3dCQUNaLFFBQVEsRUFBRSxLQUFLO3dCQUNm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