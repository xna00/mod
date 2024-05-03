/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/editor/common/core/offsetRange"], function (require, exports, arrays_1, errors_1, offsetRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DateTimeout = exports.InfiniteTimeout = exports.OffsetPair = exports.SequenceDiff = exports.DiffAlgorithmResult = void 0;
    class DiffAlgorithmResult {
        static trivial(seq1, seq2) {
            return new DiffAlgorithmResult([new SequenceDiff(offsetRange_1.OffsetRange.ofLength(seq1.length), offsetRange_1.OffsetRange.ofLength(seq2.length))], false);
        }
        static trivialTimedOut(seq1, seq2) {
            return new DiffAlgorithmResult([new SequenceDiff(offsetRange_1.OffsetRange.ofLength(seq1.length), offsetRange_1.OffsetRange.ofLength(seq2.length))], true);
        }
        constructor(diffs, 
        /**
         * Indicates if the time out was reached.
         * In that case, the diffs might be an approximation and the user should be asked to rerun the diff with more time.
         */
        hitTimeout) {
            this.diffs = diffs;
            this.hitTimeout = hitTimeout;
        }
    }
    exports.DiffAlgorithmResult = DiffAlgorithmResult;
    class SequenceDiff {
        static invert(sequenceDiffs, doc1Length) {
            const result = [];
            (0, arrays_1.forEachAdjacent)(sequenceDiffs, (a, b) => {
                result.push(SequenceDiff.fromOffsetPairs(a ? a.getEndExclusives() : OffsetPair.zero, b ? b.getStarts() : new OffsetPair(doc1Length, (a ? a.seq2Range.endExclusive - a.seq1Range.endExclusive : 0) + doc1Length)));
            });
            return result;
        }
        static fromOffsetPairs(start, endExclusive) {
            return new SequenceDiff(new offsetRange_1.OffsetRange(start.offset1, endExclusive.offset1), new offsetRange_1.OffsetRange(start.offset2, endExclusive.offset2));
        }
        constructor(seq1Range, seq2Range) {
            this.seq1Range = seq1Range;
            this.seq2Range = seq2Range;
        }
        swap() {
            return new SequenceDiff(this.seq2Range, this.seq1Range);
        }
        toString() {
            return `${this.seq1Range} <-> ${this.seq2Range}`;
        }
        join(other) {
            return new SequenceDiff(this.seq1Range.join(other.seq1Range), this.seq2Range.join(other.seq2Range));
        }
        delta(offset) {
            if (offset === 0) {
                return this;
            }
            return new SequenceDiff(this.seq1Range.delta(offset), this.seq2Range.delta(offset));
        }
        deltaStart(offset) {
            if (offset === 0) {
                return this;
            }
            return new SequenceDiff(this.seq1Range.deltaStart(offset), this.seq2Range.deltaStart(offset));
        }
        deltaEnd(offset) {
            if (offset === 0) {
                return this;
            }
            return new SequenceDiff(this.seq1Range.deltaEnd(offset), this.seq2Range.deltaEnd(offset));
        }
        intersectsOrTouches(other) {
            return this.seq1Range.intersectsOrTouches(other.seq1Range) || this.seq2Range.intersectsOrTouches(other.seq2Range);
        }
        intersect(other) {
            const i1 = this.seq1Range.intersect(other.seq1Range);
            const i2 = this.seq2Range.intersect(other.seq2Range);
            if (!i1 || !i2) {
                return undefined;
            }
            return new SequenceDiff(i1, i2);
        }
        getStarts() {
            return new OffsetPair(this.seq1Range.start, this.seq2Range.start);
        }
        getEndExclusives() {
            return new OffsetPair(this.seq1Range.endExclusive, this.seq2Range.endExclusive);
        }
    }
    exports.SequenceDiff = SequenceDiff;
    class OffsetPair {
        static { this.zero = new OffsetPair(0, 0); }
        static { this.max = new OffsetPair(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER); }
        constructor(offset1, offset2) {
            this.offset1 = offset1;
            this.offset2 = offset2;
        }
        toString() {
            return `${this.offset1} <-> ${this.offset2}`;
        }
        delta(offset) {
            if (offset === 0) {
                return this;
            }
            return new OffsetPair(this.offset1 + offset, this.offset2 + offset);
        }
        equals(other) {
            return this.offset1 === other.offset1 && this.offset2 === other.offset2;
        }
    }
    exports.OffsetPair = OffsetPair;
    class InfiniteTimeout {
        static { this.instance = new InfiniteTimeout(); }
        isValid() {
            return true;
        }
    }
    exports.InfiniteTimeout = InfiniteTimeout;
    class DateTimeout {
        constructor(timeout) {
            this.timeout = timeout;
            this.startTime = Date.now();
            this.valid = true;
            if (timeout <= 0) {
                throw new errors_1.BugIndicatingError('timeout must be positive');
            }
        }
        // Recommendation: Set a log-point `{this.disable()}` in the body
        isValid() {
            const valid = Date.now() - this.startTime < this.timeout;
            if (!valid && this.valid) {
                this.valid = false; // timeout reached
                // eslint-disable-next-line no-debugger
                debugger; // WARNING: Most likely debugging caused the timeout. Call `this.disable()` to continue without timing out.
            }
            return this.valid;
        }
        disable() {
            this.timeout = Number.MAX_SAFE_INTEGER;
            this.isValid = () => true;
            this.valid = true;
        }
    }
    exports.DateTimeout = DateTimeout;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkFsZ29yaXRobS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9kaWZmL2RlZmF1bHRMaW5lc0RpZmZDb21wdXRlci9hbGdvcml0aG1zL2RpZmZBbGdvcml0aG0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHLE1BQWEsbUJBQW1CO1FBQy9CLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBZSxFQUFFLElBQWU7WUFDOUMsT0FBTyxJQUFJLG1CQUFtQixDQUFDLENBQUMsSUFBSSxZQUFZLENBQUMseUJBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLHlCQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakksQ0FBQztRQUVELE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBZSxFQUFFLElBQWU7WUFDdEQsT0FBTyxJQUFJLG1CQUFtQixDQUFDLENBQUMsSUFBSSxZQUFZLENBQUMseUJBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLHlCQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEksQ0FBQztRQUVELFlBQ2lCLEtBQXFCO1FBQ3JDOzs7V0FHRztRQUNhLFVBQW1CO1lBTG5CLFVBQUssR0FBTCxLQUFLLENBQWdCO1lBS3JCLGVBQVUsR0FBVixVQUFVLENBQVM7UUFDaEMsQ0FBQztLQUNMO0lBakJELGtEQWlCQztJQUVELE1BQWEsWUFBWTtRQUNqQixNQUFNLENBQUMsTUFBTSxDQUFDLGFBQTZCLEVBQUUsVUFBa0I7WUFDckUsTUFBTSxNQUFNLEdBQW1CLEVBQUUs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