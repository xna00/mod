/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./json"], function (require, exports, json_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.format = format;
    exports.toFormattedString = toFormattedString;
    exports.getEOL = getEOL;
    exports.isEOL = isEOL;
    function format(documentText, range, options) {
        let initialIndentLevel;
        let formatText;
        let formatTextStart;
        let rangeStart;
        let rangeEnd;
        if (range) {
            rangeStart = range.offset;
            rangeEnd = rangeStart + range.length;
            formatTextStart = rangeStart;
            while (formatTextStart > 0 && !isEOL(documentText, formatTextStart - 1)) {
                formatTextStart--;
            }
            let endOffset = rangeEnd;
            while (endOffset < documentText.length && !isEOL(documentText, endOffset)) {
                endOffset++;
            }
            formatText = documentText.substring(formatTextStart, endOffset);
            initialIndentLevel = computeIndentLevel(formatText, options);
        }
        else {
            formatText = documentText;
            initialIndentLevel = 0;
            formatTextStart = 0;
            rangeStart = 0;
            rangeEnd = documentText.length;
        }
        const eol = getEOL(options, documentText);
        let lineBreak = false;
        let indentLevel = 0;
        let indentValue;
        if (options.insertSpaces) {
            indentValue = repeat(' ', options.tabSize || 4);
        }
        else {
            indentValue = '\t';
        }
        const scanner = (0, json_1.createScanner)(formatText, false);
        let hasError = false;
        function newLineAndIndent() {
            return eol + repeat(indentValue, initialIndentLevel + indentLevel);
        }
        function scanNext() {
            let token = scanner.scan();
            lineBreak = false;
            while (token === 15 /* SyntaxKind.Trivia */ || token === 14 /* SyntaxKind.LineBreakTrivia */) {
                lineBreak = lineBreak || (token === 14 /* SyntaxKind.LineBreakTrivia */);
                token = scanner.scan();
            }
            hasError = token === 16 /* SyntaxKind.Unknown */ || scanner.getTokenError() !== 0 /* ScanError.None */;
            return token;
        }
        const editOperations = [];
        function addEdit(text, startOffset, endOffset) {
            if (!hasError && startOffset < rangeEnd && endOffset > rangeStart && documentText.substring(startOffset, endOffset) !== text) {
                editOperations.push({ offset: startOffset, length: endOffset - startOffset, content: text });
            }
        }
        let firstToken = scanNext();
        if (firstToken !== 17 /* SyntaxKind.EOF */) {
            const firstTokenStart = scanner.getTokenOffset() + formatTextStart;
            const initialIndent = repeat(indentValue, initialIndentLevel);
            addEdit(initialIndent, formatTextStart, firstTokenStart);
        }
        while (firstToken !== 17 /* SyntaxKind.EOF */) {
            let firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
            let secondToken = scanNext();
            let replaceContent = '';
            while (!lineBreak && (secondToken === 12 /* SyntaxKind.LineCommentTrivia */ || secondToken === 13 /* SyntaxKind.BlockCommentTrivia */)) {
                // comments on the same line: keep them on the same line, but ignore them otherwise
                const commentTokenStart = scanner.getTokenOffset() + formatTextStart;
                addEdit(' ', firstTokenEnd, commentTokenStart);
                firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
                replaceContent = secondToken === 12 /* SyntaxKind.LineCommentTrivia */ ? newLineAndIndent() : '';
                secondToken = scanNext();
            }
            if (secondToken === 2 /* SyntaxKind.CloseBraceToken */) {
                if (firstToken !== 1 /* SyntaxKind.OpenBraceToken */) {
                    indentLevel--;
                    replaceContent = newLineAndIndent();
                }
            }
            else if (secondToken === 4 /* SyntaxKind.CloseBracketToken */) {
                if (firstToken !== 3 /* SyntaxKind.OpenBracketToken */) {
                    indentLevel--;
                    replaceContent = newLineAndIndent();
                }
            }
            else {
                switch (firstToken) {
                    case 3 /* SyntaxKind.OpenBracketToken */:
                    case 1 /* SyntaxKind.OpenBraceToken */:
                        indentLevel++;
                        replaceContent = newLineAndIndent();
                        break;
                    case 5 /* SyntaxKind.CommaToken */:
                    case 12 /* SyntaxKind.LineCommentTrivia */:
                        replaceContent = newLineAndIndent();
                        break;
                    case 13 /* SyntaxKind.BlockCommentTrivia */:
                        if (lineBreak) {
                            replaceContent = newLineAndIndent();
                        }
                        else {
                            // symbol following comment on the same line: keep on same line, separate with ' '
                            replaceContent = ' ';
                        }
                        break;
                    case 6 /* SyntaxKind.ColonToken */:
                        replaceContent = ' ';
                        break;
                    case 10 /* SyntaxKind.StringLiteral */:
                        if (secondToken === 6 /* SyntaxKind.ColonToken */) {
                            replaceContent = '';
                            break;
                        }
                    // fall through
                    case 7 /* SyntaxKind.NullKeyword */:
                    case 8 /* SyntaxKind.TrueKeyword */:
                    case 9 /* SyntaxKind.FalseKeyword */:
                    case 11 /* SyntaxKind.NumericLiteral */:
                    case 2 /* SyntaxKind.CloseBraceToken */:
                    case 4 /* SyntaxKind.CloseBracketToken */:
                        if (secondToken === 12 /* SyntaxKind.LineCommentTrivia */ || secondToken === 13 /* SyntaxKind.BlockCommentTrivia */) {
                            replaceContent = ' ';
                        }
                        else if (secondToken !== 5 /* SyntaxKind.CommaToken */ && secondToken !== 17 /* SyntaxKind.EOF */) {
                            hasError = true;
                        }
                        break;
                    case 16 /* SyntaxKind.Unknown */:
                        hasError = true;
                        break;
                }
                if (lineBreak && (secondToken === 12 /* SyntaxKind.LineCommentTrivia */ || secondToken === 13 /* SyntaxKind.BlockCommentTrivia */)) {
                    replaceContent = newLineAndIndent();
                }
            }
            const secondTokenStart = scanner.getTokenOffset() + formatTextStart;
            addEdit(replaceContent, firstTokenEnd, secondTokenStart);
            firstToken = secondToken;
        }
        return editOperations;
    }
    /**
     * Creates a formatted string out of the object passed as argument, using the given formatting options
     * @param any The object to stringify and format
     * @param options The formatting options to use
     */
    function toFormattedString(obj, options) {
        const content = JSON.stringify(obj, undefined, options.insertSpaces ? options.tabSize || 4 : '\t');
        if (options.eol !== undefined) {
            return content.replace(/\r\n|\r|\n/g, options.eol);
        }
        return content;
    }
    function repeat(s, count) {
        let result = '';
        for (let i = 0; i < count; i++) {
            result += s;
        }
        return result;
    }
    function computeIndentLevel(content, options) {
        let i = 0;
        let nChars = 0;
        const tabSize = options.tabSize || 4;
        while (i < content.length) {
            const ch = content.charAt(i);
            if (ch === ' ') {
                nChars++;
            }
            else if (ch === '\t') {
                nChars += tabSize;
            }
            else {
                break;
            }
            i++;
        }
        return Math.floor(nChars / tabSize);
    }
    function getEOL(options, text) {
        for (let i = 0; i < text.length; i++) {
            const ch = text.charAt(i);
            if (ch === '\r') {
                if (i + 1 < text.length && text.charAt(i + 1) === '\n') {
                    return '\r\n';
                }
                return '\r';
            }
            else if (ch === '\n') {
                return '\n';
            }
        }
        return (options && options.eol) || '\n';
    }
    function isEOL(text, offset) {
        return '\r\n'.indexOf(text.charAt(offset)) !== -1;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbkZvcm1hdHRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vanNvbkZvcm1hdHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQW9EaEcsd0JBbUpDO0lBT0QsOENBTUM7SUE0QkQsd0JBYUM7SUFFRCxzQkFFQztJQTdNRCxTQUFnQixNQUFNLENBQUMsWUFBb0IsRUFBRSxLQUF3QixFQUFFLE9BQTBCO1FBQ2hHLElBQUksa0JBQTBCLENBQUM7UUFDL0IsSUFBSSxVQUFrQixDQUFDO1FBQ3ZCLElBQUksZUFBdUIsQ0FBQztRQUM1QixJQUFJLFVBQWtCLENBQUM7UUFDdkIsSUFBSSxRQUFnQixDQUFDO1FBQ3JCLElBQUksS0FBSyxFQUFFLENBQUM7WUFDWCxVQUFVLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztZQUMxQixRQUFRLEdBQUcsVUFBVSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFFckMsZUFBZSxHQUFHLFVBQVUsQ0FBQztZQUM3QixPQUFPLGVBQWUsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLGVBQWUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN6RSxlQUFlLEVBQUUsQ0FBQztZQUNuQixDQUFDO1lBQ0QsSUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDO1lBQ3pCLE9BQU8sU0FBUyxHQUFHLFlBQVksQ0FBQyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQzNFLFNBQVMsRUFBRSxDQUFDO1lBQ2IsQ0FBQztZQUNELFVBQVUsR0FBRyxZQUFZLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNoRSxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQyxVQUFV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