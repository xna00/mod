/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/trustedTypes", "vs/base/common/strings", "vs/base/common/types", "vs/editor/browser/config/domFontInfo", "vs/editor/common/core/stringBuilder", "vs/editor/common/modelLineProjectionData", "vs/editor/common/textModelEvents"], function (require, exports, trustedTypes_1, strings, types_1, domFontInfo_1, stringBuilder_1, modelLineProjectionData_1, textModelEvents_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DOMLineBreaksComputerFactory = void 0;
    const ttPolicy = (0, trustedTypes_1.createTrustedTypesPolicy)('domLineBreaksComputer', { createHTML: value => value });
    class DOMLineBreaksComputerFactory {
        static create(targetWindow) {
            return new DOMLineBreaksComputerFactory(new WeakRef(targetWindow));
        }
        constructor(targetWindow) {
            this.targetWindow = targetWindow;
        }
        createLineBreaksComputer(fontInfo, tabSize, wrappingColumn, wrappingIndent, wordBreak) {
            const requests = [];
            const injectedTexts = [];
            return {
                addRequest: (lineText, injectedText, previousLineBreakData) => {
                    requests.push(lineText);
                    injectedTexts.push(injectedText);
                },
                finalize: () => {
                    return createLineBreaks((0, types_1.assertIsDefined)(this.targetWindow.deref()), requests, fontInfo, tabSize, wrappingColumn, wrappingIndent, wordBreak, injectedTexts);
                }
            };
        }
    }
    exports.DOMLineBreaksComputerFactory = DOMLineBreaksComputerFactory;
    function createLineBreaks(targetWindow, requests, fontInfo, tabSize, firstLineBreakColumn, wrappingIndent, wordBreak, injectedTextsPerLine) {
        function createEmptyLineBreakWithPossiblyInjectedText(requestIdx) {
            const injectedTexts = injectedTextsPerLine[requestIdx];
            if (injectedTexts) {
                const lineText = textModelEvents_1.LineInjectedText.applyInjectedText(requests[requestIdx], injectedTexts);
                const injectionOptions = injectedTexts.map(t => t.options);
                const injectionOffsets = injectedTexts.map(text => text.column - 1);
                // creating a `LineBreakData` with an invalid `breakOffsetsVisibleColumn` is OK
                // because `breakOffsetsVisibleColumn` will never be used because it contains injected text
                return new modelLineProjectionData_1.ModelLineProjectionData(injectionOffsets, injectionOptions, [lineText.length], [], 0);
            }
            else {
                return null;
            }
        }
        if (firstLineBreakColumn === -1) {
            const result = [];
            for (let i = 0, len = requests.length; i < len; i++) {
                result[i] = createEmptyLineBreakWithPossiblyInjectedText(i);
            }
            return result;
        }
        const overallWidth = Math.round(firstLineBreakColumn * fontInfo.typicalHalfwidthCharacterWidth);
        const additionalIndent = (wrappingIndent === 3 /* WrappingIndent.DeepIndent */ ? 2 : wrappingIndent === 2 /* WrappingIndent.Indent */ ? 1 : 0);
        const additionalIndentSize = Math.round(tabSize * additionalIndent);
        const additionalIndentLength = Math.ceil(fontInfo.spaceWidth * additionalIndentSize);
        const containerDomNode = document.createElement('div');
        (0, domFontInfo_1.applyFontInfo)(containerDomNode, fontInfo);
        const sb = new stringBuilder_1.StringBuilder(10000);
        const firstNonWhitespaceIndices = [];
        const wrappedTextIndentLengths = [];
        const renderLineContents = [];
        const allCharOffsets = [];
        const allVisibleColumns = [];
        for (let i = 0; i < requests.length; i++) {
            const lineContent = textModelEvents_1.LineInjectedText.applyInjectedText(requests[i], injectedTextsPerLine[i]);
            let firstNonWhitespaceIndex = 0;
            let wrappedTextIndentLength = 0;
            let width = overallWidth;
            if (wrappingIndent !== 0 /* WrappingIndent.None */) {
                firstNonWhitespaceIndex = strings.firstNonWhitespaceIndex(lineContent);
                if (firstNonWhitespaceIndex === -1) {
                    // all whitespace line
                    firstNonWhitespaceIndex = 0;
                }
                else {
                    // Track existing indent
                    for (let i = 0; i < firstNonWhitespaceIndex; i++) {
                        const charWidth = (lineContent.charCodeAt(i) === 9 /* CharCode.Tab */
                            ? (tabSize - (wrappedTextIndentLength % tabSize))
                            : 1);
                        wrappedTextIndentLength += charWidth;
                    }
                    const indentWidth = Math.ceil(fontInfo.spaceWidth * wrappedTextIndentLength);
                    // Force sticking to beginning of line if no character would fit except for the indentation
                    if (indentWidth + fontInfo.typicalFullwidthCharacterWidth > overallWidth) {
                        firstNonWhitespaceIndex = 0;
                        wrappedTextIndentLength = 0;
                    }
                    else {
                        width = overallWidth - indentWidth;
                    }
                }
            }
            const renderLineContent = lineContent.substr(firstNonWhitespaceIndex);
            const tmp = renderLine(renderLineContent, wrappedTextIndentLength, tabSize, width, sb, additionalIndentLength);
            firstNonWhitespaceIndices[i] = firstNonWhitespaceIndex;
            wrappedTextIndentLengths[i] = wrappedTextIndentLength;
            renderLineContents[i] = renderLineContent;
            allCharOffsets[i] = tmp[0];
            allVisibleColumns[i] = tmp[1];
        }
        const html = sb.build();
        const trustedhtml = ttPolicy?.createHTML(html) ?? html;
        containerDomNode.innerHTML = trustedhtml;
        containerDomNode.style.position = 'absolute';
        containerDomNode.style.top = '10000';
        if (wordBreak === 'keepAll') {
            // word-break: keep-all; overflow-wrap: anywhere
            containerDomNode.style.wordBreak = 'keep-all';
            containerDomNode.style.overflowWrap = 'anywhere';
        }
        else {
            // overflow-wrap: break-word
            containerDomNode.style.wordBreak = 'inherit';
            containerDomNode.style.overflowWrap = 'break-word';
        }
        targetWindow.document.body.appendChild(containerDomNode);
        const range = document.createRange();
        const lineDomNodes = Array.prototype.slice.call(containerDomNode.children, 0);
        const result = [];
        for (let i = 0; i < requests.length; i++) {
            const lineDomNode = lineDomNodes[i];
            const breakOffsets = readLineBreaks(range, lineDomNode, renderLineContents[i], allCharOffsets[i]);
            if (breakOffsets === null) {
                result[i] = createEmptyLineBreakWithPossiblyInjectedText(i);
                continue;
            }
            const firstNonWhitespaceIndex = firstNonWhitespaceIndices[i];
            const wrappedTextIndentLength = wrappedTextIndentLengths[i] + additionalIndentSize;
            const visibleColumns = allVisibleColumns[i];
            const breakOffsetsVisibleColumn = [];
            for (let j = 0, len = breakOffsets.length; j < len; j++) {
                breakOffsetsVisibleColumn[j] = visibleColumns[breakOffsets[j]];
            }
            if (firstNonWhitespaceIndex !== 0) {
                // All break offsets are relative to the renderLineContent, make them absolute again
                for (let j = 0, len = breakOffsets.length; j < len; j++) {
                    breakOffsets[j] += firstNonWhitespaceIndex;
                }
            }
            let injectionOptions;
            let injectionOffsets;
            const curInjectedTexts = injectedTextsPerLine[i];
            if (curInjectedTexts) {
                injectionOptions = curInjectedTexts.map(t => t.options);
                injectionOffsets = curInjectedTexts.map(text => text.column - 1);
            }
            else {
                injectionOptions = null;
                injectionOffsets = null;
            }
            result[i] = new modelLineProjectionData_1.ModelLineProjectionData(injectionOffsets, injectionOptions, breakOffsets, breakOffsetsVisibleColumn, wrappedTextIndentLength);
        }
        targetWindow.document.body.removeChild(containerDomNode);
        return result;
    }
    var Constants;
    (function (Constants) {
        Constants[Constants["SPAN_MODULO_LIMIT"] = 16384] = "SPAN_MODULO_LIMIT";
    })(Constants || (Constants = {}));
    function renderLine(lineContent, initialVisibleColumn, tabSize, width, sb, wrappingIndentLength) {
        if (wrappingIndentLength !== 0) {
            const hangingOffset = String(wrappingIndentLength);
            sb.appendString('<div style="text-indent: -');
            sb.appendString(hangingOffset);
            sb.appendString('px; padding-left: ');
            sb.appendString(hangingOffset);
            sb.appendString('px; box-sizing: border-box; width:');
        }
        else {
            sb.appendString('<div style="width:');
        }
        sb.appendString(String(width));
        sb.appendString('px;">');
        // if (containsRTL) {
        // 	sb.appendASCIIString('" dir="ltr');
        // }
        const len = lineContent.length;
        let visibleColumn = initialVisibleColumn;
        let charOffset = 0;
        const charOffsets = [];
        const visibleColumns = [];
        let nextCharCode = (0 < len ? lineContent.charCodeAt(0) : 0 /* CharCode.Null */);
        sb.appendString('<span>');
        for (let charIndex = 0; charIndex < len; charIndex++) {
            if (charIndex !== 0 && charIndex % 16384 /* Constants.SPAN_MODULO_LIMIT */ === 0) {
                sb.appendString('</span><span>');
            }
            charOffsets[charIndex] = charOffset;
            visibleColumns[charIndex] = visibleColumn;
            const charCode = nextCharCode;
            nextCharCode = (charIndex + 1 < len ? lineContent.charCodeAt(charIndex + 1) : 0 /* CharCode.Null */);
            let producedCharacters = 1;
            let charWidth = 1;
            switch (charCode) {
                case 9 /* CharCode.Tab */:
                    producedCharacters = (tabSize - (visibleColumn % tabSize));
                    charWidth = producedCharacters;
                    for (let space = 1; space <= producedCharacters; space++) {
                        if (space < producedCharacters) {
                            sb.appendCharCode(0xA0); // &nbsp;
                        }
                        else {
                            sb.appendASCIICharCode(32 /* CharCode.Space */);
                        }
                    }
                    break;
                case 32 /* CharCode.Space */:
                    if (nextCharCode === 32 /* CharCode.Space */) {
                        sb.appendCharCode(0xA0); // &nbsp;
                    }
                    else {
                        sb.appendASCIICharCode(32 /* CharCode.Space */);
                    }
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
                    sb.appendString('&#00;');
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
                    if (charCode < 32) {
                        sb.appendCharCode(9216 + charCode);
                    }
                    else {
                        sb.appendCharCode(charCode);
                    }
            }
            charOffset += producedCharacters;
            visibleColumn += charWidth;
        }
        sb.appendString('</span>');
        charOffsets[lineContent.length] = charOffset;
        visibleColumns[lineContent.length] = visibleColumn;
        sb.appendString('</div>');
        return [charOffsets, visibleColumns];
    }
    function readLineBreaks(range, lineDomNode, lineContent, charOffsets) {
        if (lineContent.length <= 1) {
            return null;
        }
        const spans = Array.prototype.slice.call(lineDomNode.children, 0);
        const breakOffsets = [];
        try {
            discoverBreaks(range, spans, charOffsets, 0, null, lineContent.length - 1, null, breakOffsets);
        }
        catch (err) {
            console.log(err);
            return null;
        }
        if (breakOffsets.length === 0) {
            return null;
        }
        breakOffsets.push(lineContent.length);
        return breakOffsets;
    }
    function discoverBreaks(range, spans, charOffsets, low, lowRects, high, highRects, result) {
        if (low === high) {
            return;
        }
        lowRects = lowRects || readClientRect(range, spans, charOffsets[low], charOffsets[low + 1]);
        highRects = highRects || readClientRect(range, spans, charOffsets[high], charOffsets[high + 1]);
        if (Math.abs(lowRects[0].top - highRects[0].top) <= 0.1) {
            // same line
            return;
        }
        // there is at least one line break between these two offsets
        if (low + 1 === high) {
            // the two characters are adjacent, so the line break must be exactly between them
            result.push(high);
            return;
        }
        const mid = low + ((high - low) / 2) | 0;
        const midRects = readClientRect(range, spans, charOffsets[mid], charOffsets[mid + 1]);
        discoverBreaks(range, spans, charOffsets, low, lowRects, mid, midRects, result);
        discoverBreaks(range, spans, charOffsets, mid, midRects, high, highRects, result);
    }
    function readClientRect(range, spans, startOffset, endOffset) {
        range.setStart(spans[(startOffset / 16384 /* Constants.SPAN_MODULO_LIMIT */) | 0].firstChild, startOffset % 16384 /* Constants.SPAN_MODULO_LIMIT */);
        range.setEnd(spans[(endOffset / 16384 /* Constants.SPAN_MODULO_LIMIT */) | 0].firstChild, endOffset % 16384 /* Constants.SPAN_MODULO_LIMIT */);
        return range.getClientRects();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tTGluZUJyZWFrc0NvbXB1dGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3L2RvbUxpbmVCcmVha3NDb21wdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBTSxRQUFRLEdBQUcsSUFBQSx1Q0FBd0IsRUFBQyx1QkFBdUIsRUFBRSxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFFbkcsTUFBYSw0QkFBNEI7UUFFakMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFvQjtZQUN4QyxPQUFPLElBQUksNEJBQTRCLENBQUMsSUFBSSxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUNwRSxDQUFDO1FBRUQsWUFBb0IsWUFBNkI7WUFBN0IsaUJBQVksR0FBWixZQUFZLENBQWlCO1FBQ2pELENBQUM7UUFFTSx3QkFBd0IsQ0FBQyxRQUFrQixFQUFFLE9BQWUsRUFBRSxjQUFzQixFQUFFLGNBQThCLEVBQUUsU0FBK0I7WUFDM0osTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO1lBQzlCLE1BQU0sYUFBYSxHQUFrQyxFQUFFLENBQUM7WUFDeEQsT0FBTztnQkFDTixVQUFVLEVBQUUsQ0FBQyxRQUFnQixFQUFFLFlBQXVDLEVBQUUscUJBQXFELEVBQUUsRUFBRTtvQkFDaEksUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDeEIsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDbEMsQ0FBQztnQkFDRCxRQUFRLEVBQUUsR0FBRyxFQUFFO29CQUNkLE9BQU8sZ0JBQWdCLENBQUMsSUFBQSx1QkFBZSxFQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENB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