/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/cursorCommon", "vs/editor/common/cursor/cursorDeleteOperations", "vs/editor/common/core/wordCharacterClassifier", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, strings, cursorCommon_1, cursorDeleteOperations_1, wordCharacterClassifier_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WordPartOperations = exports.WordOperations = exports.WordNavigationType = void 0;
    var WordType;
    (function (WordType) {
        WordType[WordType["None"] = 0] = "None";
        WordType[WordType["Regular"] = 1] = "Regular";
        WordType[WordType["Separator"] = 2] = "Separator";
    })(WordType || (WordType = {}));
    var WordNavigationType;
    (function (WordNavigationType) {
        WordNavigationType[WordNavigationType["WordStart"] = 0] = "WordStart";
        WordNavigationType[WordNavigationType["WordStartFast"] = 1] = "WordStartFast";
        WordNavigationType[WordNavigationType["WordEnd"] = 2] = "WordEnd";
        WordNavigationType[WordNavigationType["WordAccessibility"] = 3] = "WordAccessibility"; // Respect chrome definition of a word
    })(WordNavigationType || (exports.WordNavigationType = WordNavigationType = {}));
    class WordOperations {
        static _createWord(lineContent, wordType, nextCharClass, start, end) {
            // console.log('WORD ==> ' + start + ' => ' + end + ':::: <<<' + lineContent.substring(start, end) + '>>>');
            return { start: start, end: end, wordType: wordType, nextCharClass: nextCharClass };
        }
        static _createIntlWord(intlWord, nextCharClass) {
            // console.log('INTL WORD ==> ' + intlWord.index + ' => ' + intlWord.index + intlWord.segment.length + ':::: <<<' + intlWord.segment + '>>>');
            return { start: intlWord.index, end: intlWord.index + intlWord.segment.length, wordType: 1 /* WordType.Regular */, nextCharClass: nextCharClass };
        }
        static _findPreviousWordOnLine(wordSeparators, model, position) {
            const lineContent = model.getLineContent(position.lineNumber);
            return this._doFindPreviousWordOnLine(lineContent, wordSeparators, position);
        }
        static _doFindPreviousWordOnLine(lineContent, wordSeparators, position) {
            let wordType = 0 /* WordType.None */;
            const previousIntlWord = wordSeparators.findPrevIntlWordBeforeOrAtOffset(lineContent, position.column - 2);
            for (let chIndex = position.column - 2; chIndex >= 0; chIndex--) {
                const chCode = lineContent.charCodeAt(chIndex);
                const chClass = wordSeparators.get(chCode);
                if (previousIntlWord && chIndex === previousIntlWord.index) {
                    return this._createIntlWord(previousIntlWord, chClass);
                }
                if (chClass === 0 /* WordCharacterClass.Regular */) {
                    if (wordType === 2 /* WordType.Separator */) {
                        return this._createWord(lineContent, wordType, chClass, chIndex + 1, this._findEndOfWord(lineContent, wordSeparators, wordType, chIndex + 1));
                    }
                    wordType = 1 /* WordType.Regular */;
                }
                else if (chClass === 2 /* WordCharacterClass.WordSeparator */) {
                    if (wordType === 1 /* WordType.Regular */) {
                        return this._createWord(lineContent, wordType, chClass, chIndex + 1, this._findEndOfWord(lineContent, wordSeparators, wordType, chIndex + 1));
                    }
                    wordType = 2 /* WordType.Separator */;
                }
                else if (chClass === 1 /* WordCharacterClass.Whitespace */) {
                    if (wordType !== 0 /* WordType.None */) {
                        return this._createWord(lineContent, wordType, chClass, chIndex + 1, this._findEndOfWord(lineContent, wordSeparators, wordType, chIndex + 1));
                    }
                }
            }
            if (wordType !== 0 /* WordType.None */) {
                return this._createWord(lineContent, wordType, 1 /* WordCharacterClass.Whitespace */, 0, this._findEndOfWord(lineContent, wordSeparators, wordType, 0));
            }
            return null;
        }
        static _findEndOfWord(lineContent, wordSeparators, wordType, startIndex) {
            const nextIntlWord = wordSeparators.findNextIntlWordAtOrAfterOffset(lineContent, startIndex);
            const len = lineContent.length;
            for (let chIndex = startIndex; chIndex < len; chIndex++) {
                const chCode = lineContent.charCodeAt(chIndex);
                const chClass = wordSeparators.get(chCode);
                if (nextIntlWord && chIndex === nextIntlWord.index + nextIntlWord.segment.length) {
                    return chIndex;
                }
                if (chClass === 1 /* WordCharacterClass.Whitespace */) {
                    return chIndex;
                }
                if (wordType === 1 /* WordType.Regular */ && chClass === 2 /* WordCharacterClass.WordSeparator */) {
                    return chIndex;
                }
                if (wordType === 2 /* WordType.Separator */ && chClass === 0 /* WordCharacterClass.Regular */) {
                    return chIndex;
                }
            }
            return len;
        }
        static _findNextWordOnLine(wordSeparators, model, position) {
            const lineContent = model.getLineContent(position.lineNumber);
            return this._doFindNextWordOnLine(lineContent, wordSeparators, position);
        }
        static _doFindNextWordOnLine(lineContent, wordSeparators, position) {
            let wordType = 0 /* WordType.None */;
            const len = lineContent.length;
            const nextIntlWord = wordSeparators.findNextIntlWordAtOrAfterOffset(lineContent, position.column - 1);
            for (let chIndex = position.column - 1; chIndex < len; chIndex++) {
                const chCode = lineContent.charCodeAt(chIndex);
                const chClass = wordSeparators.get(chCode);
                if (nextIntlWord && chIndex === nextIntlWord.index) {
                    return this._createIntlWord(nextIntlWord, chClass);
                }
                if (chClass === 0 /* WordCharacterClass.Regular */) {
                    if (wordType === 2 /* WordType.Separator */) {
                        return this._createWord(lineContent, wordType, chClass, this._findStartOfWord(lineContent, wordSeparators, wordType, chIndex - 1), chIndex);
                    }
                    wordType = 1 /* WordType.Regular */;
                }
                else if (chClass === 2 /* WordCharacterClass.WordSeparator */) {
                    if (wordType === 1 /* WordType.Regular */) {
                        return this._createWord(lineContent, wordType, chClass, this._findStartOfWord(lineContent, wordSeparators, wordType, chIndex - 1), chIndex);
                    }
                    wordType = 2 /* WordType.Separator */;
                }
                else if (chClass === 1 /* WordCharacterClass.Whitespace */) {
                    if (wordType !== 0 /* WordType.None */) {
                        return this._createWord(lineContent, wordType, chClass, this._findStartOfWord(lineContent, wordSeparators, wordType, chIndex - 1), chIndex);
                    }
                }
            }
            if (wordType !== 0 /* WordType.None */) {
                return this._createWord(lineContent, wordType, 1 /* WordCharacterClass.Whitespace */, this._findStartOfWord(lineContent, wordSeparators, wordType, len - 1), len);
            }
            return null;
        }
        static _findStartOfWord(lineContent, wordSeparators, wordType, startIndex) {
            const previousIntlWord = wordSeparators.findPrevIntlWordBeforeOrAtOffset(lineContent, startIndex);
            for (let chIndex = startIndex; chIndex >= 0; chIndex--) {
                const chCode = lineContent.charCodeAt(chIndex);
                const chClass = wordSeparators.get(chCode);
                if (previousIntlWord && chIndex === previousIntlWord.index) {
                    return chIndex;
                }
                if (chClass === 1 /* WordCharacterClass.Whitespace */) {
                    return chIndex + 1;
                }
                if (wordType === 1 /* WordType.Regular */ && chClass === 2 /* WordCharacterClass.WordSeparator */) {
                    return chIndex + 1;
                }
                if (wordType === 2 /* WordType.Separator */ && chClass === 0 /* WordCharacterClass.Regular */) {
                    return chIndex + 1;
                }
            }
            return 0;
        }
        static moveWordLeft(wordSeparators, model, position, wordNavigationType) {
            let lineNumber = position.lineNumber;
            let column = position.column;
            if (column === 1) {
                if (lineNumber > 1) {
                    lineNumber = lineNumber - 1;
                    column = model.getLineMaxColumn(lineNumber);
                }
            }
            let prevWordOnLine = WordOperations._findPreviousWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, column));
            if (wordNavigationType === 0 /* WordNavigationType.WordStart */) {
                return new position_1.Position(lineNumber, prevWordOnLine ? prevWordOnLine.start + 1 : 1);
            }
            if (wordNavigationType === 1 /* WordNavigationType.WordStartFast */) {
                if (prevWordOnLine
                    && prevWordOnLine.wordType === 2 /* WordType.Separator */
                    && prevWordOnLine.end - prevWordOnLine.start === 1
                    && prevWordOnLine.nextCharClass === 0 /* WordCharacterClass.Regular */) {
                    // Skip over a word made up of one single separator and followed by a regular character
                    prevWordOnLine = WordOperations._findPreviousWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, prevWordOnLine.start + 1));
                }
                return new position_1.Position(lineNumber, prevWordOnLine ? prevWordOnLine.start + 1 : 1);
            }
            if (wordNavigationType === 3 /* WordNavigationType.WordAccessibility */) {
                while (prevWordOnLine
                    && prevWordOnLine.wordType === 2 /* WordType.Separator */) {
                    // Skip over words made up of only separators
                    prevWordOnLine = WordOperations._findPreviousWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, prevWordOnLine.start + 1));
                }
                return new position_1.Position(lineNumber, prevWordOnLine ? prevWordOnLine.start + 1 : 1);
            }
            // We are stopping at the ending of words
            if (prevWordOnLine && column <= prevWordOnLine.end + 1) {
                prevWordOnLine = WordOperations._findPreviousWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, prevWordOnLine.start + 1));
            }
            return new position_1.Position(lineNumber, prevWordOnLine ? prevWordOnLine.end + 1 : 1);
        }
        static _moveWordPartLeft(model, position) {
            const lineNumber = position.lineNumber;
            const maxColumn = model.getLineMaxColumn(lineNumber);
            if (position.column === 1) {
                return (lineNumber > 1 ? new position_1.Position(lineNumber - 1, model.getLineMaxColumn(lineNumber - 1)) : position);
            }
            const lineContent = model.getLineContent(lineNumber);
            for (let column = position.column - 1; column > 1; column--) {
                const left = lineContent.charCodeAt(column - 2);
                const right = lineContent.charCodeAt(column - 1);
                if (left === 95 /* CharCode.Underline */ && right !== 95 /* CharCode.Underline */) {
                    // snake_case_variables
                    return new position_1.Position(lineNumber, column);
                }
                if (left === 45 /* CharCode.Dash */ && right !== 45 /* CharCode.Dash */) {
                    // kebab-case-variables
                    return new position_1.Position(lineNumber, column);
                }
                if ((strings.isLowerAsciiLetter(left) || strings.isAsciiDigit(left)) && strings.isUpperAsciiLetter(right)) {
                    // camelCaseVariables
                    return new position_1.Position(lineNumber, column);
                }
                if (strings.isUpperAsciiLetter(left) && strings.isUpperAsciiLetter(right)) {
                    // thisIsACamelCaseWithOneLetterWords
                    if (column + 1 < maxColumn) {
                        const rightRight = lineContent.charCodeAt(column);
                        if (strings.isLowerAsciiLetter(rightRight) || strings.isAsciiDigit(rightRight)) {
                            return new position_1.Position(lineNumber, column);
                        }
                    }
                }
            }
            return new position_1.Position(lineNumber, 1);
        }
        static moveWordRight(wordSeparators, model, position, wordNavigationType) {
            let lineNumber = position.lineNumber;
            let column = position.column;
            let movedDown = false;
            if (column === model.getLineMaxColumn(lineNumber)) {
                if (lineNumber < model.getLineCount()) {
                    movedDown = true;
                    lineNumber = lineNumber + 1;
                    column = 1;
                }
            }
            let nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, column));
            if (wordNavigationType === 2 /* WordNavigationType.WordEnd */) {
                if (nextWordOnLine && nextWordOnLine.wordType === 2 /* WordType.Separator */) {
                    if (nextWordOnLine.end - nextWordOnLine.start === 1 && nextWordOnLine.nextCharClass === 0 /* WordCharacterClass.Regular */) {
                        // Skip over a word made up of one single separator and followed by a regular character
                        nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, nextWordOnLine.end + 1));
                    }
                }
                if (nextWordOnLine) {
                    column = nextWordOnLine.end + 1;
                }
                else {
                    column = model.getLineMaxColumn(lineNumber);
                }
            }
            else if (wordNavigationType === 3 /* WordNavigationType.WordAccessibility */) {
                if (movedDown) {
                    // If we move to the next line, pretend that the cursor is right before the first character.
                    // This is needed when the first word starts right at the first character - and in order not to miss it,
                    // we need to start before.
                    column = 0;
                }
                while (nextWordOnLine
                    && (nextWordOnLine.wordType === 2 /* WordType.Separator */
                        || nextWordOnLine.start + 1 <= column)) {
                    // Skip over a word made up of one single separator
                    // Also skip over word if it begins before current cursor position to ascertain we're moving forward at least 1 character.
                    nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, nextWordOnLine.end + 1));
                }
                if (nextWordOnLine) {
                    column = nextWordOnLine.start + 1;
                }
                else {
                    column = model.getLineMaxColumn(lineNumber);
                }
            }
            else {
                if (nextWordOnLine && !movedDown && column >= nextWordOnLine.start + 1) {
                    nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, nextWordOnLine.end + 1));
                }
                if (nextWordOnLine) {
                    column = nextWordOnLine.start + 1;
                }
                else {
                    column = model.getLineMaxColumn(lineNumber);
                }
            }
            return new position_1.Position(lineNumber, column);
        }
        static _moveWordPartRight(model, position) {
            const lineNumber = position.lineNumber;
            const maxColumn = model.getLineMaxColumn(lineNumber);
            if (position.column === maxColumn) {
                return (lineNumber < model.getLineCount() ? new position_1.Position(lineNumber + 1, 1) : position);
            }
            const lineContent = model.getLineContent(lineNumber);
            for (let column = position.column + 1; column < maxColumn; column++) {
                const left = lineContent.charCodeAt(column - 2);
                const right = lineContent.charCodeAt(column - 1);
                if (left !== 95 /* CharCode.Underline */ && right === 95 /* CharCode.Underline */) {
                    // snake_case_variables
                    return new position_1.Position(lineNumber, column);
                }
                if (left !== 45 /* CharCode.Dash */ && right === 45 /* CharCode.Dash */) {
                    // kebab-case-variables
                    return new position_1.Position(lineNumber, column);
                }
                if ((strings.isLowerAsciiLetter(left) || strings.isAsciiDigit(left)) && strings.isUpperAsciiLetter(right)) {
                    // camelCaseVariables
                    return new position_1.Position(lineNumber, column);
                }
                if (strings.isUpperAsciiLetter(left) && strings.isUpperAsciiLetter(right)) {
                    // thisIsACamelCaseWithOneLetterWords
                    if (column + 1 < maxColumn) {
                        const rightRight = lineContent.charCodeAt(column);
                        if (strings.isLowerAsciiLetter(rightRight) || strings.isAsciiDigit(rightRight)) {
                            return new position_1.Position(lineNumber, column);
                        }
                    }
                }
            }
            return new position_1.Position(lineNumber, maxColumn);
        }
        static _deleteWordLeftWhitespace(model, position) {
            const lineContent = model.getLineContent(position.lineNumber);
            const startIndex = position.column - 2;
            const lastNonWhitespace = strings.lastNonWhitespaceIndex(lineContent, startIndex);
            if (lastNonWhitespace + 1 < startIndex) {
                return new range_1.Range(position.lineNumber, lastNonWhitespace + 2, position.lineNumber, position.column);
            }
            return null;
        }
        static deleteWordLeft(ctx, wordNavigationType) {
            const wordSeparators = ctx.wordSeparators;
            const model = ctx.model;
            const selection = ctx.selection;
            const whitespaceHeuristics = ctx.whitespaceHeuristics;
            if (!selection.isEmpty()) {
                return selection;
            }
            if (cursorDeleteOperations_1.DeleteOperations.isAutoClosingPairDelete(ctx.autoClosingDelete, ctx.autoClosingBrackets, ctx.autoClosingQuotes, ctx.autoClosingPairs.autoClosingPairsOpenByEnd, ctx.model, [ctx.selection], ctx.autoClosedCharacters)) {
                const position = ctx.selection.getPosition();
                return new range_1.Range(position.lineNumber, position.column - 1, position.lineNumber, position.column + 1);
            }
            const position = new position_1.Position(selection.positionLineNumber, selection.positionColumn);
            let lineNumber = position.lineNumber;
            let column = position.column;
            if (lineNumber === 1 && column === 1) {
                // Ignore deleting at beginning of file
                return null;
            }
            if (whitespaceHeuristics) {
                const r = this._deleteWordLeftWhitespace(model, position);
                if (r) {
                    return r;
                }
            }
            let prevWordOnLine = WordOperations._findPreviousWordOnLine(wordSeparators, model, position);
            if (wordNavigationType === 0 /* WordNavigationType.WordStart */) {
                if (prevWordOnLine) {
                    column = prevWordOnLine.start + 1;
                }
                else {
                    if (column > 1) {
                        column = 1;
                    }
                    else {
                        lineNumber--;
                        column = model.getLineMaxColumn(lineNumber);
                    }
                }
            }
            else {
                if (prevWordOnLine && column <= prevWordOnLine.end + 1) {
                    prevWordOnLine = WordOperations._findPreviousWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, prevWordOnLine.start + 1));
                }
                if (prevWordOnLine) {
                    column = prevWordOnLine.end + 1;
                }
                else {
                    if (column > 1) {
                        column = 1;
                    }
                    else {
                        lineNumber--;
                        column = model.getLineMaxColumn(lineNumber);
                    }
                }
            }
            return new range_1.Range(lineNumber, column, position.lineNumber, position.column);
        }
        static deleteInsideWord(wordSeparators, model, selection) {
            if (!selection.isEmpty()) {
                return selection;
            }
            const position = new position_1.Position(selection.positionLineNumber, selection.positionColumn);
            const r = this._deleteInsideWordWhitespace(model, position);
            if (r) {
                return r;
            }
            return this._deleteInsideWordDetermineDeleteRange(wordSeparators, model, position);
        }
        static _charAtIsWhitespace(str, index) {
            const charCode = str.charCodeAt(index);
            return (charCode === 32 /* CharCode.Space */ || charCode === 9 /* CharCode.Tab */);
        }
        static _deleteInsideWordWhitespace(model, position) {
            const lineContent = model.getLineContent(position.lineNumber);
            const lineContentLength = lineContent.length;
            if (lineContentLength === 0) {
                // empty line
                return null;
            }
            let leftIndex = Math.max(position.column - 2, 0);
            if (!this._charAtIsWhitespace(lineContent, leftIndex)) {
                // touches a non-whitespace character to the left
                return null;
            }
            let rightIndex = Math.min(position.column - 1, lineContentLength - 1);
            if (!this._charAtIsWhitespace(lineContent, rightIndex)) {
                // touches a non-whitespace character to the right
                return null;
            }
            // walk over whitespace to the left
            while (leftIndex > 0 && this._charAtIsWhitespace(lineContent, leftIndex - 1)) {
                leftIndex--;
            }
            // walk over whitespace to the right
            while (rightIndex + 1 < lineContentLength && this._charAtIsWhitespace(lineContent, rightIndex + 1)) {
                rightIndex++;
            }
            return new range_1.Range(position.lineNumber, leftIndex + 1, position.lineNumber, rightIndex + 2);
        }
        static _deleteInsideWordDetermineDeleteRange(wordSeparators, model, position) {
            const lineContent = model.getLineContent(position.lineNumber);
            const lineLength = lineContent.length;
            if (lineLength === 0) {
                // empty line
                if (position.lineNumber > 1) {
                    return new range_1.Range(position.lineNumber - 1, model.getLineMaxColumn(position.lineNumber - 1), position.lineNumber, 1);
                }
                else {
                    if (position.lineNumber < model.getLineCount()) {
                        return new range_1.Range(position.lineNumber, 1, position.lineNumber + 1, 1);
                    }
                    else {
                        // empty model
                        return new range_1.Range(position.lineNumber, 1, position.lineNumber, 1);
                    }
                }
            }
            const touchesWord = (word) => {
                return (word.start + 1 <= position.column && position.column <= word.end + 1);
            };
            const createRangeWithPosition = (startColumn, endColumn) => {
                startColumn = Math.min(startColumn, position.column);
                endColumn = Math.max(endColumn, position.column);
                return new range_1.Range(position.lineNumber, startColumn, position.lineNumber, endColumn);
            };
            const deleteWordAndAdjacentWhitespace = (word) => {
                let startColumn = word.start + 1;
                let endColumn = word.end + 1;
                let expandedToTheRight = false;
                while (endColumn - 1 < lineLength && this._charAtIsWhitespace(lineContent, endColumn - 1)) {
                    expandedToTheRight = true;
                    endColumn++;
                }
                if (!expandedToTheRight) {
                    while (startColumn > 1 && this._charAtIsWhitespace(lineContent, startColumn - 2)) {
                        startColumn--;
                    }
                }
                return createRangeWithPosition(startColumn, endColumn);
            };
            const prevWordOnLine = WordOperations._findPreviousWordOnLine(wordSeparators, model, position);
            if (prevWordOnLine && touchesWord(prevWordOnLine)) {
                return deleteWordAndAdjacentWhitespace(prevWordOnLine);
            }
            const nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, position);
            if (nextWordOnLine && touchesWord(nextWordOnLine)) {
                return deleteWordAndAdjacentWhitespace(nextWordOnLine);
            }
            if (prevWordOnLine && nextWordOnLine) {
                return createRangeWithPosition(prevWordOnLine.end + 1, nextWordOnLine.start + 1);
            }
            if (prevWordOnLine) {
                return createRangeWithPosition(prevWordOnLine.start + 1, prevWordOnLine.end + 1);
            }
            if (nextWordOnLine) {
                return createRangeWithPosition(nextWordOnLine.start + 1, nextWordOnLine.end + 1);
            }
            return createRangeWithPosition(1, lineLength + 1);
        }
        static _deleteWordPartLeft(model, selection) {
            if (!selection.isEmpty()) {
                return selection;
            }
            const pos = selection.getPosition();
            const toPosition = WordOperations._moveWordPartLeft(model, pos);
            return new range_1.Range(pos.lineNumber, pos.column, toPosition.lineNumber, toPosition.column);
        }
        static _findFirstNonWhitespaceChar(str, startIndex) {
            const len = str.length;
            for (let chIndex = startIndex; chIndex < len; chIndex++) {
                const ch = str.charAt(chIndex);
                if (ch !== ' ' && ch !== '\t') {
                    return chIndex;
                }
            }
            return len;
        }
        static _deleteWordRightWhitespace(model, position) {
            const lineContent = model.getLineContent(position.lineNumber);
            const startIndex = position.column - 1;
            const firstNonWhitespace = this._findFirstNonWhitespaceChar(lineContent, startIndex);
            if (startIndex + 1 < firstNonWhitespace) {
                // bingo
                return new range_1.Range(position.lineNumber, position.column, position.lineNumber, firstNonWhitespace + 1);
            }
            return null;
        }
        static deleteWordRight(ctx, wordNavigationType) {
            const wordSeparators = ctx.wordSeparators;
            const model = ctx.model;
            const selection = ctx.selection;
            const whitespaceHeuristics = ctx.whitespaceHeuristics;
            if (!selection.isEmpty()) {
                return selection;
            }
            const position = new position_1.Position(selection.positionLineNumber, selection.positionColumn);
            let lineNumber = position.lineNumber;
            let column = position.column;
            const lineCount = model.getLineCount();
            const maxColumn = model.getLineMaxColumn(lineNumber);
            if (lineNumber === lineCount && column === maxColumn) {
                // Ignore deleting at end of file
                return null;
            }
            if (whitespaceHeuristics) {
                const r = this._deleteWordRightWhitespace(model, position);
                if (r) {
                    return r;
                }
            }
            let nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, position);
            if (wordNavigationType === 2 /* WordNavigationType.WordEnd */) {
                if (nextWordOnLine) {
                    column = nextWordOnLine.end + 1;
                }
                else {
                    if (column < maxColumn || lineNumber === lineCount) {
                        column = maxColumn;
                    }
                    else {
                        lineNumber++;
                        nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, 1));
                        if (nextWordOnLine) {
                            column = nextWordOnLine.start + 1;
                        }
                        else {
                            column = model.getLineMaxColumn(lineNumber);
                        }
                    }
                }
            }
            else {
                if (nextWordOnLine && column >= nextWordOnLine.start + 1) {
                    nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, nextWordOnLine.end + 1));
                }
                if (nextWordOnLine) {
                    column = nextWordOnLine.start + 1;
                }
                else {
                    if (column < maxColumn || lineNumber === lineCount) {
                        column = maxColumn;
                    }
                    else {
                        lineNumber++;
                        nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, 1));
                        if (nextWordOnLine) {
                            column = nextWordOnLine.start + 1;
                        }
                        else {
                            column = model.getLineMaxColumn(lineNumber);
                        }
                    }
                }
            }
            return new range_1.Range(lineNumber, column, position.lineNumber, position.column);
        }
        static _deleteWordPartRight(model, selection) {
            if (!selection.isEmpty()) {
                return selection;
            }
            const pos = selection.getPosition();
            const toPosition = WordOperations._moveWordPartRight(model, pos);
            return new range_1.Range(pos.lineNumber, pos.column, toPosition.lineNumber, toPosition.column);
        }
        static _createWordAtPosition(model, lineNumber, word) {
            const range = new range_1.Range(lineNumber, word.start + 1, lineNumber, word.end + 1);
            return {
                word: model.getValueInRange(range),
                startColumn: range.startColumn,
                endColumn: range.endColumn
            };
        }
        static getWordAtPosition(model, _wordSeparators, _intlSegmenterLocales, position) {
            const wordSeparators = (0, wordCharacterClassifier_1.getMapForWordSeparators)(_wordSeparators, _intlSegmenterLocales);
            const prevWord = WordOperations._findPreviousWordOnLine(wordSeparators, model, position);
            if (prevWord && prevWord.wordType === 1 /* WordType.Regular */ && prevWord.start <= position.column - 1 && position.column - 1 <= prevWord.end) {
                return WordOperations._createWordAtPosition(model, position.lineNumber, prevWord);
            }
            const nextWord = WordOperations._findNextWordOnLine(wordSeparators, model, position);
            if (nextWord && nextWord.wordType === 1 /* WordType.Regular */ && nextWord.start <= position.column - 1 && position.column - 1 <= nextWord.end) {
                return WordOperations._createWordAtPosition(model, position.lineNumber, nextWord);
            }
            return null;
        }
        static word(config, model, cursor, inSelectionMode, position) {
            const wordSeparators = (0, wordCharacterClassifier_1.getMapForWordSeparators)(config.wordSeparators, config.wordSegmenterLocales);
            const prevWord = WordOperations._findPreviousWordOnLine(wordSeparators, model, position);
            const nextWord = WordOperations._findNextWordOnLine(wordSeparators, model, position);
            if (!inSelectionMode) {
                // Entering word selection for the first time
                let startColumn;
                let endColumn;
                if (prevWord && prevWord.wordType === 1 /* WordType.Regular */ && prevWord.start <= position.column - 1 && position.column - 1 <= prevWord.end) {
                    // isTouchingPrevWord
                    startColumn = prevWord.start + 1;
                    endColumn = prevWord.end + 1;
                }
                else if (nextWord && nextWord.wordType === 1 /* WordType.Regular */ && nextWord.start <= position.column - 1 && position.column - 1 <= nextWord.end) {
                    // isTouchingNextWord
                    startColumn = nextWord.start + 1;
                    endColumn = nextWord.end + 1;
                }
                else {
                    if (prevWord) {
                        startColumn = prevWord.end + 1;
                    }
                    else {
                        startColumn = 1;
                    }
                    if (nextWord) {
                        endColumn = nextWord.start + 1;
                    }
                    else {
                        endColumn = model.getLineMaxColumn(position.lineNumber);
                    }
                }
                return new cursorCommon_1.SingleCursorState(new range_1.Range(position.lineNumber, startColumn, position.lineNumber, endColumn), 1 /* SelectionStartKind.Word */, 0, new position_1.Position(position.lineNumber, endColumn), 0);
            }
            let startColumn;
            let endColumn;
            if (prevWord && prevWord.wordType === 1 /* WordType.Regular */ && prevWord.start < position.column - 1 && position.column - 1 < prevWord.end) {
                // isInsidePrevWord
                startColumn = prevWord.start + 1;
                endColumn = prevWord.end + 1;
            }
            else if (nextWord && nextWord.wordType === 1 /* WordType.Regular */ && nextWord.start < position.column - 1 && position.column - 1 < nextWord.end) {
                // isInsideNextWord
                startColumn = nextWord.start + 1;
                endColumn = nextWord.end + 1;
            }
            else {
                startColumn = position.column;
                endColumn = position.column;
            }
            const lineNumber = position.lineNumber;
            let column;
            if (cursor.selectionStart.containsPosition(position)) {
                column = cursor.selectionStart.endColumn;
            }
            else if (position.isBeforeOrEqual(cursor.selectionStart.getStartPosition())) {
                column = startColumn;
                const possiblePosition = new position_1.Position(lineNumber, column);
                if (cursor.selectionStart.containsPosition(possiblePosition)) {
                    column = cursor.selectionStart.endColumn;
                }
            }
            else {
                column = endColumn;
                const possiblePosition = new position_1.Position(lineNumber, column);
                if (cursor.selectionStart.containsPosition(possiblePosition)) {
                    column = cursor.selectionStart.startColumn;
                }
            }
            return cursor.move(true, lineNumber, column, 0);
        }
    }
    exports.WordOperations = WordOperations;
    class WordPartOperations extends WordOperations {
        static deleteWordPartLeft(ctx) {
            const candidates = enforceDefined([
                WordOperations.deleteWordLeft(ctx, 0 /* WordNavigationType.WordStart */),
                WordOperations.deleteWordLeft(ctx, 2 /* WordNavigationType.WordEnd */),
                WordOperations._deleteWordPartLeft(ctx.model, ctx.selection)
            ]);
            candidates.sort(range_1.Range.compareRangesUsingEnds);
            return candidates[2];
        }
        static deleteWordPartRight(ctx) {
            const candidates = enforceDefined([
                WordOperations.deleteWordRight(ctx, 0 /* WordNavigationType.WordStart */),
                WordOperations.deleteWordRight(ctx, 2 /* WordNavigationType.WordEnd */),
                WordOperations._deleteWordPartRight(ctx.model, ctx.selection)
            ]);
            candidates.sort(range_1.Range.compareRangesUsingStarts);
            return candidates[0];
        }
        static moveWordPartLeft(wordSeparators, model, position) {
            const candidates = enforceDefined([
                WordOperations.moveWordLeft(wordSeparators, model, position, 0 /* WordNavigationType.WordStart */),
                WordOperations.moveWordLeft(wordSeparators, model, position, 2 /* WordNavigationType.WordEnd */),
                WordOperations._moveWordPartLeft(model, position)
            ]);
            candidates.sort(position_1.Position.compare);
            return candidates[2];
        }
        static moveWordPartRight(wordSeparators, model, position) {
            const candidates = enforceDefined([
                WordOperations.moveWordRight(wordSeparators, model, position, 0 /* WordNavigationType.WordStart */),
                WordOperations.moveWordRight(wordSeparators, model, position, 2 /* WordNavigationType.WordEnd */),
                WordOperations._moveWordPartRight(model, position)
            ]);
            candidates.sort(position_1.Position.compare);
            return candidates[0];
        }
    }
    exports.WordPartOperations = WordPartOperations;
    function enforceDefined(arr) {
        return arr.filter(el => Boolean(el));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yV29yZE9wZXJhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vY3Vyc29yL2N1cnNvcldvcmRPcGVyYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtDaEcsSUFBVyxRQUlWO0lBSkQsV0FBVyxRQUFRO1FBQ2xCLHVDQUFRLENBQUE7UUFDUiw2Q0FBVyxDQUFBO1FBQ1gsaURBQWEsQ0FBQTtJQUNkLENBQUMsRUFKVSxRQUFRLEtBQVIsUUFBUSxRQUlsQjtJQUVELElBQWtCLGtCQUtqQjtJQUxELFdBQWtCLGtCQUFrQjtRQUNuQyxxRUFBYSxDQUFBO1FBQ2IsNkVBQWlCLENBQUE7UUFDakIsaUVBQVcsQ0FBQTtRQUNYLHFGQUFxQixDQUFBLENBQUMsc0NBQXNDO0lBQzdELENBQUMsRUFMaUIsa0JBQWtCLGtDQUFsQixrQkFBa0IsUUFLbkM7SUFjRCxNQUFhLGNBQWM7UUFFbEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFtQixFQUFFLFFBQWtCLEVBQUUsYUFBaUMsRUFBRSxLQUFhLEVBQUUsR0FBVztZQUNoSSw0R0FBNEc7WUFDNUcsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsQ0FBQztRQUNyRixDQUFDO1FBRU8sTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUE2QixFQUFFLGFBQWlDO1lBQzlGLDhJQUE4STtZQUM5SSxPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsUUFBUSwwQkFBa0IsRUFBRSxhQUFhLEVBQUUs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