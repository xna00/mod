/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection"], function (require, exports, editOperation_1, position_1, range_1, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BlockCommentCommand = void 0;
    class BlockCommentCommand {
        constructor(selection, insertSpace, languageConfigurationService) {
            this.languageConfigurationService = languageConfigurationService;
            this._selection = selection;
            this._insertSpace = insertSpace;
            this._usedEndToken = null;
        }
        static _haystackHasNeedleAtOffset(haystack, needle, offset) {
            if (offset < 0) {
                return false;
            }
            const needleLength = needle.length;
            const haystackLength = haystack.length;
            if (offset + needleLength > haystackLength) {
                return false;
            }
            for (let i = 0; i < needleLength; i++) {
                const codeA = haystack.charCodeAt(offset + i);
                const codeB = needle.charCodeAt(i);
                if (codeA === codeB) {
                    continue;
                }
                if (codeA >= 65 /* CharCode.A */ && codeA <= 90 /* CharCode.Z */ && codeA + 32 === codeB) {
                    // codeA is upper-case variant of codeB
                    continue;
                }
                if (codeB >= 65 /* CharCode.A */ && codeB <= 90 /* CharCode.Z */ && codeB + 32 === codeA) {
                    // codeB is upper-case variant of codeA
                    continue;
                }
                return false;
            }
            return true;
        }
        _createOperationsForBlockComment(selection, startToken, endToken, insertSpace, model, builder) {
            const startLineNumber = selection.startLineNumber;
            const startColumn = selection.startColumn;
            const endLineNumber = selection.endLineNumber;
            const endColumn = selection.endColumn;
            const startLineText = model.getLineContent(startLineNumber);
            const endLineText = model.getLineContent(endLineNumber);
            let startTokenIndex = startLineText.lastIndexOf(startToken, startColumn - 1 + startToken.length);
            let endTokenIndex = endLineText.indexOf(endToken, endColumn - 1 - endToken.length);
            if (startTokenIndex !== -1 && endTokenIndex !== -1) {
                if (startLineNumber === endLineNumber) {
                    const lineBetweenTokens = startLineText.substring(startTokenIndex + startToken.length, endTokenIndex);
                    if (lineBetweenTokens.indexOf(endToken) >= 0) {
                        // force to add a block comment
                        startTokenIndex = -1;
                        endTokenIndex = -1;
                    }
                }
                else {
                    const startLineAfterStartToken = startLineText.substring(startTokenIndex + startToken.length);
                    const endLineBeforeEndToken = endLineText.substring(0, endTokenIndex);
                    if (startLineAfterStartToken.indexOf(endToken) >= 0 || endLineBeforeEndToken.indexOf(endToken) >= 0) {
                        // force to add a block comment
                        startTokenIndex = -1;
                        endTokenIndex = -1;
                    }
                }
            }
            let ops;
            if (startTokenIndex !== -1 && endTokenIndex !== -1) {
                // Consider spaces as part of the comment tokens
                if (insertSpace && startTokenIndex + startToken.length < startLineText.length && startLineText.charCodeAt(startTokenIndex + startToken.length) === 32 /* CharCode.Space */) {
                    // Pretend the start token contains a trailing space
                    startToken = startToken + ' ';
                }
                if (insertSpace && endTokenIndex > 0 && endLineText.charCodeAt(endTokenIndex - 1) === 32 /* CharCode.Space */) {
                    // Pretend the end token contains a leading space
                    endToken = ' ' + endToken;
                    endTokenIndex -= 1;
                }
                ops = BlockCommentCommand._createRemoveBlockCommentOperations(new range_1.Range(startLineNumber, startTokenIndex + startToken.length + 1, endLineNumber, endTokenIndex + 1), startToken, endToken);
            }
            else {
                ops = BlockCommentCommand._createAddBlockCommentOperations(selection, startToken, endToken, this._insertSpace);
                this._usedEndToken = ops.length === 1 ? endToken : null;
            }
            for (const op of ops) {
                builder.addTrackedEditOperation(op.range, op.text);
            }
        }
        static _createRemoveBlockCommentOperations(r, startToken, endToken) {
            const res = [];
            if (!range_1.Range.isEmpty(r)) {
                // Remove block comment start
                res.push(editOperation_1.EditOperation.delete(new range_1.Range(r.startLineNumber, r.startColumn - startToken.length, r.startLineNumber, r.startColumn)));
                // Remove block comment end
                res.push(editOperation_1.EditOperation.delete(new range_1.Range(r.endLineNumber, r.endColumn, r.endLineNumber, r.endColumn + endToken.length)));
            }
            else {
                // Remove both continuously
                res.push(editOperation_1.EditOperation.delete(new range_1.Range(r.startLineNumber, r.startColumn - startToken.length, r.endLineNumber, r.endColumn + endToken.length)));
            }
            return res;
        }
        static _createAddBlockCommentOperations(r, startToken, endToken, insertSpace) {
            const res = [];
            if (!range_1.Range.isEmpty(r)) {
                // Insert block comment start
                res.push(editOperation_1.EditOperation.insert(new position_1.Position(r.startLineNumber, r.startColumn), startToken + (insertSpace ? ' ' : '')));
                // Insert block comment end
                res.push(editOperation_1.EditOperation.insert(new position_1.Position(r.endLineNumber, r.endColumn), (insertSpace ? ' ' : '') + endToken));
            }
            else {
                // Insert both continuously
                res.push(editOperation_1.EditOperation.replace(new range_1.Range(r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn), startToken + '  ' + endToken));
            }
            return res;
        }
        getEditOperations(model, builder) {
            const startLineNumber = this._selection.startLineNumber;
            const startColumn = this._selection.startColumn;
            model.tokenization.tokenizeIfCheap(startLineNumber);
            const languageId = model.getLanguageIdAtPosition(startLineNumber, startColumn);
            const config = this.languageConfigurationService.getLanguageConfiguration(languageId).comments;
            if (!config || !config.blockCommentStartToken || !config.blockCommentEndToken) {
                // Mode does not support block comments
                return;
            }
            this._createOperationsForBlockComment(this._selection, config.blockCommentStartToken, config.blockCommentEndToken, this._insertSpace, model, builder);
        }
        computeCursorState(model, helper) {
            const inverseEditOperations = helper.getInverseEditOperations();
            if (inverseEditOperations.length === 2) {
                const startTokenEditOperation = inverseEditOperations[0];
                const endTokenEditOperation = inverseEditOperations[1];
                return new selection_1.Selection(startTokenEditOperation.range.endLineNumber, startTokenEditOperation.range.endColumn, endTokenEditOperation.range.startLineNumber, endTokenEditOperation.range.startColumn);
            }
            else {
                const srcRange = inverseEditOperations[0].range;
                const deltaColumn = this._usedEndToken ? -this._usedEndToken.length - 1 : 0; // minus 1 space before endToken
                return new selection_1.Selection(srcRange.endLineNumber, srcRange.endColumn + deltaColumn, srcRange.endLineNumber, srcRange.endColumn + deltaColumn);
            }
        }
    }
    exports.BlockCommentCommand = BlockCommentCommand;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxvY2tDb21tZW50Q29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY29tbWVudC9icm93c2VyL2Jsb2NrQ29tbWVudENvbW1hbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLE1BQWEsbUJBQW1CO1FBTS9CLFlBQ0MsU0FBb0IsRUFDcEIsV0FBb0IsRUFDSCw0QkFBMkQ7WUFBM0QsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUErQjtZQUU1RSxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztZQUNoQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUMzQixDQUFDO1FBRU0sTUFBTSxDQUFDLDBCQUEwQixDQUFDLFFBQWdCLEVBQUUsTUFBYyxFQUFFLE1BQWM7WUFDeEYsSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hCLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDbkMsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUN2QyxJQUFJLE1BQU0sR0FBRyxZQUFZLEdBQUcsY0FBYyxFQUFFLENBQUM7Z0JBQzVDLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENB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