/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinesLayout = exports.EditorWhitespace = void 0;
    class PendingChanges {
        constructor() {
            this._hasPending = false;
            this._inserts = [];
            this._changes = [];
            this._removes = [];
        }
        insert(x) {
            this._hasPending = true;
            this._inserts.push(x);
        }
        change(x) {
            this._hasPending = true;
            this._changes.push(x);
        }
        remove(x) {
            this._hasPending = true;
            this._removes.push(x);
        }
        mustCommit() {
            return this._hasPending;
        }
        commit(linesLayout) {
            if (!this._hasPending) {
                return;
            }
            const inserts = this._inserts;
            const changes = this._changes;
            const removes = this._removes;
            this._hasPending = false;
            this._inserts = [];
            this._changes = [];
            this._removes = [];
            linesLayout._commitPendingChanges(inserts, changes, removes);
        }
    }
    class EditorWhitespace {
        constructor(id, afterLineNumber, ordinal, height, minWidth) {
            this.id = id;
            this.afterLineNumber = afterLineNumber;
            this.ordinal = ordinal;
            this.height = height;
            this.minWidth = minWidth;
            this.prefixSum = 0;
        }
    }
    exports.EditorWhitespace = EditorWhitespace;
    /**
     * Layouting of objects that take vertical space (by having a height) and push down other objects.
     *
     * These objects are basically either text (lines) or spaces between those lines (whitespaces).
     * This provides commodity operations for working with lines that contain whitespace that pushes lines lower (vertically).
     */
    class LinesLayout {
        static { this.INSTANCE_COUNT = 0; }
        constructor(lineCount, lineHeight, paddingTop, paddingBottom) {
            this._instanceId = strings.singleLetterHash(++LinesLayout.INSTANCE_COUNT);
            this._pendingChanges = new PendingChanges();
            this._lastWhitespaceId = 0;
            this._arr = [];
            this._prefixSumValidIndex = -1;
            this._minWidth = -1; /* marker for not being computed */
            this._lineCount = lineCount;
            this._lineHeight = lineHeight;
            this._paddingTop = paddingTop;
            this._paddingBottom = paddingBottom;
        }
        /**
         * Find the insertion index for a new value inside a sorted array of values.
         * If the value is already present in the sorted array, the insertion index will be after the already existing value.
         */
        static findInsertionIndex(arr, afterLineNumber, ordinal) {
            let low = 0;
            let high = arr.length;
            while (low < high) {
                const mid = ((low + high) >>> 1);
                if (afterLineNumber === arr[mid].afterLineNumber) {
                    if (ordinal < arr[mid].ordinal) {
                        high = mid;
                    }
                    else {
                        low = mid + 1;
                    }
                }
                else if (afterLineNumber < arr[mid].afterLineNumber) {
                    high = mid;
                }
                else {
                    low = mid + 1;
                }
            }
            return low;
        }
        /**
         * Change the height of a line in pixels.
         */
        setLineHeight(lineHeight) {
            this._checkPendingChanges();
            this._lineHeight = lineHeight;
        }
        /**
         * Changes the padding used to calculate vertical offsets.
         */
        setPadding(paddingTop, paddingBottom) {
            this._paddingTop = paddingTop;
            this._paddingBottom = paddingBottom;
        }
        /**
         * Set the number of lines.
         *
         * @param lineCount New number of lines.
         */
        onFlushed(lineCount) {
            this._checkPendingChanges();
            this._lineCount = lineCount;
        }
        changeWhitespace(callback) {
            let hadAChange = false;
            try {
                const accessor = {
                    insertWhitespace: (afterLineNumber, ordinal, heightInPx, minWidth) => {
                        hadAChange = true;
                        afterLineNumber = afterLineNumber | 0;
                        ordinal = ordinal | 0;
                        heightInPx = heightInPx | 0;
                        minWidth = minWidth | 0;
                        const id = this._instanceId + (++this._lastWhitespaceId);
                        this._pendingChanges.insert(new EditorWhitespace(id, afterLineNumber, ordinal, heightInPx, minWidth));
                        return id;
                    },
                    changeOneWhitespace: (id, newAfterLineNumber, newHeight) => {
                        hadAChange = true;
                        newAfterLineNumber = newAfterLineNumber | 0;
                        newHeight = newHeight | 0;
                        this._pendingChanges.change({ id, newAfterLineNumber, newHeight });
                    },
                    removeWhitespace: (id) => {
                        hadAChange = true;
                        this._pendingChanges.remove({ id });
                    }
                };
                callback(accessor);
            }
            finally {
                this._pendingChanges.commit(this);
            }
            return hadAChange;
        }
        _commitPendingChanges(inserts, changes, removes) {
            if (inserts.length > 0 || removes.length > 0) {
                this._minWidth = -1; /* marker for not being computed */
            }
            if (inserts.length + changes.length + removes.length <= 1) {
                // when only one thing happened, handle it "delicately"
                for (const insert of inserts) {
                    this._insertWhitespace(insert);
                }
                for (const change of changes) {
                    this._changeOneWhitespace(change.id, change.newAfterLineNumber, change.newHeight);
                }
                for (const remove of removes) {
                    const index = this._findWhitespaceIndex(remove.id);
                    if (index === -1) {
                        continue;
                    }
                    this._removeWhitespace(index);
                }
                return;
            }
            // simply rebuild the entire datastructure
            const toRemove = new Set();
            for (const remove of removes) {
                toRemove.add(remove.id);
            }
            const toChange = new Map();
            for (const change of changes) {
                toChange.set(change.id, change);
            }
            const applyRemoveAndChange = (whitespaces) => {
                const result = [];
                for (const whitespace of whitespaces) {
                    if (toRemove.has(whitespace.id)) {
                        continue;
                    }
                    if (toChange.has(whitespace.id)) {
                        const change = toChange.get(whitespace.id);
                        whitespace.afterLineNumber = change.newAfterLineNumber;
                        whitespace.height = change.newHeight;
                    }
                    result.push(whitespace);
                }
                return result;
            };
            const result = applyRemoveAndChange(this._arr).concat(applyRemoveAndChange(inserts));
            result.sort((a, b) => {
                if (a.afterLineNumber === b.afterLineNumber) {
                    return a.ordinal - b.ordinal;
                }
                return a.afterLineNumber - b.afterLineNumber;
            });
            this._arr = result;
            this._prefixSumValidIndex = -1;
        }
        _checkPendingChanges() {
            if (this._pendingChanges.mustCommit()) {
                this._pendingChanges.commit(this);
            }
        }
        _insertWhitespace(whitespace) {
            const insertIndex = LinesLayout.findInsertionIndex(this._arr, whitespace.afterLineNumber, whitespace.ordinal);
            this._arr.splice(insertIndex, 0, whitespace);
            this._prefixSumValidIndex = Math.min(this._prefixSumValidIndex, insertIndex - 1);
        }
        _findWhitespaceIndex(id) {
            const arr = this._arr;
            for (let i = 0, len = arr.length; i < len; i++) {
                if (arr[i].id === id) {
                    return i;
                }
            }
            return -1;
        }
        _changeOneWhitespace(id, newAfterLineNumber, newHeight) {
            const index = this._findWhitespaceIndex(id);
            if (index === -1) {
                return;
            }
            if (this._arr[index].height !== newHeight) {
                this._arr[index].height = newHeight;
                this._prefixSumValidIndex = Math.min(this._prefixSumValidIndex, index - 1);
            }
            if (this._arr[index].afterLineNumber !== newAfterLineNumber) {
                // `afterLineNumber` changed for this whitespace
                // Record old whitespace
                const whitespace = this._arr[index];
                // Since changing `afterLineNumber` can trigger a reordering, we're gonna remove this whitespace
                this._removeWhitespace(index);
                whitespace.afterLineNumber = newAfterLineNumber;
                // And add it again
                this._insertWhitespace(whitespace);
            }
        }
        _removeWhitespace(removeIndex) {
            this._arr.splice(removeIndex, 1);
            this._prefixSumValidIndex = Math.min(this._prefixSumValidIndex, removeIndex - 1);
        }
        /**
         * Notify the layouter that lines have been deleted (a continuous zone of lines).
         *
         * @param fromLineNumber The line number at which the deletion started, inclusive
         * @param toLineNumber The line number at which the deletion ended, inclusive
         */
        onLinesDeleted(fromLineNumber, toLineNumber) {
            this._checkPendingChanges();
            fromLineNumber = fromLineNumber | 0;
            toLineNumber = toLineNumber | 0;
            this._lineCount -= (toLineNumber - fromLineNumber + 1);
            for (let i = 0, len = this._arr.length; i < len; i++) {
                const afterLineNumber = this._arr[i].afterLineNumber;
                if (fromLineNumber <= afterLineNumber && afterLineNumber <= toLineNumber) {
                    // The line this whitespace was after has been deleted
                    //  => move whitespace to before first deleted line
                    this._arr[i].afterLineNumber = fromLineNumber - 1;
                }
                else if (afterLineNumber > toLineNumber) {
                    // The line this whitespace was after has been moved up
                    //  => move whitespace up
                    this._arr[i].afterLineNumber -= (toLineNumber - fromLineNumber + 1);
                }
            }
        }
        /**
         * Notify the layouter that lines have been inserted (a continuous zone of lines).
         *
         * @param fromLineNumber The line number at which the insertion started, inclusive
         * @param toLineNumber The line number at which the insertion ended, inclusive.
         */
        onLinesInserted(fromLineNumber, toLineNumber) {
            this._checkPendingChanges();
            fromLineNumber = fromLineNumber | 0;
            toLineNumber = toLineNumber | 0;
            this._lineCount += (toLineNumber - fromLineNumber + 1);
            for (let i = 0, len = this._arr.length; i < len; i++) {
                const afterLineNumber = this._arr[i].afterLineNumber;
                if (fromLineNumber <= afterLineNumber) {
                    this._arr[i].afterLineNumber += (toLineNumber - fromLineNumber + 1);
                }
            }
        }
        /**
         * Get the sum of all the whitespaces.
         */
        getWhitespacesTotalHeight() {
            this._checkPendingChanges();
            if (this._arr.length === 0) {
                return 0;
            }
            return this.getWhitespacesAccumulatedHeight(this._arr.length - 1);
        }
        /**
         * Return the sum of the heights of the whitespaces at [0..index].
         * This includes the whitespace at `index`.
         *
         * @param index The index of the whitespace.
         * @return The sum of the heights of all whitespaces before the one at `index`, including the one at `index`.
         */
        getWhitespacesAccumulatedHeight(index) {
            this._checkPendingChanges();
            index = index | 0;
            let startIndex = Math.max(0, this._prefixSumValidIndex + 1);
            if (startIndex === 0) {
                this._arr[0].prefixSum = this._arr[0].height;
                startIndex++;
            }
            for (let i = startIndex; i <= index; i++) {
                this._arr[i].prefixSum = this._arr[i - 1].prefixSum + this._arr[i].height;
            }
            this._prefixSumValidIndex = Math.max(this._prefixSumValidIndex, index);
            return this._arr[index].prefixSum;
        }
        /**
         * Get the sum of heights for all objects.
         *
         * @return The sum of heights for all objects.
         */
        getLinesTotalHeight() {
            this._checkPendingChanges();
            const linesHeight = this._lineHeight * this._lineCount;
            const whitespacesHeight = this.getWhitespacesTotalHeight();
            return linesHeight + whitespacesHeight + this._paddingTop + this._paddingBottom;
        }
        /**
         * Returns the accumulated height of whitespaces before the given line number.
         *
         * @param lineNumber The line number
         */
        getWhitespaceAccumulatedHeightBeforeLineNumber(lineNumber) {
            this._checkPendingChanges();
            lineNumber = lineNumber | 0;
            const lastWhitespaceBeforeLineNumber = this._findLastWhitespaceBeforeLineNumber(lineNumber);
            if (lastWhitespaceBeforeLineNumber === -1) {
                return 0;
            }
            return this.getWhitespacesAccumulatedHeight(lastWhitespaceBeforeLineNumber);
        }
        _findLastWhitespaceBeforeLineNumber(lineNumber) {
            lineNumber = lineNumber | 0;
            // Find the whitespace before line number
            const arr = this._arr;
            let low = 0;
            let high = arr.length - 1;
            while (low <= high) {
                const delta = (high - low) | 0;
                const halfDelta = (delta / 2) | 0;
                const mid = (low + halfDelta) | 0;
                if (arr[mid].afterLineNumber < lineNumber) {
                    if (mid + 1 >= arr.length || arr[mid + 1].afterLineNumber >= lineNumber) {
                        return mid;
                    }
                    else {
                        low = (mid + 1) | 0;
                    }
                }
                else {
                    high = (mid - 1) | 0;
                }
            }
            return -1;
        }
        _findFirstWhitespaceAfterLineNumber(lineNumber) {
            lineNumber = lineNumber | 0;
            const lastWhitespaceBeforeLineNumber = this._findLastWhitespaceBeforeLineNumber(lineNumber);
            const firstWhitespaceAfterLineNumber = lastWhitespaceBeforeLineNumber + 1;
            if (firstWhitespaceAfterLineNumber < this._arr.length) {
                return firstWhitespaceAfterLineNumber;
            }
            return -1;
        }
        /**
         * Find the index of the first whitespace which has `afterLineNumber` >= `lineNumber`.
         * @return The index of the first whitespace with `afterLineNumber` >= `lineNumber` or -1 if no whitespace is found.
         */
        getFirstWhitespaceIndexAfterLineNumber(lineNumber) {
            this._checkPendingChanges();
            lineNumber = lineNumber | 0;
            return this._findFirstWhitespaceAfterLineNumber(lineNumber);
        }
        /**
         * Get the vertical offset (the sum of heights for all objects above) a certain line number.
         *
         * @param lineNumber The line number
         * @return The sum of heights for all objects above `lineNumber`.
         */
        getVerticalOffsetForLineNumber(lineNumber, includeViewZones = false) {
            this._checkPendingChanges();
            lineNumber = lineNumber | 0;
            let previousLinesHeight;
            if (lineNumber > 1) {
                previousLinesHeight = this._lineHeight * (lineNumber - 1);
            }
            else {
                previousLinesHeight = 0;
            }
            const previousWhitespacesHeight = this.getWhitespaceAccumulatedHeightBeforeLineNumber(lineNumber - (includeViewZones ? 1 : 0));
            return previousLinesHeight + previousWhitespacesHeight + this._paddingTop;
        }
        /**
         * Get the vertical offset (the sum of heights for all objects above) a certain line number.
         *
         * @param lineNumber The line number
         * @return The sum of heights for all objects above `lineNumber`.
         */
        getVerticalOffsetAfterLineNumber(lineNumber, includeViewZones = false) {
            this._checkPendingChanges();
            lineNumber = lineNumber | 0;
            const previousLinesHeight = this._lineHeight * lineNumber;
            const previousWhitespacesHeight = this.getWhitespaceAccumulatedHeightBeforeLineNumber(lineNumber + (includeViewZones ? 1 : 0));
            return previousLinesHeight + previousWhitespacesHeight + this._paddingTop;
        }
        /**
         * Returns if there is any whitespace in the document.
         */
        hasWhitespace() {
            this._checkPendingChanges();
            return this.getWhitespacesCount() > 0;
        }
        /**
         * The maximum min width for all whitespaces.
         */
        getWhitespaceMinWidth() {
            this._checkPendingChanges();
            if (this._minWidth === -1) {
                let minWidth = 0;
                for (let i = 0, len = this._arr.length; i < len; i++) {
                    minWidth = Math.max(minWidth, this._arr[i].minWidth);
                }
                this._minWidth = minWidth;
            }
            return this._minWidth;
        }
        /**
         * Check if `verticalOffset` is below all lines.
         */
        isAfterLines(verticalOffset) {
            this._checkPendingChanges();
            const totalHeight = this.getLinesTotalHeight();
            return verticalOffset > totalHeight;
        }
        isInTopPadding(verticalOffset) {
            if (this._paddingTop === 0) {
                return false;
            }
            this._checkPendingChanges();
            return (verticalOffset < this._paddingTop);
        }
        isInBottomPadding(verticalOffset) {
            if (this._paddingBottom === 0) {
                return false;
            }
            this._checkPendingChanges();
            const totalHeight = this.getLinesTotalHeight();
            return (verticalOffset >= totalHeight - this._paddingBottom);
        }
        /**
         * Find the first line number that is at or after vertical offset `verticalOffset`.
         * i.e. if getVerticalOffsetForLine(line) is x and getVerticalOffsetForLine(line + 1) is y, then
         * getLineNumberAtOrAfterVerticalOffset(i) = line, x <= i < y.
         *
         * @param verticalOffset The vertical offset to search at.
         * @return The line number at or after vertical offset `verticalOffset`.
         */
        getLineNumberAtOrAfterVerticalOffset(verticalOffset) {
            this._checkPendingChanges();
            verticalOffset = verticalOffset | 0;
            if (verticalOffset < 0) {
                return 1;
            }
            const linesCount = this._lineCount | 0;
            const lineHeight = this._lineHeight;
            let minLineNumber = 1;
            let maxLineNumber = linesCount;
            while (minLineNumber < maxLineNumber) {
                const midLineNumber = ((minLineNumber + maxLineNumber) / 2) | 0;
                const midLineNumberVerticalOffset = this.getVerticalOffsetForLineNumber(midLineNumber) | 0;
                if (verticalOffset >= midLineNumberVerticalOffset + lineHeight) {
                    // vertical offset is after mid line number
                    minLineNumber = midLineNumber + 1;
                }
                else if (verticalOffset >= midLineNumberVerticalOffset) {
                    // Hit
                    return midLineNumber;
                }
                else {
                    // vertical offset is before mid line number, but mid line number could still be what we're searching for
                    maxLineNumber = midLineNumber;
                }
            }
            if (minLineNumber > linesCount) {
                return linesCount;
            }
            return minLineNumber;
        }
        /**
         * Get all the lines and their relative vertical offsets that are positioned between `verticalOffset1` and `verticalOffset2`.
         *
         * @param verticalOffset1 The beginning of the viewport.
         * @param verticalOffset2 The end of the viewport.
         * @return A structure describing the lines positioned between `verticalOffset1` and `verticalOffset2`.
         */
        getLinesViewportData(verticalOffset1, verticalOffset2) {
            this._checkPendingChanges();
            verticalOffset1 = verticalOffset1 | 0;
            verticalOffset2 = verticalOffset2 | 0;
            const lineHeight = this._lineHeight;
            // Find first line number
            // We don't live in a perfect world, so the line number might start before or after verticalOffset1
            const startLineNumber = this.getLineNumberAtOrAfterVerticalOffset(verticalOffset1) | 0;
            const startLineNumberVerticalOffset = this.getVerticalOffsetForLineNumber(startLineNumber) | 0;
            let endLineNumber = this._lineCount | 0;
            // Also keep track of what whitespace we've got
            let whitespaceIndex = this.getFirstWhitespaceIndexAfterLineNumber(startLineNumber) | 0;
            const whitespaceCount = this.getWhitespacesCount() | 0;
            let currentWhitespaceHeight;
            let currentWhitespaceAfterLineNumber;
            if (whitespaceIndex === -1) {
                whitespaceIndex = whitespaceCount;
                currentWhitespaceAfterLineNumber = endLineNumber + 1;
                currentWhitespaceHeight = 0;
            }
            else {
                currentWhitespaceAfterLineNumber = this.getAfterLineNumberForWhitespaceIndex(whitespaceIndex) | 0;
                currentWhitespaceHeight = this.getHeightForWhitespaceIndex(whitespaceIndex) | 0;
            }
            let currentVerticalOffset = startLineNumberVerticalOffset;
            let currentLineRelativeOffset = currentVerticalOffset;
            // IE (all versions) cannot handle units above about 1,533,908 px, so every 500k pixels bring numbers down
            const STEP_SIZE = 500000;
            let bigNumbersDelta = 0;
            if (startLineNumberVerticalOffset >= STEP_SIZE) {
                // Compute a delta that guarantees that lines are positioned at `lineHeight` increments
                bigNumbersDelta = Math.floor(startLineNumberVerticalOffset / STEP_SIZE) * STEP_SIZE;
                bigNumbersDelta = Math.floor(bigNumbersDelta / lineHeight) * lineHeight;
                currentLineRelativeOffset -= bigNumbersDelta;
            }
            const linesOffsets = [];
            const verticalCenter = verticalOffset1 + (verticalOffset2 - verticalOffset1) / 2;
            let centeredLineNumber = -1;
            // Figure out how far the lines go
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                if (centeredLineNumber === -1) {
                    const currentLineTop = currentVerticalOffset;
                    const currentLineBottom = currentVerticalOffset + lineHeight;
                    if ((currentLineTop <= verticalCenter && verticalCenter < currentLineBottom) || currentLineTop > verticalCenter) {
                        centeredLineNumber = lineNumber;
                    }
                }
                // Count current line height in the vertical offsets
                currentVerticalOffset += lineHeight;
                linesOffsets[lineNumber - startLineNumber] = currentLineRelativeOffset;
                // Next line starts immediately after this one
                currentLineRelativeOffset += lineHeight;
                while (currentWhitespaceAfterLineNumber === lineNumber) {
                    // Push down next line with the height of the current whitespace
                    currentLineRelativeOffset += currentWhitespaceHeight;
                    // Count current whitespace in the vertical offsets
                    currentVerticalOffset += currentWhitespaceHeight;
                    whitespaceIndex++;
                    if (whitespaceIndex >= whitespaceCount) {
                        currentWhitespaceAfterLineNumber = endLineNumber + 1;
                    }
                    else {
                        currentWhitespaceAfterLineNumber = this.getAfterLineNumberForWhitespaceIndex(whitespaceIndex) | 0;
                        currentWhitespaceHeight = this.getHeightForWhitespaceIndex(whitespaceIndex) | 0;
                    }
                }
                if (currentVerticalOffset >= verticalOffset2) {
                    // We have covered the entire viewport area, time to stop
                    endLineNumber = lineNumber;
                    break;
                }
            }
            if (centeredLineNumber === -1) {
                centeredLineNumber = endLineNumber;
            }
            const endLineNumberVerticalOffset = this.getVerticalOffsetForLineNumber(endLineNumber) | 0;
            let completelyVisibleStartLineNumber = startLineNumber;
            let completelyVisibleEndLineNumber = endLineNumber;
            if (completelyVisibleStartLineNumber < completelyVisibleEndLineNumber) {
                if (startLineNumberVerticalOffset < verticalOffset1) {
                    completelyVisibleStartLineNumber++;
                }
            }
            if (completelyVisibleStartLineNumber < completelyVisibleEndLineNumber) {
                if (endLineNumberVerticalOffset + lineHeight > verticalOffset2) {
                    completelyVisibleEndLineNumber--;
                }
            }
            return {
                bigNumbersDelta: bigNumbersDelta,
                startLineNumber: startLineNumber,
                endLineNumber: endLineNumber,
                relativeVerticalOffset: linesOffsets,
                centeredLineNumber: centeredLineNumber,
                completelyVisibleStartLineNumber: completelyVisibleStartLineNumber,
                completelyVisibleEndLineNumber: completelyVisibleEndLineNumber,
                lineHeight: this._lineHeight,
            };
        }
        getVerticalOffsetForWhitespaceIndex(whitespaceIndex) {
            this._checkPendingChanges();
            whitespaceIndex = whitespaceIndex | 0;
            const afterLineNumber = this.getAfterLineNumberForWhitespaceIndex(whitespaceIndex);
            let previousLinesHeight;
            if (afterLineNumber >= 1) {
                previousLinesHeight = this._lineHeight * afterLineNumber;
            }
            else {
                previousLinesHeight = 0;
            }
            let previousWhitespacesHeight;
            if (whitespaceIndex > 0) {
                previousWhitespacesHeight = this.getWhitespacesAccumulatedHeight(whitespaceIndex - 1);
            }
            else {
                previousWhitespacesHeight = 0;
            }
            return previousLinesHeight + previousWhitespacesHeight + this._paddingTop;
        }
        getWhitespaceIndexAtOrAfterVerticallOffset(verticalOffset) {
            this._checkPendingChanges();
            verticalOffset = verticalOffset | 0;
            let minWhitespaceIndex = 0;
            let maxWhitespaceIndex = this.getWhitespacesCount() - 1;
            if (maxWhitespaceIndex < 0) {
                return -1;
            }
            // Special case: nothing to be found
            const maxWhitespaceVerticalOffset = this.getVerticalOffsetForWhitespaceIndex(maxWhitespaceIndex);
            const maxWhitespaceHeight = this.getHeightForWhitespaceIndex(maxWhitespaceIndex);
            if (verticalOffset >= maxWhitespaceVerticalOffset + maxWhitespaceHeight) {
                return -1;
            }
            while (minWhitespaceIndex < maxWhitespaceIndex) {
                const midWhitespaceIndex = Math.floor((minWhitespaceIndex + maxWhitespaceIndex) / 2);
                const midWhitespaceVerticalOffset = this.getVerticalOffsetForWhitespaceIndex(midWhitespaceIndex);
                const midWhitespaceHeight = this.getHeightForWhitespaceIndex(midWhitespaceIndex);
                if (verticalOffset >= midWhitespaceVerticalOffset + midWhitespaceHeight) {
                    // vertical offset is after whitespace
                    minWhitespaceIndex = midWhitespaceIndex + 1;
                }
                else if (verticalOffset >= midWhitespaceVerticalOffset) {
                    // Hit
                    return midWhitespaceIndex;
                }
                else {
                    // vertical offset is before whitespace, but midWhitespaceIndex might still be what we're searching for
                    maxWhitespaceIndex = midWhitespaceIndex;
                }
            }
            return minWhitespaceIndex;
        }
        /**
         * Get exactly the whitespace that is layouted at `verticalOffset`.
         *
         * @param verticalOffset The vertical offset.
         * @return Precisely the whitespace that is layouted at `verticaloffset` or null.
         */
        getWhitespaceAtVerticalOffset(verticalOffset) {
            this._checkPendingChanges();
            verticalOffset = verticalOffset | 0;
            const candidateIndex = this.getWhitespaceIndexAtOrAfterVerticallOffset(verticalOffset);
            if (candidateIndex < 0) {
                return null;
            }
            if (candidateIndex >= this.getWhitespacesCount()) {
                return null;
            }
            const candidateTop = this.getVerticalOffsetForWhitespaceIndex(candidateIndex);
            if (candidateTop > verticalOffset) {
                return null;
            }
            const candidateHeight = this.getHeightForWhitespaceIndex(candidateIndex);
            const candidateId = this.getIdForWhitespaceIndex(candidateIndex);
            const candidateAfterLineNumber = this.getAfterLineNumberForWhitespaceIndex(candidateIndex);
            return {
                id: candidateId,
                afterLineNumber: candidateAfterLineNumber,
                verticalOffset: candidateTop,
                height: candidateHeight
            };
        }
        /**
         * Get a list of whitespaces that are positioned between `verticalOffset1` and `verticalOffset2`.
         *
         * @param verticalOffset1 The beginning of the viewport.
         * @param verticalOffset2 The end of the viewport.
         * @return An array with all the whitespaces in the viewport. If no whitespace is in viewport, the array is empty.
         */
        getWhitespaceViewportData(verticalOffset1, verticalOffset2) {
            this._checkPendingChanges();
            verticalOffset1 = verticalOffset1 | 0;
            verticalOffset2 = verticalOffset2 | 0;
            const startIndex = this.getWhitespaceIndexAtOrAfterVerticallOffset(verticalOffset1);
            const endIndex = this.getWhitespacesCount() - 1;
            if (startIndex < 0) {
                return [];
            }
            const result = [];
            for (let i = startIndex; i <= endIndex; i++) {
                const top = this.getVerticalOffsetForWhitespaceIndex(i);
                const height = this.getHeightForWhitespaceIndex(i);
                if (top >= verticalOffset2) {
                    break;
                }
                result.push({
                    id: this.getIdForWhitespaceIndex(i),
                    afterLineNumber: this.getAfterLineNumberForWhitespaceIndex(i),
                    verticalOffset: top,
                    height: height
                });
            }
            return result;
        }
        /**
         * Get all whitespaces.
         */
        getWhitespaces() {
            this._checkPendingChanges();
            return this._arr.slice(0);
        }
        /**
         * The number of whitespaces.
         */
        getWhitespacesCount() {
            this._checkPendingChanges();
            return this._arr.length;
        }
        /**
         * Get the `id` for whitespace at index `index`.
         *
         * @param index The index of the whitespace.
         * @return `id` of whitespace at `index`.
         */
        getIdForWhitespaceIndex(index) {
            this._checkPendingChanges();
            index = index | 0;
            return this._arr[index].id;
        }
        /**
         * Get the `afterLineNumber` for whitespace at index `index`.
         *
         * @param index The index of the whitespace.
         * @return `afterLineNumber` of whitespace at `index`.
         */
        getAfterLineNumberForWhitespaceIndex(index) {
            this._checkPendingChanges();
            index = index | 0;
            return this._arr[index].afterLineNumber;
        }
        /**
         * Get the `height` for whitespace at index `index`.
         *
         * @param index The index of the whitespace.
         * @return `height` of whitespace at `index`.
         */
        getHeightForWhitespaceIndex(index) {
            this._checkPendingChanges();
            index = index | 0;
            return this._arr[index].height;
        }
    }
    exports.LinesLayout = LinesLayout;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZXNMYXlvdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vdmlld0xheW91dC9saW5lc0xheW91dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBTSxjQUFjO1FBTW5CO1lBQ0MsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDekIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7WUFDbkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7WUFDbkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDcEIsQ0FBQztRQUVNLE1BQU0sQ0FBQyxDQUFtQjtZQUNoQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QixDQUFDO1FBRU0sTUFBTSxDQUFDLENBQWlCO1lBQzlCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7UUFFTSxNQUFNLENBQUMsQ0FBaUI7WUFDOUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDeEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkIsQ0FBQztRQUVNLFVBQVU7WUFDaEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFTSxNQUFNLENBQUMsV0FBd0I7WUFDckMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDdkIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJ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