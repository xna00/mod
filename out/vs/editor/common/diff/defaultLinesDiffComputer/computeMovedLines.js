/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm", "../rangeMapping", "vs/base/common/arrays", "vs/base/common/arraysFind", "vs/base/common/map", "vs/editor/common/core/lineRange", "vs/editor/common/core/offsetRange", "vs/editor/common/diff/defaultLinesDiffComputer/linesSliceCharSequence", "vs/editor/common/diff/defaultLinesDiffComputer/utils", "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/myersDiffAlgorithm"], function (require, exports, diffAlgorithm_1, rangeMapping_1, arrays_1, arraysFind_1, map_1, lineRange_1, offsetRange_1, linesSliceCharSequence_1, utils_1, myersDiffAlgorithm_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.computeMovedLines = computeMovedLines;
    function computeMovedLines(changes, originalLines, modifiedLines, hashedOriginalLines, hashedModifiedLines, timeout) {
        let { moves, excludedChanges } = computeMovesFromSimpleDeletionsToSimpleInsertions(changes, originalLines, modifiedLines, timeout);
        if (!timeout.isValid()) {
            return [];
        }
        const filteredChanges = changes.filter(c => !excludedChanges.has(c));
        const unchangedMoves = computeUnchangedMoves(filteredChanges, hashedOriginalLines, hashedModifiedLines, originalLines, modifiedLines, timeout);
        (0, arrays_1.pushMany)(moves, unchangedMoves);
        moves = joinCloseConsecutiveMoves(moves);
        // Ignore too short moves
        moves = moves.filter(current => {
            const lines = current.original.toOffsetRange().slice(originalLines).map(l => l.trim());
            const originalText = lines.join('\n');
            return originalText.length >= 15 && countWhere(lines, l => l.length >= 2) >= 2;
        });
        moves = removeMovesInSameDiff(changes, moves);
        return moves;
    }
    function countWhere(arr, predicate) {
        let count = 0;
        for (const t of arr) {
            if (predicate(t)) {
                count++;
            }
        }
        return count;
    }
    function computeMovesFromSimpleDeletionsToSimpleInsertions(changes, originalLines, modifiedLines, timeout) {
        const moves = [];
        const deletions = changes
            .filter(c => c.modified.isEmpty && c.original.length >= 3)
            .map(d => new utils_1.LineRangeFragment(d.original, originalLines, d));
        const insertions = new Set(changes
            .filter(c => c.original.isEmpty && c.modified.length >= 3)
            .map(d => new utils_1.LineRangeFragment(d.modified, modifiedLines, d)));
        const excludedChanges = new Set();
        for (const deletion of deletions) {
            let highestSimilarity = -1;
            let best;
            for (const insertion of insertions) {
                const similarity = deletion.computeSimilarity(insertion);
                if (similarity > highestSimilarity) {
                    highestSimilarity = similarity;
                    best = insertion;
                }
            }
            if (highestSimilarity > 0.90 && best) {
                insertions.delete(best);
                moves.push(new rangeMapping_1.LineRangeMapping(deletion.range, best.range));
                excludedChanges.add(deletion.source);
                excludedChanges.add(best.source);
            }
            if (!timeout.isValid()) {
                return { moves, excludedChanges };
            }
        }
        return { moves, excludedChanges };
    }
    function computeUnchangedMoves(changes, hashedOriginalLines, hashedModifiedLines, originalLines, modifiedLines, timeout) {
        const moves = [];
        const original3LineHashes = new map_1.SetMap();
        for (const change of changes) {
            for (let i = change.original.startLineNumber; i < change.original.endLineNumberExclusive - 2; i++) {
                const key = `${hashedOriginalLines[i - 1]}:${hashedOriginalLines[i + 1 - 1]}:${hashedOriginalLines[i + 2 - 1]}`;
                original3LineHashes.add(key, { range: new lineRange_1.LineRange(i, i + 3) });
            }
        }
        const possibleMappings = [];
        changes.sort((0, arrays_1.compareBy)(c => c.modified.startLineNumber, arrays_1.numberComparator));
        for (const change of changes) {
            let lastMappings = [];
            for (let i = change.modified.startLineNumber; i < change.modified.endLineNumberExclusive - 2; i++) {
                const key = `${hashedModifiedLines[i - 1]}:${hashedModifiedLines[i + 1 - 1]}:${hashedModifiedLines[i + 2 - 1]}`;
                const currentModifiedRange = new lineRange_1.LineRange(i, i + 3);
                const nextMappings = [];
                original3LineHashes.forEach(key, ({ range }) => {
                    for (const lastMapping of lastMappings) {
                        // does this match extend some last match?
                        if (lastMapping.originalLineRange.endLineNumberExclusive + 1 === range.endLineNumberExclusive &&
                            lastMapping.modifiedLineRange.endLineNumberExclusive + 1 === currentModifiedRange.endLineNumberExclusive) {
                            lastMapping.originalLineRange = new lineRange_1.LineRange(lastMapping.originalLineRange.startLineNumber, range.endLineNumberExclusive);
                            lastMapping.modifiedLineRange = new lineRange_1.LineRange(lastMapping.modifiedLineRange.startLineNumber, currentModifiedRange.endLineNumberExclusive);
                            nextMappings.push(lastMapping);
                            return;
                        }
                    }
                    const mapping = {
                        modifiedLineRange: currentModifiedRange,
                        originalLineRange: range,
                    };
                    possibleMappings.push(mapping);
                    nextMappings.push(mapping);
                });
                lastMappings = nextMappings;
            }
            if (!timeout.isValid()) {
                return [];
            }
        }
        possibleMappings.sort((0, arrays_1.reverseOrder)((0, arrays_1.compareBy)(m => m.modifiedLineRange.length, arrays_1.numberComparator)));
        const modifiedSet = new lineRange_1.LineRangeSet();
        const originalSet = new lineRange_1.LineRangeSet();
        for (const mapping of possibleMappings) {
            const diffOrigToMod = mapping.modifiedLineRange.startLineNumber - mapping.originalLineRange.startLineNumber;
            const modifiedSections = modifiedSet.subtractFrom(mapping.modifiedLineRange);
            const originalTranslatedSections = originalSet.subtractFrom(mapping.originalLineRange).getWithDelta(diffOrigToMod);
            const modifiedIntersectedSections = modifiedSections.getIntersection(originalTranslatedSections);
            for (const s of modifiedIntersectedSections.ranges) {
                if (s.length < 3) {
                    continue;
                }
                const modifiedLineRange = s;
                const originalLineRange = s.delta(-diffOrigToMod);
                moves.push(new rangeMapping_1.LineRangeMapping(originalLineRange, modifiedLineRange));
                modifiedSet.addRange(modifiedLineRange);
                originalSet.addRange(originalLineRange);
            }
        }
        moves.sort((0, arrays_1.compareBy)(m => m.original.startLineNumber, arrays_1.numberComparator));
        const monotonousChanges = new arraysFind_1.MonotonousArray(changes);
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            const firstTouchingChangeOrig = monotonousChanges.findLastMonotonous(c => c.original.startLineNumber <= move.original.startLineNumber);
            const firstTouchingChangeMod = (0, arraysFind_1.findLastMonotonous)(changes, c => c.modified.startLineNumber <= move.modified.startLineNumber);
            const linesAbove = Math.max(move.original.startLineNumber - firstTouchingChangeOrig.original.startLineNumber, move.modified.startLineNumber - firstTouchingChangeMod.modified.startLineNumber);
            const lastTouchingChangeOrig = monotonousChanges.findLastMonotonous(c => c.original.startLineNumber < move.original.endLineNumberExclusive);
            const lastTouchingChangeMod = (0, arraysFind_1.findLastMonotonous)(changes, c => c.modified.startLineNumber < move.modified.endLineNumberExclusive);
            const linesBelow = Math.max(lastTouchingChangeOrig.original.endLineNumberExclusive - move.original.endLineNumberExclusive, lastTouchingChangeMod.modified.endLineNumberExclusive - move.modified.endLineNumberExclusive);
            let extendToTop;
            for (extendToTop = 0; extendToTop < linesAbove; extendToTop++) {
                const origLine = move.original.startLineNumber - extendToTop - 1;
                const modLine = move.modified.startLineNumber - extendToTop - 1;
                if (origLine > originalLines.length || modLine > modifiedLines.length) {
                    break;
                }
                if (modifiedSet.contains(modLine) || originalSet.contains(origLine)) {
                    break;
                }
                if (!areLinesSimilar(originalLines[origLine - 1], modifiedLines[modLine - 1], timeout)) {
                    break;
                }
            }
            if (extendToTop > 0) {
                originalSet.addRange(new lineRange_1.LineRange(move.original.startLineNumber - extendToTop, move.original.startLineNumber));
                modifiedSet.addRange(new lineRange_1.LineRange(move.modified.startLineNumber - extendToTop, move.modified.startLineNumber));
            }
            let extendToBottom;
            for (extendToBottom = 0; extendToBottom < linesBelow; extendToBottom++) {
                const origLine = move.original.endLineNumberExclusive + extendToBottom;
                const modLine = move.modified.endLineNumberExclusive + extendToBottom;
                if (origLine > originalLines.length || modLine > modifiedLines.length) {
                    break;
                }
                if (modifiedSet.contains(modLine) || originalSet.contains(origLine)) {
                    break;
                }
                if (!areLinesSimilar(originalLines[origLine - 1], modifiedLines[modLine - 1], timeout)) {
                    break;
                }
            }
            if (extendToBottom > 0) {
                originalSet.addRange(new lineRange_1.LineRange(move.original.endLineNumberExclusive, move.original.endLineNumberExclusive + extendToBottom));
                modifiedSet.addRange(new lineRange_1.LineRange(move.modified.endLineNumberExclusive, move.modified.endLineNumberExclusive + extendToBottom));
            }
            if (extendToTop > 0 || extendToBottom > 0) {
                moves[i] = new rangeMapping_1.LineRangeMapping(new lineRange_1.LineRange(move.original.startLineNumber - extendToTop, move.original.endLineNumberExclusive + extendToBottom), new lineRange_1.LineRange(move.modified.startLineNumber - extendToTop, move.modified.endLineNumberExclusive + extendToBottom));
            }
        }
        return moves;
    }
    function areLinesSimilar(line1, line2, timeout) {
        if (line1.trim() === line2.trim()) {
            return true;
        }
        if (line1.length > 300 && line2.length > 300) {
            return false;
        }
        const myersDiffingAlgorithm = new myersDiffAlgorithm_1.MyersDiffAlgorithm();
        const result = myersDiffingAlgorithm.compute(new linesSliceCharSequence_1.LinesSliceCharSequence([line1], new offsetRange_1.OffsetRange(0, 1), false), new linesSliceCharSequence_1.LinesSliceCharSequence([line2], new offsetRange_1.OffsetRange(0, 1), false), timeout);
        let commonNonSpaceCharCount = 0;
        const inverted = diffAlgorithm_1.SequenceDiff.invert(result.diffs, line1.length);
        for (const seq of inverted) {
            seq.seq1Range.forEach(idx => {
                if (!(0, utils_1.isSpace)(line1.charCodeAt(idx))) {
                    commonNonSpaceCharCount++;
                }
            });
        }
        function countNonWsChars(str) {
            let count = 0;
            for (let i = 0; i < line1.length; i++) {
                if (!(0, utils_1.isSpace)(str.charCodeAt(i))) {
                    count++;
                }
            }
            return count;
        }
        const longerLineLength = countNonWsChars(line1.length > line2.length ? line1 : line2);
        const r = commonNonSpaceCharCount / longerLineLength > 0.6 && longerLineLength > 10;
        return r;
    }
    function joinCloseConsecutiveMoves(moves) {
        if (moves.length === 0) {
            return moves;
        }
        moves.sort((0, arrays_1.compareBy)(m => m.original.startLineNumber, arrays_1.numberComparator));
        const result = [moves[0]];
        for (let i = 1; i < moves.length; i++) {
            const last = result[result.length - 1];
            const current = moves[i];
            const originalDist = current.original.startLineNumber - last.original.endLineNumberExclusive;
            const modifiedDist = current.modified.startLineNumber - last.modified.endLineNumberExclusive;
            const currentMoveAfterLast = originalDist >= 0 && modifiedDist >= 0;
            if (currentMoveAfterLast && originalDist + modifiedDist <= 2) {
                result[result.length - 1] = last.join(current);
                continue;
            }
            result.push(current);
        }
        return result;
    }
    function removeMovesInSameDiff(changes, moves) {
        const changesMonotonous = new arraysFind_1.MonotonousArray(changes);
        moves = moves.filter(m => {
            const diffBeforeEndOfMoveOriginal = changesMonotonous.findLastMonotonous(c => c.original.startLineNumber < m.original.endLineNumberExclusive)
                || new rangeMapping_1.LineRangeMapping(new lineRange_1.LineRange(1, 1), new lineRange_1.LineRange(1, 1));
            const diffBeforeEndOfMoveModified = (0, arraysFind_1.findLastMonotonous)(changes, c => c.modified.startLineNumber < m.modified.endLineNumberExclusive);
            const differentDiffs = diffBeforeEndOfMoveOriginal !== diffBeforeEndOfMoveModified;
            return differentDiffs;
        });
        return moves;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZU1vdmVkTGluZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vZGlmZi9kZWZhdWx0TGluZXNEaWZmQ29tcHV0ZXIvY29tcHV0ZU1vdmVkTGluZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsOENBMEJDO0lBMUJELFNBQWdCLGlCQUFpQixDQUNoQyxPQUFtQyxFQUNuQyxhQUF1QixFQUN2QixhQUF1QixFQUN2QixtQkFBNkIsRUFDN0IsbUJBQTZCLEVBQzdCLE9BQWlCO1FBRWpCLElBQUksRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLEdBQUcsaURBQWlELENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFbkksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO1lBQUMsT0FBTyxFQUFFLENBQUM7UUFBQyxDQUFDO1FBRXRDLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRSxNQUFNLGNBQWMsR0FBRyxxQkFBcUIsQ0FBQyxlQUFlLEVBQUUsbUJBQW1CLEVBQUUsbUJBQW1CLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMvSSxJQUFBLGlCQUFRLEVBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBRWhDLEtBQUssR0FBRyx5QkFBeUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6Qyx5QkFBeUI7UUFDekIsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDOUIsTUFBTSxLQUFLLEdBQUcs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