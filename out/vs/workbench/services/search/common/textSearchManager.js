/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/workbench/services/search/common/search"], function (require, exports, arrays_1, async_1, cancellation_1, errorMessage_1, network_1, path, resources, uri_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BatchedCollector = exports.TextSearchResultsCollector = exports.TextSearchManager = void 0;
    exports.extensionResultIsMatch = extensionResultIsMatch;
    class TextSearchManager {
        constructor(queryProviderPair, fileUtils, processType) {
            this.queryProviderPair = queryProviderPair;
            this.fileUtils = fileUtils;
            this.processType = processType;
            this.collector = null;
            this.isLimitHit = false;
            this.resultCount = 0;
        }
        get query() {
            return this.queryProviderPair.query;
        }
        search(onProgress, token) {
            const folderQueries = this.query.folderQueries || [];
            const tokenSource = new cancellation_1.CancellationTokenSource(token);
            return new Promise((resolve, reject) => {
                this.collector = new TextSearchResultsCollector(onProgress);
                let isCanceled = false;
                const onResult = (result, folderIdx) => {
                    if (isCanceled) {
                        return;
                    }
                    if (!this.isLimitHit) {
                        const resultSize = this.resultSize(result);
                        if (extensionResultIsMatch(result) && typeof this.query.maxResults === 'number' && this.resultCount + resultSize > this.query.maxResults) {
                            this.isLimitHit = true;
                            isCanceled = true;
                            tokenSource.cancel();
                            result = this.trimResultToSize(result, this.query.maxResults - this.resultCount);
                        }
                        const newResultSize = this.resultSize(result);
                        this.resultCount += newResultSize;
                        if (newResultSize > 0 || !extensionResultIsMatch(result)) {
                            this.collector.add(result, folderIdx);
                        }
                    }
                };
                // For each root folder
                Promise.all(folderQueries.map((fq, i) => {
                    return this.searchInFolder(fq, r => onResult(r, i), tokenSource.token);
                })).then(results => {
                    tokenSource.dispose();
                    this.collector.flush();
                    const someFolderHitLImit = results.some(result => !!result && !!result.limitHit);
                    resolve({
                        limitHit: this.isLimitHit || someFolderHitLImit,
                        messages: (0, arrays_1.flatten)(results.map(result => {
                            if (!result?.message) {
                                return [];
                            }
                            if (Array.isArray(result.message)) {
                                return result.message;
                            }
                            else {
                                return [result.message];
                            }
                        })),
                        stats: {
                            type: this.processType
                        }
                    });
                }, (err) => {
                    tokenSource.dispose();
                    const errMsg = (0, errorMessage_1.toErrorMessage)(err);
                    reject(new Error(errMsg));
                });
            });
        }
        resultSize(result) {
            if (extensionResultIsMatch(result)) {
                return Array.isArray(result.ranges) ?
                    result.ranges.length :
                    1;
            }
            else {
                // #104400 context lines shoudn't count towards result count
                return 0;
            }
        }
        trimResultToSize(result, size) {
            const rangesArr = Array.isArray(result.ranges) ? result.ranges : [result.ranges];
            const matchesArr = Array.isArray(result.preview.matches) ? result.preview.matches : [result.preview.matches];
            return {
                ranges: rangesArr.slice(0, size),
                preview: {
                    matches: matchesArr.slice(0, size),
                    text: result.preview.text
                },
                uri: result.uri
            };
        }
        async searchInFolder(folderQuery, onResult, token) {
            const queryTester = new search_1.QueryGlobTester(this.query, folderQuery);
            const testingPs = [];
            const progress = {
                report: (result) => {
                    if (!this.validateProviderResult(result)) {
                        return;
                    }
                    const hasSibling = folderQuery.folder.scheme === network_1.Schemas.file ?
                        (0, search_1.hasSiblingPromiseFn)(() => {
                            return this.fileUtils.readdir(resources.dirname(result.uri));
                        }) :
                        undefined;
                    const relativePath = resources.relativePath(folderQuery.folder, result.uri);
                    if (relativePath) {
                        // This method is only async when the exclude contains sibling clauses
                        const included = queryTester.includedInQuery(relativePath, path.basename(relativePath), hasSibling);
                        if ((0, async_1.isThenable)(included)) {
                            testingPs.push(included.then(isIncluded => {
                                if (isIncluded) {
                                    onResult(result);
                                }
                            }));
                        }
                        else if (included) {
                            onResult(result);
                        }
                    }
                }
            };
            const searchOptions = this.getSearchOptionsForFolder(folderQuery);
            let result;
            if (this.queryProviderPair.query.type === 3 /* QueryType.aiText */) {
                result = await this.queryProviderPair.provider.provideAITextSearchResults(this.queryProviderPair.query.contentPattern, searchOptions, progress, token);
            }
            else {
                result = await this.queryProviderPair.provider.provideTextSearchResults(patternInfoToQuery(this.queryProviderPair.query.contentPattern), searchOptions, progress, token);
            }
            if (testingPs.length) {
                await Promise.all(testingPs);
            }
            return result;
        }
        validateProviderResult(result) {
            if (extensionResultIsMatch(result)) {
                if (Array.isArray(result.ranges)) {
                    if (!Array.isArray(result.preview.matches)) {
                        console.warn('INVALID - A text search provider match\'s`ranges` and`matches` properties must have the same type.');
                        return false;
                    }
                    if (result.preview.matches.length !== result.ranges.length) {
                        console.warn('INVALID - A text search provider match\'s`ranges` and`matches` properties must have the same length.');
                        return false;
                    }
                }
                else {
                    if (Array.isArray(result.preview.matches)) {
                        console.warn('INVALID - A text search provider match\'s`ranges` and`matches` properties must have the same length.');
                        return false;
                    }
                }
            }
            return true;
        }
        getSearchOptionsForFolder(fq) {
            const includes = (0, search_1.resolvePatternsForProvider)(this.query.includePattern, fq.includePattern);
            const excludes = (0, search_1.resolvePatternsForProvider)(this.query.excludePattern, fq.excludePattern);
            const options = {
                folder: uri_1.URI.from(fq.folder),
                excludes,
                includes,
                useIgnoreFiles: !fq.disregardIgnoreFiles,
                useGlobalIgnoreFiles: !fq.disregardGlobalIgnoreFiles,
                useParentIgnoreFiles: !fq.disregardParentIgnoreFiles,
                followSymlinks: !fq.ignoreSymlinks,
                encoding: fq.fileEncoding && this.fileUtils.toCanonicalName(fq.fileEncoding),
                maxFileSize: this.query.maxFileSize,
                maxResults: this.query.maxResults,
                previewOptions: this.query.previewOptions,
                afterContext: this.query.afterContext,
                beforeContext: this.query.beforeContext
            };
            if ('usePCRE2' in this.query) {
                options.usePCRE2 = this.query.usePCRE2;
            }
            return options;
        }
    }
    exports.TextSearchManager = TextSearchManager;
    function patternInfoToQuery(patternInfo) {
        return {
            isCaseSensitive: patternInfo.isCaseSensitive || false,
            isRegExp: patternInfo.isRegExp || false,
            isWordMatch: patternInfo.isWordMatch || false,
            isMultiline: patternInfo.isMultiline || false,
            pattern: patternInfo.pattern
        };
    }
    class TextSearchResultsCollector {
        constructor(_onResult) {
            this._onResult = _onResult;
            this._currentFolderIdx = -1;
            this._currentFileMatch = null;
            this._batchedCollector = new BatchedCollector(512, items => this.sendItems(items));
        }
        add(data, folderIdx) {
            // Collects TextSearchResults into IInternalFileMatches and collates using BatchedCollector.
            // This is efficient for ripgrep which sends results back one file at a time. It wouldn't be efficient for other search
            // providers that send results in random order. We could do this step afterwards instead.
            if (this._currentFileMatch && (this._currentFolderIdx !== folderIdx || !resources.isEqual(this._currentUri, data.uri))) {
                this.pushToCollector();
                this._currentFileMatch = null;
            }
            if (!this._currentFileMatch) {
                this._currentFolderIdx = folderIdx;
                this._currentFileMatch = {
                    resource: data.uri,
                    results: []
                };
            }
            this._currentFileMatch.results.push(extensionResultToFrontendResult(data));
        }
        pushToCollector() {
            const size = this._currentFileMatch && this._currentFileMatch.results ?
                this._currentFileMatch.results.length :
                0;
            this._batchedCollector.addItem(this._currentFileMatch, size);
        }
        flush() {
            this.pushToCollector();
            this._batchedCollector.flush();
        }
        sendItems(items) {
            this._onResult(items);
        }
    }
    exports.TextSearchResultsCollector = TextSearchResultsCollector;
    function extensionResultToFrontendResult(data) {
        // Warning: result from RipgrepTextSearchEH has fake Range. Don't depend on any other props beyond these...
        if (extensionResultIsMatch(data)) {
            return {
                preview: {
                    matches: (0, arrays_1.mapArrayOrNot)(data.preview.matches, m => ({
                        startLineNumber: m.start.line,
                        startColumn: m.start.character,
                        endLineNumber: m.end.line,
                        endColumn: m.end.character
                    })),
                    text: data.preview.text
                },
                ranges: (0, arrays_1.mapArrayOrNot)(data.ranges, r => ({
                    startLineNumber: r.start.line,
                    startColumn: r.start.character,
                    endLineNumber: r.end.line,
                    endColumn: r.end.character
                }))
            };
        }
        else {
            return {
                text: data.text,
                lineNumber: data.lineNumber
            };
        }
    }
    function extensionResultIsMatch(data) {
        return !!data.preview;
    }
    /**
     * Collects items that have a size - before the cumulative size of collected items reaches START_BATCH_AFTER_COUNT, the callback is called for every
     * set of items collected.
     * But after that point, the callback is called with batches of maxBatchSize.
     * If the batch isn't filled within some time, the callback is also called.
     */
    class BatchedCollector {
        static { this.TIMEOUT = 4000; }
        // After START_BATCH_AFTER_COUNT items have been collected, stop flushing on timeout
        static { this.START_BATCH_AFTER_COUNT = 50; }
        constructor(maxBatchSize, cb) {
            this.maxBatchSize = maxBatchSize;
            this.cb = cb;
            this.totalNumberCompleted = 0;
            this.batch = [];
            this.batchSize = 0;
        }
        addItem(item, size) {
            if (!item) {
                return;
            }
            this.addItemToBatch(item, size);
        }
        addItems(items, size) {
            if (!items) {
                return;
            }
            this.addItemsToBatch(items, size);
        }
        addItemToBatch(item, size) {
            this.batch.push(item);
            this.batchSize += size;
            this.onUpdate();
        }
        addItemsToBatch(item, size) {
            this.batch = this.batch.concat(item);
            this.batchSize += size;
            this.onUpdate();
        }
        onUpdate() {
            if (this.totalNumberCompleted < BatchedCollector.START_BATCH_AFTER_COUNT) {
                // Flush because we aren't batching yet
                this.flush();
            }
            else if (this.batchSize >= this.maxBatchSize) {
                // Flush because the batch is full
                this.flush();
            }
            else if (!this.timeoutHandle) {
                // No timeout running, start a timeout to flush
                this.timeoutHandle = setTimeout(() => {
                    this.flush();
                }, BatchedCollector.TIMEOUT);
            }
        }
        flush() {
            if (this.batchSize) {
                this.totalNumberCompleted += this.batchSize;
                this.cb(this.batch);
                this.batch = [];
                this.batchSize = 0;
                if (this.timeoutHandle) {
                    clearTimeout(this.timeoutHandle);
                    this.timeoutHandle = 0;
                }
            }
        }
    }
    exports.BatchedCollector = BatchedCollector;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFNlYXJjaE1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvY29tbW9uL3RleHRTZWFyY2hNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW1UaEcsd0RBRUM7SUE3UkQsTUFBYSxpQkFBaUI7UUFPN0IsWUFBb0IsaUJBQW9FLEVBQy9FLFNBQXFCLEVBQ3JCLFdBQXFDO1lBRjFCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUQ7WUFDL0UsY0FBUyxHQUFULFNBQVMsQ0FBWTtZQUNyQixnQkFBVyxHQUFYLFdBQVcsQ0FBMEI7WUFQdEMsY0FBUyxHQUFzQyxJQUFJLENBQUM7WUFFcEQsZUFBVSxHQUFHLEtBQUssQ0FBQztZQUNuQixnQkFBVyxHQUFHLENBQUMsQ0FBQztRQUkwQixDQUFDO1FBRW5ELElBQVksS0FBSztZQUNoQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7UUFDckMsQ0FBQztRQUVELE1BQU0sQ0FBQyxVQUEyQyxFQUFFLEtBQXdCO1lBQzNFLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxJQUFJLEVBQUUsQ0FBQztZQUNyRCxNQUFNLFdBQVcsR0FBRyxJQUFJLHNDQUF1QixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXZELE9BQU8sSUFBSSxPQUFPLENBQXVCLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUM1RCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksMEJBQTBCLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBRTVELElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztnQkFDdkIsTUFBTSxRQUFRLEdBQUcsQ0FBQyxNQUF3QixFQUFFLFNBQWlCLEVBQUUsRUFBRTtvQkFD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