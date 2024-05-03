/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/tokens/lineTokens"], function (require, exports, arrays, lineTokens_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SparseTokensStore = void 0;
    /**
     * Represents sparse tokens in a text model.
     */
    class SparseTokensStore {
        constructor(languageIdCodec) {
            this._pieces = [];
            this._isComplete = false;
            this._languageIdCodec = languageIdCodec;
        }
        flush() {
            this._pieces = [];
            this._isComplete = false;
        }
        isEmpty() {
            return (this._pieces.length === 0);
        }
        set(pieces, isComplete) {
            this._pieces = pieces || [];
            this._isComplete = isComplete;
        }
        setPartial(_range, pieces) {
            // console.log(`setPartial ${_range} ${pieces.map(p => p.toString()).join(', ')}`);
            let range = _range;
            if (pieces.length > 0) {
                const _firstRange = pieces[0].getRange();
                const _lastRange = pieces[pieces.length - 1].getRange();
                if (!_firstRange || !_lastRange) {
                    return _range;
                }
                range = _range.plusRange(_firstRange).plusRange(_lastRange);
            }
            let insertPosition = null;
            for (let i = 0, len = this._pieces.length; i < len; i++) {
                const piece = this._pieces[i];
                if (piece.endLineNumber < range.startLineNumber) {
                    // this piece is before the range
                    continue;
                }
                if (piece.startLineNumber > range.endLineNumber) {
                    // this piece is after the range, so mark the spot before this piece
                    // as a good insertion position and stop looping
                    insertPosition = insertPosition || { index: i };
                    break;
                }
                // this piece might intersect with the range
                piece.removeTokens(range);
                if (piece.isEmpty()) {
                    // remove the piece if it became empty
                    this._pieces.splice(i, 1);
                    i--;
                    len--;
                    continue;
                }
                if (piece.endLineNumber < range.startLineNumber) {
                    // after removal, this piece is before the range
                    continue;
                }
                if (piece.startLineNumber > range.endLineNumber) {
                    // after removal, this piece is after the range
                    insertPosition = insertPosition || { index: i };
                    continue;
                }
                // after removal, this piece contains the range
                const [a, b] = piece.split(range);
                if (a.isEmpty()) {
                    // this piece is actually after the range
                    insertPosition = insertPosition || { index: i };
                    continue;
                }
                if (b.isEmpty()) {
                    // this piece is actually before the range
                    continue;
                }
                this._pieces.splice(i, 1, a, b);
                i++;
                len++;
                insertPosition = insertPosition || { index: i };
            }
            insertPosition = insertPosition || { index: this._pieces.length };
            if (pieces.length > 0) {
                this._pieces = arrays.arrayInsert(this._pieces, insertPosition.index, pieces);
            }
            // console.log(`I HAVE ${this._pieces.length} pieces`);
            // console.log(`${this._pieces.map(p => p.toString()).join('\n')}`);
            return range;
        }
        isComplete() {
            return this._isComplete;
        }
        addSparseTokens(lineNumber, aTokens) {
            if (aTokens.getLineContent().length === 0) {
                // Don't do anything for empty lines
                return aTokens;
            }
            const pieces = this._pieces;
            if (pieces.length === 0) {
                return aTokens;
            }
            const pieceIndex = SparseTokensStore._findFirstPieceWithLine(pieces, lineNumber);
            const bTokens = pieces[pieceIndex].getLineTokens(lineNumber);
            if (!bTokens) {
                return aTokens;
            }
            const aLen = aTokens.getCount();
            const bLen = bTokens.getCount();
            let aIndex = 0;
            const result = [];
            let resultLen = 0;
            let lastEndOffset = 0;
            const emitToken = (endOffset, metadata) => {
                if (endOffset === lastEndOffset) {
                    return;
                }
                lastEndOffset = endOffset;
                result[resultLen++] = endOffset;
                result[resultLen++] = metadata;
            };
            for (let bIndex = 0; bIndex < bLen; bIndex++) {
                const bStartCharacter = bTokens.getStartCharacter(bIndex);
                const bEndCharacter = bTokens.getEndCharacter(bIndex);
                const bMetadata = bTokens.getMetadata(bIndex);
                const bMask = (((bMetadata & 1 /* MetadataConsts.SEMANTIC_USE_ITALIC */) ? 2048 /* MetadataConsts.ITALIC_MASK */ : 0)
                    | ((bMetadata & 2 /* MetadataConsts.SEMANTIC_USE_BOLD */) ? 4096 /* MetadataConsts.BOLD_MASK */ : 0)
                    | ((bMetadata & 4 /* MetadataConsts.SEMANTIC_USE_UNDERLINE */) ? 8192 /* MetadataConsts.UNDERLINE_MASK */ : 0)
                    | ((bMetadata & 8 /* MetadataConsts.SEMANTIC_USE_STRIKETHROUGH */) ? 16384 /* MetadataConsts.STRIKETHROUGH_MASK */ : 0)
                    | ((bMetadata & 16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */) ? 16744448 /* MetadataConsts.FOREGROUND_MASK */ : 0)
                    | ((bMetadata & 32 /* MetadataConsts.SEMANTIC_USE_BACKGROUND */) ? 4278190080 /* MetadataConsts.BACKGROUND_MASK */ : 0)) >>> 0;
                const aMask = (~bMask) >>> 0;
                // push any token from `a` that is before `b`
                while (aIndex < aLen && aTokens.getEndOffset(aIndex) <= bStartCharacter) {
                    emitToken(aTokens.getEndOffset(aIndex), aTokens.getMetadata(aIndex));
                    aIndex++;
                }
                // push the token from `a` if it intersects the token from `b`
                if (aIndex < aLen && aTokens.getStartOffset(aIndex) < bStartCharacter) {
                    emitToken(bStartCharacter, aTokens.getMetadata(aIndex));
                }
                // skip any tokens from `a` that are contained inside `b`
                while (aIndex < aLen && aTokens.getEndOffset(aIndex) < bEndCharacter) {
                    emitToken(aTokens.getEndOffset(aIndex), (aTokens.getMetadata(aIndex) & aMask) | (bMetadata & bMask));
                    aIndex++;
                }
                if (aIndex < aLen) {
                    emitToken(bEndCharacter, (aTokens.getMetadata(aIndex) & aMask) | (bMetadata & bMask));
                    if (aTokens.getEndOffset(aIndex) === bEndCharacter) {
                        // `a` ends exactly at the same spot as `b`!
                        aIndex++;
                    }
                }
                else {
                    const aMergeIndex = Math.min(Math.max(0, aIndex - 1), aLen - 1);
                    // push the token from `b`
                    emitToken(bEndCharacter, (aTokens.getMetadata(aMergeIndex) & aMask) | (bMetadata & bMask));
                }
            }
            // push the remaining tokens from `a`
            while (aIndex < aLen) {
                emitToken(aTokens.getEndOffset(aIndex), aTokens.getMetadata(aIndex));
                aIndex++;
            }
            return new lineTokens_1.LineTokens(new Uint32Array(result), aTokens.getLineContent(), this._languageIdCodec);
        }
        static _findFirstPieceWithLine(pieces, lineNumber) {
            let low = 0;
            let high = pieces.length - 1;
            while (low < high) {
                let mid = low + Math.floor((high - low) / 2);
                if (pieces[mid].endLineNumber < lineNumber) {
                    low = mid + 1;
                }
                else if (pieces[mid].startLineNumber > lineNumber) {
                    high = mid - 1;
                }
                else {
                    while (mid > low && pieces[mid - 1].startLineNumber <= lineNumber && lineNumber <= pieces[mid - 1].endLineNumber) {
                        mid--;
                    }
                    return mid;
                }
            }
            return low;
        }
        acceptEdit(range, eolCount, firstLineLength, lastLineLength, firstCharCode) {
            for (const piece of this._pieces) {
                piece.acceptEdit(range, eolCount, firstLineLength, lastLineLength, firstCharCode);
            }
        }
    }
    exports.SparseTokensStore = SparseTokensStore;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BhcnNlVG9rZW5zU3RvcmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vdG9rZW5zL3NwYXJzZVRva2Vuc1N0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRzs7T0FFRztJQUNILE1BQWEsaUJBQWlCO1FBTTdCLFlBQVksZUFBaUM7WUFDNUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDekIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztRQUN6QyxDQUFDO1FBRU0sS0FBSztZQUNYLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1FBQzFCLENBQUM7UUFFTSxPQUFPO1lBQ2IsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFTSxHQUFHLENBQUMsTUFBc0MsRUFBRSxVQUFtQjtZQUNyRSxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sSUFBSSxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7UUFDL0IsQ0FBQztRQUVNLFVBQVUsQ0FBQyxNQUFhLEVBQUUsTUFBK0I7WUFDL0QsbUZBQW1GO1lBRW5GLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQztZQUNuQixJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDekMsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLE1BQU0s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