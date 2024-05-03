/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/cursorColumns", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages/enterAction", "vs/editor/common/languages/languageConfigurationRegistry"], function (require, exports, strings, cursorColumns_1, range_1, selection_1, enterAction_1, languageConfigurationRegistry_1) {
    "use strict";
    var ShiftCommand_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShiftCommand = void 0;
    const repeatCache = Object.create(null);
    function cachedStringRepeat(str, count) {
        if (count <= 0) {
            return '';
        }
        if (!repeatCache[str]) {
            repeatCache[str] = ['', str];
        }
        const cache = repeatCache[str];
        for (let i = cache.length; i <= count; i++) {
            cache[i] = cache[i - 1] + str;
        }
        return cache[count];
    }
    let ShiftCommand = ShiftCommand_1 = class ShiftCommand {
        static unshiftIndent(line, column, tabSize, indentSize, insertSpaces) {
            // Determine the visible column where the content starts
            const contentStartVisibleColumn = cursorColumns_1.CursorColumns.visibleColumnFromColumn(line, column, tabSize);
            if (insertSpaces) {
                const indent = cachedStringRepeat(' ', indentSize);
                const desiredTabStop = cursorColumns_1.CursorColumns.prevIndentTabStop(contentStartVisibleColumn, indentSize);
                const indentCount = desiredTabStop / indentSize; // will be an integer
                return cachedStringRepeat(indent, indentCount);
            }
            else {
                const indent = '\t';
                const desiredTabStop = cursorColumns_1.CursorColumns.prevRenderTabStop(contentStartVisibleColumn, tabSize);
                const indentCount = desiredTabStop / tabSize; // will be an integer
                return cachedStringRepeat(indent, indentCount);
            }
        }
        static shiftIndent(line, column, tabSize, indentSize, insertSpaces) {
            // Determine the visible column where the content starts
            const contentStartVisibleColumn = cursorColumns_1.CursorColumns.visibleColumnFromColumn(line, column, tabSize);
            if (insertSpaces) {
                const indent = cachedStringRepeat(' ', indentSize);
                const desiredTabStop = cursorColumns_1.CursorColumns.nextIndentTabStop(contentStartVisibleColumn, indentSize);
                const indentCount = desiredTabStop / indentSize; // will be an integer
                return cachedStringRepeat(indent, indentCount);
            }
            else {
                const indent = '\t';
                const desiredTabStop = cursorColumns_1.CursorColumns.nextRenderTabStop(contentStartVisibleColumn, tabSize);
                const indentCount = desiredTabStop / tabSize; // will be an integer
                return cachedStringRepeat(indent, indentCount);
            }
        }
        constructor(range, opts, _languageConfigurationService) {
            this._languageConfigurationService = _languageConfigurationService;
            this._opts = opts;
            this._selection = range;
            this._selectionId = null;
            this._useLastEditRangeForCursorEndPosition = false;
            this._selectionStartColumnStaysPut = false;
        }
        _addEditOperation(builder, range, text) {
            if (this._useLastEditRangeForCursorEndPosition) {
                builder.addTrackedEditOperation(range, text);
            }
            else {
                builder.addEditOperation(range, text);
            }
        }
        getEditOperations(model, builder) {
            const startLine = this._selection.startLineNumber;
            let endLine = this._selection.endLineNumber;
            if (this._selection.endColumn === 1 && startLine !== endLine) {
                endLine = endLine - 1;
            }
            const { tabSize, indentSize, insertSpaces } = this._opts;
            const shouldIndentEmptyLines = (startLine === endLine);
            if (this._opts.useTabStops) {
                // if indenting or outdenting on a whitespace only line
                if (this._selection.isEmpty()) {
                    if (/^\s*$/.test(model.getLineContent(startLine))) {
                        this._useLastEditRangeForCursorEndPosition = true;
                    }
                }
                // keep track of previous line's "miss-alignment"
                let previousLineExtraSpaces = 0, extraSpaces = 0;
                for (let lineNumber = startLine; lineNumber <= endLine; lineNumber++, previousLineExtraSpaces = extraSpaces) {
                    extraSpaces = 0;
                    const lineText = model.getLineContent(lineNumber);
                    let indentationEndIndex = strings.firstNonWhitespaceIndex(lineText);
                    if (this._opts.isUnshift && (lineText.length === 0 || indentationEndIndex === 0)) {
                        // empty line or line with no leading whitespace => nothing to do
                        continue;
                    }
                    if (!shouldIndentEmptyLines && !this._opts.isUnshift && lineText.length === 0) {
                        // do not indent empty lines => nothing to do
                        continue;
                    }
                    if (indentationEndIndex === -1) {
                        // the entire line is whitespace
                        indentationEndIndex = lineText.length;
                    }
                    if (lineNumber > 1) {
                        const contentStartVisibleColumn = cursorColumns_1.CursorColumns.visibleColumnFromColumn(lineText, indentationEndIndex + 1, tabSize);
                        if (contentStartVisibleColumn % indentSize !== 0) {
                            // The current line is "miss-aligned", so let's see if this is expected...
                            // This can only happen when it has trailing commas in the indent
                            if (model.tokenization.isCheapToTokenize(lineNumber - 1)) {
                                const enterAction = (0, enterAction_1.getEnterAction)(this._opts.autoIndent, model, new range_1.Range(lineNumber - 1, model.getLineMaxColumn(lineNumber - 1), lineNumber - 1, model.getLineMaxColumn(lineNumber - 1)), this._languageConfigurationService);
                                if (enterAction) {
                                    extraSpaces = previousLineExtraSpaces;
                                    if (enterAction.appendText) {
                                        for (let j = 0, lenJ = enterAction.appendText.length; j < lenJ && extraSpaces < indentSize; j++) {
                                            if (enterAction.appendText.charCodeAt(j) === 32 /* CharCode.Space */) {
                                                extraSpaces++;
                                            }
                                            else {
                                                break;
                                            }
                                        }
                                    }
                                    if (enterAction.removeText) {
                                        extraSpaces = Math.max(0, extraSpaces - enterAction.removeText);
                                    }
                                    // Act as if `prefixSpaces` is not part of the indentation
                                    for (let j = 0; j < extraSpaces; j++) {
                                        if (indentationEndIndex === 0 || lineText.charCodeAt(indentationEndIndex - 1) !== 32 /* CharCode.Space */) {
                                            break;
                                        }
                                        indentationEndIndex--;
                                    }
                                }
                            }
                        }
                    }
                    if (this._opts.isUnshift && indentationEndIndex === 0) {
                        // line with no leading whitespace => nothing to do
                        continue;
                    }
                    let desiredIndent;
                    if (this._opts.isUnshift) {
                        desiredIndent = ShiftCommand_1.unshiftIndent(lineText, indentationEndIndex + 1, tabSize, indentSize, insertSpaces);
                    }
                    else {
                        desiredIndent = ShiftCommand_1.shiftIndent(lineText, indentationEndIndex + 1, tabSize, indentSize, insertSpaces);
                    }
                    this._addEditOperation(builder, new range_1.Range(lineNumber, 1, lineNumber, indentationEndIndex + 1), desiredIndent);
                    if (lineNumber === startLine && !this._selection.isEmpty()) {
                        // Force the startColumn to stay put because we're inserting after it
                        this._selectionStartColumnStaysPut = (this._selection.startColumn <= indentationEndIndex + 1);
                    }
                }
            }
            else {
                // if indenting or outdenting on a whitespace only line
                if (!this._opts.isUnshift && this._selection.isEmpty() && model.getLineLength(startLine) === 0) {
                    this._useLastEditRangeForCursorEndPosition = true;
                }
                const oneIndent = (insertSpaces ? cachedStringRepeat(' ', indentSize) : '\t');
                for (let lineNumber = startLine; lineNumber <= endLine; lineNumber++) {
                    const lineText = model.getLineContent(lineNumber);
                    let indentationEndIndex = strings.firstNonWhitespaceIndex(lineText);
                    if (this._opts.isUnshift && (lineText.length === 0 || indentationEndIndex === 0)) {
                        // empty line or line with no leading whitespace => nothing to do
                        continue;
                    }
                    if (!shouldIndentEmptyLines && !this._opts.isUnshift && lineText.length === 0) {
                        // do not indent empty lines => nothing to do
                        continue;
                    }
                    if (indentationEndIndex === -1) {
                        // the entire line is whitespace
                        indentationEndIndex = lineText.length;
                    }
                    if (this._opts.isUnshift && indentationEndIndex === 0) {
                        // line with no leading whitespace => nothing to do
                        continue;
                    }
                    if (this._opts.isUnshift) {
                        indentationEndIndex = Math.min(indentationEndIndex, indentSize);
                        for (let i = 0; i < indentationEndIndex; i++) {
                            const chr = lineText.charCodeAt(i);
                            if (chr === 9 /* CharCode.Tab */) {
                                indentationEndIndex = i + 1;
                                break;
                            }
                        }
                        this._addEditOperation(builder, new range_1.Range(lineNumber, 1, lineNumber, indentationEndIndex + 1), '');
                    }
                    else {
                        this._addEditOperation(builder, new range_1.Range(lineNumber, 1, lineNumber, 1), oneIndent);
                        if (lineNumber === startLine && !this._selection.isEmpty()) {
                            // Force the startColumn to stay put because we're inserting after it
                            this._selectionStartColumnStaysPut = (this._selection.startColumn === 1);
                        }
                    }
                }
            }
            this._selectionId = builder.trackSelection(this._selection);
        }
        computeCursorState(model, helper) {
            if (this._useLastEditRangeForCursorEndPosition) {
                const lastOp = helper.getInverseEditOperations()[0];
                return new selection_1.Selection(lastOp.range.endLineNumber, lastOp.range.endColumn, lastOp.range.endLineNumber, lastOp.range.endColumn);
            }
            const result = helper.getTrackedSelection(this._selectionId);
            if (this._selectionStartColumnStaysPut) {
                // The selection start should not move
                const initialStartColumn = this._selection.startColumn;
                const resultStartColumn = result.startColumn;
                if (resultStartColumn <= initialStartColumn) {
                    return result;
                }
                if (result.getDirection() === 0 /* SelectionDirection.LTR */) {
                    return new selection_1.Selection(result.startLineNumber, initialStartColumn, result.endLineNumber, result.endColumn);
                }
                return new selection_1.Selection(result.endLineNumber, result.endColumn, result.startLineNumber, initialStartColumn);
            }
            return result;
        }
    };
    exports.ShiftCommand = ShiftCommand;
    exports.ShiftCommand = ShiftCommand = ShiftCommand_1 = __decorate([
        __param(2, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], ShiftCommand);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hpZnRDb21tYW5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2NvbW1hbmRzL3NoaWZ0Q29tbWFuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0JoRyxNQUFNLFdBQVcsR0FBZ0MsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyRSxTQUFTLGtCQUFrQixDQUFDLEdBQVcsRUFBRSxLQUFhO1FBQ3JELElBQUksS0FBSyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ2hCLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUNELElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN2QixXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUNELE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMvQixLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzVDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUMvQixDQUFDO1FBQ0QsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDckIsQ0FBQztJQUVNLElBQU0sWUFBWSxvQkFBbEIsTUFBTSxZQUFZO1FBRWpCLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBWSxFQUFFLE1BQWMsRUFBRSxPQUFlLEVBQUUsVUFBa0IsRUFBRSxZQUFxQjtZQUNuSCx3REFBd0Q7WUFDeEQsTUFBTSx5QkFBeUIsR0FB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