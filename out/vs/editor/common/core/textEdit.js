/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/errors", "vs/editor/common/core/position", "vs/editor/common/core/positionToOffset", "vs/editor/common/core/range", "vs/editor/common/core/textLength"], function (require, exports, assert_1, errors_1, position_1, positionToOffset_1, range_1, textLength_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StringText = exports.LineBasedText = exports.AbstractText = exports.SingleTextEdit = exports.TextEdit = void 0;
    class TextEdit {
        constructor(edits) {
            this.edits = edits;
            (0, assert_1.assertFn)(() => (0, assert_1.checkAdjacentItems)(edits, (a, b) => a.range.getEndPosition().isBeforeOrEqual(b.range.getStartPosition())));
        }
        /**
         * Joins touching edits and removes empty edits.
         */
        normalize() {
            const edits = [];
            for (const edit of this.edits) {
                if (edits.length > 0 && edits[edits.length - 1].range.getEndPosition().equals(edit.range.getStartPosition())) {
                    const last = edits[edits.length - 1];
                    edits[edits.length - 1] = new SingleTextEdit(last.range.plusRange(edit.range), last.text + edit.text);
                }
                else if (!edit.isEmpty) {
                    edits.push(edit);
                }
            }
            return new TextEdit(edits);
        }
        mapPosition(position) {
            let lineDelta = 0;
            let curLine = 0;
            let columnDeltaInCurLine = 0;
            for (const edit of this.edits) {
                const start = edit.range.getStartPosition();
                const end = edit.range.getEndPosition();
                if (position.isBeforeOrEqual(start)) {
                    break;
                }
                const len = textLength_1.TextLength.ofText(edit.text);
                if (position.isBefore(end)) {
                    const startPos = new position_1.Position(start.lineNumber + lineDelta, start.column + (start.lineNumber + lineDelta === curLine ? columnDeltaInCurLine : 0));
                    const endPos = len.addToPosition(startPos);
                    return rangeFromPositions(startPos, endPos);
                }
                lineDelta += len.lineCount - (edit.range.endLineNumber - edit.range.startLineNumber);
                if (len.lineCount === 0) {
                    if (end.lineNumber !== start.lineNumber) {
                        columnDeltaInCurLine += len.columnCount - (end.column - 1);
                    }
                    else {
                        columnDeltaInCurLine += len.columnCount - (end.column - start.column);
                    }
                }
                else {
                    columnDeltaInCurLine = len.columnCount;
                }
                curLine = end.lineNumber + lineDelta;
            }
            return new position_1.Position(position.lineNumber + lineDelta, position.column + (position.lineNumber + lineDelta === curLine ? columnDeltaInCurLine : 0));
        }
        mapRange(range) {
            function getStart(p) {
                return p instanceof position_1.Position ? p : p.getStartPosition();
            }
            function getEnd(p) {
                return p instanceof position_1.Position ? p : p.getEndPosition();
            }
            const start = getStart(this.mapPosition(range.getStartPosition()));
            const end = getEnd(this.mapPosition(range.getEndPosition()));
            return rangeFromPositions(start, end);
        }
        // TODO: `doc` is not needed for this!
        inverseMapPosition(positionAfterEdit, doc) {
            const reversed = this.inverse(doc);
            return reversed.mapPosition(positionAfterEdit);
        }
        inverseMapRange(range, doc) {
            const reversed = this.inverse(doc);
            return reversed.mapRange(range);
        }
        apply(text) {
            let result = '';
            let lastEditEnd = new position_1.Position(1, 1);
            for (const edit of this.edits) {
                const editRange = edit.range;
                const editStart = editRange.getStartPosition();
                const editEnd = editRange.getEndPosition();
                const r = rangeFromPositions(lastEditEnd, editStart);
                if (!r.isEmpty()) {
                    result += text.getValueOfRange(r);
                }
                result += edit.text;
                lastEditEnd = editEnd;
            }
            const r = rangeFromPositions(lastEditEnd, text.endPositionExclusive);
            if (!r.isEmpty()) {
                result += text.getValueOfRange(r);
            }
            return result;
        }
        applyToString(str) {
            const strText = new StringText(str);
            return this.apply(strText);
        }
        inverse(doc) {
            const ranges = this.getNewRanges();
            return new TextEdit(this.edits.map((e, idx) => new SingleTextEdit(ranges[idx], doc.getValueOfRange(e.range))));
        }
        getNewRanges() {
            const newRanges = [];
            let previousEditEndLineNumber = 0;
            let lineOffset = 0;
            let columnOffset = 0;
            for (const edit of this.edits) {
                const textLength = textLength_1.TextLength.ofText(edit.text);
                const newRangeStart = position_1.Position.lift({
                    lineNumber: edit.range.startLineNumber + lineOffset,
                    column: edit.range.startColumn + (edit.range.startLineNumber === previousEditEndLineNumber ? columnOffset : 0)
                });
                const newRange = textLength.createRange(newRangeStart);
                newRanges.push(newRange);
                lineOffset = newRange.endLineNumber - edit.range.endLineNumber;
                columnOffset = newRange.endColumn - edit.range.endColumn;
                previousEditEndLineNumber = edit.range.endLineNumber;
            }
            return newRanges;
        }
    }
    exports.TextEdit = TextEdit;
    class SingleTextEdit {
        constructor(range, text) {
            this.range = range;
            this.text = text;
        }
        get isEmpty() {
            return this.range.isEmpty() && this.text.length === 0;
        }
        static equals(first, second) {
            return first.range.equalsRange(second.range) && first.text === second.text;
        }
    }
    exports.SingleTextEdit = SingleTextEdit;
    function rangeFromPositions(start, end) {
        if (!start.isBeforeOrEqual(end)) {
            throw new errors_1.BugIndicatingError('start must be before end');
        }
        return new range_1.Range(start.lineNumber, start.column, end.lineNumber, end.column);
    }
    class AbstractText {
        get endPositionExclusive() {
            return this.length.addToPosition(new position_1.Position(1, 1));
        }
        getValue() {
            return this.getValueOfRange(this.length.toRange());
        }
    }
    exports.AbstractText = AbstractText;
    class LineBasedText extends AbstractText {
        constructor(_getLineContent, _lineCount) {
            (0, assert_1.assert)(_lineCount >= 1);
            super();
            this._getLineContent = _getLineContent;
            this._lineCount = _lineCount;
        }
        getValueOfRange(range) {
            if (range.startLineNumber === range.endLineNumber) {
                return this._getLineContent(range.startLineNumber).substring(range.startColumn - 1, range.endColumn - 1);
            }
            let result = this._getLineContent(range.startLineNumber).substring(range.startColumn - 1);
            for (let i = range.startLineNumber + 1; i < range.endLineNumber; i++) {
                result += '\n' + this._getLineContent(i);
            }
            result += '\n' + this._getLineContent(range.endLineNumber).substring(0, range.endColumn - 1);
            return result;
        }
        get length() {
            const lastLine = this._getLineContent(this._lineCount);
            return new textLength_1.TextLength(this._lineCount - 1, lastLine.length);
        }
    }
    exports.LineBasedText = LineBasedText;
    class StringText extends AbstractText {
        constructor(value) {
            super();
            this.value = value;
            this._t = new positionToOffset_1.PositionOffsetTransformer(this.value);
        }
        getValueOfRange(range) {
            return this._t.getOffsetRange(range).substring(this.value);
        }
        get length() {
            return this._t.textLength;
        }
    }
    exports.StringText = StringText;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEVkaXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vY29yZS90ZXh0RWRpdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBYSxRQUFRO1FBQ3BCLFlBQTRCLEtBQWdDO1lBQWhDLFVBQUssR0FBTCxLQUFLLENBQTJCO1lBQzNELElBQUEsaUJBQVEsRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLDJCQUFrQixFQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzSCxDQUFDO1FBRUQ7O1dBRUc7UUFDSCxTQUFTO1lBQ1IsTUFBTSxLQUFLLEdBQXFCLEVBQUUsQ0FBQztZQUNuQyxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQzlHLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNyQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJ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