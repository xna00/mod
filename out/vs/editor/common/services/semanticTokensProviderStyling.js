/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/editor/common/encodedTokenAttributes", "vs/platform/theme/common/themeService", "vs/platform/log/common/log", "vs/editor/common/tokens/sparseMultilineTokens", "vs/editor/common/languages/language"], function (require, exports, encodedTokenAttributes_1, themeService_1, log_1, sparseMultilineTokens_1, language_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SemanticTokensProviderStyling = void 0;
    exports.toMultilineTokens2 = toMultilineTokens2;
    var SemanticTokensProviderStylingConstants;
    (function (SemanticTokensProviderStylingConstants) {
        SemanticTokensProviderStylingConstants[SemanticTokensProviderStylingConstants["NO_STYLING"] = 2147483647] = "NO_STYLING";
    })(SemanticTokensProviderStylingConstants || (SemanticTokensProviderStylingConstants = {}));
    let SemanticTokensProviderStyling = class SemanticTokensProviderStyling {
        constructor(_legend, _themeService, _languageService, _logService) {
            this._legend = _legend;
            this._themeService = _themeService;
            this._languageService = _languageService;
            this._logService = _logService;
            this._hasWarnedOverlappingTokens = false;
            this._hasWarnedInvalidLengthTokens = false;
            this._hasWarnedInvalidEditStart = false;
            this._hashTable = new HashTable();
        }
        getMetadata(tokenTypeIndex, tokenModifierSet, languageId) {
            const encodedLanguageId = this._languageService.languageIdCodec.encodeLanguageId(languageId);
            const entry = this._hashTable.get(tokenTypeIndex, tokenModifierSet, encodedLanguageId);
            let metadata;
            if (entry) {
                metadata = entry.metadata;
                if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                    this._logService.trace(`SemanticTokensProviderStyling [CACHED] ${tokenTypeIndex} / ${tokenModifierSet}: foreground ${encodedTokenAttributes_1.TokenMetadata.getForeground(metadata)}, fontStyle ${encodedTokenAttributes_1.TokenMetadata.getFontStyle(metadata).toString(2)}`);
                }
            }
            else {
                let tokenType = this._legend.tokenTypes[tokenTypeIndex];
                const tokenModifiers = [];
                if (tokenType) {
                    let modifierSet = tokenModifierSet;
                    for (let modifierIndex = 0; modifierSet > 0 && modifierIndex < this._legend.tokenModifiers.length; modifierIndex++) {
                        if (modifierSet & 1) {
                            tokenModifiers.push(this._legend.tokenModifiers[modifierIndex]);
                        }
                        modifierSet = modifierSet >> 1;
                    }
                    if (modifierSet > 0 && this._logService.getLevel() === log_1.LogLevel.Trace) {
                        this._logService.trace(`SemanticTokensProviderStyling: unknown token modifier index: ${tokenModifierSet.toString(2)} for legend: ${JSON.stringify(this._legend.tokenModifiers)}`);
                        tokenModifiers.push('not-in-legend');
                    }
                    const tokenStyle = this._themeService.getColorTheme().getTokenStyleMetadata(tokenType, tokenModifiers, languageId);
                    if (typeof tokenStyle === 'undefined') {
                        metadata = 2147483647 /* SemanticTokensProviderStylingConstants.NO_STYLING */;
                    }
                    else {
                        metadata = 0;
                        if (typeof tokenStyle.italic !== 'undefined') {
                            const italicBit = (tokenStyle.italic ? 1 /* FontStyle.Italic */ : 0) << 11 /* MetadataConsts.FONT_STYLE_OFFSET */;
                            metadata |= italicBit | 1 /* MetadataConsts.SEMANTIC_USE_ITALIC */;
                        }
                        if (typeof tokenStyle.bold !== 'undefined') {
                            const boldBit = (tokenStyle.bold ? 2 /* FontStyle.Bold */ : 0) << 11 /* MetadataConsts.FONT_STYLE_OFFSET */;
                            metadata |= boldBit | 2 /* MetadataConsts.SEMANTIC_USE_BOLD */;
                        }
                        if (typeof tokenStyle.underline !== 'undefined') {
                            const underlineBit = (tokenStyle.underline ? 4 /* FontStyle.Underline */ : 0) << 11 /* MetadataConsts.FONT_STYLE_OFFSET */;
                            metadata |= underlineBit | 4 /* MetadataConsts.SEMANTIC_USE_UNDERLINE */;
                        }
                        if (typeof tokenStyle.strikethrough !== 'undefined') {
                            const strikethroughBit = (tokenStyle.strikethrough ? 8 /* FontStyle.Strikethrough */ : 0) << 11 /* MetadataConsts.FONT_STYLE_OFFSET */;
                            metadata |= strikethroughBit | 8 /* MetadataConsts.SEMANTIC_USE_STRIKETHROUGH */;
                        }
                        if (tokenStyle.foreground) {
                            const foregroundBits = (tokenStyle.foreground) << 15 /* MetadataConsts.FOREGROUND_OFFSET */;
                            metadata |= foregroundBits | 16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */;
                        }
                        if (metadata === 0) {
                            // Nothing!
                            metadata = 2147483647 /* SemanticTokensProviderStylingConstants.NO_STYLING */;
                        }
                    }
                }
                else {
                    if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                        this._logService.trace(`SemanticTokensProviderStyling: unknown token type index: ${tokenTypeIndex} for legend: ${JSON.stringify(this._legend.tokenTypes)}`);
                    }
                    metadata = 2147483647 /* SemanticTokensProviderStylingConstants.NO_STYLING */;
                    tokenType = 'not-in-legend';
                }
                this._hashTable.add(tokenTypeIndex, tokenModifierSet, encodedLanguageId, metadata);
                if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                    this._logService.trace(`SemanticTokensProviderStyling ${tokenTypeIndex} (${tokenType}) / ${tokenModifierSet} (${tokenModifiers.join(' ')}): foreground ${encodedTokenAttributes_1.TokenMetadata.getForeground(metadata)}, fontStyle ${encodedTokenAttributes_1.TokenMetadata.getFontStyle(metadata).toString(2)}`);
                }
            }
            return metadata;
        }
        warnOverlappingSemanticTokens(lineNumber, startColumn) {
            if (!this._hasWarnedOverlappingTokens) {
                this._hasWarnedOverlappingTokens = true;
                this._logService.warn(`Overlapping semantic tokens detected at lineNumber ${lineNumber}, column ${startColumn}`);
            }
        }
        warnInvalidLengthSemanticTokens(lineNumber, startColumn) {
            if (!this._hasWarnedInvalidLengthTokens) {
                this._hasWarnedInvalidLengthTokens = true;
                this._logService.warn(`Semantic token with invalid length detected at lineNumber ${lineNumber}, column ${startColumn}`);
            }
        }
        warnInvalidEditStart(previousResultId, resultId, editIndex, editStart, maxExpectedStart) {
            if (!this._hasWarnedInvalidEditStart) {
                this._hasWarnedInvalidEditStart = true;
                this._logService.warn(`Invalid semantic tokens edit detected (previousResultId: ${previousResultId}, resultId: ${resultId}) at edit #${editIndex}: The provided start offset ${editStart} is outside the previous data (length ${maxExpectedStart}).`);
            }
        }
    };
    exports.SemanticTokensProviderStyling = SemanticTokensProviderStyling;
    exports.SemanticTokensProviderStyling = SemanticTokensProviderStyling = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, language_1.ILanguageService),
        __param(3, log_1.ILogService)
    ], SemanticTokensProviderStyling);
    var SemanticColoringConstants;
    (function (SemanticColoringConstants) {
        /**
         * Let's aim at having 8KB buffers if possible...
         * So that would be 8192 / (5 * 4) = 409.6 tokens per area
         */
        SemanticColoringConstants[SemanticColoringConstants["DesiredTokensPerArea"] = 400] = "DesiredTokensPerArea";
        /**
         * Try to keep the total number of areas under 1024 if possible,
         * simply compensate by having more tokens per area...
         */
        SemanticColoringConstants[SemanticColoringConstants["DesiredMaxAreas"] = 1024] = "DesiredMaxAreas";
    })(SemanticColoringConstants || (SemanticColoringConstants = {}));
    function toMultilineTokens2(tokens, styling, languageId) {
        const srcData = tokens.data;
        const tokenCount = (tokens.data.length / 5) | 0;
        const tokensPerArea = Math.max(Math.ceil(tokenCount / 1024 /* SemanticColoringConstants.DesiredMaxAreas */), 400 /* SemanticColoringConstants.DesiredTokensPerArea */);
        const result = [];
        let tokenIndex = 0;
        let lastLineNumber = 1;
        let lastStartCharacter = 0;
        while (tokenIndex < tokenCount) {
            const tokenStartIndex = tokenIndex;
            let tokenEndIndex = Math.min(tokenStartIndex + tokensPerArea, tokenCount);
            // Keep tokens on the same line in the same area...
            if (tokenEndIndex < tokenCount) {
                let smallTokenEndIndex = tokenEndIndex;
                while (smallTokenEndIndex - 1 > tokenStartIndex && srcData[5 * smallTokenEndIndex] === 0) {
                    smallTokenEndIndex--;
                }
                if (smallTokenEndIndex - 1 === tokenStartIndex) {
                    // there are so many tokens on this line that our area would be empty, we must now go right
                    let bigTokenEndIndex = tokenEndIndex;
                    while (bigTokenEndIndex + 1 < tokenCount && srcData[5 * bigTokenEndIndex] === 0) {
                        bigTokenEndIndex++;
                    }
                    tokenEndIndex = bigTokenEndIndex;
                }
                else {
                    tokenEndIndex = smallTokenEndIndex;
                }
            }
            let destData = new Uint32Array((tokenEndIndex - tokenStartIndex) * 4);
            let destOffset = 0;
            let areaLine = 0;
            let prevLineNumber = 0;
            let prevEndCharacter = 0;
            while (tokenIndex < tokenEndIndex) {
                const srcOffset = 5 * tokenIndex;
                const deltaLine = srcData[srcOffset];
                const deltaCharacter = srcData[srcOffset + 1];
                // Casting both `lineNumber`, `startCharacter` and `endCharacter` here to uint32 using `|0`
                // to validate below with the actual values that will be inserted in the Uint32Array result
                const lineNumber = (lastLineNumber + deltaLine) | 0;
                const startCharacter = (deltaLine === 0 ? (lastStartCharacter + deltaCharacter) | 0 : deltaCharacter);
                const length = srcData[srcOffset + 2];
                const endCharacter = (startCharacter + length) | 0;
                const tokenTypeIndex = srcData[srcOffset + 3];
                const tokenModifierSet = srcData[srcOffset + 4];
                if (endCharacter <= startCharacter) {
                    // this token is invalid (most likely a negative length casted to uint32)
                    styling.warnInvalidLengthSemanticTokens(lineNumber, startCharacter + 1);
                }
                else if (prevLineNumber === lineNumber && prevEndCharacter > startCharacter) {
                    // this token overlaps with the previous token
                    styling.warnOverlappingSemanticTokens(lineNumber, startCharacter + 1);
                }
                else {
                    const metadata = styling.getMetadata(tokenTypeIndex, tokenModifierSet, languageId);
                    if (metadata !== 2147483647 /* SemanticTokensProviderStylingConstants.NO_STYLING */) {
                        if (areaLine === 0) {
                            areaLine = lineNumber;
                        }
                        destData[destOffset] = lineNumber - areaLine;
                        destData[destOffset + 1] = startCharacter;
                        destData[destOffset + 2] = endCharacter;
                        destData[destOffset + 3] = metadata;
                        destOffset += 4;
                        prevLineNumber = lineNumber;
                        prevEndCharacter = endCharacter;
                    }
                }
                lastLineNumber = lineNumber;
                lastStartCharacter = startCharacter;
                tokenIndex++;
            }
            if (destOffset !== destData.length) {
                destData = destData.subarray(0, destOffset);
            }
            const tokens = sparseMultilineTokens_1.SparseMultilineTokens.create(areaLine, destData);
            result.push(tokens);
        }
        return result;
    }
    class HashTableEntry {
        constructor(tokenTypeIndex, tokenModifierSet, languageId, metadata) {
            this.tokenTypeIndex = tokenTypeIndex;
            this.tokenModifierSet = tokenModifierSet;
            this.languageId = languageId;
            this.metadata = metadata;
            this.next = null;
        }
    }
    class HashTable {
        static { this._SIZES = [3, 7, 13, 31, 61, 127, 251, 509, 1021, 2039, 4093, 8191, 16381, 32749, 65521, 131071, 262139, 524287, 1048573, 2097143]; }
        constructor() {
            this._elementsCount = 0;
            this._currentLengthIndex = 0;
            this._currentLength = HashTable._SIZES[this._currentLengthIndex];
            this._growCount = Math.round(this._currentLengthIndex + 1 < HashTable._SIZES.length ? 2 / 3 * this._currentLength : 0);
            this._elements = [];
            HashTable._nullOutEntries(this._elements, this._currentLength);
        }
        static _nullOutEntries(entries, length) {
            for (let i = 0; i < length; i++) {
                entries[i] = null;
            }
        }
        _hash2(n1, n2) {
            return (((n1 << 5) - n1) + n2) | 0; // n1 * 31 + n2, keep as int32
        }
        _hashFunc(tokenTypeIndex, tokenModifierSet, languageId) {
            return this._hash2(this._hash2(tokenTypeIndex, tokenModifierSet), languageId) % this._currentLength;
        }
        get(tokenTypeIndex, tokenModifierSet, languageId) {
            const hash = this._hashFunc(tokenTypeIndex, tokenModifierSet, languageId);
            let p = this._elements[hash];
            while (p) {
                if (p.tokenTypeIndex === tokenTypeIndex && p.tokenModifierSet === tokenModifierSet && p.languageId === languageId) {
                    return p;
                }
                p = p.next;
            }
            return null;
        }
        add(tokenTypeIndex, tokenModifierSet, languageId, metadata) {
            this._elementsCount++;
            if (this._growCount !== 0 && this._elementsCount >= this._growCount) {
                // expand!
                const oldElements = this._elements;
                this._currentLengthIndex++;
                this._currentLength = HashTable._SIZES[this._currentLengthIndex];
                this._growCount = Math.round(this._currentLengthIndex + 1 < HashTable._SIZES.length ? 2 / 3 * this._currentLength : 0);
                this._elements = [];
                HashTable._nullOutEntries(this._elements, this._currentLength);
                for (const first of oldElements) {
                    let p = first;
                    while (p) {
                        const oldNext = p.next;
                        p.next = null;
                        this._add(p);
                        p = oldNext;
                    }
                }
            }
            this._add(new HashTableEntry(tokenTypeIndex, tokenModifierSet, languageId, metadata));
        }
        _add(element) {
            const hash = this._hashFunc(element.tokenTypeIndex, element.tokenModifierSet, element.languageId);
            element.next = this._elements[hash];
            this._elements[hash] = element;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VtYW50aWNUb2tlbnNQcm92aWRlclN0eWxpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vc2VydmljZXMvc2VtYW50aWNUb2tlbnNQcm92aWRlclN0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMEloRyxnREF5RkM7SUExTkQsSUFBVyxzQ0FFVjtJQUZELFdBQVcsc0NBQXNDO1FBQ2hELHdIQUErQyxDQUFBO0lBQ2hELENBQUMsRUFGVSxzQ0FBc0MsS0FBdEMsc0NBQXNDLFFBRWhEO0lBRU0sSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBNkI7UUFPekMsWUFDa0IsT0FBNkIsRUFDL0IsYUFBNkMsRUFDMUMsZ0JBQW1ELEVBQ3hELFdBQXlDO1lBSHJDLFlBQU8sR0FBUCxPQUFPLENBQXNCO1lBQ2Qsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDekIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUN2QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQVIvQyxnQ0FBMkIsR0FBRyxLQUFLLENBQUM7WUFDcEMsa0NBQTZCLEdBQUcsS0FBSyxDQUFDO1lBQ3RDLCtCQUEwQixHQUFHLEtBQUssQ0FBQztZQVExQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7UUFDbkMsQ0FBQztRQUVNLFdBQVcsQ0FBQyxjQUFzQixFQUFFLGdCQUF3QixFQUFFLFVBQWtCO1lBQ3RGLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3RixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsZ0JBQWdCLEVBQUUs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