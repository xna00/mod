/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/editor/common/core/range"], function (require, exports, arrays_1, errors_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LineRange = void 0;
    class LineRange {
        static { this.compareByStart = (0, arrays_1.compareBy)(l => l.startLineNumber, arrays_1.numberComparator); }
        static join(ranges) {
            if (ranges.length === 0) {
                return undefined;
            }
            let startLineNumber = Number.MAX_SAFE_INTEGER;
            let endLineNumber = 0;
            for (const range of ranges) {
                startLineNumber = Math.min(startLineNumber, range.startLineNumber);
                endLineNumber = Math.max(endLineNumber, range.startLineNumber + range.lineCount);
            }
            return new LineRange(startLineNumber, endLineNumber - startLineNumber);
        }
        static fromLineNumbers(startLineNumber, endExclusiveLineNumber) {
            return new LineRange(startLineNumber, endExclusiveLineNumber - startLineNumber);
        }
        constructor(startLineNumber, lineCount) {
            this.startLineNumber = startLineNumber;
            this.lineCount = lineCount;
            if (lineCount < 0) {
                throw new errors_1.BugIndicatingError();
            }
        }
        join(other) {
            return new LineRange(Math.min(this.startLineNumber, other.startLineNumber), Math.max(this.endLineNumberExclusive, other.endLineNumberExclusive) - this.startLineNumber);
        }
        get endLineNumberExclusive() {
            return this.startLineNumber + this.lineCount;
        }
        get isEmpty() {
            return this.lineCount === 0;
        }
        /**
         * Returns false if there is at least one line between `this` and `other`.
        */
        touches(other) {
            return (this.endLineNumberExclusive >= other.startLineNumber &&
                other.endLineNumberExclusive >= this.startLineNumber);
        }
        isAfter(range) {
            return this.startLineNumber >= range.endLineNumberExclusive;
        }
        isBefore(range) {
            return range.startLineNumber >= this.endLineNumberExclusive;
        }
        delta(lineDelta) {
            return new LineRange(this.startLineNumber + lineDelta, this.lineCount);
        }
        toString() {
            return `[${this.startLineNumber},${this.endLineNumberExclusive})`;
        }
        equals(originalRange) {
            return this.startLineNumber === originalRange.startLineNumber && this.lineCount === originalRange.lineCount;
        }
        contains(lineNumber) {
            return this.startLineNumber <= lineNumber && lineNumber < this.endLineNumberExclusive;
        }
        deltaEnd(delta) {
            return new LineRange(this.startLineNumber, this.lineCount + delta);
        }
        deltaStart(lineDelta) {
            return new LineRange(this.startLineNumber + lineDelta, this.lineCount - lineDelta);
        }
        getLines(model) {
            const result = new Array(this.lineCount);
            for (let i = 0; i < this.lineCount; i++) {
                result[i] = model.getLineContent(this.startLineNumber + i);
            }
            return result;
        }
        containsRange(range) {
            return this.startLineNumber <= range.startLineNumber && range.endLineNumberExclusive <= this.endLineNumberExclusive;
        }
        toRange() {
            return new range_1.Range(this.startLineNumber, 1, this.endLineNumberExclusive, 1);
        }
        toInclusiveRange() {
            if (this.isEmpty) {
                return undefined;
            }
            return new range_1.Range(this.startLineNumber, 1, this.endLineNumberExclusive - 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
        }
        toInclusiveRangeOrEmpty() {
            if (this.isEmpty) {
                return new range_1.Range(this.startLineNumber, 1, this.startLineNumber, 1);
            }
            return new range_1.Range(this.startLineNumber, 1, this.endLineNumberExclusive - 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
        }
        intersects(lineRange) {
            return this.startLineNumber <= lineRange.endLineNumberExclusive
                && lineRange.startLineNumber <= this.endLineNumberExclusive;
        }
    }
    exports.LineRange = LineRange;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZVJhbmdlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL21vZGVsL2xpbmVSYW5nZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSxTQUFTO2lCQUNFLG1CQUFjLEdBQTBCLElBQUEsa0JBQVMsRUFBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUseUJBQWdCLENBQUMsQ0FBQztRQUU1RyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQW1CO1lBQ3JDLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELElBQUksZUFBZSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztZQUM5QyxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDdEIsS0FBSyxNQUFNLEtBQUssSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFDNUIsZUFBZSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFDbkUsYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2xGLENBQUM7WUFDRCxPQUFPLElBQUksU0FBUyxDQUFDLGVBQWUsRUFBRSxhQUFhLEdBQUcsZUFBZSxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUVELE1BQU0sQ0FBQyxlQUFlLENBQUMsZUFBdUIsRUFBRSxzQkFBOEI7WUFDN0UsT0FBTyxJQUFJLFNBQVMsQ0FBQyxlQUFlLEVBQUUsc0JBQXNCLEdBQUcsZUFBZSxDQUFD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