/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MonotonousArray = void 0;
    exports.findLast = findLast;
    exports.findLastIdx = findLastIdx;
    exports.findLastMonotonous = findLastMonotonous;
    exports.findLastIdxMonotonous = findLastIdxMonotonous;
    exports.findFirstMonotonous = findFirstMonotonous;
    exports.findFirstIdxMonotonousOrArrLen = findFirstIdxMonotonousOrArrLen;
    exports.findFirstIdxMonotonous = findFirstIdxMonotonous;
    exports.findFirstMaxBy = findFirstMaxBy;
    exports.findLastMaxBy = findLastMaxBy;
    exports.findFirstMinBy = findFirstMinBy;
    exports.findMaxIdxBy = findMaxIdxBy;
    exports.mapFindFirst = mapFindFirst;
    function findLast(array, predicate, fromIdx) {
        const idx = findLastIdx(array, predicate);
        if (idx === -1) {
            return undefined;
        }
        return array[idx];
    }
    function findLastIdx(array, predicate, fromIndex = array.length - 1) {
        for (let i = fromIndex; i >= 0; i--) {
            const element = array[i];
            if (predicate(element)) {
                return i;
            }
        }
        return -1;
    }
    /**
     * Finds the last item where predicate is true using binary search.
     * `predicate` must be monotonous, i.e. `arr.map(predicate)` must be like `[true, ..., true, false, ..., false]`!
     *
     * @returns `undefined` if no item matches, otherwise the last item that matches the predicate.
     */
    function findLastMonotonous(array, predicate) {
        const idx = findLastIdxMonotonous(array, predicate);
        return idx === -1 ? undefined : array[idx];
    }
    /**
     * Finds the last item where predicate is true using binary search.
     * `predicate` must be monotonous, i.e. `arr.map(predicate)` must be like `[true, ..., true, false, ..., false]`!
     *
     * @returns `startIdx - 1` if predicate is false for all items, otherwise the index of the last item that matches the predicate.
     */
    function findLastIdxMonotonous(array, predicate, startIdx = 0, endIdxEx = array.length) {
        let i = startIdx;
        let j = endIdxEx;
        while (i < j) {
            const k = Math.floor((i + j) / 2);
            if (predicate(array[k])) {
                i = k + 1;
            }
            else {
                j = k;
            }
        }
        return i - 1;
    }
    /**
     * Finds the first item where predicate is true using binary search.
     * `predicate` must be monotonous, i.e. `arr.map(predicate)` must be like `[false, ..., false, true, ..., true]`!
     *
     * @returns `undefined` if no item matches, otherwise the first item that matches the predicate.
     */
    function findFirstMonotonous(array, predicate) {
        const idx = findFirstIdxMonotonousOrArrLen(array, predicate);
        return idx === array.length ? undefined : array[idx];
    }
    /**
     * Finds the first item where predicate is true using binary search.
     * `predicate` must be monotonous, i.e. `arr.map(predicate)` must be like `[false, ..., false, true, ..., true]`!
     *
     * @returns `endIdxEx` if predicate is false for all items, otherwise the index of the first item that matches the predicate.
     */
    function findFirstIdxMonotonousOrArrLen(array, predicate, startIdx = 0, endIdxEx = array.length) {
        let i = startIdx;
        let j = endIdxEx;
        while (i < j) {
            const k = Math.floor((i + j) / 2);
            if (predicate(array[k])) {
                j = k;
            }
            else {
                i = k + 1;
            }
        }
        return i;
    }
    function findFirstIdxMonotonous(array, predicate, startIdx = 0, endIdxEx = array.length) {
        const idx = findFirstIdxMonotonousOrArrLen(array, predicate, startIdx, endIdxEx);
        return idx === array.length ? -1 : idx;
    }
    /**
     * Use this when
     * * You have a sorted array
     * * You query this array with a monotonous predicate to find the last item that has a certain property.
     * * You query this array multiple times with monotonous predicates that get weaker and weaker.
     */
    class MonotonousArray {
        static { this.assertInvariants = false; }
        constructor(_array) {
            this._array = _array;
            this._findLastMonotonousLastIdx = 0;
        }
        /**
         * The predicate must be monotonous, i.e. `arr.map(predicate)` must be like `[true, ..., true, false, ..., false]`!
         * For subsequent calls, current predicate must be weaker than (or equal to) the previous predicate, i.e. more entries must be `true`.
         */
        findLastMonotonous(predicate) {
            if (MonotonousArray.assertInvariants) {
                if (this._prevFindLastPredicate) {
                    for (const item of this._array) {
                        if (this._prevFindLastPredicate(item) && !predicate(item)) {
                            throw new Error('MonotonousArray: current predicate must be weaker than (or equal to) the previous predicate.');
                        }
                    }
                }
                this._prevFindLastPredicate = predicate;
            }
            const idx = findLastIdxMonotonous(this._array, predicate, this._findLastMonotonousLastIdx);
            this._findLastMonotonousLastIdx = idx + 1;
            return idx === -1 ? undefined : this._array[idx];
        }
    }
    exports.MonotonousArray = MonotonousArray;
    /**
     * Returns the first item that is equal to or greater than every other item.
    */
    function findFirstMaxBy(array, comparator) {
        if (array.length === 0) {
            return undefined;
        }
        let max = array[0];
        for (let i = 1; i < array.length; i++) {
            const item = array[i];
            if (comparator(item, max) > 0) {
                max = item;
            }
        }
        return max;
    }
    /**
     * Returns the last item that is equal to or greater than every other item.
    */
    function findLastMaxBy(array, comparator) {
        if (array.length === 0) {
            return undefined;
        }
        let max = array[0];
        for (let i = 1; i < array.length; i++) {
            const item = array[i];
            if (comparator(item, max) >= 0) {
                max = item;
            }
        }
        return max;
    }
    /**
     * Returns the first item that is equal to or less than every other item.
    */
    function findFirstMinBy(array, comparator) {
        return findFirstMaxBy(array, (a, b) => -comparator(a, b));
    }
    function findMaxIdxBy(array, comparator) {
        if (array.length === 0) {
            return -1;
        }
        let maxIdx = 0;
        for (let i = 1; i < array.length; i++) {
            const item = array[i];
            if (comparator(item, array[maxIdx]) > 0) {
                maxIdx = i;
            }
        }
        return maxIdx;
    }
    /**
     * Returns the first mapped value of the array which is not undefined.
     */
    function mapFindFirst(items, mapFn) {
        for (const value of items) {
            const mapped = mapFn(value);
            if (mapped !== undefined) {
                return mapped;
            }
        }
        return undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlzRmluZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vYXJyYXlzRmluZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEcsNEJBTUM7SUFFRCxrQ0FVQztJQVFELGdEQUdDO0lBUUQsc0RBWUM7SUFRRCxrREFHQztJQVFELHdFQVlDO0lBRUQsd0RBR0M7SUEwQ0Qsd0NBYUM7SUFLRCxzQ0FhQztJQUtELHdDQUVDO0lBRUQsb0NBYUM7SUFLRCxvQ0FTQztJQWxNRCxTQUFnQixRQUFRLENBQUksS0FBbUIsRUFBRSxTQUErQixFQUFFLE9BQWdCO1FBQ2pHLE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDMUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNoQixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBQ0QsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbkIsQ0FBQztJQUVELFNBQWdCLFdBQVcsQ0FBSSxLQUFtQixFQUFFLFNBQStCLEVBQUUsU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQztRQUNoSCxLQUFLLElBQUksQ0FBQyxHQUFHLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDckMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXpCLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsU0FBZ0Isa0JBQWtC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