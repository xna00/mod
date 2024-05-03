/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/buffer", "vs/editor/common/core/position", "vs/editor/common/core/eolCounter", "vs/editor/common/tokens/contiguousTokensEditing", "vs/editor/common/core/lineRange"], function (require, exports, arrays, buffer_1, position_1, eolCounter_1, contiguousTokensEditing_1, lineRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContiguousMultilineTokens = void 0;
    /**
     * Represents contiguous tokens over a contiguous range of lines.
     */
    class ContiguousMultilineTokens {
        static deserialize(buff, offset, result) {
            const view32 = new Uint32Array(buff.buffer);
            const startLineNumber = (0, buffer_1.readUInt32BE)(buff, offset);
            offset += 4;
            const count = (0, buffer_1.readUInt32BE)(buff, offset);
            offset += 4;
            const tokens = [];
            for (let i = 0; i < count; i++) {
                const byteCount = (0, buffer_1.readUInt32BE)(buff, offset);
                offset += 4;
                tokens.push(view32.subarray(offset / 4, offset / 4 + byteCount / 4));
                offset += byteCount;
            }
            result.push(new ContiguousMultilineTokens(startLineNumber, tokens));
            return offset;
        }
        /**
         * (Inclusive) start line number for these tokens.
         */
        get startLineNumber() {
            return this._startLineNumber;
        }
        /**
         * (Inclusive) end line number for these tokens.
         */
        get endLineNumber() {
            return this._startLineNumber + this._tokens.length - 1;
        }
        constructor(startLineNumber, tokens) {
            this._startLineNumber = startLineNumber;
            this._tokens = tokens;
        }
        getLineRange() {
            return new lineRange_1.LineRange(this._startLineNumber, this._startLineNumber + this._tokens.length);
        }
        /**
         * @see {@link _tokens}
         */
        getLineTokens(lineNumber) {
            return this._tokens[lineNumber - this._startLineNumber];
        }
        appendLineTokens(lineTokens) {
            this._tokens.push(lineTokens);
        }
        serializeSize() {
            let result = 0;
            result += 4; // 4 bytes for the start line number
            result += 4; // 4 bytes for the line count
            for (let i = 0; i < this._tokens.length; i++) {
                const lineTokens = this._tokens[i];
                if (!(lineTokens instanceof Uint32Array)) {
                    throw new Error(`Not supported!`);
                }
                result += 4; // 4 bytes for the byte count
                result += lineTokens.byteLength;
            }
            return result;
        }
        serialize(destination, offset) {
            (0, buffer_1.writeUInt32BE)(destination, this._startLineNumber, offset);
            offset += 4;
            (0, buffer_1.writeUInt32BE)(destination, this._tokens.length, offset);
            offset += 4;
            for (let i = 0; i < this._tokens.length; i++) {
                const lineTokens = this._tokens[i];
                if (!(lineTokens instanceof Uint32Array)) {
                    throw new Error(`Not supported!`);
                }
                (0, buffer_1.writeUInt32BE)(destination, lineTokens.byteLength, offset);
                offset += 4;
                destination.set(new Uint8Array(lineTokens.buffer), offset);
                offset += lineTokens.byteLength;
            }
            return offset;
        }
        applyEdit(range, text) {
            const [eolCount, firstLineLength] = (0, eolCounter_1.countEOL)(text);
            this._acceptDeleteRange(range);
            this._acceptInsertText(new position_1.Position(range.startLineNumber, range.startColumn), eolCount, firstLineLength);
        }
        _acceptDeleteRange(range) {
            if (range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn) {
                // Nothing to delete
                return;
            }
            const firstLineIndex = range.startLineNumber - this._startLineNumber;
            const lastLineIndex = range.endLineNumber - this._startLineNumber;
            if (lastLineIndex < 0) {
                // this deletion occurs entirely before this block, so we only need to adjust line numbers
                const deletedLinesCount = lastLineIndex - firstLineIndex;
                this._startLineNumber -= deletedLinesCount;
                return;
            }
            if (firstLineIndex >= this._tokens.length) {
                // this deletion occurs entirely after this block, so there is nothing to do
                return;
            }
            if (firstLineIndex < 0 && lastLineIndex >= this._tokens.length) {
                // this deletion completely encompasses this block
                this._startLineNumber = 0;
                this._tokens = [];
                return;
            }
            if (firstLineIndex === lastLineIndex) {
                // a delete on a single line
                this._tokens[firstLineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.delete(this._tokens[firstLineIndex], range.startColumn - 1, range.endColumn - 1);
                return;
            }
            if (firstLineIndex >= 0) {
                // The first line survives
                this._tokens[firstLineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.deleteEnding(this._tokens[firstLineIndex], range.startColumn - 1);
                if (lastLineIndex < this._tokens.length) {
                    // The last line survives
                    const lastLineTokens = contiguousTokensEditing_1.ContiguousTokensEditing.deleteBeginning(this._tokens[lastLineIndex], range.endColumn - 1);
                    // Take remaining text on last line and append it to remaining text on first line
                    this._tokens[firstLineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.append(this._tokens[firstLineIndex], lastLineTokens);
                    // Delete middle lines
                    this._tokens.splice(firstLineIndex + 1, lastLineIndex - firstLineIndex);
                }
                else {
                    // The last line does not survive
                    // Take remaining text on last line and append it to remaining text on first line
                    this._tokens[firstLineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.append(this._tokens[firstLineIndex], null);
                    // Delete lines
                    this._tokens = this._tokens.slice(0, firstLineIndex + 1);
                }
            }
            else {
                // The first line does not survive
                const deletedBefore = -firstLineIndex;
                this._startLineNumber -= deletedBefore;
                // Remove beginning from last line
                this._tokens[lastLineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.deleteBeginning(this._tokens[lastLineIndex], range.endColumn - 1);
                // Delete lines
                this._tokens = this._tokens.slice(lastLineIndex);
            }
        }
        _acceptInsertText(position, eolCount, firstLineLength) {
            if (eolCount === 0 && firstLineLength === 0) {
                // Nothing to insert
                return;
            }
            const lineIndex = position.lineNumber - this._startLineNumber;
            if (lineIndex < 0) {
                // this insertion occurs before this block, so we only need to adjust line numbers
                this._startLineNumber += eolCount;
                return;
            }
            if (lineIndex >= this._tokens.length) {
                // this insertion occurs after this block, so there is nothing to do
                return;
            }
            if (eolCount === 0) {
                // Inserting text on one line
                this._tokens[lineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.insert(this._tokens[lineIndex], position.column - 1, firstLineLength);
                return;
            }
            this._tokens[lineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.deleteEnding(this._tokens[lineIndex], position.column - 1);
            this._tokens[lineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.insert(this._tokens[lineIndex], position.column - 1, firstLineLength);
            this._insertLines(position.lineNumber, eolCount);
        }
        _insertLines(insertIndex, insertCount) {
            if (insertCount === 0) {
                return;
            }
            const lineTokens = [];
            for (let i = 0; i < insertCount; i++) {
                lineTokens[i] = null;
            }
            this._tokens = arrays.arrayInsert(this._tokens, insertIndex, lineTokens);
        }
    }
    exports.ContiguousMultilineTokens = ContiguousMultilineTokens;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGlndW91c011bHRpbGluZVRva2Vucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi90b2tlbnMvY29udGlndW91c011bHRpbGluZVRva2Vucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEc7O09BRUc7SUFDSCxNQUFhLHlCQUF5QjtRQUM5QixNQUFNLENBQUMsV0FBVyxDQUFDLElBQWdCLEVBQUUsTUFBYyxFQUFFLE1BQW1DO1lBQzlGLE1BQU0sTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1QyxNQUFNLGVBQWUsR0FBRyxJQUFBLHFCQUFZLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztZQUNoRSxNQUFNLEtBQUssR0FBRyxJQUFBLHFCQUFZLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztZQUN0RCxNQUFNLE1BQU0sR0FBa0IsRUFBRSxDQUFDO1lBQ2pDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxTQUFTLEdBQUcsSUFBQSxxQkFBWSxFQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFBQyxNQUFNLElBQUksQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsQ0FBQyxHQUFHLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyRSxNQUFNLElBQUksU0FBUyxDQUFDO1lBQ3JCLENBQUM7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