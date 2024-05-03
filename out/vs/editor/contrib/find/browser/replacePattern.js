/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/search"], function (require, exports, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplacePiece = exports.ReplacePattern = void 0;
    exports.parseReplaceString = parseReplaceString;
    var ReplacePatternKind;
    (function (ReplacePatternKind) {
        ReplacePatternKind[ReplacePatternKind["StaticValue"] = 0] = "StaticValue";
        ReplacePatternKind[ReplacePatternKind["DynamicPieces"] = 1] = "DynamicPieces";
    })(ReplacePatternKind || (ReplacePatternKind = {}));
    /**
     * Assigned when the replace pattern is entirely static.
     */
    class StaticValueReplacePattern {
        constructor(staticValue) {
            this.staticValue = staticValue;
            this.kind = 0 /* ReplacePatternKind.StaticValue */;
        }
    }
    /**
     * Assigned when the replace pattern has replacement patterns.
     */
    class DynamicPiecesReplacePattern {
        constructor(pieces) {
            this.pieces = pieces;
            this.kind = 1 /* ReplacePatternKind.DynamicPieces */;
        }
    }
    class ReplacePattern {
        static fromStaticValue(value) {
            return new ReplacePattern([ReplacePiece.staticValue(value)]);
        }
        get hasReplacementPatterns() {
            return (this._state.kind === 1 /* ReplacePatternKind.DynamicPieces */);
        }
        constructor(pieces) {
            if (!pieces || pieces.length === 0) {
                this._state = new StaticValueReplacePattern('');
            }
            else if (pieces.length === 1 && pieces[0].staticValue !== null) {
                this._state = new StaticValueReplacePattern(pieces[0].staticValue);
            }
            else {
                this._state = new DynamicPiecesReplacePattern(pieces);
            }
        }
        buildReplaceString(matches, preserveCase) {
            if (this._state.kind === 0 /* ReplacePatternKind.StaticValue */) {
                if (preserveCase) {
                    return (0, search_1.buildReplaceStringWithCasePreserved)(matches, this._state.staticValue);
                }
                else {
                    return this._state.staticValue;
                }
            }
            let result = '';
            for (let i = 0, len = this._state.pieces.length; i < len; i++) {
                const piece = this._state.pieces[i];
                if (piece.staticValue !== null) {
                    // static value ReplacePiece
                    result += piece.staticValue;
                    continue;
                }
                // match index ReplacePiece
                let match = ReplacePattern._substitute(piece.matchIndex, matches);
                if (piece.caseOps !== null && piece.caseOps.length > 0) {
                    const repl = [];
                    const lenOps = piece.caseOps.length;
                    let opIdx = 0;
                    for (let idx = 0, len = match.length; idx < len; idx++) {
                        if (opIdx >= lenOps) {
                            repl.push(match.slice(idx));
                            break;
                        }
                        switch (piece.caseOps[opIdx]) {
                            case 'U':
                                repl.push(match[idx].toUpperCase());
                                break;
                            case 'u':
                                repl.push(match[idx].toUpperCase());
                                opIdx++;
                                break;
                            case 'L':
                                repl.push(match[idx].toLowerCase());
                                break;
                            case 'l':
                                repl.push(match[idx].toLowerCase());
                                opIdx++;
                                break;
                            default:
                                repl.push(match[idx]);
                        }
                    }
                    match = repl.join('');
                }
                result += match;
            }
            return result;
        }
        static _substitute(matchIndex, matches) {
            if (matches === null) {
                return '';
            }
            if (matchIndex === 0) {
                return matches[0];
            }
            let remainder = '';
            while (matchIndex > 0) {
                if (matchIndex < matches.length) {
                    // A match can be undefined
                    const match = (matches[matchIndex] || '');
                    return match + remainder;
                }
                remainder = String(matchIndex % 10) + remainder;
                matchIndex = Math.floor(matchIndex / 10);
            }
            return '$' + remainder;
        }
    }
    exports.ReplacePattern = ReplacePattern;
    /**
     * A replace piece can either be a static string or an index to a specific match.
     */
    class ReplacePiece {
        static staticValue(value) {
            return new ReplacePiece(value, -1, null);
        }
        static matchIndex(index) {
            return new ReplacePiece(null, index, null);
        }
        static caseOps(index, caseOps) {
            return new ReplacePiece(null, index, caseOps);
        }
        constructor(staticValue, matchIndex, caseOps) {
            this.staticValue = staticValue;
            this.matchIndex = matchIndex;
            if (!caseOps || caseOps.length === 0) {
                this.caseOps = null;
            }
            else {
                this.caseOps = caseOps.slice(0);
            }
        }
    }
    exports.ReplacePiece = ReplacePiece;
    class ReplacePieceBuilder {
        constructor(source) {
            this._source = source;
            this._lastCharIndex = 0;
            this._result = [];
            this._resultLen = 0;
            this._currentStaticPiece = '';
        }
        emitUnchanged(toCharIndex) {
            this._emitStatic(this._source.substring(this._lastCharIndex, toCharIndex));
            this._lastCharIndex = toCharIndex;
        }
        emitStatic(value, toCharIndex) {
            this._emitStatic(value);
            this._lastCharIndex = toCharIndex;
        }
        _emitStatic(value) {
            if (value.length === 0) {
                return;
            }
            this._currentStaticPiece += value;
        }
        emitMatchIndex(index, toCharIndex, caseOps) {
            if (this._currentStaticPiece.length !== 0) {
                this._result[this._resultLen++] = ReplacePiece.staticValue(this._currentStaticPiece);
                this._currentStaticPiece = '';
            }
            this._result[this._resultLen++] = ReplacePiece.caseOps(index, caseOps);
            this._lastCharIndex = toCharIndex;
        }
        finalize() {
            this.emitUnchanged(this._source.length);
            if (this._currentStaticPiece.length !== 0) {
                this._result[this._resultLen++] = ReplacePiece.staticValue(this._currentStaticPiece);
                this._currentStaticPiece = '';
            }
            return new ReplacePattern(this._result);
        }
    }
    /**
     * \n			=> inserts a LF
     * \t			=> inserts a TAB
     * \\			=> inserts a "\".
     * \u			=> upper-cases one character in a match.
     * \U			=> upper-cases ALL remaining characters in a match.
     * \l			=> lower-cases one character in a match.
     * \L			=> lower-cases ALL remaining characters in a match.
     * $$			=> inserts a "$".
     * $& and $0	=> inserts the matched substring.
     * $n			=> Where n is a non-negative integer lesser than 100, inserts the nth parenthesized submatch string
     * everything else stays untouched
     *
     * Also see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter
     */
    function parseReplaceString(replaceString) {
        if (!replaceString || replaceString.length === 0) {
            return new ReplacePattern(null);
        }
        const caseOps = [];
        const result = new ReplacePieceBuilder(replaceString);
        for (let i = 0, len = replaceString.length; i < len; i++) {
            const chCode = replaceString.charCodeAt(i);
            if (chCode === 92 /* CharCode.Backslash */) {
                // move to next char
                i++;
                if (i >= len) {
                    // string ends with a \
                    break;
                }
                const nextChCode = replaceString.charCodeAt(i);
                // let replaceWithCharacter: string | null = null;
                switch (nextChCode) {
                    case 92 /* CharCode.Backslash */:
                        // \\ => inserts a "\"
                        result.emitUnchanged(i - 1);
                        result.emitStatic('\\', i + 1);
                        break;
                    case 110 /* CharCode.n */:
                        // \n => inserts a LF
                        result.emitUnchanged(i - 1);
                        result.emitStatic('\n', i + 1);
                        break;
                    case 116 /* CharCode.t */:
                        // \t => inserts a TAB
                        result.emitUnchanged(i - 1);
                        result.emitStatic('\t', i + 1);
                        break;
                    // Case modification of string replacements, patterned after Boost, but only applied
                    // to the replacement text, not subsequent content.
                    case 117 /* CharCode.u */:
                    // \u => upper-cases one character.
                    case 85 /* CharCode.U */:
                    // \U => upper-cases ALL following characters.
                    case 108 /* CharCode.l */:
                    // \l => lower-cases one character.
                    case 76 /* CharCode.L */:
                        // \L => lower-cases ALL following characters.
                        result.emitUnchanged(i - 1);
                        result.emitStatic('', i + 1);
                        caseOps.push(String.fromCharCode(nextChCode));
                        break;
                }
                continue;
            }
            if (chCode === 36 /* CharCode.DollarSign */) {
                // move to next char
                i++;
                if (i >= len) {
                    // string ends with a $
                    break;
                }
                const nextChCode = replaceString.charCodeAt(i);
                if (nextChCode === 36 /* CharCode.DollarSign */) {
                    // $$ => inserts a "$"
                    result.emitUnchanged(i - 1);
                    result.emitStatic('$', i + 1);
                    continue;
                }
                if (nextChCode === 48 /* CharCode.Digit0 */ || nextChCode === 38 /* CharCode.Ampersand */) {
                    // $& and $0 => inserts the matched substring.
                    result.emitUnchanged(i - 1);
                    result.emitMatchIndex(0, i + 1, caseOps);
                    caseOps.length = 0;
                    continue;
                }
                if (49 /* CharCode.Digit1 */ <= nextChCode && nextChCode <= 57 /* CharCode.Digit9 */) {
                    // $n
                    let matchIndex = nextChCode - 48 /* CharCode.Digit0 */;
                    // peek next char to probe for $nn
                    if (i + 1 < len) {
                        const nextNextChCode = replaceString.charCodeAt(i + 1);
                        if (48 /* CharCode.Digit0 */ <= nextNextChCode && nextNextChCode <= 57 /* CharCode.Digit9 */) {
                            // $nn
                            // move to next char
                            i++;
                            matchIndex = matchIndex * 10 + (nextNextChCode - 48 /* CharCode.Digit0 */);
                            result.emitUnchanged(i - 2);
                            result.emitMatchIndex(matchIndex, i + 1, caseOps);
                            caseOps.length = 0;
                            continue;
                        }
                    }
                    result.emitUnchanged(i - 1);
                    result.emitMatchIndex(matchIndex, i + 1, caseOps);
                    caseOps.length = 0;
                    continue;
                }
            }
        }
        return result.finalize();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbGFjZVBhdHRlcm4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2ZpbmQvYnJvd3Nlci9yZXBsYWNlUGF0dGVybi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrT2hHLGdEQXFIQztJQWxWRCxJQUFXLGtCQUdWO0lBSEQsV0FBVyxrQkFBa0I7UUFDNUIseUVBQWUsQ0FBQTtRQUNmLDZFQUFpQixDQUFBO0lBQ2xCLENBQUMsRUFIVSxrQkFBa0IsS0FBbEIsa0JBQWtCLFFBRzVCO0lBRUQ7O09BRUc7SUFDSCxNQUFNLHlCQUF5QjtRQUU5QixZQUE0QixXQUFtQjtZQUFuQixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUQvQixTQUFJLDBDQUFrQztRQUNILENBQUM7S0FDcEQ7SUFFRDs7T0FFRztJQUNILE1BQU0sMkJBQTJCO1FBRWhDLFlBQTRCLE1BQXNCO1lBQXRCLFdBQU0sR0FBTixNQUFNLENBQWdCO1lBRGxDLFNBQUksNENBQW9DO1FBQ0YsQ0FBQztLQUN2RDtJQUVELE1BQWEsY0FBYztRQUVuQixNQUFNLENBQUMsZUFBZSxDQUFDLEtBQWE7WUFDMUMsT0FBTyxJQUFJLGNBQWMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFJRCxJQUFXLHNCQUFzQjtZQUNoQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLDZDQUFxQyxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVELFlBQVksTUFBNkI7WUFDeEMsSUFBSSxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNwQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUkseUJBQXlCLENBQUMsRUFBRSxD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