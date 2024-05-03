/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/offsetRange", "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm"], function (require, exports, offsetRange_1, diffAlgorithm_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MyersDiffAlgorithm = void 0;
    /**
     * An O(ND) diff algorithm that has a quadratic space worst-case complexity.
    */
    class MyersDiffAlgorithm {
        compute(seq1, seq2, timeout = diffAlgorithm_1.InfiniteTimeout.instance) {
            // These are common special cases.
            // The early return improves performance dramatically.
            if (seq1.length === 0 || seq2.length === 0) {
                return diffAlgorithm_1.DiffAlgorithmResult.trivial(seq1, seq2);
            }
            const seqX = seq1; // Text on the x axis
            const seqY = seq2; // Text on the y axis
            function getXAfterSnake(x, y) {
                while (x < seqX.length && y < seqY.length && seqX.getElement(x) === seqY.getElement(y)) {
                    x++;
                    y++;
                }
                return x;
            }
            let d = 0;
            // V[k]: X value of longest d-line that ends in diagonal k.
            // d-line: path from (0,0) to (x,y) that uses exactly d non-diagonals.
            // diagonal k: Set of points (x,y) with x-y = k.
            // k=1 -> (1,0),(2,1)
            const V = new FastInt32Array();
            V.set(0, getXAfterSnake(0, 0));
            const paths = new FastArrayNegativeIndices();
            paths.set(0, V.get(0) === 0 ? null : new SnakePath(null, 0, 0, V.get(0)));
            let k = 0;
            loop: while (true) {
                d++;
                if (!timeout.isValid()) {
                    return diffAlgorithm_1.DiffAlgorithmResult.trivialTimedOut(seqX, seqY);
                }
                // The paper has `for (k = -d; k <= d; k += 2)`, but we can ignore diagonals that cannot influence the result.
                const lowerBound = -Math.min(d, seqY.length + (d % 2));
                const upperBound = Math.min(d, seqX.length + (d % 2));
                for (k = lowerBound; k <= upperBound; k += 2) {
                    let step = 0;
                    // We can use the X values of (d-1)-lines to compute X value of the longest d-lines.
                    const maxXofDLineTop = k === upperBound ? -1 : V.get(k + 1); // We take a vertical non-diagonal (add a symbol in seqX)
                    const maxXofDLineLeft = k === lowerBound ? -1 : V.get(k - 1) + 1; // We take a horizontal non-diagonal (+1 x) (delete a symbol in seqX)
                    step++;
                    const x = Math.min(Math.max(maxXofDLineTop, maxXofDLineLeft), seqX.length);
                    const y = x - k;
                    step++;
                    if (x > seqX.length || y > seqY.length) {
                        // This diagonal is irrelevant for the result.
                        // TODO: Don't pay the cost for this in the next iteration.
                        continue;
                    }
                    const newMaxX = getXAfterSnake(x, y);
                    V.set(k, newMaxX);
                    const lastPath = x === maxXofDLineTop ? paths.get(k + 1) : paths.get(k - 1);
                    paths.set(k, newMaxX !== x ? new SnakePath(lastPath, x, y, newMaxX - x) : lastPath);
                    if (V.get(k) === seqX.length && V.get(k) - k === seqY.length) {
                        break loop;
                    }
                }
            }
            let path = paths.get(k);
            const result = [];
            let lastAligningPosS1 = seqX.length;
            let lastAligningPosS2 = seqY.length;
            while (true) {
                const endX = path ? path.x + path.length : 0;
                const endY = path ? path.y + path.length : 0;
                if (endX !== lastAligningPosS1 || endY !== lastAligningPosS2) {
                    result.push(new diffAlgorithm_1.SequenceDiff(new offsetRange_1.OffsetRange(endX, lastAligningPosS1), new offsetRange_1.OffsetRange(endY, lastAligningPosS2)));
                }
                if (!path) {
                    break;
                }
                lastAligningPosS1 = path.x;
                lastAligningPosS2 = path.y;
                path = path.prev;
            }
            result.reverse();
            return new diffAlgorithm_1.DiffAlgorithmResult(result, false);
        }
    }
    exports.MyersDiffAlgorithm = MyersDiffAlgorithm;
    class SnakePath {
        constructor(prev, x, y, length) {
            this.prev = prev;
            this.x = x;
            this.y = y;
            this.length = length;
        }
    }
    /**
     * An array that supports fast negative indices.
    */
    class FastInt32Array {
        constructor() {
            this.positiveArr = new Int32Array(10);
            this.negativeArr = new Int32Array(10);
        }
        get(idx) {
            if (idx < 0) {
                idx = -idx - 1;
                return this.negativeArr[idx];
            }
            else {
                return this.positiveArr[idx];
            }
        }
        set(idx, value) {
            if (idx < 0) {
                idx = -idx - 1;
                if (idx >= this.negativeArr.length) {
                    const arr = this.negativeArr;
                    this.negativeArr = new Int32Array(arr.length * 2);
                    this.negativeArr.set(arr);
                }
                this.negativeArr[idx] = value;
            }
            else {
                if (idx >= this.positiveArr.length) {
                    const arr = this.positiveArr;
                    this.positiveArr = new Int32Array(arr.length * 2);
                    this.positiveArr.set(arr);
                }
                this.positiveArr[idx] = value;
            }
        }
    }
    /**
     * An array that supports fast negative indices.
    */
    class FastArrayNegativeIndices {
        constructor() {
            this.positiveArr = [];
            this.negativeArr = [];
        }
        get(idx) {
            if (idx < 0) {
                idx = -idx - 1;
                return this.negativeArr[idx];
            }
            else {
                return this.positiveArr[idx];
            }
        }
        set(idx, value) {
            if (idx < 0) {
                idx = -idx - 1;
                this.negativeArr[idx] = value;
            }
            else {
                this.positiveArr[idx] = value;
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXllcnNEaWZmQWxnb3JpdGhtLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2RpZmYvZGVmYXVsdExpbmVzRGlmZkNvbXB1dGVyL2FsZ29yaXRobXMvbXllcnNEaWZmQWxnb3JpdGhtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRzs7TUFFRTtJQUNGLE1BQWEsa0JBQWtCO1FBQzlCLE9BQU8sQ0FBQyxJQUFlLEVBQUUsSUFBZSxFQUFFLFVBQW9CLCtCQUFlLENBQUMsUUFBUTtZQUNyRixrQ0FBa0M7WUFDbEMsc0RBQXNEO1lBQ3RELElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDNUMsT0FBTyxtQ0FBbUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hELENBQUM7WUFFRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxxQkFBcUI7WUFDeEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMscUJBQXFCO1lBRXhDLFNBQVMsY0FBYyxDQUFDLENBQVMsRUFBRSxDQUFTO2dCQUMzQyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUN4RixDQUFDLEVBQUUsQ0FBQztvQkFDSixDQUFDLEVBQUUsQ0FBQztnQkFDTCxDQUFDO2dCQUNELE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztZQUVELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNWLDJE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