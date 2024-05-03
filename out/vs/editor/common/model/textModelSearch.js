/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/wordCharacterClassifier", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model"], function (require, exports, strings, wordCharacterClassifier_1, position_1, range_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Searcher = exports.TextModelSearch = exports.SearchParams = void 0;
    exports.isMultilineRegexSource = isMultilineRegexSource;
    exports.createFindMatch = createFindMatch;
    exports.isValidMatch = isValidMatch;
    const LIMIT_FIND_COUNT = 999;
    class SearchParams {
        constructor(searchString, isRegex, matchCase, wordSeparators) {
            this.searchString = searchString;
            this.isRegex = isRegex;
            this.matchCase = matchCase;
            this.wordSeparators = wordSeparators;
        }
        parseSearchRequest() {
            if (this.searchString === '') {
                return null;
            }
            // Try to create a RegExp out of the params
            let multiline;
            if (this.isRegex) {
                multiline = isMultilineRegexSource(this.searchString);
            }
            else {
                multiline = (this.searchString.indexOf('\n') >= 0);
            }
            let regex = null;
            try {
                regex = strings.createRegExp(this.searchString, this.isRegex, {
                    matchCase: this.matchCase,
                    wholeWord: false,
                    multiline: multiline,
                    global: true,
                    unicode: true
                });
            }
            catch (err) {
                return null;
            }
            if (!regex) {
                return null;
            }
            let canUseSimpleSearch = (!this.isRegex && !multiline);
            if (canUseSimpleSearch && this.searchString.toLowerCase() !== this.searchString.toUpperCase()) {
                // casing might make a difference
                canUseSimpleSearch = this.matchCase;
            }
            return new model_1.SearchData(regex, this.wordSeparators ? (0, wordCharacterClassifier_1.getMapForWordSeparators)(this.wordSeparators, []) : null, canUseSimpleSearch ? this.searchString : null);
        }
    }
    exports.SearchParams = SearchParams;
    function isMultilineRegexSource(searchString) {
        if (!searchString || searchString.length === 0) {
            return false;
        }
        for (let i = 0, len = searchString.length; i < len; i++) {
            const chCode = searchString.charCodeAt(i);
            if (chCode === 10 /* CharCode.LineFeed */) {
                return true;
            }
            if (chCode === 92 /* CharCode.Backslash */) {
                // move to next char
                i++;
                if (i >= len) {
                    // string ends with a \
                    break;
                }
                const nextChCode = searchString.charCodeAt(i);
                if (nextChCode === 110 /* CharCode.n */ || nextChCode === 114 /* CharCode.r */ || nextChCode === 87 /* CharCode.W */) {
                    return true;
                }
            }
        }
        return false;
    }
    function createFindMatch(range, rawMatches, captureMatches) {
        if (!captureMatches) {
            return new model_1.FindMatch(range, null);
        }
        const matches = [];
        for (let i = 0, len = rawMatches.length; i < len; i++) {
            matches[i] = rawMatches[i];
        }
        return new model_1.FindMatch(range, matches);
    }
    class LineFeedCounter {
        constructor(text) {
            const lineFeedsOffsets = [];
            let lineFeedsOffsetsLen = 0;
            for (let i = 0, textLen = text.length; i < textLen; i++) {
                if (text.charCodeAt(i) === 10 /* CharCode.LineFeed */) {
                    lineFeedsOffsets[lineFeedsOffsetsLen++] = i;
                }
            }
            this._lineFeedsOffsets = lineFeedsOffsets;
        }
        findLineFeedCountBeforeOffset(offset) {
            const lineFeedsOffsets = this._lineFeedsOffsets;
            let min = 0;
            let max = lineFeedsOffsets.length - 1;
            if (max === -1) {
                // no line feeds
                return 0;
            }
            if (offset <= lineFeedsOffsets[0]) {
                // before first line feed
                return 0;
            }
            while (min < max) {
                const mid = min + ((max - min) / 2 >> 0);
                if (lineFeedsOffsets[mid] >= offset) {
                    max = mid - 1;
                }
                else {
                    if (lineFeedsOffsets[mid + 1] >= offset) {
                        // bingo!
                        min = mid;
                        max = mid;
                    }
                    else {
                        min = mid + 1;
                    }
                }
            }
            return min + 1;
        }
    }
    class TextModelSearch {
        static findMatches(model, searchParams, searchRange, captureMatches, limitResultCount) {
            const searchData = searchParams.parseSearchRequest();
            if (!searchData) {
                return [];
            }
            if (searchData.regex.multiline) {
                return this._doFindMatchesMultiline(model, searchRange, new Searcher(searchData.wordSeparators, searchData.regex), captureMatches, limitResultCount);
            }
            return this._doFindMatchesLineByLine(model, searchRange, searchData, captureMatches, limitResultCount);
        }
        /**
         * Multiline search always executes on the lines concatenated with \n.
         * We must therefore compensate for the count of \n in case the model is CRLF
         */
        static _getMultilineMatchRange(model, deltaOffset, text, lfCounter, matchIndex, match0) {
            let startOffset;
            let lineFeedCountBeforeMatch = 0;
            if (lfCounter) {
                lineFeedCountBeforeMatch = lfCounter.findLineFeedCountBeforeOffset(matchIndex);
                startOffset = deltaOffset + matchIndex + lineFeedCountBeforeMatch /* add as many \r as there were \n */;
            }
            else {
                startOffset = deltaOffset + matchIndex;
            }
            let endOffset;
            if (lfCounter) {
                const lineFeedCountBeforeEndOfMatch = lfCounter.findLineFeedCountBeforeOffset(matchIndex + match0.length);
                const lineFeedCountInMatch = lineFeedCountBeforeEndOfMatch - lineFeedCountBeforeMatch;
                endOffset = startOffset + match0.length + lineFeedCountInMatch /* add as many \r as there were \n */;
            }
            else {
                endOffset = startOffset + match0.length;
            }
            const startPosition = model.getPositionAt(startOffset);
            const endPosition = model.getPositionAt(endOffset);
            return new range_1.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column);
        }
        static _doFindMatchesMultiline(model, searchRange, searcher, captureMatches, limitResultCount) {
            const deltaOffset = model.getOffsetAt(searchRange.getStartPosition());
            // We always execute multiline search over the lines joined with \n
            // This makes it that \n will match the EOL for both CRLF and LF models
            // We compensate for offset errors in `_getMultilineMatchRange`
            const text = model.getValueInRange(searchRange, 1 /* EndOfLinePreference.LF */);
            const lfCounter = (model.getEOL() === '\r\n' ? new LineFeedCounter(text) : null);
            const result = [];
            let counter = 0;
            let m;
            searcher.reset(0);
            while ((m = searcher.next(text))) {
                result[counter++] = createFindMatch(this._getMultilineMatchRange(model, deltaOffset, text, lfCounter, m.index, m[0]), m, captureMatches);
                if (counter >= limitResultCount) {
                    return result;
                }
            }
            return result;
        }
        static _doFindMatchesLineByLine(model, searchRange, searchData, captureMatches, limitResultCount) {
            const result = [];
            let resultLen = 0;
            // Early case for a search range that starts & stops on the same line number
            if (searchRange.startLineNumber === searchRange.endLineNumber) {
                const text = model.getLineContent(searchRange.startLineNumber).substring(searchRange.startColumn - 1, searchRange.endColumn - 1);
                resultLen = this._findMatchesInLine(searchData, text, searchRange.startLineNumber, searchRange.startColumn - 1, resultLen, result, captureMatches, limitResultCount);
                return result;
            }
            // Collect results from first line
            const text = model.getLineContent(searchRange.startLineNumber).substring(searchRange.startColumn - 1);
            resultLen = this._findMatchesInLine(searchData, text, searchRange.startLineNumber, searchRange.startColumn - 1, resultLen, result, captureMatches, limitResultCount);
            // Collect results from middle lines
            for (let lineNumber = searchRange.startLineNumber + 1; lineNumber < searchRange.endLineNumber && resultLen < limitResultCount; lineNumber++) {
                resultLen = this._findMatchesInLine(searchData, model.getLineContent(lineNumber), lineNumber, 0, resultLen, result, captureMatches, limitResultCount);
            }
            // Collect results from last line
            if (resultLen < limitResultCount) {
                const text = model.getLineContent(searchRange.endLineNumber).substring(0, searchRange.endColumn - 1);
                resultLen = this._findMatchesInLine(searchData, text, searchRange.endLineNumber, 0, resultLen, result, captureMatches, limitResultCount);
            }
            return result;
        }
        static _findMatchesInLine(searchData, text, lineNumber, deltaOffset, resultLen, result, captureMatches, limitResultCount) {
            const wordSeparators = searchData.wordSeparators;
            if (!captureMatches && searchData.simpleSearch) {
                const searchString = searchData.simpleSearch;
                const searchStringLen = searchString.length;
                const textLength = text.length;
                let lastMatchIndex = -searchStringLen;
                while ((lastMatchIndex = text.indexOf(searchString, lastMatchIndex + searchStringLen)) !== -1) {
                    if (!wordSeparators || isValidMatch(wordSeparators, text, textLength, lastMatchIndex, searchStringLen)) {
                        result[resultLen++] = new model_1.FindMatch(new range_1.Range(lineNumber, lastMatchIndex + 1 + deltaOffset, lineNumber, lastMatchIndex + 1 + searchStringLen + deltaOffset), null);
                        if (resultLen >= limitResultCount) {
                            return resultLen;
                        }
                    }
                }
                return resultLen;
            }
            const searcher = new Searcher(searchData.wordSeparators, searchData.regex);
            let m;
            // Reset regex to search from the beginning
            searcher.reset(0);
            do {
                m = searcher.next(text);
                if (m) {
                    result[resultLen++] = createFindMatch(new range_1.Range(lineNumber, m.index + 1 + deltaOffset, lineNumber, m.index + 1 + m[0].length + deltaOffset), m, captureMatches);
                    if (resultLen >= limitResultCount) {
                        return resultLen;
                    }
                }
            } while (m);
            return resultLen;
        }
        static findNextMatch(model, searchParams, searchStart, captureMatches) {
            const searchData = searchParams.parseSearchRequest();
            if (!searchData) {
                return null;
            }
            const searcher = new Searcher(searchData.wordSeparators, searchData.regex);
            if (searchData.regex.multiline) {
                return this._doFindNextMatchMultiline(model, searchStart, searcher, captureMatches);
            }
            return this._doFindNextMatchLineByLine(model, searchStart, searcher, captureMatches);
        }
        static _doFindNextMatchMultiline(model, searchStart, searcher, captureMatches) {
            const searchTextStart = new position_1.Position(searchStart.lineNumber, 1);
            const deltaOffset = model.getOffsetAt(searchTextStart);
            const lineCount = model.getLineCount();
            // We always execute multiline search over the lines joined with \n
            // This makes it that \n will match the EOL for both CRLF and LF models
            // We compensate for offset errors in `_getMultilineMatchRange`
            const text = model.getValueInRange(new range_1.Range(searchTextStart.lineNumber, searchTextStart.column, lineCount, model.getLineMaxColumn(lineCount)), 1 /* EndOfLinePreference.LF */);
            const lfCounter = (model.getEOL() === '\r\n' ? new LineFeedCounter(text) : null);
            searcher.reset(searchStart.column - 1);
            const m = searcher.next(text);
            if (m) {
                return createFindMatch(this._getMultilineMatchRange(model, deltaOffset, text, lfCounter, m.index, m[0]), m, captureMatches);
            }
            if (searchStart.lineNumber !== 1 || searchStart.column !== 1) {
                // Try again from the top
                return this._doFindNextMatchMultiline(model, new position_1.Position(1, 1), searcher, captureMatches);
            }
            return null;
        }
        static _doFindNextMatchLineByLine(model, searchStart, searcher, captureMatches) {
            const lineCount = model.getLineCount();
            const startLineNumber = searchStart.lineNumber;
            // Look in first line
            const text = model.getLineContent(startLineNumber);
            const r = this._findFirstMatchInLine(searcher, text, startLineNumber, searchStart.column, captureMatches);
            if (r) {
                return r;
            }
            for (let i = 1; i <= lineCount; i++) {
                const lineIndex = (startLineNumber + i - 1) % lineCount;
                const text = model.getLineContent(lineIndex + 1);
                const r = this._findFirstMatchInLine(searcher, text, lineIndex + 1, 1, captureMatches);
                if (r) {
                    return r;
                }
            }
            return null;
        }
        static _findFirstMatchInLine(searcher, text, lineNumber, fromColumn, captureMatches) {
            // Set regex to search from column
            searcher.reset(fromColumn - 1);
            const m = searcher.next(text);
            if (m) {
                return createFindMatch(new range_1.Range(lineNumber, m.index + 1, lineNumber, m.index + 1 + m[0].length), m, captureMatches);
            }
            return null;
        }
        static findPreviousMatch(model, searchParams, searchStart, captureMatches) {
            const searchData = searchParams.parseSearchRequest();
            if (!searchData) {
                return null;
            }
            const searcher = new Searcher(searchData.wordSeparators, searchData.regex);
            if (searchData.regex.multiline) {
                return this._doFindPreviousMatchMultiline(model, searchStart, searcher, captureMatches);
            }
            return this._doFindPreviousMatchLineByLine(model, searchStart, searcher, captureMatches);
        }
        static _doFindPreviousMatchMultiline(model, searchStart, searcher, captureMatches) {
            const matches = this._doFindMatchesMultiline(model, new range_1.Range(1, 1, searchStart.lineNumber, searchStart.column), searcher, captureMatches, 10 * LIMIT_FIND_COUNT);
            if (matches.length > 0) {
                return matches[matches.length - 1];
            }
            const lineCount = model.getLineCount();
            if (searchStart.lineNumber !== lineCount || searchStart.column !== model.getLineMaxColumn(lineCount)) {
                // Try again with all content
                return this._doFindPreviousMatchMultiline(model, new position_1.Position(lineCount, model.getLineMaxColumn(lineCount)), searcher, captureMatches);
            }
            return null;
        }
        static _doFindPreviousMatchLineByLine(model, searchStart, searcher, captureMatches) {
            const lineCount = model.getLineCount();
            const startLineNumber = searchStart.lineNumber;
            // Look in first line
            const text = model.getLineContent(startLineNumber).substring(0, searchStart.column - 1);
            const r = this._findLastMatchInLine(searcher, text, startLineNumber, captureMatches);
            if (r) {
                return r;
            }
            for (let i = 1; i <= lineCount; i++) {
                const lineIndex = (lineCount + startLineNumber - i - 1) % lineCount;
                const text = model.getLineContent(lineIndex + 1);
                const r = this._findLastMatchInLine(searcher, text, lineIndex + 1, captureMatches);
                if (r) {
                    return r;
                }
            }
            return null;
        }
        static _findLastMatchInLine(searcher, text, lineNumber, captureMatches) {
            let bestResult = null;
            let m;
            searcher.reset(0);
            while ((m = searcher.next(text))) {
                bestResult = createFindMatch(new range_1.Range(lineNumber, m.index + 1, lineNumber, m.index + 1 + m[0].length), m, captureMatches);
            }
            return bestResult;
        }
    }
    exports.TextModelSearch = TextModelSearch;
    function leftIsWordBounday(wordSeparators, text, textLength, matchStartIndex, matchLength) {
        if (matchStartIndex === 0) {
            // Match starts at start of string
            return true;
        }
        const charBefore = text.charCodeAt(matchStartIndex - 1);
        if (wordSeparators.get(charBefore) !== 0 /* WordCharacterClass.Regular */) {
            // The character before the match is a word separator
            return true;
        }
        if (charBefore === 13 /* CharCode.CarriageReturn */ || charBefore === 10 /* CharCode.LineFeed */) {
            // The character before the match is line break or carriage return.
            return true;
        }
        if (matchLength > 0) {
            const firstCharInMatch = text.charCodeAt(matchStartIndex);
            if (wordSeparators.get(firstCharInMatch) !== 0 /* WordCharacterClass.Regular */) {
                // The first character inside the match is a word separator
                return true;
            }
        }
        return false;
    }
    function rightIsWordBounday(wordSeparators, text, textLength, matchStartIndex, matchLength) {
        if (matchStartIndex + matchLength === textLength) {
            // Match ends at end of string
            return true;
        }
        const charAfter = text.charCodeAt(matchStartIndex + matchLength);
        if (wordSeparators.get(charAfter) !== 0 /* WordCharacterClass.Regular */) {
            // The character after the match is a word separator
            return true;
        }
        if (charAfter === 13 /* CharCode.CarriageReturn */ || charAfter === 10 /* CharCode.LineFeed */) {
            // The character after the match is line break or carriage return.
            return true;
        }
        if (matchLength > 0) {
            const lastCharInMatch = text.charCodeAt(matchStartIndex + matchLength - 1);
            if (wordSeparators.get(lastCharInMatch) !== 0 /* WordCharacterClass.Regular */) {
                // The last character in the match is a word separator
                return true;
            }
        }
        return false;
    }
    function isValidMatch(wordSeparators, text, textLength, matchStartIndex, matchLength) {
        return (leftIsWordBounday(wordSeparators, text, textLength, matchStartIndex, matchLength)
            && rightIsWordBounday(wordSeparators, text, textLength, matchStartIndex, matchLength));
    }
    class Searcher {
        constructor(wordSeparators, searchRegex) {
            this._wordSeparators = wordSeparators;
            this._searchRegex = searchRegex;
            this._prevMatchStartIndex = -1;
            this._prevMatchLength = 0;
        }
        reset(lastIndex) {
            this._searchRegex.lastIndex = lastIndex;
            this._prevMatchStartIndex = -1;
            this._prevMatchLength = 0;
        }
        next(text) {
            const textLength = text.length;
            let m;
            do {
                if (this._prevMatchStartIndex + this._prevMatchLength === textLength) {
                    // Reached the end of the line
                    return null;
                }
                m = this._searchRegex.exec(text);
                if (!m) {
                    return null;
                }
                const matchStartIndex = m.index;
                const matchLength = m[0].length;
                if (matchStartIndex === this._prevMatchStartIndex && matchLength === this._prevMatchLength) {
                    if (matchLength === 0) {
                        // the search result is an empty string and won't advance `regex.lastIndex`, so `regex.exec` will stuck here
                        // we attempt to recover from that by advancing by two if surrogate pair found and by one otherwise
                        if (strings.getNextCodePoint(text, textLength, this._searchRegex.lastIndex) > 0xFFFF) {
                            this._searchRegex.lastIndex += 2;
                        }
                        else {
                            this._searchRegex.lastIndex += 1;
                        }
                        continue;
                    }
                    // Exit early if the regex matches the same range twice
                    return null;
                }
                this._prevMatchStartIndex = matchStartIndex;
                this._prevMatchLength = matchLength;
                if (!this._wordSeparators || isValidMatch(this._wordSeparators, text, textLength, matchStartIndex, matchLength)) {
                    return m;
                }
            } while (m);
            return null;
        }
    }
    exports.Searcher = Searcher;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsU2VhcmNoLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsL3RleHRNb2RlbFNlYXJjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpRWhHLHdEQThCQztJQUVELDBDQVNDO0lBeVhELG9DQUtDO0lBOWRELE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxDQUFDO0lBRTdCLE1BQWEsWUFBWTtRQU14QixZQUFZLFlBQW9CLEVBQUUsT0FBZ0IsRUFBRSxTQUFrQixFQUFFLGNBQTZCO1lBQ3BHLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1lBQzNCLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1FBQ3RDLENBQUM7UUFFTSxrQkFBa0I7WUFDeEIsSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLEVBQUUsRUFBRSxDQUFDO2dCQUM5QixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCwyQ0FBMkM7WUFDM0MsSUFBSSxTQUFrQixDQUFDO1lBQ3ZCLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNsQixTQUFTLEdBQUcsc0JBQXNCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3ZELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwRCxDQUFDO1lBRUQsSUFBSSxLQUFLLEdBQWtCLElBQUksQ0FBQztZQUNoQyxJQUFJLENBQUM7Z0JBQ0osS0FBSyxHQUFHLE9BQU8sQ0FB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