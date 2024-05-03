/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/tokens/lineTokens", "vs/editor/common/languages", "vs/editor/common/languages/nullTokenize"], function (require, exports, strings, lineTokens_1, languages_1, nullTokenize_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.tokenizeToStringSync = tokenizeToStringSync;
    exports.tokenizeToString = tokenizeToString;
    exports.tokenizeLineToHTML = tokenizeLineToHTML;
    exports._tokenizeToString = _tokenizeToString;
    const fallback = {
        getInitialState: () => nullTokenize_1.NullState,
        tokenizeEncoded: (buffer, hasEOL, state) => (0, nullTokenize_1.nullTokenizeEncoded)(0 /* LanguageId.Null */, state)
    };
    function tokenizeToStringSync(languageService, text, languageId) {
        return _tokenizeToString(text, languageService.languageIdCodec, languages_1.TokenizationRegistry.get(languageId) || fallback);
    }
    async function tokenizeToString(languageService, text, languageId) {
        if (!languageId) {
            return _tokenizeToString(text, languageService.languageIdCodec, fallback);
        }
        const tokenizationSupport = await languages_1.TokenizationRegistry.getOrCreate(languageId);
        return _tokenizeToString(text, languageService.languageIdCodec, tokenizationSupport || fallback);
    }
    function tokenizeLineToHTML(text, viewLineTokens, colorMap, startOffset, endOffset, tabSize, useNbsp) {
        let result = `<div>`;
        let charIndex = startOffset;
        let tabsCharDelta = 0;
        let prevIsSpace = true;
        for (let tokenIndex = 0, tokenCount = viewLineTokens.getCount(); tokenIndex < tokenCount; tokenIndex++) {
            const tokenEndIndex = viewLineTokens.getEndOffset(tokenIndex);
            if (tokenEndIndex <= startOffset) {
                continue;
            }
            let partContent = '';
            for (; charIndex < tokenEndIndex && charIndex < endOffset; charIndex++) {
                const charCode = text.charCodeAt(charIndex);
                switch (charCode) {
                    case 9 /* CharCode.Tab */: {
                        let insertSpacesCount = tabSize - (charIndex + tabsCharDelta) % tabSize;
                        tabsCharDelta += insertSpacesCount - 1;
                        while (insertSpacesCount > 0) {
                            if (useNbsp && prevIsSpace) {
                                partContent += '&#160;';
                                prevIsSpace = false;
                            }
                            else {
                                partContent += ' ';
                                prevIsSpace = true;
                            }
                            insertSpacesCount--;
                        }
                        break;
                    }
                    case 60 /* CharCode.LessThan */:
                        partContent += '&lt;';
                        prevIsSpace = false;
                        break;
                    case 62 /* CharCode.GreaterThan */:
                        partContent += '&gt;';
                        prevIsSpace = false;
                        break;
                    case 38 /* CharCode.Ampersand */:
                        partContent += '&amp;';
                        prevIsSpace = false;
                        break;
                    case 0 /* CharCode.Null */:
                        partContent += '&#00;';
                        prevIsSpace = false;
                        break;
                    case 65279 /* CharCode.UTF8_BOM */:
                    case 8232 /* CharCode.LINE_SEPARATOR */:
                    case 8233 /* CharCode.PARAGRAPH_SEPARATOR */:
                    case 133 /* CharCode.NEXT_LINE */:
                        partContent += '\ufffd';
                        prevIsSpace = false;
                        break;
                    case 13 /* CharCode.CarriageReturn */:
                        // zero width space, because carriage return would introduce a line break
                        partContent += '&#8203';
                        prevIsSpace = false;
                        break;
                    case 32 /* CharCode.Space */:
                        if (useNbsp && prevIsSpace) {
                            partContent += '&#160;';
                            prevIsSpace = false;
                        }
                        else {
                            partContent += ' ';
                            prevIsSpace = true;
                        }
                        break;
                    default:
                        partContent += String.fromCharCode(charCode);
                        prevIsSpace = false;
                }
            }
            result += `<span style="${viewLineTokens.getInlineStyle(tokenIndex, colorMap)}">${partContent}</span>`;
            if (tokenEndIndex > endOffset || charIndex >= endOffset) {
                break;
            }
        }
        result += `</div>`;
        return result;
    }
    function _tokenizeToString(text, languageIdCodec, tokenizationSupport) {
        let result = `<div class="monaco-tokenized-source">`;
        const lines = strings.splitLines(text);
        let currentState = tokenizationSupport.getInitialState();
        for (let i = 0, len = lines.length; i < len; i++) {
            const line = lines[i];
            if (i > 0) {
                result += `<br/>`;
            }
            const tokenizationResult = tokenizationSupport.tokenizeEncoded(line, true, currentState);
            lineTokens_1.LineTokens.convertToEndOffset(tokenizationResult.tokens, line.length);
            const lineTokens = new lineTokens_1.LineTokens(tokenizationResult.tokens, line, languageIdCodec);
            const viewLineTokens = lineTokens.inflate();
            let startOffset = 0;
            for (let j = 0, lenJ = viewLineTokens.getCount(); j < lenJ; j++) {
                const type = viewLineTokens.getClassName(j);
                const endIndex = viewLineTokens.getEndOffset(j);
                result += `<span class="${type}">${strings.escape(line.substring(startOffset, endIndex))}</span>`;
                startOffset = endIndex;
            }
            currentState = tokenizationResult.endState;
        }
        result += `</div>`;
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFRvSHRtbFRva2VuaXplci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9sYW5ndWFnZXMvdGV4dFRvSHRtbFRva2VuaXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWlCaEcsb0RBRUM7SUFFRCw0Q0FNQztJQUVELGdEQThGQztJQUVELDhDQTZCQztJQTlJRCxNQUFNLFFBQVEsR0FBZ0M7UUFDN0MsZUFBZSxFQUFFLEdBQUcsRUFBRSxDQUFDLHdCQUFTO1FBQ2hDLGVBQWUsRUFBRSxDQUFDLE1BQWMsRUFBRSxNQUFlLEVBQUUsS0FBYSxFQUFFLEVBQUUsQ0FBQyxJQUFBLGtDQUFtQiwyQkFBa0IsS0FBSyxDQUFDO0tBQ2hILENBQUM7SUFFRixTQUFnQixvQkFBb0IsQ0FBQyxlQUFpQyxFQUFFLElBQVksRUFBRSxVQUFrQjtRQUN2RyxPQUFPLGlCQUFpQixDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsZUFBZSxFQUFFLGdDQUFvQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxRQUFRLENBQUMsQ0FBQztJQUNuSCxDQUFDO0lBRU0sS0FBSyxVQUFVLGdCQUFnQixDQUFDLGVBQWlDLEVBQUUsSUFBWSxFQUFFLFVBQXlCO1FBQ2hILElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNqQixPQUFPLGlCQUFpQixDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzNFLENBQUM7UUFDRCxNQUFNLG1CQUFtQixHQUFHLE1BQU0sZ0NBQW9CLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQy9FLE9BQU8saUJBQWlCLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxlQUFlLEVBQUUsbUJBQW1CLElBQUksUUFBUSxDQUFDLENB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