/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/eolCounter"], function (require, exports, position_1, range_1, eolCounter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SparseLineTokens = exports.SparseMultilineTokens = void 0;
    /**
     * Represents sparse tokens over a contiguous range of lines.
     */
    class SparseMultilineTokens {
        static create(startLineNumber, tokens) {
            return new SparseMultilineTokens(startLineNumber, new SparseMultilineTokensStorage(tokens));
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
            return this._endLineNumber;
        }
        constructor(startLineNumber, tokens) {
            this._startLineNumber = startLineNumber;
            this._tokens = tokens;
            this._endLineNumber = this._startLineNumber + this._tokens.getMaxDeltaLine();
        }
        toString() {
            return this._tokens.toString(this._startLineNumber);
        }
        _updateEndLineNumber() {
            this._endLineNumber = this._startLineNumber + this._tokens.getMaxDeltaLine();
        }
        isEmpty() {
            return this._tokens.isEmpty();
        }
        getLineTokens(lineNumber) {
            if (this._startLineNumber <= lineNumber && lineNumber <= this._endLineNumber) {
                return this._tokens.getLineTokens(lineNumber - this._startLineNumber);
            }
            return null;
        }
        getRange() {
            const deltaRange = this._tokens.getRange();
            if (!deltaRange) {
                return deltaRange;
            }
            return new range_1.Range(this._startLineNumber + deltaRange.startLineNumber, deltaRange.startColumn, this._startLineNumber + deltaRange.endLineNumber, deltaRange.endColumn);
        }
        removeTokens(range) {
            const startLineIndex = range.startLineNumber - this._startLineNumber;
            const endLineIndex = range.endLineNumber - this._startLineNumber;
            this._startLineNumber += this._tokens.removeTokens(startLineIndex, range.startColumn - 1, endLineIndex, range.endColumn - 1);
            this._updateEndLineNumber();
        }
        split(range) {
            // split tokens to two:
            // a) all the tokens before `range`
            // b) all the tokens after `range`
            const startLineIndex = range.startLineNumber - this._startLineNumber;
            const endLineIndex = range.endLineNumber - this._startLineNumber;
            const [a, b, bDeltaLine] = this._tokens.split(startLineIndex, range.startColumn - 1, endLineIndex, range.endColumn - 1);
            return [new SparseMultilineTokens(this._startLineNumber, a), new SparseMultilineTokens(this._startLineNumber + bDeltaLine, b)];
        }
        applyEdit(range, text) {
            const [eolCount, firstLineLength, lastLineLength] = (0, eolCounter_1.countEOL)(text);
            this.acceptEdit(range, eolCount, firstLineLength, lastLineLength, text.length > 0 ? text.charCodeAt(0) : 0 /* CharCode.Null */);
        }
        acceptEdit(range, eolCount, firstLineLength, lastLineLength, firstCharCode) {
            this._acceptDeleteRange(range);
            this._acceptInsertText(new position_1.Position(range.startLineNumber, range.startColumn), eolCount, firstLineLength, lastLineLength, firstCharCode);
            this._updateEndLineNumber();
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
            const tokenMaxDeltaLine = this._tokens.getMaxDeltaLine();
            if (firstLineIndex >= tokenMaxDeltaLine + 1) {
                // this deletion occurs entirely after this block, so there is nothing to do
                return;
            }
            if (firstLineIndex < 0 && lastLineIndex >= tokenMaxDeltaLine + 1) {
                // this deletion completely encompasses this block
                this._startLineNumber = 0;
                this._tokens.clear();
                return;
            }
            if (firstLineIndex < 0) {
                const deletedBefore = -firstLineIndex;
                this._startLineNumber -= deletedBefore;
                this._tokens.acceptDeleteRange(range.startColumn - 1, 0, 0, lastLineIndex, range.endColumn - 1);
            }
            else {
                this._tokens.acceptDeleteRange(0, firstLineIndex, range.startColumn - 1, lastLineIndex, range.endColumn - 1);
            }
        }
        _acceptInsertText(position, eolCount, firstLineLength, lastLineLength, firstCharCode) {
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
            const tokenMaxDeltaLine = this._tokens.getMaxDeltaLine();
            if (lineIndex >= tokenMaxDeltaLine + 1) {
                // this insertion occurs after this block, so there is nothing to do
                return;
            }
            this._tokens.acceptInsertText(lineIndex, position.column - 1, eolCount, firstLineLength, lastLineLength, firstCharCode);
        }
    }
    exports.SparseMultilineTokens = SparseMultilineTokens;
    class SparseMultilineTokensStorage {
        constructor(tokens) {
            this._tokens = tokens;
            this._tokenCount = tokens.length / 4;
        }
        toString(startLineNumber) {
            const pieces = [];
            for (let i = 0; i < this._tokenCount; i++) {
                pieces.push(`(${this._getDeltaLine(i) + startLineNumber},${this._getStartCharacter(i)}-${this._getEndCharacter(i)})`);
            }
            return `[${pieces.join(',')}]`;
        }
        getMaxDeltaLine() {
            const tokenCount = this._getTokenCount();
            if (tokenCount === 0) {
                return -1;
            }
            return this._getDeltaLine(tokenCount - 1);
        }
        getRange() {
            const tokenCount = this._getTokenCount();
            if (tokenCount === 0) {
                return null;
            }
            const startChar = this._getStartCharacter(0);
            const maxDeltaLine = this._getDeltaLine(tokenCount - 1);
            const endChar = this._getEndCharacter(tokenCount - 1);
            return new range_1.Range(0, startChar + 1, maxDeltaLine, endChar + 1);
        }
        _getTokenCount() {
            return this._tokenCount;
        }
        _getDeltaLine(tokenIndex) {
            return this._tokens[4 * tokenIndex];
        }
        _getStartCharacter(tokenIndex) {
            return this._tokens[4 * tokenIndex + 1];
        }
        _getEndCharacter(tokenIndex) {
            return this._tokens[4 * tokenIndex + 2];
        }
        isEmpty() {
            return (this._getTokenCount() === 0);
        }
        getLineTokens(deltaLine) {
            let low = 0;
            let high = this._getTokenCount() - 1;
            while (low < high) {
                const mid = low + Math.floor((high - low) / 2);
                const midDeltaLine = this._getDeltaLine(mid);
                if (midDeltaLine < deltaLine) {
                    low = mid + 1;
                }
                else if (midDeltaLine > deltaLine) {
                    high = mid - 1;
                }
                else {
                    let min = mid;
                    while (min > low && this._getDeltaLine(min - 1) === deltaLine) {
                        min--;
                    }
                    let max = mid;
                    while (max < high && this._getDeltaLine(max + 1) === deltaLine) {
                        max++;
                    }
                    return new SparseLineTokens(this._tokens.subarray(4 * min, 4 * max + 4));
                }
            }
            if (this._getDeltaLine(low) === deltaLine) {
                return new SparseLineTokens(this._tokens.subarray(4 * low, 4 * low + 4));
            }
            return null;
        }
        clear() {
            this._tokenCount = 0;
        }
        removeTokens(startDeltaLine, startChar, endDeltaLine, endChar) {
            const tokens = this._tokens;
            const tokenCount = this._tokenCount;
            let newTokenCount = 0;
            let hasDeletedTokens = false;
            let firstDeltaLine = 0;
            for (let i = 0; i < tokenCount; i++) {
                const srcOffset = 4 * i;
                const tokenDeltaLine = tokens[srcOffset];
                const tokenStartCharacter = tokens[srcOffset + 1];
                const tokenEndCharacter = tokens[srcOffset + 2];
                const tokenMetadata = tokens[srcOffset + 3];
                if ((tokenDeltaLine > startDeltaLine || (tokenDeltaLine === startDeltaLine && tokenEndCharacter >= startChar))
                    && (tokenDeltaLine < endDeltaLine || (tokenDeltaLine === endDeltaLine && tokenStartCharacter <= endChar))) {
                    hasDeletedTokens = true;
                }
                else {
                    if (newTokenCount === 0) {
                        firstDeltaLine = tokenDeltaLine;
                    }
                    if (hasDeletedTokens) {
                        // must move the token to the left
                        const destOffset = 4 * newTokenCount;
                        tokens[destOffset] = tokenDeltaLine - firstDeltaLine;
                        tokens[destOffset + 1] = tokenStartCharacter;
                        tokens[destOffset + 2] = tokenEndCharacter;
                        tokens[destOffset + 3] = tokenMetadata;
                    }
                    newTokenCount++;
                }
            }
            this._tokenCount = newTokenCount;
            return firstDeltaLine;
        }
        split(startDeltaLine, startChar, endDeltaLine, endChar) {
            const tokens = this._tokens;
            const tokenCount = this._tokenCount;
            const aTokens = [];
            const bTokens = [];
            let destTokens = aTokens;
            let destOffset = 0;
            let destFirstDeltaLine = 0;
            for (let i = 0; i < tokenCount; i++) {
                const srcOffset = 4 * i;
                const tokenDeltaLine = tokens[srcOffset];
                const tokenStartCharacter = tokens[srcOffset + 1];
                const tokenEndCharacter = tokens[srcOffset + 2];
                const tokenMetadata = tokens[srcOffset + 3];
                if ((tokenDeltaLine > startDeltaLine || (tokenDeltaLine === startDeltaLine && tokenEndCharacter >= startChar))) {
                    if ((tokenDeltaLine < endDeltaLine || (tokenDeltaLine === endDeltaLine && tokenStartCharacter <= endChar))) {
                        // this token is touching the range
                        continue;
                    }
                    else {
                        // this token is after the range
                        if (destTokens !== bTokens) {
                            // this token is the first token after the range
                            destTokens = bTokens;
                            destOffset = 0;
                            destFirstDeltaLine = tokenDeltaLine;
                        }
                    }
                }
                destTokens[destOffset++] = tokenDeltaLine - destFirstDeltaLine;
                destTokens[destOffset++] = tokenStartCharacter;
                destTokens[destOffset++] = tokenEndCharacter;
                destTokens[destOffset++] = tokenMetadata;
            }
            return [new SparseMultilineTokensStorage(new Uint32Array(aTokens)), new SparseMultilineTokensStorage(new Uint32Array(bTokens)), destFirstDeltaLine];
        }
        acceptDeleteRange(horizontalShiftForFirstLineTokens, startDeltaLine, startCharacter, endDeltaLine, endCharacter) {
            // This is a bit complex, here are the cases I used to think about this:
            //
            // 1. The token starts before the deletion range
            // 1a. The token is completely before the deletion range
            //               -----------
            //                          xxxxxxxxxxx
            // 1b. The token starts before, the deletion range ends after the token
            //               -----------
            //                      xxxxxxxxxxx
            // 1c. The token starts before, the deletion range ends precisely with the token
            //               ---------------
            //                      xxxxxxxx
            // 1d. The token starts before, the deletion range is inside the token
            //               ---------------
            //                    xxxxx
            //
            // 2. The token starts at the same position with the deletion range
            // 2a. The token starts at the same position, and ends inside the deletion range
            //               -------
            //               xxxxxxxxxxx
            // 2b. The token starts at the same position, and ends at the same position as the deletion range
            //               ----------
            //               xxxxxxxxxx
            // 2c. The token starts at the same position, and ends after the deletion range
            //               -------------
            //               xxxxxxx
            //
            // 3. The token starts inside the deletion range
            // 3a. The token is inside the deletion range
            //                -------
            //             xxxxxxxxxxxxx
            // 3b. The token starts inside the deletion range, and ends at the same position as the deletion range
            //                ----------
            //             xxxxxxxxxxxxx
            // 3c. The token starts inside the deletion range, and ends after the deletion range
            //                ------------
            //             xxxxxxxxxxx
            //
            // 4. The token starts after the deletion range
            //                  -----------
            //          xxxxxxxx
            //
            const tokens = this._tokens;
            const tokenCount = this._tokenCount;
            const deletedLineCount = (endDeltaLine - startDeltaLine);
            let newTokenCount = 0;
            let hasDeletedTokens = false;
            for (let i = 0; i < tokenCount; i++) {
                const srcOffset = 4 * i;
                let tokenDeltaLine = tokens[srcOffset];
                let tokenStartCharacter = tokens[srcOffset + 1];
                let tokenEndCharacter = tokens[srcOffset + 2];
                const tokenMetadata = tokens[srcOffset + 3];
                if (tokenDeltaLine < startDeltaLine || (tokenDeltaLine === startDeltaLine && tokenEndCharacter <= startCharacter)) {
                    // 1a. The token is completely before the deletion range
                    // => nothing to do
                    newTokenCount++;
                    continue;
                }
                else if (tokenDeltaLine === startDeltaLine && tokenStartCharacter < startCharacter) {
                    // 1b, 1c, 1d
                    // => the token survives, but it needs to shrink
                    if (tokenDeltaLine === endDeltaLine && tokenEndCharacter > endCharacter) {
                        // 1d. The token starts before, the deletion range is inside the token
                        // => the token shrinks by the deletion character count
                        tokenEndCharacter -= (endCharacter - startCharacter);
                    }
                    else {
                        // 1b. The token starts before, the deletion range ends after the token
                        // 1c. The token starts before, the deletion range ends precisely with the token
                        // => the token shrinks its ending to the deletion start
                        tokenEndCharacter = startCharacter;
                    }
                }
                else if (tokenDeltaLine === startDeltaLine && tokenStartCharacter === startCharacter) {
                    // 2a, 2b, 2c
                    if (tokenDeltaLine === endDeltaLine && tokenEndCharacter > endCharacter) {
                        // 2c. The token starts at the same position, and ends after the deletion range
                        // => the token shrinks by the deletion character count
                        tokenEndCharacter -= (endCharacter - startCharacter);
                    }
                    else {
                        // 2a. The token starts at the same position, and ends inside the deletion range
                        // 2b. The token starts at the same position, and ends at the same position as the deletion range
                        // => the token is deleted
                        hasDeletedTokens = true;
                        continue;
                    }
                }
                else if (tokenDeltaLine < endDeltaLine || (tokenDeltaLine === endDeltaLine && tokenStartCharacter < endCharacter)) {
                    // 3a, 3b, 3c
                    if (tokenDeltaLine === endDeltaLine && tokenEndCharacter > endCharacter) {
                        // 3c. The token starts inside the deletion range, and ends after the deletion range
                        // => the token moves to continue right after the deletion
                        tokenDeltaLine = startDeltaLine;
                        tokenStartCharacter = startCharacter;
                        tokenEndCharacter = tokenStartCharacter + (tokenEndCharacter - endCharacter);
                    }
                    else {
                        // 3a. The token is inside the deletion range
                        // 3b. The token starts inside the deletion range, and ends at the same position as the deletion range
                        // => the token is deleted
                        hasDeletedTokens = true;
                        continue;
                    }
                }
                else if (tokenDeltaLine > endDeltaLine) {
                    // 4. (partial) The token starts after the deletion range, on a line below...
                    if (deletedLineCount === 0 && !hasDeletedTokens) {
                        // early stop, there is no need to walk all the tokens and do nothing...
                        newTokenCount = tokenCount;
                        break;
                    }
                    tokenDeltaLine -= deletedLineCount;
                }
                else if (tokenDeltaLine === endDeltaLine && tokenStartCharacter >= endCharacter) {
                    // 4. (continued) The token starts after the deletion range, on the last line where a deletion occurs
                    if (horizontalShiftForFirstLineTokens && tokenDeltaLine === 0) {
                        tokenStartCharacter += horizontalShiftForFirstLineTokens;
                        tokenEndCharacter += horizontalShiftForFirstLineTokens;
                    }
                    tokenDeltaLine -= deletedLineCount;
                    tokenStartCharacter -= (endCharacter - startCharacter);
                    tokenEndCharacter -= (endCharacter - startCharacter);
                }
                else {
                    throw new Error(`Not possible!`);
                }
                const destOffset = 4 * newTokenCount;
                tokens[destOffset] = tokenDeltaLine;
                tokens[destOffset + 1] = tokenStartCharacter;
                tokens[destOffset + 2] = tokenEndCharacter;
                tokens[destOffset + 3] = tokenMetadata;
                newTokenCount++;
            }
            this._tokenCount = newTokenCount;
        }
        acceptInsertText(deltaLine, character, eolCount, firstLineLength, lastLineLength, firstCharCode) {
            // Here are the cases I used to think about this:
            //
            // 1. The token is completely before the insertion point
            //            -----------   |
            // 2. The token ends precisely at the insertion point
            //            -----------|
            // 3. The token contains the insertion point
            //            -----|------
            // 4. The token starts precisely at the insertion point
            //            |-----------
            // 5. The token is completely after the insertion point
            //            |   -----------
            //
            const isInsertingPreciselyOneWordCharacter = (eolCount === 0
                && firstLineLength === 1
                && ((firstCharCode >= 48 /* CharCode.Digit0 */ && firstCharCode <= 57 /* CharCode.Digit9 */)
                    || (firstCharCode >= 65 /* CharCode.A */ && firstCharCode <= 90 /* CharCode.Z */)
                    || (firstCharCode >= 97 /* CharCode.a */ && firstCharCode <= 122 /* CharCode.z */)));
            const tokens = this._tokens;
            const tokenCount = this._tokenCount;
            for (let i = 0; i < tokenCount; i++) {
                const offset = 4 * i;
                let tokenDeltaLine = tokens[offset];
                let tokenStartCharacter = tokens[offset + 1];
                let tokenEndCharacter = tokens[offset + 2];
                if (tokenDeltaLine < deltaLine || (tokenDeltaLine === deltaLine && tokenEndCharacter < character)) {
                    // 1. The token is completely before the insertion point
                    // => nothing to do
                    continue;
                }
                else if (tokenDeltaLine === deltaLine && tokenEndCharacter === character) {
                    // 2. The token ends precisely at the insertion point
                    // => expand the end character only if inserting precisely one character that is a word character
                    if (isInsertingPreciselyOneWordCharacter) {
                        tokenEndCharacter += 1;
                    }
                    else {
                        continue;
                    }
                }
                else if (tokenDeltaLine === deltaLine && tokenStartCharacter < character && character < tokenEndCharacter) {
                    // 3. The token contains the insertion point
                    if (eolCount === 0) {
                        // => just expand the end character
                        tokenEndCharacter += firstLineLength;
                    }
                    else {
                        // => cut off the token
                        tokenEndCharacter = character;
                    }
                }
                else {
                    // 4. or 5.
                    if (tokenDeltaLine === deltaLine && tokenStartCharacter === character) {
                        // 4. The token starts precisely at the insertion point
                        // => grow the token (by keeping its start constant) only if inserting precisely one character that is a word character
                        // => otherwise behave as in case 5.
                        if (isInsertingPreciselyOneWordCharacter) {
                            continue;
                        }
                    }
                    // => the token must move and keep its size constant
                    if (tokenDeltaLine === deltaLine) {
                        tokenDeltaLine += eolCount;
                        // this token is on the line where the insertion is taking place
                        if (eolCount === 0) {
                            tokenStartCharacter += firstLineLength;
                            tokenEndCharacter += firstLineLength;
                        }
                        else {
                            const tokenLength = tokenEndCharacter - tokenStartCharacter;
                            tokenStartCharacter = lastLineLength + (tokenStartCharacter - character);
                            tokenEndCharacter = tokenStartCharacter + tokenLength;
                        }
                    }
                    else {
                        tokenDeltaLine += eolCount;
                    }
                }
                tokens[offset] = tokenDeltaLine;
                tokens[offset + 1] = tokenStartCharacter;
                tokens[offset + 2] = tokenEndCharacter;
            }
        }
    }
    class SparseLineTokens {
        constructor(tokens) {
            this._tokens = tokens;
        }
        getCount() {
            return this._tokens.length / 4;
        }
        getStartCharacter(tokenIndex) {
            return this._tokens[4 * tokenIndex + 1];
        }
        getEndCharacter(tokenIndex) {
            return this._tokens[4 * tokenIndex + 2];
        }
        getMetadata(tokenIndex) {
            return this._tokens[4 * tokenIndex + 3];
        }
    }
    exports.SparseLineTokens = SparseLineTokens;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BhcnNlTXVsdGlsaW5lVG9rZW5zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3Rva2Vucy9zcGFyc2VNdWx0aWxpbmVUb2tlbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHOztPQUVHO0lBQ0gsTUFBYSxxQkFBcUI7UUFFMUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxlQUF1QixFQUFFLE1BQW1CO1lBQ2hFLE9BQU8sSUFBSSxxQkFBcUIsQ0FBQyxlQUFlLEVBQUUsSUFBSSw0QkFBNEIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzdGLENBQUM7UUFNRDs7V0FFRztRQUNILElBQVcsZUFBZTtZQUN6QixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztRQUM5QixDQUFDO1FBRUQ7O1dBRUc7UUFDSCxJQUFXLGFBQWE7WUFDdkIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO1FBQzVCLENBQUM7UUFFRCxZQUFvQixlQUF1QixFQUFFLE1BQW9DO1lBQ2hGLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxlQUFlLENBQUM7WUFDeEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUM5RSxDQUFDO1FBRU0sUUFBUTtZQUNkLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVPLG9CQUFvQjtZQUMzQixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzlFLENBQUM7UUFFTSxPQUFPO1lBQ2IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQy9CLENBQUM7UUFFTSxhQUFhLENBQUMsVUFBa0I7WUFDdEMsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLElBQUksVUFBVSxJQUFJLFVBQVUsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQzlFLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFTSxRQUFRO1lBQ2QsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMzQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2pCLE9BQU8sVUFBVSxDQUFDO1lBQ25CLENBQUM7WUFDRCxPQUFPLElBQUksYUFBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxVQUFVLENBQUMsZUFBZSxFQUFFLFVBQVUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxhQUFhLEVBQUUsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RLLENBQUM7UUFFTSxZQUFZLENBQUMsS0FBWTtZQUMvQixNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztZQUNyRSxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztZQUVqRSxJQUFJLENBQUMsZ0JBQWdCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzdILElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQzdCLENBQUM7UUFFTSxLQUFLLENBQUMsS0FBWTtZQUN4Qix1QkFBdUI7WUFDdkIsbUNBQW1DO1lBQ25DLGtDQUFrQztZQUNsQyxNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztZQUNyRSxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztZQUVqRSxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLFdBQVcsR0FBRyxDQUFDLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDeEgsT0FBTyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hJLENBQUM7UUFFTSxTQUFTLENBQUMsS0FBYSxFQUFFLElBQVk7WUFDM0MsTUFBTSxDQUFDLFFBQVEsRUFBRSxlQUFlLEVBQUUsY0FBYyxDQUFDLEdBQUcsSUFBQSxxQkFBUSxFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25FLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsc0JBQWMsQ0FBQyxDQUFDO1FBQ3pILENBQUM7UUFFTSxVQUFVLENBQUMsS0FBYSxFQUFFLFFBQWdCLEVBQUUsZUFBdUIsRUFBRSxjQUFzQixFQUFFLGFBQXFCO1lBQ3hILElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxtQkFBUSxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ3pJLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQzdCLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxLQUFhO1lBQ3ZDLElBQUksS0FBSyxDQUFDLGVBQWUsS0FBSyxLQUFLLENBQUMsYUFBYSxJQUFJLEtBQUssQ0FBQyxXQUFXLEtBQUssS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUM1RixvQkFBb0I7Z0JBQ3BCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7WUFDckUsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7WUFFbEUsSUFBSSxhQUFhLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZCLDBGQUEwRjtnQkFDMUYsTUFBTSxpQkFBaUIsR0FBRyxhQUFhLEdBQUcsY0FBYyxDQUFDO2dCQUN6RCxJQUFJLENBQUMsZ0JBQWdCLElBQUksaUJBQWlCLENBQUM7Z0JBQzNDLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBRXpELElBQUksY0FBYyxJQUFJLGlCQUFpQixHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM3Qyw0RUFBNEU7Z0JBQzVFLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxjQUFjLEdBQUcsQ0FBQyxJQUFJLGFBQWEsSUFBSSxpQkFBaUIsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDbEUsa0RBQWtEO2dCQUNsRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO2dCQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNyQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksY0FBYyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN4QixNQUFNLGFBQWEsR0FBRyxDQUFDLGNBQWMsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLGdCQUFnQixJQUFJLGFBQWEsQ0FBQztnQkFFdkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pHLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsRUFBRSxjQUFjLEVBQUUsS0FBSyxDQUFDLFdBQVcsR0FBRyxDQUFDLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDOUcsQ0FBQztRQUNGLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxRQUFrQixFQUFFLFFBQWdCLEVBQUUsZUFBdUIsRUFBRSxjQUFzQixFQUFFLGFBQXFCO1lBRXJJLElBQUksUUFBUSxLQUFLLENBQUMsSUFBSSxlQUFlLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzdDLG9CQUFvQjtnQkFDcEIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztZQUU5RCxJQUFJLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDbkIsa0ZBQWtGO2dCQUNsRixJQUFJLENBQUMsZ0JBQWdCLElBQUksUUFBUSxDQUFDO2dCQUNsQyxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUV6RCxJQUFJLFNBQVMsSUFBSSxpQkFBaUIsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDeEMsb0VBQW9FO2dCQUNwRSxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ3pILENBQUM7S0FDRDtJQXZKRCxzREF1SkM7SUFFRCxNQUFNLDRCQUE0QjtRQVdqQyxZQUFZLE1BQW1CO1lBQzlCLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVNLFFBQVEsQ0FBQyxlQUF1QjtZQUN0QyxNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7WUFDNUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDM0MsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEdBQUcsZUFBZSxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZILENBQUM7WUFDRCxPQUFPLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDO1FBQ2hDLENBQUM7UUFFTSxlQUFlO1lBQ3JCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN6QyxJQUFJLFVBQVUsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDdEIsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNYLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFTSxRQUFRO1lBQ2QsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3pDLElBQUksVUFBVSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN0QixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0MsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDeEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN0RCxPQUFPLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxTQUFTLEdBQUcsQ0FBQyxFQUFFLFlBQVksRUFBRSxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUVPLGNBQWM7WUFDckIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFTyxhQUFhLENBQUMsVUFBa0I7WUFDdkMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRU8sa0JBQWtCLENBQUMsVUFBa0I7WUFDNUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVPLGdCQUFnQixDQUFDLFVBQWtCO1lBQzFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFTSxPQUFPO1lBQ2IsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBRU0sYUFBYSxDQUFDLFNBQWlCO1lBQ3JDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNaLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFckMsT0FBTyxHQUFHLEdBQUcsSUFBSSxFQUFFLENBQUM7Z0JBQ25CLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUU3QyxJQUFJLFlBQVksR0FBRyxTQUFTLEVBQUUsQ0FBQztvQkFDOUIsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0JBQ2YsQ0FBQztxQkFBTSxJQUFJLFlBQVksR0FBRyxTQUFTLEVBQUUsQ0FBQztvQkFDckMsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0JBQ2hCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUM7b0JBQ2QsT0FBTyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxLQUFLLFNBQVMsRUFBRSxDQUFDO3dCQUMvRCxHQUFHLEVBQUUsQ0FBQztvQkFDUCxDQUFDO29CQUNELElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQztvQkFDZCxPQUFPLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUM7d0JBQ2hFLEdBQUcsRUFBRSxDQUFDO29CQUNQLENBQUM7b0JBQ0QsT0FBTyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxRSxDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDM0MsT0FBTyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFFLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFTSxLQUFLO1lBQ1gsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUM7UUFDdEIsQ0FBQztRQUVNLFlBQVksQ0FBQyxjQUFzQixFQUFFLFNBQWlCLEVBQUUsWUFBb0IsRUFBRSxPQUFlO1lBQ25HLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDNUIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUNwQyxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDdEIsSUFBSSxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7WUFDN0IsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDckMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDeEIsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN6QyxNQUFNLG1CQUFtQixHQUFHLE1BQU0sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xELE1BQU0saUJBQWlCLEdBQUcsTUFBTSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDaEQsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFFNUMsSUFDQyxDQUFDLGNBQWMsR0FBRyxjQUFjLElBQUksQ0FBQyxjQUFjLEtBQUssY0FBYyxJQUFJLGlCQUFpQixJQUFJLFNBQVMsQ0FBQyxDQUFDO3VCQUN2RyxDQUFDLGNBQWMsR0FBRyxZQUFZLElBQUksQ0FBQyxjQUFjLEtBQUssWUFBWSxJQUFJLG1CQUFtQixJQUFJLE9BQU8sQ0FBQyxDQUFDLEVBQ3hHLENBQUM7b0JBQ0YsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO2dCQUN6QixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxhQUFhLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ3pCLGNBQWMsR0FBRyxjQUFjLENBQUM7b0JBQ2pDLENBQUM7b0JBQ0QsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO3dCQUN0QixrQ0FBa0M7d0JBQ2xDLE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBRyxhQUFhLENBQUM7d0JBQ3JDLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxjQUFjLEdBQUcsY0FBYyxDQUFDO3dCQUNyRCxNQUFNLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxHQUFHLG1CQUFtQixDQUFDO3dCQUM3QyxNQUFNLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxHQUFHLGlCQUFpQixDQUFDO3dCQUMzQyxNQUFNLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQztvQkFDeEMsQ0FBQztvQkFDRCxhQUFhLEVBQUUsQ0FBQztnQkFDakIsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMsV0FBVyxHQUFHLGFBQWEsQ0FBQztZQUVqQyxPQUFPLGNBQWMsQ0FBQztRQUN2QixDQUFDO1FBRU0sS0FBSyxDQUFDLGNBQXNCLEVBQUUsU0FBaUIsRUFBRSxZQUFvQixFQUFFLE9BQWU7WUFDNUYsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUM1QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQ3BDLE1BQU0sT0FBTyxHQUFhLEVBQUUsQ0FBQztZQUM3QixNQUFNLE9BQU8sR0FBYSxFQUFFLENBQUM7WUFDN0IsSUFBSSxVQUFVLEdBQWEsT0FBTyxDQUFDO1lBQ25DLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztZQUNuQixJQUFJLGtCQUFrQixHQUFXLENBQUMsQ0FBQztZQUNuQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3JDLE1BQU0sU0FBUyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3hCLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDekMsTUFBTSxtQkFBbUIsR0FBRyxNQUFNLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxNQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBRTVDLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxJQUFJLENBQUMsY0FBYyxLQUFLLGNBQWMsSUFBSSxpQkFBaUIsSUFBSSxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ2hILElBQUksQ0FBQyxjQUFjLEdBQUcsWUFBWSxJQUFJLENBQUMsY0FBYyxLQUFLLFlBQVksSUFBSSxtQkFBbUIsSUFBSSxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQzVHLG1DQUFtQzt3QkFDbkMsU0FBUztvQkFDVixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsZ0NBQWdDO3dCQUNoQyxJQUFJLFVBQVUsS0FBSyxPQUFPLEVBQUUsQ0FBQzs0QkFDNUIsZ0RBQWdEOzRCQUNoRCxVQUFVLEdBQUcsT0FBTyxDQUFDOzRCQUNyQixVQUFVLEdBQUcsQ0FBQyxDQUFDOzRCQUNmLGtCQUFrQixHQUFHLGNBQWMsQ0FBQzt3QkFDckMsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQUcsY0FBYyxHQUFHLGtCQUFrQixDQUFDO2dCQUMvRCxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUMsR0FBRyxtQkFBbUIsQ0FBQztnQkFDL0MsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQUcsaUJBQWlCLENBQUM7Z0JBQzdDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFHLGFBQWEsQ0FBQztZQUMxQyxDQUFDO1lBRUQsT0FBTyxDQUFDLElBQUksNEJBQTRCLENBQUMsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxJQUFJLDRCQUE0QixDQUFDLElBQUksV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUNySixDQUFDO1FBRU0saUJBQWlCLENBQUMsaUNBQXlDLEVBQUUsY0FBc0IsRUFBRSxjQUFzQixFQUFFLFlBQW9CLEVBQUUsWUFBb0I7WUFDN0osd0VBQXdFO1lBQ3hFLEVBQUU7WUFDRixnREFBZ0Q7WUFDaEQsd0RBQXdEO1lBQ3hELDRCQUE0QjtZQUM1Qix1Q0FBdUM7WUFDdkMsdUVBQXVFO1lBQ3ZFLDRCQUE0QjtZQUM1QixtQ0FBbUM7WUFDbkMsZ0ZBQWdGO1lBQ2hGLGdDQUFnQztZQUNoQyxnQ0FBZ0M7WUFDaEMsc0VBQXNFO1lBQ3RFLGdDQUFnQztZQUNoQywyQkFBMkI7WUFDM0IsRUFBRTtZQUNGLG1FQUFtRTtZQUNuRSxnRkFBZ0Y7WUFDaEYsd0JBQXdCO1lBQ3hCLDRCQUE0QjtZQUM1QixpR0FBaUc7WUFDakcsMkJBQTJCO1lBQzNCLDJCQUEyQjtZQUMzQiwrRUFBK0U7WUFDL0UsOEJBQThCO1lBQzlCLHdCQUF3QjtZQUN4QixFQUFFO1lBQ0YsZ0RBQWdEO1lBQ2hELDZDQUE2QztZQUM3Qyx5QkFBeUI7WUFDekIsNEJBQTRCO1lBQzVCLHNHQUFzRztZQUN0Ryw0QkFBNEI7WUFDNUIsNEJBQTRCO1lBQzVCLG9GQUFvRjtZQUNwRiw4QkFBOEI7WUFDOUIsMEJBQTBCO1lBQzFCLEVBQUU7WUFDRiwrQ0FBK0M7WUFDL0MsK0JBQStCO1lBQy9CLG9CQUFvQjtZQUNwQixFQUFFO1lBQ0YsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUM1QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQ3BDLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxZQUFZLEdBQUcsY0FBYyxDQUFDLENBQUM7WUFDekQsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDO1lBQ3RCLElBQUksZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO1lBQzdCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDckMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDeEIsSUFBSSxjQUFjLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN2QyxJQUFJLG1CQUFtQixHQUFHLE1BQU0sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELElBQUksaUJBQWlCLEdBQUcsTUFBTSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFFNUMsSUFBSSxjQUFjLEdBQUcsY0FBYyxJQUFJLENBQUMsY0FBYyxLQUFLLGNBQWMsSUFBSSxpQkFBaUIsSUFBSSxjQUFjLENBQUMsRUFBRSxDQUFDO29CQUNuSCx3REFBd0Q7b0JBQ3hELG1CQUFtQjtvQkFDbkIsYUFBYSxFQUFFLENBQUM7b0JBQ2hCLFNBQVM7Z0JBQ1YsQ0FBQztxQkFBTSxJQUFJLGNBQWMsS0FBSyxjQUFjLElBQUksbUJBQW1CLEdBQUcsY0FBYyxFQUFFLENBQUM7b0JBQ3RGLGFBQWE7b0JBQ2IsZ0RBQWdEO29CQUNoRCxJQUFJLGNBQWMsS0FBSyxZQUFZLElBQUksaUJBQWlCLEdBQUcsWUFBWSxFQUFFLENBQUM7d0JBQ3pFLHNFQUFzRTt3QkFDdEUsdURBQXVEO3dCQUN2RCxpQkFBaUIsSUFBSSxDQUFDLFlBQVksR0FBRyxjQUFjLENBQUMsQ0FBQztvQkFDdEQsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLHVFQUF1RTt3QkFDdkUsZ0ZBQWdGO3dCQUNoRix3REFBd0Q7d0JBQ3hELGlCQUFpQixHQUFHLGNBQWMsQ0FBQztvQkFDcEMsQ0FBQztnQkFDRixDQUFDO3FCQUFNLElBQUksY0FBYyxLQUFLLGNBQWMsSUFBSSxtQkFBbUIsS0FBSyxjQUFjLEVBQUUsQ0FBQztvQkFDeEYsYUFBYTtvQkFDYixJQUFJLGNBQWMsS0FBSyxZQUFZLElBQUksaUJBQWlCLEdBQUcsWUFBWSxFQUFFLENBQUM7d0JBQ3pFLCtFQUErRTt3QkFDL0UsdURBQXVEO3dCQUN2RCxpQkFBaUIsSUFBSSxDQUFDLFlBQVksR0FBRyxjQUFjLENBQUMsQ0FBQztvQkFDdEQsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLGdGQUFnRjt3QkFDaEYsaUdBQWlHO3dCQUNqRywwQkFBMEI7d0JBQzFCLGdCQUFnQixHQUFHLElBQUksQ0FBQzt3QkFDeEIsU0FBUztvQkFDVixDQUFDO2dCQUNGLENBQUM7cUJBQU0sSUFBSSxjQUFjLEdBQUcsWUFBWSxJQUFJLENBQUMsY0FBYyxLQUFLLFlBQVksSUFBSSxtQkFBbUIsR0FBRyxZQUFZLENBQUMsRUFBRSxDQUFDO29CQUNySCxhQUFhO29CQUNiLElBQUksY0FBYyxLQUFLLFlBQVksSUFBSSxpQkFBaUIsR0FBRyxZQUFZLEVBQUUsQ0FBQzt3QkFDekUsb0ZBQW9GO3dCQUNwRiwwREFBMEQ7d0JBQzFELGNBQWMsR0FBRyxjQUFjLENBQUM7d0JBQ2hDLG1CQUFtQixHQUFHLGNBQWMsQ0FBQzt3QkFDckMsaUJBQWlCLEdBQUcsbUJBQW1CLEdBQUcsQ0FBQyxpQkFBaUIsR0FBRyxZQUFZLENBQUMsQ0FBQztvQkFDOUUsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLDZDQUE2Qzt3QkFDN0Msc0dBQXNHO3dCQUN0RywwQkFBMEI7d0JBQzFCLGdCQUFnQixHQUFHLElBQUksQ0FBQzt3QkFDeEIsU0FBUztvQkFDVixDQUFDO2dCQUNGLENBQUM7cUJBQU0sSUFBSSxjQUFjLEdBQUcsWUFBWSxFQUFFLENBQUM7b0JBQzFDLDZFQUE2RTtvQkFDN0UsSUFBSSxnQkFBZ0IsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO3dCQUNqRCx3RUFBd0U7d0JBQ3hFLGFBQWEsR0FBRyxVQUFVLENBQUM7d0JBQzNCLE1BQU07b0JBQ1AsQ0FBQztvQkFDRCxjQUFjLElBQUksZ0JBQWdCLENBQUM7Z0JBQ3BDLENBQUM7cUJBQU0sSUFBSSxjQUFjLEtBQUssWUFBWSxJQUFJLG1CQUFtQixJQUFJLFlBQVksRUFBRSxDQUFDO29CQUNuRixxR0FBcUc7b0JBQ3JHLElBQUksaUNBQWlDLElBQUksY0FBYyxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUMvRCxtQkFBbUIsSUFBSSxpQ0FBaUMsQ0FBQzt3QkFDekQsaUJBQWlCLElBQUksaUNBQWlDLENBQUM7b0JBQ3hELENBQUM7b0JBQ0QsY0FBYyxJQUFJLGdCQUFnQixDQUFDO29CQUNuQyxtQkFBbUIsSUFBSSxDQUFDLFlBQVksR0FBRyxjQUFjLENBQUMsQ0FBQztvQkFDdkQsaUJBQWlCLElBQUksQ0FBQyxZQUFZLEdBQUcsY0FBYyxDQUFDLENBQUM7Z0JBQ3RELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUNsQyxDQUFDO2dCQUVELE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBRyxhQUFhLENBQUM7Z0JBQ3JDLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxjQUFjLENBQUM7Z0JBQ3BDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLEdBQUcsbUJBQW1CLENBQUM7Z0JBQzdDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLEdBQUcsaUJBQWlCLENBQUM7Z0JBQzNDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLEdBQUcsYUFBYSxDQUFDO2dCQUN2QyxhQUFhLEVBQUUsQ0FBQztZQUNqQixDQUFDO1lBRUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxhQUFhLENBQUM7UUFDbEMsQ0FBQztRQUVNLGdCQUFnQixDQUFDLFNBQWlCLEVBQUUsU0FBaUIsRUFBRSxRQUFnQixFQUFFLGVBQXVCLEVBQUUsY0FBc0IsRUFBRSxhQUFxQjtZQUNySixpREFBaUQ7WUFDakQsRUFBRTtZQUNGLHdEQUF3RDtZQUN4RCw2QkFBNkI7WUFDN0IscURBQXFEO1lBQ3JELDBCQUEwQjtZQUMxQiw0Q0FBNEM7WUFDNUMsMEJBQTBCO1lBQzFCLHVEQUF1RDtZQUN2RCwwQkFBMEI7WUFDMUIsdURBQXVEO1lBQ3ZELDZCQUE2QjtZQUM3QixFQUFFO1lBQ0YsTUFBTSxvQ0FBb0MsR0FBRyxDQUM1QyxRQUFRLEtBQUssQ0FBQzttQkFDWCxlQUFlLEtBQUssQ0FBQzttQkFDckIsQ0FDRixDQUFDLGFBQWEsNEJBQW1CLElBQUksYUFBYSw0QkFBbUIsQ0FBQzt1QkFDbkUsQ0FBQyxhQUFhLHVCQUFjLElBQUksYUFBYSx1QkFBYyxDQUFDO3VCQUM1RCxDQUFDLGFBQWEsdUJBQWMsSUFBSSxhQUFhLHdCQUFjLENBQUMsQ0FDL0QsQ0FDRCxDQUFDO1lBQ0YsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUM1QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQ3BDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDckMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDckIsSUFBSSxjQUFjLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNwQyxJQUFJLG1CQUFtQixHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQzdDLElBQUksaUJBQWlCLEdBQUcsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFFM0MsSUFBSSxjQUFjLEdBQUcsU0FBUyxJQUFJLENBQUMsY0FBYyxLQUFLLFNBQVMsSUFBSSxpQkFBaUIsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDO29CQUNuRyx3REFBd0Q7b0JBQ3hELG1CQUFtQjtvQkFDbkIsU0FBUztnQkFDVixDQUFDO3FCQUFNLElBQUksY0FBYyxLQUFLLFNBQVMsSUFBSSxpQkFBaUIsS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDNUUscURBQXFEO29CQUNyRCxpR0FBaUc7b0JBQ2pHLElBQUksb0NBQW9DLEVBQUUsQ0FBQzt3QkFDMUMsaUJBQWlCLElBQUksQ0FBQyxDQUFDO29CQUN4QixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsU0FBUztvQkFDVixDQUFDO2dCQUNGLENBQUM7cUJBQU0sSUFBSSxjQUFjLEtBQUssU0FBUyxJQUFJLG1CQUFtQixHQUFHLFNBQVMsSUFBSSxTQUFTLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQztvQkFDN0csNENBQTRDO29CQUM1QyxJQUFJLFFBQVEsS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDcEIsbUNBQW1DO3dCQUNuQyxpQkFBaUIsSUFBSSxlQUFlLENBQUM7b0JBQ3RDLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCx1QkFBdUI7d0JBQ3ZCLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztvQkFDL0IsQ0FBQztnQkFDRixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsV0FBVztvQkFDWCxJQUFJLGNBQWMsS0FBSyxTQUFTLElBQUksbUJBQW1CLEtBQUssU0FBUyxFQUFFLENBQUM7d0JBQ3ZFLHVEQUF1RDt3QkFDdkQsdUhBQXVIO3dCQUN2SCxvQ0FBb0M7d0JBQ3BDLElBQUksb0NBQW9DLEVBQUUsQ0FBQzs0QkFDMUMsU0FBUzt3QkFDVixDQUFDO29CQUNGLENBQUM7b0JBQ0Qsb0RBQW9EO29CQUNwRCxJQUFJLGNBQWMsS0FBSyxTQUFTLEVBQUUsQ0FBQzt3QkFDbEMsY0FBYyxJQUFJLFFBQVEsQ0FBQzt3QkFDM0IsZ0VBQWdFO3dCQUNoRSxJQUFJLFFBQVEsS0FBSyxDQUFDLEVBQUUsQ0FBQzs0QkFDcEIsbUJBQW1CLElBQUksZUFBZSxDQUFDOzRCQUN2QyxpQkFBaUIsSUFBSSxlQUFlLENBQUM7d0JBQ3RDLENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxNQUFNLFdBQVcsR0FBRyxpQkFBaUIsR0FBRyxtQkFBbUIsQ0FBQzs0QkFDNUQsbUJBQW1CLEdBQUcsY0FBYyxHQUFHLENBQUMsbUJBQW1CLEdBQUcsU0FBUyxDQUFDLENBQUM7NEJBQ3pFLGlCQUFpQixHQUFHLG1CQUFtQixHQUFHLFdBQVcsQ0FBQzt3QkFDdkQsQ0FBQztvQkFDRixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsY0FBYyxJQUFJLFFBQVEsQ0FBQztvQkFDNUIsQ0FBQztnQkFDRixDQUFDO2dCQUVELE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxjQUFjLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsbUJBQW1CLENBQUM7Z0JBQ3pDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsaUJBQWlCLENBQUM7WUFDeEMsQ0FBQztRQUNGLENBQUM7S0FDRDtJQUVELE1BQWEsZ0JBQWdCO1FBSTVCLFlBQVksTUFBbUI7WUFDOUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7UUFDdkIsQ0FBQztRQUVNLFFBQVE7WUFDZCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNoQyxDQUFDO1FBRU0saUJBQWlCLENBQUMsVUFBa0I7WUFDMUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVNLGVBQWUsQ0FBQyxVQUFrQjtZQUN4QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRU0sV0FBVyxDQUFDLFVBQWtCO1lBQ3BDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7S0FDRDtJQXZCRCw0Q0F1QkMifQ==