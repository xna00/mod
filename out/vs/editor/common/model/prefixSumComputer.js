/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/uint"], function (require, exports, arrays_1, uint_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PrefixSumIndexOfResult = exports.ConstantTimePrefixSumComputer = exports.PrefixSumComputer = void 0;
    class PrefixSumComputer {
        constructor(values) {
            this.values = values;
            this.prefixSum = new Uint32Array(values.length);
            this.prefixSumValidIndex = new Int32Array(1);
            this.prefixSumValidIndex[0] = -1;
        }
        getCount() {
            return this.values.length;
        }
        insertValues(insertIndex, insertValues) {
            insertIndex = (0, uint_1.toUint32)(insertIndex);
            const oldValues = this.values;
            const oldPrefixSum = this.prefixSum;
            const insertValuesLen = insertValues.length;
            if (insertValuesLen === 0) {
                return false;
            }
            this.values = new Uint32Array(oldValues.length + insertValuesLen);
            this.values.set(oldValues.subarray(0, insertIndex), 0);
            this.values.set(oldValues.subarray(insertIndex), insertIndex + insertValuesLen);
            this.values.set(insertValues, insertIndex);
            if (insertIndex - 1 < this.prefixSumValidIndex[0]) {
                this.prefixSumValidIndex[0] = insertIndex - 1;
            }
            this.prefixSum = new Uint32Array(this.values.length);
            if (this.prefixSumValidIndex[0] >= 0) {
                this.prefixSum.set(oldPrefixSum.subarray(0, this.prefixSumValidIndex[0] + 1));
            }
            return true;
        }
        setValue(index, value) {
            index = (0, uint_1.toUint32)(index);
            value = (0, uint_1.toUint32)(value);
            if (this.values[index] === value) {
                return false;
            }
            this.values[index] = value;
            if (index - 1 < this.prefixSumValidIndex[0]) {
                this.prefixSumValidIndex[0] = index - 1;
            }
            return true;
        }
        removeValues(startIndex, count) {
            startIndex = (0, uint_1.toUint32)(startIndex);
            count = (0, uint_1.toUint32)(count);
            const oldValues = this.values;
            const oldPrefixSum = this.prefixSum;
            if (startIndex >= oldValues.length) {
                return false;
            }
            const maxCount = oldValues.length - startIndex;
            if (count >= maxCount) {
                count = maxCount;
            }
            if (count === 0) {
                return false;
            }
            this.values = new Uint32Array(oldValues.length - count);
            this.values.set(oldValues.subarray(0, startIndex), 0);
            this.values.set(oldValues.subarray(startIndex + count), startIndex);
            this.prefixSum = new Uint32Array(this.values.length);
            if (startIndex - 1 < this.prefixSumValidIndex[0]) {
                this.prefixSumValidIndex[0] = startIndex - 1;
            }
            if (this.prefixSumValidIndex[0] >= 0) {
                this.prefixSum.set(oldPrefixSum.subarray(0, this.prefixSumValidIndex[0] + 1));
            }
            return true;
        }
        getTotalSum() {
            if (this.values.length === 0) {
                return 0;
            }
            return this._getPrefixSum(this.values.length - 1);
        }
        /**
         * Returns the sum of the first `index + 1` many items.
         * @returns `SUM(0 <= j <= index, values[j])`.
         */
        getPrefixSum(index) {
            if (index < 0) {
                return 0;
            }
            index = (0, uint_1.toUint32)(index);
            return this._getPrefixSum(index);
        }
        _getPrefixSum(index) {
            if (index <= this.prefixSumValidIndex[0]) {
                return this.prefixSum[index];
            }
            let startIndex = this.prefixSumValidIndex[0] + 1;
            if (startIndex === 0) {
                this.prefixSum[0] = this.values[0];
                startIndex++;
            }
            if (index >= this.values.length) {
                index = this.values.length - 1;
            }
            for (let i = startIndex; i <= index; i++) {
                this.prefixSum[i] = this.prefixSum[i - 1] + this.values[i];
            }
            this.prefixSumValidIndex[0] = Math.max(this.prefixSumValidIndex[0], index);
            return this.prefixSum[index];
        }
        getIndexOf(sum) {
            sum = Math.floor(sum);
            // Compute all sums (to get a fully valid prefixSum)
            this.getTotalSum();
            let low = 0;
            let high = this.values.length - 1;
            let mid = 0;
            let midStop = 0;
            let midStart = 0;
            while (low <= high) {
                mid = low + ((high - low) / 2) | 0;
                midStop = this.prefixSum[mid];
                midStart = midStop - this.values[mid];
                if (sum < midStart) {
                    high = mid - 1;
                }
                else if (sum >= midStop) {
                    low = mid + 1;
                }
                else {
                    break;
                }
            }
            return new PrefixSumIndexOfResult(mid, sum - midStart);
        }
    }
    exports.PrefixSumComputer = PrefixSumComputer;
    /**
     * {@link getIndexOf} has an amortized runtime complexity of O(1).
     *
     * ({@link PrefixSumComputer.getIndexOf} is just  O(log n))
    */
    class ConstantTimePrefixSumComputer {
        constructor(values) {
            this._values = values;
            this._isValid = false;
            this._validEndIndex = -1;
            this._prefixSum = [];
            this._indexBySum = [];
        }
        /**
         * @returns SUM(0 <= j < values.length, values[j])
         */
        getTotalSum() {
            this._ensureValid();
            return this._indexBySum.length;
        }
        /**
         * Returns the sum of the first `count` many items.
         * @returns `SUM(0 <= j < count, values[j])`.
         */
        getPrefixSum(count) {
            this._ensureValid();
            if (count === 0) {
                return 0;
            }
            return this._prefixSum[count - 1];
        }
        /**
         * @returns `result`, such that `getPrefixSum(result.index) + result.remainder = sum`
         */
        getIndexOf(sum) {
            this._ensureValid();
            const idx = this._indexBySum[sum];
            const viewLinesAbove = idx > 0 ? this._prefixSum[idx - 1] : 0;
            return new PrefixSumIndexOfResult(idx, sum - viewLinesAbove);
        }
        removeValues(start, deleteCount) {
            this._values.splice(start, deleteCount);
            this._invalidate(start);
        }
        insertValues(insertIndex, insertArr) {
            this._values = (0, arrays_1.arrayInsert)(this._values, insertIndex, insertArr);
            this._invalidate(insertIndex);
        }
        _invalidate(index) {
            this._isValid = false;
            this._validEndIndex = Math.min(this._validEndIndex, index - 1);
        }
        _ensureValid() {
            if (this._isValid) {
                return;
            }
            for (let i = this._validEndIndex + 1, len = this._values.length; i < len; i++) {
                const value = this._values[i];
                const sumAbove = i > 0 ? this._prefixSum[i - 1] : 0;
                this._prefixSum[i] = sumAbove + value;
                for (let j = 0; j < value; j++) {
                    this._indexBySum[sumAbove + j] = i;
                }
            }
            // trim things
            this._prefixSum.length = this._values.length;
            this._indexBySum.length = this._prefixSum[this._prefixSum.length - 1];
            // mark as valid
            this._isValid = true;
            this._validEndIndex = this._values.length - 1;
        }
        setValue(index, value) {
            if (this._values[index] === value) {
                // no change
                return;
            }
            this._values[index] = value;
            this._invalidate(index);
        }
    }
    exports.ConstantTimePrefixSumComputer = ConstantTimePrefixSumComputer;
    class PrefixSumIndexOfResult {
        constructor(index, remainder) {
            this.index = index;
            this.remainder = remainder;
            this._prefixSumIndexOfResultBrand = undefined;
            this.index = index;
            this.remainder = remainder;
        }
    }
    exports.PrefixSumIndexOfResult = PrefixSumIndexOfResult;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZml4U3VtQ29tcHV0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbW9kZWwvcHJlZml4U3VtQ29tcHV0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHLE1BQWEsaUJBQWlCO1FBaUI3QixZQUFZLE1BQW1CO1lBQzlCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVNLFFBQVE7WUFDZCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzNCLENBQUM7UUFFTSxZQUFZLENBQUMsV0FBbUIsRUFBRSxZQUF5QjtZQUNqRSxXQUFXLEdBQUcsSUFBQSxlQUFRLEVBQUMsV0FBVyxDQUFDLENBQUM7WUFDcEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUM5QixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3BDLE1BQU0sZUFBZSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUM7WUFFNUMsSUFBSSxlQUFlLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxXQUFXLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxlQUFlLENBQUMsQ0FBQztZQUNsRSxJQUFJLENBQUMs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