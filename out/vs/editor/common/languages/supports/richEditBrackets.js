/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/stringBuilder", "vs/editor/common/core/range"], function (require, exports, strings, stringBuilder, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BracketsUtils = exports.RichEditBrackets = exports.RichEditBracket = void 0;
    /**
     * Represents a grouping of colliding bracket pairs.
     *
     * Most of the times this contains a single bracket pair,
     * but sometimes this contains multiple bracket pairs in cases
     * where the same string appears as a closing bracket for multiple
     * bracket pairs, or the same string appears an opening bracket for
     * multiple bracket pairs.
     *
     * e.g. of a group containing a single pair:
     *   open: ['{'], close: ['}']
     *
     * e.g. of a group containing multiple pairs:
     *   open: ['if', 'for'], close: ['end', 'end']
     */
    class RichEditBracket {
        constructor(languageId, index, open, close, forwardRegex, reversedRegex) {
            this._richEditBracketBrand = undefined;
            this.languageId = languageId;
            this.index = index;
            this.open = open;
            this.close = close;
            this.forwardRegex = forwardRegex;
            this.reversedRegex = reversedRegex;
            this._openSet = RichEditBracket._toSet(this.open);
            this._closeSet = RichEditBracket._toSet(this.close);
        }
        /**
         * Check if the provided `text` is an open bracket in this group.
         */
        isOpen(text) {
            return this._openSet.has(text);
        }
        /**
         * Check if the provided `text` is a close bracket in this group.
         */
        isClose(text) {
            return this._closeSet.has(text);
        }
        static _toSet(arr) {
            const result = new Set();
            for (const element of arr) {
                result.add(element);
            }
            return result;
        }
    }
    exports.RichEditBracket = RichEditBracket;
    /**
     * Groups together brackets that have equal open or close sequences.
     *
     * For example, if the following brackets are defined:
     *   ['IF','END']
     *   ['for','end']
     *   ['{','}']
     *
     * Then the grouped brackets would be:
     *   { open: ['if', 'for'], close: ['end', 'end'] }
     *   { open: ['{'], close: ['}'] }
     *
     */
    function groupFuzzyBrackets(brackets) {
        const N = brackets.length;
        brackets = brackets.map(b => [b[0].toLowerCase(), b[1].toLowerCase()]);
        const group = [];
        for (let i = 0; i < N; i++) {
            group[i] = i;
        }
        const areOverlapping = (a, b) => {
            const [aOpen, aClose] = a;
            const [bOpen, bClose] = b;
            return (aOpen === bOpen || aOpen === bClose || aClose === bOpen || aClose === bClose);
        };
        const mergeGroups = (g1, g2) => {
            const newG = Math.min(g1, g2);
            const oldG = Math.max(g1, g2);
            for (let i = 0; i < N; i++) {
                if (group[i] === oldG) {
                    group[i] = newG;
                }
            }
        };
        // group together brackets that have the same open or the same close sequence
        for (let i = 0; i < N; i++) {
            const a = brackets[i];
            for (let j = i + 1; j < N; j++) {
                const b = brackets[j];
                if (areOverlapping(a, b)) {
                    mergeGroups(group[i], group[j]);
                }
            }
        }
        const result = [];
        for (let g = 0; g < N; g++) {
            const currentOpen = [];
            const currentClose = [];
            for (let i = 0; i < N; i++) {
                if (group[i] === g) {
                    const [open, close] = brackets[i];
                    currentOpen.push(open);
                    currentClose.push(close);
                }
            }
            if (currentOpen.length > 0) {
                result.push({
                    open: currentOpen,
                    close: currentClose
                });
            }
        }
        return result;
    }
    class RichEditBrackets {
        constructor(languageId, _brackets) {
            this._richEditBracketsBrand = undefined;
            const brackets = groupFuzzyBrackets(_brackets);
            this.brackets = brackets.map((b, index) => {
                return new RichEditBracket(languageId, index, b.open, b.close, getRegexForBracketPair(b.open, b.close, brackets, index), getReversedRegexForBracketPair(b.open, b.close, brackets, index));
            });
            this.forwardRegex = getRegexForBrackets(this.brackets);
            this.reversedRegex = getReversedRegexForBrackets(this.brackets);
            this.textIsBracket = {};
            this.textIsOpenBracket = {};
            this.maxBracketLength = 0;
            for (const bracket of this.brackets) {
                for (const open of bracket.open) {
                    this.textIsBracket[open] = bracket;
                    this.textIsOpenBracket[open] = true;
                    this.maxBracketLength = Math.max(this.maxBracketLength, open.length);
                }
                for (const close of bracket.close) {
                    this.textIsBracket[close] = bracket;
                    this.textIsOpenBracket[close] = false;
                    this.maxBracketLength = Math.max(this.maxBracketLength, close.length);
                }
            }
        }
    }
    exports.RichEditBrackets = RichEditBrackets;
    function collectSuperstrings(str, brackets, currentIndex, dest) {
        for (let i = 0, len = brackets.length; i < len; i++) {
            if (i === currentIndex) {
                continue;
            }
            const bracket = brackets[i];
            for (const open of bracket.open) {
                if (open.indexOf(str) >= 0) {
                    dest.push(open);
                }
            }
            for (const close of bracket.close) {
                if (close.indexOf(str) >= 0) {
                    dest.push(close);
                }
            }
        }
    }
    function lengthcmp(a, b) {
        return a.length - b.length;
    }
    function unique(arr) {
        if (arr.length <= 1) {
            return arr;
        }
        const result = [];
        const seen = new Set();
        for (const element of arr) {
            if (seen.has(element)) {
                continue;
            }
            result.push(element);
            seen.add(element);
        }
        return result;
    }
    /**
     * Create a regular expression that can be used to search forward in a piece of text
     * for a group of bracket pairs. But this regex must be built in a way in which
     * it is aware of the other bracket pairs defined for the language.
     *
     * For example, if a language contains the following bracket pairs:
     *   ['begin', 'end']
     *   ['if', 'end if']
     * The two bracket pairs do not collide because no open or close brackets are equal.
     * So the function getRegexForBracketPair is called twice, once with
     * the ['begin'], ['end'] group consisting of one bracket pair, and once with
     * the ['if'], ['end if'] group consiting of the other bracket pair.
     *
     * But there could be a situation where an occurrence of 'end if' is mistaken
     * for an occurrence of 'end'.
     *
     * Therefore, for the bracket pair ['begin', 'end'], the regex will also
     * target 'end if'. The regex will be something like:
     *   /(\bend if\b)|(\bend\b)|(\bif\b)/
     *
     * The regex also searches for "superstrings" (other brackets that might be mistaken with the current bracket).
     *
     */
    function getRegexForBracketPair(open, close, brackets, currentIndex) {
        // search in all brackets for other brackets that are a superstring of these brackets
        let pieces = [];
        pieces = pieces.concat(open);
        pieces = pieces.concat(close);
        for (let i = 0, len = pieces.length; i < len; i++) {
            collectSuperstrings(pieces[i], brackets, currentIndex, pieces);
        }
        pieces = unique(pieces);
        pieces.sort(lengthcmp);
        pieces.reverse();
        return createBracketOrRegExp(pieces);
    }
    /**
     * Matching a regular expression in JS can only be done "forwards". So JS offers natively only
     * methods to find the first match of a regex in a string. But sometimes, it is useful to
     * find the last match of a regex in a string. For such a situation, a nice solution is to
     * simply reverse the string and then search for a reversed regex.
     *
     * This function also has the fine details of `getRegexForBracketPair`. For the same example
     * given above, the regex produced here would look like:
     *   /(\bfi dne\b)|(\bdne\b)|(\bfi\b)/
     */
    function getReversedRegexForBracketPair(open, close, brackets, currentIndex) {
        // search in all brackets for other brackets that are a superstring of these brackets
        let pieces = [];
        pieces = pieces.concat(open);
        pieces = pieces.concat(close);
        for (let i = 0, len = pieces.length; i < len; i++) {
            collectSuperstrings(pieces[i], brackets, currentIndex, pieces);
        }
        pieces = unique(pieces);
        pieces.sort(lengthcmp);
        pieces.reverse();
        return createBracketOrRegExp(pieces.map(toReversedString));
    }
    /**
     * Creates a regular expression that targets all bracket pairs.
     *
     * e.g. for the bracket pairs:
     *  ['{','}']
     *  ['begin,'end']
     *  ['for','end']
     * the regex would look like:
     *  /(\{)|(\})|(\bbegin\b)|(\bend\b)|(\bfor\b)/
     */
    function getRegexForBrackets(brackets) {
        let pieces = [];
        for (const bracket of brackets) {
            for (const open of bracket.open) {
                pieces.push(open);
            }
            for (const close of bracket.close) {
                pieces.push(close);
            }
        }
        pieces = unique(pieces);
        return createBracketOrRegExp(pieces);
    }
    /**
     * Matching a regular expression in JS can only be done "forwards". So JS offers natively only
     * methods to find the first match of a regex in a string. But sometimes, it is useful to
     * find the last match of a regex in a string. For such a situation, a nice solution is to
     * simply reverse the string and then search for a reversed regex.
     *
     * e.g. for the bracket pairs:
     *  ['{','}']
     *  ['begin,'end']
     *  ['for','end']
     * the regex would look like:
     *  /(\{)|(\})|(\bnigeb\b)|(\bdne\b)|(\brof\b)/
     */
    function getReversedRegexForBrackets(brackets) {
        let pieces = [];
        for (const bracket of brackets) {
            for (const open of bracket.open) {
                pieces.push(open);
            }
            for (const close of bracket.close) {
                pieces.push(close);
            }
        }
        pieces = unique(pieces);
        return createBracketOrRegExp(pieces.map(toReversedString));
    }
    function prepareBracketForRegExp(str) {
        // This bracket pair uses letters like e.g. "begin" - "end"
        const insertWordBoundaries = (/^[\w ]+$/.test(str));
        str = strings.escapeRegExpCharacters(str);
        return (insertWordBoundaries ? `\\b${str}\\b` : str);
    }
    function createBracketOrRegExp(pieces) {
        const regexStr = `(${pieces.map(prepareBracketForRegExp).join(')|(')})`;
        return strings.createRegExp(regexStr, true);
    }
    const toReversedString = (function () {
        function reverse(str) {
            // create a Uint16Array and then use a TextDecoder to create a string
            const arr = new Uint16Array(str.length);
            let offset = 0;
            for (let i = str.length - 1; i >= 0; i--) {
                arr[offset++] = str.charCodeAt(i);
            }
            return stringBuilder.getPlatformTextDecoder().decode(arr);
        }
        let lastInput = null;
        let lastOutput = null;
        return function toReversedString(str) {
            if (lastInput !== str) {
                lastInput = str;
                lastOutput = reverse(lastInput);
            }
            return lastOutput;
        };
    })();
    class BracketsUtils {
        static _findPrevBracketInText(reversedBracketRegex, lineNumber, reversedText, offset) {
            const m = reversedText.match(reversedBracketRegex);
            if (!m) {
                return null;
            }
            const matchOffset = reversedText.length - (m.index || 0);
            const matchLength = m[0].length;
            const absoluteMatchOffset = offset + matchOffset;
            return new range_1.Range(lineNumber, absoluteMatchOffset - matchLength + 1, lineNumber, absoluteMatchOffset + 1);
        }
        static findPrevBracketInRange(reversedBracketRegex, lineNumber, lineText, startOffset, endOffset) {
            // Because JS does not support backwards regex search, we search forwards in a reversed string with a reversed regex ;)
            const reversedLineText = toReversedString(lineText);
            const reversedSubstr = reversedLineText.substring(lineText.length - endOffset, lineText.length - startOffset);
            return this._findPrevBracketInText(reversedBracketRegex, lineNumber, reversedSubstr, startOffset);
        }
        static findNextBracketInText(bracketRegex, lineNumber, text, offset) {
            const m = text.match(bracketRegex);
            if (!m) {
                return null;
            }
            const matchOffset = m.index || 0;
            const matchLength = m[0].length;
            if (matchLength === 0) {
                return null;
            }
            const absoluteMatchOffset = offset + matchOffset;
            return new range_1.Range(lineNumber, absoluteMatchOffset + 1, lineNumber, absoluteMatchOffset + 1 + matchLength);
        }
        static findNextBracketInRange(bracketRegex, lineNumber, lineText, startOffset, endOffset) {
            const substr = lineText.substring(startOffset, endOffset);
            return this.findNextBracketInText(bracketRegex, lineNumber, substr, startOffset);
        }
    }
    exports.BracketsUtils = BracketsUtils;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmljaEVkaXRCcmFja2V0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9sYW5ndWFnZXMvc3VwcG9ydHMvcmljaEVkaXRCcmFja2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEc7Ozs7Ozs7Ozs7Ozs7O09BY0c7SUFDSCxNQUFhLGVBQWU7UUFpRDNCLFlBQVksVUFBa0IsRUFBRSxLQUFhLEVBQUUsSUFBYyxFQUFFLEtBQWUsRUFBRSxZQUFvQixFQUFFLGFBQXFCO1lBaEQzSCwwQkFBcUIsR0FBUyxTQUFTLENBQUM7WUFpRHZDLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBQzdCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1lBQ25DLElBQUksQ0FBQyxRQUFRLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBRUQ7O1dBRUc7UUFDSSxNQUFNLENBQUMsSUFBWTtZQUN6QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFFRDs7V0FFRztRQUNJLE9BQU8sQ0FBQyxJQUFZO1lBQzFCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENB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