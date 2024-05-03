/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/diff/diffChange", "vs/base/common/hash"], function (require, exports, diffChange_1, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LcsDiff = exports.StringDiffSequence = void 0;
    exports.stringDiff = stringDiff;
    class StringDiffSequence {
        constructor(source) {
            this.source = source;
        }
        getElements() {
            const source = this.source;
            const characters = new Int32Array(source.length);
            for (let i = 0, len = source.length; i < len; i++) {
                characters[i] = source.charCodeAt(i);
            }
            return characters;
        }
    }
    exports.StringDiffSequence = StringDiffSequence;
    function stringDiff(original, modified, pretty) {
        return new LcsDiff(new StringDiffSequence(original), new StringDiffSequence(modified)).ComputeDiff(pretty).changes;
    }
    //
    // The code below has been ported from a C# implementation in VS
    //
    class Debug {
        static Assert(condition, message) {
            if (!condition) {
                throw new Error(message);
            }
        }
    }
    class MyArray {
        /**
         * Copies a range of elements from an Array starting at the specified source index and pastes
         * them to another Array starting at the specified destination index. The length and the indexes
         * are specified as 64-bit integers.
         * sourceArray:
         *		The Array that contains the data to copy.
         * sourceIndex:
         *		A 64-bit integer that represents the index in the sourceArray at which copying begins.
         * destinationArray:
         *		The Array that receives the data.
         * destinationIndex:
         *		A 64-bit integer that represents the index in the destinationArray at which storing begins.
         * length:
         *		A 64-bit integer that represents the number of elements to copy.
         */
        static Copy(sourceArray, sourceIndex, destinationArray, destinationIndex, length) {
            for (let i = 0; i < length; i++) {
                destinationArray[destinationIndex + i] = sourceArray[sourceIndex + i];
            }
        }
        static Copy2(sourceArray, sourceIndex, destinationArray, destinationIndex, length) {
            for (let i = 0; i < length; i++) {
                destinationArray[destinationIndex + i] = sourceArray[sourceIndex + i];
            }
        }
    }
    //*****************************************************************************
    // LcsDiff.cs
    //
    // An implementation of the difference algorithm described in
    // "An O(ND) Difference Algorithm and its variations" by Eugene W. Myers
    //
    // Copyright (C) 2008 Microsoft Corporation @minifier_do_not_preserve
    //*****************************************************************************
    // Our total memory usage for storing history is (worst-case):
    // 2 * [(MaxDifferencesHistory + 1) * (MaxDifferencesHistory + 1) - 1] * sizeof(int)
    // 2 * [1448*1448 - 1] * 4 = 16773624 = 16MB
    var LocalConstants;
    (function (LocalConstants) {
        LocalConstants[LocalConstants["MaxDifferencesHistory"] = 1447] = "MaxDifferencesHistory";
    })(LocalConstants || (LocalConstants = {}));
    /**
     * A utility class which helps to create the set of DiffChanges from
     * a difference operation. This class accepts original DiffElements and
     * modified DiffElements that are involved in a particular change. The
     * MarkNextChange() method can be called to mark the separation between
     * distinct changes. At the end, the Changes property can be called to retrieve
     * the constructed changes.
     */
    class DiffChangeHelper {
        /**
         * Constructs a new DiffChangeHelper for the given DiffSequences.
         */
        constructor() {
            this.m_changes = [];
            this.m_originalStart = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
            this.m_modifiedStart = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
            this.m_originalCount = 0;
            this.m_modifiedCount = 0;
        }
        /**
         * Marks the beginning of the next change in the set of differences.
         */
        MarkNextChange() {
            // Only add to the list if there is something to add
            if (this.m_originalCount > 0 || this.m_modifiedCount > 0) {
                // Add the new change to our list
                this.m_changes.push(new diffChange_1.DiffChange(this.m_originalStart, this.m_originalCount, this.m_modifiedStart, this.m_modifiedCount));
            }
            // Reset for the next change
            this.m_originalCount = 0;
            this.m_modifiedCount = 0;
            this.m_originalStart = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
            this.m_modifiedStart = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
        }
        /**
         * Adds the original element at the given position to the elements
         * affected by the current change. The modified index gives context
         * to the change position with respect to the original sequence.
         * @param originalIndex The index of the original element to add.
         * @param modifiedIndex The index of the modified element that provides corresponding position in the modified sequence.
         */
        AddOriginalElement(originalIndex, modifiedIndex) {
            // The 'true' start index is the smallest of the ones we've seen
            this.m_originalStart = Math.min(this.m_originalStart, originalIndex);
            this.m_modifiedStart = Math.min(this.m_modifiedStart, modifiedIndex);
            this.m_originalCount++;
        }
        /**
         * Adds the modified element at the given position to the elements
         * affected by the current change. The original index gives context
         * to the change position with respect to the modified sequence.
         * @param originalIndex The index of the original element that provides corresponding position in the original sequence.
         * @param modifiedIndex The index of the modified element to add.
         */
        AddModifiedElement(originalIndex, modifiedIndex) {
            // The 'true' start index is the smallest of the ones we've seen
            this.m_originalStart = Math.min(this.m_originalStart, originalIndex);
            this.m_modifiedStart = Math.min(this.m_modifiedStart, modifiedIndex);
            this.m_modifiedCount++;
        }
        /**
         * Retrieves all of the changes marked by the class.
         */
        getChanges() {
            if (this.m_originalCount > 0 || this.m_modifiedCount > 0) {
                // Finish up on whatever is left
                this.MarkNextChange();
            }
            return this.m_changes;
        }
        /**
         * Retrieves all of the changes marked by the class in the reverse order
         */
        getReverseChanges() {
            if (this.m_originalCount > 0 || this.m_modifiedCount > 0) {
                // Finish up on whatever is left
                this.MarkNextChange();
            }
            this.m_changes.reverse();
            return this.m_changes;
        }
    }
    /**
     * An implementation of the difference algorithm described in
     * "An O(ND) Difference Algorithm and its variations" by Eugene W. Myers
     */
    class LcsDiff {
        /**
         * Constructs the DiffFinder
         */
        constructor(originalSequence, modifiedSequence, continueProcessingPredicate = null) {
            this.ContinueProcessingPredicate = continueProcessingPredicate;
            this._originalSequence = originalSequence;
            this._modifiedSequence = modifiedSequence;
            const [originalStringElements, originalElementsOrHash, originalHasStrings] = LcsDiff._getElements(originalSequence);
            const [modifiedStringElements, modifiedElementsOrHash, modifiedHasStrings] = LcsDiff._getElements(modifiedSequence);
            this._hasStrings = (originalHasStrings && modifiedHasStrings);
            this._originalStringElements = originalStringElements;
            this._originalElementsOrHash = originalElementsOrHash;
            this._modifiedStringElements = modifiedStringElements;
            this._modifiedElementsOrHash = modifiedElementsOrHash;
            this.m_forwardHistory = [];
            this.m_reverseHistory = [];
        }
        static _isStringArray(arr) {
            return (arr.length > 0 && typeof arr[0] === 'string');
        }
        static _getElements(sequence) {
            const elements = sequence.getElements();
            if (LcsDiff._isStringArray(elements)) {
                const hashes = new Int32Array(elements.length);
                for (let i = 0, len = elements.length; i < len; i++) {
                    hashes[i] = (0, hash_1.stringHash)(elements[i], 0);
                }
                return [elements, hashes, true];
            }
            if (elements instanceof Int32Array) {
                return [[], elements, false];
            }
            return [[], new Int32Array(elements), false];
        }
        ElementsAreEqual(originalIndex, newIndex) {
            if (this._originalElementsOrHash[originalIndex] !== this._modifiedElementsOrHash[newIndex]) {
                return false;
            }
            return (this._hasStrings ? this._originalStringElements[originalIndex] === this._modifiedStringElements[newIndex] : true);
        }
        ElementsAreStrictEqual(originalIndex, newIndex) {
            if (!this.ElementsAreEqual(originalIndex, newIndex)) {
                return false;
            }
            const originalElement = LcsDiff._getStrictElement(this._originalSequence, originalIndex);
            const modifiedElement = LcsDiff._getStrictElement(this._modifiedSequence, newIndex);
            return (originalElement === modifiedElement);
        }
        static _getStrictElement(sequence, index) {
            if (typeof sequence.getStrictElement === 'function') {
                return sequence.getStrictElement(index);
            }
            return null;
        }
        OriginalElementsAreEqual(index1, index2) {
            if (this._originalElementsOrHash[index1] !== this._originalElementsOrHash[index2]) {
                return false;
            }
            return (this._hasStrings ? this._originalStringElements[index1] === this._originalStringElements[index2] : true);
        }
        ModifiedElementsAreEqual(index1, index2) {
            if (this._modifiedElementsOrHash[index1] !== this._modifiedElementsOrHash[index2]) {
                return false;
            }
            return (this._hasStrings ? this._modifiedStringElements[index1] === this._modifiedStringElements[index2] : true);
        }
        ComputeDiff(pretty) {
            return this._ComputeDiff(0, this._originalElementsOrHash.length - 1, 0, this._modifiedElementsOrHash.length - 1, pretty);
        }
        /**
         * Computes the differences between the original and modified input
         * sequences on the bounded range.
         * @returns An array of the differences between the two input sequences.
         */
        _ComputeDiff(originalStart, originalEnd, modifiedStart, modifiedEnd, pretty) {
            const quitEarlyArr = [false];
            let changes = this.ComputeDiffRecursive(originalStart, originalEnd, modifiedStart, modifiedEnd, quitEarlyArr);
            if (pretty) {
                // We have to clean up the computed diff to be more intuitive
                // but it turns out this cannot be done correctly until the entire set
                // of diffs have been computed
                changes = this.PrettifyChanges(changes);
            }
            return {
                quitEarly: quitEarlyArr[0],
                changes: changes
            };
        }
        /**
         * Private helper method which computes the differences on the bounded range
         * recursively.
         * @returns An array of the differences between the two input sequences.
         */
        ComputeDiffRecursive(originalStart, originalEnd, modifiedStart, modifiedEnd, quitEarlyArr) {
            quitEarlyArr[0] = false;
            // Find the start of the differences
            while (originalStart <= originalEnd && modifiedStart <= modifiedEnd && this.ElementsAreEqual(originalStart, modifiedStart)) {
                originalStart++;
                modifiedStart++;
            }
            // Find the end of the differences
            while (originalEnd >= originalStart && modifiedEnd >= modifiedStart && this.ElementsAreEqual(originalEnd, modifiedEnd)) {
                originalEnd--;
                modifiedEnd--;
            }
            // In the special case where we either have all insertions or all deletions or the sequences are identical
            if (originalStart > originalEnd || modifiedStart > modifiedEnd) {
                let changes;
                if (modifiedStart <= modifiedEnd) {
                    Debug.Assert(originalStart === originalEnd + 1, 'originalStart should only be one more than originalEnd');
                    // All insertions
                    changes = [
                        new diffChange_1.DiffChange(originalStart, 0, modifiedStart, modifiedEnd - modifiedStart + 1)
                    ];
                }
                else if (originalStart <= originalEnd) {
                    Debug.Assert(modifiedStart === modifiedEnd + 1, 'modifiedStart should only be one more than modifiedEnd');
                    // All deletions
                    changes = [
                        new diffChange_1.DiffChange(originalStart, originalEnd - originalStart + 1, modifiedStart, 0)
                    ];
                }
                else {
                    Debug.Assert(originalStart === originalEnd + 1, 'originalStart should only be one more than originalEnd');
                    Debug.Assert(modifiedStart === modifiedEnd + 1, 'modifiedStart should only be one more than modifiedEnd');
                    // Identical sequences - No differences
                    changes = [];
                }
                return changes;
            }
            // This problem can be solved using the Divide-And-Conquer technique.
            const midOriginalArr = [0];
            const midModifiedArr = [0];
            const result = this.ComputeRecursionPoint(originalStart, originalEnd, modifiedStart, modifiedEnd, midOriginalArr, midModifiedArr, quitEarlyArr);
            const midOriginal = midOriginalArr[0];
            const midModified = midModifiedArr[0];
            if (result !== null) {
                // Result is not-null when there was enough memory to compute the changes while
                // searching for the recursion point
                return result;
            }
            else if (!quitEarlyArr[0]) {
                // We can break the problem down recursively by finding the changes in the
                // First Half:   (originalStart, modifiedStart) to (midOriginal, midModified)
                // Second Half:  (midOriginal + 1, minModified + 1) to (originalEnd, modifiedEnd)
                // NOTE: ComputeDiff() is inclusive, therefore the second range starts on the next point
                const leftChanges = this.ComputeDiffRecursive(originalStart, midOriginal, modifiedStart, midModified, quitEarlyArr);
                let rightChanges = [];
                if (!quitEarlyArr[0]) {
                    rightChanges = this.ComputeDiffRecursive(midOriginal + 1, originalEnd, midModified + 1, modifiedEnd, quitEarlyArr);
                }
                else {
                    // We didn't have time to finish the first half, so we don't have time to compute this half.
                    // Consider the entire rest of the sequence different.
                    rightChanges = [
                        new diffChange_1.DiffChange(midOriginal + 1, originalEnd - (midOriginal + 1) + 1, midModified + 1, modifiedEnd - (midModified + 1) + 1)
                    ];
                }
                return this.ConcatenateChanges(leftChanges, rightChanges);
            }
            // If we hit here, we quit early, and so can't return anything meaningful
            return [
                new diffChange_1.DiffChange(originalStart, originalEnd - originalStart + 1, modifiedStart, modifiedEnd - modifiedStart + 1)
            ];
        }
        WALKTRACE(diagonalForwardBase, diagonalForwardStart, diagonalForwardEnd, diagonalForwardOffset, diagonalReverseBase, diagonalReverseStart, diagonalReverseEnd, diagonalReverseOffset, forwardPoints, reversePoints, originalIndex, originalEnd, midOriginalArr, modifiedIndex, modifiedEnd, midModifiedArr, deltaIsEven, quitEarlyArr) {
            let forwardChanges = null;
            let reverseChanges = null;
            // First, walk backward through the forward diagonals history
            let changeHelper = new DiffChangeHelper();
            let diagonalMin = diagonalForwardStart;
            let diagonalMax = diagonalForwardEnd;
            let diagonalRelative = (midOriginalArr[0] - midModifiedArr[0]) - diagonalForwardOffset;
            let lastOriginalIndex = -1073741824 /* Constants.MIN_SAFE_SMALL_INTEGER */;
            let historyIndex = this.m_forwardHistory.length - 1;
            do {
                // Get the diagonal index from the relative diagonal number
                const diagonal = diagonalRelative + diagonalForwardBase;
                // Figure out where we came from
                if (diagonal === diagonalMin || (diagonal < diagonalMax && forwardPoints[diagonal - 1] < forwardPoints[diagonal + 1])) {
                    // Vertical line (the element is an insert)
                    originalIndex = forwardPoints[diagonal + 1];
                    modifiedIndex = originalIndex - diagonalRelative - diagonalForwardOffset;
                    if (originalIndex < lastOriginalIndex) {
                        changeHelper.MarkNextChange();
                    }
                    lastOriginalIndex = originalIndex;
                    changeHelper.AddModifiedElement(originalIndex + 1, modifiedIndex);
                    diagonalRelative = (diagonal + 1) - diagonalForwardBase; //Setup for the next iteration
                }
                else {
                    // Horizontal line (the element is a deletion)
                    originalIndex = forwardPoints[diagonal - 1] + 1;
                    modifiedIndex = originalIndex - diagonalRelative - diagonalForwardOffset;
                    if (originalIndex < lastOriginalIndex) {
                        changeHelper.MarkNextChange();
                    }
                    lastOriginalIndex = originalIndex - 1;
                    changeHelper.AddOriginalElement(originalIndex, modifiedIndex + 1);
                    diagonalRelative = (diagonal - 1) - diagonalForwardBase; //Setup for the next iteration
                }
                if (historyIndex >= 0) {
                    forwardPoints = this.m_forwardHistory[historyIndex];
                    diagonalForwardBase = forwardPoints[0]; //We stored this in the first spot
                    diagonalMin = 1;
                    diagonalMax = forwardPoints.length - 1;
                }
            } while (--historyIndex >= -1);
            // Ironically, we get the forward changes as the reverse of the
            // order we added them since we technically added them backwards
            forwardChanges = changeHelper.getReverseChanges();
            if (quitEarlyArr[0]) {
                // TODO: Calculate a partial from the reverse diagonals.
                //       For now, just assume everything after the midOriginal/midModified point is a diff
                let originalStartPoint = midOriginalArr[0] + 1;
                let modifiedStartPoint = midModifiedArr[0] + 1;
                if (forwardChanges !== null && forwardChanges.length > 0) {
                    const lastForwardChange = forwardChanges[forwardChanges.length - 1];
                    originalStartPoint = Math.max(originalStartPoint, lastForwardChange.getOriginalEnd());
                    modifiedStartPoint = Math.max(modifiedStartPoint, lastForwardChange.getModifiedEnd());
                }
                reverseChanges = [
                    new diffChange_1.DiffChange(originalStartPoint, originalEnd - originalStartPoint + 1, modifiedStartPoint, modifiedEnd - modifiedStartPoint + 1)
                ];
            }
            else {
                // Now walk backward through the reverse diagonals history
                changeHelper = new DiffChangeHelper();
                diagonalMin = diagonalReverseStart;
                diagonalMax = diagonalReverseEnd;
                diagonalRelative = (midOriginalArr[0] - midModifiedArr[0]) - diagonalReverseOffset;
                lastOriginalIndex = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
                historyIndex = (deltaIsEven) ? this.m_reverseHistory.length - 1 : this.m_reverseHistory.length - 2;
                do {
                    // Get the diagonal index from the relative diagonal number
                    const diagonal = diagonalRelative + diagonalReverseBase;
                    // Figure out where we came from
                    if (diagonal === diagonalMin || (diagonal < diagonalMax && reversePoints[diagonal - 1] >= reversePoints[diagonal + 1])) {
                        // Horizontal line (the element is a deletion))
                        originalIndex = reversePoints[diagonal + 1] - 1;
                        modifiedIndex = originalIndex - diagonalRelative - diagonalReverseOffset;
                        if (originalIndex > lastOriginalIndex) {
                            changeHelper.MarkNextChange();
                        }
                        lastOriginalIndex = originalIndex + 1;
                        changeHelper.AddOriginalElement(originalIndex + 1, modifiedIndex + 1);
                        diagonalRelative = (diagonal + 1) - diagonalReverseBase; //Setup for the next iteration
                    }
                    else {
                        // Vertical line (the element is an insertion)
                        originalIndex = reversePoints[diagonal - 1];
                        modifiedIndex = originalIndex - diagonalRelative - diagonalReverseOffset;
                        if (originalIndex > lastOriginalIndex) {
                            changeHelper.MarkNextChange();
                        }
                        lastOriginalIndex = originalIndex;
                        changeHelper.AddModifiedElement(originalIndex + 1, modifiedIndex + 1);
                        diagonalRelative = (diagonal - 1) - diagonalReverseBase; //Setup for the next iteration
                    }
                    if (historyIndex >= 0) {
                        reversePoints = this.m_reverseHistory[historyIndex];
                        diagonalReverseBase = reversePoints[0]; //We stored this in the first spot
                        diagonalMin = 1;
                        diagonalMax = reversePoints.length - 1;
                    }
                } while (--historyIndex >= -1);
                // There are cases where the reverse history will find diffs that
                // are correct, but not intuitive, so we need shift them.
                reverseChanges = changeHelper.getChanges();
            }
            return this.ConcatenateChanges(forwardChanges, reverseChanges);
        }
        /**
         * Given the range to compute the diff on, this method finds the point:
         * (midOriginal, midModified)
         * that exists in the middle of the LCS of the two sequences and
         * is the point at which the LCS problem may be broken down recursively.
         * This method will try to keep the LCS trace in memory. If the LCS recursion
         * point is calculated and the full trace is available in memory, then this method
         * will return the change list.
         * @param originalStart The start bound of the original sequence range
         * @param originalEnd The end bound of the original sequence range
         * @param modifiedStart The start bound of the modified sequence range
         * @param modifiedEnd The end bound of the modified sequence range
         * @param midOriginal The middle point of the original sequence range
         * @param midModified The middle point of the modified sequence range
         * @returns The diff changes, if available, otherwise null
         */
        ComputeRecursionPoint(originalStart, originalEnd, modifiedStart, modifiedEnd, midOriginalArr, midModifiedArr, quitEarlyArr) {
            let originalIndex = 0, modifiedIndex = 0;
            let diagonalForwardStart = 0, diagonalForwardEnd = 0;
            let diagonalReverseStart = 0, diagonalReverseEnd = 0;
            // To traverse the edit graph and produce the proper LCS, our actual
            // start position is just outside the given boundary
            originalStart--;
            modifiedStart--;
            // We set these up to make the compiler happy, but they will
            // be replaced before we return with the actual recursion point
            midOriginalArr[0] = 0;
            midModifiedArr[0] = 0;
            // Clear out the history
            this.m_forwardHistory = [];
            this.m_reverseHistory = [];
            // Each cell in the two arrays corresponds to a diagonal in the edit graph.
            // The integer value in the cell represents the originalIndex of the furthest
            // reaching point found so far that ends in that diagonal.
            // The modifiedIndex can be computed mathematically from the originalIndex and the diagonal number.
            const maxDifferences = (originalEnd - originalStart) + (modifiedEnd - modifiedStart);
            const numDiagonals = maxDifferences + 1;
            const forwardPoints = new Int32Array(numDiagonals);
            const reversePoints = new Int32Array(numDiagonals);
            // diagonalForwardBase: Index into forwardPoints of the diagonal which passes through (originalStart, modifiedStart)
            // diagonalReverseBase: Index into reversePoints of the diagonal which passes through (originalEnd, modifiedEnd)
            const diagonalForwardBase = (modifiedEnd - modifiedStart);
            const diagonalReverseBase = (originalEnd - originalStart);
            // diagonalForwardOffset: Geometric offset which allows modifiedIndex to be computed from originalIndex and the
            //    diagonal number (relative to diagonalForwardBase)
            // diagonalReverseOffset: Geometric offset which allows modifiedIndex to be computed from originalIndex and the
            //    diagonal number (relative to diagonalReverseBase)
            const diagonalForwardOffset = (originalStart - modifiedStart);
            const diagonalReverseOffset = (originalEnd - modifiedEnd);
            // delta: The difference between the end diagonal and the start diagonal. This is used to relate diagonal numbers
            //   relative to the start diagonal with diagonal numbers relative to the end diagonal.
            // The Even/Oddn-ness of this delta is important for determining when we should check for overlap
            const delta = diagonalReverseBase - diagonalForwardBase;
            const deltaIsEven = (delta % 2 === 0);
            // Here we set up the start and end points as the furthest points found so far
            // in both the forward and reverse directions, respectively
            forwardPoints[diagonalForwardBase] = originalStart;
            reversePoints[diagonalReverseBase] = originalEnd;
            // Remember if we quit early, and thus need to do a best-effort result instead of a real result.
            quitEarlyArr[0] = false;
            // A couple of points:
            // --With this method, we iterate on the number of differences between the two sequences.
            //   The more differences there actually are, the longer this will take.
            // --Also, as the number of differences increases, we have to search on diagonals further
            //   away from the reference diagonal (which is diagonalForwardBase for forward, diagonalReverseBase for reverse).
            // --We extend on even diagonals (relative to the reference diagonal) only when numDifferences
            //   is even and odd diagonals only when numDifferences is odd.
            for (let numDifferences = 1; numDifferences <= (maxDifferences / 2) + 1; numDifferences++) {
                let furthestOriginalIndex = 0;
                let furthestModifiedIndex = 0;
                // Run the algorithm in the forward direction
                diagonalForwardStart = this.ClipDiagonalBound(diagonalForwardBase - numDifferences, numDifferences, diagonalForwardBase, numDiagonals);
                diagonalForwardEnd = this.ClipDiagonalBound(diagonalForwardBase + numDifferences, numDifferences, diagonalForwardBase, numDiagonals);
                for (let diagonal = diagonalForwardStart; diagonal <= diagonalForwardEnd; diagonal += 2) {
                    // STEP 1: We extend the furthest reaching point in the present diagonal
                    // by looking at the diagonals above and below and picking the one whose point
                    // is further away from the start point (originalStart, modifiedStart)
                    if (diagonal === diagonalForwardStart || (diagonal < diagonalForwardEnd && forwardPoints[diagonal - 1] < forwardPoints[diagonal + 1])) {
                        originalIndex = forwardPoints[diagonal + 1];
                    }
                    else {
                        originalIndex = forwardPoints[diagonal - 1] + 1;
                    }
                    modifiedIndex = originalIndex - (diagonal - diagonalForwardBase) - diagonalForwardOffset;
                    // Save the current originalIndex so we can test for false overlap in step 3
                    const tempOriginalIndex = originalIndex;
                    // STEP 2: We can continue to extend the furthest reaching point in the present diagonal
                    // so long as the elements are equal.
                    while (originalIndex < originalEnd && modifiedIndex < modifiedEnd && this.ElementsAreEqual(originalIndex + 1, modifiedIndex + 1)) {
                        originalIndex++;
                        modifiedIndex++;
                    }
                    forwardPoints[diagonal] = originalIndex;
                    if (originalIndex + modifiedIndex > furthestOriginalIndex + furthestModifiedIndex) {
                        furthestOriginalIndex = originalIndex;
                        furthestModifiedIndex = modifiedIndex;
                    }
                    // STEP 3: If delta is odd (overlap first happens on forward when delta is odd)
                    // and diagonal is in the range of reverse diagonals computed for numDifferences-1
                    // (the previous iteration; we haven't computed reverse diagonals for numDifferences yet)
                    // then check for overlap.
                    if (!deltaIsEven && Math.abs(diagonal - diagonalReverseBase) <= (numDifferences - 1)) {
                        if (originalIndex >= reversePoints[diagonal]) {
                            midOriginalArr[0] = originalIndex;
                            midModifiedArr[0] = modifiedIndex;
                            if (tempOriginalIndex <= reversePoints[diagonal] && 1447 /* LocalConstants.MaxDifferencesHistory */ > 0 && numDifferences <= (1447 /* LocalConstants.MaxDifferencesHistory */ + 1)) {
                                // BINGO! We overlapped, and we have the full trace in memory!
                                return this.WALKTRACE(diagonalForwardBase, diagonalForwardStart, diagonalForwardEnd, diagonalForwardOffset, diagonalReverseBase, diagonalReverseStart, diagonalReverseEnd, diagonalReverseOffset, forwardPoints, reversePoints, originalIndex, originalEnd, midOriginalArr, modifiedIndex, modifiedEnd, midModifiedArr, deltaIsEven, quitEarlyArr);
                            }
                            else {
                                // Either false overlap, or we didn't have enough memory for the full trace
                                // Just return the recursion point
                                return null;
                            }
                        }
                    }
                }
                // Check to see if we should be quitting early, before moving on to the next iteration.
                const matchLengthOfLongest = ((furthestOriginalIndex - originalStart) + (furthestModifiedIndex - modifiedStart) - numDifferences) / 2;
                if (this.ContinueProcessingPredicate !== null && !this.ContinueProcessingPredicate(furthestOriginalIndex, matchLengthOfLongest)) {
                    // We can't finish, so skip ahead to generating a result from what we have.
                    quitEarlyArr[0] = true;
                    // Use the furthest distance we got in the forward direction.
                    midOriginalArr[0] = furthestOriginalIndex;
                    midModifiedArr[0] = furthestModifiedIndex;
                    if (matchLengthOfLongest > 0 && 1447 /* LocalConstants.MaxDifferencesHistory */ > 0 && numDifferences <= (1447 /* LocalConstants.MaxDifferencesHistory */ + 1)) {
                        // Enough of the history is in memory to walk it backwards
                        return this.WALKTRACE(diagonalForwardBase, diagonalForwardStart, diagonalForwardEnd, diagonalForwardOffset, diagonalReverseBase, diagonalReverseStart, diagonalReverseEnd, diagonalReverseOffset, forwardPoints, reversePoints, originalIndex, originalEnd, midOriginalArr, modifiedIndex, modifiedEnd, midModifiedArr, deltaIsEven, quitEarlyArr);
                    }
                    else {
                        // We didn't actually remember enough of the history.
                        //Since we are quitting the diff early, we need to shift back the originalStart and modified start
                        //back into the boundary limits since we decremented their value above beyond the boundary limit.
                        originalStart++;
                        modifiedStart++;
                        return [
                            new diffChange_1.DiffChange(originalStart, originalEnd - originalStart + 1, modifiedStart, modifiedEnd - modifiedStart + 1)
                        ];
                    }
                }
                // Run the algorithm in the reverse direction
                diagonalReverseStart = this.ClipDiagonalBound(diagonalReverseBase - numDifferences, numDifferences, diagonalReverseBase, numDiagonals);
                diagonalReverseEnd = this.ClipDiagonalBound(diagonalReverseBase + numDifferences, numDifferences, diagonalReverseBase, numDiagonals);
                for (let diagonal = diagonalReverseStart; diagonal <= diagonalReverseEnd; diagonal += 2) {
                    // STEP 1: We extend the furthest reaching point in the present diagonal
                    // by looking at the diagonals above and below and picking the one whose point
                    // is further away from the start point (originalEnd, modifiedEnd)
                    if (diagonal === diagonalReverseStart || (diagonal < diagonalReverseEnd && reversePoints[diagonal - 1] >= reversePoints[diagonal + 1])) {
                        originalIndex = reversePoints[diagonal + 1] - 1;
                    }
                    else {
                        originalIndex = reversePoints[diagonal - 1];
                    }
                    modifiedIndex = originalIndex - (diagonal - diagonalReverseBase) - diagonalReverseOffset;
                    // Save the current originalIndex so we can test for false overlap
                    const tempOriginalIndex = originalIndex;
                    // STEP 2: We can continue to extend the furthest reaching point in the present diagonal
                    // as long as the elements are equal.
                    while (originalIndex > originalStart && modifiedIndex > modifiedStart && this.ElementsAreEqual(originalIndex, modifiedIndex)) {
                        originalIndex--;
                        modifiedIndex--;
                    }
                    reversePoints[diagonal] = originalIndex;
                    // STEP 4: If delta is even (overlap first happens on reverse when delta is even)
                    // and diagonal is in the range of forward diagonals computed for numDifferences
                    // then check for overlap.
                    if (deltaIsEven && Math.abs(diagonal - diagonalForwardBase) <= numDifferences) {
                        if (originalIndex <= forwardPoints[diagonal]) {
                            midOriginalArr[0] = originalIndex;
                            midModifiedArr[0] = modifiedIndex;
                            if (tempOriginalIndex >= forwardPoints[diagonal] && 1447 /* LocalConstants.MaxDifferencesHistory */ > 0 && numDifferences <= (1447 /* LocalConstants.MaxDifferencesHistory */ + 1)) {
                                // BINGO! We overlapped, and we have the full trace in memory!
                                return this.WALKTRACE(diagonalForwardBase, diagonalForwardStart, diagonalForwardEnd, diagonalForwardOffset, diagonalReverseBase, diagonalReverseStart, diagonalReverseEnd, diagonalReverseOffset, forwardPoints, reversePoints, originalIndex, originalEnd, midOriginalArr, modifiedIndex, modifiedEnd, midModifiedArr, deltaIsEven, quitEarlyArr);
                            }
                            else {
                                // Either false overlap, or we didn't have enough memory for the full trace
                                // Just return the recursion point
                                return null;
                            }
                        }
                    }
                }
                // Save current vectors to history before the next iteration
                if (numDifferences <= 1447 /* LocalConstants.MaxDifferencesHistory */) {
                    // We are allocating space for one extra int, which we fill with
                    // the index of the diagonal base index
                    let temp = new Int32Array(diagonalForwardEnd - diagonalForwardStart + 2);
                    temp[0] = diagonalForwardBase - diagonalForwardStart + 1;
                    MyArray.Copy2(forwardPoints, diagonalForwardStart, temp, 1, diagonalForwardEnd - diagonalForwardStart + 1);
                    this.m_forwardHistory.push(temp);
                    temp = new Int32Array(diagonalReverseEnd - diagonalReverseStart + 2);
                    temp[0] = diagonalReverseBase - diagonalReverseStart + 1;
                    MyArray.Copy2(reversePoints, diagonalReverseStart, temp, 1, diagonalReverseEnd - diagonalReverseStart + 1);
                    this.m_reverseHistory.push(temp);
                }
            }
            // If we got here, then we have the full trace in history. We just have to convert it to a change list
            // NOTE: This part is a bit messy
            return this.WALKTRACE(diagonalForwardBase, diagonalForwardStart, diagonalForwardEnd, diagonalForwardOffset, diagonalReverseBase, diagonalReverseStart, diagonalReverseEnd, diagonalReverseOffset, forwardPoints, reversePoints, originalIndex, originalEnd, midOriginalArr, modifiedIndex, modifiedEnd, midModifiedArr, deltaIsEven, quitEarlyArr);
        }
        /**
         * Shifts the given changes to provide a more intuitive diff.
         * While the first element in a diff matches the first element after the diff,
         * we shift the diff down.
         *
         * @param changes The list of changes to shift
         * @returns The shifted changes
         */
        PrettifyChanges(changes) {
            // Shift all the changes down first
            for (let i = 0; i < changes.length; i++) {
                const change = changes[i];
                const originalStop = (i < changes.length - 1) ? changes[i + 1].originalStart : this._originalElementsOrHash.length;
                const modifiedStop = (i < changes.length - 1) ? changes[i + 1].modifiedStart : this._modifiedElementsOrHash.length;
                const checkOriginal = change.originalLength > 0;
                const checkModified = change.modifiedLength > 0;
                while (change.originalStart + change.originalLength < originalStop
                    && change.modifiedStart + change.modifiedLength < modifiedStop
                    && (!checkOriginal || this.OriginalElementsAreEqual(change.originalStart, change.originalStart + change.originalLength))
                    && (!checkModified || this.ModifiedElementsAreEqual(change.modifiedStart, change.modifiedStart + change.modifiedLength))) {
                    const startStrictEqual = this.ElementsAreStrictEqual(change.originalStart, change.modifiedStart);
                    const endStrictEqual = this.ElementsAreStrictEqual(change.originalStart + change.originalLength, change.modifiedStart + change.modifiedLength);
                    if (endStrictEqual && !startStrictEqual) {
                        // moving the change down would create an equal change, but the elements are not strict equal
                        break;
                    }
                    change.originalStart++;
                    change.modifiedStart++;
                }
                const mergedChangeArr = [null];
                if (i < changes.length - 1 && this.ChangesOverlap(changes[i], changes[i + 1], mergedChangeArr)) {
                    changes[i] = mergedChangeArr[0];
                    changes.splice(i + 1, 1);
                    i--;
                    continue;
                }
            }
            // Shift changes back up until we hit empty or whitespace-only lines
            for (let i = changes.length - 1; i >= 0; i--) {
                const change = changes[i];
                let originalStop = 0;
                let modifiedStop = 0;
                if (i > 0) {
                    const prevChange = changes[i - 1];
                    originalStop = prevChange.originalStart + prevChange.originalLength;
                    modifiedStop = prevChange.modifiedStart + prevChange.modifiedLength;
                }
                const checkOriginal = change.originalLength > 0;
                const checkModified = change.modifiedLength > 0;
                let bestDelta = 0;
                let bestScore = this._boundaryScore(change.originalStart, change.originalLength, change.modifiedStart, change.modifiedLength);
                for (let delta = 1;; delta++) {
                    const originalStart = change.originalStart - delta;
                    const modifiedStart = change.modifiedStart - delta;
                    if (originalStart < originalStop || modifiedStart < modifiedStop) {
                        break;
                    }
                    if (checkOriginal && !this.OriginalElementsAreEqual(originalStart, originalStart + change.originalLength)) {
                        break;
                    }
                    if (checkModified && !this.ModifiedElementsAreEqual(modifiedStart, modifiedStart + change.modifiedLength)) {
                        break;
                    }
                    const touchingPreviousChange = (originalStart === originalStop && modifiedStart === modifiedStop);
                    const score = ((touchingPreviousChange ? 5 : 0)
                        + this._boundaryScore(originalStart, change.originalLength, modifiedStart, change.modifiedLength));
                    if (score > bestScore) {
                        bestScore = score;
                        bestDelta = delta;
                    }
                }
                change.originalStart -= bestDelta;
                change.modifiedStart -= bestDelta;
                const mergedChangeArr = [null];
                if (i > 0 && this.ChangesOverlap(changes[i - 1], changes[i], mergedChangeArr)) {
                    changes[i - 1] = mergedChangeArr[0];
                    changes.splice(i, 1);
                    i++;
                    continue;
                }
            }
            // There could be multiple longest common substrings.
            // Give preference to the ones containing longer lines
            if (this._hasStrings) {
                for (let i = 1, len = changes.length; i < len; i++) {
                    const aChange = changes[i - 1];
                    const bChange = changes[i];
                    const matchedLength = bChange.originalStart - aChange.originalStart - aChange.originalLength;
                    const aOriginalStart = aChange.originalStart;
                    const bOriginalEnd = bChange.originalStart + bChange.originalLength;
                    const abOriginalLength = bOriginalEnd - aOriginalStart;
                    const aModifiedStart = aChange.modifiedStart;
                    const bModifiedEnd = bChange.modifiedStart + bChange.modifiedLength;
                    const abModifiedLength = bModifiedEnd - aModifiedStart;
                    // Avoid wasting a lot of time with these searches
                    if (matchedLength < 5 && abOriginalLength < 20 && abModifiedLength < 20) {
                        const t = this._findBetterContiguousSequence(aOriginalStart, abOriginalLength, aModifiedStart, abModifiedLength, matchedLength);
                        if (t) {
                            const [originalMatchStart, modifiedMatchStart] = t;
                            if (originalMatchStart !== aChange.originalStart + aChange.originalLength || modifiedMatchStart !== aChange.modifiedStart + aChange.modifiedLength) {
                                // switch to another sequence that has a better score
                                aChange.originalLength = originalMatchStart - aChange.originalStart;
                                aChange.modifiedLength = modifiedMatchStart - aChange.modifiedStart;
                                bChange.originalStart = originalMatchStart + matchedLength;
                                bChange.modifiedStart = modifiedMatchStart + matchedLength;
                                bChange.originalLength = bOriginalEnd - bChange.originalStart;
                                bChange.modifiedLength = bModifiedEnd - bChange.modifiedStart;
                            }
                        }
                    }
                }
            }
            return changes;
        }
        _findBetterContiguousSequence(originalStart, originalLength, modifiedStart, modifiedLength, desiredLength) {
            if (originalLength < desiredLength || modifiedLength < desiredLength) {
                return null;
            }
            const originalMax = originalStart + originalLength - desiredLength + 1;
            const modifiedMax = modifiedStart + modifiedLength - desiredLength + 1;
            let bestScore = 0;
            let bestOriginalStart = 0;
            let bestModifiedStart = 0;
            for (let i = originalStart; i < originalMax; i++) {
                for (let j = modifiedStart; j < modifiedMax; j++) {
                    const score = this._contiguousSequenceScore(i, j, desiredLength);
                    if (score > 0 && score > bestScore) {
                        bestScore = score;
                        bestOriginalStart = i;
                        bestModifiedStart = j;
                    }
                }
            }
            if (bestScore > 0) {
                return [bestOriginalStart, bestModifiedStart];
            }
            return null;
        }
        _contiguousSequenceScore(originalStart, modifiedStart, length) {
            let score = 0;
            for (let l = 0; l < length; l++) {
                if (!this.ElementsAreEqual(originalStart + l, modifiedStart + l)) {
                    return 0;
                }
                score += this._originalStringElements[originalStart + l].length;
            }
            return score;
        }
        _OriginalIsBoundary(index) {
            if (index <= 0 || index >= this._originalElementsOrHash.length - 1) {
                return true;
            }
            return (this._hasStrings && /^\s*$/.test(this._originalStringElements[index]));
        }
        _OriginalRegionIsBoundary(originalStart, originalLength) {
            if (this._OriginalIsBoundary(originalStart) || this._OriginalIsBoundary(originalStart - 1)) {
                return true;
            }
            if (originalLength > 0) {
                const originalEnd = originalStart + originalLength;
                if (this._OriginalIsBoundary(originalEnd - 1) || this._OriginalIsBoundary(originalEnd)) {
                    return true;
                }
            }
            return false;
        }
        _ModifiedIsBoundary(index) {
            if (index <= 0 || index >= this._modifiedElementsOrHash.length - 1) {
                return true;
            }
            return (this._hasStrings && /^\s*$/.test(this._modifiedStringElements[index]));
        }
        _ModifiedRegionIsBoundary(modifiedStart, modifiedLength) {
            if (this._ModifiedIsBoundary(modifiedStart) || this._ModifiedIsBoundary(modifiedStart - 1)) {
                return true;
            }
            if (modifiedLength > 0) {
                const modifiedEnd = modifiedStart + modifiedLength;
                if (this._ModifiedIsBoundary(modifiedEnd - 1) || this._ModifiedIsBoundary(modifiedEnd)) {
                    return true;
                }
            }
            return false;
        }
        _boundaryScore(originalStart, originalLength, modifiedStart, modifiedLength) {
            const originalScore = (this._OriginalRegionIsBoundary(originalStart, originalLength) ? 1 : 0);
            const modifiedScore = (this._ModifiedRegionIsBoundary(modifiedStart, modifiedLength) ? 1 : 0);
            return (originalScore + modifiedScore);
        }
        /**
         * Concatenates the two input DiffChange lists and returns the resulting
         * list.
         * @param The left changes
         * @param The right changes
         * @returns The concatenated list
         */
        ConcatenateChanges(left, right) {
            const mergedChangeArr = [];
            if (left.length === 0 || right.length === 0) {
                return (right.length > 0) ? right : left;
            }
            else if (this.ChangesOverlap(left[left.length - 1], right[0], mergedChangeArr)) {
                // Since we break the problem down recursively, it is possible that we
                // might recurse in the middle of a change thereby splitting it into
                // two changes. Here in the combining stage, we detect and fuse those
                // changes back together
                const result = new Array(left.length + right.length - 1);
                MyArray.Copy(left, 0, result, 0, left.length - 1);
                result[left.length - 1] = mergedChangeArr[0];
                MyArray.Copy(right, 1, result, left.length, right.length - 1);
                return result;
            }
            else {
                const result = new Array(left.length + right.length);
                MyArray.Copy(left, 0, result, 0, left.length);
                MyArray.Copy(right, 0, result, left.length, right.length);
                return result;
            }
        }
        /**
         * Returns true if the two changes overlap and can be merged into a single
         * change
         * @param left The left change
         * @param right The right change
         * @param mergedChange The merged change if the two overlap, null otherwise
         * @returns True if the two changes overlap
         */
        ChangesOverlap(left, right, mergedChangeArr) {
            Debug.Assert(left.originalStart <= right.originalStart, 'Left change is not less than or equal to right change');
            Debug.Assert(left.modifiedStart <= right.modifiedStart, 'Left change is not less than or equal to right change');
            if (left.originalStart + left.originalLength >= right.originalStart || left.modifiedStart + left.modifiedLength >= right.modifiedStart) {
                const originalStart = left.originalStart;
                let originalLength = left.originalLength;
                const modifiedStart = left.modifiedStart;
                let modifiedLength = left.modifiedLength;
                if (left.originalStart + left.originalLength >= right.originalStart) {
                    originalLength = right.originalStart + right.originalLength - left.originalStart;
                }
                if (left.modifiedStart + left.modifiedLength >= right.modifiedStart) {
                    modifiedLength = right.modifiedStart + right.modifiedLength - left.modifiedStart;
                }
                mergedChangeArr[0] = new diffChange_1.DiffChange(originalStart, originalLength, modifiedStart, modifiedLength);
                return true;
            }
            else {
                mergedChangeArr[0] = null;
                return false;
            }
        }
        /**
         * Helper method used to clip a diagonal index to the range of valid
         * diagonals. This also decides whether or not the diagonal index,
         * if it exceeds the boundary, should be clipped to the boundary or clipped
         * one inside the boundary depending on the Even/Odd status of the boundary
         * and numDifferences.
         * @param diagonal The index of the diagonal to clip.
         * @param numDifferences The current number of differences being iterated upon.
         * @param diagonalBaseIndex The base reference diagonal.
         * @param numDiagonals The total number of diagonals.
         * @returns The clipped diagonal index.
         */
        ClipDiagonalBound(diagonal, numDifferences, diagonalBaseIndex, numDiagonals) {
            if (diagonal >= 0 && diagonal < numDiagonals) {
                // Nothing to clip, its in range
                return diagonal;
            }
            // diagonalsBelow: The number of diagonals below the reference diagonal
            // diagonalsAbove: The number of diagonals above the reference diagonal
            const diagonalsBelow = diagonalBaseIndex;
            const diagonalsAbove = numDiagonals - diagonalBaseIndex - 1;
            const diffEven = (numDifferences % 2 === 0);
            if (diagonal < 0) {
                const lowerBoundEven = (diagonalsBelow % 2 === 0);
                return (diffEven === lowerBoundEven) ? 0 : 1;
            }
            else {
                const upperBoundEven = (diagonalsAbove % 2 === 0);
                return (diffEven === upperBoundEven) ? numDiagonals - 1 : numDiagonals - 2;
            }
        }
    }
    exports.LcsDiff = LcsDiff;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vZGlmZi9kaWZmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9CaEcsZ0NBRUM7SUFoQkQsTUFBYSxrQkFBa0I7UUFFOUIsWUFBb0IsTUFBYztZQUFkLFdBQU0sR0FBTixNQUFNLENBQVE7UUFBSSxDQUFDO1FBRXZDLFdBQVc7WUFDVixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzNCLE1BQU0sVUFBVSxHQUFHLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7WUFDRCxPQUFPLFVBQVUsQ0FBQztRQUNuQixDQUFDO0tBQ0Q7SUFaRCxnREFZQztJQUVELFNBQWdCLFVBQVUsQ0FBQyxRQUFnQixFQUFFLFFBQWdCLEVBQUUsTUFBZTtRQUM3RSxPQUFPLElBQUksT0FBTyxDQUFDLElBQUksa0JBQWtCLENBQUMsUUFBUSxDQUFDLEVBQUUsSUFBSSxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDcEgsQ0FBQztJQTBDRCxFQUFFO0lBQ0YsZ0VBQWdFO0lBQ2hFLEVBQUU7SUFFRixNQUFNLEtBQUs7UUFFSCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQWtCLEVBQUUsT0FBZTtZQUN2RCxJQUFJ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