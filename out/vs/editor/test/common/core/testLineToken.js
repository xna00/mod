/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/encodedTokenAttributes"], function (require, exports, encodedTokenAttributes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestLineTokenFactory = exports.TestLineTokens = exports.TestLineToken = void 0;
    /**
     * A token on a line.
     */
    class TestLineToken {
        constructor(endIndex, metadata) {
            this.endIndex = endIndex;
            this._metadata = metadata;
        }
        getForeground() {
            return encodedTokenAttributes_1.TokenMetadata.getForeground(this._metadata);
        }
        getType() {
            return encodedTokenAttributes_1.TokenMetadata.getClassNameFromMetadata(this._metadata);
        }
        getInlineStyle(colorMap) {
            return encodedTokenAttributes_1.TokenMetadata.getInlineStyleFromMetadata(this._metadata, colorMap);
        }
        getPresentation() {
            return encodedTokenAttributes_1.TokenMetadata.getPresentationFromMetadata(this._metadata);
        }
        static _equals(a, b) {
            return (a.endIndex === b.endIndex
                && a._metadata === b._metadata);
        }
        static equalsArr(a, b) {
            const aLen = a.length;
            const bLen = b.length;
            if (aLen !== bLen) {
                return false;
            }
            for (let i = 0; i < aLen; i++) {
                if (!this._equals(a[i], b[i])) {
                    return false;
                }
            }
            return true;
        }
    }
    exports.TestLineToken = TestLineToken;
    class TestLineTokens {
        constructor(actual) {
            this._actual = actual;
        }
        equals(other) {
            if (other instanceof TestLineTokens) {
                return TestLineToken.equalsArr(this._actual, other._actual);
            }
            return false;
        }
        getCount() {
            return this._actual.length;
        }
        getForeground(tokenIndex) {
            return this._actual[tokenIndex].getForeground();
        }
        getEndOffset(tokenIndex) {
            return this._actual[tokenIndex].endIndex;
        }
        getClassName(tokenIndex) {
            return this._actual[tokenIndex].getType();
        }
        getInlineStyle(tokenIndex, colorMap) {
            return this._actual[tokenIndex].getInlineStyle(colorMap);
        }
        getPresentation(tokenIndex) {
            return this._actual[tokenIndex].getPresentation();
        }
        findTokenIndexAtOffset(offset) {
            throw new Error('Not implemented');
        }
        getLineContent() {
            throw new Error('Not implemented');
        }
        getMetadata(tokenIndex) {
            throw new Error('Method not implemented.');
        }
        getLanguageId(tokenIndex) {
            throw new Error('Method not implemented.');
        }
    }
    exports.TestLineTokens = TestLineTokens;
    class TestLineTokenFactory {
        static inflateArr(tokens) {
            const tokensCount = (tokens.length >>> 1);
            const result = new Array(tokensCount);
            for (let i = 0; i < tokensCount; i++) {
                const endOffset = tokens[i << 1];
                const metadata = tokens[(i << 1) + 1];
                result[i] = new TestLineToken(endOffset, metadata);
            }
            return result;
        }
    }
    exports.TestLineTokenFactory = TestLineTokenFactory;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdExpbmVUb2tlbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL2NvcmUvdGVzdExpbmVUb2tlbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEc7O09BRUc7SUFDSCxNQUFhLGFBQWE7UUFRekIsWUFBWSxRQUFnQixFQUFFLFFBQWdCO1lBQzdDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQzNCLENBQUM7UUFFTSxhQUFhO1lBQ25CLE9BQU8sc0NBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFTSxPQUFPO1lBQ2IsT0FBTyxzQ0FBYSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRU0sY0FBYyxDQUFDLFFBQWtCO1lBQ3ZDLE9BQU8sc0NBQWEsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzNFLENBQUM7UUFFTSxlQUFlO1lBQ3JCLE9BQU8sc0NBQWEsQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVPLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBZ0IsRUFBRSxDQUFnQjtZQUN4RCxPQUFPLENBQ04sQ0FBQyxDQUFDLFFBQVEsS0FBSyxDQUFDLENBQUMsUUFBUTttQkFDdEIsQ0FBQyxDQUFDLFNBQVMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUM5QixDQUFDO1FBQ0gsQ0FBQztRQUVNLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBa0IsRUFBRSxDQUFrQjtZQUM3RCxNQUFNLElBQUks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