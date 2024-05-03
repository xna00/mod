/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/diff/diff", "vs/editor/common/diff/linesDiffComputer", "./rangeMapping", "vs/base/common/strings", "vs/editor/common/core/range", "vs/base/common/assert", "vs/editor/common/core/lineRange"], function (require, exports, diff_1, linesDiffComputer_1, rangeMapping_1, strings, range_1, assert_1, lineRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffComputer = exports.LegacyLinesDiffComputer = void 0;
    const MINIMUM_MATCHING_CHARACTER_LENGTH = 3;
    class LegacyLinesDiffComputer {
        computeDiff(originalLines, modifiedLines, options) {
            const diffComputer = new DiffComputer(originalLines, modifiedLines, {
                maxComputationTime: options.maxComputationTimeMs,
                shouldIgnoreTrimWhitespace: options.ignoreTrimWhitespace,
                shouldComputeCharChanges: true,
                shouldMakePrettyDiff: true,
                shouldPostProcessCharChanges: true,
            });
            const result = diffComputer.computeDiff();
            const changes = [];
            let lastChange = null;
            for (const c of result.changes) {
                let originalRange;
                if (c.originalEndLineNumber === 0) {
                    // Insertion
                    originalRange = new lineRange_1.LineRange(c.originalStartLineNumber + 1, c.originalStartLineNumber + 1);
                }
                else {
                    originalRange = new lineRange_1.LineRange(c.originalStartLineNumber, c.originalEndLineNumber + 1);
                }
                let modifiedRange;
                if (c.modifiedEndLineNumber === 0) {
                    // Deletion
                    modifiedRange = new lineRange_1.LineRange(c.modifiedStartLineNumber + 1, c.modifiedStartLineNumber + 1);
                }
                else {
                    modifiedRange = new lineRange_1.LineRange(c.modifiedStartLineNumber, c.modifiedEndLineNumber + 1);
                }
                let change = new rangeMapping_1.DetailedLineRangeMapping(originalRange, modifiedRange, c.charChanges?.map(c => new rangeMapping_1.RangeMapping(new range_1.Range(c.originalStartLineNumber, c.originalStartColumn, c.originalEndLineNumber, c.originalEndColumn), new range_1.Range(c.modifiedStartLineNumber, c.modifiedStartColumn, c.modifiedEndLineNumber, c.modifiedEndColumn))));
                if (lastChange) {
                    if (lastChange.modified.endLineNumberExclusive === change.modified.startLineNumber
                        || lastChange.original.endLineNumberExclusive === change.original.startLineNumber) {
                        // join touching diffs. Probably moving diffs up/down in the algorithm causes touching diffs.
                        change = new rangeMapping_1.DetailedLineRangeMapping(lastChange.original.join(change.original), lastChange.modified.join(change.modified), lastChange.innerChanges && change.innerChanges ?
                            lastChange.innerChanges.concat(change.innerChanges) : undefined);
                        changes.pop();
                    }
                }
                changes.push(change);
                lastChange = change;
            }
            (0, assert_1.assertFn)(() => {
                return (0, assert_1.checkAdjacentItems)(changes, (m1, m2) => m2.original.startLineNumber - m1.original.endLineNumberExclusive === m2.modified.startLineNumber - m1.modified.endLineNumberExclusive &&
                    // There has to be an unchanged line in between (otherwise both diffs should have been joined)
                    m1.original.endLineNumberExclusive < m2.original.startLineNumber &&
                    m1.modified.endLineNumberExclusive < m2.modified.startLineNumber);
            });
            return new linesDiffComputer_1.LinesDiff(changes, [], result.quitEarly);
        }
    }
    exports.LegacyLinesDiffComputer = LegacyLinesDiffComputer;
    function computeDiff(originalSequence, modifiedSequence, continueProcessingPredicate, pretty) {
        const diffAlgo = new diff_1.LcsDiff(originalSequence, modifiedSequence, continueProcessingPredicate);
        return diffAlgo.ComputeDiff(pretty);
    }
    class LineSequence {
        constructor(lines) {
            const startColumns = [];
            const endColumns = [];
            for (let i = 0, length = lines.length; i < length; i++) {
                startColumns[i] = getFirstNonBlankColumn(lines[i], 1);
                endColumns[i] = getLastNonBlankColumn(lines[i], 1);
            }
            this.lines = lines;
            this._startColumns = startColumns;
            this._endColumns = endColumns;
        }
        getElements() {
            const elements = [];
            for (let i = 0, len = this.lines.length; i < len; i++) {
                elements[i] = this.lines[i].substring(this._startColumns[i] - 1, this._endColumns[i] - 1);
            }
            return elements;
        }
        getStrictElement(index) {
            return this.lines[index];
        }
        getStartLineNumber(i) {
            return i + 1;
        }
        getEndLineNumber(i) {
            return i + 1;
        }
        createCharSequence(shouldIgnoreTrimWhitespace, startIndex, endIndex) {
            const charCodes = [];
            const lineNumbers = [];
            const columns = [];
            let len = 0;
            for (let index = startIndex; index <= endIndex; index++) {
                const lineContent = this.lines[index];
                const startColumn = (shouldIgnoreTrimWhitespace ? this._startColumns[index] : 1);
                const endColumn = (shouldIgnoreTrimWhitespace ? this._endColumns[index] : lineContent.length + 1);
                for (let col = startColumn; col < endColumn; col++) {
                    charCodes[len] = lineContent.charCodeAt(col - 1);
                    lineNumbers[len] = index + 1;
                    columns[len] = col;
                    len++;
                }
                if (!shouldIgnoreTrimWhitespace && index < endIndex) {
                    // Add \n if trim whitespace is not ignored
                    charCodes[len] = 10 /* CharCode.LineFeed */;
                    lineNumbers[len] = index + 1;
                    columns[len] = lineContent.length + 1;
                    len++;
                }
            }
            return new CharSequence(charCodes, lineNumbers, columns);
        }
    }
    class CharSequence {
        constructor(charCodes, lineNumbers, columns) {
            this._charCodes = charCodes;
            this._lineNumbers = lineNumbers;
            this._columns = columns;
        }
        toString() {
            return ('[' + this._charCodes.map((s, idx) => (s === 10 /* CharCode.LineFeed */ ? '\\n' : String.fromCharCode(s)) + `-(${this._lineNumbers[idx]},${this._columns[idx]})`).join(', ') + ']');
        }
        _assertIndex(index, arr) {
            if (index < 0 || index >= arr.length) {
                throw new Error(`Illegal index`);
            }
        }
        getElements() {
            return this._charCodes;
        }
        getStartLineNumber(i) {
            if (i > 0 && i === this._lineNumbers.length) {
                // the start line number of the element after the last element
                // is the end line number of the last element
                return this.getEndLineNumber(i - 1);
            }
            this._assertIndex(i, this._lineNumbers);
            return this._lineNumbers[i];
        }
        getEndLineNumber(i) {
            if (i === -1) {
                // the end line number of the element before the first element
                // is the start line number of the first element
                return this.getStartLineNumber(i + 1);
            }
            this._assertIndex(i, this._lineNumbers);
            if (this._charCodes[i] === 10 /* CharCode.LineFeed */) {
                return this._lineNumbers[i] + 1;
            }
            return this._lineNumbers[i];
        }
        getStartColumn(i) {
            if (i > 0 && i === this._columns.length) {
                // the start column of the element after the last element
                // is the end column of the last element
                return this.getEndColumn(i - 1);
            }
            this._assertIndex(i, this._columns);
            return this._columns[i];
        }
        getEndColumn(i) {
            if (i === -1) {
                // the end column of the element before the first element
                // is the start column of the first element
                return this.getStartColumn(i + 1);
            }
            this._assertIndex(i, this._columns);
            if (this._charCodes[i] === 10 /* CharCode.LineFeed */) {
                return 1;
            }
            return this._columns[i] + 1;
        }
    }
    class CharChange {
        constructor(originalStartLineNumber, originalStartColumn, originalEndLineNumber, originalEndColumn, modifiedStartLineNumber, modifiedStartColumn, modifiedEndLineNumber, modifiedEndColumn) {
            this.originalStartLineNumber = originalStartLineNumber;
            this.originalStartColumn = originalStartColumn;
            this.originalEndLineNumber = originalEndLineNumber;
            this.originalEndColumn = originalEndColumn;
            this.modifiedStartLineNumber = modifiedStartLineNumber;
            this.modifiedStartColumn = modifiedStartColumn;
            this.modifiedEndLineNumber = modifiedEndLineNumber;
            this.modifiedEndColumn = modifiedEndColumn;
        }
        static createFromDiffChange(diffChange, originalCharSequence, modifiedCharSequence) {
            const originalStartLineNumber = originalCharSequence.getStartLineNumber(diffChange.originalStart);
            const originalStartColumn = originalCharSequence.getStartColumn(diffChange.originalStart);
            const originalEndLineNumber = originalCharSequence.getEndLineNumber(diffChange.originalStart + diffChange.originalLength - 1);
            const originalEndColumn = originalCharSequence.getEndColumn(diffChange.originalStart + diffChange.originalLength - 1);
            const modifiedStartLineNumber = modifiedCharSequence.getStartLineNumber(diffChange.modifiedStart);
            const modifiedStartColumn = modifiedCharSequence.getStartColumn(diffChange.modifiedStart);
            const modifiedEndLineNumber = modifiedCharSequence.getEndLineNumber(diffChange.modifiedStart + diffChange.modifiedLength - 1);
            const modifiedEndColumn = modifiedCharSequence.getEndColumn(diffChange.modifiedStart + diffChange.modifiedLength - 1);
            return new CharChange(originalStartLineNumber, originalStartColumn, originalEndLineNumber, originalEndColumn, modifiedStartLineNumber, modifiedStartColumn, modifiedEndLineNumber, modifiedEndColumn);
        }
    }
    function postProcessCharChanges(rawChanges) {
        if (rawChanges.length <= 1) {
            return rawChanges;
        }
        const result = [rawChanges[0]];
        let prevChange = result[0];
        for (let i = 1, len = rawChanges.length; i < len; i++) {
            const currChange = rawChanges[i];
            const originalMatchingLength = currChange.originalStart - (prevChange.originalStart + prevChange.originalLength);
            const modifiedMatchingLength = currChange.modifiedStart - (prevChange.modifiedStart + prevChange.modifiedLength);
            // Both of the above should be equal, but the continueProcessingPredicate may prevent this from being true
            const matchingLength = Math.min(originalMatchingLength, modifiedMatchingLength);
            if (matchingLength < MINIMUM_MATCHING_CHARACTER_LENGTH) {
                // Merge the current change into the previous one
                prevChange.originalLength = (currChange.originalStart + currChange.originalLength) - prevChange.originalStart;
                prevChange.modifiedLength = (currChange.modifiedStart + currChange.modifiedLength) - prevChange.modifiedStart;
            }
            else {
                // Add the current change
                result.push(currChange);
                prevChange = currChange;
            }
        }
        return result;
    }
    class LineChange {
        constructor(originalStartLineNumber, originalEndLineNumber, modifiedStartLineNumber, modifiedEndLineNumber, charChanges) {
            this.originalStartLineNumber = originalStartLineNumber;
            this.originalEndLineNumber = originalEndLineNumber;
            this.modifiedStartLineNumber = modifiedStartLineNumber;
            this.modifiedEndLineNumber = modifiedEndLineNumber;
            this.charChanges = charChanges;
        }
        static createFromDiffResult(shouldIgnoreTrimWhitespace, diffChange, originalLineSequence, modifiedLineSequence, continueCharDiff, shouldComputeCharChanges, shouldPostProcessCharChanges) {
            let originalStartLineNumber;
            let originalEndLineNumber;
            let modifiedStartLineNumber;
            let modifiedEndLineNumber;
            let charChanges = undefined;
            if (diffChange.originalLength === 0) {
                originalStartLineNumber = originalLineSequence.getStartLineNumber(diffChange.originalStart) - 1;
                originalEndLineNumber = 0;
            }
            else {
                originalStartLineNumber = originalLineSequence.getStartLineNumber(diffChange.originalStart);
                originalEndLineNumber = originalLineSequence.getEndLineNumber(diffChange.originalStart + diffChange.originalLength - 1);
            }
            if (diffChange.modifiedLength === 0) {
                modifiedStartLineNumber = modifiedLineSequence.getStartLineNumber(diffChange.modifiedStart) - 1;
                modifiedEndLineNumber = 0;
            }
            else {
                modifiedStartLineNumber = modifiedLineSequence.getStartLineNumber(diffChange.modifiedStart);
                modifiedEndLineNumber = modifiedLineSequence.getEndLineNumber(diffChange.modifiedStart + diffChange.modifiedLength - 1);
            }
            if (shouldComputeCharChanges && diffChange.originalLength > 0 && diffChange.originalLength < 20 && diffChange.modifiedLength > 0 && diffChange.modifiedLength < 20 && continueCharDiff()) {
                // Compute character changes for diff chunks of at most 20 lines...
                const originalCharSequence = originalLineSequence.createCharSequence(shouldIgnoreTrimWhitespace, diffChange.originalStart, diffChange.originalStart + diffChange.originalLength - 1);
                const modifiedCharSequence = modifiedLineSequence.createCharSequence(shouldIgnoreTrimWhitespace, diffChange.modifiedStart, diffChange.modifiedStart + diffChange.modifiedLength - 1);
                if (originalCharSequence.getElements().length > 0 && modifiedCharSequence.getElements().length > 0) {
                    let rawChanges = computeDiff(originalCharSequence, modifiedCharSequence, continueCharDiff, true).changes;
                    if (shouldPostProcessCharChanges) {
                        rawChanges = postProcessCharChanges(rawChanges);
                    }
                    charChanges = [];
                    for (let i = 0, length = rawChanges.length; i < length; i++) {
                        charChanges.push(CharChange.createFromDiffChange(rawChanges[i], originalCharSequence, modifiedCharSequence));
                    }
                }
            }
            return new LineChange(originalStartLineNumber, originalEndLineNumber, modifiedStartLineNumber, modifiedEndLineNumber, charChanges);
        }
    }
    class DiffComputer {
        constructor(originalLines, modifiedLines, opts) {
            this.shouldComputeCharChanges = opts.shouldComputeCharChanges;
            this.shouldPostProcessCharChanges = opts.shouldPostProcessCharChanges;
            this.shouldIgnoreTrimWhitespace = opts.shouldIgnoreTrimWhitespace;
            this.shouldMakePrettyDiff = opts.shouldMakePrettyDiff;
            this.originalLines = originalLines;
            this.modifiedLines = modifiedLines;
            this.original = new LineSequence(originalLines);
            this.modified = new LineSequence(modifiedLines);
            this.continueLineDiff = createContinueProcessingPredicate(opts.maxComputationTime);
            this.continueCharDiff = createContinueProcessingPredicate(opts.maxComputationTime === 0 ? 0 : Math.min(opts.maxComputationTime, 5000)); // never run after 5s for character changes...
        }
        computeDiff() {
            if (this.original.lines.length === 1 && this.original.lines[0].length === 0) {
                // empty original => fast path
                if (this.modified.lines.length === 1 && this.modified.lines[0].length === 0) {
                    return {
                        quitEarly: false,
                        changes: []
                    };
                }
                return {
                    quitEarly: false,
                    changes: [{
                            originalStartLineNumber: 1,
                            originalEndLineNumber: 1,
                            modifiedStartLineNumber: 1,
                            modifiedEndLineNumber: this.modified.lines.length,
                            charChanges: undefined
                        }]
                };
            }
            if (this.modified.lines.length === 1 && this.modified.lines[0].length === 0) {
                // empty modified => fast path
                return {
                    quitEarly: false,
                    changes: [{
                            originalStartLineNumber: 1,
                            originalEndLineNumber: this.original.lines.length,
                            modifiedStartLineNumber: 1,
                            modifiedEndLineNumber: 1,
                            charChanges: undefined
                        }]
                };
            }
            const diffResult = computeDiff(this.original, this.modified, this.continueLineDiff, this.shouldMakePrettyDiff);
            const rawChanges = diffResult.changes;
            const quitEarly = diffResult.quitEarly;
            // The diff is always computed with ignoring trim whitespace
            // This ensures we get the prettiest diff
            if (this.shouldIgnoreTrimWhitespace) {
                const lineChanges = [];
                for (let i = 0, length = rawChanges.length; i < length; i++) {
                    lineChanges.push(LineChange.createFromDiffResult(this.shouldIgnoreTrimWhitespace, rawChanges[i], this.original, this.modified, this.continueCharDiff, this.shouldComputeCharChanges, this.shouldPostProcessCharChanges));
                }
                return {
                    quitEarly: quitEarly,
                    changes: lineChanges
                };
            }
            // Need to post-process and introduce changes where the trim whitespace is different
            // Note that we are looping starting at -1 to also cover the lines before the first change
            const result = [];
            let originalLineIndex = 0;
            let modifiedLineIndex = 0;
            for (let i = -1 /* !!!! */, len = rawChanges.length; i < len; i++) {
                const nextChange = (i + 1 < len ? rawChanges[i + 1] : null);
                const originalStop = (nextChange ? nextChange.originalStart : this.originalLines.length);
                const modifiedStop = (nextChange ? nextChange.modifiedStart : this.modifiedLines.length);
                while (originalLineIndex < originalStop && modifiedLineIndex < modifiedStop) {
                    const originalLine = this.originalLines[originalLineIndex];
                    const modifiedLine = this.modifiedLines[modifiedLineIndex];
                    if (originalLine !== modifiedLine) {
                        // These lines differ only in trim whitespace
                        // Check the leading whitespace
                        {
                            let originalStartColumn = getFirstNonBlankColumn(originalLine, 1);
                            let modifiedStartColumn = getFirstNonBlankColumn(modifiedLine, 1);
                            while (originalStartColumn > 1 && modifiedStartColumn > 1) {
                                const originalChar = originalLine.charCodeAt(originalStartColumn - 2);
                                const modifiedChar = modifiedLine.charCodeAt(modifiedStartColumn - 2);
                                if (originalChar !== modifiedChar) {
                                    break;
                                }
                                originalStartColumn--;
                                modifiedStartColumn--;
                            }
                            if (originalStartColumn > 1 || modifiedStartColumn > 1) {
                                this._pushTrimWhitespaceCharChange(result, originalLineIndex + 1, 1, originalStartColumn, modifiedLineIndex + 1, 1, modifiedStartColumn);
                            }
                        }
                        // Check the trailing whitespace
                        {
                            let originalEndColumn = getLastNonBlankColumn(originalLine, 1);
                            let modifiedEndColumn = getLastNonBlankColumn(modifiedLine, 1);
                            const originalMaxColumn = originalLine.length + 1;
                            const modifiedMaxColumn = modifiedLine.length + 1;
                            while (originalEndColumn < originalMaxColumn && modifiedEndColumn < modifiedMaxColumn) {
                                const originalChar = originalLine.charCodeAt(originalEndColumn - 1);
                                const modifiedChar = originalLine.charCodeAt(modifiedEndColumn - 1);
                                if (originalChar !== modifiedChar) {
                                    break;
                                }
                                originalEndColumn++;
                                modifiedEndColumn++;
                            }
                            if (originalEndColumn < originalMaxColumn || modifiedEndColumn < modifiedMaxColumn) {
                                this._pushTrimWhitespaceCharChange(result, originalLineIndex + 1, originalEndColumn, originalMaxColumn, modifiedLineIndex + 1, modifiedEndColumn, modifiedMaxColumn);
                            }
                        }
                    }
                    originalLineIndex++;
                    modifiedLineIndex++;
                }
                if (nextChange) {
                    // Emit the actual change
                    result.push(LineChange.createFromDiffResult(this.shouldIgnoreTrimWhitespace, nextChange, this.original, this.modified, this.continueCharDiff, this.shouldComputeCharChanges, this.shouldPostProcessCharChanges));
                    originalLineIndex += nextChange.originalLength;
                    modifiedLineIndex += nextChange.modifiedLength;
                }
            }
            return {
                quitEarly: quitEarly,
                changes: result
            };
        }
        _pushTrimWhitespaceCharChange(result, originalLineNumber, originalStartColumn, originalEndColumn, modifiedLineNumber, modifiedStartColumn, modifiedEndColumn) {
            if (this._mergeTrimWhitespaceCharChange(result, originalLineNumber, originalStartColumn, originalEndColumn, modifiedLineNumber, modifiedStartColumn, modifiedEndColumn)) {
                // Merged into previous
                return;
            }
            let charChanges = undefined;
            if (this.shouldComputeCharChanges) {
                charChanges = [new CharChange(originalLineNumber, originalStartColumn, originalLineNumber, originalEndColumn, modifiedLineNumber, modifiedStartColumn, modifiedLineNumber, modifiedEndColumn)];
            }
            result.push(new LineChange(originalLineNumber, originalLineNumber, modifiedLineNumber, modifiedLineNumber, charChanges));
        }
        _mergeTrimWhitespaceCharChange(result, originalLineNumber, originalStartColumn, originalEndColumn, modifiedLineNumber, modifiedStartColumn, modifiedEndColumn) {
            const len = result.length;
            if (len === 0) {
                return false;
            }
            const prevChange = result[len - 1];
            if (prevChange.originalEndLineNumber === 0 || prevChange.modifiedEndLineNumber === 0) {
                // Don't merge with inserts/deletes
                return false;
            }
            if (prevChange.originalEndLineNumber === originalLineNumber && prevChange.modifiedEndLineNumber === modifiedLineNumber) {
                if (this.shouldComputeCharChanges && prevChange.charChanges) {
                    prevChange.charChanges.push(new CharChange(originalLineNumber, originalStartColumn, originalLineNumber, originalEndColumn, modifiedLineNumber, modifiedStartColumn, modifiedLineNumber, modifiedEndColumn));
                }
                return true;
            }
            if (prevChange.originalEndLineNumber + 1 === originalLineNumber && prevChange.modifiedEndLineNumber + 1 === modifiedLineNumber) {
                prevChange.originalEndLineNumber = originalLineNumber;
                prevChange.modifiedEndLineNumber = modifiedLineNumber;
                if (this.shouldComputeCharChanges && prevChange.charChanges) {
                    prevChange.charChanges.push(new CharChange(originalLineNumber, originalStartColumn, originalLineNumber, originalEndColumn, modifiedLineNumber, modifiedStartColumn, modifiedLineNumber, modifiedEndColumn));
                }
                return true;
            }
            return false;
        }
    }
    exports.DiffComputer = DiffComputer;
    function getFirstNonBlankColumn(txt, defaultValue) {
        const r = strings.firstNonWhitespaceIndex(txt);
        if (r === -1) {
            return defaultValue;
        }
        return r + 1;
    }
    function getLastNonBlankColumn(txt, defaultValue) {
        const r = strings.lastNonWhitespaceIndex(txt);
        if (r === -1) {
            return defaultValue;
        }
        return r + 2;
    }
    function createContinueProcessingPredicate(maximumRuntime) {
        if (maximumRuntime === 0) {
            return () => true;
        }
        const startTime = Date.now();
        return () => {
            return Date.now() - startTime < maximumRuntime;
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVnYWN5TGluZXNEaWZmQ29tcHV0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vZGlmZi9sZWdhY3lMaW5lc0RpZmZDb21wdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBTSxpQ0FBaUMsR0FBRyxDQUFDLENBQUM7SUFFNUMsTUFBYSx1QkFBdUI7UUFDbkMsV0FBVyxDQUFDLGFBQXVCLEVBQUUsYUFBdUIsRUFBRSxPQUFrQztZQUMvRixNQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQyxhQUFhLEVBQUUsYUFBYSxFQUFFO2dCQUNuRSxrQkFBa0IsRUFBRSxPQUFPLENBQUMsb0JBQW9CO2dCQUNoRCwwQkFBMEIsRUFBRSxPQUFPLENBQUMsb0JBQW9CO2dCQUN4RCx3QkFBd0IsRUFBRSxJQUFJO2dCQUM5QixvQkFBb0IsRUFBRSxJQUFJO2dCQUMxQiw0QkFBNEIsRUFBRSxJQUFJO2FBQ2xDLENBQUMsQ0FBQztZQUNILE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMxQyxNQUFNLE9BQU8sR0FBK0IsRUFBRSxDQUFDO1lBQy9DLElBQUksVUFBVSxHQUFvQyxJQUFJLENBQUM7WUFHdkQsS0FBSyxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2hDLElBQUksYUFBd0IsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLENBQUMscUJBQXFCLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ25DLFlBQVk7b0JBQ1osYUFBYSxHQUFHLElBQUkscUJBQVMsQ0FBQyxDQUFDLENBQUMsdUJBQXVCLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyx1QkFBdUIsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDN0YsQ0FBQztxQkFBTSxD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