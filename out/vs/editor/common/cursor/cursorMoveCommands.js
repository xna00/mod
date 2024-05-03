/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/editor/common/cursorCommon", "vs/editor/common/cursor/cursorMoveOperations", "vs/editor/common/cursor/cursorWordOperations", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, types, cursorCommon_1, cursorMoveOperations_1, cursorWordOperations_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CursorMove = exports.CursorMoveCommands = void 0;
    class CursorMoveCommands {
        static addCursorDown(viewModel, cursors, useLogicalLine) {
            const result = [];
            let resultLen = 0;
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[resultLen++] = new cursorCommon_1.CursorState(cursor.modelState, cursor.viewState);
                if (useLogicalLine) {
                    result[resultLen++] = cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.translateDown(viewModel.cursorConfig, viewModel.model, cursor.modelState));
                }
                else {
                    result[resultLen++] = cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.translateDown(viewModel.cursorConfig, viewModel, cursor.viewState));
                }
            }
            return result;
        }
        static addCursorUp(viewModel, cursors, useLogicalLine) {
            const result = [];
            let resultLen = 0;
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[resultLen++] = new cursorCommon_1.CursorState(cursor.modelState, cursor.viewState);
                if (useLogicalLine) {
                    result[resultLen++] = cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.translateUp(viewModel.cursorConfig, viewModel.model, cursor.modelState));
                }
                else {
                    result[resultLen++] = cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.translateUp(viewModel.cursorConfig, viewModel, cursor.viewState));
                }
            }
            return result;
        }
        static moveToBeginningOfLine(viewModel, cursors, inSelectionMode) {
            const result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[i] = this._moveToLineStart(viewModel, cursor, inSelectionMode);
            }
            return result;
        }
        static _moveToLineStart(viewModel, cursor, inSelectionMode) {
            const currentViewStateColumn = cursor.viewState.position.column;
            const currentModelStateColumn = cursor.modelState.position.column;
            const isFirstLineOfWrappedLine = currentViewStateColumn === currentModelStateColumn;
            const currentViewStatelineNumber = cursor.viewState.position.lineNumber;
            const firstNonBlankColumn = viewModel.getLineFirstNonWhitespaceColumn(currentViewStatelineNumber);
            const isBeginningOfViewLine = currentViewStateColumn === firstNonBlankColumn;
            if (!isFirstLineOfWrappedLine && !isBeginningOfViewLine) {
                return this._moveToLineStartByView(viewModel, cursor, inSelectionMode);
            }
            else {
                return this._moveToLineStartByModel(viewModel, cursor, inSelectionMode);
            }
        }
        static _moveToLineStartByView(viewModel, cursor, inSelectionMode) {
            return cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.moveToBeginningOfLine(viewModel.cursorConfig, viewModel, cursor.viewState, inSelectionMode));
        }
        static _moveToLineStartByModel(viewModel, cursor, inSelectionMode) {
            return cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.moveToBeginningOfLine(viewModel.cursorConfig, viewModel.model, cursor.modelState, inSelectionMode));
        }
        static moveToEndOfLine(viewModel, cursors, inSelectionMode, sticky) {
            const result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[i] = this._moveToLineEnd(viewModel, cursor, inSelectionMode, sticky);
            }
            return result;
        }
        static _moveToLineEnd(viewModel, cursor, inSelectionMode, sticky) {
            const viewStatePosition = cursor.viewState.position;
            const viewModelMaxColumn = viewModel.getLineMaxColumn(viewStatePosition.lineNumber);
            const isEndOfViewLine = viewStatePosition.column === viewModelMaxColumn;
            const modelStatePosition = cursor.modelState.position;
            const modelMaxColumn = viewModel.model.getLineMaxColumn(modelStatePosition.lineNumber);
            const isEndLineOfWrappedLine = viewModelMaxColumn - viewStatePosition.column === modelMaxColumn - modelStatePosition.column;
            if (isEndOfViewLine || isEndLineOfWrappedLine) {
                return this._moveToLineEndByModel(viewModel, cursor, inSelectionMode, sticky);
            }
            else {
                return this._moveToLineEndByView(viewModel, cursor, inSelectionMode, sticky);
            }
        }
        static _moveToLineEndByView(viewModel, cursor, inSelectionMode, sticky) {
            return cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.moveToEndOfLine(viewModel.cursorConfig, viewModel, cursor.viewState, inSelectionMode, sticky));
        }
        static _moveToLineEndByModel(viewModel, cursor, inSelectionMode, sticky) {
            return cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.moveToEndOfLine(viewModel.cursorConfig, viewModel.model, cursor.modelState, inSelectionMode, sticky));
        }
        static expandLineSelection(viewModel, cursors) {
            const result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                const startLineNumber = cursor.modelState.selection.startLineNumber;
                const lineCount = viewModel.model.getLineCount();
                let endLineNumber = cursor.modelState.selection.endLineNumber;
                let endColumn;
                if (endLineNumber === lineCount) {
                    endColumn = viewModel.model.getLineMaxColumn(lineCount);
                }
                else {
                    endLineNumber++;
                    endColumn = 1;
                }
                result[i] = cursorCommon_1.CursorState.fromModelState(new cursorCommon_1.SingleCursorState(new range_1.Range(startLineNumber, 1, startLineNumber, 1), 0 /* SelectionStartKind.Simple */, 0, new position_1.Position(endLineNumber, endColumn), 0));
            }
            return result;
        }
        static moveToBeginningOfBuffer(viewModel, cursors, inSelectionMode) {
            const result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[i] = cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.moveToBeginningOfBuffer(viewModel.cursorConfig, viewModel.model, cursor.modelState, inSelectionMode));
            }
            return result;
        }
        static moveToEndOfBuffer(viewModel, cursors, inSelectionMode) {
            const result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[i] = cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.moveToEndOfBuffer(viewModel.cursorConfig, viewModel.model, cursor.modelState, inSelectionMode));
            }
            return result;
        }
        static selectAll(viewModel, cursor) {
            const lineCount = viewModel.model.getLineCount();
            const maxColumn = viewModel.model.getLineMaxColumn(lineCount);
            return cursorCommon_1.CursorState.fromModelState(new cursorCommon_1.SingleCursorState(new range_1.Range(1, 1, 1, 1), 0 /* SelectionStartKind.Simple */, 0, new position_1.Position(lineCount, maxColumn), 0));
        }
        static line(viewModel, cursor, inSelectionMode, _position, _viewPosition) {
            const position = viewModel.model.validatePosition(_position);
            const viewPosition = (_viewPosition
                ? viewModel.coordinatesConverter.validateViewPosition(new position_1.Position(_viewPosition.lineNumber, _viewPosition.column), position)
                : viewModel.coordinatesConverter.convertModelPositionToViewPosition(position));
            if (!inSelectionMode) {
                // Entering line selection for the first time
                const lineCount = viewModel.model.getLineCount();
                let selectToLineNumber = position.lineNumber + 1;
                let selectToColumn = 1;
                if (selectToLineNumber > lineCount) {
                    selectToLineNumber = lineCount;
                    selectToColumn = viewModel.model.getLineMaxColumn(selectToLineNumber);
                }
                return cursorCommon_1.CursorState.fromModelState(new cursorCommon_1.SingleCursorState(new range_1.Range(position.lineNumber, 1, selectToLineNumber, selectToColumn), 2 /* SelectionStartKind.Line */, 0, new position_1.Position(selectToLineNumber, selectToColumn), 0));
            }
            // Continuing line selection
            const enteringLineNumber = cursor.modelState.selectionStart.getStartPosition().lineNumber;
            if (position.lineNumber < enteringLineNumber) {
                return cursorCommon_1.CursorState.fromViewState(cursor.viewState.move(true, viewPosition.lineNumber, 1, 0));
            }
            else if (position.lineNumber > enteringLineNumber) {
                const lineCount = viewModel.getLineCount();
                let selectToViewLineNumber = viewPosition.lineNumber + 1;
                let selectToViewColumn = 1;
                if (selectToViewLineNumber > lineCount) {
                    selectToViewLineNumber = lineCount;
                    selectToViewColumn = viewModel.getLineMaxColumn(selectToViewLineNumber);
                }
                return cursorCommon_1.CursorState.fromViewState(cursor.viewState.move(true, selectToViewLineNumber, selectToViewColumn, 0));
            }
            else {
                const endPositionOfSelectionStart = cursor.modelState.selectionStart.getEndPosition();
                return cursorCommon_1.CursorState.fromModelState(cursor.modelState.move(true, endPositionOfSelectionStart.lineNumber, endPositionOfSelectionStart.column, 0));
            }
        }
        static word(viewModel, cursor, inSelectionMode, _position) {
            const position = viewModel.model.validatePosition(_position);
            return cursorCommon_1.CursorState.fromModelState(cursorWordOperations_1.WordOperations.word(viewModel.cursorConfig, viewModel.model, cursor.modelState, inSelectionMode, position));
        }
        static cancelSelection(viewModel, cursor) {
            if (!cursor.modelState.hasSelection()) {
                return new cursorCommon_1.CursorState(cursor.modelState, cursor.viewState);
            }
            const lineNumber = cursor.viewState.position.lineNumber;
            const column = cursor.viewState.position.column;
            return cursorCommon_1.CursorState.fromViewState(new cursorCommon_1.SingleCursorState(new range_1.Range(lineNumber, column, lineNumber, column), 0 /* SelectionStartKind.Simple */, 0, new position_1.Position(lineNumber, column), 0));
        }
        static moveTo(viewModel, cursor, inSelectionMode, _position, _viewPosition) {
            if (inSelectionMode) {
                if (cursor.modelState.selectionStartKind === 1 /* SelectionStartKind.Word */) {
                    return this.word(viewModel, cursor, inSelectionMode, _position);
                }
                if (cursor.modelState.selectionStartKind === 2 /* SelectionStartKind.Line */) {
                    return this.line(viewModel, cursor, inSelectionMode, _position, _viewPosition);
                }
            }
            const position = viewModel.model.validatePosition(_position);
            const viewPosition = (_viewPosition
                ? viewModel.coordinatesConverter.validateViewPosition(new position_1.Position(_viewPosition.lineNumber, _viewPosition.column), position)
                : viewModel.coordinatesConverter.convertModelPositionToViewPosition(position));
            return cursorCommon_1.CursorState.fromViewState(cursor.viewState.move(inSelectionMode, viewPosition.lineNumber, viewPosition.column, 0));
        }
        static simpleMove(viewModel, cursors, direction, inSelectionMode, value, unit) {
            switch (direction) {
                case 0 /* CursorMove.Direction.Left */: {
                    if (unit === 4 /* CursorMove.Unit.HalfLine */) {
                        // Move left by half the current line length
                        return this._moveHalfLineLeft(viewModel, cursors, inSelectionMode);
                    }
                    else {
                        // Move left by `moveParams.value` columns
                        return this._moveLeft(viewModel, cursors, inSelectionMode, value);
                    }
                }
                case 1 /* CursorMove.Direction.Right */: {
                    if (unit === 4 /* CursorMove.Unit.HalfLine */) {
                        // Move right by half the current line length
                        return this._moveHalfLineRight(viewModel, cursors, inSelectionMode);
                    }
                    else {
                        // Move right by `moveParams.value` columns
                        return this._moveRight(viewModel, cursors, inSelectionMode, value);
                    }
                }
                case 2 /* CursorMove.Direction.Up */: {
                    if (unit === 2 /* CursorMove.Unit.WrappedLine */) {
                        // Move up by view lines
                        return this._moveUpByViewLines(viewModel, cursors, inSelectionMode, value);
                    }
                    else {
                        // Move up by model lines
                        return this._moveUpByModelLines(viewModel, cursors, inSelectionMode, value);
                    }
                }
                case 3 /* CursorMove.Direction.Down */: {
                    if (unit === 2 /* CursorMove.Unit.WrappedLine */) {
                        // Move down by view lines
                        return this._moveDownByViewLines(viewModel, cursors, inSelectionMode, value);
                    }
                    else {
                        // Move down by model lines
                        return this._moveDownByModelLines(viewModel, cursors, inSelectionMode, value);
                    }
                }
                case 4 /* CursorMove.Direction.PrevBlankLine */: {
                    if (unit === 2 /* CursorMove.Unit.WrappedLine */) {
                        return cursors.map(cursor => cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.moveToPrevBlankLine(viewModel.cursorConfig, viewModel, cursor.viewState, inSelectionMode)));
                    }
                    else {
                        return cursors.map(cursor => cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.moveToPrevBlankLine(viewModel.cursorConfig, viewModel.model, cursor.modelState, inSelectionMode)));
                    }
                }
                case 5 /* CursorMove.Direction.NextBlankLine */: {
                    if (unit === 2 /* CursorMove.Unit.WrappedLine */) {
                        return cursors.map(cursor => cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.moveToNextBlankLine(viewModel.cursorConfig, viewModel, cursor.viewState, inSelectionMode)));
                    }
                    else {
                        return cursors.map(cursor => cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.moveToNextBlankLine(viewModel.cursorConfig, viewModel.model, cursor.modelState, inSelectionMode)));
                    }
                }
                case 6 /* CursorMove.Direction.WrappedLineStart */: {
                    // Move to the beginning of the current view line
                    return this._moveToViewMinColumn(viewModel, cursors, inSelectionMode);
                }
                case 7 /* CursorMove.Direction.WrappedLineFirstNonWhitespaceCharacter */: {
                    // Move to the first non-whitespace column of the current view line
                    return this._moveToViewFirstNonWhitespaceColumn(viewModel, cursors, inSelectionMode);
                }
                case 8 /* CursorMove.Direction.WrappedLineColumnCenter */: {
                    // Move to the "center" of the current view line
                    return this._moveToViewCenterColumn(viewModel, cursors, inSelectionMode);
                }
                case 9 /* CursorMove.Direction.WrappedLineEnd */: {
                    // Move to the end of the current view line
                    return this._moveToViewMaxColumn(viewModel, cursors, inSelectionMode);
                }
                case 10 /* CursorMove.Direction.WrappedLineLastNonWhitespaceCharacter */: {
                    // Move to the last non-whitespace column of the current view line
                    return this._moveToViewLastNonWhitespaceColumn(viewModel, cursors, inSelectionMode);
                }
                default:
                    return null;
            }
        }
        static viewportMove(viewModel, cursors, direction, inSelectionMode, value) {
            const visibleViewRange = viewModel.getCompletelyVisibleViewRange();
            const visibleModelRange = viewModel.coordinatesConverter.convertViewRangeToModelRange(visibleViewRange);
            switch (direction) {
                case 11 /* CursorMove.Direction.ViewPortTop */: {
                    // Move to the nth line start in the viewport (from the top)
                    const modelLineNumber = this._firstLineNumberInRange(viewModel.model, visibleModelRange, value);
                    const modelColumn = viewModel.model.getLineFirstNonWhitespaceColumn(modelLineNumber);
                    return [this._moveToModelPosition(viewModel, cursors[0], inSelectionMode, modelLineNumber, modelColumn)];
                }
                case 13 /* CursorMove.Direction.ViewPortBottom */: {
                    // Move to the nth line start in the viewport (from the bottom)
                    const modelLineNumber = this._lastLineNumberInRange(viewModel.model, visibleModelRange, value);
                    const modelColumn = viewModel.model.getLineFirstNonWhitespaceColumn(modelLineNumber);
                    return [this._moveToModelPosition(viewModel, cursors[0], inSelectionMode, modelLineNumber, modelColumn)];
                }
                case 12 /* CursorMove.Direction.ViewPortCenter */: {
                    // Move to the line start in the viewport center
                    const modelLineNumber = Math.round((visibleModelRange.startLineNumber + visibleModelRange.endLineNumber) / 2);
                    const modelColumn = viewModel.model.getLineFirstNonWhitespaceColumn(modelLineNumber);
                    return [this._moveToModelPosition(viewModel, cursors[0], inSelectionMode, modelLineNumber, modelColumn)];
                }
                case 14 /* CursorMove.Direction.ViewPortIfOutside */: {
                    // Move to a position inside the viewport
                    const result = [];
                    for (let i = 0, len = cursors.length; i < len; i++) {
                        const cursor = cursors[i];
                        result[i] = this.findPositionInViewportIfOutside(viewModel, cursor, visibleViewRange, inSelectionMode);
                    }
                    return result;
                }
                default:
                    return null;
            }
        }
        static findPositionInViewportIfOutside(viewModel, cursor, visibleViewRange, inSelectionMode) {
            const viewLineNumber = cursor.viewState.position.lineNumber;
            if (visibleViewRange.startLineNumber <= viewLineNumber && viewLineNumber <= visibleViewRange.endLineNumber - 1) {
                // Nothing to do, cursor is in viewport
                return new cursorCommon_1.CursorState(cursor.modelState, cursor.viewState);
            }
            else {
                let newViewLineNumber;
                if (viewLineNumber > visibleViewRange.endLineNumber - 1) {
                    newViewLineNumber = visibleViewRange.endLineNumber - 1;
                }
                else if (viewLineNumber < visibleViewRange.startLineNumber) {
                    newViewLineNumber = visibleViewRange.startLineNumber;
                }
                else {
                    newViewLineNumber = viewLineNumber;
                }
                const position = cursorMoveOperations_1.MoveOperations.vertical(viewModel.cursorConfig, viewModel, viewLineNumber, cursor.viewState.position.column, cursor.viewState.leftoverVisibleColumns, newViewLineNumber, false);
                return cursorCommon_1.CursorState.fromViewState(cursor.viewState.move(inSelectionMode, position.lineNumber, position.column, position.leftoverVisibleColumns));
            }
        }
        /**
         * Find the nth line start included in the range (from the start).
         */
        static _firstLineNumberInRange(model, range, count) {
            let startLineNumber = range.startLineNumber;
            if (range.startColumn !== model.getLineMinColumn(startLineNumber)) {
                // Move on to the second line if the first line start is not included in the range
                startLineNumber++;
            }
            return Math.min(range.endLineNumber, startLineNumber + count - 1);
        }
        /**
         * Find the nth line start included in the range (from the end).
         */
        static _lastLineNumberInRange(model, range, count) {
            let startLineNumber = range.startLineNumber;
            if (range.startColumn !== model.getLineMinColumn(startLineNumber)) {
                // Move on to the second line if the first line start is not included in the range
                startLineNumber++;
            }
            return Math.max(startLineNumber, range.endLineNumber - count + 1);
        }
        static _moveLeft(viewModel, cursors, inSelectionMode, noOfColumns) {
            return cursors.map(cursor => cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.moveLeft(viewModel.cursorConfig, viewModel, cursor.viewState, inSelectionMode, noOfColumns)));
        }
        static _moveHalfLineLeft(viewModel, cursors, inSelectionMode) {
            const result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                const viewLineNumber = cursor.viewState.position.lineNumber;
                const halfLine = Math.round(viewModel.getLineLength(viewLineNumber) / 2);
                result[i] = cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.moveLeft(viewModel.cursorConfig, viewModel, cursor.viewState, inSelectionMode, halfLine));
            }
            return result;
        }
        static _moveRight(viewModel, cursors, inSelectionMode, noOfColumns) {
            return cursors.map(cursor => cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.moveRight(viewModel.cursorConfig, viewModel, cursor.viewState, inSelectionMode, noOfColumns)));
        }
        static _moveHalfLineRight(viewModel, cursors, inSelectionMode) {
            const result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                const viewLineNumber = cursor.viewState.position.lineNumber;
                const halfLine = Math.round(viewModel.getLineLength(viewLineNumber) / 2);
                result[i] = cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.moveRight(viewModel.cursorConfig, viewModel, cursor.viewState, inSelectionMode, halfLine));
            }
            return result;
        }
        static _moveDownByViewLines(viewModel, cursors, inSelectionMode, linesCount) {
            const result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[i] = cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.moveDown(viewModel.cursorConfig, viewModel, cursor.viewState, inSelectionMode, linesCount));
            }
            return result;
        }
        static _moveDownByModelLines(viewModel, cursors, inSelectionMode, linesCount) {
            const result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[i] = cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.moveDown(viewModel.cursorConfig, viewModel.model, cursor.modelState, inSelectionMode, linesCount));
            }
            return result;
        }
        static _moveUpByViewLines(viewModel, cursors, inSelectionMode, linesCount) {
            const result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[i] = cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.moveUp(viewModel.cursorConfig, viewModel, cursor.viewState, inSelectionMode, linesCount));
            }
            return result;
        }
        static _moveUpByModelLines(viewModel, cursors, inSelectionMode, linesCount) {
            const result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[i] = cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.moveUp(viewModel.cursorConfig, viewModel.model, cursor.modelState, inSelectionMode, linesCount));
            }
            return result;
        }
        static _moveToViewPosition(viewModel, cursor, inSelectionMode, toViewLineNumber, toViewColumn) {
            return cursorCommon_1.CursorState.fromViewState(cursor.viewState.move(inSelectionMode, toViewLineNumber, toViewColumn, 0));
        }
        static _moveToModelPosition(viewModel, cursor, inSelectionMode, toModelLineNumber, toModelColumn) {
            return cursorCommon_1.CursorState.fromModelState(cursor.modelState.move(inSelectionMode, toModelLineNumber, toModelColumn, 0));
        }
        static _moveToViewMinColumn(viewModel, cursors, inSelectionMode) {
            const result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                const viewLineNumber = cursor.viewState.position.lineNumber;
                const viewColumn = viewModel.getLineMinColumn(viewLineNumber);
                result[i] = this._moveToViewPosition(viewModel, cursor, inSelectionMode, viewLineNumber, viewColumn);
            }
            return result;
        }
        static _moveToViewFirstNonWhitespaceColumn(viewModel, cursors, inSelectionMode) {
            const result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                const viewLineNumber = cursor.viewState.position.lineNumber;
                const viewColumn = viewModel.getLineFirstNonWhitespaceColumn(viewLineNumber);
                result[i] = this._moveToViewPosition(viewModel, cursor, inSelectionMode, viewLineNumber, viewColumn);
            }
            return result;
        }
        static _moveToViewCenterColumn(viewModel, cursors, inSelectionMode) {
            const result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                const viewLineNumber = cursor.viewState.position.lineNumber;
                const viewColumn = Math.round((viewModel.getLineMaxColumn(viewLineNumber) + viewModel.getLineMinColumn(viewLineNumber)) / 2);
                result[i] = this._moveToViewPosition(viewModel, cursor, inSelectionMode, viewLineNumber, viewColumn);
            }
            return result;
        }
        static _moveToViewMaxColumn(viewModel, cursors, inSelectionMode) {
            const result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                const viewLineNumber = cursor.viewState.position.lineNumber;
                const viewColumn = viewModel.getLineMaxColumn(viewLineNumber);
                result[i] = this._moveToViewPosition(viewModel, cursor, inSelectionMode, viewLineNumber, viewColumn);
            }
            return result;
        }
        static _moveToViewLastNonWhitespaceColumn(viewModel, cursors, inSelectionMode) {
            const result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                const viewLineNumber = cursor.viewState.position.lineNumber;
                const viewColumn = viewModel.getLineLastNonWhitespaceColumn(viewLineNumber);
                result[i] = this._moveToViewPosition(viewModel, cursor, inSelectionMode, viewLineNumber, viewColumn);
            }
            return result;
        }
    }
    exports.CursorMoveCommands = CursorMoveCommands;
    var CursorMove;
    (function (CursorMove) {
        const isCursorMoveArgs = function (arg) {
            if (!types.isObject(arg)) {
                return false;
            }
            const cursorMoveArg = arg;
            if (!types.isString(cursorMoveArg.to)) {
                return false;
            }
            if (!types.isUndefined(cursorMoveArg.select) && !types.isBoolean(cursorMoveArg.select)) {
                return false;
            }
            if (!types.isUndefined(cursorMoveArg.by) && !types.isString(cursorMoveArg.by)) {
                return false;
            }
            if (!types.isUndefined(cursorMoveArg.value) && !types.isNumber(cursorMoveArg.value)) {
                return false;
            }
            return true;
        };
        CursorMove.metadata = {
            description: 'Move cursor to a logical position in the view',
            args: [
                {
                    name: 'Cursor move argument object',
                    description: `Property-value pairs that can be passed through this argument:
					* 'to': A mandatory logical position value providing where to move the cursor.
						\`\`\`
						'left', 'right', 'up', 'down', 'prevBlankLine', 'nextBlankLine',
						'wrappedLineStart', 'wrappedLineEnd', 'wrappedLineColumnCenter'
						'wrappedLineFirstNonWhitespaceCharacter', 'wrappedLineLastNonWhitespaceCharacter'
						'viewPortTop', 'viewPortCenter', 'viewPortBottom', 'viewPortIfOutside'
						\`\`\`
					* 'by': Unit to move. Default is computed based on 'to' value.
						\`\`\`
						'line', 'wrappedLine', 'character', 'halfLine'
						\`\`\`
					* 'value': Number of units to move. Default is '1'.
					* 'select': If 'true' makes the selection. Default is 'false'.
				`,
                    constraint: isCursorMoveArgs,
                    schema: {
                        'type': 'object',
                        'required': ['to'],
                        'properties': {
                            'to': {
                                'type': 'string',
                                'enum': ['left', 'right', 'up', 'down', 'prevBlankLine', 'nextBlankLine', 'wrappedLineStart', 'wrappedLineEnd', 'wrappedLineColumnCenter', 'wrappedLineFirstNonWhitespaceCharacter', 'wrappedLineLastNonWhitespaceCharacter', 'viewPortTop', 'viewPortCenter', 'viewPortBottom', 'viewPortIfOutside']
                            },
                            'by': {
                                'type': 'string',
                                'enum': ['line', 'wrappedLine', 'character', 'halfLine']
                            },
                            'value': {
                                'type': 'number',
                                'default': 1
                            },
                            'select': {
                                'type': 'boolean',
                                'default': false
                            }
                        }
                    }
                }
            ]
        };
        /**
         * Positions in the view for cursor move command.
         */
        CursorMove.RawDirection = {
            Left: 'left',
            Right: 'right',
            Up: 'up',
            Down: 'down',
            PrevBlankLine: 'prevBlankLine',
            NextBlankLine: 'nextBlankLine',
            WrappedLineStart: 'wrappedLineStart',
            WrappedLineFirstNonWhitespaceCharacter: 'wrappedLineFirstNonWhitespaceCharacter',
            WrappedLineColumnCenter: 'wrappedLineColumnCenter',
            WrappedLineEnd: 'wrappedLineEnd',
            WrappedLineLastNonWhitespaceCharacter: 'wrappedLineLastNonWhitespaceCharacter',
            ViewPortTop: 'viewPortTop',
            ViewPortCenter: 'viewPortCenter',
            ViewPortBottom: 'viewPortBottom',
            ViewPortIfOutside: 'viewPortIfOutside'
        };
        /**
         * Units for Cursor move 'by' argument
         */
        CursorMove.RawUnit = {
            Line: 'line',
            WrappedLine: 'wrappedLine',
            Character: 'character',
            HalfLine: 'halfLine'
        };
        function parse(args) {
            if (!args.to) {
                // illegal arguments
                return null;
            }
            let direction;
            switch (args.to) {
                case CursorMove.RawDirection.Left:
                    direction = 0 /* Direction.Left */;
                    break;
                case CursorMove.RawDirection.Right:
                    direction = 1 /* Direction.Right */;
                    break;
                case CursorMove.RawDirection.Up:
                    direction = 2 /* Direction.Up */;
                    break;
                case CursorMove.RawDirection.Down:
                    direction = 3 /* Direction.Down */;
                    break;
                case CursorMove.RawDirection.PrevBlankLine:
                    direction = 4 /* Direction.PrevBlankLine */;
                    break;
                case CursorMove.RawDirection.NextBlankLine:
                    direction = 5 /* Direction.NextBlankLine */;
                    break;
                case CursorMove.RawDirection.WrappedLineStart:
                    direction = 6 /* Direction.WrappedLineStart */;
                    break;
                case CursorMove.RawDirection.WrappedLineFirstNonWhitespaceCharacter:
                    direction = 7 /* Direction.WrappedLineFirstNonWhitespaceCharacter */;
                    break;
                case CursorMove.RawDirection.WrappedLineColumnCenter:
                    direction = 8 /* Direction.WrappedLineColumnCenter */;
                    break;
                case CursorMove.RawDirection.WrappedLineEnd:
                    direction = 9 /* Direction.WrappedLineEnd */;
                    break;
                case CursorMove.RawDirection.WrappedLineLastNonWhitespaceCharacter:
                    direction = 10 /* Direction.WrappedLineLastNonWhitespaceCharacter */;
                    break;
                case CursorMove.RawDirection.ViewPortTop:
                    direction = 11 /* Direction.ViewPortTop */;
                    break;
                case CursorMove.RawDirection.ViewPortBottom:
                    direction = 13 /* Direction.ViewPortBottom */;
                    break;
                case CursorMove.RawDirection.ViewPortCenter:
                    direction = 12 /* Direction.ViewPortCenter */;
                    break;
                case CursorMove.RawDirection.ViewPortIfOutside:
                    direction = 14 /* Direction.ViewPortIfOutside */;
                    break;
                default:
                    // illegal arguments
                    return null;
            }
            let unit = 0 /* Unit.None */;
            switch (args.by) {
                case CursorMove.RawUnit.Line:
                    unit = 1 /* Unit.Line */;
                    break;
                case CursorMove.RawUnit.WrappedLine:
                    unit = 2 /* Unit.WrappedLine */;
                    break;
                case CursorMove.RawUnit.Character:
                    unit = 3 /* Unit.Character */;
                    break;
                case CursorMove.RawUnit.HalfLine:
                    unit = 4 /* Unit.HalfLine */;
                    break;
            }
            return {
                direction: direction,
                unit: unit,
                select: (!!args.select),
                value: (args.value || 1)
            };
        }
        CursorMove.parse = parse;
        let Direction;
        (function (Direction) {
            Direction[Direction["Left"] = 0] = "Left";
            Direction[Direction["Right"] = 1] = "Right";
            Direction[Direction["Up"] = 2] = "Up";
            Direction[Direction["Down"] = 3] = "Down";
            Direction[Direction["PrevBlankLine"] = 4] = "PrevBlankLine";
            Direction[Direction["NextBlankLine"] = 5] = "NextBlankLine";
            Direction[Direction["WrappedLineStart"] = 6] = "WrappedLineStart";
            Direction[Direction["WrappedLineFirstNonWhitespaceCharacter"] = 7] = "WrappedLineFirstNonWhitespaceCharacter";
            Direction[Direction["WrappedLineColumnCenter"] = 8] = "WrappedLineColumnCenter";
            Direction[Direction["WrappedLineEnd"] = 9] = "WrappedLineEnd";
            Direction[Direction["WrappedLineLastNonWhitespaceCharacter"] = 10] = "WrappedLineLastNonWhitespaceCharacter";
            Direction[Direction["ViewPortTop"] = 11] = "ViewPortTop";
            Direction[Direction["ViewPortCenter"] = 12] = "ViewPortCenter";
            Direction[Direction["ViewPortBottom"] = 13] = "ViewPortBottom";
            Direction[Direction["ViewPortIfOutside"] = 14] = "ViewPortIfOutside";
        })(Direction = CursorMove.Direction || (CursorMove.Direction = {}));
        let Unit;
        (function (Unit) {
            Unit[Unit["None"] = 0] = "None";
            Unit[Unit["Line"] = 1] = "Line";
            Unit[Unit["WrappedLine"] = 2] = "WrappedLine";
            Unit[Unit["Character"] = 3] = "Character";
            Unit[Unit["HalfLine"] = 4] = "HalfLine";
        })(Unit = CursorMove.Unit || (CursorMove.Unit = {}));
    })(CursorMove || (exports.CursorMove = CursorMove = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yTW92ZUNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2N1cnNvci9jdXJzb3JNb3ZlQ29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLE1BQWEsa0JBQWtCO1FBRXZCLE1BQU0sQ0FBQyxhQUFhLENBQUMsU0FBcUIsRUFBRSxPQUFzQixFQUFFLGNBQXVCO1lBQ2pHLE1BQU0sTUFBTSxHQUF5QixFQUFFLENBQUM7WUFDeEMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDcEQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsR0FBRyxJQUFJLDBCQUFXLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzNFLElBQUksY0FBYyxFQUFFLENBQUM7b0JBQ3BCLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLDBCQUFXLENBQUMsY0FBYyxDQUFDLHFDQUFjLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDNUksQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLDBCQUFXLENBQUMsYUFBYSxDQUFDLHFDQUFjLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUs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