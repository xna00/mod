/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position"], function (require, exports, position_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Range = void 0;
    /**
     * A range in the editor. (startLineNumber,startColumn) is <= (endLineNumber,endColumn)
     */
    class Range {
        constructor(startLineNumber, startColumn, endLineNumber, endColumn) {
            if ((startLineNumber > endLineNumber) || (startLineNumber === endLineNumber && startColumn > endColumn)) {
                this.startLineNumber = endLineNumber;
                this.startColumn = endColumn;
                this.endLineNumber = startLineNumber;
                this.endColumn = startColumn;
            }
            else {
                this.startLineNumber = startLineNumber;
                this.startColumn = startColumn;
                this.endLineNumber = endLineNumber;
                this.endColumn = endColumn;
            }
        }
        /**
         * Test if this range is empty.
         */
        isEmpty() {
            return Range.isEmpty(this);
        }
        /**
         * Test if `range` is empty.
         */
        static isEmpty(range) {
            return (range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn);
        }
        /**
         * Test if position is in this range. If the position is at the edges, will return true.
         */
        containsPosition(position) {
            return Range.containsPosition(this, position);
        }
        /**
         * Test if `position` is in `range`. If the position is at the edges, will return true.
         */
        static containsPosition(range, position) {
            if (position.lineNumber < range.startLineNumber || position.lineNumber > range.endLineNumber) {
                return false;
            }
            if (position.lineNumber === range.startLineNumber && position.column < range.startColumn) {
                return false;
            }
            if (position.lineNumber === range.endLineNumber && position.column > range.endColumn) {
                return false;
            }
            return true;
        }
        /**
         * Test if `position` is in `range`. If the position is at the edges, will return false.
         * @internal
         */
        static strictContainsPosition(range, position) {
            if (position.lineNumber < range.startLineNumber || position.lineNumber > range.endLineNumber) {
                return false;
            }
            if (position.lineNumber === range.startLineNumber && position.column <= range.startColumn) {
                return false;
            }
            if (position.lineNumber === range.endLineNumber && position.column >= range.endColumn) {
                return false;
            }
            return true;
        }
        /**
         * Test if range is in this range. If the range is equal to this range, will return true.
         */
        containsRange(range) {
            return Range.containsRange(this, range);
        }
        /**
         * Test if `otherRange` is in `range`. If the ranges are equal, will return true.
         */
        static containsRange(range, otherRange) {
            if (otherRange.startLineNumber < range.startLineNumber || otherRange.endLineNumber < range.startLineNumber) {
                return false;
            }
            if (otherRange.startLineNumber > range.endLineNumber || otherRange.endLineNumber > range.endLineNumber) {
                return false;
            }
            if (otherRange.startLineNumber === range.startLineNumber && otherRange.startColumn < range.startColumn) {
                return false;
            }
            if (otherRange.endLineNumber === range.endLineNumber && otherRange.endColumn > range.endColumn) {
                return false;
            }
            return true;
        }
        /**
         * Test if `range` is strictly in this range. `range` must start after and end before this range for the result to be true.
         */
        strictContainsRange(range) {
            return Range.strictContainsRange(this, range);
        }
        /**
         * Test if `otherRange` is strictly in `range` (must start after, and end before). If the ranges are equal, will return false.
         */
        static strictContainsRange(range, otherRange) {
            if (otherRange.startLineNumber < range.startLineNumber || otherRange.endLineNumber < range.startLineNumber) {
                return false;
            }
            if (otherRange.startLineNumber > range.endLineNumber || otherRange.endLineNumber > range.endLineNumber) {
                return false;
            }
            if (otherRange.startLineNumber === range.startLineNumber && otherRange.startColumn <= range.startColumn) {
                return false;
            }
            if (otherRange.endLineNumber === range.endLineNumber && otherRange.endColumn >= range.endColumn) {
                return false;
            }
            return true;
        }
        /**
         * A reunion of the two ranges.
         * The smallest position will be used as the start point, and the largest one as the end point.
         */
        plusRange(range) {
            return Range.plusRange(this, range);
        }
        /**
         * A reunion of the two ranges.
         * The smallest position will be used as the start point, and the largest one as the end point.
         */
        static plusRange(a, b) {
            let startLineNumber;
            let startColumn;
            let endLineNumber;
            let endColumn;
            if (b.startLineNumber < a.startLineNumber) {
                startLineNumber = b.startLineNumber;
                startColumn = b.startColumn;
            }
            else if (b.startLineNumber === a.startLineNumber) {
                startLineNumber = b.startLineNumber;
                startColumn = Math.min(b.startColumn, a.startColumn);
            }
            else {
                startLineNumber = a.startLineNumber;
                startColumn = a.startColumn;
            }
            if (b.endLineNumber > a.endLineNumber) {
                endLineNumber = b.endLineNumber;
                endColumn = b.endColumn;
            }
            else if (b.endLineNumber === a.endLineNumber) {
                endLineNumber = b.endLineNumber;
                endColumn = Math.max(b.endColumn, a.endColumn);
            }
            else {
                endLineNumber = a.endLineNumber;
                endColumn = a.endColumn;
            }
            return new Range(startLineNumber, startColumn, endLineNumber, endColumn);
        }
        /**
         * A intersection of the two ranges.
         */
        intersectRanges(range) {
            return Range.intersectRanges(this, range);
        }
        /**
         * A intersection of the two ranges.
         */
        static intersectRanges(a, b) {
            let resultStartLineNumber = a.startLineNumber;
            let resultStartColumn = a.startColumn;
            let resultEndLineNumber = a.endLineNumber;
            let resultEndColumn = a.endColumn;
            const otherStartLineNumber = b.startLineNumber;
            const otherStartColumn = b.startColumn;
            const otherEndLineNumber = b.endLineNumber;
            const otherEndColumn = b.endColumn;
            if (resultStartLineNumber < otherStartLineNumber) {
                resultStartLineNumber = otherStartLineNumber;
                resultStartColumn = otherStartColumn;
            }
            else if (resultStartLineNumber === otherStartLineNumber) {
                resultStartColumn = Math.max(resultStartColumn, otherStartColumn);
            }
            if (resultEndLineNumber > otherEndLineNumber) {
                resultEndLineNumber = otherEndLineNumber;
                resultEndColumn = otherEndColumn;
            }
            else if (resultEndLineNumber === otherEndLineNumber) {
                resultEndColumn = Math.min(resultEndColumn, otherEndColumn);
            }
            // Check if selection is now empty
            if (resultStartLineNumber > resultEndLineNumber) {
                return null;
            }
            if (resultStartLineNumber === resultEndLineNumber && resultStartColumn > resultEndColumn) {
                return null;
            }
            return new Range(resultStartLineNumber, resultStartColumn, resultEndLineNumber, resultEndColumn);
        }
        /**
         * Test if this range equals other.
         */
        equalsRange(other) {
            return Range.equalsRange(this, other);
        }
        /**
         * Test if range `a` equals `b`.
         */
        static equalsRange(a, b) {
            if (!a && !b) {
                return true;
            }
            return (!!a &&
                !!b &&
                a.startLineNumber === b.startLineNumber &&
                a.startColumn === b.startColumn &&
                a.endLineNumber === b.endLineNumber &&
                a.endColumn === b.endColumn);
        }
        /**
         * Return the end position (which will be after or equal to the start position)
         */
        getEndPosition() {
            return Range.getEndPosition(this);
        }
        /**
         * Return the end position (which will be after or equal to the start position)
         */
        static getEndPosition(range) {
            return new position_1.Position(range.endLineNumber, range.endColumn);
        }
        /**
         * Return the start position (which will be before or equal to the end position)
         */
        getStartPosition() {
            return Range.getStartPosition(this);
        }
        /**
         * Return the start position (which will be before or equal to the end position)
         */
        static getStartPosition(range) {
            return new position_1.Position(range.startLineNumber, range.startColumn);
        }
        /**
         * Transform to a user presentable string representation.
         */
        toString() {
            return '[' + this.startLineNumber + ',' + this.startColumn + ' -> ' + this.endLineNumber + ',' + this.endColumn + ']';
        }
        /**
         * Create a new range using this range's start position, and using endLineNumber and endColumn as the end position.
         */
        setEndPosition(endLineNumber, endColumn) {
            return new Range(this.startLineNumber, this.startColumn, endLineNumber, endColumn);
        }
        /**
         * Create a new range using this range's end position, and using startLineNumber and startColumn as the start position.
         */
        setStartPosition(startLineNumber, startColumn) {
            return new Range(startLineNumber, startColumn, this.endLineNumber, this.endColumn);
        }
        /**
         * Create a new empty range using this range's start position.
         */
        collapseToStart() {
            return Range.collapseToStart(this);
        }
        /**
         * Create a new empty range using this range's start position.
         */
        static collapseToStart(range) {
            return new Range(range.startLineNumber, range.startColumn, range.startLineNumber, range.startColumn);
        }
        /**
         * Create a new empty range using this range's end position.
         */
        collapseToEnd() {
            return Range.collapseToEnd(this);
        }
        /**
         * Create a new empty range using this range's end position.
         */
        static collapseToEnd(range) {
            return new Range(range.endLineNumber, range.endColumn, range.endLineNumber, range.endColumn);
        }
        /**
         * Moves the range by the given amount of lines.
         */
        delta(lineCount) {
            return new Range(this.startLineNumber + lineCount, this.startColumn, this.endLineNumber + lineCount, this.endColumn);
        }
        // ---
        static fromPositions(start, end = start) {
            return new Range(start.lineNumber, start.column, end.lineNumber, end.column);
        }
        static lift(range) {
            if (!range) {
                return null;
            }
            return new Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
        }
        /**
         * Test if `obj` is an `IRange`.
         */
        static isIRange(obj) {
            return (obj
                && (typeof obj.startLineNumber === 'number')
                && (typeof obj.startColumn === 'number')
                && (typeof obj.endLineNumber === 'number')
                && (typeof obj.endColumn === 'number'));
        }
        /**
         * Test if the two ranges are touching in any way.
         */
        static areIntersectingOrTouching(a, b) {
            // Check if `a` is before `b`
            if (a.endLineNumber < b.startLineNumber || (a.endLineNumber === b.startLineNumber && a.endColumn < b.startColumn)) {
                return false;
            }
            // Check if `b` is before `a`
            if (b.endLineNumber < a.startLineNumber || (b.endLineNumber === a.startLineNumber && b.endColumn < a.startColumn)) {
                return false;
            }
            // These ranges must intersect
            return true;
        }
        /**
         * Test if the two ranges are intersecting. If the ranges are touching it returns true.
         */
        static areIntersecting(a, b) {
            // Check if `a` is before `b`
            if (a.endLineNumber < b.startLineNumber || (a.endLineNumber === b.startLineNumber && a.endColumn <= b.startColumn)) {
                return false;
            }
            // Check if `b` is before `a`
            if (b.endLineNumber < a.startLineNumber || (b.endLineNumber === a.startLineNumber && b.endColumn <= a.startColumn)) {
                return false;
            }
            // These ranges must intersect
            return true;
        }
        /**
         * A function that compares ranges, useful for sorting ranges
         * It will first compare ranges on the startPosition and then on the endPosition
         */
        static compareRangesUsingStarts(a, b) {
            if (a && b) {
                const aStartLineNumber = a.startLineNumber | 0;
                const bStartLineNumber = b.startLineNumber | 0;
                if (aStartLineNumber === bStartLineNumber) {
                    const aStartColumn = a.startColumn | 0;
                    const bStartColumn = b.startColumn | 0;
                    if (aStartColumn === bStartColumn) {
                        const aEndLineNumber = a.endLineNumber | 0;
                        const bEndLineNumber = b.endLineNumber | 0;
                        if (aEndLineNumber === bEndLineNumber) {
                            const aEndColumn = a.endColumn | 0;
                            const bEndColumn = b.endColumn | 0;
                            return aEndColumn - bEndColumn;
                        }
                        return aEndLineNumber - bEndLineNumber;
                    }
                    return aStartColumn - bStartColumn;
                }
                return aStartLineNumber - bStartLineNumber;
            }
            const aExists = (a ? 1 : 0);
            const bExists = (b ? 1 : 0);
            return aExists - bExists;
        }
        /**
         * A function that compares ranges, useful for sorting ranges
         * It will first compare ranges on the endPosition and then on the startPosition
         */
        static compareRangesUsingEnds(a, b) {
            if (a.endLineNumber === b.endLineNumber) {
                if (a.endColumn === b.endColumn) {
                    if (a.startLineNumber === b.startLineNumber) {
                        return a.startColumn - b.startColumn;
                    }
                    return a.startLineNumber - b.startLineNumber;
                }
                return a.endColumn - b.endColumn;
            }
            return a.endLineNumber - b.endLineNumber;
        }
        /**
         * Test if the range spans multiple lines.
         */
        static spansMultipleLines(range) {
            return range.endLineNumber > range.startLineNumber;
        }
        toJSON() {
            return this;
        }
    }
    exports.Range = Range;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZ2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vY29yZS9yYW5nZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEwQmhHOztPQUVHO0lBQ0gsTUFBYSxLQUFLO1FBbUJqQixZQUFZLGVBQXVCLEVBQUUsV0FBbUIsRUFBRSxhQUFxQixFQUFFLFNBQWlCO1lBQ2pHLElBQUksQ0FBQyxlQUFlLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxlQUFlLEtBQUssYUFBYSxJQUFJLFdBQVcsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDO2dCQUN6RyxJQUFJLENBQUMsZUFBZSxHQUFHLGFBQWEsQ0FBQztnQkFDckMsSUFBSSxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxhQUFhLEdBQUcsZUFBZSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsU0FBUyxHQUFHLFdBQVcsQ0FBQztZQUM5QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO2dCQUMvQixJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7WUFDNUIsQ0FBQztRQUNGLENBQUM7UUFFRDs7V0FFRztRQUNJLE9BQU87WUFDYixPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUVEOztXQUVHO1FBQ0ksTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFhO1lBQ2xDLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxLQUFLLEtBQUssQ0FBQyxhQUFhLElBQUksS0FBSyxDQUFDLFdBQVcsS0FBSyxLQUFL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