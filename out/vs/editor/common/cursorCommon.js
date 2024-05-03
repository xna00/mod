/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages/supports", "vs/editor/common/core/cursorColumns", "vs/editor/common/core/indentation"], function (require, exports, position_1, range_1, selection_1, supports_1, cursorColumns_1, indentation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditOperationResult = exports.SingleCursorState = exports.SelectionStartKind = exports.PartialViewCursorState = exports.PartialModelCursorState = exports.CursorState = exports.CursorConfiguration = exports.EditOperationType = void 0;
    exports.isQuote = isQuote;
    /**
     * This is an operation type that will be recorded for undo/redo purposes.
     * The goal is to introduce an undo stop when the controller switches between different operation types.
     */
    var EditOperationType;
    (function (EditOperationType) {
        EditOperationType[EditOperationType["Other"] = 0] = "Other";
        EditOperationType[EditOperationType["DeletingLeft"] = 2] = "DeletingLeft";
        EditOperationType[EditOperationType["DeletingRight"] = 3] = "DeletingRight";
        EditOperationType[EditOperationType["TypingOther"] = 4] = "TypingOther";
        EditOperationType[EditOperationType["TypingFirstSpace"] = 5] = "TypingFirstSpace";
        EditOperationType[EditOperationType["TypingConsecutiveSpace"] = 6] = "TypingConsecutiveSpace";
    })(EditOperationType || (exports.EditOperationType = EditOperationType = {}));
    const autoCloseAlways = () => true;
    const autoCloseNever = () => false;
    const autoCloseBeforeWhitespace = (chr) => (chr === ' ' || chr === '\t');
    class CursorConfiguration {
        static shouldRecreate(e) {
            return (e.hasChanged(145 /* EditorOption.layoutInfo */)
                || e.hasChanged(131 /* EditorOption.wordSeparators */)
                || e.hasChanged(37 /* EditorOption.emptySelectionClipboard */)
                || e.hasChanged(77 /* EditorOption.multiCursorMergeOverlapping */)
                || e.hasChanged(79 /* EditorOption.multiCursorPaste */)
                || e.hasChanged(80 /* EditorOption.multiCursorLimit */)
                || e.hasChanged(6 /* EditorOption.autoClosingBrackets */)
                || e.hasChanged(7 /* EditorOption.autoClosingComments */)
                || e.hasChanged(11 /* EditorOption.autoClosingQuotes */)
                || e.hasChanged(9 /* EditorOption.autoClosingDelete */)
                || e.hasChanged(10 /* EditorOption.autoClosingOvertype */)
                || e.hasChanged(14 /* EditorOption.autoSurround */)
                || e.hasChanged(128 /* EditorOption.useTabStops */)
                || e.hasChanged(50 /* EditorOption.fontInfo */)
                || e.hasChanged(91 /* EditorOption.readOnly */)
                || e.hasChanged(130 /* EditorOption.wordSegmenterLocales */));
        }
        constructor(languageId, modelOptions, configuration, languageConfigurationService) {
            this.languageConfigurationService = languageConfigurationService;
            this._cursorMoveConfigurationBrand = undefined;
            this._languageId = languageId;
            const options = configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            this.readOnly = options.get(91 /* EditorOption.readOnly */);
            this.tabSize = modelOptions.tabSize;
            this.indentSize = modelOptions.indentSize;
            this.insertSpaces = modelOptions.insertSpaces;
            this.stickyTabStops = options.get(116 /* EditorOption.stickyTabStops */);
            this.lineHeight = fontInfo.lineHeight;
            this.typicalHalfwidthCharacterWidth = fontInfo.typicalHalfwidthCharacterWidth;
            this.pageSize = Math.max(1, Math.floor(layoutInfo.height / this.lineHeight) - 2);
            this.useTabStops = options.get(128 /* EditorOption.useTabStops */);
            this.wordSeparators = options.get(131 /* EditorOption.wordSeparators */);
            this.emptySelectionClipboard = options.get(37 /* EditorOption.emptySelectionClipboard */);
            this.copyWithSyntaxHighlighting = options.get(25 /* EditorOption.copyWithSyntaxHighlighting */);
            this.multiCursorMergeOverlapping = options.get(77 /* EditorOption.multiCursorMergeOverlapping */);
            this.multiCursorPaste = options.get(79 /* EditorOption.multiCursorPaste */);
            this.multiCursorLimit = options.get(80 /* EditorOption.multiCursorLimit */);
            this.autoClosingBrackets = options.get(6 /* EditorOption.autoClosingBrackets */);
            this.autoClosingComments = options.get(7 /* EditorOption.autoClosingComments */);
            this.autoClosingQuotes = options.get(11 /* EditorOption.autoClosingQuotes */);
            this.autoClosingDelete = options.get(9 /* EditorOption.autoClosingDelete */);
            this.autoClosingOvertype = options.get(10 /* EditorOption.autoClosingOvertype */);
            this.autoSurround = options.get(14 /* EditorOption.autoSurround */);
            this.autoIndent = options.get(12 /* EditorOption.autoIndent */);
            this.wordSegmenterLocales = options.get(130 /* EditorOption.wordSegmenterLocales */);
            this.surroundingPairs = {};
            this._electricChars = null;
            this.shouldAutoCloseBefore = {
                quote: this._getShouldAutoClose(languageId, this.autoClosingQuotes, true),
                comment: this._getShouldAutoClose(languageId, this.autoClosingComments, false),
                bracket: this._getShouldAutoClose(languageId, this.autoClosingBrackets, false),
            };
            this.autoClosingPairs = this.languageConfigurationService.getLanguageConfiguration(languageId).getAutoClosingPairs();
            const surroundingPairs = this.languageConfigurationService.getLanguageConfiguration(languageId).getSurroundingPairs();
            if (surroundingPairs) {
                for (const pair of surroundingPairs) {
                    this.surroundingPairs[pair.open] = pair.close;
                }
            }
            const commentsConfiguration = this.languageConfigurationService.getLanguageConfiguration(languageId).comments;
            this.blockCommentStartToken = commentsConfiguration?.blockCommentStartToken ?? null;
        }
        get electricChars() {
            if (!this._electricChars) {
                this._electricChars = {};
                const electricChars = this.languageConfigurationService.getLanguageConfiguration(this._languageId).electricCharacter?.getElectricCharacters();
                if (electricChars) {
                    for (const char of electricChars) {
                        this._electricChars[char] = true;
                    }
                }
            }
            return this._electricChars;
        }
        /**
         * Should return opening bracket type to match indentation with
         */
        onElectricCharacter(character, context, column) {
            const scopedLineTokens = (0, supports_1.createScopedLineTokens)(context, column - 1);
            const electricCharacterSupport = this.languageConfigurationService.getLanguageConfiguration(scopedLineTokens.languageId).electricCharacter;
            if (!electricCharacterSupport) {
                return null;
            }
            return electricCharacterSupport.onElectricCharacter(character, scopedLineTokens, column - scopedLineTokens.firstCharOffset);
        }
        normalizeIndentation(str) {
            return (0, indentation_1.normalizeIndentation)(str, this.indentSize, this.insertSpaces);
        }
        _getShouldAutoClose(languageId, autoCloseConfig, forQuotes) {
            switch (autoCloseConfig) {
                case 'beforeWhitespace':
                    return autoCloseBeforeWhitespace;
                case 'languageDefined':
                    return this._getLanguageDefinedShouldAutoClose(languageId, forQuotes);
                case 'always':
                    return autoCloseAlways;
                case 'never':
                    return autoCloseNever;
            }
        }
        _getLanguageDefinedShouldAutoClose(languageId, forQuotes) {
            const autoCloseBeforeSet = this.languageConfigurationService.getLanguageConfiguration(languageId).getAutoCloseBeforeSet(forQuotes);
            return c => autoCloseBeforeSet.indexOf(c) !== -1;
        }
        /**
         * Returns a visible column from a column.
         * @see {@link CursorColumns}
         */
        visibleColumnFromColumn(model, position) {
            return cursorColumns_1.CursorColumns.visibleColumnFromColumn(model.getLineContent(position.lineNumber), position.column, this.tabSize);
        }
        /**
         * Returns a visible column from a column.
         * @see {@link CursorColumns}
         */
        columnFromVisibleColumn(model, lineNumber, visibleColumn) {
            const result = cursorColumns_1.CursorColumns.columnFromVisibleColumn(model.getLineContent(lineNumber), visibleColumn, this.tabSize);
            const minColumn = model.getLineMinColumn(lineNumber);
            if (result < minColumn) {
                return minColumn;
            }
            const maxColumn = model.getLineMaxColumn(lineNumber);
            if (result > maxColumn) {
                return maxColumn;
            }
            return result;
        }
    }
    exports.CursorConfiguration = CursorConfiguration;
    class CursorState {
        static fromModelState(modelState) {
            return new PartialModelCursorState(modelState);
        }
        static fromViewState(viewState) {
            return new PartialViewCursorState(viewState);
        }
        static fromModelSelection(modelSelection) {
            const selection = selection_1.Selection.liftSelection(modelSelection);
            const modelState = new SingleCursorState(range_1.Range.fromPositions(selection.getSelectionStart()), 0 /* SelectionStartKind.Simple */, 0, selection.getPosition(), 0);
            return CursorState.fromModelState(modelState);
        }
        static fromModelSelections(modelSelections) {
            const states = [];
            for (let i = 0, len = modelSelections.length; i < len; i++) {
                states[i] = this.fromModelSelection(modelSelections[i]);
            }
            return states;
        }
        constructor(modelState, viewState) {
            this._cursorStateBrand = undefined;
            this.modelState = modelState;
            this.viewState = viewState;
        }
        equals(other) {
            return (this.viewState.equals(other.viewState) && this.modelState.equals(other.modelState));
        }
    }
    exports.CursorState = CursorState;
    class PartialModelCursorState {
        constructor(modelState) {
            this.modelState = modelState;
            this.viewState = null;
        }
    }
    exports.PartialModelCursorState = PartialModelCursorState;
    class PartialViewCursorState {
        constructor(viewState) {
            this.modelState = null;
            this.viewState = viewState;
        }
    }
    exports.PartialViewCursorState = PartialViewCursorState;
    var SelectionStartKind;
    (function (SelectionStartKind) {
        SelectionStartKind[SelectionStartKind["Simple"] = 0] = "Simple";
        SelectionStartKind[SelectionStartKind["Word"] = 1] = "Word";
        SelectionStartKind[SelectionStartKind["Line"] = 2] = "Line";
    })(SelectionStartKind || (exports.SelectionStartKind = SelectionStartKind = {}));
    /**
     * Represents the cursor state on either the model or on the view model.
     */
    class SingleCursorState {
        constructor(selectionStart, selectionStartKind, selectionStartLeftoverVisibleColumns, position, leftoverVisibleColumns) {
            this.selectionStart = selectionStart;
            this.selectionStartKind = selectionStartKind;
            this.selectionStartLeftoverVisibleColumns = selectionStartLeftoverVisibleColumns;
            this.position = position;
            this.leftoverVisibleColumns = leftoverVisibleColumns;
            this._singleCursorStateBrand = undefined;
            this.selection = SingleCursorState._computeSelection(this.selectionStart, this.position);
        }
        equals(other) {
            return (this.selectionStartLeftoverVisibleColumns === other.selectionStartLeftoverVisibleColumns
                && this.leftoverVisibleColumns === other.leftoverVisibleColumns
                && this.selectionStartKind === other.selectionStartKind
                && this.position.equals(other.position)
                && this.selectionStart.equalsRange(other.selectionStart));
        }
        hasSelection() {
            return (!this.selection.isEmpty() || !this.selectionStart.isEmpty());
        }
        move(inSelectionMode, lineNumber, column, leftoverVisibleColumns) {
            if (inSelectionMode) {
                // move just position
                return new SingleCursorState(this.selectionStart, this.selectionStartKind, this.selectionStartLeftoverVisibleColumns, new position_1.Position(lineNumber, column), leftoverVisibleColumns);
            }
            else {
                // move everything
                return new SingleCursorState(new range_1.Range(lineNumber, column, lineNumber, column), 0 /* SelectionStartKind.Simple */, leftoverVisibleColumns, new position_1.Position(lineNumber, column), leftoverVisibleColumns);
            }
        }
        static _computeSelection(selectionStart, position) {
            if (selectionStart.isEmpty() || !position.isBeforeOrEqual(selectionStart.getStartPosition())) {
                return selection_1.Selection.fromPositions(selectionStart.getStartPosition(), position);
            }
            else {
                return selection_1.Selection.fromPositions(selectionStart.getEndPosition(), position);
            }
        }
    }
    exports.SingleCursorState = SingleCursorState;
    class EditOperationResult {
        constructor(type, commands, opts) {
            this._editOperationResultBrand = undefined;
            this.type = type;
            this.commands = commands;
            this.shouldPushStackElementBefore = opts.shouldPushStackElementBefore;
            this.shouldPushStackElementAfter = opts.shouldPushStackElementAfter;
        }
    }
    exports.EditOperationResult = EditOperationResult;
    function isQuote(ch) {
        return (ch === '\'' || ch === '"' || ch === '`');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yQ29tbW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2N1cnNvckNvbW1vbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEwWmhHLDBCQUVDO0lBbllEOzs7T0FHRztJQUNILElBQWtCLGlCQU9qQjtJQVBELFdBQWtCLGlCQUFpQjtRQUNsQywyREFBUyxDQUFBO1FBQ1QseUVBQWdCLENBQUE7UUFDaEIsMkVBQWlCLENBQUE7UUFDakIsdUVBQWUsQ0FBQTtRQUNmLGlGQUFvQixDQUFBO1FBQ3BCLDZGQUEwQixDQUFBO0lBQzNCLENBQUMsRUFQaUIsaUJBQWlCLGlDQUFqQixpQkFBaUIsUUFPbEM7SUFNRCxNQUFNLGVBQWUsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7SUFDbkMsTUFBTSxjQUFjLEdBQUcsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDO0lBQ25DLE1BQU0seUJBQXlCLEdBQUcsQ0FBQyxHQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxHQUFHLEtBQUssSUFBSSxDQUFDLENBQUM7SUFFakYsTUFBYSxtQkFBbUI7UUFrQ3hCLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBNEI7WUFDeEQsT0FBTyxDQUNOLENBQUMsQ0FBQyxVQUFVLG1DQUF5QjttQkFDbEMsQ0FBQyxDQUFDLFVBQVUsdUNBQTZCO21CQUN6QyxDQUFDLENBQUMsVUFBVSwrQ0FBc0M7bUJBQ2xELENBQUMsQ0FBQyxVQUFVLG1EQUEwQzttQkFDdEQsQ0FBQyxDQUFDLFVBQVUsd0NBQStCO21CQUMzQyxDQUFDLENBQUMsVUFBVSx3Q0FBK0I7bUJBQzNDLENBQUMsQ0FBQyxVQUFVLDBDQUFrQzttQkFDOUMsQ0FBQyxDQUFDLFVBQVUsMENBQWtDO21CQUM5QyxDQUFD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