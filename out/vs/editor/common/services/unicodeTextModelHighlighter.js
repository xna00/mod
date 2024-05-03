/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/editor/common/model/textModelSearch", "vs/base/common/strings", "vs/base/common/assert", "vs/editor/common/core/wordHelper"], function (require, exports, range_1, textModelSearch_1, strings, assert_1, wordHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnicodeHighlighterReasonKind = exports.UnicodeTextModelHighlighter = void 0;
    class UnicodeTextModelHighlighter {
        static computeUnicodeHighlights(model, options, range) {
            const startLine = range ? range.startLineNumber : 1;
            const endLine = range ? range.endLineNumber : model.getLineCount();
            const codePointHighlighter = new CodePointHighlighter(options);
            const candidates = codePointHighlighter.getCandidateCodePoints();
            let regex;
            if (candidates === 'allNonBasicAscii') {
                regex = new RegExp('[^\\t\\n\\r\\x20-\\x7E]', 'g');
            }
            else {
                regex = new RegExp(`${buildRegExpCharClassExpr(Array.from(candidates))}`, 'g');
            }
            const searcher = new textModelSearch_1.Searcher(null, regex);
            const ranges = [];
            let hasMore = false;
            let m;
            let ambiguousCharacterCount = 0;
            let invisibleCharacterCount = 0;
            let nonBasicAsciiCharacterCount = 0;
            forLoop: for (let lineNumber = startLine, lineCount = endLine; lineNumber <= lineCount; lineNumber++) {
                const lineContent = model.getLineContent(lineNumber);
                const lineLength = lineContent.length;
                // Reset regex to search from the beginning
                searcher.reset(0);
                do {
                    m = searcher.next(lineContent);
                    if (m) {
                        let startIndex = m.index;
                        let endIndex = m.index + m[0].length;
                        // Extend range to entire code point
                        if (startIndex > 0) {
                            const charCodeBefore = lineContent.charCodeAt(startIndex - 1);
                            if (strings.isHighSurrogate(charCodeBefore)) {
                                startIndex--;
                            }
                        }
                        if (endIndex + 1 < lineLength) {
                            const charCodeBefore = lineContent.charCodeAt(endIndex - 1);
                            if (strings.isHighSurrogate(charCodeBefore)) {
                                endIndex++;
                            }
                        }
                        const str = lineContent.substring(startIndex, endIndex);
                        let word = (0, wordHelper_1.getWordAtText)(startIndex + 1, wordHelper_1.DEFAULT_WORD_REGEXP, lineContent, 0);
                        if (word && word.endColumn <= startIndex + 1) {
                            // The word does not include the problematic character, ignore the word
                            word = null;
                        }
                        const highlightReason = codePointHighlighter.shouldHighlightNonBasicASCII(str, word ? word.word : null);
                        if (highlightReason !== 0 /* SimpleHighlightReason.None */) {
                            if (highlightReason === 3 /* SimpleHighlightReason.Ambiguous */) {
                                ambiguousCharacterCount++;
                            }
                            else if (highlightReason === 2 /* SimpleHighlightReason.Invisible */) {
                                invisibleCharacterCount++;
                            }
                            else if (highlightReason === 1 /* SimpleHighlightReason.NonBasicASCII */) {
                                nonBasicAsciiCharacterCount++;
                            }
                            else {
                                (0, assert_1.assertNever)(highlightReason);
                            }
                            const MAX_RESULT_LENGTH = 1000;
                            if (ranges.length >= MAX_RESULT_LENGTH) {
                                hasMore = true;
                                break forLoop;
                            }
                            ranges.push(new range_1.Range(lineNumber, startIndex + 1, lineNumber, endIndex + 1));
                        }
                    }
                } while (m);
            }
            return {
                ranges,
                hasMore,
                ambiguousCharacterCount,
                invisibleCharacterCount,
                nonBasicAsciiCharacterCount
            };
        }
        static computeUnicodeHighlightReason(char, options) {
            const codePointHighlighter = new CodePointHighlighter(options);
            const reason = codePointHighlighter.shouldHighlightNonBasicASCII(char, null);
            switch (reason) {
                case 0 /* SimpleHighlightReason.None */:
                    return null;
                case 2 /* SimpleHighlightReason.Invisible */:
                    return { kind: 1 /* UnicodeHighlighterReasonKind.Invisible */ };
                case 3 /* SimpleHighlightReason.Ambiguous */: {
                    const codePoint = char.codePointAt(0);
                    const primaryConfusable = codePointHighlighter.ambiguousCharacters.getPrimaryConfusable(codePoint);
                    const notAmbiguousInLocales = strings.AmbiguousCharacters.getLocales().filter((l) => !strings.AmbiguousCharacters.getInstance(new Set([...options.allowedLocales, l])).isAmbiguous(codePoint));
                    return { kind: 0 /* UnicodeHighlighterReasonKind.Ambiguous */, confusableWith: String.fromCodePoint(primaryConfusable), notAmbiguousInLocales };
                }
                case 1 /* SimpleHighlightReason.NonBasicASCII */:
                    return { kind: 2 /* UnicodeHighlighterReasonKind.NonBasicAscii */ };
            }
        }
    }
    exports.UnicodeTextModelHighlighter = UnicodeTextModelHighlighter;
    function buildRegExpCharClassExpr(codePoints, flags) {
        const src = `[${strings.escapeRegExpCharacters(codePoints.map((i) => String.fromCodePoint(i)).join(''))}]`;
        return src;
    }
    var UnicodeHighlighterReasonKind;
    (function (UnicodeHighlighterReasonKind) {
        UnicodeHighlighterReasonKind[UnicodeHighlighterReasonKind["Ambiguous"] = 0] = "Ambiguous";
        UnicodeHighlighterReasonKind[UnicodeHighlighterReasonKind["Invisible"] = 1] = "Invisible";
        UnicodeHighlighterReasonKind[UnicodeHighlighterReasonKind["NonBasicAscii"] = 2] = "NonBasicAscii";
    })(UnicodeHighlighterReasonKind || (exports.UnicodeHighlighterReasonKind = UnicodeHighlighterReasonKind = {}));
    class CodePointHighlighter {
        constructor(options) {
            this.options = options;
            this.allowedCodePoints = new Set(options.allowedCodePoints);
            this.ambiguousCharacters = strings.AmbiguousCharacters.getInstance(new Set(options.allowedLocales));
        }
        getCandidateCodePoints() {
            if (this.options.nonBasicASCII) {
                return 'allNonBasicAscii';
            }
            const set = new Set();
            if (this.options.invisibleCharacters) {
                for (const cp of strings.InvisibleCharacters.codePoints) {
                    if (!isAllowedInvisibleCharacter(String.fromCodePoint(cp))) {
                        set.add(cp);
                    }
                }
            }
            if (this.options.ambiguousCharacters) {
                for (const cp of this.ambiguousCharacters.getConfusableCodePoints()) {
                    set.add(cp);
                }
            }
            for (const cp of this.allowedCodePoints) {
                set.delete(cp);
            }
            return set;
        }
        shouldHighlightNonBasicASCII(character, wordContext) {
            const codePoint = character.codePointAt(0);
            if (this.allowedCodePoints.has(codePoint)) {
                return 0 /* SimpleHighlightReason.None */;
            }
            if (this.options.nonBasicASCII) {
                return 1 /* SimpleHighlightReason.NonBasicASCII */;
            }
            let hasBasicASCIICharacters = false;
            let hasNonConfusableNonBasicAsciiCharacter = false;
            if (wordContext) {
                for (const char of wordContext) {
                    const codePoint = char.codePointAt(0);
                    const isBasicASCII = strings.isBasicASCII(char);
                    hasBasicASCIICharacters = hasBasicASCIICharacters || isBasicASCII;
                    if (!isBasicASCII &&
                        !this.ambiguousCharacters.isAmbiguous(codePoint) &&
                        !strings.InvisibleCharacters.isInvisibleCharacter(codePoint)) {
                        hasNonConfusableNonBasicAsciiCharacter = true;
                    }
                }
            }
            if (
            /* Don't allow mixing weird looking characters with ASCII */ !hasBasicASCIICharacters &&
                /* Is there an obviously weird looking character? */ hasNonConfusableNonBasicAsciiCharacter) {
                return 0 /* SimpleHighlightReason.None */;
            }
            if (this.options.invisibleCharacters) {
                // TODO check for emojis
                if (!isAllowedInvisibleCharacter(character) && strings.InvisibleCharacters.isInvisibleCharacter(codePoint)) {
                    return 2 /* SimpleHighlightReason.Invisible */;
                }
            }
            if (this.options.ambiguousCharacters) {
                if (this.ambiguousCharacters.isAmbiguous(codePoint)) {
                    return 3 /* SimpleHighlightReason.Ambiguous */;
                }
            }
            return 0 /* SimpleHighlightReason.None */;
        }
    }
    function isAllowedInvisibleCharacter(character) {
        return character === ' ' || character === '\n' || character === '\t';
    }
    var SimpleHighlightReason;
    (function (SimpleHighlightReason) {
        SimpleHighlightReason[SimpleHighlightReason["None"] = 0] = "None";
        SimpleHighlightReason[SimpleHighlightReason["NonBasicASCII"] = 1] = "NonBasicASCII";
        SimpleHighlightReason[SimpleHighlightReason["Invisible"] = 2] = "Invisible";
        SimpleHighlightReason[SimpleHighlightReason["Ambiguous"] = 3] = "Ambiguous";
    })(SimpleHighlightReason || (SimpleHighlightReason = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5pY29kZVRleHRNb2RlbEhpZ2hsaWdodGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL3VuaWNvZGVUZXh0TW9kZWxIaWdobGlnaHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBYSwyQkFBMkI7UUFDaEMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLEtBQXNDLEVBQUUsT0FBa0MsRUFBRSxLQUFjO1lBQ2hJLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBRW5FLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUUvRCxNQUFNLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1lBQ2pFLElBQUksS0FBYSxDQUFDO1lBQ2xCLElBQUksVUFBVSxLQUFLLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3ZDLEtBQUssR0FBRyxJQUFJLE1BQU0sQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNwRCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsS0FBSyxHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsd0JBQXdCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDaEYsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLElBQUksMEJBQVEsQ0FBQyxJQUFJLEVBQUUsS0FB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