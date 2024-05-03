/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/editOperation", "vs/editor/common/core/range"], function (require, exports, strings, editOperation_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TrimTrailingWhitespaceCommand = void 0;
    exports.trimTrailingWhitespace = trimTrailingWhitespace;
    class TrimTrailingWhitespaceCommand {
        constructor(selection, cursors, trimInRegexesAndStrings) {
            this._selection = selection;
            this._cursors = cursors;
            this._selectionId = null;
            this._trimInRegexesAndStrings = trimInRegexesAndStrings;
        }
        getEditOperations(model, builder) {
            const ops = trimTrailingWhitespace(model, this._cursors, this._trimInRegexesAndStrings);
            for (let i = 0, len = ops.length; i < len; i++) {
                const op = ops[i];
                builder.addEditOperation(op.range, op.text);
            }
            this._selectionId = builder.trackSelection(this._selection);
        }
        computeCursorState(model, helper) {
            return helper.getTrackedSelection(this._selectionId);
        }
    }
    exports.TrimTrailingWhitespaceCommand = TrimTrailingWhitespaceCommand;
    /**
     * Generate commands for trimming trailing whitespace on a model and ignore lines on which cursors are sitting.
     */
    function trimTrailingWhitespace(model, cursors, trimInRegexesAndStrings) {
        // Sort cursors ascending
        cursors.sort((a, b) => {
            if (a.lineNumber === b.lineNumber) {
                return a.column - b.column;
            }
            return a.lineNumber - b.lineNumber;
        });
        // Reduce multiple cursors on the same line and only keep the last one on the line
        for (let i = cursors.length - 2; i >= 0; i--) {
            if (cursors[i].lineNumber === cursors[i + 1].lineNumber) {
                // Remove cursor at `i`
                cursors.splice(i, 1);
            }
        }
        const r = [];
        let rLen = 0;
        let cursorIndex = 0;
        const cursorLen = cursors.length;
        for (let lineNumber = 1, lineCount = model.getLineCount(); lineNumber <= lineCount; lineNumber++) {
            const lineContent = model.getLineContent(lineNumber);
            const maxLineColumn = lineContent.length + 1;
            let minEditColumn = 0;
            if (cursorIndex < cursorLen && cursors[cursorIndex].lineNumber === lineNumber) {
                minEditColumn = cursors[cursorIndex].column;
                cursorIndex++;
                if (minEditColumn === maxLineColumn) {
                    // The cursor is at the end of the line => no edits for sure on this line
                    continue;
                }
            }
            if (lineContent.length === 0) {
                continue;
            }
            const lastNonWhitespaceIndex = strings.lastNonWhitespaceIndex(lineContent);
            let fromColumn = 0;
            if (lastNonWhitespaceIndex === -1) {
                // Entire line is whitespace
                fromColumn = 1;
            }
            else if (lastNonWhitespaceIndex !== lineContent.length - 1) {
                // There is trailing whitespace
                fromColumn = lastNonWhitespaceIndex + 2;
            }
            else {
                // There is no trailing whitespace
                continue;
            }
            if (!trimInRegexesAndStrings) {
                if (!model.tokenization.hasAccurateTokensForLine(lineNumber)) {
                    // We don't want to force line tokenization, as that can be expensive, but we also don't want to trim
                    // trailing whitespace in lines that are not tokenized yet, as that can be wrong and trim whitespace from
                    // lines that the user requested we don't. So we bail out if the tokens are not accurate for this line.
                    continue;
                }
                const lineTokens = model.tokenization.getLineTokens(lineNumber);
                const fromColumnType = lineTokens.getStandardTokenType(lineTokens.findTokenIndexAtOffset(fromColumn));
                if (fromColumnType === 2 /* StandardTokenType.String */ || fromColumnType === 3 /* StandardTokenType.RegEx */) {
                    continue;
                }
            }
            fromColumn = Math.max(minEditColumn, fromColumn);
            r[rLen++] = editOperation_1.EditOperation.delete(new range_1.Range(lineNumber, fromColumn, lineNumber, maxLineColumn));
        }
        return r;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJpbVRyYWlsaW5nV2hpdGVzcGFjZUNvbW1hbmQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vY29tbWFuZHMvdHJpbVRyYWlsaW5nV2hpdGVzcGFjZUNvbW1hbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNENoRyx3REE4RUM7SUEvR0QsTUFBYSw2QkFBNkI7UUFPekMsWUFBWSxTQUFvQixFQUFFLE9BQW1CLEVBQUUsdUJBQWdDO1lBQ3RGLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1lBQzVCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLElBQUksQ0FBQyx3QkFBd0IsR0FBRyx1QkFBdUIsQ0FBQztRQUN6RCxDQUFDO1FBRU0saUJBQWlCLENBQUMsS0FBaUIsRUFBRSxPQUE4QjtZQUN6RSxNQUFNLEdBQUcsR0FBRyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUN4RixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2hELE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFbEIsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdDLENBQUM7WUFFRCxJQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxD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