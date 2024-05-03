/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/strings", "vs/platform/contextkey/common/scanner", "vs/platform/instantiation/common/instantiation", "vs/nls", "vs/base/common/errors"], function (require, exports, platform_1, strings_1, scanner_1, instantiation_1, nls_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IContextKeyService = exports.RawContextKey = exports.ContextKeyOrExpr = exports.ContextKeyAndExpr = exports.ContextKeyNotRegexExpr = exports.ContextKeyRegexExpr = exports.ContextKeySmallerEqualsExpr = exports.ContextKeySmallerExpr = exports.ContextKeyGreaterEqualsExpr = exports.ContextKeyGreaterExpr = exports.ContextKeyNotExpr = exports.ContextKeyNotEqualsExpr = exports.ContextKeyNotInExpr = exports.ContextKeyInExpr = exports.ContextKeyEqualsExpr = exports.ContextKeyDefinedExpr = exports.ContextKeyTrueExpr = exports.ContextKeyFalseExpr = exports.ContextKeyExpr = exports.Parser = exports.ContextKeyExprType = void 0;
    exports.setConstant = setConstant;
    exports.validateWhenClauses = validateWhenClauses;
    exports.expressionsAreEqualWithConstantSubstitution = expressionsAreEqualWithConstantSubstitution;
    exports.implies = implies;
    const CONSTANT_VALUES = new Map();
    CONSTANT_VALUES.set('false', false);
    CONSTANT_VALUES.set('true', true);
    CONSTANT_VALUES.set('isMac', platform_1.isMacintosh);
    CONSTANT_VALUES.set('isLinux', platform_1.isLinux);
    CONSTANT_VALUES.set('isWindows', platform_1.isWindows);
    CONSTANT_VALUES.set('isWeb', platform_1.isWeb);
    CONSTANT_VALUES.set('isMacNative', platform_1.isMacintosh && !platform_1.isWeb);
    CONSTANT_VALUES.set('isEdge', platform_1.isEdge);
    CONSTANT_VALUES.set('isFirefox', platform_1.isFirefox);
    CONSTANT_VALUES.set('isChrome', platform_1.isChrome);
    CONSTANT_VALUES.set('isSafari', platform_1.isSafari);
    /** allow register constant context keys that are known only after startup; requires running `substituteConstants` on the context key - https://github.com/microsoft/vscode/issues/174218#issuecomment-1437972127 */
    function setConstant(key, value) {
        if (CONSTANT_VALUES.get(key) !== undefined) {
            throw (0, errors_1.illegalArgument)('contextkey.setConstant(k, v) invoked with already set constant `k`');
        }
        CONSTANT_VALUES.set(key, value);
    }
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    var ContextKeyExprType;
    (function (ContextKeyExprType) {
        ContextKeyExprType[ContextKeyExprType["False"] = 0] = "False";
        ContextKeyExprType[ContextKeyExprType["True"] = 1] = "True";
        ContextKeyExprType[ContextKeyExprType["Defined"] = 2] = "Defined";
        ContextKeyExprType[ContextKeyExprType["Not"] = 3] = "Not";
        ContextKeyExprType[ContextKeyExprType["Equals"] = 4] = "Equals";
        ContextKeyExprType[ContextKeyExprType["NotEquals"] = 5] = "NotEquals";
        ContextKeyExprType[ContextKeyExprType["And"] = 6] = "And";
        ContextKeyExprType[ContextKeyExprType["Regex"] = 7] = "Regex";
        ContextKeyExprType[ContextKeyExprType["NotRegex"] = 8] = "NotRegex";
        ContextKeyExprType[ContextKeyExprType["Or"] = 9] = "Or";
        ContextKeyExprType[ContextKeyExprType["In"] = 10] = "In";
        ContextKeyExprType[ContextKeyExprType["NotIn"] = 11] = "NotIn";
        ContextKeyExprType[ContextKeyExprType["Greater"] = 12] = "Greater";
        ContextKeyExprType[ContextKeyExprType["GreaterEquals"] = 13] = "GreaterEquals";
        ContextKeyExprType[ContextKeyExprType["Smaller"] = 14] = "Smaller";
        ContextKeyExprType[ContextKeyExprType["SmallerEquals"] = 15] = "SmallerEquals";
    })(ContextKeyExprType || (exports.ContextKeyExprType = ContextKeyExprType = {}));
    const defaultConfig = {
        regexParsingWithErrorRecovery: true
    };
    const errorEmptyString = (0, nls_1.localize)('contextkey.parser.error.emptyString', "Empty context key expression");
    const hintEmptyString = (0, nls_1.localize)('contextkey.parser.error.emptyString.hint', "Did you forget to write an expression? You can also put 'false' or 'true' to always evaluate to false or true, respectively.");
    const errorNoInAfterNot = (0, nls_1.localize)('contextkey.parser.error.noInAfterNot', "'in' after 'not'.");
    const errorClosingParenthesis = (0, nls_1.localize)('contextkey.parser.error.closingParenthesis', "closing parenthesis ')'");
    const errorUnexpectedToken = (0, nls_1.localize)('contextkey.parser.error.unexpectedToken', "Unexpected token");
    const hintUnexpectedToken = (0, nls_1.localize)('contextkey.parser.error.unexpectedToken.hint', "Did you forget to put && or || before the token?");
    const errorUnexpectedEOF = (0, nls_1.localize)('contextkey.parser.error.unexpectedEOF', "Unexpected end of expression");
    const hintUnexpectedEOF = (0, nls_1.localize)('contextkey.parser.error.unexpectedEOF.hint', "Did you forget to put a context key?");
    /**
     * A parser for context key expressions.
     *
     * Example:
     * ```ts
     * const parser = new Parser();
     * const expr = parser.parse('foo == "bar" && baz == true');
     *
     * if (expr === undefined) {
     * 	// there were lexing or parsing errors
     * 	// process lexing errors with `parser.lexingErrors`
     *  // process parsing errors with `parser.parsingErrors`
     * } else {
     * 	// expr is a valid expression
     * }
     * ```
     */
    class Parser {
        // Note: this doesn't produce an exact syntax tree but a normalized one
        // ContextKeyExpression's that we use as AST nodes do not expose constructors that do not normalize
        static { this._parseError = new Error(); }
        get lexingErrors() {
            return this._scanner.errors;
        }
        get parsingErrors() {
            return this._parsingErrors;
        }
        constructor(_config = defaultConfig) {
            this._config = _config;
            // lifetime note: `_scanner` lives as long as the parser does, i.e., is not reset between calls to `parse`
            this._scanner = new scanner_1.Scanner();
            // lifetime note: `_tokens`, `_current`, and `_parsingErrors` must be reset between calls to `parse`
            this._tokens = [];
            this._current = 0; // invariant: 0 <= this._current < this._tokens.length ; any incrementation of this value must first call `_isAtEnd`
            this._parsingErrors = [];
            this._flagsGYRe = /g|y/g;
        }
        /**
         * Parse a context key expression.
         *
         * @param input the expression to parse
         * @returns the parsed expression or `undefined` if there's an error - call `lexingErrors` and `parsingErrors` to see the errors
         */
        parse(input) {
            if (input === '') {
                this._parsingErrors.push({ message: errorEmptyString, offset: 0, lexeme: '', additionalInfo: hintEmptyString });
                return undefined;
            }
            this._tokens = this._scanner.reset(input).scan();
            // @ulugbekna: we do not stop parsing if there are lexing errors to be able to reconstruct regexes with unescaped slashes; TODO@ulugbekna: make this respect config option for recovery
            this._current = 0;
            this._parsingErrors = [];
            try {
                const expr = this._expr();
                if (!this._isAtEnd()) {
                    const peek = this._peek();
                    const additionalInfo = peek.type === 17 /* TokenType.Str */ ? hintUnexpectedToken : undefined;
                    this._parsingErrors.push({ message: errorUnexpectedToken, offset: peek.offset, lexeme: scanner_1.Scanner.getLexeme(peek), additionalInfo });
                    throw Parser._parseError;
                }
                return expr;
            }
            catch (e) {
                if (!(e === Parser._parseError)) {
                    throw e;
                }
                return undefined;
            }
        }
        _expr() {
            return this._or();
        }
        _or() {
            const expr = [this._and()];
            while (this._matchOne(16 /* TokenType.Or */)) {
                const right = this._and();
                expr.push(right);
            }
            return expr.length === 1 ? expr[0] : ContextKeyExpr.or(...expr);
        }
        _and() {
            const expr = [this._term()];
            while (this._matchOne(15 /* TokenType.And */)) {
                const right = this._term();
                expr.push(right);
            }
            return expr.length === 1 ? expr[0] : ContextKeyExpr.and(...expr);
        }
        _term() {
            if (this._matchOne(2 /* TokenType.Neg */)) {
                const peek = this._peek();
                switch (peek.type) {
                    case 11 /* TokenType.True */:
                        this._advance();
                        return ContextKeyFalseExpr.INSTANCE;
                    case 12 /* TokenType.False */:
                        this._advance();
                        return ContextKeyTrueExpr.INSTANCE;
                    case 0 /* TokenType.LParen */: {
                        this._advance();
                        const expr = this._expr();
                        this._consume(1 /* TokenType.RParen */, errorClosingParenthesis);
                        return expr?.negate();
                    }
                    case 17 /* TokenType.Str */:
                        this._advance();
                        return ContextKeyNotExpr.create(peek.lexeme);
                    default:
                        throw this._errExpectedButGot(`KEY | true | false | '(' expression ')'`, peek);
                }
            }
            return this._primary();
        }
        _primary() {
            const peek = this._peek();
            switch (peek.type) {
                case 11 /* TokenType.True */:
                    this._advance();
                    return ContextKeyExpr.true();
                case 12 /* TokenType.False */:
                    this._advance();
                    return ContextKeyExpr.false();
                case 0 /* TokenType.LParen */: {
                    this._advance();
                    const expr = this._expr();
                    this._consume(1 /* TokenType.RParen */, errorClosingParenthesis);
                    return expr;
                }
                case 17 /* TokenType.Str */: {
                    // KEY
                    const key = peek.lexeme;
                    this._advance();
                    // =~ regex
                    if (this._matchOne(9 /* TokenType.RegexOp */)) {
                        // @ulugbekna: we need to reconstruct the regex from the tokens because some extensions use unescaped slashes in regexes
                        const expr = this._peek();
                        if (!this._config.regexParsingWithErrorRecovery) {
                            this._advance();
                            if (expr.type !== 10 /* TokenType.RegexStr */) {
                                throw this._errExpectedButGot(`REGEX`, expr);
                            }
                            const regexLexeme = expr.lexeme;
                            const closingSlashIndex = regexLexeme.lastIndexOf('/');
                            const flags = closingSlashIndex === regexLexeme.length - 1 ? undefined : this._removeFlagsGY(regexLexeme.substring(closingSlashIndex + 1));
                            let regexp;
                            try {
                                regexp = new RegExp(regexLexeme.substring(1, closingSlashIndex), flags);
                            }
                            catch (e) {
                                throw this._errExpectedButGot(`REGEX`, expr);
                            }
                            return ContextKeyRegexExpr.create(key, regexp);
                        }
                        switch (expr.type) {
                            case 10 /* TokenType.RegexStr */:
                            case 19 /* TokenType.Error */: { // also handle an ErrorToken in case of smth such as /(/file)/
                                const lexemeReconstruction = [expr.lexeme]; // /REGEX/ or /REGEX/FLAGS
                                this._advance();
                                let followingToken = this._peek();
                                let parenBalance = 0;
                                for (let i = 0; i < expr.lexeme.length; i++) {
                                    if (expr.lexeme.charCodeAt(i) === 40 /* CharCode.OpenParen */) {
                                        parenBalance++;
                                    }
                                    else if (expr.lexeme.charCodeAt(i) === 41 /* CharCode.CloseParen */) {
                                        parenBalance--;
                                    }
                                }
                                while (!this._isAtEnd() && followingToken.type !== 15 /* TokenType.And */ && followingToken.type !== 16 /* TokenType.Or */) {
                                    switch (followingToken.type) {
                                        case 0 /* TokenType.LParen */:
                                            parenBalance++;
                                            break;
                                        case 1 /* TokenType.RParen */:
                                            parenBalance--;
                                            break;
                                        case 10 /* TokenType.RegexStr */:
                                        case 18 /* TokenType.QuotedStr */:
                                            for (let i = 0; i < followingToken.lexeme.length; i++) {
                                                if (followingToken.lexeme.charCodeAt(i) === 40 /* CharCode.OpenParen */) {
                                                    parenBalance++;
                                                }
                                                else if (expr.lexeme.charCodeAt(i) === 41 /* CharCode.CloseParen */) {
                                                    parenBalance--;
                                                }
                                            }
                                    }
                                    if (parenBalance < 0) {
                                        break;
                                    }
                                    lexemeReconstruction.push(scanner_1.Scanner.getLexeme(followingToken));
                                    this._advance();
                                    followingToken = this._peek();
                                }
                                const regexLexeme = lexemeReconstruction.join('');
                                const closingSlashIndex = regexLexeme.lastIndexOf('/');
                                const flags = closingSlashIndex === regexLexeme.length - 1 ? undefined : this._removeFlagsGY(regexLexeme.substring(closingSlashIndex + 1));
                                let regexp;
                                try {
                                    regexp = new RegExp(regexLexeme.substring(1, closingSlashIndex), flags);
                                }
                                catch (e) {
                                    throw this._errExpectedButGot(`REGEX`, expr);
                                }
                                return ContextKeyExpr.regex(key, regexp);
                            }
                            case 18 /* TokenType.QuotedStr */: {
                                const serializedValue = expr.lexeme;
                                this._advance();
                                // replicate old regex parsing behavior
                                let regex = null;
                                if (!(0, strings_1.isFalsyOrWhitespace)(serializedValue)) {
                                    const start = serializedValue.indexOf('/');
                                    const end = serializedValue.lastIndexOf('/');
                                    if (start !== end && start >= 0) {
                                        const value = serializedValue.slice(start + 1, end);
                                        const caseIgnoreFlag = serializedValue[end + 1] === 'i' ? 'i' : '';
                                        try {
                                            regex = new RegExp(value, caseIgnoreFlag);
                                        }
                                        catch (_e) {
                                            throw this._errExpectedButGot(`REGEX`, expr);
                                        }
                                    }
                                }
                                if (regex === null) {
                                    throw this._errExpectedButGot('REGEX', expr);
                                }
                                return ContextKeyRegexExpr.create(key, regex);
                            }
                            default:
                                throw this._errExpectedButGot('REGEX', this._peek());
                        }
                    }
                    // [ 'not' 'in' value ]
                    if (this._matchOne(14 /* TokenType.Not */)) {
                        this._consume(13 /* TokenType.In */, errorNoInAfterNot);
                        const right = this._value();
                        return ContextKeyExpr.notIn(key, right);
                    }
                    // [ ('==' | '!=' | '<' | '<=' | '>' | '>=' | 'in') value ]
                    const maybeOp = this._peek().type;
                    switch (maybeOp) {
                        case 3 /* TokenType.Eq */: {
                            this._advance();
                            const right = this._value();
                            if (this._previous().type === 18 /* TokenType.QuotedStr */) { // to preserve old parser behavior: "foo == 'true'" is preserved as "foo == 'true'", but "foo == true" is optimized as "foo"
                                return ContextKeyExpr.equals(key, right);
                            }
                            switch (right) {
                                case 'true':
                                    return ContextKeyExpr.has(key);
                                case 'false':
                                    return ContextKeyExpr.not(key);
                                default:
                                    return ContextKeyExpr.equals(key, right);
                            }
                        }
                        case 4 /* TokenType.NotEq */: {
                            this._advance();
                            const right = this._value();
                            if (this._previous().type === 18 /* TokenType.QuotedStr */) { // same as above with "foo != 'true'"
                                return ContextKeyExpr.notEquals(key, right);
                            }
                            switch (right) {
                                case 'true':
                                    return ContextKeyExpr.not(key);
                                case 'false':
                                    return ContextKeyExpr.has(key);
                                default:
                                    return ContextKeyExpr.notEquals(key, right);
                            }
                        }
                        // TODO: ContextKeyExpr.smaller(key, right) accepts only `number` as `right` AND during eval of this node, we just eval to `false` if `right` is not a number
                        // consequently, package.json linter should _warn_ the user if they're passing undesired things to ops
                        case 5 /* TokenType.Lt */:
                            this._advance();
                            return ContextKeySmallerExpr.create(key, this._value());
                        case 6 /* TokenType.LtEq */:
                            this._advance();
                            return ContextKeySmallerEqualsExpr.create(key, this._value());
                        case 7 /* TokenType.Gt */:
                            this._advance();
                            return ContextKeyGreaterExpr.create(key, this._value());
                        case 8 /* TokenType.GtEq */:
                            this._advance();
                            return ContextKeyGreaterEqualsExpr.create(key, this._value());
                        case 13 /* TokenType.In */:
                            this._advance();
                            return ContextKeyExpr.in(key, this._value());
                        default:
                            return ContextKeyExpr.has(key);
                    }
                }
                case 20 /* TokenType.EOF */:
                    this._parsingErrors.push({ message: errorUnexpectedEOF, offset: peek.offset, lexeme: '', additionalInfo: hintUnexpectedEOF });
                    throw Parser._parseError;
                default:
                    throw this._errExpectedButGot(`true | false | KEY \n\t| KEY '=~' REGEX \n\t| KEY ('==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not' 'in') value`, this._peek());
            }
        }
        _value() {
            const token = this._peek();
            switch (token.type) {
                case 17 /* TokenType.Str */:
                case 18 /* TokenType.QuotedStr */:
                    this._advance();
                    return token.lexeme;
                case 11 /* TokenType.True */:
                    this._advance();
                    return 'true';
                case 12 /* TokenType.False */:
                    this._advance();
                    return 'false';
                case 13 /* TokenType.In */: // we support `in` as a value, e.g., "when": "languageId == in" - exists in existing extensions
                    this._advance();
                    return 'in';
                default:
                    // this allows "when": "foo == " which's used by existing extensions
                    // we do not call `_advance` on purpose - we don't want to eat unintended tokens
                    return '';
            }
        }
        _removeFlagsGY(flags) {
            return flags.replaceAll(this._flagsGYRe, '');
        }
        // careful: this can throw if current token is the initial one (ie index = 0)
        _previous() {
            return this._tokens[this._current - 1];
        }
        _matchOne(token) {
            if (this._check(token)) {
                this._advance();
                return true;
            }
            return false;
        }
        _advance() {
            if (!this._isAtEnd()) {
                this._current++;
            }
            return this._previous();
        }
        _consume(type, message) {
            if (this._check(type)) {
                return this._advance();
            }
            throw this._errExpectedButGot(message, this._peek());
        }
        _errExpectedButGot(expected, got, additionalInfo) {
            const message = (0, nls_1.localize)('contextkey.parser.error.expectedButGot', "Expected: {0}\nReceived: '{1}'.", expected, scanner_1.Scanner.getLexeme(got));
            const offset = got.offset;
            const lexeme = scanner_1.Scanner.getLexeme(got);
            this._parsingErrors.push({ message, offset, lexeme, additionalInfo });
            return Parser._parseError;
        }
        _check(type) {
            return this._peek().type === type;
        }
        _peek() {
            return this._tokens[this._current];
        }
        _isAtEnd() {
            return this._peek().type === 20 /* TokenType.EOF */;
        }
    }
    exports.Parser = Parser;
    class ContextKeyExpr {
        static false() {
            return ContextKeyFalseExpr.INSTANCE;
        }
        static true() {
            return ContextKeyTrueExpr.INSTANCE;
        }
        static has(key) {
            return ContextKeyDefinedExpr.create(key);
        }
        static equals(key, value) {
            return ContextKeyEqualsExpr.create(key, value);
        }
        static notEquals(key, value) {
            return ContextKeyNotEqualsExpr.create(key, value);
        }
        static regex(key, value) {
            return ContextKeyRegexExpr.create(key, value);
        }
        static in(key, value) {
            return ContextKeyInExpr.create(key, value);
        }
        static notIn(key, value) {
            return ContextKeyNotInExpr.create(key, value);
        }
        static not(key) {
            return ContextKeyNotExpr.create(key);
        }
        static and(...expr) {
            return ContextKeyAndExpr.create(expr, null, true);
        }
        static or(...expr) {
            return ContextKeyOrExpr.create(expr, null, true);
        }
        static greater(key, value) {
            return ContextKeyGreaterExpr.create(key, value);
        }
        static greaterEquals(key, value) {
            return ContextKeyGreaterEqualsExpr.create(key, value);
        }
        static smaller(key, value) {
            return ContextKeySmallerExpr.create(key, value);
        }
        static smallerEquals(key, value) {
            return ContextKeySmallerEqualsExpr.create(key, value);
        }
        static { this._parser = new Parser({ regexParsingWithErrorRecovery: false }); }
        static deserialize(serialized) {
            if (serialized === undefined || serialized === null) { // an empty string needs to be handled by the parser to get a corresponding parsing error reported
                return undefined;
            }
            const expr = this._parser.parse(serialized);
            return expr;
        }
    }
    exports.ContextKeyExpr = ContextKeyExpr;
    function validateWhenClauses(whenClauses) {
        const parser = new Parser({ regexParsingWithErrorRecovery: false }); // we run with no recovery to guide users to use correct regexes
        return whenClauses.map(whenClause => {
            parser.parse(whenClause);
            if (parser.lexingErrors.length > 0) {
                return parser.lexingErrors.map((se) => ({
                    errorMessage: se.additionalInfo ?
                        (0, nls_1.localize)('contextkey.scanner.errorForLinterWithHint', "Unexpected token. Hint: {0}", se.additionalInfo) :
                        (0, nls_1.localize)('contextkey.scanner.errorForLinter', "Unexpected token."),
                    offset: se.offset,
                    length: se.lexeme.length,
                }));
            }
            else if (parser.parsingErrors.length > 0) {
                return parser.parsingErrors.map((pe) => ({
                    errorMessage: pe.additionalInfo ? `${pe.message}. ${pe.additionalInfo}` : pe.message,
                    offset: pe.offset,
                    length: pe.lexeme.length,
                }));
            }
            else {
                return [];
            }
        });
    }
    function expressionsAreEqualWithConstantSubstitution(a, b) {
        const aExpr = a ? a.substituteConstants() : undefined;
        const bExpr = b ? b.substituteConstants() : undefined;
        if (!aExpr && !bExpr) {
            return true;
        }
        if (!aExpr || !bExpr) {
            return false;
        }
        return aExpr.equals(bExpr);
    }
    function cmp(a, b) {
        return a.cmp(b);
    }
    class ContextKeyFalseExpr {
        static { this.INSTANCE = new ContextKeyFalseExpr(); }
        constructor() {
            this.type = 0 /* ContextKeyExprType.False */;
        }
        cmp(other) {
            return this.type - other.type;
        }
        equals(other) {
            return (other.type === this.type);
        }
        substituteConstants() {
            return this;
        }
        evaluate(context) {
            return false;
        }
        serialize() {
            return 'false';
        }
        keys() {
            return [];
        }
        map(mapFnc) {
            return this;
        }
        negate() {
            return ContextKeyTrueExpr.INSTANCE;
        }
    }
    exports.ContextKeyFalseExpr = ContextKeyFalseExpr;
    class ContextKeyTrueExpr {
        static { this.INSTANCE = new ContextKeyTrueExpr(); }
        constructor() {
            this.type = 1 /* ContextKeyExprType.True */;
        }
        cmp(other) {
            return this.type - other.type;
        }
        equals(other) {
            return (other.type === this.type);
        }
        substituteConstants() {
            return this;
        }
        evaluate(context) {
            return true;
        }
        serialize() {
            return 'true';
        }
        keys() {
            return [];
        }
        map(mapFnc) {
            return this;
        }
        negate() {
            return ContextKeyFalseExpr.INSTANCE;
        }
    }
    exports.ContextKeyTrueExpr = ContextKeyTrueExpr;
    class ContextKeyDefinedExpr {
        static create(key, negated = null) {
            const constantValue = CONSTANT_VALUES.get(key);
            if (typeof constantValue === 'boolean') {
                return constantValue ? ContextKeyTrueExpr.INSTANCE : ContextKeyFalseExpr.INSTANCE;
            }
            return new ContextKeyDefinedExpr(key, negated);
        }
        constructor(key, negated) {
            this.key = key;
            this.negated = negated;
            this.type = 2 /* ContextKeyExprType.Defined */;
        }
        cmp(other) {
            if (other.type !== this.type) {
                return this.type - other.type;
            }
            return cmp1(this.key, other.key);
        }
        equals(other) {
            if (other.type === this.type) {
                return (this.key === other.key);
            }
            return false;
        }
        substituteConstants() {
            const constantValue = CONSTANT_VALUES.get(this.key);
            if (typeof constantValue === 'boolean') {
                return constantValue ? ContextKeyTrueExpr.INSTANCE : ContextKeyFalseExpr.INSTANCE;
            }
            return this;
        }
        evaluate(context) {
            return (!!context.getValue(this.key));
        }
        serialize() {
            return this.key;
        }
        keys() {
            return [this.key];
        }
        map(mapFnc) {
            return mapFnc.mapDefined(this.key);
        }
        negate() {
            if (!this.negated) {
                this.negated = ContextKeyNotExpr.create(this.key, this);
            }
            return this.negated;
        }
    }
    exports.ContextKeyDefinedExpr = ContextKeyDefinedExpr;
    class ContextKeyEqualsExpr {
        static create(key, value, negated = null) {
            if (typeof value === 'boolean') {
                return (value ? ContextKeyDefinedExpr.create(key, negated) : ContextKeyNotExpr.create(key, negated));
            }
            const constantValue = CONSTANT_VALUES.get(key);
            if (typeof constantValue === 'boolean') {
                const trueValue = constantValue ? 'true' : 'false';
                return (value === trueValue ? ContextKeyTrueExpr.INSTANCE : ContextKeyFalseExpr.INSTANCE);
            }
            return new ContextKeyEqualsExpr(key, value, negated);
        }
        constructor(key, value, negated) {
            this.key = key;
            this.value = value;
            this.negated = negated;
            this.type = 4 /* ContextKeyExprType.Equals */;
        }
        cmp(other) {
            if (other.type !== this.type) {
                return this.type - other.type;
            }
            return cmp2(this.key, this.value, other.key, other.value);
        }
        equals(other) {
            if (other.type === this.type) {
                return (this.key === other.key && this.value === other.value);
            }
            return false;
        }
        substituteConstants() {
            const constantValue = CONSTANT_VALUES.get(this.key);
            if (typeof constantValue === 'boolean') {
                const trueValue = constantValue ? 'true' : 'false';
                return (this.value === trueValue ? ContextKeyTrueExpr.INSTANCE : ContextKeyFalseExpr.INSTANCE);
            }
            return this;
        }
        evaluate(context) {
            // Intentional ==
            // eslint-disable-next-line eqeqeq
            return (context.getValue(this.key) == this.value);
        }
        serialize() {
            return `${this.key} == '${this.value}'`;
        }
        keys() {
            return [this.key];
        }
        map(mapFnc) {
            return mapFnc.mapEquals(this.key, this.value);
        }
        negate() {
            if (!this.negated) {
                this.negated = ContextKeyNotEqualsExpr.create(this.key, this.value, this);
            }
            return this.negated;
        }
    }
    exports.ContextKeyEqualsExpr = ContextKeyEqualsExpr;
    class ContextKeyInExpr {
        static create(key, valueKey) {
            return new ContextKeyInExpr(key, valueKey);
        }
        constructor(key, valueKey) {
            this.key = key;
            this.valueKey = valueKey;
            this.type = 10 /* ContextKeyExprType.In */;
            this.negated = null;
        }
        cmp(other) {
            if (other.type !== this.type) {
                return this.type - other.type;
            }
            return cmp2(this.key, this.valueKey, other.key, other.valueKey);
        }
        equals(other) {
            if (other.type === this.type) {
                return (this.key === other.key && this.valueKey === other.valueKey);
            }
            return false;
        }
        substituteConstants() {
            return this;
        }
        evaluate(context) {
            const source = context.getValue(this.valueKey);
            const item = context.getValue(this.key);
            if (Array.isArray(source)) {
                return source.includes(item);
            }
            if (typeof item === 'string' && typeof source === 'object' && source !== null) {
                return hasOwnProperty.call(source, item);
            }
            return false;
        }
        serialize() {
            return `${this.key} in '${this.valueKey}'`;
        }
        keys() {
            return [this.key, this.valueKey];
        }
        map(mapFnc) {
            return mapFnc.mapIn(this.key, this.valueKey);
        }
        negate() {
            if (!this.negated) {
                this.negated = ContextKeyNotInExpr.create(this.key, this.valueKey);
            }
            return this.negated;
        }
    }
    exports.ContextKeyInExpr = ContextKeyInExpr;
    class ContextKeyNotInExpr {
        static create(key, valueKey) {
            return new ContextKeyNotInExpr(key, valueKey);
        }
        constructor(key, valueKey) {
            this.key = key;
            this.valueKey = valueKey;
            this.type = 11 /* ContextKeyExprType.NotIn */;
            this._negated = ContextKeyInExpr.create(key, valueKey);
        }
        cmp(other) {
            if (other.type !== this.type) {
                return this.type - other.type;
            }
            return this._negated.cmp(other._negated);
        }
        equals(other) {
            if (other.type === this.type) {
                return this._negated.equals(other._negated);
            }
            return false;
        }
        substituteConstants() {
            return this;
        }
        evaluate(context) {
            return !this._negated.evaluate(context);
        }
        serialize() {
            return `${this.key} not in '${this.valueKey}'`;
        }
        keys() {
            return this._negated.keys();
        }
        map(mapFnc) {
            return mapFnc.mapNotIn(this.key, this.valueKey);
        }
        negate() {
            return this._negated;
        }
    }
    exports.ContextKeyNotInExpr = ContextKeyNotInExpr;
    class ContextKeyNotEqualsExpr {
        static create(key, value, negated = null) {
            if (typeof value === 'boolean') {
                if (value) {
                    return ContextKeyNotExpr.create(key, negated);
                }
                return ContextKeyDefinedExpr.create(key, negated);
            }
            const constantValue = CONSTANT_VALUES.get(key);
            if (typeof constantValue === 'boolean') {
                const falseValue = constantValue ? 'true' : 'false';
                return (value === falseValue ? ContextKeyFalseExpr.INSTANCE : ContextKeyTrueExpr.INSTANCE);
            }
            return new ContextKeyNotEqualsExpr(key, value, negated);
        }
        constructor(key, value, negated) {
            this.key = key;
            this.value = value;
            this.negated = negated;
            this.type = 5 /* ContextKeyExprType.NotEquals */;
        }
        cmp(other) {
            if (other.type !== this.type) {
                return this.type - other.type;
            }
            return cmp2(this.key, this.value, other.key, other.value);
        }
        equals(other) {
            if (other.type === this.type) {
                return (this.key === other.key && this.value === other.value);
            }
            return false;
        }
        substituteConstants() {
            const constantValue = CONSTANT_VALUES.get(this.key);
            if (typeof constantValue === 'boolean') {
                const falseValue = constantValue ? 'true' : 'false';
                return (this.value === falseValue ? ContextKeyFalseExpr.INSTANCE : ContextKeyTrueExpr.INSTANCE);
            }
            return this;
        }
        evaluate(context) {
            // Intentional !=
            // eslint-disable-next-line eqeqeq
            return (context.getValue(this.key) != this.value);
        }
        serialize() {
            return `${this.key} != '${this.value}'`;
        }
        keys() {
            return [this.key];
        }
        map(mapFnc) {
            return mapFnc.mapNotEquals(this.key, this.value);
        }
        negate() {
            if (!this.negated) {
                this.negated = ContextKeyEqualsExpr.create(this.key, this.value, this);
            }
            return this.negated;
        }
    }
    exports.ContextKeyNotEqualsExpr = ContextKeyNotEqualsExpr;
    class ContextKeyNotExpr {
        static create(key, negated = null) {
            const constantValue = CONSTANT_VALUES.get(key);
            if (typeof constantValue === 'boolean') {
                return (constantValue ? ContextKeyFalseExpr.INSTANCE : ContextKeyTrueExpr.INSTANCE);
            }
            return new ContextKeyNotExpr(key, negated);
        }
        constructor(key, negated) {
            this.key = key;
            this.negated = negated;
            this.type = 3 /* ContextKeyExprType.Not */;
        }
        cmp(other) {
            if (other.type !== this.type) {
                return this.type - other.type;
            }
            return cmp1(this.key, other.key);
        }
        equals(other) {
            if (other.type === this.type) {
                return (this.key === other.key);
            }
            return false;
        }
        substituteConstants() {
            const constantValue = CONSTANT_VALUES.get(this.key);
            if (typeof constantValue === 'boolean') {
                return (constantValue ? ContextKeyFalseExpr.INSTANCE : ContextKeyTrueExpr.INSTANCE);
            }
            return this;
        }
        evaluate(context) {
            return (!context.getValue(this.key));
        }
        serialize() {
            return `!${this.key}`;
        }
        keys() {
            return [this.key];
        }
        map(mapFnc) {
            return mapFnc.mapNot(this.key);
        }
        negate() {
            if (!this.negated) {
                this.negated = ContextKeyDefinedExpr.create(this.key, this);
            }
            return this.negated;
        }
    }
    exports.ContextKeyNotExpr = ContextKeyNotExpr;
    function withFloatOrStr(value, callback) {
        if (typeof value === 'string') {
            const n = parseFloat(value);
            if (!isNaN(n)) {
                value = n;
            }
        }
        if (typeof value === 'string' || typeof value === 'number') {
            return callback(value);
        }
        return ContextKeyFalseExpr.INSTANCE;
    }
    class ContextKeyGreaterExpr {
        static create(key, _value, negated = null) {
            return withFloatOrStr(_value, (value) => new ContextKeyGreaterExpr(key, value, negated));
        }
        constructor(key, value, negated) {
            this.key = key;
            this.value = value;
            this.negated = negated;
            this.type = 12 /* ContextKeyExprType.Greater */;
        }
        cmp(other) {
            if (other.type !== this.type) {
                return this.type - other.type;
            }
            return cmp2(this.key, this.value, other.key, other.value);
        }
        equals(other) {
            if (other.type === this.type) {
                return (this.key === other.key && this.value === other.value);
            }
            return false;
        }
        substituteConstants() {
            return this;
        }
        evaluate(context) {
            if (typeof this.value === 'string') {
                return false;
            }
            return (parseFloat(context.getValue(this.key)) > this.value);
        }
        serialize() {
            return `${this.key} > ${this.value}`;
        }
        keys() {
            return [this.key];
        }
        map(mapFnc) {
            return mapFnc.mapGreater(this.key, this.value);
        }
        negate() {
            if (!this.negated) {
                this.negated = ContextKeySmallerEqualsExpr.create(this.key, this.value, this);
            }
            return this.negated;
        }
    }
    exports.ContextKeyGreaterExpr = ContextKeyGreaterExpr;
    class ContextKeyGreaterEqualsExpr {
        static create(key, _value, negated = null) {
            return withFloatOrStr(_value, (value) => new ContextKeyGreaterEqualsExpr(key, value, negated));
        }
        constructor(key, value, negated) {
            this.key = key;
            this.value = value;
            this.negated = negated;
            this.type = 13 /* ContextKeyExprType.GreaterEquals */;
        }
        cmp(other) {
            if (other.type !== this.type) {
                return this.type - other.type;
            }
            return cmp2(this.key, this.value, other.key, other.value);
        }
        equals(other) {
            if (other.type === this.type) {
                return (this.key === other.key && this.value === other.value);
            }
            return false;
        }
        substituteConstants() {
            return this;
        }
        evaluate(context) {
            if (typeof this.value === 'string') {
                return false;
            }
            return (parseFloat(context.getValue(this.key)) >= this.value);
        }
        serialize() {
            return `${this.key} >= ${this.value}`;
        }
        keys() {
            return [this.key];
        }
        map(mapFnc) {
            return mapFnc.mapGreaterEquals(this.key, this.value);
        }
        negate() {
            if (!this.negated) {
                this.negated = ContextKeySmallerExpr.create(this.key, this.value, this);
            }
            return this.negated;
        }
    }
    exports.ContextKeyGreaterEqualsExpr = ContextKeyGreaterEqualsExpr;
    class ContextKeySmallerExpr {
        static create(key, _value, negated = null) {
            return withFloatOrStr(_value, (value) => new ContextKeySmallerExpr(key, value, negated));
        }
        constructor(key, value, negated) {
            this.key = key;
            this.value = value;
            this.negated = negated;
            this.type = 14 /* ContextKeyExprType.Smaller */;
        }
        cmp(other) {
            if (other.type !== this.type) {
                return this.type - other.type;
            }
            return cmp2(this.key, this.value, other.key, other.value);
        }
        equals(other) {
            if (other.type === this.type) {
                return (this.key === other.key && this.value === other.value);
            }
            return false;
        }
        substituteConstants() {
            return this;
        }
        evaluate(context) {
            if (typeof this.value === 'string') {
                return false;
            }
            return (parseFloat(context.getValue(this.key)) < this.value);
        }
        serialize() {
            return `${this.key} < ${this.value}`;
        }
        keys() {
            return [this.key];
        }
        map(mapFnc) {
            return mapFnc.mapSmaller(this.key, this.value);
        }
        negate() {
            if (!this.negated) {
                this.negated = ContextKeyGreaterEqualsExpr.create(this.key, this.value, this);
            }
            return this.negated;
        }
    }
    exports.ContextKeySmallerExpr = ContextKeySmallerExpr;
    class ContextKeySmallerEqualsExpr {
        static create(key, _value, negated = null) {
            return withFloatOrStr(_value, (value) => new ContextKeySmallerEqualsExpr(key, value, negated));
        }
        constructor(key, value, negated) {
            this.key = key;
            this.value = value;
            this.negated = negated;
            this.type = 15 /* ContextKeyExprType.SmallerEquals */;
        }
        cmp(other) {
            if (other.type !== this.type) {
                return this.type - other.type;
            }
            return cmp2(this.key, this.value, other.key, other.value);
        }
        equals(other) {
            if (other.type === this.type) {
                return (this.key === other.key && this.value === other.value);
            }
            return false;
        }
        substituteConstants() {
            return this;
        }
        evaluate(context) {
            if (typeof this.value === 'string') {
                return false;
            }
            return (parseFloat(context.getValue(this.key)) <= this.value);
        }
        serialize() {
            return `${this.key} <= ${this.value}`;
        }
        keys() {
            return [this.key];
        }
        map(mapFnc) {
            return mapFnc.mapSmallerEquals(this.key, this.value);
        }
        negate() {
            if (!this.negated) {
                this.negated = ContextKeyGreaterExpr.create(this.key, this.value, this);
            }
            return this.negated;
        }
    }
    exports.ContextKeySmallerEqualsExpr = ContextKeySmallerEqualsExpr;
    class ContextKeyRegexExpr {
        static create(key, regexp) {
            return new ContextKeyRegexExpr(key, regexp);
        }
        constructor(key, regexp) {
            this.key = key;
            this.regexp = regexp;
            this.type = 7 /* ContextKeyExprType.Regex */;
            this.negated = null;
            //
        }
        cmp(other) {
            if (other.type !== this.type) {
                return this.type - other.type;
            }
            if (this.key < other.key) {
                return -1;
            }
            if (this.key > other.key) {
                return 1;
            }
            const thisSource = this.regexp ? this.regexp.source : '';
            const otherSource = other.regexp ? other.regexp.source : '';
            if (thisSource < otherSource) {
                return -1;
            }
            if (thisSource > otherSource) {
                return 1;
            }
            return 0;
        }
        equals(other) {
            if (other.type === this.type) {
                const thisSource = this.regexp ? this.regexp.source : '';
                const otherSource = other.regexp ? other.regexp.source : '';
                return (this.key === other.key && thisSource === otherSource);
            }
            return false;
        }
        substituteConstants() {
            return this;
        }
        evaluate(context) {
            const value = context.getValue(this.key);
            return this.regexp ? this.regexp.test(value) : false;
        }
        serialize() {
            const value = this.regexp
                ? `/${this.regexp.source}/${this.regexp.flags}`
                : '/invalid/';
            return `${this.key} =~ ${value}`;
        }
        keys() {
            return [this.key];
        }
        map(mapFnc) {
            return mapFnc.mapRegex(this.key, this.regexp);
        }
        negate() {
            if (!this.negated) {
                this.negated = ContextKeyNotRegexExpr.create(this);
            }
            return this.negated;
        }
    }
    exports.ContextKeyRegexExpr = ContextKeyRegexExpr;
    class ContextKeyNotRegexExpr {
        static create(actual) {
            return new ContextKeyNotRegexExpr(actual);
        }
        constructor(_actual) {
            this._actual = _actual;
            this.type = 8 /* ContextKeyExprType.NotRegex */;
            //
        }
        cmp(other) {
            if (other.type !== this.type) {
                return this.type - other.type;
            }
            return this._actual.cmp(other._actual);
        }
        equals(other) {
            if (other.type === this.type) {
                return this._actual.equals(other._actual);
            }
            return false;
        }
        substituteConstants() {
            return this;
        }
        evaluate(context) {
            return !this._actual.evaluate(context);
        }
        serialize() {
            return `!(${this._actual.serialize()})`;
        }
        keys() {
            return this._actual.keys();
        }
        map(mapFnc) {
            return new ContextKeyNotRegexExpr(this._actual.map(mapFnc));
        }
        negate() {
            return this._actual;
        }
    }
    exports.ContextKeyNotRegexExpr = ContextKeyNotRegexExpr;
    /**
     * @returns the same instance if nothing changed.
     */
    function eliminateConstantsInArray(arr) {
        // Allocate array only if there is a difference
        let newArr = null;
        for (let i = 0, len = arr.length; i < len; i++) {
            const newExpr = arr[i].substituteConstants();
            if (arr[i] !== newExpr) {
                // something has changed!
                // allocate array on first difference
                if (newArr === null) {
                    newArr = [];
                    for (let j = 0; j < i; j++) {
                        newArr[j] = arr[j];
                    }
                }
            }
            if (newArr !== null) {
                newArr[i] = newExpr;
            }
        }
        if (newArr === null) {
            return arr;
        }
        return newArr;
    }
    class ContextKeyAndExpr {
        static create(_expr, negated, extraRedundantCheck) {
            return ContextKeyAndExpr._normalizeArr(_expr, negated, extraRedundantCheck);
        }
        constructor(expr, negated) {
            this.expr = expr;
            this.negated = negated;
            this.type = 6 /* ContextKeyExprType.And */;
        }
        cmp(other) {
            if (other.type !== this.type) {
                return this.type - other.type;
            }
            if (this.expr.length < other.expr.length) {
                return -1;
            }
            if (this.expr.length > other.expr.length) {
                return 1;
            }
            for (let i = 0, len = this.expr.length; i < len; i++) {
                const r = cmp(this.expr[i], other.expr[i]);
                if (r !== 0) {
                    return r;
                }
            }
            return 0;
        }
        equals(other) {
            if (other.type === this.type) {
                if (this.expr.length !== other.expr.length) {
                    return false;
                }
                for (let i = 0, len = this.expr.length; i < len; i++) {
                    if (!this.expr[i].equals(other.expr[i])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
        substituteConstants() {
            const exprArr = eliminateConstantsInArray(this.expr);
            if (exprArr === this.expr) {
                // no change
                return this;
            }
            return ContextKeyAndExpr.create(exprArr, this.negated, false);
        }
        evaluate(context) {
            for (let i = 0, len = this.expr.length; i < len; i++) {
                if (!this.expr[i].evaluate(context)) {
                    return false;
                }
            }
            return true;
        }
        static _normalizeArr(arr, negated, extraRedundantCheck) {
            const expr = [];
            let hasTrue = false;
            for (const e of arr) {
                if (!e) {
                    continue;
                }
                if (e.type === 1 /* ContextKeyExprType.True */) {
                    // anything && true ==> anything
                    hasTrue = true;
                    continue;
                }
                if (e.type === 0 /* ContextKeyExprType.False */) {
                    // anything && false ==> false
                    return ContextKeyFalseExpr.INSTANCE;
                }
                if (e.type === 6 /* ContextKeyExprType.And */) {
                    expr.push(...e.expr);
                    continue;
                }
                expr.push(e);
            }
            if (expr.length === 0 && hasTrue) {
                return ContextKeyTrueExpr.INSTANCE;
            }
            if (expr.length === 0) {
                return undefined;
            }
            if (expr.length === 1) {
                return expr[0];
            }
            expr.sort(cmp);
            // eliminate duplicate terms
            for (let i = 1; i < expr.length; i++) {
                if (expr[i - 1].equals(expr[i])) {
                    expr.splice(i, 1);
                    i--;
                }
            }
            if (expr.length === 1) {
                return expr[0];
            }
            // We must distribute any OR expression because we don't support parens
            // OR extensions will be at the end (due to sorting rules)
            while (expr.length > 1) {
                const lastElement = expr[expr.length - 1];
                if (lastElement.type !== 9 /* ContextKeyExprType.Or */) {
                    break;
                }
                // pop the last element
                expr.pop();
                // pop the second to last element
                const secondToLastElement = expr.pop();
                const isFinished = (expr.length === 0);
                // distribute `lastElement` over `secondToLastElement`
                const resultElement = ContextKeyOrExpr.create(lastElement.expr.map(el => ContextKeyAndExpr.create([el, secondToLastElement], null, extraRedundantCheck)), null, isFinished);
                if (resultElement) {
                    expr.push(resultElement);
                    expr.sort(cmp);
                }
            }
            if (expr.length === 1) {
                return expr[0];
            }
            // resolve false AND expressions
            if (extraRedundantCheck) {
                for (let i = 0; i < expr.length; i++) {
                    for (let j = i + 1; j < expr.length; j++) {
                        if (expr[i].negate().equals(expr[j])) {
                            // A && !A case
                            return ContextKeyFalseExpr.INSTANCE;
                        }
                    }
                }
                if (expr.length === 1) {
                    return expr[0];
                }
            }
            return new ContextKeyAndExpr(expr, negated);
        }
        serialize() {
            return this.expr.map(e => e.serialize()).join(' && ');
        }
        keys() {
            const result = [];
            for (const expr of this.expr) {
                result.push(...expr.keys());
            }
            return result;
        }
        map(mapFnc) {
            return new ContextKeyAndExpr(this.expr.map(expr => expr.map(mapFnc)), null);
        }
        negate() {
            if (!this.negated) {
                const result = [];
                for (const expr of this.expr) {
                    result.push(expr.negate());
                }
                this.negated = ContextKeyOrExpr.create(result, this, true);
            }
            return this.negated;
        }
    }
    exports.ContextKeyAndExpr = ContextKeyAndExpr;
    class ContextKeyOrExpr {
        static create(_expr, negated, extraRedundantCheck) {
            return ContextKeyOrExpr._normalizeArr(_expr, negated, extraRedundantCheck);
        }
        constructor(expr, negated) {
            this.expr = expr;
            this.negated = negated;
            this.type = 9 /* ContextKeyExprType.Or */;
        }
        cmp(other) {
            if (other.type !== this.type) {
                return this.type - other.type;
            }
            if (this.expr.length < other.expr.length) {
                return -1;
            }
            if (this.expr.length > other.expr.length) {
                return 1;
            }
            for (let i = 0, len = this.expr.length; i < len; i++) {
                const r = cmp(this.expr[i], other.expr[i]);
                if (r !== 0) {
                    return r;
                }
            }
            return 0;
        }
        equals(other) {
            if (other.type === this.type) {
                if (this.expr.length !== other.expr.length) {
                    return false;
                }
                for (let i = 0, len = this.expr.length; i < len; i++) {
                    if (!this.expr[i].equals(other.expr[i])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
        substituteConstants() {
            const exprArr = eliminateConstantsInArray(this.expr);
            if (exprArr === this.expr) {
                // no change
                return this;
            }
            return ContextKeyOrExpr.create(exprArr, this.negated, false);
        }
        evaluate(context) {
            for (let i = 0, len = this.expr.length; i < len; i++) {
                if (this.expr[i].evaluate(context)) {
                    return true;
                }
            }
            return false;
        }
        static _normalizeArr(arr, negated, extraRedundantCheck) {
            let expr = [];
            let hasFalse = false;
            if (arr) {
                for (let i = 0, len = arr.length; i < len; i++) {
                    const e = arr[i];
                    if (!e) {
                        continue;
                    }
                    if (e.type === 0 /* ContextKeyExprType.False */) {
                        // anything || false ==> anything
                        hasFalse = true;
                        continue;
                    }
                    if (e.type === 1 /* ContextKeyExprType.True */) {
                        // anything || true ==> true
                        return ContextKeyTrueExpr.INSTANCE;
                    }
                    if (e.type === 9 /* ContextKeyExprType.Or */) {
                        expr = expr.concat(e.expr);
                        continue;
                    }
                    expr.push(e);
                }
                if (expr.length === 0 && hasFalse) {
                    return ContextKeyFalseExpr.INSTANCE;
                }
                expr.sort(cmp);
            }
            if (expr.length === 0) {
                return undefined;
            }
            if (expr.length === 1) {
                return expr[0];
            }
            // eliminate duplicate terms
            for (let i = 1; i < expr.length; i++) {
                if (expr[i - 1].equals(expr[i])) {
                    expr.splice(i, 1);
                    i--;
                }
            }
            if (expr.length === 1) {
                return expr[0];
            }
            // resolve true OR expressions
            if (extraRedundantCheck) {
                for (let i = 0; i < expr.length; i++) {
                    for (let j = i + 1; j < expr.length; j++) {
                        if (expr[i].negate().equals(expr[j])) {
                            // A || !A case
                            return ContextKeyTrueExpr.INSTANCE;
                        }
                    }
                }
                if (expr.length === 1) {
                    return expr[0];
                }
            }
            return new ContextKeyOrExpr(expr, negated);
        }
        serialize() {
            return this.expr.map(e => e.serialize()).join(' || ');
        }
        keys() {
            const result = [];
            for (const expr of this.expr) {
                result.push(...expr.keys());
            }
            return result;
        }
        map(mapFnc) {
            return new ContextKeyOrExpr(this.expr.map(expr => expr.map(mapFnc)), null);
        }
        negate() {
            if (!this.negated) {
                const result = [];
                for (const expr of this.expr) {
                    result.push(expr.negate());
                }
                // We don't support parens, so here we distribute the AND over the OR terminals
                // We always take the first 2 AND pairs and distribute them
                while (result.length > 1) {
                    const LEFT = result.shift();
                    const RIGHT = result.shift();
                    const all = [];
                    for (const left of getTerminals(LEFT)) {
                        for (const right of getTerminals(RIGHT)) {
                            all.push(ContextKeyAndExpr.create([left, right], null, false));
                        }
                    }
                    result.unshift(ContextKeyOrExpr.create(all, null, false));
                }
                this.negated = ContextKeyOrExpr.create(result, this, true);
            }
            return this.negated;
        }
    }
    exports.ContextKeyOrExpr = ContextKeyOrExpr;
    class RawContextKey extends ContextKeyDefinedExpr {
        static { this._info = []; }
        static all() {
            return RawContextKey._info.values();
        }
        constructor(key, defaultValue, metaOrHide) {
            super(key, null);
            this._defaultValue = defaultValue;
            // collect all context keys into a central place
            if (typeof metaOrHide === 'object') {
                RawContextKey._info.push({ ...metaOrHide, key });
            }
            else if (metaOrHide !== true) {
                RawContextKey._info.push({ key, description: metaOrHide, type: defaultValue !== null && defaultValue !== undefined ? typeof defaultValue : undefined });
            }
        }
        bindTo(target) {
            return target.createKey(this.key, this._defaultValue);
        }
        getValue(target) {
            return target.getContextKeyValue(this.key);
        }
        toNegated() {
            return this.negate();
        }
        isEqualTo(value) {
            return ContextKeyEqualsExpr.create(this.key, value);
        }
        notEqualsTo(value) {
            return ContextKeyNotEqualsExpr.create(this.key, value);
        }
    }
    exports.RawContextKey = RawContextKey;
    exports.IContextKeyService = (0, instantiation_1.createDecorator)('contextKeyService');
    function cmp1(key1, key2) {
        if (key1 < key2) {
            return -1;
        }
        if (key1 > key2) {
            return 1;
        }
        return 0;
    }
    function cmp2(key1, value1, key2, value2) {
        if (key1 < key2) {
            return -1;
        }
        if (key1 > key2) {
            return 1;
        }
        if (value1 < value2) {
            return -1;
        }
        if (value1 > value2) {
            return 1;
        }
        return 0;
    }
    /**
     * Returns true if it is provable `p` implies `q`.
     */
    function implies(p, q) {
        if (p.type === 0 /* ContextKeyExprType.False */ || q.type === 1 /* ContextKeyExprType.True */) {
            // false implies anything
            // anything implies true
            return true;
        }
        if (p.type === 9 /* ContextKeyExprType.Or */) {
            if (q.type === 9 /* ContextKeyExprType.Or */) {
                // `a || b || c` can only imply something like `a || b || c || d`
                return allElementsIncluded(p.expr, q.expr);
            }
            return false;
        }
        if (q.type === 9 /* ContextKeyExprType.Or */) {
            for (const element of q.expr) {
                if (implies(p, element)) {
                    return true;
                }
            }
            return false;
        }
        if (p.type === 6 /* ContextKeyExprType.And */) {
            if (q.type === 6 /* ContextKeyExprType.And */) {
                // `a && b && c` implies `a && c`
                return allElementsIncluded(q.expr, p.expr);
            }
            for (const element of p.expr) {
                if (implies(element, q)) {
                    return true;
                }
            }
            return false;
        }
        return p.equals(q);
    }
    /**
     * Returns true if all elements in `p` are also present in `q`.
     * The two arrays are assumed to be sorted
     */
    function allElementsIncluded(p, q) {
        let pIndex = 0;
        let qIndex = 0;
        while (pIndex < p.length && qIndex < q.length) {
            const cmp = p[pIndex].cmp(q[qIndex]);
            if (cmp < 0) {
                // an element from `p` is missing from `q`
                return false;
            }
            else if (cmp === 0) {
                pIndex++;
                qIndex++;
            }
            else {
                qIndex++;
            }
        }
        return (pIndex === p.length);
    }
    function getTerminals(node) {
        if (node.type === 9 /* ContextKeyExprType.Or */) {
            return node.expr;
        }
        return [node];
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dGtleS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vY29udGV4dGtleS9jb21tb24vY29udGV4dGtleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEwQmhHLGtDQUlDO0lBOGxCRCxrREF5QkM7SUFFRCxrR0FVQztJQXM0Q0QsMEJBdUNDO0lBbGtFRCxNQUFNLGVBQWUsR0FBRyxJQUFJLEdBQUcsRUFBbUIsQ0FBQztJQUNuRCxlQUFlLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwQyxlQUFlLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNsQyxlQUFlLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxzQkFBVyxDQUFDLENBQUM7SUFDMUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsa0JBQU8sQ0FBQyxDQUFDO0lBQ3hDLGVBQWUsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLG9CQUFTLENBQUMsQ0FBQztJQUM1QyxlQUFlLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxnQkFBSyxDQUFDLENBQUM7SUFDcEMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsc0JBQVcsSUFBSSxDQUFDLGdCQUFLLENBQUMsQ0FBQztJQUMxRCxlQUFlLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxpQkFBTSxDQUFDLENBQUM7SUFDdEMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsb0JBQVMsQ0FBQyxDQUFDO0lBQzVDLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLG1CQUFRLENBQUMsQ0FBQztJQUMxQyxlQUFlLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxtQkFBUSxDQUFDLENBQUM7SUFFMUMsb05BQW9O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