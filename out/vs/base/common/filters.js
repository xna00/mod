/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/map", "vs/base/common/naturalLanguage/korean", "vs/base/common/strings"], function (require, exports, map_1, korean_1, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FuzzyScoreOptions = exports.FuzzyScore = exports.matchesPrefix = exports.matchesStrictPrefix = void 0;
    exports.or = or;
    exports.matchesContiguousSubString = matchesContiguousSubString;
    exports.matchesSubString = matchesSubString;
    exports.isUpper = isUpper;
    exports.matchesCamelCase = matchesCamelCase;
    exports.matchesWords = matchesWords;
    exports.matchesFuzzy = matchesFuzzy;
    exports.matchesFuzzy2 = matchesFuzzy2;
    exports.anyScore = anyScore;
    exports.createMatches = createMatches;
    exports.isPatternInWord = isPatternInWord;
    exports.fuzzyScore = fuzzyScore;
    exports.fuzzyScoreGracefulAggressive = fuzzyScoreGracefulAggressive;
    exports.fuzzyScoreGraceful = fuzzyScoreGraceful;
    // Combined filters
    /**
     * @returns A filter which combines the provided set
     * of filters with an or. The *first* filters that
     * matches defined the return value of the returned
     * filter.
     */
    function or(...filter) {
        return function (word, wordToMatchAgainst) {
            for (let i = 0, len = filter.length; i < len; i++) {
                const match = filter[i](word, wordToMatchAgainst);
                if (match) {
                    return match;
                }
            }
            return null;
        };
    }
    // Prefix
    exports.matchesStrictPrefix = _matchesPrefix.bind(undefined, false);
    exports.matchesPrefix = _matchesPrefix.bind(undefined, true);
    function _matchesPrefix(ignoreCase, word, wordToMatchAgainst) {
        if (!wordToMatchAgainst || wordToMatchAgainst.length < word.length) {
            return null;
        }
        let matches;
        if (ignoreCase) {
            matches = strings.startsWithIgnoreCase(wordToMatchAgainst, word);
        }
        else {
            matches = wordToMatchAgainst.indexOf(word) === 0;
        }
        if (!matches) {
            return null;
        }
        return word.length > 0 ? [{ start: 0, end: word.length }] : [];
    }
    // Contiguous Substring
    function matchesContiguousSubString(word, wordToMatchAgainst) {
        const index = wordToMatchAgainst.toLowerCase().indexOf(word.toLowerCase());
        if (index === -1) {
            return null;
        }
        return [{ start: index, end: index + word.length }];
    }
    // Substring
    function matchesSubString(word, wordToMatchAgainst) {
        return _matchesSubString(word.toLowerCase(), wordToMatchAgainst.toLowerCase(), 0, 0);
    }
    function _matchesSubString(word, wordToMatchAgainst, i, j) {
        if (i === word.length) {
            return [];
        }
        else if (j === wordToMatchAgainst.length) {
            return null;
        }
        else {
            if (word[i] === wordToMatchAgainst[j]) {
                let result = null;
                if (result = _matchesSubString(word, wordToMatchAgainst, i + 1, j + 1)) {
                    return join({ start: j, end: j + 1 }, result);
                }
                return null;
            }
            return _matchesSubString(word, wordToMatchAgainst, i, j + 1);
        }
    }
    // CamelCase
    function isLower(code) {
        return 97 /* CharCode.a */ <= code && code <= 122 /* CharCode.z */;
    }
    function isUpper(code) {
        return 65 /* CharCode.A */ <= code && code <= 90 /* CharCode.Z */;
    }
    function isNumber(code) {
        return 48 /* CharCode.Digit0 */ <= code && code <= 57 /* CharCode.Digit9 */;
    }
    function isWhitespace(code) {
        return (code === 32 /* CharCode.Space */
            || code === 9 /* CharCode.Tab */
            || code === 10 /* CharCode.LineFeed */
            || code === 13 /* CharCode.CarriageReturn */);
    }
    const wordSeparators = new Set();
    // These are chosen as natural word separators based on writen text.
    // It is a subset of the word separators used by the monaco editor.
    '()[]{}<>`\'"-/;:,.?!'
        .split('')
        .forEach(s => wordSeparators.add(s.charCodeAt(0)));
    function isWordSeparator(code) {
        return isWhitespace(code) || wordSeparators.has(code);
    }
    function charactersMatch(codeA, codeB) {
        return (codeA === codeB) || (isWordSeparator(codeA) && isWordSeparator(codeB));
    }
    const alternateCharsCache = new Map();
    /**
     * Gets alternative codes to the character code passed in. This comes in the
     * form of an array of character codes, all of which must match _in order_ to
     * successfully match.
     *
     * @param code The character code to check.
     */
    function getAlternateCodes(code) {
        if (alternateCharsCache.has(code)) {
            return alternateCharsCache.get(code);
        }
        // NOTE: This function is written in such a way that it can be extended in
        // the future, but right now the return type takes into account it's only
        // supported by a single "alt codes provider".
        // `ArrayLike<ArrayLike<number>>` is a more appropriate type if changed.
        let result;
        const codes = (0, korean_1.getKoreanAltChars)(code);
        if (codes) {
            result = codes;
        }
        alternateCharsCache.set(code, result);
        return result;
    }
    function isAlphanumeric(code) {
        return isLower(code) || isUpper(code) || isNumber(code);
    }
    function join(head, tail) {
        if (tail.length === 0) {
            tail = [head];
        }
        else if (head.end === tail[0].start) {
            tail[0].start = head.start;
        }
        else {
            tail.unshift(head);
        }
        return tail;
    }
    function nextAnchor(camelCaseWord, start) {
        for (let i = start; i < camelCaseWord.length; i++) {
            const c = camelCaseWord.charCodeAt(i);
            if (isUpper(c) || isNumber(c) || (i > 0 && !isAlphanumeric(camelCaseWord.charCodeAt(i - 1)))) {
                return i;
            }
        }
        return camelCaseWord.length;
    }
    function _matchesCamelCase(word, camelCaseWord, i, j) {
        if (i === word.length) {
            return [];
        }
        else if (j === camelCaseWord.length) {
            return null;
        }
        else if (word[i] !== camelCaseWord[j].toLowerCase()) {
            return null;
        }
        else {
            let result = null;
            let nextUpperIndex = j + 1;
            result = _matchesCamelCase(word, camelCaseWord, i + 1, j + 1);
            while (!result && (nextUpperIndex = nextAnchor(camelCaseWord, nextUpperIndex)) < camelCaseWord.length) {
                result = _matchesCamelCase(word, camelCaseWord, i + 1, nextUpperIndex);
                nextUpperIndex++;
            }
            return result === null ? null : join({ start: j, end: j + 1 }, result);
        }
    }
    // Heuristic to avoid computing camel case matcher for words that don't
    // look like camelCaseWords.
    function analyzeCamelCaseWord(word) {
        let upper = 0, lower = 0, alpha = 0, numeric = 0, code = 0;
        for (let i = 0; i < word.length; i++) {
            code = word.charCodeAt(i);
            if (isUpper(code)) {
                upper++;
            }
            if (isLower(code)) {
                lower++;
            }
            if (isAlphanumeric(code)) {
                alpha++;
            }
            if (isNumber(code)) {
                numeric++;
            }
        }
        const upperPercent = upper / word.length;
        const lowerPercent = lower / word.length;
        const alphaPercent = alpha / word.length;
        const numericPercent = numeric / word.length;
        return { upperPercent, lowerPercent, alphaPercent, numericPercent };
    }
    function isUpperCaseWord(analysis) {
        const { upperPercent, lowerPercent } = analysis;
        return lowerPercent === 0 && upperPercent > 0.6;
    }
    function isCamelCaseWord(analysis) {
        const { upperPercent, lowerPercent, alphaPercent, numericPercent } = analysis;
        return lowerPercent > 0.2 && upperPercent < 0.8 && alphaPercent > 0.6 && numericPercent < 0.2;
    }
    // Heuristic to avoid computing camel case matcher for words that don't
    // look like camel case patterns.
    function isCamelCasePattern(word) {
        let upper = 0, lower = 0, code = 0, whitespace = 0;
        for (let i = 0; i < word.length; i++) {
            code = word.charCodeAt(i);
            if (isUpper(code)) {
                upper++;
            }
            if (isLower(code)) {
                lower++;
            }
            if (isWhitespace(code)) {
                whitespace++;
            }
        }
        if ((upper === 0 || lower === 0) && whitespace === 0) {
            return word.length <= 30;
        }
        else {
            return upper <= 5;
        }
    }
    function matchesCamelCase(word, camelCaseWord) {
        if (!camelCaseWord) {
            return null;
        }
        camelCaseWord = camelCaseWord.trim();
        if (camelCaseWord.length === 0) {
            return null;
        }
        if (!isCamelCasePattern(word)) {
            return null;
        }
        // TODO: Consider removing this check
        if (camelCaseWord.length > 60) {
            camelCaseWord = camelCaseWord.substring(0, 60);
        }
        const analysis = analyzeCamelCaseWord(camelCaseWord);
        if (!isCamelCaseWord(analysis)) {
            if (!isUpperCaseWord(analysis)) {
                return null;
            }
            camelCaseWord = camelCaseWord.toLowerCase();
        }
        let result = null;
        let i = 0;
        word = word.toLowerCase();
        while (i < camelCaseWord.length && (result = _matchesCamelCase(word, camelCaseWord, 0, i)) === null) {
            i = nextAnchor(camelCaseWord, i + 1);
        }
        return result;
    }
    // Matches beginning of words supporting non-ASCII languages
    // If `contiguous` is true then matches word with beginnings of the words in the target. E.g. "pul" will match "Git: Pull"
    // Otherwise also matches sub string of the word with beginnings of the words in the target. E.g. "gp" or "g p" will match "Git: Pull"
    // Useful in cases where the target is words (e.g. command labels)
    function matchesWords(word, target, contiguous = false) {
        if (!target || target.length === 0) {
            return null;
        }
        let result = null;
        let targetIndex = 0;
        word = word.toLowerCase();
        target = target.toLowerCase();
        while (targetIndex < target.length) {
            result = _matchesWords(word, target, 0, targetIndex, contiguous);
            if (result !== null) {
                break;
            }
            targetIndex = nextWord(target, targetIndex + 1);
        }
        return result;
    }
    function _matchesWords(word, target, wordIndex, targetIndex, contiguous) {
        let targetIndexOffset = 0;
        if (wordIndex === word.length) {
            return [];
        }
        else if (targetIndex === target.length) {
            return null;
        }
        else if (!charactersMatch(word.charCodeAt(wordIndex), target.charCodeAt(targetIndex))) {
            // Verify alternate characters before exiting
            const altChars = getAlternateCodes(word.charCodeAt(wordIndex));
            if (!altChars) {
                return null;
            }
            for (let k = 0; k < altChars.length; k++) {
                if (!charactersMatch(altChars[k], target.charCodeAt(targetIndex + k))) {
                    return null;
                }
            }
            targetIndexOffset += altChars.length - 1;
        }
        let result = null;
        let nextWordIndex = targetIndex + targetIndexOffset + 1;
        result = _matchesWords(word, target, wordIndex + 1, nextWordIndex, contiguous);
        if (!contiguous) {
            while (!result && (nextWordIndex = nextWord(target, nextWordIndex)) < target.length) {
                result = _matchesWords(word, target, wordIndex + 1, nextWordIndex, contiguous);
                nextWordIndex++;
            }
        }
        if (!result) {
            return null;
        }
        // If the characters don't exactly match, then they must be word separators (see charactersMatch(...)).
        // We don't want to include this in the matches but we don't want to throw the target out all together so we return `result`.
        if (word.charCodeAt(wordIndex) !== target.charCodeAt(targetIndex)) {
            // Verify alternate characters before exiting
            const altChars = getAlternateCodes(word.charCodeAt(wordIndex));
            if (!altChars) {
                return result;
            }
            for (let k = 0; k < altChars.length; k++) {
                if (altChars[k] !== target.charCodeAt(targetIndex + k)) {
                    return result;
                }
            }
        }
        return join({ start: targetIndex, end: targetIndex + targetIndexOffset + 1 }, result);
    }
    function nextWord(word, start) {
        for (let i = start; i < word.length; i++) {
            if (isWordSeparator(word.charCodeAt(i)) ||
                (i > 0 && isWordSeparator(word.charCodeAt(i - 1)))) {
                return i;
            }
        }
        return word.length;
    }
    // Fuzzy
    const fuzzyContiguousFilter = or(exports.matchesPrefix, matchesCamelCase, matchesContiguousSubString);
    const fuzzySeparateFilter = or(exports.matchesPrefix, matchesCamelCase, matchesSubString);
    const fuzzyRegExpCache = new map_1.LRUCache(10000); // bounded to 10000 elements
    function matchesFuzzy(word, wordToMatchAgainst, enableSeparateSubstringMatching = false) {
        if (typeof word !== 'string' || typeof wordToMatchAgainst !== 'string') {
            return null; // return early for invalid input
        }
        // Form RegExp for wildcard matches
        let regexp = fuzzyRegExpCache.get(word);
        if (!regexp) {
            regexp = new RegExp(strings.convertSimple2RegExpPattern(word), 'i');
            fuzzyRegExpCache.set(word, regexp);
        }
        // RegExp Filter
        const match = regexp.exec(wordToMatchAgainst);
        if (match) {
            return [{ start: match.index, end: match.index + match[0].length }];
        }
        // Default Filter
        return enableSeparateSubstringMatching ? fuzzySeparateFilter(word, wordToMatchAgainst) : fuzzyContiguousFilter(word, wordToMatchAgainst);
    }
    /**
     * Match pattern against word in a fuzzy way. As in IntelliSense and faster and more
     * powerful than `matchesFuzzy`
     */
    function matchesFuzzy2(pattern, word) {
        const score = fuzzyScore(pattern, pattern.toLowerCase(), 0, word, word.toLowerCase(), 0, { firstMatchCanBeWeak: true, boostFullMatch: true });
        return score ? createMatches(score) : null;
    }
    function anyScore(pattern, lowPattern, patternPos, word, lowWord, wordPos) {
        const max = Math.min(13, pattern.length);
        for (; patternPos < max; patternPos++) {
            const result = fuzzyScore(pattern, lowPattern, patternPos, word, lowWord, wordPos, { firstMatchCanBeWeak: true, boostFullMatch: true });
            if (result) {
                return result;
            }
        }
        return [0, wordPos];
    }
    //#region --- fuzzyScore ---
    function createMatches(score) {
        if (typeof score === 'undefined') {
            return [];
        }
        const res = [];
        const wordPos = score[1];
        for (let i = score.length - 1; i > 1; i--) {
            const pos = score[i] + wordPos;
            const last = res[res.length - 1];
            if (last && last.end === pos) {
                last.end = pos + 1;
            }
            else {
                res.push({ start: pos, end: pos + 1 });
            }
        }
        return res;
    }
    const _maxLen = 128;
    function initTable() {
        const table = [];
        const row = [];
        for (let i = 0; i <= _maxLen; i++) {
            row[i] = 0;
        }
        for (let i = 0; i <= _maxLen; i++) {
            table.push(row.slice(0));
        }
        return table;
    }
    function initArr(maxLen) {
        const row = [];
        for (let i = 0; i <= maxLen; i++) {
            row[i] = 0;
        }
        return row;
    }
    const _minWordMatchPos = initArr(2 * _maxLen); // min word position for a certain pattern position
    const _maxWordMatchPos = initArr(2 * _maxLen); // max word position for a certain pattern position
    const _diag = initTable(); // the length of a contiguous diagonal match
    const _table = initTable();
    const _arrows = initTable();
    const _debug = false;
    function printTable(table, pattern, patternLen, word, wordLen) {
        function pad(s, n, pad = ' ') {
            while (s.length < n) {
                s = pad + s;
            }
            return s;
        }
        let ret = ` |   |${word.split('').map(c => pad(c, 3)).join('|')}\n`;
        for (let i = 0; i <= patternLen; i++) {
            if (i === 0) {
                ret += ' |';
            }
            else {
                ret += `${pattern[i - 1]}|`;
            }
            ret += table[i].slice(0, wordLen + 1).map(n => pad(n.toString(), 3)).join('|') + '\n';
        }
        return ret;
    }
    function printTables(pattern, patternStart, word, wordStart) {
        pattern = pattern.substr(patternStart);
        word = word.substr(wordStart);
        console.log(printTable(_table, pattern, pattern.length, word, word.length));
        console.log(printTable(_arrows, pattern, pattern.length, word, word.length));
        console.log(printTable(_diag, pattern, pattern.length, word, word.length));
    }
    function isSeparatorAtPos(value, index) {
        if (index < 0 || index >= value.length) {
            return false;
        }
        const code = value.codePointAt(index);
        switch (code) {
            case 95 /* CharCode.Underline */:
            case 45 /* CharCode.Dash */:
            case 46 /* CharCode.Period */:
            case 32 /* CharCode.Space */:
            case 47 /* CharCode.Slash */:
            case 92 /* CharCode.Backslash */:
            case 39 /* CharCode.SingleQuote */:
            case 34 /* CharCode.DoubleQuote */:
            case 58 /* CharCode.Colon */:
            case 36 /* CharCode.DollarSign */:
            case 60 /* CharCode.LessThan */:
            case 62 /* CharCode.GreaterThan */:
            case 40 /* CharCode.OpenParen */:
            case 41 /* CharCode.CloseParen */:
            case 91 /* CharCode.OpenSquareBracket */:
            case 93 /* CharCode.CloseSquareBracket */:
            case 123 /* CharCode.OpenCurlyBrace */:
            case 125 /* CharCode.CloseCurlyBrace */:
                return true;
            case undefined:
                return false;
            default:
                if (strings.isEmojiImprecise(code)) {
                    return true;
                }
                return false;
        }
    }
    function isWhitespaceAtPos(value, index) {
        if (index < 0 || index >= value.length) {
            return false;
        }
        const code = value.charCodeAt(index);
        switch (code) {
            case 32 /* CharCode.Space */:
            case 9 /* CharCode.Tab */:
                return true;
            default:
                return false;
        }
    }
    function isUpperCaseAtPos(pos, word, wordLow) {
        return word[pos] !== wordLow[pos];
    }
    function isPatternInWord(patternLow, patternPos, patternLen, wordLow, wordPos, wordLen, fillMinWordPosArr = false) {
        while (patternPos < patternLen && wordPos < wordLen) {
            if (patternLow[patternPos] === wordLow[wordPos]) {
                if (fillMinWordPosArr) {
                    // Remember the min word position for each pattern position
                    _minWordMatchPos[patternPos] = wordPos;
                }
                patternPos += 1;
            }
            wordPos += 1;
        }
        return patternPos === patternLen; // pattern must be exhausted
    }
    var Arrow;
    (function (Arrow) {
        Arrow[Arrow["Diag"] = 1] = "Diag";
        Arrow[Arrow["Left"] = 2] = "Left";
        Arrow[Arrow["LeftLeft"] = 3] = "LeftLeft";
    })(Arrow || (Arrow = {}));
    var FuzzyScore;
    (function (FuzzyScore) {
        /**
         * No matches and value `-100`
         */
        FuzzyScore.Default = ([-100, 0]);
        function isDefault(score) {
            return !score || (score.length === 2 && score[0] === -100 && score[1] === 0);
        }
        FuzzyScore.isDefault = isDefault;
    })(FuzzyScore || (exports.FuzzyScore = FuzzyScore = {}));
    class FuzzyScoreOptions {
        static { this.default = { boostFullMatch: true, firstMatchCanBeWeak: false }; }
        constructor(firstMatchCanBeWeak, boostFullMatch) {
            this.firstMatchCanBeWeak = firstMatchCanBeWeak;
            this.boostFullMatch = boostFullMatch;
        }
    }
    exports.FuzzyScoreOptions = FuzzyScoreOptions;
    function fuzzyScore(pattern, patternLow, patternStart, word, wordLow, wordStart, options = FuzzyScoreOptions.default) {
        const patternLen = pattern.length > _maxLen ? _maxLen : pattern.length;
        const wordLen = word.length > _maxLen ? _maxLen : word.length;
        if (patternStart >= patternLen || wordStart >= wordLen || (patternLen - patternStart) > (wordLen - wordStart)) {
            return undefined;
        }
        // Run a simple check if the characters of pattern occur
        // (in order) at all in word. If that isn't the case we
        // stop because no match will be possible
        if (!isPatternInWord(patternLow, patternStart, patternLen, wordLow, wordStart, wordLen, true)) {
            return undefined;
        }
        // Find the max matching word position for each pattern position
        // NOTE: the min matching word position was filled in above, in the `isPatternInWord` call
        _fillInMaxWordMatchPos(patternLen, wordLen, patternStart, wordStart, patternLow, wordLow);
        let row = 1;
        let column = 1;
        let patternPos = patternStart;
        let wordPos = wordStart;
        const hasStrongFirstMatch = [false];
        // There will be a match, fill in tables
        for (row = 1, patternPos = patternStart; patternPos < patternLen; row++, patternPos++) {
            // Reduce search space to possible matching word positions and to possible access from next row
            const minWordMatchPos = _minWordMatchPos[patternPos];
            const maxWordMatchPos = _maxWordMatchPos[patternPos];
            const nextMaxWordMatchPos = (patternPos + 1 < patternLen ? _maxWordMatchPos[patternPos + 1] : wordLen);
            for (column = minWordMatchPos - wordStart + 1, wordPos = minWordMatchPos; wordPos < nextMaxWordMatchPos; column++, wordPos++) {
                let score = Number.MIN_SAFE_INTEGER;
                let canComeDiag = false;
                if (wordPos <= maxWordMatchPos) {
                    score = _doScore(pattern, patternLow, patternPos, patternStart, word, wordLow, wordPos, wordLen, wordStart, _diag[row - 1][column - 1] === 0, hasStrongFirstMatch);
                }
                let diagScore = 0;
                if (score !== Number.MAX_SAFE_INTEGER) {
                    canComeDiag = true;
                    diagScore = score + _table[row - 1][column - 1];
                }
                const canComeLeft = wordPos > minWordMatchPos;
                const leftScore = canComeLeft ? _table[row][column - 1] + (_diag[row][column - 1] > 0 ? -5 : 0) : 0; // penalty for a gap start
                const canComeLeftLeft = wordPos > minWordMatchPos + 1 && _diag[row][column - 1] > 0;
                const leftLeftScore = canComeLeftLeft ? _table[row][column - 2] + (_diag[row][column - 2] > 0 ? -5 : 0) : 0; // penalty for a gap start
                if (canComeLeftLeft && (!canComeLeft || leftLeftScore >= leftScore) && (!canComeDiag || leftLeftScore >= diagScore)) {
                    // always prefer choosing left left to jump over a diagonal because that means a match is earlier in the word
                    _table[row][column] = leftLeftScore;
                    _arrows[row][column] = 3 /* Arrow.LeftLeft */;
                    _diag[row][column] = 0;
                }
                else if (canComeLeft && (!canComeDiag || leftScore >= diagScore)) {
                    // always prefer choosing left since that means a match is earlier in the word
                    _table[row][column] = leftScore;
                    _arrows[row][column] = 2 /* Arrow.Left */;
                    _diag[row][column] = 0;
                }
                else if (canComeDiag) {
                    _table[row][column] = diagScore;
                    _arrows[row][column] = 1 /* Arrow.Diag */;
                    _diag[row][column] = _diag[row - 1][column - 1] + 1;
                }
                else {
                    throw new Error(`not possible`);
                }
            }
        }
        if (_debug) {
            printTables(pattern, patternStart, word, wordStart);
        }
        if (!hasStrongFirstMatch[0] && !options.firstMatchCanBeWeak) {
            return undefined;
        }
        row--;
        column--;
        const result = [_table[row][column], wordStart];
        let backwardsDiagLength = 0;
        let maxMatchColumn = 0;
        while (row >= 1) {
            // Find the column where we go diagonally up
            let diagColumn = column;
            do {
                const arrow = _arrows[row][diagColumn];
                if (arrow === 3 /* Arrow.LeftLeft */) {
                    diagColumn = diagColumn - 2;
                }
                else if (arrow === 2 /* Arrow.Left */) {
                    diagColumn = diagColumn - 1;
                }
                else {
                    // found the diagonal
                    break;
                }
            } while (diagColumn >= 1);
            // Overturn the "forwards" decision if keeping the "backwards" diagonal would give a better match
            if (backwardsDiagLength > 1 // only if we would have a contiguous match of 3 characters
                && patternLow[patternStart + row - 1] === wordLow[wordStart + column - 1] // only if we can do a contiguous match diagonally
                && !isUpperCaseAtPos(diagColumn + wordStart - 1, word, wordLow) // only if the forwards chose diagonal is not an uppercase
                && backwardsDiagLength + 1 > _diag[row][diagColumn] // only if our contiguous match would be longer than the "forwards" contiguous match
            ) {
                diagColumn = column;
            }
            if (diagColumn === column) {
                // this is a contiguous match
                backwardsDiagLength++;
            }
            else {
                backwardsDiagLength = 1;
            }
            if (!maxMatchColumn) {
                // remember the last matched column
                maxMatchColumn = diagColumn;
            }
            row--;
            column = diagColumn - 1;
            result.push(column);
        }
        if (wordLen === patternLen && options.boostFullMatch) {
            // the word matches the pattern with all characters!
            // giving the score a total match boost (to come up ahead other words)
            result[0] += 2;
        }
        // Add 1 penalty for each skipped character in the word
        const skippedCharsCount = maxMatchColumn - patternLen;
        result[0] -= skippedCharsCount;
        return result;
    }
    function _fillInMaxWordMatchPos(patternLen, wordLen, patternStart, wordStart, patternLow, wordLow) {
        let patternPos = patternLen - 1;
        let wordPos = wordLen - 1;
        while (patternPos >= patternStart && wordPos >= wordStart) {
            if (patternLow[patternPos] === wordLow[wordPos]) {
                _maxWordMatchPos[patternPos] = wordPos;
                patternPos--;
            }
            wordPos--;
        }
    }
    function _doScore(pattern, patternLow, patternPos, patternStart, word, wordLow, wordPos, wordLen, wordStart, newMatchStart, outFirstMatchStrong) {
        if (patternLow[patternPos] !== wordLow[wordPos]) {
            return Number.MIN_SAFE_INTEGER;
        }
        let score = 1;
        let isGapLocation = false;
        if (wordPos === (patternPos - patternStart)) {
            // common prefix: `foobar <-> foobaz`
            //                            ^^^^^
            score = pattern[patternPos] === word[wordPos] ? 7 : 5;
        }
        else if (isUpperCaseAtPos(wordPos, word, wordLow) && (wordPos === 0 || !isUpperCaseAtPos(wordPos - 1, word, wordLow))) {
            // hitting upper-case: `foo <-> forOthers`
            //                              ^^ ^
            score = pattern[patternPos] === word[wordPos] ? 7 : 5;
            isGapLocation = true;
        }
        else if (isSeparatorAtPos(wordLow, wordPos) && (wordPos === 0 || !isSeparatorAtPos(wordLow, wordPos - 1))) {
            // hitting a separator: `. <-> foo.bar`
            //                                ^
            score = 5;
        }
        else if (isSeparatorAtPos(wordLow, wordPos - 1) || isWhitespaceAtPos(wordLow, wordPos - 1)) {
            // post separator: `foo <-> bar_foo`
            //                              ^^^
            score = 5;
            isGapLocation = true;
        }
        if (score > 1 && patternPos === patternStart) {
            outFirstMatchStrong[0] = true;
        }
        if (!isGapLocation) {
            isGapLocation = isUpperCaseAtPos(wordPos, word, wordLow) || isSeparatorAtPos(wordLow, wordPos - 1) || isWhitespaceAtPos(wordLow, wordPos - 1);
        }
        //
        if (patternPos === patternStart) { // first character in pattern
            if (wordPos > wordStart) {
                // the first pattern character would match a word character that is not at the word start
                // so introduce a penalty to account for the gap preceding this match
                score -= isGapLocation ? 3 : 5;
            }
        }
        else {
            if (newMatchStart) {
                // this would be the beginning of a new match (i.e. there would be a gap before this location)
                score += isGapLocation ? 2 : 0;
            }
            else {
                // this is part of a contiguous match, so give it a slight bonus, but do so only if it would not be a preferred gap location
                score += isGapLocation ? 0 : 1;
            }
        }
        if (wordPos + 1 === wordLen) {
            // we always penalize gaps, but this gives unfair advantages to a match that would match the last character in the word
            // so pretend there is a gap after the last character in the word to normalize things
            score -= isGapLocation ? 3 : 5;
        }
        return score;
    }
    //#endregion
    //#region --- graceful ---
    function fuzzyScoreGracefulAggressive(pattern, lowPattern, patternPos, word, lowWord, wordPos, options) {
        return fuzzyScoreWithPermutations(pattern, lowPattern, patternPos, word, lowWord, wordPos, true, options);
    }
    function fuzzyScoreGraceful(pattern, lowPattern, patternPos, word, lowWord, wordPos, options) {
        return fuzzyScoreWithPermutations(pattern, lowPattern, patternPos, word, lowWord, wordPos, false, options);
    }
    function fuzzyScoreWithPermutations(pattern, lowPattern, patternPos, word, lowWord, wordPos, aggressive, options) {
        let top = fuzzyScore(pattern, lowPattern, patternPos, word, lowWord, wordPos, options);
        if (top && !aggressive) {
            // when using the original pattern yield a result we`
            // return it unless we are aggressive and try to find
            // a better alignment, e.g. `cno` -> `^co^ns^ole` or `^c^o^nsole`.
            return top;
        }
        if (pattern.length >= 3) {
            // When the pattern is long enough then try a few (max 7)
            // permutations of the pattern to find a better match. The
            // permutations only swap neighbouring characters, e.g
            // `cnoso` becomes `conso`, `cnsoo`, `cnoos`.
            const tries = Math.min(7, pattern.length - 1);
            for (let movingPatternPos = patternPos + 1; movingPatternPos < tries; movingPatternPos++) {
                const newPattern = nextTypoPermutation(pattern, movingPatternPos);
                if (newPattern) {
                    const candidate = fuzzyScore(newPattern, newPattern.toLowerCase(), patternPos, word, lowWord, wordPos, options);
                    if (candidate) {
                        candidate[0] -= 3; // permutation penalty
                        if (!top || candidate[0] > top[0]) {
                            top = candidate;
                        }
                    }
                }
            }
        }
        return top;
    }
    function nextTypoPermutation(pattern, patternPos) {
        if (patternPos + 1 >= pattern.length) {
            return undefined;
        }
        const swap1 = pattern[patternPos];
        const swap2 = pattern[patternPos + 1];
        if (swap1 === swap2) {
            return undefined;
        }
        return pattern.slice(0, patternPos)
            + swap2
            + swap1
            + pattern.slice(patternPos + 2);
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsdGVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vZmlsdGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5QmhHLGdCQVVDO0lBNEJELGdFQU9DO0lBSUQsNENBRUM7SUEwQkQsMEJBRUM7SUFnS0QsNENBdUNDO0lBT0Qsb0NBbUJDO0lBdUVELG9DQW9CQztJQU1ELHNDQUdDO0lBRUQsNEJBU0M7SUFJRCxzQ0FnQkM7SUFnSEQsMENBWUM7SUF3Q0QsZ0NBc0pDO0lBd0ZELG9FQUVDO0lBRUQsZ0RBRUM7SUFuMUJELG1CQUFtQjtJQUVuQjs7Ozs7T0FLRztJQUNILFNBQWdCLEVBQUUsQ0FBQyxHQUFHLE1BQWlCO1FBQ3RDLE9BQU8sVUFBVSxJQUFZLEVBQUUsa0JBQTBCO1lBQ3hELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUNYLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDLENBQUM7SUFDSCxDQUFDO0lBRUQsU0FBUztJQUVJLFFBQUEsbUJBQW1CLEdBQVksY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDckUsUUFBQSxhQUFhLEdBQVksY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFFM0UsU0FBUyxjQUFj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