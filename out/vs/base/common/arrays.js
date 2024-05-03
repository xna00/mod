/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "./arraysFind"], function (require, exports, errors_1, arraysFind_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Permutation = exports.CallbackIterable = exports.ArrayQueue = exports.booleanComparator = exports.numberComparator = exports.CompareResult = void 0;
    exports.tail = tail;
    exports.tail2 = tail2;
    exports.equals = equals;
    exports.removeFastWithoutKeepingOrder = removeFastWithoutKeepingOrder;
    exports.binarySearch = binarySearch;
    exports.binarySearch2 = binarySearch2;
    exports.quickSelect = quickSelect;
    exports.groupBy = groupBy;
    exports.groupAdjacentBy = groupAdjacentBy;
    exports.forEachAdjacent = forEachAdjacent;
    exports.forEachWithNeighbors = forEachWithNeighbors;
    exports.sortedDiff = sortedDiff;
    exports.delta = delta;
    exports.top = top;
    exports.topAsync = topAsync;
    exports.coalesce = coalesce;
    exports.coalesceInPlace = coalesceInPlace;
    exports.move = move;
    exports.isFalsyOrEmpty = isFalsyOrEmpty;
    exports.isNonEmptyArray = isNonEmptyArray;
    exports.distinct = distinct;
    exports.uniqueFilter = uniqueFilter;
    exports.firstOrDefault = firstOrDefault;
    exports.lastOrDefault = lastOrDefault;
    exports.commonPrefixLength = commonPrefixLength;
    exports.flatten = flatten;
    exports.range = range;
    exports.index = index;
    exports.insert = insert;
    exports.remove = remove;
    exports.arrayInsert = arrayInsert;
    exports.shuffle = shuffle;
    exports.pushToStart = pushToStart;
    exports.pushToEnd = pushToEnd;
    exports.pushMany = pushMany;
    exports.mapArrayOrNot = mapArrayOrNot;
    exports.asArray = asArray;
    exports.getRandomElement = getRandomElement;
    exports.insertInto = insertInto;
    exports.splice = splice;
    exports.compareBy = compareBy;
    exports.tieBreakComparators = tieBreakComparators;
    exports.reverseOrder = reverseOrder;
    /**
     * Returns the last element of an array.
     * @param array The array.
     * @param n Which element from the end (default is zero).
     */
    function tail(array, n = 0) {
        return array[array.length - (1 + n)];
    }
    function tail2(arr) {
        if (arr.length === 0) {
            throw new Error('Invalid tail call');
        }
        return [arr.slice(0, arr.length - 1), arr[arr.length - 1]];
    }
    function equals(one, other, itemEquals = (a, b) => a === b) {
        if (one === other) {
            return true;
        }
        if (!one || !other) {
            return false;
        }
        if (one.length !== other.length) {
            return false;
        }
        for (let i = 0, len = one.length; i < len; i++) {
            if (!itemEquals(one[i], other[i])) {
                return false;
            }
        }
        return true;
    }
    /**
     * Remove the element at `index` by replacing it with the last element. This is faster than `splice`
     * but changes the order of the array
     */
    function removeFastWithoutKeepingOrder(array, index) {
        const last = array.length - 1;
        if (index < last) {
            array[index] = array[last];
        }
        array.pop();
    }
    /**
     * Performs a binary search algorithm over a sorted array.
     *
     * @param array The array being searched.
     * @param key The value we search for.
     * @param comparator A function that takes two array elements and returns zero
     *   if they are equal, a negative number if the first element precedes the
     *   second one in the sorting order, or a positive number if the second element
     *   precedes the first one.
     * @return See {@link binarySearch2}
     */
    function binarySearch(array, key, comparator) {
        return binarySearch2(array.length, i => comparator(array[i], key));
    }
    /**
     * Performs a binary search algorithm over a sorted collection. Useful for cases
     * when we need to perform a binary search over something that isn't actually an
     * array, and converting data to an array would defeat the use of binary search
     * in the first place.
     *
     * @param length The collection length.
     * @param compareToKey A function that takes an index of an element in the
     *   collection and returns zero if the value at this index is equal to the
     *   search key, a negative number if the value precedes the search key in the
     *   sorting order, or a positive number if the search key precedes the value.
     * @return A non-negative index of an element, if found. If not found, the
     *   result is -(n+1) (or ~n, using bitwise notation), where n is the index
     *   where the key should be inserted to maintain the sorting order.
     */
    function binarySearch2(length, compareToKey) {
        let low = 0, high = length - 1;
        while (low <= high) {
            const mid = ((low + high) / 2) | 0;
            const comp = compareToKey(mid);
            if (comp < 0) {
                low = mid + 1;
            }
            else if (comp > 0) {
                high = mid - 1;
            }
            else {
                return mid;
            }
        }
        return -(low + 1);
    }
    function quickSelect(nth, data, compare) {
        nth = nth | 0;
        if (nth >= data.length) {
            throw new TypeError('invalid index');
        }
        const pivotValue = data[Math.floor(data.length * Math.random())];
        const lower = [];
        const higher = [];
        const pivots = [];
        for (const value of data) {
            const val = compare(value, pivotValue);
            if (val < 0) {
                lower.push(value);
            }
            else if (val > 0) {
                higher.push(value);
            }
            else {
                pivots.push(value);
            }
        }
        if (nth < lower.length) {
            return quickSelect(nth, lower, compare);
        }
        else if (nth < lower.length + pivots.length) {
            return pivots[0];
        }
        else {
            return quickSelect(nth - (lower.length + pivots.length), higher, compare);
        }
    }
    function groupBy(data, compare) {
        const result = [];
        let currentGroup = undefined;
        for (const element of data.slice(0).sort(compare)) {
            if (!currentGroup || compare(currentGroup[0], element) !== 0) {
                currentGroup = [element];
                result.push(currentGroup);
            }
            else {
                currentGroup.push(element);
            }
        }
        return result;
    }
    /**
     * Splits the given items into a list of (non-empty) groups.
     * `shouldBeGrouped` is used to decide if two consecutive items should be in the same group.
     * The order of the items is preserved.
     */
    function* groupAdjacentBy(items, shouldBeGrouped) {
        let currentGroup;
        let last;
        for (const item of items) {
            if (last !== undefined && shouldBeGrouped(last, item)) {
                currentGroup.push(item);
            }
            else {
                if (currentGroup) {
                    yield currentGroup;
                }
                currentGroup = [item];
            }
            last = item;
        }
        if (currentGroup) {
            yield currentGroup;
        }
    }
    function forEachAdjacent(arr, f) {
        for (let i = 0; i <= arr.length; i++) {
            f(i === 0 ? undefined : arr[i - 1], i === arr.length ? undefined : arr[i]);
        }
    }
    function forEachWithNeighbors(arr, f) {
        for (let i = 0; i < arr.length; i++) {
            f(i === 0 ? undefined : arr[i - 1], arr[i], i + 1 === arr.length ? undefined : arr[i + 1]);
        }
    }
    /**
     * Diffs two *sorted* arrays and computes the splices which apply the diff.
     */
    function sortedDiff(before, after, compare) {
        const result = [];
        function pushSplice(start, deleteCount, toInsert) {
            if (deleteCount === 0 && toInsert.length === 0) {
                return;
            }
            const latest = result[result.length - 1];
            if (latest && latest.start + latest.deleteCount === start) {
                latest.deleteCount += deleteCount;
                latest.toInsert.push(...toInsert);
            }
            else {
                result.push({ start, deleteCount, toInsert });
            }
        }
        let beforeIdx = 0;
        let afterIdx = 0;
        while (true) {
            if (beforeIdx === before.length) {
                pushSplice(beforeIdx, 0, after.slice(afterIdx));
                break;
            }
            if (afterIdx === after.length) {
                pushSplice(beforeIdx, before.length - beforeIdx, []);
                break;
            }
            const beforeElement = before[beforeIdx];
            const afterElement = after[afterIdx];
            const n = compare(beforeElement, afterElement);
            if (n === 0) {
                // equal
                beforeIdx += 1;
                afterIdx += 1;
            }
            else if (n < 0) {
                // beforeElement is smaller -> before element removed
                pushSplice(beforeIdx, 1, []);
                beforeIdx += 1;
            }
            else if (n > 0) {
                // beforeElement is greater -> after element added
                pushSplice(beforeIdx, 0, [afterElement]);
                afterIdx += 1;
            }
        }
        return result;
    }
    /**
     * Takes two *sorted* arrays and computes their delta (removed, added elements).
     * Finishes in `Math.min(before.length, after.length)` steps.
     */
    function delta(before, after, compare) {
        const splices = sortedDiff(before, after, compare);
        const removed = [];
        const added = [];
        for (const splice of splices) {
            removed.push(...before.slice(splice.start, splice.start + splice.deleteCount));
            added.push(...splice.toInsert);
        }
        return { removed, added };
    }
    /**
     * Returns the top N elements from the array.
     *
     * Faster than sorting the entire array when the array is a lot larger than N.
     *
     * @param array The unsorted array.
     * @param compare A sort function for the elements.
     * @param n The number of elements to return.
     * @return The first n elements from array when sorted with compare.
     */
    function top(array, compare, n) {
        if (n === 0) {
            return [];
        }
        const result = array.slice(0, n).sort(compare);
        topStep(array, compare, result, n, array.length);
        return result;
    }
    /**
     * Asynchronous variant of `top()` allowing for splitting up work in batches between which the event loop can run.
     *
     * Returns the top N elements from the array.
     *
     * Faster than sorting the entire array when the array is a lot larger than N.
     *
     * @param array The unsorted array.
     * @param compare A sort function for the elements.
     * @param n The number of elements to return.
     * @param batch The number of elements to examine before yielding to the event loop.
     * @return The first n elements from array when sorted with compare.
     */
    function topAsync(array, compare, n, batch, token) {
        if (n === 0) {
            return Promise.resolve([]);
        }
        return new Promise((resolve, reject) => {
            (async () => {
                const o = array.length;
                const result = array.slice(0, n).sort(compare);
                for (let i = n, m = Math.min(n + batch, o); i < o; i = m, m = Math.min(m + batch, o)) {
                    if (i > n) {
                        await new Promise(resolve => setTimeout(resolve)); // any other delay function would starve I/O
                    }
                    if (token && token.isCancellationRequested) {
                        throw new errors_1.CancellationError();
                    }
                    topStep(array, compare, result, i, m);
                }
                return result;
            })()
                .then(resolve, reject);
        });
    }
    function topStep(array, compare, result, i, m) {
        for (const n = result.length; i < m; i++) {
            const element = array[i];
            if (compare(element, result[n - 1]) < 0) {
                result.pop();
                const j = (0, arraysFind_1.findFirstIdxMonotonousOrArrLen)(result, e => compare(element, e) < 0);
                result.splice(j, 0, element);
            }
        }
    }
    /**
     * @returns New array with all falsy values removed. The original array IS NOT modified.
     */
    function coalesce(array) {
        return array.filter(e => !!e);
    }
    /**
     * Remove all falsy values from `array`. The original array IS modified.
     */
    function coalesceInPlace(array) {
        let to = 0;
        for (let i = 0; i < array.length; i++) {
            if (!!array[i]) {
                array[to] = array[i];
                to += 1;
            }
        }
        array.length = to;
    }
    /**
     * @deprecated Use `Array.copyWithin` instead
     */
    function move(array, from, to) {
        array.splice(to, 0, array.splice(from, 1)[0]);
    }
    /**
     * @returns false if the provided object is an array and not empty.
     */
    function isFalsyOrEmpty(obj) {
        return !Array.isArray(obj) || obj.length === 0;
    }
    function isNonEmptyArray(obj) {
        return Array.isArray(obj) && obj.length > 0;
    }
    /**
     * Removes duplicates from the given array. The optional keyFn allows to specify
     * how elements are checked for equality by returning an alternate value for each.
     */
    function distinct(array, keyFn = value => value) {
        const seen = new Set();
        return array.filter(element => {
            const key = keyFn(element);
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    function uniqueFilter(keyFn) {
        const seen = new Set();
        return element => {
            const key = keyFn(element);
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        };
    }
    function firstOrDefault(array, notFoundValue) {
        return array.length > 0 ? array[0] : notFoundValue;
    }
    function lastOrDefault(array, notFoundValue) {
        return array.length > 0 ? array[array.length - 1] : notFoundValue;
    }
    function commonPrefixLength(one, other, equals = (a, b) => a === b) {
        let result = 0;
        for (let i = 0, len = Math.min(one.length, other.length); i < len && equals(one[i], other[i]); i++) {
            result++;
        }
        return result;
    }
    /**
     * @deprecated Use `[].flat()`
     */
    function flatten(arr) {
        return [].concat(...arr);
    }
    function range(arg, to) {
        let from = typeof to === 'number' ? arg : 0;
        if (typeof to === 'number') {
            from = arg;
        }
        else {
            from = 0;
            to = arg;
        }
        const result = [];
        if (from <= to) {
            for (let i = from; i < to; i++) {
                result.push(i);
            }
        }
        else {
            for (let i = from; i > to; i--) {
                result.push(i);
            }
        }
        return result;
    }
    function index(array, indexer, mapper) {
        return array.reduce((r, t) => {
            r[indexer(t)] = mapper ? mapper(t) : t;
            return r;
        }, Object.create(null));
    }
    /**
     * Inserts an element into an array. Returns a function which, when
     * called, will remove that element from the array.
     *
     * @deprecated In almost all cases, use a `Set<T>` instead.
     */
    function insert(array, element) {
        array.push(element);
        return () => remove(array, element);
    }
    /**
     * Removes an element from an array if it can be found.
     *
     * @deprecated In almost all cases, use a `Set<T>` instead.
     */
    function remove(array, element) {
        const index = array.indexOf(element);
        if (index > -1) {
            array.splice(index, 1);
            return element;
        }
        return undefined;
    }
    /**
     * Insert `insertArr` inside `target` at `insertIndex`.
     * Please don't touch unless you understand https://jsperf.com/inserting-an-array-within-an-array
     */
    function arrayInsert(target, insertIndex, insertArr) {
        const before = target.slice(0, insertIndex);
        const after = target.slice(insertIndex);
        return before.concat(insertArr, after);
    }
    /**
     * Uses Fisher-Yates shuffle to shuffle the given array
     */
    function shuffle(array, _seed) {
        let rand;
        if (typeof _seed === 'number') {
            let seed = _seed;
            // Seeded random number generator in JS. Modified from:
            // https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
            rand = () => {
                const x = Math.sin(seed++) * 179426549; // throw away most significant digits and reduce any potential bias
                return x - Math.floor(x);
            };
        }
        else {
            rand = Math.random;
        }
        for (let i = array.length - 1; i > 0; i -= 1) {
            const j = Math.floor(rand() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
    /**
     * Pushes an element to the start of the array, if found.
     */
    function pushToStart(arr, value) {
        const index = arr.indexOf(value);
        if (index > -1) {
            arr.splice(index, 1);
            arr.unshift(value);
        }
    }
    /**
     * Pushes an element to the end of the array, if found.
     */
    function pushToEnd(arr, value) {
        const index = arr.indexOf(value);
        if (index > -1) {
            arr.splice(index, 1);
            arr.push(value);
        }
    }
    function pushMany(arr, items) {
        for (const item of items) {
            arr.push(item);
        }
    }
    function mapArrayOrNot(items, fn) {
        return Array.isArray(items) ?
            items.map(fn) :
            fn(items);
    }
    function asArray(x) {
        return Array.isArray(x) ? x : [x];
    }
    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
    /**
     * Insert the new items in the array.
     * @param array The original array.
     * @param start The zero-based location in the array from which to start inserting elements.
     * @param newItems The items to be inserted
     */
    function insertInto(array, start, newItems) {
        const startIdx = getActualStartIndex(array, start);
        const originalLength = array.length;
        const newItemsLength = newItems.length;
        array.length = originalLength + newItemsLength;
        // Move the items after the start index, start from the end so that we don't overwrite any value.
        for (let i = originalLength - 1; i >= startIdx; i--) {
            array[i + newItemsLength] = array[i];
        }
        for (let i = 0; i < newItemsLength; i++) {
            array[i + startIdx] = newItems[i];
        }
    }
    /**
     * Removes elements from an array and inserts new elements in their place, returning the deleted elements. Alternative to the native Array.splice method, it
     * can only support limited number of items due to the maximum call stack size limit.
     * @param array The original array.
     * @param start The zero-based location in the array from which to start removing elements.
     * @param deleteCount The number of elements to remove.
     * @returns An array containing the elements that were deleted.
     */
    function splice(array, start, deleteCount, newItems) {
        const index = getActualStartIndex(array, start);
        let result = array.splice(index, deleteCount);
        if (result === undefined) {
            // see https://bugs.webkit.org/show_bug.cgi?id=261140
            result = [];
        }
        insertInto(array, index, newItems);
        return result;
    }
    /**
     * Determine the actual start index (same logic as the native splice() or slice())
     * If greater than the length of the array, start will be set to the length of the array. In this case, no element will be deleted but the method will behave as an adding function, adding as many element as item[n*] provided.
     * If negative, it will begin that many elements from the end of the array. (In this case, the origin -1, meaning -n is the index of the nth last element, and is therefore equivalent to the index of array.length - n.) If array.length + start is less than 0, it will begin from index 0.
     * @param array The target array.
     * @param start The operation index.
     */
    function getActualStartIndex(array, start) {
        return start < 0 ? Math.max(start + array.length, 0) : Math.min(start, array.length);
    }
    var CompareResult;
    (function (CompareResult) {
        function isLessThan(result) {
            return result < 0;
        }
        CompareResult.isLessThan = isLessThan;
        function isLessThanOrEqual(result) {
            return result <= 0;
        }
        CompareResult.isLessThanOrEqual = isLessThanOrEqual;
        function isGreaterThan(result) {
            return result > 0;
        }
        CompareResult.isGreaterThan = isGreaterThan;
        function isNeitherLessOrGreaterThan(result) {
            return result === 0;
        }
        CompareResult.isNeitherLessOrGreaterThan = isNeitherLessOrGreaterThan;
        CompareResult.greaterThan = 1;
        CompareResult.lessThan = -1;
        CompareResult.neitherLessOrGreaterThan = 0;
    })(CompareResult || (exports.CompareResult = CompareResult = {}));
    function compareBy(selector, comparator) {
        return (a, b) => comparator(selector(a), selector(b));
    }
    function tieBreakComparators(...comparators) {
        return (item1, item2) => {
            for (const comparator of comparators) {
                const result = comparator(item1, item2);
                if (!CompareResult.isNeitherLessOrGreaterThan(result)) {
                    return result;
                }
            }
            return CompareResult.neitherLessOrGreaterThan;
        };
    }
    /**
     * The natural order on numbers.
    */
    const numberComparator = (a, b) => a - b;
    exports.numberComparator = numberComparator;
    const booleanComparator = (a, b) => (0, exports.numberComparator)(a ? 1 : 0, b ? 1 : 0);
    exports.booleanComparator = booleanComparator;
    function reverseOrder(comparator) {
        return (a, b) => -comparator(a, b);
    }
    class ArrayQueue {
        /**
         * Constructs a queue that is backed by the given array. Runtime is O(1).
        */
        constructor(items) {
            this.items = items;
            this.firstIdx = 0;
            this.lastIdx = this.items.length - 1;
        }
        get length() {
            return this.lastIdx - this.firstIdx + 1;
        }
        /**
         * Consumes elements from the beginning of the queue as long as the predicate returns true.
         * If no elements were consumed, `null` is returned. Has a runtime of O(result.length).
        */
        takeWhile(predicate) {
            // P(k) := k <= this.lastIdx && predicate(this.items[k])
            // Find s := min { k | k >= this.firstIdx && !P(k) } and return this.data[this.firstIdx...s)
            let startIdx = this.firstIdx;
            while (startIdx < this.items.length && predicate(this.items[startIdx])) {
                startIdx++;
            }
            const result = startIdx === this.firstIdx ? null : this.items.slice(this.firstIdx, startIdx);
            this.firstIdx = startIdx;
            return result;
        }
        /**
         * Consumes elements from the end of the queue as long as the predicate returns true.
         * If no elements were consumed, `null` is returned.
         * The result has the same order as the underlying array!
        */
        takeFromEndWhile(predicate) {
            // P(k) := this.firstIdx >= k && predicate(this.items[k])
            // Find s := max { k | k <= this.lastIdx && !P(k) } and return this.data(s...this.lastIdx]
            let endIdx = this.lastIdx;
            while (endIdx >= 0 && predicate(this.items[endIdx])) {
                endIdx--;
            }
            const result = endIdx === this.lastIdx ? null : this.items.slice(endIdx + 1, this.lastIdx + 1);
            this.lastIdx = endIdx;
            return result;
        }
        peek() {
            if (this.length === 0) {
                return undefined;
            }
            return this.items[this.firstIdx];
        }
        peekLast() {
            if (this.length === 0) {
                return undefined;
            }
            return this.items[this.lastIdx];
        }
        dequeue() {
            const result = this.items[this.firstIdx];
            this.firstIdx++;
            return result;
        }
        removeLast() {
            const result = this.items[this.lastIdx];
            this.lastIdx--;
            return result;
        }
        takeCount(count) {
            const result = this.items.slice(this.firstIdx, this.firstIdx + count);
            this.firstIdx += count;
            return result;
        }
    }
    exports.ArrayQueue = ArrayQueue;
    /**
     * This class is faster than an iterator and array for lazy computed data.
    */
    class CallbackIterable {
        static { this.empty = new CallbackIterable(_callback => { }); }
        constructor(
        /**
         * Calls the callback for every item.
         * Stops when the callback returns false.
        */
        iterate) {
            this.iterate = iterate;
        }
        forEach(handler) {
            this.iterate(item => { handler(item); return true; });
        }
        toArray() {
            const result = [];
            this.iterate(item => { result.push(item); return true; });
            return result;
        }
        filter(predicate) {
            return new CallbackIterable(cb => this.iterate(item => predicate(item) ? cb(item) : true));
        }
        map(mapFn) {
            return new CallbackIterable(cb => this.iterate(item => cb(mapFn(item))));
        }
        some(predicate) {
            let result = false;
            this.iterate(item => { result = predicate(item); return !result; });
            return result;
        }
        findFirst(predicate) {
            let result;
            this.iterate(item => {
                if (predicate(item)) {
                    result = item;
                    return false;
                }
                return true;
            });
            return result;
        }
        findLast(predicate) {
            let result;
            this.iterate(item => {
                if (predicate(item)) {
                    result = item;
                }
                return true;
            });
            return result;
        }
        findLastMaxBy(comparator) {
            let result;
            let first = true;
            this.iterate(item => {
                if (first || CompareResult.isGreaterThan(comparator(item, result))) {
                    first = false;
                    result = item;
                }
                return true;
            });
            return result;
        }
    }
    exports.CallbackIterable = CallbackIterable;
    /**
     * Represents a re-arrangement of items in an array.
     */
    class Permutation {
        constructor(_indexMap) {
            this._indexMap = _indexMap;
        }
        /**
         * Returns a permutation that sorts the given array according to the given compare function.
         */
        static createSortPermutation(arr, compareFn) {
            const sortIndices = Array.from(arr.keys()).sort((index1, index2) => compareFn(arr[index1], arr[index2]));
            return new Permutation(sortIndices);
        }
        /**
         * Returns a new array with the elements of the given array re-arranged according to this permutation.
         */
        apply(arr) {
            return arr.map((_, index) => arr[this._indexMap[index]]);
        }
        /**
         * Returns a new permutation that undoes the re-arrangement of this permutation.
        */
        inverse() {
            const inverseIndexMap = this._indexMap.slice();
            for (let i = 0; i < this._indexMap.length; i++) {
                inverseIndexMap[this._indexMap[i]] = i;
            }
            return new Permutation(inverseIndexMap);
        }
    }
    exports.Permutation = Permutation;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9hcnJheXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLG9CQUVDO0lBRUQsc0JBTUM7SUFFRCx3QkFvQkM7SUFNRCxzRUFNQztJQWFELG9DQUVDO0lBaUJELHNDQWdCQztJQUtELGtDQStCQztJQUVELDBCQVlDO0lBT0QsMENBaUJDO0lBRUQsMENBSUM7SUFFRCxvREFJQztJQVVELGdDQWtEQztJQU1ELHNCQVdDO0lBWUQsa0JBT0M7SUFlRCw0QkFzQkM7SUFnQkQsNEJBRUM7SUFLRCwwQ0FTQztJQUtELG9CQUVDO0lBS0Qsd0NBRUM7SUFPRCwwQ0FFQztJQU1ELDRCQVdDO0lBRUQsb0NBYUM7SUFJRCx3Q0FFQztJQUlELHNDQUVDO0lBRUQsZ0RBUUM7SUFLRCwwQkFFQztJQUlELHNCQXVCQztJQUlELHNCQUtDO0lBUUQsd0JBSUM7SUFPRCx3QkFTQztJQU1ELGtDQUlDO0lBS0QsMEJBcUJDO0lBS0Qsa0NBT0M7SUFLRCw4QkFPQztJQUVELDRCQUlDO0lBRUQsc0NBSUM7SUFJRCwwQkFFQztJQUVELDRDQUVDO0lBUUQsZ0NBYUM7SUFVRCx3QkFTQztJQWtERCw4QkFFQztJQUVELGtEQVVDO0lBU0Qsb0NBRUM7SUFyckJEOzs7O09BSUc7SUFDSCxTQUFnQixJQUFJLENBQUksS0FBbUIsRUFBRSxJQUFZLENBQUM7UUFDekQsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRCxTQUFnQixLQUFLLENBQUksR0FBUTtRQUNoQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDdEIsTUFBTSxJQUFJ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