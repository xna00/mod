/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/arraysFind", "vs/base/common/assert", "vs/base/common/errors", "vs/editor/common/core/range", "vs/workbench/contrib/mergeEditor/browser/utils", "./editing", "./lineRange", "vs/workbench/contrib/mergeEditor/browser/model/rangeUtils"], function (require, exports, arrays_1, arraysFind_1, assert_1, errors_1, range_1, utils_1, editing_1, lineRange_1, rangeUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DocumentRangeMap = exports.RangeMapping = exports.DetailedLineRangeMapping = exports.MappingAlignment = exports.DocumentLineRangeMap = exports.LineRangeMapping = void 0;
    /**
     * Represents a mapping of an input line range to an output line range.
    */
    class LineRangeMapping {
        static join(mappings) {
            return mappings.reduce((acc, cur) => acc ? acc.join(cur) : cur, undefined);
        }
        constructor(inputRange, outputRange) {
            this.inputRange = inputRange;
            this.outputRange = outputRange;
        }
        extendInputRange(extendedInputRange) {
            if (!extendedInputRange.containsRange(this.inputRange)) {
                throw new errors_1.BugIndicatingError();
            }
            const startDelta = extendedInputRange.startLineNumber - this.inputRange.startLineNumber;
            const endDelta = extendedInputRange.endLineNumberExclusive - this.inputRange.endLineNumberExclusive;
            return new LineRangeMapping(extendedInputRange, new lineRange_1.LineRange(this.outputRange.startLineNumber + startDelta, this.outputRange.lineCount - startDelta + endDelta));
        }
        join(other) {
            return new LineRangeMapping(this.inputRange.join(other.inputRange), this.outputRange.join(other.outputRange));
        }
        get resultingDeltaFromOriginalToModified() {
            return this.outputRange.endLineNumberExclusive - this.inputRange.endLineNumberExclusive;
        }
        toString() {
            return `${this.inputRange.toString()} -> ${this.outputRange.toString()}`;
        }
        addOutputLineDelta(delta) {
            return new LineRangeMapping(this.inputRange, this.outputRange.delta(delta));
        }
        addInputLineDelta(delta) {
            return new LineRangeMapping(this.inputRange.delta(delta), this.outputRange);
        }
        reverse() {
            return new LineRangeMapping(this.outputRange, this.inputRange);
        }
    }
    exports.LineRangeMapping = LineRangeMapping;
    /**
    * Represents a total monotonous mapping of line ranges in one document to another document.
    */
    class DocumentLineRangeMap {
        static betweenOutputs(inputToOutput1, inputToOutput2, inputLineCount) {
            const alignments = MappingAlignment.compute(inputToOutput1, inputToOutput2);
            const mappings = alignments.map((m) => new LineRangeMapping(m.output1Range, m.output2Range));
            return new DocumentLineRangeMap(mappings, inputLineCount);
        }
        constructor(
        /**
         * The line range mappings that define this document mapping.
         * The space between two input ranges must equal the space between two output ranges.
         * These holes act as dense sequence of 1:1 line mappings.
        */
        lineRangeMappings, inputLineCount) {
            this.lineRangeMappings = lineRangeMappings;
            this.inputLineCount = inputLineCount;
            (0, assert_1.assertFn)(() => {
                return (0, assert_1.checkAdjacentItems)(lineRangeMappings, (m1, m2) => m1.inputRange.isBefore(m2.inputRange) && m1.outputRange.isBefore(m2.outputRange) &&
                    m2.inputRange.startLineNumber - m1.inputRange.endLineNumberExclusive === m2.outputRange.startLineNumber - m1.outputRange.endLineNumberExclusive);
            });
        }
        project(lineNumber) {
            const lastBefore = (0, arraysFind_1.findLast)(this.lineRangeMappings, r => r.inputRange.startLineNumber <= lineNumber);
            if (!lastBefore) {
                return new LineRangeMapping(new lineRange_1.LineRange(lineNumber, 1), new lineRange_1.LineRange(lineNumber, 1));
            }
            if (lastBefore.inputRange.contains(lineNumber)) {
                return lastBefore;
            }
            const containingRange = new lineRange_1.LineRange(lineNumber, 1);
            const mappedRange = new lineRange_1.LineRange(lineNumber +
                lastBefore.outputRange.endLineNumberExclusive -
                lastBefore.inputRange.endLineNumberExclusive, 1);
            return new LineRangeMapping(containingRange, mappedRange);
        }
        get outputLineCount() {
            const last = (0, arrays_1.lastOrDefault)(this.lineRangeMappings);
            const diff = last ? last.outputRange.endLineNumberExclusive - last.inputRange.endLineNumberExclusive : 0;
            return this.inputLineCount + diff;
        }
        reverse() {
            return new DocumentLineRangeMap(this.lineRangeMappings.map(r => r.reverse()), this.outputLineCount);
        }
    }
    exports.DocumentLineRangeMap = DocumentLineRangeMap;
    /**
     * Aligns two mappings with a common input range.
     */
    class MappingAlignment {
        static compute(fromInputToOutput1, fromInputToOutput2) {
            const compareByStartLineNumber = (0, arrays_1.compareBy)((d) => d.inputRange.startLineNumber, arrays_1.numberComparator);
            const combinedDiffs = (0, utils_1.concatArrays)(fromInputToOutput1.map((diff) => ({ source: 0, diff })), fromInputToOutput2.map((diff) => ({ source: 1, diff }))).sort((0, arrays_1.compareBy)((d) => d.diff, compareByStartLineNumber));
            const currentDiffs = [new Array(), new Array()];
            const deltaFromBaseToInput = [0, 0];
            const alignments = new Array();
            function pushAndReset(inputRange) {
                const mapping1 = LineRangeMapping.join(currentDiffs[0]) || new LineRangeMapping(inputRange, inputRange.delta(deltaFromBaseToInput[0]));
                const mapping2 = LineRangeMapping.join(currentDiffs[1]) || new LineRangeMapping(inputRange, inputRange.delta(deltaFromBaseToInput[1]));
                alignments.push(new MappingAlignment(currentInputRange, mapping1.extendInputRange(currentInputRange).outputRange, currentDiffs[0], mapping2.extendInputRange(currentInputRange).outputRange, currentDiffs[1]));
                currentDiffs[0] = [];
                currentDiffs[1] = [];
            }
            let currentInputRange;
            for (const diff of combinedDiffs) {
                const range = diff.diff.inputRange;
                if (currentInputRange && !currentInputRange.touches(range)) {
                    pushAndReset(currentInputRange);
                    currentInputRange = undefined;
                }
                deltaFromBaseToInput[diff.source] =
                    diff.diff.resultingDeltaFromOriginalToModified;
                currentInputRange = currentInputRange ? currentInputRange.join(range) : range;
                currentDiffs[diff.source].push(diff.diff);
            }
            if (currentInputRange) {
                pushAndReset(currentInputRange);
            }
            return alignments;
        }
        constructor(inputRange, output1Range, output1LineMappings, output2Range, output2LineMappings) {
            this.inputRange = inputRange;
            this.output1Range = output1Range;
            this.output1LineMappings = output1LineMappings;
            this.output2Range = output2Range;
            this.output2LineMappings = output2LineMappings;
        }
        toString() {
            return `${this.output1Range} <- ${this.inputRange} -> ${this.output2Range}`;
        }
    }
    exports.MappingAlignment = MappingAlignment;
    /**
     * A line range mapping with inner range mappings.
    */
    class DetailedLineRangeMapping extends LineRangeMapping {
        static join(mappings) {
            return mappings.reduce((acc, cur) => acc ? acc.join(cur) : cur, undefined);
        }
        constructor(inputRange, inputTextModel, outputRange, outputTextModel, rangeMappings) {
            super(inputRange, outputRange);
            this.inputTextModel = inputTextModel;
            this.outputTextModel = outputTextModel;
            this.rangeMappings = rangeMappings || [new RangeMapping(this.inputRange.toRange(), this.outputRange.toRange())];
        }
        addOutputLineDelta(delta) {
            return new DetailedLineRangeMapping(this.inputRange, this.inputTextModel, this.outputRange.delta(delta), this.outputTextModel, this.rangeMappings.map(d => d.addOutputLineDelta(delta)));
        }
        addInputLineDelta(delta) {
            return new DetailedLineRangeMapping(this.inputRange.delta(delta), this.inputTextModel, this.outputRange, this.outputTextModel, this.rangeMappings.map(d => d.addInputLineDelta(delta)));
        }
        join(other) {
            return new DetailedLineRangeMapping(this.inputRange.join(other.inputRange), this.inputTextModel, this.outputRange.join(other.outputRange), this.outputTextModel);
        }
        getLineEdit() {
            return new editing_1.LineRangeEdit(this.inputRange, this.getOutputLines());
        }
        getReverseLineEdit() {
            return new editing_1.LineRangeEdit(this.outputRange, this.getInputLines());
        }
        getOutputLines() {
            return this.outputRange.getLines(this.outputTextModel);
        }
        getInputLines() {
            return this.inputRange.getLines(this.inputTextModel);
        }
    }
    exports.DetailedLineRangeMapping = DetailedLineRangeMapping;
    /**
     * Represents a mapping of an input range to an output range.
    */
    class RangeMapping {
        constructor(inputRange, outputRange) {
            this.inputRange = inputRange;
            this.outputRange = outputRange;
        }
        toString() {
            function rangeToString(range) {
                // TODO@hediet make this the default Range.toString
                return `[${range.startLineNumber}:${range.startColumn}, ${range.endLineNumber}:${range.endColumn})`;
            }
            return `${rangeToString(this.inputRange)} -> ${rangeToString(this.outputRange)}`;
        }
        addOutputLineDelta(deltaLines) {
            return new RangeMapping(this.inputRange, new range_1.Range(this.outputRange.startLineNumber + deltaLines, this.outputRange.startColumn, this.outputRange.endLineNumber + deltaLines, this.outputRange.endColumn));
        }
        addInputLineDelta(deltaLines) {
            return new RangeMapping(new range_1.Range(this.inputRange.startLineNumber + deltaLines, this.inputRange.startColumn, this.inputRange.endLineNumber + deltaLines, this.inputRange.endColumn), this.outputRange);
        }
        reverse() {
            return new RangeMapping(this.outputRange, this.inputRange);
        }
    }
    exports.RangeMapping = RangeMapping;
    /**
    * Represents a total monotonous mapping of ranges in one document to another document.
    */
    class DocumentRangeMap {
        constructor(
        /**
         * The line range mappings that define this document mapping.
         * Can have holes.
        */
        rangeMappings, inputLineCount) {
            this.rangeMappings = rangeMappings;
            this.inputLineCount = inputLineCount;
            (0, assert_1.assertFn)(() => (0, assert_1.checkAdjacentItems)(rangeMappings, (m1, m2) => (0, rangeUtils_1.rangeIsBeforeOrTouching)(m1.inputRange, m2.inputRange) &&
                (0, rangeUtils_1.rangeIsBeforeOrTouching)(m1.outputRange, m2.outputRange) /*&&
            lengthBetweenPositions(m1.inputRange.getEndPosition(), m2.inputRange.getStartPosition()).equals(
                lengthBetweenPositions(m1.outputRange.getEndPosition(), m2.outputRange.getStartPosition())
            )*/));
        }
        project(position) {
            const lastBefore = (0, arraysFind_1.findLast)(this.rangeMappings, r => r.inputRange.getStartPosition().isBeforeOrEqual(position));
            if (!lastBefore) {
                return new RangeMapping(range_1.Range.fromPositions(position, position), range_1.Range.fromPositions(position, position));
            }
            if ((0, rangeUtils_1.rangeContainsPosition)(lastBefore.inputRange, position)) {
                return lastBefore;
            }
            const dist = (0, rangeUtils_1.lengthBetweenPositions)(lastBefore.inputRange.getEndPosition(), position);
            const outputPos = (0, rangeUtils_1.addLength)(lastBefore.outputRange.getEndPosition(), dist);
            return new RangeMapping(range_1.Range.fromPositions(position), range_1.Range.fromPositions(outputPos));
        }
        projectRange(range) {
            const start = this.project(range.getStartPosition());
            const end = this.project(range.getEndPosition());
            return new RangeMapping(start.inputRange.plusRange(end.inputRange), start.outputRange.plusRange(end.outputRange));
        }
        get outputLineCount() {
            const last = (0, arrays_1.lastOrDefault)(this.rangeMappings);
            const diff = last ? last.outputRange.endLineNumber - last.inputRange.endLineNumber : 0;
            return this.inputLineCount + diff;
        }
        reverse() {
            return new DocumentRangeMap(this.rangeMappings.map(m => m.reverse()), this.outputLineCount);
        }
    }
    exports.DocumentRangeMap = DocumentRangeMap;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwcGluZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWVyZ2VFZGl0b3IvYnJvd3Nlci9tb2RlbC9tYXBwaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNoRzs7TUFFRTtJQUNGLE1BQWEsZ0JBQWdCO1FBQ3JCLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBcUM7WUFDdkQsT0FBTyxRQUFRLENBQUMsTUFBTSxDQUErQixDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzFHLENBQUM7UUFDRCxZQUNpQixVQUFxQixFQUNyQixXQUFzQjtZQUR0QixlQUFVLEdBQVYsVUFBVSxDQUFXO1lBQ3JCLGdCQUFXLEdBQVgsV0FBVyxDQUFXO1FBQ25DLENBQUM7UUFFRSxnQkFBZ0IsQ0FBQyxrQkFBNkI7WUFDcEQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDeEQsTUFBTSxJQUFJLDJCQUFrQixFQUFFLENBQUM7WUFDaEMsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFHLGtCQUFrQixDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQztZQUN4RixNQUFNLFFBQVEsR0FBRyxrQkFBa0IsQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLHNCQUFzQixDQUFDO1lBQ3BHLE9BQU8sSUFBSSxnQkFBZ0IsQ0FDMUIsa0JBQWtCLEVBQ2xCLElBQUkscUJBQVMsQ0FDWixJQUFJLENBQUMsV0FBVyxD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