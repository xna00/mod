/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ParseOptions = exports.ParseErrorCode = exports.SyntaxKind = exports.ScanError = void 0;
    exports.createScanner = createScanner;
    exports.getLocation = getLocation;
    exports.parse = parse;
    exports.parseTree = parseTree;
    exports.findNodeAtLocation = findNodeAtLocation;
    exports.getNodePath = getNodePath;
    exports.getNodeValue = getNodeValue;
    exports.contains = contains;
    exports.findNodeAtOffset = findNodeAtOffset;
    exports.visit = visit;
    exports.stripComments = stripComments;
    exports.getNodeType = getNodeType;
    var ScanError;
    (function (ScanError) {
        ScanError[ScanError["None"] = 0] = "None";
        ScanError[ScanError["UnexpectedEndOfComment"] = 1] = "UnexpectedEndOfComment";
        ScanError[ScanError["UnexpectedEndOfString"] = 2] = "UnexpectedEndOfString";
        ScanError[ScanError["UnexpectedEndOfNumber"] = 3] = "UnexpectedEndOfNumber";
        ScanError[ScanError["InvalidUnicode"] = 4] = "InvalidUnicode";
        ScanError[ScanError["InvalidEscapeCharacter"] = 5] = "InvalidEscapeCharacter";
        ScanError[ScanError["InvalidCharacter"] = 6] = "InvalidCharacter";
    })(ScanError || (exports.ScanError = ScanError = {}));
    var SyntaxKind;
    (function (SyntaxKind) {
        SyntaxKind[SyntaxKind["OpenBraceToken"] = 1] = "OpenBraceToken";
        SyntaxKind[SyntaxKind["CloseBraceToken"] = 2] = "CloseBraceToken";
        SyntaxKind[SyntaxKind["OpenBracketToken"] = 3] = "OpenBracketToken";
        SyntaxKind[SyntaxKind["CloseBracketToken"] = 4] = "CloseBracketToken";
        SyntaxKind[SyntaxKind["CommaToken"] = 5] = "CommaToken";
        SyntaxKind[SyntaxKind["ColonToken"] = 6] = "ColonToken";
        SyntaxKind[SyntaxKind["NullKeyword"] = 7] = "NullKeyword";
        SyntaxKind[SyntaxKind["TrueKeyword"] = 8] = "TrueKeyword";
        SyntaxKind[SyntaxKind["FalseKeyword"] = 9] = "FalseKeyword";
        SyntaxKind[SyntaxKind["StringLiteral"] = 10] = "StringLiteral";
        SyntaxKind[SyntaxKind["NumericLiteral"] = 11] = "NumericLiteral";
        SyntaxKind[SyntaxKind["LineCommentTrivia"] = 12] = "LineCommentTrivia";
        SyntaxKind[SyntaxKind["BlockCommentTrivia"] = 13] = "BlockCommentTrivia";
        SyntaxKind[SyntaxKind["LineBreakTrivia"] = 14] = "LineBreakTrivia";
        SyntaxKind[SyntaxKind["Trivia"] = 15] = "Trivia";
        SyntaxKind[SyntaxKind["Unknown"] = 16] = "Unknown";
        SyntaxKind[SyntaxKind["EOF"] = 17] = "EOF";
    })(SyntaxKind || (exports.SyntaxKind = SyntaxKind = {}));
    var ParseErrorCode;
    (function (ParseErrorCode) {
        ParseErrorCode[ParseErrorCode["InvalidSymbol"] = 1] = "InvalidSymbol";
        ParseErrorCode[ParseErrorCode["InvalidNumberFormat"] = 2] = "InvalidNumberFormat";
        ParseErrorCode[ParseErrorCode["PropertyNameExpected"] = 3] = "PropertyNameExpected";
        ParseErrorCode[ParseErrorCode["ValueExpected"] = 4] = "ValueExpected";
        ParseErrorCode[ParseErrorCode["ColonExpected"] = 5] = "ColonExpected";
        ParseErrorCode[ParseErrorCode["CommaExpected"] = 6] = "CommaExpected";
        ParseErrorCode[ParseErrorCode["CloseBraceExpected"] = 7] = "CloseBraceExpected";
        ParseErrorCode[ParseErrorCode["CloseBracketExpected"] = 8] = "CloseBracketExpected";
        ParseErrorCode[ParseErrorCode["EndOfFileExpected"] = 9] = "EndOfFileExpected";
        ParseErrorCode[ParseErrorCode["InvalidCommentToken"] = 10] = "InvalidCommentToken";
        ParseErrorCode[ParseErrorCode["UnexpectedEndOfComment"] = 11] = "UnexpectedEndOfComment";
        ParseErrorCode[ParseErrorCode["UnexpectedEndOfString"] = 12] = "UnexpectedEndOfString";
        ParseErrorCode[ParseErrorCode["UnexpectedEndOfNumber"] = 13] = "UnexpectedEndOfNumber";
        ParseErrorCode[ParseErrorCode["InvalidUnicode"] = 14] = "InvalidUnicode";
        ParseErrorCode[ParseErrorCode["InvalidEscapeCharacter"] = 15] = "InvalidEscapeCharacter";
        ParseErrorCode[ParseErrorCode["InvalidCharacter"] = 16] = "InvalidCharacter";
    })(ParseErrorCode || (exports.ParseErrorCode = ParseErrorCode = {}));
    var ParseOptions;
    (function (ParseOptions) {
        ParseOptions.DEFAULT = {
            allowTrailingComma: true
        };
    })(ParseOptions || (exports.ParseOptions = ParseOptions = {}));
    /**
     * Creates a JSON scanner on the given text.
     * If ignoreTrivia is set, whitespaces or comments are ignored.
     */
    function createScanner(text, ignoreTrivia = false) {
        let pos = 0;
        const len = text.length;
        let value = '';
        let tokenOffset = 0;
        let token = 16 /* SyntaxKind.Unknown */;
        let scanError = 0 /* ScanError.None */;
        function scanHexDigits(count) {
            let digits = 0;
            let hexValue = 0;
            while (digits < count) {
                const ch = text.charCodeAt(pos);
                if (ch >= 48 /* CharacterCodes._0 */ && ch <= 57 /* CharacterCodes._9 */) {
                    hexValue = hexValue * 16 + ch - 48 /* CharacterCodes._0 */;
                }
                else if (ch >= 65 /* CharacterCodes.A */ && ch <= 70 /* CharacterCodes.F */) {
                    hexValue = hexValue * 16 + ch - 65 /* CharacterCodes.A */ + 10;
                }
                else if (ch >= 97 /* CharacterCodes.a */ && ch <= 102 /* CharacterCodes.f */) {
                    hexValue = hexValue * 16 + ch - 97 /* CharacterCodes.a */ + 10;
                }
                else {
                    break;
                }
                pos++;
                digits++;
            }
            if (digits < count) {
                hexValue = -1;
            }
            return hexValue;
        }
        function setPosition(newPosition) {
            pos = newPosition;
            value = '';
            tokenOffset = 0;
            token = 16 /* SyntaxKind.Unknown */;
            scanError = 0 /* ScanError.None */;
        }
        function scanNumber() {
            const start = pos;
            if (text.charCodeAt(pos) === 48 /* CharacterCodes._0 */) {
                pos++;
            }
            else {
                pos++;
                while (pos < text.length && isDigit(text.charCodeAt(pos))) {
                    pos++;
                }
            }
            if (pos < text.length && text.charCodeAt(pos) === 46 /* CharacterCodes.dot */) {
                pos++;
                if (pos < text.length && isDigit(text.charCodeAt(pos))) {
                    pos++;
                    while (pos < text.length && isDigit(text.charCodeAt(pos))) {
                        pos++;
                    }
                }
                else {
                    scanError = 3 /* ScanError.UnexpectedEndOfNumber */;
                    return text.substring(start, pos);
                }
            }
            let end = pos;
            if (pos < text.length && (text.charCodeAt(pos) === 69 /* CharacterCodes.E */ || text.charCodeAt(pos) === 101 /* CharacterCodes.e */)) {
                pos++;
                if (pos < text.length && text.charCodeAt(pos) === 43 /* CharacterCodes.plus */ || text.charCodeAt(pos) === 45 /* CharacterCodes.minus */) {
                    pos++;
                }
                if (pos < text.length && isDigit(text.charCodeAt(pos))) {
                    pos++;
                    while (pos < text.length && isDigit(text.charCodeAt(pos))) {
                        pos++;
                    }
                    end = pos;
                }
                else {
                    scanError = 3 /* ScanError.UnexpectedEndOfNumber */;
                }
            }
            return text.substring(start, end);
        }
        function scanString() {
            let result = '', start = pos;
            while (true) {
                if (pos >= len) {
                    result += text.substring(start, pos);
                    scanError = 2 /* ScanError.UnexpectedEndOfString */;
                    break;
                }
                const ch = text.charCodeAt(pos);
                if (ch === 34 /* CharacterCodes.doubleQuote */) {
                    result += text.substring(start, pos);
                    pos++;
                    break;
                }
                if (ch === 92 /* CharacterCodes.backslash */) {
                    result += text.substring(start, pos);
                    pos++;
                    if (pos >= len) {
                        scanError = 2 /* ScanError.UnexpectedEndOfString */;
                        break;
                    }
                    const ch2 = text.charCodeAt(pos++);
                    switch (ch2) {
                        case 34 /* CharacterCodes.doubleQuote */:
                            result += '\"';
                            break;
                        case 92 /* CharacterCodes.backslash */:
                            result += '\\';
                            break;
                        case 47 /* CharacterCodes.slash */:
                            result += '/';
                            break;
                        case 98 /* CharacterCodes.b */:
                            result += '\b';
                            break;
                        case 102 /* CharacterCodes.f */:
                            result += '\f';
                            break;
                        case 110 /* CharacterCodes.n */:
                            result += '\n';
                            break;
                        case 114 /* CharacterCodes.r */:
                            result += '\r';
                            break;
                        case 116 /* CharacterCodes.t */:
                            result += '\t';
                            break;
                        case 117 /* CharacterCodes.u */: {
                            const ch3 = scanHexDigits(4);
                            if (ch3 >= 0) {
                                result += String.fromCharCode(ch3);
                            }
                            else {
                                scanError = 4 /* ScanError.InvalidUnicode */;
                            }
                            break;
                        }
                        default:
                            scanError = 5 /* ScanError.InvalidEscapeCharacter */;
                    }
                    start = pos;
                    continue;
                }
                if (ch >= 0 && ch <= 0x1F) {
                    if (isLineBreak(ch)) {
                        result += text.substring(start, pos);
                        scanError = 2 /* ScanError.UnexpectedEndOfString */;
                        break;
                    }
                    else {
                        scanError = 6 /* ScanError.InvalidCharacter */;
                        // mark as error but continue with string
                    }
                }
                pos++;
            }
            return result;
        }
        function scanNext() {
            value = '';
            scanError = 0 /* ScanError.None */;
            tokenOffset = pos;
            if (pos >= len) {
                // at the end
                tokenOffset = len;
                return token = 17 /* SyntaxKind.EOF */;
            }
            let code = text.charCodeAt(pos);
            // trivia: whitespace
            if (isWhitespace(code)) {
                do {
                    pos++;
                    value += String.fromCharCode(code);
                    code = text.charCodeAt(pos);
                } while (isWhitespace(code));
                return token = 15 /* SyntaxKind.Trivia */;
            }
            // trivia: newlines
            if (isLineBreak(code)) {
                pos++;
                value += String.fromCharCode(code);
                if (code === 13 /* CharacterCodes.carriageReturn */ && text.charCodeAt(pos) === 10 /* CharacterCodes.lineFeed */) {
                    pos++;
                    value += '\n';
                }
                return token = 14 /* SyntaxKind.LineBreakTrivia */;
            }
            switch (code) {
                // tokens: []{}:,
                case 123 /* CharacterCodes.openBrace */:
                    pos++;
                    return token = 1 /* SyntaxKind.OpenBraceToken */;
                case 125 /* CharacterCodes.closeBrace */:
                    pos++;
                    return token = 2 /* SyntaxKind.CloseBraceToken */;
                case 91 /* CharacterCodes.openBracket */:
                    pos++;
                    return token = 3 /* SyntaxKind.OpenBracketToken */;
                case 93 /* CharacterCodes.closeBracket */:
                    pos++;
                    return token = 4 /* SyntaxKind.CloseBracketToken */;
                case 58 /* CharacterCodes.colon */:
                    pos++;
                    return token = 6 /* SyntaxKind.ColonToken */;
                case 44 /* CharacterCodes.comma */:
                    pos++;
                    return token = 5 /* SyntaxKind.CommaToken */;
                // strings
                case 34 /* CharacterCodes.doubleQuote */:
                    pos++;
                    value = scanString();
                    return token = 10 /* SyntaxKind.StringLiteral */;
                // comments
                case 47 /* CharacterCodes.slash */: {
                    const start = pos - 1;
                    // Single-line comment
                    if (text.charCodeAt(pos + 1) === 47 /* CharacterCodes.slash */) {
                        pos += 2;
                        while (pos < len) {
                            if (isLineBreak(text.charCodeAt(pos))) {
                                break;
                            }
                            pos++;
                        }
                        value = text.substring(start, pos);
                        return token = 12 /* SyntaxKind.LineCommentTrivia */;
                    }
                    // Multi-line comment
                    if (text.charCodeAt(pos + 1) === 42 /* CharacterCodes.asterisk */) {
                        pos += 2;
                        const safeLength = len - 1; // For lookahead.
                        let commentClosed = false;
                        while (pos < safeLength) {
                            const ch = text.charCodeAt(pos);
                            if (ch === 42 /* CharacterCodes.asterisk */ && text.charCodeAt(pos + 1) === 47 /* CharacterCodes.slash */) {
                                pos += 2;
                                commentClosed = true;
                                break;
                            }
                            pos++;
                        }
                        if (!commentClosed) {
                            pos++;
                            scanError = 1 /* ScanError.UnexpectedEndOfComment */;
                        }
                        value = text.substring(start, pos);
                        return token = 13 /* SyntaxKind.BlockCommentTrivia */;
                    }
                    // just a single slash
                    value += String.fromCharCode(code);
                    pos++;
                    return token = 16 /* SyntaxKind.Unknown */;
                }
                // numbers
                case 45 /* CharacterCodes.minus */:
                    value += String.fromCharCode(code);
                    pos++;
                    if (pos === len || !isDigit(text.charCodeAt(pos))) {
                        return token = 16 /* SyntaxKind.Unknown */;
                    }
                // found a minus, followed by a number so
                // we fall through to proceed with scanning
                // numbers
                case 48 /* CharacterCodes._0 */:
                case 49 /* CharacterCodes._1 */:
                case 50 /* CharacterCodes._2 */:
                case 51 /* CharacterCodes._3 */:
                case 52 /* CharacterCodes._4 */:
                case 53 /* CharacterCodes._5 */:
                case 54 /* CharacterCodes._6 */:
                case 55 /* CharacterCodes._7 */:
                case 56 /* CharacterCodes._8 */:
                case 57 /* CharacterCodes._9 */:
                    value += scanNumber();
                    return token = 11 /* SyntaxKind.NumericLiteral */;
                // literals and unknown symbols
                default:
                    // is a literal? Read the full word.
                    while (pos < len && isUnknownContentCharacter(code)) {
                        pos++;
                        code = text.charCodeAt(pos);
                    }
                    if (tokenOffset !== pos) {
                        value = text.substring(tokenOffset, pos);
                        // keywords: true, false, null
                        switch (value) {
                            case 'true': return token = 8 /* SyntaxKind.TrueKeyword */;
                            case 'false': return token = 9 /* SyntaxKind.FalseKeyword */;
                            case 'null': return token = 7 /* SyntaxKind.NullKeyword */;
                        }
                        return token = 16 /* SyntaxKind.Unknown */;
                    }
                    // some
                    value += String.fromCharCode(code);
                    pos++;
                    return token = 16 /* SyntaxKind.Unknown */;
            }
        }
        function isUnknownContentCharacter(code) {
            if (isWhitespace(code) || isLineBreak(code)) {
                return false;
            }
            switch (code) {
                case 125 /* CharacterCodes.closeBrace */:
                case 93 /* CharacterCodes.closeBracket */:
                case 123 /* CharacterCodes.openBrace */:
                case 91 /* CharacterCodes.openBracket */:
                case 34 /* CharacterCodes.doubleQuote */:
                case 58 /* CharacterCodes.colon */:
                case 44 /* CharacterCodes.comma */:
                case 47 /* CharacterCodes.slash */:
                    return false;
            }
            return true;
        }
        function scanNextNonTrivia() {
            let result;
            do {
                result = scanNext();
            } while (result >= 12 /* SyntaxKind.LineCommentTrivia */ && result <= 15 /* SyntaxKind.Trivia */);
            return result;
        }
        return {
            setPosition: setPosition,
            getPosition: () => pos,
            scan: ignoreTrivia ? scanNextNonTrivia : scanNext,
            getToken: () => token,
            getTokenValue: () => value,
            getTokenOffset: () => tokenOffset,
            getTokenLength: () => pos - tokenOffset,
            getTokenError: () => scanError
        };
    }
    function isWhitespace(ch) {
        return ch === 32 /* CharacterCodes.space */ || ch === 9 /* CharacterCodes.tab */ || ch === 11 /* CharacterCodes.verticalTab */ || ch === 12 /* CharacterCodes.formFeed */ ||
            ch === 160 /* CharacterCodes.nonBreakingSpace */ || ch === 5760 /* CharacterCodes.ogham */ || ch >= 8192 /* CharacterCodes.enQuad */ && ch <= 8203 /* CharacterCodes.zeroWidthSpace */ ||
            ch === 8239 /* CharacterCodes.narrowNoBreakSpace */ || ch === 8287 /* CharacterCodes.mathematicalSpace */ || ch === 12288 /* CharacterCodes.ideographicSpace */ || ch === 65279 /* CharacterCodes.byteOrderMark */;
    }
    function isLineBreak(ch) {
        return ch === 10 /* CharacterCodes.lineFeed */ || ch === 13 /* CharacterCodes.carriageReturn */ || ch === 8232 /* CharacterCodes.lineSeparator */ || ch === 8233 /* CharacterCodes.paragraphSeparator */;
    }
    function isDigit(ch) {
        return ch >= 48 /* CharacterCodes._0 */ && ch <= 57 /* CharacterCodes._9 */;
    }
    var CharacterCodes;
    (function (CharacterCodes) {
        CharacterCodes[CharacterCodes["nullCharacter"] = 0] = "nullCharacter";
        CharacterCodes[CharacterCodes["maxAsciiCharacter"] = 127] = "maxAsciiCharacter";
        CharacterCodes[CharacterCodes["lineFeed"] = 10] = "lineFeed";
        CharacterCodes[CharacterCodes["carriageReturn"] = 13] = "carriageReturn";
        CharacterCodes[CharacterCodes["lineSeparator"] = 8232] = "lineSeparator";
        CharacterCodes[CharacterCodes["paragraphSeparator"] = 8233] = "paragraphSeparator";
        // REVIEW: do we need to support this?  The scanner doesn't, but our IText does.  This seems
        // like an odd disparity?  (Or maybe it's completely fine for them to be different).
        CharacterCodes[CharacterCodes["nextLine"] = 133] = "nextLine";
        // Unicode 3.0 space characters
        CharacterCodes[CharacterCodes["space"] = 32] = "space";
        CharacterCodes[CharacterCodes["nonBreakingSpace"] = 160] = "nonBreakingSpace";
        CharacterCodes[CharacterCodes["enQuad"] = 8192] = "enQuad";
        CharacterCodes[CharacterCodes["emQuad"] = 8193] = "emQuad";
        CharacterCodes[CharacterCodes["enSpace"] = 8194] = "enSpace";
        CharacterCodes[CharacterCodes["emSpace"] = 8195] = "emSpace";
        CharacterCodes[CharacterCodes["threePerEmSpace"] = 8196] = "threePerEmSpace";
        CharacterCodes[CharacterCodes["fourPerEmSpace"] = 8197] = "fourPerEmSpace";
        CharacterCodes[CharacterCodes["sixPerEmSpace"] = 8198] = "sixPerEmSpace";
        CharacterCodes[CharacterCodes["figureSpace"] = 8199] = "figureSpace";
        CharacterCodes[CharacterCodes["punctuationSpace"] = 8200] = "punctuationSpace";
        CharacterCodes[CharacterCodes["thinSpace"] = 8201] = "thinSpace";
        CharacterCodes[CharacterCodes["hairSpace"] = 8202] = "hairSpace";
        CharacterCodes[CharacterCodes["zeroWidthSpace"] = 8203] = "zeroWidthSpace";
        CharacterCodes[CharacterCodes["narrowNoBreakSpace"] = 8239] = "narrowNoBreakSpace";
        CharacterCodes[CharacterCodes["ideographicSpace"] = 12288] = "ideographicSpace";
        CharacterCodes[CharacterCodes["mathematicalSpace"] = 8287] = "mathematicalSpace";
        CharacterCodes[CharacterCodes["ogham"] = 5760] = "ogham";
        CharacterCodes[CharacterCodes["_"] = 95] = "_";
        CharacterCodes[CharacterCodes["$"] = 36] = "$";
        CharacterCodes[CharacterCodes["_0"] = 48] = "_0";
        CharacterCodes[CharacterCodes["_1"] = 49] = "_1";
        CharacterCodes[CharacterCodes["_2"] = 50] = "_2";
        CharacterCodes[CharacterCodes["_3"] = 51] = "_3";
        CharacterCodes[CharacterCodes["_4"] = 52] = "_4";
        CharacterCodes[CharacterCodes["_5"] = 53] = "_5";
        CharacterCodes[CharacterCodes["_6"] = 54] = "_6";
        CharacterCodes[CharacterCodes["_7"] = 55] = "_7";
        CharacterCodes[CharacterCodes["_8"] = 56] = "_8";
        CharacterCodes[CharacterCodes["_9"] = 57] = "_9";
        CharacterCodes[CharacterCodes["a"] = 97] = "a";
        CharacterCodes[CharacterCodes["b"] = 98] = "b";
        CharacterCodes[CharacterCodes["c"] = 99] = "c";
        CharacterCodes[CharacterCodes["d"] = 100] = "d";
        CharacterCodes[CharacterCodes["e"] = 101] = "e";
        CharacterCodes[CharacterCodes["f"] = 102] = "f";
        CharacterCodes[CharacterCodes["g"] = 103] = "g";
        CharacterCodes[CharacterCodes["h"] = 104] = "h";
        CharacterCodes[CharacterCodes["i"] = 105] = "i";
        CharacterCodes[CharacterCodes["j"] = 106] = "j";
        CharacterCodes[CharacterCodes["k"] = 107] = "k";
        CharacterCodes[CharacterCodes["l"] = 108] = "l";
        CharacterCodes[CharacterCodes["m"] = 109] = "m";
        CharacterCodes[CharacterCodes["n"] = 110] = "n";
        CharacterCodes[CharacterCodes["o"] = 111] = "o";
        CharacterCodes[CharacterCodes["p"] = 112] = "p";
        CharacterCodes[CharacterCodes["q"] = 113] = "q";
        CharacterCodes[CharacterCodes["r"] = 114] = "r";
        CharacterCodes[CharacterCodes["s"] = 115] = "s";
        CharacterCodes[CharacterCodes["t"] = 116] = "t";
        CharacterCodes[CharacterCodes["u"] = 117] = "u";
        CharacterCodes[CharacterCodes["v"] = 118] = "v";
        CharacterCodes[CharacterCodes["w"] = 119] = "w";
        CharacterCodes[CharacterCodes["x"] = 120] = "x";
        CharacterCodes[CharacterCodes["y"] = 121] = "y";
        CharacterCodes[CharacterCodes["z"] = 122] = "z";
        CharacterCodes[CharacterCodes["A"] = 65] = "A";
        CharacterCodes[CharacterCodes["B"] = 66] = "B";
        CharacterCodes[CharacterCodes["C"] = 67] = "C";
        CharacterCodes[CharacterCodes["D"] = 68] = "D";
        CharacterCodes[CharacterCodes["E"] = 69] = "E";
        CharacterCodes[CharacterCodes["F"] = 70] = "F";
        CharacterCodes[CharacterCodes["G"] = 71] = "G";
        CharacterCodes[CharacterCodes["H"] = 72] = "H";
        CharacterCodes[CharacterCodes["I"] = 73] = "I";
        CharacterCodes[CharacterCodes["J"] = 74] = "J";
        CharacterCodes[CharacterCodes["K"] = 75] = "K";
        CharacterCodes[CharacterCodes["L"] = 76] = "L";
        CharacterCodes[CharacterCodes["M"] = 77] = "M";
        CharacterCodes[CharacterCodes["N"] = 78] = "N";
        CharacterCodes[CharacterCodes["O"] = 79] = "O";
        CharacterCodes[CharacterCodes["P"] = 80] = "P";
        CharacterCodes[CharacterCodes["Q"] = 81] = "Q";
        CharacterCodes[CharacterCodes["R"] = 82] = "R";
        CharacterCodes[CharacterCodes["S"] = 83] = "S";
        CharacterCodes[CharacterCodes["T"] = 84] = "T";
        CharacterCodes[CharacterCodes["U"] = 85] = "U";
        CharacterCodes[CharacterCodes["V"] = 86] = "V";
        CharacterCodes[CharacterCodes["W"] = 87] = "W";
        CharacterCodes[CharacterCodes["X"] = 88] = "X";
        CharacterCodes[CharacterCodes["Y"] = 89] = "Y";
        CharacterCodes[CharacterCodes["Z"] = 90] = "Z";
        CharacterCodes[CharacterCodes["ampersand"] = 38] = "ampersand";
        CharacterCodes[CharacterCodes["asterisk"] = 42] = "asterisk";
        CharacterCodes[CharacterCodes["at"] = 64] = "at";
        CharacterCodes[CharacterCodes["backslash"] = 92] = "backslash";
        CharacterCodes[CharacterCodes["bar"] = 124] = "bar";
        CharacterCodes[CharacterCodes["caret"] = 94] = "caret";
        CharacterCodes[CharacterCodes["closeBrace"] = 125] = "closeBrace";
        CharacterCodes[CharacterCodes["closeBracket"] = 93] = "closeBracket";
        CharacterCodes[CharacterCodes["closeParen"] = 41] = "closeParen";
        CharacterCodes[CharacterCodes["colon"] = 58] = "colon";
        CharacterCodes[CharacterCodes["comma"] = 44] = "comma";
        CharacterCodes[CharacterCodes["dot"] = 46] = "dot";
        CharacterCodes[CharacterCodes["doubleQuote"] = 34] = "doubleQuote";
        CharacterCodes[CharacterCodes["equals"] = 61] = "equals";
        CharacterCodes[CharacterCodes["exclamation"] = 33] = "exclamation";
        CharacterCodes[CharacterCodes["greaterThan"] = 62] = "greaterThan";
        CharacterCodes[CharacterCodes["lessThan"] = 60] = "lessThan";
        CharacterCodes[CharacterCodes["minus"] = 45] = "minus";
        CharacterCodes[CharacterCodes["openBrace"] = 123] = "openBrace";
        CharacterCodes[CharacterCodes["openBracket"] = 91] = "openBracket";
        CharacterCodes[CharacterCodes["openParen"] = 40] = "openParen";
        CharacterCodes[CharacterCodes["percent"] = 37] = "percent";
        CharacterCodes[CharacterCodes["plus"] = 43] = "plus";
        CharacterCodes[CharacterCodes["question"] = 63] = "question";
        CharacterCodes[CharacterCodes["semicolon"] = 59] = "semicolon";
        CharacterCodes[CharacterCodes["singleQuote"] = 39] = "singleQuote";
        CharacterCodes[CharacterCodes["slash"] = 47] = "slash";
        CharacterCodes[CharacterCodes["tilde"] = 126] = "tilde";
        CharacterCodes[CharacterCodes["backspace"] = 8] = "backspace";
        CharacterCodes[CharacterCodes["formFeed"] = 12] = "formFeed";
        CharacterCodes[CharacterCodes["byteOrderMark"] = 65279] = "byteOrderMark";
        CharacterCodes[CharacterCodes["tab"] = 9] = "tab";
        CharacterCodes[CharacterCodes["verticalTab"] = 11] = "verticalTab";
    })(CharacterCodes || (CharacterCodes = {}));
    /**
     * For a given offset, evaluate the location in the JSON document. Each segment in the location path is either a property name or an array index.
     */
    function getLocation(text, position) {
        const segments = []; // strings or numbers
        const earlyReturnException = new Object();
        let previousNode = undefined;
        const previousNodeInst = {
            value: {},
            offset: 0,
            length: 0,
            type: 'object',
            parent: undefined
        };
        let isAtPropertyKey = false;
        function setPreviousNode(value, offset, length, type) {
            previousNodeInst.value = value;
            previousNodeInst.offset = offset;
            previousNodeInst.length = length;
            previousNodeInst.type = type;
            previousNodeInst.colonOffset = undefined;
            previousNode = previousNodeInst;
        }
        try {
            visit(text, {
                onObjectBegin: (offset, length) => {
                    if (position <= offset) {
                        throw earlyReturnException;
                    }
                    previousNode = undefined;
                    isAtPropertyKey = position > offset;
                    segments.push(''); // push a placeholder (will be replaced)
                },
                onObjectProperty: (name, offset, length) => {
                    if (position < offset) {
                        throw earlyReturnException;
                    }
                    setPreviousNode(name, offset, length, 'property');
                    segments[segments.length - 1] = name;
                    if (position <= offset + length) {
                        throw earlyReturnException;
                    }
                },
                onObjectEnd: (offset, length) => {
                    if (position <= offset) {
                        throw earlyReturnException;
                    }
                    previousNode = undefined;
                    segments.pop();
                },
                onArrayBegin: (offset, length) => {
                    if (position <= offset) {
                        throw earlyReturnException;
                    }
                    previousNode = undefined;
                    segments.push(0);
                },
                onArrayEnd: (offset, length) => {
                    if (position <= offset) {
                        throw earlyReturnException;
                    }
                    previousNode = undefined;
                    segments.pop();
                },
                onLiteralValue: (value, offset, length) => {
                    if (position < offset) {
                        throw earlyReturnException;
                    }
                    setPreviousNode(value, offset, length, getNodeType(value));
                    if (position <= offset + length) {
                        throw earlyReturnException;
                    }
                },
                onSeparator: (sep, offset, length) => {
                    if (position <= offset) {
                        throw earlyReturnException;
                    }
                    if (sep === ':' && previousNode && previousNode.type === 'property') {
                        previousNode.colonOffset = offset;
                        isAtPropertyKey = false;
                        previousNode = undefined;
                    }
                    else if (sep === ',') {
                        const last = segments[segments.length - 1];
                        if (typeof last === 'number') {
                            segments[segments.length - 1] = last + 1;
                        }
                        else {
                            isAtPropertyKey = true;
                            segments[segments.length - 1] = '';
                        }
                        previousNode = undefined;
                    }
                }
            });
        }
        catch (e) {
            if (e !== earlyReturnException) {
                throw e;
            }
        }
        return {
            path: segments,
            previousNode,
            isAtPropertyKey,
            matches: (pattern) => {
                let k = 0;
                for (let i = 0; k < pattern.length && i < segments.length; i++) {
                    if (pattern[k] === segments[i] || pattern[k] === '*') {
                        k++;
                    }
                    else if (pattern[k] !== '**') {
                        return false;
                    }
                }
                return k === pattern.length;
            }
        };
    }
    /**
     * Parses the given text and returns the object the JSON content represents. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
     * Therefore always check the errors list to find out if the input was valid.
     */
    function parse(text, errors = [], options = ParseOptions.DEFAULT) {
        let currentProperty = null;
        let currentParent = [];
        const previousParents = [];
        function onValue(value) {
            if (Array.isArray(currentParent)) {
                currentParent.push(value);
            }
            else if (currentProperty !== null) {
                currentParent[currentProperty] = value;
            }
        }
        const visitor = {
            onObjectBegin: () => {
                const object = {};
                onValue(object);
                previousParents.push(currentParent);
                currentParent = object;
                currentProperty = null;
            },
            onObjectProperty: (name) => {
                currentProperty = name;
            },
            onObjectEnd: () => {
                currentParent = previousParents.pop();
            },
            onArrayBegin: () => {
                const array = [];
                onValue(array);
                previousParents.push(currentParent);
                currentParent = array;
                currentProperty = null;
            },
            onArrayEnd: () => {
                currentParent = previousParents.pop();
            },
            onLiteralValue: onValue,
            onError: (error, offset, length) => {
                errors.push({ error, offset, length });
            }
        };
        visit(text, visitor, options);
        return currentParent[0];
    }
    /**
     * Parses the given text and returns a tree representation the JSON content. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
     */
    function parseTree(text, errors = [], options = ParseOptions.DEFAULT) {
        let currentParent = { type: 'array', offset: -1, length: -1, children: [], parent: undefined }; // artificial root
        function ensurePropertyComplete(endOffset) {
            if (currentParent.type === 'property') {
                currentParent.length = endOffset - currentParent.offset;
                currentParent = currentParent.parent;
            }
        }
        function onValue(valueNode) {
            currentParent.children.push(valueNode);
            return valueNode;
        }
        const visitor = {
            onObjectBegin: (offset) => {
                currentParent = onValue({ type: 'object', offset, length: -1, parent: currentParent, children: [] });
            },
            onObjectProperty: (name, offset, length) => {
                currentParent = onValue({ type: 'property', offset, length: -1, parent: currentParent, children: [] });
                currentParent.children.push({ type: 'string', value: name, offset, length, parent: currentParent });
            },
            onObjectEnd: (offset, length) => {
                currentParent.length = offset + length - currentParent.offset;
                currentParent = currentParent.parent;
                ensurePropertyComplete(offset + length);
            },
            onArrayBegin: (offset, length) => {
                currentParent = onValue({ type: 'array', offset, length: -1, parent: currentParent, children: [] });
            },
            onArrayEnd: (offset, length) => {
                currentParent.length = offset + length - currentParent.offset;
                currentParent = currentParent.parent;
                ensurePropertyComplete(offset + length);
            },
            onLiteralValue: (value, offset, length) => {
                onValue({ type: getNodeType(value), offset, length, parent: currentParent, value });
                ensurePropertyComplete(offset + length);
            },
            onSeparator: (sep, offset, length) => {
                if (currentParent.type === 'property') {
                    if (sep === ':') {
                        currentParent.colonOffset = offset;
                    }
                    else if (sep === ',') {
                        ensurePropertyComplete(offset);
                    }
                }
            },
            onError: (error, offset, length) => {
                errors.push({ error, offset, length });
            }
        };
        visit(text, visitor, options);
        const result = currentParent.children[0];
        if (result) {
            delete result.parent;
        }
        return result;
    }
    /**
     * Finds the node at the given path in a JSON DOM.
     */
    function findNodeAtLocation(root, path) {
        if (!root) {
            return undefined;
        }
        let node = root;
        for (const segment of path) {
            if (typeof segment === 'string') {
                if (node.type !== 'object' || !Array.isArray(node.children)) {
                    return undefined;
                }
                let found = false;
                for (const propertyNode of node.children) {
                    if (Array.isArray(propertyNode.children) && propertyNode.children[0].value === segment) {
                        node = propertyNode.children[1];
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    return undefined;
                }
            }
            else {
                const index = segment;
                if (node.type !== 'array' || index < 0 || !Array.isArray(node.children) || index >= node.children.length) {
                    return undefined;
                }
                node = node.children[index];
            }
        }
        return node;
    }
    /**
     * Gets the JSON path of the given JSON DOM node
     */
    function getNodePath(node) {
        if (!node.parent || !node.parent.children) {
            return [];
        }
        const path = getNodePath(node.parent);
        if (node.parent.type === 'property') {
            const key = node.parent.children[0].value;
            path.push(key);
        }
        else if (node.parent.type === 'array') {
            const index = node.parent.children.indexOf(node);
            if (index !== -1) {
                path.push(index);
            }
        }
        return path;
    }
    /**
     * Evaluates the JavaScript object of the given JSON DOM node
     */
    function getNodeValue(node) {
        switch (node.type) {
            case 'array':
                return node.children.map(getNodeValue);
            case 'object': {
                const obj = Object.create(null);
                for (const prop of node.children) {
                    const valueNode = prop.children[1];
                    if (valueNode) {
                        obj[prop.children[0].value] = getNodeValue(valueNode);
                    }
                }
                return obj;
            }
            case 'null':
            case 'string':
            case 'number':
            case 'boolean':
                return node.value;
            default:
                return undefined;
        }
    }
    function contains(node, offset, includeRightBound = false) {
        return (offset >= node.offset && offset < (node.offset + node.length)) || includeRightBound && (offset === (node.offset + node.length));
    }
    /**
     * Finds the most inner node at the given offset. If includeRightBound is set, also finds nodes that end at the given offset.
     */
    function findNodeAtOffset(node, offset, includeRightBound = false) {
        if (contains(node, offset, includeRightBound)) {
            const children = node.children;
            if (Array.isArray(children)) {
                for (let i = 0; i < children.length && children[i].offset <= offset; i++) {
                    const item = findNodeAtOffset(children[i], offset, includeRightBound);
                    if (item) {
                        return item;
                    }
                }
            }
            return node;
        }
        return undefined;
    }
    /**
     * Parses the given text and invokes the visitor functions for each object, array and literal reached.
     */
    function visit(text, visitor, options = ParseOptions.DEFAULT) {
        const _scanner = createScanner(text, false);
        function toNoArgVisit(visitFunction) {
            return visitFunction ? () => visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength()) : () => true;
        }
        function toOneArgVisit(visitFunction) {
            return visitFunction ? (arg) => visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength()) : () => true;
        }
        const onObjectBegin = toNoArgVisit(visitor.onObjectBegin), onObjectProperty = toOneArgVisit(visitor.onObjectProperty), onObjectEnd = toNoArgVisit(visitor.onObjectEnd), onArrayBegin = toNoArgVisit(visitor.onArrayBegin), onArrayEnd = toNoArgVisit(visitor.onArrayEnd), onLiteralValue = toOneArgVisit(visitor.onLiteralValue), onSeparator = toOneArgVisit(visitor.onSeparator), onComment = toNoArgVisit(visitor.onComment), onError = toOneArgVisit(visitor.onError);
        const disallowComments = options && options.disallowComments;
        const allowTrailingComma = options && options.allowTrailingComma;
        function scanNext() {
            while (true) {
                const token = _scanner.scan();
                switch (_scanner.getTokenError()) {
                    case 4 /* ScanError.InvalidUnicode */:
                        handleError(14 /* ParseErrorCode.InvalidUnicode */);
                        break;
                    case 5 /* ScanError.InvalidEscapeCharacter */:
                        handleError(15 /* ParseErrorCode.InvalidEscapeCharacter */);
                        break;
                    case 3 /* ScanError.UnexpectedEndOfNumber */:
                        handleError(13 /* ParseErrorCode.UnexpectedEndOfNumber */);
                        break;
                    case 1 /* ScanError.UnexpectedEndOfComment */:
                        if (!disallowComments) {
                            handleError(11 /* ParseErrorCode.UnexpectedEndOfComment */);
                        }
                        break;
                    case 2 /* ScanError.UnexpectedEndOfString */:
                        handleError(12 /* ParseErrorCode.UnexpectedEndOfString */);
                        break;
                    case 6 /* ScanError.InvalidCharacter */:
                        handleError(16 /* ParseErrorCode.InvalidCharacter */);
                        break;
                }
                switch (token) {
                    case 12 /* SyntaxKind.LineCommentTrivia */:
                    case 13 /* SyntaxKind.BlockCommentTrivia */:
                        if (disallowComments) {
                            handleError(10 /* ParseErrorCode.InvalidCommentToken */);
                        }
                        else {
                            onComment();
                        }
                        break;
                    case 16 /* SyntaxKind.Unknown */:
                        handleError(1 /* ParseErrorCode.InvalidSymbol */);
                        break;
                    case 15 /* SyntaxKind.Trivia */:
                    case 14 /* SyntaxKind.LineBreakTrivia */:
                        break;
                    default:
                        return token;
                }
            }
        }
        function handleError(error, skipUntilAfter = [], skipUntil = []) {
            onError(error);
            if (skipUntilAfter.length + skipUntil.length > 0) {
                let token = _scanner.getToken();
                while (token !== 17 /* SyntaxKind.EOF */) {
                    if (skipUntilAfter.indexOf(token) !== -1) {
                        scanNext();
                        break;
                    }
                    else if (skipUntil.indexOf(token) !== -1) {
                        break;
                    }
                    token = scanNext();
                }
            }
        }
        function parseString(isValue) {
            const value = _scanner.getTokenValue();
            if (isValue) {
                onLiteralValue(value);
            }
            else {
                onObjectProperty(value);
            }
            scanNext();
            return true;
        }
        function parseLiteral() {
            switch (_scanner.getToken()) {
                case 11 /* SyntaxKind.NumericLiteral */: {
                    let value = 0;
                    try {
                        value = JSON.parse(_scanner.getTokenValue());
                        if (typeof value !== 'number') {
                            handleError(2 /* ParseErrorCode.InvalidNumberFormat */);
                            value = 0;
                        }
                    }
                    catch (e) {
                        handleError(2 /* ParseErrorCode.InvalidNumberFormat */);
                    }
                    onLiteralValue(value);
                    break;
                }
                case 7 /* SyntaxKind.NullKeyword */:
                    onLiteralValue(null);
                    break;
                case 8 /* SyntaxKind.TrueKeyword */:
                    onLiteralValue(true);
                    break;
                case 9 /* SyntaxKind.FalseKeyword */:
                    onLiteralValue(false);
                    break;
                default:
                    return false;
            }
            scanNext();
            return true;
        }
        function parseProperty() {
            if (_scanner.getToken() !== 10 /* SyntaxKind.StringLiteral */) {
                handleError(3 /* ParseErrorCode.PropertyNameExpected */, [], [2 /* SyntaxKind.CloseBraceToken */, 5 /* SyntaxKind.CommaToken */]);
                return false;
            }
            parseString(false);
            if (_scanner.getToken() === 6 /* SyntaxKind.ColonToken */) {
                onSeparator(':');
                scanNext(); // consume colon
                if (!parseValue()) {
                    handleError(4 /* ParseErrorCode.ValueExpected */, [], [2 /* SyntaxKind.CloseBraceToken */, 5 /* SyntaxKind.CommaToken */]);
                }
            }
            else {
                handleError(5 /* ParseErrorCode.ColonExpected */, [], [2 /* SyntaxKind.CloseBraceToken */, 5 /* SyntaxKind.CommaToken */]);
            }
            return true;
        }
        function parseObject() {
            onObjectBegin();
            scanNext(); // consume open brace
            let needsComma = false;
            while (_scanner.getToken() !== 2 /* SyntaxKind.CloseBraceToken */ && _scanner.getToken() !== 17 /* SyntaxKind.EOF */) {
                if (_scanner.getToken() === 5 /* SyntaxKind.CommaToken */) {
                    if (!needsComma) {
                        handleError(4 /* ParseErrorCode.ValueExpected */, [], []);
                    }
                    onSeparator(',');
                    scanNext(); // consume comma
                    if (_scanner.getToken() === 2 /* SyntaxKind.CloseBraceToken */ && allowTrailingComma) {
                        break;
                    }
                }
                else if (needsComma) {
                    handleError(6 /* ParseErrorCode.CommaExpected */, [], []);
                }
                if (!parseProperty()) {
                    handleError(4 /* ParseErrorCode.ValueExpected */, [], [2 /* SyntaxKind.CloseBraceToken */, 5 /* SyntaxKind.CommaToken */]);
                }
                needsComma = true;
            }
            onObjectEnd();
            if (_scanner.getToken() !== 2 /* SyntaxKind.CloseBraceToken */) {
                handleError(7 /* ParseErrorCode.CloseBraceExpected */, [2 /* SyntaxKind.CloseBraceToken */], []);
            }
            else {
                scanNext(); // consume close brace
            }
            return true;
        }
        function parseArray() {
            onArrayBegin();
            scanNext(); // consume open bracket
            let needsComma = false;
            while (_scanner.getToken() !== 4 /* SyntaxKind.CloseBracketToken */ && _scanner.getToken() !== 17 /* SyntaxKind.EOF */) {
                if (_scanner.getToken() === 5 /* SyntaxKind.CommaToken */) {
                    if (!needsComma) {
                        handleError(4 /* ParseErrorCode.ValueExpected */, [], []);
                    }
                    onSeparator(',');
                    scanNext(); // consume comma
                    if (_scanner.getToken() === 4 /* SyntaxKind.CloseBracketToken */ && allowTrailingComma) {
                        break;
                    }
                }
                else if (needsComma) {
                    handleError(6 /* ParseErrorCode.CommaExpected */, [], []);
                }
                if (!parseValue()) {
                    handleError(4 /* ParseErrorCode.ValueExpected */, [], [4 /* SyntaxKind.CloseBracketToken */, 5 /* SyntaxKind.CommaToken */]);
                }
                needsComma = true;
            }
            onArrayEnd();
            if (_scanner.getToken() !== 4 /* SyntaxKind.CloseBracketToken */) {
                handleError(8 /* ParseErrorCode.CloseBracketExpected */, [4 /* SyntaxKind.CloseBracketToken */], []);
            }
            else {
                scanNext(); // consume close bracket
            }
            return true;
        }
        function parseValue() {
            switch (_scanner.getToken()) {
                case 3 /* SyntaxKind.OpenBracketToken */:
                    return parseArray();
                case 1 /* SyntaxKind.OpenBraceToken */:
                    return parseObject();
                case 10 /* SyntaxKind.StringLiteral */:
                    return parseString(true);
                default:
                    return parseLiteral();
            }
        }
        scanNext();
        if (_scanner.getToken() === 17 /* SyntaxKind.EOF */) {
            if (options.allowEmptyContent) {
                return true;
            }
            handleError(4 /* ParseErrorCode.ValueExpected */, [], []);
            return false;
        }
        if (!parseValue()) {
            handleError(4 /* ParseErrorCode.ValueExpected */, [], []);
            return false;
        }
        if (_scanner.getToken() !== 17 /* SyntaxKind.EOF */) {
            handleError(9 /* ParseErrorCode.EndOfFileExpected */, [], []);
        }
        return true;
    }
    /**
     * Takes JSON with JavaScript-style comments and remove
     * them. Optionally replaces every none-newline character
     * of comments with a replaceCharacter
     */
    function stripComments(text, replaceCh) {
        const _scanner = createScanner(text);
        const parts = [];
        let kind;
        let offset = 0;
        let pos;
        do {
            pos = _scanner.getPosition();
            kind = _scanner.scan();
            switch (kind) {
                case 12 /* SyntaxKind.LineCommentTrivia */:
                case 13 /* SyntaxKind.BlockCommentTrivia */:
                case 17 /* SyntaxKind.EOF */:
                    if (offset !== pos) {
                        parts.push(text.substring(offset, pos));
                    }
                    if (replaceCh !== undefined) {
                        parts.push(_scanner.getTokenValue().replace(/[^\r\n]/g, replaceCh));
                    }
                    offset = _scanner.getPosition();
                    break;
            }
        } while (kind !== 17 /* SyntaxKind.EOF */);
        return parts.join('');
    }
    function getNodeType(value) {
        switch (typeof value) {
            case 'boolean': return 'boolean';
            case 'number': return 'number';
            case 'string': return 'string';
            case 'object': {
                if (!value) {
                    return 'null';
                }
                else if (Array.isArray(value)) {
                    return 'array';
                }
                return 'object';
            }
            default: return 'null';
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vanNvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxTWhHLHNDQXNXQztJQXNLRCxrQ0FrSEM7SUFPRCxzQkE0Q0M7SUFNRCw4QkE0REM7SUFLRCxnREE4QkM7SUFLRCxrQ0FlQztJQUtELG9DQXVCQztJQUVELDRCQUVDO0lBS0QsNENBZUM7SUFNRCxzQkFnUEM7SUFPRCxzQ0EyQkM7SUFFRCxrQ0FlQztJQTEwQ0QsSUFBa0IsU0FRakI7SUFSRCxXQUFrQixTQUFTO1FBQzFCLHlDQUFRLENBQUE7UUFDUiw2RUFBMEIsQ0FBQTtRQUMxQiwyRUFBeUIsQ0FBQTtRQUN6QiwyRUFBeUIsQ0FBQTtRQUN6Qiw2REFBa0IsQ0FBQTtRQUNsQiw2RUFBMEIsQ0FBQTtRQUMxQixpRUFBb0IsQ0FBQTtJQUNyQixDQUFDLEVBUmlCLFNBQVMseUJBQVQsU0FBUyxRQVExQjtJQUVELElBQWtCLFVBa0JqQjtJQWxCRCxXQUFrQixVQUFVO1FBQzNCLCtEQUFrQixDQUFBO1FBQ2xCLGlFQUFtQixDQUFBO1FBQ25CLG1FQUFvQixDQUFBO1FBQ3BCLHFFQUFxQixDQUFBO1FBQ3JCLHVEQUFjLENBQUE7UUFDZCx1REFBYyxDQUFBO1FBQ2QseURBQWUsQ0FBQTtRQUNmLHlEQUFlLENBQUE7UUFDZiwyREFBZ0IsQ0FBQTtRQUNoQiw4REFBa0IsQ0FBQTtRQUNsQixnRUFBbUIsQ0FBQTtRQUNuQixzRUFBc0IsQ0FBQTtRQUN0Qix3RUFBdUIsQ0FBQTtRQUN2QixrRUFBb0IsQ0FBQTtRQUNwQixnREFBVyxDQUFBO1FBQ1gsa0RBQVksQ0FBQTtRQUNaLDBDQUFRLENBQUE7SUFDVCxDQUFDLEVBbEJpQixVQUFVLDBCQUFWLFVBQVUsUUFrQjNCO0lBZ0RELElBQWtC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