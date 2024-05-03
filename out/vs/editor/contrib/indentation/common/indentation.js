/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/commands/shiftCommand", "vs/editor/common/core/editOperation", "vs/editor/common/core/indentation", "vs/editor/common/core/selection"], function (require, exports, strings, shiftCommand_1, editOperation_1, indentation_1, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getReindentEditOperations = getReindentEditOperations;
    function getReindentEditOperations(model, languageConfigurationService, startLineNumber, endLineNumber, inheritedIndent) {
        if (model.getLineCount() === 1 && model.getLineMaxColumn(1) === 1) {
            // Model is empty
            return [];
        }
        const indentationRules = languageConfigurationService.getLanguageConfiguration(model.getLanguageId()).indentationRules;
        if (!indentationRules) {
            return [];
        }
        endLineNumber = Math.min(endLineNumber, model.getLineCount());
        // Skip `unIndentedLinePattern` lines
        while (startLineNumber <= endLineNumber) {
            if (!indentationRules.unIndentedLinePattern) {
                break;
            }
            const text = model.getLineContent(startLineNumber);
            if (!indentationRules.unIndentedLinePattern.test(text)) {
                break;
            }
            startLineNumber++;
        }
        if (startLineNumber > endLineNumber - 1) {
            return [];
        }
        const { tabSize, indentSize, insertSpaces } = model.getOptions();
        const shiftIndent = (indentation, count) => {
            count = count || 1;
            return shiftCommand_1.ShiftCommand.shiftIndent(indentation, indentation.length + count, tabSize, indentSize, insertSpaces);
        };
        const unshiftIndent = (indentation, count) => {
            count = count || 1;
            return shiftCommand_1.ShiftCommand.unshiftIndent(indentation, indentation.length + count, tabSize, indentSize, insertSpaces);
        };
        const indentEdits = [];
        // indentation being passed to lines below
        let globalIndent;
        // Calculate indentation for the first line
        // If there is no passed-in indentation, we use the indentation of the first line as base.
        const currentLineText = model.getLineContent(startLineNumber);
        let adjustedLineContent = currentLineText;
        if (inheritedIndent !== undefined && inheritedIndent !== null) {
            globalIndent = inheritedIndent;
            const oldIndentation = strings.getLeadingWhitespace(currentLineText);
            adjustedLineContent = globalIndent + currentLineText.substring(oldIndentation.length);
            if (indentationRules.decreaseIndentPattern && indentationRules.decreaseIndentPattern.test(adjustedLineContent)) {
                globalIndent = unshiftIndent(globalIndent);
                adjustedLineContent = globalIndent + currentLineText.substring(oldIndentation.length);
            }
            if (currentLineText !== adjustedLineContent) {
                indentEdits.push(editOperation_1.EditOperation.replaceMove(new selection_1.Selection(startLineNumber, 1, startLineNumber, oldIndentation.length + 1), (0, indentation_1.normalizeIndentation)(globalIndent, indentSize, insertSpaces)));
            }
        }
        else {
            globalIndent = strings.getLeadingWhitespace(currentLineText);
        }
        // idealIndentForNextLine doesn't equal globalIndent when there is a line matching `indentNextLinePattern`.
        let idealIndentForNextLine = globalIndent;
        if (indentationRules.increaseIndentPattern && indentationRules.increaseIndentPattern.test(adjustedLineContent)) {
            idealIndentForNextLine = shiftIndent(idealIndentForNextLine);
            globalIndent = shiftIndent(globalIndent);
        }
        else if (indentationRules.indentNextLinePattern && indentationRules.indentNextLinePattern.test(adjustedLineContent)) {
            idealIndentForNextLine = shiftIndent(idealIndentForNextLine);
        }
        startLineNumber++;
        // Calculate indentation adjustment for all following lines
        for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
            const text = model.getLineContent(lineNumber);
            const oldIndentation = strings.getLeadingWhitespace(text);
            const adjustedLineContent = idealIndentForNextLine + text.substring(oldIndentation.length);
            if (indentationRules.decreaseIndentPattern && indentationRules.decreaseIndentPattern.test(adjustedLineContent)) {
                idealIndentForNextLine = unshiftIndent(idealIndentForNextLine);
                globalIndent = unshiftIndent(globalIndent);
            }
            if (oldIndentation !== idealIndentForNextLine) {
                indentEdits.push(editOperation_1.EditOperation.replaceMove(new selection_1.Selection(lineNumber, 1, lineNumber, oldIndentation.length + 1), (0, indentation_1.normalizeIndentation)(idealIndentForNextLine, indentSize, insertSpaces)));
            }
            // calculate idealIndentForNextLine
            if (indentationRules.unIndentedLinePattern && indentationRules.unIndentedLinePattern.test(text)) {
                // In reindent phase, if the line matches `unIndentedLinePattern` we inherit indentation from above lines
                // but don't change globalIndent and idealIndentForNextLine.
                continue;
            }
            else if (indentationRules.increaseIndentPattern && indentationRules.increaseIndentPattern.test(adjustedLineContent)) {
                globalIndent = shiftIndent(globalIndent);
                idealIndentForNextLine = globalIndent;
            }
            else if (indentationRules.indentNextLinePattern && indentationRules.indentNextLinePattern.test(adjustedLineContent)) {
                idealIndentForNextLine = shiftIndent(idealIndentForNextLine);
            }
            else {
                idealIndentForNextLine = globalIndent;
            }
        }
        return indentEdits;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50YXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2luZGVudGF0aW9uL2NvbW1vbi9pbmRlbnRhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVVoRyw4REE4R0M7SUE5R0QsU0FBZ0IseUJBQXlCLENBQUMsS0FBaUIsRUFBRSw0QkFBMkQsRUFBRSxlQUF1QixFQUFFLGFBQXFCLEVBQUUsZUFBd0I7UUFDak0sSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNuRSxpQkFBaUI7WUFDakIsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRUQsTUFBTSxnQkFBZ0IsR0FBRyw0QkFBNEIsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQztRQUN2SCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUN2QixPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFRCxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7UUFFOUQscUNBQXFDO1FBQ3JDLE9BQU8sZUFBZSxJQUFJLGFBQWEsRUFBRSxDQUFDO1lBQ3pDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUM3QyxNQUFNO1lBQ1AsQ0FBQztZQUVELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENB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