/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/tokens/lineTokens"], function (require, exports, lineTokens_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContiguousTokensEditing = exports.EMPTY_LINE_TOKENS = void 0;
    exports.toUint32Array = toUint32Array;
    exports.EMPTY_LINE_TOKENS = (new Uint32Array(0)).buffer;
    class ContiguousTokensEditing {
        static deleteBeginning(lineTokens, toChIndex) {
            if (lineTokens === null || lineTokens === exports.EMPTY_LINE_TOKENS) {
                return lineTokens;
            }
            return ContiguousTokensEditing.delete(lineTokens, 0, toChIndex);
        }
        static deleteEnding(lineTokens, fromChIndex) {
            if (lineTokens === null || lineTokens === exports.EMPTY_LINE_TOKENS) {
                return lineTokens;
            }
            const tokens = toUint32Array(lineTokens);
            const lineTextLength = tokens[tokens.length - 2];
            return ContiguousTokensEditing.delete(lineTokens, fromChIndex, lineTextLength);
        }
        static delete(lineTokens, fromChIndex, toChIndex) {
            if (lineTokens === null || lineTokens === exports.EMPTY_LINE_TOKENS || fromChIndex === toChIndex) {
                return lineTokens;
            }
            const tokens = toUint32Array(lineTokens);
            const tokensCount = (tokens.length >>> 1);
            // special case: deleting everything
            if (fromChIndex === 0 && tokens[tokens.length - 2] === toChIndex) {
                return exports.EMPTY_LINE_TOKENS;
            }
            const fromTokenIndex = lineTokens_1.LineTokens.findIndexInTokensArray(tokens, fromChIndex);
            const fromTokenStartOffset = (fromTokenIndex > 0 ? tokens[(fromTokenIndex - 1) << 1] : 0);
            const fromTokenEndOffset = tokens[fromTokenIndex << 1];
            if (toChIndex < fromTokenEndOffset) {
                // the delete range is inside a single token
                const delta = (toChIndex - fromChIndex);
                for (let i = fromTokenIndex; i < tokensCount; i++) {
                    tokens[i << 1] -= delta;
                }
                return lineTokens;
            }
            let dest;
            let lastEnd;
            if (fromTokenStartOffset !== fromChIndex) {
                tokens[fromTokenIndex << 1] = fromChIndex;
                dest = ((fromTokenIndex + 1) << 1);
                lastEnd = fromChIndex;
            }
            else {
                dest = (fromTokenIndex << 1);
                lastEnd = fromTokenStartOffset;
            }
            const delta = (toChIndex - fromChIndex);
            for (let tokenIndex = fromTokenIndex + 1; tokenIndex < tokensCount; tokenIndex++) {
                const tokenEndOffset = tokens[tokenIndex << 1] - delta;
                if (tokenEndOffset > lastEnd) {
                    tokens[dest++] = tokenEndOffset;
                    tokens[dest++] = tokens[(tokenIndex << 1) + 1];
                    lastEnd = tokenEndOffset;
                }
            }
            if (dest === tokens.length) {
                // nothing to trim
                return lineTokens;
            }
            const tmp = new Uint32Array(dest);
            tmp.set(tokens.subarray(0, dest), 0);
            return tmp.buffer;
        }
        static append(lineTokens, _otherTokens) {
            if (_otherTokens === exports.EMPTY_LINE_TOKENS) {
                return lineTokens;
            }
            if (lineTokens === exports.EMPTY_LINE_TOKENS) {
                return _otherTokens;
            }
            if (lineTokens === null) {
                return lineTokens;
            }
            if (_otherTokens === null) {
                // cannot determine combined line length...
                return null;
            }
            const myTokens = toUint32Array(lineTokens);
            const otherTokens = toUint32Array(_otherTokens);
            const otherTokensCount = (otherTokens.length >>> 1);
            const result = new Uint32Array(myTokens.length + otherTokens.length);
            result.set(myTokens, 0);
            let dest = myTokens.length;
            const delta = myTokens[myTokens.length - 2];
            for (let i = 0; i < otherTokensCount; i++) {
                result[dest++] = otherTokens[(i << 1)] + delta;
                result[dest++] = otherTokens[(i << 1) + 1];
            }
            return result.buffer;
        }
        static insert(lineTokens, chIndex, textLength) {
            if (lineTokens === null || lineTokens === exports.EMPTY_LINE_TOKENS) {
                // nothing to do
                return lineTokens;
            }
            const tokens = toUint32Array(lineTokens);
            const tokensCount = (tokens.length >>> 1);
            let fromTokenIndex = lineTokens_1.LineTokens.findIndexInTokensArray(tokens, chIndex);
            if (fromTokenIndex > 0) {
                const fromTokenStartOffset = tokens[(fromTokenIndex - 1) << 1];
                if (fromTokenStartOffset === chIndex) {
                    fromTokenIndex--;
                }
            }
            for (let tokenIndex = fromTokenIndex; tokenIndex < tokensCount; tokenIndex++) {
                tokens[tokenIndex << 1] += textLength;
            }
            return lineTokens;
        }
    }
    exports.ContiguousTokensEditing = ContiguousTokensEditing;
    function toUint32Array(arr) {
        if (arr instanceof Uint32Array) {
            return arr;
        }
        else {
            return new Uint32Array(arr);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGlndW91c1Rva2Vuc0VkaXRpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vdG9rZW5zL2NvbnRpZ3VvdXNUb2tlbnNFZGl0aW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXNJaEcsc0NBTUM7SUF4SVksUUFBQSxpQkFBaUIsR0FBRyxDQUFDLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0lBRTdELE1BQWEsdUJBQXVCO1FBRTVCLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBNEMsRUFBRSxTQUFpQjtZQUM1RixJQUFJLFVBQVUsS0FBSyxJQUFJLElBQUksVUFBVSxLQUFLLHlCQUFpQixFQUFFLENBQUM7Z0JBQzdELE9BQU8sVUFBVSxDQUFDO1lBQ25CLENBQUM7WUFDRCxPQUFPLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFTSxNQUFNLENBQUMsWUFBWSxDQUFDLFVBQTRDLEVBQUUsV0FBbUI7WUFDM0YsSUFBSSxVQUFVLEtBQUssSUFBSSxJQUFJLFVBQVUsS0FBSyx5QkFBaUIsRUFBRSxDQUFDO2dCQUM3RCxPQUFPLFVBQVUsQ0FBQztZQUNuQixDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pELE9BQU8sdUJBQXVCLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVNLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBNEMsRUFB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