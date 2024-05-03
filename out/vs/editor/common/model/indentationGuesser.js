/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.guessIndentation = guessIndentation;
    class SpacesDiffResult {
        constructor() {
            this.spacesDiff = 0;
            this.looksLikeAlignment = false;
        }
    }
    /**
     * Compute the diff in spaces between two line's indentation.
     */
    function spacesDiff(a, aLength, b, bLength, result) {
        result.spacesDiff = 0;
        result.looksLikeAlignment = false;
        // This can go both ways (e.g.):
        //  - a: "\t"
        //  - b: "\t    "
        //  => This should count 1 tab and 4 spaces
        let i;
        for (i = 0; i < aLength && i < bLength; i++) {
            const aCharCode = a.charCodeAt(i);
            const bCharCode = b.charCodeAt(i);
            if (aCharCode !== bCharCode) {
                break;
            }
        }
        let aSpacesCnt = 0, aTabsCount = 0;
        for (let j = i; j < aLength; j++) {
            const aCharCode = a.charCodeAt(j);
            if (aCharCode === 32 /* CharCode.Space */) {
                aSpacesCnt++;
            }
            else {
                aTabsCount++;
            }
        }
        let bSpacesCnt = 0, bTabsCount = 0;
        for (let j = i; j < bLength; j++) {
            const bCharCode = b.charCodeAt(j);
            if (bCharCode === 32 /* CharCode.Space */) {
                bSpacesCnt++;
            }
            else {
                bTabsCount++;
            }
        }
        if (aSpacesCnt > 0 && aTabsCount > 0) {
            return;
        }
        if (bSpacesCnt > 0 && bTabsCount > 0) {
            return;
        }
        const tabsDiff = Math.abs(aTabsCount - bTabsCount);
        const spacesDiff = Math.abs(aSpacesCnt - bSpacesCnt);
        if (tabsDiff === 0) {
            // check if the indentation difference might be caused by alignment reasons
            // sometime folks like to align their code, but this should not be used as a hint
            result.spacesDiff = spacesDiff;
            if (spacesDiff > 0 && 0 <= bSpacesCnt - 1 && bSpacesCnt - 1 < a.length && bSpacesCnt < b.length) {
                if (b.charCodeAt(bSpacesCnt) !== 32 /* CharCode.Space */ && a.charCodeAt(bSpacesCnt - 1) === 32 /* CharCode.Space */) {
                    if (a.charCodeAt(a.length - 1) === 44 /* CharCode.Comma */) {
                        // This looks like an alignment desire: e.g.
                        // const a = b + c,
                        //       d = b - c;
                        result.looksLikeAlignment = true;
                    }
                }
            }
            return;
        }
        if (spacesDiff % tabsDiff === 0) {
            result.spacesDiff = spacesDiff / tabsDiff;
            return;
        }
    }
    function guessIndentation(source, defaultTabSize, defaultInsertSpaces) {
        // Look at most at the first 10k lines
        const linesCount = Math.min(source.getLineCount(), 10000);
        let linesIndentedWithTabsCount = 0; // number of lines that contain at least one tab in indentation
        let linesIndentedWithSpacesCount = 0; // number of lines that contain only spaces in indentation
        let previousLineText = ''; // content of latest line that contained non-whitespace chars
        let previousLineIndentation = 0; // index at which latest line contained the first non-whitespace char
        const ALLOWED_TAB_SIZE_GUESSES = [2, 4, 6, 8, 3, 5, 7]; // prefer even guesses for `tabSize`, limit to [2, 8].
        const MAX_ALLOWED_TAB_SIZE_GUESS = 8; // max(ALLOWED_TAB_SIZE_GUESSES) = 8
        const spacesDiffCount = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // `tabSize` scores
        const tmp = new SpacesDiffResult();
        for (let lineNumber = 1; lineNumber <= linesCount; lineNumber++) {
            const currentLineLength = source.getLineLength(lineNumber);
            const currentLineText = source.getLineContent(lineNumber);
            // if the text buffer is chunk based, so long lines are cons-string, v8 will flattern the string when we check charCode.
            // checking charCode on chunks directly is cheaper.
            const useCurrentLineText = (currentLineLength <= 65536);
            let currentLineHasContent = false; // does `currentLineText` contain non-whitespace chars
            let currentLineIndentation = 0; // index at which `currentLineText` contains the first non-whitespace char
            let currentLineSpacesCount = 0; // count of spaces found in `currentLineText` indentation
            let currentLineTabsCount = 0; // count of tabs found in `currentLineText` indentation
            for (let j = 0, lenJ = currentLineLength; j < lenJ; j++) {
                const charCode = (useCurrentLineText ? currentLineText.charCodeAt(j) : source.getLineCharCode(lineNumber, j));
                if (charCode === 9 /* CharCode.Tab */) {
                    currentLineTabsCount++;
                }
                else if (charCode === 32 /* CharCode.Space */) {
                    currentLineSpacesCount++;
                }
                else {
                    // Hit non whitespace character on this line
                    currentLineHasContent = true;
                    currentLineIndentation = j;
                    break;
                }
            }
            // Ignore empty or only whitespace lines
            if (!currentLineHasContent) {
                continue;
            }
            if (currentLineTabsCount > 0) {
                linesIndentedWithTabsCount++;
            }
            else if (currentLineSpacesCount > 1) {
                linesIndentedWithSpacesCount++;
            }
            spacesDiff(previousLineText, previousLineIndentation, currentLineText, currentLineIndentation, tmp);
            if (tmp.looksLikeAlignment) {
                // if defaultInsertSpaces === true && the spaces count == tabSize, we may want to count it as valid indentation
                //
                // - item1
                //   - item2
                //
                // otherwise skip this line entirely
                //
                // const a = 1,
                //       b = 2;
                if (!(defaultInsertSpaces && defaultTabSize === tmp.spacesDiff)) {
                    continue;
                }
            }
            const currentSpacesDiff = tmp.spacesDiff;
            if (currentSpacesDiff <= MAX_ALLOWED_TAB_SIZE_GUESS) {
                spacesDiffCount[currentSpacesDiff]++;
            }
            previousLineText = currentLineText;
            previousLineIndentation = currentLineIndentation;
        }
        let insertSpaces = defaultInsertSpaces;
        if (linesIndentedWithTabsCount !== linesIndentedWithSpacesCount) {
            insertSpaces = (linesIndentedWithTabsCount < linesIndentedWithSpacesCount);
        }
        let tabSize = defaultTabSize;
        // Guess tabSize only if inserting spaces...
        if (insertSpaces) {
            let tabSizeScore = (insertSpaces ? 0 : 0.1 * linesCount);
            // console.log("score threshold: " + tabSizeScore);
            ALLOWED_TAB_SIZE_GUESSES.forEach((possibleTabSize) => {
                const possibleTabSizeScore = spacesDiffCount[possibleTabSize];
                if (possibleTabSizeScore > tabSizeScore) {
                    tabSizeScore = possibleTabSizeScore;
                    tabSize = possibleTabSize;
                }
            });
            // Let a tabSize of 2 win even if it is not the maximum
            // (only in case 4 was guessed)
            if (tabSize === 4 && spacesDiffCount[4] > 0 && spacesDiffCount[2] > 0 && spacesDiffCount[2] >= spacesDiffCount[4] / 2) {
                tabSize = 2;
            }
        }
        // console.log('--------------------------');
        // console.log('linesIndentedWithTabsCount: ' + linesIndentedWithTabsCount + ', linesIndentedWithSpacesCount: ' + linesIndentedWithSpacesCount);
        // console.log('spacesDiffCount: ' + spacesDiffCount);
        // console.log('tabSize: ' + tabSize + ', tabSizeScore: ' + tabSizeScore);
        return {
            insertSpaces: insertSpaces,
            tabSize: tabSize
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50YXRpb25HdWVzc2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsL2luZGVudGF0aW9uR3Vlc3Nlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFHaEcsNENBdUhDO0lBdk5ELE1BQU0sZ0JBQWdCO1FBQXRCO1lBQ1EsZUFBVSxHQUFXLENBQUMsQ0FBQztZQUN2Qix1QkFBa0IsR0FBWSxLQUFLLENBQUM7UUFDNUMsQ0FBQztLQUFBO0lBRUQ7O09BRUc7SUFDSCxTQUFTLFVBQVUsQ0FBQyxDQUFTLEVBQUUsT0FBZSxFQUFFLENBQVMsRUFBRSxPQUFlLEVBQUUsTUFBd0I7UUFFbkcsTUFBTSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFDdEIsTUFBTSxDQUFDLGtCQUFrQixHQUFHLEtBQUssQ0FBQztRQUVsQyxnQ0FBZ0M7UUFDaEMsYUFBYTtRQUNiLGlCQUFpQjtRQUNqQiwyQ0FBMkM7UUFFM0MsSUFBSSxDQUFTLENBQUM7UUFFZCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sSUFBSSxDQUFDLEdBQUcsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDN0MsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQyxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWxDLElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM3QixNQUFNO1lBQ1AsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLFVBQVUsR0FBRyxDQUFDLEVBQUUsVUFBVSxHQUFHLENBQUMsQ0FBQztRQUNuQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxD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