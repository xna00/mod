/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/encodedTokenAttributes"], function (require, exports, encodedTokenAttributes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LineTokens = void 0;
    class LineTokens {
        static { this.defaultTokenMetadata = ((0 /* FontStyle.None */ << 11 /* MetadataConsts.FONT_STYLE_OFFSET */)
            | (1 /* ColorId.DefaultForeground */ << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
            | (2 /* ColorId.DefaultBackground */ << 24 /* MetadataConsts.BACKGROUND_OFFSET */)) >>> 0; }
        static createEmpty(lineContent, decoder) {
            const defaultMetadata = LineTokens.defaultTokenMetadata;
            const tokens = new Uint32Array(2);
            tokens[0] = lineContent.length;
            tokens[1] = defaultMetadata;
            return new LineTokens(tokens, lineContent, decoder);
        }
        constructor(tokens, text, decoder) {
            this._lineTokensBrand = undefined;
            this._tokens = tokens;
            this._tokensCount = (this._tokens.length >>> 1);
            this._text = text;
            this._languageIdCodec = decoder;
        }
        equals(other) {
            if (other instanceof LineTokens) {
                return this.slicedEquals(other, 0, this._tokensCount);
            }
            return false;
        }
        slicedEquals(other, sliceFromTokenIndex, sliceTokenCount) {
            if (this._text !== other._text) {
                return false;
            }
            if (this._tokensCount !== other._tokensCount) {
                return false;
            }
            const from = (sliceFromTokenIndex << 1);
            const to = from + (sliceTokenCount << 1);
            for (let i = from; i < to; i++) {
                if (this._tokens[i] !== other._tokens[i]) {
                    return false;
                }
            }
            return true;
        }
        getLineContent() {
            return this._text;
        }
        getCount() {
            return this._tokensCount;
        }
        getStartOffset(tokenIndex) {
            if (tokenIndex > 0) {
                return this._tokens[(tokenIndex - 1) << 1];
            }
            return 0;
        }
        getMetadata(tokenIndex) {
            const metadata = this._tokens[(tokenIndex << 1) + 1];
            return metadata;
        }
        getLanguageId(tokenIndex) {
            const metadata = this._tokens[(tokenIndex << 1) + 1];
            const languageId = encodedTokenAttributes_1.TokenMetadata.getLanguageId(metadata);
            return this._languageIdCodec.decodeLanguageId(languageId);
        }
        getStandardTokenType(tokenIndex) {
            const metadata = this._tokens[(tokenIndex << 1) + 1];
            return encodedTokenAttributes_1.TokenMetadata.getTokenType(metadata);
        }
        getForeground(tokenIndex) {
            const metadata = this._tokens[(tokenIndex << 1) + 1];
            return encodedTokenAttributes_1.TokenMetadata.getForeground(metadata);
        }
        getClassName(tokenIndex) {
            const metadata = this._tokens[(tokenIndex << 1) + 1];
            return encodedTokenAttributes_1.TokenMetadata.getClassNameFromMetadata(metadata);
        }
        getInlineStyle(tokenIndex, colorMap) {
            const metadata = this._tokens[(tokenIndex << 1) + 1];
            return encodedTokenAttributes_1.TokenMetadata.getInlineStyleFromMetadata(metadata, colorMap);
        }
        getPresentation(tokenIndex) {
            const metadata = this._tokens[(tokenIndex << 1) + 1];
            return encodedTokenAttributes_1.TokenMetadata.getPresentationFromMetadata(metadata);
        }
        getEndOffset(tokenIndex) {
            return this._tokens[tokenIndex << 1];
        }
        /**
         * Find the token containing offset `offset`.
         * @param offset The search offset
         * @return The index of the token containing the offset.
         */
        findTokenIndexAtOffset(offset) {
            return LineTokens.findIndexInTokensArray(this._tokens, offset);
        }
        inflate() {
            return this;
        }
        sliceAndInflate(startOffset, endOffset, deltaOffset) {
            return new SliceLineTokens(this, startOffset, endOffset, deltaOffset);
        }
        static convertToEndOffset(tokens, lineTextLength) {
            const tokenCount = (tokens.length >>> 1);
            const lastTokenIndex = tokenCount - 1;
            for (let tokenIndex = 0; tokenIndex < lastTokenIndex; tokenIndex++) {
                tokens[tokenIndex << 1] = tokens[(tokenIndex + 1) << 1];
            }
            tokens[lastTokenIndex << 1] = lineTextLength;
        }
        static findIndexInTokensArray(tokens, desiredIndex) {
            if (tokens.length <= 2) {
                return 0;
            }
            let low = 0;
            let high = (tokens.length >>> 1) - 1;
            while (low < high) {
                const mid = low + Math.floor((high - low) / 2);
                const endOffset = tokens[(mid << 1)];
                if (endOffset === desiredIndex) {
                    return mid + 1;
                }
                else if (endOffset < desiredIndex) {
                    low = mid + 1;
                }
                else if (endOffset > desiredIndex) {
                    high = mid;
                }
            }
            return low;
        }
        /**
         * @pure
         * @param insertTokens Must be sorted by offset.
        */
        withInserted(insertTokens) {
            if (insertTokens.length === 0) {
                return this;
            }
            let nextOriginalTokenIdx = 0;
            let nextInsertTokenIdx = 0;
            let text = '';
            const newTokens = new Array();
            let originalEndOffset = 0;
            while (true) {
                const nextOriginalTokenEndOffset = nextOriginalTokenIdx < this._tokensCount ? this._tokens[nextOriginalTokenIdx << 1] : -1;
                const nextInsertToken = nextInsertTokenIdx < insertTokens.length ? insertTokens[nextInsertTokenIdx] : null;
                if (nextOriginalTokenEndOffset !== -1 && (nextInsertToken === null || nextOriginalTokenEndOffset <= nextInsertToken.offset)) {
                    // original token ends before next insert token
                    text += this._text.substring(originalEndOffset, nextOriginalTokenEndOffset);
                    const metadata = this._tokens[(nextOriginalTokenIdx << 1) + 1];
                    newTokens.push(text.length, metadata);
                    nextOriginalTokenIdx++;
                    originalEndOffset = nextOriginalTokenEndOffset;
                }
                else if (nextInsertToken) {
                    if (nextInsertToken.offset > originalEndOffset) {
                        // insert token is in the middle of the next token.
                        text += this._text.substring(originalEndOffset, nextInsertToken.offset);
                        const metadata = this._tokens[(nextOriginalTokenIdx << 1) + 1];
                        newTokens.push(text.length, metadata);
                        originalEndOffset = nextInsertToken.offset;
                    }
                    text += nextInsertToken.text;
                    newTokens.push(text.length, nextInsertToken.tokenMetadata);
                    nextInsertTokenIdx++;
                }
                else {
                    break;
                }
            }
            return new LineTokens(new Uint32Array(newTokens), text, this._languageIdCodec);
        }
    }
    exports.LineTokens = LineTokens;
    class SliceLineTokens {
        constructor(source, startOffset, endOffset, deltaOffset) {
            this._source = source;
            this._startOffset = startOffset;
            this._endOffset = endOffset;
            this._deltaOffset = deltaOffset;
            this._firstTokenIndex = source.findTokenIndexAtOffset(startOffset);
            this._tokensCount = 0;
            for (let i = this._firstTokenIndex, len = source.getCount(); i < len; i++) {
                const tokenStartOffset = source.getStartOffset(i);
                if (tokenStartOffset >= endOffset) {
                    break;
                }
                this._tokensCount++;
            }
        }
        getMetadata(tokenIndex) {
            return this._source.getMetadata(this._firstTokenIndex + tokenIndex);
        }
        getLanguageId(tokenIndex) {
            return this._source.getLanguageId(this._firstTokenIndex + tokenIndex);
        }
        getLineContent() {
            return this._source.getLineContent().substring(this._startOffset, this._endOffset);
        }
        equals(other) {
            if (other instanceof SliceLineTokens) {
                return (this._startOffset === other._startOffset
                    && this._endOffset === other._endOffset
                    && this._deltaOffset === other._deltaOffset
                    && this._source.slicedEquals(other._source, this._firstTokenIndex, this._tokensCount));
            }
            return false;
        }
        getCount() {
            return this._tokensCount;
        }
        getForeground(tokenIndex) {
            return this._source.getForeground(this._firstTokenIndex + tokenIndex);
        }
        getEndOffset(tokenIndex) {
            const tokenEndOffset = this._source.getEndOffset(this._firstTokenIndex + tokenIndex);
            return Math.min(this._endOffset, tokenEndOffset) - this._startOffset + this._deltaOffset;
        }
        getClassName(tokenIndex) {
            return this._source.getClassName(this._firstTokenIndex + tokenIndex);
        }
        getInlineStyle(tokenIndex, colorMap) {
            return this._source.getInlineStyle(this._firstTokenIndex + tokenIndex, colorMap);
        }
        getPresentation(tokenIndex) {
            return this._source.getPresentation(this._firstTokenIndex + tokenIndex);
        }
        findTokenIndexAtOffset(offset) {
            return this._source.findTokenIndexAtOffset(offset + this._startOffset - this._deltaOffset) - this._firstTokenIndex;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZVRva2Vucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi90b2tlbnMvbGluZVRva2Vucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtQmhHLE1BQWEsVUFBVTtpQkFRUix5QkFBb0IsR0FBRyxDQUNwQyxDQUFDLG1FQUFrRCxDQUFDO2NBQ2xELENBQUMsOEVBQTZELENBQUM7Y0FDL0QsQ0FBQyw4RUFBNkQsQ0FBQyxDQUNqRSxLQUFLLENBQUMsQUFKMkIsQ0FJMUI7UUFFRCxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQW1CLEVBQUUsT0FBeUI7WUFDdkUsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDLG9CQUFvQixDQUFDO1lBRXhELE1BQU0sTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxlQUFlLENBQUM7WUFFNUIsT0FBTyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFFRCxZQUFZLE1BQW1CLEVBQUUsSUFBWSxFQUFFLE9BQXlCO1lBdkJ4RSxxQkFBZ0IsR0FBUyxTQUFTLENBQUM7WUF3QmxDLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNoRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztZQUNsQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsT0FBTyxDQUFDO1FBQ2pDLENBQUM7UUFF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