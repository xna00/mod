/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/cursorColumns", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/cursor/cursorAtomicMoveOperations", "vs/editor/common/cursorCommon"], function (require, exports, strings, cursorColumns_1, position_1, range_1, cursorAtomicMoveOperations_1, cursorCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MoveOperations = exports.CursorPosition = void 0;
    class CursorPosition {
        constructor(lineNumber, column, leftoverVisibleColumns) {
            this._cursorPositionBrand = undefined;
            this.lineNumber = lineNumber;
            this.column = column;
            this.leftoverVisibleColumns = leftoverVisibleColumns;
        }
    }
    exports.CursorPosition = CursorPosition;
    class MoveOperations {
        static leftPosition(model, position) {
            if (position.column > model.getLineMinColumn(position.lineNumber)) {
                return position.delta(undefined, -strings.prevCharLength(model.getLineContent(position.lineNumber), position.column - 1));
            }
            else if (position.lineNumber > 1) {
                const newLineNumber = position.lineNumber - 1;
                return new position_1.Position(newLineNumber, model.getLineMaxColumn(newLineNumber));
            }
            else {
                return position;
            }
        }
        static leftPositionAtomicSoftTabs(model, position, tabSize) {
            if (position.column <= model.getLineIndentColumn(position.lineNumber)) {
                const minColumn = model.getLineMinColumn(position.lineNumber);
                const lineContent = model.getLineContent(position.lineNumber);
                const newPosition = cursorAtomicMoveOperations_1.AtomicTabMoveOperations.atomicPosition(lineContent, position.column - 1, tabSize, 0 /* Direction.Left */);
                if (newPosition !== -1 && newPosition + 1 >= minColumn) {
                    return new position_1.Position(position.lineNumber, newPosition + 1);
                }
            }
            return this.leftPosition(model, position);
        }
        static left(config, model, position) {
            const pos = config.stickyTabStops
                ? MoveOperations.leftPositionAtomicSoftTabs(model, position, config.tabSize)
                : MoveOperations.leftPosition(model, position);
            return new CursorPosition(pos.lineNumber, pos.column, 0);
        }
        /**
         * @param noOfColumns Must be either `1`
         * or `Math.round(viewModel.getLineContent(viewLineNumber).length / 2)` (for half lines).
        */
        static moveLeft(config, model, cursor, inSelectionMode, noOfColumns) {
            let lineNumber, column;
            if (cursor.hasSelection() && !inSelectionMode) {
                // If the user has a selection and does not want to extend it,
                // put the cursor at the beginning of the selection.
                lineNumber = cursor.selection.startLineNumber;
                column = cursor.selection.startColumn;
            }
            else {
                // This has no effect if noOfColumns === 1.
                // It is ok to do so in the half-line scenario.
                const pos = cursor.position.delta(undefined, -(noOfColumns - 1));
                // We clip the position before normalization, as normalization is not defined
                // for possibly negative columns.
                const normalizedPos = model.normalizePosition(MoveOperations.clipPositionColumn(pos, model), 0 /* PositionAffinity.Left */);
                const p = MoveOperations.left(config, model, normalizedPos);
                lineNumber = p.lineNumber;
                column = p.column;
            }
            return cursor.move(inSelectionMode, lineNumber, column, 0);
        }
        /**
         * Adjusts the column so that it is within min/max of the line.
        */
        static clipPositionColumn(position, model) {
            return new position_1.Position(position.lineNumber, MoveOperations.clipRange(position.column, model.getLineMinColumn(position.lineNumber), model.getLineMaxColumn(position.lineNumber)));
        }
        static clipRange(value, min, max) {
            if (value < min) {
                return min;
            }
            if (value > max) {
                return max;
            }
            return value;
        }
        static rightPosition(model, lineNumber, column) {
            if (column < model.getLineMaxColumn(lineNumber)) {
                column = column + strings.nextCharLength(model.getLineContent(lineNumber), column - 1);
            }
            else if (lineNumber < model.getLineCount()) {
                lineNumber = lineNumber + 1;
                column = model.getLineMinColumn(lineNumber);
            }
            return new position_1.Position(lineNumber, column);
        }
        static rightPositionAtomicSoftTabs(model, lineNumber, column, tabSize, indentSize) {
            if (column < model.getLineIndentColumn(lineNumber)) {
                const lineContent = model.getLineContent(lineNumber);
                const newPosition = cursorAtomicMoveOperations_1.AtomicTabMoveOperations.atomicPosition(lineContent, column - 1, tabSize, 1 /* Direction.Right */);
                if (newPosition !== -1) {
                    return new position_1.Position(lineNumber, newPosition + 1);
                }
            }
            return this.rightPosition(model, lineNumber, column);
        }
        static right(config, model, position) {
            const pos = config.stickyTabStops
                ? MoveOperations.rightPositionAtomicSoftTabs(model, position.lineNumber, position.column, config.tabSize, config.indentSize)
                : MoveOperations.rightPosition(model, position.lineNumber, position.column);
            return new CursorPosition(pos.lineNumber, pos.column, 0);
        }
        static moveRight(config, model, cursor, inSelectionMode, noOfColumns) {
            let lineNumber, column;
            if (cursor.hasSelection() && !inSelectionMode) {
                // If we are in selection mode, move right without selection cancels selection and puts cursor at the end of the selection
                lineNumber = cursor.selection.endLineNumber;
                column = cursor.selection.endColumn;
            }
            else {
                const pos = cursor.position.delta(undefined, noOfColumns - 1);
                const normalizedPos = model.normalizePosition(MoveOperations.clipPositionColumn(pos, model), 1 /* PositionAffinity.Right */);
                const r = MoveOperations.right(config, model, normalizedPos);
                lineNumber = r.lineNumber;
                column = r.column;
            }
            return cursor.move(inSelectionMode, lineNumber, column, 0);
        }
        static vertical(config, model, lineNumber, column, leftoverVisibleColumns, newLineNumber, allowMoveOnEdgeLine, normalizationAffinity) {
            const currentVisibleColumn = cursorColumns_1.CursorColumns.visibleColumnFromColumn(model.getLineContent(lineNumber), column, config.tabSize) + leftoverVisibleColumns;
            const lineCount = model.getLineCount();
            const wasOnFirstPosition = (lineNumber === 1 && column === 1);
            const wasOnLastPosition = (lineNumber === lineCount && column === model.getLineMaxColumn(lineNumber));
            const wasAtEdgePosition = (newLineNumber < lineNumber ? wasOnFirstPosition : wasOnLastPosition);
            lineNumber = newLineNumber;
            if (lineNumber < 1) {
                lineNumber = 1;
                if (allowMoveOnEdgeLine) {
                    column = model.getLineMinColumn(lineNumber);
                }
                else {
                    column = Math.min(model.getLineMaxColumn(lineNumber), column);
                }
            }
            else if (lineNumber > lineCount) {
                lineNumber = lineCount;
                if (allowMoveOnEdgeLine) {
                    column = model.getLineMaxColumn(lineNumber);
                }
                else {
                    column = Math.min(model.getLineMaxColumn(lineNumber), column);
                }
            }
            else {
                column = config.columnFromVisibleColumn(model, lineNumber, currentVisibleColumn);
            }
            if (wasAtEdgePosition) {
                leftoverVisibleColumns = 0;
            }
            else {
                leftoverVisibleColumns = currentVisibleColumn - cursorColumns_1.CursorColumns.visibleColumnFromColumn(model.getLineContent(lineNumber), column, config.tabSize);
            }
            if (normalizationAffinity !== undefined) {
                const position = new position_1.Position(lineNumber, column);
                const newPosition = model.normalizePosition(position, normalizationAffinity);
                leftoverVisibleColumns = leftoverVisibleColumns + (column - newPosition.column);
                lineNumber = newPosition.lineNumber;
                column = newPosition.column;
            }
            return new CursorPosition(lineNumber, column, leftoverVisibleColumns);
        }
        static down(config, model, lineNumber, column, leftoverVisibleColumns, count, allowMoveOnLastLine) {
            return this.vertical(config, model, lineNumber, column, leftoverVisibleColumns, lineNumber + count, allowMoveOnLastLine, 4 /* PositionAffinity.RightOfInjectedText */);
        }
        static moveDown(config, model, cursor, inSelectionMode, linesCount) {
            let lineNumber, column;
            if (cursor.hasSelection() && !inSelectionMode) {
                // If we are in selection mode, move down acts relative to the end of selection
                lineNumber = cursor.selection.endLineNumber;
                column = cursor.selection.endColumn;
            }
            else {
                lineNumber = cursor.position.lineNumber;
                column = cursor.position.column;
            }
            let i = 0;
            let r;
            do {
                r = MoveOperations.down(config, model, lineNumber + i, column, cursor.leftoverVisibleColumns, linesCount, true);
                const np = model.normalizePosition(new position_1.Position(r.lineNumber, r.column), 2 /* PositionAffinity.None */);
                if (np.lineNumber > lineNumber) {
                    break;
                }
            } while (i++ < 10 && lineNumber + i < model.getLineCount());
            return cursor.move(inSelectionMode, r.lineNumber, r.column, r.leftoverVisibleColumns);
        }
        static translateDown(config, model, cursor) {
            const selection = cursor.selection;
            const selectionStart = MoveOperations.down(config, model, selection.selectionStartLineNumber, selection.selectionStartColumn, cursor.selectionStartLeftoverVisibleColumns, 1, false);
            const position = MoveOperations.down(config, model, selection.positionLineNumber, selection.positionColumn, cursor.leftoverVisibleColumns, 1, false);
            return new cursorCommon_1.SingleCursorState(new range_1.Range(selectionStart.lineNumber, selectionStart.column, selectionStart.lineNumber, selectionStart.column), 0 /* SelectionStartKind.Simple */, selectionStart.leftoverVisibleColumns, new position_1.Position(position.lineNumber, position.column), position.leftoverVisibleColumns);
        }
        static up(config, model, lineNumber, column, leftoverVisibleColumns, count, allowMoveOnFirstLine) {
            return this.vertical(config, model, lineNumber, column, leftoverVisibleColumns, lineNumber - count, allowMoveOnFirstLine, 3 /* PositionAffinity.LeftOfInjectedText */);
        }
        static moveUp(config, model, cursor, inSelectionMode, linesCount) {
            let lineNumber, column;
            if (cursor.hasSelection() && !inSelectionMode) {
                // If we are in selection mode, move up acts relative to the beginning of selection
                lineNumber = cursor.selection.startLineNumber;
                column = cursor.selection.startColumn;
            }
            else {
                lineNumber = cursor.position.lineNumber;
                column = cursor.position.column;
            }
            const r = MoveOperations.up(config, model, lineNumber, column, cursor.leftoverVisibleColumns, linesCount, true);
            return cursor.move(inSelectionMode, r.lineNumber, r.column, r.leftoverVisibleColumns);
        }
        static translateUp(config, model, cursor) {
            const selection = cursor.selection;
            const selectionStart = MoveOperations.up(config, model, selection.selectionStartLineNumber, selection.selectionStartColumn, cursor.selectionStartLeftoverVisibleColumns, 1, false);
            const position = MoveOperations.up(config, model, selection.positionLineNumber, selection.positionColumn, cursor.leftoverVisibleColumns, 1, false);
            return new cursorCommon_1.SingleCursorState(new range_1.Range(selectionStart.lineNumber, selectionStart.column, selectionStart.lineNumber, selectionStart.column), 0 /* SelectionStartKind.Simple */, selectionStart.leftoverVisibleColumns, new position_1.Position(position.lineNumber, position.column), position.leftoverVisibleColumns);
        }
        static _isBlankLine(model, lineNumber) {
            if (model.getLineFirstNonWhitespaceColumn(lineNumber) === 0) {
                // empty or contains only whitespace
                return true;
            }
            return false;
        }
        static moveToPrevBlankLine(config, model, cursor, inSelectionMode) {
            let lineNumber = cursor.position.lineNumber;
            // If our current line is blank, move to the previous non-blank line
            while (lineNumber > 1 && this._isBlankLine(model, lineNumber)) {
                lineNumber--;
            }
            // Find the previous blank line
            while (lineNumber > 1 && !this._isBlankLine(model, lineNumber)) {
                lineNumber--;
            }
            return cursor.move(inSelectionMode, lineNumber, model.getLineMinColumn(lineNumber), 0);
        }
        static moveToNextBlankLine(config, model, cursor, inSelectionMode) {
            const lineCount = model.getLineCount();
            let lineNumber = cursor.position.lineNumber;
            // If our current line is blank, move to the next non-blank line
            while (lineNumber < lineCount && this._isBlankLine(model, lineNumber)) {
                lineNumber++;
            }
            // Find the next blank line
            while (lineNumber < lineCount && !this._isBlankLine(model, lineNumber)) {
                lineNumber++;
            }
            return cursor.move(inSelectionMode, lineNumber, model.getLineMinColumn(lineNumber), 0);
        }
        static moveToBeginningOfLine(config, model, cursor, inSelectionMode) {
            const lineNumber = cursor.position.lineNumber;
            const minColumn = model.getLineMinColumn(lineNumber);
            const firstNonBlankColumn = model.getLineFirstNonWhitespaceColumn(lineNumber) || minColumn;
            let column;
            const relevantColumnNumber = cursor.position.column;
            if (relevantColumnNumber === firstNonBlankColumn) {
                column = minColumn;
            }
            else {
                column = firstNonBlankColumn;
            }
            return cursor.move(inSelectionMode, lineNumber, column, 0);
        }
        static moveToEndOfLine(config, model, cursor, inSelectionMode, sticky) {
            const lineNumber = cursor.position.lineNumber;
            const maxColumn = model.getLineMaxColumn(lineNumber);
            return cursor.move(inSelectionMode, lineNumber, maxColumn, sticky ? 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */ - maxColumn : 0);
        }
        static moveToBeginningOfBuffer(config, model, cursor, inSelectionMode) {
            return cursor.move(inSelectionMode, 1, 1, 0);
        }
        static moveToEndOfBuffer(config, model, cursor, inSelectionMode) {
            const lastLineNumber = model.getLineCount();
            const lastColumn = model.getLineMaxColumn(lastLineNumber);
            return cursor.move(inSelectionMode, lastLineNumber, lastColumn, 0);
        }
    }
    exports.MoveOperations = MoveOperations;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yTW92ZU9wZXJhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vY3Vyc29yL2N1cnNvck1vdmVPcGVyYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRyxNQUFhLGNBQWM7UUFPMUIsWUFBWSxVQUFrQixFQUFFLE1BQWMsRUFBRSxzQkFBOEI7WUFOOUUseUJBQW9CLEdBQVMsU0FBUyxDQUFDO1lBT3RDLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBQzdCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxzQkFBc0IsQ0FBQztRQUN0RCxDQUFDO0tBQ0Q7SUFaRCx3Q0FZQztJQUVELE1BQWEsY0FBYztRQUNuQixNQUFNLENBQUMsWUFBWSxDQUFDLEtBQXlCLEVBQUUsUUFBa0I7WUFDdkUsSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDbkUsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNILENBQUM7aUJBQU0sSUFBSSxRQUFRLENBQUMsVUFBVSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNwQyxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztnQkFDOUMsT0FBTyxJQUFJLG1CQUFRLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0Is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