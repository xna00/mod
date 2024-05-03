/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/nls"], function (require, exports, errors_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Scanner = exports.TokenType = void 0;
    var TokenType;
    (function (TokenType) {
        TokenType[TokenType["LParen"] = 0] = "LParen";
        TokenType[TokenType["RParen"] = 1] = "RParen";
        TokenType[TokenType["Neg"] = 2] = "Neg";
        TokenType[TokenType["Eq"] = 3] = "Eq";
        TokenType[TokenType["NotEq"] = 4] = "NotEq";
        TokenType[TokenType["Lt"] = 5] = "Lt";
        TokenType[TokenType["LtEq"] = 6] = "LtEq";
        TokenType[TokenType["Gt"] = 7] = "Gt";
        TokenType[TokenType["GtEq"] = 8] = "GtEq";
        TokenType[TokenType["RegexOp"] = 9] = "RegexOp";
        TokenType[TokenType["RegexStr"] = 10] = "RegexStr";
        TokenType[TokenType["True"] = 11] = "True";
        TokenType[TokenType["False"] = 12] = "False";
        TokenType[TokenType["In"] = 13] = "In";
        TokenType[TokenType["Not"] = 14] = "Not";
        TokenType[TokenType["And"] = 15] = "And";
        TokenType[TokenType["Or"] = 16] = "Or";
        TokenType[TokenType["Str"] = 17] = "Str";
        TokenType[TokenType["QuotedStr"] = 18] = "QuotedStr";
        TokenType[TokenType["Error"] = 19] = "Error";
        TokenType[TokenType["EOF"] = 20] = "EOF";
    })(TokenType || (exports.TokenType = TokenType = {}));
    function hintDidYouMean(...meant) {
        switch (meant.length) {
            case 1:
                return (0, nls_1.localize)('contextkey.scanner.hint.didYouMean1', "Did you mean {0}?", meant[0]);
            case 2:
                return (0, nls_1.localize)('contextkey.scanner.hint.didYouMean2', "Did you mean {0} or {1}?", meant[0], meant[1]);
            case 3:
                return (0, nls_1.localize)('contextkey.scanner.hint.didYouMean3', "Did you mean {0}, {1} or {2}?", meant[0], meant[1], meant[2]);
            default: // we just don't expect that many
                return undefined;
        }
    }
    const hintDidYouForgetToOpenOrCloseQuote = (0, nls_1.localize)('contextkey.scanner.hint.didYouForgetToOpenOrCloseQuote', "Did you forget to open or close the quote?");
    const hintDidYouForgetToEscapeSlash = (0, nls_1.localize)('contextkey.scanner.hint.didYouForgetToEscapeSlash', "Did you forget to escape the '/' (slash) character? Put two backslashes before it to escape, e.g., '\\\\/\'.");
    /**
     * A simple scanner for context keys.
     *
     * Example:
     *
     * ```ts
     * const scanner = new Scanner().reset('resourceFileName =~ /docker/ && !config.docker.enabled');
     * const tokens = [...scanner];
     * if (scanner.errorTokens.length > 0) {
     *     scanner.errorTokens.forEach(err => console.error(`Unexpected token at ${err.offset}: ${err.lexeme}\nHint: ${err.additional}`));
     * } else {
     *     // process tokens
     * }
     * ```
     */
    class Scanner {
        constructor() {
            this._input = '';
            this._start = 0;
            this._current = 0;
            this._tokens = [];
            this._errors = [];
            // u - unicode, y - sticky // TODO@ulugbekna: we accept double quotes as part of the string rather than as a delimiter (to preserve old parser's behavior)
            this.stringRe = /[a-zA-Z0-9_<>\-\./\\:\*\?\+\[\]\^,#@;"%\$\p{L}-]+/uy;
        }
        static getLexeme(token) {
            switch (token.type) {
                case 0 /* TokenType.LParen */:
                    return '(';
                case 1 /* TokenType.RParen */:
                    return ')';
                case 2 /* TokenType.Neg */:
                    return '!';
                case 3 /* TokenType.Eq */:
                    return token.isTripleEq ? '===' : '==';
                case 4 /* TokenType.NotEq */:
                    return token.isTripleEq ? '!==' : '!=';
                case 5 /* TokenType.Lt */:
                    return '<';
                case 6 /* TokenType.LtEq */:
                    return '<=';
                case 7 /* TokenType.Gt */:
                    return '>=';
                case 8 /* TokenType.GtEq */:
                    return '>=';
                case 9 /* TokenType.RegexOp */:
                    return '=~';
                case 10 /* TokenType.RegexStr */:
                    return token.lexeme;
                case 11 /* TokenType.True */:
                    return 'true';
                case 12 /* TokenType.False */:
                    return 'false';
                case 13 /* TokenType.In */:
                    return 'in';
                case 14 /* TokenType.Not */:
                    return 'not';
                case 15 /* TokenType.And */:
                    return '&&';
                case 16 /* TokenType.Or */:
                    return '||';
                case 17 /* TokenType.Str */:
                    return token.lexeme;
                case 18 /* TokenType.QuotedStr */:
                    return token.lexeme;
                case 19 /* TokenType.Error */:
                    return token.lexeme;
                case 20 /* TokenType.EOF */:
                    return 'EOF';
                default:
                    throw (0, errors_1.illegalState)(`unhandled token type: ${JSON.stringify(token)}; have you forgotten to add a case?`);
            }
        }
        static { this._regexFlags = new Set(['i', 'g', 's', 'm', 'y', 'u'].map(ch => ch.charCodeAt(0))); }
        static { this._keywords = new Map([
            ['not', 14 /* TokenType.Not */],
            ['in', 13 /* TokenType.In */],
            ['false', 12 /* TokenType.False */],
            ['true', 11 /* TokenType.True */],
        ]); }
        get errors() {
            return this._errors;
        }
        reset(value) {
            this._input = value;
            this._start = 0;
            this._current = 0;
            this._tokens = [];
            this._errors = [];
            return this;
        }
        scan() {
            while (!this._isAtEnd()) {
                this._start = this._current;
                const ch = this._advance();
                switch (ch) {
                    case 40 /* CharCode.OpenParen */:
                        this._addToken(0 /* TokenType.LParen */);
                        break;
                    case 41 /* CharCode.CloseParen */:
                        this._addToken(1 /* TokenType.RParen */);
                        break;
                    case 33 /* CharCode.ExclamationMark */:
                        if (this._match(61 /* CharCode.Equals */)) {
                            const isTripleEq = this._match(61 /* CharCode.Equals */); // eat last `=` if `!==`
                            this._tokens.push({ type: 4 /* TokenType.NotEq */, offset: this._start, isTripleEq });
                        }
                        else {
                            this._addToken(2 /* TokenType.Neg */);
                        }
                        break;
                    case 39 /* CharCode.SingleQuote */:
                        this._quotedString();
                        break;
                    case 47 /* CharCode.Slash */:
                        this._regex();
                        break;
                    case 61 /* CharCode.Equals */:
                        if (this._match(61 /* CharCode.Equals */)) { // support `==`
                            const isTripleEq = this._match(61 /* CharCode.Equals */); // eat last `=` if `===`
                            this._tokens.push({ type: 3 /* TokenType.Eq */, offset: this._start, isTripleEq });
                        }
                        else if (this._match(126 /* CharCode.Tilde */)) {
                            this._addToken(9 /* TokenType.RegexOp */);
                        }
                        else {
                            this._error(hintDidYouMean('==', '=~'));
                        }
                        break;
                    case 60 /* CharCode.LessThan */:
                        this._addToken(this._match(61 /* CharCode.Equals */) ? 6 /* TokenType.LtEq */ : 5 /* TokenType.Lt */);
                        break;
                    case 62 /* CharCode.GreaterThan */:
                        this._addToken(this._match(61 /* CharCode.Equals */) ? 8 /* TokenType.GtEq */ : 7 /* TokenType.Gt */);
                        break;
                    case 38 /* CharCode.Ampersand */:
                        if (this._match(38 /* CharCode.Ampersand */)) {
                            this._addToken(15 /* TokenType.And */);
                        }
                        else {
                            this._error(hintDidYouMean('&&'));
                        }
                        break;
                    case 124 /* CharCode.Pipe */:
                        if (this._match(124 /* CharCode.Pipe */)) {
                            this._addToken(16 /* TokenType.Or */);
                        }
                        else {
                            this._error(hintDidYouMean('||'));
                        }
                        break;
                    // TODO@ulugbekna: 1) rewrite using a regex 2) reconsider what characters are considered whitespace, including unicode, nbsp, etc.
                    case 32 /* CharCode.Space */:
                    case 13 /* CharCode.CarriageReturn */:
                    case 9 /* CharCode.Tab */:
                    case 10 /* CharCode.LineFeed */:
                    case 160 /* CharCode.NoBreakSpace */: // &nbsp
                        break;
                    default:
                        this._string();
                }
            }
            this._start = this._current;
            this._addToken(20 /* TokenType.EOF */);
            return Array.from(this._tokens);
        }
        _match(expected) {
            if (this._isAtEnd()) {
                return false;
            }
            if (this._input.charCodeAt(this._current) !== expected) {
                return false;
            }
            this._current++;
            return true;
        }
        _advance() {
            return this._input.charCodeAt(this._current++);
        }
        _peek() {
            return this._isAtEnd() ? 0 /* CharCode.Null */ : this._input.charCodeAt(this._current);
        }
        _addToken(type) {
            this._tokens.push({ type, offset: this._start });
        }
        _error(additional) {
            const offset = this._start;
            const lexeme = this._input.substring(this._start, this._current);
            const errToken = { type: 19 /* TokenType.Error */, offset: this._start, lexeme };
            this._errors.push({ offset, lexeme, additionalInfo: additional });
            this._tokens.push(errToken);
        }
        _string() {
            this.stringRe.lastIndex = this._start;
            const match = this.stringRe.exec(this._input);
            if (match) {
                this._current = this._start + match[0].length;
                const lexeme = this._input.substring(this._start, this._current);
                const keyword = Scanner._keywords.get(lexeme);
                if (keyword) {
                    this._addToken(keyword);
                }
                else {
                    this._tokens.push({ type: 17 /* TokenType.Str */, lexeme, offset: this._start });
                }
            }
        }
        // captures the lexeme without the leading and trailing '
        _quotedString() {
            while (this._peek() !== 39 /* CharCode.SingleQuote */ && !this._isAtEnd()) { // TODO@ulugbekna: add support for escaping ' ?
                this._advance();
            }
            if (this._isAtEnd()) {
                this._error(hintDidYouForgetToOpenOrCloseQuote);
                return;
            }
            // consume the closing '
            this._advance();
            this._tokens.push({ type: 18 /* TokenType.QuotedStr */, lexeme: this._input.substring(this._start + 1, this._current - 1), offset: this._start + 1 });
        }
        /*
         * Lexing a regex expression: /.../[igsmyu]*
         * Based on https://github.com/microsoft/TypeScript/blob/9247ef115e617805983740ba795d7a8164babf89/src/compiler/scanner.ts#L2129-L2181
         *
         * Note that we want slashes within a regex to be escaped, e.g., /file:\\/\\/\\// should match `file:///`
         */
        _regex() {
            let p = this._current;
            let inEscape = false;
            let inCharacterClass = false;
            while (true) {
                if (p >= this._input.length) {
                    this._current = p;
                    this._error(hintDidYouForgetToEscapeSlash);
                    return;
                }
                const ch = this._input.charCodeAt(p);
                if (inEscape) { // parsing an escape character
                    inEscape = false;
                }
                else if (ch === 47 /* CharCode.Slash */ && !inCharacterClass) { // end of regex
                    p++;
                    break;
                }
                else if (ch === 91 /* CharCode.OpenSquareBracket */) {
                    inCharacterClass = true;
                }
                else if (ch === 92 /* CharCode.Backslash */) {
                    inEscape = true;
                }
                else if (ch === 93 /* CharCode.CloseSquareBracket */) {
                    inCharacterClass = false;
                }
                p++;
            }
            // Consume flags // TODO@ulugbekna: use regex instead
            while (p < this._input.length && Scanner._regexFlags.has(this._input.charCodeAt(p))) {
                p++;
            }
            this._current = p;
            const lexeme = this._input.substring(this._start, this._current);
            this._tokens.push({ type: 10 /* TokenType.RegexStr */, lexeme, offset: this._start });
        }
        _isAtEnd() {
            return this._current >= this._input.length;
        }
    }
    exports.Scanner = Scanner;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nhbm5lci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vY29udGV4dGtleS9jb21tb24vc2Nhbm5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsSUFBa0IsU0FzQmpCO0lBdEJELFdBQWtCLFNBQVM7UUFDMUIsNkNBQU0sQ0FBQTtRQUNOLDZDQUFNLENBQUE7UUFDTix1Q0FBRyxDQUFBO1FBQ0gscUNBQUUsQ0FBQTtRQUNGLDJDQUFLLENBQUE7UUFDTCxxQ0FBRSxDQUFBO1FBQ0YseUNBQUksQ0FBQTtRQUNKLHFDQUFFLENBQUE7UUFDRix5Q0FBSSxDQUFBO1FBQ0osK0NBQU8sQ0FBQTtRQUNQLGtEQUFRLENBQUE7UUFDUiwwQ0FBSSxDQUFBO1FBQ0osNENBQUssQ0FBQTtRQUNMLHNDQUFFLENBQUE7UUFDRix3Q0FBRyxDQUFBO1FBQ0gsd0NBQUcsQ0FBQTtRQUNILHNDQUFFLENBQUE7UUFDRix3Q0FBRyxDQUFBO1FBQ0gsb0RBQVMsQ0FBQTtRQUNULDRDQUFLLENBQUE7UUFDTCx3Q0FBRyxDQUFBO0lBQ0osQ0FBQyxFQXRCaUIsU0FBUyx5QkFBVCxTQUFTLFFBc0IxQjtJQXNERCxTQUFTLGNBQWMsQ0FBQyxHQUFHLEtBQWU7UUFDekMsUUFBUSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDdEIsS0FBSyxDQUFDO2dCQUNMLE9BQU8sSUFBQSxjQUFRLEVBQUMscUNBQXFDLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkYsS0FBSyxDQUFDO2dCQUNMLE9BQU8sSUFBQSxjQUFRLEVBQUMscUNBQXFDLEVBQUUsMEJBQTBCLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lB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