/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/lineRange"], function (require, exports, lineRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RangeMapping = exports.DetailedLineRangeMapping = exports.LineRangeMapping = void 0;
    /**
     * Maps a line range in the original text model to a line range in the modified text model.
     */
    class LineRangeMapping {
        static inverse(mapping, originalLineCount, modifiedLineCount) {
            const result = [];
            let lastOriginalEndLineNumber = 1;
            let lastModifiedEndLineNumber = 1;
            for (const m of mapping) {
                const r = new LineRangeMapping(new lineRange_1.LineRange(lastOriginalEndLineNumber, m.original.startLineNumber), new lineRange_1.LineRange(lastModifiedEndLineNumber, m.modified.startLineNumber));
                if (!r.modified.isEmpty) {
                    result.push(r);
                }
                lastOriginalEndLineNumber = m.original.endLineNumberExclusive;
                lastModifiedEndLineNumber = m.modified.endLineNumberExclusive;
            }
            const r = new LineRangeMapping(new lineRange_1.LineRange(lastOriginalEndLineNumber, originalLineCount + 1), new lineRange_1.LineRange(lastModifiedEndLineNumber, modifiedLineCount + 1));
            if (!r.modified.isEmpty) {
                result.push(r);
            }
            return result;
        }
        static clip(mapping, originalRange, modifiedRange) {
            const result = [];
            for (const m of mapping) {
                const original = m.original.intersect(originalRange);
                const modified = m.modified.intersect(modifiedRange);
                if (original && !original.isEmpty && modified && !modified.isEmpty) {
                    result.push(new LineRangeMapping(original, modified));
                }
            }
            return result;
        }
        constructor(originalRange, modifiedRange) {
            this.original = originalRange;
            this.modified = modifiedRange;
        }
        toString() {
            return `{${this.original.toString()}->${this.modified.toString()}}`;
        }
        flip() {
            return new LineRangeMapping(this.modified, this.original);
        }
        join(other) {
            return new LineRangeMapping(this.original.join(other.original), this.modified.join(other.modified));
        }
        get changedLineCount() {
            return Math.max(this.original.length, this.modified.length);
        }
    }
    exports.LineRangeMapping = LineRangeMapping;
    /**
     * Maps a line range in the original text model to a line range in the modified text model.
     * Also contains inner range mappings.
     */
    class DetailedLineRangeMapping extends LineRangeMapping {
        static fromRangeMappings(rangeMappings) {
            const originalRange = lineRange_1.LineRange.join(rangeMappings.map(r => lineRange_1.LineRange.fromRangeInclusive(r.originalRange)));
            const modifiedRange = lineRange_1.LineRange.join(rangeMappings.map(r => lineRange_1.LineRange.fromRangeInclusive(r.modifiedRange)));
            return new DetailedLineRangeMapping(originalRange, modifiedRange, rangeMappings);
        }
        constructor(originalRange, modifiedRange, innerChanges) {
            super(originalRange, modifiedRange);
            this.innerChanges = innerChanges;
        }
        flip() {
            return new DetailedLineRangeMapping(this.modified, this.original, this.innerChanges?.map(c => c.flip()));
        }
        withInnerChangesFromLineRanges() {
            return new DetailedLineRangeMapping(this.original, this.modified, [
                new RangeMapping(this.original.toExclusiveRange(), this.modified.toExclusiveRange()),
            ]);
        }
    }
    exports.DetailedLineRangeMapping = DetailedLineRangeMapping;
    /**
     * Maps a range in the original text model to a range in the modified text model.
     */
    class RangeMapping {
        constructor(originalRange, modifiedRange) {
            this.originalRange = originalRange;
            this.modifiedRange = modifiedRange;
        }
        toString() {
            return `{${this.originalRange.toString()}->${this.modifiedRange.toString()}}`;
        }
        flip() {
            return new RangeMapping(this.modifiedRange, this.originalRange);
        }
    }
    exports.RangeMapping = RangeMapping;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZ2VNYXBwaW5nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2RpZmYvcmFuZ2VNYXBwaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRzs7T0FFRztJQUNILE1BQWEsZ0JBQWdCO1FBQ3JCLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBb0MsRUFBRSxpQkFBeUIsRUFBRSxpQkFBeUI7WUFDL0csTUFBTSxNQUFNLEdBQXVCLEVBQUUsQ0FBQztZQUN0QyxJQUFJLHlCQUF5QixHQUFHLENBQUMsQ0FBQztZQUNsQyxJQUFJLHlCQUF5QixHQUFHLENBQUMsQ0FBQztZQUVsQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUN6QixNQUFNLENBQUMsR0FBRyxJQUFJLGdCQUFnQixDQUM3QixJQUFJLHFCQUFTLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFDcEUsSUFBSSxxQkFBUyxDQUFDLHlCQUF5QixFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLENBQ3BFLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hCLENBQUM7Z0JBQ0QseUJBQXlCLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQztnQkFDOUQseUJBQXlCLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQztZQUMvRCxDQUFDO1lBQ0QsTUFBTSxDQUFDLEdBQUcsSUFBSSxnQkFBZ0IsQ0FDN0IsSUFBSSxxQkFBUyxDQUFDLHlCQUF5QixFQUFFLGlCQUFpQixHQUFHLENBQUMs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