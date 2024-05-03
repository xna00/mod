/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/errors", "vs/workbench/contrib/search/common/cacheState", "vs/base/common/async", "vs/base/test/common/utils"], function (require, exports, assert, errors, cacheState_1, async_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('FileQueryCacheState', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('reuse old cacheKey until new cache is loaded', async function () {
            const cache = new MockCache();
            const first = createCacheState(cache);
            const firstKey = first.cacheKey;
            assert.strictEqual(first.isLoaded, false);
            assert.strictEqual(first.isUpdating, false);
            first.load();
            assert.strictEqual(first.isLoaded, false);
            assert.strictEqual(first.isUpdating, true);
            await cache.loading[firstKey].complete(null);
            assert.strictEqual(first.isLoaded, true);
            assert.strictEqual(first.isUpdating, false);
            const second = createCacheState(cache, first);
            second.load();
            assert.strictEqual(second.isLoaded, true);
            assert.strictEqual(second.isUpdating, true);
            await cache.awaitDisposal(0);
            assert.strictEqual(second.cacheKey, firstKey); // still using old cacheKey
            const secondKey = cache.cacheKeys[1];
            await cache.loading[secondKey].complete(null);
            assert.strictEqual(second.isLoaded, true);
            assert.strictEqual(second.isUpdating, false);
            await cache.awaitDisposal(1);
            assert.strictEqual(second.cacheKey, secondKey);
        });
        test('do not spawn additional load if previous is still loading', async function () {
            const cache = new MockCache();
            const first = createCacheState(cache);
            const firstKey = first.cacheKey;
            first.load();
            assert.strictEqual(first.isLoaded, false);
            assert.strictEqual(first.isUpdating, true);
            assert.strictEqual(Object.keys(cache.loading).length, 1);
            const second = createCacheState(cache, first);
            second.load();
            assert.strictEqual(second.isLoaded, false);
            assert.strictEqual(second.isUpdating, true);
            assert.strictEqual(cache.cacheKeys.length, 2);
            assert.strictEqual(Object.keys(cache.loading).length, 1); // still only one loading
            assert.strictEqual(second.cacheKey, firstKey);
            await cache.loading[firstKey].complete(null);
            assert.strictEqual(second.isLoaded, true);
            assert.strictEqual(second.isUpdating, false);
            await cache.awaitDisposal(0);
        });
        test('do not use previous cacheKey if query changed', async function () {
            const cache = new MockCache();
            const first = createCacheState(cache);
            const firstKey = first.cacheKey;
            first.load();
            await cache.loading[firstKey].complete(null);
            assert.strictEqual(first.isLoaded, true);
            assert.strictEqual(first.isUpdating, false);
            await cache.awaitDisposal(0);
            cache.baseQuery.excludePattern = { '**/node_modules': true };
            const second = createCacheState(cache, first);
            assert.strictEqual(second.isLoaded, false);
            assert.strictEqual(second.isUpdating, false);
            await cache.awaitDisposal(1);
            second.load();
            assert.strictEqual(second.isLoaded, false);
            assert.strictEqual(second.isUpdating, true);
            assert.notStrictEqual(second.cacheKey, firstKey); // not using old cacheKey
            const secondKey = cache.cacheKeys[1];
            assert.strictEqual(second.cacheKey, secondKey);
            await cache.loading[secondKey].complete(null);
            assert.strictEqual(second.isLoaded, true);
            assert.strictEqual(second.isUpdating, false);
            await cache.awaitDisposal(1);
        });
        test('dispose propagates', async function () {
            const cache = new MockCache();
            const first = createCacheState(cache);
            const firstKey = first.cacheKey;
            first.load();
            await cache.loading[firstKey].complete(null);
            const second = createCacheState(cache, first);
            assert.strictEqual(second.isLoaded, true);
            assert.strictEqual(second.isUpdating, false);
            await cache.awaitDisposal(0);
            second.dispose();
            assert.strictEqual(second.isLoaded, false);
            assert.strictEqual(second.isUpdating, false);
            await cache.awaitDisposal(1);
            assert.ok(cache.disposing[firstKey]);
        });
        test('keep using old cacheKey when loading fails', async function () {
            const cache = new MockCache();
            const first = createCacheState(cache);
            const firstKey = first.cacheKey;
            first.load();
            await cache.loading[firstKey].complete(null);
            const second = createCacheState(cache, first);
            second.load();
            const secondKey = cache.cacheKeys[1];
            const origErrorHandler = errors.errorHandler.getUnexpectedErrorHandler();
            try {
                errors.setUnexpectedErrorHandler(() => null);
                await cache.loading[secondKey].error('loading failed');
            }
            finally {
                errors.setUnexpectedErrorHandler(origErrorHandler);
            }
            assert.strictEqual(second.isLoaded, true);
            assert.strictEqual(second.isUpdating, false);
            assert.strictEqual(Object.keys(cache.loading).length, 2);
            await cache.awaitDisposal(0);
            assert.strictEqual(second.cacheKey, firstKey); // keep using old cacheKey
            const third = createCacheState(cache, second);
            third.load();
            assert.strictEqual(third.isLoaded, true);
            assert.strictEqual(third.isUpdating, true);
            assert.strictEqual(Object.keys(cache.loading).length, 3);
            await cache.awaitDisposal(0);
            assert.strictEqual(third.cacheKey, firstKey);
            const thirdKey = cache.cacheKeys[2];
            await cache.loading[thirdKey].complete(null);
            assert.strictEqual(third.isLoaded, true);
            assert.strictEqual(third.isUpdating, false);
            assert.strictEqual(Object.keys(cache.loading).length, 3);
            await cache.awaitDisposal(2);
            assert.strictEqual(third.cacheKey, thirdKey); // recover with next successful load
        });
        function createCacheState(cache, previous) {
            return new cacheState_1.FileQueryCacheState(cacheKey => cache.query(cacheKey), query => cache.load(query), cacheKey => cache.dispose(cacheKey), previous);
        }
        class MockCache {
            constructor() {
                this.cacheKeys = [];
                this.loading = {};
                this.disposing = {};
                this._awaitDisposal = [];
                this.baseQuery = {
                    type: 1 /* QueryType.File */,
                    folderQueries: []
                };
            }
            query(cacheKey) {
                this.cacheKeys.push(cacheKey);
                return Object.assign({ cacheKey: cacheKey }, this.baseQuery);
            }
            load(query) {
                const promise = new async_1.DeferredPromise();
                this.loading[query.cacheKey] = promise;
                return promise.p;
            }
            dispose(cacheKey) {
                const promise = new async_1.DeferredPromise();
                this.disposing[cacheKey] = promise;
                const n = Object.keys(this.disposing).length;
                for (const done of this._awaitDisposal[n] || []) {
                    done();
                }
                delete this._awaitDisposal[n];
                return promise.p;
            }
            awaitDisposal(n) {
                return new Promise(resolve => {
                    if (n === Object.keys(this.disposing).length) {
                        resolve();
                    }
                    else {
                        (this._awaitDisposal[n] || (this._awaitDisposal[n] = [])).push(resolve);
                    }
                });
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGVTdGF0ZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvdGVzdC9jb21tb24vY2FjaGVTdGF0ZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7UUFFakMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyw4Q0FBOEMsRUFBRSxLQUFLO1lBRXpELE1BQU0sS0FBSyxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7WUFFOUIsTUFBTSxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTVDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNiLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFM0MsTUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsVUFB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