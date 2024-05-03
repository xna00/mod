/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/strings", "vs/editor/common/core/stringBuilder", "vs/editor/common/viewLayout/lineDecorations", "vs/editor/common/viewLayout/linePart"], function (require, exports, nls, strings, stringBuilder_1, lineDecorations_1, linePart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RenderLineOutput2 = exports.RenderLineOutput = exports.ForeignElementType = exports.CharacterMapping = exports.DomPosition = exports.RenderLineInput = exports.LineRange = exports.RenderWhitespace = void 0;
    exports.renderViewLine = renderViewLine;
    exports.renderViewLine2 = renderViewLine2;
    var RenderWhitespace;
    (function (RenderWhitespace) {
        RenderWhitespace[RenderWhitespace["None"] = 0] = "None";
        RenderWhitespace[RenderWhitespace["Boundary"] = 1] = "Boundary";
        RenderWhitespace[RenderWhitespace["Selection"] = 2] = "Selection";
        RenderWhitespace[RenderWhitespace["Trailing"] = 3] = "Trailing";
        RenderWhitespace[RenderWhitespace["All"] = 4] = "All";
    })(RenderWhitespace || (exports.RenderWhitespace = RenderWhitespace = {}));
    class LineRange {
        constructor(startIndex, endIndex) {
            this.startOffset = startIndex;
            this.endOffset = endIndex;
        }
        equals(otherLineRange) {
            return this.startOffset === otherLineRange.startOffset
                && this.endOffset === otherLineRange.endOffset;
        }
    }
    exports.LineRange = LineRange;
    class RenderLineInput {
        constructor(useMonospaceOptimizations, canUseHalfwidthRightwardsArrow, lineContent, continuesWithWrappedLine, isBasicASCII, containsRTL, fauxIndentLength, lineTokens, lineDecorations, tabSize, startVisibleColumn, spaceWidth, middotWidth, wsmiddotWidth, stopRenderingLineAfter, renderWhitespace, renderControlCharacters, fontLigatures, selectionsOnLine) {
            this.useMonospaceOptimizations = useMonospaceOptimizations;
            this.canUseHalfwidthRightwardsArrow = canUseHalfwidthRightwardsArrow;
            this.lineContent = lineContent;
            this.continuesWithWrappedLine = continuesWithWrappedLine;
            this.isBasicASCII = isBasicASCII;
            this.containsRTL = containsRTL;
            this.fauxIndentLength = fauxIndentLength;
            this.lineTokens = lineTokens;
            this.lineDecorations = lineDecorations.sort(lineDecorations_1.LineDecoration.compare);
            this.tabSize = tabSize;
            this.startVisibleColumn = startVisibleColumn;
            this.spaceWidth = spaceWidth;
            this.stopRenderingLineAfter = stopRenderingLineAfter;
            this.renderWhitespace = (renderWhitespace === 'all'
                ? 4 /* RenderWhitespace.All */
                : renderWhitespace === 'boundary'
                    ? 1 /* RenderWhitespace.Boundary */
                    : renderWhitespace === 'selection'
                        ? 2 /* RenderWhitespace.Selection */
                        : renderWhitespace === 'trailing'
                            ? 3 /* RenderWhitespace.Trailing */
                            : 0 /* RenderWhitespace.None */);
            this.renderControlCharacters = renderControlCharacters;
            this.fontLigatures = fontLigatures;
            this.selectionsOnLine = selectionsOnLine && selectionsOnLine.sort((a, b) => a.startOffset < b.startOffset ? -1 : 1);
            const wsmiddotDiff = Math.abs(wsmiddotWidth - spaceWidth);
            const middotDiff = Math.abs(middotWidth - spaceWidth);
            if (wsmiddotDiff < middotDiff) {
                this.renderSpaceWidth = wsmiddotWidth;
                this.renderSpaceCharCode = 0x2E31; // U+2E31 - WORD SEPARATOR MIDDLE DOT
            }
            else {
                this.renderSpaceWidth = middotWidth;
                this.renderSpaceCharCode = 0xB7; // U+00B7 - MIDDLE DOT
            }
        }
        sameSelection(otherSelections) {
            if (this.selectionsOnLine === null) {
                return otherSelections === null;
            }
            if (otherSelections === null) {
                return false;
            }
            if (otherSelections.length !== this.selectionsOnLine.length) {
                return false;
            }
            for (let i = 0; i < this.selectionsOnLine.length; i++) {
                if (!this.selectionsOnLine[i].equals(otherSelections[i])) {
                    return false;
                }
            }
            return true;
        }
        equals(other) {
            return (this.useMonospaceOptimizations === other.useMonospaceOptimizations
                && this.canUseHalfwidthRightwardsArrow === other.canUseHalfwidthRightwardsArrow
                && this.lineContent === other.lineContent
                && this.continuesWithWrappedLine === other.continuesWithWrappedLine
                && this.isBasicASCII === other.isBasicASCII
                && this.containsRTL === other.containsRTL
                && this.fauxIndentLength === other.fauxIndentLength
                && this.tabSize === other.tabSize
                && this.startVisibleColumn === other.startVisibleColumn
                && this.spaceWidth === other.spaceWidth
                && this.renderSpaceWidth === other.renderSpaceWidth
                && this.renderSpaceCharCode === other.renderSpaceCharCode
                && this.stopRenderingLineAfter === other.stopRenderingLineAfter
                && this.renderWhitespace === other.renderWhitespace
                && this.renderControlCharacters === other.renderControlCharacters
                && this.fontLigatures === other.fontLigatures
                && lineDecorations_1.LineDecoration.equalsArr(this.lineDecorations, other.lineDecorations)
                && this.lineTokens.equals(other.lineTokens)
                && this.sameSelection(other.selectionsOnLine));
        }
    }
    exports.RenderLineInput = RenderLineInput;
    var CharacterMappingConstants;
    (function (CharacterMappingConstants) {
        CharacterMappingConstants[CharacterMappingConstants["PART_INDEX_MASK"] = 4294901760] = "PART_INDEX_MASK";
        CharacterMappingConstants[CharacterMappingConstants["CHAR_INDEX_MASK"] = 65535] = "CHAR_INDEX_MASK";
        CharacterMappingConstants[CharacterMappingConstants["CHAR_INDEX_OFFSET"] = 0] = "CHAR_INDEX_OFFSET";
        CharacterMappingConstants[CharacterMappingConstants["PART_INDEX_OFFSET"] = 16] = "PART_INDEX_OFFSET";
    })(CharacterMappingConstants || (CharacterMappingConstants = {}));
    class DomPosition {
        constructor(partIndex, charIndex) {
            this.partIndex = partIndex;
            this.charIndex = charIndex;
        }
    }
    exports.DomPosition = DomPosition;
    /**
     * Provides a both direction mapping between a line's character and its rendered position.
     */
    class CharacterMapping {
        static getPartIndex(partData) {
            return (partData & 4294901760 /* CharacterMappingConstants.PART_INDEX_MASK */) >>> 16 /* CharacterMappingConstants.PART_INDEX_OFFSET */;
        }
        static getCharIndex(partData) {
            return (partData & 65535 /* CharacterMappingConstants.CHAR_INDEX_MASK */) >>> 0 /* CharacterMappingConstants.CHAR_INDEX_OFFSET */;
        }
        constructor(length, partCount) {
            this.length = length;
            this._data = new Uint32Array(this.length);
            this._horizontalOffset = new Uint32Array(this.length);
        }
        setColumnInfo(column, partIndex, charIndex, horizontalOffset) {
            const partData = ((partIndex << 16 /* CharacterMappingConstants.PART_INDEX_OFFSET */)
                | (charIndex << 0 /* CharacterMappingConstants.CHAR_INDEX_OFFSET */)) >>> 0;
            this._data[column - 1] = partData;
            this._horizontalOffset[column - 1] = horizontalOffset;
        }
        getHorizontalOffset(column) {
            if (this._horizontalOffset.length === 0) {
                // No characters on this line
                return 0;
            }
            return this._horizontalOffset[column - 1];
        }
        charOffsetToPartData(charOffset) {
            if (this.length === 0) {
                return 0;
            }
            if (charOffset < 0) {
                return this._data[0];
            }
            if (charOffset >= this.length) {
                return this._data[this.length - 1];
            }
            return this._data[charOffset];
        }
        getDomPosition(column) {
            const partData = this.charOffsetToPartData(column - 1);
            const partIndex = CharacterMapping.getPartIndex(partData);
            const charIndex = CharacterMapping.getCharIndex(partData);
            return new DomPosition(partIndex, charIndex);
        }
        getColumn(domPosition, partLength) {
            const charOffset = this.partDataToCharOffset(domPosition.partIndex, partLength, domPosition.charIndex);
            return charOffset + 1;
        }
        partDataToCharOffset(partIndex, partLength, charIndex) {
            if (this.length === 0) {
                return 0;
            }
            const searchEntry = ((partIndex << 16 /* CharacterMappingConstants.PART_INDEX_OFFSET */)
                | (charIndex << 0 /* CharacterMappingConstants.CHAR_INDEX_OFFSET */)) >>> 0;
            let min = 0;
            let max = this.length - 1;
            while (min + 1 < max) {
                const mid = ((min + max) >>> 1);
                const midEntry = this._data[mid];
                if (midEntry === searchEntry) {
                    return mid;
                }
                else if (midEntry > searchEntry) {
                    max = mid;
                }
                else {
                    min = mid;
                }
            }
            if (min === max) {
                return min;
            }
            const minEntry = this._data[min];
            const maxEntry = this._data[max];
            if (minEntry === searchEntry) {
                return min;
            }
            if (maxEntry === searchEntry) {
                return max;
            }
            const minPartIndex = CharacterMapping.getPartIndex(minEntry);
            const minCharIndex = CharacterMapping.getCharIndex(minEntry);
            const maxPartIndex = CharacterMapping.getPartIndex(maxEntry);
            let maxCharIndex;
            if (minPartIndex !== maxPartIndex) {
                // sitting between parts
                maxCharIndex = partLength;
            }
            else {
                maxCharIndex = CharacterMapping.getCharIndex(maxEntry);
            }
            const minEntryDistance = charIndex - minCharIndex;
            const maxEntryDistance = maxCharIndex - charIndex;
            if (minEntryDistance <= maxEntryDistance) {
                return min;
            }
            return max;
        }
        inflate() {
            const result = [];
            for (let i = 0; i < this.length; i++) {
                const partData = this._data[i];
                const partIndex = CharacterMapping.getPartIndex(partData);
                const charIndex = CharacterMapping.getCharIndex(partData);
                const visibleColumn = this._horizontalOffset[i];
                result.push([partIndex, charIndex, visibleColumn]);
            }
            return result;
        }
    }
    exports.CharacterMapping = CharacterMapping;
    var ForeignElementType;
    (function (ForeignElementType) {
        ForeignElementType[ForeignElementType["None"] = 0] = "None";
        ForeignElementType[ForeignElementType["Before"] = 1] = "Before";
        ForeignElementType[ForeignElementType["After"] = 2] = "After";
    })(ForeignElementType || (exports.ForeignElementType = ForeignElementType = {}));
    class RenderLineOutput {
        constructor(characterMapping, containsRTL, containsForeignElements) {
            this._renderLineOutputBrand = undefined;
            this.characterMapping = characterMapping;
            this.containsRTL = containsRTL;
            this.containsForeignElements = containsForeignElements;
        }
    }
    exports.RenderLineOutput = RenderLineOutput;
    function renderViewLine(input, sb) {
        if (input.lineContent.length === 0) {
            if (input.lineDecorations.length > 0) {
                // This line is empty, but it contains inline decorations
                sb.appendString(`<span>`);
                let beforeCount = 0;
                let afterCount = 0;
                let containsForeignElements = 0 /* ForeignElementType.None */;
                for (const lineDecoration of input.lineDecorations) {
                    if (lineDecoration.type === 1 /* InlineDecorationType.Before */ || lineDecoration.type === 2 /* InlineDecorationType.After */) {
                        sb.appendString(`<span class="`);
                        sb.appendString(lineDecoration.className);
                        sb.appendString(`"></span>`);
                        if (lineDecoration.type === 1 /* InlineDecorationType.Before */) {
                            containsForeignElements |= 1 /* ForeignElementType.Before */;
                            beforeCount++;
                        }
                        if (lineDecoration.type === 2 /* InlineDecorationType.After */) {
                            containsForeignElements |= 2 /* ForeignElementType.After */;
                            afterCount++;
                        }
                    }
                }
                sb.appendString(`</span>`);
                const characterMapping = new CharacterMapping(1, beforeCount + afterCount);
                characterMapping.setColumnInfo(1, beforeCount, 0, 0);
                return new RenderLineOutput(characterMapping, false, containsForeignElements);
            }
            // completely empty line
            sb.appendString('<span><span></span></span>');
            return new RenderLineOutput(new CharacterMapping(0, 0), false, 0 /* ForeignElementType.None */);
        }
        return _renderLine(resolveRenderLineInput(input), sb);
    }
    class RenderLineOutput2 {
        constructor(characterMapping, html, containsRTL, containsForeignElements) {
            this.characterMapping = characterMapping;
            this.html = html;
            this.containsRTL = containsRTL;
            this.containsForeignElements = containsForeignElements;
        }
    }
    exports.RenderLineOutput2 = RenderLineOutput2;
    function renderViewLine2(input) {
        const sb = new stringBuilder_1.StringBuilder(10000);
        const out = renderViewLine(input, sb);
        return new RenderLineOutput2(out.characterMapping, sb.build(), out.containsRTL, out.containsForeignElements);
    }
    class ResolvedRenderLineInput {
        constructor(fontIsMonospace, canUseHalfwidthRightwardsArrow, lineContent, len, isOverflowing, overflowingCharCount, parts, containsForeignElements, fauxIndentLength, tabSize, startVisibleColumn, containsRTL, spaceWidth, renderSpaceCharCode, renderWhitespace, renderControlCharacters) {
            this.fontIsMonospace = fontIsMonospace;
            this.canUseHalfwidthRightwardsArrow = canUseHalfwidthRightwardsArrow;
            this.lineContent = lineContent;
            this.len = len;
            this.isOverflowing = isOverflowing;
            this.overflowingCharCount = overflowingCharCount;
            this.parts = parts;
            this.containsForeignElements = containsForeignElements;
            this.fauxIndentLength = fauxIndentLength;
            this.tabSize = tabSize;
            this.startVisibleColumn = startVisibleColumn;
            this.containsRTL = containsRTL;
            this.spaceWidth = spaceWidth;
            this.renderSpaceCharCode = renderSpaceCharCode;
            this.renderWhitespace = renderWhitespace;
            this.renderControlCharacters = renderControlCharacters;
            //
        }
    }
    function resolveRenderLineInput(input) {
        const lineContent = input.lineContent;
        let isOverflowing;
        let overflowingCharCount;
        let len;
        if (input.stopRenderingLineAfter !== -1 && input.stopRenderingLineAfter < lineContent.length) {
            isOverflowing = true;
            overflowingCharCount = lineContent.length - input.stopRenderingLineAfter;
            len = input.stopRenderingLineAfter;
        }
        else {
            isOverflowing = false;
            overflowingCharCount = 0;
            len = lineContent.length;
        }
        let tokens = transformAndRemoveOverflowing(lineContent, input.containsRTL, input.lineTokens, input.fauxIndentLength, len);
        if (input.renderControlCharacters && !input.isBasicASCII) {
            // Calling `extractControlCharacters` before adding (possibly empty) line parts
            // for inline decorations. `extractControlCharacters` removes empty line parts.
            tokens = extractControlCharacters(lineContent, tokens);
        }
        if (input.renderWhitespace === 4 /* RenderWhitespace.All */ ||
            input.renderWhitespace === 1 /* RenderWhitespace.Boundary */ ||
            (input.renderWhitespace === 2 /* RenderWhitespace.Selection */ && !!input.selectionsOnLine) ||
            (input.renderWhitespace === 3 /* RenderWhitespace.Trailing */ && !input.continuesWithWrappedLine)) {
            tokens = _applyRenderWhitespace(input, lineContent, len, tokens);
        }
        let containsForeignElements = 0 /* ForeignElementType.None */;
        if (input.lineDecorations.length > 0) {
            for (let i = 0, len = input.lineDecorations.length; i < len; i++) {
                const lineDecoration = input.lineDecorations[i];
                if (lineDecoration.type === 3 /* InlineDecorationType.RegularAffectingLetterSpacing */) {
                    // Pretend there are foreign elements... although not 100% accurate.
                    containsForeignElements |= 1 /* ForeignElementType.Before */;
                }
                else if (lineDecoration.type === 1 /* InlineDecorationType.Before */) {
                    containsForeignElements |= 1 /* ForeignElementType.Before */;
                }
                else if (lineDecoration.type === 2 /* InlineDecorationType.After */) {
                    containsForeignElements |= 2 /* ForeignElementType.After */;
                }
            }
            tokens = _applyInlineDecorations(lineContent, len, tokens, input.lineDecorations);
        }
        if (!input.containsRTL) {
            // We can never split RTL text, as it ruins the rendering
            tokens = splitLargeTokens(lineContent, tokens, !input.isBasicASCII || input.fontLigatures);
        }
        return new ResolvedRenderLineInput(input.useMonospaceOptimizations, input.canUseHalfwidthRightwardsArrow, lineContent, len, isOverflowing, overflowingCharCount, tokens, containsForeignElements, input.fauxIndentLength, input.tabSize, input.startVisibleColumn, input.containsRTL, input.spaceWidth, input.renderSpaceCharCode, input.renderWhitespace, input.renderControlCharacters);
    }
    /**
     * In the rendering phase, characters are always looped until token.endIndex.
     * Ensure that all tokens end before `len` and the last one ends precisely at `len`.
     */
    function transformAndRemoveOverflowing(lineContent, lineContainsRTL, tokens, fauxIndentLength, len) {
        const result = [];
        let resultLen = 0;
        // The faux indent part of the line should have no token type
        if (fauxIndentLength > 0) {
            result[resultLen++] = new linePart_1.LinePart(fauxIndentLength, '', 0, false);
        }
        let startOffset = fauxIndentLength;
        for (let tokenIndex = 0, tokensLen = tokens.getCount(); tokenIndex < tokensLen; tokenIndex++) {
            const endIndex = tokens.getEndOffset(tokenIndex);
            if (endIndex <= fauxIndentLength) {
                // The faux indent part of the line should have no token type
                continue;
            }
            const type = tokens.getClassName(tokenIndex);
            if (endIndex >= len) {
                const tokenContainsRTL = (lineContainsRTL ? strings.containsRTL(lineContent.substring(startOffset, len)) : false);
                result[resultLen++] = new linePart_1.LinePart(len, type, 0, tokenContainsRTL);
                break;
            }
            const tokenContainsRTL = (lineContainsRTL ? strings.containsRTL(lineContent.substring(startOffset, endIndex)) : false);
            result[resultLen++] = new linePart_1.LinePart(endIndex, type, 0, tokenContainsRTL);
            startOffset = endIndex;
        }
        return result;
    }
    /**
     * written as a const enum to get value inlining.
     */
    var Constants;
    (function (Constants) {
        Constants[Constants["LongToken"] = 50] = "LongToken";
    })(Constants || (Constants = {}));
    /**
     * See https://github.com/microsoft/vscode/issues/6885.
     * It appears that having very large spans causes very slow reading of character positions.
     * So here we try to avoid that.
     */
    function splitLargeTokens(lineContent, tokens, onlyAtSpaces) {
        let lastTokenEndIndex = 0;
        const result = [];
        let resultLen = 0;
        if (onlyAtSpaces) {
            // Split only at spaces => we need to walk each character
            for (let i = 0, len = tokens.length; i < len; i++) {
                const token = tokens[i];
                const tokenEndIndex = token.endIndex;
                if (lastTokenEndIndex + 50 /* Constants.LongToken */ < tokenEndIndex) {
                    const tokenType = token.type;
                    const tokenMetadata = token.metadata;
                    const tokenContainsRTL = token.containsRTL;
                    let lastSpaceOffset = -1;
                    let currTokenStart = lastTokenEndIndex;
                    for (let j = lastTokenEndIndex; j < tokenEndIndex; j++) {
                        if (lineContent.charCodeAt(j) === 32 /* CharCode.Space */) {
                            lastSpaceOffset = j;
                        }
                        if (lastSpaceOffset !== -1 && j - currTokenStart >= 50 /* Constants.LongToken */) {
                            // Split at `lastSpaceOffset` + 1
                            result[resultLen++] = new linePart_1.LinePart(lastSpaceOffset + 1, tokenType, tokenMetadata, tokenContainsRTL);
                            currTokenStart = lastSpaceOffset + 1;
                            lastSpaceOffset = -1;
                        }
                    }
                    if (currTokenStart !== tokenEndIndex) {
                        result[resultLen++] = new linePart_1.LinePart(tokenEndIndex, tokenType, tokenMetadata, tokenContainsRTL);
                    }
                }
                else {
                    result[resultLen++] = token;
                }
                lastTokenEndIndex = tokenEndIndex;
            }
        }
        else {
            // Split anywhere => we don't need to walk each character
            for (let i = 0, len = tokens.length; i < len; i++) {
                const token = tokens[i];
                const tokenEndIndex = token.endIndex;
                const diff = (tokenEndIndex - lastTokenEndIndex);
                if (diff > 50 /* Constants.LongToken */) {
                    const tokenType = token.type;
                    const tokenMetadata = token.metadata;
                    const tokenContainsRTL = token.containsRTL;
                    const piecesCount = Math.ceil(diff / 50 /* Constants.LongToken */);
                    for (let j = 1; j < piecesCount; j++) {
                        const pieceEndIndex = lastTokenEndIndex + (j * 50 /* Constants.LongToken */);
                        result[resultLen++] = new linePart_1.LinePart(pieceEndIndex, tokenType, tokenMetadata, tokenContainsRTL);
                    }
                    result[resultLen++] = new linePart_1.LinePart(tokenEndIndex, tokenType, tokenMetadata, tokenContainsRTL);
                }
                else {
                    result[resultLen++] = token;
                }
                lastTokenEndIndex = tokenEndIndex;
            }
        }
        return result;
    }
    function isControlCharacter(charCode) {
        if (charCode < 32) {
            return (charCode !== 9 /* CharCode.Tab */);
        }
        if (charCode === 127) {
            // DEL
            return true;
        }
        if ((charCode >= 0x202A && charCode <= 0x202E)
            || (charCode >= 0x2066 && charCode <= 0x2069)
            || (charCode >= 0x200E && charCode <= 0x200F)
            || charCode === 0x061C) {
            // Unicode Directional Formatting Characters
            // LRE	U+202A	LEFT-TO-RIGHT EMBEDDING
            // RLE	U+202B	RIGHT-TO-LEFT EMBEDDING
            // PDF	U+202C	POP DIRECTIONAL FORMATTING
            // LRO	U+202D	LEFT-TO-RIGHT OVERRIDE
            // RLO	U+202E	RIGHT-TO-LEFT OVERRIDE
            // LRI	U+2066	LEFT-TO-RIGHT ISOLATE
            // RLI	U+2067	RIGHT-TO-LEFT ISOLATE
            // FSI	U+2068	FIRST STRONG ISOLATE
            // PDI	U+2069	POP DIRECTIONAL ISOLATE
            // LRM	U+200E	LEFT-TO-RIGHT MARK
            // RLM	U+200F	RIGHT-TO-LEFT MARK
            // ALM	U+061C	ARABIC LETTER MARK
            return true;
        }
        return false;
    }
    function extractControlCharacters(lineContent, tokens) {
        const result = [];
        let lastLinePart = new linePart_1.LinePart(0, '', 0, false);
        let charOffset = 0;
        for (const token of tokens) {
            const tokenEndIndex = token.endIndex;
            for (; charOffset < tokenEndIndex; charOffset++) {
                const charCode = lineContent.charCodeAt(charOffset);
                if (isControlCharacter(charCode)) {
                    if (charOffset > lastLinePart.endIndex) {
                        // emit previous part if it has text
                        lastLinePart = new linePart_1.LinePart(charOffset, token.type, token.metadata, token.containsRTL);
                        result.push(lastLinePart);
                    }
                    lastLinePart = new linePart_1.LinePart(charOffset + 1, 'mtkcontrol', token.metadata, false);
                    result.push(lastLinePart);
                }
            }
            if (charOffset > lastLinePart.endIndex) {
                // emit previous part if it has text
                lastLinePart = new linePart_1.LinePart(tokenEndIndex, token.type, token.metadata, token.containsRTL);
                result.push(lastLinePart);
            }
        }
        return result;
    }
    /**
     * Whitespace is rendered by "replacing" tokens with a special-purpose `mtkw` type that is later recognized in the rendering phase.
     * Moreover, a token is created for every visual indent because on some fonts the glyphs used for rendering whitespace (&rarr; or &middot;) do not have the same width as &nbsp;.
     * The rendering phase will generate `style="width:..."` for these tokens.
     */
    function _applyRenderWhitespace(input, lineContent, len, tokens) {
        const continuesWithWrappedLine = input.continuesWithWrappedLine;
        const fauxIndentLength = input.fauxIndentLength;
        const tabSize = input.tabSize;
        const startVisibleColumn = input.startVisibleColumn;
        const useMonospaceOptimizations = input.useMonospaceOptimizations;
        const selections = input.selectionsOnLine;
        const onlyBoundary = (input.renderWhitespace === 1 /* RenderWhitespace.Boundary */);
        const onlyTrailing = (input.renderWhitespace === 3 /* RenderWhitespace.Trailing */);
        const generateLinePartForEachWhitespace = (input.renderSpaceWidth !== input.spaceWidth);
        const result = [];
        let resultLen = 0;
        let tokenIndex = 0;
        let tokenType = tokens[tokenIndex].type;
        let tokenContainsRTL = tokens[tokenIndex].containsRTL;
        let tokenEndIndex = tokens[tokenIndex].endIndex;
        const tokensLength = tokens.length;
        let lineIsEmptyOrWhitespace = false;
        let firstNonWhitespaceIndex = strings.firstNonWhitespaceIndex(lineContent);
        let lastNonWhitespaceIndex;
        if (firstNonWhitespaceIndex === -1) {
            lineIsEmptyOrWhitespace = true;
            firstNonWhitespaceIndex = len;
            lastNonWhitespaceIndex = len;
        }
        else {
            lastNonWhitespaceIndex = strings.lastNonWhitespaceIndex(lineContent);
        }
        let wasInWhitespace = false;
        let currentSelectionIndex = 0;
        let currentSelection = selections && selections[currentSelectionIndex];
        let tmpIndent = startVisibleColumn % tabSize;
        for (let charIndex = fauxIndentLength; charIndex < len; charIndex++) {
            const chCode = lineContent.charCodeAt(charIndex);
            if (currentSelection && charIndex >= currentSelection.endOffset) {
                currentSelectionIndex++;
                currentSelection = selections && selections[currentSelectionIndex];
            }
            let isInWhitespace;
            if (charIndex < firstNonWhitespaceIndex || charIndex > lastNonWhitespaceIndex) {
                // in leading or trailing whitespace
                isInWhitespace = true;
            }
            else if (chCode === 9 /* CharCode.Tab */) {
                // a tab character is rendered both in all and boundary cases
                isInWhitespace = true;
            }
            else if (chCode === 32 /* CharCode.Space */) {
                // hit a space character
                if (onlyBoundary) {
                    // rendering only boundary whitespace
                    if (wasInWhitespace) {
                        isInWhitespace = true;
                    }
                    else {
                        const nextChCode = (charIndex + 1 < len ? lineContent.charCodeAt(charIndex + 1) : 0 /* CharCode.Null */);
                        isInWhitespace = (nextChCode === 32 /* CharCode.Space */ || nextChCode === 9 /* CharCode.Tab */);
                    }
                }
                else {
                    isInWhitespace = true;
                }
            }
            else {
                isInWhitespace = false;
            }
            // If rendering whitespace on selection, check that the charIndex falls within a selection
            if (isInWhitespace && selections) {
                isInWhitespace = !!currentSelection && currentSelection.startOffset <= charIndex && currentSelection.endOffset > charIndex;
            }
            // If rendering only trailing whitespace, check that the charIndex points to trailing whitespace.
            if (isInWhitespace && onlyTrailing) {
                isInWhitespace = lineIsEmptyOrWhitespace || charIndex > lastNonWhitespaceIndex;
            }
            if (isInWhitespace && tokenContainsRTL) {
                // If the token contains RTL text, breaking it up into multiple line parts
                // to render whitespace might affect the browser's bidi layout.
                //
                // We render whitespace in such tokens only if the whitespace
                // is the leading or the trailing whitespace of the line,
                // which doesn't affect the browser's bidi layout.
                if (charIndex >= firstNonWhitespaceIndex && charIndex <= lastNonWhitespaceIndex) {
                    isInWhitespace = false;
                }
            }
            if (wasInWhitespace) {
                // was in whitespace token
                if (!isInWhitespace || (!useMonospaceOptimizations && tmpIndent >= tabSize)) {
                    // leaving whitespace token or entering a new indent
                    if (generateLinePartForEachWhitespace) {
                        const lastEndIndex = (resultLen > 0 ? result[resultLen - 1].endIndex : fauxIndentLength);
                        for (let i = lastEndIndex + 1; i <= charIndex; i++) {
                            result[resultLen++] = new linePart_1.LinePart(i, 'mtkw', 1 /* LinePartMetadata.IS_WHITESPACE */, false);
                        }
                    }
                    else {
                        result[resultLen++] = new linePart_1.LinePart(charIndex, 'mtkw', 1 /* LinePartMetadata.IS_WHITESPACE */, false);
                    }
                    tmpIndent = tmpIndent % tabSize;
                }
            }
            else {
                // was in regular token
                if (charIndex === tokenEndIndex || (isInWhitespace && charIndex > fauxIndentLength)) {
                    result[resultLen++] = new linePart_1.LinePart(charIndex, tokenType, 0, tokenContainsRTL);
                    tmpIndent = tmpIndent % tabSize;
                }
            }
            if (chCode === 9 /* CharCode.Tab */) {
                tmpIndent = tabSize;
            }
            else if (strings.isFullWidthCharacter(chCode)) {
                tmpIndent += 2;
            }
            else {
                tmpIndent++;
            }
            wasInWhitespace = isInWhitespace;
            while (charIndex === tokenEndIndex) {
                tokenIndex++;
                if (tokenIndex < tokensLength) {
                    tokenType = tokens[tokenIndex].type;
                    tokenContainsRTL = tokens[tokenIndex].containsRTL;
                    tokenEndIndex = tokens[tokenIndex].endIndex;
                }
                else {
                    break;
                }
            }
        }
        let generateWhitespace = false;
        if (wasInWhitespace) {
            // was in whitespace token
            if (continuesWithWrappedLine && onlyBoundary) {
                const lastCharCode = (len > 0 ? lineContent.charCodeAt(len - 1) : 0 /* CharCode.Null */);
                const prevCharCode = (len > 1 ? lineContent.charCodeAt(len - 2) : 0 /* CharCode.Null */);
                const isSingleTrailingSpace = (lastCharCode === 32 /* CharCode.Space */ && (prevCharCode !== 32 /* CharCode.Space */ && prevCharCode !== 9 /* CharCode.Tab */));
                if (!isSingleTrailingSpace) {
                    generateWhitespace = true;
                }
            }
            else {
                generateWhitespace = true;
            }
        }
        if (generateWhitespace) {
            if (generateLinePartForEachWhitespace) {
                const lastEndIndex = (resultLen > 0 ? result[resultLen - 1].endIndex : fauxIndentLength);
                for (let i = lastEndIndex + 1; i <= len; i++) {
                    result[resultLen++] = new linePart_1.LinePart(i, 'mtkw', 1 /* LinePartMetadata.IS_WHITESPACE */, false);
                }
            }
            else {
                result[resultLen++] = new linePart_1.LinePart(len, 'mtkw', 1 /* LinePartMetadata.IS_WHITESPACE */, false);
            }
        }
        else {
            result[resultLen++] = new linePart_1.LinePart(len, tokenType, 0, tokenContainsRTL);
        }
        return result;
    }
    /**
     * Inline decorations are "merged" on top of tokens.
     * Special care must be taken when multiple inline decorations are at play and they overlap.
     */
    function _applyInlineDecorations(lineContent, len, tokens, _lineDecorations) {
        _lineDecorations.sort(lineDecorations_1.LineDecoration.compare);
        const lineDecorations = lineDecorations_1.LineDecorationsNormalizer.normalize(lineContent, _lineDecorations);
        const lineDecorationsLen = lineDecorations.length;
        let lineDecorationIndex = 0;
        const result = [];
        let resultLen = 0;
        let lastResultEndIndex = 0;
        for (let tokenIndex = 0, len = tokens.length; tokenIndex < len; tokenIndex++) {
            const token = tokens[tokenIndex];
            const tokenEndIndex = token.endIndex;
            const tokenType = token.type;
            const tokenMetadata = token.metadata;
            const tokenContainsRTL = token.containsRTL;
            while (lineDecorationIndex < lineDecorationsLen && lineDecorations[lineDecorationIndex].startOffset < tokenEndIndex) {
                const lineDecoration = lineDecorations[lineDecorationIndex];
                if (lineDecoration.startOffset > lastResultEndIndex) {
                    lastResultEndIndex = lineDecoration.startOffset;
                    result[resultLen++] = new linePart_1.LinePart(lastResultEndIndex, tokenType, tokenMetadata, tokenContainsRTL);
                }
                if (lineDecoration.endOffset + 1 <= tokenEndIndex) {
                    // This line decoration ends before this token ends
                    lastResultEndIndex = lineDecoration.endOffset + 1;
                    result[resultLen++] = new linePart_1.LinePart(lastResultEndIndex, tokenType + ' ' + lineDecoration.className, tokenMetadata | lineDecoration.metadata, tokenContainsRTL);
                    lineDecorationIndex++;
                }
                else {
                    // This line decoration continues on to the next token
                    lastResultEndIndex = tokenEndIndex;
                    result[resultLen++] = new linePart_1.LinePart(lastResultEndIndex, tokenType + ' ' + lineDecoration.className, tokenMetadata | lineDecoration.metadata, tokenContainsRTL);
                    break;
                }
            }
            if (tokenEndIndex > lastResultEndIndex) {
                lastResultEndIndex = tokenEndIndex;
                result[resultLen++] = new linePart_1.LinePart(lastResultEndIndex, tokenType, tokenMetadata, tokenContainsRTL);
            }
        }
        const lastTokenEndIndex = tokens[tokens.length - 1].endIndex;
        if (lineDecorationIndex < lineDecorationsLen && lineDecorations[lineDecorationIndex].startOffset === lastTokenEndIndex) {
            while (lineDecorationIndex < lineDecorationsLen && lineDecorations[lineDecorationIndex].startOffset === lastTokenEndIndex) {
                const lineDecoration = lineDecorations[lineDecorationIndex];
                result[resultLen++] = new linePart_1.LinePart(lastResultEndIndex, lineDecoration.className, lineDecoration.metadata, false);
                lineDecorationIndex++;
            }
        }
        return result;
    }
    /**
     * This function is on purpose not split up into multiple functions to allow runtime type inference (i.e. performance reasons).
     * Notice how all the needed data is fully resolved and passed in (i.e. no other calls).
     */
    function _renderLine(input, sb) {
        const fontIsMonospace = input.fontIsMonospace;
        const canUseHalfwidthRightwardsArrow = input.canUseHalfwidthRightwardsArrow;
        const containsForeignElements = input.containsForeignElements;
        const lineContent = input.lineContent;
        const len = input.len;
        const isOverflowing = input.isOverflowing;
        const overflowingCharCount = input.overflowingCharCount;
        const parts = input.parts;
        const fauxIndentLength = input.fauxIndentLength;
        const tabSize = input.tabSize;
        const startVisibleColumn = input.startVisibleColumn;
        const containsRTL = input.containsRTL;
        const spaceWidth = input.spaceWidth;
        const renderSpaceCharCode = input.renderSpaceCharCode;
        const renderWhitespace = input.renderWhitespace;
        const renderControlCharacters = input.renderControlCharacters;
        const characterMapping = new CharacterMapping(len + 1, parts.length);
        let lastCharacterMappingDefined = false;
        let charIndex = 0;
        let visibleColumn = startVisibleColumn;
        let charOffsetInPart = 0; // the character offset in the current part
        let charHorizontalOffset = 0; // the character horizontal position in terms of chars relative to line start
        let partDisplacement = 0;
        if (containsRTL) {
            sb.appendString('<span dir="ltr">');
        }
        else {
            sb.appendString('<span>');
        }
        for (let partIndex = 0, tokensLen = parts.length; partIndex < tokensLen; partIndex++) {
            const part = parts[partIndex];
            const partEndIndex = part.endIndex;
            const partType = part.type;
            const partContainsRTL = part.containsRTL;
            const partRendersWhitespace = (renderWhitespace !== 0 /* RenderWhitespace.None */ && part.isWhitespace());
            const partRendersWhitespaceWithWidth = partRendersWhitespace && !fontIsMonospace && (partType === 'mtkw' /*only whitespace*/ || !containsForeignElements);
            const partIsEmptyAndHasPseudoAfter = (charIndex === partEndIndex && part.isPseudoAfter());
            charOffsetInPart = 0;
            sb.appendString('<span ');
            if (partContainsRTL) {
                sb.appendString('style="unicode-bidi:isolate" ');
            }
            sb.appendString('class="');
            sb.appendString(partRendersWhitespaceWithWidth ? 'mtkz' : partType);
            sb.appendASCIICharCode(34 /* CharCode.DoubleQuote */);
            if (partRendersWhitespace) {
                let partWidth = 0;
                {
                    let _charIndex = charIndex;
                    let _visibleColumn = visibleColumn;
                    for (; _charIndex < partEndIndex; _charIndex++) {
                        const charCode = lineContent.charCodeAt(_charIndex);
                        const charWidth = (charCode === 9 /* CharCode.Tab */ ? (tabSize - (_visibleColumn % tabSize)) : 1) | 0;
                        partWidth += charWidth;
                        if (_charIndex >= fauxIndentLength) {
                            _visibleColumn += charWidth;
                        }
                    }
                }
                if (partRendersWhitespaceWithWidth) {
                    sb.appendString(' style="width:');
                    sb.appendString(String(spaceWidth * partWidth));
                    sb.appendString('px"');
                }
                sb.appendASCIICharCode(62 /* CharCode.GreaterThan */);
                for (; charIndex < partEndIndex; charIndex++) {
                    characterMapping.setColumnInfo(charIndex + 1, partIndex - partDisplacement, charOffsetInPart, charHorizontalOffset);
                    partDisplacement = 0;
                    const charCode = lineContent.charCodeAt(charIndex);
                    let producedCharacters;
                    let charWidth;
                    if (charCode === 9 /* CharCode.Tab */) {
                        producedCharacters = (tabSize - (visibleColumn % tabSize)) | 0;
                        charWidth = producedCharacters;
                        if (!canUseHalfwidthRightwardsArrow || charWidth > 1) {
                            sb.appendCharCode(0x2192); // RIGHTWARDS ARROW
                        }
                        else {
                            sb.appendCharCode(0xFFEB); // HALFWIDTH RIGHTWARDS ARROW
                        }
                        for (let space = 2; space <= charWidth; space++) {
                            sb.appendCharCode(0xA0); // &nbsp;
                        }
                    }
                    else { // must be CharCode.Space
                        producedCharacters = 2;
                        charWidth = 1;
                        sb.appendCharCode(renderSpaceCharCode); // &middot; or word separator middle dot
                        sb.appendCharCode(0x200C); // ZERO WIDTH NON-JOINER
                    }
                    charOffsetInPart += producedCharacters;
                    charHorizontalOffset += charWidth;
                    if (charIndex >= fauxIndentLength) {
                        visibleColumn += charWidth;
                    }
                }
            }
            else {
                sb.appendASCIICharCode(62 /* CharCode.GreaterThan */);
                for (; charIndex < partEndIndex; charIndex++) {
                    characterMapping.setColumnInfo(charIndex + 1, partIndex - partDisplacement, charOffsetInPart, charHorizontalOffset);
                    partDisplacement = 0;
                    const charCode = lineContent.charCodeAt(charIndex);
                    let producedCharacters = 1;
                    let charWidth = 1;
                    switch (charCode) {
                        case 9 /* CharCode.Tab */:
                            producedCharacters = (tabSize - (visibleColumn % tabSize));
                            charWidth = producedCharacters;
                            for (let space = 1; space <= producedCharacters; space++) {
                                sb.appendCharCode(0xA0); // &nbsp;
                            }
                            break;
                        case 32 /* CharCode.Space */:
                            sb.appendCharCode(0xA0); // &nbsp;
                            break;
                        case 60 /* CharCode.LessThan */:
                            sb.appendString('&lt;');
                            break;
                        case 62 /* CharCode.GreaterThan */:
                            sb.appendString('&gt;');
                            break;
                        case 38 /* CharCode.Ampersand */:
                            sb.appendString('&amp;');
                            break;
                        case 0 /* CharCode.Null */:
                            if (renderControlCharacters) {
                                // See https://unicode-table.com/en/blocks/control-pictures/
                                sb.appendCharCode(9216);
                            }
                            else {
                                sb.appendString('&#00;');
                            }
                            break;
                        case 65279 /* CharCode.UTF8_BOM */:
                        case 8232 /* CharCode.LINE_SEPARATOR */:
                        case 8233 /* CharCode.PARAGRAPH_SEPARATOR */:
                        case 133 /* CharCode.NEXT_LINE */:
                            sb.appendCharCode(0xFFFD);
                            break;
                        default:
                            if (strings.isFullWidthCharacter(charCode)) {
                                charWidth++;
                            }
                            // See https://unicode-table.com/en/blocks/control-pictures/
                            if (renderControlCharacters && charCode < 32) {
                                sb.appendCharCode(9216 + charCode);
                            }
                            else if (renderControlCharacters && charCode === 127) {
                                // DEL
                                sb.appendCharCode(9249);
                            }
                            else if (renderControlCharacters && isControlCharacter(charCode)) {
                                sb.appendString('[U+');
                                sb.appendString(to4CharHex(charCode));
                                sb.appendString(']');
                                producedCharacters = 8;
                                charWidth = producedCharacters;
                            }
                            else {
                                sb.appendCharCode(charCode);
                            }
                    }
                    charOffsetInPart += producedCharacters;
                    charHorizontalOffset += charWidth;
                    if (charIndex >= fauxIndentLength) {
                        visibleColumn += charWidth;
                    }
                }
            }
            if (partIsEmptyAndHasPseudoAfter) {
                partDisplacement++;
            }
            else {
                partDisplacement = 0;
            }
            if (charIndex >= len && !lastCharacterMappingDefined && part.isPseudoAfter()) {
                lastCharacterMappingDefined = true;
                characterMapping.setColumnInfo(charIndex + 1, partIndex, charOffsetInPart, charHorizontalOffset);
            }
            sb.appendString('</span>');
        }
        if (!lastCharacterMappingDefined) {
            // When getting client rects for the last character, we will position the
            // text range at the end of the span, insteaf of at the beginning of next span
            characterMapping.setColumnInfo(len + 1, parts.length - 1, charOffsetInPart, charHorizontalOffset);
        }
        if (isOverflowing) {
            sb.appendString('<span class="mtkoverflow">');
            sb.appendString(nls.localize('showMore', "Show more ({0})", renderOverflowingCharCount(overflowingCharCount)));
            sb.appendString('</span>');
        }
        sb.appendString('</span>');
        return new RenderLineOutput(characterMapping, containsRTL, containsForeignElements);
    }
    function to4CharHex(n) {
        return n.toString(16).toUpperCase().padStart(4, '0');
    }
    function renderOverflowingCharCount(n) {
        if (n < 1024) {
            return nls.localize('overflow.chars', "{0} chars", n);
        }
        if (n < 1024 * 1024) {
            return `${(n / 1024).toFixed(1)} KB`;
        }
        return `${(n / 1024 / 1024).toFixed(1)} MB`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0xpbmVSZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi92aWV3TGF5b3V0L3ZpZXdMaW5lUmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNFZoRyx3Q0FpREM7SUFZRCwwQ0FJQztJQWxaRCxJQUFrQixnQkFNakI7SUFORCxXQUFrQixnQkFBZ0I7UUFDakMsdURBQVEsQ0FBQTtRQUNSLCtEQUFZLENBQUE7UUFDWixpRUFBYSxDQUFBO1FBQ2IsK0RBQVksQ0FBQTtRQUNaLHFEQUFPLENBQUE7SUFDUixDQUFDLEVBTmlCLGdCQUFnQixnQ0FBaEIsZ0JBQWdCLFFBTWpDO0lBRUQsTUFBYSxTQUFTO1FBV3JCLFlBQVksVUFBa0IsRUFBRSxRQUFnQjtZQUMvQyxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztZQUM5QixJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUMzQixDQUFDO1FBRU0sTUFBTSxDQUFDLGNBQXlCO1lBQ3RDLE9BQU8sSUFBSSxDQUFDLFdBQVcsS0FBSyxjQUFjLENBQUMsV0FBVzttQkFDbEQsSUFBSSxDQUFDLFNBQVMsS0FBSyxjQUFjLENBQUMsU0FBUyxDQUFDO1FBQ2pELENBQUM7S0FDRDtJQXBCRCw4QkFvQkM7SUFFRCxNQUFhLGVBQWU7UUEyQjNCLFlBQ0MseUJBQWtDLEVBQ2xDLDhCQUF1QyxFQUN2QyxXQUFtQixFQUNuQix3QkFBaUMsRUFDakMsWUFBcUIsRUFDckIsV0FBb0IsRUFDcEIsZ0JBQXdCLEVBQ3hCLFVBQTJCLEVBQzNCLGVBQWlDLEVBQ2pDLE9BQWUsRUFDZixrQkFBMEIsRUFDMUIsVUFBa0IsRUFDbEIsV0FBbUIsRUFDbkIsYUFBcUIsRUFDckIsc0JBQThCLEVBQzlCLGdCQUF3RSxFQUN4RSx1QkFBZ0MsRUFDaEMsYUFBc0IsRUFDdEIsZ0JBQW9DO1lBRXBDLElBQUksQ0FBQyx5QkFBeUIsR0FBRyx5QkFBeUIsQ0FBQztZQUMzRCxJQUFJLENBQUMsOEJBQThCLEdBQUcsOEJBQThCLENBQUM7WUFDckUsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7WUFDL0IsSUFBSSxDQUFDLHdCQUF3QixHQUFHLHdCQUF3QixDQUFDO1lBQ3pELElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1lBQy9CLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztZQUN6QyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztZQUM3QixJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsZ0NBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNwRSxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUN2QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsa0JBQWtCLENBQUM7WUFDN0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7WUFDN0IsSUFBSSxDQUFDLHNCQUFzQixHQUFHLHNCQUFzQixDQUFDO1lBQ3JELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxDQUN2QixnQkFBZ0IsS0FBSyxLQUFLO2dCQUN6QixDQUFDO2dCQUNELENBQUMsQ0FBQyxnQkFBZ0IsS0FBSyxVQUFVO29CQUNoQyxDQUFDO29CQUNELENBQUMsQ0FBQyxnQkFBZ0IsS0FBSyxXQUFXO3dCQUNqQyxDQUFDO3dCQUNELENBQUMsQ0FBQyxnQkFBZ0IsS0FBSyxVQUFVOzRCQUNoQyxDQUFDOzRCQUNELENBQUMsOEJBQXNCLENBQzNCLENBQUM7WUFDRixJQUFJLENBQUMsdUJBQXVCLEdBQUcsdUJBQXVCLENBQUM7WUFDdkQsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7WUFDbkMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXBILE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxHQUFHLFVBQVUsQ0FBQyxDQUFDO1lBQzFELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQyxDQUFDO1lBQ3RELElBQUksWUFBWSxHQUFHLFVBQVUsRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsYUFBYSxDQUFDO2dCQUN0QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsTUFBTSxDQUFDLENBQUMscUNBQXFDO1lBQ3pFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDO2dCQUNwQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLENBQUMsc0JBQXNCO1lBQ3hELENBQUM7UUFDRixDQUFDO1FBRU8sYUFBYSxDQUFDLGVBQW1DO1lBQ3hELElBQUksSUFBSSxDQUFDLGdCQUFnQixLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNwQyxPQUFPLGVBQWUsS0FBSyxJQUFJLENBQUM7WUFDakMsQ0FBQztZQUVELElBQUksZUFBZSxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUM5QixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLGVBQWUsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM3RCxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN2RCxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUMxRCxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVNLE1BQU0sQ0FBQyxLQUFzQjtZQUNuQyxPQUFPLENBQ04sSUFBSSxDQUFDLHlCQUF5QixLQUFLLEtBQUssQ0FBQyx5QkFBeUI7bUJBQy9ELElBQUksQ0FBQyw4QkFBOEIsS0FBSyxLQUFLLENBQUMsOEJBQThCO21CQUM1RSxJQUFJLENBQUMsV0FBVyxLQUFLLEtBQUssQ0FBQyxXQUFXO21CQUN0QyxJQUFJLENBQUMsd0JBQXdCLEtBQUssS0FBSyxDQUFDLHdCQUF3QjttQkFDaEUsSUFBSSxDQUFDLFlBQVksS0FBSyxLQUFLLENBQUMsWUFBWTttQkFDeEMsSUFBSSxDQUFDLFdBQVcsS0FBSyxLQUFLLENBQUMsV0FBVzttQkFDdEMsSUFBSSxDQUFDLGdCQUFnQixLQUFLLEtBQUssQ0FBQyxnQkFBZ0I7bUJBQ2hELElBQUksQ0FBQyxPQUFPLEtBQUssS0FBSyxDQUFDLE9BQU87bUJBQzlCLElBQUksQ0FBQyxrQkFBa0IsS0FBSyxLQUFLLENBQUMsa0JBQWtCO21CQUNwRCxJQUFJLENBQUMsVUFBVSxLQUFLLEtBQUssQ0FBQyxVQUFVO21CQUNwQyxJQUFJLENBQUMsZ0JBQWdCLEtBQUssS0FBSyxDQUFDLGdCQUFnQjttQkFDaEQsSUFBSSxDQUFDLG1CQUFtQixLQUFLLEtBQUssQ0FBQyxtQkFBbUI7bUJBQ3RELElBQUksQ0FBQyxzQkFBc0IsS0FBSyxLQUFLLENBQUMsc0JBQXNCO21CQUM1RCxJQUFJLENBQUMsZ0JBQWdCLEtBQUssS0FBSyxDQUFDLGdCQUFnQjttQkFDaEQsSUFBSSxDQUFDLHVCQUF1QixLQUFLLEtBQUssQ0FBQyx1QkFBdUI7bUJBQzlELElBQUksQ0FBQyxhQUFhLEtBQUssS0FBSyxDQUFDLGFBQWE7bUJBQzFDLGdDQUFjLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLGVBQWUsQ0FBQzttQkFDckUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQzttQkFDeEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FDN0MsQ0FBQztRQUNILENBQUM7S0FDRDtJQXBJRCwwQ0FvSUM7SUFFRCxJQUFXLHlCQU1WO0lBTkQsV0FBVyx5QkFBeUI7UUFDbkMsd0dBQW9ELENBQUE7UUFDcEQsbUdBQW9ELENBQUE7UUFFcEQsbUdBQXFCLENBQUE7UUFDckIsb0dBQXNCLENBQUE7SUFDdkIsQ0FBQyxFQU5VLHlCQUF5QixLQUF6Qix5QkFBeUIsUUFNbkM7SUFFRCxNQUFhLFdBQVc7UUFDdkIsWUFDaUIsU0FBaUIsRUFDakIsU0FBaUI7WUFEakIsY0FBUyxHQUFULFNBQVMsQ0FBUTtZQUNqQixjQUFTLEdBQVQsU0FBUyxDQUFRO1FBQzlCLENBQUM7S0FDTDtJQUxELGtDQUtDO0lBRUQ7O09BRUc7SUFDSCxNQUFhLGdCQUFnQjtRQUVwQixNQUFNLENBQUMsWUFBWSxDQUFDLFFBQWdCO1lBQzNDLE9BQU8sQ0FBQyxRQUFRLDZEQUE0QyxDQUFDLHlEQUFnRCxDQUFDO1FBQy9HLENBQUM7UUFFTyxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQWdCO1lBQzNDLE9BQU8sQ0FBQyxRQUFRLHdEQUE0QyxDQUFDLHdEQUFnRCxDQUFDO1FBQy9HLENBQUM7UUFNRCxZQUFZLE1BQWMsRUFBRSxTQUFpQjtZQUM1QyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNyQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFFTSxhQUFhLENBQUMsTUFBYyxFQUFFLFNBQWlCLEVBQUUsU0FBaUIsRUFBRSxnQkFBd0I7WUFDbEcsTUFBTSxRQUFRLEdBQUcsQ0FDaEIsQ0FBQyxTQUFTLHdEQUErQyxDQUFDO2tCQUN4RCxDQUFDLFNBQVMsdURBQStDLENBQUMsQ0FDNUQsS0FBSyxDQUFDLENBQUM7WUFDUixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUM7WUFDbEMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQztRQUN2RCxDQUFDO1FBRU0sbUJBQW1CLENBQUMsTUFBYztZQUN4QyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3pDLDZCQUE2QjtnQkFDN0IsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFTyxvQkFBb0IsQ0FBQyxVQUFrQjtZQUM5QyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZCLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztZQUNELElBQUksVUFBVSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNwQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsQ0FBQztZQUNELElBQUksVUFBVSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDcEMsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRU0sY0FBYyxDQUFDLE1BQWM7WUFDbkMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN2RCxNQUFNLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDMUQsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzFELE9BQU8sSUFBSSxXQUFXLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFTSxTQUFTLENBQUMsV0FBd0IsRUFBRSxVQUFrQjtZQUM1RCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZHLE9BQU8sVUFBVSxHQUFHLENBQUMsQ0FBQztRQUN2QixDQUFDO1FBRU8sb0JBQW9CLENBQUMsU0FBaUIsRUFBRSxVQUFrQixFQUFFLFNBQWlCO1lBQ3BGLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDdkIsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBRUQsTUFBTSxXQUFXLEdBQUcsQ0FDbkIsQ0FBQyxTQUFTLHdEQUErQyxDQUFDO2tCQUN4RCxDQUFDLFNBQVMsdURBQStDLENBQUMsQ0FDNUQsS0FBSyxDQUFDLENBQUM7WUFFUixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDWixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUMxQixPQUFPLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7Z0JBQ3RCLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2pDLElBQUksUUFBUSxLQUFLLFdBQVcsRUFBRSxDQUFDO29CQUM5QixPQUFPLEdBQUcsQ0FBQztnQkFDWixDQUFDO3FCQUFNLElBQUksUUFBUSxHQUFHLFdBQVcsRUFBRSxDQUFDO29CQUNuQyxHQUFHLEdBQUcsR0FBRyxDQUFDO2dCQUNYLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxHQUFHLEdBQUcsR0FBRyxDQUFDO2dCQUNYLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxHQUFHLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ2pCLE9BQU8sR0FBRyxDQUFDO1lBQ1osQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVqQyxJQUFJLFFBQVEsS0FBSyxXQUFXLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxHQUFHLENBQUM7WUFDWixDQUFDO1lBQ0QsSUFBSSxRQUFRLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQzlCLE9BQU8sR0FBRyxDQUFDO1lBQ1osQ0FBQztZQUVELE1BQU0sWUFBWSxHQUFHLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM3RCxNQUFNLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFN0QsTUFBTSxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzdELElBQUksWUFBb0IsQ0FBQztZQUV6QixJQUFJLFlBQVksS0FBSyxZQUFZLEVBQUUsQ0FBQztnQkFDbkMsd0JBQXdCO2dCQUN4QixZQUFZLEdBQUcsVUFBVSxDQUFDO1lBQzNCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hELENBQUM7WUFFRCxNQUFNLGdCQUFnQixHQUFHLFNBQVMsR0FBRyxZQUFZLENBQUM7WUFDbEQsTUFBTSxnQkFBZ0IsR0FBRyxZQUFZLEdBQUcsU0FBUyxDQUFDO1lBRWxELElBQUksZ0JBQWdCLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDMUMsT0FBTyxHQUFHLENBQUM7WUFDWixDQUFDO1lBQ0QsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDO1FBRU0sT0FBTztZQUNiLE1BQU0sTUFBTSxHQUErQixFQUFFLENBQUM7WUFDOUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDdEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDL0IsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzFELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEQsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUNwRCxDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO0tBQ0Q7SUFySUQsNENBcUlDO0lBRUQsSUFBa0Isa0JBSWpCO0lBSkQsV0FBa0Isa0JBQWtCO1FBQ25DLDJEQUFRLENBQUE7UUFDUiwrREFBVSxDQUFBO1FBQ1YsNkRBQVMsQ0FBQTtJQUNWLENBQUMsRUFKaUIsa0JBQWtCLGtDQUFsQixrQkFBa0IsUUFJbkM7SUFFRCxNQUFhLGdCQUFnQjtRQU81QixZQUFZLGdCQUFrQyxFQUFFLFdBQW9CLEVBQUUsdUJBQTJDO1lBTmpILDJCQUFzQixHQUFTLFNBQVMsQ0FBQztZQU94QyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUM7WUFDekMsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7WUFDL0IsSUFBSSxDQUFDLHVCQUF1QixHQUFHLHVCQUF1QixDQUFDO1FBQ3hELENBQUM7S0FDRDtJQVpELDRDQVlDO0lBRUQsU0FBZ0IsY0FBYyxDQUFDLEtBQXNCLEVBQUUsRUFBaUI7UUFDdkUsSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUVwQyxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN0Qyx5REFBeUQ7Z0JBQ3pELEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBRTFCLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztnQkFDcEIsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQixJQUFJLHVCQUF1QixrQ0FBMEIsQ0FBQztnQkFDdEQsS0FBSyxNQUFNLGNBQWMsSUFBSSxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQ3BELElBQUksY0FBYyxDQUFDLElBQUksd0NBQWdDLElBQUksY0FBYyxDQUFDLElBQUksdUNBQStCLEVBQUUsQ0FBQzt3QkFDL0csRUFBRSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQzt3QkFDakMsRUFBRSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7d0JBQzFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7d0JBRTdCLElBQUksY0FBYyxDQUFDLElBQUksd0NBQWdDLEVBQUUsQ0FBQzs0QkFDekQsdUJBQXVCLHFDQUE2QixDQUFDOzRCQUNyRCxXQUFXLEVBQUUsQ0FBQzt3QkFDZixDQUFDO3dCQUNELElBQUksY0FBYyxDQUFDLElBQUksdUNBQStCLEVBQUUsQ0FBQzs0QkFDeEQsdUJBQXVCLG9DQUE0QixDQUFDOzRCQUNwRCxVQUFVLEVBQUUsQ0FBQzt3QkFDZCxDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUUzQixNQUFNLGdCQUFnQixHQUFHLElBQUksZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLFdBQVcsR0FBRyxVQUFVLENBQUMsQ0FBQztnQkFDM0UsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVyRCxPQUFPLElBQUksZ0JBQWdCLENBQzFCLGdCQUFnQixFQUNoQixLQUFLLEVBQ0wsdUJBQXVCLENBQ3ZCLENBQUM7WUFDSCxDQUFDO1lBRUQsd0JBQXdCO1lBQ3hCLEVBQUUsQ0FBQyxZQUFZLENBQUMsNEJBQTRCLENBQUMsQ0FBQztZQUM5QyxPQUFPLElBQUksZ0JBQWdCLENBQzFCLElBQUksZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUMxQixLQUFLLGtDQUVMLENBQUM7UUFDSCxDQUFDO1FBRUQsT0FBTyxXQUFXLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVELE1BQWEsaUJBQWlCO1FBQzdCLFlBQ2lCLGdCQUFrQyxFQUNsQyxJQUFZLEVBQ1osV0FBb0IsRUFDcEIsdUJBQTJDO1lBSDNDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDbEMsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUNaLGdCQUFXLEdBQVgsV0FBVyxDQUFTO1lBQ3BCLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBb0I7UUFFNUQsQ0FBQztLQUNEO0lBUkQsOENBUUM7SUFFRCxTQUFnQixlQUFlLENBQUMsS0FBc0I7UUFDckQsTUFBTSxFQUFFLEdBQUcsSUFBSSw2QkFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sR0FBRyxHQUFHLGNBQWMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEMsT0FBTyxJQUFJLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsR0FBRyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztJQUM5RyxDQUFDO0lBRUQsTUFBTSx1QkFBdUI7UUFDNUIsWUFDaUIsZUFBd0IsRUFDeEIsOEJBQXVDLEVBQ3ZDLFdBQW1CLEVBQ25CLEdBQVcsRUFDWCxhQUFzQixFQUN0QixvQkFBNEIsRUFDNUIsS0FBaUIsRUFDakIsdUJBQTJDLEVBQzNDLGdCQUF3QixFQUN4QixPQUFlLEVBQ2Ysa0JBQTBCLEVBQzFCLFdBQW9CLEVBQ3BCLFVBQWtCLEVBQ2xCLG1CQUEyQixFQUMzQixnQkFBa0MsRUFDbEMsdUJBQWdDO1lBZmhDLG9CQUFlLEdBQWYsZUFBZSxDQUFTO1lBQ3hCLG1DQUE4QixHQUE5Qiw4QkFBOEIsQ0FBUztZQUN2QyxnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUNuQixRQUFHLEdBQUgsR0FBRyxDQUFRO1lBQ1gsa0JBQWEsR0FBYixhQUFhLENBQVM7WUFDdEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFRO1lBQzVCLFVBQUssR0FBTCxLQUFLLENBQVk7WUFDakIsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUFvQjtZQUMzQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVE7WUFDeEIsWUFBTyxHQUFQLE9BQU8sQ0FBUTtZQUNmLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBUTtZQUMxQixnQkFBVyxHQUFYLFdBQVcsQ0FBUztZQUNwQixlQUFVLEdBQVYsVUFBVSxDQUFRO1lBQ2xCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBUTtZQUMzQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQ2xDLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBUztZQUVoRCxFQUFFO1FBQ0gsQ0FBQztLQUNEO0lBRUQsU0FBUyxzQkFBc0IsQ0FBQyxLQUFzQjtRQUNyRCxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO1FBRXRDLElBQUksYUFBc0IsQ0FBQztRQUMzQixJQUFJLG9CQUE0QixDQUFDO1FBQ2pDLElBQUksR0FBVyxDQUFDO1FBRWhCLElBQUksS0FBSyxDQUFDLHNCQUFzQixLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDOUYsYUFBYSxHQUFHLElBQUksQ0FBQztZQUNyQixvQkFBb0IsR0FBRyxXQUFXLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQztZQUN6RSxHQUFHLEdBQUcsS0FBSyxDQUFDLHNCQUFzQixDQUFDO1FBQ3BDLENBQUM7YUFBTSxDQUFDO1lBQ1AsYUFBYSxHQUFHLEtBQUssQ0FBQztZQUN0QixvQkFBb0IsR0FBRyxDQUFDLENBQUM7WUFDekIsR0FBRyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUM7UUFDMUIsQ0FBQztRQUVELElBQUksTUFBTSxHQUFHLDZCQUE2QixDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzFILElBQUksS0FBSyxDQUFDLHVCQUF1QixJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQzFELCtFQUErRTtZQUMvRSwrRUFBK0U7WUFDL0UsTUFBTSxHQUFHLHdCQUF3QixDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBQ0QsSUFBSSxLQUFLLENBQUMsZ0JBQWdCLGlDQUF5QjtZQUNsRCxLQUFLLENBQUMsZ0JBQWdCLHNDQUE4QjtZQUNwRCxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsdUNBQStCLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztZQUNuRixDQUFDLEtBQUssQ0FBQyxnQkFBZ0Isc0NBQThCLElBQUksQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUMsRUFDeEYsQ0FBQztZQUNGLE1BQU0sR0FBRyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNsRSxDQUFDO1FBQ0QsSUFBSSx1QkFBdUIsa0NBQTBCLENBQUM7UUFDdEQsSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN0QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNsRSxNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLGNBQWMsQ0FBQyxJQUFJLCtEQUF1RCxFQUFFLENBQUM7b0JBQ2hGLG9FQUFvRTtvQkFDcEUsdUJBQXVCLHFDQUE2QixDQUFDO2dCQUN0RCxDQUFDO3FCQUFNLElBQUksY0FBYyxDQUFDLElBQUksd0NBQWdDLEVBQUUsQ0FBQztvQkFDaEUsdUJBQXVCLHFDQUE2QixDQUFDO2dCQUN0RCxDQUFDO3FCQUFNLElBQUksY0FBYyxDQUFDLElBQUksdUNBQStCLEVBQUUsQ0FBQztvQkFDL0QsdUJBQXVCLG9DQUE0QixDQUFDO2dCQUNyRCxDQUFDO1lBQ0YsQ0FBQztZQUNELE1BQU0sR0FBRyx1QkFBdUIsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUNELElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDeEIseURBQXlEO1lBQ3pELE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDLFlBQVksSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDNUYsQ0FBQztRQUVELE9BQU8sSUFBSSx1QkFBdUIsQ0FDakMsS0FBSyxDQUFDLHlCQUF5QixFQUMvQixLQUFLLENBQUMsOEJBQThCLEVBQ3BDLFdBQVcsRUFDWCxHQUFHLEVBQ0gsYUFBYSxFQUNiLG9CQUFvQixFQUNwQixNQUFNLEVBQ04sdUJBQXVCLEVBQ3ZCLEtBQUssQ0FBQyxnQkFBZ0IsRUFDdEIsS0FBSyxDQUFDLE9BQU8sRUFDYixLQUFLLENBQUMsa0JBQWtCLEVBQ3hCLEtBQUssQ0FBQyxXQUFXLEVBQ2pCLEtBQUssQ0FBQyxVQUFVLEVBQ2hCLEtBQUssQ0FBQyxtQkFBbUIsRUFDekIsS0FBSyxDQUFDLGdCQUFnQixFQUN0QixLQUFLLENBQUMsdUJBQXVCLENBQzdCLENBQUM7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsU0FBUyw2QkFBNkIsQ0FBQyxXQUFtQixFQUFFLGVBQXdCLEVBQUUsTUFBdUIsRUFBRSxnQkFBd0IsRUFBRSxHQUFXO1FBQ25KLE1BQU0sTUFBTSxHQUFlLEVBQUUsQ0FBQztRQUM5QixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFFbEIsNkRBQTZEO1FBQzdELElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDMUIsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEdBQUcsSUFBSSxtQkFBUSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUNELElBQUksV0FBVyxHQUFHLGdCQUFnQixDQUFDO1FBQ25DLEtBQUssSUFBSSxVQUFVLEdBQUcsQ0FBQyxFQUFFLFNBQVMsR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsVUFBVSxHQUFHLFNBQVMsRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDO1lBQzlGLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDakQsSUFBSSxRQUFRLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDbEMsNkRBQTZEO2dCQUM3RCxTQUFTO1lBQ1YsQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0MsSUFBSSxRQUFRLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ3JCLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2xILE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLElBQUksbUJBQVEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNO1lBQ1AsQ0FBQztZQUNELE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkgsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEdBQUcsSUFBSSxtQkFBUSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDeEUsV0FBVyxHQUFHLFFBQVEsQ0FBQztRQUN4QixDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFXLFNBRVY7SUFGRCxXQUFXLFNBQVM7UUFDbkIsb0RBQWMsQ0FBQTtJQUNmLENBQUMsRUFGVSxTQUFTLEtBQVQsU0FBUyxRQUVuQjtJQUVEOzs7O09BSUc7SUFDSCxTQUFTLGdCQUFnQixDQUFDLFdBQW1CLEVBQUUsTUFBa0IsRUFBRSxZQUFxQjtRQUN2RixJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQztRQUMxQixNQUFNLE1BQU0sR0FBZSxFQUFFLENBQUM7UUFDOUIsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBRWxCLElBQUksWUFBWSxFQUFFLENBQUM7WUFDbEIseURBQXlEO1lBQ3pELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO2dCQUNyQyxJQUFJLGlCQUFpQiwrQkFBc0IsR0FBRyxhQUFhLEVBQUUsQ0FBQztvQkFDN0QsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztvQkFDN0IsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztvQkFDckMsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO29CQUUzQyxJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDekIsSUFBSSxjQUFjLEdBQUcsaUJBQWlCLENBQUM7b0JBQ3ZDLEtBQUssSUFBSSxDQUFDLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQyxHQUFHLGFBQWEsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUN4RCxJQUFJLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLDRCQUFtQixFQUFFLENBQUM7NEJBQ2xELGVBQWUsR0FBRyxDQUFDLENBQUM7d0JBQ3JCLENBQUM7d0JBQ0QsSUFBSSxlQUFlLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLGNBQWMsZ0NBQXVCLEVBQUUsQ0FBQzs0QkFDekUsaUNBQWlDOzRCQUNqQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsR0FBRyxJQUFJLG1CQUFRLENBQUMsZUFBZSxHQUFHLENBQUMsRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7NEJBQ3BHLGNBQWMsR0FBRyxlQUFlLEdBQUcsQ0FBQyxDQUFDOzRCQUNyQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQ3RCLENBQUM7b0JBQ0YsQ0FBQztvQkFDRCxJQUFJLGNBQWMsS0FBSyxhQUFhLEVBQUUsQ0FBQzt3QkFDdEMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEdBQUcsSUFBSSxtQkFBUSxDQUFDLGFBQWEsRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7b0JBQy9GLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQztnQkFDN0IsQ0FBQztnQkFFRCxpQkFBaUIsR0FBRyxhQUFhLENBQUM7WUFDbkMsQ0FBQztRQUNGLENBQUM7YUFBTSxDQUFDO1lBQ1AseURBQXlEO1lBQ3pELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO2dCQUNyQyxNQUFNLElBQUksR0FBRyxDQUFDLGFBQWEsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUNqRCxJQUFJLElBQUksK0JBQXNCLEVBQUUsQ0FBQztvQkFDaEMsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztvQkFDN0IsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztvQkFDckMsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO29CQUMzQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksK0JBQXNCLENBQUMsQ0FBQztvQkFDMUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUN0QyxNQUFNLGFBQWEsR0FBRyxpQkFBaUIsR0FBRyxDQUFDLENBQUMsK0JBQXNCLENBQUMsQ0FBQzt3QkFDcEUsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEdBQUcsSUFBSSxtQkFBUSxDQUFDLGFBQWEsRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7b0JBQy9GLENBQUM7b0JBQ0QsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEdBQUcsSUFBSSxtQkFBUSxDQUFDLGFBQWEsRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBQy9GLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUM7Z0JBQzdCLENBQUM7Z0JBQ0QsaUJBQWlCLEdBQUcsYUFBYSxDQUFDO1lBQ25DLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBUyxrQkFBa0IsQ0FBQyxRQUFnQjtRQUMzQyxJQUFJLFFBQVEsR0FBRyxFQUFFLEVBQUUsQ0FBQztZQUNuQixPQUFPLENBQUMsUUFBUSx5QkFBaUIsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFDRCxJQUFJLFFBQVEsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUN0QixNQUFNO1lBQ04sT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsSUFDQyxDQUFDLFFBQVEsSUFBSSxNQUFNLElBQUksUUFBUSxJQUFJLE1BQU0sQ0FBQztlQUN2QyxDQUFDLFFBQVEsSUFBSSxNQUFNLElBQUksUUFBUSxJQUFJLE1BQU0sQ0FBQztlQUMxQyxDQUFDLFFBQVEsSUFBSSxNQUFNLElBQUksUUFBUSxJQUFJLE1BQU0sQ0FBQztlQUMxQyxRQUFRLEtBQUssTUFBTSxFQUNyQixDQUFDO1lBQ0YsNENBQTRDO1lBQzVDLHFDQUFxQztZQUNyQyxxQ0FBcUM7WUFDckMsd0NBQXdDO1lBQ3hDLG9DQUFvQztZQUNwQyxvQ0FBb0M7WUFDcEMsbUNBQW1DO1lBQ25DLG1DQUFtQztZQUNuQyxrQ0FBa0M7WUFDbEMscUNBQXFDO1lBQ3JDLGdDQUFnQztZQUNoQyxnQ0FBZ0M7WUFDaEMsZ0NBQWdDO1lBQ2hDLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQUVELFNBQVMsd0JBQXdCLENBQUMsV0FBbUIsRUFBRSxNQUFrQjtRQUN4RSxNQUFNLE1BQU0sR0FBZSxFQUFFLENBQUM7UUFDOUIsSUFBSSxZQUFZLEdBQWEsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzNELElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztRQUNuQixLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQzVCLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7WUFDckMsT0FBTyxVQUFVLEdBQUcsYUFBYSxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQ2pELE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3BELElBQUksa0JBQWtCLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztvQkFDbEMsSUFBSSxVQUFVLEdBQUcsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUN4QyxvQ0FBb0M7d0JBQ3BDLFlBQVksR0FBRyxJQUFJLG1CQUFRLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7d0JBQ3ZGLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQzNCLENBQUM7b0JBQ0QsWUFBWSxHQUFHLElBQUksbUJBQVEsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUNqRixNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUMzQixDQUFDO1lBQ0YsQ0FBQztZQUNELElBQUksVUFBVSxHQUFHLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDeEMsb0NBQW9DO2dCQUNwQyxZQUFZLEdBQUcsSUFBSSxtQkFBUSxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUMxRixNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzNCLENBQUM7UUFDRixDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFNBQVMsc0JBQXNCLENBQUMsS0FBc0IsRUFBRSxXQUFtQixFQUFFLEdBQVcsRUFBRSxNQUFrQjtRQUUzRyxNQUFNLHdCQUF3QixHQUFHLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQztRQUNoRSxNQUFNLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztRQUNoRCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO1FBQzlCLE1BQU0sa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDO1FBQ3BELE1BQU0seUJBQXlCLEdBQUcsS0FBSyxDQUFDLHlCQUF5QixDQUFDO1FBQ2xFLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztRQUMxQyxNQUFNLFlBQVksR0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0Isc0NBQThCLENBQUMsQ0FBQztRQUM1RSxNQUFNLFlBQVksR0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0Isc0NBQThCLENBQUMsQ0FBQztRQUM1RSxNQUFNLGlDQUFpQyxHQUFHLENBQUMsS0FBSyxDQUFDLGdCQUFnQixLQUFLLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUV4RixNQUFNLE1BQU0sR0FBZSxFQUFFLENBQUM7UUFDOUIsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztRQUNuQixJQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3hDLElBQUksZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLFdBQVcsQ0FBQztRQUN0RCxJQUFJLGFBQWEsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDO1FBQ2hELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFFbkMsSUFBSSx1QkFBdUIsR0FBRyxLQUFLLENBQUM7UUFDcEMsSUFBSSx1QkFBdUIsR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDM0UsSUFBSSxzQkFBOEIsQ0FBQztRQUNuQyxJQUFJLHVCQUF1QixLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDcEMsdUJBQXVCLEdBQUcsSUFBSSxDQUFDO1lBQy9CLHVCQUF1QixHQUFHLEdBQUcsQ0FBQztZQUM5QixzQkFBc0IsR0FBRyxHQUFHLENBQUM7UUFDOUIsQ0FBQzthQUFNLENBQUM7WUFDUCxzQkFBc0IsR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUVELElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQztRQUM1QixJQUFJLHFCQUFxQixHQUFHLENBQUMsQ0FBQztRQUM5QixJQUFJLGdCQUFnQixHQUFHLFVBQVUsSUFBSSxVQUFVLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUN2RSxJQUFJLFNBQVMsR0FBRyxrQkFBa0IsR0FBRyxPQUFPLENBQUM7UUFDN0MsS0FBSyxJQUFJLFNBQVMsR0FBRyxnQkFBZ0IsRUFBRSxTQUFTLEdBQUcsR0FBRyxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUM7WUFDckUsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUVqRCxJQUFJLGdCQUFnQixJQUFJLFNBQVMsSUFBSSxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDakUscUJBQXFCLEVBQUUsQ0FBQztnQkFDeEIsZ0JBQWdCLEdBQUcsVUFBVSxJQUFJLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ3BFLENBQUM7WUFFRCxJQUFJLGNBQXVCLENBQUM7WUFDNUIsSUFBSSxTQUFTLEdBQUcsdUJBQXVCLElBQUksU0FBUyxHQUFHLHNCQUFzQixFQUFFLENBQUM7Z0JBQy9FLG9DQUFvQztnQkFDcEMsY0FBYyxHQUFHLElBQUksQ0FBQztZQUN2QixDQUFDO2lCQUFNLElBQUksTUFBTSx5QkFBaUIsRUFBRSxDQUFDO2dCQUNwQyw2REFBNkQ7Z0JBQzdELGNBQWMsR0FBRyxJQUFJLENBQUM7WUFDdkIsQ0FBQztpQkFBTSxJQUFJLE1BQU0sNEJBQW1CLEVBQUUsQ0FBQztnQkFDdEMsd0JBQXdCO2dCQUN4QixJQUFJLFlBQVksRUFBRSxDQUFDO29CQUNsQixxQ0FBcUM7b0JBQ3JDLElBQUksZUFBZSxFQUFFLENBQUM7d0JBQ3JCLGNBQWMsR0FBRyxJQUFJLENBQUM7b0JBQ3ZCLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxNQUFNLFVBQVUsR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLHNCQUFjLENBQUMsQ0FBQzt3QkFDakcsY0FBYyxHQUFHLENBQUMsVUFBVSw0QkFBbUIsSUFBSSxVQUFVLHlCQUFpQixDQUFDLENBQUM7b0JBQ2pGLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLGNBQWMsR0FBRyxJQUFJLENBQUM7Z0JBQ3ZCLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsY0FBYyxHQUFHLEtBQUssQ0FBQztZQUN4QixDQUFDO1lBRUQsMEZBQTBGO1lBQzFGLElBQUksY0FBYyxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNsQyxjQUFjLEdBQUcsQ0FBQyxDQUFDLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLFdBQVcsSUFBSSxTQUFTLElBQUksZ0JBQWdCLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztZQUM1SCxDQUFDO1lBRUQsaUdBQWlHO1lBQ2pHLElBQUksY0FBYyxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUNwQyxjQUFjLEdBQUcsdUJBQXVCLElBQUksU0FBUyxHQUFHLHNCQUFzQixDQUFDO1lBQ2hGLENBQUM7WUFFRCxJQUFJLGNBQWMsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN4QywwRUFBMEU7Z0JBQzFFLCtEQUErRDtnQkFDL0QsRUFBRTtnQkFDRiw2REFBNkQ7Z0JBQzdELHlEQUF5RDtnQkFDekQsa0RBQWtEO2dCQUNsRCxJQUFJLFNBQVMsSUFBSSx1QkFBdUIsSUFBSSxTQUFTLElBQUksc0JBQXNCLEVBQUUsQ0FBQztvQkFDakYsY0FBYyxHQUFHLEtBQUssQ0FBQztnQkFDeEIsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUNyQiwwQkFBMEI7Z0JBQzFCLElBQUksQ0FBQyxjQUFjLElBQUksQ0FBQyxDQUFDLHlCQUF5QixJQUFJLFNBQVMsSUFBSSxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUM3RSxvREFBb0Q7b0JBQ3BELElBQUksaUNBQWlDLEVBQUUsQ0FBQzt3QkFDdkMsTUFBTSxZQUFZLEdBQUcsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzt3QkFDekYsS0FBSyxJQUFJLENBQUMsR0FBRyxZQUFZLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzs0QkFDcEQsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEdBQUcsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxNQUFNLDBDQUFrQyxLQUFLLENBQUMsQ0FBQzt3QkFDdEYsQ0FBQztvQkFDRixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEdBQUcsSUFBSSxtQkFBUSxDQUFDLFNBQVMsRUFBRSxNQUFNLDBDQUFrQyxLQUFLLENBQUMsQ0FBQztvQkFDOUYsQ0FBQztvQkFDRCxTQUFTLEdBQUcsU0FBUyxHQUFHLE9BQU8sQ0FBQztnQkFDakMsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCx1QkFBdUI7Z0JBQ3ZCLElBQUksU0FBUyxLQUFLLGFBQWEsSUFBSSxDQUFDLGNBQWMsSUFBSSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO29CQUNyRixNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsR0FBRyxJQUFJLG1CQUFRLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztvQkFDOUUsU0FBUyxHQUFHLFNBQVMsR0FBRyxPQUFPLENBQUM7Z0JBQ2pDLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxNQUFNLHlCQUFpQixFQUFFLENBQUM7Z0JBQzdCLFNBQVMsR0FBRyxPQUFPLENBQUM7WUFDckIsQ0FBQztpQkFBTSxJQUFJLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUNqRCxTQUFTLElBQUksQ0FBQyxDQUFDO1lBQ2hCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxTQUFTLEVBQUUsQ0FBQztZQUNiLENBQUM7WUFFRCxlQUFlLEdBQUcsY0FBYyxDQUFDO1lBRWpDLE9BQU8sU0FBUyxLQUFLLGFBQWEsRUFBRSxDQUFDO2dCQUNwQyxVQUFVLEVBQUUsQ0FBQztnQkFDYixJQUFJLFVBQVUsR0FBRyxZQUFZLEVBQUUsQ0FBQztvQkFDL0IsU0FBUyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQ3BDLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxXQUFXLENBQUM7b0JBQ2xELGFBQWEsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDO2dCQUM3QyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsTUFBTTtnQkFDUCxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLGtCQUFrQixHQUFHLEtBQUssQ0FBQztRQUMvQixJQUFJLGVBQWUsRUFBRSxDQUFDO1lBQ3JCLDBCQUEwQjtZQUMxQixJQUFJLHdCQUF3QixJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUM5QyxNQUFNLFlBQVksR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsc0JBQWMsQ0FBQyxDQUFDO2dCQUNqRixNQUFNLFlBQVksR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsc0JBQWMsQ0FBQyxDQUFDO2dCQUNqRixNQUFNLHFCQUFxQixHQUFHLENBQUMsWUFBWSw0QkFBbUIsSUFBSSxDQUFDLFlBQVksNEJBQW1CLElBQUksWUFBWSx5QkFBaUIsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RJLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO29CQUM1QixrQkFBa0IsR0FBRyxJQUFJLENBQUM7Z0JBQzNCLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1Asa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1lBQzNCLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO1lBQ3hCLElBQUksaUNBQWlDLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxZQUFZLEdBQUcsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDekYsS0FBSyxJQUFJLENBQUMsR0FBRyxZQUFZLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDOUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEdBQUcsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxNQUFNLDBDQUFrQyxLQUFLLENBQUMsQ0FBQztnQkFDdEYsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsR0FBRyxJQUFJLG1CQUFRLENBQUMsR0FBRyxFQUFFLE1BQU0sMENBQWtDLEtBQUssQ0FBQyxDQUFDO1lBQ3hGLENBQUM7UUFDRixDQUFDO2FBQU0sQ0FBQztZQUNQLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLElBQUksbUJBQVEsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFFRDs7O09BR0c7SUFDSCxTQUFTLHVCQUF1QixDQUFDLFdBQW1CLEVBQUUsR0FBVyxFQUFFLE1BQWtCLEVBQUUsZ0JBQWtDO1FBQ3hILGdCQUFnQixDQUFDLElBQUksQ0FBQyxnQ0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzlDLE1BQU0sZUFBZSxHQUFHLDJDQUF5QixDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUMzRixNQUFNLGtCQUFrQixHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUM7UUFFbEQsSUFBSSxtQkFBbUIsR0FBRyxDQUFDLENBQUM7UUFDNUIsTUFBTSxNQUFNLEdBQWUsRUFBRSxDQUFDO1FBQzlCLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNsQixJQUFJLGtCQUFrQixHQUFHLENBQUMsQ0FBQztRQUMzQixLQUFLLElBQUksVUFBVSxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxVQUFVLEdBQUcsR0FBRyxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUM7WUFDOUUsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7WUFDckMsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztZQUM3QixNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO1lBQ3JDLE1BQU0sZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQztZQUUzQyxPQUFPLG1CQUFtQixHQUFHLGtCQUFrQixJQUFJLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLFdBQVcsR0FBRyxhQUFhLEVBQUUsQ0FBQztnQkFDckgsTUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBRTVELElBQUksY0FBYyxDQUFDLFdBQVcsR0FBRyxrQkFBa0IsRUFBRSxDQUFDO29CQUNyRCxrQkFBa0IsR0FBRyxjQUFjLENBQUMsV0FBVyxDQUFDO29CQUNoRCxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsR0FBRyxJQUFJLG1CQUFRLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUNwRyxDQUFDO2dCQUVELElBQUksY0FBYyxDQUFDLFNBQVMsR0FBRyxDQUFDLElBQUksYUFBYSxFQUFFLENBQUM7b0JBQ25ELG1EQUFtRDtvQkFDbkQsa0JBQWtCLEdBQUcsY0FBYyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7b0JBQ2xELE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLElBQUksbUJBQVEsQ0FBQyxrQkFBa0IsRUFBRSxTQUFTLEdBQUcsR0FBRyxHQUFHLGNBQWMsQ0FBQyxTQUFTLEVBQUUsYUFBYSxHQUFHLGNBQWMsQ0FBQyxRQUFRLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztvQkFDOUosbUJBQW1CLEVBQUUsQ0FBQztnQkFDdkIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLHNEQUFzRDtvQkFDdEQsa0JBQWtCLEdBQUcsYUFBYSxDQUFDO29CQUNuQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsR0FBRyxJQUFJLG1CQUFRLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxHQUFHLEdBQUcsR0FBRyxjQUFjLENBQUMsU0FBUyxFQUFFLGFBQWEsR0FBRyxjQUFjLENBQUMsUUFBUSxFQUFFLGdCQUFnQixDQUFDLENBQUM7b0JBQzlKLE1BQU07Z0JBQ1AsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLGFBQWEsR0FBRyxrQkFBa0IsRUFBRSxDQUFDO2dCQUN4QyxrQkFBa0IsR0FBRyxhQUFhLENBQUM7Z0JBQ25DLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLElBQUksbUJBQVEsQ0FBQyxrQkFBa0IsRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDcEcsQ0FBQztRQUNGLENBQUM7UUFFRCxNQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztRQUM3RCxJQUFJLG1CQUFtQixHQUFHLGtCQUFrQixJQUFJLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLFdBQVcsS0FBSyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3hILE9BQU8sbUJBQW1CLEdBQUcsa0JBQWtCLElBQUksZUFBZSxDQUFDLG1CQUFtQixDQUFDLENBQUMsV0FBVyxLQUFLLGlCQUFpQixFQUFFLENBQUM7Z0JBQzNILE1BQU0sY0FBYyxHQUFHLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUM1RCxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsR0FBRyxJQUFJLG1CQUFRLENBQUMsa0JBQWtCLEVBQUUsY0FBYyxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNqSCxtQkFBbUIsRUFBRSxDQUFDO1lBQ3ZCLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsU0FBUyxXQUFXLENBQUMsS0FBOEIsRUFBRSxFQUFpQjtRQUNyRSxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO1FBQzlDLE1BQU0sOEJBQThCLEdBQUcsS0FBSyxDQUFDLDhCQUE4QixDQUFDO1FBQzVFLE1BQU0sdUJBQXVCLEdBQUcsS0FBSyxDQUFDLHVCQUF1QixDQUFDO1FBQzlELE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7UUFDdEMsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUN0QixNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO1FBQzFDLE1BQU0sb0JBQW9CLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDO1FBQ3hELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7UUFDMUIsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUM7UUFDaEQsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUM5QixNQUFNLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQztRQUNwRCxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO1FBQ3RDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7UUFDcEMsTUFBTSxtQkFBbUIsR0FBRyxLQUFLLENBQUMsbUJBQW1CLENBQUM7UUFDdEQsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUM7UUFDaEQsTUFBTSx1QkFBdUIsR0FBRyxLQUFLLENBQUMsdUJBQXVCLENBQUM7UUFFOUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLGdCQUFnQixDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JFLElBQUksMkJBQTJCLEdBQUcsS0FBSyxDQUFDO1FBRXhDLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNsQixJQUFJLGFBQWEsR0FBRyxrQkFBa0IsQ0FBQztRQUN2QyxJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxDQUFDLDJDQUEyQztRQUNyRSxJQUFJLG9CQUFvQixHQUFHLENBQUMsQ0FBQyxDQUFDLDZFQUE2RTtRQUUzRyxJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQztRQUV6QixJQUFJLFdBQVcsRUFBRSxDQUFDO1lBQ2pCLEVBQUUsQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNyQyxDQUFDO2FBQU0sQ0FBQztZQUNQLEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUVELEtBQUssSUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFLFNBQVMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLFNBQVMsR0FBRyxTQUFTLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQztZQUV0RixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDOUIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNuQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQzNCLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDekMsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLGdCQUFnQixrQ0FBMEIsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztZQUNsRyxNQUFNLDhCQUE4QixHQUFHLHFCQUFxQixJQUFJLENBQUMsZUFBZSxJQUFJLENBQUMsUUFBUSxLQUFLLE1BQU0sQ0FBQSxtQkFBbUIsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDekosTUFBTSw0QkFBNEIsR0FBRyxDQUFDLFNBQVMsS0FBSyxZQUFZLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7WUFDMUYsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO1lBRXJCLEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDMUIsSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDckIsRUFBRSxDQUFDLFlBQVksQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1lBQ2xELENBQUM7WUFDRCxFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNCLEVBQUUsQ0FBQyxZQUFZLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEUsRUFBRSxDQUFDLG1CQUFtQiwrQkFBc0IsQ0FBQztZQUU3QyxJQUFJLHFCQUFxQixFQUFFLENBQUM7Z0JBRTNCLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztnQkFDbEIsQ0FBQztvQkFDQSxJQUFJLFVBQVUsR0FBRyxTQUFTLENBQUM7b0JBQzNCLElBQUksY0FBYyxHQUFHLGFBQWEsQ0FBQztvQkFFbkMsT0FBTyxVQUFVLEdBQUcsWUFBWSxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUM7d0JBQ2hELE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQ3BELE1BQU0sU0FBUyxHQUFHLENBQUMsUUFBUSx5QkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUMvRixTQUFTLElBQUksU0FBUyxDQUFDO3dCQUN2QixJQUFJLFVBQVUsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDOzRCQUNwQyxjQUFjLElBQUksU0FBUyxDQUFDO3dCQUM3QixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxJQUFJLDhCQUE4QixFQUFFLENBQUM7b0JBQ3BDLEVBQUUsQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztvQkFDbEMsRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ2hELEVBQUUsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3hCLENBQUM7Z0JBQ0QsRUFBRSxDQUFDLG1CQUFtQiwrQkFBc0IsQ0FBQztnQkFFN0MsT0FBTyxTQUFTLEdBQUcsWUFBWSxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUM7b0JBQzlDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxFQUFFLFNBQVMsR0FBRyxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO29CQUNwSCxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7b0JBQ3JCLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBRW5ELElBQUksa0JBQTBCLENBQUM7b0JBQy9CLElBQUksU0FBaUIsQ0FBQztvQkFFdEIsSUFBSSxRQUFRLHlCQUFpQixFQUFFLENBQUM7d0JBQy9CLGtCQUFrQixHQUFHLENBQUMsT0FBTyxHQUFHLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUMvRCxTQUFTLEdBQUcsa0JBQWtCLENBQUM7d0JBRS9CLElBQUksQ0FBQyw4QkFBOEIsSUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUM7NEJBQ3RELEVBQUUsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxtQkFBbUI7d0JBQy9DLENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxFQUFFLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsNkJBQTZCO3dCQUN6RCxDQUFDO3dCQUNELEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssSUFBSSxTQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQzs0QkFDakQsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVM7d0JBQ25DLENBQUM7b0JBRUYsQ0FBQzt5QkFBTSxDQUFDLENBQUMseUJBQXlCO3dCQUNqQyxrQkFBa0IsR0FBRyxDQUFDLENBQUM7d0JBQ3ZCLFNBQVMsR0FBRyxDQUFDLENBQUM7d0JBRWQsRUFBRSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsd0NBQXdDO3dCQUNoRixFQUFFLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsd0JBQXdCO29CQUNwRCxDQUFDO29CQUVELGdCQUFnQixJQUFJLGtCQUFrQixDQUFDO29CQUN2QyxvQkFBb0IsSUFBSSxTQUFTLENBQUM7b0JBQ2xDLElBQUksU0FBUyxJQUFJLGdCQUFnQixFQUFFLENBQUM7d0JBQ25DLGFBQWEsSUFBSSxTQUFTLENBQUM7b0JBQzVCLENBQUM7Z0JBQ0YsQ0FBQztZQUVGLENBQUM7aUJBQU0sQ0FBQztnQkFFUCxFQUFFLENBQUMsbUJBQW1CLCtCQUFzQixDQUFDO2dCQUU3QyxPQUFPLFNBQVMsR0FBRyxZQUFZLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQztvQkFDOUMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLFNBQVMsR0FBRyxDQUFDLEVBQUUsU0FBUyxHQUFHLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixDQUFDLENBQUM7b0JBQ3BILGdCQUFnQixHQUFHLENBQUMsQ0FBQztvQkFDckIsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFFbkQsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLENBQUM7b0JBQzNCLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztvQkFFbEIsUUFBUSxRQUFRLEVBQUUsQ0FBQzt3QkFDbEI7NEJBQ0Msa0JBQWtCLEdBQUcsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQzs0QkFDM0QsU0FBUyxHQUFHLGtCQUFrQixDQUFDOzRCQUMvQixLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLElBQUksa0JBQWtCLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQztnQ0FDMUQsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVM7NEJBQ25DLENBQUM7NEJBQ0QsTUFBTTt3QkFFUDs0QkFDQyxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUzs0QkFDbEMsTUFBTTt3QkFFUDs0QkFDQyxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDOzRCQUN4QixNQUFNO3dCQUVQOzRCQUNDLEVBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7NEJBQ3hCLE1BQU07d0JBRVA7NEJBQ0MsRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQzs0QkFDekIsTUFBTTt3QkFFUDs0QkFDQyxJQUFJLHVCQUF1QixFQUFFLENBQUM7Z0NBQzdCLDREQUE0RDtnQ0FDNUQsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDekIsQ0FBQztpQ0FBTSxDQUFDO2dDQUNQLEVBQUUsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7NEJBQzFCLENBQUM7NEJBQ0QsTUFBTTt3QkFFUCxtQ0FBdUI7d0JBQ3ZCLHdDQUE2Qjt3QkFDN0IsNkNBQWtDO3dCQUNsQzs0QkFDQyxFQUFFLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDOzRCQUMxQixNQUFNO3dCQUVQOzRCQUNDLElBQUksT0FBTyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0NBQzVDLFNBQVMsRUFBRSxDQUFDOzRCQUNiLENBQUM7NEJBQ0QsNERBQTREOzRCQUM1RCxJQUFJLHVCQUF1QixJQUFJLFFBQVEsR0FBRyxFQUFFLEVBQUUsQ0FBQztnQ0FDOUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLENBQUM7NEJBQ3BDLENBQUM7aUNBQU0sSUFBSSx1QkFBdUIsSUFBSSxRQUFRLEtBQUssR0FBRyxFQUFFLENBQUM7Z0NBQ3hELE1BQU07Z0NBQ04sRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDekIsQ0FBQztpQ0FBTSxJQUFJLHVCQUF1QixJQUFJLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0NBQ3BFLEVBQUUsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7Z0NBQ3ZCLEVBQUUsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0NBQ3RDLEVBQUUsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0NBQ3JCLGtCQUFrQixHQUFHLENBQUMsQ0FBQztnQ0FDdkIsU0FBUyxHQUFHLGtCQUFrQixDQUFDOzRCQUNoQyxDQUFDO2lDQUFNLENBQUM7Z0NBQ1AsRUFBRSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQzs0QkFDN0IsQ0FBQztvQkFDSCxDQUFDO29CQUVELGdCQUFnQixJQUFJLGtCQUFrQixDQUFDO29CQUN2QyxvQkFBb0IsSUFBSSxTQUFTLENBQUM7b0JBQ2xDLElBQUksU0FBUyxJQUFJLGdCQUFnQixFQUFFLENBQUM7d0JBQ25DLGFBQWEsSUFBSSxTQUFTLENBQUM7b0JBQzVCLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLDRCQUE0QixFQUFFLENBQUM7Z0JBQ2xDLGdCQUFnQixFQUFFLENBQUM7WUFDcEIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLGdCQUFnQixHQUFHLENBQUMsQ0FBQztZQUN0QixDQUFDO1lBRUQsSUFBSSxTQUFTLElBQUksR0FBRyxJQUFJLENBQUMsMkJBQTJCLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUM7Z0JBQzlFLDJCQUEyQixHQUFHLElBQUksQ0FBQztnQkFDbkMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLFNBQVMsR0FBRyxDQUFDLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFDbEcsQ0FBQztZQUVELEVBQUUsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFNUIsQ0FBQztRQUVELElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1lBQ2xDLHlFQUF5RTtZQUN6RSw4RUFBOEU7WUFDOUUsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUNuRyxDQUFDO1FBRUQsSUFBSSxhQUFhLEVBQUUsQ0FBQztZQUNuQixFQUFFLENBQUMsWUFBWSxDQUFDLDRCQUE0QixDQUFDLENBQUM7WUFDOUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxpQkFBaUIsRUFBRSwwQkFBMEIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvRyxFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFFRCxFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRTNCLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztJQUNyRixDQUFDO0lBRUQsU0FBUyxVQUFVLENBQUMsQ0FBUztRQUM1QixPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQsU0FBUywwQkFBMEIsQ0FBQyxDQUFTO1FBQzVDLElBQUksQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDO1lBQ2QsT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBQ0QsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLElBQUksRUFBRSxDQUFDO1lBQ3JCLE9BQU8sR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUN0QyxDQUFDO1FBQ0QsT0FBTyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUM3QyxDQUFDIn0=