/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/event", "vs/base/common/network", "vs/base/common/path", "vs/base/common/uri", "vs/base/test/node/testUtils", "vs/workbench/services/search/common/search", "vs/workbench/services/search/node/rawSearchService"], function (require, exports, assert, async_1, event_1, network_1, path, uri_1, testUtils_1, search_1, rawSearchService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const TEST_FOLDER_QUERIES = [
        { folder: uri_1.URI.file(path.normalize('/some/where')) }
    ];
    const TEST_FIXTURES = path.normalize(network_1.FileAccess.asFileUri('vs/workbench/services/search/test/node/fixtures').fsPath);
    const MULTIROOT_QUERIES = [
        { folder: uri_1.URI.file(path.join(TEST_FIXTURES, 'examples')) },
        { folder: uri_1.URI.file(path.join(TEST_FIXTURES, 'more')) }
    ];
    const stats = {
        fileWalkTime: 0,
        cmdTime: 1,
        directoriesWalked: 2,
        filesWalked: 3
    };
    class TestSearchEngine {
        constructor(result, config) {
            this.result = result;
            this.config = config;
            this.isCanceled = false;
            TestSearchEngine.last = this;
        }
        search(onResult, onProgress, done) {
            const self = this;
            (function next() {
                process.nextTick(() => {
                    if (self.isCanceled) {
                        done(null, {
                            limitHit: false,
                            stats: stats,
                            messages: [],
                        });
                        return;
                    }
                    const result = self.result();
                    if (!result) {
                        done(null, {
                            limitHit: false,
                            stats: stats,
                            messages: [],
                        });
                    }
                    else {
                        onResult(result);
                        next();
                    }
                });
            })();
        }
        cancel() {
            this.isCanceled = true;
        }
    }
    (0, testUtils_1.flakySuite)('RawSearchService', () => {
        const rawSearch = {
            type: 1 /* QueryType.File */,
            folderQueries: TEST_FOLDER_QUERIES,
            filePattern: 'a'
        };
        const rawMatch = {
            base: path.normalize('/some'),
            relativePath: 'where',
            searchPath: undefined
        };
        const match = {
            path: path.normalize('/some/where')
        };
        test('Individual results', async function () {
            let i = 5;
            const Engine = TestSearchEngine.bind(null, () => i-- ? rawMatch : null);
            const service = new rawSearchService_1.SearchService();
            let results = 0;
            const cb = value => {
                if (!!value.message) {
                    return;
                }
                if (!Array.isArray(value)) {
                    assert.deepStrictEqual(value, match);
                    results++;
                }
                else {
                    assert.fail(JSON.stringify(value));
                }
            };
            await service.doFileSearchWithEngine(Engine, rawSearch, cb, null, 0);
            return assert.strictEqual(results, 5);
        });
        test('Batch results', async function () {
            let i = 25;
            const Engine = TestSearchEngine.bind(null, () => i-- ? rawMatch : null);
            const service = new rawSearchService_1.SearchService();
            const results = [];
            const cb = value => {
                if (!!value.message) {
                    return;
                }
                if (Array.isArray(value)) {
                    value.forEach(m => {
                        assert.deepStrictEqual(m, match);
                    });
                    results.push(value.length);
                }
                else {
                    assert.fail(JSON.stringify(value));
                }
            };
            await service.doFileSearchWithEngine(Engine, rawSearch, cb, undefined, 10);
            assert.deepStrictEqual(results, [10, 10, 5]);
        });
        test('Collect batched results', async function () {
            const uriPath = '/some/where';
            let i = 25;
            const Engine = TestSearchEngine.bind(null, () => i-- ? rawMatch : null);
            const service = new rawSearchService_1.SearchService();
            function fileSearch(config, batchSize) {
                let promise;
                const emitter = new event_1.Emitter({
                    onWillAddFirstListener: () => {
                        promise = (0, async_1.createCancelablePromise)(token => service.doFileSearchWithEngine(Engine, config, p => emitter.fire(p), token, batchSize)
                            .then(c => emitter.fire(c), err => emitter.fire({ type: 'error', error: err })));
                    },
                    onDidRemoveLastListener: () => {
                        promise.cancel();
                    }
                });
                return emitter.event;
            }
            const result = await collectResultsFromEvent(fileSearch(rawSearch, 10));
            result.files.forEach(f => {
                assert.strictEqual(f.path.replace(/\\/g, '/'), uriPath);
            });
            assert.strictEqual(result.files.length, 25, 'Result');
        });
        test('Multi-root with include pattern and maxResults', async function () {
            const service = new rawSearchService_1.SearchService();
            const query = {
                type: 1 /* QueryType.File */,
                folderQueries: MULTIROOT_QUERIES,
                maxResults: 1,
                includePattern: {
                    '*.txt': true,
                    '*.js': true
                },
            };
            const result = await collectResultsFromEvent(service.fileSearch(query));
            assert.strictEqual(result.files.length, 1, 'Result');
        });
        test('Handles maxResults=0 correctly', async function () {
            const service = new rawSearchService_1.SearchService();
            const query = {
                type: 1 /* QueryType.File */,
                folderQueries: MULTIROOT_QUERIES,
                maxResults: 0,
                sortByScore: true,
                includePattern: {
                    '*.txt': true,
                    '*.js': true
                },
            };
            const result = await collectResultsFromEvent(service.fileSearch(query));
            assert.strictEqual(result.files.length, 0, 'Result');
        });
        test('Multi-root with include pattern and exists', async function () {
            const service = new rawSearchService_1.SearchService();
            const query = {
                type: 1 /* QueryType.File */,
                folderQueries: MULTIROOT_QUERIES,
                exists: true,
                includePattern: {
                    '*.txt': true,
                    '*.js': true
                },
            };
            const result = await collectResultsFromEvent(service.fileSearch(query));
            assert.strictEqual(result.files.length, 0, 'Result');
            assert.ok(result.limitHit);
        });
        test('Sorted results', async function () {
            const paths = ['bab', 'bbc', 'abb'];
            const matches = paths.map(relativePath => ({
                base: path.normalize('/some/where'),
                relativePath,
                basename: relativePath,
                size: 3,
                searchPath: undefined
            }));
            const Engine = TestSearchEngine.bind(null, () => matches.shift());
            const service = new rawSearchService_1.SearchService();
            const results = [];
            const cb = value => {
                if (!!value.message) {
                    return;
                }
                if (Array.isArray(value)) {
                    results.push(...value.map(v => v.path));
                }
                else {
                    assert.fail(JSON.stringify(value));
                }
            };
            await service.doFileSearchWithEngine(Engine, {
                type: 1 /* QueryType.File */,
                folderQueries: TEST_FOLDER_QUERIES,
                filePattern: 'bb',
                sortByScore: true,
                maxResults: 2
            }, cb, undefined, 1);
            assert.notStrictEqual(typeof TestSearchEngine.last.config.maxResults, 'number');
            assert.deepStrictEqual(results, [path.normalize('/some/where/bbc'), path.normalize('/some/where/bab')]);
        });
        test('Sorted result batches', async function () {
            let i = 25;
            const Engine = TestSearchEngine.bind(null, () => i-- ? rawMatch : null);
            const service = new rawSearchService_1.SearchService();
            const results = [];
            const cb = value => {
                if (!!value.message) {
                    return;
                }
                if (Array.isArray(value)) {
                    value.forEach(m => {
                        assert.deepStrictEqual(m, match);
                    });
                    results.push(value.length);
                }
                else {
                    assert.fail(JSON.stringify(value));
                }
            };
            await service.doFileSearchWithEngine(Engine, {
                type: 1 /* QueryType.File */,
                folderQueries: TEST_FOLDER_QUERIES,
                filePattern: 'a',
                sortByScore: true,
                maxResults: 23
            }, cb, undefined, 10);
            assert.deepStrictEqual(results, [10, 10, 3]);
        });
        test('Cached results', function () {
            const paths = ['bcb', 'bbc', 'aab'];
            const matches = paths.map(relativePath => ({
                base: path.normalize('/some/where'),
                relativePath,
                basename: relativePath,
                size: 3,
                searchPath: undefined
            }));
            const Engine = TestSearchEngine.bind(null, () => matches.shift());
            const service = new rawSearchService_1.SearchService();
            const results = [];
            const cb = value => {
                if (!!value.message) {
                    return;
                }
                if (Array.isArray(value)) {
                    results.push(...value.map(v => v.path));
                }
                else {
                    assert.fail(JSON.stringify(value));
                }
            };
            return service.doFileSearchWithEngine(Engine, {
                type: 1 /* QueryType.File */,
                folderQueries: TEST_FOLDER_QUERIES,
                filePattern: 'b',
                sortByScore: true,
                cacheKey: 'x'
            }, cb, undefined, -1).then(complete => {
                assert.strictEqual(complete.stats.fromCache, false);
                assert.deepStrictEqual(results, [path.normalize('/some/where/bcb'), path.normalize('/some/where/bbc'), path.normalize('/some/where/aab')]);
            }).then(async () => {
                const results = [];
                const cb = value => {
                    if (Array.isArray(value)) {
                        results.push(...value.map(v => v.path));
                    }
                    else {
                        assert.fail(JSON.stringify(value));
                    }
                };
                try {
                    const complete = await service.doFileSearchWithEngine(Engine, {
                        type: 1 /* QueryType.File */,
                        folderQueries: TEST_FOLDER_QUERIES,
                        filePattern: 'bc',
                        sortByScore: true,
                        cacheKey: 'x'
                    }, cb, undefined, -1);
                    assert.ok(complete.stats.fromCache);
                    assert.deepStrictEqual(results, [path.normalize('/some/where/bcb'), path.normalize('/some/where/bbc')]);
                }
                catch (e) { }
            }).then(() => {
                return service.clearCache('x');
            }).then(async () => {
                matches.push({
                    base: path.normalize('/some/where'),
                    relativePath: 'bc',
                    searchPath: undefined
                });
                const results = [];
                const cb = value => {
                    if (!!value.message) {
                        return;
                    }
                    if (Array.isArray(value)) {
                        results.push(...value.map(v => v.path));
                    }
                    else {
                        assert.fail(JSON.stringify(value));
                    }
                };
                const complete = await service.doFileSearchWithEngine(Engine, {
                    type: 1 /* QueryType.File */,
                    folderQueries: TEST_FOLDER_QUERIES,
                    filePattern: 'bc',
                    sortByScore: true,
                    cacheKey: 'x'
                }, cb, undefined, -1);
                assert.strictEqual(complete.stats.fromCache, false);
                assert.deepStrictEqual(results, [path.normalize('/some/where/bc')]);
            });
        });
    });
    function collectResultsFromEvent(event) {
        const files = [];
        let listener;
        return new Promise((c, e) => {
            listener = event(ev => {
                if ((0, search_1.isSerializedSearchComplete)(ev)) {
                    if ((0, search_1.isSerializedSearchSuccess)(ev)) {
                        c({ files, limitHit: ev.limitHit });
                    }
                    else {
                        e(ev.error);
                    }
                    listener.dispose();
                }
                else if (Array.isArray(ev)) {
                    files.push(...ev);
                }
                else if (ev.path) {
                    files.push(ev);
                }
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF3U2VhcmNoU2VydmljZS5pbnRlZ3JhdGlvblRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvdGVzdC9ub2RlL3Jhd1NlYXJjaFNlcnZpY2UuaW50ZWdyYXRpb25UZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLE1BQU0sbUJBQW1CLEdBQUc7UUFDM0IsRUFBRSxNQUFNLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUU7S0FDbkQsQ0FBQztJQUVGLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQVUsQ0FBQyxTQUFTLENBQUMsaURBQWlELENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNySCxNQUFNLGlCQUFpQixHQUFtQjtRQUN6QyxFQUFFLE1BQU0sRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDLEVBQUU7UUFDMUQsRUFBRSxNQUFNLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFO0tBQ3RELENBQUM7SUFFRixNQUFNLEtBQUssR0FBdUI7UUFDakMsWUFBWSxFQUFFLENBQUM7UUFDZixPQUFPLEVBQUUsQ0FBQztRQUNWLGlCQUFpQixFQUFFLENBQUM7UUFDcEIsV0FBVyxFQUFFLENBQUM7S0FDZCxDQUFDO0lBRUYsTUFBTSxnQkFBZ0I7UUFNckIsWUFBb0IsTUFBa0MsRUFBUyxNQUFtQjtZQUE5RCxXQUFNLEdBQU4sTUFBTSxDQUE0QjtZQUFTLFdBQU0sR0FBTixNQUFNLENBQWE7WUFG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