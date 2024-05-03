/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/glob", "vs/base/common/resources", "vs/base/common/stopwatch", "vs/workbench/services/search/common/search"], function (require, exports, path, cancellation_1, errorMessage_1, glob, resources, stopwatch_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileSearchManager = void 0;
    class FileSearchEngine {
        constructor(config, provider, sessionToken) {
            this.config = config;
            this.provider = provider;
            this.sessionToken = sessionToken;
            this.isLimitHit = false;
            this.resultCount = 0;
            this.isCanceled = false;
            this.filePattern = config.filePattern;
            this.includePattern = config.includePattern && glob.parse(config.includePattern);
            this.maxResults = config.maxResults || undefined;
            this.exists = config.exists;
            this.activeCancellationTokens = new Set();
            this.globalExcludePattern = config.excludePattern && glob.parse(config.excludePattern);
        }
        cancel() {
            this.isCanceled = true;
            this.activeCancellationTokens.forEach(t => t.cancel());
            this.activeCancellationTokens = new Set();
        }
        search(_onResult) {
            const folderQueries = this.config.folderQueries || [];
            return new Promise((resolve, reject) => {
                const onResult = (match) => {
                    this.resultCount++;
                    _onResult(match);
                };
                // Support that the file pattern is a full path to a file that exists
                if (this.isCanceled) {
                    return resolve({ limitHit: this.isLimitHit });
                }
                // For each extra file
                if (this.config.extraFileResources) {
                    this.config.extraFileResources
                        .forEach(extraFile => {
                        const extraFileStr = extraFile.toString(); // ?
                        const basename = path.basename(extraFileStr);
                        if (this.globalExcludePattern && this.globalExcludePattern(extraFileStr, basename)) {
                            return; // excluded
                        }
                        // File: Check for match on file pattern and include pattern
                        this.matchFile(onResult, { base: extraFile, basename });
                    });
                }
                // For each root folder
                Promise.all(folderQueries.map(fq => {
                    return this.searchInFolder(fq, onResult);
                })).then(stats => {
                    resolve({
                        limitHit: this.isLimitHit,
                        stats: stats[0] || undefined // Only looking at single-folder workspace stats...
                    });
                }, (err) => {
                    reject(new Error((0, errorMessage_1.toErrorMessage)(err)));
                });
            });
        }
        async searchInFolder(fq, onResult) {
            const cancellation = new cancellation_1.CancellationTokenSource();
            const options = this.getSearchOptionsForFolder(fq);
            const tree = this.initDirectoryTree();
            const queryTester = new search_1.QueryGlobTester(this.config, fq);
            const noSiblingsClauses = !queryTester.hasSiblingExcludeClauses();
            let providerSW;
            try {
                this.activeCancellationTokens.add(cancellation);
                providerSW = stopwatch_1.StopWatch.create();
                const results = await this.provider.provideFileSearchResults({
                    pattern: this.config.filePattern || ''
                }, options, cancellation.token);
                const providerTime = providerSW.elapsed();
                const postProcessSW = stopwatch_1.StopWatch.create();
                if (this.isCanceled && !this.isLimitHit) {
                    return null;
                }
                if (results) {
                    results.forEach(result => {
                        const relativePath = path.posix.relative(fq.folder.path, result.path);
                        if (noSiblingsClauses) {
                            const basename = path.basename(result.path);
                            this.matchFile(onResult, { base: fq.folder, relativePath, basename });
                            return;
                        }
                        // TODO: Optimize siblings clauses with ripgrep here.
                        this.addDirectoryEntries(tree, fq.folder, relativePath, onResult);
                    });
                }
                if (this.isCanceled && !this.isLimitHit) {
                    return null;
                }
                this.matchDirectoryTree(tree, queryTester, onResult);
                return {
                    providerTime,
                    postProcessTime: postProcessSW.elapsed()
                };
            }
            finally {
                cancellation.dispose();
                this.activeCancellationTokens.delete(cancellation);
            }
        }
        getSearchOptionsForFolder(fq) {
            const includes = (0, search_1.resolvePatternsForProvider)(this.config.includePattern, fq.includePattern);
            const excludes = (0, search_1.resolvePatternsForProvider)(this.config.excludePattern, fq.excludePattern);
            return {
                folder: fq.folder,
                excludes,
                includes,
                useIgnoreFiles: !fq.disregardIgnoreFiles,
                useGlobalIgnoreFiles: !fq.disregardGlobalIgnoreFiles,
                useParentIgnoreFiles: !fq.disregardParentIgnoreFiles,
                followSymlinks: !fq.ignoreSymlinks,
                maxResults: this.config.maxResults,
                session: this.sessionToken
            };
        }
        initDirectoryTree() {
            const tree = {
                rootEntries: [],
                pathToEntries: Object.create(null)
            };
            tree.pathToEntries['.'] = tree.rootEntries;
            return tree;
        }
        addDirectoryEntries({ pathToEntries }, base, relativeFile, onResult) {
            // Support relative paths to files from a root resource (ignores excludes)
            if (relativeFile === this.filePattern) {
                const basename = path.basename(this.filePattern);
                this.matchFile(onResult, { base: base, relativePath: this.filePattern, basename });
            }
            function add(relativePath) {
                const basename = path.basename(relativePath);
                const dirname = path.dirname(relativePath);
                let entries = pathToEntries[dirname];
                if (!entries) {
                    entries = pathToEntries[dirname] = [];
                    add(dirname);
                }
                entries.push({
                    base,
                    relativePath,
                    basename
                });
            }
            add(relativeFile);
        }
        matchDirectoryTree({ rootEntries, pathToEntries }, queryTester, onResult) {
            const self = this;
            const filePattern = this.filePattern;
            function matchDirectory(entries) {
                const hasSibling = (0, search_1.hasSiblingFn)(() => entries.map(entry => entry.basename));
                for (let i = 0, n = entries.length; i < n; i++) {
                    const entry = entries[i];
                    const { relativePath, basename } = entry;
                    // Check exclude pattern
                    // If the user searches for the exact file name, we adjust the glob matching
                    // to ignore filtering by siblings because the user seems to know what they
                    // are searching for and we want to include the result in that case anyway
                    if (queryTester.matchesExcludesSync(relativePath, basename, filePattern !== basename ? hasSibling : undefined)) {
                        continue;
                    }
                    const sub = pathToEntries[relativePath];
                    if (sub) {
                        matchDirectory(sub);
                    }
                    else {
                        if (relativePath === filePattern) {
                            continue; // ignore file if its path matches with the file pattern because that is already matched above
                        }
                        self.matchFile(onResult, entry);
                    }
                    if (self.isLimitHit) {
                        break;
                    }
                }
            }
            matchDirectory(rootEntries);
        }
        matchFile(onResult, candidate) {
            if (!this.includePattern || (candidate.relativePath && this.includePattern(candidate.relativePath, candidate.basename))) {
                if (this.exists || (this.maxResults && this.resultCount >= this.maxResults)) {
                    this.isLimitHit = true;
                    this.cancel();
                }
                if (!this.isLimitHit) {
                    onResult(candidate);
                }
            }
        }
    }
    class FileSearchManager {
        constructor() {
            this.sessions = new Map();
        }
        static { this.BATCH_SIZE = 512; }
        fileSearch(config, provider, onBatch, token) {
            const sessionTokenSource = this.getSessionTokenSource(config.cacheKey);
            const engine = new FileSearchEngine(config, provider, sessionTokenSource && sessionTokenSource.token);
            let resultCount = 0;
            const onInternalResult = (batch) => {
                resultCount += batch.length;
                onBatch(batch.map(m => this.rawMatchToSearchItem(m)));
            };
            return this.doSearch(engine, FileSearchManager.BATCH_SIZE, onInternalResult, token).then(result => {
                return {
                    limitHit: result.limitHit,
                    stats: {
                        fromCache: false,
                        type: 'fileSearchProvider',
                        resultCount,
                        detailStats: result.stats
                    }
                };
            });
        }
        clearCache(cacheKey) {
            const sessionTokenSource = this.getSessionTokenSource(cacheKey);
            sessionTokenSource?.cancel();
        }
        getSessionTokenSource(cacheKey) {
            if (!cacheKey) {
                return undefined;
            }
            if (!this.sessions.has(cacheKey)) {
                this.sessions.set(cacheKey, new cancellation_1.CancellationTokenSource());
            }
            return this.sessions.get(cacheKey);
        }
        rawMatchToSearchItem(match) {
            if (match.relativePath) {
                return {
                    resource: resources.joinPath(match.base, match.relativePath)
                };
            }
            else {
                // extraFileResources
                return {
                    resource: match.base
                };
            }
        }
        doSearch(engine, batchSize, onResultBatch, token) {
            const listener = token.onCancellationRequested(() => {
                engine.cancel();
            });
            const _onResult = (match) => {
                if (match) {
                    batch.push(match);
                    if (batchSize > 0 && batch.length >= batchSize) {
                        onResultBatch(batch);
                        batch = [];
                    }
                }
            };
            let batch = [];
            return engine.search(_onResult).then(result => {
                if (batch.length) {
                    onResultBatch(batch);
                }
                listener.dispose();
                return result;
            }, error => {
                if (batch.length) {
                    onResultBatch(batch);
                }
                listener.dispose();
                return Promise.reject(error);
            });
        }
    }
    exports.FileSearchManager = FileSearchManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZVNlYXJjaE1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvY29tbW9uL2ZpbGVTZWFyY2hNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQStCaEcsTUFBTSxnQkFBZ0I7UUFhckIsWUFBb0IsTUFBa0IsRUFBVSxRQUE0QixFQUFVLFlBQWdDO1lBQWxHLFdBQU0sR0FBTixNQUFNLENBQVk7WUFBVSxhQUFRLEdBQVIsUUFBUSxDQUFvQjtZQUFVLGlCQUFZLEdBQVosWUFBWSxDQUFvQjtZQVI5RyxlQUFVLEdBQUcsS0FBSyxDQUFDO1lBQ25CLGdCQUFXLEdBQUcsQ0FBQyxDQUFDO1lBQ2hCLGVBQVUsR0FBRyxLQUFLLENBQUM7WUFPMUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxjQUFjLEdBQUcsTUFBTSxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNqRixJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxVQUFVLElBQUksU0FBUyxDQUFDO1lBQ2pELElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUM1QixJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxHQUFHLEVBQTJCLENBQUM7WUFFbkUsSUFBSSxDQUFDLG9CQUFvQixHQUFHLE1BQU0sQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDeEYsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUN2QixJQUFJLENBQUMsd0JB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