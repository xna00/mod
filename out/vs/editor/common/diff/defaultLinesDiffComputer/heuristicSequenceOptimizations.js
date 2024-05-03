/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/core/offsetRange", "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm"], function (require, exports, arrays_1, offsetRange_1, diffAlgorithm_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.optimizeSequenceDiffs = optimizeSequenceDiffs;
    exports.removeShortMatches = removeShortMatches;
    exports.extendDiffsToEntireWordIfAppropriate = extendDiffsToEntireWordIfAppropriate;
    exports.removeVeryShortMatchingLinesBetweenDiffs = removeVeryShortMatchingLinesBetweenDiffs;
    exports.removeVeryShortMatchingTextBetweenLongDiffs = removeVeryShortMatchingTextBetweenLongDiffs;
    function optimizeSequenceDiffs(sequence1, sequence2, sequenceDiffs) {
        let result = sequenceDiffs;
        result = joinSequenceDiffsByShifting(sequence1, sequence2, result);
        // Sometimes, calling this function twice improves the result.
        // Uncomment the second invocation and run the tests to see the difference.
        result = joinSequenceDiffsByShifting(sequence1, sequence2, result);
        result = shiftSequenceDiffs(sequence1, sequence2, result);
        return result;
    }
    /**
     * This function fixes issues like this:
     * ```
     * import { Baz, Bar } from "foo";
     * ```
     * <->
     * ```
     * import { Baz, Bar, Foo } from "foo";
     * ```
     * Computed diff: [ {Add "," after Bar}, {Add "Foo " after space} }
     * Improved diff: [{Add ", Foo" after Bar}]
     */
    function joinSequenceDiffsByShifting(sequence1, sequence2, sequenceDiffs) {
        if (sequenceDiffs.length === 0) {
            return sequenceDiffs;
        }
        const result = [];
        result.push(sequenceDiffs[0]);
        // First move them all to the left as much as possible and join them if possible
        for (let i = 1; i < sequenceDiffs.length; i++) {
            const prevResult = result[result.length - 1];
            let cur = sequenceDiffs[i];
            if (cur.seq1Range.isEmpty || cur.seq2Range.isEmpty) {
                const length = cur.seq1Range.start - prevResult.seq1Range.endExclusive;
                let d;
                for (d = 1; d <= length; d++) {
                    if (sequence1.getElement(cur.seq1Range.start - d) !== sequence1.getElement(cur.seq1Range.endExclusive - d) ||
                        sequence2.getElement(cur.seq2Range.start - d) !== sequence2.getElement(cur.seq2Range.endExclusive - d)) {
                        break;
                    }
                }
                d--;
                if (d === length) {
                    // Merge previous and current diff
                    result[result.length - 1] = new diffAlgorithm_1.SequenceDiff(new offsetRange_1.OffsetRange(prevResult.seq1Range.start, cur.seq1Range.endExclusive - length), new offsetRange_1.OffsetRange(prevResult.seq2Range.start, cur.seq2Range.endExclusive - length));
                    continue;
                }
                cur = cur.delta(-d);
            }
            result.push(cur);
        }
        const result2 = [];
        // Then move them all to the right and join them again if possible
        for (let i = 0; i < result.length - 1; i++) {
            const nextResult = result[i + 1];
            let cur = result[i];
            if (cur.seq1Range.isEmpty || cur.seq2Range.isEmpty) {
                const length = nextResult.seq1Range.start - cur.seq1Range.endExclusive;
                let d;
                for (d = 0; d < length; d++) {
                    if (!sequence1.isStronglyEqual(cur.seq1Range.start + d, cur.seq1Range.endExclusive + d) ||
                        !sequence2.isStronglyEqual(cur.seq2Range.start + d, cur.seq2Range.endExclusive + d)) {
                        break;
                    }
                }
                if (d === length) {
                    // Merge previous and current diff, write to result!
                    result[i + 1] = new diffAlgorithm_1.SequenceDiff(new offsetRange_1.OffsetRange(cur.seq1Range.start + length, nextResult.seq1Range.endExclusive), new offsetRange_1.OffsetRange(cur.seq2Range.start + length, nextResult.seq2Range.endExclusive));
                    continue;
                }
                if (d > 0) {
                    cur = cur.delta(d);
                }
            }
            result2.push(cur);
        }
        if (result.length > 0) {
            result2.push(result[result.length - 1]);
        }
        return result2;
    }
    // align character level diffs at whitespace characters
    // import { IBar } from "foo";
    // import { I[Arr, I]Bar } from "foo";
    // ->
    // import { [IArr, ]IBar } from "foo";
    // import { ITransaction, observableValue, transaction } from 'vs/base/common/observable';
    // import { ITransaction, observable[FromEvent, observable]Value, transaction } from 'vs/base/common/observable';
    // ->
    // import { ITransaction, [observableFromEvent, ]observableValue, transaction } from 'vs/base/common/observable';
    // collectBrackets(level + 1, levelPerBracketType);
    // collectBrackets(level + 1, levelPerBracket[ + 1, levelPerBracket]Type);
    // ->
    // collectBrackets(level + 1, [levelPerBracket + 1, ]levelPerBracketType);
    function shiftSequenceDiffs(sequence1, sequence2, sequenceDiffs) {
        if (!sequence1.getBoundaryScore || !sequence2.getBoundaryScore) {
            return sequenceDiffs;
        }
        for (let i = 0; i < sequenceDiffs.length; i++) {
            const prevDiff = (i > 0 ? sequenceDiffs[i - 1] : undefined);
            const diff = sequenceDiffs[i];
            const nextDiff = (i + 1 < sequenceDiffs.length ? sequenceDiffs[i + 1] : undefined);
            const seq1ValidRange = new offsetRange_1.OffsetRange(prevDiff ? prevDiff.seq1Range.endExclusive + 1 : 0, nextDiff ? nextDiff.seq1Range.start - 1 : sequence1.length);
            const seq2ValidRange = new offsetRange_1.OffsetRange(prevDiff ? prevDiff.seq2Range.endExclusive + 1 : 0, nextDiff ? nextDiff.seq2Range.start - 1 : sequence2.length);
            if (diff.seq1Range.isEmpty) {
                sequenceDiffs[i] = shiftDiffToBetterPosition(diff, sequence1, sequence2, seq1ValidRange, seq2ValidRange);
            }
            else if (diff.seq2Range.isEmpty) {
                sequenceDiffs[i] = shiftDiffToBetterPosition(diff.swap(), sequence2, sequence1, seq2ValidRange, seq1ValidRange).swap();
            }
        }
        return sequenceDiffs;
    }
    function shiftDiffToBetterPosition(diff, sequence1, sequence2, seq1ValidRange, seq2ValidRange) {
        const maxShiftLimit = 100; // To prevent performance issues
        // don't touch previous or next!
        let deltaBefore = 1;
        while (diff.seq1Range.start - deltaBefore >= seq1ValidRange.start &&
            diff.seq2Range.start - deltaBefore >= seq2ValidRange.start &&
            sequence2.isStronglyEqual(diff.seq2Range.start - deltaBefore, diff.seq2Range.endExclusive - deltaBefore) && deltaBefore < maxShiftLimit) {
            deltaBefore++;
        }
        deltaBefore--;
        let deltaAfter = 0;
        while (diff.seq1Range.start + deltaAfter < seq1ValidRange.endExclusive &&
            diff.seq2Range.endExclusive + deltaAfter < seq2ValidRange.endExclusive &&
            sequence2.isStronglyEqual(diff.seq2Range.start + deltaAfter, diff.seq2Range.endExclusive + deltaAfter) && deltaAfter < maxShiftLimit) {
            deltaAfter++;
        }
        if (deltaBefore === 0 && deltaAfter === 0) {
            return diff;
        }
        // Visualize `[sequence1.text, diff.seq1Range.start + deltaAfter]`
        // and `[sequence2.text, diff.seq2Range.start + deltaAfter, diff.seq2Range.endExclusive + deltaAfter]`
        let bestDelta = 0;
        let bestScore = -1;
        // find best scored delta
        for (let delta = -deltaBefore; delta <= deltaAfter; delta++) {
            const seq2OffsetStart = diff.seq2Range.start + delta;
            const seq2OffsetEndExclusive = diff.seq2Range.endExclusive + delta;
            const seq1Offset = diff.seq1Range.start + delta;
            const score = sequence1.getBoundaryScore(seq1Offset) + sequence2.getBoundaryScore(seq2OffsetStart) + sequence2.getBoundaryScore(seq2OffsetEndExclusive);
            if (score > bestScore) {
                bestScore = score;
                bestDelta = delta;
            }
        }
        return diff.delta(bestDelta);
    }
    function removeShortMatches(sequence1, sequence2, sequenceDiffs) {
        const result = [];
        for (const s of sequenceDiffs) {
            const last = result[result.length - 1];
            if (!last) {
                result.push(s);
                continue;
            }
            if (s.seq1Range.start - last.seq1Range.endExclusive <= 2 || s.seq2Range.start - last.seq2Range.endExclusive <= 2) {
                result[result.length - 1] = new diffAlgorithm_1.SequenceDiff(last.seq1Range.join(s.seq1Range), last.seq2Range.join(s.seq2Range));
            }
            else {
                result.push(s);
            }
        }
        return result;
    }
    function extendDiffsToEntireWordIfAppropriate(sequence1, sequence2, sequenceDiffs) {
        const equalMappings = diffAlgorithm_1.SequenceDiff.invert(sequenceDiffs, sequence1.length);
        const additional = [];
        let lastPoint = new diffAlgorithm_1.OffsetPair(0, 0);
        function scanWord(pair, equalMapping) {
            if (pair.offset1 < lastPoint.offset1 || pair.offset2 < lastPoint.offset2) {
                return;
            }
            const w1 = sequence1.findWordContaining(pair.offset1);
            const w2 = sequence2.findWordContaining(pair.offset2);
            if (!w1 || !w2) {
                return;
            }
            let w = new diffAlgorithm_1.SequenceDiff(w1, w2);
            const equalPart = w.intersect(equalMapping);
            let equalChars1 = equalPart.seq1Range.length;
            let equalChars2 = equalPart.seq2Range.length;
            // The words do not touch previous equals mappings, as we would have processed them already.
            // But they might touch the next ones.
            while (equalMappings.length > 0) {
                const next = equalMappings[0];
                const intersects = next.seq1Range.intersects(w.seq1Range) || next.seq2Range.intersects(w.seq2Range);
                if (!intersects) {
                    break;
                }
                const v1 = sequence1.findWordContaining(next.seq1Range.start);
                const v2 = sequence2.findWordContaining(next.seq2Range.start);
                // Because there is an intersection, we know that the words are not empty.
                const v = new diffAlgorithm_1.SequenceDiff(v1, v2);
                const equalPart = v.intersect(next);
                equalChars1 += equalPart.seq1Range.length;
                equalChars2 += equalPart.seq2Range.length;
                w = w.join(v);
                if (w.seq1Range.endExclusive >= next.seq1Range.endExclusive) {
                    // The word extends beyond the next equal mapping.
                    equalMappings.shift();
                }
                else {
                    break;
                }
            }
            if (equalChars1 + equalChars2 < (w.seq1Range.length + w.seq2Range.length) * 2 / 3) {
                additional.push(w);
            }
            lastPoint = w.getEndExclusives();
        }
        while (equalMappings.length > 0) {
            const next = equalMappings.shift();
            if (next.seq1Range.isEmpty) {
                continue;
            }
            scanWord(next.getStarts(), next);
            // The equal parts are not empty, so -1 gives us a character that is equal in both parts.
            scanWord(next.getEndExclusives().delta(-1), next);
        }
        const merged = mergeSequenceDiffs(sequenceDiffs, additional);
        return merged;
    }
    function mergeSequenceDiffs(sequenceDiffs1, sequenceDiffs2) {
        const result = [];
        while (sequenceDiffs1.length > 0 || sequenceDiffs2.length > 0) {
            const sd1 = sequenceDiffs1[0];
            const sd2 = sequenceDiffs2[0];
            let next;
            if (sd1 && (!sd2 || sd1.seq1Range.start < sd2.seq1Range.start)) {
                next = sequenceDiffs1.shift();
            }
            else {
                next = sequenceDiffs2.shift();
            }
            if (result.length > 0 && result[result.length - 1].seq1Range.endExclusive >= next.seq1Range.start) {
                result[result.length - 1] = result[result.length - 1].join(next);
            }
            else {
                result.push(next);
            }
        }
        return result;
    }
    function removeVeryShortMatchingLinesBetweenDiffs(sequence1, _sequence2, sequenceDiffs) {
        let diffs = sequenceDiffs;
        if (diffs.length === 0) {
            return diffs;
        }
        let counter = 0;
        let shouldRepeat;
        do {
            shouldRepeat = false;
            const result = [
                diffs[0]
            ];
            for (let i = 1; i < diffs.length; i++) {
                const cur = diffs[i];
                const lastResult = result[result.length - 1];
                function shouldJoinDiffs(before, after) {
                    const unchangedRange = new offsetRange_1.OffsetRange(lastResult.seq1Range.endExclusive, cur.seq1Range.start);
                    const unchangedText = sequence1.getText(unchangedRange);
                    const unchangedTextWithoutWs = unchangedText.replace(/\s/g, '');
                    if (unchangedTextWithoutWs.length <= 4
                        && (before.seq1Range.length + before.seq2Range.length > 5 || after.seq1Range.length + after.seq2Range.length > 5)) {
                        return true;
                    }
                    return false;
                }
                const shouldJoin = shouldJoinDiffs(lastResult, cur);
                if (shouldJoin) {
                    shouldRepeat = true;
                    result[result.length - 1] = result[result.length - 1].join(cur);
                }
                else {
                    result.push(cur);
                }
            }
            diffs = result;
        } while (counter++ < 10 && shouldRepeat);
        return diffs;
    }
    function removeVeryShortMatchingTextBetweenLongDiffs(sequence1, sequence2, sequenceDiffs) {
        let diffs = sequenceDiffs;
        if (diffs.length === 0) {
            return diffs;
        }
        let counter = 0;
        let shouldRepeat;
        do {
            shouldRepeat = false;
            const result = [
                diffs[0]
            ];
            for (let i = 1; i < diffs.length; i++) {
                const cur = diffs[i];
                const lastResult = result[result.length - 1];
                function shouldJoinDiffs(before, after) {
                    const unchangedRange = new offsetRange_1.OffsetRange(lastResult.seq1Range.endExclusive, cur.seq1Range.start);
                    const unchangedLineCount = sequence1.countLinesIn(unchangedRange);
                    if (unchangedLineCount > 5 || unchangedRange.length > 500) {
                        return false;
                    }
                    const unchangedText = sequence1.getText(unchangedRange).trim();
                    if (unchangedText.length > 20 || unchangedText.split(/\r\n|\r|\n/).length > 1) {
                        return false;
                    }
                    const beforeLineCount1 = sequence1.countLinesIn(before.seq1Range);
                    const beforeSeq1Length = before.seq1Range.length;
                    const beforeLineCount2 = sequence2.countLinesIn(before.seq2Range);
                    const beforeSeq2Length = before.seq2Range.length;
                    const afterLineCount1 = sequence1.countLinesIn(after.seq1Range);
                    const afterSeq1Length = after.seq1Range.length;
                    const afterLineCount2 = sequence2.countLinesIn(after.seq2Range);
                    const afterSeq2Length = after.seq2Range.length;
                    // TODO: Maybe a neural net can be used to derive the result from these numbers
                    const max = 2 * 40 + 50;
                    function cap(v) {
                        return Math.min(v, max);
                    }
                    if (Math.pow(Math.pow(cap(beforeLineCount1 * 40 + beforeSeq1Length), 1.5) + Math.pow(cap(beforeLineCount2 * 40 + beforeSeq2Length), 1.5), 1.5)
                        + Math.pow(Math.pow(cap(afterLineCount1 * 40 + afterSeq1Length), 1.5) + Math.pow(cap(afterLineCount2 * 40 + afterSeq2Length), 1.5), 1.5) > ((max ** 1.5) ** 1.5) * 1.3) {
                        return true;
                    }
                    return false;
                }
                const shouldJoin = shouldJoinDiffs(lastResult, cur);
                if (shouldJoin) {
                    shouldRepeat = true;
                    result[result.length - 1] = result[result.length - 1].join(cur);
                }
                else {
                    result.push(cur);
                }
            }
            diffs = result;
        } while (counter++ < 10 && shouldRepeat);
        const newDiffs = [];
        // Remove short suffixes/prefixes
        (0, arrays_1.forEachWithNeighbors)(diffs, (prev, cur, next) => {
            let newDiff = cur;
            function shouldMarkAsChanged(text) {
                return text.length > 0 && text.trim().length <= 3 && cur.seq1Range.length + cur.seq2Range.length > 100;
            }
            const fullRange1 = sequence1.extendToFullLines(cur.seq1Range);
            const prefix = sequence1.getText(new offsetRange_1.OffsetRange(fullRange1.start, cur.seq1Range.start));
            if (shouldMarkAsChanged(prefix)) {
                newDiff = newDiff.deltaStart(-prefix.length);
            }
            const suffix = sequence1.getText(new offsetRange_1.OffsetRange(cur.seq1Range.endExclusive, fullRange1.endExclusive));
            if (shouldMarkAsChanged(suffix)) {
                newDiff = newDiff.deltaEnd(suffix.length);
            }
            const availableSpace = diffAlgorithm_1.SequenceDiff.fromOffsetPairs(prev ? prev.getEndExclusives() : diffAlgorithm_1.OffsetPair.zero, next ? next.getStarts() : diffAlgorithm_1.OffsetPair.max);
            const result = newDiff.intersect(availableSpace);
            if (newDiffs.length > 0 && result.getStarts().equals(newDiffs[newDiffs.length - 1].getEndExclusives())) {
                newDiffs[newDiffs.length - 1] = newDiffs[newDiffs.length - 1].join(result);
            }
            else {
                newDiffs.push(result);
            }
        });
        return newDiffs;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGV1cmlzdGljU2VxdWVuY2VPcHRpbWl6YXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2RpZmYvZGVmYXVsdExpbmVzRGlmZkNvbXB1dGVyL2hldXJpc3RpY1NlcXVlbmNlT3B0aW1pemF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxzREFRQztJQXVMRCxnREFpQkM7SUFFRCxvRkF1RUM7SUEwQkQsNEZBNkNDO0lBRUQsa0dBcUdDO0lBdmNELFNBQWdCLHFCQUFxQixDQUFDLFNBQW9CLEVBQUUsU0FBb0IsRUFBRSxhQUE2QjtRQUM5RyxJQUFJLE1BQU0sR0FBRyxhQUFhLENBQUM7UUFDM0IsTUFBTSxHQUFHLDJCQUEyQixDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbkUsOERBQThEO1FBQzlELDJFQUEyRTtRQUMzRSxNQUFNLEdBQUcsMkJBQTJCLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNuRSxNQUFNLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMxRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFFRDs7Ozs7Ozs7Ozs7T0FXRztJQUNILFNBQVMsMkJBQTJCLENBQUMsU0FBb0IsRUFBRSxTQUFvQixFQUFFLGFBQTZCO1FBQzdHLElBQUksYUFBYSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNoQyxPQUFPLGFBQWEsQ0FBQztRQUN0QixDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQW1CLEVBQUUsQ0FBQztRQUNsQyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTlCLGdGQUFn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