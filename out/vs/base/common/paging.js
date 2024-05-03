/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors"], function (require, exports, arrays_1, cancellation_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DelayedPagedModel = exports.PagedModel = void 0;
    exports.singlePagePager = singlePagePager;
    exports.mapPager = mapPager;
    function createPage(elements) {
        return {
            isResolved: !!elements,
            promise: null,
            cts: null,
            promiseIndexes: new Set(),
            elements: elements || []
        };
    }
    function singlePagePager(elements) {
        return {
            firstPage: elements,
            total: elements.length,
            pageSize: elements.length,
            getPage: (pageIndex, cancellationToken) => {
                return Promise.resolve(elements);
            }
        };
    }
    class PagedModel {
        get length() { return this.pager.total; }
        constructor(arg) {
            this.pages = [];
            this.pager = Array.isArray(arg) ? singlePagePager(arg) : arg;
            const totalPages = Math.ceil(this.pager.total / this.pager.pageSize);
            this.pages = [
                createPage(this.pager.firstPage.slice()),
                ...(0, arrays_1.range)(totalPages - 1).map(() => createPage())
            ];
        }
        isResolved(index) {
            const pageIndex = Math.floor(index / this.pager.pageSize);
            const page = this.pages[pageIndex];
            return !!page.isResolved;
        }
        get(index) {
            const pageIndex = Math.floor(index / this.pager.pageSize);
            const indexInPage = index % this.pager.pageSize;
            const page = this.pages[pageIndex];
            return page.elements[indexInPage];
        }
        resolve(index, cancellationToken) {
            if (cancellationToken.isCancellationRequested) {
                return Promise.reject(new errors_1.CancellationError());
            }
            const pageIndex = Math.floor(index / this.pager.pageSize);
            const indexInPage = index % this.pager.pageSize;
            const page = this.pages[pageIndex];
            if (page.isResolved) {
                return Promise.resolve(page.elements[indexInPage]);
            }
            if (!page.promise) {
                page.cts = new cancellation_1.CancellationTokenSource();
                page.promise = this.pager.getPage(pageIndex, page.cts.token)
                    .then(elements => {
                    page.elements = elements;
                    page.isResolved = true;
                    page.promise = null;
                    page.cts = null;
                }, err => {
                    page.isResolved = false;
                    page.promise = null;
                    page.cts = null;
                    return Promise.reject(err);
                });
            }
            const listener = cancellationToken.onCancellationRequested(() => {
                if (!page.cts) {
                    return;
                }
                page.promiseIndexes.delete(index);
                if (page.promiseIndexes.size === 0) {
                    page.cts.cancel();
                }
            });
            page.promiseIndexes.add(index);
            return page.promise.then(() => page.elements[indexInPage])
                .finally(() => listener.dispose());
        }
    }
    exports.PagedModel = PagedModel;
    class DelayedPagedModel {
        get length() { return this.model.length; }
        constructor(model, timeout = 500) {
            this.model = model;
            this.timeout = timeout;
        }
        isResolved(index) {
            return this.model.isResolved(index);
        }
        get(index) {
            return this.model.get(index);
        }
        resolve(index, cancellationToken) {
            return new Promise((c, e) => {
                if (cancellationToken.isCancellationRequested) {
                    return e(new errors_1.CancellationError());
                }
                const timer = setTimeout(() => {
                    if (cancellationToken.isCancellationRequested) {
                        return e(new errors_1.CancellationError());
                    }
                    timeoutCancellation.dispose();
                    this.model.resolve(index, cancellationToken).then(c, e);
                }, this.timeout);
                const timeoutCancellation = cancellationToken.onCancellationRequested(() => {
                    clearTimeout(timer);
                    timeoutCancellation.dispose();
                    e(new errors_1.CancellationError());
                });
            });
        }
    }
    exports.DelayedPagedModel = DelayedPagedModel;
    /**
     * Similar to array.map, `mapPager` lets you map the elements of an
     * abstract paged collection to another type.
     */
    function mapPager(pager, fn) {
        return {
            firstPage: pager.firstPage.map(fn),
            total: pager.total,
            pageSize: pager.pageSize,
            getPage: (pageIndex, token) => pager.getPage(pageIndex, token).then(r => r.map(fn))
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnaW5nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9wYWdpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNENoRywwQ0FTQztJQTZIRCw0QkFPQztJQWpLRCxTQUFTLFVBQVUsQ0FBSSxRQUFjO1FBQ3BDLE9BQU87WUFDTixVQUFVLEVBQUUsQ0FBQyxDQUFDLFFBQVE7WUFDdEIsT0FBTyxFQUFFLElBQUk7WUFDYixHQUFHLEVBQUUsSUFBSTtZQUNULGNBQWMsRUFBRSxJQUFJLEdBQUcsRUFBVTtZQUNqQyxRQUFRLEVBQUUsUUFBUSxJQUFJLEVBQUU7U0FDeEIsQ0FBQztJQUNILENBQUM7SUFZRCxTQUFnQixlQUFlLENBQUksUUFBYTtRQUMvQyxPQUFPO1lBQ04sU0FBUyxFQUFFLFFBQVE7WUFDbkIsS0FBSyxFQUFFLFFBQVEsQ0FBQyxNQUFNO1lBQ3RCLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTTtZQUN6QixPQUFPLEVBQUUsQ0FBQyxTQUFpQixFQUFFLGlCQUFvQyxFQUFnQixFQUFFO2dCQUNsRixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbEMsQ0FBQztTQUNELENBQUM7SUFDSCxDQUFDO0lBRUQsTUFBYSxVQUFVO1FBS3RCLElBQUksTUFBTSxLQUFhLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRWpELFlBQVksR0FBb0I7WUFKeEIsVUFBSyxHQUFlLEVBQUUsQ0FBQztZQUs5QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1lBRWhFLE1BQU0sVUFB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