/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/offsetRange", "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm", "vs/editor/common/diff/defaultLinesDiffComputer/utils"], function (require, exports, offsetRange_1, diffAlgorithm_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicProgrammingDiffing = void 0;
    /**
     * A O(MN) diffing algorithm that supports a score function.
     * The algorithm can be improved by processing the 2d array diagonally.
    */
    class DynamicProgrammingDiffing {
        compute(sequence1, sequence2, timeout = diffAlgorithm_1.InfiniteTimeout.instance, equalityScore) {
            if (sequence1.length === 0 || sequence2.length === 0) {
                return diffAlgorithm_1.DiffAlgorithmResult.trivial(sequence1, sequence2);
            }
            /**
             * lcsLengths.get(i, j): Length of the longest common subsequence of sequence1.substring(0, i + 1) and sequence2.substring(0, j + 1).
             */
            const lcsLengths = new utils_1.Array2D(sequence1.length, sequence2.length);
            const directions = new utils_1.Array2D(sequence1.length, sequence2.length);
            const lengths = new utils_1.Array2D(sequence1.length, sequence2.length);
            // ==== Initializing lcsLengths ====
            for (let s1 = 0; s1 < sequence1.length; s1++) {
                for (let s2 = 0; s2 < sequence2.length; s2++) {
                    if (!timeout.isValid()) {
                        return diffAlgorithm_1.DiffAlgorithmResult.trivialTimedOut(sequence1, sequence2);
                    }
                    const horizontalLen = s1 === 0 ? 0 : lcsLengths.get(s1 - 1, s2);
                    const verticalLen = s2 === 0 ? 0 : lcsLengths.get(s1, s2 - 1);
                    let extendedSeqScore;
                    if (sequence1.getElement(s1) === sequence2.getElement(s2)) {
                        if (s1 === 0 || s2 === 0) {
                            extendedSeqScore = 0;
                        }
                        else {
                            extendedSeqScore = lcsLengths.get(s1 - 1, s2 - 1);
                        }
                        if (s1 > 0 && s2 > 0 && directions.get(s1 - 1, s2 - 1) === 3) {
                            // Prefer consecutive diagonals
                            extendedSeqScore += lengths.get(s1 - 1, s2 - 1);
                        }
                        extendedSeqScore += (equalityScore ? equalityScore(s1, s2) : 1);
                    }
                    else {
                        extendedSeqScore = -1;
                    }
                    const newValue = Math.max(horizontalLen, verticalLen, extendedSeqScore);
                    if (newValue === extendedSeqScore) {
                        // Prefer diagonals
                        const prevLen = s1 > 0 && s2 > 0 ? lengths.get(s1 - 1, s2 - 1) : 0;
                        lengths.set(s1, s2, prevLen + 1);
                        directions.set(s1, s2, 3);
                    }
                    else if (newValue === horizontalLen) {
                        lengths.set(s1, s2, 0);
                        directions.set(s1, s2, 1);
                    }
                    else if (newValue === verticalLen) {
                        lengths.set(s1, s2, 0);
                        directions.set(s1, s2, 2);
                    }
                    lcsLengths.set(s1, s2, newValue);
                }
            }
            // ==== Backtracking ====
            const result = [];
            let lastAligningPosS1 = sequence1.length;
            let lastAligningPosS2 = sequence2.length;
            function reportDecreasingAligningPositions(s1, s2) {
                if (s1 + 1 !== lastAligningPosS1 || s2 + 1 !== lastAligningPosS2) {
                    result.push(new diffAlgorithm_1.SequenceDiff(new offsetRange_1.OffsetRange(s1 + 1, lastAligningPosS1), new offsetRange_1.OffsetRange(s2 + 1, lastAligningPosS2)));
                }
                lastAligningPosS1 = s1;
                lastAligningPosS2 = s2;
            }
            let s1 = sequence1.length - 1;
            let s2 = sequence2.length - 1;
            while (s1 >= 0 && s2 >= 0) {
                if (directions.get(s1, s2) === 3) {
                    reportDecreasingAligningPositions(s1, s2);
                    s1--;
                    s2--;
                }
                else {
                    if (directions.get(s1, s2) === 1) {
                        s1--;
                    }
                    else {
                        s2--;
                    }
                }
            }
            reportDecreasingAligningPositions(-1, -1);
            result.reverse();
            return new diffAlgorithm_1.DiffAlgorithmResult(result, false);
        }
    }
    exports.DynamicProgrammingDiffing = DynamicProgrammingDiffing;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1pY1Byb2dyYW1taW5nRGlmZmluZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9kaWZmL2RlZmF1bHRMaW5lc0RpZmZDb21wdXRlci9hbGdvcml0aG1zL2R5bmFtaWNQcm9ncmFtbWluZ0RpZmZpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHOzs7TUFHRTtJQUNGLE1BQWEseUJBQXlCO1FBQ3JDLE9BQU8sQ0FBQyxTQUFvQixFQUFFLFNBQW9CLEVBQUUsVUFBb0IsK0JBQWUsQ0FBQyxRQUFRLEVBQUUsYUFBNEQ7WUFDN0osSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN0RCxPQUFPLG1DQUFtQixDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsQ0FBQztZQUVEOztlQUVHO1lBQ0gsTUFBTSxVQUFVLEdBQUcsSUFBSSxlQUFPLENBQVMsU0FBUyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0UsTUFBTSxVQUFVLEdBQUcsSUFBSSxlQUFPLENBQVMsU0FBUyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0UsTUFBTSxPQUFPLEdBQUcsSUFBSSxlQUFPLENBQVMsU0FBUyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFeEUsb0NBQW9DO1lBQ3BDLEtBQUssSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQzlDLEtBQUssSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFF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