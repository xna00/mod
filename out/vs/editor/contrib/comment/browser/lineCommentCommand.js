/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/contrib/comment/browser/blockCommentCommand"], function (require, exports, strings, editOperation_1, position_1, range_1, selection_1, blockCommentCommand_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LineCommentCommand = exports.Type = void 0;
    var Type;
    (function (Type) {
        Type[Type["Toggle"] = 0] = "Toggle";
        Type[Type["ForceAdd"] = 1] = "ForceAdd";
        Type[Type["ForceRemove"] = 2] = "ForceRemove";
    })(Type || (exports.Type = Type = {}));
    class LineCommentCommand {
        constructor(languageConfigurationService, selection, indentSize, type, insertSpace, ignoreEmptyLines, ignoreFirstLine) {
            this.languageConfigurationService = languageConfigurationService;
            this._selection = selection;
            this._indentSize = indentSize;
            this._type = type;
            this._insertSpace = insertSpace;
            this._selectionId = null;
            this._deltaColumn = 0;
            this._moveEndPositionDown = false;
            this._ignoreEmptyLines = ignoreEmptyLines;
            this._ignoreFirstLine = ignoreFirstLine || false;
        }
        /**
         * Do an initial pass over the lines and gather info about the line comment string.
         * Returns null if any of the lines doesn't support a line comment string.
         */
        static _gatherPreflightCommentStrings(model, startLineNumber, endLineNumber, languageConfigurationService) {
            model.tokenization.tokenizeIfCheap(startLineNumber);
            const languageId = model.getLanguageIdAtPosition(startLineNumber, 1);
            const config = languageConfigurationService.getLanguageConfiguration(languageId).comments;
            const commentStr = (config ? config.lineCommentToken : null);
            if (!commentStr) {
                // Mode does not support line comments
                return null;
            }
            const lines = [];
            for (let i = 0, lineCount = endLineNumber - startLineNumber + 1; i < lineCount; i++) {
                lines[i] = {
                    ignore: false,
                    commentStr: commentStr,
                    commentStrOffset: 0,
                    commentStrLength: commentStr.length
                };
            }
            return lines;
        }
        /**
         * Analyze lines and decide which lines are relevant and what the toggle should do.
         * Also, build up several offsets and lengths useful in the generation of editor operations.
         */
        static _analyzeLines(type, insertSpace, model, lines, startLineNumber, ignoreEmptyLines, ignoreFirstLine, languageConfigurationService) {
            let onlyWhitespaceLines = true;
            let shouldRemoveComments;
            if (type === 0 /* Type.Toggle */) {
                shouldRemoveComments = true;
            }
            else if (type === 1 /* Type.ForceAdd */) {
                shouldRemoveComments = false;
            }
            else {
                shouldRemoveComments = true;
            }
            for (let i = 0, lineCount = lines.length; i < lineCount; i++) {
                const lineData = lines[i];
                const lineNumber = startLineNumber + i;
                if (lineNumber === startLineNumber && ignoreFirstLine) {
                    // first line ignored
                    lineData.ignore = true;
                    continue;
                }
                const lineContent = model.getLineContent(lineNumber);
                const lineContentStartOffset = strings.firstNonWhitespaceIndex(lineContent);
                if (lineContentStartOffset === -1) {
                    // Empty or whitespace only line
                    lineData.ignore = ignoreEmptyLines;
                    lineData.commentStrOffset = lineContent.length;
                    continue;
                }
                onlyWhitespaceLines = false;
                lineData.ignore = false;
                lineData.commentStrOffset = lineContentStartOffset;
                if (shouldRemoveComments && !blockCommentCommand_1.BlockCommentCommand._haystackHasNeedleAtOffset(lineContent, lineData.commentStr, lineContentStartOffset)) {
                    if (type === 0 /* Type.Toggle */) {
                        // Every line so far has been a line comment, but this one is not
                        shouldRemoveComments = false;
                    }
                    else if (type === 1 /* Type.ForceAdd */) {
                        // Will not happen
                    }
                    else {
                        lineData.ignore = true;
                    }
                }
                if (shouldRemoveComments && insertSpace) {
                    // Remove a following space if present
                    const commentStrEndOffset = lineContentStartOffset + lineData.commentStrLength;
                    if (commentStrEndOffset < lineContent.length && lineContent.charCodeAt(commentStrEndOffset) === 32 /* CharCode.Space */) {
                        lineData.commentStrLength += 1;
                    }
                }
            }
            if (type === 0 /* Type.Toggle */ && onlyWhitespaceLines) {
                // For only whitespace lines, we insert comments
                shouldRemoveComments = false;
                // Also, no longer ignore them
                for (let i = 0, lineCount = lines.length; i < lineCount; i++) {
                    lines[i].ignore = false;
                }
            }
            return {
                supported: true,
                shouldRemoveComments: shouldRemoveComments,
                lines: lines
            };
        }
        /**
         * Analyze all lines and decide exactly what to do => not supported | insert line comments | remove line comments
         */
        static _gatherPreflightData(type, insertSpace, model, startLineNumber, endLineNumber, ignoreEmptyLines, ignoreFirstLine, languageConfigurationService) {
            const lines = LineCommentCommand._gatherPreflightCommentStrings(model, startLineNumber, endLineNumber, languageConfigurationService);
            if (lines === null) {
                return {
                    supported: false
                };
            }
            return LineCommentCommand._analyzeLines(type, insertSpace, model, lines, startLineNumber, ignoreEmptyLines, ignoreFirstLine, languageConfigurationService);
        }
        /**
         * Given a successful analysis, execute either insert line comments, either remove line comments
         */
        _executeLineComments(model, builder, data, s) {
            let ops;
            if (data.shouldRemoveComments) {
                ops = LineCommentCommand._createRemoveLineCommentsOperations(data.lines, s.startLineNumber);
            }
            else {
                LineCommentCommand._normalizeInsertionPoint(model, data.lines, s.startLineNumber, this._indentSize);
                ops = this._createAddLineCommentsOperations(data.lines, s.startLineNumber);
            }
            const cursorPosition = new position_1.Position(s.positionLineNumber, s.positionColumn);
            for (let i = 0, len = ops.length; i < len; i++) {
                builder.addEditOperation(ops[i].range, ops[i].text);
                if (range_1.Range.isEmpty(ops[i].range) && range_1.Range.getStartPosition(ops[i].range).equals(cursorPosition)) {
                    const lineContent = model.getLineContent(cursorPosition.lineNumber);
                    if (lineContent.length + 1 === cursorPosition.column) {
                        this._deltaColumn = (ops[i].text || '').length;
                    }
                }
            }
            this._selectionId = builder.trackSelection(s);
        }
        _attemptRemoveBlockComment(model, s, startToken, endToken) {
            let startLineNumber = s.startLineNumber;
            let endLineNumber = s.endLineNumber;
            const startTokenAllowedBeforeColumn = endToken.length + Math.max(model.getLineFirstNonWhitespaceColumn(s.startLineNumber), s.startColumn);
            let startTokenIndex = model.getLineContent(startLineNumber).lastIndexOf(startToken, startTokenAllowedBeforeColumn - 1);
            let endTokenIndex = model.getLineContent(endLineNumber).indexOf(endToken, s.endColumn - 1 - startToken.length);
            if (startTokenIndex !== -1 && endTokenIndex === -1) {
                endTokenIndex = model.getLineContent(startLineNumber).indexOf(endToken, startTokenIndex + startToken.length);
                endLineNumber = startLineNumber;
            }
            if (startTokenIndex === -1 && endTokenIndex !== -1) {
                startTokenIndex = model.getLineContent(endLineNumber).lastIndexOf(startToken, endTokenIndex);
                startLineNumber = endLineNumber;
            }
            if (s.isEmpty() && (startTokenIndex === -1 || endTokenIndex === -1)) {
                startTokenIndex = model.getLineContent(startLineNumber).indexOf(startToken);
                if (startTokenIndex !== -1) {
                    endTokenIndex = model.getLineContent(startLineNumber).indexOf(endToken, startTokenIndex + startToken.length);
                }
            }
            // We have to adjust to possible inner white space.
            // For Space after startToken, add Space to startToken - range math will work out.
            if (startTokenIndex !== -1 && model.getLineContent(startLineNumber).charCodeAt(startTokenIndex + startToken.length) === 32 /* CharCode.Space */) {
                startToken += ' ';
            }
            // For Space before endToken, add Space before endToken and shift index one left.
            if (endTokenIndex !== -1 && model.getLineContent(endLineNumber).charCodeAt(endTokenIndex - 1) === 32 /* CharCode.Space */) {
                endToken = ' ' + endToken;
                endTokenIndex -= 1;
            }
            if (startTokenIndex !== -1 && endTokenIndex !== -1) {
                return blockCommentCommand_1.BlockCommentCommand._createRemoveBlockCommentOperations(new range_1.Range(startLineNumber, startTokenIndex + startToken.length + 1, endLineNumber, endTokenIndex + 1), startToken, endToken);
            }
            return null;
        }
        /**
         * Given an unsuccessful analysis, delegate to the block comment command
         */
        _executeBlockComment(model, builder, s) {
            model.tokenization.tokenizeIfCheap(s.startLineNumber);
            const languageId = model.getLanguageIdAtPosition(s.startLineNumber, 1);
            const config = this.languageConfigurationService.getLanguageConfiguration(languageId).comments;
            if (!config || !config.blockCommentStartToken || !config.blockCommentEndToken) {
                // Mode does not support block comments
                return;
            }
            const startToken = config.blockCommentStartToken;
            const endToken = config.blockCommentEndToken;
            let ops = this._attemptRemoveBlockComment(model, s, startToken, endToken);
            if (!ops) {
                if (s.isEmpty()) {
                    const lineContent = model.getLineContent(s.startLineNumber);
                    let firstNonWhitespaceIndex = strings.firstNonWhitespaceIndex(lineContent);
                    if (firstNonWhitespaceIndex === -1) {
                        // Line is empty or contains only whitespace
                        firstNonWhitespaceIndex = lineContent.length;
                    }
                    ops = blockCommentCommand_1.BlockCommentCommand._createAddBlockCommentOperations(new range_1.Range(s.startLineNumber, firstNonWhitespaceIndex + 1, s.startLineNumber, lineContent.length + 1), startToken, endToken, this._insertSpace);
                }
                else {
                    ops = blockCommentCommand_1.BlockCommentCommand._createAddBlockCommentOperations(new range_1.Range(s.startLineNumber, model.getLineFirstNonWhitespaceColumn(s.startLineNumber), s.endLineNumber, model.getLineMaxColumn(s.endLineNumber)), startToken, endToken, this._insertSpace);
                }
                if (ops.length === 1) {
                    // Leave cursor after token and Space
                    this._deltaColumn = startToken.length + 1;
                }
            }
            this._selectionId = builder.trackSelection(s);
            for (const op of ops) {
                builder.addEditOperation(op.range, op.text);
            }
        }
        getEditOperations(model, builder) {
            let s = this._selection;
            this._moveEndPositionDown = false;
            if (s.startLineNumber === s.endLineNumber && this._ignoreFirstLine) {
                builder.addEditOperation(new range_1.Range(s.startLineNumber, model.getLineMaxColumn(s.startLineNumber), s.startLineNumber + 1, 1), s.startLineNumber === model.getLineCount() ? '' : '\n');
                this._selectionId = builder.trackSelection(s);
                return;
            }
            if (s.startLineNumber < s.endLineNumber && s.endColumn === 1) {
                this._moveEndPositionDown = true;
                s = s.setEndPosition(s.endLineNumber - 1, model.getLineMaxColumn(s.endLineNumber - 1));
            }
            const data = LineCommentCommand._gatherPreflightData(this._type, this._insertSpace, model, s.startLineNumber, s.endLineNumber, this._ignoreEmptyLines, this._ignoreFirstLine, this.languageConfigurationService);
            if (data.supported) {
                return this._executeLineComments(model, builder, data, s);
            }
            return this._executeBlockComment(model, builder, s);
        }
        computeCursorState(model, helper) {
            let result = helper.getTrackedSelection(this._selectionId);
            if (this._moveEndPositionDown) {
                result = result.setEndPosition(result.endLineNumber + 1, 1);
            }
            return new selection_1.Selection(result.selectionStartLineNumber, result.selectionStartColumn + this._deltaColumn, result.positionLineNumber, result.positionColumn + this._deltaColumn);
        }
        /**
         * Generate edit operations in the remove line comment case
         */
        static _createRemoveLineCommentsOperations(lines, startLineNumber) {
            const res = [];
            for (let i = 0, len = lines.length; i < len; i++) {
                const lineData = lines[i];
                if (lineData.ignore) {
                    continue;
                }
                res.push(editOperation_1.EditOperation.delete(new range_1.Range(startLineNumber + i, lineData.commentStrOffset + 1, startLineNumber + i, lineData.commentStrOffset + lineData.commentStrLength + 1)));
            }
            return res;
        }
        /**
         * Generate edit operations in the add line comment case
         */
        _createAddLineCommentsOperations(lines, startLineNumber) {
            const res = [];
            const afterCommentStr = this._insertSpace ? ' ' : '';
            for (let i = 0, len = lines.length; i < len; i++) {
                const lineData = lines[i];
                if (lineData.ignore) {
                    continue;
                }
                res.push(editOperation_1.EditOperation.insert(new position_1.Position(startLineNumber + i, lineData.commentStrOffset + 1), lineData.commentStr + afterCommentStr));
            }
            return res;
        }
        static nextVisibleColumn(currentVisibleColumn, indentSize, isTab, columnSize) {
            if (isTab) {
                return currentVisibleColumn + (indentSize - (currentVisibleColumn % indentSize));
            }
            return currentVisibleColumn + columnSize;
        }
        /**
         * Adjust insertion points to have them vertically aligned in the add line comment case
         */
        static _normalizeInsertionPoint(model, lines, startLineNumber, indentSize) {
            let minVisibleColumn = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
            let j;
            let lenJ;
            for (let i = 0, len = lines.length; i < len; i++) {
                if (lines[i].ignore) {
                    continue;
                }
                const lineContent = model.getLineContent(startLineNumber + i);
                let currentVisibleColumn = 0;
                for (let j = 0, lenJ = lines[i].commentStrOffset; currentVisibleColumn < minVisibleColumn && j < lenJ; j++) {
                    currentVisibleColumn = LineCommentCommand.nextVisibleColumn(currentVisibleColumn, indentSize, lineContent.charCodeAt(j) === 9 /* CharCode.Tab */, 1);
                }
                if (currentVisibleColumn < minVisibleColumn) {
                    minVisibleColumn = currentVisibleColumn;
                }
            }
            minVisibleColumn = Math.floor(minVisibleColumn / indentSize) * indentSize;
            for (let i = 0, len = lines.length; i < len; i++) {
                if (lines[i].ignore) {
                    continue;
                }
                const lineContent = model.getLineContent(startLineNumber + i);
                let currentVisibleColumn = 0;
                for (j = 0, lenJ = lines[i].commentStrOffset; currentVisibleColumn < minVisibleColumn && j < lenJ; j++) {
                    currentVisibleColumn = LineCommentCommand.nextVisibleColumn(currentVisibleColumn, indentSize, lineContent.charCodeAt(j) === 9 /* CharCode.Tab */, 1);
                }
                if (currentVisibleColumn > minVisibleColumn) {
                    lines[i].commentStrOffset = j - 1;
                }
                else {
                    lines[i].commentStrOffset = j;
                }
            }
        }
    }
    exports.LineCommentCommand = LineCommentCommand;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZUNvbW1lbnRDb21tYW5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jb21tZW50L2Jyb3dzZXIvbGluZUNvbW1lbnRDb21tYW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdDaEcsSUFBa0IsSUFJakI7SUFKRCxXQUFrQixJQUFJO1FBQ3JCLG1DQUFVLENBQUE7UUFDVix1Q0FBWSxDQUFBO1FBQ1osNkNBQWUsQ0FBQTtJQUNoQixDQUFDLEVBSmlCLElBQUksb0JBQUosSUFBSSxRQUlyQjtJQUVELE1BQWEsa0JBQWtCO1FBWTlCLFlBQ2tCLDRCQUEyRCxFQUM1RSxTQUFvQixFQUNwQixVQUFrQixFQUNsQixJQUFVLEVBQ1YsV0FBb0IsRUFDcEIsZ0JBQXlCLEVBQ3pCLGVBQXlCO1lBTlIsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUErQjtZQVE1RSxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztZQUM5QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztZQUNsQixJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztZQUNoQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztZQUN6QixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQztZQUN0QixJQUFJLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxnQkFBZ0IsQ0FBQztZQUMxQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZUFBZSxJQUFJLEtBQUssQ0FBQztRQUNsRCxDQUFDO1FBRUQ7OztXQUdHO1FBQ0ssTUFBTSxDQUFDLDhCQUE4QixDQUFDLEtBQWlCLEVBQUUsZUFBdUIsRUFBRSxhQUFxQixFQUFFLDRCQUEyRDtZQUUzSyxLQUFLLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNwRCxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsdUJBQXVCLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXJFLE1BQU0sTUFBTSxHQUFHLDRCQUE0QixDQUFDLHdCQUF3QixDQUFDLFVBQVUsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUMxRixNQUFNLFVBQVUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3RCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2pCLHNDQUFzQztnQkFDdEMsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQXlCLEVBQUUsQ0FBQztZQUN2QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxTQUFTLEdBQUcsYUFBYSxHQUFHLGVBQWUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNyRixLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUc7b0JBQ1YsTUFBTSxFQUFFLEtBQUs7b0JBQ2IsVUFBVSxFQUFFLFVBQVU7b0JBQ3RCLGdCQUFnQixFQUFFLENBQUM7b0JBQ25CLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxNQUFNO2lCQUNuQyxDQUFDO1lBQ0gsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVEOzs7V0FHRztRQUNJLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBVSxFQUFFLFdBQW9CLEVBQUUsS0FBbUIsRUFBRSxLQUEyQixFQUFFLGVBQXVCLEVBQUUsZ0JBQXlCLEVBQUUsZUFBd0IsRUFBRSw0QkFBMkQ7WUFDeFAsSUFBSSxtQkFBbUIsR0FBRyxJQUFJLENBQUM7WUFFL0IsSUFBSSxvQkFBNkIsQ0FBQztZQUNsQyxJQUFJLElBQUksd0JBQWdCLEVBQUUsQ0FBQztnQkFDMUIsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1lBQzdCLENBQUM7aUJBQU0sSUFBSSxJQUFJLDBCQUFrQixFQUFFLENBQUM7Z0JBQ25DLG9CQUFvQixHQUFHLEtBQUssQ0FBQztZQUM5QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1Asb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1lBQzdCLENBQUM7WUFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxTQUFTLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzlELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUIsTUFBTSxVQUFVLEdBQUcsZUFBZSxHQUFHLENBQUMsQ0FBQztnQkFFdkMsSUFBSSxVQUFVLEtBQUssZUFBZSxJQUFJLGVBQWUsRUFBRSxDQUFDO29CQUN2RCxxQkFBcUI7b0JBQ3JCLFFBQVEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO29CQUN2QixTQUFTO2dCQUNWLENBQUM7Z0JBRUQsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDckQsTUFBTSxzQkFBc0IsR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBRTVFLElBQUksc0JBQXNCLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDbkMsZ0NBQWdDO29CQUNoQyxRQUFRLENBQUMsTUFBTSxHQUFHLGdCQUFnQixDQUFDO29CQUNuQyxRQUFRLENBQUMsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQztvQkFDL0MsU0FBUztnQkFDVixDQUFDO2dCQUVELG1CQUFtQixHQUFHLEtBQUssQ0FBQztnQkFDNUIsUUFBUSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7Z0JBQ3hCLFFBQVEsQ0FBQyxnQkFBZ0IsR0FBRyxzQkFBc0IsQ0FBQztnQkFFbkQsSUFBSSxvQkFBb0IsSUFBSSxDQUFDLHlDQUFtQixDQUFDLDBCQUEwQixDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFLHNCQUFzQixDQUFDLEVBQUUsQ0FBQztvQkFDdkksSUFBSSxJQUFJLHdCQUFnQixFQUFFLENBQUM7d0JBQzFCLGlFQUFpRTt3QkFDakUsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO29CQUM5QixDQUFDO3lCQUFNLElBQUksSUFBSSwwQkFBa0IsRUFBRSxDQUFDO3dCQUNuQyxrQkFBa0I7b0JBQ25CLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxRQUFRLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztvQkFDeEIsQ0FBQztnQkFDRixDQUFDO2dCQUVELElBQUksb0JBQW9CLElBQUksV0FBVyxFQUFFLENBQUM7b0JBQ3pDLHNDQUFzQztvQkFDdEMsTUFBTSxtQkFBbUIsR0FBRyxzQkFBc0IsR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUM7b0JBQy9FLElBQUksbUJBQW1CLEdBQUcsV0FBVyxDQUFDLE1BQU0sSUFBSSxXQUFXLENBQUMsVUFBVSxDQUFDLG1CQUFtQixDQUFDLDRCQUFtQixFQUFFLENBQUM7d0JBQ2hILFFBQVEsQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLENBQUM7b0JBQ2hDLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLElBQUksd0JBQWdCLElBQUksbUJBQW1CLEVBQUUsQ0FBQztnQkFDakQsZ0RBQWdEO2dCQUNoRCxvQkFBb0IsR0FBRyxLQUFLLENBQUM7Z0JBRTdCLDhCQUE4QjtnQkFDOUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUM5RCxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztnQkFDekIsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPO2dCQUNOLFNBQVMsRUFBRSxJQUFJO2dCQUNmLG9CQUFvQixFQUFFLG9CQUFvQjtnQkFDMUMsS0FBSyxFQUFFLEtBQUs7YUFDWixDQUFDO1FBQ0gsQ0FBQztRQUVEOztXQUVHO1FBQ0ksTUFBTSxDQUFDLG9CQUFvQixDQUFDLElBQVUsRUFBRSxXQUFvQixFQUFFLEtBQWlCLEVBQUUsZUFBdUIsRUFBRSxhQUFxQixFQUFFLGdCQUF5QixFQUFFLGVBQXdCLEVBQUUsNEJBQTJEO1lBQ3ZQLE1BQU0sS0FBSyxHQUFHLGtCQUFrQixDQUFDLDhCQUE4QixDQUFDLEtBQUssRUFBRSxlQUFlLEVBQUUsYUFBYSxFQUFFLDRCQUE0QixDQUFDLENBQUM7WUFDckksSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ3BCLE9BQU87b0JBQ04sU0FBUyxFQUFFLEtBQUs7aUJBQ2hCLENBQUM7WUFDSCxDQUFDO1lBRUQsT0FBTyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxnQkFBZ0IsRUFBRSxlQUFlLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztRQUM1SixDQUFDO1FBRUQ7O1dBRUc7UUFDSyxvQkFBb0IsQ0FBQyxLQUFtQixFQUFFLE9BQThCLEVBQUUsSUFBNkIsRUFBRSxDQUFZO1lBRTVILElBQUksR0FBMkIsQ0FBQztZQUVoQyxJQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUMvQixHQUFHLEdBQUcsa0JBQWtCLENBQUMsbUNBQW1DLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDN0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLGtCQUFrQixDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNwRyxHQUFHLEdBQUcsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQzVFLENBQUM7WUFFRCxNQUFNLGNBQWMsR0FBRyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUU1RSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2hELE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEQsSUFBSSxhQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxhQUFLLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO29CQUNoRyxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDcEUsSUFBSSxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsS0FBSyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ3RELElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQztvQkFDaEQsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRU8sMEJBQTBCLENBQUMsS0FBaUIsRUFBRSxDQUFZLEVBQUUsVUFBa0IsRUFBRSxRQUFnQjtZQUN2RyxJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUMsZUFBZSxDQUFDO1lBQ3hDLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUM7WUFFcEMsTUFBTSw2QkFBNkIsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQy9ELEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLEVBQ3hELENBQUMsQ0FBQyxXQUFXLENBQ2IsQ0FBQztZQUVGLElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSw2QkFBNkIsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN2SCxJQUFJLGFBQWEsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLFNBQVMsR0FBRyxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRS9HLElBQUksZUFBZSxLQUFLLENBQUMsQ0FBQyxJQUFJLGFBQWEsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNwRCxhQUFhLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLGVBQWUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzdHLGFBQWEsR0FBRyxlQUFlLENBQUM7WUFDakMsQ0FBQztZQUVELElBQUksZUFBZSxLQUFLLENBQUMsQ0FBQyxJQUFJLGFBQWEsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNwRCxlQUFlLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUM3RixlQUFlLEdBQUcsYUFBYSxDQUFDO1lBQ2pDLENBQUM7WUFFRCxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGVBQWUsS0FBSyxDQUFDLENBQUMsSUFBSSxhQUFhLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNyRSxlQUFlLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzVFLElBQUksZUFBZSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQzVCLGFBQWEsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsZUFBZSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDOUcsQ0FBQztZQUNGLENBQUM7WUFFRCxtREFBbUQ7WUFDbkQsa0ZBQWtGO1lBQ2xGLElBQUksZUFBZSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLENBQUMsVUFBVSxDQUFDLGVBQWUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLDRCQUFtQixFQUFFLENBQUM7Z0JBQ3hJLFVBQVUsSUFBSSxHQUFHLENBQUM7WUFDbkIsQ0FBQztZQUVELGlGQUFpRjtZQUNqRixJQUFJLGFBQWEsS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLDRCQUFtQixFQUFFLENBQUM7Z0JBQ2xILFFBQVEsR0FBRyxHQUFHLEdBQUcsUUFBUSxDQUFDO2dCQUMxQixhQUFhLElBQUksQ0FBQyxDQUFDO1lBQ3BCLENBQUM7WUFFRCxJQUFJLGVBQWUsS0FBSyxDQUFDLENBQUMsSUFBSSxhQUFhLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDcEQsT0FBTyx5Q0FBbUIsQ0FBQyxtQ0FBbUMsQ0FDN0QsSUFBSSxhQUFLLENBQUMsZUFBZSxFQUFFLGVBQWUsR0FBRyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxhQUFhLEVBQUUsYUFBYSxHQUFHLENBQUMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQzNILENBQUM7WUFDSCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQ7O1dBRUc7UUFDSyxvQkFBb0IsQ0FBQyxLQUFpQixFQUFFLE9BQThCLEVBQUUsQ0FBWTtZQUMzRixLQUFLLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDdEQsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkUsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixDQUFDLHdCQUF3QixDQUFDLFVBQVUsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUMvRixJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLHNCQUFzQixJQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQy9FLHVDQUF1QztnQkFDdkMsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsc0JBQXNCLENBQUM7WUFDakQsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixDQUFDO1lBRTdDLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMxRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztvQkFDakIsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQzVELElBQUksdUJBQXVCLEdBQUcsT0FBTyxDQUFDLHVCQUF1QixDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUMzRSxJQUFJLHVCQUF1QixLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ3BDLDRDQUE0Qzt3QkFDNUMsdUJBQXVCLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQztvQkFDOUMsQ0FBQztvQkFDRCxHQUFHLEdBQUcseUNBQW1CLENBQUMsZ0NBQWdDLENBQ3pELElBQUksYUFBSyxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsdUJBQXVCLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFDcEcsVUFBVSxFQUNWLFFBQVEsRUFDUixJQUFJLENBQUMsWUFBWSxDQUNqQixDQUFDO2dCQUNILENBQUM7cUJBQU0sQ0FBQztvQkFDUCxHQUFHLEdBQUcseUNBQW1CLENBQUMsZ0NBQWdDLENBQ3pELElBQUksYUFBSyxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsRUFDaEosVUFBVSxFQUNWLFFBQVEsRUFDUixJQUFJLENBQUMsWUFBWSxDQUNqQixDQUFDO2dCQUNILENBQUM7Z0JBRUQsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUN0QixxQ0FBcUM7b0JBQ3JDLElBQUksQ0FBQyxZQUFZLEdBQUcsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7Z0JBQzNDLENBQUM7WUFDRixDQUFDO1lBQ0QsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlDLEtBQUssTUFBTSxFQUFFLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ3RCLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxDQUFDO1FBQ0YsQ0FBQztRQUVNLGlCQUFpQixDQUFDLEtBQWlCLEVBQUUsT0FBOEI7WUFFekUsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUN4QixJQUFJLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO1lBRWxDLElBQUksQ0FBQyxDQUFDLGVBQWUsS0FBSyxDQUFDLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUNwRSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxlQUFlLEtBQUssS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwTCxJQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQyxhQUFhLElBQUksQ0FBQyxDQUFDLFNBQVMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDOUQsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQztnQkFDakMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLGFBQWEsR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4RixDQUFDO1lBRUQsTUFBTSxJQUFJLEdBQUcsa0JBQWtCLENBQUMsb0JBQW9CLENBQ25ELElBQUksQ0FBQyxLQUFLLEVBQ1YsSUFBSSxDQUFDLFlBQVksRUFDakIsS0FBSyxFQUNMLENBQUMsQ0FBQyxlQUFlLEVBQ2pCLENBQUMsQ0FBQyxhQUFhLEVBQ2YsSUFBSSxDQUFDLGlCQUFpQixFQUN0QixJQUFJLENBQUMsZ0JBQWdCLEVBQ3JCLElBQUksQ0FBQyw0QkFBNEIsQ0FDakMsQ0FBQztZQUVGLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNwQixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBRU0sa0JBQWtCLENBQUMsS0FBaUIsRUFBRSxNQUFnQztZQUM1RSxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFlBQWEsQ0FBQyxDQUFDO1lBRTVELElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQy9CLE1BQU0sR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdELENBQUM7WUFFRCxPQUFPLElBQUkscUJBQVMsQ0FDbkIsTUFBTSxDQUFDLHdCQUF3QixFQUMvQixNQUFNLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFDL0MsTUFBTSxDQUFDLGtCQUFrQixFQUN6QixNQUFNLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQ3pDLENBQUM7UUFDSCxDQUFDO1FBRUQ7O1dBRUc7UUFDSSxNQUFNLENBQUMsbUNBQW1DLENBQUMsS0FBMkIsRUFBRSxlQUF1QjtZQUNyRyxNQUFNLEdBQUcsR0FBMkIsRUFBRSxDQUFDO1lBRXZDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDbEQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUUxQixJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDckIsU0FBUztnQkFDVixDQUFDO2dCQUVELEdBQUcsQ0FBQyxJQUFJLENBQUMsNkJBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxhQUFLLENBQ3RDLGVBQWUsR0FBRyxDQUFDLEVBQUUsUUFBUSxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFDbEQsZUFBZSxHQUFHLENBQUMsRUFBRSxRQUFRLENBQUMsZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FDOUUsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1lBRUQsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDO1FBRUQ7O1dBRUc7UUFDSyxnQ0FBZ0MsQ0FBQyxLQUEyQixFQUFFLGVBQXVCO1lBQzVGLE1BQU0sR0FBRyxHQUEyQixFQUFFLENBQUM7WUFDdkMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFHckQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNsRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRTFCLElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNyQixTQUFTO2dCQUNWLENBQUM7Z0JBRUQsR0FBRyxDQUFDLElBQUksQ0FBQyw2QkFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLG1CQUFRLENBQUMsZUFBZSxHQUFHLENBQUMsRUFBRSxRQUFRLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLFVBQVUsR0FBRyxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBQ3pJLENBQUM7WUFFRCxPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUM7UUFFTyxNQUFNLENBQUMsaUJBQWlCLENBQUMsb0JBQTRCLEVBQUUsVUFBa0IsRUFBRSxLQUFjLEVBQUUsVUFBa0I7WUFDcEgsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDWCxPQUFPLG9CQUFvQixHQUFHLENBQUMsVUFBVSxHQUFHLENBQUMsb0JBQW9CLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNsRixDQUFDO1lBQ0QsT0FBTyxvQkFBb0IsR0FBRyxVQUFVLENBQUM7UUFDMUMsQ0FBQztRQUVEOztXQUVHO1FBQ0ksTUFBTSxDQUFDLHdCQUF3QixDQUFDLEtBQW1CLEVBQUUsS0FBd0IsRUFBRSxlQUF1QixFQUFFLFVBQWtCO1lBQ2hJLElBQUksZ0JBQWdCLG9EQUFtQyxDQUFDO1lBQ3hELElBQUksQ0FBUyxDQUFDO1lBQ2QsSUFBSSxJQUFZLENBQUM7WUFFakIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNsRCxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDckIsU0FBUztnQkFDVixDQUFDO2dCQUVELE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUU5RCxJQUFJLG9CQUFvQixHQUFHLENBQUMsQ0FBQztnQkFDN0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxvQkFBb0IsR0FBRyxnQkFBZ0IsSUFBSSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzVHLG9CQUFvQixHQUFHLGtCQUFrQixDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyx5QkFBaUIsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUksQ0FBQztnQkFFRCxJQUFJLG9CQUFvQixHQUFHLGdCQUFnQixFQUFFLENBQUM7b0JBQzdDLGdCQUFnQixHQUFHLG9CQUFvQixDQUFDO2dCQUN6QyxDQUFDO1lBQ0YsQ0FBQztZQUVELGdCQUFnQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLEdBQUcsVUFBVSxDQUFDO1lBRTFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDbEQsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ3JCLFNBQVM7Z0JBQ1YsQ0FBQztnQkFFRCxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFFOUQsSUFBSSxvQkFBb0IsR0FBRyxDQUFDLENBQUM7Z0JBQzdCLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixFQUFFLG9CQUFvQixHQUFHLGdCQUFnQixJQUFJLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDeEcsb0JBQW9CLEdBQUcsa0JBQWtCLENBQUMsaUJBQWlCLENBQUMsb0JBQW9CLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLHlCQUFpQixFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5SSxDQUFDO2dCQUVELElBQUksb0JBQW9CLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDN0MsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ25DLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO2dCQUMvQixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7S0FDRDtJQTFhRCxnREEwYUMifQ==