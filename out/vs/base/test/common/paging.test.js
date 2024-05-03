/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/paging", "vs/base/test/common/utils"], function (require, exports, assert, async_1, cancellation_1, errors_1, paging_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getPage(pageIndex, cancellationToken) {
        if (cancellationToken.isCancellationRequested) {
            return Promise.reject(new errors_1.CancellationError());
        }
        return Promise.resolve([0, 1, 2, 3, 4].map(i => i + (pageIndex * 5)));
    }
    class TestPager {
        constructor(getPageFn) {
            this.firstPage = [0, 1, 2, 3, 4];
            this.pageSize = 5;
            this.total = 100;
            this.getPage = getPageFn || getPage;
        }
    }
    suite('PagedModel', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('isResolved', () => {
            const pager = new TestPager();
            const model = new paging_1.PagedModel(pager);
            assert(model.isResolved(0));
            assert(model.isResolved(1));
            assert(model.isResolved(2));
            assert(model.isResolved(3));
            assert(model.isResolved(4));
            assert(!model.isResolved(5));
            assert(!model.isResolved(6));
            assert(!model.isResolved(7));
            assert(!model.isResolved(8));
            assert(!model.isResolved(9));
            assert(!model.isResolved(10));
            assert(!model.isResolved(99));
        });
        test('resolve single', async () => {
            const pager = new TestPager();
            const model = new paging_1.PagedModel(pager);
            assert(!model.isResolved(5));
            await model.resolve(5, cancellation_1.CancellationToken.None);
            assert(model.isResolved(5));
        });
        test('resolve page', async () => {
            const pager = new TestPager();
            const model = new paging_1.PagedModel(pager);
            assert(!model.isResolved(5));
            assert(!model.isResolved(6));
            assert(!model.isResolved(7));
            assert(!model.isResolved(8));
            assert(!model.isResolved(9));
            assert(!model.isResolved(10));
            await model.resolve(5, cancellation_1.CancellationToken.None);
            assert(model.isResolved(5));
            assert(model.isResolved(6));
            assert(model.isResolved(7));
            assert(model.isResolved(8));
            assert(model.isResolved(9));
            assert(!model.isResolved(10));
        });
        test('resolve page 2', async () => {
            const pager = new TestPager();
            const model = new paging_1.PagedModel(pager);
            assert(!model.isResolved(5));
            assert(!model.isResolved(6));
            assert(!model.isResolved(7));
            assert(!model.isResolved(8));
            assert(!model.isResolved(9));
            assert(!model.isResolved(10));
            await model.resolve(10, cancellation_1.CancellationToken.None);
            assert(!model.isResolved(5));
            assert(!model.isResolved(6));
            assert(!model.isResolved(7));
            assert(!model.isResolved(8));
            assert(!model.isResolved(9));
            assert(model.isResolved(10));
        });
        test('preemptive cancellation works', async function () {
            const pager = new TestPager(() => {
                assert(false);
            });
            const model = new paging_1.PagedModel(pager);
            try {
                await model.resolve(5, cancellation_1.CancellationToken.Cancelled);
                return assert(false);
            }
            catch (err) {
                return assert((0, errors_1.isCancellationError)(err));
            }
        });
        test('cancellation works', function () {
            const pager = new TestPager((_, token) => new Promise((_, e) => {
                store.add(token.onCancellationRequested(() => e(new errors_1.CancellationError())));
            }));
            const model = new paging_1.PagedModel(pager);
            const tokenSource = store.add(new cancellation_1.CancellationTokenSource());
            const promise = model.resolve(5, tokenSource.token).then(() => assert(false), err => assert((0, errors_1.isCancellationError)(err)));
            setTimeout(() => tokenSource.cancel(), 10);
            return promise;
        });
        test('same page cancellation works', function () {
            let state = 'idle';
            const pager = new TestPager((pageIndex, token) => {
                state = 'resolving';
                return new Promise((_, e) => {
                    store.add(token.onCancellationRequested(() => {
                        state = 'idle';
                        e(new errors_1.CancellationError());
                    }));
                });
            });
            const model = new paging_1.PagedModel(pager);
            assert.strictEqual(state, 'idle');
            const tokenSource1 = new cancellation_1.CancellationTokenSource();
            const promise1 = model.resolve(5, tokenSource1.token).then(() => assert(false), err => assert((0, errors_1.isCancellationError)(err)));
            assert.strictEqual(state, 'resolving');
            const tokenSource2 = new cancellation_1.CancellationTokenSource();
            const promise2 = model.resolve(6, tokenSource2.token).then(() => assert(false), err => assert((0, errors_1.isCancellationError)(err)));
            assert.strictEqual(state, 'resolving');
            store.add((0, async_1.disposableTimeout)(() => {
                assert.strictEqual(state, 'resolving');
                tokenSource1.cancel();
                assert.strictEqual(state, 'resolving');
                store.add((0, async_1.disposableTimeout)(() => {
                    assert.strictEqual(state, 'resolving');
                    tokenSource2.cancel();
                    assert.strictEqual(state, 'idle');
                }, 10));
            }, 10));
            return Promise.all([promise1, promise2]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnaW5nLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vcGFnaW5nLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsU0FBUyxPQUFPLENBQUMsU0FBaUIsRUFBRSxpQkFBb0M7UUFDdkUsSUFBSSxpQkFBaUIsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQy9DLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLDBCQUFpQixFQUFFLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBRUQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVELE1BQU0sU0FBUztRQU9kLFlBQVksU0FBMEY7WUFMN0YsY0FBUyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVCLGFBQVEsR0FBRyxDQUFDLENBQUM7WUFDYixVQUFLLEdBQUcsR0FBRyxDQUFDO1lBSXBCLElBQUksQ0FBQyxPQUFPLEdBQUcsU0FBUyxJQUFJLE9BQU8sQ0FBQztRQUNyQyxDQUFDO0tBQ0Q7SUFFRCxLQUFLLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtRQUV4QixNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFeEQsSUFBSSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7WUFDdkIsTUFBTSxLQUFLLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FB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QztZQUM1QixNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVCLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakMsTUFBTSxLQUFLLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUM5QixNQUFNLEtBQUssR0FBRyxJQUFJLG1CQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFcEMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFOUIsTUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDOUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0JBQStCLEVBQUUsS0FBSztZQUMxQyxNQUFNLEtBQUssR0FBRyxJQUFJLFNBQVMsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2hDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNmLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxLQUFLLEdBQUcsSUFBSSxtQkFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXBDLElBQUksQ0FBQztnQkFDSixNQUFNLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLGdDQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNwRCxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QixDQUFDO1lBQ0QsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDWixPQUFPLE1BQU0sQ0FBQyxJQUFBLDRCQUFtQixFQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDekMsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBQzFCLE1BQU0sS0FBSyxHQUFHLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzlELEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLDBCQUFpQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sS0FBSyxHQUFHLElBQUksbUJBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQyxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksc0NBQXVCLEVBQUUsQ0FBQyxDQUFDO1lBRTdELE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQ3ZELEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFDbkIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBQSw0QkFBbUIsRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUN2QyxDQUFDO1lBRUYsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUUzQyxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4QkFBOEIsRUFBRTtZQUNwQyxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUM7WUFFbkIsTUFBTSxLQUFLLEdBQUcsSUFBSSxTQUFTLENBQUMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ2hELEtBQUssR0FBRyxXQUFXLENBQUM7Z0JBRXBCLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQzNCLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsRUFBRTt3QkFDNUMsS0FBSyxHQUFHLE1BQU0sQ0FBQzt3QkFDZixDQUFDLENBQUMsSUFBSSwwQkFBaUIsRUFBRSxDQUFDLENBQUM7b0JBQzVCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sS0FBSyxHQUFHLElBQUksbUJBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVwQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztZQUVsQyxNQUFNLFlBQVksR0FBRyxJQUFJLHNDQUF1QixFQUFFLENBQUM7WUFDbkQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FDekQsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUNuQixHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFBLDRCQUFtQixFQUFDLEdBQUcsQ0FBQyxDQUFDLENBQ3ZDLENBQUM7WUFFRixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztZQUV2QyxNQUFNLFlBQVksR0FBRyxJQUFJLHNDQUF1QixFQUFFLENBQUM7WUFDbkQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FDekQsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUNuQixHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFBLDRCQUFtQixFQUFDLEdBQUcsQ0FBQyxDQUFDLENBQ3ZDLENBQUM7WUFFRixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztZQUV2QyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUEseUJBQWlCLEVBQUMsR0FBRyxFQUFFO2dCQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDdkMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN0QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFFdkMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHlCQUFpQixFQUFDLEdBQUcsRUFBRTtvQkFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7b0JBQ3ZDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDdEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ25DLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ1QsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFUixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUMxQyxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=