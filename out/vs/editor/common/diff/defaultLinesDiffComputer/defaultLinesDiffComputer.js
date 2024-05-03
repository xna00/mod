/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/assert", "vs/editor/common/core/lineRange", "vs/editor/common/core/offsetRange", "vs/editor/common/core/range", "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm", "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/dynamicProgrammingDiffing", "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/myersDiffAlgorithm", "vs/editor/common/diff/defaultLinesDiffComputer/computeMovedLines", "vs/editor/common/diff/defaultLinesDiffComputer/heuristicSequenceOptimizations", "vs/editor/common/diff/defaultLinesDiffComputer/lineSequence", "vs/editor/common/diff/defaultLinesDiffComputer/linesSliceCharSequence", "vs/editor/common/diff/linesDiffComputer", "../rangeMapping"], function (require, exports, arrays_1, assert_1, lineRange_1, offsetRange_1, range_1, diffAlgorithm_1, dynamicProgrammingDiffing_1, myersDiffAlgorithm_1, computeMovedLines_1, heuristicSequenceOptimizations_1, lineSequence_1, linesSliceCharSequence_1, linesDiffComputer_1, rangeMapping_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultLinesDiffComputer = void 0;
    exports.lineRangeMappingFromRangeMappings = lineRangeMappingFromRangeMappings;
    exports.getLineRangeMapping = getLineRangeMapping;
    class DefaultLinesDiffComputer {
        constructor() {
            this.dynamicProgrammingDiffing = new dynamicProgrammingDiffing_1.DynamicProgrammingDiffing();
            this.myersDiffingAlgorithm = new myersDiffAlgorithm_1.MyersDiffAlgorithm();
        }
        computeDiff(originalLines, modifiedLines, options) {
            if (originalLines.length <= 1 && (0, arrays_1.equals)(originalLines, modifiedLines, (a, b) => a === b)) {
                return new linesDiffComputer_1.LinesDiff([], [], false);
            }
            if (originalLines.length === 1 && originalLines[0].length === 0 || modifiedLines.length === 1 && modifiedLines[0].length === 0) {
                return new linesDiffComputer_1.LinesDiff([
                    new rangeMapping_1.DetailedLineRangeMapping(new lineRange_1.LineRange(1, originalLines.length + 1), new lineRange_1.LineRange(1, modifiedLines.length + 1), [
                        new rangeMapping_1.RangeMapping(new range_1.Range(1, 1, originalLines.length, originalLines[0].length + 1), new range_1.Range(1, 1, modifiedLines.length, modifiedLines[0].length + 1))
                    ])
                ], [], false);
            }
            const timeout = options.maxComputationTimeMs === 0 ? diffAlgorithm_1.InfiniteTimeout.instance : new diffAlgorithm_1.DateTimeout(options.maxComputationTimeMs);
            const considerWhitespaceChanges = !options.ignoreTrimWhitespace;
            const perfectHashes = new Map();
            function getOrCreateHash(text) {
                let hash = perfectHashes.get(text);
                if (hash === undefined) {
                    hash = perfectHashes.size;
                    perfectHashes.set(text, hash);
                }
                return hash;
            }
            const originalLinesHashes = originalLines.map((l) => getOrCreateHash(l.trim()));
            const modifiedLinesHashes = modifiedLines.map((l) => getOrCreateHash(l.trim()));
            const sequence1 = new lineSequence_1.LineSequence(originalLinesHashes, originalLines);
            const sequence2 = new lineSequence_1.LineSequence(modifiedLinesHashes, modifiedLines);
            const lineAlignmentResult = (() => {
                if (sequence1.length + sequence2.length < 1700) {
                    // Use the improved algorithm for small files
                    return this.dynamicProgrammingDiffing.compute(sequence1, sequence2, timeout, (offset1, offset2) => originalLines[offset1] === modifiedLines[offset2]
                        ? modifiedLines[offset2].length === 0
                            ? 0.1
                            : 1 + Math.log(1 + modifiedLines[offset2].length)
                        : 0.99);
                }
                return this.myersDiffingAlgorithm.compute(sequence1, sequence2);
            })();
            let lineAlignments = lineAlignmentResult.diffs;
            let hitTimeout = lineAlignmentResult.hitTimeout;
            lineAlignments = (0, heuristicSequenceOptimizations_1.optimizeSequenceDiffs)(sequence1, sequence2, lineAlignments);
            lineAlignments = (0, heuristicSequenceOptimizations_1.removeVeryShortMatchingLinesBetweenDiffs)(sequence1, sequence2, lineAlignments);
            const alignments = [];
            const scanForWhitespaceChanges = (equalLinesCount) => {
                if (!considerWhitespaceChanges) {
                    return;
                }
                for (let i = 0; i < equalLinesCount; i++) {
                    const seq1Offset = seq1LastStart + i;
                    const seq2Offset = seq2LastStart + i;
                    if (originalLines[seq1Offset] !== modifiedLines[seq2Offset]) {
                        // This is because of whitespace changes, diff these lines
                        const characterDiffs = this.refineDiff(originalLines, modifiedLines, new diffAlgorithm_1.SequenceDiff(new offsetRange_1.OffsetRange(seq1Offset, seq1Offset + 1), new offsetRange_1.OffsetRange(seq2Offset, seq2Offset + 1)), timeout, considerWhitespaceChanges);
                        for (const a of characterDiffs.mappings) {
                            alignments.push(a);
                        }
                        if (characterDiffs.hitTimeout) {
                            hitTimeout = true;
                        }
                    }
                }
            };
            let seq1LastStart = 0;
            let seq2LastStart = 0;
            for (const diff of lineAlignments) {
                (0, assert_1.assertFn)(() => diff.seq1Range.start - seq1LastStart === diff.seq2Range.start - seq2LastStart);
                const equalLinesCount = diff.seq1Range.start - seq1LastStart;
                scanForWhitespaceChanges(equalLinesCount);
                seq1LastStart = diff.seq1Range.endExclusive;
                seq2LastStart = diff.seq2Range.endExclusive;
                const characterDiffs = this.refineDiff(originalLines, modifiedLines, diff, timeout, considerWhitespaceChanges);
                if (characterDiffs.hitTimeout) {
                    hitTimeout = true;
                }
                for (const a of characterDiffs.mappings) {
                    alignments.push(a);
                }
            }
            scanForWhitespaceChanges(originalLines.length - seq1LastStart);
            const changes = lineRangeMappingFromRangeMappings(alignments, originalLines, modifiedLines);
            let moves = [];
            if (options.computeMoves) {
                moves = this.computeMoves(changes, originalLines, modifiedLines, originalLinesHashes, modifiedLinesHashes, timeout, considerWhitespaceChanges);
            }
            // Make sure all ranges are valid
            (0, assert_1.assertFn)(() => {
                function validatePosition(pos, lines) {
                    if (pos.lineNumber < 1 || pos.lineNumber > lines.length) {
                        return false;
                    }
                    const line = lines[pos.lineNumber - 1];
                    if (pos.column < 1 || pos.column > line.length + 1) {
                        return false;
                    }
                    return true;
                }
                function validateRange(range, lines) {
                    if (range.startLineNumber < 1 || range.startLineNumber > lines.length + 1) {
                        return false;
                    }
                    if (range.endLineNumberExclusive < 1 || range.endLineNumberExclusive > lines.length + 1) {
                        return false;
                    }
                    return true;
                }
                for (const c of changes) {
                    if (!c.innerChanges) {
                        return false;
                    }
                    for (const ic of c.innerChanges) {
                        const valid = validatePosition(ic.modifiedRange.getStartPosition(), modifiedLines) && validatePosition(ic.modifiedRange.getEndPosition(), modifiedLines) &&
                            validatePosition(ic.originalRange.getStartPosition(), originalLines) && validatePosition(ic.originalRange.getEndPosition(), originalLines);
                        if (!valid) {
                            return false;
                        }
                    }
                    if (!validateRange(c.modified, modifiedLines) || !validateRange(c.original, originalLines)) {
                        return false;
                    }
                }
                return true;
            });
            return new linesDiffComputer_1.LinesDiff(changes, moves, hitTimeout);
        }
        computeMoves(changes, originalLines, modifiedLines, hashedOriginalLines, hashedModifiedLines, timeout, considerWhitespaceChanges) {
            const moves = (0, computeMovedLines_1.computeMovedLines)(changes, originalLines, modifiedLines, hashedOriginalLines, hashedModifiedLines, timeout);
            const movesWithDiffs = moves.map(m => {
                const moveChanges = this.refineDiff(originalLines, modifiedLines, new diffAlgorithm_1.SequenceDiff(m.original.toOffsetRange(), m.modified.toOffsetRange()), timeout, considerWhitespaceChanges);
                const mappings = lineRangeMappingFromRangeMappings(moveChanges.mappings, originalLines, modifiedLines, true);
                return new linesDiffComputer_1.MovedText(m, mappings);
            });
            return movesWithDiffs;
        }
        refineDiff(originalLines, modifiedLines, diff, timeout, considerWhitespaceChanges) {
            const slice1 = new linesSliceCharSequence_1.LinesSliceCharSequence(originalLines, diff.seq1Range, considerWhitespaceChanges);
            const slice2 = new linesSliceCharSequence_1.LinesSliceCharSequence(modifiedLines, diff.seq2Range, considerWhitespaceChanges);
            const diffResult = slice1.length + slice2.length < 500
                ? this.dynamicProgrammingDiffing.compute(slice1, slice2, timeout)
                : this.myersDiffingAlgorithm.compute(slice1, slice2, timeout);
            let diffs = diffResult.diffs;
            diffs = (0, heuristicSequenceOptimizations_1.optimizeSequenceDiffs)(slice1, slice2, diffs);
            diffs = (0, heuristicSequenceOptimizations_1.extendDiffsToEntireWordIfAppropriate)(slice1, slice2, diffs);
            diffs = (0, heuristicSequenceOptimizations_1.removeShortMatches)(slice1, slice2, diffs);
            diffs = (0, heuristicSequenceOptimizations_1.removeVeryShortMatchingTextBetweenLongDiffs)(slice1, slice2, diffs);
            const result = diffs.map((d) => new rangeMapping_1.RangeMapping(slice1.translateRange(d.seq1Range), slice2.translateRange(d.seq2Range)));
            // Assert: result applied on original should be the same as diff applied to original
            return {
                mappings: result,
                hitTimeout: diffResult.hitTimeout,
            };
        }
    }
    exports.DefaultLinesDiffComputer = DefaultLinesDiffComputer;
    function lineRangeMappingFromRangeMappings(alignments, originalLines, modifiedLines, dontAssertStartLine = false) {
        const changes = [];
        for (const g of (0, arrays_1.groupAdjacentBy)(alignments.map(a => getLineRangeMapping(a, originalLines, modifiedLines)), (a1, a2) => a1.original.overlapOrTouch(a2.original)
            || a1.modified.overlapOrTouch(a2.modified))) {
            const first = g[0];
            const last = g[g.length - 1];
            changes.push(new rangeMapping_1.DetailedLineRangeMapping(first.original.join(last.original), first.modified.join(last.modified), g.map(a => a.innerChanges[0])));
        }
        (0, assert_1.assertFn)(() => {
            if (!dontAssertStartLine && changes.length > 0) {
                if (changes[0].modified.startLineNumber !== changes[0].original.startLineNumber) {
                    return false;
                }
                if (modifiedLines.length - changes[changes.length - 1].modified.endLineNumberExclusive !== originalLines.length - changes[changes.length - 1].original.endLineNumberExclusive) {
                    return false;
                }
            }
            return (0, assert_1.checkAdjacentItems)(changes, (m1, m2) => m2.original.startLineNumber - m1.original.endLineNumberExclusive === m2.modified.startLineNumber - m1.modified.endLineNumberExclusive &&
                // There has to be an unchanged line in between (otherwise both diffs should have been joined)
                m1.original.endLineNumberExclusive < m2.original.startLineNumber &&
                m1.modified.endLineNumberExclusive < m2.modified.startLineNumber);
        });
        return changes;
    }
    function getLineRangeMapping(rangeMapping, originalLines, modifiedLines) {
        let lineStartDelta = 0;
        let lineEndDelta = 0;
        // rangeMapping describes the edit that replaces `rangeMapping.originalRange` with `newText := getText(modifiedLines, rangeMapping.modifiedRange)`.
        // original: ]xxx \n <- this line is not modified
        // modified: ]xx  \n
        if (rangeMapping.modifiedRange.endColumn === 1 && rangeMapping.originalRange.endColumn === 1
            && rangeMapping.originalRange.startLineNumber + lineStartDelta <= rangeMapping.originalRange.endLineNumber
            && rangeMapping.modifiedRange.startLineNumber + lineStartDelta <= rangeMapping.modifiedRange.endLineNumber) {
            // We can only do this if the range is not empty yet
            lineEndDelta = -1;
        }
        // original: xxx[ \n <- this line is not modified
        // modified: xxx[ \n
        if (rangeMapping.modifiedRange.startColumn - 1 >= modifiedLines[rangeMapping.modifiedRange.startLineNumber - 1].length
            && rangeMapping.originalRange.startColumn - 1 >= originalLines[rangeMapping.originalRange.startLineNumber - 1].length
            && rangeMapping.originalRange.startLineNumber <= rangeMapping.originalRange.endLineNumber + lineEndDelta
            && rangeMapping.modifiedRange.startLineNumber <= rangeMapping.modifiedRange.endLineNumber + lineEndDelta) {
            // We can only do this if the range is not empty yet
            lineStartDelta = 1;
        }
        const originalLineRange = new lineRange_1.LineRange(rangeMapping.originalRange.startLineNumber + lineStartDelta, rangeMapping.originalRange.endLineNumber + 1 + lineEndDelta);
        const modifiedLineRange = new lineRange_1.LineRange(rangeMapping.modifiedRange.startLineNumber + lineStartDelta, rangeMapping.modifiedRange.endLineNumber + 1 + lineEndDelta);
        return new rangeMapping_1.DetailedLineRangeMapping(originalLineRange, modifiedLineRange, [rangeMapping]);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdExpbmVzRGlmZkNvbXB1dGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2RpZmYvZGVmYXVsdExpbmVzRGlmZkNvbXB1dGVyL2RlZmF1bHRMaW5lc0RpZmZDb21wdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE0T2hHLDhFQW9DQztJQUVELGtEQW1DQztJQW5TRCxNQUFhLHdCQUF3QjtRQUFyQztZQUNrQiw4QkFBeUIsR0FBRyxJQUFJLHFEQUF5QixFQUFFLENBQUM7WUFDNUQsMEJBQXFCLEdBQUcsSUFBSSx1Q0FBa0IsRUFBRSxDQUFDO1FBc05uRSxDQUFDO1FBcE5BLFdBQVcsQ0FBQyxhQUF1QixFQUFFLGFBQXVCLEVBQUUsT0FBa0M7WUFDL0YsSUFBSSxhQUFhLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxJQUFBLGVBQU0sRUFBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQzFGLE9BQU8sSUFBSSw2QkFBUyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckMsQ0FBQztZQUVELElBQUksYUFBYSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksYUFBYSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDaEksT0FBTyxJQUFJLDZCQUFTLENBQUM7b0JBQ3BCLElBQUksdUNBQXdCLENBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsYUFB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