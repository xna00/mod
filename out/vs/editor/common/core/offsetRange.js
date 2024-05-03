/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors"], function (require, exports, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OffsetRangeSet = exports.OffsetRange = void 0;
    /**
     * A range of offsets (0-based).
    */
    class OffsetRange {
        static addRange(range, sortedRanges) {
            let i = 0;
            while (i < sortedRanges.length && sortedRanges[i].endExclusive < range.start) {
                i++;
            }
            let j = i;
            while (j < sortedRanges.length && sortedRanges[j].start <= range.endExclusive) {
                j++;
            }
            if (i === j) {
                sortedRanges.splice(i, 0, range);
            }
            else {
                const start = Math.min(range.start, sortedRanges[i].start);
                const end = Math.max(range.endExclusive, sortedRanges[j - 1].endExclusive);
                sortedRanges.splice(i, j - i, new OffsetRange(start, end));
            }
        }
        static tryCreate(start, endExclusive) {
            if (start > endExclusive) {
                return undefined;
            }
            return new OffsetRange(start, endExclusive);
        }
        static ofLength(length) {
            return new OffsetRange(0, length);
        }
        static ofStartAndLength(start, length) {
            return new OffsetRange(start, start + length);
        }
        constructor(start, endExclusive) {
            this.start = start;
            this.endExclusive = endExclusive;
            if (start > endExclusive) {
                throw new errors_1.BugIndicatingError(`Invalid range: ${this.toString()}`);
            }
        }
        get isEmpty() {
            return this.start === this.endExclusive;
        }
        delta(offset) {
            return new OffsetRange(this.start + offset, this.endExclusive + offset);
        }
        deltaStart(offset) {
            return new OffsetRange(this.start + offset, this.endExclusive);
        }
        deltaEnd(offset) {
            return new OffsetRange(this.start, this.endExclusive + offset);
        }
        get length() {
            return this.endExclusive - this.start;
        }
        toString() {
            return `[${this.start}, ${this.endExclusive})`;
        }
        equals(other) {
            return this.start === other.start && this.endExclusive === other.endExclusive;
        }
        containsRange(other) {
            return this.start <= other.start && other.endExclusive <= this.endExclusive;
        }
        contains(offset) {
            return this.start <= offset && offset < this.endExclusive;
        }
        /**
         * for all numbers n: range1.contains(n) or range2.contains(n) => range1.join(range2).contains(n)
         * The joined range is the smallest range that contains both ranges.
         */
        join(other) {
            return new OffsetRange(Math.min(this.start, other.start), Math.max(this.endExclusive, other.endExclusive));
        }
        /**
         * for all numbers n: range1.contains(n) and range2.contains(n) <=> range1.intersect(range2).contains(n)
         *
         * The resulting range is empty if the ranges do not intersect, but touch.
         * If the ranges don't even touch, the result is undefined.
         */
        intersect(other) {
            const start = Math.max(this.start, other.start);
            const end = Math.min(this.endExclusive, other.endExclusive);
            if (start <= end) {
                return new OffsetRange(start, end);
            }
            return undefined;
        }
        intersects(other) {
            const start = Math.max(this.start, other.start);
            const end = Math.min(this.endExclusive, other.endExclusive);
            return start < end;
        }
        intersectsOrTouches(other) {
            const start = Math.max(this.start, other.start);
            const end = Math.min(this.endExclusive, other.endExclusive);
            return start <= end;
        }
        isBefore(other) {
            return this.endExclusive <= other.start;
        }
        isAfter(other) {
            return this.start >= other.endExclusive;
        }
        slice(arr) {
            return arr.slice(this.start, this.endExclusive);
        }
        substring(str) {
            return str.substring(this.start, this.endExclusive);
        }
        /**
         * Returns the given value if it is contained in this instance, otherwise the closest value that is contained.
         * The range must not be empty.
         */
        clip(value) {
            if (this.isEmpty) {
                throw new errors_1.BugIndicatingError(`Invalid clipping range: ${this.toString()}`);
            }
            return Math.max(this.start, Math.min(this.endExclusive - 1, value));
        }
        /**
         * Returns `r := value + k * length` such that `r` is contained in this range.
         * The range must not be empty.
         *
         * E.g. `[5, 10).clipCyclic(10) === 5`, `[5, 10).clipCyclic(11) === 6` and `[5, 10).clipCyclic(4) === 9`.
         */
        clipCyclic(value) {
            if (this.isEmpty) {
                throw new errors_1.BugIndicatingError(`Invalid clipping range: ${this.toString()}`);
            }
            if (value < this.start) {
                return this.endExclusive - ((this.start - value) % this.length);
            }
            if (value >= this.endExclusive) {
                return this.start + ((value - this.start) % this.length);
            }
            return value;
        }
        map(f) {
            const result = [];
            for (let i = this.start; i < this.endExclusive; i++) {
                result.push(f(i));
            }
            return result;
        }
        forEach(f) {
            for (let i = this.start; i < this.endExclusive; i++) {
                f(i);
            }
        }
    }
    exports.OffsetRange = OffsetRange;
    class OffsetRangeSet {
        constructor() {
            this._sortedRanges = [];
        }
        addRange(range) {
            let i = 0;
            while (i < this._sortedRanges.length && this._sortedRanges[i].endExclusive < range.start) {
                i++;
            }
            let j = i;
            while (j < this._sortedRanges.length && this._sortedRanges[j].start <= range.endExclusive) {
                j++;
            }
            if (i === j) {
                this._sortedRanges.splice(i, 0, range);
            }
            else {
                const start = Math.min(range.start, this._sortedRanges[i].start);
                const end = Math.max(range.endExclusive, this._sortedRanges[j - 1].endExclusive);
                this._sortedRanges.splice(i, j - i, new OffsetRange(start, end));
            }
        }
        toString() {
            return this._sortedRanges.map(r => r.toString()).join(', ');
        }
        /**
         * Returns of there is a value that is contained in this instance and the given range.
         */
        intersectsStrict(other) {
            // TODO use binary search
            let i = 0;
            while (i < this._sortedRanges.length && this._sortedRanges[i].endExclusive <= other.start) {
                i++;
            }
            return i < this._sortedRanges.length && this._sortedRanges[i].start < other.endExclusive;
        }
        intersectWithRange(other) {
            // TODO use binary search + slice
            const result = new OffsetRangeSet();
            for (const range of this._sortedRanges) {
                const intersection = range.intersect(other);
                if (intersection) {
                    result.addRange(intersection);
                }
            }
            return result;
        }
        intersectWithRangeLength(other) {
            return this.intersectWithRange(other).length;
        }
        get length() {
            return this._sortedRanges.reduce((prev, cur) => prev + cur.length, 0);
        }
    }
    exports.OffsetRangeSet = OffsetRangeSet;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2Zmc2V0UmFuZ2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vY29yZS9vZmZzZXRSYW5nZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEc7O01BRUU7SUFDRixNQUFhLFdBQVc7UUFDaEIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFrQixFQUFFLFlBQTJCO1lBQ3JFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNWLE9BQU8sQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzlFLENBQUMsRUFBRSxDQUFDO1lBQ0wsQ0FBQztZQUNELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNWLE9BQU8sQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQy9FLENBQUMsRUFBRSxDQUFDO1lBQ0wsQ0FBQztZQUNELElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNiLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDM0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FB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