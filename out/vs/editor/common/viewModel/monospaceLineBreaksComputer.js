/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/characterClassifier", "vs/editor/common/textModelEvents", "vs/editor/common/modelLineProjectionData"], function (require, exports, strings, characterClassifier_1, textModelEvents_1, modelLineProjectionData_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MonospaceLineBreaksComputerFactory = void 0;
    class MonospaceLineBreaksComputerFactory {
        static create(options) {
            return new MonospaceLineBreaksComputerFactory(options.get(134 /* EditorOption.wordWrapBreakBeforeCharacters */), options.get(133 /* EditorOption.wordWrapBreakAfterCharacters */));
        }
        constructor(breakBeforeChars, breakAfterChars) {
            this.classifier = new WrappingCharacterClassifier(breakBeforeChars, breakAfterChars);
        }
        createLineBreaksComputer(fontInfo, tabSize, wrappingColumn, wrappingIndent, wordBreak) {
            const requests = [];
            const injectedTexts = [];
            const previousBreakingData = [];
            return {
                addRequest: (lineText, injectedText, previousLineBreakData) => {
                    requests.push(lineText);
                    injectedTexts.push(injectedText);
                    previousBreakingData.push(previousLineBreakData);
                },
                finalize: () => {
                    const columnsForFullWidthChar = fontInfo.typicalFullwidthCharacterWidth / fontInfo.typicalHalfwidthCharacterWidth;
                    const result = [];
                    for (let i = 0, len = requests.length; i < len; i++) {
                        const injectedText = injectedTexts[i];
                        const previousLineBreakData = previousBreakingData[i];
                        if (previousLineBreakData && !previousLineBreakData.injectionOptions && !injectedText) {
                            result[i] = createLineBreaksFromPreviousLineBreaks(this.classifier, previousLineBreakData, requests[i], tabSize, wrappingColumn, columnsForFullWidthChar, wrappingIndent, wordBreak);
                        }
                        else {
                            result[i] = createLineBreaks(this.classifier, requests[i], injectedText, tabSize, wrappingColumn, columnsForFullWidthChar, wrappingIndent, wordBreak);
                        }
                    }
                    arrPool1.length = 0;
                    arrPool2.length = 0;
                    return result;
                }
            };
        }
    }
    exports.MonospaceLineBreaksComputerFactory = MonospaceLineBreaksComputerFactory;
    var CharacterClass;
    (function (CharacterClass) {
        CharacterClass[CharacterClass["NONE"] = 0] = "NONE";
        CharacterClass[CharacterClass["BREAK_BEFORE"] = 1] = "BREAK_BEFORE";
        CharacterClass[CharacterClass["BREAK_AFTER"] = 2] = "BREAK_AFTER";
        CharacterClass[CharacterClass["BREAK_IDEOGRAPHIC"] = 3] = "BREAK_IDEOGRAPHIC"; // for Han and Kana.
    })(CharacterClass || (CharacterClass = {}));
    class WrappingCharacterClassifier extends characterClassifier_1.CharacterClassifier {
        constructor(BREAK_BEFORE, BREAK_AFTER) {
            super(0 /* CharacterClass.NONE */);
            for (let i = 0; i < BREAK_BEFORE.length; i++) {
                this.set(BREAK_BEFORE.charCodeAt(i), 1 /* CharacterClass.BREAK_BEFORE */);
            }
            for (let i = 0; i < BREAK_AFTER.length; i++) {
                this.set(BREAK_AFTER.charCodeAt(i), 2 /* CharacterClass.BREAK_AFTER */);
            }
        }
        get(charCode) {
            if (charCode >= 0 && charCode < 256) {
                return this._asciiMap[charCode];
            }
            else {
                // Initialize CharacterClass.BREAK_IDEOGRAPHIC for these Unicode ranges:
                // 1. CJK Unified Ideographs (0x4E00 -- 0x9FFF)
                // 2. CJK Unified Ideographs Extension A (0x3400 -- 0x4DBF)
                // 3. Hiragana and Katakana (0x3040 -- 0x30FF)
                if ((charCode >= 0x3040 && charCode <= 0x30FF)
                    || (charCode >= 0x3400 && charCode <= 0x4DBF)
                    || (charCode >= 0x4E00 && charCode <= 0x9FFF)) {
                    return 3 /* CharacterClass.BREAK_IDEOGRAPHIC */;
                }
                return (this._map.get(charCode) || this._defaultValue);
            }
        }
    }
    let arrPool1 = [];
    let arrPool2 = [];
    function createLineBreaksFromPreviousLineBreaks(classifier, previousBreakingData, lineText, tabSize, firstLineBreakColumn, columnsForFullWidthChar, wrappingIndent, wordBreak) {
        if (firstLineBreakColumn === -1) {
            return null;
        }
        const len = lineText.length;
        if (len <= 1) {
            return null;
        }
        const isKeepAll = (wordBreak === 'keepAll');
        const prevBreakingOffsets = previousBreakingData.breakOffsets;
        const prevBreakingOffsetsVisibleColumn = previousBreakingData.breakOffsetsVisibleColumn;
        const wrappedTextIndentLength = computeWrappedTextIndentLength(lineText, tabSize, firstLineBreakColumn, columnsForFullWidthChar, wrappingIndent);
        const wrappedLineBreakColumn = firstLineBreakColumn - wrappedTextIndentLength;
        const breakingOffsets = arrPool1;
        const breakingOffsetsVisibleColumn = arrPool2;
        let breakingOffsetsCount = 0;
        let lastBreakingOffset = 0;
        let lastBreakingOffsetVisibleColumn = 0;
        let breakingColumn = firstLineBreakColumn;
        const prevLen = prevBreakingOffsets.length;
        let prevIndex = 0;
        if (prevIndex >= 0) {
            let bestDistance = Math.abs(prevBreakingOffsetsVisibleColumn[prevIndex] - breakingColumn);
            while (prevIndex + 1 < prevLen) {
                const distance = Math.abs(prevBreakingOffsetsVisibleColumn[prevIndex + 1] - breakingColumn);
                if (distance >= bestDistance) {
                    break;
                }
                bestDistance = distance;
                prevIndex++;
            }
        }
        while (prevIndex < prevLen) {
            // Allow for prevIndex to be -1 (for the case where we hit a tab when walking backwards from the first break)
            let prevBreakOffset = prevIndex < 0 ? 0 : prevBreakingOffsets[prevIndex];
            let prevBreakOffsetVisibleColumn = prevIndex < 0 ? 0 : prevBreakingOffsetsVisibleColumn[prevIndex];
            if (lastBreakingOffset > prevBreakOffset) {
                prevBreakOffset = lastBreakingOffset;
                prevBreakOffsetVisibleColumn = lastBreakingOffsetVisibleColumn;
            }
            let breakOffset = 0;
            let breakOffsetVisibleColumn = 0;
            let forcedBreakOffset = 0;
            let forcedBreakOffsetVisibleColumn = 0;
            // initially, we search as much as possible to the right (if it fits)
            if (prevBreakOffsetVisibleColumn <= breakingColumn) {
                let visibleColumn = prevBreakOffsetVisibleColumn;
                let prevCharCode = prevBreakOffset === 0 ? 0 /* CharCode.Null */ : lineText.charCodeAt(prevBreakOffset - 1);
                let prevCharCodeClass = prevBreakOffset === 0 ? 0 /* CharacterClass.NONE */ : classifier.get(prevCharCode);
                let entireLineFits = true;
                for (let i = prevBreakOffset; i < len; i++) {
                    const charStartOffset = i;
                    const charCode = lineText.charCodeAt(i);
                    let charCodeClass;
                    let charWidth;
                    if (strings.isHighSurrogate(charCode)) {
                        // A surrogate pair must always be considered as a single unit, so it is never to be broken
                        i++;
                        charCodeClass = 0 /* CharacterClass.NONE */;
                        charWidth = 2;
                    }
                    else {
                        charCodeClass = classifier.get(charCode);
                        charWidth = computeCharWidth(charCode, visibleColumn, tabSize, columnsForFullWidthChar);
                    }
                    if (charStartOffset > lastBreakingOffset && canBreak(prevCharCode, prevCharCodeClass, charCode, charCodeClass, isKeepAll)) {
                        breakOffset = charStartOffset;
                        breakOffsetVisibleColumn = visibleColumn;
                    }
                    visibleColumn += charWidth;
                    // check if adding character at `i` will go over the breaking column
                    if (visibleColumn > breakingColumn) {
                        // We need to break at least before character at `i`:
                        if (charStartOffset > lastBreakingOffset) {
                            forcedBreakOffset = charStartOffset;
                            forcedBreakOffsetVisibleColumn = visibleColumn - charWidth;
                        }
                        else {
                            // we need to advance at least by one character
                            forcedBreakOffset = i + 1;
                            forcedBreakOffsetVisibleColumn = visibleColumn;
                        }
                        if (visibleColumn - breakOffsetVisibleColumn > wrappedLineBreakColumn) {
                            // Cannot break at `breakOffset` => reset it if it was set
                            breakOffset = 0;
                        }
                        entireLineFits = false;
                        break;
                    }
                    prevCharCode = charCode;
                    prevCharCodeClass = charCodeClass;
                }
                if (entireLineFits) {
                    // there is no more need to break => stop the outer loop!
                    if (breakingOffsetsCount > 0) {
                        // Add last segment, no need to assign to `lastBreakingOffset` and `lastBreakingOffsetVisibleColumn`
                        breakingOffsets[breakingOffsetsCount] = prevBreakingOffsets[prevBreakingOffsets.length - 1];
                        breakingOffsetsVisibleColumn[breakingOffsetsCount] = prevBreakingOffsetsVisibleColumn[prevBreakingOffsets.length - 1];
                        breakingOffsetsCount++;
                    }
                    break;
                }
            }
            if (breakOffset === 0) {
                // must search left
                let visibleColumn = prevBreakOffsetVisibleColumn;
                let charCode = lineText.charCodeAt(prevBreakOffset);
                let charCodeClass = classifier.get(charCode);
                let hitATabCharacter = false;
                for (let i = prevBreakOffset - 1; i >= lastBreakingOffset; i--) {
                    const charStartOffset = i + 1;
                    const prevCharCode = lineText.charCodeAt(i);
                    if (prevCharCode === 9 /* CharCode.Tab */) {
                        // cannot determine the width of a tab when going backwards, so we must go forwards
                        hitATabCharacter = true;
                        break;
                    }
                    let prevCharCodeClass;
                    let prevCharWidth;
                    if (strings.isLowSurrogate(prevCharCode)) {
                        // A surrogate pair must always be considered as a single unit, so it is never to be broken
                        i--;
                        prevCharCodeClass = 0 /* CharacterClass.NONE */;
                        prevCharWidth = 2;
                    }
                    else {
                        prevCharCodeClass = classifier.get(prevCharCode);
                        prevCharWidth = (strings.isFullWidthCharacter(prevCharCode) ? columnsForFullWidthChar : 1);
                    }
                    if (visibleColumn <= breakingColumn) {
                        if (forcedBreakOffset === 0) {
                            forcedBreakOffset = charStartOffset;
                            forcedBreakOffsetVisibleColumn = visibleColumn;
                        }
                        if (visibleColumn <= breakingColumn - wrappedLineBreakColumn) {
                            // went too far!
                            break;
                        }
                        if (canBreak(prevCharCode, prevCharCodeClass, charCode, charCodeClass, isKeepAll)) {
                            breakOffset = charStartOffset;
                            breakOffsetVisibleColumn = visibleColumn;
                            break;
                        }
                    }
                    visibleColumn -= prevCharWidth;
                    charCode = prevCharCode;
                    charCodeClass = prevCharCodeClass;
                }
                if (breakOffset !== 0) {
                    const remainingWidthOfNextLine = wrappedLineBreakColumn - (forcedBreakOffsetVisibleColumn - breakOffsetVisibleColumn);
                    if (remainingWidthOfNextLine <= tabSize) {
                        const charCodeAtForcedBreakOffset = lineText.charCodeAt(forcedBreakOffset);
                        let charWidth;
                        if (strings.isHighSurrogate(charCodeAtForcedBreakOffset)) {
                            // A surrogate pair must always be considered as a single unit, so it is never to be broken
                            charWidth = 2;
                        }
                        else {
                            charWidth = computeCharWidth(charCodeAtForcedBreakOffset, forcedBreakOffsetVisibleColumn, tabSize, columnsForFullWidthChar);
                        }
                        if (remainingWidthOfNextLine - charWidth < 0) {
                            // it is not worth it to break at breakOffset, it just introduces an extra needless line!
                            breakOffset = 0;
                        }
                    }
                }
                if (hitATabCharacter) {
                    // cannot determine the width of a tab when going backwards, so we must go forwards from the previous break
                    prevIndex--;
                    continue;
                }
            }
            if (breakOffset === 0) {
                // Could not find a good breaking point
                breakOffset = forcedBreakOffset;
                breakOffsetVisibleColumn = forcedBreakOffsetVisibleColumn;
            }
            if (breakOffset <= lastBreakingOffset) {
                // Make sure that we are advancing (at least one character)
                const charCode = lineText.charCodeAt(lastBreakingOffset);
                if (strings.isHighSurrogate(charCode)) {
                    // A surrogate pair must always be considered as a single unit, so it is never to be broken
                    breakOffset = lastBreakingOffset + 2;
                    breakOffsetVisibleColumn = lastBreakingOffsetVisibleColumn + 2;
                }
                else {
                    breakOffset = lastBreakingOffset + 1;
                    breakOffsetVisibleColumn = lastBreakingOffsetVisibleColumn + computeCharWidth(charCode, lastBreakingOffsetVisibleColumn, tabSize, columnsForFullWidthChar);
                }
            }
            lastBreakingOffset = breakOffset;
            breakingOffsets[breakingOffsetsCount] = breakOffset;
            lastBreakingOffsetVisibleColumn = breakOffsetVisibleColumn;
            breakingOffsetsVisibleColumn[breakingOffsetsCount] = breakOffsetVisibleColumn;
            breakingOffsetsCount++;
            breakingColumn = breakOffsetVisibleColumn + wrappedLineBreakColumn;
            while (prevIndex < 0 || (prevIndex < prevLen && prevBreakingOffsetsVisibleColumn[prevIndex] < breakOffsetVisibleColumn)) {
                prevIndex++;
            }
            let bestDistance = Math.abs(prevBreakingOffsetsVisibleColumn[prevIndex] - breakingColumn);
            while (prevIndex + 1 < prevLen) {
                const distance = Math.abs(prevBreakingOffsetsVisibleColumn[prevIndex + 1] - breakingColumn);
                if (distance >= bestDistance) {
                    break;
                }
                bestDistance = distance;
                prevIndex++;
            }
        }
        if (breakingOffsetsCount === 0) {
            return null;
        }
        // Doing here some object reuse which ends up helping a huge deal with GC pauses!
        breakingOffsets.length = breakingOffsetsCount;
        breakingOffsetsVisibleColumn.length = breakingOffsetsCount;
        arrPool1 = previousBreakingData.breakOffsets;
        arrPool2 = previousBreakingData.breakOffsetsVisibleColumn;
        previousBreakingData.breakOffsets = breakingOffsets;
        previousBreakingData.breakOffsetsVisibleColumn = breakingOffsetsVisibleColumn;
        previousBreakingData.wrappedTextIndentLength = wrappedTextIndentLength;
        return previousBreakingData;
    }
    function createLineBreaks(classifier, _lineText, injectedTexts, tabSize, firstLineBreakColumn, columnsForFullWidthChar, wrappingIndent, wordBreak) {
        const lineText = textModelEvents_1.LineInjectedText.applyInjectedText(_lineText, injectedTexts);
        let injectionOptions;
        let injectionOffsets;
        if (injectedTexts && injectedTexts.length > 0) {
            injectionOptions = injectedTexts.map(t => t.options);
            injectionOffsets = injectedTexts.map(text => text.column - 1);
        }
        else {
            injectionOptions = null;
            injectionOffsets = null;
        }
        if (firstLineBreakColumn === -1) {
            if (!injectionOptions) {
                return null;
            }
            // creating a `LineBreakData` with an invalid `breakOffsetsVisibleColumn` is OK
            // because `breakOffsetsVisibleColumn` will never be used because it contains injected text
            return new modelLineProjectionData_1.ModelLineProjectionData(injectionOffsets, injectionOptions, [lineText.length], [], 0);
        }
        const len = lineText.length;
        if (len <= 1) {
            if (!injectionOptions) {
                return null;
            }
            // creating a `LineBreakData` with an invalid `breakOffsetsVisibleColumn` is OK
            // because `breakOffsetsVisibleColumn` will never be used because it contains injected text
            return new modelLineProjectionData_1.ModelLineProjectionData(injectionOffsets, injectionOptions, [lineText.length], [], 0);
        }
        const isKeepAll = (wordBreak === 'keepAll');
        const wrappedTextIndentLength = computeWrappedTextIndentLength(lineText, tabSize, firstLineBreakColumn, columnsForFullWidthChar, wrappingIndent);
        const wrappedLineBreakColumn = firstLineBreakColumn - wrappedTextIndentLength;
        const breakingOffsets = [];
        const breakingOffsetsVisibleColumn = [];
        let breakingOffsetsCount = 0;
        let breakOffset = 0;
        let breakOffsetVisibleColumn = 0;
        let breakingColumn = firstLineBreakColumn;
        let prevCharCode = lineText.charCodeAt(0);
        let prevCharCodeClass = classifier.get(prevCharCode);
        let visibleColumn = computeCharWidth(prevCharCode, 0, tabSize, columnsForFullWidthChar);
        let startOffset = 1;
        if (strings.isHighSurrogate(prevCharCode)) {
            // A surrogate pair must always be considered as a single unit, so it is never to be broken
            visibleColumn += 1;
            prevCharCode = lineText.charCodeAt(1);
            prevCharCodeClass = classifier.get(prevCharCode);
            startOffset++;
        }
        for (let i = startOffset; i < len; i++) {
            const charStartOffset = i;
            const charCode = lineText.charCodeAt(i);
            let charCodeClass;
            let charWidth;
            if (strings.isHighSurrogate(charCode)) {
                // A surrogate pair must always be considered as a single unit, so it is never to be broken
                i++;
                charCodeClass = 0 /* CharacterClass.NONE */;
                charWidth = 2;
            }
            else {
                charCodeClass = classifier.get(charCode);
                charWidth = computeCharWidth(charCode, visibleColumn, tabSize, columnsForFullWidthChar);
            }
            if (canBreak(prevCharCode, prevCharCodeClass, charCode, charCodeClass, isKeepAll)) {
                breakOffset = charStartOffset;
                breakOffsetVisibleColumn = visibleColumn;
            }
            visibleColumn += charWidth;
            // check if adding character at `i` will go over the breaking column
            if (visibleColumn > breakingColumn) {
                // We need to break at least before character at `i`:
                if (breakOffset === 0 || visibleColumn - breakOffsetVisibleColumn > wrappedLineBreakColumn) {
                    // Cannot break at `breakOffset`, must break at `i`
                    breakOffset = charStartOffset;
                    breakOffsetVisibleColumn = visibleColumn - charWidth;
                }
                breakingOffsets[breakingOffsetsCount] = breakOffset;
                breakingOffsetsVisibleColumn[breakingOffsetsCount] = breakOffsetVisibleColumn;
                breakingOffsetsCount++;
                breakingColumn = breakOffsetVisibleColumn + wrappedLineBreakColumn;
                breakOffset = 0;
            }
            prevCharCode = charCode;
            prevCharCodeClass = charCodeClass;
        }
        if (breakingOffsetsCount === 0 && (!injectedTexts || injectedTexts.length === 0)) {
            return null;
        }
        // Add last segment
        breakingOffsets[breakingOffsetsCount] = len;
        breakingOffsetsVisibleColumn[breakingOffsetsCount] = visibleColumn;
        return new modelLineProjectionData_1.ModelLineProjectionData(injectionOffsets, injectionOptions, breakingOffsets, breakingOffsetsVisibleColumn, wrappedTextIndentLength);
    }
    function computeCharWidth(charCode, visibleColumn, tabSize, columnsForFullWidthChar) {
        if (charCode === 9 /* CharCode.Tab */) {
            return (tabSize - (visibleColumn % tabSize));
        }
        if (strings.isFullWidthCharacter(charCode)) {
            return columnsForFullWidthChar;
        }
        if (charCode < 32) {
            // when using `editor.renderControlCharacters`, the substitutions are often wide
            return columnsForFullWidthChar;
        }
        return 1;
    }
    function tabCharacterWidth(visibleColumn, tabSize) {
        return (tabSize - (visibleColumn % tabSize));
    }
    /**
     * Kinsoku Shori : Don't break after a leading character, like an open bracket
     * Kinsoku Shori : Don't break before a trailing character, like a period
     */
    function canBreak(prevCharCode, prevCharCodeClass, charCode, charCodeClass, isKeepAll) {
        return (charCode !== 32 /* CharCode.Space */
            && ((prevCharCodeClass === 2 /* CharacterClass.BREAK_AFTER */ && charCodeClass !== 2 /* CharacterClass.BREAK_AFTER */) // break at the end of multiple BREAK_AFTER
                || (prevCharCodeClass !== 1 /* CharacterClass.BREAK_BEFORE */ && charCodeClass === 1 /* CharacterClass.BREAK_BEFORE */) // break at the start of multiple BREAK_BEFORE
                || (!isKeepAll && prevCharCodeClass === 3 /* CharacterClass.BREAK_IDEOGRAPHIC */ && charCodeClass !== 2 /* CharacterClass.BREAK_AFTER */)
                || (!isKeepAll && charCodeClass === 3 /* CharacterClass.BREAK_IDEOGRAPHIC */ && prevCharCodeClass !== 1 /* CharacterClass.BREAK_BEFORE */)));
    }
    function computeWrappedTextIndentLength(lineText, tabSize, firstLineBreakColumn, columnsForFullWidthChar, wrappingIndent) {
        let wrappedTextIndentLength = 0;
        if (wrappingIndent !== 0 /* WrappingIndent.None */) {
            const firstNonWhitespaceIndex = strings.firstNonWhitespaceIndex(lineText);
            if (firstNonWhitespaceIndex !== -1) {
                // Track existing indent
                for (let i = 0; i < firstNonWhitespaceIndex; i++) {
                    const charWidth = (lineText.charCodeAt(i) === 9 /* CharCode.Tab */ ? tabCharacterWidth(wrappedTextIndentLength, tabSize) : 1);
                    wrappedTextIndentLength += charWidth;
                }
                // Increase indent of continuation lines, if desired
                const numberOfAdditionalTabs = (wrappingIndent === 3 /* WrappingIndent.DeepIndent */ ? 2 : wrappingIndent === 2 /* WrappingIndent.Indent */ ? 1 : 0);
                for (let i = 0; i < numberOfAdditionalTabs; i++) {
                    const charWidth = tabCharacterWidth(wrappedTextIndentLength, tabSize);
                    wrappedTextIndentLength += charWidth;
                }
                // Force sticking to beginning of line if no character would fit except for the indentation
                if (wrappedTextIndentLength + columnsForFullWidthChar > firstLineBreakColumn) {
                    wrappedTextIndentLength = 0;
                }
            }
        }
        return wrappedTextIndentLength;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ub3NwYWNlTGluZUJyZWFrc0NvbXB1dGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3ZpZXdNb2RlbC9tb25vc3BhY2VMaW5lQnJlYWtzQ29tcHV0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLE1BQWEsa0NBQWtDO1FBQ3ZDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBK0I7WUFDbkQsT0FBTyxJQUFJLGtDQUFrQyxDQUM1QyxPQUFPLENBQUMsR0FBRyxzREFBNEMsRUFDdkQsT0FBTyxDQUFDLEdBQUcscURBQTJDLENBQ3RELENBQUM7UUFDSCxDQUFDO1FBSUQsWUFBWSxnQkFBd0IsRUFBRSxlQUF1QjtZQUM1RCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksMkJBQTJCLENBQUMsZ0JBQWdCLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDdEYsQ0FBQztRQUVNLHdCQUF3QixDQUFDLFFBQWtCLEVBQUUsT0FBZSxFQUFFLGNBQXNCLEVBQUUsY0FBOEIsRUFBRSxTQUErQjtZQUMzSixNQUFNLFFBQVEsR0FBYSxFQUFFLENBQUM7WUFDOUIsTUFBTSxhQUFhLEdBQWtDLEVBQUUsQ0FBQztZQUN4RCxNQUFNLG9CQUFvQixHQUF1QyxFQUFFLENBQUM7WUFDcEUsT0FBTztnQkFDTixVQUFVLEVBQUUsQ0FBQyxRQUFnQixFQUFFLFlBQXVDLEVBQUUscUJBQXFELEVBQUUsRUFBRTtvQkFDaEksUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDeEIsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDakMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7Z0JBQ2xELENBQUM7Z0JBQ0QsUUFBUSxFQUFFLEdBQUcsRUFBRTtv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