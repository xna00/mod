/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/editor/common/encodedTokenAttributes", "./ast", "./length", "./smallImmutableSet"], function (require, exports, errors_1, encodedTokenAttributes_1, ast_1, length_1, smallImmutableSet_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FastTokenizer = exports.TextBufferTokenizer = exports.Token = exports.TokenKind = void 0;
    var TokenKind;
    (function (TokenKind) {
        TokenKind[TokenKind["Text"] = 0] = "Text";
        TokenKind[TokenKind["OpeningBracket"] = 1] = "OpeningBracket";
        TokenKind[TokenKind["ClosingBracket"] = 2] = "ClosingBracket";
    })(TokenKind || (exports.TokenKind = TokenKind = {}));
    class Token {
        constructor(length, kind, 
        /**
         * If this token is an opening bracket, this is the id of the opening bracket.
         * If this token is a closing bracket, this is the id of the first opening bracket that is closed by this bracket.
         * Otherwise, it is -1.
         */
        bracketId, 
        /**
         * If this token is an opening bracket, this just contains `bracketId`.
         * If this token is a closing bracket, this lists all opening bracket ids, that it closes.
         * Otherwise, it is empty.
         */
        bracketIds, astNode) {
            this.length = length;
            this.kind = kind;
            this.bracketId = bracketId;
            this.bracketIds = bracketIds;
            this.astNode = astNode;
        }
    }
    exports.Token = Token;
    class TextBufferTokenizer {
        constructor(textModel, bracketTokens) {
            this.textModel = textModel;
            this.bracketTokens = bracketTokens;
            this.reader = new NonPeekableTextBufferTokenizer(this.textModel, this.bracketTokens);
            this._offset = length_1.lengthZero;
            this.didPeek = false;
            this.peeked = null;
            this.textBufferLineCount = textModel.getLineCount();
            this.textBufferLastLineLength = textModel.getLineLength(this.textBufferLineCount);
        }
        get offset() {
            return this._offset;
        }
        get length() {
            return (0, length_1.toLength)(this.textBufferLineCount - 1, this.textBufferLastLineLength);
        }
        getText() {
            return this.textModel.getValue();
        }
        skip(length) {
            this.didPeek = false;
            this._offset = (0, length_1.lengthAdd)(this._offset, length);
            const obj = (0, length_1.lengthToObj)(this._offset);
            this.reader.setPosition(obj.lineCount, obj.columnCount);
        }
        read() {
            let token;
            if (this.peeked) {
                this.didPeek = false;
                token = this.peeked;
            }
            else {
                token = this.reader.read();
            }
            if (token) {
                this._offset = (0, length_1.lengthAdd)(this._offset, token.length);
            }
            return token;
        }
        peek() {
            if (!this.didPeek) {
                this.peeked = this.reader.read();
                this.didPeek = true;
            }
            return this.peeked;
        }
    }
    exports.TextBufferTokenizer = TextBufferTokenizer;
    /**
     * Does not support peek.
    */
    class NonPeekableTextBufferTokenizer {
        constructor(textModel, bracketTokens) {
            this.textModel = textModel;
            this.bracketTokens = bracketTokens;
            this.lineIdx = 0;
            this.line = null;
            this.lineCharOffset = 0;
            this.lineTokens = null;
            this.lineTokenOffset = 0;
            /** Must be a zero line token. The end of the document cannot be peeked. */
            this.peekedToken = null;
            this.textBufferLineCount = textModel.getLineCount();
            this.textBufferLastLineLength = textModel.getLineLength(this.textBufferLineCount);
        }
        setPosition(lineIdx, column) {
            // We must not jump into a token!
            if (lineIdx === this.lineIdx) {
                this.lineCharOffset = column;
                if (this.line !== null) {
                    this.lineTokenOffset = this.lineCharOffset === 0 ? 0 : this.lineTokens.findTokenIndexAtOffset(this.lineCharOffset);
                }
            }
            else {
                this.lineIdx = lineIdx;
                this.lineCharOffset = column;
                this.line = null;
            }
            this.peekedToken = null;
        }
        read() {
            if (this.peekedToken) {
                const token = this.peekedToken;
                this.peekedToken = null;
                this.lineCharOffset += (0, length_1.lengthGetColumnCountIfZeroLineCount)(token.length);
                return token;
            }
            if (this.lineIdx > this.textBufferLineCount - 1 || (this.lineIdx === this.textBufferLineCount - 1 && this.lineCharOffset >= this.textBufferLastLineLength)) {
                // We are after the end
                return null;
            }
            if (this.line === null) {
                this.lineTokens = this.textModel.tokenization.getLineTokens(this.lineIdx + 1);
                this.line = this.lineTokens.getLineContent();
                this.lineTokenOffset = this.lineCharOffset === 0 ? 0 : this.lineTokens.findTokenIndexAtOffset(this.lineCharOffset);
            }
            const startLineIdx = this.lineIdx;
            const startLineCharOffset = this.lineCharOffset;
            // limits the length of text tokens.
            // If text tokens get too long, incremental updates will be slow
            let lengthHeuristic = 0;
            while (true) {
                const lineTokens = this.lineTokens;
                const tokenCount = lineTokens.getCount();
                let peekedBracketToken = null;
                if (this.lineTokenOffset < tokenCount) {
                    const tokenMetadata = lineTokens.getMetadata(this.lineTokenOffset);
                    while (this.lineTokenOffset + 1 < tokenCount && tokenMetadata === lineTokens.getMetadata(this.lineTokenOffset + 1)) {
                        // Skip tokens that are identical.
                        // Sometimes, (bracket) identifiers are split up into multiple tokens.
                        this.lineTokenOffset++;
                    }
                    const isOther = encodedTokenAttributes_1.TokenMetadata.getTokenType(tokenMetadata) === 0 /* StandardTokenType.Other */;
                    const containsBracketType = encodedTokenAttributes_1.TokenMetadata.containsBalancedBrackets(tokenMetadata);
                    const endOffset = lineTokens.getEndOffset(this.lineTokenOffset);
                    // Is there a bracket token next? Only consume text.
                    if (containsBracketType && isOther && this.lineCharOffset < endOffset) {
                        const languageId = lineTokens.getLanguageId(this.lineTokenOffset);
                        const text = this.line.substring(this.lineCharOffset, endOffset);
                        const brackets = this.bracketTokens.getSingleLanguageBracketTokens(languageId);
                        const regexp = brackets.regExpGlobal;
                        if (regexp) {
                            regexp.lastIndex = 0;
                            const match = regexp.exec(text);
                            if (match) {
                                peekedBracketToken = brackets.getToken(match[0]);
                                if (peekedBracketToken) {
                                    // Consume leading text of the token
                                    this.lineCharOffset += match.index;
                                }
                            }
                        }
                    }
                    lengthHeuristic += endOffset - this.lineCharOffset;
                    if (peekedBracketToken) {
                        // Don't skip the entire token, as a single token could contain multiple brackets.
                        if (startLineIdx !== this.lineIdx || startLineCharOffset !== this.lineCharOffset) {
                            // There is text before the bracket
                            this.peekedToken = peekedBracketToken;
                            break;
                        }
                        else {
                            // Consume the peeked token
                            this.lineCharOffset += (0, length_1.lengthGetColumnCountIfZeroLineCount)(peekedBracketToken.length);
                            return peekedBracketToken;
                        }
                    }
                    else {
                        // Skip the entire token, as the token contains no brackets at all.
                        this.lineTokenOffset++;
                        this.lineCharOffset = endOffset;
                    }
                }
                else {
                    if (this.lineIdx === this.textBufferLineCount - 1) {
                        break;
                    }
                    this.lineIdx++;
                    this.lineTokens = this.textModel.tokenization.getLineTokens(this.lineIdx + 1);
                    this.lineTokenOffset = 0;
                    this.line = this.lineTokens.getLineContent();
                    this.lineCharOffset = 0;
                    lengthHeuristic += 33; // max 1000/33 = 30 lines
                    // This limits the amount of work to recompute min-indentation
                    if (lengthHeuristic > 1000) {
                        // only break (automatically) at the end of line.
                        break;
                    }
                }
                if (lengthHeuristic > 1500) {
                    // Eventually break regardless of the line length so that
                    // very long lines do not cause bad performance.
                    // This effective limits max indentation to 500, as
                    // indentation is not computed across multiple text nodes.
                    break;
                }
            }
            // If a token contains some proper indentation, it also contains \n{INDENTATION+}(?!{INDENTATION}),
            // unless the line is too long.
            // Thus, the min indentation of the document is the minimum min indentation of every text node.
            const length = (0, length_1.lengthDiff)(startLineIdx, startLineCharOffset, this.lineIdx, this.lineCharOffset);
            return new Token(length, 0 /* TokenKind.Text */, -1, smallImmutableSet_1.SmallImmutableSet.getEmpty(), new ast_1.TextAstNode(length));
        }
    }
    class FastTokenizer {
        constructor(text, brackets) {
            this.text = text;
            this._offset = length_1.lengthZero;
            this.idx = 0;
            const regExpStr = brackets.getRegExpStr();
            const regexp = regExpStr ? new RegExp(regExpStr + '|\n', 'gi') : null;
            const tokens = [];
            let match;
            let curLineCount = 0;
            let lastLineBreakOffset = 0;
            let lastTokenEndOffset = 0;
            let lastTokenEndLine = 0;
            const smallTextTokens0Line = [];
            for (let i = 0; i < 60; i++) {
                smallTextTokens0Line.push(new Token((0, length_1.toLength)(0, i), 0 /* TokenKind.Text */, -1, smallImmutableSet_1.SmallImmutableSet.getEmpty(), new ast_1.TextAstNode((0, length_1.toLength)(0, i))));
            }
            const smallTextTokens1Line = [];
            for (let i = 0; i < 60; i++) {
                smallTextTokens1Line.push(new Token((0, length_1.toLength)(1, i), 0 /* TokenKind.Text */, -1, smallImmutableSet_1.SmallImmutableSet.getEmpty(), new ast_1.TextAstNode((0, length_1.toLength)(1, i))));
            }
            if (regexp) {
                regexp.lastIndex = 0;
                // If a token contains indentation, it also contains \n{INDENTATION+}(?!{INDENTATION})
                while ((match = regexp.exec(text)) !== null) {
                    const curOffset = match.index;
                    const value = match[0];
                    if (value === '\n') {
                        curLineCount++;
                        lastLineBreakOffset = curOffset + 1;
                    }
                    else {
                        if (lastTokenEndOffset !== curOffset) {
                            let token;
                            if (lastTokenEndLine === curLineCount) {
                                const colCount = curOffset - lastTokenEndOffset;
                                if (colCount < smallTextTokens0Line.length) {
                                    token = smallTextTokens0Line[colCount];
                                }
                                else {
                                    const length = (0, length_1.toLength)(0, colCount);
                                    token = new Token(length, 0 /* TokenKind.Text */, -1, smallImmutableSet_1.SmallImmutableSet.getEmpty(), new ast_1.TextAstNode(length));
                                }
                            }
                            else {
                                const lineCount = curLineCount - lastTokenEndLine;
                                const colCount = curOffset - lastLineBreakOffset;
                                if (lineCount === 1 && colCount < smallTextTokens1Line.length) {
                                    token = smallTextTokens1Line[colCount];
                                }
                                else {
                                    const length = (0, length_1.toLength)(lineCount, colCount);
                                    token = new Token(length, 0 /* TokenKind.Text */, -1, smallImmutableSet_1.SmallImmutableSet.getEmpty(), new ast_1.TextAstNode(length));
                                }
                            }
                            tokens.push(token);
                        }
                        // value is matched by regexp, so the token must exist
                        tokens.push(brackets.getToken(value));
                        lastTokenEndOffset = curOffset + value.length;
                        lastTokenEndLine = curLineCount;
                    }
                }
            }
            const offset = text.length;
            if (lastTokenEndOffset !== offset) {
                const length = (lastTokenEndLine === curLineCount)
                    ? (0, length_1.toLength)(0, offset - lastTokenEndOffset)
                    : (0, length_1.toLength)(curLineCount - lastTokenEndLine, offset - lastLineBreakOffset);
                tokens.push(new Token(length, 0 /* TokenKind.Text */, -1, smallImmutableSet_1.SmallImmutableSet.getEmpty(), new ast_1.TextAstNode(length)));
            }
            this.length = (0, length_1.toLength)(curLineCount, offset - lastLineBreakOffset);
            this.tokens = tokens;
        }
        get offset() {
            return this._offset;
        }
        read() {
            return this.tokens[this.idx++] || null;
        }
        peek() {
            return this.tokens[this.idx] || null;
        }
        skip(length) {
            throw new errors_1.NotSupportedError();
        }
        getText() {
            return this.text;
        }
    }
    exports.FastTokenizer = FastTokenizer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5pemVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsL2JyYWNrZXRQYWlyc1RleHRNb2RlbFBhcnQvYnJhY2tldFBhaXJzVHJlZS90b2tlbml6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUJoRyxJQUFrQixTQUlqQjtJQUpELFdBQWtCLFNBQVM7UUFDMUIseUNBQVEsQ0FBQTtRQUNSLDZEQUFrQixDQUFBO1FBQ2xCLDZEQUFrQixDQUFBO0lBQ25CLENBQUMsRUFKaUIsU0FBUyx5QkFBVCxTQUFTLFFBSTFCO0lBSUQsTUFBYSxLQUFLO1FBQ2pCLFlBQ1UsTUFBYyxFQUNkLElBQWU7UUFDeEI7Ozs7V0FJRztRQUNNLFNBQTJCO1FBQ3BDOzs7O1dBSUc7UUFDTSxVQUErQyxFQUMvQyxPQUFpRDtZQWRqRCxXQUFNLEdBQU4sTUFBTSxDQUFRO1lBQ2QsU0FBSSxHQUFKLElBQUksQ0FBVztZQU1mLGNBQVMsR0FBVCxTQUFTLENBQWtCO1lBTTNCLGVBQVUsR0FBVixVQUFVLENBQXFDO1lBQy9DLFlBQU8sR0FBUCxPQUFPLENBQTBDO1FBQ3ZELENBQUM7S0FDTDtJQWxCRCxzQkFrQkM7SUFZRCxNQUFhLG1CQUFtQjtRQU0vQixZQUNrQixTQUEyQixFQUMzQixhQUE0QztZQUQ1QyxjQUFTLEdBQVQsU0FBUyxDQUFrQjtZQUMzQixrQkFBYSxHQUFiLGFBQWEsQ0FBK0I7WUFKN0MsV0FBTSxHQUFHLElBQUksOEJBQThCLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFVekYsWUFBTyxHQUFXLG1CQUFVLENBQUM7WUFxQjdCLFlBQU8sR0FBRyxLQUFLLENBQUM7WUFDaEIsV0FBTSxHQUFpQixJQUFJLENBQUM7WUExQm5DLElB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