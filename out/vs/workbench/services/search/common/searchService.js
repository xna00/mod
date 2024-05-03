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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/stopwatch", "vs/base/common/types", "vs/editor/common/services/model", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/search/common/search", "vs/workbench/services/search/common/searchHelpers"], function (require, exports, arrays, async_1, errors_1, lifecycle_1, map_1, network_1, stopwatch_1, types_1, model_1, files_1, log_1, telemetry_1, uriIdentity_1, editor_1, editorService_1, extensions_1, search_1, searchHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchService = void 0;
    let SearchService = class SearchService extends lifecycle_1.Disposable {
        constructor(modelService, editorService, telemetryService, logService, extensionService, fileService, uriIdentityService) {
            super();
            this.modelService = modelService;
            this.editorService = editorService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.extensionService = extensionService;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.fileSearchProviders = new Map();
            this.textSearchProviders = new Map();
            this.aiTextSearchProviders = new Map();
            this.deferredFileSearchesByScheme = new Map();
            this.deferredTextSearchesByScheme = new Map();
            this.deferredAITextSearchesByScheme = new Map();
            this.loggedSchemesMissingProviders = new Set();
        }
        registerSearchResultProvider(scheme, type, provider) {
            let list;
            let deferredMap;
            if (type === 0 /* SearchProviderType.file */) {
                list = this.fileSearchProviders;
                deferredMap = this.deferredFileSearchesByScheme;
            }
            else if (type === 1 /* SearchProviderType.text */) {
                list = this.textSearchProviders;
                deferredMap = this.deferredTextSearchesByScheme;
            }
            else if (type === 2 /* SearchProviderType.aiText */) {
                list = this.aiTextSearchProviders;
                deferredMap = this.deferredAITextSearchesByScheme;
            }
            else {
                throw new Error('Unknown SearchProviderType');
            }
            list.set(scheme, provider);
            if (deferredMap.has(scheme)) {
                deferredMap.get(scheme).complete(provider);
                deferredMap.delete(scheme);
            }
            return (0, lifecycle_1.toDisposable)(() => {
                list.delete(scheme);
            });
        }
        async textSearch(query, token, onProgress) {
            const results = this.textSearchSplitSyncAsync(query, token, onProgress);
            const openEditorResults = results.syncResults;
            const otherResults = await results.asyncResults;
            return {
                limitHit: otherResults.limitHit || openEditorResults.limitHit,
                results: [...otherResults.results, ...openEditorResults.results],
                messages: [...otherResults.messages, ...openEditorResults.messages]
            };
        }
        async aiTextSearch(query, token, onProgress) {
            const onProviderProgress = (progress) => {
                // Match
                if (onProgress) { // don't override open editor results
                    if ((0, search_1.isFileMatch)(progress)) {
                        onProgress(progress);
                    }
                    else {
                        onProgress(progress);
                    }
                }
                if ((0, search_1.isProgressMessage)(progress)) {
                    this.logService.debug('SearchService#search', progress.message);
                }
            };
            return this.doSearch(query, token, onProviderProgress);
        }
        textSearchSplitSyncAsync(query, token, onProgress, notebookFilesToIgnore, asyncNotebookFilesToIgnore) {
            // Get open editor results from dirty/untitled
            const openEditorResults = this.getOpenEditorResults(query);
            if (onProgress) {
                arrays.coalesce([...openEditorResults.results.values()]).filter(e => !(notebookFilesToIgnore && notebookFilesToIgnore.has(e.resource))).forEach(onProgress);
            }
            const syncResults = {
                results: arrays.coalesce([...openEditorResults.results.values()]),
                limitHit: openEditorResults.limitHit ?? false,
                messages: []
            };
            const getAsyncResults = async () => {
                const resolvedAsyncNotebookFilesToIgnore = await asyncNotebookFilesToIgnore ?? new map_1.ResourceSet();
                const onProviderProgress = (progress) => {
                    if ((0, search_1.isFileMatch)(progress)) {
                        // Match
                        if (!openEditorResults.results.has(progress.resource) && !resolvedAsyncNotebookFilesToIgnore.has(progress.resource) && onProgress) { // don't override open editor results
                            onProgress(progress);
                        }
                    }
                    else if (onProgress) {
                        // Progress
                        onProgress(progress);
                    }
                    if ((0, search_1.isProgressMessage)(progress)) {
                        this.logService.debug('SearchService#search', progress.message);
                    }
                };
                return await this.doSearch(query, token, onProviderProgress);
            };
            return {
                syncResults,
                asyncResults: getAsyncResults()
            };
        }
        fileSearch(query, token) {
            return this.doSearch(query, token);
        }
        doSearch(query, token, onProgress) {
            this.logService.trace('SearchService#search', JSON.stringify(query));
            const schemesInQuery = this.getSchemesInQuery(query);
            const providerActivations = [Promise.resolve(null)];
            schemesInQuery.forEach(scheme => providerActivations.push(this.extensionService.activateByEvent(`onSearch:${scheme}`)));
            providerActivations.push(this.extensionService.activateByEvent('onSearch:file'));
            const providerPromise = (async () => {
                await Promise.all(providerActivations);
                await this.extensionService.whenInstalledExtensionsRegistered();
                // Cancel faster if search was canceled while waiting for extensions
                if (token && token.isCancellationRequested) {
                    return Promise.reject(new errors_1.CancellationError());
                }
                const progressCallback = (item) => {
                    if (token && token.isCancellationRequested) {
                        return;
                    }
                    onProgress?.(item);
                };
                const exists = await Promise.all(query.folderQueries.map(query => this.fileService.exists(query.folder)));
                query.folderQueries = query.folderQueries.filter((_, i) => exists[i]);
                let completes = await this.searchWithProviders(query, progressCallback, token);
                completes = arrays.coalesce(completes);
                if (!completes.length) {
                    return {
                        limitHit: false,
                        results: [],
                        messages: [],
                    };
                }
                return {
                    limitHit: completes[0] && completes[0].limitHit,
                    stats: completes[0].stats,
                    messages: arrays.coalesce(arrays.flatten(completes.map(i => i.messages))).filter(arrays.uniqueFilter(message => message.type + message.text + message.trusted)),
                    results: arrays.flatten(completes.map((c) => c.results))
                };
            })();
            return token ? (0, async_1.raceCancellationError)(providerPromise, token) : providerPromise;
        }
        getSchemesInQuery(query) {
            const schemes = new Set();
            query.folderQueries?.forEach(fq => schemes.add(fq.folder.scheme));
            query.extraFileResources?.forEach(extraFile => schemes.add(extraFile.scheme));
            return schemes;
        }
        async waitForProvider(queryType, scheme) {
            const deferredMap = this.getDeferredTextSearchesByScheme(queryType);
            if (deferredMap.has(scheme)) {
                return deferredMap.get(scheme).p;
            }
            else {
                const deferred = new async_1.DeferredPromise();
                deferredMap.set(scheme, deferred);
                return deferred.p;
            }
        }
        getSearchProvider(type) {
            switch (type) {
                case 1 /* QueryType.File */:
                    return this.fileSearchProviders;
                case 2 /* QueryType.Text */:
                    return this.textSearchProviders;
                case 3 /* QueryType.aiText */:
                    return this.aiTextSearchProviders;
                default:
                    throw new Error(`Unknown query type: ${type}`);
            }
        }
        getDeferredTextSearchesByScheme(type) {
            switch (type) {
                case 1 /* QueryType.File */:
                    return this.deferredFileSearchesByScheme;
                case 2 /* QueryType.Text */:
                    return this.deferredTextSearchesByScheme;
                case 3 /* QueryType.aiText */:
                    return this.deferredAITextSearchesByScheme;
                default:
                    throw new Error(`Unknown query type: ${type}`);
            }
        }
        async searchWithProviders(query, onProviderProgress, token) {
            const e2eSW = stopwatch_1.StopWatch.create(false);
            const searchPs = [];
            const fqs = this.groupFolderQueriesByScheme(query);
            const someSchemeHasProvider = [...fqs.keys()].some(scheme => {
                return this.getSearchProvider(query.type).has(scheme);
            });
            if (query.type === 3 /* QueryType.aiText */ && !someSchemeHasProvider) {
                return [];
            }
            await Promise.all([...fqs.keys()].map(async (scheme) => {
                const schemeFQs = fqs.get(scheme);
                let provider = this.getSearchProvider(query.type).get(scheme);
                if (!provider) {
                    if (someSchemeHasProvider) {
                        if (!this.loggedSchemesMissingProviders.has(scheme)) {
                            this.logService.warn(`No search provider registered for scheme: ${scheme}. Another scheme has a provider, not waiting for ${scheme}`);
                            this.loggedSchemesMissingProviders.add(scheme);
                        }
                        return;
                    }
                    else {
                        if (!this.loggedSchemesMissingProviders.has(scheme)) {
                            this.logService.warn(`No search provider registered for scheme: ${scheme}, waiting`);
                            this.loggedSchemesMissingProviders.add(scheme);
                        }
                        provider = await this.waitForProvider(query.type, scheme);
                    }
                }
                const oneSchemeQuery = {
                    ...query,
                    ...{
                        folderQueries: schemeFQs
                    }
                };
                const doProviderSearch = () => {
                    switch (query.type) {
                        case 1 /* QueryType.File */:
                            return provider.fileSearch(oneSchemeQuery, token);
                        case 2 /* QueryType.Text */:
                            return provider.textSearch(oneSchemeQuery, onProviderProgress, token);
                        default:
                            return provider.textSearch(oneSchemeQuery, onProviderProgress, token);
                    }
                };
                searchPs.push(doProviderSearch());
            }));
            return Promise.all(searchPs).then(completes => {
                const endToEndTime = e2eSW.elapsed();
                this.logService.trace(`SearchService#search: ${endToEndTime}ms`);
                completes.forEach(complete => {
                    this.sendTelemetry(query, endToEndTime, complete);
                });
                return completes;
            }, err => {
                const endToEndTime = e2eSW.elapsed();
                this.logService.trace(`SearchService#search: ${endToEndTime}ms`);
                const searchError = (0, search_1.deserializeSearchError)(err);
                this.logService.trace(`SearchService#searchError: ${searchError.message}`);
                this.sendTelemetry(query, endToEndTime, undefined, searchError);
                throw searchError;
            });
        }
        groupFolderQueriesByScheme(query) {
            const queries = new Map();
            query.folderQueries.forEach(fq => {
                const schemeFQs = queries.get(fq.folder.scheme) || [];
                schemeFQs.push(fq);
                queries.set(fq.folder.scheme, schemeFQs);
            });
            return queries;
        }
        sendTelemetry(query, endToEndTime, complete, err) {
            const fileSchemeOnly = query.folderQueries.every(fq => fq.folder.scheme === network_1.Schemas.file);
            const otherSchemeOnly = query.folderQueries.every(fq => fq.folder.scheme !== network_1.Schemas.file);
            const scheme = fileSchemeOnly ? network_1.Schemas.file :
                otherSchemeOnly ? 'other' :
                    'mixed';
            if (query.type === 1 /* QueryType.File */ && complete && complete.stats) {
                const fileSearchStats = complete.stats;
                if (fileSearchStats.fromCache) {
                    const cacheStats = fileSearchStats.detailStats;
                    this.telemetryService.publicLog2('cachedSearchComplete', {
                        reason: query._reason,
                        resultCount: fileSearchStats.resultCount,
                        workspaceFolderCount: query.folderQueries.length,
                        endToEndTime: endToEndTime,
                        sortingTime: fileSearchStats.sortingTime,
                        cacheWasResolved: cacheStats.cacheWasResolved,
                        cacheLookupTime: cacheStats.cacheLookupTime,
                        cacheFilterTime: cacheStats.cacheFilterTime,
                        cacheEntryCount: cacheStats.cacheEntryCount,
                        scheme
                    });
                }
                else {
                    const searchEngineStats = fileSearchStats.detailStats;
                    this.telemetryService.publicLog2('searchComplete', {
                        reason: query._reason,
                        resultCount: fileSearchStats.resultCount,
                        workspaceFolderCount: query.folderQueries.length,
                        endToEndTime: endToEndTime,
                        sortingTime: fileSearchStats.sortingTime,
                        fileWalkTime: searchEngineStats.fileWalkTime,
                        directoriesWalked: searchEngineStats.directoriesWalked,
                        filesWalked: searchEngineStats.filesWalked,
                        cmdTime: searchEngineStats.cmdTime,
                        cmdResultCount: searchEngineStats.cmdResultCount,
                        scheme
                    });
                }
            }
            else if (query.type === 2 /* QueryType.Text */) {
                let errorType;
                if (err) {
                    errorType = err.code === search_1.SearchErrorCode.regexParseError ? 'regex' :
                        err.code === search_1.SearchErrorCode.unknownEncoding ? 'encoding' :
                            err.code === search_1.SearchErrorCode.globParseError ? 'glob' :
                                err.code === search_1.SearchErrorCode.invalidLiteral ? 'literal' :
                                    err.code === search_1.SearchErrorCode.other ? 'other' :
                                        err.code === search_1.SearchErrorCode.canceled ? 'canceled' :
                                            'unknown';
                }
                this.telemetryService.publicLog2('textSearchComplete', {
                    reason: query._reason,
                    workspaceFolderCount: query.folderQueries.length,
                    endToEndTime: endToEndTime,
                    scheme,
                    error: errorType,
                });
            }
        }
        getOpenEditorResults(query) {
            const openEditorResults = new map_1.ResourceMap(uri => this.uriIdentityService.extUri.getComparisonKey(uri));
            let limitHit = false;
            if (query.type === 2 /* QueryType.Text */) {
                const canonicalToOriginalResources = new map_1.ResourceMap();
                for (const editorInput of this.editorService.editors) {
                    const canonical = editor_1.EditorResourceAccessor.getCanonicalUri(editorInput, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                    const original = editor_1.EditorResourceAccessor.getOriginalUri(editorInput, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                    if (canonical) {
                        canonicalToOriginalResources.set(canonical, original ?? canonical);
                    }
                }
                const models = this.modelService.getModels();
                models.forEach((model) => {
                    const resource = model.uri;
                    if (!resource) {
                        return;
                    }
                    if (limitHit) {
                        return;
                    }
                    const originalResource = canonicalToOriginalResources.get(resource);
                    if (!originalResource) {
                        return;
                    }
                    // Skip search results
                    if (model.getLanguageId() === search_1.SEARCH_RESULT_LANGUAGE_ID && !(query.includePattern && query.includePattern['**/*.code-search'])) {
                        // TODO: untitled search editors will be excluded from search even when include *.code-search is specified
                        return;
                    }
                    // Block walkthrough, webview, etc.
                    if (originalResource.scheme !== network_1.Schemas.untitled && !this.fileService.hasProvider(originalResource)) {
                        return;
                    }
                    // Exclude files from the git FileSystemProvider, e.g. to prevent open staged files from showing in search results
                    if (originalResource.scheme === 'git') {
                        return;
                    }
                    if (!this.matches(originalResource, query)) {
                        return; // respect user filters
                    }
                    // Use editor API to find matches
                    const askMax = (0, types_1.isNumber)(query.maxResults) ? query.maxResults + 1 : Number.MAX_SAFE_INTEGER;
                    let matches = model.findMatches(query.contentPattern.pattern, false, !!query.contentPattern.isRegExp, !!query.contentPattern.isCaseSensitive, query.contentPattern.isWordMatch ? query.contentPattern.wordSeparators : null, false, askMax);
                    if (matches.length) {
                        if (askMax && matches.length >= askMax) {
                            limitHit = true;
                            matches = matches.slice(0, askMax - 1);
                        }
                        const fileMatch = new search_1.FileMatch(originalResource);
                        openEditorResults.set(originalResource, fileMatch);
                        const textSearchResults = (0, searchHelpers_1.editorMatchesToTextSearchResults)(matches, model, query.previewOptions);
                        fileMatch.results = (0, searchHelpers_1.getTextSearchMatchWithModelContext)(textSearchResults, model, query);
                    }
                    else {
                        openEditorResults.set(originalResource, null);
                    }
                });
            }
            return {
                results: openEditorResults,
                limitHit
            };
        }
        matches(resource, query) {
            return (0, search_1.pathIncludedInQuery)(query, resource.fsPath);
        }
        async clearCache(cacheKey) {
            const clearPs = Array.from(this.fileSearchProviders.values())
                .map(provider => provider && provider.clearCache(cacheKey));
            await Promise.all(clearPs);
        }
    };
    exports.SearchService = SearchService;
    exports.SearchService = SearchService = __decorate([
        __param(0, model_1.IModelService),
        __param(1, editorService_1.IEditorService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, log_1.ILogService),
        __param(4, extensions_1.IExtensionService),
        __param(5, files_1.IFileService),
        __param(6, uriIdentity_1.IUriIdentityService)
    ], SearchService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3NlYXJjaC9jb21tb24vc2VhcmNoU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF1QnpGLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWMsU0FBUSxzQkFBVTtRQWM1QyxZQUNnQixZQUE0QyxFQUMzQyxhQUE4QyxFQUMzQyxnQkFBb0QsRUFDMUQsVUFBd0MsRUFDbEMsZ0JBQW9ELEVBQ3pELFdBQTBDLEVBQ25DLGtCQUF3RDtZQUU3RSxLQUFLLEVBQUUsQ0FBQztZQVJ3QixpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUMxQixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDMUIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUN6QyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2pCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDeEMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQWpCN0Qsd0JBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQWlDLENBQUM7WUFDL0Qsd0JBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQWlDLENBQUM7WUFDL0QsMEJBQXFCLEdBQUcsSUFBSSxHQUFHLEVBQWlDLENBQUM7WUFFMUUsaUNBQTRCLEdBQUcsSUFBSSxHQUFHLEVBQWtELENBQUM7WUFDekYsaUNBQTRCLEdBQUcsSUFBSSxHQUFHLEVBQWtELENBQUM7WUFDekYsbUNBQThCLEdBQUcsSUFBSSxHQUFHLEVBQWtELENBQUM7WUFFM0Ysa0NBQTZCLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQVkxRCxDQUFDO1FBRUQsNEJBQTRCLENBQUMsTUFBYyxFQUFFLElBQXdCLEVBQUUsUUFBK0I7WUFDckcsSUFBSSxJQUF3QyxDQUFDO1lBQzdDLElBQUksV0FBZ0UsQ0FBQztZQUNyRSxJQUFJLElBQUksb0NBQTRCLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztnQkFDaEMsV0FBVyxHQUFHLElBQUksQ0FBQyw0QkFBNEIsQ0FBQztZQUNqRCxDQUFDO2lCQUFNLElBQUksSUFBSSxvQ0FBNEIsRUFBRSxDQUFDO2dCQUM3QyxJQUFJLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDO2dCQUNoQyxXQUFXLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixDQUFDO1lBQ2pELENBQUM7aUJBQU0sSUFBSSxJQUFJLHNDQUE4QixFQUFFLENBQUM7Z0JBQy9DLElBQUksR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUM7Z0JBQ2xDLFdBQVcsR0FBRyxJQUFJLENBQUMsOEJBQThCLENBQUM7WUFDbkQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQztZQUMvQyxDQUFDO1lBRUQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFM0IsSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM1QyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVCLENBQUM7WUFFRCxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFpQixFQUFFLEtBQXlCLEVBQUUsVUFBZ0Q7WUFDOUcsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDeEUsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDO1lBQzlDLE1BQU0sWUFBWSxHQUFHLE1BQU0sT0FBTyxDQUFDLFlBQVksQ0FBQztZQUNoRCxPQUFPO2dCQUNOLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUSxJQUFJLGlCQUFpQixDQUFDLFFBQVE7Z0JBQzdELE9BQU8sRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLE9BQU8sRUFBRSxHQUFHLGlCQUFpQixDQUFDLE9BQU8sQ0FBQztnQkFDaEUsUUFBUSxFQUFFLENBQUMsR0FBRyxZQUFZLENBQUMsUUFBUSxFQUFFLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxDQUFDO2FBQ25FLENBQUM7UUFDSCxDQUFDO1FBRUQsS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFtQixFQUFFLEtBQXlCLEVBQUUsVUFBZ0Q7WUFDbEgsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLFFBQTZCLEVBQUUsRUFBRTtnQkFDNUQsUUFBUTtnQkFDUixJQUFJLFVBQVUsRUFBRSxDQUFDLENBQUMscUNBQXFDO29CQUN0RCxJQUFJLElBQUEsb0JBQVcsRUFBQyxRQUFRLENBQUMsRUFBRSxDQUFDO3dCQUMzQixVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3RCLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxVQUFVLENBQW1CLFFBQVEsQ0FBQyxDQUFDO29CQUN4QyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxJQUFBLDBCQUFpQixFQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ2pDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDakUsQ0FBQztZQUNGLENBQUMsQ0FBQztZQUNGLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVELHdCQUF3QixDQUN2QixLQUFpQixFQUNqQixLQUFxQyxFQUNyQyxVQUFnRSxFQUNoRSxxQkFBbUMsRUFDbkMsMEJBQWlEO1lBS2pELDhDQUE4QztZQUM5QyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUUzRCxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxxQkFBcUIsSUFBSSxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0osQ0FBQztZQUVELE1BQU0sV0FBVyxHQUFvQjtnQkFDcEMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUNqRSxRQUFRLEVBQUUsaUJBQWlCLENBQUMsUUFBUSxJQUFJLEtBQUs7Z0JBQzdDLFFBQVEsRUFBRSxFQUFFO2FBQ1osQ0FBQztZQUVGLE1BQU0sZUFBZSxHQUFHLEtBQUssSUFBSSxFQUFFO2dCQUNsQyxNQUFNLGtDQUFrQyxHQUFHLE1BQU0sMEJBQTBCLElBQUksSUFBSSxpQkFBVyxFQUFFLENBQUM7Z0JBQ2pHLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxRQUE2QixFQUFFLEVBQUU7b0JBQzVELElBQUksSUFBQSxvQkFBVyxFQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7d0JBQzNCLFFBQVE7d0JBQ1IsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsa0NBQWtDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxVQUFVLEVBQUUsQ0FBQyxDQUFDLHFDQUFxQzs0QkFDekssVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUN0QixDQUFDO29CQUNGLENBQUM7eUJBQU0sSUFBSSxVQUFVLEVBQUUsQ0FBQzt3QkFDdkIsV0FBVzt3QkFDWCxVQUFVLENBQW1CLFFBQVEsQ0FBQyxDQUFDO29CQUN4QyxDQUFDO29CQUVELElBQUksSUFBQSwwQkFBaUIsRUFBQyxRQUFRLENBQUMsRUFBRSxDQUFDO3dCQUNqQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ2pFLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDO2dCQUNGLE9BQU8sTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUM5RCxDQUFDLENBQUM7WUFFRixPQUFPO2dCQUNOLFdBQVc7Z0JBQ1gsWUFBWSxFQUFFLGVBQWUsRUFBRTthQUMvQixDQUFDO1FBQ0gsQ0FBQztRQUVELFVBQVUsQ0FBQyxLQUFpQixFQUFFLEtBQXlCO1lBQ3RELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVPLFFBQVEsQ0FBQyxLQUFtQixFQUFFLEtBQXlCLEVBQUUsVUFBZ0Q7WUFDaEgsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRXJFLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVyRCxNQUFNLG1CQUFtQixHQUFtQixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwRSxjQUFjLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsWUFBWSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4SCxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBRWpGLE1BQU0sZUFBZSxHQUFHLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ25DLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUN2QyxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQ0FBaUMsRUFBRSxDQUFDO2dCQUVoRSxvRUFBb0U7Z0JBQ3BFLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO29CQUM1QyxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSwwQkFBaUIsRUFBRSxDQUFDLENBQUM7Z0JBQ2hELENBQUM7Z0JBRUQsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLElBQXlCLEVBQUUsRUFBRTtvQkFDdEQsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUM7d0JBQzVDLE9BQU87b0JBQ1IsQ0FBQztvQkFFRCxVQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEIsQ0FBQyxDQUFDO2dCQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFHLEtBQUssQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFdEUsSUFBSSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxFQUFFLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMvRSxTQUFTLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDdkIsT0FBTzt3QkFDTixRQUFRLEVBQUUsS0FBSzt3QkFDZixPQUFPLEVBQUUsRUFBRTt3QkFDWCxRQUFRLEVBQUUsRUFBRTtxQkFDWixDQUFDO2dCQUNILENBQUM7Z0JBRUQsT0FBTztvQkFDTixRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRO29CQUMvQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7b0JBQ3pCLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUMvSixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBa0IsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUN6RSxDQUFDO1lBQ0gsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUVMLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFBLDZCQUFxQixFQUFrQixlQUFlLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQztRQUNqRyxDQUFDO1FBRU8saUJBQWlCLENBQUMsS0FBbUI7WUFDNUMsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztZQUNsQyxLQUFLLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBRWxFLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBRTlFLE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7UUFFTyxLQUFLLENBQUMsZUFBZSxDQUFDLFNBQW9CLEVBQUUsTUFBYztZQUNqRSxNQUFNLFdBQVcsR0FBd0QsSUFBSSxDQUFDLCtCQUErQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXpILElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUM3QixPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25DLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLFFBQVEsR0FBRyxJQUFJLHVCQUFlLEVBQXlCLENBQUM7Z0JBQzlELFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNsQyxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDbkIsQ0FBQztRQUNGLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxJQUFlO1lBQ3hDLFFBQVEsSUFBSSxFQUFFLENBQUM7Z0JBQ2Q7b0JBQ0MsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUM7Z0JBQ2pDO29CQUNDLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDO2dCQUNqQztvQkFDQyxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQztnQkFDbkM7b0JBQ0MsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNqRCxDQUFDO1FBQ0YsQ0FBQztRQUVPLCtCQUErQixDQUFDLElBQWU7WUFDdEQsUUFBUSxJQUFJLEVBQUUsQ0FBQztnQkFDZDtvQkFDQyxPQUFPLElBQUksQ0FBQyw0QkFBNEIsQ0FBQztnQkFDMUM7b0JBQ0MsT0FBTyxJQUFJLENBQUMsNEJBQTRCLENBQUM7Z0JBQzFDO29CQUNDLE9BQU8sSUFBSSxDQUFDLDhCQUE4QixDQUFDO2dCQUM1QztvQkFDQyxNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ2pELENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLG1CQUFtQixDQUFDLEtBQW1CLEVBQUUsa0JBQTJELEVBQUUsS0FBeUI7WUFDNUksTUFBTSxLQUFLLEdBQUcscUJBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFdEMsTUFBTSxRQUFRLEdBQStCLEVBQUUsQ0FBQztZQUVoRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkQsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUMzRCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZELENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxLQUFLLENBQUMsSUFBSSw2QkFBcUIsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQy9ELE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUNELE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyxNQUFNLEVBQUMsRUFBRTtnQkFDcEQsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUUsQ0FBQztnQkFDbkMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRTlELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDZixJQUFJLHFCQUFxQixFQUFFLENBQUM7d0JBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7NEJBQ3JELElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLDZDQUE2QyxNQUFNLG9EQUFvRCxNQUFNLEVBQUUsQ0FBQyxDQUFDOzRCQUN0SSxJQUFJLENBQUMsNkJBQTZCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUNoRCxDQUFDO3dCQUNELE9BQU87b0JBQ1IsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7NEJBQ3JELElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLDZDQUE2QyxNQUFNLFdBQVcsQ0FBQyxDQUFDOzRCQUNyRixJQUFJLENBQUMsNkJBQTZCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUNoRCxDQUFDO3dCQUNELFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFDM0QsQ0FBQztnQkFDRixDQUFDO2dCQUVELE1BQU0sY0FBYyxHQUFpQjtvQkFDcEMsR0FBRyxLQUFLO29CQUNSLEdBQUc7d0JBQ0YsYUFBYSxFQUFFLFNBQVM7cUJBQ3hCO2lCQUNELENBQUM7Z0JBRUYsTUFBTSxnQkFBZ0IsR0FBRyxHQUFHLEVBQUU7b0JBQzdCLFFBQVEsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUNwQjs0QkFDQyxPQUFPLFFBQVEsQ0FBQyxVQUFVLENBQWEsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUMvRDs0QkFDQyxPQUFPLFFBQVEsQ0FBQyxVQUFVLENBQWEsY0FBYyxFQUFFLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUNuRjs0QkFDQyxPQUFPLFFBQVEsQ0FBQyxVQUFVLENBQWEsY0FBYyxFQUFFLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUNwRixDQUFDO2dCQUNGLENBQUMsQ0FBQztnQkFFRixRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQztZQUNuQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDN0MsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsWUFBWSxJQUFJLENBQUMsQ0FBQztnQkFDakUsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDNUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNuRCxDQUFDLENBQUMsQ0FBQztnQkFDSCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUU7Z0JBQ1IsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsWUFBWSxJQUFJLENBQUMsQ0FBQztnQkFDakUsTUFBTSxXQUFXLEdBQUcsSUFBQSwrQkFBc0IsRUFBQyxHQUFHLENBQUMsQ0FBQztnQkFDaEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsOEJBQThCLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUVoRSxNQUFNLFdBQVcsQ0FBQztZQUNuQixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTywwQkFBMEIsQ0FBQyxLQUFtQjtZQUNyRCxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBMEIsQ0FBQztZQUVsRCxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRTtnQkFDaEMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDdEQsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFFbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMxQyxDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7UUFFTyxhQUFhLENBQUMsS0FBbUIsRUFBRSxZQUFvQixFQUFFLFFBQTBCLEVBQUUsR0FBaUI7WUFDN0csTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFGLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzRixNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLGlCQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzdDLGVBQWUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzFCLE9BQU8sQ0FBQztZQUVWLElBQUksS0FBSyxDQUFDLElBQUksMkJBQW1CLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDakUsTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLEtBQXlCLENBQUM7Z0JBQzNELElBQUksZUFBZSxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUMvQixNQUFNLFVBQVUsR0FBdUIsZUFBZSxDQUFDLFdBQWlDLENBQUM7b0JBNEJ6RixJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUErRCxzQkFBc0IsRUFBRTt3QkFDdEgsTUFBTSxFQUFFLEtBQUssQ0FBQyxPQUFPO3dCQUNyQixXQUFXLEVBQUUsZUFBZSxDQUFDLFdBQVc7d0JBQ3hDLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBTTt3QkFDaEQsWUFBWSxFQUFFLFlBQVk7d0JBQzFCLFdBQVcsRUFBRSxlQUFlLENBQUMsV0FBVzt3QkFDeEMsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLGdCQUFnQjt3QkFDN0MsZUFBZSxFQUFFLFVBQVUsQ0FBQyxlQUFlO3dCQUMzQyxlQUFlLEVBQUUsVUFBVSxDQUFDLGVBQWU7d0JBQzNDLGVBQWUsRUFBRSxVQUFVLENBQUMsZUFBZTt3QkFDM0MsTUFBTTtxQkFDTixDQUFDLENBQUM7Z0JBQ0osQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0saUJBQWlCLEdBQXVCLGVBQWUsQ0FBQyxXQUFpQyxDQUFDO29CQWdDaEcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBb0QsZ0JBQWdCLEVBQUU7d0JBQ3JHLE1BQU0sRUFBRSxLQUFLLENBQUMsT0FBTzt3QkFDckIsV0FBVyxFQUFFLGVBQWUsQ0FBQyxXQUFXO3dCQUN4QyxvQkFBb0IsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQU07d0JBQ2hELFlBQVksRUFBRSxZQUFZO3dCQUMxQixXQUFXLEVBQUUsZUFBZSxDQUFDLFdBQVc7d0JBQ3hDLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxZQUFZO3dCQUM1QyxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQyxpQkFBaUI7d0JBQ3RELFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyxXQUFXO3dCQUMxQyxPQUFPLEVBQUUsaUJBQWlCLENBQUMsT0FBTzt3QkFDbEMsY0FBYyxFQUFFLGlCQUFpQixDQUFDLGNBQWM7d0JBQ2hELE1BQU07cUJBQ04sQ0FBQyxDQUFDO2dCQUNKLENBQUM7WUFDRixDQUFDO2lCQUFNLElBQUksS0FBSyxDQUFDLElBQUksMkJBQW1CLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxTQUE2QixDQUFDO2dCQUNsQyxJQUFJLEdBQUcsRUFBRSxDQUFDO29CQUNULFNBQVMsR0FBRyxHQUFHLENBQUMsSUFBSSxLQUFLLHdCQUFlLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDbkUsR0FBRyxDQUFDLElBQUksS0FBSyx3QkFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7NEJBQzFELEdBQUcsQ0FBQyxJQUFJLEtBQUssd0JBQWUsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dDQUNyRCxHQUFHLENBQUMsSUFBSSxLQUFLLHdCQUFlLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQ0FDeEQsR0FBRyxDQUFDLElBQUksS0FBSyx3QkFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7d0NBQzdDLEdBQUcsQ0FBQyxJQUFJLEtBQUssd0JBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDOzRDQUNuRCxTQUFTLENBQUM7Z0JBQ2pCLENBQUM7Z0JBa0JELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQTRELG9CQUFvQixFQUFFO29CQUNqSCxNQUFNLEVBQUUsS0FBSyxDQUFDLE9BQU87b0JBQ3JCLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBTTtvQkFDaEQsWUFBWSxFQUFFLFlBQVk7b0JBQzFCLE1BQU07b0JBQ04sS0FBSyxFQUFFLFNBQVM7aUJBQ2hCLENBQUMsQ0FBQztZQUNKLENBQUM7UUFDRixDQUFDO1FBRU8sb0JBQW9CLENBQUMsS0FBaUI7WUFDN0MsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLGlCQUFXLENBQW9CLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzFILElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQztZQUVyQixJQUFJLEtBQUssQ0FBQyxJQUFJLDJCQUFtQixFQUFFLENBQUM7Z0JBQ25DLE1BQU0sNEJBQTRCLEdBQUcsSUFBSSxpQkFBVyxFQUFPLENBQUM7Z0JBQzVELEtBQUssTUFBTSxXQUFXLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDdEQsTUFBTSxTQUFTLEdBQUcsK0JBQXNCLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFFLGlCQUFpQixFQUFFLHlCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7b0JBQ3ZILE1BQU0sUUFBUSxHQUFHLCtCQUFzQixDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSx5QkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO29CQUVySCxJQUFJLFNBQVMsRUFBRSxDQUFDO3dCQUNmLDRCQUE0QixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsUUFBUSxJQUFJLFNBQVMsQ0FBQyxDQUFDO29CQUNwRSxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDN0MsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO29CQUN4QixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO29CQUMzQixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7d0JBQ2YsT0FBTztvQkFDUixDQUFDO29CQUVELElBQUksUUFBUSxFQUFFLENBQUM7d0JBQ2QsT0FBTztvQkFDUixDQUFDO29CQUVELE1BQU0sZ0JBQWdCLEdBQUcsNEJBQTRCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUNwRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQzt3QkFDdkIsT0FBTztvQkFDUixDQUFDO29CQUVELHNCQUFzQjtvQkFDdEIsSUFBSSxLQUFLLENBQUMsYUFBYSxFQUFFLEtBQUssa0NBQXlCLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxjQUFjLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDaEksMEdBQTBHO3dCQUMxRyxPQUFPO29CQUNSLENBQUM7b0JBRUQsbUNBQW1DO29CQUNuQyxJQUFJLGdCQUFnQixDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQzt3QkFDckcsT0FBTztvQkFDUixDQUFDO29CQUVELGtIQUFrSDtvQkFDbEgsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLEtBQUssS0FBSyxFQUFFLENBQUM7d0JBQ3ZDLE9BQU87b0JBQ1IsQ0FBQztvQkFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUM1QyxPQUFPLENBQUMsdUJBQXVCO29CQUNoQyxDQUFDO29CQUVELGlDQUFpQztvQkFDakMsTUFBTSxNQUFNLEdBQUcsSUFBQSxnQkFBUSxFQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztvQkFDM0YsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxjQUFlLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7b0JBQzdPLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUNwQixJQUFJLE1BQU0sSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLE1BQU0sRUFBRSxDQUFDOzRCQUN4QyxRQUFRLEdBQUcsSUFBSSxDQUFDOzRCQUNoQixPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUN4QyxDQUFDO3dCQUVELE1BQU0sU0FBUyxHQUFHLElBQUksa0JBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO3dCQUNsRCxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBRW5ELE1BQU0saUJBQWlCLEdBQUcsSUFBQSxnREFBZ0MsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQzt3QkFDakcsU0FBUyxDQUFDLE9BQU8sR0FBRyxJQUFBLGtEQUFrQyxFQUFDLGlCQUFpQixFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDekYsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDL0MsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxPQUFPO2dCQUNOLE9BQU8sRUFBRSxpQkFBaUI7Z0JBQzFCLFFBQVE7YUFDUixDQUFDO1FBQ0gsQ0FBQztRQUVPLE9BQU8sQ0FBQyxRQUFhLEVBQUUsS0FBaUI7WUFDL0MsT0FBTyxJQUFBLDRCQUFtQixFQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVELEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBZ0I7WUFDaEMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLENBQUM7aUJBQzNELEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDN0QsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVCLENBQUM7S0FDRCxDQUFBO0lBM2hCWSxzQ0FBYTs0QkFBYixhQUFhO1FBZXZCLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsOEJBQWMsQ0FBQTtRQUNkLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSw4QkFBaUIsQ0FBQTtRQUNqQixXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLGlDQUFtQixDQUFBO09BckJULGFBQWEsQ0EyaEJ6QiJ9