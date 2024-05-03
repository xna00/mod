/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/textLength"], function (require, exports, strings_1, position_1, range_1, textLength_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.lengthZero = void 0;
    exports.lengthDiff = lengthDiff;
    exports.lengthIsZero = lengthIsZero;
    exports.toLength = toLength;
    exports.lengthToObj = lengthToObj;
    exports.lengthGetLineCount = lengthGetLineCount;
    exports.lengthGetColumnCountIfZeroLineCount = lengthGetColumnCountIfZeroLineCount;
    exports.lengthAdd = lengthAdd;
    exports.sumLengths = sumLengths;
    exports.lengthEquals = lengthEquals;
    exports.lengthDiffNonNegative = lengthDiffNonNegative;
    exports.lengthLessThan = lengthLessThan;
    exports.lengthLessThanEqual = lengthLessThanEqual;
    exports.lengthGreaterThanEqual = lengthGreaterThanEqual;
    exports.lengthToPosition = lengthToPosition;
    exports.positionToLength = positionToLength;
    exports.lengthsToRange = lengthsToRange;
    exports.lengthOfRange = lengthOfRange;
    exports.lengthCompare = lengthCompare;
    exports.lengthOfString = lengthOfString;
    exports.lengthOfStringObj = lengthOfStringObj;
    exports.lengthHash = lengthHash;
    exports.lengthMax = lengthMax;
    /**
     * The end must be greater than or equal to the start.
    */
    function lengthDiff(startLineCount, startColumnCount, endLineCount, endColumnCount) {
        return (startLineCount !== endLineCount)
            ? toLength(endLineCount - startLineCount, endColumnCount)
            : toLength(0, endColumnCount - startColumnCount);
    }
    exports.lengthZero = 0;
    function lengthIsZero(length) {
        return length === 0;
    }
    /*
     * We have 52 bits available in a JS number.
     * We use the upper 26 bits to store the line and the lower 26 bits to store the column.
     */
    ///*
    const factor = 2 ** 26;
    /*/
    const factor = 1000000;
    // */
    function toLength(lineCount, columnCount) {
        // llllllllllllllllllllllllllcccccccccccccccccccccccccc (52 bits)
        //       line count (26 bits)    column count (26 bits)
        // If there is no overflow (all values/sums below 2^26 = 67108864),
        // we have `toLength(lns1, cols1) + toLength(lns2, cols2) = toLength(lns1 + lns2, cols1 + cols2)`.
        return (lineCount * factor + columnCount);
    }
    function lengthToObj(length) {
        const l = length;
        const lineCount = Math.floor(l / factor);
        const columnCount = l - lineCount * factor;
        return new textLength_1.TextLength(lineCount, columnCount);
    }
    function lengthGetLineCount(length) {
        return Math.floor(length / factor);
    }
    /**
     * Returns the amount of columns of the given length, assuming that it does not span any line.
    */
    function lengthGetColumnCountIfZeroLineCount(length) {
        return length;
    }
    function lengthAdd(l1, l2) {
        let r = l1 + l2;
        if (l2 >= factor) {
            r = r - (l1 % factor);
        }
        return r;
    }
    function sumLengths(items, lengthFn) {
        return items.reduce((a, b) => lengthAdd(a, lengthFn(b)), exports.lengthZero);
    }
    function lengthEquals(length1, length2) {
        return length1 === length2;
    }
    /**
     * Returns a non negative length `result` such that `lengthAdd(length1, result) = length2`, or zero if such length does not exist.
     */
    function lengthDiffNonNegative(length1, length2) {
        const l1 = length1;
        const l2 = length2;
        const diff = l2 - l1;
        if (diff <= 0) {
            // line-count of length1 is higher than line-count of length2
            // or they are equal and column-count of length1 is higher than column-count of length2
            return exports.lengthZero;
        }
        const lineCount1 = Math.floor(l1 / factor);
        const lineCount2 = Math.floor(l2 / factor);
        const colCount2 = l2 - lineCount2 * factor;
        if (lineCount1 === lineCount2) {
            const colCount1 = l1 - lineCount1 * factor;
            return toLength(0, colCount2 - colCount1);
        }
        else {
            return toLength(lineCount2 - lineCount1, colCount2);
        }
    }
    function lengthLessThan(length1, length2) {
        // First, compare line counts, then column counts.
        return length1 < length2;
    }
    function lengthLessThanEqual(length1, length2) {
        return length1 <= length2;
    }
    function lengthGreaterThanEqual(length1, length2) {
        return length1 >= length2;
    }
    function lengthToPosition(length) {
        const l = length;
        const lineCount = Math.floor(l / factor);
        const colCount = l - lineCount * factor;
        return new position_1.Position(lineCount + 1, colCount + 1);
    }
    function positionToLength(position) {
        return toLength(position.lineNumber - 1, position.column - 1);
    }
    function lengthsToRange(lengthStart, lengthEnd) {
        const l = lengthStart;
        const lineCount = Math.floor(l / factor);
        const colCount = l - lineCount * factor;
        const l2 = lengthEnd;
        const lineCount2 = Math.floor(l2 / factor);
        const colCount2 = l2 - lineCount2 * factor;
        return new range_1.Range(lineCount + 1, colCount + 1, lineCount2 + 1, colCount2 + 1);
    }
    function lengthOfRange(range) {
        if (range.startLineNumber === range.endLineNumber) {
            return new textLength_1.TextLength(0, range.endColumn - range.startColumn);
        }
        else {
            return new textLength_1.TextLength(range.endLineNumber - range.startLineNumber, range.endColumn - 1);
        }
    }
    function lengthCompare(length1, length2) {
        const l1 = length1;
        const l2 = length2;
        return l1 - l2;
    }
    function lengthOfString(str) {
        const lines = (0, strings_1.splitLines)(str);
        return toLength(lines.length - 1, lines[lines.length - 1].length);
    }
    function lengthOfStringObj(str) {
        const lines = (0, strings_1.splitLines)(str);
        return new textLength_1.TextLength(lines.length - 1, lines[lines.length - 1].length);
    }
    /**
     * Computes a numeric hash of the given length.
    */
    function lengthHash(length) {
        return length;
    }
    function lengthMax(length1, length2) {
        return length1 > length2 ? length1 : length2;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVuZ3RoLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsL2JyYWNrZXRQYWlyc1RleHRNb2RlbFBhcnQvYnJhY2tldFBhaXJzVHJlZS9sZW5ndGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLGdDQUlDO0lBVUQsb0NBRUM7SUFZRCw0QkFRQztJQUVELGtDQUtDO0lBRUQsZ0RBRUM7SUFLRCxrRkFFQztJQU1ELDhCQUlDO0lBRUQsZ0NBRUM7SUFFRCxvQ0FFQztJQUtELHNEQXNCQztJQUVELHdDQUdDO0lBRUQsa0RBRUM7SUFFRCx3REFFQztJQUVELDRDQUtDO0lBRUQsNENBRUM7SUFFRCx3Q0FVQztJQUVELHNDQU1DO0lBRUQsc0NBSUM7SUFFRCx3Q0FHQztJQUVELDhDQUdDO0lBS0QsZ0NBRUM7SUFFRCw4QkFFQztJQTdLRDs7TUFFRTtJQUNGLFNBQWdCLFVBQVUsQ0FBQyxjQUFzQixFQUFFLGdCQUF3QixFQUFFLFlBQW9CLEVBQUUsY0FBc0I7UUFDeEgsT0FBTyxDQUFDLGNBQWMsS0FBSyxZQUFZLENBQUM7WUFDdkMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEdBQUcsY0FBYyxFQUFFLGNBQWMsQ0FBQztZQUN6RCxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBUVksUUFBQSxVQUFVLEdBQUcsQ0FBa0IsQ0FBQztJQUU3QyxTQUFnQixZQUFZLENBQUMsTUFBYztRQUMxQyxPQUFPLE1BQXVCLEtBQUssQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxJQUFJO0lBQ0osTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN2Qjs7U0FFSztJQUVMLFNB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