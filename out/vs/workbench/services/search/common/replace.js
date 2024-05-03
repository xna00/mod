/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/base/common/search"], function (require, exports, strings, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplacePattern = void 0;
    class ReplacePattern {
        constructor(replaceString, arg2, arg3) {
            this._hasParameters = false;
            this._replacePattern = replaceString;
            let searchPatternInfo;
            let parseParameters;
            if (typeof arg2 === 'boolean') {
                parseParameters = arg2;
                this._regExp = arg3;
            }
            else {
                searchPatternInfo = arg2;
                parseParameters = !!searchPatternInfo.isRegExp;
                this._regExp = strings.createRegExp(searchPatternInfo.pattern, !!searchPatternInfo.isRegExp, { matchCase: searchPatternInfo.isCaseSensitive, wholeWord: searchPatternInfo.isWordMatch, multiline: searchPatternInfo.isMultiline, global: false, unicode: true });
            }
            if (parseParameters) {
                this.parseReplaceString(replaceString);
            }
            if (this._regExp.global) {
                this._regExp = strings.createRegExp(this._regExp.source, true, { matchCase: !this._regExp.ignoreCase, wholeWord: false, multiline: this._regExp.multiline, global: false });
            }
            this._caseOpsRegExp = new RegExp(/([\s\S]*?)((?:\\[uUlL])+?|)(\$[0-9]+)([\s\S]*?)/g);
        }
        get hasParameters() {
            return this._hasParameters;
        }
        get pattern() {
            return this._replacePattern;
        }
        get regExp() {
            return this._regExp;
        }
        /**
        * Returns the replace string for the first match in the given text.
        * If text has no matches then returns null.
        */
        getReplaceString(text, preserveCase) {
            this._regExp.lastIndex = 0;
            const match = this._regExp.exec(text);
            if (match) {
                if (this.hasParameters) {
                    const replaceString = this.replaceWithCaseOperations(text, this._regExp, this.buildReplaceString(match, preserveCase));
                    if (match[0] === text) {
                        return replaceString;
                    }
                    return replaceString.substr(match.index, match[0].length - (text.length - replaceString.length));
                }
                return this.buildReplaceString(match, preserveCase);
            }
            return null;
        }
        /**
         * replaceWithCaseOperations applies case operations to relevant replacement strings and applies
         * the affected $N arguments. It then passes unaffected $N arguments through to string.replace().
         *
         * \u			=> upper-cases one character in a match.
         * \U			=> upper-cases ALL remaining characters in a match.
         * \l			=> lower-cases one character in a match.
         * \L			=> lower-cases ALL remaining characters in a match.
         */
        replaceWithCaseOperations(text, regex, replaceString) {
            // Short-circuit the common path.
            if (!/\\[uUlL]/.test(replaceString)) {
                return text.replace(regex, replaceString);
            }
            // Store the values of the search parameters.
            const firstMatch = regex.exec(text);
            if (firstMatch === null) {
                return text.replace(regex, replaceString);
            }
            let patMatch;
            let newReplaceString = '';
            let lastIndex = 0;
            let lastMatch = '';
            // For each annotated $N, perform text processing on the parameters and perform the substitution.
            while ((patMatch = this._caseOpsRegExp.exec(replaceString)) !== null) {
                lastIndex = patMatch.index;
                const fullMatch = patMatch[0];
                lastMatch = fullMatch;
                let caseOps = patMatch[2]; // \u, \l\u, etc.
                const money = patMatch[3]; // $1, $2, etc.
                if (!caseOps) {
                    newReplaceString += fullMatch;
                    continue;
                }
                const replacement = firstMatch[parseInt(money.slice(1))];
                if (!replacement) {
                    newReplaceString += fullMatch;
                    continue;
                }
                const replacementLen = replacement.length;
                newReplaceString += patMatch[1]; // prefix
                caseOps = caseOps.replace(/\\/g, '');
                let i = 0;
                for (; i < caseOps.length; i++) {
                    switch (caseOps[i]) {
                        case 'U':
                            newReplaceString += replacement.slice(i).toUpperCase();
                            i = replacementLen;
                            break;
                        case 'u':
                            newReplaceString += replacement[i].toUpperCase();
                            break;
                        case 'L':
                            newReplaceString += replacement.slice(i).toLowerCase();
                            i = replacementLen;
                            break;
                        case 'l':
                            newReplaceString += replacement[i].toLowerCase();
                            break;
                    }
                }
                // Append any remaining replacement string content not covered by case operations.
                if (i < replacementLen) {
                    newReplaceString += replacement.slice(i);
                }
                newReplaceString += patMatch[4]; // suffix
            }
            // Append any remaining trailing content after the final regex match.
            newReplaceString += replaceString.slice(lastIndex + lastMatch.length);
            return text.replace(regex, newReplaceString);
        }
        buildReplaceString(matches, preserveCase) {
            if (preserveCase) {
                return (0, search_1.buildReplaceStringWithCasePreserved)(matches, this._replacePattern);
            }
            else {
                return this._replacePattern;
            }
        }
        /**
         * \n => LF
         * \t => TAB
         * \\ => \
         * $0 => $& (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter)
         * everything else stays untouched
         */
        parseReplaceString(replaceString) {
            if (!replaceString || replaceString.length === 0) {
                return;
            }
            let substrFrom = 0, result = '';
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
                    let replaceWithCharacter = null;
                    switch (nextChCode) {
                        case 92 /* CharCode.Backslash */:
                            // \\ => \
                            replaceWithCharacter = '\\';
                            break;
                        case 110 /* CharCode.n */:
                            // \n => LF
                            replaceWithCharacter = '\n';
                            break;
                        case 116 /* CharCode.t */:
                            // \t => TAB
                            replaceWithCharacter = '\t';
                            break;
                    }
                    if (replaceWithCharacter) {
                        result += replaceString.substring(substrFrom, i - 1) + replaceWithCharacter;
                        substrFrom = i + 1;
                    }
                }
                if (chCode === 36 /* CharCode.DollarSign */) {
                    // move to next char
                    i++;
                    if (i >= len) {
                        // string ends with a $
                        break;
                    }
                    const nextChCode = replaceString.charCodeAt(i);
                    let replaceWithCharacter = null;
                    switch (nextChCode) {
                        case 48 /* CharCode.Digit0 */:
                            // $0 => $&
                            replaceWithCharacter = '$&';
                            this._hasParameters = true;
                            break;
                        case 96 /* CharCode.BackTick */:
                        case 39 /* CharCode.SingleQuote */:
                            this._hasParameters = true;
                            break;
                        default: {
                            // check if it is a valid string parameter $n (0 <= n <= 99). $0 is already handled by now.
                            if (!this.between(nextChCode, 49 /* CharCode.Digit1 */, 57 /* CharCode.Digit9 */)) {
                                break;
                            }
                            if (i === replaceString.length - 1) {
                                this._hasParameters = true;
                                break;
                            }
                            let charCode = replaceString.charCodeAt(++i);
                            if (!this.between(charCode, 48 /* CharCode.Digit0 */, 57 /* CharCode.Digit9 */)) {
                                this._hasParameters = true;
                                --i;
                                break;
                            }
                            if (i === replaceString.length - 1) {
                                this._hasParameters = true;
                                break;
                            }
                            charCode = replaceString.charCodeAt(++i);
                            if (!this.between(charCode, 48 /* CharCode.Digit0 */, 57 /* CharCode.Digit9 */)) {
                                this._hasParameters = true;
                                --i;
                                break;
                            }
                            break;
                        }
                    }
                    if (replaceWithCharacter) {
                        result += replaceString.substring(substrFrom, i - 1) + replaceWithCharacter;
                        substrFrom = i + 1;
                    }
                }
            }
            if (substrFrom === 0) {
                // no replacement occurred
                return;
            }
            this._replacePattern = result + replaceString.substring(substrFrom);
        }
        between(value, from, to) {
            return from <= value && value <= to;
        }
    }
    exports.ReplacePattern = ReplacePattern;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbGFjZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3NlYXJjaC9jb21tb24vcmVwbGFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBYSxjQUFjO1FBUzFCLFlBQVksYUFBcUIsRUFBRSxJQUFTLEVBQUUsSUFBVTtZQU5oRCxtQkFBYyxHQUFZLEtBQUssQ0FBQztZQU92QyxJQUFJLENBQUMsZUFBZSxHQUFHLGFBQWEsQ0FBQztZQUNyQyxJQUFJLGlCQUErQixDQUFDO1lBQ3BDLElBQUksZUFBd0IsQ0FBQztZQUM3QixJQUFJLE9BQU8sSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUMvQixlQUFlLEdBQUcsSUFBSSxDQUFDO2dCQUN2QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUVyQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO2dCQUN6QixlQUFlLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLEVBQUUsU0FBUyxFQUFFLGlCQUFpQixDQUFDLGVBQWUsRUFBRSxTQUFTLEVBQUUsaUJBQWlCLENBQUMsV0FBVyxFQUFFLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNsUSxDQUFDO1lBRUQsSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDckIsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxD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