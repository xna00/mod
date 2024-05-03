/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/assert", "vs/base/common/types", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/textLength", "vs/workbench/contrib/mergeEditor/browser/model/mapping", "vs/workbench/contrib/mergeEditor/browser/model/rangeUtils"], function (require, exports, arrays_1, assert_1, types_1, position_1, range_1, textLength_1, mapping_1, rangeUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getAlignments = getAlignments;
    function getAlignments(m) {
        const equalRanges1 = toEqualRangeMappings(m.input1Diffs.flatMap(d => d.rangeMappings), m.baseRange.toRange(), m.input1Range.toRange());
        const equalRanges2 = toEqualRangeMappings(m.input2Diffs.flatMap(d => d.rangeMappings), m.baseRange.toRange(), m.input2Range.toRange());
        const commonRanges = splitUpCommonEqualRangeMappings(equalRanges1, equalRanges2);
        let result = [];
        result.push([m.input1Range.startLineNumber - 1, m.baseRange.startLineNumber - 1, m.input2Range.startLineNumber - 1]);
        function isFullSync(lineAlignment) {
            return lineAlignment.every((i) => i !== undefined);
        }
        // One base line has either up to one full sync or up to two half syncs.
        for (const m of commonRanges) {
            const lineAlignment = [m.output1Pos?.lineNumber, m.inputPos.lineNumber, m.output2Pos?.lineNumber];
            const alignmentIsFullSync = isFullSync(lineAlignment);
            let shouldAdd = true;
            if (alignmentIsFullSync) {
                const isNewFullSyncAlignment = !result.some(r => isFullSync(r) && r.some((v, idx) => v !== undefined && v === lineAlignment[idx]));
                if (isNewFullSyncAlignment) {
                    // Remove half syncs
                    result = result.filter(r => !r.some((v, idx) => v !== undefined && v === lineAlignment[idx]));
                }
                shouldAdd = isNewFullSyncAlignment;
            }
            else {
                const isNew = !result.some(r => r.some((v, idx) => v !== undefined && v === lineAlignment[idx]));
                shouldAdd = isNew;
            }
            if (shouldAdd) {
                result.push(lineAlignment);
            }
            else {
                if (m.length.isGreaterThan(new textLength_1.TextLength(1, 0))) {
                    result.push([
                        m.output1Pos ? m.output1Pos.lineNumber + 1 : undefined,
                        m.inputPos.lineNumber + 1,
                        m.output2Pos ? m.output2Pos.lineNumber + 1 : undefined
                    ]);
                }
            }
        }
        const finalLineAlignment = [m.input1Range.endLineNumberExclusive, m.baseRange.endLineNumberExclusive, m.input2Range.endLineNumberExclusive];
        result = result.filter(r => r.every((v, idx) => v !== finalLineAlignment[idx]));
        result.push(finalLineAlignment);
        (0, assert_1.assertFn)(() => (0, assert_1.checkAdjacentItems)(result.map(r => r[0]).filter(types_1.isDefined), (a, b) => a < b)
            && (0, assert_1.checkAdjacentItems)(result.map(r => r[1]).filter(types_1.isDefined), (a, b) => a <= b)
            && (0, assert_1.checkAdjacentItems)(result.map(r => r[2]).filter(types_1.isDefined), (a, b) => a < b)
            && result.every(alignment => alignment.filter(types_1.isDefined).length >= 2));
        return result;
    }
    function toEqualRangeMappings(diffs, inputRange, outputRange) {
        const result = [];
        let equalRangeInputStart = inputRange.getStartPosition();
        let equalRangeOutputStart = outputRange.getStartPosition();
        for (const d of diffs) {
            const equalRangeMapping = new mapping_1.RangeMapping(range_1.Range.fromPositions(equalRangeInputStart, d.inputRange.getStartPosition()), range_1.Range.fromPositions(equalRangeOutputStart, d.outputRange.getStartPosition()));
            (0, assert_1.assertFn)(() => (0, rangeUtils_1.lengthOfRange)(equalRangeMapping.inputRange).equals((0, rangeUtils_1.lengthOfRange)(equalRangeMapping.outputRange)));
            if (!equalRangeMapping.inputRange.isEmpty()) {
                result.push(equalRangeMapping);
            }
            equalRangeInputStart = d.inputRange.getEndPosition();
            equalRangeOutputStart = d.outputRange.getEndPosition();
        }
        const equalRangeMapping = new mapping_1.RangeMapping(range_1.Range.fromPositions(equalRangeInputStart, inputRange.getEndPosition()), range_1.Range.fromPositions(equalRangeOutputStart, outputRange.getEndPosition()));
        (0, assert_1.assertFn)(() => (0, rangeUtils_1.lengthOfRange)(equalRangeMapping.inputRange).equals((0, rangeUtils_1.lengthOfRange)(equalRangeMapping.outputRange)));
        if (!equalRangeMapping.inputRange.isEmpty()) {
            result.push(equalRangeMapping);
        }
        return result;
    }
    /**
     * It is `result[i][0].inputRange.equals(result[i][1].inputRange)`.
    */
    function splitUpCommonEqualRangeMappings(equalRangeMappings1, equalRangeMappings2) {
        const result = [];
        const events = [];
        for (const [input, rangeMappings] of [[0, equalRangeMappings1], [1, equalRangeMappings2]]) {
            for (const rangeMapping of rangeMappings) {
                events.push({
                    input: input,
                    start: true,
                    inputPos: rangeMapping.inputRange.getStartPosition(),
                    outputPos: rangeMapping.outputRange.getStartPosition()
                });
                events.push({
                    input: input,
                    start: false,
                    inputPos: rangeMapping.inputRange.getEndPosition(),
                    outputPos: rangeMapping.outputRange.getEndPosition()
                });
            }
        }
        events.sort((0, arrays_1.compareBy)((m) => m.inputPos, position_1.Position.compare));
        const starts = [undefined, undefined];
        let lastInputPos;
        for (const event of events) {
            if (lastInputPos && starts.some(s => !!s)) {
                const length = (0, rangeUtils_1.lengthBetweenPositions)(lastInputPos, event.inputPos);
                if (!length.isZero()) {
                    result.push({
                        inputPos: lastInputPos,
                        length,
                        output1Pos: starts[0],
                        output2Pos: starts[1]
                    });
                    if (starts[0]) {
                        starts[0] = (0, rangeUtils_1.addLength)(starts[0], length);
                    }
                    if (starts[1]) {
                        starts[1] = (0, rangeUtils_1.addLength)(starts[1], length);
                    }
                }
            }
            starts[event.input] = event.start ? event.outputPos : undefined;
            lastInputPos = event.inputPos;
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZUFsaWdubWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWVyZ2VFZGl0b3IvYnJvd3Nlci92aWV3L2xpbmVBbGlnbm1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFjaEcsc0NBdURDO0lBdkRELFNBQWdCLGFBQWEsQ0FBQyxDQUFvQjtRQUNqRCxNQUFNLFlBQVksR0FBRyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUN2SSxNQUFNLFlBQVksR0FBRyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUV2SSxNQUFNLFlBQVksR0FBRywrQkFBK0IsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFFakYsSUFBSSxNQUFNLEdBQW9CLEVBQUUsQ0FBQztRQUNqQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsZUFBZSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXJILFNBQVMsVUFB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