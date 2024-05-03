/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/strings", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeBase", "vs/editor/common/core/eolCounter", "vs/editor/common/core/textChange", "vs/base/common/lifecycle"], function (require, exports, event_1, strings, range_1, model_1, pieceTreeBase_1, eolCounter_1, textChange_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PieceTreeTextBuffer = void 0;
    class PieceTreeTextBuffer extends lifecycle_1.Disposable {
        constructor(chunks, BOM, eol, containsRTL, containsUnusualLineTerminators, isBasicASCII, eolNormalized) {
            super();
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._BOM = BOM;
            this._mightContainNonBasicASCII = !isBasicASCII;
            this._mightContainRTL = containsRTL;
            this._mightContainUnusualLineTerminators = containsUnusualLineTerminators;
            this._pieceTree = new pieceTreeBase_1.PieceTreeBase(chunks, eol, eolNormalized);
        }
        // #region TextBuffer
        equals(other) {
            if (!(other instanceof PieceTreeTextBuffer)) {
                return false;
            }
            if (this._BOM !== other._BOM) {
                return false;
            }
            if (this.getEOL() !== other.getEOL()) {
                return false;
            }
            return this._pieceTree.equal(other._pieceTree);
        }
        mightContainRTL() {
            return this._mightContainRTL;
        }
        mightContainUnusualLineTerminators() {
            return this._mightContainUnusualLineTerminators;
        }
        resetMightContainUnusualLineTerminators() {
            this._mightContainUnusualLineTerminators = false;
        }
        mightContainNonBasicASCII() {
            return this._mightContainNonBasicASCII;
        }
        getBOM() {
            return this._BOM;
        }
        getEOL() {
            return this._pieceTree.getEOL();
        }
        createSnapshot(preserveBOM) {
            return this._pieceTree.createSnapshot(preserveBOM ? this._BOM : '');
        }
        getOffsetAt(lineNumber, column) {
            return this._pieceTree.getOffsetAt(lineNumber, column);
        }
        getPositionAt(offset) {
            return this._pieceTree.getPositionAt(offset);
        }
        getRangeAt(start, length) {
            const end = start + length;
            const startPosition = this.getPositionAt(start);
            const endPosition = this.getPositionAt(end);
            return new range_1.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column);
        }
        getValueInRange(range, eol = 0 /* EndOfLinePreference.TextDefined */) {
            if (range.isEmpty()) {
                return '';
            }
            const lineEnding = this._getEndOfLine(eol);
            return this._pieceTree.getValueInRange(range, lineEnding);
        }
        getValueLengthInRange(range, eol = 0 /* EndOfLinePreference.TextDefined */) {
            if (range.isEmpty()) {
                return 0;
            }
            if (range.startLineNumber === range.endLineNumber) {
                return (range.endColumn - range.startColumn);
            }
            const startOffset = this.getOffsetAt(range.startLineNumber, range.startColumn);
            const endOffset = this.getOffsetAt(range.endLineNumber, range.endColumn);
            // offsets use the text EOL, so we need to compensate for length differences
            // if the requested EOL doesn't match the text EOL
            let eolOffsetCompensation = 0;
            const desiredEOL = this._getEndOfLine(eol);
            const actualEOL = this.getEOL();
            if (desiredEOL.length !== actualEOL.length) {
                const delta = desiredEOL.length - actualEOL.length;
                const eolCount = range.endLineNumber - range.startLineNumber;
                eolOffsetCompensation = delta * eolCount;
            }
            return endOffset - startOffset + eolOffsetCompensation;
        }
        getCharacterCountInRange(range, eol = 0 /* EndOfLinePreference.TextDefined */) {
            if (this._mightContainNonBasicASCII) {
                // we must count by iterating
                let result = 0;
                const fromLineNumber = range.startLineNumber;
                const toLineNumber = range.endLineNumber;
                for (let lineNumber = fromLineNumber; lineNumber <= toLineNumber; lineNumber++) {
                    const lineContent = this.getLineContent(lineNumber);
                    const fromOffset = (lineNumber === fromLineNumber ? range.startColumn - 1 : 0);
                    const toOffset = (lineNumber === toLineNumber ? range.endColumn - 1 : lineContent.length);
                    for (let offset = fromOffset; offset < toOffset; offset++) {
                        if (strings.isHighSurrogate(lineContent.charCodeAt(offset))) {
                            result = result + 1;
                            offset = offset + 1;
                        }
                        else {
                            result = result + 1;
                        }
                    }
                }
                result += this._getEndOfLine(eol).length * (toLineNumber - fromLineNumber);
                return result;
            }
            return this.getValueLengthInRange(range, eol);
        }
        getLength() {
            return this._pieceTree.getLength();
        }
        getLineCount() {
            return this._pieceTree.getLineCount();
        }
        getLinesContent() {
            return this._pieceTree.getLinesContent();
        }
        getLineContent(lineNumber) {
            return this._pieceTree.getLineContent(lineNumber);
        }
        getLineCharCode(lineNumber, index) {
            return this._pieceTree.getLineCharCode(lineNumber, index);
        }
        getCharCode(offset) {
            return this._pieceTree.getCharCode(offset);
        }
        getLineLength(lineNumber) {
            return this._pieceTree.getLineLength(lineNumber);
        }
        getLineMinColumn(lineNumber) {
            return 1;
        }
        getLineMaxColumn(lineNumber) {
            return this.getLineLength(lineNumber) + 1;
        }
        getLineFirstNonWhitespaceColumn(lineNumber) {
            const result = strings.firstNonWhitespaceIndex(this.getLineContent(lineNumber));
            if (result === -1) {
                return 0;
            }
            return result + 1;
        }
        getLineLastNonWhitespaceColumn(lineNumber) {
            const result = strings.lastNonWhitespaceIndex(this.getLineContent(lineNumber));
            if (result === -1) {
                return 0;
            }
            return result + 2;
        }
        _getEndOfLine(eol) {
            switch (eol) {
                case 1 /* EndOfLinePreference.LF */:
                    return '\n';
                case 2 /* EndOfLinePreference.CRLF */:
                    return '\r\n';
                case 0 /* EndOfLinePreference.TextDefined */:
                    return this.getEOL();
                default:
                    throw new Error('Unknown EOL preference');
            }
        }
        setEOL(newEOL) {
            this._pieceTree.setEOL(newEOL);
        }
        applyEdits(rawOperations, recordTrimAutoWhitespace, computeUndoEdits) {
            let mightContainRTL = this._mightContainRTL;
            let mightContainUnusualLineTerminators = this._mightContainUnusualLineTerminators;
            let mightContainNonBasicASCII = this._mightContainNonBasicASCII;
            let canReduceOperations = true;
            let operations = [];
            for (let i = 0; i < rawOperations.length; i++) {
                const op = rawOperations[i];
                if (canReduceOperations && op._isTracked) {
                    canReduceOperations = false;
                }
                const validatedRange = op.range;
                if (op.text) {
                    let textMightContainNonBasicASCII = true;
                    if (!mightContainNonBasicASCII) {
                        textMightContainNonBasicASCII = !strings.isBasicASCII(op.text);
                        mightContainNonBasicASCII = textMightContainNonBasicASCII;
                    }
                    if (!mightContainRTL && textMightContainNonBasicASCII) {
                        // check if the new inserted text contains RTL
                        mightContainRTL = strings.containsRTL(op.text);
                    }
                    if (!mightContainUnusualLineTerminators && textMightContainNonBasicASCII) {
                        // check if the new inserted text contains unusual line terminators
                        mightContainUnusualLineTerminators = strings.containsUnusualLineTerminators(op.text);
                    }
                }
                let validText = '';
                let eolCount = 0;
                let firstLineLength = 0;
                let lastLineLength = 0;
                if (op.text) {
                    let strEOL;
                    [eolCount, firstLineLength, lastLineLength, strEOL] = (0, eolCounter_1.countEOL)(op.text);
                    const bufferEOL = this.getEOL();
                    const expectedStrEOL = (bufferEOL === '\r\n' ? 2 /* StringEOL.CRLF */ : 1 /* StringEOL.LF */);
                    if (strEOL === 0 /* StringEOL.Unknown */ || strEOL === expectedStrEOL) {
                        validText = op.text;
                    }
                    else {
                        validText = op.text.replace(/\r\n|\r|\n/g, bufferEOL);
                    }
                }
                operations[i] = {
                    sortIndex: i,
                    identifier: op.identifier || null,
                    range: validatedRange,
                    rangeOffset: this.getOffsetAt(validatedRange.startLineNumber, validatedRange.startColumn),
                    rangeLength: this.getValueLengthInRange(validatedRange),
                    text: validText,
                    eolCount: eolCount,
                    firstLineLength: firstLineLength,
                    lastLineLength: lastLineLength,
                    forceMoveMarkers: Boolean(op.forceMoveMarkers),
                    isAutoWhitespaceEdit: op.isAutoWhitespaceEdit || false
                };
            }
            // Sort operations ascending
            operations.sort(PieceTreeTextBuffer._sortOpsAscending);
            let hasTouchingRanges = false;
            for (let i = 0, count = operations.length - 1; i < count; i++) {
                const rangeEnd = operations[i].range.getEndPosition();
                const nextRangeStart = operations[i + 1].range.getStartPosition();
                if (nextRangeStart.isBeforeOrEqual(rangeEnd)) {
                    if (nextRangeStart.isBefore(rangeEnd)) {
                        // overlapping ranges
                        throw new Error('Overlapping ranges are not allowed!');
                    }
                    hasTouchingRanges = true;
                }
            }
            if (canReduceOperations) {
                operations = this._reduceOperations(operations);
            }
            // Delta encode operations
            const reverseRanges = (computeUndoEdits || recordTrimAutoWhitespace ? PieceTreeTextBuffer._getInverseEditRanges(operations) : []);
            const newTrimAutoWhitespaceCandidates = [];
            if (recordTrimAutoWhitespace) {
                for (let i = 0; i < operations.length; i++) {
                    const op = operations[i];
                    const reverseRange = reverseRanges[i];
                    if (op.isAutoWhitespaceEdit && op.range.isEmpty()) {
                        // Record already the future line numbers that might be auto whitespace removal candidates on next edit
                        for (let lineNumber = reverseRange.startLineNumber; lineNumber <= reverseRange.endLineNumber; lineNumber++) {
                            let currentLineContent = '';
                            if (lineNumber === reverseRange.startLineNumber) {
                                currentLineContent = this.getLineContent(op.range.startLineNumber);
                                if (strings.firstNonWhitespaceIndex(currentLineContent) !== -1) {
                                    continue;
                                }
                            }
                            newTrimAutoWhitespaceCandidates.push({ lineNumber: lineNumber, oldContent: currentLineContent });
                        }
                    }
                }
            }
            let reverseOperations = null;
            if (computeUndoEdits) {
                let reverseRangeDeltaOffset = 0;
                reverseOperations = [];
                for (let i = 0; i < operations.length; i++) {
                    const op = operations[i];
                    const reverseRange = reverseRanges[i];
                    const bufferText = this.getValueInRange(op.range);
                    const reverseRangeOffset = op.rangeOffset + reverseRangeDeltaOffset;
                    reverseRangeDeltaOffset += (op.text.length - bufferText.length);
                    reverseOperations[i] = {
                        sortIndex: op.sortIndex,
                        identifier: op.identifier,
                        range: reverseRange,
                        text: bufferText,
                        textChange: new textChange_1.TextChange(op.rangeOffset, bufferText, reverseRangeOffset, op.text)
                    };
                }
                // Can only sort reverse operations when the order is not significant
                if (!hasTouchingRanges) {
                    reverseOperations.sort((a, b) => a.sortIndex - b.sortIndex);
                }
            }
            this._mightContainRTL = mightContainRTL;
            this._mightContainUnusualLineTerminators = mightContainUnusualLineTerminators;
            this._mightContainNonBasicASCII = mightContainNonBasicASCII;
            const contentChanges = this._doApplyEdits(operations);
            let trimAutoWhitespaceLineNumbers = null;
            if (recordTrimAutoWhitespace && newTrimAutoWhitespaceCandidates.length > 0) {
                // sort line numbers auto whitespace removal candidates for next edit descending
                newTrimAutoWhitespaceCandidates.sort((a, b) => b.lineNumber - a.lineNumber);
                trimAutoWhitespaceLineNumbers = [];
                for (let i = 0, len = newTrimAutoWhitespaceCandidates.length; i < len; i++) {
                    const lineNumber = newTrimAutoWhitespaceCandidates[i].lineNumber;
                    if (i > 0 && newTrimAutoWhitespaceCandidates[i - 1].lineNumber === lineNumber) {
                        // Do not have the same line number twice
                        continue;
                    }
                    const prevContent = newTrimAutoWhitespaceCandidates[i].oldContent;
                    const lineContent = this.getLineContent(lineNumber);
                    if (lineContent.length === 0 || lineContent === prevContent || strings.firstNonWhitespaceIndex(lineContent) !== -1) {
                        continue;
                    }
                    trimAutoWhitespaceLineNumbers.push(lineNumber);
                }
            }
            this._onDidChangeContent.fire();
            return new model_1.ApplyEditsResult(reverseOperations, contentChanges, trimAutoWhitespaceLineNumbers);
        }
        /**
         * Transform operations such that they represent the same logic edit,
         * but that they also do not cause OOM crashes.
         */
        _reduceOperations(operations) {
            if (operations.length < 1000) {
                // We know from empirical testing that a thousand edits work fine regardless of their shape.
                return operations;
            }
            // At one point, due to how events are emitted and how each operation is handled,
            // some operations can trigger a high amount of temporary string allocations,
            // that will immediately get edited again.
            // e.g. a formatter inserting ridiculous ammounts of \n on a model with a single line
            // Therefore, the strategy is to collapse all the operations into a huge single edit operation
            return [this._toSingleEditOperation(operations)];
        }
        _toSingleEditOperation(operations) {
            let forceMoveMarkers = false;
            const firstEditRange = operations[0].range;
            const lastEditRange = operations[operations.length - 1].range;
            const entireEditRange = new range_1.Range(firstEditRange.startLineNumber, firstEditRange.startColumn, lastEditRange.endLineNumber, lastEditRange.endColumn);
            let lastEndLineNumber = firstEditRange.startLineNumber;
            let lastEndColumn = firstEditRange.startColumn;
            const result = [];
            for (let i = 0, len = operations.length; i < len; i++) {
                const operation = operations[i];
                const range = operation.range;
                forceMoveMarkers = forceMoveMarkers || operation.forceMoveMarkers;
                // (1) -- Push old text
                result.push(this.getValueInRange(new range_1.Range(lastEndLineNumber, lastEndColumn, range.startLineNumber, range.startColumn)));
                // (2) -- Push new text
                if (operation.text.length > 0) {
                    result.push(operation.text);
                }
                lastEndLineNumber = range.endLineNumber;
                lastEndColumn = range.endColumn;
            }
            const text = result.join('');
            const [eolCount, firstLineLength, lastLineLength] = (0, eolCounter_1.countEOL)(text);
            return {
                sortIndex: 0,
                identifier: operations[0].identifier,
                range: entireEditRange,
                rangeOffset: this.getOffsetAt(entireEditRange.startLineNumber, entireEditRange.startColumn),
                rangeLength: this.getValueLengthInRange(entireEditRange, 0 /* EndOfLinePreference.TextDefined */),
                text: text,
                eolCount: eolCount,
                firstLineLength: firstLineLength,
                lastLineLength: lastLineLength,
                forceMoveMarkers: forceMoveMarkers,
                isAutoWhitespaceEdit: false
            };
        }
        _doApplyEdits(operations) {
            operations.sort(PieceTreeTextBuffer._sortOpsDescending);
            const contentChanges = [];
            // operations are from bottom to top
            for (let i = 0; i < operations.length; i++) {
                const op = operations[i];
                const startLineNumber = op.range.startLineNumber;
                const startColumn = op.range.startColumn;
                const endLineNumber = op.range.endLineNumber;
                const endColumn = op.range.endColumn;
                if (startLineNumber === endLineNumber && startColumn === endColumn && op.text.length === 0) {
                    // no-op
                    continue;
                }
                if (op.text) {
                    // replacement
                    this._pieceTree.delete(op.rangeOffset, op.rangeLength);
                    this._pieceTree.insert(op.rangeOffset, op.text, true);
                }
                else {
                    // deletion
                    this._pieceTree.delete(op.rangeOffset, op.rangeLength);
                }
                const contentChangeRange = new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn);
                contentChanges.push({
                    range: contentChangeRange,
                    rangeLength: op.rangeLength,
                    text: op.text,
                    rangeOffset: op.rangeOffset,
                    forceMoveMarkers: op.forceMoveMarkers
                });
            }
            return contentChanges;
        }
        findMatchesLineByLine(searchRange, searchData, captureMatches, limitResultCount) {
            return this._pieceTree.findMatchesLineByLine(searchRange, searchData, captureMatches, limitResultCount);
        }
        // #endregion
        // #region helper
        // testing purpose.
        getPieceTree() {
            return this._pieceTree;
        }
        static _getInverseEditRange(range, text) {
            const startLineNumber = range.startLineNumber;
            const startColumn = range.startColumn;
            const [eolCount, firstLineLength, lastLineLength] = (0, eolCounter_1.countEOL)(text);
            let resultRange;
            if (text.length > 0) {
                // the operation inserts something
                const lineCount = eolCount + 1;
                if (lineCount === 1) {
                    // single line insert
                    resultRange = new range_1.Range(startLineNumber, startColumn, startLineNumber, startColumn + firstLineLength);
                }
                else {
                    // multi line insert
                    resultRange = new range_1.Range(startLineNumber, startColumn, startLineNumber + lineCount - 1, lastLineLength + 1);
                }
            }
            else {
                // There is nothing to insert
                resultRange = new range_1.Range(startLineNumber, startColumn, startLineNumber, startColumn);
            }
            return resultRange;
        }
        /**
         * Assumes `operations` are validated and sorted ascending
         */
        static _getInverseEditRanges(operations) {
            const result = [];
            let prevOpEndLineNumber = 0;
            let prevOpEndColumn = 0;
            let prevOp = null;
            for (let i = 0, len = operations.length; i < len; i++) {
                const op = operations[i];
                let startLineNumber;
                let startColumn;
                if (prevOp) {
                    if (prevOp.range.endLineNumber === op.range.startLineNumber) {
                        startLineNumber = prevOpEndLineNumber;
                        startColumn = prevOpEndColumn + (op.range.startColumn - prevOp.range.endColumn);
                    }
                    else {
                        startLineNumber = prevOpEndLineNumber + (op.range.startLineNumber - prevOp.range.endLineNumber);
                        startColumn = op.range.startColumn;
                    }
                }
                else {
                    startLineNumber = op.range.startLineNumber;
                    startColumn = op.range.startColumn;
                }
                let resultRange;
                if (op.text.length > 0) {
                    // the operation inserts something
                    const lineCount = op.eolCount + 1;
                    if (lineCount === 1) {
                        // single line insert
                        resultRange = new range_1.Range(startLineNumber, startColumn, startLineNumber, startColumn + op.firstLineLength);
                    }
                    else {
                        // multi line insert
                        resultRange = new range_1.Range(startLineNumber, startColumn, startLineNumber + lineCount - 1, op.lastLineLength + 1);
                    }
                }
                else {
                    // There is nothing to insert
                    resultRange = new range_1.Range(startLineNumber, startColumn, startLineNumber, startColumn);
                }
                prevOpEndLineNumber = resultRange.endLineNumber;
                prevOpEndColumn = resultRange.endColumn;
                result.push(resultRange);
                prevOp = op;
            }
            return result;
        }
        static _sortOpsAscending(a, b) {
            const r = range_1.Range.compareRangesUsingEnds(a.range, b.range);
            if (r === 0) {
                return a.sortIndex - b.sortIndex;
            }
            return r;
        }
        static _sortOpsDescending(a, b) {
            const r = range_1.Range.compareRangesUsingEnds(a.range, b.range);
            if (r === 0) {
                return b.sortIndex - a.sortIndex;
            }
            return -r;
        }
    }
    exports.PieceTreeTextBuffer = PieceTreeTextBuffer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGllY2VUcmVlVGV4dEJ1ZmZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC9waWVjZVRyZWVUZXh0QnVmZmVyL3BpZWNlVHJlZVRleHRCdWZmZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBOEJoRyxNQUFhLG1CQUFvQixTQUFRLHNCQUFVO1FBVWxELFlBQVksTUFBc0IsRUFBRSxHQUFXLEVBQUUsR0FBa0IsRUFBRSxXQUFvQixFQUFFLDhCQUF1QyxFQUFFLFlBQXFCLEVBQUUsYUFBc0I7WUFDaEwsS0FBSyxFQUFFLENBQUM7WUFKUSx3QkFBbUIsR0FBa0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDMUUsdUJBQWtCLEdBQWdCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7WUFJaEYsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7WUFDaEIsSUFBSSxDQUFDLDBCQUEwQixHQUFHLENBQUMsWUFBWSxDQUFDO1lBQ2hELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxXQUFXLENBQUM7WUFDcEMsSUFBSSxDQUFDLG1DQUFtQyxHQUFHLDhCQUE4QixDQUFDO1lBQzFFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSw2QkFBYSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUVELHFCQUFxQjtRQUNkLE1BQU0sQ0FBQyxLQUFrQjtZQUMvQixJQUFJLENBQUMsQ0FBQyxLQUFLLFlBQVksbUJBQW1CLENBQUMsRUFBRSxDQUFDO2dCQUM3QyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUksRUFBRSxD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