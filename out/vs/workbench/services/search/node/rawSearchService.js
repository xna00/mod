/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/fuzzyScorer", "vs/base/common/path", "vs/base/common/stopwatch", "vs/base/common/uri", "vs/platform/files/common/files", "vs/workbench/services/search/common/search", "vs/workbench/services/search/node/fileSearch", "vs/workbench/services/search/node/textSearchAdapter"], function (require, exports, arrays, async_1, errors_1, event_1, fuzzyScorer_1, path_1, stopwatch_1, uri_1, files_1, search_1, fileSearch_1, textSearchAdapter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchService = void 0;
    class SearchService {
        static { this.BATCH_SIZE = 512; }
        constructor(processType = 'searchProcess') {
            this.processType = processType;
            this.caches = Object.create(null);
        }
        fileSearch(config) {
            let promise;
            const query = reviveQuery(config);
            const emitter = new event_1.Emitter({
                onDidAddFirstListener: () => {
                    promise = (0, async_1.createCancelablePromise)(token => {
                        return this.doFileSearchWithEngine(fileSearch_1.Engine, query, p => emitter.fire(p), token);
                    });
                    promise.then(c => emitter.fire(c), err => emitter.fire({ type: 'error', error: { message: err.message, stack: err.stack } }));
                },
                onDidRemoveLastListener: () => {
                    promise.cancel();
                }
            });
            return emitter.event;
        }
        textSearch(rawQuery) {
            let promise;
            const query = reviveQuery(rawQuery);
            const emitter = new event_1.Emitter({
                onDidAddFirstListener: () => {
                    promise = (0, async_1.createCancelablePromise)(token => {
                        return this.ripgrepTextSearch(query, p => emitter.fire(p), token);
                    });
                    promise.then(c => emitter.fire(c), err => emitter.fire({ type: 'error', error: { message: err.message, stack: err.stack } }));
                },
                onDidRemoveLastListener: () => {
                    promise.cancel();
                }
            });
            return emitter.event;
        }
        ripgrepTextSearch(config, progressCallback, token) {
            config.maxFileSize = this.getPlatformFileLimits().maxFileSize;
            const engine = new textSearchAdapter_1.TextSearchEngineAdapter(config);
            return engine.search(token, progressCallback, progressCallback);
        }
        getPlatformFileLimits() {
            return {
                maxFileSize: 16 * files_1.ByteSize.GB
            };
        }
        doFileSearch(config, progressCallback, token) {
            return this.doFileSearchWithEngine(fileSearch_1.Engine, config, progressCallback, token);
        }
        doFileSearchWithEngine(EngineClass, config, progressCallback, token, batchSize = SearchService.BATCH_SIZE) {
            let resultCount = 0;
            const fileProgressCallback = progress => {
                if (Array.isArray(progress)) {
                    resultCount += progress.length;
                    progressCallback(progress.map(m => this.rawMatchToSearchItem(m)));
                }
                else if (progress.relativePath) {
                    resultCount++;
                    progressCallback(this.rawMatchToSearchItem(progress));
                }
                else {
                    progressCallback(progress);
                }
            };
            if (config.sortByScore) {
                let sortedSearch = this.trySortedSearchFromCache(config, fileProgressCallback, token);
                if (!sortedSearch) {
                    const walkerConfig = config.maxResults ? Object.assign({}, config, { maxResults: null }) : config;
                    const engine = new EngineClass(walkerConfig);
                    sortedSearch = this.doSortedSearch(engine, config, progressCallback, fileProgressCallback, token);
                }
                return new Promise((c, e) => {
                    sortedSearch.then(([result, rawMatches]) => {
                        const serializedMatches = rawMatches.map(rawMatch => this.rawMatchToSearchItem(rawMatch));
                        this.sendProgress(serializedMatches, progressCallback, batchSize);
                        c(result);
                    }, e);
                });
            }
            const engine = new EngineClass(config);
            return this.doSearch(engine, fileProgressCallback, batchSize, token).then(complete => {
                return {
                    limitHit: complete.limitHit,
                    type: 'success',
                    stats: {
                        detailStats: complete.stats,
                        type: this.processType,
                        fromCache: false,
                        resultCount,
                        sortingTime: undefined
                    }
                };
            });
        }
        rawMatchToSearchItem(match) {
            return { path: match.base ? (0, path_1.join)(match.base, match.relativePath) : match.relativePath };
        }
        doSortedSearch(engine, config, progressCallback, fileProgressCallback, token) {
            const emitter = new event_1.Emitter();
            let allResultsPromise = (0, async_1.createCancelablePromise)(token => {
                let results = [];
                const innerProgressCallback = progress => {
                    if (Array.isArray(progress)) {
                        results = progress;
                    }
                    else {
                        fileProgressCallback(progress);
                        emitter.fire(progress);
                    }
                };
                return this.doSearch(engine, innerProgressCallback, -1, token)
                    .then(result => {
                    return [result, results];
                });
            });
            let cache;
            if (config.cacheKey) {
                cache = this.getOrCreateCache(config.cacheKey);
                const cacheRow = {
                    promise: allResultsPromise,
                    event: emitter.event,
                    resolved: false
                };
                cache.resultsToSearchCache[config.filePattern || ''] = cacheRow;
                allResultsPromise.then(() => {
                    cacheRow.resolved = true;
                }, err => {
                    delete cache.resultsToSearchCache[config.filePattern || ''];
                });
                allResultsPromise = this.preventCancellation(allResultsPromise);
            }
            return allResultsPromise.then(([result, results]) => {
                const scorerCache = cache ? cache.scorerCache : Object.create(null);
                const sortSW = (typeof config.maxResults !== 'number' || config.maxResults > 0) && stopwatch_1.StopWatch.create(false);
                return this.sortResults(config, results, scorerCache, token)
                    .then(sortedResults => {
                    // sortingTime: -1 indicates a "sorted" search that was not sorted, i.e. populating the cache when quickaccess is opened.
                    // Contrasting with findFiles which is not sorted and will have sortingTime: undefined
                    const sortingTime = sortSW ? sortSW.elapsed() : -1;
                    return [{
                            type: 'success',
                            stats: {
                                detailStats: result.stats,
                                sortingTime,
                                fromCache: false,
                                type: this.processType,
                                workspaceFolderCount: config.folderQueries.length,
                                resultCount: sortedResults.length
                            },
                            messages: result.messages,
                            limitHit: result.limitHit || typeof config.maxResults === 'number' && results.length > config.maxResults
                        }, sortedResults];
                });
            });
        }
        getOrCreateCache(cacheKey) {
            const existing = this.caches[cacheKey];
            if (existing) {
                return existing;
            }
            return this.caches[cacheKey] = new Cache();
        }
        trySortedSearchFromCache(config, progressCallback, token) {
            const cache = config.cacheKey && this.caches[config.cacheKey];
            if (!cache) {
                return undefined;
            }
            const cached = this.getResultsFromCache(cache, config.filePattern || '', progressCallback, token);
            if (cached) {
                return cached.then(([result, results, cacheStats]) => {
                    const sortSW = stopwatch_1.StopWatch.create(false);
                    return this.sortResults(config, results, cache.scorerCache, token)
                        .then(sortedResults => {
                        const sortingTime = sortSW.elapsed();
                        const stats = {
                            fromCache: true,
                            detailStats: cacheStats,
                            type: this.processType,
                            resultCount: results.length,
                            sortingTime
                        };
                        return [
                            {
                                type: 'success',
                                limitHit: result.limitHit || typeof config.maxResults === 'number' && results.length > config.maxResults,
                                stats
                            },
                            sortedResults
                        ];
                    });
                });
            }
            return undefined;
        }
        sortResults(config, results, scorerCache, token) {
            // we use the same compare function that is used later when showing the results using fuzzy scoring
            // this is very important because we are also limiting the number of results by config.maxResults
            // and as such we want the top items to be included in this result set if the number of items
            // exceeds config.maxResults.
            const query = (0, fuzzyScorer_1.prepareQuery)(config.filePattern || '');
            const compare = (matchA, matchB) => (0, fuzzyScorer_1.compareItemsByFuzzyScore)(matchA, matchB, query, true, FileMatchItemAccessor, scorerCache);
            const maxResults = typeof config.maxResults === 'number' ? config.maxResults : Number.MAX_VALUE;
            return arrays.topAsync(results, compare, maxResults, 10000, token);
        }
        sendProgress(results, progressCb, batchSize) {
            if (batchSize && batchSize > 0) {
                for (let i = 0; i < results.length; i += batchSize) {
                    progressCb(results.slice(i, i + batchSize));
                }
            }
            else {
                progressCb(results);
            }
        }
        getResultsFromCache(cache, searchValue, progressCallback, token) {
            const cacheLookupSW = stopwatch_1.StopWatch.create(false);
            // Find cache entries by prefix of search value
            const hasPathSep = searchValue.indexOf(path_1.sep) >= 0;
            let cachedRow;
            for (const previousSearch in cache.resultsToSearchCache) {
                // If we narrow down, we might be able to reuse the cached results
                if (searchValue.startsWith(previousSearch)) {
                    if (hasPathSep && previousSearch.indexOf(path_1.sep) < 0 && previousSearch !== '') {
                        continue; // since a path character widens the search for potential more matches, require it in previous search too
                    }
                    const row = cache.resultsToSearchCache[previousSearch];
                    cachedRow = {
                        promise: this.preventCancellation(row.promise),
                        event: row.event,
                        resolved: row.resolved
                    };
                    break;
                }
            }
            if (!cachedRow) {
                return null;
            }
            const cacheLookupTime = cacheLookupSW.elapsed();
            const cacheFilterSW = stopwatch_1.StopWatch.create(false);
            const listener = cachedRow.event(progressCallback);
            if (token) {
                token.onCancellationRequested(() => {
                    listener.dispose();
                });
            }
            return cachedRow.promise.then(([complete, cachedEntries]) => {
                if (token && token.isCancellationRequested) {
                    throw (0, errors_1.canceled)();
                }
                // Pattern match on results
                const results = [];
                const normalizedSearchValueLowercase = (0, fuzzyScorer_1.prepareQuery)(searchValue).normalizedLowercase;
                for (const entry of cachedEntries) {
                    // Check if this entry is a match for the search value
                    if (!(0, search_1.isFilePatternMatch)(entry, normalizedSearchValueLowercase)) {
                        continue;
                    }
                    results.push(entry);
                }
                return [complete, results, {
                        cacheWasResolved: cachedRow.resolved,
                        cacheLookupTime,
                        cacheFilterTime: cacheFilterSW.elapsed(),
                        cacheEntryCount: cachedEntries.length
                    }];
            });
        }
        doSearch(engine, progressCallback, batchSize, token) {
            return new Promise((c, e) => {
                let batch = [];
                token?.onCancellationRequested(() => engine.cancel());
                engine.search((match) => {
                    if (match) {
                        if (batchSize) {
                            batch.push(match);
                            if (batchSize > 0 && batch.length >= batchSize) {
                                progressCallback(batch);
                                batch = [];
                            }
                        }
                        else {
                            progressCallback(match);
                        }
                    }
                }, (progress) => {
                    progressCallback(progress);
                }, (error, complete) => {
                    if (batch.length) {
                        progressCallback(batch);
                    }
                    if (error) {
                        progressCallback({ message: 'Search finished. Error: ' + error.message });
                        e(error);
                    }
                    else {
                        progressCallback({ message: 'Search finished. Stats: ' + JSON.stringify(complete.stats) });
                        c(complete);
                    }
                });
            });
        }
        clearCache(cacheKey) {
            delete this.caches[cacheKey];
            return Promise.resolve(undefined);
        }
        /**
         * Return a CancelablePromise which is not actually cancelable
         * TODO@rob - Is this really needed?
         */
        preventCancellation(promise) {
            return new class {
                get [Symbol.toStringTag]() { return this.toString(); }
                cancel() {
                    // Do nothing
                }
                then(resolve, reject) {
                    return promise.then(resolve, reject);
                }
                catch(reject) {
                    return this.then(undefined, reject);
                }
                finally(onFinally) {
                    return promise.finally(onFinally);
                }
            };
        }
    }
    exports.SearchService = SearchService;
    class Cache {
        constructor() {
            this.resultsToSearchCache = Object.create(null);
            this.scorerCache = Object.create(null);
        }
    }
    const FileMatchItemAccessor = new class {
        getItemLabel(match) {
            return (0, path_1.basename)(match.relativePath); // e.g. myFile.txt
        }
        getItemDescription(match) {
            return (0, path_1.dirname)(match.relativePath); // e.g. some/path/to/file
        }
        getItemPath(match) {
            return match.relativePath; // e.g. some/path/to/file/myFile.txt
        }
    };
    function reviveQuery(rawQuery) {
        return {
            ...rawQuery, // TODO
            ...{
                folderQueries: rawQuery.folderQueries && rawQuery.folderQueries.map(reviveFolderQuery),
                extraFileResources: rawQuery.extraFileResources && rawQuery.extraFileResources.map(components => uri_1.URI.revive(components))
            }
        };
    }
    function reviveFolderQuery(rawFolderQuery) {
        return {
            ...rawFolderQuery,
            folder: uri_1.URI.revive(rawFolderQuery.folder)
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF3U2VhcmNoU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3NlYXJjaC9ub2RlL3Jhd1NlYXJjaFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUJoRyxNQUFhLGFBQWE7aUJBRUQsZUFBVSxHQUFHLEdBQUcsQUFBTixDQUFPO1FBSXpDLFlBQTZCLGNBQXdDLGVBQWU7WUFBdkQsZ0JBQVcsR0FBWCxXQUFXLENBQTRDO1lBRjVFLFdBQU0sR0FBa0MsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVvQixDQUFDO1FBRXpGLFVBQVUsQ0FBQyxNQUFxQjtZQUMvQixJQUFJLE9BQW9ELENBQUM7WUFFekQsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sT0FBTyxHQUFHLElBQUksZUFBTyxDQUE0RDtnQkFDdEYscUJBQXFCLEVBQUUsR0FBRyxFQUFFO29CQUMzQixPQUFPLEdBQUcsSUFBQSwrQkFBdUIsRUFBQyxLQUFLLENBQUMsRUFBRTt3QkFDekMsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsbUJBQWdCLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDMUYsQ0FBQyxDQUFDLENBQUM7b0JBRUgsT0FBTyxDQUFDLElBQUksQ0FDWCxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQ3BCLEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEVBQUUs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