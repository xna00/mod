/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/editor/common/core/offsetRange", "vs/editor/common/core/range", "vs/base/common/arraysFind"], function (require, exports, errors_1, offsetRange_1, range_1, arraysFind_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LineRangeSet = exports.LineRange = void 0;
    /**
     * A range of lines (1-based).
     */
    class LineRange {
        static fromRange(range) {
            return new LineRange(range.startLineNumber, range.endLineNumber);
        }
        static fromRangeInclusive(range) {
            return new LineRange(range.startLineNumber, range.endLineNumber + 1);
        }
        static subtract(a, b) {
            if (!b) {
                return [a];
            }
            if (a.startLineNumber < b.startLineNumber && b.endLineNumberExclusive < a.endLineNumberExclusive) {
                return [
                    new LineRange(a.startLineNumber, b.startLineNumber),
                    new LineRange(b.endLineNumberExclusive, a.endLineNumberExclusive)
                ];
            }
            else if (b.startLineNumber <= a.startLineNumber && a.endLineNumberExclusive <= b.endLineNumberExclusive) {
                return [];
            }
            else if (b.endLineNumberExclusive < a.endLineNumberExclusive) {
                return [new LineRange(Math.max(b.endLineNumberExclusive, a.startLineNumber), a.endLineNumberExclusive)];
            }
            else {
                return [new LineRange(a.startLineNumber, Math.min(b.startLineNumber, a.endLineNumberExclusive))];
            }
        }
        /**
         * @param lineRanges An array of sorted line ranges.
         */
        static joinMany(lineRanges) {
            if (lineRanges.length === 0) {
                return [];
            }
            let result = new LineRangeSet(lineRanges[0].slice());
            for (let i = 1; i < lineRanges.length; i++) {
                result = result.getUnion(new LineRangeSet(lineRanges[i].slice()));
            }
            return result.ranges;
        }
        static join(lineRanges) {
            if (lineRanges.length === 0) {
                throw new errors_1.BugIndicatingError('lineRanges cannot be empty');
            }
            let startLineNumber = lineRanges[0].startLineNumber;
            let endLineNumberExclusive = lineRanges[0].endLineNumberExclusive;
            for (let i = 1; i < lineRanges.length; i++) {
                startLineNumber = Math.min(startLineNumber, lineRanges[i].startLineNumber);
                endLineNumberExclusive = Math.max(endLineNumberExclusive, lineRanges[i].endLineNumberExclusive);
            }
            return new LineRange(startLineNumber, endLineNumberExclusive);
        }
        static ofLength(startLineNumber, length) {
            return new LineRange(startLineNumber, startLineNumber + length);
        }
        /**
         * @internal
         */
        static deserialize(lineRange) {
            return new LineRange(lineRange[0], lineRange[1]);
        }
        constructor(startLineNumber, endLineNumberExclusive) {
            if (startLineNumber > endLineNumberExclusive) {
                throw new errors_1.BugIndicatingError(`startLineNumber ${startLineNumber} cannot be after endLineNumberExclusive ${endLineNumberExclusive}`);
            }
            this.startLineNumber = startLineNumber;
            this.endLineNumberExclusive = endLineNumberExclusive;
        }
        /**
         * Indicates if this line range contains the given line number.
         */
        contains(lineNumber) {
            return this.startLineNumber <= lineNumber && lineNumber < this.endLineNumberExclusive;
        }
        /**
         * Indicates if this line range is empty.
         */
        get isEmpty() {
            return this.startLineNumber === this.endLineNumberExclusive;
        }
        /**
         * Moves this line range by the given offset of line numbers.
         */
        delta(offset) {
            return new LineRange(this.startLineNumber + offset, this.endLineNumberExclusive + offset);
        }
        deltaLength(offset) {
            return new LineRange(this.startLineNumber, this.endLineNumberExclusive + offset);
        }
        /**
         * The number of lines this line range spans.
         */
        get length() {
            return this.endLineNumberExclusive - this.startLineNumber;
        }
        /**
         * Creates a line range that combines this and the given line range.
         */
        join(other) {
            return new LineRange(Math.min(this.startLineNumber, other.startLineNumber), Math.max(this.endLineNumberExclusive, other.endLineNumberExclusive));
        }
        toString() {
            return `[${this.startLineNumber},${this.endLineNumberExclusive})`;
        }
        /**
         * The resulting range is empty if the ranges do not intersect, but touch.
         * If the ranges don't even touch, the result is undefined.
         */
        intersect(other) {
            const startLineNumber = Math.max(this.startLineNumber, other.startLineNumber);
            const endLineNumberExclusive = Math.min(this.endLineNumberExclusive, other.endLineNumberExclusive);
            if (startLineNumber <= endLineNumberExclusive) {
                return new LineRange(startLineNumber, endLineNumberExclusive);
            }
            return undefined;
        }
        intersectsStrict(other) {
            return this.startLineNumber < other.endLineNumberExclusive && other.startLineNumber < this.endLineNumberExclusive;
        }
        overlapOrTouch(other) {
            return this.startLineNumber <= other.endLineNumberExclusive && other.startLineNumber <= this.endLineNumberExclusive;
        }
        equals(b) {
            return this.startLineNumber === b.startLineNumber && this.endLineNumberExclusive === b.endLineNumberExclusive;
        }
        toInclusiveRange() {
            if (this.isEmpty) {
                return null;
            }
            return new range_1.Range(this.startLineNumber, 1, this.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER);
        }
        toExclusiveRange() {
            return new range_1.Range(this.startLineNumber, 1, this.endLineNumberExclusive, 1);
        }
        mapToLineArray(f) {
            const result = [];
            for (let lineNumber = this.startLineNumber; lineNumber < this.endLineNumberExclusive; lineNumber++) {
                result.push(f(lineNumber));
            }
            return result;
        }
        forEach(f) {
            for (let lineNumber = this.startLineNumber; lineNumber < this.endLineNumberExclusive; lineNumber++) {
                f(lineNumber);
            }
        }
        /**
         * @internal
         */
        serialize() {
            return [this.startLineNumber, this.endLineNumberExclusive];
        }
        includes(lineNumber) {
            return this.startLineNumber <= lineNumber && lineNumber < this.endLineNumberExclusive;
        }
        /**
         * Converts this 1-based line range to a 0-based offset range (subtracts 1!).
         * @internal
         */
        toOffsetRange() {
            return new offsetRange_1.OffsetRange(this.startLineNumber - 1, this.endLineNumberExclusive - 1);
        }
    }
    exports.LineRange = LineRange;
    class LineRangeSet {
        constructor(
        /**
         * Sorted by start line number.
         * No two line ranges are touching or intersecting.
         */
        _normalizedRanges = []) {
            this._normalizedRanges = _normalizedRanges;
        }
        get ranges() {
            return this._normalizedRanges;
        }
        addRange(range) {
            if (range.length === 0) {
                return;
            }
            // Idea: Find joinRange such that:
            // replaceRange = _normalizedRanges.replaceRange(joinRange, range.joinAll(joinRange.map(idx => this._normalizedRanges[idx])))
            // idx of first element that touches range or that is after range
            const joinRangeStartIdx = (0, arraysFind_1.findFirstIdxMonotonousOrArrLen)(this._normalizedRanges, r => r.endLineNumberExclusive >= range.startLineNumber);
            // idx of element after { last element that touches range or that is before range }
            const joinRangeEndIdxExclusive = (0, arraysFind_1.findLastIdxMonotonous)(this._normalizedRanges, r => r.startLineNumber <= range.endLineNumberExclusive) + 1;
            if (joinRangeStartIdx === joinRangeEndIdxExclusive) {
                // If there is no element that touches range, then joinRangeStartIdx === joinRangeEndIdxExclusive and that value is the index of the element after range
                this._normalizedRanges.splice(joinRangeStartIdx, 0, range);
            }
            else if (joinRangeStartIdx === joinRangeEndIdxExclusive - 1) {
                // Else, there is an element that touches range and in this case it is both the first and last element. Thus we can replace it
                const joinRange = this._normalizedRanges[joinRangeStartIdx];
                this._normalizedRanges[joinRangeStartIdx] = joinRange.join(range);
            }
            else {
                // First and last element are different - we need to replace the entire range
                const joinRange = this._normalizedRanges[joinRangeStartIdx].join(this._normalizedRanges[joinRangeEndIdxExclusive - 1]).join(range);
                this._normalizedRanges.splice(joinRangeStartIdx, joinRangeEndIdxExclusive - joinRangeStartIdx, joinRange);
            }
        }
        contains(lineNumber) {
            const rangeThatStartsBeforeEnd = (0, arraysFind_1.findLastMonotonous)(this._normalizedRanges, r => r.startLineNumber <= lineNumber);
            return !!rangeThatStartsBeforeEnd && rangeThatStartsBeforeEnd.endLineNumberExclusive > lineNumber;
        }
        intersects(range) {
            const rangeThatStartsBeforeEnd = (0, arraysFind_1.findLastMonotonous)(this._normalizedRanges, r => r.startLineNumber < range.endLineNumberExclusive);
            return !!rangeThatStartsBeforeEnd && rangeThatStartsBeforeEnd.endLineNumberExclusive > range.startLineNumber;
        }
        getUnion(other) {
            if (this._normalizedRanges.length === 0) {
                return other;
            }
            if (other._normalizedRanges.length === 0) {
                return this;
            }
            const result = [];
            let i1 = 0;
            let i2 = 0;
            let current = null;
            while (i1 < this._normalizedRanges.length || i2 < other._normalizedRanges.length) {
                let next = null;
                if (i1 < this._normalizedRanges.length && i2 < other._normalizedRanges.length) {
                    const lineRange1 = this._normalizedRanges[i1];
                    const lineRange2 = other._normalizedRanges[i2];
                    if (lineRange1.startLineNumber < lineRange2.startLineNumber) {
                        next = lineRange1;
                        i1++;
                    }
                    else {
                        next = lineRange2;
                        i2++;
                    }
                }
                else if (i1 < this._normalizedRanges.length) {
                    next = this._normalizedRanges[i1];
                    i1++;
                }
                else {
                    next = other._normalizedRanges[i2];
                    i2++;
                }
                if (current === null) {
                    current = next;
                }
                else {
                    if (current.endLineNumberExclusive >= next.startLineNumber) {
                        // merge
                        current = new LineRange(current.startLineNumber, Math.max(current.endLineNumberExclusive, next.endLineNumberExclusive));
                    }
                    else {
                        // push
                        result.push(current);
                        current = next;
                    }
                }
            }
            if (current !== null) {
                result.push(current);
            }
            return new LineRangeSet(result);
        }
        /**
         * Subtracts all ranges in this set from `range` and returns the result.
         */
        subtractFrom(range) {
            // idx of first element that touches range or that is after range
            const joinRangeStartIdx = (0, arraysFind_1.findFirstIdxMonotonousOrArrLen)(this._normalizedRanges, r => r.endLineNumberExclusive >= range.startLineNumber);
            // idx of element after { last element that touches range or that is before range }
            const joinRangeEndIdxExclusive = (0, arraysFind_1.findLastIdxMonotonous)(this._normalizedRanges, r => r.startLineNumber <= range.endLineNumberExclusive) + 1;
            if (joinRangeStartIdx === joinRangeEndIdxExclusive) {
                return new LineRangeSet([range]);
            }
            const result = [];
            let startLineNumber = range.startLineNumber;
            for (let i = joinRangeStartIdx; i < joinRangeEndIdxExclusive; i++) {
                const r = this._normalizedRanges[i];
                if (r.startLineNumber > startLineNumber) {
                    result.push(new LineRange(startLineNumber, r.startLineNumber));
                }
                startLineNumber = r.endLineNumberExclusive;
            }
            if (startLineNumber < range.endLineNumberExclusive) {
                result.push(new LineRange(startLineNumber, range.endLineNumberExclusive));
            }
            return new LineRangeSet(result);
        }
        toString() {
            return this._normalizedRanges.map(r => r.toString()).join(', ');
        }
        getIntersection(other) {
            const result = [];
            let i1 = 0;
            let i2 = 0;
            while (i1 < this._normalizedRanges.length && i2 < other._normalizedRanges.length) {
                const r1 = this._normalizedRanges[i1];
                const r2 = other._normalizedRanges[i2];
                const i = r1.intersect(r2);
                if (i && !i.isEmpty) {
                    result.push(i);
                }
                if (r1.endLineNumberExclusive < r2.endLineNumberExclusive) {
                    i1++;
                }
                else {
                    i2++;
                }
            }
            return new LineRangeSet(result);
        }
        getWithDelta(value) {
            return new LineRangeSet(this._normalizedRanges.map(r => r.delta(value)));
        }
    }
    exports.LineRangeSet = LineRangeSet;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZVJhbmdlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2NvcmUvbGluZVJhbmdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRzs7T0FFRztJQUNILE1BQWEsU0FBUztRQUNkLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBWTtZQUNuQyxPQUFPLElBQUksU0FBUyxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFTSxNQUFNLENBQUMsa0JBQWtCLENBQUMsS0FBWTtZQUM1QyxPQUFPLElBQUksU0FBUyxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN0RSxDQUFDO1FBRU0sTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFZLEVBQUUsQ0FBd0I7WUFDNUQsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNSLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNaLENBQUM7WUFDRCxJQUFJLENBQUMsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLGVBQWUsSUFBSSxDQUFDLENBQUMsc0JBQXNCLEdBQUcsQ0FBQyxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQ2xHLE9BQU87b0JBQ04sSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsZUFBZSxDQUFDO29CQUNuRCxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDLHNCQUFzQixDQUFDO2lCQUNqRSxDQUFDO1lBQ0gsQ0FBQztpQkFBTSxJQUFJLENBQUMsQ0FBQyxlQUFlLElBQUksQ0FBQyxDQUFDLGVBQWUsSUFBSSxDQUFDLENBQUMsc0JBQXNC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