/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob", "vs/base/common/uri", "vs/base/common/path", "vs/base/common/cancellation", "vs/workbench/services/search/common/getFileResults", "vs/workbench/services/search/common/ignoreFile", "vs/base/common/strings", "vs/base/common/async", "vs/base/common/resources"], function (require, exports, glob, uri_1, paths, cancellation_1, getFileResults_1, ignoreFile_1, strings_1, async_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalFileSearchSimpleWorker = void 0;
    exports.create = create;
    const PERF = false;
    const globalStart = +new Date();
    const itrcount = {};
    const time = async (name, task) => {
        if (!PERF) {
            return task();
        }
        const start = Date.now();
        const itr = (itrcount[name] ?? 0) + 1;
        console.info(name, itr, 'starting', Math.round((start - globalStart) * 10) / 10000);
        itrcount[name] = itr;
        const r = await task();
        const end = Date.now();
        console.info(name, itr, 'took', end - start);
        return r;
    };
    /**
     * Called on the worker side
     * @internal
     */
    function create(host) {
        return new LocalFileSearchSimpleWorker(host);
    }
    class LocalFileSearchSimpleWorker {
        constructor(host) {
            this.host = host;
            this.cancellationTokens = new Map();
        }
        cancelQuery(queryId) {
            this.cancellationTokens.get(queryId)?.cancel();
        }
        registerCancellationToken(queryId) {
            const source = new cancellation_1.CancellationTokenSource();
            this.cancellationTokens.set(queryId, source);
            return source;
        }
        async listDirectory(handle, query, folderQuery, ignorePathCasing, queryId) {
            const revivedFolderQuery = reviveFolderQuery(folderQuery);
            const extUri = new resources_1.ExtUri(() => ignorePathCasing);
            const token = this.registerCancellationToken(queryId);
            const entries = [];
            let limitHit = false;
            let count = 0;
            const max = query.maxResults || 512;
            const filePatternMatcher = query.filePattern
                ? (name) => query.filePattern.split('').every(c => name.includes(c))
                : (name) => true;
            await time('listDirectory', () => this.walkFolderQuery(handle, reviveQueryProps(query), revivedFolderQuery, extUri, file => {
                if (!filePatternMatcher(file.name)) {
                    return;
                }
                count++;
                if (max && count > max) {
                    limitHit = true;
                    token.cancel();
                }
                return entries.push(file.path);
            }, token.token));
            return {
                results: entries,
                limitHit
            };
        }
        async searchDirectory(handle, query, folderQuery, ignorePathCasing, queryId) {
            const revivedQuery = reviveFolderQuery(folderQuery);
            const extUri = new resources_1.ExtUri(() => ignorePathCasing);
            return time('searchInFiles', async () => {
                const token = this.registerCancellationToken(queryId);
                const results = [];
                const pattern = createSearchRegExp(query.contentPattern);
                const onGoingProcesses = [];
                let fileCount = 0;
                let resultCount = 0;
                const limitHit = false;
                const processFile = async (file) => {
                    if (token.token.isCancellationRequested) {
                        return;
                    }
                    fileCount++;
                    const contents = await file.resolve();
                    if (token.token.isCancellationRequested) {
                        return;
                    }
                    const bytes = new Uint8Array(contents);
                    const fileResults = (0, getFileResults_1.getFileResults)(bytes, pattern, {
                        afterContext: query.afterContext ?? 0,
                        beforeContext: query.beforeContext ?? 0,
                        previewOptions: query.previewOptions,
                        remainingResultQuota: query.maxResults ? (query.maxResults - resultCount) : 10000,
                    });
                    if (fileResults.length) {
                        resultCount += fileResults.length;
                        if (query.maxResults && resultCount > query.maxResults) {
                            token.cancel();
                        }
                        const match = {
                            resource: uri_1.URI.joinPath(revivedQuery.folder, file.path),
                            results: fileResults,
                        };
                        this.host.sendTextSearchMatch(match, queryId);
                        results.push(match);
                    }
                };
                await time('walkFolderToResolve', () => this.walkFolderQuery(handle, reviveQueryProps(query), revivedQuery, extUri, async (file) => onGoingProcesses.push(processFile(file)), token.token));
                await time('resolveOngoingProcesses', () => Promise.all(onGoingProcesses));
                if (PERF) {
                    console.log('Searched in', fileCount, 'files');
                }
                return {
                    results,
                    limitHit,
                };
            });
        }
        async walkFolderQuery(handle, queryProps, folderQuery, extUri, onFile, token) {
            const folderExcludes = glob.parse(folderQuery.excludePattern ?? {}, { trimForExclusions: true });
            // For folders, only check if the folder is explicitly excluded so walking continues.
            const isFolderExcluded = (path, basename, hasSibling) => {
                path = path.slice(1);
                if (folderExcludes(path, basename, hasSibling)) {
                    return true;
                }
                if (pathExcludedInQuery(queryProps, path)) {
                    return true;
                }
                return false;
            };
            // For files ensure the full check takes place.
            const isFileIncluded = (path, basename, hasSibling) => {
                path = path.slice(1);
                if (folderExcludes(path, basename, hasSibling)) {
                    return false;
                }
                if (!pathIncludedInQuery(queryProps, path, extUri)) {
                    return false;
                }
                return true;
            };
            const processFile = (file, prior) => {
                const resolved = {
                    type: 'file',
                    name: file.name,
                    path: prior,
                    resolve: () => file.getFile().then(r => r.arrayBuffer())
                };
                return resolved;
            };
            const isFileSystemDirectoryHandle = (handle) => {
                return handle.kind === 'directory';
            };
            const isFileSystemFileHandle = (handle) => {
                return handle.kind === 'file';
            };
            const processDirectory = async (directory, prior, ignoreFile) => {
                if (!folderQuery.disregardIgnoreFiles) {
                    const ignoreFiles = await Promise.all([
                        directory.getFileHandle('.gitignore').catch(e => undefined),
                        directory.getFileHandle('.ignore').catch(e => undefined),
                    ]);
                    await Promise.all(ignoreFiles.map(async (file) => {
                        if (!file) {
                            return;
                        }
                        const ignoreContents = new TextDecoder('utf8').decode(new Uint8Array(await (await file.getFile()).arrayBuffer()));
                        ignoreFile = new ignoreFile_1.IgnoreFile(ignoreContents, prior, ignoreFile);
                    }));
                }
                const entries = async_1.Promises.withAsyncBody(async (c) => {
                    const files = [];
                    const dirs = [];
                    const entries = [];
                    const sibilings = new Set();
                    for await (const entry of directory.entries()) {
                        entries.push(entry);
                        sibilings.add(entry[0]);
                    }
                    for (const [basename, handle] of entries) {
                        if (token.isCancellationRequested) {
                            break;
                        }
                        const path = prior + basename;
                        if (ignoreFile && !ignoreFile.isPathIncludedInTraversal(path, handle.kind === 'directory')) {
                            continue;
                        }
                        const hasSibling = (query) => sibilings.has(query);
                        if (isFileSystemDirectoryHandle(handle) && !isFolderExcluded(path, basename, hasSibling)) {
                            dirs.push(processDirectory(handle, path + '/', ignoreFile));
                        }
                        else if (isFileSystemFileHandle(handle) && isFileIncluded(path, basename, hasSibling)) {
                            files.push(processFile(handle, path));
                        }
                    }
                    c([...await Promise.all(dirs), ...files]);
                });
                return {
                    type: 'dir',
                    name: directory.name,
                    entries
                };
            };
            const resolveDirectory = async (directory, onFile) => {
                if (token.isCancellationRequested) {
                    return;
                }
                await Promise.all((await directory.entries)
                    .sort((a, b) => -(a.type === 'dir' ? 0 : 1) + (b.type === 'dir' ? 0 : 1))
                    .map(async (entry) => {
                    if (entry.type === 'dir') {
                        return resolveDirectory(entry, onFile);
                    }
                    else {
                        return onFile(entry);
                    }
                }));
            };
            const processed = await time('process', () => processDirectory(handle, '/'));
            await time('resolve', () => resolveDirectory(processed, onFile));
        }
    }
    exports.LocalFileSearchSimpleWorker = LocalFileSearchSimpleWorker;
    function createSearchRegExp(options) {
        return (0, strings_1.createRegExp)(options.pattern, !!options.isRegExp, {
            wholeWord: options.isWordMatch,
            global: true,
            matchCase: options.isCaseSensitive,
            multiline: true,
            unicode: true,
        });
    }
    function reviveFolderQuery(folderQuery) {
        return {
            ...folderQuery,
            folder: uri_1.URI.revive(folderQuery.folder),
        };
    }
    function reviveQueryProps(queryProps) {
        return {
            ...queryProps,
            extraFileResources: queryProps.extraFileResources?.map(r => uri_1.URI.revive(r)),
            folderQueries: queryProps.folderQueries.map(fq => reviveFolderQuery(fq)),
        };
    }
    function pathExcludedInQuery(queryProps, fsPath) {
        if (queryProps.excludePattern && glob.match(queryProps.excludePattern, fsPath)) {
            return true;
        }
        return false;
    }
    function pathIncludedInQuery(queryProps, path, extUri) {
        if (queryProps.excludePattern && glob.match(queryProps.excludePattern, path)) {
            return false;
        }
        if (queryProps.includePattern || queryProps.usingSearchPaths) {
            if (queryProps.includePattern && glob.match(queryProps.includePattern, path)) {
                return true;
            }
            // If searchPaths are being used, the extra file must be in a subfolder and match the pattern, if present
            if (queryProps.usingSearchPaths) {
                return !!queryProps.folderQueries && queryProps.folderQueries.some(fq => {
                    const searchPath = fq.folder;
                    const uri = uri_1.URI.file(path);
                    if (extUri.isEqualOrParent(uri, searchPath)) {
                        const relPath = paths.relative(searchPath.path, uri.path);
                        return !fq.includePattern || !!glob.match(fq.includePattern, relPath);
                    }
                    else {
                        return false;
                    }
                });
            }
            return false;
        }
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxGaWxlU2VhcmNoLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VhcmNoL3dvcmtlci9sb2NhbEZpbGVTZWFyY2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0RoRyx3QkFFQztJQXJDRCxNQUFNLElBQUksR0FBRyxLQUFLLENBQUM7SUFlbkIsTUFBTSxXQUFXLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO0lBQ2hDLE1BQU0sUUFBUSxHQUEyQixFQUFFLENBQUM7SUFDNUMsTUFBTSxJQUFJLEdBQUcsS0FBSyxFQUFLLElBQVksRUFBRSxJQUEwQixFQUFFLEVBQUU7UUFDbEUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQztRQUFDLENBQUM7UUFFN0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLE1BQU0sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN0QyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFFcEYsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUNyQixNQUFNLENBQUMsR0FBRyxNQUFNLElBQUksRUFBRSxDQUFDO1FBQ3ZCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUN2QixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUs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