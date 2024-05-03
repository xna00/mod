/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/editor/common/core/stringBuilder"], function (require, exports, buffer, stringBuilder_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextChange = void 0;
    exports.compressConsecutiveTextChanges = compressConsecutiveTextChanges;
    function escapeNewLine(str) {
        return (str
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r'));
    }
    class TextChange {
        get oldLength() {
            return this.oldText.length;
        }
        get oldEnd() {
            return this.oldPosition + this.oldText.length;
        }
        get newLength() {
            return this.newText.length;
        }
        get newEnd() {
            return this.newPosition + this.newText.length;
        }
        constructor(oldPosition, oldText, newPosition, newText) {
            this.oldPosition = oldPosition;
            this.oldText = oldText;
            this.newPosition = newPosition;
            this.newText = newText;
        }
        toString() {
            if (this.oldText.length === 0) {
                return `(insert@${this.oldPosition} "${escapeNewLine(this.newText)}")`;
            }
            if (this.newText.length === 0) {
                return `(delete@${this.oldPosition} "${escapeNewLine(this.oldText)}")`;
            }
            return `(replace@${this.oldPosition} "${escapeNewLine(this.oldText)}" with "${escapeNewLine(this.newText)}")`;
        }
        static _writeStringSize(str) {
            return (4 + 2 * str.length);
        }
        static _writeString(b, str, offset) {
            const len = str.length;
            buffer.writeUInt32BE(b, len, offset);
            offset += 4;
            for (let i = 0; i < len; i++) {
                buffer.writeUInt16LE(b, str.charCodeAt(i), offset);
                offset += 2;
            }
            return offset;
        }
        static _readString(b, offset) {
            const len = buffer.readUInt32BE(b, offset);
            offset += 4;
            return (0, stringBuilder_1.decodeUTF16LE)(b, offset, len);
        }
        writeSize() {
            return (+4 // oldPosition
                + 4 // newPosition
                + TextChange._writeStringSize(this.oldText)
                + TextChange._writeStringSize(this.newText));
        }
        write(b, offset) {
            buffer.writeUInt32BE(b, this.oldPosition, offset);
            offset += 4;
            buffer.writeUInt32BE(b, this.newPosition, offset);
            offset += 4;
            offset = TextChange._writeString(b, this.oldText, offset);
            offset = TextChange._writeString(b, this.newText, offset);
            return offset;
        }
        static read(b, offset, dest) {
            const oldPosition = buffer.readUInt32BE(b, offset);
            offset += 4;
            const newPosition = buffer.readUInt32BE(b, offset);
            offset += 4;
            const oldText = TextChange._readString(b, offset);
            offset += TextChange._writeStringSize(oldText);
            const newText = TextChange._readString(b, offset);
            offset += TextChange._writeStringSize(newText);
            dest.push(new TextChange(oldPosition, oldText, newPosition, newText));
            return offset;
        }
    }
    exports.TextChange = TextChange;
    function compressConsecutiveTextChanges(prevEdits, currEdits) {
        if (prevEdits === null || prevEdits.length === 0) {
            return currEdits;
        }
        const compressor = new TextChangeCompressor(prevEdits, currEdits);
        return compressor.compress();
    }
    class TextChangeCompressor {
        constructor(prevEdits, currEdits) {
            this._prevEdits = prevEdits;
            this._currEdits = currEdits;
            this._result = [];
            this._resultLen = 0;
            this._prevLen = this._prevEdits.length;
            this._prevDeltaOffset = 0;
            this._currLen = this._currEdits.length;
            this._currDeltaOffset = 0;
        }
        compress() {
            let prevIndex = 0;
            let currIndex = 0;
            let prevEdit = this._getPrev(prevIndex);
            let currEdit = this._getCurr(currIndex);
            while (prevIndex < this._prevLen || currIndex < this._currLen) {
                if (prevEdit === null) {
                    this._acceptCurr(currEdit);
                    currEdit = this._getCurr(++currIndex);
                    continue;
                }
                if (currEdit === null) {
                    this._acceptPrev(prevEdit);
                    prevEdit = this._getPrev(++prevIndex);
                    continue;
                }
                if (currEdit.oldEnd <= prevEdit.newPosition) {
                    this._acceptCurr(currEdit);
                    currEdit = this._getCurr(++currIndex);
                    continue;
                }
                if (prevEdit.newEnd <= currEdit.oldPosition) {
                    this._acceptPrev(prevEdit);
                    prevEdit = this._getPrev(++prevIndex);
                    continue;
                }
                if (currEdit.oldPosition < prevEdit.newPosition) {
                    const [e1, e2] = TextChangeCompressor._splitCurr(currEdit, prevEdit.newPosition - currEdit.oldPosition);
                    this._acceptCurr(e1);
                    currEdit = e2;
                    continue;
                }
                if (prevEdit.newPosition < currEdit.oldPosition) {
                    const [e1, e2] = TextChangeCompressor._splitPrev(prevEdit, currEdit.oldPosition - prevEdit.newPosition);
                    this._acceptPrev(e1);
                    prevEdit = e2;
                    continue;
                }
                // At this point, currEdit.oldPosition === prevEdit.newPosition
                let mergePrev;
                let mergeCurr;
                if (currEdit.oldEnd === prevEdit.newEnd) {
                    mergePrev = prevEdit;
                    mergeCurr = currEdit;
                    prevEdit = this._getPrev(++prevIndex);
                    currEdit = this._getCurr(++currIndex);
                }
                else if (currEdit.oldEnd < prevEdit.newEnd) {
                    const [e1, e2] = TextChangeCompressor._splitPrev(prevEdit, currEdit.oldLength);
                    mergePrev = e1;
                    mergeCurr = currEdit;
                    prevEdit = e2;
                    currEdit = this._getCurr(++currIndex);
                }
                else {
                    const [e1, e2] = TextChangeCompressor._splitCurr(currEdit, prevEdit.newLength);
                    mergePrev = prevEdit;
                    mergeCurr = e1;
                    prevEdit = this._getPrev(++prevIndex);
                    currEdit = e2;
                }
                this._result[this._resultLen++] = new TextChange(mergePrev.oldPosition, mergePrev.oldText, mergeCurr.newPosition, mergeCurr.newText);
                this._prevDeltaOffset += mergePrev.newLength - mergePrev.oldLength;
                this._currDeltaOffset += mergeCurr.newLength - mergeCurr.oldLength;
            }
            const merged = TextChangeCompressor._merge(this._result);
            const cleaned = TextChangeCompressor._removeNoOps(merged);
            return cleaned;
        }
        _acceptCurr(currEdit) {
            this._result[this._resultLen++] = TextChangeCompressor._rebaseCurr(this._prevDeltaOffset, currEdit);
            this._currDeltaOffset += currEdit.newLength - currEdit.oldLength;
        }
        _getCurr(currIndex) {
            return (currIndex < this._currLen ? this._currEdits[currIndex] : null);
        }
        _acceptPrev(prevEdit) {
            this._result[this._resultLen++] = TextChangeCompressor._rebasePrev(this._currDeltaOffset, prevEdit);
            this._prevDeltaOffset += prevEdit.newLength - prevEdit.oldLength;
        }
        _getPrev(prevIndex) {
            return (prevIndex < this._prevLen ? this._prevEdits[prevIndex] : null);
        }
        static _rebaseCurr(prevDeltaOffset, currEdit) {
            return new TextChange(currEdit.oldPosition - prevDeltaOffset, currEdit.oldText, currEdit.newPosition, currEdit.newText);
        }
        static _rebasePrev(currDeltaOffset, prevEdit) {
            return new TextChange(prevEdit.oldPosition, prevEdit.oldText, prevEdit.newPosition + currDeltaOffset, prevEdit.newText);
        }
        static _splitPrev(edit, offset) {
            const preText = edit.newText.substr(0, offset);
            const postText = edit.newText.substr(offset);
            return [
                new TextChange(edit.oldPosition, edit.oldText, edit.newPosition, preText),
                new TextChange(edit.oldEnd, '', edit.newPosition + offset, postText)
            ];
        }
        static _splitCurr(edit, offset) {
            const preText = edit.oldText.substr(0, offset);
            const postText = edit.oldText.substr(offset);
            return [
                new TextChange(edit.oldPosition, preText, edit.newPosition, edit.newText),
                new TextChange(edit.oldPosition + offset, postText, edit.newEnd, '')
            ];
        }
        static _merge(edits) {
            if (edits.length === 0) {
                return edits;
            }
            const result = [];
            let resultLen = 0;
            let prev = edits[0];
            for (let i = 1; i < edits.length; i++) {
                const curr = edits[i];
                if (prev.oldEnd === curr.oldPosition) {
                    // Merge into `prev`
                    prev = new TextChange(prev.oldPosition, prev.oldText + curr.oldText, prev.newPosition, prev.newText + curr.newText);
                }
                else {
                    result[resultLen++] = prev;
                    prev = curr;
                }
            }
            result[resultLen++] = prev;
            return result;
        }
        static _removeNoOps(edits) {
            if (edits.length === 0) {
                return edits;
            }
            const result = [];
            let resultLen = 0;
            for (let i = 0; i < edits.length; i++) {
                const edit = edits[i];
                if (edit.oldText === edit.newText) {
                    continue;
                }
                result[resultLen++] = edit;
            }
            return result;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dENoYW5nZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jb3JlL3RleHRDaGFuZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBK0ZoRyx3RUFNQztJQWhHRCxTQUFTLGFBQWEsQ0FBQyxHQUFXO1FBQ2pDLE9BQU8sQ0FDTixHQUFHO2FBQ0QsT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDckIsT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FDdkIsQ0FBQztJQUNILENBQUM7SUFFRCxNQUFhLFVBQVU7UUFFdEIsSUFBVyxTQUFTO1lBQ25CLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDNUIsQ0FBQztRQUVELElBQVcsTUFBTTtZQUNoQixPQUFPLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDL0MsQ0FBQztRQUVELElBQVcsU0FBUztZQUNuQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQzVCLENBQUM7UUFFRCxJQUFXLE1BQU07WUFDaEIsT0FBTyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQy9DLENBQUM7UUFFRCxZQUNpQixXQUFtQixFQUNuQixPQUFlLEVBQ2YsV0FBbUIsRUFDbkIsT0FBZTtZQUhmLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBQ25CLFlBQU8sR0FBUCxPQUFPLENBQVE7WUFDZixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUNuQixZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQzVCLENBQUM7UUFFRSxRQUFRO1lBQ2QsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUs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